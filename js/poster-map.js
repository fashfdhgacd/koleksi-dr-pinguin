(function () {
  var map = {};
  window.KDP_POSTERS = map;
  window.kdpPoster = function (id) { return map[id] || ""; };

  function idFrom(src) {
    if (!src) return "";
    try {
      var u = new URL(src, location.href);
      return String(u.searchParams.get("id") || (u.pathname.split("/").filter(Boolean).pop() || "")).replace(/\.(mp4|mov)$/i, "");
    } catch (_) {
      return String(src.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
    }
  }

  function apply(root) {
    if (!root) return;
    root.querySelectorAll(".video-card").forEach(function (card) {
      if (card.getAttribute("data-poster-ok") === "1") return;
      var media = card.querySelector("iframe, video");
      var src = "";
      if (media) src = media.getAttribute("src") || media.getAttribute("data-src") || "";
      var id = idFrom(src) || String(card.getAttribute("data-id") || "");
      var url = map[id];
      if (!url) return;
      var img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.className = "absolute inset-0 w-full h-full object-cover bg-black pointer-events-none";
      if (media && media.parentNode) media.parentNode.replaceChild(img, media);
      card.setAttribute("data-poster-ok", "1");
    });
  }

  function watch(id) {
    var el = document.getElementById(id);
    if (!el) return;
    apply(el);
    if (window.MutationObserver) {
      new MutationObserver(function () { apply(el); }).observe(el, { childList: true, subtree: true });
    }
  }

  function boot() {
    ["videoGrid", "trendingGrid", "searchResults", "heroSlides", "genreGrid"].forEach(watch);
  }

  fetch("/data/posters.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (d) {
      map = d || {};
      window.KDP_POSTERS = map;
      window.kdpPoster = function (id) { return map[id] || ""; };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
      else boot();
    })
    .catch(function () {});
})();
