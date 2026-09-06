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
    GH_REPO_2: "",
    GH_PATH: pickEnv(["GH_PATH"]) || "data/videos.json",
    GH_BRANCH: pickEnv(["GH_BRANCH"]) || "main",
    GH_STATE_REPO: pickEnv(["GH_STATE_REPO"]),
    TELEGRAM_USER_ID: pickEnv(["TELEGRAM_USER_ID", "TELEGRAM_ADMIN_ID"]) || "7747474006",
    TELEGRAM_WEBHOOK_SECRET: pickEnv(["TELEGRAM_WEBHOOK_SECRET"])
  };
}
function envStatus(env) {
  return { ok: true, service: "telegram-webhook", ready: Boolean(env.BOT_TOKEN && env.GH_TOKEN && env.GH_OWNER && env.GH_REPO), hasBot: Boolean(env.BOT_TOKEN), hasGh: Boolean(env.GH_TOKEN), hasGithubRepo: Boolean(env.GH_OWNER && env.GH_REPO), owner: env.GH_OWNER || null, repo: env.GH_REPO || null, webhookSecretConfigured: Boolean(env.TELEGRAM_WEBHOOK_SECRET) };
}
function parseBody(req) {
  const raw = req.body;
  if (!raw) return {};
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch (e) { return {}; } }
  return raw;
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const env = getEnv();
  if (req.method === "GET") return res.status(200).json(envStatus(env));
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ ok: false, error: "Method not allowed" }); }
  const update = parseBody(req);
  const status = envStatus(env);
  try {
    const result = await handleUpdate(update, env);
    return res.status(200).json({ ok: true, ...status, processed: Boolean(result && result.processed), command: (result && result.command) || null });
  } catch (e) {
    const msg = update.message || update.channel_post;
    if (msg && env.BOT_TOKEN) { try { await reply(env, msg.chat.id, "Error bot: " + String(e.message || e)); } catch (_) {}
    }
    return res.status(200).json({ ok: true, ...status, processed: false, error: String(e.message || e) });
  }
};
function isBlockedHost(u) { return /vicek\.id|exastream/i.test(String(u || "")); }
function isAllowedHost(u) {
  return /videy\.co|indoav\.|userbokep\.com|putarin\.(com|biz|xyz)|puterin\.(com|biz|xyz)|mumu\.watch|mumustream\.com/i.test(String(u || ""));
}
function isPutarinItem(it) {
  return /putarin|puterin/i.test(String((it && it.category) || "") + String((it && it.embed) || "") + String((it && it.direct) || ""));
}
function isMumuItem(it) {
  return /mumu\.watch|mumustream|video ai china/i.test(String((it && it.category) || "") + String((it && it.embed) || "") + String((it && it.direct) || ""));
}
function putarinHost(url) {
  try { return new URL(url).origin; } catch (_) { return "https://puterin.biz"; }
}
function putarinCode(url) {
  const m = String(url).match(/\/(?:e|v|watch)\/([A-Za-z0-9_-]+)/i);
  if (m) return m[1];
  return String(url).split("/").filter(Boolean).pop() || "";
}
async function handleUpdate(update, env) {
  const msg = update.message || update.channel_post;
  const text = String(msg.text || msg.caption || "").trim();
  if (!text) return { processed: false, command: "empty" };
  const chatId = msg.chat.id;
  const cmd = classifyCommand(text);
  if (!env.BOT_TOKEN) return { processed: false, command: cmd || "no_token" };
  const allowed = String(env.TELEGRAM_USER_ID || "7747474006").trim();
  const fromId = String((msg.from && msg.from.id) || "");
  if (allowed && fromId && fromId !== allowed && String(chatId) !== allowed) {
    await reply(env, chatId, "Akses ditolak.\nBot ini hanya untuk admin.");
    return { processed: true, command: "denied" };
  }
  if (cmd === "help") {
    await reply(env, chatId, [
      "Bot Dr. Pinguin",
      "",
      "minta / sebar / minta 10 / minta 25",
      "minta com         = 25 link .com saja",
      "minta site        = 25 link .site saja",
      "terbaru           = 25 video IndoAV/userbokep terbaru",
      "",
      "Kirim judul + link:",
      "videy / indoav / userbokep / puterin.biz / mumu.watch",
      "Vicek/ExaStream ditolak."
    ].join("\n"));
    return { processed: true, command: "help" };
  }
  if (cmd === "share") { await handleShare(env, chatId, text); return { processed: true, command: "share" }; }
  if (cmd === "latest") { await handleLatest(env, chatId); return { processed: true, command: "latest" }; }
  const rawLinks = (text.match(/https?:\/\/[^\s<>\"']+/gi) || []).map(function (u) { return u.replace(/[).,]+$/, ""); });
  if (rawLinks.some(isBlockedHost) && !rawLinks.some(isAllowedHost)) {
    await reply(env, chatId, "Vicek/ExaStream sudah dihapus. Tidak diterima.");
    return { processed: true, command: "blocked_exa" };
  }
  const links = extractLinks(text);
  if (!links.length) {
    await reply(env, chatId, "Tidak ada link yang dikenali.\nPakai videy.co, indoav.app, userbokep.com, puterin.biz, atau mumu.watch\nAtau ketik: minta");
    return { processed: true, command: "no_links" };
  }
  const items = parseNamedLinks(text).filter(function (it) {
    if (isBlockedHost(it.embed) || isBlockedHost(it.direct) || /exastream|vicek/i.test(String(it.category || ""))) return false;
    return !/\b(underage|bocil)\b/i.test(String(it.title || "") + " " + String(it.category || ""));
  });
  if (!items.length) {
    await reply(env, chatId, "Link terbaca tapi ditolak / gagal diproses.");
    return { processed: true, command: "parse_fail" };
  }
  try {
    const putItems = items.filter(isPutarinItem);
    const mumuItems = items.filter(function (it) { return isMumuItem(it) && !isPutarinItem(it); });
    const other = items.filter(function (it) { return !isPutarinItem(it) && !isMumuItem(it); });
    let added = 0, skipped = 0, updated = 0;
    if (putItems.length) {
      const r = await mergeAndPush(env, env.GH_REPO, putItems, "data/putarin.json");
      added += r.added; skipped += r.skipped; updated += r.updated || 0;
    }
    if (mumuItems.length) {
      const r = await mergeAndPush(env, env.GH_REPO, mumuItems, "data/mumu.json");
      added += r.added; skipped += r.skipped; updated += r.updated || 0;
    }
    if (other.length) {
      const r = await mergeAndPush(env, env.GH_REPO, other, "data/videos.json");
      added += r.added; skipped += r.skipped; updated += r.updated || 0;
    }
    await reply(env, chatId, "Selesai diproses.\nLink diterima: " + items.length + "\nPutarin: " + putItems.length + "\nMumu: " + mumuItems.length + " (ke /mumu)\n+" + added + " skip " + skipped);
  } catch (e) {
    await reply(env, chatId, "Gagal simpan: " + String(e.message || e));
  }
  return { processed: true, command: "upload" };
}
function classifyCommand(text) {
  const t = String(text || "").trim().toLowerCase();
  if (t.startsWith("/start") || t.startsWith("/help")) return "help";
  if (/^\/?(terbaru|baru|latest)(@\w+)?(\s|$)/.test(t)) return "latest";
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
  if (/vicek|exastream/i.test(u)) return "";
  try {
    const url = new URL(u);
    const qid = url.searchParams.get("id");
    if (qid) return qid;
    const last = url.pathname.split("/").filter(Boolean).pop() || "";
    return last.replace(/\.(mp4|mov)$/i, "") || String(v.id || "");
  } catch (_) {
    return String(v.id || u.slice(-12));
  }
}
function cleanTitle(t) {
  return String(t || "Video").replace(/^\u25b6\s*/, "").replace(/\s*-\s*koleksidrpinguin.*/i, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
const VIDEO_CACHE = { at: 0, data: null, ttl: 3 * 60 * 1000 };
function shareCount(raw) {
  const m = String(raw || "").match(/\b(\d{1,2})\b/);
  if (!m) return 25;
  const n = parseInt(m[1], 10);
  if (n < 1) return 25;
  return Math.min(25, n);
}
async function readJsonPath(env, repo, path) {
  const owner = env.GH_OWNER; const branch = env.GH_BRANCH || "main";
  const meta = await gh(env, "/repos/" + owner + "/" + repo + "/contents/" + path + "?ref=" + branch);
  let raw = "";
  if (meta.content && meta.content.length < 500000) raw = Buffer.from(meta.content.replace(/\n/g, ""), "base64").toString("utf8");
  else {
    const dl = meta.download_url;
    const rr = await fetch(dl + (dl.includes("?") ? "&" : "?") + "t=" + Date.now(), { headers: { Authorization: "token " + env.GH_TOKEN, "User-Agent": "dr-pinguin-tg-bot", Accept: "application/vnd.github.v3.raw" } });
    raw = await rr.text();
  }
  return { data: raw && raw.trim() ? JSON.parse(raw) : [], sha: meta.sha };
}
async function readVideos(env, repo) {
  const now = Date.now();
  if (VIDEO_CACHE.data && (now - VIDEO_CACHE.at) < VIDEO_CACHE.ttl) return VIDEO_CACHE.data;
  const r = await readJsonPath(env, repo, env.GH_PATH || "data/videos.json");
  VIDEO_CACHE.data = Array.isArray(r.data) ? r.data : [];
  VIDEO_CACHE.at = now;
  return VIDEO_CACHE.data;
}
async function stateRepo(env) { return env.GH_STATE_REPO || "kdp-bot-state"; }
async function readShareState(env) {
  const owner = env.GH_OWNER; const repo = await stateRepo(env);
  try {
    const meta = await gh(env, "/repos/" + owner + "/" + repo + "/contents/share-used.json?ref=" + (env.GH_BRANCH || "main"));
    const raw = Buffer.from((meta.content || "").replace(/\n/g, ""), "base64").toString("utf8");
    const st = JSON.parse(raw || "{}"); st.sha = meta.sha; return st;
  } catch (e) { return { resetAt: 0, used: [], sha: null }; }
}
async function writeShareState(env, st) {
  const owner = env.GH_OWNER; const repo = await stateRepo(env);
  const body = { message: "state: share-used", content: Buffer.from(JSON.stringify({ resetAt: st.resetAt, used: st.used }, null, 2), "utf8").toString("base64"), branch: env.GH_BRANCH || "main" };
  if (st.sha) body.sha = st.sha;
  await gh(env, "/repos/" + owner + "/" + repo + "/contents/share-used.json", { method: "PUT", body: JSON.stringify(body) });
}
async function handleLatest(env, chatId) {
  const videos = await readVideos(env, env.GH_REPO);
  const pool = [];
  for (const v of videos) {
    const u = String(v.embed || v.direct || v.embedUrl || "").toLowerCase();
    if (!/indoav|userbokep/.test(u)) continue;
    const key = shareKeyFromVideo(v);
    if (!key) continue;
    pool.push({ key: key, title: cleanTitle(v.title) });
    if (pool.length >= 25) break;
  }
  if (!pool.length) { await reply(env, chatId, "Tidak ada video terbaru."); return; }
  const lines = pool.map(function (x, i) {
    const host = (i % 2 === 0) ? "https://koleksidrpinguin.com" : "https://koleksidrpinguin.site";
    return "\u25b6 " + x.title + "\n" + host + "/?v=" + x.key;
  });
  await replyChunks(env, chatId, lines);
}
async function handleShare(env, chatId, rawCmd) {
  const videos = await readVideos(env, env.GH_REPO);
  let st = await readShareState(env);
  const now = Date.now(); const DAY = 24 * 60 * 60 * 1000;
  if (!st.resetAt || now - st.resetAt >= DAY) { st.resetAt = now; st.used = []; }
  const used = new Set((st.used || []).map(String));
  const pool = [];
  for (const v of videos) {
    const blob = String(v.embed || v.direct || v.category || "");
    if (/vicek|exastream|puterin|putarin/i.test(blob)) continue;
    const key = shareKeyFromVideo(v);
    if (!key || used.has(key)) continue;
    pool.push({ key: key, title: cleanTitle(v.title) });
  }
  if (!pool.length) { await reply(env, chatId, "Stok link sesi 24 jam habis."); return; }
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
  const take = pool.slice(0, shareCount(rawCmd));
  take.forEach(function (x) { used.add(x.key); });
  st.used = Array.from(used);
  try { await writeShareState(env, st); } catch (_) {}
  const mode = String(rawCmd || "").toLowerCase();
  let hostPick = "mix";
  if (/\bcom\b|\.com/.test(mode) && !/\bsite\b/.test(mode)) hostPick = "com";
  if (/\bsite\b|\.site/.test(mode) && !/\bcom\b/.test(mode)) hostPick = "site";
  const lines = take.map(function (x, i) {
    let host = "https://koleksidrpinguin.com";
    if (hostPick === "site") host = "https://koleksidrpinguin.site";
    else if (hostPick === "mix") host = (i % 2 === 0) ? "https://koleksidrpinguin.com" : "https://koleksidrpinguin.site";
    return "\u25b6 " + x.title + "\n" + host + "/?v=" + x.key;
  });
  await replyChunks(env, chatId, lines);
}
function parseNamedLinks(text) {
  const lines = String(text).split(/\r?\n/); const items = []; let pending = "";
  for (const rawLine of lines) {
    const line = rawLine.trim(); if (!line) continue;
    const m = line.match(/https?:\/\/[^\s<>\"']+/i);
    if (m) {
      const url = m[0].replace(/[).,]+$/, "");
      if (/koleksidrpinguin\.(com|site)/i.test(url)) continue;
      if (isBlockedHost(url)) continue;
      if (!isAllowedHost(url)) continue;
      const it = toItem(url); if (pending) it.title = cleanTitle(pending); items.push(it); pending = "";
    } else if (!line.startsWith("/")) pending = line;
  }
  return items;
}
function extractLinks(text) {
  const raw = text.match(/https?:\/\/[^\s<>\"']+/gi) || []; const out = []; const seen = new Set();
  for (let u of raw) {
    u = u.replace(/[).,]+$/, "");
    if (isBlockedHost(u)) continue;
    if (!isAllowedHost(u)) continue;
    if (seen.has(u)) continue; seen.add(u); out.push(u);
  }
  return out;
}
function toItem(url) {
  const low = url.toLowerCase(); let category = "Amatir"; let source = "Telegram"; let direct = url; let embed = url; let id = "";
  if (low.includes("videy.co")) {
    category = "Videy"; source = "Videy";
    const m = url.match(/[?&]id=([A-Za-z0-9]+)/);
    const file = url.match(/cdn\d*\.videy.co\/([^/?#]+)/i);
    id = (m && m[1]) || (file && file[1].replace(/\.(mp4|mov)$/i, "")) || "";
    const ext = (id.length === 9 && id.endsWith("2")) ? ".mov" : ".mp4";
    direct = (/\.mp4|\.mov/i.test(url) && /cdn/i.test(url)) ? url : (id ? ("https://cdn.videy.co/" + id + ext) : url);
    embed = id ? ("https://videy.co/v/?id=" + id) : url;
  } else if (/mumu\.watch|mumustream\.com/i.test(low)) {
    category = "Video AI China"; source = "Mumu";
    id = putarinCode(url);
    embed = /\/e\//i.test(url) ? url : ("https://mumu.watch/e/" + id);
    direct = embed;
  } else if (/putarin\.|puterin\./i.test(low)) {
    category = "Putarin"; source = "Putarin";
    const host = putarinHost(url);
    id = putarinCode(url);
    embed = host + "/e/" + id;
    direct = host + "/v/" + id;
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
async function mergeAndPush(env, repo, items, path) {
  path = path || env.GH_PATH || "data/videos.json";
  const owner = env.GH_OWNER; const branch = env.GH_BRANCH || "main";
  let meta, raw = "[]", sha = null;
  try {
    meta = await gh(env, "/repos/" + owner + "/" + repo + "/contents/" + path + "?ref=" + branch);
    sha = meta.sha;
    if (meta.content) raw = Buffer.from(meta.content.replace(/\n/g, ""), "base64").toString("utf8");
    else {
      const dl = meta.download_url || ("https://raw.githubusercontent.com/" + owner + "/" + repo + "/" + branch + "/" + path);
      const rr = await fetch(dl + (dl.includes("?") ? "&" : "?") + "t=" + Date.now(), { headers: { Authorization: "token " + env.GH_TOKEN, "User-Agent": "dr-pinguin-tg-bot", Accept: "application/vnd.github.v3.raw" } });
      raw = await rr.text();
    }
  } catch (e) {
    raw = "[]";
  }
  if (!raw || !raw.trim()) raw = "[]";
  let videos = JSON.parse(raw);
  if (!Array.isArray(videos)) videos = [];
  if (path.indexOf("videos.json") >= 0) {
    videos = videos.filter(function (v) { return !/vicek|exastream|puterin|putarin/i.test(String(v.embed || "") + String(v.direct || "") + String(v.category || "")); });
  }
  const exist = new Set(videos.map(videoKey));
  let added = 0, skipped = 0, updated = 0; const fresh = [];
  for (const it of items) {
    const k = videoKey(it);
    if (exist.has(k)) { skipped += 1; continue; }
    exist.add(k); fresh.push(it); added += 1;
  }
  for (let i = fresh.length - 1; i >= 0; i--) videos.unshift(fresh[i]);
  if (!added && !updated && path.indexOf("videos.json") < 0) return { added: added, skipped: skipped, updated: updated };
  const body = { message: "bot: add " + added + " to " + path, content: Buffer.from(JSON.stringify(videos, null, 2), "utf8").toString("base64"), branch: branch };
  if (sha) body.sha = sha;
  await gh(env, "/repos/" + owner + "/" + repo + "/contents/" + path, { method: "PUT", body: JSON.stringify(body) });
  return { added: added, skipped: skipped, updated: updated };
}
async function gh(env, path, opt) {
  opt = opt || {};
  const res = await fetch("https://api.github.com" + path, { method: opt.method || "GET", headers: { Authorization: "token " + env.GH_TOKEN, Accept: "application/vnd.github.v3+json", "User-Agent": "dr-pinguin-tg-bot", "Content-Type": "application/json" }, body: opt.body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || String(res.status));
  return data;
}
async function reply(env, chatId, text) {
  if (!env.BOT_TOKEN) return;
  const res = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: text }) });
  const data = await res.json();
  if (!data.ok) console.error("[tg] sendMessage fail", data);
}
async function replyChunks(env, chatId, lines) {
  const chunks = [];
  let cur = [];
  let n = 0;
  for (const line of lines) {
    const add = (cur.length ? 2 : 0) + line.length;
    if (n + add > 3500 && cur.length) {
      chunks.push(cur.join("\n\n"));
      cur = [line];
      n = line.length;
    } else {
      cur.push(line);
      n += add;
    }
  }
  if (cur.length) chunks.push(cur.join("\n\n"));
  for (const part of chunks) await reply(env, chatId, part);
}
