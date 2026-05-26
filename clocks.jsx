var { useState, useEffect, useMemo } = React;

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
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
    .formatToParts(date);
  const offset = parts.find(p => p.type === 'timeZoneName')?.value || '';
  // Try to get region/city name from tz string
  const region = tz.split('/').pop().replace('_', ' ');
  return `${offset} · ${region}`;
}

function AnalogFace({ now, tz, variant }) {
  // Get hours/minutes/seconds in target timezone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  }).formatToParts(now);
  const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10) % 12;
  const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const s = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);

  const hourAngle = (h + m / 60) * 30;
  const minAngle  = (m + s / 60) * 6;
  const secAngle  = s * 6;

  const size = 120;
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;

  const ticks = [];
  if (variant === 'analog-retro' || variant === 'analog-pixel') {
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * Math.PI / 180;
      const tickLen = i % 3 === 0 ? 9 : 4;
      const x1 = cx + (r - tickLen) * Math.sin(angle);
      const y1 = cy - (r - tickLen) * Math.cos(angle);
      const x2 = cx + r * Math.sin(angle);
      const y2 = cy - r * Math.cos(angle);
      ticks.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={i % 3 === 0 ? 2 : 1.2} strokeLinecap={variant === 'analog-pixel' ? 'butt' : 'round'} />);
    }
  }

  const hand = (angle, len, w, color) => {
    const rad = (angle - 90) * Math.PI / 180;
    return <line x1={cx} y1={cy} x2={cx + len * Math.cos(rad)} y2={cy + len * Math.sin(rad)} stroke={color} strokeWidth={w} strokeLinecap={variant === 'analog-pixel' ? 'square' : 'round'} />;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={'analog-face analog-' + variant.replace('analog-', '')}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={variant === 'analog-min' ? 1 : 2} opacity={variant === 'analog-min' ? 0.6 : 1} />
      {ticks}
      {hand(hourAngle, r * 0.55, variant === 'analog-pixel' ? 5 : 3.5, 'currentColor')}
      {hand(minAngle,  r * 0.78, variant === 'analog-pixel' ? 4 : 2.5, 'currentColor')}
      {hand(secAngle,  r * 0.85, 1.2, 'var(--accent)')}
      <circle cx={cx} cy={cy} r={variant === 'analog-pixel' ? 3.5 : 2.5} fill="currentColor" />
    </svg>
  );
}

function ClocksWidget() {
  const { t: i18n_t } = window.useI18n();
  const [allZones] = window.useStorage(window.STORAGE_KEYS.zones, window.defaultZones());
  const [plus] = window.useStorage(window.STORAGE_KEYS.plus, { active: false }, false);
  const [clockFace] = window.useStorage(window.STORAGE_KEYS.clockFace, 'digital', true);
  const now = useNow(1000);

  if (!allZones) return null;
  const isPlus = !!plus?.active;
  const zones = isPlus ? allZones : allZones.slice(0, 3);
  const overflow = !isPlus && allZones.length > 3 ? allZones.length - 3 : 0;
  const useAnalog = isPlus && clockFace && clockFace.startsWith('analog-');
  const primary = zones[0];

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <span className="drag-handle"><Icon.drag /></span>
          {i18n_t('clocks_title') || 'Time'}
        </div>
        <button className="card-action" onClick={() => window.location.href = 'settings.html#appearance'}>{i18n_t('common.edit') || 'Edit'}</button>
      </div>
      {useAnalog && primary && (
        <div className="analog-block">
          <AnalogFace now={now} tz={primary.tz} variant={clockFace} />
          <div className="analog-label">{primary.label}</div>
        </div>
      )}
      <div className="zones">
        {zones.map((z) => {
          const t = formatTime(now, z.tz);
          const sub = tzOffsetLabel(now, z.tz);
          return (
            <div key={z.id} className="zone">
              <div>
                <div className="zone-label">{z.label}</div>
                <div className="zone-sub">{sub}</div>
              </div>
              <div className="zone-time">
                <span className="t">{t.hour}:{t.minute}</span>
                <span className="ap">{t.dayPeriod}</span>
              </div>
            </div>
          );
        })}
      </div>
      {overflow > 0 && (
        <div className="plus-hint">{overflow} more zone{overflow === 1 ? '' : 's'} hidden · Plus shows all</div>
      )}
    </div>
  );
}

window.ClocksWidget = ClocksWidget;
window.useNow = useNow;
window.formatTime = formatTime;
