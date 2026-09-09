const hookPoster = require("./poster-hook");
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
    GH_PATH: pickEnv(["GH_PATH"]) || "data/videos.json",
    GH_BRANCH: pickEnv(["GH_BRANCH"]) || "main",
    GH_STATE_REPO: pickEnv(["GH_STATE_REPO"]) || "kdp-bot-state",
    TELEGRAM_USER_ID: pickEnv(["TELEGRAM_USER_ID", "TELEGRAM_ADMIN_ID"]) || "7747474006",
    PUBLIC_HOST: pickEnv(["PUBLIC_HOST"]) || "https://koleksidrpinguin.com"
  };
}
const CATS = [
  { key: "all", label: "Semua" },
  { key: "amatir", label: "Amatir" },
  { key: "videy", label: "Videy" },
  { key: "mumu", label: "Mumu" },
  { key: "putarin", label: "Putarin" },
  { key: "jilbab", label: "Jilbab" },
  { key: "abg", label: "ABG" },
  { key: "stw", label: "STW" },
  { key: "viral", label: "Viral" },
  { key: "ai", label: "AI" }
];
const MENU_KEYBOARD = {
  keyboard: [
    [{ text: "Minta 10" }, { text: "Minta 25" }],
    [{ text: "Semua" }, { text: "Amatir" }, { text: "Videy" }],
    [{ text: "Mumu" }, { text: "Putarin" }, { text: "Lagi" }],
    [{ text: "Jilbab" }, { text: "ABG" }, { text: "AI" }],
    [{ text: "Menu" }]
  ],
  resize_keyboard: true,
  persistent: true
};
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const env = getEnv();
  if (req.method === "GET") return res.status(200).json({ ok: true, service: "telegram-webhook", ready: Boolean(env.BOT_TOKEN), hasBot: Boolean(env.BOT_TOKEN), hasGh: Boolean(env.GH_TOKEN), owner: env.GH_OWNER, repo: env.GH_REPO, menu: true });
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const update = typeof req.body === "string" ? (function(){try{return JSON.parse(req.body)}catch(e){return {}}}()) : (req.body || {});
  try {
    await handleUpdate(update, env);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: true, error: String(e.message || e) });
  }
};
function isBlockedHost(u) { return /vicek\.id|exastream/i.test(String(u || "")); }
function isAllowedHost(u) {
  return /videy\.co|indoav\.|userbokep\.com|putarin\.(com|biz|xyz)|puterin\.(com|biz|xyz)|mumu\.watch|mumustream\.com/i.test(String(u || ""));
}
function parseShareCount(text, fallback) {
  const t = String(text || "").toLowerCase();
  const m = t.match(/\b(5|10|15|20|25|30)\b/);
  if (m) return Math.min(30, parseInt(m[1], 10));
  return fallback || 25;
}
function parseShareCat(text) {
  const t = String(text || "").toLowerCase();
  if (t.includes("puterin") || t.includes("putarin")) return "putarin";
  for (const c of CATS) {
    if (c.key === "all") continue;
    if (t === c.key || t === c.label.toLowerCase() || t.includes(c.label.toLowerCase())) return c.key;
  }
  if (t.includes("semua")) return "all";
  return "";
}
function matchCat(v, key) {
  if (!key || key === "all") return true;
  const cat = String(v.category || "").toLowerCase();
  const blob = [v.category, v.source, v.title, (v.tags || []).join(" "), v.embed, v.direct].join(" ").toLowerCase();
  if (key === "mumu") return true;
  if (key === "putarin") return true;
  if (key === "videy") return /videy/.test(blob);
  if (cat === key) return true;
  if (key === "jilbab") return /jilbab|hijab/.test(blob);
  if (key === "abg") return /\babg\b/.test(blob);
  if (key === "stw") return /\bstw\b/.test(blob);
  if (key === "viral") return /viral/.test(blob);
  if (key === "ai") return cat === "ai" || /video ai china/.test(blob);
  if (key === "amatir") return cat === "amatir";
  return false;
}
async function handleUpdate(update, env) {
  const msg = update.message || update.channel_post;
  if (!msg || !msg.text) return;
  const text = String(msg.text).trim();
  const chatId = msg.chat.id;
  if (!env.BOT_TOKEN) return;
  const allowed = String(env.TELEGRAM_USER_ID || "").trim();
  const fromId = String((msg.from && msg.from.id) || "");
  if (allowed && fromId && fromId !== allowed && String(chatId) !== allowed) {
    await reply(env, chatId, "Akses ditolak.");
    return;
  }
  const t = text.toLowerCase();
  if (t.startsWith("/start") || t === "menu" || t.startsWith("/menu") || t === "help") {
    await reply(env, chatId, "Minta 10/25 lalu pilih kategori.\nMumu = mumu.json, Putarin = putarin.json, sisanya videos.json", MENU_KEYBOARD);
    return;
  }
  if (isShareCommand(t)) {
    const cat = parseShareCat(text);
    const n = parseShareCount(text, 0);
    const onlyCount = /^(minta|sebar)?\s*(10|25)$/i.test(text.replace(/^\//,"").trim());
    if (onlyCount && !cat) {
      await reply(env, chatId, "Siap " + (n || 25) + " link. Pilih kategori.", MENU_KEYBOARD);
      return;
    }
    await handleShare(env, chatId, { count: n || 0, cat: cat || "", useLast: /^(lagi|gas|next|terus)$/i.test(text.trim()), catOnly: !!(cat && !/^minta|^sebar|^\//i.test(text)) });
    return;
  }
  const items = parseNamedLinks(text).filter(function (it) {
    return !isBlockedHost(it.embed) && !isBlockedHost(it.direct);
  });
  if (!items.length) {
    await reply(env, chatId, "Kirim link atau pilih Minta.", MENU_KEYBOARD);
    return;
  }
  if (!env.GH_TOKEN) {
    await reply(env, chatId, "Upload butuh GH_TOKEN.");
    return;
  }
  try {
    const groups = groupUploads(items);
    const lines = ["Selesai.", "Link diterima: " + items.length];
    for (const g of groups) {
      const r = await mergeAndPush(env, env.GH_REPO, g.path, g.items);
      lines.push(g.path + ": +" + r.added + " skip " + r.skipped);
    }
    try {
      const p = await hookPoster(env, items);
      lines.push("poster +" + p);
    } catch (pe) {
      lines.push("poster: " + String(pe.message || pe));
    }
    await reply(env, chatId, lines.join("\n"), MENU_KEYBOARD);
  } catch (e) {
    await reply(env, chatId, "Gagal simpan: " + String(e.message || e));
  }
}
function groupUploads(items) {
  const buckets = { videos: [], mumu: [], putarin: [] };
  for (const it of items) {
    const u = String(it.embed || it.direct || "");
    if (/mumu\.watch|mumustream/i.test(u)) buckets.mumu.push(it);
    else if (/putarin\.|puterin\./i.test(u)) buckets.putarin.push(it);
    else buckets.videos.push(it);
  }
  const out = [];
  if (buckets.videos.length) out.push({ path: "data/videos.json", items: buckets.videos });
  if (buckets.mumu.length) out.push({ path: "data/mumu.json", items: buckets.mumu });
  if (buckets.putarin.length) out.push({ path: "data/putarin.json", items: buckets.putarin });
  return out;
}
function isShareCommand(text) {
  const t = String(text || "").trim().toLowerCase();
  if (/https?:\/\//i.test(t) && !/^\s*\/?(minta|sebar)/.test(t)) return false;
  if (/^\/?(sebar|share|link|minta)/.test(t)) return true;
  if (t === "minta 10" || t === "minta 25" || t === "lagi" || t === "gas") return true;
  if (t === "puterin") return true;
  if (CATS.some(function (c) { return t === c.label.toLowerCase() || t === c.key; })) return true;
  return false;
}
function shareKeyFromVideo(v) {
  const u = String(v.embed || v.direct || "");
  try {
    const url = new URL(u);
    const qid = url.searchParams.get("id");
    if (qid) return qid;
    const last = url.pathname.split("/").filter(Boolean).pop() || "";
    return last.replace(/\.(mp4|mov)$/i, "");
  } catch (_) { return u.slice(-12); }
}
function cleanTitle(t) {
  return String(t || "Video").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
async function readJsonList(url) {
  try {
    const rr = await fetch(url, { headers: { "User-Agent": "dr-pinguin-tg-bot" } });
    if (!rr.ok) return [];
    const d = await rr.json();
    return Array.isArray(d) ? d : [];
  } catch (_) { return []; }
}
async function readVideos(env, cat) {
  const base = "https://raw.githubusercontent.com/" + env.GH_OWNER + "/" + env.GH_REPO + "/" + (env.GH_BRANCH || "main") + "/";
  const t = Date.now();
  if (cat === "mumu") return readJsonList(base + "data/mumu.json?t=" + t);
  if (cat === "putarin") return readJsonList(base + "data/putarin.json?t=" + t);
  if (cat === "all" || !cat) {
    const lists = await Promise.all([
      readJsonList(base + "data/videos.json?t=" + t),
      readJsonList(base + "data/mumu.json?t=" + t),
      readJsonList(base + "data/putarin.json?t=" + t)
    ]);
    return lists[0].concat(lists[1], lists[2]);
  }
  return readJsonList(base + "data/videos.json?t=" + t);
}
async function handleShare(env, chatId, opt) {
  opt = opt || {};
  let n = opt.count || 0;
  let cat = opt.cat || "all";
  if (!n) n = 25;
  n = Math.max(1, Math.min(30, n));
  if (!cat) cat = "all";
  const videos = await readVideos(env, cat);
  const pool = [];
  for (const v of videos) {
    if (/vicek|exastream/i.test(String(v.embed || v.direct || ""))) continue;
    if (!matchCat(v, cat)) continue;
    const key = shareKeyFromVideo(v);
    if (!key) continue;
    pool.push({ key: key, title: cleanTitle(v.title) });
  }
  const catLabel = (CATS.find(function (c) { return c.key === cat; }) || { label: cat }).label;
  if (!pool.length) {
    await reply(env, chatId, "Kategori " + catLabel + " kosong. File item: " + videos.length, MENU_KEYBOARD);
    return;
  }
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
  const take = pool.slice(0, n);
  const host = String(env.PUBLIC_HOST || "https://koleksidrpinguin.com").replace(/\/$/, "");
  const lines = take.map(function (x) { return "\u25b6 " + x.title + "\n" + host + "/v/" + x.key; });
  await reply(env, chatId, catLabel + " \u00b7 " + take.length + " link\n\n" + lines.join("\n\n"), MENU_KEYBOARD);
}
function parseNamedLinks(text) {
  const lines = String(text).split(/\r?\n/); const items = []; let pending = "";
  for (const rawLine of lines) {
    const line = rawLine.trim(); if (!line) continue;
    const m = line.match(/https?:\/\/[^\s<>"']+/i);
    if (m) {
      const url = m[0].replace(/[).,]+$/, "");
      if (/koleksidrpinguin\./i.test(url) || isBlockedHost(url) || !isAllowedHost(url)) continue;
      const it = toItem(url); if (pending) it.title = cleanTitle(pending); items.push(it); pending = "";
    } else if (!line.startsWith("/")) pending = line;
  }
  return items;
}
function toItem(url) {
  const low = url.toLowerCase(); let category = "Amatir"; let source = "Telegram"; let direct = url; let embed = url; let id = "";
  if (low.includes("videy.co")) {
    category = "Videy"; source = "Videy";
    const m = url.match(/[?&]id=([A-Za-z0-9]+)/);
    id = (m && m[1]) || "";
    const ext = (id.length === 9 && id.endsWith("2")) ? ".mov" : ".mp4";
    direct = id ? ("https://cdn.videy.co/" + id + ext) : url;
    embed = id ? ("https://videy.co/v/?id=" + id) : url;
  } else if (/putarin\.|puterin\./i.test(low)) {
    category = "Putarin"; source = "Putarin";
    try { const host = new URL(url).origin; id = (url.match(/\/(?:e|v|watch)\/([A-Za-z0-9_-]+)/i) || [])[1] || ""; embed = host + "/e/" + id; direct = host + "/v/" + id; } catch (_) {}
  } else if (low.includes("mumu.watch")) {
    category = "Video AI China"; source = "Mumu";
    const code = url.split("/").filter(Boolean).pop(); id = code;
    embed = /\/e\//i.test(url) ? url : ("https://mumu.watch/e/" + code); direct = embed;
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
async function loadJsonFile(env, repo, path) {
  const rawUrl = "https://raw.githubusercontent.com/" + env.GH_OWNER + "/" + repo + "/" + (env.GH_BRANCH || "main") + "/" + path + "?t=" + Date.now();
  const rr = await fetch(rawUrl, { headers: { "User-Agent": "dr-pinguin-tg-bot" } });
  if (!rr.ok) throw new Error("gagal baca " + path);
  const data = await rr.json();
  return Array.isArray(data) ? data : [];
}
async function mergeAndPush(env, repo, path, items) {
  const branch = env.GH_BRANCH || "main";
  const videos = await loadJsonFile(env, repo, path);
  if (path === "data/videos.json" && videos.length < 100) {
    throw new Error("videos.json cuma " + videos.length + " item. Abort. Pulihkan commit 9228dc53.");
  }
  const meta = await gh(env, "/repos/" + env.GH_OWNER + "/" + repo + "/contents/" + path + "?ref=" + branch);
  const exist = new Set(videos.map(videoKey));
  let added = 0, skipped = 0; const fresh = [];
  for (const it of items) {
    const k = videoKey(it);
    if (exist.has(k)) { skipped += 1; continue; }
    exist.add(k); fresh.push(it); added += 1;
  }
  for (let i = fresh.length - 1; i >= 0; i--) videos.unshift(fresh[i]);
  if (!added) return { added: added, skipped: skipped };
  await gh(env, "/repos/" + env.GH_OWNER + "/" + repo + "/contents/" + path, {
    method: "PUT",
    body: JSON.stringify({ message: "bot: add " + added + " to " + path, content: Buffer.from(JSON.stringify(videos, null, 2), "utf8").toString("base64"), sha: meta.sha, branch: branch })
  });
  return { added: added, skipped: skipped };
}
async function gh(env, path, opt) {
  opt = opt || {};
  const res = await fetch("https://api.github.com" + path, {
    method: opt.method || "GET",
    headers: { Authorization: "Bearer " + env.GH_TOKEN, Accept: "application/vnd.github.v3+json", "User-Agent": "dr-pinguin-tg-bot", "Content-Type": "application/json" },
    body: opt.body
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || String(res.status));
  return data;
}
async function reply(env, chatId, text, keyboard) {
  if (!env.BOT_TOKEN) return;
  const payload = { chat_id: chatId, text: text };
  if (keyboard) payload.reply_markup = keyboard;
  await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
