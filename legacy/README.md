# Turbo Roulette

Client-side European roulette with a **30-second live-synced** clock (`unixSeconds % 30`), fake money, and LocalStorage balances.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx --yes serve .
```

Then visit the printed URL (usually `http://localhost:3000`).

## Modules

| File | Role |
|------|------|
| `game.js` | Wheel spin math & payouts |
| `timer.js` | Wall-clock phase sync |
| `bets.js` | Chip stacking & cycle-seeded spins |
| `storage.js` | Balance + faucet (LocalStorage) |
| `ui.js` | Betting board UI |
| `app.js` | Round orchestration |

## Verify

```bash
node verify.js
```
