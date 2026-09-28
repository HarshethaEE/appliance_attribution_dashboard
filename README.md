# Appliance Attribution Dashboard

A light-theme React dashboard for the half-hourly induction/EV load
attribution output, with a consumer + day picker, a donut chart of
energy split, a stacked half-hourly load chart, and an expandable
reasoning panel for flagged induction usage.

## Files

- `ApplianceAttributionDashboard.jsx` — the component. Default export,
  no required props. Uses `recharts` for both charts.
- `consumerData.js` — all consumer output lives here, separate from
  the UI. Two consumers are pre-loaded.

## Adding new consumer output

**Option A — from the app (no code editing):** click "Add consumer
JSON file(s)" at the top of the page and pick one or more
`*_manual_filled_days.json` files (or any file in that same shape).
Each is parsed and merged in by its own `scno` right away — if you
pick multiple days for the same `scno` across files, they're merged
into that one consumer's `days`.

**Option B — bake it into the app's starting data:** open
`consumerData.js` and find the block titled
`PASTE NEW CONSUMER OUTPUT HERE`. Paste each new consumer's raw JSON
straight into the `RAW_NEW_CONSUMERS` array, exactly as the pipeline
emits it — no reformatting needed:

```js
const RAW_NEW_CONSUMERS = [
  { "scno": "...", "days": { "2026-08-01": { "slots": [ /* ... */ ] } } },
];
```

Either path accepts a slot with or without an `actual_kw` field —
when present it's used directly; otherwise the `kw=` value is parsed
out of the `reasoning` text as a fallback. If a `scno` matches a
consumer that's already loaded, its days are merged in rather than
replacing that consumer.

## Requirements

- `react` (hooks: `useState`, `useMemo`)
- `recharts`

## Use

```jsx
import ApplianceAttributionDashboard from "./ApplianceAttributionDashboard";

export default function App() {
  return <ApplianceAttributionDashboard />;
}
```
