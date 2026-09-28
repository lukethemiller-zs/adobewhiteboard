## 🚀 Workshop Focus Timer

### What's changed

A local countdown timer is available from the top-right UI for workshop facilitators:

- **Timer** button opens a setup panel with presets **1 / 5 / 10 / 15** minutes, or a custom duration (≥1 minute, no UI max)
- After Start, a non-blocking **m:ss** badge shows remaining time with **Pause / Resume / Reset**
- Countdown uses an end timestamp (250ms ticks) so brief tab backgrounding does not skew the clock
- At zero, the badge flashes an expired state and shows a **"Time's up!"** toast via `excalidrawAPI.setToast`
- Always mounted in `renderTopRightUI` (including phone and when collab UI is hidden); collab promo/errors/live-collab controls remain gated separately

### User impact

Facilitators can run timed workshop segments without leaving the canvas or switching apps. The badge stays out of the way of editing, and Pause/Resume/Reset keep session control on the board.

### Technical notes

New `FocusTimer` + `FocusTimer.scss` in `excalidraw-app/components`, wired from `App.tsx` `renderTopRightUI`. State is local React only (not collaborative, not persisted). Idle trigger label is static **"Timer"**; remaining time appears only on the active badge.

### Testing

- Added `excalidraw-app/tests/FocusTimer.test.tsx` — **7** cases covering `formatRemaining`, panel open, preset start/tick, pause/resume, reset, expiry toast + expired badge, and a single widget instance

### Known limitations

- Timer state is **local-only** (not synced to collaborators, not restored on reload)
- Zen mode slides the top-right chrome away, so the timer is hidden while zen mode is on
- UI copy is English-only ("Timer", "Time's up!", controls)
- Custom minutes have no upper bound in the UI (values ≤0 are rejected)
- Expiry is toast + visual flash only (no sound)
