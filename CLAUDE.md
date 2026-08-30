# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server (binds 0.0.0.0 for devcontainer access)
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm test           # Vitest watch mode
npx vitest run     # Run tests once (CI-style)
npx tsc --noEmit   # Type-check only, no output
```

## Architecture

**Stack:** React 19 + TypeScript + Vite + MUI v9 + vite-plugin-pwa

**Routing:** HashRouter (required for GitHub Pages at `base: '/pwa-clock/'`). Two routes: `/` → `Dashboard`, `/settings` → `Settings`.

**Provider tree** (outermost first):
```
SettingsProvider → ThemeWrapper → CssBaseline → UpdateBanner → HashRouter → OfflineBanner → Routes
```
`ThemeWrapper` reads `settings.displaySize` to rebuild the MUI theme dynamically and injects `SizeScaleContext`.

### Global state

- **`SettingsContext`** (`src/context/SettingsContext.tsx`) — all user preferences, persisted to `localStorage` under key `pwa-clock-settings`. Merges saved values with `DEFAULTS` so new fields auto-populate for existing users.
- **`SizeScaleContext`** (`src/context/SizeScaleContext.ts`) — a single `number` (0.85 / 1.0 / 1.2) derived from `displaySize`. Widgets consume it via `useSizeScale()` and multiply it into their `vw`-based font/icon sizes: `fontSize: { xs: \`${15 * scale}vw\`, sm: ..., md: ... }`.

### Widget system (Dashboard)

`WidgetConfig[]` maps widget IDs to a `SlotPosition` in a 3×3 grid (`top-left` … `bottom-right`). The array is persisted to `localStorage` under `dashboard_widget_layout_v3`.

**Adding a new widget requires 4 changes in `Dashboard.tsx`:**
1. Add `{ id, label, slot }` to `DEFAULT_LAYOUT`
2. Add a `case` to `WidgetRenderer`
3. Add visibility logic to `isWidgetVisible` (check the corresponding setting)
4. **Increment the storage key** (`v3` → `v4`) so existing saved layouts are re-seeded — the `loadLayout` validator requires every `DEFAULT_LAYOUT` id to be present.

Plus: add `show<Widget>: boolean` to `SettingsContext`, and a toggle in `Settings.tsx`.

### Japanese holidays

`@holiday-jp/holiday_jp` provides `holidaysData.between(start, end)` returning `{ date: Date, name: string }[]`. Used in `CalendarWidget` via the exported `getHolidaysForMonth` helper.

### PWA update flow

`registerType: 'prompt'` — the SW never auto-activates. `UpdateBanner.tsx` uses `useRegisterSW` to detect `needRefresh` and shows a manual "今すぐ更新" banner.

## Testing conventions

Tests live alongside their source files as `*.test.ts`. Only pure exported utility functions are tested (e.g. `formatTime`, `buildCalendarDays`, `swapWidgets`) — React components are not rendered in tests. `vitest.config.ts` aliases `virtual:pwa-register/react` to a local mock so PWA hooks don't break in jsdom.
