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
    GH_OWNER: pickEnv(["GH_OWNER", "GITHUB_OWNER"]) || "fashfdhgacd",
    GH_REPO: pickEnv(["GH_REPO", "GITHUB_REPO"]) || "koleksi-dr-pinguin",
    GH_REPO_2: pickEnv(["GH_REPO_2"]),
    GH_PATH: pickEnv(["GH_PATH"]) || "data/videos.json",
    GH_BRANCH: pickEnv(["GH_BRANCH"]) || "main",
    GH_STATE_REPO: pickEnv(["GH_STATE_REPO"]) || "kdp-bot-state",
    TELEGRAM_USER_ID: pickEnv(["TELEGRAM_USER_ID", "TELEGRAM_ADMIN_ID"]) || "7747474006",
    TELEGRAM_WEBHOOK_SECRET: pickEnv(["TELEGRAM_WEBHOOK_SECRET"]),
    PUBLIC_HOST: pickEnv(["PUBLIC_HOST"]) || "https://koleksidrpinguin.com"
  };
}
function envStatus(env) {
  return {
    ok: true, service: "telegram-webhook",
    ready: Boolean(env.BOT_TOKEN && env.GH_OWNER && env.GH_REPO),
    hasBot: Boolean(env.BOT_TOKEN), hasGh: Boolean(env.GH_TOKEN),
    hasGithubRepo: Boolean(env.GH_OWNER && env.GH_REPO),
    owner: env.GH_OWNER || null, repo: env.GH_REPO || null,
    webhookSecretConfigured: Boolean(env.TELEGRAM_WEBHOOK_SECRET)
  };
}
async function probeGithub(env) {
  if (!env.GH_TOKEN) return { tokenValid: false, reason: "GH_TOKEN empty" };
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: "token " + env.GH_TOKEN, Accept: "application/vnd.github.v3+json", "User-Agent": "dr-pinguin-tg-bot" }
    });
    const data = await res.json();
    if (!res.ok) return { tokenValid: false, reason: data.message || String(res.status) };
    return { tokenValid: true, login: data.login || null };
  } catch (e) { return { tokenValid: false, reason: String(e.message || e) }; }
}
function parseBody(req) {
  const raw = req.body;
  if (!raw) return {};
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch (e) { return {}; } }
  return raw;
}
const CATS = [
  { key: "all", label: "Semua", match: null },
  { key: "amatir", label: "Amatir", match: /amatir|indoav|userbokep|stw|jilbab|abg|viral/i },
  { key: "videy", label: "Videy", match: /videy/i },
  { key: "mumu", label: "Mumu", match: /mumu|ai china|video ai/i },
  { key: "putarin", label: "Putarin", match: /putarin|puterin|jav/i }
];
const MENU_KEYBOARD = {
  keyboard: [
    [{ text: "Minta 10" }, { text: "Minta 25" }],
    [{ text: "Semua" }, { text: "Amatir" }, { text: "Videy" }],
    [{ text: "Mumu" }, { text: "Putarin" }, { text: "Lagi" }],
    [{ text: "Menu" }]
  ],
  resize_keyboard: true,
  persistent: true
};
const BOT_COMMANDS = [
  { command: "start", description: "Buka menu" },
  { command: "menu", description: "Tampil tombol" },
  { command: "minta10", description: "10 link semua" },
  { command: "minta25", description: "25 link semua" },
  { command: "help", description: "Bantuan" }
];
async function ensureBotMenu(env) {
  if (!env.BOT_TOKEN) return;
  try {
    await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/setMyCommands", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands: BOT_COMMANDS })
    });
  } catch (_) {}
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const env = getEnv();
  if (req.method === "GET") {
    const probe = await probeGithub(env);
    await ensureBotMenu(env);
    return res.status(200).json({ ...envStatus(env), ...probe, menu: true });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const hdr = String(req.headers["x-telegram-bot-api-secret-token"] || "");
    if (hdr !== env.TELEGRAM_WEBHOOK_SECRET) return res.status(401).json({ ok: false, error: "bad webhook secret" });
  }
  const update = parseBody(req);
  const status = envStatus(env);
  try {
    const result = await handleUpdate(update, env);
    return res.status(200).json({ ok: true, ...status, processed: Boolean(result && result.processed), command: (result && result.command) || null });
  } catch (e) {
    const msg = update.message || update.channel_post;
    if (msg && env.BOT_TOKEN) { try { await reply(env, msg.chat.id, "Error bot: " + String(e.message || e)); } catch (_) {} }
    return res.status(200).json({ ok: true, ...status, processed: false, error: String(e.message || e) });
  }
};
function isBlockedHost(u) { return /vicek\.id|exastream/i.test(String(u || "")); }
function isAllowedHost(u) {
  return /videy\.co|indoav\.|userbokep\.com|putarin\.(com|biz|xyz)|puterin\.(com|biz|xyz)|mumu\.watch|mumustream\.com|playmogo\./i.test(String(u || ""));
}
function putarinHost(url) { try { return new URL(url).origin; } catch (_) { return "https://puterin.biz"; } }
function putarinCode(url) {
  const m = String(url).match(/\/(?:e|v|watch)\/([A-Za-z0-9_-]+)/i);
  if (m) return m[1];
  return String(url).split("/").filter(Boolean).pop() || "";
}
function parseShareCount(text, fallback) {
  const t = String(text || "").toLowerCase();
  const m = t.match(/\b(5|10|15|20|25|30)\b/);
  if (m) return Math.min(30, parseInt(m[1], 10));
  if (/minta10|sebar10/.test(t.replace(/\s+/g, ""))) return 10;
  if (/minta25|sebar25/.test(t.replace(/\s+/g, ""))) return 25;
  return fallback || 25;
}
function parseShareCat(text) {
  const t = String(text || "").toLowerCase();
  for (const c of CATS) {
    if (c.key === "all") continue;
    if (t.includes(c.key) || t === c.label.toLowerCase()) return c.key;
  }
  if (t === "semua" || t.includes("semua")) return "all";
  return "";
}
function videoBlob(v) {
  return [v.category, v.source, v.title, (v.tags || []).join(" "), v.embed, v.direct].join(" ");
}
function matchCat(v, key) {
  if (!key || key === "all") return true;
  const cat = CATS.find(function (c) { return c.key === key; });
  if (!cat || !cat.match) return true;
  return cat.match.test(videoBlob(v));
}
async function handleUpdate(update, env) {
  const msg = update.message || update.channel_post;
  if (!msg || !msg.text) return { processed: false, command: "empty" };
  const text = String(msg.text).trim();
  const chatId = msg.chat.id;
  const cmd = classifyCommand(text);
  if (!env.BOT_TOKEN) return { processed: false, command: cmd || "no_token" };
  const allowed = String(env.TELEGRAM_USER_ID || "").trim();
  const fromId = String((msg.from && msg.from.id) || "");
  if (allowed && fromId && fromId !== allowed && String(chatId) !== allowed) {
    await reply(env, chatId, "Akses ditolak.\nBot ini hanya untuk admin.");
    return { processed: true, command: "denied" };
  }
  if (cmd === "help" || cmd === "menu") {
    await ensureBotMenu(env);
    await reply(env, chatId, [
      "Menu Dr. Pinguin",
      "",
      "1. Pilih Minta 10 atau Minta 25",
      "2. Pilih kategori: Semua / Amatir / Videy / Mumu / Putarin",
      "3. Lagi = ulang jumlah + kategori terakhir",
      "",
      "Contoh ketik: minta 10 videy"
    ].join("\n"), MENU_KEYBOARD);
    return { processed: true, command: cmd };
  }
  if (cmd === "share") {
    const onlyCount = /^(minta|sebar)?\s*(10|25)$/i.test(text.replace(/^\//, "").trim()) || /^\/?(minta|sebar)(10|25)?$/i.test(text.trim());
    const cat = parseShareCat(text);
    const n = parseShareCount(text, 0);
    if (onlyCount && !cat) {
      await rememberPref(env, { lastN: n || 25, lastCat: "all", waitCat: true });
      await reply(env, chatId, "Siap " + (n || 25) + " link. Pilih kategori:", MENU_KEYBOARD);
      return { processed: true, command: "wait_cat" };
    }
    const useLast = /^(lagi|gas|next|terus)$/i.test(text.trim());
    await handleShare(env, chatId, {
      count: n || 0,
      cat: cat || "",
      useLast: useLast,
      catOnly: !!(cat && !n && !useLast && !/^minta|^sebar|^\//i.test(text))
    });
    return { processed: true, command: "share" };
  }
  const rawLinks = (text.match(/https?:\/\/[^\s<>"']+/gi) || []).map(function (u) { return u.replace(/[).,]+$/, ""); });
  if (rawLinks.some(isBlockedHost) && !rawLinks.some(isAllowedHost)) {
    await reply(env, chatId, "Vicek/ExaStream sudah dihapus. Tidak diterima.");
    return { processed: true, command: "blocked_exa" };
  }
  const links = extractLinks(text);
  if (!links.length) {
    await reply(env, chatId, "Tidak dikenali. Pilih Minta 10 / kategori, atau kirim link.", MENU_KEYBOARD);
    return { processed: true, command: "no_links" };
  }
  const items = parseNamedLinks(text).filter(function (it) {
    if (isBlockedHost(it.embed) || isBlockedHost(it.direct) || /exastream|vicek/i.test(String(it.category || ""))) return false;
    return !/\b(underage|bocil|anak|child)\b/i.test(String(it.title || "") + " " + String(it.category || ""));
  });
  if (!items.length) {
    await reply(env, chatId, "Link terbaca tapi ditolak / gagal diproses.");
    return { processed: true, command: "parse_fail" };
  }
  if (!env.GH_TOKEN) {
    await reply(env, chatId, "Upload butuh GH_TOKEN valid. Minta 10/25 tetap jalan.");
    return { processed: true, command: "missing_env" };
  }
  try {
    const repos = [env.GH_REPO, env.GH_REPO_2].filter(Boolean);
    const lines = ["Selesai diproses.", "Link diterima: " + items.length];
    for (const repo of repos) {
      const r = await mergeAndPush(env, repo, items);
      lines.push(repo + ": +" + r.added + " skip " + r.skipped);
    }
    await reply(env, chatId, lines.join("\n"), MENU_KEYBOARD);
  } catch (e) {
    await reply(env, chatId, "Gagal simpan: " + String(e.message || e));
  }
  return { processed: true, command: "upload" };
}
function classifyCommand(text) {
  const t = String(text || "").trim().toLowerCase();
  if (t.startsWith("/start") || t.startsWith("/help") || t === "bantuan" || t === "help") return "help";
  if (t.startsWith("/menu") || t === "menu") return "menu";
  if (isShareCommand(t)) return "share";
  return "other";
}
function isShareCommand(text) {
  const t = String(text || "").trim().toLowerCase();
  if (/https?:\/\//i.test(t) && !/^\s*\/?(minta|sebar)/.test(t)) return false;
  if (/^\/?(sebar|share|link|minta)/.test(t)) return true;
  if (t === "minta 10" || t === "minta 25" || t === "lagi" || t === "gas" || t === "next" || t === "terus") return true;
  if (CATS.some(function (c) { return t === c.label.toLowerCase() || t === c.key; })) return true;
  if (/kasih\s*link|nyebar/.test(t)) return true;
  return false;
}
function shareKeyFromVideo(v) {
  const u = String(v.embed || v.embedUrl || v.direct || "");
  if (/vicek|exastream/i.test(u)) return "";
  try {
    const url = new URL(u);
    const qid = url.searchParams.get("id");
    if (qid) return qid;
    const last = url.pathname.split("/").filter(Boolean).pop() || "";
    return last.replace(/\.(mp4|mov)$/i, "") || String(v.id || "");
  } catch (_) { return String(v.id || u.slice(-12)); }
}
function cleanTitle(t) {
  return String(t || "Video").replace(/^\u25b6\s*/, "").replace(/\s*-\s*koleksidrpinguin.*/i, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
async function readVideos(env, repo) {
  const owner = env.GH_OWNER;
  const path = env.GH_PATH || "data/videos.json";
  const branch = env.GH_BRANCH || "main";
  const rawUrl = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/" + branch + "/" + path + "?t=" + Date.now();
  try {
    if (env.GH_TOKEN) {
      const meta = await gh(env, "/repos/" + owner + "/" + repo + "/contents/" + path + "?ref=" + branch);
      let raw = "";
      if (meta.content && meta.content.length < 500000) raw = Buffer.from(meta.content.replace(/\n/g, ""), "base64").toString("utf8");
      else {
        const dl = meta.download_url || rawUrl;
        const rr = await fetch(dl + (dl.includes("?") ? "&" : "?") + "t=" + Date.now(), { headers: { Authorization: "token " + env.GH_TOKEN, "User-Agent": "dr-pinguin-tg-bot", Accept: "application/vnd.github.v3.raw" } });
        raw = await rr.text();
      }
      return JSON.parse(raw);
    }
  } catch (e) { console.error("gh read fail, fallback public", e.message || e); }
  const rr = await fetch(rawUrl, { headers: { "User-Agent": "dr-pinguin-tg-bot" } });
  if (!rr.ok) throw new Error("gagal baca katalog publik HTTP " + rr.status);
  return rr.json();
}
async function stateRepo(env) { return env.GH_STATE_REPO || "kdp-bot-state"; }
async function readShareState(env) {
  const owner = env.GH_OWNER; const repo = await stateRepo(env);
  try {
    const meta = await gh(env, "/repos/" + owner + "/" + repo + "/contents/share-used.json?ref=" + (env.GH_BRANCH || "main"));
    const raw = Buffer.from((meta.content || "").replace(/\n/g, ""), "base64").toString("utf8");
    const st = JSON.parse(raw || "{}"); st.sha = meta.sha; return st;
  } catch (e) { return { resetAt: 0, used: [], lastN: 25, lastCat: "all", sha: null }; }
}
async function writeShareState(env, st) {
  if (!env.GH_TOKEN) return;
  const owner = env.GH_OWNER; const repo = await stateRepo(env);
  const body = {
    message: "state: share-used",
    content: Buffer.from(JSON.stringify({ resetAt: st.resetAt, used: st.used, lastN: st.lastN || 25, lastCat: st.lastCat || "all" }, null, 2), "utf8").toString("base64"),
    branch: env.GH_BRANCH || "main"
  };
  if (st.sha) body.sha = st.sha;
  await gh(env, "/repos/" + owner + "/" + repo + "/contents/share-used.json", { method: "PUT", body: JSON.stringify(body) });
}
async function rememberPref(env, patch) {
  let st;
  try { st = await readShareState(env); } catch (_) { st = { used: [], resetAt: Date.now() }; }
  Object.assign(st, patch);
  try { await writeShareState(env, st); } catch (_) {}
}
async function handleShare(env, chatId, opt) {
  opt = opt || {};
  const videos = await readVideos(env, env.GH_REPO);
  let st = { resetAt: Date.now(), used: [], lastN: 25, lastCat: "all", sha: null };
  try { st = await readShareState(env); } catch (_) {}
  const now = Date.now(); const DAY = 24 * 60 * 60 * 1000;
  if (!st.resetAt || now - st.resetAt >= DAY) { st.resetAt = now; st.used = []; }
  let n = opt.count || 0;
  let cat = opt.cat || "";
  if (opt.useLast || opt.catOnly || !n) n = st.lastN || 25;
  if (opt.useLast || !cat) cat = cat || st.lastCat || "all";
  n = Math.max(1, Math.min(30, n));
  if (!cat) cat = "all";
  st.lastN = n;
  st.lastCat = cat;
  const used = new Set((st.used || []).map(String));
  const pool = [];
  for (const v of videos) {
    const blob = String(v.embed || v.direct || v.category || "");
    if (/vicek|exastream/i.test(blob)) continue;
    if (!matchCat(v, cat)) continue;
    const key = shareKeyFromVideo(v);
    if (!key || used.has(key)) continue;
    pool.push({ key: key, title: cleanTitle(v.title) });
  }
  const catLabel = (CATS.find(function (c) { return c.key === cat; }) || { label: "Semua" }).label;
  if (!pool.length) {
    await reply(env, chatId, "Stok " + catLabel + " habis untuk sesi 24 jam.", MENU_KEYBOARD);
    return;
  }
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
  const take = pool.slice(0, n);
  take.forEach(function (x) { used.add(x.key); });
  st.used = Array.from(used);
  try { await writeShareState(env, st); } catch (e) { console.error("share state write skipped", e.message || e); }
  const host = String(env.PUBLIC_HOST || "https://koleksidrpinguin.com").replace(/\/$/, "");
  const head = catLabel + " · " + take.length + " link\n\n";
  const lines = take.map(function (x) { return "\u25b6 " + x.title + "\n" + host + "/v/" + x.key; });
  await reply(env, chatId, head + lines.join("\n\n"), MENU_KEYBOARD);
}
function parseNamedLinks(text) {
  const lines = String(text).split(/\r?\n/); const items = []; let pending = "";
  for (const rawLine of lines) {
    const line = rawLine.trim(); if (!line) continue;
    const m = line.match(/https?:\/\/[^\s<>"']+/i);
    if (m) {
      const url = m[0].replace(/[).,]+$/, "");
      if (/koleksidrpinguin\.(com|site)/i.test(url)) continue;
      if (isBlockedHost(url) || !isAllowedHost(url)) continue;
      const it = toItem(url); if (pending) it.title = cleanTitle(pending); items.push(it); pending = "";
    } else if (!line.startsWith("/")) pending = line;
  }
  return items;
}
function extractLinks(text) {
  const raw = text.match(/https?:\/\/[^\s<>"']+/gi) || []; const out = []; const seen = new Set();
  for (let u of raw) {
    u = u.replace(/[).,]+$/, "");
    if (isBlockedHost(u) || !isAllowedHost(u) || seen.has(u)) continue;
    seen.add(u); out.push(u);
  }
  return out;
}
function toItem(url) {
  const low = url.toLowerCase(); let category = "Amatir"; let source = "Telegram"; let direct = url; let embed = url; let id = "";
  if (low.includes("mumu.watch") || low.includes("mumustream.com")) {
    category = "Video AI China"; source = "Mumu";
    const code = url.split("/").filter(Boolean).pop(); id = code;
    embed = /\/e\//i.test(url) ? url : ("https://mumu.watch/e/" + code); direct = embed;
  } else if (low.includes("videy.co")) {
    category = "Videy"; source = "Videy";
    const m = url.match(/[?&]id=([A-Za-z0-9]+)/);
    const file = url.match(/cdn\d*\.videy\.co\/([^/?#]+)/i);
    id = (m && m[1]) || (file && file[1].replace(/\.(mp4|mov)$/i, "")) || "";
    const ext = (id.length === 9 && id.endsWith("2")) ? ".mov" : ".mp4";
    direct = (/\.mp4|\.mov/i.test(url) && /cdn/i.test(url)) ? url : (id ? ("https://cdn.videy.co/" + id + ext) : url);
    embed = id ? ("https://videy.co/v/?id=" + id) : url;
  } else if (/putarin\.|puterin\./i.test(low)) {
    category = "Putarin"; source = "Putarin";
    const host = putarinHost(url); id = putarinCode(url);
    embed = host + "/e/" + id; direct = host + "/v/" + id;
  } else if (/playmogo|dood/i.test(low)) {
    category = "AI Bokep"; source = "Dood"; embed = url; direct = url;
  } else {
    source = low.includes("userbokep") ? "Userbokep" : "IndoAV";
    embed = url.replace(/\/d\//, "/e/"); direct = embed;
  }
  return { title: id ? (category + " " + id) : category, direct: direct, embed: embed, source: source, category: category, tags: [category.toLowerCase(), "telegram"], date: new Date().toISOString().slice(0, 10) };
}
function videoKey(v) {
  const u = (v.direct || v.embed || "").toLowerCase();
  if (u.includes("id=")) return u.split("id=")[1].split("&")[0];
  return u.split("/").pop().replace(/\.(mp4|mov)$/, "");
}
async function mergeAndPush(env, repo, items) {
  items = items.filter(function (it) { return !isBlockedHost(it.embed) && !isBlockedHost(it.direct) && !/exastream|vicek/i.test(String(it.category || "")); });
  const owner = env.GH_OWNER; const path = env.GH_PATH || "data/videos.json"; const branch = env.GH_BRANCH || "main";
  const meta = await gh(env, "/repos/" + owner + "/" + repo + "/contents/" + path + "?ref=" + branch);
  let raw = "";
  if (meta.content) raw = Buffer.from(meta.content.replace(/\n/g, ""), "base64").toString("utf8");
  else {
    const dl = meta.download_url || ("https://raw.githubusercontent.com/" + owner + "/" + repo + "/" + branch + "/" + path);
    const rr = await fetch(dl + (dl.includes("?") ? "&" : "?") + "t=" + Date.now(), { headers: { Authorization: "token " + env.GH_TOKEN, "User-Agent": "dr-pinguin-tg-bot", Accept: "application/vnd.github.v3.raw" } });
    raw = await rr.text();
  }
  if (!raw || !raw.trim()) throw new Error("videos.json kosong / gagal dibaca");
  const videos = JSON.parse(raw).filter(function (v) { return !/vicek|exastream/i.test(String(v.embed || "") + String(v.direct || "") + String(v.category || "")); });
  const exist = new Set(videos.map(videoKey));
  let added = 0, skipped = 0; const fresh = [];
  for (const it of items) {
    const k = videoKey(it);
    if (exist.has(k)) { skipped += 1; continue; }
    exist.add(k); fresh.push(it); added += 1;
  }
  for (let i = fresh.length - 1; i >= 0; i--) videos.unshift(fresh[i]);
  if (!added) return { added: added, skipped: skipped };
  await gh(env, "/repos/" + owner + "/" + repo + "/contents/" + path, { method: "PUT", body: JSON.stringify({ message: "bot: add " + added + " videos from Telegram", content: Buffer.from(JSON.stringify(videos, null, 2), "utf8").toString("base64"), sha: meta.sha, branch: branch }) });
  return { added: added, skipped: skipped };
}
async function gh(env, path, opt) {
  opt = opt || {};
  const res = await fetch("https://api.github.com" + path, { method: opt.method || "GET", headers: { Authorization: "token " + env.GH_TOKEN, Accept: "application/vnd.github.v3+json", "User-Agent": "dr-pinguin-tg-bot", "Content-Type": "application/json" }, body: opt.body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || String(res.status));
  return data;
}
async function reply(env, chatId, text, keyboard) {
  if (!env.BOT_TOKEN) return;
  const payload = { chat_id: chatId, text: text };
  if (keyboard) payload.reply_markup = keyboard;
  const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!data.ok) console.error("[tg] sendMessage fail", data);
}
