(function () {
  if (window.__kdpPersist) return;
  window.__kdpPersist = true;
  function read() {
    try { return JSON.parse(sessionStorage.getItem("kdp_watch") || "null"); } catch (_) { return null; }
  }
  function write(obj) {
    try { sessionStorage.setItem("kdp_watch", JSON.stringify(obj || {})); } catch (_) {}
  }
  window.kdpSaveWatch = function (v) {
    if (!v) return;
    write({
      id: v.id || "",
      title: v.title || "",
      embed: v.embed || v.direct || "",
      category: v.category || v.folder || "Video"
    });
  };
  function idFromLocation() {
    var q = new URLSearchParams(location.search).get("v");
    if (q) return q;
    var m = location.hash.match(/(?:^|#|&)v=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  function restore() {
    var id = idFromLocation();
    var saved = read();
    if (!id && !(saved && saved.embed)) return;
    if (saved && id && saved.id && String(saved.id) !== String(id)) {
      saved = { id: id, title: id, embed: "", category: "Video" };
    }
    if (!saved || !saved.embed) return;
    if (window.kdpPlay) window.kdpPlay(saved);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(restore, 600); });
  else setTimeout(restore, 600);
})();
