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
  const playerClass = tall ? "screen tall" : "screen";
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
    "<meta name=\"robots\" content=\"index,follow\"><meta name=\"rating\" content=\"adult\">",
    "<link rel=\"canonical\" href=\"", esc(page), "\">",
    "<meta property=\"og:type\" content=\"video.other\">",
    "<meta property=\"og:title\" content=\"", esc(title), "\">",
    "<meta property=\"og:url\" content=\"", esc(page), "\">",
    "<meta property=\"og:image\" content=\"", esc(thumb), "\">",
    "<script type=\"application/ld+json\">", JSON.stringify(ld), "</script>",
    "<style>",
    ":root{--bg:#070708;--card:#111113;--line:#242428;--txt:#f3f3f4;--muted:#8b8b93;--ph:#ff9000}",
    "*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--txt);font-family:Inter,system-ui,-apple-system,sans-serif}",
    "a{color:var(--ph);text-decoration:none}button{font:inherit;cursor:pointer}",
    "body{min-height:100vh;background:radial-gradient(1200px 500px at 50% -80px,#1a1208 0%,#070708 55%)}",
    ".top{position:sticky;top:0;z-index:30;backdrop-filter:blur(14px);background:rgba(7,7,8,.86);border-bottom:1px solid var(--line)}",
    ".top-in{max-width:1080px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:10px 16px}",
    ".logo{display:flex;align-items:center;gap:8px;font-weight:900;letter-spacing:.04em}.logo img{width:28px;height:28px;border-radius:8px}",
    ".logo b{color:var(--ph)}",
    ".ghost{height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:#0d0d10;color:#ddd;font-size:12px;font-weight:700}",
    ".wrap{max-width:1080px;margin:0 auto;padding:14px 12px 48px}",
    ".frame{background:#000;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.45)}",
    ".screen{position:relative;width:100%;aspect-ratio:16/9;background:#000}",
    ".screen.tall{aspect-ratio:9/16;max-height:74vh;margin:0 auto;width:min(100%,calc(74vh * 9 / 16))}",
    ".screen iframe,.screen video{position:absolute;inset:0;width:100%;height:100%;border:0}",
    ".panel{padding:18px 4px 0}",
    "h1{margin:0 0 10px;font-size:20px;line-height:1.3;letter-spacing:-.02em}",
    ".row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}",
    ".chip{font-size:11px;font-weight:700;color:#cfcfd4;background:#16161a;border:1px solid var(--line);border-radius:999px;padding:5px 10px}",
    ".chip.hot{color:#111;background:var(--ph);border-color:var(--ph)}",
    ".share{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
    ".btn{height:46px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--txt);font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center}",
    ".btn.wa{background:var(--ph);border-color:var(--ph);color:#111}",
    ".more{margin-top:22px;padding:16px;border:1px solid var(--line);border-radius:16px;background:rgba(17,17,19,.8)}",
    ".more p{margin:0 0 10px;color:var(--muted);font-size:13px}",
    ".more a{display:inline-flex;height:38px;align-items:center;padding:0 12px;border-radius:10px;background:#16161a;border:1px solid var(--line);color:#fff;font-size:12px;font-weight:700;margin-right:8px}",
    "@media(min-width:860px){.wrap{padding:22px 20px 64px}h1{font-size:28px}.share{grid-template-columns:repeat(4,1fr)}.panel{padding:22px 2px 0}}",
    "</style></head><body>",
    "<div class=\"top\"><div class=\"top-in\">",
    "<a class=\"logo\" href=\"/\"><img src=\"/logo.png\" alt=\"\"><span>DR.<b>PINGUIN</b></span></a>",
    "<a class=\"ghost\" href=\"", esc(back), "\">Kembali</a></div></div>",
    "<main class=\"wrap\"><div class=\"frame\"><div class=\"", playerClass, "\">", player, "</div></div>",
    "<section class=\"panel\"><h1>", esc(title), "</h1>",
    "<div class=\"row\"><span class=\"chip hot\">18+</span><span class=\"chip\">", esc(cat), "</span>", date ? "<span class=\"chip\">" + esc(date) + "</span>" : "", "</div>",
    "<div class=\"share\">",
    "<a class=\"btn wa\" href=\"https://wa.me/?text=", txt, "\">WhatsApp</a>",
    "<a class=\"btn\" href=\"https://t.me/share/url?url=", u, "&text=", t, "\">Telegram</a>",
    "<a class=\"btn\" href=\"https://x.com/intent/post?text=", txt, "\">Bagikan X</a>",
    "<button class=\"btn\" type=\"button\" id=\"btnCopy\">Salin link</button>",
    "</div>",
    "<div class=\"more\"><p>Lanjut browsing koleksi</p>",
    "<a href=\"/\">Terbaru</a><a href=\"/putarin\">Putarin</a><a href=\"/mumu\">Mumu</a>",
    "</div></section></main>",
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
