# Bachelor Project Quickstart Guide (Draft v4)

## Stack: Nuxt 3 + Three.js + Supabase (Single Project Architecture)

*Last updated: 2026-04-28*

------------------------------------------------------------------------

# 1. Overview of the Stack

-   **Nuxt 3** → UI, routing, app structure
-   **Three.js** → 3D rendering and editor
-   **Supabase (single project)** → Database, Auth, Storage
-   **Internal Model Library (within Supabase)** → reusable 3D assets

------------------------------------------------------------------------

# 2. Architecture Overview

👉 You will use **ONE Supabase project**, not two.

``` text
Supabase Project
├── App Domain
│   ├── app_users
│   ├── app_workspaces
│   ├── app_scenes
│   └── app_posts
│
├── Model Library Domain
│   ├── lib_models
│   ├── lib_categories
│
└── Storage
    ├── /user-media/
    └── /model-library/
```

------------------------------------------------------------------------

# 3. Model Library Strategy

## Core Idea

You are building your own **curated 3D asset system**

👉 NOT relying on external APIs\
👉 NOT hotlinking random models

------------------------------------------------------------------------

## Why this approach

-   Reliable (no broken APIs)
-   Consistent quality
-   Fully controllable
-   Reusable in future projects

------------------------------------------------------------------------

## Model Library Schema

### lib_models

``` sql
- id (uuid)
- name
- description
- category_id
- file_url
- thumbnail_url
- tags (text[])
- scale (float)
- created_at
```

------------------------------------------------------------------------

### lib_categories

``` sql
- id
- name
- slug
```

------------------------------------------------------------------------

## Example model

``` json
{
  "id": "bench_01",
  "name": "Wooden Bench",
  "file_url": "https://your-storage/bench.glb",
  "tags": ["outdoor", "wood"]
}
```

------------------------------------------------------------------------

## Important rule

👉 Scene JSON stores **model ID**, not URL

------------------------------------------------------------------------

# 4. Scene Data Model

``` json
{
  "objects": [
    {
      "id": "obj1",
      "model": "bench_01",
      "position": [0,0,0],
      "rotation": [0,0,0],
      "scale": [1,1,1]
    }
  ]
}
```

------------------------------------------------------------------------

# 5. Editor Architecture

## Core systems

### Scene Store (Pinia)

-   objects\[\]
-   selectedObjectId

### Renderer

-   loop through objects
-   create meshes

### Interaction

-   raycasting
-   transform controls

### Sync

-   state ↔ scene
-   state → DB

------------------------------------------------------------------------

# 6. Roadmap

## Phase 1 -- Setup

-   Nuxt app
-   Supabase project
-   basic Three.js scene

## Phase 2 -- Editor Core

-   add object
-   move object
-   selection

## Phase 3 -- State

-   Pinia store
-   render from state

## Phase 4 -- Model Library

-   create lib_models table
-   upload 10--20 GLB files
-   build model picker UI

## Phase 5 -- Persistence

-   save scene JSON
-   load scene

## Phase 6 -- Workspace

-   multi-user structure

## Phase 7 -- Viewer

-   public memorial page

------------------------------------------------------------------------

# 7. Where to Begin

1.  Setup Nuxt
2.  Setup Supabase
3.  Create simple Three.js scene
4.  Add one cube
5.  Make it movable
6.  Save state to DB

------------------------------------------------------------------------

# 8. Pitfalls

-   Overengineering editor
-   Mixing Three.js objects with state
-   Not normalizing models (scale/orientation)
-   Trying external model APIs

------------------------------------------------------------------------

# 9. Dev Checklist

-   [ ] Scene renders
-   [ ] Object selectable
-   [ ] Object movable
-   [ ] State saved
-   [ ] Scene reload works
-   [ ] Model picker works

------------------------------------------------------------------------

# 10. Key Insights

-   Scene = data, not objects
-   Model library = curated system
-   One Supabase project is enough

------------------------------------------------------------------------

# Final Advice

Keep everything simple, structured, and data-driven.

Finish the core loop: create → edit → save → view
