module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && (req.query.id || req.query.v)) || "").replace(/^\//, "").trim();
    if (!id) {
      res.writeHead(302, { Location: "/" });
      return res.end();
    }
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const rr = await fetch("https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/videos.json?t=" + Date.now());
    if (!rr.ok) throw new Error("json " + rr.status);
    const list = await rr.json();
    const needle = id.toLowerCase();
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
    const video = (Array.isArray(list) ? list : []).find(function (v) {
      return keyOf(v).toLowerCase() === needle || String(v.id || "").toLowerCase() === needle;
    });
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.site").split(",")[0];
    const origin = "https://" + host;
    const page = origin + "/v/" + encodeURIComponent(id);
    function esc(s) {
      return String(s || "").replace(/[&<>"']/g, function (ch) {
        return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
      });
    }
    if (!video) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end("<!doctype html><html><body style='background:#050505;color:#eee;font-family:sans-serif;padding:24px'><a href='/' style='color:#ff9000'>Kembali ke gallery</a><p>Video tidak ada.</p></body></html>");
    }
    const title = String(video.title || "Video").replace(/\s*-\s*koleksidrpinguin.*/i, "").replace(/_/g, " ").trim() || "Video";
    const cat = String(video.category || "Video");
    const embed = String(video.embed || video.direct || video.embedUrl || "").replace("/d/", "/e/");
    const desc = title + " - " + cat + " | Dr. Pinguin 18+";
    const img = origin + "/logo.png";
    const shareText = encodeURIComponent(title + "\n" + page);
    const shareUrl = encodeURIComponent(page);
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Dr. Pinguin</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(page)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:type" content="video.other">
<link rel="canonical" href="${esc(page)}">
<style>
*{box-sizing:border-box}body{margin:0;background:#050505;color:#eee;font-family:system-ui,-apple-system,sans-serif}
a{color:#ff9000;text-decoration:none}header{position:sticky;top:0;z-index:20;height:52px;background:#000;border-bottom:2px solid #ff9000;display:flex;align-items:center}
.nav{width:min(1100px,100%);margin:0 auto;padding:0 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.brand{display:flex;align-items:center;gap:8px;font-weight:900;letter-spacing:.02em}
.brand img{width:28px;height:28px;border-radius:6px;object-fit:cover}
.brand b{color:#ff9000}
.back{font-size:12px;font-weight:800;text-transform:uppercase;border:1px solid #333;padding:7px 10px;border-radius:8px;color:#ddd}
.wrap{width:min(1100px,100%);margin:0 auto;padding:18px 16px 40px}
.player{position:relative;padding-top:56.25%;background:#111;border:1px solid #222;border-radius:12px;overflow:hidden}
.player iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
h1{font-size:clamp(18px,3vw,26px);line-height:1.3;margin:16px 0 6px}
.meta{color:#888;font-size:13px;margin:0 0 16px}
.actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 22px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:800;text-transform:uppercase;border:1px solid #2a2a2a;background:#161616;color:#eee;cursor:pointer}
.btn.primary{background:#ff9000;color:#000;border-color:#ff9000}
.btn:hover{filter:brightness(1.08)}
.note{color:#666;font-size:12px}
footer{margin-top:28px;padding-top:16px;border-top:1px solid #1c1c1c;color:#666;font-size:12px}
</style>
</head>
<body>
<header>
  <div class="nav">
    <a class="brand" href="/"><img src="/logo.png" alt=""><span>DR.<b>PINGUIN</b></span></a>
    <a class="back" href="/">Kembali ke gallery</a>
  </div>
</header>
<div class="wrap">
  <div class="player"><iframe src="${esc(embed)}" allow="autoplay;fullscreen;encrypted-media" allowfullscreen referrerpolicy="origin"></iframe></div>
  <h1>${esc(title)}</h1>
  <p class="meta">${esc(cat)} · 18+</p>
  <div class="actions">
    <a class="btn primary" href="/">Gallery</a>
    <button class="btn" id="copy" type="button">Salin link</button>
    <a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${shareText}">WhatsApp</a>
    <a class="btn" target="_blank" rel="noopener" href="https://t.me/share/url?url=${shareUrl}&text=${encodeURIComponent(title)}">Telegram</a>
    <a class="btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}">Facebook</a>
    <a class="btn" target="_blank" rel="noopener" href="${esc(embed)}">Buka sumber</a>
  </div>
  <p class="note">Kalau player tidak jalan, pakai tombol Buka sumber.</p>
  <footer>Koleksi Dr. Pinguin · 18+ only · ${esc(host)}</footer>
</div>
<script>
(function(){
  var btn=document.getElementById('copy');
  if(!btn) return;
  btn.onclick=function(){
    var t=${JSON.stringify(title + "\n" + page)};
    var done=function(){btn.textContent='Tersalin';setTimeout(function(){btn.textContent='Salin link';},1400);};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done).catch(done);}
    else {done();}
  };
})();
</script>
</body>
</html>`;
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
    return res.end(html);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("<!doctype html><html><body style='background:#050505;color:#eee;font-family:sans-serif;padding:24px'>Error. <a href='/' style='color:#ff9000'>Kembali ke gallery</a></body></html>");
  }
};
