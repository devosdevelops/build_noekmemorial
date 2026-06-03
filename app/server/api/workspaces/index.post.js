import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'
import { requireAuthenticatedAppUser } from '../../utils/workspaceAccess.js'
import { normalizeAndValidateSceneDocument } from '~/scene/sceneValidation.js'

const TEMPLATES_TABLE = 'app_scene_templates'
const SCENES_TABLE = 'app_scenes'

function buildFallbackSceneDocument(name) {
  const now = new Date().toISOString()

  return {
    id: null,
    name,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    editorSettings: {
      grid: {
        cellSize: 1,
        groundSize: 24,
        origin: [0, 0, 0]
      },
      lighting: {
        presetId: 'bright-warm'
      }
    },
    objects: [
      {
        id: 'floor-main',
        kind: 'floor',
        assetRef: 'floor-base',
        transform: {
          position: [0, -0.07, 0],
          rotation: [0, 0, 0],
          scale: [20, 1, 20]
        },
        appearance: {
          color: '#7a8fa0',
          texture: null,
          materialOverrides: null,
          finish: {
            roughness: 0.56,
            metalness: 0.03
          }
        },
        metadata: null,
        interaction: null
      }
    ]
  }
}

function slugifyName(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function createUniqueWorkspaceSlug(supabase, name) {
  const base = slugifyName(name) || 'herdenkingsruimte'

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = attempt === 0
      ? base
      : `${base}-${Math.random().toString(36).slice(2, 6)}`

    const { data, error } = await supabase
      .from('app_workspaces')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Kon geen unieke slug genereren.',
        data: {
          supabaseError: error.message
        }
      })
    }

    if (!data) {
      return candidate
    }
  }

  return `${base}-${Date.now().toString(36)}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const deceasedFirstName = typeof body?.deceasedFirstName === 'string' ? body.deceasedFirstName.trim() : ''
  const deceasedLastName = typeof body?.deceasedLastName === 'string' ? body.deceasedLastName.trim() : ''
  const templateId = Number.isInteger(body?.templateId)
    ? body.templateId
    : Number.parseInt(body?.templateId || '', 10)
  const visibility = 'offline'
  const approvalMode = body?.approvalMode === 'automatic' ? 'automatic' : 'manual'

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Naam van ruimte is verplicht.'
    })
  }

  const supabase = createSupabaseServerClient()
  const { actorId } = await requireAuthenticatedAppUser(event, supabase)

  let template = null
  let normalizedTemplateScene = null
  let usedFallbackTemplate = false

  if (Number.isInteger(templateId) && templateId >= 0) {
    const { data: selectedTemplate, error: templateError } = await supabase
      .from(TEMPLATES_TABLE)
      .select('id, template_key, name, schema_version, scene_data, is_active')
      .eq('id', templateId)
      .eq('is_active', true)
      .maybeSingle()

    if (!templateError && selectedTemplate) {
      const sceneSeedSource = selectedTemplate.scene_data && typeof selectedTemplate.scene_data === 'object'
        ? JSON.parse(JSON.stringify(selectedTemplate.scene_data))
        : null

      const sceneSeedDraft = {
        ...(sceneSeedSource || {}),
        id: null,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const normalized = normalizeAndValidateSceneDocument(sceneSeedDraft)

      if (normalized.isValid && normalized.sceneDocument) {
        template = selectedTemplate
        normalizedTemplateScene = normalized
      }
    }
  }

  if (!normalizedTemplateScene?.sceneDocument) {
    usedFallbackTemplate = true
    normalizedTemplateScene = normalizeAndValidateSceneDocument(buildFallbackSceneDocument(name))

    if (!normalizedTemplateScene.isValid || !normalizedTemplateScene.sceneDocument) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Lege fallback-template kon niet worden opgebouwd.',
        data: {
          errors: normalizedTemplateScene.errors,
          warnings: normalizedTemplateScene.warnings
        }
      })
    }
  }

  const slug = await createUniqueWorkspaceSlug(supabase, name)

  const { data: workspace, error } = await supabase
    .from('app_workspaces')
    .insert({
      name,
      slug,
      owner_id: actorId,
      deceased_first_name: deceasedFirstName || null,
      deceased_last_name: deceasedLastName || null,
      visibility,
      approval_mode: approvalMode,
      access_pin: null
    })
    .select('id, name, slug, owner_id, deceased_first_name, deceased_last_name, visibility, approval_mode, access_pin, published_at, created_at, updated_at')
    .single()

  if (error || !workspace) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Aanmaken van werkruimte is mislukt.',
      data: {
        supabaseError: error?.message
      }
    })
  }

  const { error: sceneInsertError } = await supabase
    .from(SCENES_TABLE)
    .insert({
      workspace_id: workspace.id,
      owner_id: actorId,
      name,
      schema_version: normalizedTemplateScene.sceneDocument.schemaVersion,
      scene_data: normalizedTemplateScene.sceneDocument
    })

  if (sceneInsertError) {
    await supabase
      .from('app_workspaces')
      .delete()
      .eq('id', workspace.id)

    throw createError({
      statusCode: 500,
      statusMessage: 'Werkruimte aangemaakt, maar template-scène kon niet worden gestart.',
      data: {
        supabaseError: sceneInsertError.message
      }
    })
  }

  return {
    ok: true,
    workspace,
    template: template
      ? {
          id: template.id,
          templateKey: template.template_key,
          name: template.name
        }
      : {
          id: null,
          templateKey: 'fallback-empty',
          name: 'Fallback Empty'
        },
    usedFallbackTemplate
  }
})
