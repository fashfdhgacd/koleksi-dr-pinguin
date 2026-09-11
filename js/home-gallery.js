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
  function kindOf(v) {
    return String((v && (v.category || v.folder)) || "Umum");
  }
  function hostOk(v) {
    var u = embedOf(v).toLowerCase();
    return /indoav|userbokep/.test(u);
  }
  function pageNow() {
    var n = parseInt((location.hash.match(/p(\d+)/) || [])[1] || sessionStorage.getItem("kdp_page") || "1", 10);
    return n > 0 ? n : 1;
  }
  function setPage(n) {
    try { sessionStorage.setItem("kdp_page", String(n)); } catch (_) {}
    var h = "#p" + n;
    if (cat && cat !== "all") h += "&c=" + encodeURIComponent(cat);
    if (location.pathname === "/" && location.hash !== h) history.replaceState(null, "", "/" + h);
  }
  function filtered() {
    if (!cat || cat === "all") return list;
    return list.filter(function (v) { return kindOf(v) === cat; });
  }
  function cardHTML(v) {
    var id = codeOf(v);
    return '<article class="video-card hg-card" data-id="' + id + '">' +
      '<div class="hg-ph"><span class="hg-play">▶</span></div>' +
      '<h3 class="hg-title">' + titleOf(v).replace(/[<>]/g, "") + '</h3></article>';
  }
  function bindCards(root, items) {
    if (!root) return;
    root.querySelectorAll(".video-card").forEach(function (card, i) {
      card.onclick = function () {
        var v = items[i];
        if (!v) return;
        if (window.kdpPlay) window.kdpPlay(v);
      };
    });
  }
  function draw() {
    var items = filtered();
    var pages = Math.max(1, Math.ceil(items.length / PER));
    var p = Math.min(pageNow(), pages);
    setPage(p);
    var slice = items.slice((p - 1) * PER, p * PER);
    var grid = document.getElementById("videoGrid");
    var count = document.getElementById("videoCount");
    var pager = document.getElementById("pagination");
    if (count) count.textContent = items.length + " video";
    if (grid) grid.innerHTML = slice.map(cardHTML).join("") || "<p>Tidak ada video.</p>";
    bindCards(grid, slice);
    if (pager) {
      var html = "";
      if (p > 1) html += '<button type="button" class="hg-pg" data-p="' + (p - 1) + '">Prev</button>';
      var a = Math.max(1, p - 2), b = Math.min(pages, p + 2);
      for (var i = a; i <= b; i++) html += '<button type="button" class="hg-pg' + (i === p ? " on" : "") + '" data-p="' + i + '">' + i + '</button>';
      if (p < pages) html += '<button type="button" class="hg-pg" data-p="' + (p + 1) + '">Next</button>';
      pager.innerHTML = html;
      pager.querySelectorAll("[data-p]").forEach(function (btn) {
        btn.onclick = function () {
          setPage(parseInt(btn.getAttribute("data-p"), 10));
          draw();
          var sec = document.getElementById("terbaru");
          if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
        };
      });
    }
  }
  function chips() {
    var wrap = document.getElementById("categoryPills");
    if (!wrap) return;
    var counts = {};
    list.forEach(function (v) {
      var k = kindOf(v);
      counts[k] = (counts[k] || 0) + 1;
    });
    var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 10);
    wrap.innerHTML = '<button type="button" class="hg-chip' + (cat === "all" ? " on" : "") + '" data-c="all">Semua</button>' +
      keys.map(function (k) {
        return '<button type="button" class="hg-chip' + (cat === k ? " on" : "") + '" data-c="' + k.replace(/"/g, "") + '">' + k + '</button>';
      }).join("");
    wrap.querySelectorAll("[data-c]").forEach(function (btn) {
      btn.onclick = function () {
        cat = btn.getAttribute("data-c") || "all";
        setPage(1);
        chips();
        draw();
      };
    });
  }
  function heroAndTrend() {
    var hero = list[0];
    var slides = document.getElementById("heroSlides");
    if (hero && slides) {
      slides.innerHTML = '<div class="hg-ph" style="position:absolute;inset:0;border-radius:0;border:0"><span class="hg-play">▶</span></div>';
      slides.onclick = function () { if (window.kdpPlay) window.kdpPlay(hero); };
      slides.style.cursor = "pointer";
    }
    if (hero) {
      var ht = document.getElementById("heroTitle");
      var hm = document.getElementById("heroMeta");
      var hp = document.getElementById("heroPlay");
      if (ht) ht.textContent = titleOf(hero);
      if (hm) hm.textContent = kindOf(hero);
      if (hp) hp.onclick = function () { if (window.kdpPlay) window.kdpPlay(hero); };
    }
    var trend = document.getElementById("trendingGrid");
    if (trend && list.length) {
      var pool = list.slice();
      for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
      var pick = pool.slice(0, 8);
      trend.innerHTML = pick.map(cardHTML).join("");
      bindCards(trend, pick);
    }
  }
  var m = location.hash.match(/[?&#]c=([^&]+)/);
  if (m) cat = decodeURIComponent(m[1]);
  fetch("/data/videos.json", { cache: "force-cache" })
    .then(function (r) { return r.json(); })
    .then(function (rows) {
      list = (Array.isArray(rows) ? rows : []).filter(hostOk);
      window.videoList = list;
      chips();
      heroAndTrend();
      draw();
    })
    .catch(function () {
      var g = document.getElementById("videoGrid");
      if (g) g.innerHTML = "<p>Gagal memuat daftar video.</p>";
    });
})();
