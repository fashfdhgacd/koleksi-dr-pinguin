const hookPoster = require("../lib/poster-hook");
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
function isBlockedHost(u) { return /vicek\\.id|exastream/i.test(String(u || "")); }
function isAllowedHost(u) {
  return /videy\\.co|indoav\\.|userbokep\\.com|putarin\\.(com|biz|xyz)|puterin\\.(com|biz|xyz)|mumu\\.watch|mumustream\\.com/i.test(String(u || ""));
}
