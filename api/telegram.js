/**
 * Vercel Serverless: /api/telegram
 * Env di Vercel Project → Settings → Environment Variables:
 *   BOT_TOKEN, TELEGRAM_USER_ID, GH_TOKEN, GH_OWNER,
 *   GH_REPO, GH_REPO_2, GH_PATH=data/videos.json, GH_BRANCH=main
 */

const GH_API = 'https://api.github.com';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, hint: 'POST Telegram webhook' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false });
  }
  try {
    await handleUpdate(req.body || {}, process.env);
  } catch (e) {
    console.error(e);
  }
  return res.status(200).json({ ok: true });
}

async function handleUpdate(update, env) {
  const msg = update.message || update.channel_post;
  if (!msg || !msg.text) return;

  const fromId = String(msg.from?.id || msg.chat?.id || '');
  const allowed = String(env.TELEGRAM_USER_ID || '');
  if (allowed && fromId !== allowed && String(msg.chat?.id) !== allowed) {
    await reply(env, msg.chat.id, 'Akses ditolak. Bot ini hanya untuk admin.');
    return;
  }

  const text = String(msg.text).trim();
  if (text === '/start' || text === '/help') {
    await reply(env, msg.chat.id,
      'Kirim link video:\n• videy.co\n• vicek.id\n• indoav / userbokep\nBot auto-push ke GitHub.');
    return;
  }

  const links = extractLinks(text);
  if (!links.length) {
    await reply(env, msg.chat.id, 'Tidak ada link yang dikenali.');
    return;
  }

  const items = links.map(toItem);
  const repos = [env.GH_REPO, env.GH_REPO_2].filter(Boolean);
  const results = [];
  for (const repo of repos) {
    const r = await mergeAndPush(env, repo, items);
    results.push(`${repo}: +${r.added} skip ${r.skipped}`);
  }
  await reply(env, msg.chat.id, `Selesai (${items.length} link)\n` + results.join('\n') + '\nTunggu Vercel 1–2 menit.');
}

function extractLinks(text) {
  const raw = text.match(/https?:\/\/[^\s<>"']+/gi) || [];
  const out = [];
  const seen = new Set();
  for (let u of raw) {
    u = u.replace(/[).,]+$/, '');
    if (!/videy\.co|vicek\.id|indoav\.app|userbokep\.com/i.test(u)) continue;
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
    const file = url.match(/cdn\d*\.videy\.co\/([^/?#]+)/i);
    id = (m && m[1]) || (file && file[1].replace(/\.(mp4|mov)$/i, '')) || '';
    const ext = (id.length === 9 && id.endsWith('2')) ? '.mov' : '.mp4';
    direct = (/\.mp4|\.mov/i.test(url) && /cdn/i.test(url)) ? url : (id ? `https://cdn.videy.co/${id}${ext}` : url);
    embed = id ? `https://videy.co/v/?id=${id}` : url;
  } else if (low.includes('vicek.id')) {
    category = 'ExaStream';
    source = 'Vicek';
    const code = url.split('/').filter(Boolean).pop();
    id = code;
    embed = `https://vicek.id/e/${code}`;
    direct = embed;
  } else {
    source = low.includes('userbokep') ? 'Userbokep' : 'IndoAV';
    embed = url.replace(/\/d\//, '/e/');
    direct = embed;
  }

  return {
    title: id ? `${category} ${id} - koleksidrpinguin.com` : `${category} - koleksidrpinguin.com`,
    direct, embed, source, category,
    tags: [category.toLowerCase(), 'telegram'],
    date: new Date().toISOString().slice(0, 10)
  };
}

function videoKey(v) {
  const u = (v.direct || v.embed || '').toLowerCase();
  if (u.includes('id=')) return u.split('id=')[1].split('&')[0];
  return u.split('/').pop().replace(/\.(mp4|mov)$/, '');
}

async function mergeAndPush(env, repo, items) {
  const owner = env.GH_OWNER;
  const path = env.GH_PATH || 'data/videos.json';
  const branch = env.GH_BRANCH || 'main';
  const meta = await gh(env, `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
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
  await gh(env, `/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `bot: add ${added} videos from Telegram`,
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
      Authorization: `token ${env.GH_TOKEN}`,
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
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}
