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
  const v = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset"
  }).formatToParts(date).find((p) => p.type === "timeZoneName")?.value;
  return v || tz;
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
  const w = React.useMemo(() => buildMockWeather(city, units), [city, units]);
  const IconCmp = Icon[w.icon] || Icon.wSun;
  return /* @__PURE__ */ React.createElement("div", { className: "crt-panel weather-panel" }, /* @__PURE__ */ React.createElement("span", { className: "crt-panel-label" }, "P2 \xB7 WEATHER"), /* @__PURE__ */ React.createElement("div", { className: "weather-main-row" }, /* @__PURE__ */ React.createElement("div", { className: "weather-icon-block" }, /* @__PURE__ */ React.createElement(IconCmp, { size: 36 })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { className: "weather-temp" }, w.temp, /* @__PURE__ */ React.createElement("span", { className: "unit" }, "\xB0", units), /* @__PURE__ */ React.createElement("button", { className: "weather-unit-toggle", onClick: onToggleUnits, title: "Toggle units" }, "\xB0", units === "F" ? "C" : "F")), /* @__PURE__ */ React.createElement("div", { className: "weather-desc" }, w.desc))), /* @__PURE__ */ React.createElement("div", { className: "weather-hilo" }, /* @__PURE__ */ React.createElement("span", null, "HI ", /* @__PURE__ */ React.createElement("b", null, w.hi, "\xB0")), /* @__PURE__ */ React.createElement("span", null, "LO ", /* @__PURE__ */ React.createElement("b", null, w.lo, "\xB0"))), /* @__PURE__ */ React.createElement("button", { className: "weather-city", onClick: onEditCity }, /* @__PURE__ */ React.createElement(Icon.pin, { size: 10 }), " ", w.city));
}
window.ClocksPanel = ClocksPanel;
window.WeatherPanel = WeatherPanel;
window.useNow = useNow;
window.formatTime = formatTime;
window.tzOffsetLabel = tzOffsetLabel;
