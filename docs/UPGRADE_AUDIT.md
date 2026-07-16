# Turbo Roulette — Deep Upgrade Audit (Phase 1)

**Audit date:** 2026-07-16  
**Codebase version:** 3.0.0  
**Method:** Read-only scan of `src/`, `verify.js` (345 checks), production bundle analysis.

---

## 1. Current Architecture Map

```
src/
├── main.jsx              Entry, frame-buster
├── App.jsx               Shell: Canvas + HUD layout
├── context/
│   └── GameContext.jsx   Wallet, clock, physics refs, settle pipeline
├── core/                 ★ NEW — framework-agnostic engine (v3)
│   ├── config.js
│   ├── gameEngine.js
│   ├── provablyFair.js
│   ├── fairRoundStore.js
│   └── techManifest.js
├── lib/                  Domain: math, bets, physics, audio, camera, security
├── scene/                R3F: wheel, ball, camera, post-FX (18 components)
├── ui/                   BettingBoard, toasts, ghost layer
└── shaders/              Custom GLSL (god rays, plasma)
```

**Lines of capability:** 316+ structural tests · Rapier WASM physics · Cinematic camera · Procedural audio · UI-UX Pro Max HUD · SHA-256 integrity guard.

---

## 2. Tech Stack Verdict (Keep vs Swap)

| Layer | Current | Verdict | Rationale |
|-------|---------|---------|-----------|
| Build | Vite 6 | **KEEP** | Best DX for WebGL; ESM-native; already chunked |
| UI framework | React 19 | **KEEP** | Mature R3F ecosystem; Context + refs pattern works |
| 3D | Three r175 + R3F 9 | **KEEP** | Industry standard; entire scene built on this |
| Physics | Rapier 2.2 (WASM) | **KEEP** | Only viable real-time rigid-body for ball/dividers |
| Post-FX | postprocessing 6 | **KEEP** | Bloom/vignette integrated in VIPPostFX |
| State | React Context + refs | **KEEP** | hoverBridge + clockRef avoid 60Hz re-renders |
| RNG | `core/provablyFair` | **UPGRADED** ✅ | Was LCG; now HMAC commit-reveal |
| Storage | secureStorage SHA-256 | **KEEP** | Tamper-evident wallet |
| Audio | Web Audio synthesis | **KEEP** | Dynamic friction/clack; zero asset latency |
| Styling | CSS tokens | **KEEP** | No CSS-in-JS runtime cost |
| TypeScript | None | **DEFER → Phase 6** | Incremental `.ts` on `core/` first; no big-bang rewrite |
| State lib (Zustand) | None | **DEFER → Phase 4** | Only if WebSocket multi-table needs devtools |
| Backend | Client-only demo | **ADD → Phase 4** | Authoritative server seed + bet API |
| WebSockets | None | **ADD → Phase 4** | Live cycle sync for multi-player |
| Babylon.js | Not present | **REJECTED** | Would require full scene rewrite |
| Cannon.js | Not present | **REJECTED** | Unmaintained vs Rapier |
| n8ao (orphan dep) | In node_modules unused | **REMOVE** | Dead weight; not imported in `src/` |

**Conclusion:** The stack is already elite for browser-based 3D roulette. Phase 1–6 focus on **hardening and integration**, not rip-and-replace.

---

## 3. Tech Debt Register (Prioritized)

| ID | Severity | Area | Issue | Target Phase |
|----|----------|------|-------|--------------|
| TD-01 | High | Provably Fair | Server seed generated client-side (demo) | Phase 4 — API authority |
| TD-02 | Medium | UI | Emoji audio toggle icons (`App.jsx`) | Phase 3 — SVG icons |
| TD-03 | Medium | UI | Fairness hash not surfaced in HUD | Phase 3 — transparency panel |
| TD-04 | Low | Architecture | `resolveHudPhase` duplicate export in Context | Phase 6 — thin Context facade |
| TD-05 | Low | Architecture | `lib/` vs `core/` overlap on timer/phases | Phase 6 — migrate imports to `@core` |
| TD-06 | Low | Bundle | Rapier chunk ~2.26 MB gzip 838 KB | Phase 6 — lazy-load physics phase |
| TD-07 | Low | Deps | Orphan `n8ao` in node_modules | Phase 1 — prune if in package.json |
| TD-08 | Medium | Real-time | No WebSocket cycle broadcast | Phase 4 |
| TD-09 | Low | Testing | No isolated unit tests for `core/*` | Phase 2 ✅ partial via verify.js | 

---

## 4. Performance Baseline (Production Build)

| Chunk | Raw | Gzip |
|-------|-----|------|
| rapier | 2,260 KB | 838 KB |
| three | 691 KB | 178 KB |
| r3f | 538 KB | 178 KB |
| app JS | ~105 KB | ~37 KB |
| CSS | ~30 KB | ~7 KB |

**Budgets** (see `src/core/performanceBudget.js`): target 60 FPS high tier, downgrade below 45 FPS, pause physics below 30 FPS.

---

## 5. Six-Phase Upgrade Roadmap (Aligned)

| Phase | Status | Focus |
|-------|--------|-------|
| **1** | ✅ THIS PASS | Audit, tech manifest, performance budgets, Vite hardening |
| **2** | ✅ DONE | Core engine + PF wired to GameContext |
| **3** | Next | UI/UX overhaul, fairness HUD, icon swap, animation polish |
| **4** | Planned | WebSocket/API, authoritative server seed, bet sync |
| **5** | Partial | Audio/haptics exist — refine + mobile polish |
| **6** | Planned | Lazy Rapier, TS on core, edge cases, profiling |

---

## 6. Phase 1 Code Deliverables

- [x] `docs/UPGRADE_AUDIT.md` (this file)
- [x] `src/core/techManifest.js` — machine-readable stack decisions
- [x] `src/core/performanceBudget.js` — FPS/chunk budgets
- [x] `vite.config.js` — production esbuild drops, chunk naming
- [x] `package.json` — `check` script (test + build)
- [x] `ARCHITECTURE.md` — roadmap sync

---

## 7. Explicit Non-Goals (Phase 1)

- No scene rewrite
- No framework migration (React → Vue/Svelte)
- No deletion of Limit-Break features (camera, ghosts, quantum arc)
- No TypeScript big-bang
