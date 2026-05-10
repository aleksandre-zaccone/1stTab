var { useState, useEffect, useRef } = React;
function NotesWidget() {
  const [note, setNote] = window.useStorage(STORAGE_KEYS.notes, "", true);
  const [localNote, setLocalNote] = useState(note);
  const saveTimeout = useRef(null);
  useEffect(() => {
    setLocalNote(note);
  }, [note]);
  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length > 2e3) return;
    setLocalNote(val);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setNote(val);
    }, 500);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "crt-panel notes-panel" }, /* @__PURE__ */ React.createElement("div", { className: "crt-panel-label" }, "P4 \xB7 SCRATCHPAD"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "notes-textarea custom-scrollbar",
      value: localNote,
      onChange: handleChange,
      placeholder: "Type your notes here... (autosaves)",
      spellCheck: "false"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "notes-footer" }, localNote.length, "/2000 characters"));
}
window.NotesWidget = NotesWidget;
