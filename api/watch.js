module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && (req.query.id || req.query.v)) || "").replace(/^\//, "").trim();
    if (!id) {
      res.writeHead(302, { Location: "/" });
      return res.end();
    }
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const raw = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/videos.json?t=" + Date.now();
    const rr = await fetch(raw);
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
      return res.end("<!doctype html><html><body style='background:#0d0d0d;color:#eee;font-family:sans-serif;padding:24px'><a href='/' style='color:#ff9000'>Gallery</a><p>Video tidak ada.</p></body></html>");
    }
    const title = String(video.title || "Video").replace(/\s*-\s*koleksidrpinguin.*/i, "").replace(/_/g, " ").trim() || "Video";
    const cat = String(video.category || "Video");
    const embed = String(video.embed || video.direct || video.embedUrl || "").replace("/d/", "/e/");
    const desc = title + " - " + cat + " | koleksidrpinguin.site 18+";
    const img = origin + "/logo.png";
    const html = "<!DOCTYPE html><html lang=id><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>" + esc(title) + " | Dr. Pinguin</title><meta name=description content='" + esc(desc) + "'><meta property=og:title content='" + esc(title) + "'><meta property=og:description content='" + esc(desc) + "'><meta property=og:url content='" + esc(page) + "'><meta property=og:image content='" + esc(img) + "'><meta property=og:type content='video.other'><link rel=canonical href='" + esc(page) + "'><style>body{margin:0;background:#0d0d0d;color:#eee;font-family:system-ui,sans-serif}.wrap{max-width:960px;margin:0 auto;padding:16px}.player{position:relative;padding-top:56.25%;background:#111;border-radius:8px;overflow:hidden}.player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}a{color:#ff9000}</style></head><body><div class=wrap><p><a href=/>koleksidrpinguin.site</a></p><div class=player><iframe src='" + esc(embed) + "' allow='autoplay;fullscreen;encrypted-media' allowfullscreen referrerpolicy=origin></iframe></div><h1>" + esc(title) + "</h1><p>" + esc(cat) + " · 18+</p></div></body></html>";
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=86400");
    return res.end(html);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("<!doctype html><html><body style='background:#0d0d0d;color:#eee;font-family:sans-serif;padding:24px'>Error. <a href='/' style='color:#ff9000'>Home</a></body></html>");
  }
};
