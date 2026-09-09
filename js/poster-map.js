(function () {
  window.KDP_POSTERS = window.KDP_POSTERS || {};
  fetch("/data/posters.json", { cache: "force-cache" })
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (map) {
      window.KDP_POSTERS = map || {};
      window.kdpPoster = function (id) { return (map && map[id]) || ""; };
    })
    .catch(function () {});
})();
