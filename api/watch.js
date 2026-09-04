module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && (req.query.id || req.query.v)) || "").replace(/^\//, "").trim();
    if (!id) {
      res.writeHead(302, { Location: "/" });
      return res.end();
    }

    const BLOCK = /\b(underage|bocil)\b/i;
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const raw = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/videos.json";
    const rr = await fetch(raw + "?t=" + Date.now());
    if (!rr.ok) throw new Error("json " + rr.status);
    const list = await rr.json();

    const needle = id.toLowerCase();
    const video = (Array.isArray(list) ? list : []).find((v) => {
      const u = String(v.embed || v.direct || v.embedUrl || "");
      let key = "";
      try {
        const url = new URL(u);
        key = url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop() || "";
      } catch (_) {
        key = u.split("/").pop() || "";
      }
      key = String(key).replace(/\.(mp4|mov)$/i, "");
      return key.toLowerCase() === needle || String(v.id || "").toLowerCase() === needle;
    });

    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.com").split(",")[0];
    const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
    const origin = proto + "://" + host;
    const page = origin + "/v/" + encodeURIComponent(id);

    if (!video) {
      res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end("<!doctype html><html lang=id><head><meta charset=utf-8><title>Tidak ditemukan</title></head><body style='background:#0d0d0d;color:#eee;font-family:sans-serif;padding:24px'><a href='/' style='color:#ff9000'>← Gallery</a><p>Video tidak ada.</p></body></html>");
    }

    const titleRaw = String(video.title || "Video");
    const catRaw = String(video.category || "");
    if (BLOCK.test(titleRaw + " " + catRaw) ) {
      res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Robots-Tag", "noindex");
      return res.end("<!doctype html><html lang=id><head><meta charset=utf-8><meta name=robots content=noindex><title>Tidak tersedia</title></head><body style='background:#0d0d0d;color:#eee;font-family:sans-serif;padding:24px'><a href='/' style='color:#ff9000'>← Gallery</a><p>Konten tidak tersedia.</p></body></html>");
    }

    const title = titleRaw.replace(/\s*-\s*koleksidrpinguin.*/i, "").replace(/_/g, " ").replace(/\s+/g, " ").trim() || "Video";
    const cat = catRaw || "Video";
    const embed = String(video.embed || video.direct || video.embedUrl || "").replace("/d/", "/e/");
    const desc = title + " — " + cat + " | koleksidrpinguin.com 18+.";
    const card = origin + "/og-card.svg";
    const date = String(video.date || "").slice(0, 10);

    const ld = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: title,
      description: desc,
      thumbnailUrl: [card],
      inLanguage: "id",
      isFamilyFriendly: false,
      genre: cat,
      url: page,
      embedUrl: embed,
      publisher: {
        "@type": "Organization",
        name: "Dr. Pinguin",
        url: origin + "/"
      },
      potentialAction: { "@type": "WatchAction", target: page }
    };
    if (date) ld.uploadDate = date;

    const safe = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="origin">
<title>${safe(title)} | Dr. Pinguin</title>
<meta name="description" content="${safe(desc)}">
<meta name="robots" content="index,follow">
<meta name="rating" content="adult">
<link rel="canonical" href="${safe(page)}">
<meta property="og:type" content="video.other">
<meta property="og:site_name" content="koleksidrpinguin.com">
<meta property="og:title" content="${safe(title)}">
<meta property="og:description" content="${safe(desc)}">
<meta property="og:url" content="${safe(page)}">
<meta property="og:image" content="${safe(card)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safe(title)}">
<meta name="twitter:image" content="${safe(card)}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
body{margin:0;background:#0d0d0d;color:#eee;font-family:system-ui,sans-serif}
.wrap{max-width:960px;margin:0 auto;padding:16px}
.player{position:relative;padding-top:56.25%;background:#111;border-radius:8px;overflow:hidden;border:1px solid #222}
.player iframe,.player .poster{position:absolute;inset:0;width:100%;height:100%;border:0}
.poster{display:flex;align-items:center;justify-content:center;background:#111;color:#ff9000;font-size:42px;cursor:pointer}
h1{font-size:1.15rem;line-height:1.35;margin:14px 0 6px}
.meta{color:#888;font-size:13px}
a{color:#ff9000}
</style>
</head>
<body>
<div class="wrap">
<p><a href="/">← koleksidrpinguin.com</a></p>
<div class="player" id="box">
  <div class="poster" id="poster" role="button">▶</div>
</div>
<h1>${safe(title)}</h1>
<p class="meta">${safe(cat)}${date ? " · " + date : ""} · 18+</p>
</div>
<script>
(function(){
  var embed = ${json.dumps(embed)};
  var poster = document.getElementById("poster");
  if (!poster || !embed) return;
  poster.addEventListener("click", function(){
    var f = document.createElement("iframe");
    f.src = embed;
    f.allow = "autoplay;fullscreen;encrypted-media";
    f.allowFullscreen = true;
    f.setAttribute("referrerpolicy","origin");
    document.getElementById("box").innerHTML = "";
    document.getElementById("box").appendChild(f);
  });
})();
</script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=86400");
    res.status(200).send(html);
  } catch (e) {
    console.error(e);
    res.status(500).setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<!doctype html><html><body>Error. <a href='/'>Home</a></body></html>");
  }
};
