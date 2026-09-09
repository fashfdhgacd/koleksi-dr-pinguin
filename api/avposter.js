module.exports = async function handler(req, res) {
  try {
    const host = String((req.query && req.query.h) || "").toLowerCase();
    const id = String((req.query && req.query.id) || "").replace(/[^A-Za-z0-9_-]/g, "");
    const allow = {
      indoav: "https://tv1.indoav.app/e/",
      userbokep: "https://tv1.userbokep.com/e/"
    };
    const base = allow[host];
    if (!base || !id) {
      res.statusCode = 404;
      return res.end();
    }
    const r = await fetch(base + id, {
      headers: { "user-agent": "Mozilla/5.0", accept: "text/html" }
    });
    const html = await r.text();
    const m = html.match(/poster="(https:\/\/[^"\s]+)"/i);
    const img = m && m[1] ? m[1] : "";
    if (!img) {
      res.writeHead(302, { Location: "/api/thumb", "Cache-Control": "public, s-maxage=600" });
      return res.end();
    }
    res.writeHead(302, {
      Location: img,
      "Cache-Control": "public, s-maxage=86400"
    });
    return res.end();
  } catch (e) {
    res.writeHead(302, { Location: "/api/thumb" });
    return res.end();
  }
};
