# Project Status: Turbo Roulette (GameFi 3D)

## Current Stage: ✅ PHASE 6 — PERFORMANCE & TYPESCRIPT COMPLETE

- [x] **Phase 1:** Deep audit + upgrade strategy
- [x] **Phase 2:** Core engine + provably fair integration
- [x] **Phase 3:** Fairness HUD, SVG icons, engine bet-lock on board
- [x] **Phase 4:** Authoritative API client, SSE cycle sync, dev authority server
- [x] **Phase 5:** Phase-aware audio cues, haptics rate limits, preference persistence
- [x] **Phase 6:** Lazy Rapier, profile harness, TypeScript on `core/`

## Active Task

- **Architect upgrade complete** — all six phases shipped. Run `npm run check` before deploy.

---

## ✅ PHASE 6 — PERFORMANCE & TYPESCRIPT

| Deliverable | Implementation |
|-------------|----------------|
| **TD-06 lazy Rapier** | `loadRapier.js` — prefetch at T-13 (sec 17), mount at lock; `RapierStage.jsx` async chunk |
| **Idle wheel** | `EuropeanWheelVisual.jsx` — betting phase without WASM import |
| **Profile harness** | `profileHarness.js` — WASM/stage load timing marks |
| **TypeScript core** | `config.ts`, `provablyFair.ts`, `gameEngine.ts`, `types.ts` + `npm run typecheck` |
| **TD-04** | Removed duplicate `resolveHudPhase` from GameContext |
| **Vite** | Rapier excluded from `optimizeDeps` — stays in separate chunk |

---

## 🔊 PHASE 5 — AUDIO & HAPTICS POLISH

| Deliverable | Implementation |
|-------------|----------------|
| **Feedback config** | `src/core/feedbackConfig.js` — volumes, patterns, `localStorage` prefs |
| **Feedback bridge** | `src/lib/feedbackBridge.js` — unified audio + haptics facade |
| **Phase cues** | `playChipPlace`, `playBetLock`, `playSpinCue` in `audioSynth.js` |
| **Mobile haptics** | Collision rate limit (48ms), `prefers-reduced-motion` guard, `vibrateLock` |
| **Persistence** | Mute preference saved to `turboRoulette.feedback` |
| **Wiring** | `GameContext` phase transitions → lock tone + T-5 spin swell |

---

## 🔗 PHASE 4 — REAL-TIME & AUTHORITY

| Deliverable | Implementation |
|-------------|----------------|
| **TD-01 path** | `authorityClient.js` — server-held seeds via REST; local demo fallback when `VITE_API_BASE` unset |
| **TD-08 path** | `realtimeHub.js` — SSE `/api/v1/cycle/stream` with wall-clock fallback |
| **RT protocol** | `rtProtocol.js` — `parseCycleTick`, `SYNC_MODES` |
| **Remote fair store** | `registerRemoteCommit` / `applyRemoteReveal` in `fairRoundStore.js` |
| **Dev server** | `server/devAuthority.mjs` — commit / result / outcome + SSE (`npm run dev:authority`) |
| **GameContext** | `syncMode`, async authoritative commit/settle, physics target from `/result` after lock |
| **HUD** | Fairness panel shows Live sync / API badge when not wall-clock |

---

## 🎨 PHASE 3 — UI/UX OVERHAUL

| Deliverable | Implementation |
|-------------|----------------|
| **TD-02 fixed** | `src/ui/icons.jsx` — SVG volume on/off replaces emoji in `App.jsx` |
| **TD-03 fixed** | `FairnessPanel.jsx` — live commit hash + expandable T-0 reveal audit |
| **Bet lock UX** | `bettingOpen` uses `clock.acceptsBets` from enriched engine clock |
| **Glass panel** | Fairness strip matches `--glass-border` / `--spring-premium` tokens |

---

| Finding | Decision |
|---------|----------|
| **Stack verdict** | **KEEP** Vite 6, React 19, R3F, Rapier, Three.js — already optimal; no rip-and-replace |
| **RNG** | **UPGRADED** to HMAC commit-reveal (`core/provablyFair`) |
| **Rejected swaps** | Babylon, Cannon, Next.js, Unity WebGL |
| **Deferred** | TypeScript (Ph 6), Zustand (Ph 4), server PF (Ph 4) |
| **Tech debt TD-01** | **Mitigated** — authoritative API when `VITE_API_BASE` set; local demo fallback |
| **Tech debt TD-08** | **Mitigated** — SSE cycle stream with wall-clock fallback |
| **Tech debt TD-02** | Emoji audio icons → Phase 3 SVG |
| **Artifacts** | `src/core/techManifest.js`, `performanceBudget.js`, `npm run check` |

---

| Deliverable | Implementation |
|-------------|----------------|
| **Fair round store** | `src/core/fairRoundStore.js` — per-cycle server seed commit, client seed, reveal audit |
| **Authoritative settle** | `cycleTargetNumber()` → `outcomeForCycle()` (HMAC-SHA256 mod 37) |
| **Bet lock guard** | `placeBet` / `clearBets` use `canPlaceBet(clockRef)` — locks when phase ≠ betting |
| **Enriched clock** | `mergeEngineClock()` adds `acceptsBets`, `betsLocked`, `isSpinning` to wall-clock sync |
| **HUD phase** | `resolveHudPhaseFromClock` from `@core/gameEngine` |
| **Context API** | `fairnessCommit` (hash during round), `lastFairnessAudit` (post-settle verification) |

---

| Deliverable | Path |
|-------------|------|
| **Architecture ADR** | `ARCHITECTURE.md` — Vite/React 19, R3F, Rapier, pure `core/` engine |
| **App config** | `src/core/config.js` — cycle, physics, wallet, PF flags |
| **Provably fair** | `src/core/provablyFair.js` — commit-reveal SHA-256 mod 37 |
| **Game engine** | `src/core/gameEngine.js` — `createGameClock`, `canPlaceBet`, outcomes |
| **Path aliases** | `@core`, `@lib`, `@ui`, `@scene` in `vite.config.js` + `jsconfig.json` |
| **Env template** | `.env.example` — demo seed + future API flags |

### Stack Justification (Summary)

- **Vite 6 + React 19** — fastest 3D iteration loop, ESM-native
- **Three.js + R3F** — best WebGL/React integration for casino wheel
- **Rapier WASM** — real-time ball physics with fixed timestep
- **Pure `src/core/`** — provably-fair + phase logic decoupled from React re-renders

---

| Action | Implementation |
|--------|----------------|
| **Premium spring curves** | `--spring-premium: 0.3s cubic-bezier(0.25, 1, 0.5, 1)` on panels, bet cells, chips, buttons — satisfying tactile weight without layout thrash |
| **Glass depth spec** | `backdrop-filter: blur(20px) saturate(180%)` + `border: 1px solid rgba(255,255,255,0.12)` (`--glass-border`) on VIP dashboard |
| **WCAG AA typography** | `--text-on-glass: #f0f4fa` + `--text-muted-glass: #b8cad8` with text-shadow scrims over WebGL |
| **Harmonized neon** | `--neon-accent` / `--neon-glow` replace harsh `#00ffc8` saturations on pathway + hover casings |
| **T-5 spin-focus** | `scale(0.95)`, `opacity: 0.15`, `pointer-events-none` at `BALL_DROP_AT`; `resolveHudPhase` gates on T-5 |
| **T-0 settle bounce** | `settle-reveal` elastic `scale(0.92→1.03→1)` snap restores HUD to 100% |
| **Touch ergonomics** | `--touch-min: 44px` retained on chips, cells, actions (unchanged from Phase 1) |

---

| Target | Implementation |
|--------|----------------|
| **Holographic chip magnetism** | `spatialUx.js` — 35px proximity pull via ref registry (zero `setState` on `pointermove`); `--chip-scale` / `--chip-lift` bounce to `scale(1.12) translateY(-4px)` with `cubic-bezier(0.25, 1, 0.5, 1.25)` |
| **Kinetic cell ripples** | Per-cell `--spot-x/y` radial spotlight + dual-layer `bet-glow-casing` (`rgba(255,255,255,0.18)` border + neon drop shadow) — DOM-only updates, no React re-renders |
| **Spin load-shedding** | `.load-shed` / `.phase-spinning:not(.settle-reveal)` → `translateY(20px)`, `opacity 0.1`, `pointer-events-none`; `settle-reveal` elastic bounce on settlement |
| **Performance** | ChipRack uses `Map` ref registry + single window listener; BetBtn spotlight via `dataset.spotlit` + CSS vars |

---

## 🎨 UI-UX PRO MAX DESIGN AUDIT (Phase 1)

| Target | Implementation |
|--------|----------------|
| **Design system** | `ui-ux-pro-max` Liquid Glass profile — `--ease-soft` (250ms), `--elev-border` (#ffffff15), purple focus ring `#7C3AED` |
| **Grid transitions** | Bet cells, neon underlines, chip shadows use **200–300ms** soft ease; elastic spring retained for bounce/settle choreography |
| **Glass contrast** | Panel opacity raised (0.88–0.9); `--text-on-glass` / `--text-muted-glass` with text-shadow scrim for **≥4.5:1** legibility over WebGL |
| **Micro-depth** | Actionable chips, cells, buttons get soft drop shadows + `inset 0 1px 0 var(--elev-border)` elevation |
| **Touch targets** | `--touch-min: 44px` on chips, buttons, audio toggle, outside bets; number grid scroll-snap row at 12×44px |
| **Focus rings** | `:focus-visible` animated pulse on chips, bet cells, action buttons — keyboard/screen-reader safe |
| **Reduced motion** | `prefers-reduced-motion: reduce` collapses decorative transitions/animations |
| **A11y labels** | `aria-pressed` on chips, descriptive `aria-label` on bet cells and footer actions |

---

## 🔒 CYBER-SECURITY REMEDIATION LOG

| ID | Component | Vulnerability Type | Fix Implemented |
|----|-----------|-------------------|-----------------|
| SEC-01 | `secureStorage.js` | localStorage tampering | FNV → **SHA-256** checksum wrapper (v2); rejects corrupted payloads |
| SEC-02 | `GameContext.jsx` | Payout spoofing via `pocketCandidate` | Authoritative settle from `cycleTargetNumber(cycleId)` only |
| SEC-03 | `betSchema.js` / `bets.js` | Invalid chip/bet injection | Whitelist validation, `MAX_BET_PER_CELL`, `MAX_TOTAL_STAKED` |
| SEC-04 | `betSchema.js` | Balance overflow exploit | `clampBalance()` ceiling at $1,000,000 |
| SEC-05 | `.gitignore` | Secret leakage | `.env` / `.env.*` excluded; `.env.example` template |
| SEC-06 | `/src` (XSS audit) | DOM injection sinks | Zero `dangerouslySetInnerHTML`; React escaping + `domSanitize.js` |
| SEC-07 | `stateIntegrity.js` | React memory tampering | **StateIntegrityGuard** — SHA-256 shadow signatures; freeze + revert on mismatch |
| SEC-08 | `main.jsx` / `index.html` | Clickjacking / UI redress | Frame-buster + `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` |
| SEC-09 | `package.json` | Supply-chain drift (`^` ranges) | **Pinned** exact versions for all direct dependencies |
| SEC-10 | `App.jsx` | Post-tamper UX | Security freeze overlay blocks interaction after integrity violation |

### Pass 2 Re-scan — 2026-07-16

- DOM sinks: **none** in application source
- `npm audit`: **0 vulnerabilities**
- Integrity guard: verified via unit assertions in `verify.js`
- **Verdict:** Zero open application-layer vectors

## LIMIT-BREAK 5: STABILITY & SYSTEM HARDENING COMPLETE

| Feature | Implementation |
|---------|----------------|
| **Page Visibility API** | Tab hidden → `frameloop='never'`, Rapier `paused`, clock ticker stopped, audio suspended |
| **Absolute time resync** | `syncWallClock(Date.now())` + `computeBallKinematicSync()` + `computeWheelAngleSync()` on refocus |
| **GPU disposal** | `disposeMaterials()` on `MaterialLibrary` + cloned wheel pocket mats on unmount |
| **Audio teardown** | `destroy()` nulls all nodes; provider unmount clears interval + spark queue |
| **OOB watchdog** | `recoverBallIfOOB()` silent snap + `watchdogJournalRef` event counter |
| **Settle watchdog** | 4s `SETTLE_WATCHDOG_MS` → force kinematic lock + `nestlePose` lerp to pocket |
| **Stuck recovery** | `isBallStuck()` in free phase → track snap after 2.8s near-zero velocity |

## LIMIT-BREAK 4: SYNTHESIS & HAPTICS COMPLETE

| Feature | Implementation |
|---------|----------------|
| **Rolling friction hum** | Brown noise + bandpass friction layer + LFO; `setRollingVelocity()` drives pitch/gain from \|v\| |
| **Metallic pin clacks** | `playClack()` — triangle + HF noise; pitch/volume linear in Rapier impact via `impactToClackIntensity()` |
| **Wood pocket settle** | `playSettle()` — LF triangle exponential ramp + wood resonance + ivory click at pocket lock |
| **Pocket lock trigger** | `onBallPocketLock()` fires at `CAPTURE_STAGE.LOCKED`; deduped per cycle via `pocketSettlePlayedRef` |
| **Tiered haptics** | Minor bounces: `12ms`; pocket settle: `[40, 30, 15]` double-pulse via `SETTLE_HAPTIC_PATTERN` |

## LIMIT-BREAK 3: HOLOGRAPHIC HUD COMPLETION

| Feature | Implementation |
|---------|----------------|
| **Magnetic chip rack** | 35px proximity pull via `ChipRack` window listener + HW-accelerated `--chip-mx/my/rot` transforms |
| **Elastic micro-springs** | Unified `0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)` on chips, cells, panel, neon underlines |
| **2D→3D warm neon** | `warmGlowColorForHighlight()` → pocket emissive lerp + `WheelSectorNeon` point lights |
| **Zero-lag hover bridge** | `createHoverBridge` — ref updates instantly; wheel reads `hoverHighlightRef` same frame |
| **Phase-aware glass HUD** | `resolveHudPhase()` → T-5 spin-focus: `scale(0.95)`, `opacity 15%`, `pointer-events-none` |
| **T-0 bounce reveal** | `settle-reveal` class + `settle-panel-bounce` animation snaps HUD back to 100% |

## LIMIT-BREAK 2: CINEMATIC CAMERA SYSTEM COMPLETE

| Feature | Implementation |
|---------|----------------|
| **Zero-jitter EMA** | Dual-pass shadow look-at: `adaptiveLookEmaLambda()` + `LOOK_SHADOW_LAMBDA` — never raw ball coords |
| **Vertigo dolly zoom** | `dropVertigoProgress()` T-5 curve + `dollyZoomVertigo(55→22)` with `distanceScale` compensation |
| **Operator motion** | `cinematicHandheld()` — multi-octave simplex + `operatorBreathing()` sine layers, phase-weighted |
| **Impact shake** | `A·e^(-βt)·sin(ωt)` on position + roll; triggered via `registerCollisionShake` on divider hits |
| **Fixed-step camera** | Camera sub-steps at `FIXED_TIMESTEP` (60 Hz) for frame-stable motion |

## LIMIT-BREAK 1: MATHEMATICAL PHYSICS SECURED

| Feature | Implementation |
|---------|----------------|
| **Flawless orbital handoff** | `synchronizeHandoffState()` — C¹ position/velocity at spline exit; `rollingAngularVelocity()` conserves ω |
| **Ivory mass kinetics** | `BALL_PHYSICS` mass `0.062`, restitution `0.56`, friction `0.64`, rolling resistance + air drag |
| **Slide→roll transition** | `applyRollingKinetics()` — slip friction, bowl slope gravity, spin blend per fixed step |
| **Dual-stage pocket capture** | `CAPTURE_STAGE` guide → capture spring → nestle bounce → kinematic lock (`nestlePose`) |
| **Pocket geometry** | `pocketCenterWorld()` + `POCKET_CAPTURE` radii — zero jitter nestle at bowl center |

## Industrial Robustness Pass

| Feature | Implementation |
|---------|----------------|
| **Page Visibility API** | Tab hidden → pause Canvas `frameloop`, Rapier `paused`, clock ticker, audio `suspend` |
| **Cycle resync** | `syncWallClock()` on visible — reconstruct phase from `Date.now()`, ball kinematic teleport |
| **Missed settle catch-up** | `missedSettleCycle()` — auto-settle skipped rounds after background tab |
| **Fixed timestep** | `fixedTimestep.js` + Rapier `timeStep={1/60}` + ball `runFixedSteps` accumulator |
| **OOB guard** | `recoverBallIfOOB()` — silent snap back to track if ball escapes wheel bounds |
| **Settle watchdog** | 4s timeout in guided phase — force kinematic lock + lerp to winning pocket |
| **GPU disposal** | `disposeUtils.js` — unmount cleanup on shaders, ribbons, dust, god-rays, pin materials |
| **Audio deallocation** | `_scheduleVoiceTeardown()` + `destroy()` — disconnect oscillators after decay |

## God-Mode Pass

| Feature | Implementation |
|---------|----------------|
| **Quantum probability arc** | Plasma ribbon + pocket focus rings |
| **Ghost VIP lounge** | Deterministic holographic opponents |
| **Volumetric atmosphere** | God rays, lounge dust, ball friction vapor |

## Verification

- `node verify.js` — **180+** structural + math checks
- `npm run build` — zero warnings
