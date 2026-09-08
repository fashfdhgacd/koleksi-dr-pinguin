module.exports = async function handler(req, res) {
  try {
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.com").split(",")[0];
    const origin = "https://" + host.replace(/^www\./, "");
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const rr = await fetch(
      "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/videos.json"
    );
    if (!rr.ok) throw new Error("videos.json " + rr.status);
    const list = await rr.json();
    const BLOCK = /\b(underage|bocil)\b/i;
    function keyOf(v) {
      const u = String(v.embed || v.direct || v.embedUrl || "");
      try {
        const url = new URL(u);
        return String(url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop() || "")
          .replace(/\.(mp4|mov)$/i, "");
      } catch (_) {
        return String(u.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
      }
    }
    const urls = [];
    const seen = new Set();
    (Array.isArray(list) ? list : []).forEach((v) => {
      const blob = String(v.title || "") + " " + String(v.category || "");
      if (BLOCK.test(blob)) return;
      const id = keyOf(v);
      if (!id || seen.has(id)) return;
      seen.add(id);
      const lm = String(v.date || "").slice(0, 10);
      urls.push({ loc: origin + "/v/" + encodeURIComponent(id), lastmod: lm });
    });
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=1800");
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    urls.forEach((u) => {
      xml += "<url><loc>" + u.loc + "</loc>";
      if (u.lastmod) xml += "<lastmod>" + u.lastmod + "</lastmod>";
      xml += "<changefreq>weekly</changefreq></url>\n";
    });
    xml += "</urlset>";
    return res.status(200).send(xml);
  } catch (e) {
    console.error(e);
    res.status(500).send("sitemap error");
  }
};
