(function () {
  var map = {};
  window.KDP_POSTERS = map;
  window.kdpPoster = function (id) { return map[id] || ""; };
  var GH = "https://raw.githubusercontent.com/fashfdhgacd/koleksi-dr-pinguin/main/data/posters.json";

  function idFrom(src) {
    if (!src) return "";
    try {
      var u = new URL(src, location.href);
      return String(u.searchParams.get("id") || (u.pathname.split("/").filter(Boolean).pop() || "")).replace(/\.(mp4|mov)$/i, "");
    } catch (_) {
      return String(src.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
    }
  }

  function hostOf(src) {
    var s = String(src || "").toLowerCase();
    if (s.indexOf("userbokep") >= 0) return "userbokep";
    if (s.indexOf("indoav") >= 0) return "indoav";
    return "";
  }

  function posterFor(id, src) {
    if (id && map[id]) return map[id];
    var h = hostOf(src);
    if (h && id) return "/api/thumb?h=" + h + "&id=" + encodeURIComponent(id);
    return "";
  }

  function paint(imgOrBox, url) {
    if (!url) return;
    if (imgOrBox.tagName === "IMG") {
      if (imgOrBox.getAttribute("src") !== url) imgOrBox.src = url;
      return;
    }
    var img = document.createElement("img");
    img.src = url;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.className = "absolute inset-0 w-full h-full object-cover bg-black pointer-events-none";
    if (imgOrBox.parentNode) imgOrBox.parentNode.replaceChild(img, imgOrBox);
  }

  function applyCards(root) {
    if (!root) return;
    root.querySelectorAll(".video-card, article, a.card").forEach(function (card) {
      var media = card.querySelector("iframe, video, img");
      var src = "";
      if (media) src = media.getAttribute("src") || media.getAttribute("data-src") || "";
      var id = idFrom(src) || String(card.getAttribute("data-id") || "");
      if (!id) id = idFrom(card.getAttribute("data-embed") || card.getAttribute("href") || "");
      var url = posterFor(id, src || card.getAttribute("data-embed") || "");
      if (!url) return;
      if (media && media.tagName === "IMG") {
        paint(media, url);
        card.setAttribute("data-poster-ok", "1");
        return;
      }
      if (media && (media.tagName === "IFRAME" || media.tagName === "VIDEO")) {
        paint(media, url);
        card.setAttribute("data-poster-ok", "1");
      }
    });
  }

  function applyHero() {
    var root = document.getElementById("heroSlides");
    if (!root) return;
    root.querySelectorAll(".hero-slide").forEach(function (slide) {
      var iframe = slide.querySelector("iframe");
      var src = iframe ? (iframe.getAttribute("src") || iframe.getAttribute("data-src") || "") : "";
      var id = idFrom(src);
      var url = posterFor(id, src);
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
    setInterval(applyHero, 2000);
  }

  function use(d) {
    map = d || {};
    window.KDP_POSTERS = map;
    window.kdpPoster = function (id) { return map[id] || ""; };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }

  function merge(a, b) {
    var o = {};
    Object.keys(a || {}).forEach(function (k) { o[k] = a[k]; });
    Object.keys(b || {}).forEach(function (k) { o[k] = b[k]; });
    return o;
  }

  Promise.all([
    fetch("/data/posters.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
    fetch("/data/latest-posters.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
  ]).then(function (arr) {
    var main = arr[0] && !Array.isArray(arr[0]) ? arr[0] : {};
    var extra = arr[1] && !Array.isArray(arr[1]) ? arr[1] : {};
    if (!Object.keys(main).length) {
      return fetch(GH, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (g) {
        use(merge(g, extra));
      });
    }
    use(merge(main, extra));
  }).catch(function () { use({}); });
})();
