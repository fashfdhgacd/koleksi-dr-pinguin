const PLACEHOLDER = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#141414"/><circle cx="320" cy="180" r="36" fill="#ff9000"/><polygon points="310,164 342,180 310,196" fill="#111"/></svg>'
);

module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && req.query.id) || "").replace(/[^A-Za-z0-9_-]/g, "");
    if (id) {
      const r = await fetch("https://puterin.biz/v/" + id, {
        headers: { "user-agent": "Mozilla/5.0" }
      });
      const html = await r.text();
      const m = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)
        || html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
      const img = m && m[1] ? m[1] : "";
      if (img && !/embedan\.com/i.test(img)) {
        res.writeHead(302, {
          Location: img,
          "Cache-Control": "public, s-maxage=86400"
        });
        return res.end();
      }
    }
  } catch (_) {}
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.status(200).end(PLACEHOLDER);
};
