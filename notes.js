var { useState, useEffect, useRef } = React;
const NOTES_FREE_LIMIT = 2e3;
function NotesWidget() {
  const { t: i18n_t } = window.useI18n();
  const [note, setNote] = window.useStorage(window.STORAGE_KEYS.notes, "", false);
  const [plus] = window.useStorage(window.STORAGE_KEYS.plus, { active: false }, false);
  const [localNote, setLocalNote] = useState(note || "");
  const saveTimeout = useRef(null);
  useEffect(() => {
    if (note !== void 0) setLocalNote(note);
  }, [note]);
  const isPlus = !!plus?.active;
  const cap = isPlus ? Infinity : NOTES_FREE_LIMIT;
  const handleChange = (e) => {
    let val = e.target.value;
    if (val.length > cap) val = val.slice(0, cap);
    setLocalNote(val);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setNote(val);
    }, 250);
  };
  const clearNotes = () => {
    if (confirm("Clear all notes?")) {
      setLocalNote("");
      setNote("");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, /* @__PURE__ */ React.createElement("span", { className: "drag-handle" }, /* @__PURE__ */ React.createElement(Icon.drag, null)), i18n_t("notes.title") || "Scratchpad"), /* @__PURE__ */ React.createElement("button", { className: "card-action", onClick: clearNotes }, i18n_t("common.clear") || "Clear")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "notes-area",
      value: localNote,
      onChange: handleChange,
      placeholder: i18n_t("notes.placeholder") || "A quick thought, a link, a reminder\u2026",
      spellCheck: "false"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "notes-foot", style: { display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--text-mute)", fontFamily: "var(--font-mono)" } }, /* @__PURE__ */ React.createElement("span", { style: { color: !isPlus && localNote.length > NOTES_FREE_LIMIT * 0.9 ? "#d33" : void 0 } }, localNote.length, isPlus ? "" : " / " + NOTES_FREE_LIMIT, " ", i18n_t("notes.chars") || "chars"), /* @__PURE__ */ React.createElement("span", null, i18n_t("notes.saved_locally") || "Saved locally")));
}
window.NotesWidget = NotesWidget;
