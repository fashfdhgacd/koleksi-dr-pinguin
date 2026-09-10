(function () {
  if (window.__forcePoster) return;
  window.__forcePoster = true;
  var PLACEHOLDER =
    "data:image/svg+xml," +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#141414"/><circle cx="320" cy="168" r="34" fill="#ff9000"/><polygon points="310,152 342,168 310,184" fill="#111"/></svg>');
  function idFrom(src) {
    if (!src) return "";
    try {
      var u = new URL(src, location.href);
      return String(u.searchParams.get("id") || (u.pathname.split("/").filter(Boolean).pop() || "")).replace(/\.(mp4|mov|html)$/i, "");
    } catch (_) {
      return String(src.split("/").pop() || "").replace(/\.(mp4|mov|html)$/i, "");
    }
  }
  function hostOf(src) {
    var s = String(src || "").toLowerCase();
    if (s.indexOf("userbokep") >= 0) return "userbokep";
    if (s.indexOf("indoav") >= 0) return "indoav";
    if (s.indexOf("putarin") >= 0 || s.indexOf("puterin") >= 0) return "putarin";
    return "";
  }
  function srcFor(id, raw) {
    var h = hostOf(raw);
    if (h === "putarin") return "/api/poster?id=" + encodeURIComponent(id);
    if (h === "indoav" || h === "userbokep") return "/api/thumb?h=" + h + "&id=" + encodeURIComponent(id);
    return PLACEHOLDER;
  }
  function swap(card) {
    var box = card.querySelector(".relative, .ph, .vph, .aspect-video") || card;
    var media = card.querySelector("iframe, video");
    var raw = "";
    if (media) raw = media.getAttribute("src") || media.getAttribute("data-src") || "";
    raw = raw || card.getAttribute("data-embed") || "";
    var id = idFrom(raw);
    if (!id || /^\d+$/.test(id)) return;
    var img = box.querySelector("img.kdp-cover");
    if (!img) {
      img = document.createElement("img");
      img.className = "kdp-cover";
      img.alt = "";
      img.loading = "lazy";
      img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#141414";
      box.appendChild(img);
    }
    if (img.getAttribute("data-ok") === "1") return;
    img.setAttribute("data-ok", "1");
    if (media) media.style.display = "none";
    img.onerror = function () { img.onerror = null; img.src = PLACEHOLDER; };
    img.src = srcFor(id, raw);
  }
  function run() {
    document.querySelectorAll("#videoGrid .video-card, #trendingGrid .video-card, #searchResults .video-card, .sg .card, #hubRight .vcard").forEach(swap);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
  setInterval(run, 900);
})();
