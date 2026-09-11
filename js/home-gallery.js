(function () {
  if (window.__kdpHome) return;
  window.__kdpHome = true;
  var PER = 24;
  var list = [];
  var cat = "all";
  function codeOf(v) {
    var u = String((v && (v.embed || v.direct || v.embedUrl)) || "");
    var m = u.match(/[?&]id=([A-Za-z0-9_-]+)/) || u.match(/\/(?:e|v|d)\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : String((v && v.id) || "");
  }
  function embedOf(v) {
    return String((v && (v.embed || v.direct || v.embedUrl)) || "").replace("/d/", "/e/");
  }
  function titleOf(v) {
    return String((v && v.title) || "Video").replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
  }
  function inferCat(v) {
    var raw = embedOf(v);
    var t = titleOf(v);
    var c = String((v && (v.category || v.folder)) || "").trim();
    if (c && !/^(putarin|campur|mix|pilihan|lainnya|umum)$/i.test(c)) return c;
    if (/hentai/i.test(t + " " + c)) return "Hentai ENG";
    if (/\bai\b|ai\s*\d/i.test(t)) return "AI";
    if (/anime/i.test(t)) return "Anime";
    if (/\b(film|movie)\b|\(20\d\d\)/i.test(t)) return "Film";
    if (/s\d{1,2}\s*e\d{1,3}|episode\s*\d+/i.test(t)) return "Series";
    if (/lulu/i.test(raw)) return "Lulu";
    if (/streamtape|strcloud/i.test(raw)) return "Streamtape";
    if (/putarin|puterin|\bjav\b|[a-z]{2,6}-\d{3}/i.test(raw + " " + t)) return "JAV";
    return c || "Umum";
  }
  function posterOf(v) {
    var id = codeOf(v);
    var raw = embedOf(v);
    if (/indoav/i.test(raw) && id) return "/api/thumb?h=indoav&id=" + encodeURIComponent(id);
    if (/userbokep/i.test(raw) && id) return "/api/thumb?h=userbokep&id=" + encodeURIComponent(id);
    if (/putarin|puterin/i.test(raw) && id) return "/api/poster?id=" + encodeURIComponent(id);
    if (/lulu/i.test(raw) && id) return "/p/" + encodeURIComponent(id) + ".jpg";
    if (/streamtape|strcloud/i.test(raw) && id) return "/api/thumb?h=streamtape&id=" + encodeURIComponent(id);
    return "/api/thumb?h=x&id=" + encodeURIComponent(id);
  }
  function pageNow() {
    var n = parseInt((location.search.match(/[?&]page=(\d+)/) || location.hash.match(/p(\d+)/) || [])[1] || "1", 10);
    return n > 0 ? n : 1;
  }
  function filtered() {
    if (!cat || cat === "all") return list;
    var want = String(cat).toLowerCase();
    return list.filter(function (v) {
      var k = inferCat(v).toLowerCase();
      if (want === "jav") return k === "jav" || /putarin|puterin/i.test(embedOf(v));
      return k === want || k.replace(/\s+/g, "-") === want;
    });
  }
  function cardHTML(v) {
    var id = codeOf(v);
    var t = titleOf(v);
    var c = inferCat(v);
    return '<a class="card video-card" href="/v/' + encodeURIComponent(id) + '">' +
      '<div class="thumb hg-ph"><img src="' + posterOf(v) + '" alt="' + t.replace(/"/g, "") + ' 18+" loading="lazy" width="640" height="360" onerror="this.onerror=null;this.src=\'/og-card.svg\'">' +
      '<span class="badge cat">' + c + "</span></div><h3>" + t.replace(/[<>]/g, "") + "</h3></a>";
  }
  function draw() {
    var items = filtered();
    var pages = Math.max(1, Math.ceil(items.length / PER));
    var p = Math.min(pageNow(), pages);
    var slice = items.slice((p - 1) * PER, p * PER);
    var grid = document.getElementById("videoGrid");
    var count = document.getElementById("videoCount");
    var pager = document.getElementById("pagination");
    if (count) count.textContent = items.length + " video";
    if (grid) grid.innerHTML = slice.map(cardHTML).join("") || "<p>Tidak ada video.</p>";
    if (pager) {
      var html = "";
      if (p > 1) html += '<a class="page-btn" href="?cat=' + encodeURIComponent(cat) + "&page=" + (p - 1) + '">Prev</a>';
      var a = Math.max(1, p - 2), b = Math.min(pages, p + 2);
      for (var i = a; i <= b; i++) html += '<a class="page-btn' + (i === p ? " on" : "") + '" href="?cat=' + encodeURIComponent(cat) + "&page=" + i + '">' + i + "</a>";
      if (p < pages) html += '<a class="page-btn" href="?cat=' + encodeURIComponent(cat) + "&page=" + (p + 1) + '">Next</a>';
      pager.innerHTML = html;
    }
  }
  function chips() {
    var wrap = document.getElementById("categoryPills");
    if (!wrap) return;
    var counts = {};
    list.forEach(function (v) {
      var k = inferCat(v);
      counts[k] = (counts[k] || 0) + 1;
    });
    var prefer = ["JAV", "Hentai ENG", "Series", "Film", "AI", "Anime", "Lulu", "Streamtape", "Amatir", "Jilbab", "STW", "Viral", "Colmek", "Tobrut", "Live", "Chindo", "Doggy", "Outdoor", "Bule", "Threesome", "Toilet", "Umum"];
    var keys = prefer.filter(function (k) { return counts[k]; });
    Object.keys(counts).forEach(function (k) {
      if (keys.indexOf(k) < 0) keys.push(k);
    });
    wrap.innerHTML = '<a class="pill hg-chip' + (cat === "all" ? " on" : "") + '" href="/" data-c="all">Semua</a>' +
      keys.map(function (k) {
        var slug = k.toLowerCase().replace(/\s+/g, "-");
        return '<a class="pill hg-chip' + (cat === slug || cat === k.toLowerCase() ? " on" : "") + '" href="/?cat=' + encodeURIComponent(slug) + '" data-c="' + slug + '">' + k + "</a>";
      }).join("");
  }
  var qs = new URLSearchParams(location.search);
  if (qs.get("cat")) cat = qs.get("cat");
  var hm = location.hash.match(/[?&#]c=([^&]+)/);
  if (hm) cat = decodeURIComponent(hm[1]);
  Promise.all([
    fetch("/data/videos.json").then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch("/data/putarin.json").then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch("/data/campur.json").then(function (r) { return r.json(); }).catch(function () { return []; })
  ]).then(function (pack) {
    function ok(v) {
      var u = embedOf(v);
      return !!codeOf(v) && !/videy/i.test(u);
    }
    list = [].concat(pack[0] || [], pack[1] || [], pack[2] || []).filter(ok);
    window.videoList = list;
    chips();
    draw();
  });
})();
