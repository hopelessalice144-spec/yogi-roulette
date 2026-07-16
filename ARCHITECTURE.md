# Turbo Roulette — Principal Architecture (v3)

## Phase 1 Decision Record

This document records **why** each technology was chosen for a casino-grade, 60fps+, provably-fair European roulette web application.

---

## 1. Product Requirements → Technical Constraints

| Outcome | Constraint |
|---------|------------|
| Casino-grade 3D wheel + ball | GPU-accelerated WebGL, sub-frame physics |
| 60fps+ on mid-tier mobile | Fixed timestep, instancing, chunked bundles |
| Provably fair outcomes | Commit-reveal HMAC-SHA256, server-authoritative path |
| Bet lock at spin start | Wall-clock phase machine, millisecond phase boundaries |
| Immersive audio/haptics | Web Audio API synthesis, Vibration API |
| WCAG AA HUD over WebGL | Glassmorphism CSS layer decoupled from canvas |

---

## 2. Selected Stack (Justified)

### Runtime & Build — **Vite 6 + React 19**

- **Why:** Fast HMR for iterative 3D work; native ESM; Rollup production tree-shaking.
- **Why React 19:** Mature ecosystem for complex HUD state; StrictMode catches effect bugs in physics bridges.
- **Rejected:** Next.js (SSR adds no value for WebGL-heavy SPA); Remix (same); raw Web Components (poor 3D ecosystem).

### 3D & Rendering — **Three.js r175 + React Three Fiber 9**

- **Why:** Industry standard for browser 3D; R3F declarative scene graph maps cleanly to game phases.
- **@react-three/drei:** Camera controls, environments, instancing helpers — reduces bespoke math.
- **@react-three/postprocessing:** Bloom, vignette, god-rays without custom FBO plumbing.
- **Rejected:** Babylon.js (heavier bundle); PlayCanvas (less React integration); Unity WebGL (multi-MB WASM, poor mobile).

### Physics — **Rapier 3D via @react-three/rapier**

- **Why:** WASM rigid-body solver tuned for real-time; deterministic enough with fixed timestep accumulator.
- **Use case:** Ball–divider collisions, OOB recovery, pocket settle — not full wheel rigid spin (kinematic wheel + dynamic ball is the correct split).
- **Rejected:** Cannon.js (unmaintained); Ammo.js (heavy); pure kinematic fake (fails "immersive feel" requirement).

### Game Logic Layer — **Pure JS `src/core/` (framework-agnostic)**

- **Why:** React re-renders must not drive outcome logic; provably-fair and phase locks live in testable pure modules.
- **Pattern:** `gameEngine.js` (clock/phases) + `provablyFair.js` (RNG) + existing `lib/` (physics, math, bets).

### State Management — **React Context + refs for hot paths**

- **Why:** Game state is moderate complexity; Context avoids Redux boilerplate; `hoverBridge` refs avoid 60Hz React updates.
- **Rejected:** Zustand/Jotai (optional later for devtools); Redux (overkill).

### Persistence & Security — **SHA-256 integrity + schema validation**

- **Why:** Client-side demo wallet uses tamper-evident storage; bet whitelist prevents injection.
- **Production path:** Backend holds server seed; client receives hash commit only until reveal.

### Styling — **CSS custom properties + UI-UX Pro Max design tokens**

- **Why:** Zero runtime CSS-in-JS cost; tokens map to Liquid Glass casino HUD spec.
- **Rejected:** Tailwind-only (harder for dynamic glass/spotlight CSS vars already in use).

### Audio — **Web Audio API procedural synthesis (`audioSynth.js`)**

- **Why:** Zero asset latency; dynamic friction/clack tied to physics velocity.
- **Rejected:** Howler + MP3 sprites (larger bundle, less dynamic).

### Testing — **Node `verify.js` structural + property assertions**

- **Why:** No Jest overhead for a graphics app; 300+ fast structural checks gate regressions.
- **Phase 2+:** Add unit tests for `src/core/*` pure functions.

---

## 3. Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│  UI Layer (src/ui/)          — BettingBoard, toasts     │
├─────────────────────────────────────────────────────────┤
│  React Context (context/)    — GameProvider, HUD phase  │
├─────────────────────────────────────────────────────────┤
│  Core Engine (src/core/)     — phases, provably fair    │
├─────────────────────────────────────────────────────────┤
│  Domain Lib (src/lib/)       — math, bets, physics, audio│
├─────────────────────────────────────────────────────────┤
│  Scene (src/scene/)          — R3F wheel, ball, camera  │
└─────────────────────────────────────────────────────────┘
         ▲                              ▲
         │ wall-clock sync              │ Rapier WASM
         └──────── timer.js ────────────┘
```

---

## 4. Provably Fair Model (Commit–Reveal)

1. **Before round:** publish `serverSeedHash = SHA256(serverSeed)`.
2. **During betting:** accept `clientSeed` (user nonce or session id).
3. **At lock:** `winningNumber = HMAC_SHA256(serverSeed | clientSeed | cycleId) mod 37`.
4. **After round:** reveal `serverSeed`; anyone verifies hash + outcome.

Implementation: `src/core/provablyFair.js` (Phase 1 scaffold).  
Integration with `GameContext` authoritative settle: **Phase 2** ✅ complete.

---

## 5. Phase Roadmap

| Phase | Deliverable |
|-------|-------------|
| **1** ✅ | Deep audit (`docs/UPGRADE_AUDIT.md`), tech manifest, performance budgets, Vite hardening |
| **2** ✅ | Provably fair + `GameContext` engine integration |
| **3** | UI/UX overhaul, fairness HUD, SVG icons |
| **4** | WebSocket/API authoritative server seed |
| **5** | Audio/haptics refinement |
| **6** | Lazy Rapier, TypeScript on core, profiling |

---

## 6. Bundle Strategy

Manual chunks in `vite.config.js`: `three`, `r3f`, `rapier`, `postfx` — parallel download, cache-friendly.

---

## 7. Environment Variables

See `.env.example`. Only `VITE_*` keys are client-safe. Server seeds **never** ship in client bundles in production.
