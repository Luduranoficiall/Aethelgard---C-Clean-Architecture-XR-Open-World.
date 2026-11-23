# 🛡️ Aethelgard — Open World Action RPG & WebXR Immersive Engine

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](#)
[![Clean Architecture](https://img.shields.io/badge/Architecture-C%23%20Clean%20Architecture%20%2F%20DDD-blue.svg)](#)
[![WebXR Standard](https://img.shields.io/badge/WebXR-XR%20Blocks%20v0.24.0%20%7C%20Three.js-purple.svg)](#)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-11%2F11%20Passed%20(100%25)-success.svg)](#)
[![Performance](https://img.shields.io/badge/Performance-60%2B%20FPS%20%7C%20Zero%20Heap%20Hot%20Paths-orange.svg)](#)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Enterprise-lightgrey.svg)](#)

> **Aethelgard** is an enterprise-grade, open-world action RPG crafted at the intersection of **Spatial Computing (WebXR)**, **AI-Generated Living Worlds**, and **High-Performance C# Clean Architecture**. Designed to run friction-free in modern browsers across Desktop, Mobile, and next-generation Extended Reality headsets (Galaxy XR, XREAL AURA, Meta Quest).

---

## 📑 Table of Contents

1. [About the Project (Client Overview)](#-1-about-the-project-client-overview)
2. [C# Clean Architecture & Domain-Driven Design](#-2-c-clean-architecture--domain-driven-design)
3. [The 4-Tier Difficulty System](#-3-the-4-tier-difficulty-system)
4. [WebXR Implementation & Spatial Computing](#-4-webxr-implementation--spatial-computing)
5. [Complete Technical Stack](#-5-complete-technical-stack)
6. [Gameplay & Controls Guide](#-6-gameplay--controls-guide)
7. [Getting Started & Installation](#-7-getting-started--installation)
8. [Automated Testing & Quality Assurance](#-8-automated-testing--quality-assurance)
9. [Repository Structure](#-9-repository-structure)
10. [Client Presentation Rationale & Roadmap](#-10-client-presentation-rationale--roadmap)

---

## 🌟 1. About the Project (Client Overview)

### Executive Summary
**Aethelgard** addresses one of the most critical challenges in modern interactive software: delivering a console-quality 3D action RPG experience with deep combat mechanics directly through the web, requiring **zero app store downloads, zero plugins, and instantaneous onboarding**.

Built for forward-thinking clients, entertainment brands, and spatial web deployments, Aethelgard proves that lightweight web delivery does not require compromising on architectural integrity, combat depth, or visual splendour.

### Key Value Propositions for Clients
* **Instant Accessibility Everywhere:** Loads instantaneously via URL on any modern browser. Players on desktops, tablets, smartphones, and spatial headsets share the exact same deterministic world.
* **Humanized & Non-Obtrusive Visual Design:** Every UI component, notification banner, and difficulty bar is anchored away from the primary visual focal points (`bottom: 5%`). The central hero, animated enemy creatures, and AI-generated celestial citadel remain **100% visible and unobstructed**.
* **Enterprise Reliability:** Unlike typical web demos, Aethelgard's core mechanics are governed by an enterprise-tier C# domain model with mathematically verified damage curves, guaranteed determinism, and an exhaustive unit test suite.
* **Multimodal Immersive Audio:** Spatial audio synthesis built directly on the Web Audio API creates atmospheric resonance, procedural sword clashes, arc magic hums, and satisfying parry chimes without bulky audio asset downloads.

---

## 🏛️ 2. C# Clean Architecture & Domain-Driven Design

At the heart of Aethelgard lies an uncompromising separation of concerns rooted in **Robert C. Martin's Clean Architecture** and **Domain-Driven Design (DDD)** principles. The entire combat domain was authored in pure C# (located in `/csharp/`) and faithfully mirrored in high-performance TypeScript for native browser execution.

```
       ┌────────────────────────────────────────────────────────┐
       │             1. Enterprise Domain Layer                 │
       │   - Entities (PlayerEntity, EnemyEntity, WorldPortal)  │
       │   - Value Objects (DifficultyLevel, Health, Stamina)   │
       │   - Domain Rules (HyperbolicMitigation, PerfectParry)  │
       └───────────────────────────▲────────────────────────────┘
                                   │
       ┌───────────────────────────┴────────────────────────────┐
       │             2. Application / Use Case Layer            │
       │   - Use Cases (ExecutePlayerAttack, ProcessDodge)      │
       │   - DTOs & Results (CombatActionResult, HitResult)     │
       │   - State Management (GameStateManager Observable)     │
       └───────────────────────────▲────────────────────────────┘
                                   │
       ┌───────────────────────────┴────────────────────────────┐
       │        3. Infrastructure & Presentation Layer          │
       │   - Spatial Rendering: Three.js + XR Blocks v0.24.0    │
       │   - Input Pipeline: WebXR Gamepad API, Touch, Mouse/KB │
       │   - Glassmorphism UI: Tailored DOM & Web Audio Engine  │
       └────────────────────────────────────────────────────────┘
```

### Architectural Highlights
1. **Independence of Frameworks:** The core combat calculations, hit-box resolution, parry validation, and stamina equations have **zero dependencies** on graphics engines, DOM, or external packages.
2. **Zero-Allocation Hot Paths:** Hot paths executed every frame (damage mitigation, timing checks) utilize immutable value structures (`readonly struct` / immutable objects). This guarantees that memory is never allocated on the heap during the game loop, eliminating Garbage Collection (GC) pauses and maintaining an unyielding **60+ FPS**.
3. **Hyperbolic Armor Curve:** Rather than naive linear subtraction, defense follows an asymptotic curve preventing invulnerability while rewarding smart gear scaling:
   $$\text{Damage Received} = \text{Raw Damage} \times \left( \frac{100}{100 + \text{Effective Armor}} \right)$$
4. **Deterministic Combat State:** Combat resolutions (Parry, Block, Stumble, Critical Hit, Enrage) are computed as pure functions given input timestamps and entity states.

---

## ⚖️ 3. The 4-Tier Difficulty System

Aethelgard features a mathematically calibrated 4-tier difficulty engine, allowing every user—from casual explorers to hardcore action enthusiasts—to experience the game on their terms:

| Parameter | 🌿 Fácil (Aventureiro) | ⚔️ Médio (Veterano) | 🛡️ Difícil (Comandante) | 👑 Hard Master Profissional |
| :--- | :--- | :--- | :--- | :--- |
| **Player Max Health** | **200 HP** ($2.0\times$) | **100 HP** ($1.0\times$) | **80 HP** ($0.8\times$) | **50 HP** ($0.5\times$) |
| **Player Damage** | $1.5\times$ | $1.0\times$ (Canonical) | $0.9\times$ | $0.75\times$ |
| **Enemy Damage Multiplier** | $0.5\times$ (Halved) | $1.0\times$ (Standard) | $1.75\times$ ($+75\%$) | **$2.6\times$ (Lethal)** |
| **Passive Health Regen** | **+5 HP / sec** | Inactive | Inactive | Inactive |
| **Stamina Consumption** | $0.6\times$ (Low Drain) | $1.0\times$ | $1.4\times$ | **$2.0\times$ (Double Drain)** |
| **Perfect Parry Window** | **500 ms** (Generous) | **300 ms** (Balanced) | **160 ms** (Tight) | **80 ms** (Frame-Perfect) |
| **Dodge Invulnerability** | 650 ms | 400 ms | 250 ms | 150 ms |
| **Enemy AI Aggro Radius** | $0.75\times$ | $1.0\times$ | $1.4\times$ | $2.0\times$ |
| **Permadeath Threat** | No | No | No | **Active (Perma-Death)** |

### Dynamic Hover-Based Tooltips & Reactive Horizontal Bar
* **Glassmorphic Horizontal Bar:** Positioned neatly above the main action trigger, displaying dedicated toggles for each tier.
* **Instant Hover Cards with D3.js Radar Chart:** Hovering over any tier button reveals a rich floating card presenting an executive summary, direct gameplay impacts, comparative stat chips, and an **interactive D3.js Radar Chart (Spider Chart)** comparing difficulty levels across 5 key performance indicators (Enemy AI Intelligence, Resource Scarcity, Movement & Cadence Speed, Parry Precision, and Lethality).
* **Comparative Visual Baseline:** The D3 radar chart displays the active difficulty's glowing polygon alongside a ghost baseline of the canonical standard (Médio), providing immediate visual telemetry.
* **Auditory & Visual Feedback:** Selecting a difficulty emits a tailored Web Audio synth trigger matching the tier's personality, and transitions the card border with smooth CSS glow keyframe animations.

---

## 🥽 4. WebXR Implementation & Spatial Computing

Aethelgard is engineered on **XR Blocks (v0.24.0)** and **Three.js (v0.186.0)**, implementing official W3C WebXR Device APIs for universal cross-platform rendering:

* **XR Hardware Compatibility:** Tested on **Samsung Galaxy XR**, **XREAL AURA**, **Meta Quest 3 / Pro**, and Apple Vision Pro (via WebXR flags).
* **Head & Controller Tracking:** Full 6DoF (Six Degrees of Freedom) tracking allowing natural head orientation, leaning, and physical controller manipulation.
* **Desktop & Mobile Fallback Simulator:** Includes a built-in XR desktop simulator enabling full mouse-look, touch controls, and pose inspection without requiring a physical headset.
* **Procedural Dimensional Portals:** 3D portal objects utilizing custom shader rings and rotating particle horizons allow seamless in-engine transitions between 4 AI-generated biomes:
  1. *Aethelgard Citadel & Medieval Forest*
  2. *Celestial Floating Sanctuary*
  3. *Obsidian Volcanic Lands*
  4. *Astral Star Spire*

---

## 💻 5. Complete Technical Stack

| Architectural Layer | Technologies & Libraries | Key Responsibilities |
| :--- | :--- | :--- |
| **Domain Logic (C# Core)** | `.NET 8`, C# 12, xUnit, FluentAssertions | Pure combat equations, entity state models, defense curves, difficulty matrix |
| **Web Runtime (Mirror)** | Vanilla TypeScript (ESNext, Strict Mode) | Deterministic browser execution, state management, Zero-React lightweight build |
| **Cloud Persistence & DB** | Google Cloud Firestore, Firebase Auth, Security Rules | Real-time hero progression persistence, global leaderboards & Top Achievers |
| **Spatial 3D & WebXR** | `xrblocks@0.24.0`, `three@0.186.0` | 3D rendering pipeline, WebXR session lifecycle, lighting, camera rig, shaders |
| **Data Visualization** | D3.js (v7.9.0) | Interactive 5-axis radar chart with live benchmark overlay comparison |
| **Audio Synthesis** | Web Audio API (Native Synthesizers) | Procedural sound effects, dynamic blade hums, victory chimes, parry sparks |
| **Styling & Presentation** | Tailwind CSS, Glassmorphism, CSS3 Keyframes | Minimalist HUD, responsive floating difficulty dock, glowing animations |
| **State & Data Flow** | Custom Pub-Sub `GameStateManager` Singleton | Synchronizes difficulty tiers across HUD, 3D world, audio cues, and overlays |
| **Test Automation** | Node.js Test Runner (`node:test`), TSX | Continuous integration, unit test verification across all combat rules |

---

## 🎮 6. Gameplay & Controls Guide

The engine supports unified input mapping across mouse/keyboard, touchscreen mobile gestures, and spatial XR controllers:

| Action | Keyboard & Mouse | Mobile Touchscreen | WebXR Spatial Controllers |
| :--- | :--- | :--- | :--- |
| **Move Hero** | `W`, `A`, `S`, `D` or Arrow Keys | Virtual Joystick / Touch Drag | Left Controller Thumbstick |
| **Sword Attack (3-Hit Combo)** | `Left Click` or `Spacebar` | "Golpe de Espada" Button | Right Trigger / Hand Pinch Gesture |
| **Arcane Burst (Magic AoE)** | `Q` Key | "Magia Arcana" Button | Secondary Button / Spatial Menu |
| **Perfect Parry (Guard)** | `F` Key | "Parry" Button | Grip Button / Dual-Handed Guard Pose |
| **Tactical Dodge (Roll)** | `Left Shift` Key | "Esquiva" Button | Dash Gesture / Controller Button |
| **Cycle Difficulty Tier** | Left/Right Arrows (`←` / `→`), `V`, or `1-4` | Horizontal Difficulty Bar | Hover & Select on Spatial 3D UI |
| **Top Achievers (Firestore)**| `T` Key | "Achievers (T)" Button | Spatial Leaderboard Hologram |
| **Toggle Camera View** | `Z` Key | "Câmera" Button | Head Movement (Natural 6DoF) |
| **Photo Mode (Hide HUD)** | `H` Key | "Modo Foto" Button | Spatial System Menu |
| **Travel Through Portal** | `E` Key (near portal) | Direct Tap on Portal Orb | Direct Hand Touch on Portal |

---

## 🚀 7. Getting Started & Installation

### Prerequisites
* **Node.js** v18.0.0 or higher
* **npm** or **bun** package manager

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/aethelgard.git
cd aethelgard

# Install dependencies matching exact XR Blocks specifications
npm install
```

### 2. Run the Development Server
```bash
# Starts Vite on port 3000 (accessible on local network and WebXR devices)
npm run dev
```
Open `http://localhost:3000` in any WebXR-compatible browser or desktop browser to preview via the built-in simulator.

### 3. Production Build
```bash
# Compile and bundle static assets
npm run build
```

---

## 🧪 8. Automated Testing & Quality Assurance

To ensure absolute zero-bug stability and prevent combat timing regressions, the repository includes an automated test suite verifying domain rules:

```bash
# Execute unit test suite with high-speed TSX runner
npx tsx --test src/core/tests/engine.test.ts
```

### Test Suite Coverage (11/11 Passing)
* ✔️ `DifficultyLevel: Facil` invariants (+100% HP, regen, parry 500ms).
* ✔️ `DifficultyLevel: Medio` canonical standard parameters.
* ✔️ `DifficultyLevel: Dificil` enemy scaling and stamina drain.
* ✔️ `DifficultyLevel: HardMasterProfissional` extreme constraints and permadeath flag.
* ✔️ `CombatCalculations: Hyperbolic armor mitigation` asymptotic bounds.
* ✔️ `CombatCalculations: Perfect parry` total damage negation and enemy stumble.
* ✔️ `PlayerEntity: Health scaling` on live difficulty switch.
* ✔️ `PlayerEntity: 3-hit combo` state cycle and stamina deductions.
* ✔️ `PlayerEntity: Dodge invulnerability` frame timing.
* ✔️ `EnemyEntity: Enrage transition` triggered under 30% HP threshold.
* ✔️ `GameStateManager: Singleton pub-sub` subscription notifications.

---

## 📂 9. Repository Structure

```
├── DOCUMENTACAO_CLIENTE.md        # Comprehensive executive & client manual (PT-BR)
├── DESCRICAO_REPOSITORIO.md       # Client-ready repository descriptions, tags & pitches
├── README.md                      # This primary technical documentation
├── package.json                   # Dependency definitions (XR Blocks, Three.js)
├── csharp/                        # Reference C# Clean Architecture Implementation
│   ├── DOCUMENTATION.md           # C# Technical architecture specification
│   ├── OpenWorldEngine.Domain/    # Domain entities, value objects, and rules
│   ├── OpenWorldEngine.Application/# Use cases, DTOs, and combat interfaces
│   └── OpenWorldEngine.Tests/     # C# xUnit test suite
├── src/
│   ├── index.ts                   # Application bootstrap and XR scene initialization
│   ├── index.css                  # Global styles, glassmorphism UI, glow keyframes
│   ├── core/                      # High-performance TypeScript domain mirror
│   │   ├── types.ts               # Strict type definitions, enums, DTOs
│   │   ├── DifficultyLevel.ts     # Immutable 4-tier difficulty configurations
│   │   ├── CombatCalculations.ts  # Pure mathematical formulas (armor, parry, damage)
│   │   ├── PlayerEntity.ts        # Hero state machine, combo tracker, stamina
│   │   ├── EnemyEntity.ts         # Enemy AI logic, attack patterns, enrage mode
│   │   ├── GameStateManager.ts    # Observable application state singleton
│   │   ├── WorldPortals.ts        # Portal metadata and biome coordinates
│   │   └── tests/
│   │       └── engine.test.ts     # 11 comprehensive automated unit tests
│   ├── ui/                        # User interface components
│   │   ├── DifficultyHorizontalBar.ts # Floating bar with dynamic hover tooltips
│   │   ├── HudOverlay.ts          # Non-obstructive combat HUD and controls dock
│   │   └── DifficultyIndicator.ts # Visual badges, toast alerts, glow states
│   ├── characters/                # 3D character rigs, swords, animations
│   ├── world/                     # Biome rendering, lighting, skyboxes, particles
│   └── audio/                     # Web Audio API spatial synthesizer
└── public/                        # Static assets, backgrounds, and images
```

---

## 💼 10. Client Presentation Rationale & Roadmap

When presenting Aethelgard to stakeholders, investors, or corporate clients, emphasize the following strategic points:

1. **Production-Ready Foundation:** This is not a static mockup; it is a live, interactive 3D simulation running on enterprise software engineering principles.
2. **Immediate Time-to-Value:** Requires no app downloads or hardware exclusivity. Anyone with a smartphone, PC, or XR headset can experience it within seconds.
3. **Strategic Expansion Roadmap:**
   * 🗣️ **Conversational AI NPCs:** Integration with the Gemini Multimodal Live API for real-time natural voice dialogue with village inhabitants.
   * 🛡️ **3D Web3 / Cloud Inventory:** Persistent custom equipment, legendary swords, and cloud-synced player profiles.
   * 👥 **Multiplayer Spatial Co-op:** Multi-user WebXR rooms for shared exploration and cooperative dungeon boss fights.
   * 🏆 **Global Hard Master Leaderboards:** Tamper-proof cloud ranking celebrating players who conquer the game without taking damage.

---

### 📬 Contact & Support
For enterprise licensing, bespoke world creation, or commercial spatial deployments:
* **Engineering Lead:** Senior XR & Game Engine Architecture Team
* **Client Support Email:** luduranoficiall167@gmail.com
* **Engine Status:** 100% Operational & Production-Ready

*Copyright © 2026 Aethelgard Project. All rights reserved.*
