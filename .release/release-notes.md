## 🚀 Focus Timer for Workshops

### What's changed

A workshop countdown timer is built into Adobe Whiteboard as a fixed top-right overlay (`⏱ Timer`). Open the panel for **1 / 5 / 10 / 15 minute** presets, an optional custom duration (**≥1 minute**, no UI max), and **Start**, **Pause**, **Resume**, and **Reset**. The panel shows a large **MM:SS** readout while active; when time runs out it switches to a danger-colored **"Time's up"** state with an aria-live announcement (no toast or beep). The trigger label stays static — the live countdown appears only while the panel is open.

### User impact

Facilitators can time brainstorming, voting, and ideation blocks without leaving the board or switching to an external clock. The overlay sits above the canvas and does not block drawing or normal editing. Other collaborators do not see the timer unless the screen is shared.

### Technical notes

Implemented entirely in `excalidraw-app`: a self-contained `FocusTimer` fixed overlay mounted from `App.tsx` as a child of `<Excalidraw>` (not via `renderTopRightUI` / LayerUI chrome, so it is not gated by phone or zen-mode top-right hiding). Countdown logic uses a small reducer (idle → running → paused → expired) with wall-clock `endAt` timestamps and ~250ms ticks. Keyboard events in the custom duration field are stopped from propagating so canvas shortcuts are not triggered while typing. Timer state is **local-only** — not synced to collaborators and not persisted across reload.

### Testing

- **Unit:** `excalidraw-app/tests/FocusTimer.test.ts` — 6 tests for `formatRemaining` and start / pause / resume / reset / expiry transitions.
- **Manual:** Open Timer → 1m → Start → Pause → Resume → Reset; confirm canvas tools still work with the panel open; confirm expiry UI + live region.

### Known limitations

- Timer state is **not shared** with collaborators and is **not restored** on reload.
- Static "⏱ Timer" trigger (no live countdown on the button).
- Expiry is visual + screen-reader only (no toast or sound).
- English-only UI copy; custom minutes have no upper bound in the UI.
