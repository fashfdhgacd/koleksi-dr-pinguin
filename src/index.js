const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#141414"/><circle cx="320" cy="180" r="36" fill="#ff9000"/><polygon points="312,164 344,180 312,196" fill="#111"/></svg>';

function esc(s) {
  return String(s || "").replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "&#34;").replace(/'/g, "&#39;");
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
    const img = src ? "<img src=\"" + src + "\" alt=\"\" loading=\"lazy\">" : "";
    return "<a class=\"card\" href=\"/v/" + encodeURIComponent(r.id) + "\"><div class=\"ph\">" + img + "</div><h3>" + esc(r.title) + "</h3></a>";
  }).join("");
  return "<!DOCTYPE html><html lang=id><head><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\"><title>" + title + " | Dr. Pinguin</title></head><body>" +
    "<header><a href=/>DR.PINGUIN</a></header>" +
    "<main><div class=player id=box><div class=hold id=hold data-src=\"" + embed + "\" style=\"" + (poster ? ("background-image:url(" + poster + ")") : "") + "\">play</div></div>" +
    "<h1>" + title + "</h1><a href=\"" + esc(opts.back || "/") + "\">Kembali</a>" +
    "<aside><h2>Rekomendasi</h2><div class=sg>" + related + "</div></aside></main>" +
    "<script>(function(){var h=document.getElementById('hold');if(h)h.onclick=function(){var s=h.getAttribute('data-src');if(s)document.getElementById('box').innerHTML='<iframe src=\"'+s+'\" allow=fullscreen></iframe>';};})();</script></body></html>";
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname || "/";
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    if (path === "/api/thumb") {
      const id = (url.searchParams.get("id") || "").replace(/[^A-Za-z0-9_-]/g, "");
      try {
        const posters = await loadMap(env, url.origin, "/data/posters.json");
        if (id && posters[id]) return Response.redirect(posters[id], 302);
      } catch (e) {}
      return new Response(SVG, { headers: { "content-type": "image/svg+xml; charset=utf-8" } });
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
      let title = id, cat = "Video", embed = "https://puterin.biz/e/" + id, back = "/", poster = "";
      if (video) {
        title = cleanTitle(video.title);
        cat = video.folder || video.category || "Video";
        embed = String(video.embed || video.direct || "").replace("/d/", "/e/");
        poster = posterOf(video, posters);
      }
      return new Response(watchHtml({ title, cat, embed, back, poster, related: pickRelated(all, id, title, 8, posters) }), {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" }
      });
    }
    if (!env.ASSETS) return new Response("ASSETS missing", { status: 500 });
    const asset = await assetFetch(env, url.origin, path === "/" ? "/index.html" : path);
    return asset;
  }
};
