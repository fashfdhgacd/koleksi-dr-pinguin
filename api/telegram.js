/**
 * Vercel /api/telegram
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      hasBot: Boolean(process.env.BOT_TOKEN),
      hasGh: Boolean(process.env.GH_TOKEN),
      owner: process.env.GH_OWNER || null,
      repo: process.env.GH_REPO || null,
      repo2: process.env.GH_REPO_2 || null
    });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false });
  }

  const update = req.body || {};
  try {
    await handleUpdate(update, process.env);
  } catch (e) {
    console.error(e);
    try {
      const msg = update.message || update.channel_post;
      if (msg && process.env.BOT_TOKEN) {
        await reply(process.env, msg.chat.id, 'Error: ' + String(e.message || e));
      }
    } catch (_) {}
  }
  return res.status(200).json({ ok: true });
}

async function handleUpdate(update, env) {
  const msg = update.message || update.channel_post;
  if (!msg || !msg.text) return;

  const text = String(msg.text).trim();
  const chatId = msg.chat.id;

  if (!env.BOT_TOKEN) {
    console.error('BOT_TOKEN missing');
    return;
  }

  const allowed = String(env.TELEGRAM_USER_ID || '').trim();
  const fromId = String(msg.from?.id || '');
  if (allowed && fromId && fromId !== allowed && String(chatId) !== allowed) {
    await reply(env, chatId, 'Akses ditolak.');
    return;
  }

  if (text.startsWith('/start') || text.startsWith('/help')) {
    await reply(env, chatId, 'Bot aktif.\\nKirim link videy.co / vicek.id / indoav.');
    return;
  }

  const links = extractLinks(text);
  if (!links.length) {
    await reply(env, chatId, 'Tidak ada link yang dikenali.');
    return;
  }

  if (!env.GH_TOKEN || !env.GH_OWNER || !env.GH_REPO) {
    await reply(env, chatId, 'Env GitHub belum lengkap. Cek Vercel Environment Variables + Redeploy.');
    return;
  }

  const items = links.map(toItem);
  const repos = [env.GH_REPO, env.GH_REPO_2].filter(Boolean);
  const results = [];
  for (const repo of repos) {
    const r = await mergeAndPush(env, repo, items);
    results.push(repo + ': +' + r.added + ' skip ' + r.skipped);
  }
  await reply(env, chatId, 'Selesai (' + items.length + ' link)\\n' + results.join('\\n') + '\\nTunggu Vercel 1-2 menit.');
}

function extractLinks(text) {
  const raw = text.match(/https?:\\/\\/[^\\s<>"']+/gi) || [];
  const out = [];
  const seen = new Set();
  for (let u of raw) {
    u = u.replace(/[).,]+$/, '');
    if (!/videy\\.co|vicek\\.id|indoav\\.app|userbokep\\.com/i.test(u)) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function toItem(url) {
  const low = url.toLowerCase();
  let category = 'Amatir';
  let source = 'Telegram';
  let direct = url;
  let embed = url;
  let id = '';

  if (low.includes('videy.co')) {
    category = 'Videy';
    source = 'Videy';
    const m = url.match(/[?&]id=([A-Za-z0-9]+)/);
    const file = url.match(/cdn\\d*\\.videy\\.co\\/([^/?#]+)/i);
    id = (m && m[1]) || (file && file[1].replace(/\\.(mp4|mov)$/i, '')) || '';
    const ext = (id.length === 9 && id.endsWith('2')) ? '.mov' : '.mp4';
    direct = (/\\.mp4|\\.mov/i.test(url) && /cdn/i.test(url)) ? url : (id ? ('https://cdn.videy.co/' + id + ext) : url);
    embed = id ? ('https://videy.co/v/?id=' + id) : url;
  } else if (low.includes('vicek.id')) {
    category = 'ExaStream';
    source = 'Vicek';
    const code = url.split('/').filter(Boolean).pop();
    id = code;
    embed = 'https://vicek.id/e/' + code;
    direct = embed;
  } else {
    source = low.includes('userbokep') ? 'Userbokep' : 'IndoAV';
    embed = url.replace(/\\/d\\//, '/e/');
    direct = embed;
  }

  return {
    title: id ? (category + ' ' + id + ' - koleksidrpinguin.com') : (category + ' - koleksidrpinguin.com'),
    direct, embed, source, category,
    tags: [category.toLowerCase(), 'telegram'],
    date: new Date().toISOString().slice(0, 10)
  };
}

function videoKey(v) {
  const u = (v.direct || v.embed || '').toLowerCase();
  if (u.includes('id=')) return u.split('id=')[1].split('&')[0];
  return u.split('/').pop().replace(/\\.(mp4|mov)$/, '');
}

async function mergeAndPush(env, repo, items) {
  const owner = env.GH_OWNER;
  const path = env.GH_PATH || 'data/videos.json';
  const branch = env.GH_BRANCH || 'main';
  const meta = await gh(env, '/repos/' + owner + '/' + repo + '/contents/' + path + '?ref=' + branch);
  const videos = JSON.parse(Buffer.from(meta.content, 'base64').toString('utf8'));
  const exist = new Set(videos.map(videoKey));
  let added = 0, skipped = 0;
  const fresh = [];
  for (const it of items) {
    const k = videoKey(it);
    if (exist.has(k)) { skipped++; continue; }
    exist.add(k);
    fresh.push(it);
    added++;
  }
  for (let i = fresh.length - 1; i >= 0; i--) videos.unshift(fresh[i]);
  if (!added) return { added, skipped };
  await gh(env, '/repos/' + owner + '/' + repo + '/contents/' + path, {
    method: 'PUT',
    body: JSON.stringify({
      message: 'bot: add ' + added + ' videos from Telegram',
      content: Buffer.from(JSON.stringify(videos, null, 2), 'utf8').toString('base64'),
      sha: meta.sha,
      branch
    })
  });
  return { added, skipped };
}

async function gh(env, path, opt = {}) {
  const res = await fetch('https://api.github.com' + path, {
    method: opt.method || 'GET',
    headers: {
      Authorization: 'token ' + env.GH_TOKEN,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'dr-pinguin-tg-bot',
      'Content-Type': 'application/json'
    },
    body: opt.body
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || String(res.status));
  return data;
}

async function reply(env, chatId, text) {
  const res = await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  const data = await res.json();
  if (!data.ok) console.error('tg reply fail', data);
}
