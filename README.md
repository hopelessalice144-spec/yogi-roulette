# Yogi Roulette (GameFi 3D)

European roulette as a live-synced **React Three Fiber + Rapier** GameFi experience — elite production graphics.

## Quick start

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

## Verify

```bash
npm test        # 50 architecture + math checks
npm run build   # production build (zero errors)
```

## Elite features

- **PCFSoftShadowMap** + AgX tone mapping + HDR studio IBL
- **Shared MaterialLibrary** — minimized material swaps / draw-call pressure
- **Ivory SSS ball** — custom shader subsurface scattering
- **Hybrid physics** — orbital path → Rapier drop → magnetic pocket guide
- **Collision camera shake** — scaled to Rapier impact velocity
- **Spindle wobble** — mechanical weight on spin-up / spin-down
- **AdaptiveDpr / AdaptiveEvents** — 60 FPS on mobile, max quality on desktop
- **UI→3D highlight** — hover a bet sector, matching wheel pockets glow neon in real-time

Legacy v1 vanilla build: `/legacy`
