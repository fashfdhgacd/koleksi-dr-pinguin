(function () {
  if (window.__forcePoster) return;
  window.__forcePoster = true;

  var PLACEHOLDER =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">' +
      '<rect width="640" height="360" fill="#141414"/>' +
      '<rect x="0" y="0" width="640" height="360" fill="#1c1c1c"/>' +
      '<circle cx="320" cy="168" r="34" fill="#ff9000"/>' +
      '<polygon points="310,152 342,168 310,184" fill="#111"/>' +
      '<text x="320" y="228" text-anchor="middle" fill="#8a8a8a" font-family="system-ui,sans-serif" font-size="13">DR.PINGUIN</text>' +
      "</svg>"
    );

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
    if (s.indexOf("lulu") >= 0) return "lulu";
    if (s.indexOf("streamtape") >= 0) return "tape";
    return "";
  }
  function chain(id, src) {
    var out = [];
    var mapped = window.KDP_POSTERS && id && window.KDP_POSTERS[id];
    if (mapped) out.push(mapped);
    var h = hostOf(src);
    if (h === "putarin" && id) out.push("/api/poster?id=" + encodeURIComponent(id));
    if ((h === "indoav" || h === "userbokep") && id) out.push("/api/thumb?h=" + h + "&id=" + encodeURIComponent(id));
    if (h === "lulu" && id) out.push("https://img.lulustream.com/" + id + ".jpg");
    out.push(PLACEHOLDER);
    var uniq = [];
    out.forEach(function (u) { if (u && uniq.indexOf(u) < 0) uniq.push(u); });
    return uniq;
  }
  function attach(img, urls) {
    var i = 0;
    function go() {
      if (i >= urls.length) {
        img.src = PLACEHOLDER;
        img.style.opacity = "1";
        return;
      }
      img.src = urls[i++];
    }
    img.onerror = go;
    img.onload = function () {
      if (img.naturalWidth < 8) go();
      else img.style.opacity = "1";
    };
    go();
  }
  function ensureImg(box) {
    var img = box.querySelector("img.kdp-cover");
    if (img) return img;
    img = document.createElement("img");
    img.className = "kdp-cover";
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#141414;opacity:0;transition:opacity .2s";
    box.appendChild(img);
    return img;
  }
  function swap(card) {
    var box = card.querySelector(".relative, .ph, .vph, .frame, .aspect-video") || card;
    if (!box) return;
    if (getComputedStyle(box).position === "static") box.style.position = "relative";
    var media = card.querySelector("iframe, video");
    var src = "";
    if (media) src = media.getAttribute("src") || media.getAttribute("data-src") || "";
    src = src || card.getAttribute("data-embed") || "";
    var id = idFrom(src) || String(card.getAttribute("data-id") || "");
    if (/^\d+$/.test(id)) id = idFrom(src);
    var img = ensureImg(box);
    if (img.getAttribute("data-locked") === "1") return;
    img.setAttribute("data-locked", "1");
    if (media) media.style.display = "none";
    attach(img, chain(id, src));
  }
  function run() {
    document.querySelectorAll("#videoGrid .video-card, #trendingGrid .video-card, #searchResults .video-card, .sg .card, #hubRight .vcard").forEach(swap);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
  setInterval(run, 800);
})();
