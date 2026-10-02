## 🚀 DefaultSidebar Search/Library accessible names

### What's changed
Search and Library sidebar tab triggers now expose unique accessible names (`aria-label`) and stable `data-testid`s. Labels reuse existing i18n strings (`search.title`, `toolBar.library`).

### User impact
Screen reader and other assistive-tech users can distinguish the icon-only Search and Library tabs. Previously those triggers had no accessible name because the icons are `aria-hidden`.

### Technical notes
Minimal change in `packages/excalidraw/components/DefaultSidebar.tsx`: export `DEFAULT_SIDEBAR_TAB_LABEL_KEYS`, set `aria-label` / `data-testid` on the two `Sidebar.TabTrigger`s. No behavior or layout changes.

### Testing
Focused Vitest: `packages/excalidraw/components/DefaultSidebar.test.tsx` — 8/8 passed, including a new assertion for unique Search/Library accessible names.

### Known limitations
Does not change AppSidebar Comments/Presentation tabs (covered separately by open PR #66).
