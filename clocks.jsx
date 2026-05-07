// ============================
// Clocks panel (left) + Weather panel (right) — arcade-style cabinet panels
// ============================
const { useState, useEffect, useRef, useMemo } = React;

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
  const v = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, timeZoneName: 'shortOffset',
  }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value;
  return v || tz;
}

function ClocksPanel({ zones, onEditZones }) {
  const now = useNow(1000);
  return (
    <div className="crt-panel clocks-panel">
      <span className="crt-panel-label">P1 · TIME</span>
      <div className="clocks-list">
        {zones.map((z, i) => {
          const t = formatTime(now, z.tz);
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

function WeatherPanel({ city, units, onToggleUnits, onEditCity }) {
  const w = React.useMemo(() => buildMockWeather(city, units), [city, units]);
  const IconCmp = Icon[w.icon] || Icon.wSun;
  return (
    <div className="crt-panel weather-panel">
      <span className="crt-panel-label">P2 · WEATHER</span>
      <div className="weather-main-row">
        <div className="weather-icon-block"><IconCmp size={36}/></div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <div className="weather-temp">
            {w.temp}<span className="unit">°{units}</span>
            <button className="weather-unit-toggle" onClick={onToggleUnits} title="Toggle units">
              °{units === 'F' ? 'C' : 'F'}
            </button>
          </div>
          <div className="weather-desc">{w.desc}</div>
        </div>
      </div>
      <div className="weather-hilo">
        <span>HI <b>{w.hi}°</b></span>
        <span>LO <b>{w.lo}°</b></span>
      </div>
      <button className="weather-city" onClick={onEditCity}>
        <Icon.pin size={10}/> {w.city}
      </button>
    </div>
  );
}

window.ClocksPanel = ClocksPanel;
window.WeatherPanel = WeatherPanel;
window.useNow = useNow;
window.formatTime = formatTime;
window.tzOffsetLabel = tzOffsetLabel;
