module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const key = String(process.env.PUTARIN_API_KEY || "").trim();
  const token = String(process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "").trim();
  const owner = process.env.GH_OWNER || "fashfdhgacd";
  const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
  if (!key) return res.status(200).json({ ok: false, needKey: true, hint: "Vercel env PUTARIN_API_KEY" });
  if (!token) return res.status(200).json({ ok: false, error: "GH_TOKEN kosong" });
  try {
    const all = [];
    let page = 1;
    for (;;) {
      const rr = await fetch("https://panel.putarin.com/api/dev/videos?page=" + page, { headers: { "X-API-Key": key } });
      const data = await rr.json();
      const list = data.videos || data.data || data.items || (Array.isArray(data) ? data : []);
      if (!list.length) break;
      all.push.apply(all, list);
      const last = data.last_page || data.pages || page;
      if (page >= last || list.length < 10) break;
      page += 1;
      if (page > 80) break;
    }
    function codeOf(v) {
      const u = String(v.embed_url || v.watch_url || v.embed || v.url || v.code || "");
      const m = u.match(/\/(?:e|v)\/([A-Za-z0-9_-]+)/);
      return (m && m[1]) || String(v.code || v.id || "");
    }
    const mapped = all.map(function (v) {
      const code = codeOf(v);
      const title = String(v.title || ("Putarin " + code));
      return {
        title: title,
        category: "Putarin",
        source: "Putarin",
        embed: "https://puterin.biz/e/" + code,
        direct: "https://puterin.biz/v/" + code,
        tags: ["putarin"],
        date: new Date().toISOString().slice(0, 10)
      };
    }).filter(function (v) { return /\/e\/[A-Za-z0-9_-]+/.test(v.embed); });
    const meta = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/data/putarin.json?ref=main", {
      headers: { Authorization: "token " + token, "User-Agent": "dr-pinguin-sync", Accept: "application/vnd.github.v3+json" }
    }).then(function (r) { return r.json(); });
    let current = [];
    try {
      if (meta.download_url) current = await fetch(meta.download_url).then(function (r) { return r.json(); });
    } catch (_) {}
    const seen = new Set(current.map(function (v) { return String(v.embed || "").split("/").pop(); }));
    let added = 0;
    for (let i = mapped.length - 1; i >= 0; i--) {
      const code = String(mapped[i].embed).split("/").pop();
      if (seen.has(code)) continue;
      seen.add(code);
      current.unshift(mapped[i]);
      added += 1;
    }
    if (added) {
      const body = {
        message: "sync: +" + added + " putarin from API",
        content: Buffer.from(JSON.stringify(current, null, 2), "utf8").toString("base64"),
        branch: "main"
      };
      if (meta.sha) body.sha = meta.sha;
      const put = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/data/putarin.json", {
        method: "PUT",
        headers: { Authorization: "token " + token, "User-Agent": "dr-pinguin-sync", Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(function (r) { return r.json(); });
      if (!put.content && put.message) return res.status(200).json({ ok: false, error: put.message, fetched: all.length });
    }
    return res.status(200).json({ ok: true, fetched: all.length, mapped: mapped.length, added: added, total: current.length });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e.message || e) });
  }
};
