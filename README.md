# ⛅ Skye Weather App

A clean, responsive weather app built with React and Vite. Search any city in the world and get real-time weather, hourly forecasts, and a 5-day outlook — all in a beautiful UI.

![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![OpenWeatherMap](https://img.shields.io/badge/API-OpenWeatherMap-orange)

---

## Features

- 🌡️ Current temperature, feels like, humidity, wind, pressure, visibility
- 🕐 Hourly forecast for the next 24 hours
- 📅 5-day forecast with daily highs and lows
- 📍 One-tap location detection
- 🔄 Celsius / Fahrenheit toggle
- 🕘 Search history (last 8 cities, saved in browser)
- 🌙 Day / night weather icons
- 📱 Fully responsive — works on mobile and desktop

---

## Live Demo

🔗 [skye-weather-app-livid.vercel.app]

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Harehood100/skye-weather-app.git
cd skye-weather-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Get a free API key

1. Go to [openweathermap.org](https://openweathermap.org) and sign up
2. Go to **API Keys** in your account dashboard
3. Copy your key (activates within ~2 hours of signup)

Free tier includes 1,000 calls/day — no credit card needed.

### 4. Set up your environment variable

Create a `.env` file in the root of the project:

```
VITE_WEATHER_KEY=your_api_key_here
```

> ⚠️ Never commit this file to GitHub. It's already listed in `.gitignore`.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **Add New → Project** and import your repository
4. Under **Environment Variables**, add:
   - Name: `VITE_WEATHER_KEY`
   - Value: your API key
5. Click **Deploy**

Every future `git push` will automatically redeploy.

---

## Deploying to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign in with GitHub
3. Click **Add new site → Import an existing project**
4. Select your repository
5. Set build command to `npm run build` and publish directory to `dist`
6. Under **Environment variables**, add `VITE_WEATHER_KEY` with your API key
7. Click **Deploy site**

---

## Project Structure

```
skye-weather-app/
├── src/
│   ├── WeatherApp.jsx    # Main app component
│   └── main.jsx          # React entry point
├── public/
├── .env                  # Your API key (never commit this)
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## How It Works

**Two API calls run in parallel on every search:**

```js
const [weather, forecast] = await Promise.all([
  fetch(`/weather?q=Lagos&appid=KEY&units=metric`),
  fetch(`/forecast?q=Lagos&appid=KEY&units=metric`)
]);
```

| Endpoint | Returns |
|---|---|
| `/weather` | Current conditions |
| `/forecast` | 40 data points across 5 days (every 3 hours) |

**Unit conversion happens in JavaScript — no extra API call:**
```js
const toFahrenheit = (c) => Math.round(c * 9 / 5 + 32);
```

**Geolocation uses the browser's built-in API:**
```js
navigator.geolocation.getCurrentPosition((position) => {
  fetchWeather(`lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
});
```

**Search history is persisted in localStorage:**
```js
localStorage.setItem('skye_history', JSON.stringify(history));
```

---

## Built With

- [React](https://react.dev) — UI framework
- [Vite](https://vitejs.dev) — Build tool
- [OpenWeatherMap API](https://openweathermap.org/api) — Weather data

---

## License

MIT — feel free to use and modify for your own projects.