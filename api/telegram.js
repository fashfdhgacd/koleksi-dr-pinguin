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
function isBlockedHost(u) { return /vicek\\.id|exastream/i.test(String(u || "")); }
