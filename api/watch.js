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
    if (ch === "&") return "&" + "amp;";
    if (ch === "<") return "&" + "lt;";
    if (ch === ">") return "&" + "gt;";
    if (ch === '"') return "&" + "quot;";
    return "&#39;";
  });
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
function pageHtml(opts) {
  const title = opts.title;
  const cat = opts.cat;
  const embed = opts.embed;
  const back = opts.back || "/";
  const page = opts.page;
  const mp4 = String(opts.contentUrl || "");
  const date = String(opts.date || "").slice(0, 10);
  const tall = Boolean(opts.tall);
  const desc = String(opts.desc || (title + " - " + cat + " | koleksidrpinguin.com. 18+."))
    .replace(/\s+/g, " ")
    .slice(0, 160);
  const origin = String(page || "https://koleksidrpinguin.com").split("/v/")[0] || "https://koleksidrpinguin.com";
  const thumb = origin + "/api/thumb?title=" + encodeURIComponent(title || "Video") + "&cat=" + encodeURIComponent(cat || "Video");
  const t = encodeURIComponent(title || "");
  const u = encodeURIComponent(page || "");
  const txt = encodeURIComponent((title || "") + "\n" + (page || ""));
  const playerClass = tall ? "player tall" : "player";
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description: desc,
    inLanguage: "id",
    isFamilyFriendly: false,
    genre: cat,
    url: page,
    embedUrl: embed,
    thumbnailUrl: thumb,
    publisher: { "@type": "Organization", name: "Dr. Pinguin", url: origin + "/" }
  };
  if (mp4) ld.contentUrl = mp4;
  if (date) ld.uploadDate = date;
  const player = mp4
    ? "<video controls playsinline preload=\"metadata\" poster=\"" + esc(thumb) + "\" src=\"" + esc(mp4) + "\"></video>"
    : "<iframe src=\"" + esc(embed) + "\" allow=\"autoplay;encrypted-media;fullscreen\" allowfullscreen referrerpolicy=\"origin\"></iframe>";
  return [
    "<!DOCTYPE html><html lang=\"id\"><head><meta charset=\"utf-8\">",
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">",
    "<title>", esc(title), " | Dr. Pinguin</title>",
    "<meta name=\"description\" content=\"", esc(desc), "\">",
    "<meta name=\"robots\" content=\"index,follow\">",
    "<meta name=\"rating\" content=\"adult\">",
    "<link rel=\"canonical\" href=\"", esc(page), "\">",
    "<meta property=\"og:type\" content=\"video.other\">",
    "<meta property=\"og:title\" content=\"", esc(title), "\">",
    "<meta property=\"og:url\" content=\"", esc(page), "\">",
    "<meta property=\"og:image\" content=\"", esc(thumb), "\">",
    "<meta name=\"twitter:card\" content=\"summary_large_image\">",
    "<script type=\"application/ld+json\">", JSON.stringify(ld), "</script>",
    "<style>",
    "*{box-sizing:border-box}html,body{margin:0;background:#050505;color:#eee;font-family:system-ui,-apple-system,sans-serif}",
    "a{color:#ff9000;text-decoration:none}button{font:inherit}",
    "header{position:sticky;top:0;z-index:20;background:#000;border-bottom:2px solid #ff9000}",
    ".nav{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px}",
    ".brand{font-weight:900;letter-spacing:.02em}.brand b{color:#ff9000}",
    ".back{color:#ff9000;font-size:13px;font-weight:700}",
    ".stage{background:#000;padding:0}",
    ".player{position:relative;width:100%;aspect-ratio:16/9;background:#111}",
    ".player.tall{aspect-ratio:9/16;max-height:78vh;margin:0 auto;width:min(100%,calc(78vh * 9 / 16))}",
    ".player iframe,.player video{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}",
    ".body{padding:16px 16px 40px}",
    "h1{font-size:18px;line-height:1.35;margin:0 0 8px;font-weight:800}",
    ".meta{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px}",
    ".pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#161616;border:1px solid #2a2a2a;color:#bbb;font-size:11px;font-weight:700}",
    ".actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    ".btn{display:flex;align-items:center;justify-content:center;height:44px;border-radius:12px;border:1px solid #2a2a2a;background:#161616;color:#eee;font-size:13px;font-weight:700}",
    ".btn.primary{background:#ff9000;border-color:#ff9000;color:#111}",
    "@media(min-width:900px){",
    ".nav,.body,.stage{width:min(980px,100%);margin:0 auto}",
    ".stage{padding:18px 0 0}",
    ".player,.player.tall{width:100%;aspect-ratio:16/9;max-height:none;border-radius:14px;overflow:hidden;border:1px solid #222}",
    "h1{font-size:24px}.actions{grid-template-columns:repeat(4,1fr)}",
    "}",
    "</style></head><body>",
    "<header><div class=\"nav\"><a class=\"brand\" href=\"/\">DR.<b>PINGUIN</b></a><a class=\"back\" href=\"", esc(back), "\">Kembali</a></div></header>",
    "<div class=\"stage\"><div class=\"", playerClass, "\">", player, "</div></div>",
    "<div class=\"body\"><h1>", esc(title), "</h1>",
    "<p class=\"meta\"><span class=\"pill\">", esc(cat), "</span><span class=\"pill\">18+</span>", date ? "<span class=\"pill\">" + esc(date) + "</span>" : "", "</p>",
    "<div class=\"actions\">",
    "<a class=\"btn primary\" href=\"https://wa.me/?text=", txt, "\">WhatsApp</a>",
    "<a class=\"btn\" href=\"https://t.me/share/url?url=", u, "&text=", t, "\">Telegram</a>",
    "<a class=\"btn\" href=\"https://x.com/intent/post?text=", txt, "\">X</a>",
    "<button class=\"btn\" type=\"button\" id=\"btnCopy\">Salin link</button>",
    "</div></div>",
    "<script>var PAGE=", JSON.stringify(page), ";var b=document.getElementById('btnCopy');if(b)b.onclick=function(){navigator.clipboard.writeText(PAGE).then(function(){b.textContent='Tersalin';setTimeout(function(){b.textContent='Salin link';},1200);});};</script>",
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
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
    function send(extra) {
      res.statusCode = 200;
      return res.end(pageHtml(Object.assign({ id: id, page: page }, extra)));
    }
    let video = findVideo(await loadJson(base + "mumu.json"), id);
    if (!video) video = findVideo(await loadJson(base + "putarin.json"), id);
    if (!video) video = findVideo(await loadJson(base + "videos.json"), id);
    if (!video) {
      return send({ title: id, cat: "Putarin", embed: "https://puterin.biz/e/" + id, back: "/putarin" });
    }
    const title = String(video.title || "Video").replace(/\s*-\s*koleksidrpinguin.*/i, "").replace(/_/g, " ").trim() || "Video";
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
      date: String(video.date || "").slice(0, 10)
    });
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("Error. <a href='/'>Home</a>");
  }
};
