import { normalizeAndValidateSceneDocument } from '~/scene/sceneValidation.js'
import { createSupabaseServerClient } from '../../utils/supabaseServerClient.js'

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
