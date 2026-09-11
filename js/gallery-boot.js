(function () {
  var cfg = window.KDP_GALLERY || { file: "/data/campur.json", label: "Mix" };
  var PER = 12;
  function codeOf(v) {
    var u = String((v && (v.embed || v.direct)) || "");
    var m = u.match(/[?&]id=([A-Za-z0-9_-]+)/) || u.match(/\/(?:e|v|d|watch)\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : "";
  }
  function titleOf(v) {
    var t = String((v && v.title) || "").replace(/[<>]/g, "").replace(/_/g, " ").trim();
    if (!t) return (cfg.label || "Video") + " " + codeOf(v);
    return t;
  }
  function embedOf(v) {
    var id = codeOf(v);
    var raw = String((v && (v.embed || v.direct)) || "");
    if (/streamtape|strcloud/i.test(raw)) return "https://streamtape.com/e/" + id + "/";
    if (/lulu/i.test(raw)) return "https://lulustream.com/e/" + id;
    if (/putarin|puterin/i.test(raw)) {
      try { return new URL(raw).origin + "/e/" + id; } catch (_) { return raw.replace(/\/v\//, "/e/"); }
    }
    return raw.replace(/\/d\//, "/e/");
  }
  function posterOf(v) {
    if (v && (v.poster || v.thumb)) return v.poster || v.thumb;
    var id = codeOf(v);
    var raw = String((v && (v.embed || v.direct)) || "");
    if (/lulu/i.test(raw)) return "https://img.lulustream.com/" + id + ".jpg";
    if (/putarin|puterin/i.test(raw) && id) return "/api/poster?id=" + encodeURIComponent(id);
    if (/userbokep/i.test(raw) && id) return "/api/thumb?h=userbokep&id=" + encodeURIComponent(id);
    if (/indoav/i.test(raw) && id) return "/api/thumb?h=indoav&id=" + encodeURIComponent(id);
    return "";
  }
  function esc(s) { return String(s || "").replace(/[&<>"]/g, ""); }
  function pageNow() {
    var n = parseInt((location.hash.match(/p(\d+)/) || [])[1] || "1", 10);
    return n > 0 ? n : 1;
  }
  function cardHTML(v) {
    var id = codeOf(v);
    var poster = posterOf(v);
    var media = poster
      ? '<img src="' + esc(poster) + '" alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover bg-black">'
      : '<div class="absolute inset-0 bg-neutral-900"></div>';
    return '<article class="video-card group cursor-pointer" data-id="' + id + '">' +
      '<div class="relative aspect-video rounded overflow-hidden bg-black border border-neutral-800">' +
      media +
      '<span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-medium z-10">' + esc(v.source || cfg.label || "Video") + '</span>' +
      '<button type="button" class="card-share absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 text-white text-xs">↗</button>' +
      '<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><span class="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold" style="background:#ff9000">▶</span></div>' +
      '</div><div class="mt-2.5 px-0.5"><h3 class="text-sm font-medium leading-snug line-clamp-2">' + esc(titleOf(v)) + '</h3></div></article>';
  }
  function openModal(v) {
    var modal = document.getElementById("videoModal");
    var frame = document.getElementById("modalIframe");
    var title = document.getElementById("modalTitle");
    var meta = document.getElementById("modalMeta");
    var ext = document.getElementById("modalOpenExternal");
    if (!modal || !frame) return;
    if (title) title.textContent = titleOf(v);
    if (meta) meta.textContent = v.source || cfg.label || "";
    if (ext) ext.href = embedOf(v);
    frame.src = embedOf(v);
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    window.__kdpCurrent = { id: codeOf(v), title: titleOf(v), embed: embedOf(v) };
  }
  function closeModal() {
    var modal = document.getElementById("videoModal");
    var frame = document.getElementById("modalIframe");
    if (frame) frame.src = "";
    if (modal) modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
  function draw(items) {
    var grid = document.getElementById("videoGrid");
    var count = document.getElementById("videoCount");
    var pager = document.getElementById("pagination");
    if (!grid) return;
    var pages = Math.max(1, Math.ceil(items.length / PER) || 1);
    var p = Math.min(pageNow(), pages);
    var slice = items.slice((p - 1) * PER, p * PER);
    if (count) count.textContent = items.length + " video";
    grid.innerHTML = slice.map(cardHTML).join("") || '<p class="text-neutral-500">Belum ada video.</p>';
    if (pager) {
      var html = "";
      if (p > 1) html += '<a class="min-w-[40px] h-10 px-3 border border-neutral-700 rounded flex items-center justify-center" href="#p' + (p - 1) + '">Prev</a>';
      for (var i = 1; i <= pages; i++) {
        html += i === p
          ? '<span class="min-w-[40px] h-10 px-3 bg-ph text-black font-black rounded flex items-center justify-center">' + i + '</span>'
          : '<a class="min-w-[40px] h-10 px-3 border border-neutral-700 rounded flex items-center justify-center" href="#p' + i + '">' + i + '</a>';
      }
      if (p < pages) html += '<a class="min-w-[40px] h-10 px-3 border border-neutral-700 rounded flex items-center justify-center" href="#p' + (p + 1) + '">Next</a>';
      pager.innerHTML = html;
    }
    grid.querySelectorAll(".video-card").forEach(function (card, idx) {
      var v = slice[idx];
      card.addEventListener("click", function (e) {
        if (e.target.closest(".card-share")) {
          e.stopPropagation();
          var prev = document.getElementById("shareTitlePreview");
          if (prev) prev.textContent = titleOf(v);
          var sheet = document.getElementById("shareSheet");
          if (sheet) sheet.classList.remove("hidden");
          window.__kdpCurrent = { id: codeOf(v), title: titleOf(v), embed: embedOf(v) };
          return;
        }
        openModal(v);
      });
    });
  }
  fetch(cfg.file + (cfg.file.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (items) { window._gallery = Array.isArray(items) ? items : []; draw(window._gallery); })
    .catch(function () { window._gallery = []; draw([]); });
  window.addEventListener("hashchange", function () { draw(window._gallery || []); });
  document.addEventListener("click", function (e) {
    if (e.target.id === "modalClose" || e.target.id === "modalBackdrop") closeModal();
    if (e.target.id === "shareClose" || e.target.id === "shareBackdrop") {
      var sheet = document.getElementById("shareSheet");
      if (sheet) sheet.classList.add("hidden");
    }
    if (e.target.id === "modalShare") {
      var sheet = document.getElementById("shareSheet");
      var prev = document.getElementById("shareTitlePreview");
      if (prev && window.__kdpCurrent) prev.textContent = window.__kdpCurrent.title || "";
      if (sheet) sheet.classList.remove("hidden");
    }
  });
})();
