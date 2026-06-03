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

[] fly through scene
[] add photos
[] add videos
[] burn candle
[] leave message
[] toggle music
[] leave voice message
[x] hide ui
[] pin protection
[] media object activation flow
    [] On click/tap media object, center camera on object (focus transition)
    [] Open shared media carousel by object type (all messages OR all images+videos OR all audio)
    [] Image/video cards always show poster name
    [] Message cards render white paper panel with sender at bottom
    [] Audio cards show poster + play button
    [] Carousel navigation: swipe, drag, arrows, keyboard arrow keys
    [] Close carousel with top-right X and click-outside
    [] Fade scene background behind overlay

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
[] share room
    [x] generate vallid url
    [x] generate QR
    [x] copy link
    [x] download QR as image
    [x] remove email share option
[x] room states 
    [x] public
    [x] private
    [x] offline
[x] start room
[] mail invites
    [x] groundwork
    [x] fails on non existent acc
    [] test
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

[] add clicky noises to editor
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


## audit

**Highest Priority Blockers**
No open blockers remain from this earlier audit snapshot.

**Core Product Gaps**
1. Share URL flow needs product-level completion.
Room detail currently computes a share URL in [app/app/pages/dashboard/ruimte/[id].vue](app/app/pages/dashboard/ruimte/%5Bid%5D.vue), but viewer-side public experience and proper canonical routing are still incomplete.

**Editor-Specific Gaps**
1. Special media objects are still missing (as you noted).
Media type groundwork exists, but full viewer media-object UX and contribution rendering pipeline are still incomplete (image/video/message/audio carousels and interactions).

2. Publish-ready scene model still needs definition.
You need a clear published-scene pointer/version strategy between editor saves and what viewer reads.

**Dashboard/Moderation Gaps**
1. Moderation is read-side only right now.
You now show pending/activity from posts, but no moderation action endpoints/UI (approve/reject/archive) are wired yet.
Relevant read path: [app/server/api/workspaces/[id].get.js](app/server/api/workspaces/%5Bid%5D.get.js)

2. Invite flow remains “existing users only”.
Current invite model is direct-add + notify; no token acceptance flow for non-registered invitees yet.

---

**Recommended Grand-Line Order**
1. Security pass first: lock all workspace server APIs to token + workspace membership (same pattern as scene APIs).
2. Room creation pass: make new-room fully functional (POST API + DB insert + redirect into dashboard/editor).
3. Viewer MVP pass: render published room by slug, show scene + published posts/media, handle private/public access.
4. Publish pipeline pass: editor publish action, published scene pointer, dashboard publish state, viewer consumes published state.
5. Editor completion pass: media objects + room settings access from editor.
6. Moderation action pass: approve/reject/archive endpoints and UI controls.
7. Hardening pass: e2e flows (signup -> create room -> edit -> publish -> view), plus edge-case handling.

You are already far along on auth/dashboard/editor persistence foundations. The biggest remaining work is now product loop completion: create -> edit -> publish -> view, plus server-side permission hardening on workspace APIs.