# Macro Tracker

A self-hosted food & macro tracking **PWA** — scan barcodes, log what you eat,
weigh in, and get an **adaptive calorie/macro target** that learns your real
energy expenditure over time.

Built from scratch, from publicly-documented sport-science methodology. No
third-party app code is used or reverse-engineered.

## Features

- **📷 Barcode scanning** — camera-based, works on iOS Safari and Android
  (ZXing). Looks products up in [Open Food Facts](https://world.openfoodfacts.org/)
  (free, ~3M products, no key).
- **🔍 Search & manual logging** — Open Food Facts text search, optional
  [USDA FoodData Central](https://fdc.nal.usda.gov/) for generic foods, and a
  custom-food quick-add.
- **⚖️ Adaptive expenditure** — back-calculates your TDEE from logged intake and
  a smoothed weight trend (energy-balance method). Seeds with a Mifflin–St Jeor
  prior and converges as you log, over ~2–3 weeks.
- **🎯 Macro targets** — pick a weekly rate (cut/maintain/gain); it derives
  calories and a protein/fat/carb split.
- **📈 Trends** — weight + smoothed trend line, and daily intake vs. estimated
  expenditure.
- **📸 Photo → calories** — scaffolded and toggleable; the vision model is a
  stub to be wired up later (portion-from-photo is inherently approximate).
- **Local-first** — all data lives in your browser (`localStorage`); export /
  import JSON to back up or move devices. Installable to your home screen.

## How the adaptive estimate works

Rearranged energy balance:

```
Calories In − Calories Out = Δ stored energy
      →  Expenditure = mean daily intake − (Δ trend-weight × 7700 kcal/kg) / days
```

The weight **trend** (an exponentially-weighted moving average) filters out
day-to-day noise from sodium, glycogen and gut contents. Until enough data
accumulates, the estimate is blended with a Mifflin–St Jeor × activity prior,
weighted by how many days you've logged.

Estimates are first-order approximations for personal use, **not medical
advice**.

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # coaching-math unit tests
npm run build      # production build (dist/)
npm run preview    # serve the production build
```

Requires Node 22+.

## Tech

React + TypeScript + Vite, `vite-plugin-pwa` (offline + installable),
`zustand` for state, hand-rolled SVG charts.
