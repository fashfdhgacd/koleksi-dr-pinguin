let cache = { t: 0, map: {} };
async function loadMaps() {
  if (cache.map && Object.keys(cache.map).length && Date.now() - cache.t < 5 * 60 * 1000) return cache.map;
  const base = "https://raw.githubusercontent.com/fashfdhgacd/koleksi-dr-pinguin/main/data/";
  const map = {};
  try {
    const a = await fetch(base + "posters.json", { cache: "no-store" });
    const d = await a.json();
    if (d && typeof d === "object" && !Array.isArray(d)) Object.assign(map, d);
  } catch (_) {}
  try {
    const b = await fetch(base + "latest-posters.json", { cache: "no-store" });
    const d = await b.json();
    if (d && typeof d === "object" && !Array.isArray(d)) Object.assign(map, d);
  } catch (_) {}
  cache = { t: Date.now(), map: map };
  return map;
}
async function scrape(host, id) {
  const allow = {
    indoav: "https://tv1.indoav.app/e/",
    userbokep: "https://tv1.userbokep.com/e/"
  };
  const base = allow[String(host || "").toLowerCase()];
  if (!base || !id) return "";
  const r = await fetch(base + id, { headers: { "user-agent": "Mozilla/5.0", accept: "text/html" } });
  if (!r.ok) return "";
  const html = await r.text();
  const m = html.match(/poster="(https:\/\/[^"\s]+)"/i);
  return m ? m[1] : "";
}
async function sendImage(res, url) {
  const r = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0", accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
    redirect: "follow"
  });
  if (!r.ok) return false;
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 80) return false;
  const ct = r.headers.get("content-type") || "image/jpeg";
  if (!/^image\//i.test(ct) && !/webp|jpeg|jpg|png|gif/i.test(ct)) return false;
  res.setHeader("Content-Type", ct.split(";")[0]);
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  res.status(200).end(buf);
  return true;
}
module.exports = async function handler(req, res) {
  try {
    const q = req.query || {};
    const id = String(q.id || "").replace(/[^A-Za-z0-9_-]/g, "");
    const host = String(q.h || "").toLowerCase();
    if (id) {
      const map = await loadMaps();
      const mapped = map[id];
      if (mapped && await sendImage(res, mapped)) return;
    }
    if (host && id) {
      const scraped = await scrape(host, id);
      if (scraped && await sendImage(res, scraped)) return;
    }
  } catch (_) {}
  res.writeHead(302, {
    Location: "/logo.png",
    "Cache-Control": "public, max-age=60"
  });
  res.end();
};
