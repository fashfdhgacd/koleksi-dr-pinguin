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
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#000000">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>${esc(title)} | Dr. Pinguin</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(page)}">
<meta property="og:image" content="${esc(img)}">
<link rel="canonical" href="${esc(page)}">
<style>
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#050505;color:#eee;font-family:system-ui,-apple-system,Segoe UI,sans-serif;overflow-x:hidden;-webkit-text-size-adjust:100%}
a{color:#ff9000;text-decoration:none}
header{position:sticky;top:0;z-index:30;background:#000;border-bottom:2px solid #ff9000;padding-top:env(safe-area-inset-top)}
.nav{width:min(1100px,100%);margin:0 auto;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:48px}
.brand{display:flex;align-items:center;gap:8px;font-weight:900;font-size:15px;min-width:0}
.brand img{width:26px;height:26px;border-radius:6px;object-fit:cover;flex:none}
.brand span{white-space:nowrap}
.brand b{color:#ff9000}
.back{flex:none;font-size:11px;font-weight:800;text-transform:uppercase;border:1px solid #333;padding:8px 10px;border-radius:999px;color:#ddd}
.wrap{width:min(1100px,100%);margin:0 auto;padding:0 0 28px}
.player-wrap{background:#000}
.player{position:relative;width:100%;aspect-ratio:16/9;max-height:70vh;background:#111}
.player iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
.body{padding:14px 14px 0;padding-left:max(14px,env(safe-area-inset-left));padding-right:max(14px,env(safe-area-inset-right))}
h1{font-size:18px;line-height:1.35;margin:12px 0 6px;word-break:break-word}
.meta{color:#888;font-size:12px;margin:0 0 12px}
.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0 16px}
.btn{display:flex;align-items:center;justify-content:center;min-height:44px;padding:10px 8px;border-radius:10px;font-size:12px;font-weight:800;text-transform:uppercase;border:1px solid #2a2a2a;background:#161616;color:#eee;cursor:pointer;-webkit-tap-highlight-color:transparent}
.btn.primary{background:#ff9000;color:#000;border-color:#ff9000}
.btn.wide{grid-column:1/-1}
.note{color:#666;font-size:12px;line-height:1.4}
footer{margin-top:22px;padding:14px 0 max(16px,env(safe-area-inset-bottom));border-top:1px solid #1c1c1c;color:#666;font-size:11px}
@media (min-width:720px){
  .wrap{padding:16px 16px 40px}
  .player-wrap{border-radius:12px;overflow:hidden;border:1px solid #222}
  .player{max-height:none}
  h1{font-size:24px}
  .actions{display:flex;flex-wrap:wrap}
  .btn{min-width:120px;padding:8px 12px}
  .btn.wide{grid-column:auto}
}
</style>
</head>
<body>
<header>
  <div class="nav">
    <a class="brand" href="/"><img src="/logo.png" alt=""><span>DR.<b>PINGUIN</b></span></a>
    <a class="back" href="/">Gallery</a>
  </div>
</header>
<div class="wrap">
  <div class="player-wrap"><div class="player"><iframe src="${esc(embed)}" allow="autoplay;fullscreen;encrypted-media" allowfullscreen referrerpolicy="origin"></iframe></div></div>
  <div class="body">
    <h1>${esc(title)}</h1>
    <p class="meta">${esc(cat)} · 18+</p>
    <div class="actions">
      <a class="btn primary" href="/">Kembali</a>
      <button class="btn" id="copy" type="button">Salin link</button>
      <a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${shareText}">WhatsApp</a>
      <a class="btn" target="_blank" rel="noopener" href="https://t.me/share/url?url=${shareUrl}&text=${encodeURIComponent(title)}">Telegram</a>
      <a class="btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}">Facebook</a>
      <a class="btn" target="_blank" rel="noopener" href="${esc(embed)}">Sumber</a>
    </div>
    <p class="note">Kalau player tidak jalan di HP, ketuk Sumber.</p>
    <footer>Koleksi Dr. Pinguin · 18+ only</footer>
  </div>
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
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=86400");
    return res.end(html);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("<!doctype html><html><body style='background:#050505;color:#eee;font-family:sans-serif;padding:24px'>Error. <a href='/' style='color:#ff9000'>Kembali ke gallery</a></body></html>");
  }
};
