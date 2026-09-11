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
  var q = new URLSearchParams(location.search).get("v");
  var m = location.hash.match(/(?:^|#|&)v=([^&]+)/);
  var id = q || (m ? decodeURIComponent(m[1]) : "");
  if (id && location.pathname === "/") {
    location.replace("/v/" + encodeURIComponent(id));
    return;
  }
})();
