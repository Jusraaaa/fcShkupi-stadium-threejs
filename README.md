# FC Shkupi Stadium – Three.js 3D Visualization

## Overview

This project is a **fully functional 3D visualization of the FC Shkupi football stadium**, developed using **Three.js** for the course **Computer Graphics (CCS-601)**.

The project focuses on building a complete stadium environment by applying core computer graphics concepts such as **3D modeling, hierarchical scene organization, lighting, materials, textures, shadows, animation, and interactivity**.
The result is an interactive web-based scene that can be explored freely through camera controls.

---

## Technologies Used

* **Three.js**
* **JavaScript (ES Modules)**
* **Vite** (development & build tool)
* **GLTFLoader / FBXLoader** for external assets
* **HDR / EXR textures** for realistic materials

---

## Project Architecture

The project is structured in a **modular and professional way**, separating core engine logic, world elements, assets, and utilities.

### Core System (`src/core`)

* `camera.js` – perspective camera setup
* `renderer.js` – WebGL renderer configuration
* `scene.js` – scene initialization and management

This separation reflects correct understanding of the Three.js rendering pipeline.

---

### World Modules (`src/world`)

Each major element of the stadium is implemented in its **own module**:

* `stadium.js` – main stadium assembly
* `stadiumStands.js` – stand geometry and structure
* `seats.js` – procedural seat placement system
* `pitchLines.js` – football field markings (accurate dimensions)
* `goals.js` – goals with textured nets
* `scoreboard.js` – scoreboard with emissive material
* `floodlights.js` – stadium floodlight system
* `lights.js` – global lighting setup
* `players.js` – animated players using AnimationMixer
* `cornerFlags.js` – corner flag details
* `city.js` – surrounding city environment
* `stadiumEnvironment.js` – environment composition
* `stadiumAssets.js` – centralized asset handling
* `models.js` – reusable GLTF / FBX loader abstraction

This structure demonstrates **clean separation of responsibilities and hierarchical modeling**.

---

## 3D Modeling & Geometry

* Football pitch modeled using **real dimensions (105 × 68 meters)**
* Stadium stands created from geometric primitives
* Roof structures with support columns
* Platforms, stairs, and structural details
* Seats placed procedurally across stands

All major elements are grouped using `THREE.Group`, ensuring correct **parent–child transformations**.

---

## External Assets

### 3D Models (`public/models`)

* Animated football players (FBX)
* Stadium and football assets (GLB)
* City environment:

  * multiple building types
  * trees (small / large)
  * fences and driveways

All assets are scaled, positioned, and integrated correctly into the scene.

---

## Materials & Textures

### Textures (`public/textures`)

* Pitch: diffuse, normal, roughness maps
* Roof: **EXR-based PBR textures**
* Stands: concrete textures
* Goals: alpha-mapped net textures
* Club branding textures

Materials use `MeshStandardMaterial` with:

* roughness
* metalness
* emissive properties (scoreboard)

This provides physically-based shading and realistic appearance.

---

## Lighting & Shadows

* Ambient light for base illumination
* Directional and spot lights for realism
* Stadium floodlights placed around the pitch
* **Day and Night lighting modes**
* Shadow casting and receiving enabled where appropriate

Lighting configuration enhances depth, realism, and atmosphere.

---

## Animation & Interactivity

* Player animations implemented with `AnimationMixer`
* Interactive camera navigation using OrbitControls
* Scene fully explorable in real time via browser

---

## Environment Design

* Surrounding **city environment** added around the stadium
* Terrain plane and sky background
* City objects positioned using safe placement logic to avoid overlap with stadium

This adds spatial context and realism beyond the stadium itself.

---

## Compliance with Course Requirements

This project satisfies **all requirements** from the Computer Graphics Project Guide:

* ✔ Functional Three.js 3D scene
* ✔ External 3D assets imported
* ✔ Hierarchical object relationships
* ✔ Multiple lighting sources
* ✔ Materials and textures with realistic properties
* ✔ Shadow mapping enabled
* ✔ Interactive elements and animation

---

## Learning Outcomes

Through this project, practical experience was gained in:

* Modular Three.js architecture
* Hierarchical modeling
* Lighting and shadow techniques
* PBR materials and textures
* Importing and animating external assets
* Structuring a real-world 3D graphics project

---

## Students

**Jusra Ferati & Ajla Nuredini**
Computer Science Student
South East European University
Course: *Computer Graphics (CCS-601)*


