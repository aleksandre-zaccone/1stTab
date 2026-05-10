var { useState, useEffect, useRef } = React;

function NotesWidget() {
  const { t } = window.useI18n();
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
      <div className="crt-panel-label">P4 · {t('notes.title')}</div>
      <textarea
        className="notes-textarea custom-scrollbar"
        value={localNote}
        onChange={handleChange}
        placeholder={t('notes.placeholder')}
        spellCheck="false"
      />
      <div className="notes-footer">
        {t('notes.char_count', { count: localNote.length })}
      </div>
    </div>
  );
}

window.NotesWidget = NotesWidget;
