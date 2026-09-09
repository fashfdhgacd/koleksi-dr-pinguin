const CACHE_MS = 10 * 60 * 1000;
let mem = { t: 0, put: [], mumu: [], vid: [] };
function esc(s) {
  const map = Object.create(null);
  map["\x26"] = "\x26amp;";
  map["\x3c"] = "\x26lt;";
  map["\x3e"] = "\x26gt;";
  map['"'] = "\x26quot;";
  map["'"] = "\x26#39;";
  return String(s || "").replace(/[&<>"']/g, function (ch) { return map[ch]; });
}
function rawOf(v) {
  return String((v && (v.embed || v.direct || v.embedUrl)) || "");
}
function isPutarinSeries(v) {
  const raw = rawOf(v) + " " + String((v && (v.source || v.category || v.folder)) || "");
  if (!/putarin|puterin/i.test(raw)) return false;
  const folder = String((v && v.folder) || "").toLowerCase();
  const title = String((v && v.title) || "");
  return folder === "series" || /s\d{1,2}\s*e\d{1,3}/i.test(title) || /episode\s*\d+/i.test(title);
}
function isBlocked(v) {
  return /videy/i.test(rawOf(v)) || isPutarinSeries(v);
}
function keyOf(v) {
  const u = rawOf(v);
  try {
    const url = new URL(u);
    return String(url.searchParams.get("id") || (url.pathname.split("/").filter(Boolean).pop() || "")).replace(/\.(mp4|mov)$/i, "");
  } catch (_) {
    return String(u.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
  }
}
function cleanTitle(s) {
  return String(s || "Video").replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, "").replace(/koleksidrpinguin\.com/ig, "").replace(/\s+/g, " ").trim() || "Video";
}
function seriesKey(s) {
  return cleanTitle(s).toLowerCase().replace(/s\d{1,2}\s*e\d{1,3}/ig, " ").replace(/episode\s*\d+/ig, " ").replace(/part\s*\d+/ig, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 4).join(" ");
}
function shuffle(a) {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = x[i]; x[i] = x[j]; x[j] = t;
  }
  return x;
}
function mediaOf(v) {
  if (v.poster || v.thumb || v.thumbnail) return "<img src=\"" + esc(v.poster || v.thumb || v.thumbnail) + "\" alt=\"\" loading=\"lazy\">";
  const raw = rawOf(v);
  const id = keyOf(v);
  if (/mumu\.watch/i.test(raw) && id) return "<img src=\"https://m-cdn.video/hls/" + esc(id) + "/thumbnail.jpg\" alt=\"\" loading=\"lazy\">";
  if (/putarin|puterin/i.test(raw) && id) return "<img src=\"/api/poster?id=" + encodeURIComponent(id) + "\" alt=\"\" loading=\"lazy\">";
  if (isBlocked(v)) return "";
  if (/indoav/i.test(raw) && id) return "<img src=\"/api/thumb?h=indoav&id=" + encodeURIComponent(id) + "\" alt=\"\" loading=\"lazy\">";
  if (/userbokep/i.test(raw) && id) return "<img src=\"/api/thumb?h=userbokep&id=" + encodeURIComponent(id) + "\" alt=\"\" loading=\"lazy\">";
  return "<img src=\"/api/thumb\" alt=\"\">";
}
function pickRelated(lists, currentId, currentTitle, n) {
  const usedId = {};
  const usedSeries = {};
  usedId[String(currentId || "").toLowerCase()] = 1;
  const curS = seriesKey(currentTitle || "");
  if (curS) usedSeries[curS] = 1;
  const out = [];
  const buckets = lists.map(function (list) { return shuffle((list || []).slice(0, 400)); });
  let guard = 0;
  while (out.length < n && guard < 2000) {
    guard++;
    let added = false;
    for (let b = 0; b < buckets.length && out.length < n; b++) {
      const list = buckets[b];
      while (list.length) {
        const v = list.pop();
        if (isBlocked(v)) continue;
        const kid = keyOf(v);
        const title = cleanTitle(v.title);
        const sk = seriesKey(title);
        if (!kid || !title || usedId[kid.toLowerCase()] || (sk && usedSeries[sk])) continue;
        usedId[kid.toLowerCase()] = 1;
        if (sk) usedSeries[sk] = 1;
        out.push(v);
        added = true;
        break;
      }
    }
    if (!added) break;
  }
  return out;
}
async function loadJson(url) {
  try {
    const r = await fetch(url, { cache: "force-cache" });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch (_) { return []; }
}
async function catalogs() {
  if (mem.vid.length && Date.now() - mem.t < CACHE_MS) return mem;
  const owner = process.env.GH_OWNER || "fashfdhgacd";
  const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
  const base = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/";
  const [put, mumu, vid] = await Promise.all([
    loadJson(base + "putarin.json"),
    loadJson(base + "mumu.json"),
    loadJson(base + "videos.json")
  ]);
  mem = {
    t: Date.now(),
    put: put,
    mumu: mumu,
    vid: (vid || []).filter(function (v) { return !/videy/i.test(rawOf(v)); })
  };
  return mem;
}
module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && (req.query.id || req.query.v)) || "").replace(/^\//, "").trim();
    if (!id) { res.writeHead(302, { Location: "/" }); return res.end(); }
    const catas = await catalogs();
    const all = catas.put.concat(catas.mumu, catas.vid);
    const video = all.find(function (v) { return keyOf(v).toLowerCase() === id.toLowerCase(); });
    let title = id, cat = "Video", embed = "", back = "/";
    if (video) {
      title = cleanTitle(video.title);
      cat = video.folder || video.category || "Video";
      embed = rawOf(video).replace("/d/", "/e/");
      if (/mumu/i.test(embed + " " + cat)) back = "/mumu";
      else if (/putarin|puterin/i.test(embed + " " + cat)) back = "/putarin";
    } else {
      embed = "https://mumu.watch/e/" + id;
    }
    const related = pickRelated([catas.put, catas.mumu, catas.vid], id, title, 8);
    const cards = related.map(function (v) {
      return "<a class=\"card\" href=\"/v/" + encodeURIComponent(keyOf(v)) + "\" data-embed=\"" + esc(rawOf(v).replace("/d/", "/e/")) + "\" data-title=\"" + esc(cleanTitle(v.title)) + "\"><div class=\"ph\">" + mediaOf(v) + "</div><h3>" + esc(cleanTitle(v.title)) + "</h3></a>";
    }).join("");
    const player = /\.mp4($|\?)/i.test(embed) || /videy/i.test(embed)
      ? "<video controls playsinline preload=\"metadata\" src=\"" + esc(embed) + "\"></video>"
      : "<iframe src=\"" + esc(embed) + "\" allow=\"autoplay;encrypted-media;fullscreen\" allowfullscreen></iframe>";
    const html = "<!DOCTYPE html><html lang=id><head><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><title>" +
      esc(title) + " | Dr. Pinguin</title><link rel=stylesheet href=\"/css/rec-grid.css?v=lock1\"><style>" +
      ":root{--bg:#0b0d12;--acc:#ff9000;--line:#232838}*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:#e8ecf4;font-family:system-ui,sans-serif}a{color:inherit;text-decoration:none}" +
      ".wrap{width:min(1180px,calc(100% - 24px));margin:0 auto}header{border-bottom:1px solid var(--line)}.hd{min-height:52px;display:flex;align-items:center}.logo{font-weight:900}.logo b{color:var(--acc)}" +
      "main{padding:16px 0 40px}.layout{display:grid;grid-template-columns:1fr;gap:16px}@media(min-width:960px){.layout{grid-template-columns:minmax(0,1.7fr) 320px}}" +
      ".player{position:relative;aspect-ratio:16/9;background:#000;border:1px solid var(--line);border-radius:14px;overflow:hidden}.player iframe,.player video{position:absolute;inset:0;width:100%;height:100%;border:0}" +
      "h1{font-size:20px;margin:12px 0 8px}.acts{display:flex;gap:8px;flex-wrap:wrap}.acts a,.acts button{height:40px;min-width:112px;padding:0 16px;border-radius:10px;border:1px solid var(--line);background:#171b26;color:#fff;font-weight:700;display:inline-flex;align-items:center;justify-content:center}.acts .p{background:var(--acc);color:#111;border-color:var(--acc)}" +
      ".side h2{margin:0 0 10px;font-size:14px}.sg{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ph{position:relative;aspect-ratio:16/9;background:#1c1c1c;border-radius:10px;overflow:hidden}.ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}" +
      ".card h3{margin:6px 0 0;font-size:12px;height:2.6em;overflow:hidden}</style></head><body>" +
      "<header><div class=wrap><div class=hd><a class=logo href=/>DR.<b>PINGUIN</b></a></div></div></header>" +
      "<main class=wrap><div class=layout><div><div class=player>" + player +
      "</div><h1>" + esc(title) + "</h1><div class=acts><button class=p type=button id=btnShare>Bagikan</button><a href=\"" + esc(back) + "\">Kembali</a></div></div>" +
      "<aside class=side><h2>Rekomendasi</h2><div class=sg>" + cards + "</div></aside></div></main>" +
      "<script src=\"/js/watch-swap.js?v=2\"></script></body></html>";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=60");
    res.statusCode = 200;
    return res.end(html);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("Error. <a href='/'>Home</a>");
  }
};
