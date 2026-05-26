var { useState, useEffect, useMemo } = React;

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

const CACHE_TTL = 15 * 60 * 1000; // 15 min

async function fetchWeatherData(city, units) {
  // 1. Geocode city name → lat/lon
  const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&format=json`);
  const geoJson = await geoRes.json();
  if (!geoJson.results?.length) throw new Error(`City "${city}" not found`);
  const { latitude, longitude, name } = geoJson.results[0];

  // 2. Fetch current + forecast
  const tUnit = units === 'F' ? 'fahrenheit' : 'celsius';
  const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=${tUnit}&timezone=auto`);
  const w = await wRes.json();

  const cur = w.current;
  const daily = w.daily;
  const cond = WMO[cur.weather_code] || WMO[2];
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const forecast = daily.time.slice(0, 5).map((t, i) => {
    const d = new Date(t + 'T12:00:00');
    return {
      day: DAYS[d.getDay()],
      temp: Math.round(daily.temperature_2m_max[i]),
      icon: WMO[daily.weather_code[i]].icon
    };
  });

  return {
    city: name,
    temp: Math.round(cur.temperature_2m),
    feelsLike: Math.round(cur.apparent_temperature),
    desc: cond.desc,
    icon: cond.icon,
    hi: Math.round(daily.temperature_2m_max[0]),
    lo: Math.round(daily.temperature_2m_min[0]),
    humidity: cur.relative_humidity_2m,
    wind: Math.round(cur.wind_speed_10m),
    forecast
  };
}

function WeatherWidget() {
  const { t: i18n_t } = window.useI18n();
  const [city] = window.useStorage(window.STORAGE_KEYS.weatherCity, 'San Francisco');
  const [units, setUnits] = window.useStorage(window.STORAGE_KEYS.unit, 'F');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchWeatherData(city || 'San Francisco', units)
      .then(d => { if (active) { setData(d); setLoading(false); } })
      .catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [city, units]);

  if (loading || !data) return (
    <div className="card">
       <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>Loading...</div>
    </div>
  );

  const WeatherIcon = Icon[data.icon] || Icon.wSun;

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <span className="drag-handle"><Icon.drag /></span>
          {i18n_t('weather_title') || 'Weather'}
        </div>
        <button className="card-action" onClick={() => setUnits(units === 'F' ? 'C' : 'F')}>°{units}</button>
      </div>
      
      <div className="weather-main" style={{display:'flex', gap:14, marginBottom: 20}}>
        <div className="weather-icon" style={{width:52, height:52, background:'var(--accent-soft)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)'}}>
          <WeatherIcon size={28} />
        </div>
        <div>
          <div className="weather-temp" style={{fontSize: 38, fontWeight: 600, letterSpacing: '-0.03em'}}>
            {data.temp}<span className="unit" style={{fontSize: 14, color: 'var(--text-mute)', fontWeight: 400, marginLeft: 2}}>°{units}</span>
          </div>
          <div className="weather-cond" style={{fontSize: 13, color:'var(--text-2)'}}>{data.desc} · feels like {data.feelsLike}°</div>
          <div className="weather-loc" style={{ fontSize: 12, color:'var(--text-mute)', display:'flex', alignItems:'center', gap:4, marginTop: 4 }}>
            <Icon.pin size={11} /> {data.city}
          </div>
        </div>
      </div>

      <div className="weather-meta" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'10px 0', marginBottom: 20}}>
        <div style={{display:'flex', flexDirection:'column', gap:2}}><span style={{fontSize:11, color:'var(--text-mute)'}}>H/L</span><b style={{fontFamily:'var(--font-mono)', fontSize:13}}>{data.hi}°/{data.lo}°</b></div>
        <div style={{display:'flex', flexDirection:'column', gap:2}}><span style={{fontSize:11, color:'var(--text-mute)'}}>Humidity</span><b style={{fontFamily:'var(--font-mono)', fontSize:13}}>{data.humidity}%</b></div>
        <div style={{display:'flex', flexDirection:'column', gap:2}}><span style={{fontSize:11, color:'var(--text-mute)'}}>Wind</span><b style={{fontFamily:'var(--font-mono)', fontSize:13}}>{data.wind} mph</b></div>
      </div>

      <div className="forecast" style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:4}}>
        {data.forecast.map((f, i) => {
          const FIcon = Icon[f.icon] || Icon.wSun;
          return (
            <div key={i} className="fc-day" style={{textAlign:'center'}}>
              <div className="d" style={{fontSize:10, fontWeight:600, color:'var(--text-mute)', textTransform:'uppercase', marginBottom:4}}>{f.day}</div>
              <div className="i" style={{color:'var(--text-2)', marginBottom:4}}><FIcon size={18} /></div>
              <div className="t" style={{fontFamily:'var(--font-mono)', fontSize:12}}>{f.temp}°</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.WeatherWidget = WeatherWidget;
