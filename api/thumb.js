async function avPoster(host, id) {
  const allow = {
    indoav: "https://tv1.indoav.app/e/",
    userbokep: "https://tv1.userbokep.com/e/"
  };
  const base = allow[String(host || "").toLowerCase()];
  const safe = String(id || "").replace(/[^A-Za-z0-9_-]/g, "");
  if (!base || !safe) return "";
  const r = await fetch(base + safe, {
    headers: { "user-agent": "Mozilla/5.0", accept: "text/html" }
  });
  const html = await r.text();
  const m = html.match(/poster="(https:\/\/[^"\s]+)"/i);
  return m && m[1] ? m[1] : "";
}

module.exports = async function handler(req, res) {
  try {
    const q = (req.query && req.query) || {};
    if (q.h && q.id) {
      const img = await avPoster(q.h, q.id);
      if (img) {
        res.writeHead(302, {
          Location: img,
          "Cache-Control": "public, s-maxage=86400"
        });
        return res.end();
      }
    }
  } catch (e) {}
  const svg = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">',
    '<rect width="640" height="360" fill="#141414"/>',
    '<circle cx="320" cy="180" r="36" fill="#ff9000"/>',
    '<polygon points="312,164 344,180 312,196" fill="#111"/>',
    '</svg>'
  ].join('');
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=600');
  res.status(200).send(svg);
};
