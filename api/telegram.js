module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      hasBot: Boolean(process.env.BOT_TOKEN),
      hasGh: Boolean(process.env.GH_TOKEN),
      owner: process.env.GH_OWNER || null,
      repo: process.env.GH_REPO || null
    });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }
  const update = req.body || {};
  try {
    await handleUpdate(update, process.env);
  } catch (e) {
    console.error(e);
    const msg = update.message || update.channel_post;
    if (msg && process.env.BOT_TOKEN) {
      await reply(process.env, msg.chat.id, "Error: " + String(e.message || e));
    }
  }
  return res.status(200).json({ ok: true });
};

async function handleUpdate(update, env) {
  const msg = update.message || update.channel_post;
  if (!msg || !msg.text) return;
  const text = String(msg.text).trim();
  const chatId = msg.chat.id;
  if (!env.BOT_TOKEN) {
    console.error("BOT_TOKEN missing");
    return;
  }
  const allowed = String(env.TELEGRAM_USER_ID || "7747474006").trim();
  const fromId = String((msg.from && msg.from.id) || "");
  if (allowed && fromId && fromId !== allowed && String(chatId) !== allowed) {
    await reply(env, chatId, "Akses ditolak.\nBot ini hanya untuk admin.");
    return;
  }
  if (text.startsWith("/start") || text.startsWith("/help")) {
    await reply(env, chatId, [
      "Bot upload Dr. Pinguin aktif.",
      "",
      "Kirim link upload: videy / vicek / indoav / userbokep",
      "",
      "Minta link sebar:",
      "/sebar  atau  kasih link",
      "25 link acak (judul + URL). Tidak dobel 24 jam."
    ].join("\n"));
    return;
  }
  if (isShareCommand(text)) {
    await handleShare(env, chatId);
    return;
  }
  const links = extractLinks(text);
  if (!links.length) {
    await reply(env, chatId, "Tidak ada link yang dikenali.\nPakai videy.co, vicek.id, indoav.app, atau userbokep.com.");
    return;
  }
  if (!env.GH_TOKEN || !env.GH_OWNER || !env.GH_REPO) {
    await reply(env, chatId, "Env GitHub belum lengkap.\nCek Environment Variables Vercel, lalu Redeploy.");
    return;
  }
  const items = links.map(toItem);
  const repos = [env.GH_REPO, env.GH_REPO_2].filter(Boolean);
  const results = [];
  for (const repo of repos) {
    const r = await mergeAndPush(env, repo, items);
    results.push(repo + ": +" + r.added + " skip " + r.skipped);
  }
  await reply(env, chatId, [
      "Selesai diproses.",
      "Link diterima: " + items.length,
      results.join("\n"),
      "",
      "Tunggu deploy 1-2 menit, lalu hard refresh site."
    ].join("\n"));
}


function isShareCommand(text) {
  const t = text.toLowerCase();
  if (t.startsWith("/sebar") || t.startsWith("/share") || t.startsWith("/link")) return true;
  if (/https?:\/\//i.test(t)) return false;
  if (/kasih\s*link|minta|nyebar|sebar|25\s*link|^lagi$|^gas$|^next$|^terus$/.test(t)) return true;
  return false;
}

function shareKeyFromVideo(v) {
  const u = String(v.embed || v.embedUrl || v.direct || "");
  try {
    const url = new URL(u);
    const qid = url.searchParams.get("id");
    if (qid) return qid;
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return last.replace(/\.(mp4|mov)$/i, "") || String(v.id || "");
  } catch (_) {
    return String(v.id || u.slice(-12));
  }
}

function cleanTitle(t) {
  return String(t || "Video")
    .replace(/\s*-\s*koleksidrpinguin\.(com|site)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function readVideos(env, repo) {
  const owner = env.GH_OWNER;
  const path = env.GH_PATH || "data/videos.json";
  const branch = env.GH_BRANCH || "main";
  const meta = await gh(env, "/repos/" + owner + "/" + repo + "/contents/" + path + "?ref=" + branch);
  let raw = "";
  if (meta.content && meta.content.length < 500000) {
    raw = Buffer.from(meta.content.replace(/\n/g, ""), "base64").toString("utf8");
  } else {
    const dl = meta.download_url;
    const rr = await fetch(dl + (dl.includes("?") ? "&" : "?") + "t=" + Date.now(), {
      headers: { Authorization: "token " + env.GH_TOKEN, "User-Agent": "dr-pinguin-tg-bot", Accept: "application/vnd.github.v3.raw" }
    });
    raw = await rr.text();
  }
  return JSON.parse(raw);
}

async function readShareState(env, repo) {
  const owner = env.GH_OWNER;
  const path = "data/share-used.json";
  const branch = env.GH_BRANCH || "main";
  try {
    const meta = await gh(env, "/repos/" + owner + "/" + repo + "/contents/" + path + "?ref=" + branch);
    let raw = Buffer.from((meta.content || "").replace(/\n/g, ""), "base64").toString("utf8");
    const st = JSON.parse(raw || "{}");
    st.sha = meta.sha;
    return st;
  } catch (_) {
    return { resetAt: 0, used: [], sha: null };
  }
}

async function writeShareState(env, repo, st) {
  const owner = env.GH_OWNER;
  const path = "data/share-used.json";
  const branch = env.GH_BRANCH || "main";
  const body = {
    message: "bot: update share-used 24h",
    content: Buffer.from(JSON.stringify({ resetAt: st.resetAt, used: st.used }, null, 2), "utf8").toString("base64"),
    branch: branch
  };
  if (st.sha) body.sha = st.sha;
  await gh(env, "/repos/" + owner + "/" + repo + "/contents/" + path, { method: "PUT", body: JSON.stringify(body) });
}

async function handleShare(env, chatId) {
  const repo = env.GH_REPO;
  if (!env.GH_TOKEN || !env.GH_OWNER || !repo) {
    await reply(env, chatId, "Env GitHub belum lengkap.");
    return;
  }
  const videos = await readVideos(env, repo);
  let st = await readShareState(env, repo);
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  if (!st.resetAt || now - st.resetAt >= DAY) {
    st.resetAt = now;
    st.used = [];
  }
  const used = new Set((st.used || []).map(String));
  const pool = [];
  for (const v of videos) {
    const key = shareKeyFromVideo(v);
    if (!key || used.has(key)) continue;
    pool.push({ key: key, title: cleanTitle(v.title) });
  }
  if (!pool.length) {
    const left = Math.max(0, DAY - (now - st.resetAt));
    const jam = Math.ceil(left / 3600000);
    await reply(env, chatId, "Stok link sesi 24 jam habis.\nReset sekitar " + jam + " jam lagi.");
    return;
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  const take = pool.slice(0, 25);
  take.forEach((x) => used.add(x.key));
  st.used = Array.from(used);
  await writeShareState(env, repo, st);
  const mid = Math.ceil(take.length / 2);
  const lines = take.map((x, i) => {
    const host = i < mid ? "koleksidrpinguin.com" : "koleksidrpinguin.site";
    return x.title + "\nhttps://" + host + "/?v=" + x.key;
  });
  const sisa = pool.length - take.length;
  await reply(env, chatId, lines.join("\n\n") + "\n\n—" + take.length + " link unik · sisa sesi " + sisa);
}

function extractLinks(text) {
  const raw = text.match(/https?:\/\/[^\s<>"']+/gi) || [];
  const out = [];
  const seen = new Set();
  for (let u of raw) {
    u = u.replace(/[).,]+$/, "");
    if (!/videy\.co|vicek\.id|indoav\.app|userbokep\.com/i.test(u)) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function toItem(url) {
  const low = url.toLowerCase();
  let category = "Amatir";
  let source = "Telegram";
  let direct = url;
  let embed = url;
  let id = "";
  if (low.includes("videy.co")) {
    category = "Videy";
    source = "Videy";
    const m = url.match(/[?&]id=([A-Za-z0-9]+)/);
    const file = url.match(/cdn\d*\.videy\.co\/([^/?#]+)/i);
    id = (m && m[1]) || (file && file[1].replace(/\.(mp4|mov)$/i, "")) || "";
    const ext = (id.length === 9 && id.endsWith("2")) ? ".mov" : ".mp4";
    direct = (/\.mp4|\.mov/i.test(url) && /cdn/i.test(url)) ? url : (id ? ("https://cdn.videy.co/" + id + ext) : url);
    embed = id ? ("https://videy.co/v/?id=" + id) : url;
  } else if (low.includes("vicek.id")) {
    category = "ExaStream";
    source = "Vicek";
    const code = url.split("/").filter(Boolean).pop();
    id = code;
    embed = "https://vicek.id/e/" + code;
    direct = embed;
  } else {
    source = low.includes("userbokep") ? "Userbokep" : "IndoAV";
    embed = url.replace(/\/d\//, "/e/");
    direct = embed;
  }
  return {
    title: id ? (category + " " + id + " - koleksidrpinguin.com") : (category + " - koleksidrpinguin.com"),
    direct: direct, embed: embed, source: source, category: category,
    tags: [category.toLowerCase(), "telegram"],
    date: new Date().toISOString().slice(0, 10)
  };
}

function videoKey(v) {
  const u = (v.direct || v.embed || "").toLowerCase();
  if (u.includes("id=")) return u.split("id=")[1].split("&")[0];
  return u.split("/").pop().replace(/\.(mp4|mov)$/, "");
}

async function mergeAndPush(env, repo, items) {
  const owner = env.GH_OWNER;
  const path = env.GH_PATH || "data/videos.json";
  const branch = env.GH_BRANCH || "main";
  const meta = await gh(env, "/repos/" + owner + "/" + repo + "/contents/" + path + "?ref=" + branch);
  let raw = "";
  if (meta.content) {
    raw = Buffer.from(meta.content.replace(/\n/g, ""), "base64").toString("utf8");
  } else {
    const dl = meta.download_url || ("https://raw.githubusercontent.com/" + owner + "/" + repo + "/" + branch + "/" + path);
    const rr = await fetch(dl + (dl.includes("?") ? "&" : "?") + "t=" + Date.now(), {
      headers: { Authorization: "token " + env.GH_TOKEN, "User-Agent": "dr-pinguin-tg-bot", Accept: "application/vnd.github.v3.raw" }
    });
    raw = await rr.text();
  }
  if (!raw || !raw.trim()) throw new Error("videos.json kosong / gagal dibaca");
  const videos = JSON.parse(raw);
  const exist = new Set(videos.map(videoKey));
  let added = 0, skipped = 0;
  const fresh = [];
  for (const it of items) {
    const k = videoKey(it);
    if (exist.has(k)) { skipped += 1; continue; }
    exist.add(k); fresh.push(it); added += 1;
  }
  for (let i = fresh.length - 1; i >= 0; i--) videos.unshift(fresh[i]);
  if (!added) return { added: added, skipped: skipped };
  await gh(env, "/repos/" + owner + "/" + repo + "/contents/" + path, {
    method: "PUT",
    body: JSON.stringify({
      message: "bot: add " + added + " videos from Telegram",
      content: Buffer.from(JSON.stringify(videos, null, 2), "utf8").toString("base64"),
      sha: meta.sha,
      branch: branch
    })
  });
  return { added: added, skipped: skipped };
}

async function gh(env, path, opt) {
  opt = opt || {};
  const res = await fetch("https://api.github.com" + path, {
    method: opt.method || "GET",
    headers: {
      Authorization: "token " + env.GH_TOKEN,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "dr-pinguin-tg-bot",
      "Content-Type": "application/json"
    },
    body: opt.body
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || String(res.status));
  return data;
}

async function reply(env, chatId, text) {
  const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
  const data = await res.json();
  if (!data.ok) console.error("tg reply fail", data);
}
