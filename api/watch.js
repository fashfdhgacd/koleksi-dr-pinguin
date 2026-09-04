const fs = require("fs");
const path = require("path");

function loadVideos() {
  const files = [
    path.join(process.cwd(), "data", "videos.json"),
    path.join(process.cwd(), "videos.json")
  ];
  for (const file of files) {
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, "utf8"));
      }
    } catch (e) {
      console.error("[watch] read fail", file, e.message || e);
    }
  }
  return null;
}

function videoKey(v) {
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

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, function (ch) {
    if (ch === "&") return "\u0026amp;";
    if (ch === "<") return "\u0026lt;";
    if (ch === ">") return "\u0026gt;";
    if (ch === '"') return "\u0026quot;";
    return "\u0026#39;";
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
    let list = loadVideos();
    if (!Array.isArray(list)) {
      const owner = process.env.GH_OWNER || "fashfdhgacd";
      const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
      const raw = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/videos.json?t=" + Date.now();
      const rr = await fetch(raw);
      if (!rr.ok) throw new Error("json " + rr.status);
      list = await rr.json();
    }

    const needle = id.toLowerCase();
    const video = (Array.isArray(list) ? list : []).find(function (v) {
      return videoKey(v).toLowerCase() === needle || String(v.id || "").toLowerCase() === needle;
    });

    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.site").split(",")[0];
    const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
    const origin = proto + "://" + host;
    const page = origin + "/v/" + encodeURIComponent(id);

    if (!video) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end("<html><body style='background:#0d0d0d;color:#eee;font-family:sans-serif;padding:24px'><a href='/' style='color:#ff9000'>Gallery</a><p>Video tidak ada.</p></body></html>");
    }

    const titleRaw = String(video.title || "Video");
    const catRaw = String(video.category || "Video");
    if (BLOCK.test(titleRaw + " " + catRaw)) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Robots-Tag", "noindex");
      return res.end("<html><body style='background:#0d0d0d;color:#eee;font-family:sans-serif;padding:24px'><p>Konten tidak tersedia.</p></body></html>");
    }

    const title = titleRaw.replace(/\s*-\s*koleksidrpinguin.*/i, "").replace(/_/g, " ").replace(/\s+/g, " ").trim() || "Video";
    const cat = catRaw || "Video";
    const embed = String(video.embed || video.direct || video.embedUrl || "").replace("/d/", "/e/");
    const desc = title + " - " + cat + " | koleksidrpinguin.site 18+";
    const card = origin + "/logo.png";
    const date = String(video.date || "").slice(0, 10);
    const embedJs = JSON.stringify(embed);

    const html = [
      "<!DOCTYPE html><html lang=id><head>",
      "<meta charset=utf-8>",
      "<meta name=viewport content='width=device-width,initial-scale=1'>",
      "<title>" + escapeHtml(title) + " | Dr. Pinguin</title>",
      "<meta name=description content='" + escapeHtml(desc) + "'>",
      "<link rel=canonical href='" + escapeHtml(page) + "'>",
      "<style>body{margin:0;background:#0d0d0d;color:#eee;font-family:system-ui,sans-serif}.wrap{max-width:960px;margin:0 auto;padding:16px}.player{position:relative;padding-top:56.25%;background:#111;border-radius:8px;overflow:hidden;border:1px solid #222}.player iframe,.player .poster{position:absolute;inset:0;width:100%;height:100%;border:0}.poster{display:flex;align-items:center;justify-content:center;color:#ff9000;font-size:42px;cursor:pointer}a{color:#ff9000}</style>",
      "</head><body><div class=wrap>",
      "<p><a href=/>koleksidrpinguin.site</a></p>",
      "<div class=player id=box><div class=poster id=poster role=button>&#9654;</div></div>",
      "<h1>" + escapeHtml(title) + "</h1>",
      "<p>" + escapeHtml(cat) + (date ? " - " + date : "") + " - 18+</p>",
      "</div><script>(function(){var embed=" + embedJs + ";var p=document.getElementById('poster');if(!p||!embed)return;p.onclick=function(){var f=document.createElement('iframe');f.src=embed;f.allow='autoplay;fullscreen;encrypted-media';f.allowFullscreen=true;var b=document.getElementById('box');b.innerHTML='';b.appendChild(f);};})();</script>",
      "</body></html>"
    ].join("");

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
    return res.end(html);
  } catch (e) {
    console.error("[watch]", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("<html><body style='background:#0d0d0d;color:#eee;font-family:sans-serif;padding:24px'>Error. <a href='/' style='color:#ff9000'>Home</a><pre>" + String(e && e.message || e) + "</pre></body></html>");
  }
};
