function putarinCode(u) {
  const m = String(u || "").match(/\/(?:e|v)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : "";
}
function isPutarinBlob(s) {
  return /putarin|puterin/i.test(String(s || ""));
}
function isMumuBlob(s) {
  return /mumu\.watch|mumustream|video ai china/i.test(String(s || ""));
}
function esc(s) {
  return String(s || "").replace(/[&<>"']/g, function (ch) {
    return ({ "&": "&" + "amp;", "<": "&" + "lt;", ">": "&" + "gt;", '"': "&" + "quot;", "'": "&#39;" })[ch];
  });
}
function cleanTitle(s) {
  return String(s || "Video")
    .replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, "")
    .replace(/Koleksi Dr\.?\s*Pinguin[^\n]*/ig, "")
    .replace(/Dr\.?\s*Pinguin Bokep,?\s*M\.?S\.?B\.?/ig, "")
    .replace(/\s*[-|\u2013\u2014]\s*koleksidrpinguin\.com/ig, "")
    .replace(/koleksidrpinguin\.com/ig, "")
    .replace(/\s*[-|\u2013\u2014]\s*$/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Video";
}
function seriesKey(s) {
  return cleanTitle(s)
    .replace(/s\d{1,2}\s*e\d{1,3}/ig, "")
    .replace(/episode\s*\d+/ig, "")
    .replace(/eps?\.?\s*\d+/ig, "")
    .replace(/part\s*\d+/ig, "")
    .replace(/\b\d{1,3}\b/g, "")
    .replace(/[-\u2013\u2014:|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function keyOf(v) {
  const u = String((v && (v.embed || v.direct || v.embedUrl)) || "");
  try {
    const url = new URL(u);
    const qid = url.searchParams.get("id");
    if (qid) return String(qid);
    const last = url.pathname.split("/").filter(Boolean).pop() || "";
    return last.replace(/\.(mp4|mov)$/i, "");
  } catch (_) {
    return String(u.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
  }
}
function mp4Of(v, id) {
  const d = String((v && v.direct) || "");
  if (/\.mp4($|\?)/i.test(d)) return d;
  const blob = String((v && (v.embed || v.embedUrl || v.source || "")) || "");
  if (/videy/i.test(d + blob) && id) return "https://cdn.videy.co/" + id + ".mp4";
  return "";
}
function posterOf(v, id) {
  if (v && (v.poster || v.thumb || v.thumbnail)) return v.poster || v.thumb || v.thumbnail;
  const raw = String((v && (v.embed || v.direct || v.embedUrl)) || "");
  const blob = raw + " " + String((v && (v.source || v.category || v.folder)) || "");
  const code = putarinCode(raw) || id;
  if (isMumuBlob(blob) && code) return "https://m-cdn.video/hls/" + code + "/thumbnail.jpg";
  if (isPutarinBlob(blob) && code) return "/api/poster?id=" + encodeURIComponent(code);
  if (/indoav/i.test(raw) && code) return "/api/thumb?h=indoav&id=" + encodeURIComponent(code);
  if (/userbokep/i.test(raw) && code) return "/api/thumb?h=userbokep&id=" + encodeURIComponent(code);
  return "/api/thumb";
}
function javCodeFrom(title, extra) {
  const s = String(title || "") + " " + String(extra || "");
  const m = s.match(/\b([A-Z]{2,6}-?\d{2,5})\b/i);
  return m ? m[1].toUpperCase() : "";
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function pickBucket(list, currentId, usedSeries, n) {
  const BLOCK = /\b(underage|bocil)\b/i;
  const cur = String(currentId || "").toLowerCase();
  const pool = shuffle(list || []);
  const out = [];
  const seenId = {};
  for (let i = 0; i < pool.length && out.length < n; i++) {
    const v = pool[i];
    const id = keyOf(v);
    if (!id || id.toLowerCase() === cur || seenId[id]) continue;
    const title = cleanTitle(v.title);
    const c = String(v.folder || v.category || "");
    if (BLOCK.test(title + " " + c)) continue;
    const sk = seriesKey(title);
    if (sk && usedSeries[sk]) continue;
    seenId[id] = 1;
    if (sk) usedSeries[sk] = 1;
    const embed = String(v.embed || v.direct || "").replace("/d/", "/e/");
    out.push({ id: id, title: title, cat: c || "Video", poster: posterOf(v, id), mp4: mp4Of(v, id), embed: embed, code: javCodeFrom(title, c) });
  }
  return out;
}
function mixRelated(putList, mumuList, vidList, currentId, currentTitle) {
  const used = {};
  const curSeries = seriesKey(currentTitle || "");
  if (curSeries) used[curSeries] = 1;
  const a = pickBucket(putList, currentId, used, 3);
  const b = pickBucket(mumuList, currentId, used, 2);
  const c = pickBucket(vidList, currentId, used, 3);
  let extra = [];
  if (a.length + b.length + c.length < 8) {
    extra = pickBucket([].concat(putList || [], mumuList || [], vidList || []), currentId, used, 8 - (a.length + b.length + c.length));
  }
  return shuffle(a.concat(b, c, extra)).slice(0, 8);
}
function relatedMedia(r) {
  if (r.mp4) return "<video src=\"" + esc(r.mp4) + "\" muted playsinline preload=\"metadata\"></video>";
  if (r.embed && /indoav|userbokep/i.test(r.embed)) {
    return "<iframe src=\"" + esc(r.embed) + "\" loading=\"lazy\" tabindex=\"-1\"></iframe>";
  }
  const src = r.poster || "/api/thumb";
  return "<img src=\"" + esc(src) + "\" alt=\"\" loading=\"lazy\" onerror=\"this.onerror=null;this.src='/api/thumb'\">";
}
function pageHtml(opts) {
  const title = opts.title;
  const cat = opts.cat;
  const embed = opts.embed;
  const back = opts.back || "/";
  const page = opts.page;
  const mp4 = String(opts.contentUrl || "");
  const date = String(opts.date || "").slice(0, 10);
  const poster = String(opts.poster || "/api/thumb");
  const code = String(opts.code || javCodeFrom(title, cat));
  const related = Array.isArray(opts.related) ? opts.related : [];
  const desc = (title + " - " + cat + " | 18+.").slice(0, 160);
  const playSrc = mp4 || embed;
  const playerInner = mp4
    ? "<video controls autoplay playsinline src=\"" + esc(mp4) + "\"></video>"
    : (playSrc
      ? "<iframe src=\"" + esc(playSrc) + "\" allow=\"autoplay;encrypted-media;fullscreen\" allowfullscreen referrerpolicy=\"origin\"></iframe>"
      : "<div class=\"hold\"><div class=\"hint\">Video belum tersedia.</div></div>");
  const relHtml = related.map(function (r) {
    var badge = r.code ? "<span class=\"code\">" + esc(r.code) + "</span>" : "";
    return "<a class=\"card\" href=\"/v/" + encodeURIComponent(r.id) + "\"><div class=\"ph\">" + relatedMedia(r) + badge + "</div><h3>" + esc(r.title) + "</h3><p>" + esc(r.cat || "") + "</p></a>";
  }).join("");
  return [
    "<!DOCTYPE html><html lang=\"id\"><head><meta charset=\"utf-8\">",
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">",
    "<title>", esc(title), " | Dr. Pinguin</title>",
    "<link rel=\"icon\" href=\"/favicon.png\">",
    "<link rel=\"stylesheet\" href=\"/css/rec-grid.css?v=ui2\">",
    "<style>",
    ":root{--bg:#0b0d12;--card:#141824;--line:#232838;--txt:#e8ecf4;--dim:#9aa3b5;--acc:#ff9000}",
    "*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--txt);font-family:system-ui,sans-serif}",
    "a{color:inherit;text-decoration:none}button{font:inherit;cursor:pointer}",
    ".wrap{width:min(1180px,calc(100% - 24px));margin:0 auto}",
    "header{position:sticky;top:0;z-index:30;background:#0b0d12f2;border-bottom:1px solid var(--line)}",
    ".hd{display:flex;align-items:center;gap:12px;min-height:56px}",
    ".logo{display:flex;align-items:center;gap:8px;font-weight:900;flex:none}.logo img{width:28px;height:28px;border-radius:6px;object-fit:cover}.logo b{color:var(--acc)}",
    ".search{flex:1;position:relative;min-width:0;max-width:420px}.search input{width:100%;height:38px;border-radius:999px;border:1px solid var(--line);background:#10131b;color:#fff;padding:0 38px 0 14px}",
    ".search button{position:absolute;right:4px;top:4px;width:30px;height:30px;border:0;border-radius:999px;background:transparent;color:var(--dim)}",
    ".nav{display:flex;gap:8px;overflow:auto;padding:0 0 10px}.nav a{flex:none;height:30px;padding:0 12px;border-radius:999px;background:#171b26;color:#c9d0de;font-size:12px;font-weight:700;display:flex;align-items:center}",
    ".nav a.on{background:var(--acc);color:#111}",
    "main{padding:18px 0 40px}",
    ".layout{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}@media(min-width:960px){.layout{grid-template-columns:minmax(0,1.7fr) 320px}}",
    ".player{position:relative;aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden;border:1px solid var(--line)}",
    ".player iframe,.player video,.hold{position:absolute;inset:0;width:100%;height:100%;border:0}",
    ".hold{display:flex;align-items:center;justify-content:center;background:#111}",
    "h1{font-size:22px;line-height:1.25;margin:14px 0 8px}",
    ".badges{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}",
    ".badge{height:26px;padding:0 10px;border-radius:999px;background:#1a1f2c;color:#c5ccda;font-size:11px;font-weight:700;display:inline-flex;align-items:center}",
    ".acts{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}",
    ".acts a,.acts button{box-sizing:border-box;height:40px;min-width:112px;padding:0 16px;border-radius:10px;border:1px solid var(--line);background:#171b26;color:#fff;font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;margin:0}",
    ".acts .p{background:var(--acc);color:#111;border-color:var(--acc)}",
    ".side h2{margin:0 0 10px;font-size:14px;display:flex;align-items:center;gap:8px}.side h2:before{content:\"\";width:3px;height:14px;background:var(--acc);border-radius:2px}",
    ".sg{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:stretch}",
    ".card{display:flex;flex-direction:column;min-width:0;height:100%}.ph{position:relative;aspect-ratio:16/9;width:100%;background:#1c1c1c;border-radius:10px;overflow:hidden;flex:none}",
    ".ph img,.ph video,.ph iframe{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0;pointer-events:none}",
    ".card h3{margin:6px 0 2px;font-size:12px;line-height:1.3;height:2.6em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.card p{margin:0;color:var(--dim);font-size:11px;height:1.2em;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}",
    "footer{border-top:1px solid var(--line);padding:18px 0 28px;color:var(--dim);font-size:12px}",
    "@media(max-width:640px){h1{font-size:18px}.wrap{width:calc(100% - 16px)}.acts a,.acts button{flex:1 1 calc(50% - 8px)}}",
    "</style></head><body>",
    "<header><div class=\"wrap\"><div class=\"hd\">",
    "<a class=\"logo\" href=\"/\"><img src=\"/logo.png\" alt=\"\"><span>DR.<b>PINGUIN</b></span></a>",
    "<form class=\"search\" action=\"/putarin\" method=\"get\"><input name=\"q\" placeholder=\"Cari kode, judul, atau kategori...\"><button type=\"submit\" aria-label=\"Cari\">&#128269;</button></form>",
    "</div><nav class=\"nav\">",
    "<a href=\"/\">Terbaru</a><a href=\"/putarin\">JAV</a><a href=\"/mumu\">AI China</a>",
    cat ? "<a class=\"on\" href=\"/\">" + esc(cat) + "</a>" : "",
    "</nav></div></header>",
    "<main class=\"wrap\"><div class=\"layout\"><div>",
    "<div class=\"player\" id=\"box\">", playerInner, "</div>",
    "<h1>", esc(title), "</h1>",
    "<div class=\"badges\"><span class=\"badge\">", esc(cat || "Video"), "</span><span class=\"badge\">18+</span></div>",
    "<div class=\"acts\"><button class=\"p\" type=\"button\" id=\"btnShare\">Bagikan</button><a href=\"", esc(back), "\">Kembali</a></div>",
    "</div><aside class=\"side\">",
    related.length ? "<h2>Rekomendasi</h2><div class=\"sg\">" + relHtml + "</div>" : "",
    "</aside></div></main>",
    "<footer><div class=\"wrap\">&copy; 2026 Dr. Pinguin</div></footer>",
    "<script>(function(){var sh=document.getElementById('btnShare');if(sh)sh.onclick=function(){if(navigator.share){navigator.share({title:document.title,url:location.href}).catch(function(){})}else if(navigator.clipboard)navigator.clipboard.writeText(location.href);};})();</script>",
    "</body></html>"
  ].join("");
}
async function loadJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch (_) { return []; }
}
function findVideo(list, id) {
  const needle = String(id || "").toLowerCase();
  return (list || []).find(function (v) {
    return keyOf(v).toLowerCase() === needle || String(v.id || "").toLowerCase() === needle;
  });
}
module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && (req.query.id || req.query.v)) || "").replace(/^\//, "").trim();
    if (!id) { res.writeHead(302, { Location: "/" }); return res.end(); }
    const BLOCK = /\b(underage|bocil)\b/i;
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const base = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/";
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.com").split(",")[0];
    const origin = "https://" + host;
    const page = origin + "/v/" + encodeURIComponent(id);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "private, no-store");
    function send(extra) { res.statusCode = 200; return res.end(pageHtml(Object.assign({ id: id, page: page }, extra))); }
    let mumuList = await loadJson(base + "mumu.json");
    let putList = await loadJson(base + "putarin.json");
    let vidList = await loadJson(base + "videos.json");
    if (!vidList.length) vidList = await loadJson(origin + "/data/videos.json");
    if (!putList.length) putList = await loadJson(origin + "/data/putarin.json");
    if (!mumuList.length) mumuList = await loadJson(origin + "/data/mumu.json");
    let video = findVideo(mumuList, id) || findVideo(putList, id) || findVideo(vidList, id);
    const relatedOf = function (title) { return mixRelated(putList, mumuList, vidList, id, title); };
    if (!video) {
      return send({ title: id, cat: "Putarin", embed: "https://puterin.biz/e/" + id, back: "/putarin", poster: "/api/poster?id=" + encodeURIComponent(id), related: relatedOf(id) });
    }
    const title = cleanTitle(video.title);
    const cat0 = String(video.folder || video.category || "Video");
    if (BLOCK.test(title + " " + cat0)) {
      res.statusCode = 404;
      return res.end("<p>Konten tidak tersedia. <a href='/'>Home</a></p>");
    }
    const raw = String(video.embed || video.direct || video.embedUrl || "");
    const blob = raw + " " + String(video.source || "") + " " + String(video.category || "") + " " + String(video.folder || "");
    const put = isPutarinBlob(blob);
    const mumu = isMumuBlob(blob);
    let embed = raw.replace("/d/", "/e/");
    let back = "/";
    let cat = cat0;
    if (mumu) { embed = "https://mumu.watch/e/" + (putarinCode(raw) || id); back = "/mumu"; cat = "Video AI China"; }
    else if (put) { embed = "https://puterin.biz/e/" + (putarinCode(raw) || id); back = "/putarin"; }
    return send({ title: title, cat: cat, embed: embed, back: back, poster: posterOf(video, id), contentUrl: mp4Of(video, id), date: String(video.date || "").slice(0, 10), related: relatedOf(title) });
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("Error. <a href='/'>Home</a>");
  }
};
