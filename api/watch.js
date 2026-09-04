module.exports = async function handler(req, res) {
  const id = String((req.query && (req.query.id || req.query.v)) || "").replace(/^\//, "").trim();
  const target = id ? ("/?v=" + encodeURIComponent(id)) : "/";
  res.writeHead(302, {
    Location: target,
    "Cache-Control": "no-store"
  });
  return res.end();
};
