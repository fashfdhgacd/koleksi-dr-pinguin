function putarinCode(u) {
  const m = String(u || "").match(/\/(?:e|v)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : "";
}
function isPutarinBlob(s) {
  return /putarin|puterin/i.test(String(s || ""));
}
function isMumuBlob(s) {
  return /mumu\.watch|mumustream|video ai china/i.test(String(s || ""));
}
function esc(s) {
  return String(s || "").replace(/[&<>"']/g, function (ch) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
  });
}
function keyOf(v) {
  const u = String((v && (v.embed || v.direct || v.embedUrl)) || "");
  try {
    const url = new URL(u);
    const qid = url.searchParams.get("id");
    if (qid) return String(qid);
    const last = url.pathname.split("/").filter(Boolean).pop() || "";
    return last.replace(/\.(mp4|mov)$/i, "");
  } catch (_) {
    return String(u.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
  }
}
function pageHtml(opts) {
  const title = opts.title;
  const cat = opts.cat;
  const embed = opts.embed;
  const sourceWatch = opts.sourceWatch;
  const back = opts.back;
  const page = opts.page;
  const vid = opts.id || "";
  const tall = Boolean(opts.tall);
  const t = encodeURIComponent(title);
  const u = encodeURIComponent(page);
  const txt = encodeURIComponent(title + "\n" + page);
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)} | Dr. Pinguin</title><script defer src="/_vercel/insights/script.js"></script><script defer src="https://cloud.umami.is/script.js" data-website-id="f4bdb4aa-574f-41ef-a168-ba17b4c2d0cb"></script><style>*{box-sizing:border-box}html,body{margin:0;background:#050505;color:#eee;font-family:system-ui,sans-serif;overflow-x:hidden}a,button{color:#ff9000;text-decoration:none;font:inherit}header{position:sticky;top:0;z-index:20;background:#000;border-bottom:2px solid #ff9000}.nav{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;gap:8px}.brand{font-weight:900;white-space:nowrap}.brand b{color:#ff9000}.player-wrap{background:#000}.player{position:relative;width:100%;aspect-ratio:16/9;background:#111;margin:0 auto}.player.tall{aspect-ratio:9/16;max-height:72vh;width:min(100%,calc(72vh * 9 / 16))}.player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.body{padding:12px 12px 20px}h1{font-size:16px;line-height:1.35;margin:0 0 6px}.meta{color:#888;font-size:12px;margin:0 0 10px}.actions{display:flex;flex-wrap:wrap;gap:6px}.btn{display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 9px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid #2a2a2a;background:#161616;color:#ddd;cursor:pointer}.mode-btn{display:inline-flex}@media(max-width:899px){.btn[data-share="reddit"],.btn[data-share="threads"],.btn[data-share="line"],.btn[data-share="email"],.btn[data-share="x"]{display:none}}@media(min-width:900px){.mode-btn{display:none!important}.nav{width:min(980px,100%);margin:0 auto;padding:10px 0}.player-wrap{display:flex;justify-content:center;padding:18px 16px 0}.player,.player.tall{width:min(980px,100%);aspect-ratio:16/9;max-height:none;border-radius:12px;overflow:hidden;border:1px solid #222}.body{width:min(980px,100%);margin:0 auto;padding:16px 16px 40px}h1{font-size:22px}}</style></head><body><header><div class="nav"><a class="brand" href="/">DR.<b>PINGUIN</b></a><span><button class="btn mode-btn" type="button" id="btnTall">Vertikal</button> <button class="btn mode-btn" type="button" id="btnWide">16:9</button> <a href="${back}">Kembali</a></span></div></header><div class="player-wrap"><div class="player${tall ? " tall" : ""}" id="playerBox"><iframe src="${esc(embed)}" allow="autoplay;encrypted-media" referrerpolicy="origin"></iframe></div></div><div class="body"><h1>${esc(title)}</h1><p class="meta">${esc(cat)} \u00b7 18+</p><div class="actions"><a class="btn" href="https://wa.me/?text=${txt}" target="_blank" rel="noopener" data-share="whatsapp">WhatsApp</a><a class="btn" href="https://t.me/share/url?url=${u}&text=${t}" target="_blank" rel="noopener" data-share="telegram">Telegram</a><a class="btn" href="https://twitter.com/intent/tweet?text=${t}&url=${u}" target="_blank" rel="noopener" data-share="x">X</a><a class="btn" href="https://www.threads.net/intent/post?text=${txt}" target="_blank" rel="noopener" data-share="threads">Threads</a><a class="btn" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" data-share="facebook">Facebook</a><a class="btn" href="https://www.reddit.com/submit?url=${u}&title=${t}" target="_blank" rel="noopener" data-share="reddit">Reddit</a><a class="btn" href="https://social-plugins.line.me/lineit/share?url=${u}" target="_blank" rel="noopener" data-share="line">LINE</a><a class="btn" href="mailto:?subject=${t}&body=${txt}" data-share="email">Email</a><button class="btn" type="button" id="btnCopy" data-share="copy">Salin link</button><button class="btn" type="button" id="btnNative" data-share="native">Bagikan</button></div></div><script>var PAGE=${JSON.stringify(page)};var TITLE=${JSON.stringify(title)};var VID=${JSON.stringify(vid)};function hit(app){try{var url='/api/share-hit?app='+encodeURIComponent(app)+'&id='+encodeURIComponent(VID);if(navigator.sendBeacon)navigator.sendBeacon(url);else fetch(url,{method:'GET',keepalive:true});}catch(e){}try{if(window.umami)umami.track('share_'+app,{id:VID});}catch(e){}}document.querySelectorAll('[data-share]').forEach(function(el){el.addEventListener('click',function(){hit(el.getAttribute('data-share'));});});var btnCopy=document.getElementById('btnCopy');if(btnCopy)btnCopy.onclick=function(){hit('copy');navigator.clipboard.writeText(PAGE).then(function(){btnCopy.textContent='Tersalin';setTimeout(function(){btnCopy.textContent='Salin link';},1500);});};var btnN=document.getElementById('btnNative');if(btnN)btnN.onclick=function(){hit('native');if(navigator.share){navigator.share({title:TITLE,url:PAGE,text:TITLE}).catch(function(){});}else{navigator.clipboard.writeText(PAGE);btnN.textContent='Link disalin';}};var box=document.getElementById('playerBox');var bt=document.getElementById('btnTall');var bw=document.getElementById('btnWide');if(bt)bt.onclick=function(){if(box)box.classList.add('tall');};if(bw)bw.onclick=function(){if(box)box.classList.remove('tall');};</script></body></html>`;
}
module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && (req.query.id || req.query.v)) || "").replace(/^\//, "").trim();
    if (!id) { res.writeHead(302, { Location: "/" }); return res.end(); }
    const owner = process.env.GH_OWNER || "fashfdhgacd";
    const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
    const base = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/";
    const [a, b, c] = await Promise.all([
      fetch(base + "videos.json?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch(base + "putarin.json?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch(base + "mumu.json?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
    ]);
    const list = [].concat(a || [], b || [], c || []);
    const needle = id.toLowerCase();
    const video = list.find(function (v) {
      return keyOf(v).toLowerCase() === needle || String(v.id || "").toLowerCase() === needle;
    });
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.com").split(",")[0];
    const origin = "https://" + host;
    const page = origin + "/v/" + encodeURIComponent(id);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    function send(extra) {
      res.statusCode = 200;
      return res.end(pageHtml(Object.assign({ id: id, page: page }, extra)));
    }
    if (!video) {
      return send({ title: id, cat: "Putarin", embed: "https://puterin.biz/e/" + id, sourceWatch: "https://puterin.biz/v/" + id, back: "/putarin" });
    }
    const title = String(video.title || "Video").replace(/\s*-\s*koleksidrpinguin.*/i, "").replace(/_/g, " ").trim() || "Video";
    const raw = String(video.embed || video.direct || video.embedUrl || "");
    const blob = raw + " " + String(video.source || "") + " " + String(video.category || "") + " " + String(video.folder || "");
    const put = isPutarinBlob(blob);
    const mumu = isMumuBlob(blob);
    let embed = raw.replace("/d/", "/e/");
    let sourceWatch = embed.replace("/e/", "/v/");
    let back = "/";
    let cat = String(video.folder || video.category || "Video");
    if (mumu) {
      const code = putarinCode(raw) || id;
      embed = "https://mumu.watch/e/" + code;
      sourceWatch = "https://mumu.watch/e/" + code;
      back = "/mumu";
      cat = "Video AI China";
    } else if (put) {
      const code = putarinCode(raw) || id;
      embed = "https://puterin.biz/e/" + code;
      sourceWatch = "https://puterin.biz/v/" + code;
      back = "/putarin";
      cat = String(video.folder || video.category || "Putarin");
    }
    return send({ title: title, cat: cat, embed: embed, sourceWatch: sourceWatch, back: back, tall: Boolean(mumu) });
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("<!doctype html><html><body style='background:#050505;color:#eee;padding:24px'>Error. <a href='/' style='color:#ff9000'>Home</a></body></html>");
  }
};
