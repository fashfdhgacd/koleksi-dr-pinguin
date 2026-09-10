(function () {
  if (window.__forcePoster) return;
  window.__forcePoster = true;

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
  function urlFor(id, src) {
    var mapped = (window.KDP_POSTERS && id && window.KDP_POSTERS[id]) || "";
    if (mapped) return mapped;
    var h = hostOf(src);
    if (h === "putarin" && id) return "/api/poster?id=" + encodeURIComponent(id);
    if (h && id) return "/api/thumb?h=" + h + "&id=" + encodeURIComponent(id);
    return "";
  }
  function swap(card) {
    var media = card.querySelector("iframe, video");
    if (!media) return;
    var src = media.getAttribute("src") || media.getAttribute("data-src") || card.getAttribute("data-embed") || "";
    var id = idFrom(src);
    if (!id || /^\d+$/.test(id)) return;
    var url = urlFor(id, src);
    if (!url) return;
    var img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.className = media.className || "absolute inset-0 w-full h-full object-cover bg-black pointer-events-none";
    img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#111";
    img.src = url;
    img.onerror = function () {
      if (img.dataset.fb) return;
      img.dataset.fb = "1";
      var h = hostOf(src);
      img.src = h ? ("/api/thumb?h=" + h + "&id=" + encodeURIComponent(id) + "&r=1") : "/logo.png";
    };
    media.parentNode.replaceChild(img, media);
    card.setAttribute("data-poster-ok", "1");
  }
  function run() {
    document.querySelectorAll("#videoGrid .video-card, #trendingGrid .video-card, #searchResults .video-card, .sg .card, #hubRight .vcard").forEach(swap);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
  setInterval(run, 700);
  if (window.MutationObserver) {
    new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
