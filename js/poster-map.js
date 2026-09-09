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

  function coverOf(src, id) {
    if (id && map[id]) return map[id];
    if (/mumu\.watch|m-cdn\.video/i.test(src) && id) return "https://m-cdn.video/hls/" + id + "/thumbnail.jpg";
    if (/putarin|puterin/i.test(src) && id) return "/api/poster?id=" + encodeURIComponent(id);
    if (/indoav/i.test(src) && id) return "/api/thumb?h=indoav&id=" + encodeURIComponent(id);
    if (/userbokep/i.test(src) && id) return "/api/thumb?h=userbokep&id=" + encodeURIComponent(id);
    return "";
  }

  function apply(root) {
    if (!root) return;
    root.querySelectorAll(".video-card").forEach(function (card) {
      var media = card.querySelector("iframe, video");
      if (!media) return;
      var src = media.getAttribute("src") || media.getAttribute("data-src") || "";
      var id = idFrom(src) || String(card.getAttribute("data-id") || "");
      var url = coverOf(src, id);
      var node;
      if (url) {
        node = document.createElement("img");
        node.src = url;
        node.alt = "";
        node.loading = "lazy";
        node.decoding = "async";
        node.className = "absolute inset-0 w-full h-full object-cover bg-black pointer-events-none";
      } else {
        node = document.createElement("div");
        node.className = "absolute inset-0 w-full h-full bg-neutral-900 pointer-events-none flex items-center justify-center";
        node.innerHTML = "<span style=\"width:36px;height:36px;border-radius:99px;background:#ff9000;color:#111;display:grid;place-items:center;font-size:14px\">&#9654;</span>";
      }
      media.parentNode.replaceChild(node, media);
      card.setAttribute("data-poster-ok", "1");
    });
  }

  function boot() {
    apply(document.getElementById("videoGrid") || document.body);
    var grid = document.getElementById("videoGrid");
    if (grid && window.MutationObserver) {
      new MutationObserver(function () { apply(grid); }).observe(grid, { childList: true, subtree: true });
    }
  }

  ["https://a.embedan.com", "https://tv1.indoav.app", "https://puterin.biz", "https://m-cdn.video"].forEach(function (h) {
    var l = document.createElement("link");
    l.rel = "preconnect";
    l.href = h;
    l.crossOrigin = "anonymous";
    document.head.appendChild(l);
  });

  fetch("/data/posters.json", { cache: "force-cache" })
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (d) {
      map = d || {};
      window.KDP_POSTERS = map;
      window.kdpPoster = function (id) { return map[id] || ""; };
      boot();
    })
    .catch(function () { boot(); });
})();
