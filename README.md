# vela ui

The editor UI for vela: React + Tailwind, styled after Linear. Inter for UI,
JetBrains Mono for the editor, 8px grid, 6px radius, accent #6366F1, no gradients,
no shadows, lucide-react icons.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/
```

## Layout

- **Top bar** — `vela` mark left; right: Quality/Perf pill, dark-mode toggle, New / Open / Save
- **Tab bar** — one tab per open file, click to switch, × to close (the last tab is never removed, a fresh one takes its place)
- **Editor** — monospace 16px / line-height 1.6, no wrap
- **Status bar** — line:col, char count, file size, current mode

## Quality vs Perf

Persisted in `localStorage` (`vela.prefs`), default **Quality**.

**Quality** — liquid glass on the top bar and tab bar (`backdrop-filter: blur(20px) saturate(1.4)`, `rgba(255,255,255,0.6)` light / `rgba(18,18,22,0.6)` dark, 1px light border), 200ms ease hover/focus transitions, 150ms fade + 4px slide-up on tab switch, `scale(0.96)` press feedback, thin rounded scrollbar with a soft hover glow.

**Perf** — no animation, no transition, no `backdrop-filter`, solid backgrounds, instant state changes. Same features.

Driven by two things only: a `--transition-duration` custom property (200ms / 0ms) and a `.quality` class on `<html>` gating the glass rules. No animation libraries. The editor `<textarea>` never receives `backdrop-filter`.

## Shortcuts

`Ctrl+N` new · `Ctrl+O` open · `Ctrl+S` save. Minimum width 1024px.
