module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && (req.query.id || req.query.v)) || "")
      .replace(/^\//, "")
      .trim();
    if (!id) {
      res.writeHead(302, { Location: "/" });
      return res.end();
    }

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
      return key.toLowerCase() === needle || String(v.id).toLowerCase() === needle;
    });

    const host = (req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.com").split(",")[0];
    const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0];
    const origin = proto + "://" + host;
    const page = origin + "/v/" + encodeURIComponent(id);

    if (!video) {
      res.writeHead(302, { Location: "/?v=" + encodeURIComponent(id) });
      return res.end();
    }

    const title = String(video.title || "Video")
      .replace(/\s*-\s*koleksidrpinguin.*/i, "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const cat = String(video.category || "Video");
    const embed = String(video.embed || video.direct || video.embedUrl || "").replace("/d/", "/e/");
    const desc = title + " — " + cat + " | Koleksi Dr. Pinguin Bokep, M.S.B. 18+.";
    const logo = origin + "/logo.png";
    const watch = origin + "/?v=" + encodeURIComponent(id);
    const date = String(video.date || "").slice(0, 10);

    const ld = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: title,
      description: desc,
      thumbnailUrl: [logo],
      inLanguage: "id",
      isFamilyFriendly: false,
      genre: cat,
      url: page,
      embedUrl: embed,
      contentUrl: embed,
      publisher: {
        "@type": "Organization",
        name: "Dr. Pinguin Bokep, M.S.B.",
        logo: { "@type": "ImageObject", url: logo }
      },
      potentialAction: { "@type": "WatchAction", target: page }
    };
    if (date) ld.uploadDate = date;

    const safe = (s) => String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safe(title)} | Dr. Pinguin</title>
<meta name="description" content="${safe(desc)}">
<meta name="robots" content="index,follow">
<meta name="rating" content="adult">
<link rel="canonical" href="${safe(page)}">
<meta property="og:type" content="video.other">
<meta property="og:title" content="${safe(title)}">
<meta property="og:description" content="${safe(desc)}">
<meta property="og:url" content="${safe(page)}">
<meta property="og:image" content="${safe(logo)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${safe(title)}">
<meta name="twitter:description" content="${safe(desc)}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
body{margin:0;background:#0d0d0d;color:#eee;font-family:system-ui,sans-serif}
.wrap{max-width:960px;margin:0 auto;padding:16px}
.player{position:relative;padding-top:56.25%;background:#000;border-radius:8px;overflow:hidden}
.player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
h1{font-size:1.15rem;line-height:1.35;margin:14px 0 6px}
.meta{color:#888;font-size:13px;margin-bottom:16px}
a{color:#ff9000}
</style>
</head>
<body>
<div class="wrap">
<p><a href="/">← Dr. Pinguin</a></p>
<div class="player"><iframe src="${safe(embed)}" allow="autoplay;fullscreen" allowfullscreen referrerpolicy="origin"></iframe></div>
<h1>${safe(title)}</h1>
<p class="meta">${safe(cat)}${date ? " · " + date : ""} · 18+</p>
<p><a href="${safe(watch)}">Buka di gallery</a></p>
</div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
    res.status(200).send(html);
  } catch (e) {
    console.error(e);
    res.writeHead(302, { Location: "/" });
    res.end();
  }
};
