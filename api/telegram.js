function pickEnv(keys) {
  for (const key of keys) {
    const val = process.env[key];
    if (val && String(val).trim()) return String(val).trim();
  }
  return "";
}

function getEnv() {
  return {
    BOT_TOKEN: pickEnv(["BOT_TOKEN", "TELEGRAM_BOT_TOKEN"]),
    GH_TOKEN: pickEnv(["GH_TOKEN", "GITHUB_TOKEN"]),
    GH_OWNER: pickEnv(["GH_OWNER", "GITHUB_OWNER"]),
    GH_REPO: pickEnv(["GH_REPO", "GITHUB_REPO"]),
    GH_REPO_2: pickEnv(["GH_REPO_2", "GITHUB_REPO_2"]),
    GH_PATH: pickEnv(["GH_PATH"]) || "data/videos.json",
    GH_BRANCH: pickEnv(["GH_BRANCH"]) || "main",
    GH_STATE_REPO: pickEnv(["GH_STATE_REPO"]),
    TELEGRAM_USER_ID: pickEnv(["TELEGRAM_USER_ID", "TELEGRAM_ADMIN_ID"]) || "7747474006",
    TELEGRAM_WEBHOOK_SECRET: pickEnv(["TELEGRAM_WEBHOOK_SECRET"])
  };
}

function envStatus(env) {
  return {
    ok: true,
    service: "telegram-webhook",
    ready: Boolean(env.BOT_TOKEN && env.GH_TOKEN && env.GH_OWNER && env.GH_REPO),
    hasBot: Boolean(env.BOT_TOKEN),
    hasGh: Boolean(env.GH_TOKEN),
    hasGithubRepo: Boolean(env.GH_OWNER && env.GH_REPO),
    owner: env.GH_OWNER || null,
    repo: env.GH_REPO || null,
    webhookSecretConfigured: Boolean(env.TELEGRAM_WEBHOOK_SECRET)
  };
}

function parseBody(req) {
  const raw = req.body;
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch (e) {
      console.error("[tg] body JSON parse fail:", e.message);
      return {};
    }
  }
  return raw;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const env = getEnv();

  if (req.method === "GET") {
    return res.status(200).json(envStatus(env));
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const received = req.headers["x-telegram-bot-api-secret-token"];
    if (received !== env.TELEGRAM_WEBHOOK_SECRET) {
      console.error("[tg] webhook rejected: invalid secret token");
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }
  }

  const update = parseBody(req);
  const status = envStatus(env);
  try {
    const result = await handleUpdate(update, env);
    return res.status(200).json({ ok: true, ...status, processed: Boolean(result && result.processed), command: (result && result.command) || null });
  } catch (e) {
    console.error("[tg] update failed:", e);
    const msg = update.message || update.channel_post;
    if (msg && env.BOT_TOKEN) {
      try {
        await reply(env, msg.chat.id, "Error bot: " + String(e.message || e));
      } catch (re) {
        console.error("[tg] reply after error failed:", re);
      }
    }
    return res.status(200).json({ ok: true, ...status, processed: false, error: String(e.message || e) });
  }
};

function envHint(env) {
  const miss = [];
  if (!env.BOT_TOKEN) miss.push("BOT_TOKEN atau TELEGRAM_BOT_TOKEN");
  if (!env.GH_TOKEN) miss.push("GH_TOKEN atau GITHUB_TOKEN");
  if (!env.GH_OWNER) miss.push("GH_OWNER atau GITHUB_OWNER");
  if (!env.GH_REPO) miss.push("GH_REPO atau GITHUB_REPO");
  return [
    "Env Vercel belum lengkap. Bot tidak bisa jalan penuh.",
    "Isi di project koleksi-dr-pinguin (Production):",
    miss.map((x) => "- " + x).join("\n"),
    "Lalu Redeploy sekali. Jangan kirim token ke chat."
  ].join("\n");
}

async function handleUpdate(update, env) {
  const msg = update.message || update.channel_post;
  if (!msg || !msg.text) {
    console.log("[tg] ignore update tanpa text");
    return { processed: false, command: "empty" };
  }
  const text = String(msg.text).trim();
  const chatId = msg.chat.id;
  const cmd = classifyCommand(text);
  console.log("[tg] inbound", { chatId, from: msg.from && msg.from.id, cmd, preview: text.slice(0, 80) });

  if (!env.BOT_TOKEN) {
    console.error("[tg] BOT_TOKEN/TELEGRAM_BOT_TOKEN missing — tidak bisa sendMessage");
    return { processed: false, command: cmd || "no_token" };
  }

  const allowed = String(env.TELEGRAM_USER_ID || "7747474006").trim();
  const fromId = String((msg.from && msg.from.id) || "");
  if (allowed && fromId && fromId !== allowed && String(chatId) !== allowed) {
    await reply(env, chatId, "Akses ditolak.\nBot ini hanya untuk admin.");
    return { processed: true, command: "denied" };
  }

  if (cmd === "help") {
    await reply(env, chatId, [
      env.BOT_TOKEN && env.GH_TOKEN && env.GH_OWNER && env.GH_REPO
        ? "Bot upload Dr. Pinguin siap terima perintah."
        : "Bot bisa membalas, tapi env GitHub belum lengkap.",
      "",
      "Perintah:",
      "minta / /minta / sebar / /sebar",
      "Kirim link: videy / vicek / indoav / userbokep",
      "",
      env.GH_TOKEN && env.GH_OWNER && env.GH_REPO ? "" : envHint(env)
    ].filter(Boolean).join("\n"));
    return { processed: true, command: "help" };
  }

  if (cmd === "share") {
    if (!env.GH_TOKEN || !env.GH_OWNER || !env.GH_REPO) {
      await reply(env, chatId, envHint(env));
      return { processed: true, command: "share_env_missing" };
    }
    await handleShare(env, chatId);
    return { processed: true, command: "share" };
  }

  const links = extractLinks(text);
  if (!links.length) {
    await reply(env, chatId, "Tidak ada link yang dikenali.\nPakai videy.co, vicek.id, indoav.app, atau userbokep.com.\nAtau ketik: minta");
    return { processed: true, command: "no_links" };
  }
  if (!env.GH_TOKEN || !env.GH_OWNER || !env.GH_REPO) {
    await reply(env, chatId, envHint(env));
    return { processed: true, command: "upload_env_missing" };
  }

  const parsed = parseNamedLinks(text);
  const items = parsed.filter((it) => !isBlockedTitle(it.title) && !isBlockedTitle(it.category));
  if (parsed.length && !items.length) {
    await reply(env, chatId, "Ditolak: judul mengandung kata yang tidak diizinkan.");
    return { processed: true, command: "blocked" };
  }
  if (!items.length) {
    await reply(env, chatId, "Link terbaca tapi gagal diproses.");
    return { processed: true, command: "parse_fail" };
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
    "Data sudah di GitHub. Hard refresh site."
  ].join("\n"));
  return { processed: true, command: "upload" };
}

function classifyCommand(text) {
  const t = String(text || "").trim().toLowerCase();
  if (!t) return "";
  if (t.startsWith("/start") || t.startsWith("/help")) return "help";
  if (isShareCommand(t)) return "share";
  return "other";
}

function isShareCommand(text) {
  const t = String(text || "").trim().toLowerCase();
  if (/https?:\/\//i.test(t) && !/^\s*\/?(minta|sebar)\b/.test(t)) return false;
  if (/^\/?(sebar|share|link|minta)(@\w+)?(\s|$)/.test(t)) return true;
  if (/kasih\s*link|nyebar|25\s*link|^lagi$|^gas$|^next$|^terus$/.test(t)) return true;
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
    .replace(/^▶\s*/, "")
    .replace(/\s*-\s*koleksidrpinguin.*/i, "")
    .replace(/\s*\(\d+\)\s*$/, "")
    .replace(/_/g, " ")
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
    const raw = Buffer.from((meta.content || "").replace(/\n/g, ""), "base64").toString("utf8");
    const st = JSON.parse(raw || "{}");
    st.sha = meta.sha;
    return st;
  } catch (e) {
    console.error("[tg] readShareState:", e.message || e);
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
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  const take = pool.slice(0, 25);
  take.forEach((x) => used.add(x.key));
  st.used = Array.from(used);
  try {
    await writeShareState(env, repo, st);
  } catch (e) {
    console.error("[tg] writeShareState fail, tetap kirim link:", e.message || e);
  }
  const lines = take.map((x) => "▶ " + x.title + "\nhttps://koleksidrpinguin.com/v/" + x.key);
  await reply(env, chatId, lines.join("\n\n"));
}

function isBlockedTitle(s) {
  return /\b(underage|bocil)\b/i.test(String(s || ""));
}

function detectCat(title) {
  const t = (title || "").toLowerCase();
  const map = [
    ["Jilbab", ["jilbab", "hijab", "ukhti", "ukhty", "cadar"]],
    ["STW", ["tante", "janda", "stw", "ibu kost", "binor", "pembantu"]],
    ["ABG", ["abg", "mahasiswi", "remaja"]],
    ["Colmek", ["colmek", "omek", "dildo"]],
    ["Viral", ["viral"]],
    ["Live", ["live", "vcs", "hot51"]],
    ["Chindo", ["chindo", "amoy"]],
    ["Doggy", ["doggy", "nungging"]],
    ["Threesome", ["threesome", "bergilir", "gangbang"]],
    ["Bumil", ["bumil", "hamil"]],
    ["Outdoor", ["outdoor", "hutan", "kebun"]],
    ["Tobrut", ["tobrut", "toket", "toge"]],
    ["Lesbian", ["lesbian"]],
    ["Perselingkuhan", ["selingkuh"]],
    ["Open BO", ["open bo", "michat", "mechat"]],
    ["Amatir", ["ngentot", "ngewe", "mesum"]]
  ];
  for (const [cat, keys] of map) {
    if (keys.some((k) => t.includes(k))) return cat;
  }
  return "Umum";
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
    title: id ? (category + " " + id) : category,
    direct: direct,
    embed: embed,
    source: source,
    category: category,
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
    exist.add(k);
    fresh.push(it);
    added += 1;
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
  return { added: added, skipped: skipped, updated: updated };
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
  if (!res.ok) {
    console.error("[tg] github", res.status, data.message || data);
    throw new Error(data.message || String(res.status));
  }
  return data;
}

async function reply(env, chatId, text) {
  if (!env.BOT_TOKEN) {
    console.error("[tg] reply skipped: no bot token");
    return;
  }
  const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
  const data = await res.json();
  if (!data.ok) console.error("[tg] sendMessage fail", data);
}

module.exports.getEnv = getEnv;
module.exports.envStatus = envStatus;
module.exports.isShareCommand = isShareCommand;
module.exports.classifyCommand = classifyCommand;
module.exports.parseNamedLinks = parseNamedLinks;
module.exports.extractLinks = extractLinks;
