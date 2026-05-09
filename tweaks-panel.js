var { useState, useMemo, useEffect, useCallback, useRef } = React;
function useTweaks(defaults) {
  const [values, setValues] = window.useStorage("dash.tweaks", defaults, true);
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === "object" && keyOrEdits !== null ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
  }, [setValues]);
  return [values, setTweak];
}
function TweaksPanel() {
  return null;
}
function TweakSection() {
  return null;
}
function TweakRow() {
  return null;
}
function TweakSlider() {
  return null;
}
function TweakToggle() {
  return null;
}
function TweakRadio() {
  return null;
}
function TweakSelect() {
  return null;
}
function TweakText() {
  return null;
}
function TweakNumber() {
  return null;
}
function TweakColor() {
  return null;
}
function TweakButton() {
  return null;
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
