(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  function urlOf(v) {
    return String((v && (v.embed || v.direct || v.embedUrl)) || "").toLowerCase();
  }
  ready(function () {
    setTimeout(function () {
      fetch("/data/videos.json?t=" + Date.now(), { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (list) {
          if (!Array.isArray(list) || !list.length) return;
          var latest = list.filter(function (v) {
            var u = urlOf(v);
            return /indoav|userbokep/.test(u) && String(v.date || "").slice(0, 10) >= "2026-09-01";
          }).slice(0, 18);
          if (!latest.length) latest = list.filter(function (v) { return /indoav|userbokep/.test(urlOf(v)); }).slice(0, 12);
          var grid = document.getElementById("videoGrid");
          if (!grid || !latest.length) return;
          var have = {};
          grid.querySelectorAll("[data-id], iframe, video, a").forEach(function (n) {
            have[String(n.getAttribute("data-id") || n.getAttribute("src") || n.getAttribute("href") || "")] = 1;
          });
          var html = latest.map(function (v) {
            var id = urlOf(v).split("/").pop();
            var title = String(v.title || id).replace(/koleksidrpinguin\.com/ig, "").replace(/\s+/g, " ").trim();
            return '<article class="video-card" data-id="' + id + '" data-embed="' + urlOf(v).replace(/"/g, "") + '"><div class="relative aspect-video bg-black overflow-hidden rounded-lg"><img class="absolute inset-0 w-full h-full object-cover" alt="" loading="lazy"></div><h3 class="mt-2 text-xs line-clamp-2">' + title.replace(/</g, "") + '</h3></article>';
          }).join("");
          var wrap = document.createElement("div");
          wrap.innerHTML = html;
          var frag = document.createDocumentFragment();
          while (wrap.firstChild) frag.appendChild(wrap.firstChild);
          grid.insertBefore(frag, grid.firstChild);
        })
        .catch(function () {});
    }, 800);
  });
})();
