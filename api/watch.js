function putarinCode(u) {
  const m = String(u || "").match(/\/(?:e|v)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : "";
}
function isPutarin(u) {
  return /putarin|puterin/i.test(String(u || ""));
}
module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && (req.query.id || req.query.v)) || "").replace(/^\//, "").trim();
    if (!id) { res.writeHead(302, { Location: "/" }); return res.end(); }
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const base = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/";
    const [a, b] = await Promise.all([
      fetch(base + "videos.json?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch(base + "putarin.json?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
    ]);
    const list = [].concat(a || [], b || []);
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
    const video = list.find(function (v) {
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
    const cat = String(video.folder || video.category || "Video");
    let embed = String(video.embed || video.direct || video.embedUrl || "").replace("/d/", "/e/");
    let sourceWatch = embed.replace("/e/", "/v/");
    const put = isPutarin(embed + " " + String(video.source || "") + " " + cat);
    if (put) {
      const code = putarinCode(embed) || id;
      embed = "https://puterin.biz/e/" + code;
      sourceWatch = "https://puterin.biz/v/" + code;
    }
    const back = put ? "/putarin" : "/";
    const t = encodeURIComponent(title);
    const u = encodeURIComponent(page);
    const txt = encodeURIComponent(title + "\n" + page);
    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)} | Dr. Pinguin</title><style>*{box-sizing:border-box}html,body{margin:0;background:#050505;color:#eee;font-family:system-ui,sans-serif;overflow-x:hidden}a{color:#ff9000;text-decoration:none}header{position:sticky;top:0;background:#000;border-bottom:2px solid #ff9000} .nav{display:flex;justify-content:space-between;align-items:center;padding:10px 14px}.brand b{color:#ff9000}.player{position:relative;width:100%;aspect-ratio:16/9;background:#111}.player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.body{padding:14px}h1{font-size:18px}.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.btn{display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:10px;font-size:12px;font-weight:800;border:1px solid #2a2a2a;background:#161616;color:#eee}.btn.primary{background:#ff9000;color:#000;border-color:#ff9000}</style></head><body><header><div class="nav"><a class="brand" href="/">DR.<b>PINGUIN</b></a><a href="${back}">Kembali</a></div></header><div class="player"><iframe src="${esc(embed)}" allow="autoplay;fullscreen;encrypted-media" allowfullscreen referrerpolicy="origin"></iframe></div><div class="body"><h1>${esc(title)}</h1><p>${esc(cat)} · 18+</p><div class="actions"><a class="btn primary" href="${back}">Kembali</a><a class="btn" href="${esc(sourceWatch)}" target="_blank" rel="noopener">Sumber</a><a class="btn" href="https://wa.me/?text=${txt}" target="_blank" rel="noopener">WhatsApp</a><a class="btn" href="https://t.me/share/url?url=${u}&text=${t}" target="_blank" rel="noopener">Telegram</a></div></div></body></html>`;
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(html);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("<!doctype html><html><body style='background:#050505;color:#eee;padding:24px'>Error. <a href='/' style='color:#ff9000'>Home</a></body></html>");
  }
};
