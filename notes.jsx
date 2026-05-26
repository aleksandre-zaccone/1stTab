var { useState, useEffect, useRef } = React;

const NOTES_FREE_LIMIT = 2000;

function NotesWidget() {
  const { t: i18n_t } = window.useI18n();
  const [note, setNote] = window.useStorage(window.STORAGE_KEYS.notes, '', false); // Notes in local
  const [plus] = window.useStorage(window.STORAGE_KEYS.plus, { active: false }, false);
  const [localNote, setLocalNote] = useState(note || '');
  const saveTimeout = useRef(null);

  useEffect(() => {
    if (note !== undefined) setLocalNote(note);
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
    if (confirm('Clear all notes?')) {
      setLocalNote('');
      setNote('');
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">
          <span className="drag-handle"><Icon.drag /></span>
          {i18n_t('notes.title') || 'Scratchpad'}
        </div>
        <button className="card-action" onClick={clearNotes}>{i18n_t('common.clear') || 'Clear'}</button>
      </div>
      <textarea
        className="notes-area"
        value={localNote}
        onChange={handleChange}
        placeholder={i18n_t('notes.placeholder') || 'A quick thought, a link, a reminder…'}
        spellCheck="false"
      />
      <div className="notes-foot" style={{display:'flex', justifyContent:'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-mute)', fontFamily: 'var(--font-mono)'}}>
        <span style={{color: !isPlus && localNote.length > NOTES_FREE_LIMIT * 0.9 ? '#d33' : undefined}}>
          {localNote.length}{isPlus ? '' : ' / ' + NOTES_FREE_LIMIT} {i18n_t('notes.chars') || 'chars'}
        </span>
        <span>{i18n_t('notes.saved_locally') || 'Saved locally'}</span>
      </div>
    </div>
  );
}

window.NotesWidget = NotesWidget;
