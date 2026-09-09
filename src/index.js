const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#141414"/><circle cx="320" cy="180" r="36" fill="#ff9000"/><polygon points="312,164 344,180 312,196" fill="#111"/></svg>';

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (ch) => ({ "&": "&", "<": "<", ">": ">", '"': """, "'": "&#39;" }[ch]));
}
function cleanTitle(s) {
  return String(s || "Video").replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, "").replace(/koleksidrpinguin\.com/ig, "").replace(/\s+/g, " ").trim() || "Video";
}
function seriesOf(s) {
  const t = cleanTitle(s).toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\b(s\d{1,2}\s*e\d{1,3}|episode\s*\d+|eps?\.?\s*\d+|part\s*\d+|20\d{2})\b/g, " ").replace(/\b[a-z]{2,6}-?\d{2,5}\b/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = t.split(" ").filter(Boolean);
  return words.length >= 3 ? words.slice(0, 4).join(" ") : (t || cleanTitle(s).toLowerCase().slice(0, 24));
}
function keyOf(v) {
  const u = String((v && (v.embed || v.direct || v.embedUrl)) || "");
  try {
    const url = new URL(u);
    return String(url.searchParams.get("id") || (url.pathname.split("/").filter(Boolean).pop() || "")).replace(/\.(mp4|mov)$/i, "");
  } catch (_) {
    return String(u.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
  }
}
function rawOf(v) {
  return String((v && (v.embed || v.direct || v.embedUrl)) || "");
}
function isBlocked(v) {
  const raw = rawOf(v) + " " + String((v && (v.source || v.category || v.folder || v.title)) || "");
  if (/videy/i.test(raw)) return true;
  if (/putarin|puterin/i.test(raw)) {
    const folder = String((v && v.folder) || "").toLowerCase();
    const title = String((v && v.title) || "");
    if (folder === "series" || /s\d{1,2}\s*e\d{1,3}/i.test(title) || /episode\s*\d+/i.test(title)) return true;
  }
  return false;
}
function posterOf(v, posters) {
  if (v && (v.poster || v.thumb || v.thumbnail)) return v.poster || v.thumb || v.thumbnail;
  const raw = rawOf(v);
  const id = keyOf(v);
  if (posters && id && posters[id]) return posters[id];
  if (/mumu\.watch/i.test(raw) && id) return "https://m-cdn.video/hls/" + id + "/thumbnail.jpg";
  if (/putarin|puterin/i.test(raw + " " + ((v && (v.source || v.category)) || "")) && id) return "/api/poster?id=" + encodeURIComponent(id);
  return "";
}
function shuffle(a) {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = x[i]; x[i] = x[j]; x[j] = t;
  }
  return x;
}
function pickRelated(all, currentId, currentTitle, n, posters) {
  const seenId = {}, seenSeries = {}, seenTitle = {};
  const cur = String(currentId || "").toLowerCase();
  const curS = seriesOf(currentTitle || "");
  if (cur) seenId[cur] = 1;
  if (curS) seenSeries[curS] = 1;
  const out = [];
  const pool = shuffle(all || []);
  for (let i = 0; i < pool.length && out.length < n; i++) {
    const v = pool[i];
    if (isBlocked(v)) continue;
    const id = keyOf(v).toLowerCase();
    const title = cleanTitle(v.title);
    const sk = seriesOf(title);
    if (!id || !title || seenId[id] || seenTitle[title.toLowerCase()] || (sk && seenSeries[sk])) continue;
    seenId[id] = 1; seenTitle[title.toLowerCase()] = 1;
    if (sk) seenSeries[sk] = 1;
    out.push({ id: keyOf(v), title, poster: posterOf(v, posters) });
  }
  return out;
}
async function loadJson(env, origin, path) {
  try {
    const r = await assetFetch(env, origin, path);
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch (_) { return []; }
}
async function loadMap(env, origin, path) {
  try {
    const r = await assetFetch(env, origin, path);
    if (!r.ok) return {};
    const d = await r.json();
    return d && typeof d === "object" && !Array.isArray(d) ? d : {};
  } catch (_) { return {}; }
}
async function assetFetch(env, origin, path) {
  let next = new URL(path, origin);
  for (let i = 0; i < 4; i++) {
    const r = await env.ASSETS.fetch(new Request(next.toString()));
    if (r.status < 300 || r.status >= 400) return r;
    const loc = r.headers.get("location");
    if (!loc) return r;
    next = new URL(loc, origin);
  }
  return env.ASSETS.fetch(new Request(new URL(path, origin).toString()));
}
async function posterFromPuterin(id) {
  const r = await fetch("https://puterin.biz/v/" + id, { headers: { "user-agent": "Mozilla/5.0" } });
  const html = await r.text();
  const m = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i) || html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
  return m && m[1] ? m[1] : "";
}
async function posterFromAv(host, id) {
  const allow = { indoav: "https://tv1.indoav.app/e/", userbokep: "https://tv1.userbokep.com/e/" };
  const base = allow[host];
  if (!base || !id) return "";
  const r = await fetch(base + id, { headers: { "user-agent": "Mozilla/5.0", accept: "text/html" } });
  const html = await r.text();
  const m = html.match(/poster="(https:\/\/[^"\s]+)"/i);
  return m && m[1] ? m[1] : "";
}
function watchHtml(opts) {
  const title = esc(opts.title), cat = esc(opts.cat || "Video"), poster = esc(opts.poster || ""), embed = esc(opts.embed || "");
  const related = (opts.related || []).map((r) => {
    const src = esc(r.poster || "");
    const img = src ? `<img src="${src}" alt="" loading="lazy">` : "";
    return `<a class="card" href="/v/${encodeURIComponent(r.id)}"><div class="ph">${img}</div><h3>${esc(r.title)}</h3></a>`;
  }).join("");
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Dr. Pinguin</title>
<style>:root{--bg:#0b0d12;--acc:#ff9000;--line:#232838}*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:#e8ecf4;font-family:system-ui,sans-serif}a{color:inherit;text-decoration:none}.wrap{width:min(1180px,calc(100% - 24px));margin:0 auto}header{position:sticky;top:0;z-index:20;background:#0b0d12f2;border-bottom:1px solid var(--line)}.hd{display:flex;align-items:center;gap:10px;min-height:52px}.logo{font-weight:900}.logo b{color:var(--acc)}main{padding:16px 0 40px}.layout{display:grid;grid-template-columns:1fr;gap:16px}@media(min-width:960px){.layout{grid-template-columns:minmax(0,1.7fr) 300px}}.player{position:relative;aspect-ratio:16/9;background:#000;border:1px solid var(--line);border-radius:14px;overflow:hidden}.hold,.player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.hold{display:flex;align-items:center;justify-content:center;cursor:pointer;background:#111 center/cover no-repeat}.btn{width:64px;height:64px;border-radius:99px;background:var(--acc);color:#111;display:grid;place-items:center}h1{font-size:20px;margin:12px 0 8px}.badges{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.badge{height:26px;padding:0 10px;border-radius:99px;background:#1a1f2c;font-size:11px;font-weight:700;display:flex;align-items:center}.acts{display:flex;gap:8px;flex-wrap:wrap}.acts a,.acts button{height:36px;padding:0 14px;border-radius:10px;border:1px solid var(--line);background:#171b26;color:#fff;font-size:12px;font-weight:800}.acts .p{background:var(--acc);color:#111;border-color:var(--acc)}.side h2{margin:0 0 10px;font-size:14px}.sg{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ph{position:relative;aspect-ratio:16/9;background:#1c1c1c;border-radius:10px;overflow:hidden}.ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.card h3{margin:6px 0 0;font-size:12px;line-height:1.3}#age{position:fixed;inset:0;background:#000;display:none;align-items:center;justify-content:center;z-index:80}#age.on{display:flex}#age .g{width:min(360px,92%);background:#161616;border:1px solid #333;border-radius:14px;padding:22px;text-align:center}#age button{width:100%;height:42px;border:0;border-radius:10px;background:var(--acc);color:#111;font-weight:900;margin-top:12px}</style></head><body>
<div id="age"><div class="g"><img src="/logo.png" width="48" height="48" alt="" style="border-radius:8px"><h2>DR.<span style="color:var(--acc)">PINGUIN</span></h2><p style="color:#9aa3b5">Konten 18+.</p><button id="ageOk" type="button">MASUK</button></div></div>
<header><div class="wrap"><div class="hd"><a class="logo" href="/">DR.<b>PINGUIN</b></a><a href="/putarin.html">JAV</a><a href="/mumu.html">AI China</a></div></div></header>
<main class="wrap"><div class="layout"><div>
<div class="player" id="box"><div class="hold" id="hold" data-src="${embed}" style="${poster ? "background-image:url('" + poster + "')" : ""}"><div class="btn">&#9654;</div></div></div>
<h1>${title}</h1><div class="badges"><span class="badge">${cat}</span><span class="badge">18+</span></div>
<div class="acts"><button class="p" id="btnShare" type="button">Bagikan</button><a href="${esc(opts.back || "/")}">Kembali</a></div>
</div><aside class="side"><h2>Rekomendasi</h2><div class="sg">${related}</div></aside></div></main>
<script>(function(){var KEY='kdp_age_ok';var age=document.getElementById('age');var ok=false;try{ok=localStorage.getItem(KEY)==='1';}catch(e){}if(!ok&&age){age.className='on';document.getElementById('ageOk').onclick=function(){try{localStorage.setItem(KEY,'1')}catch(e){}age.className='';};}var hold=document.getElementById('hold');if(hold)hold.onclick=function(){var src=hold.getAttribute('data-src');if(!src)return;document.getElementById('box').innerHTML='<iframe src="'+src+'" allow="autoplay;encrypted-media;fullscreen" allowfullscreen></iframe>';};var sh=document.getElementById('btnShare');if(sh)sh.onclick=function(){if(navigator.share){navigator.share({title:document.title,url:location.href}).catch(function(){})}else if(navigator.clipboard)navigator.clipboard.writeText(location.href);};})();</script></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname || "/";
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

    if (path === "/api/thumb") {
      const host = url.searchParams.get("h") || "";
      const id = (url.searchParams.get("id") || "").replace(/[^A-Za-z0-9_-]/g, "");
      try {
        const posters = await loadMap(env, url.origin, "/data/posters.json");
        if (id && posters[id]) return Response.redirect(posters[id], 302);
        const img = host && id ? await posterFromAv(host, id) : "";
        if (img) return Response.redirect(img, 302);
      } catch (e) {}
      return new Response(SVG, { headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=600" } });
    }
    if (path === "/api/poster") {
      const id = (url.searchParams.get("id") || "").replace(/[^A-Za-z0-9_-]/g, "");
      try { const img = id ? await posterFromPuterin(id) : ""; if (img) return Response.redirect(img, 302); } catch (e) {}
      return new Response(SVG, { headers: { "content-type": "image/svg+xml; charset=utf-8" } });
    }

    const pretty = { "/putarin": "/putarin.html", "/mumu": "/mumu.html", "/preview-nonton": "/preview-nonton.html" };
    if (pretty[path]) {
      const file = await assetFetch(env, url.origin, pretty[path]);
      if (file && file.ok) return new Response(file.body, { headers: { "content-type": "text/html; charset=utf-8" } });
    }

    if (path.startsWith("/v/") || path === "/api/watch") {
      const id = path.startsWith("/v/") ? path.split("/")[2] : (url.searchParams.get("id") || "");
      if (!id) return Response.redirect(new URL("/", url), 302);
      const [putList, mumuList, vidList, posters] = await Promise.all([
        loadJson(env, url.origin, "/data/putarin.json"),
        loadJson(env, url.origin, "/data/mumu.json"),
        loadJson(env, url.origin, "/data/videos.json"),
        loadMap(env, url.origin, "/data/posters.json")
      ]);
      const all = [].concat(putList, mumuList, vidList);
      const video = all.find((v) => keyOf(v).toLowerCase() === id.toLowerCase());
      let title = id, cat = "Video", embed = "https://puterin.biz/e/" + id, back = "/", poster = "/api/poster?id=" + encodeURIComponent(id);
      if (video) {
        title = cleanTitle(video.title);
        cat = video.folder || video.category || "Video";
        embed = String(video.embed || video.direct || "").replace("/d/", "/e/");
        poster = posterOf(video, posters);
        if (/mumu/i.test(embed + " " + cat)) back = "/mumu.html";
        else if (/putarin|puterin/i.test(embed + " " + cat)) back = "/putarin.html";
      }
      return new Response(watchHtml({ title, cat, embed, back, poster, related: pickRelated(all, id, title, 8, posters) }), {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" }
      });
    }

    if (!env.ASSETS) return new Response("ASSETS missing", { status: 500 });
    const asset = await assetFetch(env, url.origin, path === "/" ? "/index.html" : path);
    if (path.endsWith(".json") && asset.ok) {
      const headers = new Headers(asset.headers);
      headers.set("access-control-allow-origin", "*");
      return new Response(asset.body, { status: 200, headers });
    }
    return asset;
  }
};
