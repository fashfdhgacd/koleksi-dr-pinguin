(function () {
  if (window.__kdpOverlay) return;
  window.__kdpOverlay = true;
  var KEY = "kdp_age_ok";
  var DAY = 30 * 24 * 60 * 60 * 1000;
  function pass() {
    try {
      localStorage.setItem(KEY, String(Date.now() + DAY));
      sessionStorage.setItem("age_ok", "1");
    } catch (_) {}
    var gate = document.getElementById("ageGate");
    var main = document.getElementById("mainContent");
    if (gate) gate.classList.add("hidden");
    if (main) {
      main.classList.remove("opacity-0");
      main.classList.add("opacity-100");
    }
  }
  function ageOk() {
    try {
      if (sessionStorage.getItem("age_ok") === "1") return true;
      var raw = localStorage.getItem(KEY);
      if (raw === "1") return true;
      var n = parseInt(raw, 10);
      return !!(n && Date.now() < n);
    } catch (_) { return false; }
  }
  if (ageOk()) pass();
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#btnEnter")) pass();
  }, true);
  function keyFrom(u) {
    if (!u || u === "about:blank") return "";
    try {
      var url = new URL(u, location.href);
      return String(url.searchParams.get("id") || (url.pathname.split("/").filter(Boolean).pop() || "")).replace(/\.(mp4|mov)$/i, "");
    } catch (_) {
      return String(u.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
    }
  }
  function embedOf(v) {
    return String((v && (v.embed || v.direct || v.embedUrl)) || "").replace("/d/", "/e/");
  }
  function isVidey(u) { return /videy/i.test(String(u || "")); }
  function hideNative() {
    var native = document.getElementById("modalNativeVideo");
    if (!native) return;
    try { native.pause(); } catch (_) {}
    native.removeAttribute("src");
    native.style.display = "none";
  }
  window.kdpPlay = function playEntry(v) {
    if (!v) return;
    var modal = document.getElementById("videoModal");
    var iframe = document.getElementById("modalIframe");
    if (!modal || !iframe) return;
    var raw = embedOf(v);
    if (!raw) return;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    var t = String(v.title || "").replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, "").replace(/\s+/g, " ").trim();
    var id = keyFrom(raw) || String(v.id || "");
    var mt = document.getElementById("modalTitle");
    var mm = document.getElementById("modalMeta");
    var ht = document.getElementById("hubTitle");
    var ext = document.getElementById("modalOpenExternal");
    if (mt) mt.textContent = t;
    if (mm) mm.textContent = v.folder || v.category || "Video";
    if (ht) ht.textContent = t;
    if (ext) {
      ext.href = raw;
      ext.textContent = "Putar di sumber";
      ext.classList.remove("hidden");
    }
    if (isVidey(raw)) {
      var native = document.getElementById("modalNativeVideo");
      var wrap = iframe.parentElement;
      if (!native && wrap) {
        native = document.createElement("video");
        native.id = "modalNativeVideo";
        native.controls = true;
        native.playsInline = true;
        native.className = "player-iframe";
        wrap.appendChild(native);
      }
      iframe.style.display = "none";
      iframe.src = "about:blank";
      if (native) {
        native.style.display = "block";
        native.src = raw;
      }
    } else {
      hideNative();
      iframe.style.display = "";
      iframe.src = "about:blank";
      setTimeout(function () { iframe.src = raw; }, 30);
    }
    window.__kdpCurrent = { id: id, title: t, embed: raw, category: v.folder || v.category || "Video" };
    if (window.kdpSaveWatch) window.kdpSaveWatch(window.__kdpCurrent);
    if (id) history.replaceState(null, "", "/#v=" + encodeURIComponent(id));
  };
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#modalClose, #modalBackdrop")) {
      hideNative();
      var iframe = document.getElementById("modalIframe");
      if (iframe) iframe.src = "about:blank";
      var modal = document.getElementById("videoModal");
      if (modal) modal.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }, true);
})();
