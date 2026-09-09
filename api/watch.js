function esc(s) {
  const map = Object.create(null);
  map["\x26"] = "\x26amp;";
  map["\x3c"] = "\x26lt;";
  map["\x3e"] = "\x26gt;";
  map['"'] = "\x26quot;";
  map["'"] = "\x26#39;";
  return String(s || "").replace(/[&<>"']/g, function (ch) { return map[ch]; });
}
function keyOf(v) {
  const u = String((v && (v.embed || v.direct || v.embedUrl)) || "");
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
async function loadJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch (_) { return []; }
}
module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && (req.query.id || req.query.v)) || "").replace(/^\//, "").trim();
    if (!id) { res.writeHead(302, { Location: "/" }); return res.end(); }
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const base = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/";
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.com").split(",")[0];
    const origin = "https://" + host;
    const [putList, mumuList, vidList] = await Promise.all([
      loadJson(base + "putarin.json"),
      loadJson(base + "mumu.json"),
      loadJson(base + "videos.json")
    ]);
    const all = [].concat(putList, mumuList, vidList);
    const video = all.find(function (v) { return keyOf(v).toLowerCase() === id.toLowerCase(); });
    let title = id;
    let cat = "Video";
    let embed = "https://puterin.biz/e/" + id;
    let back = "/";
    if (video) {
      title = cleanTitle(video.title);
      cat = video.folder || video.category || "Video";
      embed = String(video.embed || video.direct || "").replace("/d/", "/e/");
      if (/mumu/i.test(embed + " " + cat)) back = "/mumu";
      else if (/putarin|puterin/i.test(embed + " " + cat)) back = "/putarin";
    }
    const related = all.filter(function (v) {
      const k = keyOf(v);
      return k && k.toLowerCase() !== id.toLowerCase();
    }).slice(0, 8);
    const cards = related.map(function (v) {
      const kid = keyOf(v);
      const raw = String(v.embed || v.direct || "");
      let media = "";
      if (/\.mp4($|\?)/i.test(String(v.direct || ""))) media = "<video src=\"" + esc(v.direct) + "\" muted playsinline preload=\"metadata\"></video>";
      else if (/indoav|userbokep/i.test(raw)) media = "<iframe src=\"" + esc(raw) + "\"></iframe>";
      else if (v.poster || v.thumb) media = "<img src=\"" + esc(v.poster || v.thumb) + "\" alt=\"\">";
      return "<a class=\"card\" href=\"/v/" + encodeURIComponent(kid) + "\"><div class=\"ph\">" + media + "</div><h3>" + esc(cleanTitle(v.title)) + "</h3></a>";
    }).join("");
    const html = "<!DOCTYPE html><html lang=id><head><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><title>" +
      esc(title) + " | Dr. Pinguin</title><link rel=stylesheet href=\"/css/rec-grid.css?v=ui3\"><style>" +
      ":root{--bg:#0b0d12;--acc:#ff9000;--line:#232838}*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:#e8ecf4;font-family:system-ui,sans-serif}a{color:inherit;text-decoration:none}" +
      ".wrap{width:min(1180px,calc(100% - 24px));margin:0 auto}header{border-bottom:1px solid var(--line)}.hd{display:flex;align-items:center;gap:10px;min-height:52px}.logo{font-weight:900}.logo b{color:var(--acc)}" +
      "main{padding:16px 0 40px}.layout{display:grid;grid-template-columns:1fr;gap:16px}@media(min-width:960px){.layout{grid-template-columns:minmax(0,1.7fr) 320px}}" +
      ".player{position:relative;aspect-ratio:16/9;background:#000;border:1px solid var(--line);border-radius:14px;overflow:hidden}.player iframe,.player video{position:absolute;inset:0;width:100%;height:100%;border:0}" +
      "h1{font-size:20px;margin:12px 0 8px}.acts{display:flex;gap:8px;flex-wrap:wrap}.acts a,.acts button{height:40px;min-width:112px;padding:0 16px;border-radius:10px;border:1px solid var(--line);background:#171b26;color:#fff;font-weight:700;display:inline-flex;align-items:center;justify-content:center}.acts .p{background:var(--acc);color:#111;border-color:var(--acc)}" +
      ".side h2{margin:0 0 10px;font-size:14px}.sg{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ph{position:relative;aspect-ratio:16/9;background:#1c1c1c;border-radius:10px;overflow:hidden}.ph img,.ph video,.ph iframe{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0}" +
      ".card h3{margin:6px 0 0;font-size:12px;height:2.6em;overflow:hidden}</style></head><body>" +
      "<header><div class=wrap><div class=hd><a class=logo href=/>DR.<b>PINGUIN</b></a></div></div></header>" +
      "<main class=wrap><div class=layout><div><div class=player>" +
      (/\.mp4($|\?)/i.test(embed) ? "<video controls autoplay playsinline src=\"" + esc(embed) + "\"></video>" : "<iframe src=\"" + esc(embed) + "\" allow=\"autoplay;encrypted-media;fullscreen\" allowfullscreen></iframe>") +
      "</div><h1>" + esc(title) + "</h1><div class=acts><button class=p type=button id=btnShare>Bagikan</button><a href=\"" + esc(back) + "\">Kembali</a></div></div>" +
      "<aside class=side><h2>Rekomendasi</h2><div class=sg>" + cards + "</div></aside></div></main>" +
      "<script>(function(){var b=document.getElementById('btnShare');if(b)b.onclick=function(){if(navigator.share)navigator.share({title:document.title,url:location.href}).catch(function(){});else if(navigator.clipboard)navigator.clipboard.writeText(location.href);};})();</script></body></html>";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "private, no-store");
    res.statusCode = 200;
    return res.end(html);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("Error. <a href='/'>Home</a>");
  }
};
