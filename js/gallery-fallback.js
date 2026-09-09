(function () {
  if (window.__kdpFallback) return;
  window.__kdpFallback = true;
  var SEED = [
    { id: "vpKTZf5dkiTw", title: "Gadis Berhijab Pulang Kerja Nekad Mesum Di Wc Umum", category: "Jilbab", embed: "https://tv1.indoav.app/e/vpKTZf5dkiTw" },
    { id: "GC9dQ9KyIH9w", title: "Ukhty Arab Cantik Review Badan Tobrut", category: "Jilbab", embed: "https://tv1.indoav.app/e/GC9dQ9KyIH9w" },
    { id: "8zYCnWZIkjsU", title: "Jilbab hott", category: "Jilbab", embed: "https://tv1.indoav.app/e/8zYCnWZIkjsU" },
    { id: "lptLrg663e50", title: "Hijab Omek Sampai Muncrat", category: "Jilbab", embed: "https://tv1.indoav.app/e/lptLrg663e50" },
    { id: "ATdeiC6ceqhI", title: "Kakek Kembali Merasakan Kenikmatan Sewaktu Muda", category: "Amatir", embed: "https://tv1.indoav.app/e/ATdeiC6ceqhI" },
    { id: "etOk5UvQ2Mbo", title: "Prank Ojol Suruh Ngewe", category: "Amatir", embed: "https://tv1.indoav.app/e/etOk5UvQ2Mbo" },
    { id: "CO9Ce6JaOJIs", title: "Mbak ojol ngajak ngentot", category: "Amatir", embed: "https://tv1.indoav.app/e/CO9Ce6JaOJIs" },
    { id: "pnVqx0yUFvLE", title: "ngemut kontol kakak", category: "Amatir", embed: "https://tv1.indoav.app/e/pnVqx0yUFvLE" },
    { id: "sm9DJJKRpXyu", title: "Bokep Indo Dengan Adik Menyimpan Rahasia", category: "ABG", embed: "https://tv1.indoav.app/e/sm9DJJKRpXyu" },
    { id: "UATIeL8wZdKc", title: "abg mungil nyobain anal", category: "ABG", embed: "https://tv1.indoav.app/e/UATIeL8wZdKc" },
    { id: "dvB1N7RWNRbK", title: "Cuma Bangunin Tidur Adik Doang", category: "ABG", embed: "https://tv1.indoav.app/e/dvB1N7RWNRbK" },
    { id: "tZhsqvXer77s", title: "abg amira memek mulus", category: "ABG", embed: "https://tv1.indoav.app/e/tZhsqvXer77s" },
    { id: "Z7JvHykg2JOa", title: "abg brondong dipaksa tante binal", category: "STW", embed: "https://tv1.userbokep.com/e/Z7JvHykg2JOa" },
    { id: "7kyjPHveLgpf", title: "Kebaya Ungu STW Check In Di Hotel", category: "STW", embed: "https://tv1.indoav.app/e/7kyjPHveLgpf" },
    { id: "xQTMa1JQZvki", title: "Tante Bohay Kesepian di Rumah", category: "STW", embed: "https://tv1.indoav.app/e/xQTMa1JQZvki" },
    { id: "5poResQAi5JU", title: "TANTE PENJAGA SALON", category: "STW", embed: "https://tv1.indoav.app/e/5poResQAi5JU" },
    { id: "TdqM5K4UHU", title: "SDDE-703 Marina Yuzuki", category: "JAV", embed: "https://panel.putarin.com/e/TdqM5K4UHU" },
    { id: "u5qRj55WAx", title: "Night King (2026)", category: "JAV", embed: "https://panel.putarin.com/e/u5qRj55WAx" },
    { id: "VvGEqWWTPx", title: "FSDSS-797 JAV Sub Indo", category: "JAV", embed: "https://panel.putarin.com/e/VvGEqWWTPx" },
    { id: "tqzUmtBr6u", title: "FSDSS-497 Yuko Ono", category: "JAV", embed: "https://panel.putarin.com/e/tqzUmtBr6u" },
    { id: "7lf1g050674", title: "Video AI China 7lf1g050674", category: "AI China", embed: "https://mumu.watch/e/7lf1g050674" },
    { id: "49rtkl1ufll", title: "Video AI China 49rtkl1ufll", category: "AI China", embed: "https://mumu.watch/e/49rtkl1ufll" },
    { id: "53kxsao2u94", title: "Video AI China 53kxsao2u94", category: "AI China", embed: "https://mumu.watch/e/53kxsao2u94" },
    { id: "yr6s8me8iud", title: "Video AI China yr6s8me8iud", category: "AI China", embed: "https://mumu.watch/e/yr6s8me8iud" }
  ];
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function posterOf(v) {
    if (window.KDP_POSTERS && window.KDP_POSTERS[v.id]) return window.KDP_POSTERS[v.id];
    if (/mumu\.watch/i.test(v.embed)) return "https://m-cdn.video/hls/" + v.id + "/thumbnail.jpg";
    if (/putarin|puterin/i.test(v.embed)) return "/api/poster?id=" + encodeURIComponent(v.id);
    return "";
  }
  function emptyGrid() {
    var el = document.getElementById("videoGrid");
    if (!el) return false;
    var cards = el.querySelectorAll(".video-card, article, a.card");
    return cards.length < 3;
  }
  function openItem(v) {
    var modal = document.getElementById("videoModal");
    var iframe = document.getElementById("modalIframe");
    if (!modal || !iframe) return;
    modal.classList.remove("hidden");
    var mt = document.getElementById("modalTitle");
    var mm = document.getElementById("modalMeta");
    if (mt) mt.textContent = v.title;
    if (mm) mm.textContent = v.category;
    iframe.style.display = "";
    iframe.src = v.embed;
    if (v.id) history.replaceState(null, "", "/#v=" + encodeURIComponent(v.id));
  }
  function paint(list) {
    var el = document.getElementById("videoGrid");
    if (!el) return;
    var items = shuffle(list);
    el.innerHTML = items.map(function (v) {
      var src = posterOf(v);
      var img = src ? "<img src=\"" + src.replace(/\"/g, "") + "\" alt=\"\" loading=\"lazy\" class=\"w-full h-full object-cover\">" : "";
      return '<article class=\"video-card group cursor-pointer\" data-fallback=\"1\"><div class=\"relative aspect-video rounded overflow-hidden bg-black border border-neutral-800\">' +
        img + '<span class=\"absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] z-10\">' + v.category + "</span></div>" +
        '<h3 class=\"text-sm mt-2\">' + v.title + "</h3></article>";
    }).join("");
    var count = document.getElementById("videoCount");
    if (count) count.textContent = items.length + " video cadangan";
    el.querySelectorAll("[data-fallback]").forEach(function (card, i) {
      card.addEventListener("click", function () { openItem(items[i]); });
    });
  }
  function run() {
    if (!emptyGrid()) return;
    fetch("/data/fallback.json").then(function (r) { return r.ok ? r.json() : SEED; }).then(function (d) {
      paint(Array.isArray(d) && d.length ? d : SEED);
    }).catch(function () { paint(SEED); });
  }
  setTimeout(run, 3500);
  setTimeout(run, 8000);
})();
