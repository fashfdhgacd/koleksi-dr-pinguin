module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  const q = req.query || {};
  const app = String(q.app || q.platform || "unknown").slice(0, 40);
  const id = String(q.id || "").slice(0, 80);
  const host = String((req.headers && (req.headers["x-forwarded-host"] || req.headers.host)) || "");
  console.log("[share-hit]", JSON.stringify({ app: app, id: id, host: host, t: Date.now() }));
  return res.status(200).json({ ok: true, app: app, id: id });
};
