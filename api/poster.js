module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && req.query.id) || "").replace(/[^A-Za-z0-9_-]/g, "");
    if (!id) {
      res.statusCode = 404;
      return res.end();
    }
    const r = await fetch("https://puterin.biz/v/" + id, {
      headers: { "user-agent": "Mozilla/5.0" }
    });
    const html = await r.text();
    const m = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
    const img = m && m[1] ? m[1] : "";
    if (!img) {
      res.statusCode = 404;
      return res.end();
    }
    res.writeHead(302, {
      Location: img,
      "Cache-Control": "public, s-maxage=86400"
    });
    return res.end();
  } catch (e) {
    res.statusCode = 404;
    return res.end();
  }
};
