# Viewer App Plan

Goal: deliver a public-facing Three.js viewer app where visitors explore freely, interact with scene elements, and leave memorial contributions with minimal UI on mobile and desktop.

## 0) Live Execution Tracker

- [x] Create viewer implementation plan document with full requested scope.
- [x] Add checklist tracking to this plan document.
- [x] Build Phase 1 foundations.
- [x] Build Phase 2 scene runtime.
- [x] Build Phase 3 contribution MVP.
- [ ] Build Phase 4 VR + hardening.
- [ ] Final validation against acceptance checklist.

## 1) Product Intent

- Viewer is exploration-first, not editing-first.
- Works on both mobile and desktop from first release.
- UI is intentionally minimal.
- Visitors can interact with scene elements and leave contributions.
- Entry gate always appears before entering a memorial room:
  - Log in
  - Create account
  - Continue as guest
- Guests must choose a display name before entering.
- Permission rule:
  - Logged-in users: can post media, leave message, light candle.
  - Guests: can leave message, light candle, cannot post media.

## 2) Core Feature List (Requested Scope)

- Free camera exploration of deployed scene.
- Interaction mode for scene elements (tap/click to inspect/interact).
- Leave behind media contributions.
- Leave behind text/voice messages.
- Light candles.
- Minimal fixed controls:
  - Bottom buttons: `+` (add), `message`, `candle`
  - Right toggles: `Hide UI`, `Look Around / Flythrough / VR`
  - Top left: company logo
  - Top right: current user state (account or guest), guest display name editing
- Left-aligned sliding panel for all contribution workflows.

## 3) Roles and Permissions

| Capability | Guest | Authenticated User |
|---|---|---|
| Enter room | Yes (name required) | Yes |
| Edit guest display name | Yes | N/A |
| Leave text message | Yes | Yes |
| Leave voice message | Yes | Yes |
| Light candle | Yes | Yes |
| Upload media (image/video/audio file) | No | Yes |
| Attach media to scene anchor | No | Yes |

## 4) Screens and Windows to Build

### A. Entry Gate Screen (Before Scene)

Purpose: enforce login/signup/guest choice before entering room.

Required blocks:
- Room identity summary (room name, deceased name, optional hero image).
- Choice cards/buttons:
  - `Log in`
  - `Create account`
  - `Continue as guest`
- Guest form (shown on guest path):
  - Display name input (required)
  - Continue button
- Optional private-room PIN prompt (if room visibility is private).

States:
- Loading room by slug
- Room not found
- Access denied/private PIN invalid
- Auth loading

### B. Viewer Scene Screen (Main)

Purpose: immersive room exploration with minimal overlays.

Fixed regions:
- Top-left: company logo button.
- Top-right: user badge/menu
  - Logged-in: account name/email + sign out
  - Guest: guest badge + edit display name action
- Bottom action dock:
  - `+` Add contribution
  - `Message`
  - `Candle`
- Right control rail:
  - Hide/show UI
  - Mode switch: Look Around, Flythrough, VR

Canvas behavior:
- Touch and mouse controls supported.
- Mode-specific input mapping.
- Tap/click scene elements to open interaction context.

### C. Left Slide Panel (Contribution and Interaction Window)

Single reusable panel container aligned left, swaps content by action.

Panel variants:
1. Add Contribution panel (opened from `+`)
- If authenticated:
  - Choose type: image, video, audio/media item
  - Upload/select media
  - Optional title/caption
  - Choose anchor (selected scene element or current position)
  - Submit
- If guest:
  - Show permission notice: media requires login
  - CTA to login/signup

2. Message panel (opened from `Message`)
- Text message tab
- Voice message tab (record, playback, retry)
- Submit as current user (account or guest name)

3. Candle panel (opened from `Candle`)
- Candle style selector (MVP can be limited set)
- Optional dedication text
- Confirm place/light candle

4. Scene Element Detail panel (opened from scene interaction)
- Element title/description
- Related contributions list
- Quick actions: leave message, light candle, add media (auth only)

### D. Small Overlays / Modals

- Edit guest display name modal (from top-right guest user badge).
- Permission modal/toast for guest media attempt.
- Success/failure toasts for submissions.
- Optional onboarding hint (first visit): gesture/control tips.

## 5) UX and Interaction Flows

### Flow 1: Room Entry
1. Resolve room from slug.
2. Show Entry Gate.
3. User picks login/signup/guest.
4. Guest path requires display name.
5. Enter viewer scene.

### Flow 2: Add Media (Authenticated)
1. User taps `+`.
2. Left panel opens Add variant.
3. User picks media type and uploads/selects file.
4. User confirms anchor target (selected scene object or world position).
5. Submit and show confirmation.
6. Contribution appears in scene/activity feed.

### Flow 3: Add Media (Guest Block)
1. Guest taps `+`.
2. Left panel shows limited state with auth requirement.
3. Offer quick switch to login/signup.

### Flow 4: Leave Message
1. User taps `Message`.
2. Left panel opens message tabs (text/voice).
3. User submits message.
4. Message marker updates in scene.

### Flow 5: Light Candle
1. User taps `Candle`.
2. Left panel opens candle picker.
3. User confirms location/style.
4. Candle appears lit in scene.

### Flow 6: Mode Switching
1. User uses right rail mode switch.
2. Camera/input profile switches:
  - Look Around
  - Flythrough
  - VR
3. Scene interaction stays available across modes (with VR-safe fallback).

## 6) Hooks Between Elements (UI, Scene, Data)

## 6.1 Frontend State and Composables

Add viewer-specific composables:

- `useViewerSession()`
  - Tracks `isAuthenticated`, `isGuest`, `guestName`, `canPostMedia`.
  - Resolves effective author identity for messages/candles.

- `useViewerUiState()`
  - `isUiHidden`, `activePanel`, `activeMode`, `isPanelOpen`.
  - Handles bottom dock and right rail actions.

- `useViewerInteraction()`
  - Stores selected scene element and world hit position.
  - Exposes `openElementDetail(elementId)`.

- `useViewerContributions()`
  - Fetches/creates contributions (media, message, candle).
  - Applies role checks before write requests.

- `useViewerAuthGate()`
  - Entry Gate logic: login/signup/guest flow and display-name requirement.

## 6.2 Event Hooks (Contract)

- Bottom dock -> panel hook:
  - `onAddClick` -> open panel `add`
  - `onMessageClick` -> open panel `message`
  - `onCandleClick` -> open panel `candle`

- Right rail -> runtime hook:
  - `onToggleUi` -> update `isUiHidden`
  - `onModeChange(mode)` -> call camera control adapter

- Scene viewport -> panel/data hook:
  - `onSceneElementSelect` -> set active element -> open detail panel
  - `onPlaceContribution` -> persist contribution -> update local markers

- Top-right user badge -> session hook:
  - guest edit action updates `guestName` and future message attribution

## 6.3 Existing Project Integration Hooks

- Reuse scene document pipeline:
  - `app/app/scene/sceneHydration.js`
  - `app/app/scene/sceneValidation.js`
- Create a viewer-specific viewport component parallel to editor viewport:
  - `app/app/components/scene/ViewerSceneViewport.client.vue` (new)
- Keep editor APIs separate from viewer public read APIs.

## 7) Data and API Plan

Current state:
- Scene endpoints are authenticated workspace APIs.
- Viewer route now renders a dedicated viewer shell at `app/app/pages/viewer/[slug]/index.vue`.
- `app_posts` table supports post/image/video/audio but no explicit candle record type yet.

Required additions:

### 7.1 Public Viewer Read API

New endpoint example:
- `GET /api/viewer/room/[slug]`

Returns:
- Room public metadata
- Latest published scene payload
- Published contributions (messages/media/candles)
- Viewer capability flags (private/public, requires PIN)

### 7.2 Viewer Write APIs

New endpoints:
- `POST /api/viewer/contributions/message`
- `POST /api/viewer/contributions/candle`
- `POST /api/viewer/contributions/media` (auth only)

Server-side checks:
- Enforce guest/media restriction.
- Validate guest name presence for guest writes.
- Validate room visibility/PIN/session access.

### 7.3 Data Model Extensions

Option A (recommended, minimal migration):
- Continue using `app_posts`.
- Add semantic subtype in `content` JSON, e.g.:
  - `{ kind: 'message' }`
  - `{ kind: 'voice_message' }`
  - `{ kind: 'candle' }`
  - `{ kind: 'media' }`
- Add guest attribution fields in `content`, e.g. `guest_name`.

Option B:
- Add dedicated `app_candles` table.
- Keep messages/media in `app_posts`.

MVP recommendation:
- Start with Option A to ship faster.

## 8) Camera and Mode Plan

Modes:
- Look Around
  - Orbit/walk style camera, easy touch drag.
- Flythrough
  - Free-fly navigation with speed control.
- VR
  - WebXR if available; fallback message if unavailable.

Hook strategy:
- Create a camera adapter layer that switches control implementation by mode.
- Preserve selected element and panel state when changing modes.

## 9) Mobile + Desktop Requirements

- Touch-first controls on mobile; mouse/keyboard on desktop.
- Safe-area aware overlays for iOS/Android notches.
- Large hit targets for bottom and right controls.
- Left panel as full-height drawer on desktop, near-full-screen sheet on mobile while keeping scene context visible.
- Keep total visible chrome minimal by default.

## 10) UI Minimalism Rules

- Only persistent controls allowed:
  - Top-left logo
  - Top-right user badge
  - Bottom 3 actions
  - Right 2 toggles
- Everything else is contextual and appears only when needed.
- Include one-tap `Hide UI` to maximize immersion.

## 11) Build Phases

Phase 1: Foundations
- [x] Build Entry Gate screen and guest name flow.
- [x] Replace placeholder viewer route with scene viewport shell.
- [x] Implement minimal top/bottom/right control scaffolding.

Phase 2: Scene Runtime
- [x] Add viewer viewport component with look-around mode.
- [x] Wire scene interaction selection and detail panel.
- [x] Add flythrough mode switch.

Phase 3: Contribution MVP
- [x] Implement message and candle flows for guest + auth users.
- [x] Implement media flow for auth users only.
- [x] Persist contributions via new viewer APIs.

Phase 4: VR + Hardening
- [ ] Add VR mode with capability detection.
- [ ] Improve mobile polish, accessibility, and error handling.
- [ ] Add anti-spam and moderation hooks.

## 12) Acceptance Checklist

- [ ] Entry Gate always appears before entering scene.
- [ ] Guest must choose display name before entering.
- [ ] Viewer works on mobile and desktop.
- [ ] UI remains minimal and matches requested control locations.
- [ ] Bottom buttons open left-aligned panel variants.
- [ ] Guests can leave message and light candle.
- [ ] Guests cannot post media.
- [ ] Logged-in users can post media, messages, and candles.
- [ ] Right rail supports hide UI and mode switching.
- [ ] Top-right lets guest edit display name.
- [ ] Scene interactions open element-specific detail/actions.

## 13) Open Questions to Resolve Before Build

- Should guest contributions require moderation by default?
- Should private rooms require PIN for every session or one-time session grant?
- Should candles expire over time or remain permanent?
- Should voice messages be stored as media files in Supabase Storage with post pointers?
- How should VR mode behave on unsupported devices (disable vs fallback to flythrough)?

## 14) Suggested Initial File Targets (Implementation)

- New page/shell:
  - `app/app/pages/viewer/[slug]/index.vue` (replace placeholder)
- New components:
  - `app/app/components/spaces/ViewerSpace.vue`
  - `app/app/components/scene/ViewerSceneViewport.client.vue`
  - `app/app/components/viewer/ViewerTopBar.vue`
  - `app/app/components/viewer/ViewerBottomDock.vue`
  - `app/app/components/viewer/ViewerRightRail.vue`
  - `app/app/components/viewer/ViewerLeftPanel.vue`
  - `app/app/components/viewer/ViewerEntryGate.vue`
- New composables:
  - `app/app/composables/useViewerSession.js`
  - `app/app/composables/useViewerUiState.js`
  - `app/app/composables/useViewerInteraction.js`
  - `app/app/composables/useViewerContributions.js`
  - `app/app/composables/useViewerAuthGate.js`
- New server endpoints:
  - `app/server/api/viewer/room/[slug].get.js`
  - `app/server/api/viewer/contributions/message.post.js`
  - `app/server/api/viewer/contributions/candle.post.js`
  - `app/server/api/viewer/contributions/media.post.js`

This plan captures all requested features and defines the UI, state hooks, APIs, and phased implementation path needed to deliver the Viewer app end-to-end.
