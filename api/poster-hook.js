function videoKey(v) {
  const u = String((v && (v.direct || v.embed)) || "").toLowerCase();
  if (u.includes("id=")) return u.split("id=")[1].split("&")[0];
  return u.split("/").pop().replace(/\.(mp4|mov)$/i, "");
}
async function grabPoster(embed) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(function () { ctrl.abort(); }, 8000);
    const r = await fetch(String(embed || "").replace("/d/", "/e/"), {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!r.ok) return "";
    const html = await r.text();
    const m = html.match(/poster="(https:\/\/[^"\s]+)"/i);
    return m ? m[1] : "";
  } catch (_) {
    return "";
  }
}
module.exports = async function hookPoster(env, items) {
  const need = (items || []).filter(function (it) {
    return /indoav|userbokep/i.test(String((it && (it.embed || it.direct)) || ""));
  }).slice(0, 8);
  if (!need.length || !env || !env.GH_TOKEN) return 0;
  return 0;
};
