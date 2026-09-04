module.exports = async function handler(req, res) {
  try {
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.com").split(",")[0];
    const origin = "https://" + host.replace(/^www\./, "");
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const rr = await fetch(
      "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/videos.json"
    );
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
      urls.push(origin + "/v/" + encodeURIComponent(id));
    });
    const chunks = [];
    for (let i = 0; i < urls.length; i += 10000) chunks.push(urls.slice(i, i + 10000));
    const type = String((req.query && req.query.part) || "");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    if (!type) {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      xml += "<sitemap><loc>" + origin + "/sitemap.xml</loc></sitemap>\n";
      chunks.forEach((_, i) => {
        xml += "<sitemap><loc>" + origin + "/sitemap-v.xml?part=" + (i + 1) + "</loc></sitemap>\n";
      });
      xml += "</sitemapindex>";
      return res.status(200).send(xml);
    }
    const part = Math.max(1, parseInt(type, 10) || 1);
    const slice = chunks[part - 1] || [];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    slice.forEach((u) => {
      xml += "<url><loc>" + u + "</loc><changefreq>weekly</changefreq></url>\n";
    });
    xml += "</urlset>";
    return res.status(200).send(xml);
  } catch (e) {
    res.status(500).send("sitemap error");
  }
};
