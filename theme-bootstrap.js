(function(){
  try {
    var theme = localStorage.getItem("nt.theme") || "light";
    var game  = localStorage.getItem("nt.arcadeGame") || "";
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "arcade" && game) {
      document.documentElement.setAttribute("data-arcade-game", game);
    }
  } catch(e) {}
})();
