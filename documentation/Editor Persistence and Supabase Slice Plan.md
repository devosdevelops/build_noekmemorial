# Editor Persistence and Supabase Slice Plan

Goal: deliver one evaluator-ready vertical slice.

- [x] Vertical slice works end-to-end: edit scene (floors + shapes) -> save to Supabase -> load from Supabase -> scene restores correctly.
- [x] Keep runtime scope tight: no model runtime tools, no light/audio runtime tools, no CMS in this slice.

## Phase 1 - Lock Scene Contract V1

- [x] Finalize top-level scene fields: id, name, schema_version, objects, optional editor_settings, timestamps.
- [x] Finalize base object fields: id, kind, transform, appearance, optional metadata.
- [x] Lock allowed kinds for V1: floor, shape, model (reserved), light (reserved), audio (reserved).
- [x] Lock transform shape and defaults.
- [x] Lock required vs optional fields for each kind.
- [x] Add forward compatibility rule: unknown kinds must not crash load.

Definition of done (Phase 1):
- [x] Contract can be explained in under 2 minutes.
- [x] No unresolved naming or field-shape decisions remain.

## Phase 2 - Appearance Rules and Validation Matrix

- [x] Add appearance.color for all kinds (floor, shape, model, future kinds if needed).
- [x] Add appearance.texture for floor and shape only.
- [x] Reserve model material override structure for future (no runtime support required now).
- [x] Define kind-aware validation rules (blocking vs non-blocking).
- [x] Define normalization defaults for missing optional fields.
- [x] Define behavior for unsupported fields (ignore safely, do not crash).

Definition of done (Phase 2):
- [x] One clear validation matrix exists per kind.
- [x] Invalid scenes are blocked from save.
- [x] Future/unknown fields do not break load.

## Phase 3 - Editor Persistence Readiness

- [x] Confirm single source of truth for scene state.
- [x] Define serializer mapping: state -> Scene V1 document.
- [x] Define hydrator mapping: Scene V1 document -> editor state.
- [x] Add dirty-state tracking.
- [x] Add persistence UI state machine: idle, saving, saved, loading, error.
- [x] Verify local roundtrip behavior for floors/shapes before backend wiring.

Definition of done (Phase 3):
- [x] Roundtrip does not lose transform or appearance data for floors/shapes.
- [x] Unknown reserved kinds are ignored safely during hydration.

## Phase 4 - Supabase First Slice

- [x] Create scenes table with: id, name, schema_version, scene_data (jsonb), created_at, updated_at.
- [x] Add optional owner/workspace field (nullable is fine for now).
- [x] Add minimum indexing needed for retrieval.
- [x] Add minimum policies required to demo save/load flow.
- [x] Insert at least one seed scene row manually (or via app save as seed evidence).
- [x] Prepare SQL migration file for Supabase table and policies.

Definition of done (Phase 4):
- [x] Scene documents are persisted in scene_data.
- [x] A saved row can be fetched and inspected.

## Phase 5 - Connect Save and Load

- [x] Implement save flow: validate -> normalize -> serialize -> persist -> update status.
- [x] Implement load flow: fetch -> schema check -> hydrate -> render -> update status.
- [x] Handle errors: network failure, invalid payload, unsupported version.
- [x] Verify scene fidelity after reload (positions, rotations, scales, appearance fields).

Definition of done (Phase 5):
- [x] Save then reload restores scene correctly for floors and shapes.
- [x] UI exposes success/error status clearly.

## Final Acceptance Checklist

- [x] Floors + shapes persistence is working end-to-end.
- [x] Scene contract is versioned and future-ready.
- [x] Color and texture are represented in saved data according to rules.
- [x] Models/light/audio are intentionally deferred in runtime but reserved in schema.
