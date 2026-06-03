import { normalizeAndValidateSceneDocument } from '~/scene/sceneValidation.js'
import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'
import { requireAuthenticatedAppUser } from '../../utils/workspaceAccess.js'

const TEMPLATES_TABLE = 'app_scene_templates'

function slugifyTemplateKey(value) {
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

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const description = typeof body?.description === 'string' ? body.description.trim() : ''
  const thumbnailUrl = typeof body?.thumbnailUrl === 'string' ? body.thumbnailUrl.trim() : ''
  const explicitKey = typeof body?.templateKey === 'string' ? body.templateKey.trim() : ''
  const sceneDocument = body?.sceneDocument

  if (!name.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Template-naam is verplicht.'
    })
  }

  const normalized = normalizeAndValidateSceneDocument(sceneDocument)

  if (!normalized.isValid || !normalized.sceneDocument) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validatie van het template-scènedocument is mislukt.',
      data: {
        errors: normalized.errors,
        warnings: normalized.warnings
      }
    })
  }

  const supabase = createSupabaseServerClient()
  const { actorId, actor } = await requireAuthenticatedAppUser(event, supabase)

  if (actor.user_type !== 'consultant') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Alleen consultants kunnen templates beheren.'
    })
  }

  const baseKey = slugifyTemplateKey(explicitKey || name) || `template-${Date.now().toString(36)}`
  let templateKey = baseKey

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = attempt === 0 ? baseKey : `${baseKey}-${attempt + 1}`

    const { data: existing, error: existingError } = await supabase
      .from(TEMPLATES_TABLE)
      .select('id')
      .eq('template_key', candidate)
      .maybeSingle()

    if (existingError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Unieke template sleutel controleren is mislukt.',
        data: {
          supabaseError: existingError.message
        }
      })
    }

    if (!existing) {
      templateKey = candidate
      break
    }
  }

  const { data, error } = await supabase
    .from(TEMPLATES_TABLE)
    .insert({
      template_key: templateKey,
      name,
      description: description || null,
      schema_version: normalized.sceneDocument.schemaVersion,
      scene_data: normalized.sceneDocument,
      thumbnail_url: thumbnailUrl || null,
      created_by: actorId,
      is_active: true
    })
    .select('id, template_key, name, description, schema_version, thumbnail_url, sort_order, is_active, created_at, updated_at')
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Template opslaan is mislukt.',
      data: {
        supabaseError: error?.message
      }
    })
  }

  return {
    ok: true,
    template: data,
    diagnostics: {
      warnings: normalized.warnings
    }
  }
})