var { useState, useEffect, useRef } = React;

function NotesWidget() {
  const [note, setNote] = window.useStorage(STORAGE_KEYS.notes, '', true);
  const [localNote, setLocalNote] = useState(note);
  const saveTimeout = useRef(null);

  // Sync local state when storage changes from other tabs
  useEffect(() => {
    setLocalNote(note);
  }, [note]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length > 2000) return; // Cap at 2000 chars
    setLocalNote(val);

    // Debounced save
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setNote(val);
    }, 500);
  };

  return (
    <div className="crt-panel notes-panel">
      <div className="crt-panel-label">P4 · SCRATCHPAD</div>
      <textarea
        className="notes-textarea custom-scrollbar"
        value={localNote}
        onChange={handleChange}
        placeholder="Type your notes here... (autosaves)"
        spellCheck="false"
      />
      <div className="notes-footer">
        {localNote.length}/2000 characters
      </div>
    </div>
  );
}

window.NotesWidget = NotesWidget;
