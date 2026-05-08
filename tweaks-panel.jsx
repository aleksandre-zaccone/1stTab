// ============================
// Tweaks-panel — production stub
// The floating dev panel and postMessage design-tool protocol are removed.
// useTweaks keeps full state management; Tweak* controls are no-ops.
// ============================
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
  }, []);
  return [values, setTweak];
}
function TweaksPanel() { return null; }
function TweakSection() { return null; }
function TweakRow()     { return null; }
function TweakSlider()  { return null; }
function TweakToggle()  { return null; }
function TweakRadio()   { return null; }
function TweakSelect()  { return null; }
function TweakText()    { return null; }
function TweakNumber()  { return null; }
function TweakColor()   { return null; }
function TweakButton()  { return null; }
Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
});
