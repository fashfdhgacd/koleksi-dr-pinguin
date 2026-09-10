module.exports = async function handler(req, res) {
  try {
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.com").split(",")[0];
    const origin = "https://" + host.replace(/^www\./, "");
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const base = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/";
    const [vr, pr] = await Promise.all([
      fetch(base + "videos.json"),
      fetch(base + "posters.json")
    ]);
    if (!vr.ok) throw new Error("videos.json " + vr.status);
    const list = await vr.json();
    const posters = pr.ok ? await pr.json() : {};
    const BLOCK = /\b(underage|bocil)\b/i;
    function keyOf(v) {
      const u = String(v.embed || v.direct || v.embedUrl || "");
      try {
        const url = new URL(u);
        return String(url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop() || "").replace(/\.(mp4|mov)$/i, "");
      } catch (_) {
        return String(u.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
      }
    }
    function esc(s) {
      return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    const urls = [];
    const seen = new Set();
    (Array.isArray(list) ? list : []).forEach(function (v) {
      const blob = String(v.title || "") + " " + String(v.category || "");
      if (BLOCK.test(blob)) return;
      const id = keyOf(v);
      if (!id || seen.has(id)) return;
      seen.add(id);
      const lm = String(v.date || "").slice(0, 10);
      const thumb = v.poster || v.thumb || v.thumbnail || posters[id] || (origin + "/logo.png");
      const title = String(v.title || id).replace(/\s+/g, " ").trim();
      urls.push({ loc: origin + "/v/" + encodeURIComponent(id), lastmod: lm, thumb: thumb, title: title, embed: String(v.embed || v.direct || "") });
    });
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=1800");
    let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    xml += "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:video=\"http://www.google.com/schemas/sitemap-video/1.1\">\n";
    urls.forEach(function (u) {
      xml += "<url><loc>" + u.loc + "</loc>";
      if (u.lastmod) xml += "<lastmod>" + u.lastmod + "</lastmod>";
      xml += "<video:video>";
      xml += "<video:thumbnail_loc>" + esc(u.thumb) + "</video:thumbnail_loc>";
      xml += "<video:title>" + esc(u.title).slice(0, 100) + "</video:title>";
      xml += "<video:description>" + esc(u.title).slice(0, 200) + "</video:description>";
      if (u.embed) xml += "<video:player_loc allow_embed=\"yes\">" + esc(u.embed) + "</video:player_loc>";
      xml += "<video:family_friendly>no</video:family_friendly>";
      xml += "</video:video></url>\n";
    });
    xml += "</urlset>";
    return res.status(200).send(xml);
  } catch (e) {
    console.error(e);
    res.status(500).send("sitemap error");
  }
};
