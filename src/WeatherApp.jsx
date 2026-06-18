// WeatherApp.jsx — React component
// Usage: import WeatherApp from './WeatherApp'
// Install: npm install react react-dom
// API key: get a free key at openweathermap.org

import { useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_MAP = {
    Clear: ["☀️", "🌙"],
    Clouds: ["☁️", "☁️"],
    Rain: ["🌧️", "🌧️"],
    Drizzle: ["🌦️", "🌦️"],
    Thunderstorm: ["⛈️", "⛈️"],
    Snow: ["❄️", "❄️"],
    Mist: ["🌫️", "🌫️"],
    Fog: ["🌫️", "🌫️"],
    Haze: ["🌫️", "🌫️"],
};

const API_BASE = "https://api.openweathermap.org/data/2.5";

// ─── Utility helpers ──────────────────────────────────────────────────────────

const toF = (c) => Math.round(c * 9 / 5 + 32);
const fmtTemp = (c, isCelsius) => (isCelsius ? Math.round(c) : toF(c));
const unitLabel = (isCelsius) => (isCelsius ? "°C" : "°F");
const getIcon = (condition, isNight = false) =>
    (ICON_MAP[condition] ?? ["🌤️", "🌤️"])[isNight ? 1 : 0];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaStat({ label, value }) {
    return (
        <div style={styles.stat}>
            <div style={styles.statLabel}>{label}</div>
            <div style={styles.statVal}>{value}</div>
        </div>
    );
}

function HourlyCard({ item, isCelsius }) {
    const time = new Date(item.dt * 1000).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });
    return (
        <div style={styles.hrCard}>
            <div style={styles.hrTime}>{time}</div>
            <div style={styles.hrIcon}>{getIcon(item.weather[0].main)}</div>
            <div style={styles.hrTemp}>
                {fmtTemp(item.main.temp, isCelsius)}{unitLabel(isCelsius)}
            </div>
        </div>
    );
}

function ForecastCard({ day, data, isCelsius }) {
    const hi = fmtTemp(Math.max(...data.hi), isCelsius);
    const lo = fmtTemp(Math.min(...data.lo), isCelsius);
    const u = unitLabel(isCelsius);
    return (
        <div style={styles.fcCard}>
            <div style={styles.fcDay}>{day}</div>
            <div style={styles.fcIcon}>{getIcon(data.icons[0])}</div>
            <div style={styles.fcHi}>{hi}{u}</div>
            <div style={styles.fcLo}>{lo}{u}</div>
        </div>
    );
}

function HistoryChip({ label, onClick }) {
    return (
        <button onClick={onClick} style={styles.chip}>
            {label}
        </button>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WeatherApp() {
    const apiKey = import.meta.env.VITE_WEATHER_KEY;
    const [cityInput, setCityInput] = useState("");
    const [current, setCurrent] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [isCelsius, setIsCelsius] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [history, setHistory] = useState(
        () => JSON.parse(localStorage.getItem("skye_history") || "[]")
    );

    // Flash helper
    const flash = (setter, msg) => {
        setter(msg);
        setTimeout(() => setter(""), 4000);
    };



    // Add to search history
    const addHistory = useCallback((entry) => {
        setHistory((prev) => {
            const updated = [entry, ...prev.filter((h) => h !== entry)].slice(0, 8);
            localStorage.setItem("skye_history", JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Core fetch logic
    const fetchWeather = useCallback(async (query) => {
        const key = apiKey || localStorage.getItem("skye_key");
        if (!key) { flash(setError, "Add your API key first."); return; }
        setLoading(true);
        setCurrent(null);
        setForecast(null);
        try {
            const [wRes, fRes] = await Promise.all([
                fetch(`${API_BASE}/weather?${query}&appid=${key}&units=metric`),
                fetch(`${API_BASE}/forecast?${query}&appid=${key}&units=metric`),
            ]);
            if (!wRes.ok) {
                const err = await wRes.json();
                throw new Error(err.message || "City not found");
            }
            const w = await wRes.json();
            const f = await fRes.json();
            setCurrent(w);
            setForecast(f);
            setIsCelsius(true);
            addHistory(`${w.name}, ${w.sys.country}`);
        } catch (e) {
            flash(setError, e.message);
        } finally {
            setLoading(false);
        }
    }, [apiKey, addHistory]);

    const handleSearch = () => {
        if (!cityInput.trim()) { flash(setError, "Enter a city name."); return; }
        fetchWeather(`q=${encodeURIComponent(cityInput)}`);
    };

    const handleGeo = () => {
        if (!navigator.geolocation) { flash(setError, "Geolocation not supported."); return; }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (p) => fetchWeather(`lat=${p.coords.latitude}&lon=${p.coords.longitude}`),
            () => { setLoading(false); flash(setError, "Location denied. Search by city instead."); }
        );
    };

    // Build 5-day forecast groups
    const forecastDays = forecast
        ? (() => {
            const days = {};
            forecast.list.forEach((item) => {
                const day = new Date(item.dt * 1000).toLocaleDateString("en-GB", { weekday: "short" });
                if (!days[day]) days[day] = { hi: [], lo: [], icons: [] };
                days[day].hi.push(item.main.temp_max);
                days[day].lo.push(item.main.temp_min);
                days[day].icons.push(item.weather[0].main);
            });
            return Object.entries(days).slice(0, 5);
        })()
        : [];

    const isNight = current
        ? current.dt < current.sys.sunrise || current.dt > current.sys.sunset
        : false;

    return (
        <div style={styles.root}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.logo}>⛅ Skye</div>
                <div style={styles.tagline}>Elegant weather at a glance</div>
            </div>

            {/* Search */}
            <div style={styles.row}>
                <input
                    type="text"
                    placeholder="Search city e.g. Lagos, London, Tokyo…"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    style={{ ...styles.input, fontSize: 15 }}
                />
                <button onClick={handleSearch} style={styles.btn}>Search</button>
                <button onClick={handleGeo} style={styles.btnSecondary} title="Use my location">📍</button>
            </div>

            {/* History chips */}
            {history.length > 0 && (
                <div style={styles.chipRow}>
                    {history.map((h) => (
                        <HistoryChip
                            key={h}
                            label={h}
                            onClick={() => {
                                setCityInput(h.split(",")[0].trim());
                                fetchWeather(`q=${encodeURIComponent(h.split(",")[0].trim())}`);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Alerts */}
            {error && <div style={styles.alertError}>{error}</div>}
            {info && <div style={styles.alertInfo}>{info}</div>}
            {loading && <div style={styles.spinner}>Fetching weather…</div>}

            {/* Current weather card */}
            {current && (
                <div style={styles.weatherCard}>
                    <div style={styles.wcLocation}>{current.name}, {current.sys.country}</div>
                    <div style={styles.wcDate}>
                        {new Date(current.dt * 1000).toLocaleDateString("en-GB", {
                            weekday: "long", day: "numeric", month: "long", year: "numeric",
                        })}
                    </div>
                    <div style={styles.wcMain}>
                        <div>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                                <div style={styles.wcTemp}>{fmtTemp(current.main.temp, isCelsius)}</div>
                                <div style={styles.wcUnit} onClick={() => setIsCelsius(!isCelsius)} title="Click to switch units">
                                    {unitLabel(isCelsius)}
                                </div>
                            </div>
                            <div style={styles.wcDesc}>{current.weather[0].description}</div>
                        </div>
                        <div style={styles.wcIcon}>{getIcon(current.weather[0].main, isNight)}</div>
                    </div>
                    <div style={styles.statsGrid}>
                        <MetaStat label="Feels like" value={`${fmtTemp(current.main.feels_like, isCelsius)}${unitLabel(isCelsius)}`} />
                        <MetaStat label="Humidity" value={`${current.main.humidity}%`} />
                        <MetaStat label="Wind" value={`${Math.round(current.wind.speed)} m/s`} />
                        <MetaStat label="Pressure" value={`${current.main.pressure} hPa`} />
                        <MetaStat label="Visibility" value={current.visibility ? `${(current.visibility / 1000).toFixed(1)} km` : "N/A"} />
                        <MetaStat label="Clouds" value={`${current.clouds.all}%`} />
                    </div>
                </div>
            )}

            {/* Hourly */}
            {forecast && (
                <>
                    <div style={styles.sectionTitle}>Next 24 hours</div>
                    <div style={styles.hourlyScroll}>
                        {forecast.list.slice(0, 8).map((item) => (
                            <HourlyCard key={item.dt} item={item} isCelsius={isCelsius} />
                        ))}
                    </div>
                </>
            )}

            {/* 5-day forecast */}
            {forecastDays.length > 0 && (
                <>
                    <div style={styles.sectionTitle}>5-day forecast</div>
                    <div style={styles.forecastGrid}>
                        {forecastDays.map(([day, data]) => (
                            <ForecastCard key={day} day={day} data={data} isCelsius={isCelsius} />
                        ))}
                    </div>
                </>
            )}

            {/* Raw JSON */}
            {current && (
                <details style={{ marginTop: 8 }}>
                    <summary style={styles.hint}>Raw API response (for developers)</summary>
                    <pre style={styles.pre}>{JSON.stringify(current, null, 2)}</pre>
                </details>
            )}
        </div>

    );
}
const styles = {
    root: { maxWidth: 540, margin: "0 auto", padding: "24px 16px 48px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#0f172a" },
    header: { textAlign: "center", marginBottom: 28 },
    logo: { fontSize: 28, fontWeight: 700, color: "#1a6cf4", letterSpacing: -0.5 },
    tagline: { fontSize: 13, color: "#64748b", marginTop: 2 },
    setupCard: { background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 4px 24px rgba(26,108,244,0.10)" },
    sectionLabel: { fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 },
    sectionTitle: { fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, marginTop: 8 },
    row: { display: "flex", gap: 8, marginBottom: 16 },
    input: { flex: 1, height: 42, padding: "0 14px", background: "#f1f5f9", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 14, color: "#0f172a", outline: "none" },
    btn: { height: 42, padding: "0 18px", background: "#1a6cf4", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" },
    btnSecondary: { height: 42, padding: "0 14px", background: "#f1f5f9", color: "#1a6cf4", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 16, cursor: "pointer" },
    hint: { fontSize: 12, color: "#64748b", marginTop: 8 },
    link: { color: "#1a6cf4" },
    chipRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 },
    chip: { background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 20, padding: "5px 14px", fontSize: 13, color: "#1a6cf4", cursor: "pointer" },
    alertError: { padding: "12px 16px", borderRadius: 10, fontSize: 14, marginBottom: 12, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },
    alertInfo: { padding: "12px 16px", borderRadius: 10, fontSize: 14, marginBottom: 12, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" },
    spinner: { textAlign: "center", padding: 20, color: "#64748b", fontSize: 14 },
    weatherCard: {
        background: "linear-gradient(135deg, #1a6cf4 0%, #0d3fa3 100%)",
        borderRadius: 16, padding: "28px 24px 24px", color: "#fff",
        marginBottom: 12, boxShadow: "0 4px 24px rgba(26,108,244,0.25)",
    },
    wcLocation: { fontSize: 15, opacity: 0.85, marginBottom: 4 },
    wcDate: { fontSize: 13, opacity: 0.65, marginBottom: 20 },
    wcMain: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
    wcTemp: { fontSize: 64, fontWeight: 300, lineHeight: 1 },
    wcUnit: { fontSize: 24, fontWeight: 400, opacity: 0.7, cursor: "pointer", marginTop: 8 },
    wcDesc: { fontSize: 16, opacity: 0.9, marginTop: 8, textTransform: "capitalize" },
    wcIcon: { fontSize: 64, lineHeight: 1 },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 20 },
    stat: { background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 12px" },
    statLabel: { fontSize: 11, opacity: 0.7, marginBottom: 3 },
    statVal: { fontSize: 15, fontWeight: 600 },
    hourlyScroll: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16, scrollbarWidth: "none" },
    hrCard: { background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 64, flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
    hrTime: { fontSize: 11, color: "#64748b", marginBottom: 4 },
    hrIcon: { fontSize: 18, marginBottom: 4 },
    hrTemp: { fontSize: 14, fontWeight: 600, color: "#0f172a" },
    forecastGrid: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 },
    fcCard: { background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "12px 6px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
    fcDay: { fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 },
    fcIcon: { fontSize: 22, marginBottom: 6 },
    fcHi: { fontSize: 14, fontWeight: 600, color: "#0f172a" },
    fcLo: { fontSize: 12, color: "#64748b" },
    pre: { background: "#f1f5f9", borderRadius: 10, padding: 14, fontFamily: "monospace", fontSize: 11, color: "#64748b", overflowX: "auto", maxHeight: 300, overflowY: "auto", whiteSpace: "pre-wrap" },
};