module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=60");
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const rr = await fetch("https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/videos.json?t=" + Date.now());
    if (!rr.ok) throw new Error("json " + rr.status);
    const list = await rr.json();
    const hosts = {};
    let broken = 0;
    (Array.isArray(list) ? list : []).forEach(function (v) {
      const u = String(v.embed || v.direct || v.embedUrl || "");
      if (!u) { broken += 1; return; }
      let host = "lain";
      try { host = new URL(u).hostname.replace(/^www\./, ""); } catch (_) {}
      if (host.includes("indoav")) host = "indoav.app";
      else if (host.includes("userbokep")) host = "userbokep.com";
      else if (host.includes("videy")) host = "videy.co";
      else if (host.includes("vicek") || host.includes("exastream")) host = "vicek.id";
      else if (host.includes("dood") || host.includes("playmogo")) host = "dood";
      hosts[host] = (hosts[host] || 0) + 1;
    });
    return res.status(200).json({ ok: true, total: Array.isArray(list) ? list.length : 0, broken: broken, hosts: hosts, note: "Stok embed, bukan laporan payout IndoAV." });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e.message || e) });
  }
};
