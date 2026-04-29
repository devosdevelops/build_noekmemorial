# Project Architecture and Implementation Guide

### Stack: Nuxt 3 + Three.js + Supabase

*Last updated: 2026-04-29*

------------------------------------------------------------------------

## 1. Overview of the Stack

- **Nuxt 3** → UI, routing, app structure
- **Three.js** → 3D rendering + editor logic
- **Supabase (single project)** → Database, Auth, Storage (EU)
- **Internal Model Library** → curated 3D assets (within same
    Supabase)

------------------------------------------------------------------------

## 2. Full System Architecture

### Vercel Projects

``` text
Project A → noekmemorial.be (marketing)
Project B → app + platform
```

### Domains

``` text
noekmemorial.be → marketing

app.noekmemorial.be → editor/dashboard
*.noekmemorial.be → memorial viewer
```

### Supabase (Single Project)

``` text
Supabase
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

## 3. Before You Get Started

### Accounts

- Supabase (EU region)
- GitHub
- Vercel
- Combell (DNS)

### Install

- Node LTS
- VSCode
- Git

### Project Startup (Nuxt)

#### Create a new Nuxt app

``` bash
npx nuxi@latest init app
cd app
npm install
npm run dev
```

App runs by default at:

``` text
http://localhost:3000
```

#### Start this project (existing repo)

From the project root:

``` bash
npm install
npm run dev
```

#### Useful Nuxt scripts

``` bash
npm run build
npm run preview
```

------------------------------------------------------------------------

## 4. Scene Data Model (CRITICAL)

Scene = JSON (source of truth)

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

### Rules

- Never rely on Three.js objects as state
- Renderer = function(sceneData)
- Store **model IDs**, not URLs

------------------------------------------------------------------------

## 5. Editor Architecture (IMPORTANT)

### Scene Store (Pinia)

- objects\[\]
- selectedObjectId

### Renderer Layer

- loop objects
- create meshes
- update transforms

### Interaction Layer

- raycasting (selection)
- transform controls

### Sync Layer

- UI → state → scene
- state → DB

------------------------------------------------------------------------

## 6. Model Library (Integrated System)

### Purpose

Curated GLB model system (your own Polypizza)

### Tables

#### lib_models

- id
- name
- description
- category_id
- file_url
- thumbnail_url
- tags
- scale

#### lib_categories

- id
- name
- slug

### Storage

``` text
/model-library/
```

### Usage

``` js
loader.load(model.file_url)
```

### Rule

Scene JSON references **model ID**, not URL

------------------------------------------------------------------------

## 7. Implementation Roadmap

### Phase 1 -- Base Setup

- Nuxt project
- Supabase setup
- Basic Three.js scene

### Phase 2 -- Minimal Editor Core

- Add 1 object
- Add transform controls
- Add selection via raycasting

### Phase 3 -- State System

- Pinia store
- Render scene from state

### Phase 4 -- Model Library

- Create lib_models
- Upload 10--20 GLB models
- Build model picker UI

### Phase 5 -- Persistence

- Save scene JSON
- Load scene JSON
- Rebuild scene

### Phase 6 -- Workspace System

- Workspaces
- Collaborators

### Phase 7 -- Viewer

- Public memorial pages
- Load via subdomain

------------------------------------------------------------------------

## 8. Subdomain Routing (IMPORTANT)

### Logic

``` text
app.noekmemorial.be → app (editor)

janedoe.noekmemorial.be → memorial viewer
```

### Nuxt Middleware Concept

``` js
const host = request.headers.host
const subdomain = host.split('.')[0]

if (subdomain === 'app') {
  // editor mode
} else {
  // viewer mode
}
```

### Requirements

- wildcard DNS (\*.noekmemorial.be)
- Vercel wildcard domain support
- SSR (not static build)

### Local Development

Use fallback route:

``` text
/memorial/[slug]
```

------------------------------------------------------------------------

## 9. Where to Begin (Exact Steps)

1. Setup Nuxt
2. Setup Supabase
3. Build simple Three.js scene
4. Add one cube
5. Make it movable
6. Store state in Pinia
7. Save state to DB

👉 If you reach step 7, core system works

------------------------------------------------------------------------

## 10. Database Schema (Draft)

### app_users

- id
- email

### app_workspaces

- id
- name
- slug
- owner_id

### app_scenes

- id
- workspace_id
- json_data
- updated_at

### collaborators

- user_id
- workspace_id
- role

### lib_models

- id
- file_url
- metadata

------------------------------------------------------------------------

## 11. Likely Pitfalls

- Overengineering editor
- Mixing state & Three.js objects
- Not structuring JSON early
- Model scale inconsistencies
- Trying external model APIs

------------------------------------------------------------------------

## 12. Dev Checklist

- [ ] Scene renders
- [ ] Object selectable
- [ ] Object movable
- [ ] State updates
- [ ] Scene saved to DB
- [ ] Scene reload works
- [ ] Model picker works
- [ ] Subdomain routing works

------------------------------------------------------------------------

## 13. Extra Tips

- Use GLB format
- Keep models lightweight
- Normalize scale/orientation
- Build vertical slices (end-to-end)

------------------------------------------------------------------------

## Final Advice

Your project is:

70% system design\
20% 3D\
10% framework

Focus on the core loop:

create → edit → save → view
