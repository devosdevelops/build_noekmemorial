# build_noekmemorial

A web-based 3D memorial configurator that allows users to create,
customize, and share immersive digital remembrance spaces.

------------------------------------------------------------------------

## 🧠 Concept

This project explores how digital spaces can support remembrance and
emotional connection by allowing users to:

-   Create a **personal 3D memorial space**
-   Decorate it with objects and models
-   Share it with others via a public link
-   Allow visitors to view and contribute content

The platform is designed as a **white-label SaaS concept**, meaning it
can be adapted and branded by external partners (e.g. funeral services).

------------------------------------------------------------------------

## ⚙️ Tech Stack

### Core

-   **Nuxt 3** -- Frontend framework (Vue-based)
-   **Three.js** -- 3D rendering and interaction
-   **Supabase** -- Database, authentication, and storage

### Architecture Overview

    Nuxt App
    ├── Pages (editor, viewer, dashboard)
    ├── Components (UI + 3D scene)
    ├── State (Pinia)
    └── Supabase
        ├── App Domain (users, workspaces, scenes)
        ├── Model Library (assets)
        └── Storage (media + models)

------------------------------------------------------------------------

## 🧩 Key Features (MVP)

-   3D scene editor (place, move, rotate objects)
-   Scene persistence (save/load)
-   Media uploads (images, messages)
-   Workspace system (basic collaboration)
-   Public memorial viewing page
-   Curated 3D model library

------------------------------------------------------------------------

## 🗄️ Data Architecture

### Scene Structure

Scenes are stored as JSON:

``` json
{
  "objects": [
    {
      "id": "obj1",
      "model": "bench_01",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    }
  ]
}
```

> ⚠️ Important: Scenes reference **model IDs**, not direct URLs.

------------------------------------------------------------------------

## 🧱 Model Library

The project includes a **curated 3D asset system**:

-   Models stored in Supabase Storage (`/model-library/`)
-   Metadata stored in `lib_models` table
-   Accessed via API queries
-   Loaded dynamically into Three.js using GLB URLs

------------------------------------------------------------------------

## 🚀 Getting Started

### 1. Install dependencies

``` bash
npm install
```

### 2. Run development server

``` bash
npm run dev
```

------------------------------------------------------------------------

### 3. Setup Supabase

Create a Supabase project and configure:

#### Tables

-   `app_users`
-   `app_workspaces`
-   `app_scenes`
-   `lib_models`
-   `lib_categories`

#### Storage buckets

-   `/user-media/`
-   `/model-library/`

#### Environment variables

``` env
SUPABASE_URL=your_url
SUPABASE_PUBLISHABLE_KEY=your_key
SUPABASE_SECRET_KEY=your_secret_key
```

------------------------------------------------------------------------

## 🧭 Project Structure

    /pages
      /editor/[id].vue
      /memorial/[id].vue
      /dashboard.vue

    /components
      ThreeScene.vue
      UI/

    /composables
      useScene.js
      useSupabase.js

    /store
      sceneStore.js

------------------------------------------------------------------------

## 🛠️ Development Approach

The project follows a **data-driven architecture**:

-   Scene = JSON (source of truth)
-   Renderer = function of state
-   UI ↔ state ↔ 3D scene are synchronized

------------------------------------------------------------------------

## ⚠️ Known Challenges

-   Managing state between UI and 3D scene
-   Handling model scale/orientation inconsistencies
-   Keeping editor complexity under control
-   Performance when loading multiple models

------------------------------------------------------------------------

## 🎯 Scope (MVP Focus)

This project intentionally limits scope to ensure completion:

-   No real-time collaboration (future feature)
-   Limited model library (curated set)
-   Single scene template
-   Basic interaction system

------------------------------------------------------------------------

## 📦 Future Improvements

-   Real-time collaboration (Supabase Realtime)
-   Advanced editor tools (snapping, grouping)
-   Expanded model library
-   Improved UX for model selection
-   Multi-template environments
-   White-label CMS interface

------------------------------------------------------------------------

## 📄 License

This project is developed for educational purposes.

3D models used must comply with their respective licenses (e.g. CC0,
CC-BY).

------------------------------------------------------------------------

## ✍️ Author

Bachelor Project -- Digital Experience Design\
2025--2026

------------------------------------------------------------------------

## 💡 Final Note

This project focuses on:

> building a meaningful, interactive experience\
> rather than technical overengineering

The goal is to demonstrate: - system thinking - interaction design -
scalable architecture - emotional user experience
