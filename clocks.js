const { useState, useEffect, useRef, useMemo } = React;
function useNow(intervalMs = 1e3) {
  const [now, setNow] = useState(() => /* @__PURE__ */ new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(/* @__PURE__ */ new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
function formatTime(date, tz) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  const parts = fmt.formatToParts(date);
  return {
    hour: parts.find((p) => p.type === "hour")?.value || "",
    minute: parts.find((p) => p.type === "minute")?.value || "",
    dayPeriod: parts.find((p) => p.type === "dayPeriod")?.value || ""
  };
}
function tzOffsetLabel(date, tz) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date).find((p) => p.type === "timeZoneName")?.value || tz;
}
const WMO = {
  0: { desc: "Clear sky", icon: "wSun" },
  1: { desc: "Mainly clear", icon: "wSun" },
  2: { desc: "Partly cloudy", icon: "wPartly" },
  3: { desc: "Overcast", icon: "wCloud" },
  45: { desc: "Fog", icon: "wCloud" },
  48: { desc: "Freezing fog", icon: "wCloud" },
  51: { desc: "Light drizzle", icon: "wRain" },
  53: { desc: "Drizzle", icon: "wRain" },
  55: { desc: "Heavy drizzle", icon: "wRain" },
  61: { desc: "Light rain", icon: "wRain" },
  63: { desc: "Rain", icon: "wRain" },
  65: { desc: "Heavy rain", icon: "wRain" },
  71: { desc: "Light snow", icon: "wSnow" },
  73: { desc: "Snow", icon: "wSnow" },
  75: { desc: "Heavy snow", icon: "wSnow" },
  80: { desc: "Rain showers", icon: "wRain" },
  81: { desc: "Rain showers", icon: "wRain" },
  82: { desc: "Heavy showers", icon: "wRain" },
  95: { desc: "Thunderstorm", icon: "wRain" },
  96: { desc: "Thunderstorm", icon: "wRain" },
  99: { desc: "Thunderstorm", icon: "wRain" }
};
const weatherCache = /* @__PURE__ */ new Map();
const CACHE_TTL = 30 * 60 * 1e3;
async function fetchWeatherData(city, units) {
  const key = city.trim().toLowerCase() + "|" + units;
  const hit = weatherCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&format=json`
  );
  const geoJson = await geoRes.json();
  if (!geoJson.results?.length) throw new Error(`City "${city}" not found`);
  const { latitude, longitude, name, country_code } = geoJson.results[0];
  const tUnit = units === "F" ? "fahrenheit" : "celsius";
  const wRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=${tUnit}&wind_speed_unit=mph&forecast_days=6&timezone=auto`
  );
  const w = await wRes.json();
  const cur = w.current;
  const daily = w.daily;
  const cond = WMO[cur.weather_code] || WMO[2];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const forecast = daily.time.slice(1, 6).map((dateStr, i) => {
    const d = /* @__PURE__ */ new Date(dateStr + "T12:00:00");
    const fc = WMO[daily.weather_code[i + 1]] || WMO[2];
    return { day: DAYS[d.getDay()], temp: Math.round(daily.temperature_2m_max[i + 1]), icon: fc.icon };
  });
  const data = {
    city: name + (country_code ? ", " + country_code.toUpperCase() : ""),
    temp: Math.round(cur.temperature_2m),
    desc: cond.desc,
    icon: cond.icon,
    hi: Math.round(daily.temperature_2m_max[0]),
    lo: Math.round(daily.temperature_2m_min[0]),
    humidity: cur.relative_humidity_2m,
    wind: Math.round(cur.wind_speed_10m),
    forecast
  };
  weatherCache.set(key, { data, ts: Date.now() });
  return data;
}
function ClocksPanel({ zones, onEditZones }) {
  const now = useNow(1e3);
  return /* @__PURE__ */ React.createElement("div", { className: "crt-panel clocks-panel" }, /* @__PURE__ */ React.createElement("span", { className: "crt-panel-label" }, "P1 \xB7 TIME"), /* @__PURE__ */ React.createElement("div", { className: "clocks-list" }, zones.map((z, i) => {
    const t = formatTime(now, z.tz);
    const off = tzOffsetLabel(now, z.tz);
    return /* @__PURE__ */ React.createElement("div", { key: z.id, className: "clock-row" + (i === 0 ? " primary" : "") }, /* @__PURE__ */ React.createElement("div", { className: "clock-meta" }, /* @__PURE__ */ React.createElement("span", { className: "clock-label" }, z.label), /* @__PURE__ */ React.createElement("span", { className: "clock-off" }, off)), /* @__PURE__ */ React.createElement("div", { className: "clock-time" }, t.hour, ":", t.minute, /* @__PURE__ */ React.createElement("span", { className: "period" }, t.dayPeriod)));
  })), /* @__PURE__ */ React.createElement("button", { className: "clocks-edit", onClick: onEditZones }, "+ EDIT ZONES"));
}
function WeatherPanel({ city, units, onToggleUnits, onEditCity }) {
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errMsg, setErrMsg] = useState("");
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchWeatherData(city, units).then((data) => {
      if (!cancelled) {
        setWeather(data);
        setStatus("ok");
      }
    }).catch((err) => {
      if (!cancelled) {
        setErrMsg(err.message);
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [city, units]);
  if (status === "loading") return /* @__PURE__ */ React.createElement("div", { className: "crt-panel weather-panel" }, /* @__PURE__ */ React.createElement("span", { className: "crt-panel-label" }, "P2 \xB7 WEATHER"), /* @__PURE__ */ React.createElement("div", { className: "weather-status" }, "Fetching weather\u2026"));
  if (status === "error") return /* @__PURE__ */ React.createElement("div", { className: "crt-panel weather-panel" }, /* @__PURE__ */ React.createElement("span", { className: "crt-panel-label" }, "P2 \xB7 WEATHER"), /* @__PURE__ */ React.createElement("div", { className: "weather-status weather-err" }, errMsg), /* @__PURE__ */ React.createElement("button", { className: "weather-city", onClick: onEditCity }, /* @__PURE__ */ React.createElement(Icon.pin, { size: 10 }), " Change city"));
  const IconCmp = Icon[weather.icon] || Icon.wSun;
  return /* @__PURE__ */ React.createElement("div", { className: "crt-panel weather-panel" }, /* @__PURE__ */ React.createElement("span", { className: "crt-panel-label" }, "P2 \xB7 WEATHER"), /* @__PURE__ */ React.createElement("div", { className: "weather-main-row" }, /* @__PURE__ */ React.createElement("div", { className: "weather-icon-block" }, /* @__PURE__ */ React.createElement(IconCmp, { size: 36 })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { className: "weather-temp" }, weather.temp, /* @__PURE__ */ React.createElement("span", { className: "unit" }, "\xB0", units), /* @__PURE__ */ React.createElement("button", { className: "weather-unit-toggle", onClick: onToggleUnits, title: "Toggle \xB0F/\xB0C" }, "\xB0", units === "F" ? "C" : "F")), /* @__PURE__ */ React.createElement("div", { className: "weather-desc" }, weather.desc))), /* @__PURE__ */ React.createElement("div", { className: "weather-hilo" }, /* @__PURE__ */ React.createElement("span", null, "HI ", /* @__PURE__ */ React.createElement("b", null, weather.hi, "\xB0")), /* @__PURE__ */ React.createElement("span", null, "LO ", /* @__PURE__ */ React.createElement("b", null, weather.lo, "\xB0")), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Icon.wDrop, { size: 12 }), " ", weather.humidity, "%"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(Icon.wWind, { size: 12 }), " ", weather.wind, "mph")), /* @__PURE__ */ React.createElement("button", { className: "weather-city", onClick: onEditCity }, /* @__PURE__ */ React.createElement(Icon.pin, { size: 10 }), " ", weather.city), weather.forecast.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "weather-forecast" }, weather.forecast.map((f, i) => {
    const FC = Icon[f.icon] || Icon.wSun;
    return /* @__PURE__ */ React.createElement("div", { key: i, className: "forecast-day" }, /* @__PURE__ */ React.createElement("span", { className: "forecast-label" }, f.day), /* @__PURE__ */ React.createElement(FC, { size: 14 }), /* @__PURE__ */ React.createElement("span", { className: "forecast-temp" }, f.temp, "\xB0"));
  })));
}
window.ClocksPanel = ClocksPanel;
window.WeatherPanel = WeatherPanel;
window.useNow = useNow;
window.formatTime = formatTime;
window.tzOffsetLabel = tzOffsetLabel;
