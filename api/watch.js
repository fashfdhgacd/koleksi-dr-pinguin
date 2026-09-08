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
function isBlockedSource(s) {
  return /indoav|userbokep/i.test(String(s || ""));
}
function esc(s) {
  return String(s || "").replace(/[&<>"']/g, function (ch) {
    if (ch === "&") return "&" + "amp;";
    if (ch === "<") return "&" + "lt;";
    if (ch === ">") return "&" + "gt;";
    if (ch === '"') return "&" + "quot;";
    return "&#39;";
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
function pickRelated(list, currentId, n) {
  const BLOCK = /\b(underage|bocil)\b/i;
  const cur = String(currentId || "").toLowerCase();
  const out = [];
  (list || []).forEach(function (v) {
    const raw = String((v && (v.embed || v.direct || v.embedUrl || v.source || "")) || "");
    if (isBlockedSource(raw)) return;
    if (!isPutarinBlob(raw + " " + (v.category || "") + " " + (v.folder || "")) && !isMumuBlob(raw + " " + (v.category || "") + " " + (v.folder || ""))) return;
    const id = keyOf(v);
    if (!id || id.toLowerCase() === cur) return;
    const title = cleanTitle(v.title);
    const c = String(v.folder || v.category || "");
    if (BLOCK.test(title + " " + c)) return;
    out.push({ id: id, title: title, cat: c || "Video" });
  });
  return out.slice(0, n);
}
function pageHtml(opts) {
  const title = opts.title;
  const cat = opts.cat;
  const embed = opts.embed;
  const back = opts.back || "/";
  const page = opts.page;
  const mp4 = String(opts.contentUrl || "");
  const date = String(opts.date || "").slice(0, 10);
  const tall = Boolean(opts.tall);
  const related = Array.isArray(opts.related) ? opts.related : [];
  const t = encodeURIComponent(title || "");
  const u = encodeURIComponent(page || "");
  const txt = encodeURIComponent((title || "") + "\n" + (page || ""));
  const desc = (title + " - " + cat + " | 18+.").slice(0, 160);
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description: desc,
    inLanguage: "id",
    isFamilyFriendly: false,
    genre: cat,
    url: page,
    embedUrl: embed
  };
  if (mp4) ld.contentUrl = mp4;
  if (date) ld.uploadDate = date;
  const player = mp4
    ? "<video controls playsinline preload=\"metadata\" src=\"" + esc(mp4) + "\"></video>"
    : "<iframe src=\"" + esc(embed) + "\" allow=\"autoplay;encrypted-media;fullscreen\" allowfullscreen referrerpolicy=\"origin\"></iframe>";
  const relHtml = related.map(function (r) {
    return "<a class=\"card\" href=\"/v/" + encodeURIComponent(r.id) + "\"><div class=\"ph\"></div><span>" + esc(r.title) + "</span></a>";
  }).join("");
  return [
    "<!DOCTYPE html><html lang=\"id\"><head><meta charset=\"utf-8\">",
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">",
    "<title>", esc(title), " | Dr. Pinguin</title>",
    "<meta name=\"description\" content=\"", esc(desc), "\">",
    "<meta name=\"robots\" content=\"index,follow\"><meta name=\"rating\" content=\"adult\">",
    "<link rel=\"canonical\" href=\"", esc(page), "\">",
    "<script type=\"application/ld+json\">", JSON.stringify(ld), "</script>",
    "<style>",
    "*{box-sizing:border-box}html,body{margin:0;background:#0f0f0f;color:#f1f1f1;font-family:Roboto,system-ui,sans-serif}",
    "a{color:#fff;text-decoration:none}button{font:inherit;background:0;border:0;color:#fff}",
    "header{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 12px}",
    ".brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px}.brand img{width:22px;height:22px;border-radius:4px}.brand b{color:#ff9000}",
    ".back{font-size:13px;color:#aaa}",
    ".player{position:relative;width:100%;aspect-ratio:16/9;background:#000}",
    ".player.tall{aspect-ratio:9/16;max-height:70vh}",
    ".player iframe,.player video{position:absolute;inset:0;width:100%;height:100%;border:0}",
    ".info{padding:10px 12px 6px}h1{margin:0;font-size:15px;line-height:1.35;font-weight:700}",
    ".sub{margin:4px 0 0;color:#aaa;font-size:12px}",
    ".acts{display:flex;gap:6px;padding:6px 12px 10px;overflow:auto}",
    ".acts a,.acts button{flex:0 0 auto;height:32px;padding:0 11px;border-radius:16px;background:#272727;font-size:12px;font-weight:600}",
    ".acts .wa{background:#ff9000;color:#111}",
    ".rel{padding:4px 12px 28px}.rel h2{margin:0 0 10px;font-size:12px;color:#888;font-weight:700;letter-spacing:.06em}",
    ".grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 8px}",
    ".card{display:block}.ph{position:relative;aspect-ratio:16/9;background:#1c1c1c;border-radius:8px}",
    ".ph:after{content:\"\";position:absolute;left:50%;top:50%;width:0;height:0;border-style:solid;border-width:8px 0 8px 14px;border-color:transparent transparent transparent #ff9000;transform:translate(-30%,-50%)}",
    ".card span{display:block;margin-top:6px;font-size:12px;line-height:1.3;max-height:2.6em;overflow:hidden}",
    "</style></head><body>",
    "<header><a class=\"brand\" href=\"/\"><img src=\"/logo.png\" alt=\"\"><span>DR.<b>PINGUIN</b></span></a><a class=\"back\" href=\"", esc(back), "\">Kembali</a></header>",
    "<div class=\"player", tall ? " tall" : "", "\">", player, "</div>",
    "<div class=\"info\"><h1>", esc(title), "</h1><p class=\"sub\">", esc(cat), " · 18+", date ? " · " + esc(date) : "", "</p></div>",
    "<div class=\"acts\"><a class=\"wa\" href=\"https://wa.me/?text=", txt, "\">WhatsApp</a>",
    "<a href=\"https://t.me/share/url?url=", u, "&text=", t, "\">Telegram</a>",
    "<a href=\"https://x.com/intent/post?text=", txt, "\">X</a>",
    "<button type=\"button\" id=\"btnCopy\">Salin</button></div>",
    related.length ? "<div class=\"rel\"><h2>BERIKUTNYA</h2><div class=\"grid\">" + relHtml + "</div></div>" : "",
    "<script>var PAGE=", JSON.stringify(page), ";var b=document.getElementById('btnCopy');if(b)b.onclick=function(){navigator.clipboard.writeText(PAGE).then(function(){b.textContent='Tersalin';});};</script>",
    "</body></html>"
  ].join("");
}
async function loadJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch (_) {
    return [];
  }
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
    if (!id) {
      res.writeHead(302, { Location: "/" });
      return res.end();
    }
    const BLOCK = /\b(underage|bocil)\b/i;
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const base = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/";
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.com").split(",")[0];
    const origin = "https://" + host;
    const page = origin + "/v/" + encodeURIComponent(id);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=86400");
    function send(extra) {
      res.statusCode = 200;
      return res.end(pageHtml(Object.assign({ id: id, page: page }, extra)));
    }
    const mumuList = await loadJson(base + "mumu.json");
    const putList = await loadJson(base + "putarin.json");
    let pool = mumuList;
    let video = findVideo(pool, id);
    if (!video) {
      pool = putList;
      video = findVideo(pool, id);
    }
    if (!video) {
      pool = await loadJson(base + "videos.json");
      video = findVideo(pool, id);
    }
    const relatedPool = [].concat(putList || [], mumuList || []);
    if (!video) {
      return send({ title: id, cat: "Putarin", embed: "https://puterin.biz/e/" + id, back: "/putarin", related: pickRelated(relatedPool, id, 8) });
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
    if (mumu) {
      embed = "https://mumu.watch/e/" + (putarinCode(raw) || id);
      back = "/mumu";
      cat = "Video AI China";
    } else if (put) {
      embed = "https://puterin.biz/e/" + (putarinCode(raw) || id);
      back = "/putarin";
    }
    return send({
      title: title,
      cat: cat,
      embed: embed,
      back: back,
      tall: Boolean(mumu),
      contentUrl: mp4Of(video, id),
      date: String(video.date || "").slice(0, 10),
      related: pickRelated(relatedPool, id, 8)
    });
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("Error. <a href='/'>Home</a>");
  }
};
