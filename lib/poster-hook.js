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
  const path = "data/posters.json";
  const owner = env.GH_OWNER || "fashfdhgacd";
  const repo = env.GH_REPO || "koleksi-dr-pinguin";
  const branch = env.GH_BRANCH || "main";
  let posters = {};
  try {
    const raw = await fetch("https://raw.githubusercontent.com/" + owner + "/" + repo + "/" + branch + "/" + path + "?t=" + Date.now());
    const d = await raw.json();
    if (d && typeof d === "object") posters = d;
  } catch (_) {}
  let added = 0;
  for (const it of need) {
    const id = videoKey(it);
    if (!id || posters[id]) continue;
    const url = await grabPoster(it.embed || it.direct);
    if (!url) continue;
    posters[id] = url;
    added += 1;
  }
  if (!added) return 0;
  const metaRes = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + path + "?ref=" + branch, {
    headers: { Authorization: "Bearer " + env.GH_TOKEN, Accept: "application/vnd.github.v3+json", "User-Agent": "dr-pinguin-tg-bot" }
  });
  const meta = await metaRes.json();
  if (!metaRes.ok) throw new Error(meta.message || "poster meta gagal");
  const body = JSON.stringify({
    message: "bot: poster +" + added,
    content: Buffer.from(JSON.stringify(posters, null, 2) + "\n", "utf8").toString("base64"),
    sha: meta.sha,
    branch: branch
  });
  const put = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + path, {
    method: "PUT",
    headers: { Authorization: "Bearer " + env.GH_TOKEN, Accept: "application/vnd.github.v3+json", "User-Agent": "dr-pinguin-tg-bot", "Content-Type": "application/json" },
    body: body
  });
  if (!put.ok) {
    const err = await put.json().catch(function () { return {}; });
    throw new Error(err.message || "poster simpan gagal");
  }
  return added;
};
