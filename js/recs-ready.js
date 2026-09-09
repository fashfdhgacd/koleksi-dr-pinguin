(function () {
  var put = [], mumu = [];
  function esc(s) { return String(s || "").replace(/[&<>"]/g, ""); }
  function titleOf(v) {
    return String((v && v.title) || "Video").replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, "").replace(/\s+/g, " ").trim();
  }
  function embedOf(v) {
    return String((v && (v.embed || v.direct || v.embedUrl)) || "").replace("/d/", "/e/");
  }
  function isPutarinSeries(v) {
    var raw = embedOf(v) + " " + String((v && (v.source || v.category || v.folder)) || "");
    if (!/putarin|puterin/i.test(raw)) return false;
    var folder = String((v && v.folder) || "").toLowerCase();
    var title = String((v && v.title) || "");
    return folder === "series" || /s\d{1,2}\s*e\d{1,3}/i.test(title) || /episode\s*\d+/i.test(title);
  }
  function blocked(v) {
    return /videy/i.test(embedOf(v)) || isPutarinSeries(v);
  }
  function preview(v) {
    var raw = embedOf(v);
    var id = "";
    try {
      var u = new URL(raw, location.href);
      id = String(u.searchParams.get("id") || (u.pathname.split("/").filter(Boolean).pop() || ""));
    } catch (_) {}
    if (/mumu\.watch/i.test(raw) && id) return "<img src=\"https://m-cdn.video/hls/" + id + "/thumbnail.jpg\" alt=\"\" loading=\"lazy\">";
    if (/putarin|puterin/i.test(raw) && id && v && v.poster) return "<img src=\"" + String(v.poster).replace(/"/g, "") + "\" alt=\"\" loading=\"lazy\">";
    if (/putarin|puterin/i.test(raw) && id) return "<img src=\"/api/poster?id=" + encodeURIComponent(id) + "\" alt=\"\" loading=\"lazy\">";
    return "";
  }
  function pick(list, n) {
    var a = (list || []).filter(function (v) { return !blocked(v); });
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a.slice(0, n);
  }
  function fill() {
    var modal = document.getElementById("videoModal");
    var hr = document.getElementById("hubRight");
    if (!modal || modal.classList.contains("hidden") || !hr) return;
    if (hr.querySelectorAll(".vcard").length >= 6) return;
    var items = pick(put, 4).concat(pick(mumu, 4)).slice(0, 8);
    if (!items.length) return;
    hr.innerHTML = "<h2>Rekomendasi</h2><div class=\"vgrid\">" + items.map(function (v, i) {
      return "<button type=\"button\" class=\"vcard\" data-i=\"" + i + "\"><div class=\"vph\">" + preview(v) + "</div><span>" + esc(titleOf(v)) + "</span></button>";
    }).join("") + "</div>";
    hr.querySelectorAll(".vcard").forEach(function (btn) {
      btn.onclick = function () {
        var v = items[parseInt(btn.getAttribute("data-i"), 10)];
        var native = document.getElementById("modalNativeVideo");
        var iframe = document.getElementById("modalIframe");
        if (native) {
          try { native.pause(); } catch (_) {}
          native.removeAttribute("src");
          native.style.display = "none";
        }
        if (iframe) {
          iframe.style.display = "";
          iframe.src = embedOf(v);
        }
        var ht = document.getElementById("hubTitle");
        var mt = document.getElementById("modalTitle");
        var t = titleOf(v);
        if (ht) ht.textContent = t;
        if (mt) mt.textContent = t;
      };
    });
  }
  Promise.all([
    fetch("/data/putarin.json").then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch("/data/mumu.json").then(function (r) { return r.json(); }).catch(function () { return []; })
  ]).then(function (arr) {
    put = arr[0] || [];
    mumu = arr[1] || [];
    fill();
    setInterval(fill, 1000);
  });
})();
