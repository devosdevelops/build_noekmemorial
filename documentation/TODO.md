# TODO

[x] split codebase into the 3 products
[x] add mobile error screen
[x] loading screen for data and editor

## Editor

[x] delete object
[x] recolor object
[x] refactor ui to match figma design
    [x] refactor ui to stick to sides
    [x] reposition config ui to center
    [x] add logo
    [x] add icons
    [x] add hinting for toolbar
    [x] replace close buttons with x's and info icons 
[x] load screen and load holder for when models are loading
[x] search bar for models
[x] add textures
[x] add textures to floors
[x] add textures to blocks
[x] add texture size to 
    [x] blocks  
    [x] floor
[x] add colors to models
[x] add missing textures
[x] load models with loader wheel
[x] add favicon
[x] add ambient noise options
    [x] add sound files
    [x] sound ui
    [x] add sounds to scene
[x] add lighting options
[x] hide grid
[x] add animation to anything that opens or closes
[x] generate SQL files
[x] add other tables to supabase
[x] connect editors to accounts
[] load screen when loading page
[x] dashboard integration
[x] 1. Deploy memorial space (publish flow)
    [x] Add publish action to editor top bar
    [x] Wire EditorSpace.vue publish handler to POST /api/workspaces/:id/publish
    [x] Update workspace visibility to public|private on first publish (prompt modal)
    [x] Set published_at timestamp in DB
[x] 2. First deployment visibility prompt
    [x] Create PublishModal.vue in components/editor/
    [x] Enforce public/private selection before allowing publish
    [x] Store selection in workspace.visibility
    [x] Handle existing offline->public transitions
    [x] make sure you have to set pin when trying to publish as private
[] 3. Special media objects (pinboard, audio, books)
    [x] Create MediaObject model types in sceneContract.js
    [] Pinboard/Photo: accepts image/video drops, displays as wall-mounted frame
    [] Audio device: voice message recorder/playback, visual speaker UI
    [] Book/Paper: text message storage, journal-like appearance
    [] Add to model library with minimal geometry (mostly UI overlay)
    [x] Media objects are type triggers only (message / image-video / audio), no object-to-specific-media link
    [x] Ensure editor stores only media object type, not any per-object media mapping
[] 4. Candle glow effect
    [] Review current candle models (likely in public/models/ or textures/)
    [] Add emissive material layer to wick mesh
    [] Implement point light that follows wick position
    [] Add flickering animation via THREE.js Light.intensity oscillation
    [] Consider bloom post-processing for glow visibility
[] 5. Template save/load system
    [] Create template versioning (v1 save in localStorage + supabase)
    [] Add "Save as Template" button in editor (exports sceneState)
    [] Add "Load Template" modal with thumbnail preview
    [] Store: scene objects, lighting, audio config, floor/wall textures

## Viewer

[x] fly through scene
[x] add photos
[x] add videos
[] burn candle
    [x] open left candle menu from viewer action
    [x] select candle model in panel
    [x] load selected candle from Poly Pizza candle list (real model URL)
    [x] place candle on random unoccupied spot with preference near other objects
    [x] allow placement on top of existing objects when available
    [x] camera zoom/focus on placed candle
    [x] candle emits glow light + flicker (burning logic)
    [] final visual/model polish pass with expected candle art direction
[x] leave message
[] toggle music
[x] leave voice message
[x] hide ui
[x] pin protection
[] media object activation flow
    [] On click/tap media object, center camera on object (focus transition)
    [] Open shared media carousel by object type (all messages OR all images+videos OR all audio)
    [] Image/video cards always show poster name
    [] Message cards render white paper panel with sender at bottom
    [] Audio cards show poster + play button
    [] Carousel navigation: swipe, drag, arrows, keyboard arrow keys
    [] Close carousel with top-right X and click-outside
    [] Fade scene background behind overlay
    [x] MVP interim: show filtered recent contributions in element detail panel

## Dashboard

[x] main ui
[x] manage workspace ui
[x] new room ui
[x] create account ui
[x] login ui
[x] create account
[x] login
[x] add workspace
[x] user settings
[x] share room
    [x] generate valid url
    [x] generate QR
    [x] copy link
    [x] download QR as image
    [x] remove email share option
[x] room states 
    [x] public
    [x] private
    [x] offline
[x] start room
[x] mail invites
    [x] groundwork
    [x] fails on non existent acc
    [x] test
[x] fake buying more spaces with a money preview of up front cost + yearly maintanance
    [x] buy button if all slots are filled
    [x] create button if there is a free slot
    [x] click buy more button
    [x] see overview of price 
    [x] confirm purchase
    [x] number of room slots goes up
[] manage rooms
[] manage collaborators
[x] memorial settings
[x] split up your owned spaces and spaces you are a collaborator on.
[] remove delete powers

### CMS

[] edit branding

## Fixes

### Editor

[x] Auto deselect any other object
[x] change texture names
[x] change selected mode because current glow hides the color
[x] add new floors not just change the texture of the one existing  floor
[x] make sure models are saved to the supabase 
[x] block preview in 3D instead of flat shapes
[x] translate to dutch
[x] Resize and move snapping not consistent
    [x] square object
    [x] intermediate sizes
    [x] rect object
[x] click a selected object to deselect it
[x] load latest state on editor open
[] standardize height of pannel left toolbar
[] configure underfloor in settings instead
[] color textures better
[] round the scroll bar containers

## Nice to have

### Editor

[x] add clicky noises to editor
[] mirror tool
[] scale smoothly instead of snapping
[] add color picker
[] scale object from menu
[] save colors / recently used colors
[] swap betwen hex and RGB
[] add more textures
[] add more models
[] translation of models
[] add shortcuts to editor
[] upload your own ambient sound

### Viewer

[] VR Mode
[] add sound effects to viewer


## audit (2026-06-03)

### shipped in this pass

- viewer now renders persisted scene JSON instead of only placeholder memorial meshes
- viewer entry supports private room pin prompt + gated room access
- voice message submission now works in MVP form (voice URL or text)
- dashboard share URL now points to active viewer route (`/viewer/[slug]`) and QR follows same URL
- element detail panel now shows recent filtered contributions as interim media activation UX
- candle flow now supports model selection + auto placement + camera focus, pending final visual/model validation

### current p0 blockers

1. viewer model fidelity is still placeholder geometry for many saved model objects (not yet loading real glb assets in viewer runtime).
2. viewer reads latest scene row, not an explicit published-scene pointer/version; draft edits can leak into public view.
3. media activation flow is still interim (list panel), not full carousel/overlay interaction spec.

### current p1 gaps

1. moderation is read-side only (no approve/reject/archive action endpoints + UI actions yet).
2. invite flow is still existing-users-only (no token acceptance flow for users without account).
3. vr mode is only a UI mode label and not yet backed by webxr runtime.

### next 3h order (mvp closeout)

1. load real model assets in viewer for `kind: model` scene objects.
2. add published scene pointer/version contract and wire viewer to published version only.
3. upgrade element interaction list to proper media carousel overlay (message/image-video/audio variants).
4. run full smoke flow: signup/login -> create room -> edit -> publish -> open shared URL -> guest message/candle -> auth media.