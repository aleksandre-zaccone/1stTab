// ============================
// Clocks panel (left) + Weather panel (right)
// Weather uses Open-Meteo — free, no API key required.
// ============================
var { useState, useEffect, useRef, useMemo, useCallback } = React;

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function formatTime(date, tz) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true,
  });
  const parts = fmt.formatToParts(date);
  return {
    hour:      parts.find(p => p.type === 'hour')?.value      || '',
    minute:    parts.find(p => p.type === 'minute')?.value    || '',
    dayPeriod: parts.find(p => p.type === 'dayPeriod')?.value || '',
  };
}
function tzOffsetLabel(date, tz) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value || tz;
}

// ── Weather API (Open-Meteo) ─────────────────────────────────────────────────
const WMO = {
  0:  { desc: 'Clear sky',      icon: 'wSun'    },
  1:  { desc: 'Mainly clear',   icon: 'wSun'    },
  2:  { desc: 'Partly cloudy',  icon: 'wPartly' },
  3:  { desc: 'Overcast',       icon: 'wCloud'  },
  45: { desc: 'Fog',            icon: 'wCloud'  },
  48: { desc: 'Freezing fog',   icon: 'wCloud'  },
  51: { desc: 'Light drizzle',  icon: 'wRain'   },
  53: { desc: 'Drizzle',        icon: 'wRain'   },
  55: { desc: 'Heavy drizzle',  icon: 'wRain'   },
  61: { desc: 'Light rain',     icon: 'wRain'   },
  63: { desc: 'Rain',           icon: 'wRain'   },
  65: { desc: 'Heavy rain',     icon: 'wRain'   },
  71: { desc: 'Light snow',     icon: 'wSnow'   },
  73: { desc: 'Snow',           icon: 'wSnow'   },
  75: { desc: 'Heavy snow',     icon: 'wSnow'   },
  80: { desc: 'Rain showers',   icon: 'wRain'   },
  81: { desc: 'Rain showers',   icon: 'wRain'   },
  82: { desc: 'Heavy showers',  icon: 'wRain'   },
  95: { desc: 'Thunderstorm',   icon: 'wRain'   },
  96: { desc: 'Thunderstorm',   icon: 'wRain'   },
  99: { desc: 'Thunderstorm',   icon: 'wRain'   },
};
const weatherCache = new Map();
const CACHE_TTL    = 30 * 60 * 1000; // 30 min

async function fetchWeatherData(city, units) {
  const key = city.trim().toLowerCase() + '|' + units;
  const hit = weatherCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  // 1. Geocode city name → lat/lon
  const geoRes  = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&format=json`
  );
  const geoJson = await geoRes.json();
  if (!geoJson.results?.length) throw new Error(`City "${city}" not found`);
  const { latitude, longitude, name, country_code } = geoJson.results[0];

  // 2. Fetch current + 5-day forecast
  const tUnit = units === 'F' ? 'fahrenheit' : 'celsius';
  const wRes  = await fetch(
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&temperature_unit=${tUnit}&wind_speed_unit=mph&forecast_days=6&timezone=auto`
  );
  const w = await wRes.json();
  const cur   = w.current;
  const daily = w.daily;
  const cond  = WMO[cur.weather_code] || WMO[2];
  const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const forecast = daily.time.slice(1,6).map((dateStr, i) => {
    const d  = new Date(dateStr + 'T12:00:00');
    const fc = WMO[daily.weather_code[i+1]] || WMO[2];
    return { day: DAYS[d.getDay()], temp: Math.round(daily.temperature_2m_max[i+1]), icon: fc.icon };
  });

  const data = {
    city:     name + (country_code ? ', ' + country_code.toUpperCase() : ''),
    temp:     Math.round(cur.temperature_2m),
    desc:     cond.desc,
    icon:     cond.icon,
    hi:       Math.round(daily.temperature_2m_max[0]),
    lo:       Math.round(daily.temperature_2m_min[0]),
    humidity: cur.relative_humidity_2m,
    wind:     Math.round(cur.wind_speed_10m),
    forecast,
  };
  weatherCache.set(key, { data, ts: Date.now() });
  return data;
}

// ── Clocks panel ──────────────────────────────────────────────────────────────
function ClocksPanel({ zones, onEditZones }) {
  const now = useNow(1000);
  return (
    <div className="crt-panel clocks-panel">
      <span className="crt-panel-label">P1 · TIME</span>
      <div className="clocks-list">
        {zones.map((z, i) => {
          const t   = formatTime(now, z.tz);
          const off = tzOffsetLabel(now, z.tz);
          return (
            <div key={z.id} className={"clock-row" + (i === 0 ? " primary" : "")}>
              <div className="clock-meta">
                <span className="clock-label">{z.label}</span>
                <span className="clock-off">{off}</span>
              </div>
              <div className="clock-time">
                {t.hour}:{t.minute}
                <span className="period">{t.dayPeriod}</span>
              </div>
            </div>
          );
        })}
      </div>
      <button className="clocks-edit" onClick={onEditZones}>+ EDIT ZONES</button>
    </div>
  );
}

// ── Weather panel ─────────────────────────────────────────────────────────────
function WeatherPanel({ city, units, onToggleUnits, onEditCity }) {
  const [weather, setWeather] = useState(null);
  const [status,  setStatus ] = useState('loading'); // 'loading' | 'ok' | 'error'
  const [errMsg,  setErrMsg ] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchWeatherData(city, units)
      .then(data => { if (!cancelled) { setWeather(data); setStatus('ok'); } })
      .catch(err  => { if (!cancelled) { setErrMsg(err.message); setStatus('error'); } });
    return () => { cancelled = true; };
  }, [city, units]);

  if (status === 'loading') return (
    <div className="crt-panel weather-panel">
      <span className="crt-panel-label">P2 · WEATHER</span>
      <div className="weather-status">Fetching weather…</div>
    </div>
  );

  if (status === 'error') return (
    <div className="crt-panel weather-panel">
      <span className="crt-panel-label">P2 · WEATHER</span>
      <div className="weather-status weather-err">{errMsg}</div>
      <button className="weather-city" onClick={onEditCity}>
        <Icon.pin size={10}/> Change city
      </button>
    </div>
  );

  const IconCmp = Icon[weather.icon] || Icon.wSun;
  return (
    <div className="crt-panel weather-panel">
      <span className="crt-panel-label">P2 · WEATHER</span>
      <div className="weather-main-row">
        <div className="weather-icon-block"><IconCmp size={36}/></div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <div className="weather-temp">
            {weather.temp}<span className="unit">°{units}</span>
            <button className="weather-unit-toggle" onClick={onToggleUnits} title="Toggle °F/°C">
              °{units === 'F' ? 'C' : 'F'}
            </button>
          </div>
          <div className="weather-desc">{weather.desc}</div>
        </div>
      </div>
      <div className="weather-hilo">
        <span>HI <b>{weather.hi}°</b></span>
        <span>LO <b>{weather.lo}°</b></span>
        <span><Icon.wDrop size={12}/> {weather.humidity}%</span>
        <span><Icon.wWind size={12}/> {weather.wind}mph</span>
      </div>
      <button className="weather-city" onClick={onEditCity}>
        <Icon.pin size={10}/> {weather.city}
      </button>
      {weather.forecast.length > 0 && (
        <div className="weather-forecast">
          {weather.forecast.map((f, i) => {
            const FC = Icon[f.icon] || Icon.wSun;
            return (
              <div key={i} className="forecast-day">
                <span className="forecast-label">{f.day}</span>
                <FC size={14}/>
                <span className="forecast-temp">{f.temp}°</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

window.ClocksPanel  = ClocksPanel;
window.WeatherPanel = WeatherPanel;
window.useNow       = useNow;
window.formatTime   = formatTime;
window.tzOffsetLabel = tzOffsetLabel;
