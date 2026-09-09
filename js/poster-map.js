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

  function applyCards(root) {
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

  function applyHero() {
    var root = document.getElementById("heroSlides");
    if (!root) return;
    root.querySelectorAll(".hero-slide").forEach(function (slide) {
      var iframe = slide.querySelector("iframe");
      var src = "";
      if (iframe) src = iframe.getAttribute("src") || iframe.getAttribute("data-src") || "";
      var id = idFrom(src);
      var url = id && map[id];
      if (!url) return;
      var img = slide.querySelector("img.hero-poster");
      if (!img) {
        img = document.createElement("img");
        img.className = "hero-poster absolute inset-0 w-full h-full object-cover";
        img.alt = "";
        slide.appendChild(img);
      }
      if (img.src !== url) img.src = url;
      if (iframe) {
        iframe.style.display = "none";
        iframe.removeAttribute("src");
      }
    });
  }

  function watch(id, fn) {
    var el = document.getElementById(id);
    if (!el) return;
    fn(el);
    if (window.MutationObserver) {
      new MutationObserver(function () { fn(el); }).observe(el, { childList: true, subtree: true, attributes: true });
    }
  }

  function boot() {
    ["videoGrid", "trendingGrid", "searchResults", "genreGrid"].forEach(function (id) {
      watch(id, applyCards);
    });
    watch("heroSlides", function () { applyHero(); });
    setInterval(applyHero, 1500);
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
