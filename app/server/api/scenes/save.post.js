import { normalizeAndValidateSceneDocument } from '~/scene/sceneValidation.js'
import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'
import { requireAuthenticatedAppUser, requireWorkspaceAccess } from '../../utils/workspaceAccess.js'

const SCENES_TABLE = 'app_scenes'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const sceneDocument = body?.sceneDocument
  const sceneId = typeof body?.sceneId === 'string' && body.sceneId.length ? body.sceneId : null
  const workspaceId = typeof body?.workspaceId === 'string' && body.workspaceId.length
    ? body.workspaceId
    : null

  const normalized = normalizeAndValidateSceneDocument(sceneDocument)

  if (!normalized.isValid || !normalized.sceneDocument) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validatie van het scènedocument is mislukt.',
      data: {
        errors: normalized.errors,
        warnings: normalized.warnings
      }
    })
  }

  const supabase = createSupabaseServerClient()
  const { actorId, actor } = await requireAuthenticatedAppUser(event, supabase)
  await requireWorkspaceAccess({
    supabase,
    workspaceId,
    actorId,
    actorUserType: actor.user_type
  })

  if (sceneId) {
    const { data: existingScene, error: existingSceneError } = await supabase
      .from(SCENES_TABLE)
      .select('id, workspace_id')
      .eq('id', sceneId)
      .maybeSingle()

    if (existingSceneError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Bestaande scène kon niet worden gecontroleerd.',
        data: {
          supabaseError: existingSceneError.message
        }
      })
    }

    if (existingScene && existingScene.workspace_id !== workspaceId) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Deze scène hoort bij een andere werkruimte.'
      })
    }
  }

  const now = new Date().toISOString()

  const row = {
    id: sceneId || normalized.sceneDocument.id || undefined,
    workspace_id: workspaceId,
    name: normalized.sceneDocument.name,
    schema_version: normalized.sceneDocument.schemaVersion,
    scene_data: normalized.sceneDocument,
    updated_at: now
  }

  const { data, error } = await supabase
    .from(SCENES_TABLE)
    .upsert(row, { onConflict: 'id' })
    .select('id, workspace_id, name, schema_version, scene_data, created_at, updated_at')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Opslaan van de scène in Supabase (${SCENES_TABLE}) is mislukt.`,
      data: {
        supabaseError: error.message
      }
    })
  }

  return {
    ok: true,
    scene: data,
    diagnostics: {
      warnings: normalized.warnings
    }
  }
})
