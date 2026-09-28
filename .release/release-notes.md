## 🚀 Workshop Focus Timer

### What's changed

Adds a local **Focus Timer** for workshop facilitators. A top-right **⏱ Timer** control (mounted as an absolute overlay in `App.tsx`) opens a floating panel with:

- Presets: **1 / 5 / 10 / 15** minutes
- Custom duration: **1–999** minutes
- **Start / Pause / Resume / Reset** (duration locked while running or paused)
- Countdown display as **`MM:SS`**
- Expiry: panel display pulses in danger color, trigger gets an expired outline, and an `aria-live` **"Time's up"** announcement (no toast, no beep)
- Keyboard: **Shift+Ctrl/Cmd+T** toggles the panel (ignored when focus is in an editable field)
- Pointer events are stopped on the control so canvas editing is unaffected

All timer state is **local React state only** — not synced to collaborators and not persisted across reload.

### User impact

Facilitators can run a visible countdown during workshops without leaving the whiteboard or disrupting drawing. Participants on other clients do not see the timer unless the facilitator shares their screen.

### Technical notes

- New `FocusTimer.tsx` / `FocusTimer.scss`; mounted next to `AppFooter` in `App.tsx` (not via `renderTopRightUI`)
- Wall-clock end time + 250ms tick while running
- `formatTime` helper covered by unit tests

### Testing

- **5** unit tests in `FocusTimer.test.tsx` covering `formatTime` (zero, sub-minute, minutes+seconds, ceil partial seconds, negative clamp)
- Manual: open panel, presets/custom, start/pause/resume/reset, expiry styling + live region, shortcut, confirm canvas still editable

### Known limitations

- Timer is **local-only** (not collaborative, not persisted)
- Trigger label is static **"⏱ Timer"** (no live countdown on the button)
- UI strings are **English-only**
- Expiry is visual + screen-reader only (no toast or sound)
