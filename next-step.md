# Next Step Implementation Plan

Goal: deliver one evaluator-ready vertical slice.

- [ ] Vertical slice works end-to-end: edit scene (floors + shapes) -> save to Supabase -> load from Supabase -> scene restores correctly.
- [ ] Keep runtime scope tight: no model runtime tools, no light/audio runtime tools, no CMS in this slice.

## Phase 1 - Lock Scene Contract V1

- [ ] Finalize top-level scene fields: id, name, schema_version, objects, optional editor_settings, timestamps.
- [ ] Finalize base object fields: id, kind, transform, appearance, optional metadata.
- [ ] Lock allowed kinds for V1: floor, shape, model (reserved), light (reserved), audio (reserved).
- [ ] Lock transform shape and defaults.
- [ ] Lock required vs optional fields for each kind.
- [ ] Add forward compatibility rule: unknown kinds must not crash load.

Definition of done (Phase 1):
- [ ] Contract can be explained in under 2 minutes.
- [ ] No unresolved naming or field-shape decisions remain.

## Phase 2 - Appearance Rules and Validation Matrix

- [ ] Add appearance.color for all kinds (floor, shape, model, future kinds if needed).
- [ ] Add appearance.texture for floor and shape only.
- [ ] Reserve model material override structure for future (no runtime support required now).
- [ ] Define kind-aware validation rules (blocking vs non-blocking).
- [ ] Define normalization defaults for missing optional fields.
- [ ] Define behavior for unsupported fields (ignore safely, do not crash).

Definition of done (Phase 2):
- [ ] One clear validation matrix exists per kind.
- [ ] Invalid scenes are blocked from save.
- [ ] Future/unknown fields do not break load.

## Phase 3 - Editor Persistence Readiness

- [ ] Confirm single source of truth for scene state.
- [ ] Define serializer mapping: state -> Scene V1 document.
- [ ] Define hydrator mapping: Scene V1 document -> editor state.
- [ ] Add dirty-state tracking.
- [ ] Add persistence UI state machine: idle, saving, saved, loading, error.
- [ ] Verify local roundtrip behavior for floors/shapes before backend wiring.

Definition of done (Phase 3):
- [ ] Roundtrip does not lose transform or appearance data for floors/shapes.
- [ ] Unknown reserved kinds are ignored safely during hydration.

## Phase 4 - Supabase First Slice

- [ ] Create scenes table with: id, name, schema_version, scene_data (jsonb), created_at, updated_at.
- [ ] Add optional owner/workspace field (nullable is fine for now).
- [ ] Add minimum indexing needed for retrieval.
- [ ] Add minimum policies required to demo save/load flow.
- [ ] Insert at least one seed scene row manually.

Definition of done (Phase 4):
- [ ] Scene documents are persisted in scene_data.
- [ ] A saved row can be fetched and inspected.

## Phase 5 - Connect Save and Load

- [ ] Implement save flow: validate -> normalize -> serialize -> persist -> update status.
- [ ] Implement load flow: fetch -> schema check -> hydrate -> render -> update status.
- [ ] Handle errors: network failure, invalid payload, unsupported version.
- [ ] Verify scene fidelity after reload (positions, rotations, scales, appearance fields).

Definition of done (Phase 5):
- [ ] Save then reload restores scene correctly for floors and shapes.
- [ ] UI exposes success/error status clearly.

## Phase 6 - Evaluation Pack

- [ ] Prepare a 3-minute demo script.
- [ ] Prepare architecture summary: scene document is source of truth; renderer projects state.
- [ ] Prepare known limits list: models/light/audio reserved in schema, runtime pending; CMS deferred.
- [ ] Prepare next milestone statement after evaluation.

Definition of done (Phase 6):
- [ ] Demo is stable and repeatable.
- [ ] Scope choices are clearly intentional.

## Final Acceptance Checklist

- [ ] Floors + shapes persistence is working end-to-end.
- [ ] Scene contract is versioned and future-ready.
- [ ] Color and texture are represented in saved data according to rules.
- [ ] Models/light/audio are intentionally deferred in runtime but reserved in schema.
- [ ] Slice is ready to present in evaluation.
