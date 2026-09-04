function getEnv() {
  return {
    BOT_TOKEN: process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN,
    GH_TOKEN: process.env.GH_TOKEN,
    GH_OWNER: process.env.GH_OWNER,
    GH_REPO: process.env.GH_REPO,
    GH_REPO_2: process.env.GH_REPO_2,
    GH_PATH: process.env.GH_PATH,
    GH_BRANCH: process.env.GH_BRANCH,
    GH_STATE_REPO: process.env.GH_STATE_REPO,
    TELEGRAM_USER_ID: process.env.TELEGRAM_USER_ID || "7747474006",
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const env = getEnv();

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "telegram-webhook",
      hasBot: Boolean(env.BOT_TOKEN),
      hasGh: Boolean(env.GH_TOKEN),
      hasGithubRepo: Boolean(env.GH_OWNER && env.GH_REPO),
      owner: env.GH_OWNER || null,
      repo: env.GH_REPO || null,
      webhookSecretConfigured: Boolean(env.TELEGRAM_WEBHOOK_SECRET)
    });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const received = req.headers["x-telegram-bot-api-secret-token"];
    if (received !== env.TELEGRAM_WEBHOOK_SECRET) {
      console.error("[v0] Telegram webhook rejected: invalid secret token");
      return res.status(401).json({ ok: false });
    }
  }
  const update = req.body && typeof req.body === "object" ? req.body : {};
  try {
    await handleUpdate(update, env);
  } catch (e) {
    console.error("[v0] Telegram update failed:", e);
    const msg = update.message || update.channel_post;
    if (msg && env.BOT_TOKEN) {
      await reply(env, msg.chat.id, "Error: " + String(e.message || e));
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
  const items = parseNamedLinks(text).filter((it) => {
    if (isBlockedTitle(it.title) || isBlockedTitle(it.category)) return false;
    return true;
  });
  const blockedN = parseNamedLinks(text).length - items.length;
  if (blockedN > 0 && !items.length) {
    await reply(env, chatId, "Ditolak: judul mengandung kata yang tidak diizinkan.");
    return;
  }
  if (!items.length) {
    await reply(env, chatId, "Link terbaca tapi gagal diproses.");
    return;
  }
  const repos = [env.GH_REPO, env.GH_REPO_2].filter(Boolean);
  const results = [];
  for (const repo of repos) {
    const r = await mergeAndPush(env, repo, items);
    results.push(repo + ": +" + r.added + " update " + (r.updated || 0) + " skip " + r.skipped);
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

async function stateRepo(env) {
  return env.GH_STATE_REPO || "kdp-bot-state";
}

async function readShareState(env, repo) {
  const owner = env.GH_OWNER;
  const path = "share-used.json";
  const branch = env.GH_BRANCH || "main";
  repo = await stateRepo(env);
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
  const path = "share-used.json";
  const branch = env.GH_BRANCH || "main";
  repo = await stateRepo(env);
  const body = {
    message: "state: share-used",
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
  const lines = take.map((x) => {
    const host = "koleksidrpinguin.com";
    return "▶ " + x.title + "\nhttps://" + host + "/v/" + x.key;
  });
  const sisa = pool.length - take.length;
  await reply(env, chatId, lines.join("\n\n"));
}




function isBlockedTitle(s) {
  return /\b(underage|bocil)\b/i.test(String(s || ""));
}

function detectCat(title) {
  const t = (title || "").toLowerCase();
  const map = [
    ["Jilbab", ["jilbab","hijab","ukhti","ukhty","cadar"]],
    ["STW", ["tante","janda","stw","ibu kost","binor","pembantu"]],
    ["ABG", ["abg","mahasiswi","remaja"]],
    ["Colmek", ["colmek","omek","dildo"]],
    ["Viral", ["viral"]],
    ["Live", ["live","vcs","hot51"]],
    ["Chindo", ["chindo","amoy"]],
    ["Doggy", ["doggy","nungging"]],
    ["Threesome", ["threesome","bergilir","gangbang"]],
    ["Bumil", ["bumil","hamil"]],
    ["Outdoor", ["outdoor","hutan","kebun"]],
    ["Tobrut", ["tobrut","toket","toge"]],
    ["Lesbian", ["lesbian"]],
    ["Perselingkuhan", ["selingkuh"]],
    ["Open BO", ["open bo","michat","mechat"]],
    ["Amatir", ["ngentot","ngewe","mesum"]]
  ];
  for (const [cat, keys] of map) {
    if (keys.some((k) => t.includes(k))) return cat;
  }
  return "Umum";
}

function cleanTitle(t) {
  return String(t || "")
    .replace(/^▶\s*/, "")
    .replace(/\s*-\s*koleksidrpinguin.*/i, "")
    .replace(/\s*\(\d+\)\s*$/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSiteLink(u) {
  return /koleksidrpinguin\.(com|site)/i.test(u);
}

function isVideoLink(u) {
  return /https?:\/\//i.test(u) && /videy\.co|vicek\.id|indoav\.|userbokep\./i.test(u) && !isSiteLink(u);
}

function parseNamedLinks(text) {
  const lines = String(text).split(/\r?\n/);
  const items = [];
  let pending = "";
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(/https?:\/\/[^\s<>"']+/i);
    if (m) {
      const url = m[0].replace(/[).,]+$/, "");
      if (isSiteLink(url)) continue;
      if (!isVideoLink(url)) continue;
      const it = toItem(url);
      if (pending) {
        it.title = cleanTitle(pending);
        it.category = detectCat(it.title);
        it.tags = [String(it.category).toLowerCase(), "telegram"];
      }
      items.push(it);
      pending = "";
    } else if (!line.startsWith("/")) {
      pending = line;
    }
  }
  return items;
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
  let added = 0, skipped = 0, updated = 0;
  const fresh = [];
  for (const it of items) {
    const k = videoKey(it);
    if (exist.has(k)) {
      const idx = videos.findIndex((v) => videoKey(v) === k);
      if (idx >= 0 && it.title && !/^Amatir\s*-/.test(it.title)) {
        videos[idx].title = it.title;
        videos[idx].category = it.category || videos[idx].category;
        if (it.embed) videos[idx].embed = it.embed.replace("/d/", "/e/");
        if (it.direct) videos[idx].direct = it.direct.replace("/d/", "/e/");
        updated += 1;
      } else skipped += 1;
      continue;
    }
    exist.add(k); fresh.push(it); added += 1;
  }
  for (let i = fresh.length - 1; i >= 0; i--) videos.unshift(fresh[i]);
  if (!added && !updated) return { added: added, skipped: skipped, updated: updated };
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
