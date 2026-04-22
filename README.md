# UV-Index App

A mobile-first web app that shows your current UV index, personalised sun exposure times based on your skin type, and an hourly UV forecast chart for the day.

Created in collaboration with [Sandra Löfgren
](https://github.com/sanlof) and [Claude](https://github.com/claude) using a photo of a pen and paper sketch and a simple prompt to get started.

The UI is in Swedish. No build step — open `index.html` in a browser or serve it with any static file server.

## Features

- **Current UV index** with an animated ring indicator and colour-coded severity levels (Low → Extreme)
- **Skin type selector** — six Fitzpatrick scale types (I–VI) with WHO-based MED values
- **Burn time estimates** for direct sun, partial shade, and full shade
- **Hourly chart** (Chart.js) with peak UV annotation and a "now" marker
- **Automatic location** via the browser Geolocation API, with reverse geocoding through Nominatim/OpenStreetMap
- Falls back to Stockholm if geolocation is denied or unavailable

## Usage

```sh
# No install needed. Just open the file:
open index.html

# Or serve with any static server, e.g.:
npx serve .
python3 -m http.server
```

Geolocation requires a secure context (HTTPS or `localhost`). Opening the file directly via `file://` may prompt a browser warning.

## APIs used

| Service                                          | Purpose           | Cost       |
| ------------------------------------------------ | ----------------- | ---------- |
| [uvindexapi.com](https://uvindexapi.com)         | UV index forecast | Free tier  |
| [Nominatim](https://nominatim.openstreetmap.org) | Reverse geocoding | Free (OSM) |

No API key is required. The UV API is called client-side.

## Project structure

```
index.html   — markup and layout
main.js      — data fetching, Chart.js rendering, UI logic
style.css    — all styles (mobile-first, max-width 430 px)
```

## Skin type burn time calculation

Burn times follow the WHO Fitzpatrick scale MED (minimal erythemal dose) values. Given a skin type's base MED in minutes at UV index 1:

```
burn_time = base_MED / current_UV
```

Shade multipliers: partial shade ×2.5 (~40% UV transmission), full shade ×6 (~17% UV transmission).

## License

MIT
