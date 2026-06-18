# ⛅ Skye — Weather App

A clean, fully-featured weather app built two ways: a standalone HTML file and a React component.

---

## What's included

```
weather-app/
├── weather-app.html        ← Drop-in standalone app (zero dependencies)
└── src/
    └── WeatherApp.jsx      ← React component version
```

---

## How to get your free API key

1. Go to [openweathermap.org](https://openweathermap.org)
2. Click **Sign Up** — no credit card needed
3. After signing in, go to **API Keys** in your account dashboard
4. Copy the default key (or generate a new one)
5. Paste it into the app's API Key field and click **Save**

**Free tier limits:** 1,000 calls/day · 60 calls/minute

---

## Using the standalone HTML file

Just open `weather-app.html` in any browser. No server needed.

To deploy it online (free):
- **GitHub Pages**: Push to a repo → Settings → Pages → Deploy from branch
- **Netlify**: Drag the file onto [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel**: Run `npx vercel` in the folder

---

## Using the React component

### 1. Install dependencies

```bash
npm create vite@latest my-weather-app -- --template react
cd my-weather-app
npm install
```

### 2. Copy the component

```bash
cp WeatherApp.jsx src/WeatherApp.jsx
```

### 3. Use it in your app

```jsx
// src/App.jsx
import WeatherApp from './WeatherApp'

export default function App() {
  return <WeatherApp />
}
```

### 4. Run

```bash
npm run dev
```

---

## How the app works — technical breakdown

### The two API endpoints

Every weather fetch makes two calls in parallel using `Promise.all`:

```js
const [wRes, fRes] = await Promise.all([
  fetch(`/weather?q=Lagos&appid=YOUR_KEY&units=metric`),
  fetch(`/forecast?q=Lagos&appid=YOUR_KEY&units=metric`)
]);
```

| Endpoint | What it returns |
|---|---|
| `/data/2.5/weather` | Current conditions: temp, humidity, wind, pressure, visibility, sunrise/sunset |
| `/data/2.5/forecast` | 40 data points, one every 3 hours, across 5 days |

### Temperature units

The app always fetches in Celsius (`units=metric`). Fahrenheit conversion happens in JavaScript, so you don't need a second API call:

```js
const toF = (c) => Math.round(c * 9 / 5 + 32);
```

Clicking the °C/°F toggle re-renders the UI with converted values — no network request.

### Geolocation

When the user clicks 📍, the browser asks for permission:

```js
navigator.geolocation.getCurrentPosition(
  (position) => {
    fetchWeather(`lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
  },
  (error) => {
    // User denied — show a friendly error
  }
);
```

The coordinates are passed directly to the API instead of a city name.

### Search history

History is stored in `localStorage` as a JSON array. Every successful search prepends the city to the array, deduplicated and capped at 8 entries:

```js
const updated = [entry, ...prev.filter(h => h !== entry)].slice(0, 8);
localStorage.setItem('skye_history', JSON.stringify(updated));
```

History chips appear instantly on page load — no API needed.

### Hourly forecast

The forecast endpoint returns 40 entries (8 per day × 5 days). The app takes the first 8 (next 24 hours) for the hourly strip:

```js
forecast.list.slice(0, 8)
```

### 5-day forecast

The remaining entries are grouped by weekday. For each day, the app tracks all high and low temperatures, then picks the max and min:

```js
const hi = Math.max(...data.hi);
const lo = Math.min(...data.lo);
```

### Day/night icons

The current weather response includes `sys.sunrise` and `sys.sunset` as Unix timestamps. The app compares `dt` (current time) to determine whether it's night and picks the appropriate emoji:

```js
const isNight = current.dt < current.sys.sunrise || current.dt > current.sys.sunset;
const icon = ICON_MAP[condition][isNight ? 1 : 0];
```

### Error handling

Every API call is wrapped in try/catch. The app handles:
- **Invalid API key** — 401 Unauthorized
- **City not found** — 404 Not Found
- **Network failure** — fetch throws
- **Geolocation denied** — `getCurrentPosition` error callback
- **Rate limit exceeded** — 429 Too Many Requests

Errors display for 4 seconds then auto-dismiss.

---

## Features at a glance

| Feature | Detail |
|---|---|
| Current weather | Temp, feels like, humidity, wind, pressure, visibility, cloud cover |
| Hourly forecast | Next 8 time slots (24 hours), scrollable |
| 5-day forecast | Daily high/low with weather icon |
| Unit toggle | Click °C/°F to switch without a new API call |
| Geolocation | One-tap "use my location" |
| Search history | Last 8 searches, persisted in localStorage |
| Day/night icons | Different emoji for day vs night |
| Raw API response | Collapsible developer panel |
| Responsive | Works on mobile down to 320px wide |

---

## Extending the app — ideas

- **Charts**: Plot the hourly temperature as a line chart using Chart.js or Recharts
- **Air quality**: Add the `/air_pollution` endpoint (same API, free tier)
- **Weather alerts**: OpenWeatherMap One Call API includes severe weather warnings
- **Maps**: Embed a weather radar using Windy's embed API
- **PWA**: Add a `manifest.json` and service worker for offline support and home screen install
- **Push notifications**: Use the Web Push API to alert on rain or severe weather
- **React Native**: The same fetch logic works unchanged — just replace the HTML elements with `<View>`, `<Text>`, `<TextInput>` etc.

---

## API response shape (simplified)

```json
{
  "name": "Lagos",
  "sys": { "country": "NG", "sunrise": 1700000000, "sunset": 1700043600 },
  "weather": [{ "main": "Clear", "description": "clear sky" }],
  "main": {
    "temp": 30.4,
    "feels_like": 34.1,
    "humidity": 78,
    "pressure": 1012
  },
  "wind": { "speed": 4.2 },
  "visibility": 10000,
  "clouds": { "all": 10 },
  "dt": 1700020000
}
```
