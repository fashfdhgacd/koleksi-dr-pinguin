const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#141414"/><circle cx="320" cy="180" r="36" fill="#ff9000"/><polygon points="312,164 344,180 312,196" fill="#111"/></svg>';

async function posterFromPuterin(id) {
  const r = await fetch("https://puterin.biz/v/" + id, {
    headers: { "user-agent": "Mozilla/5.0" }
  });
  const html = await r.text();
  const m =
    html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
    html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
  return m && m[1] ? m[1] : "";
}

async function posterFromAv(host, id) {
  const allow = {
    indoav: "https://tv1.indoav.app/e/",
    userbokep: "https://tv1.userbokep.com/e/"
  };
  const base = allow[host];
  if (!base || !id) return "";
  const r = await fetch(base + id, {
    headers: { "user-agent": "Mozilla/5.0", accept: "text/html" }
  });
  const html = await r.text();
  const m = html.match(/poster="(https:\/\/[^"\s]+)"/i);
  return m && m[1] ? m[1] : "";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/thumb") {
      const host = url.searchParams.get("h") || "";
      const id = (url.searchParams.get("id") || "").replace(/[^A-Za-z0-9_-]/g, "");
      try {
        const img = host && id ? await posterFromAv(host, id) : "";
        if (img) return Response.redirect(img, 302);
      } catch (e) {}
      return new Response(SVG, {
        headers: {
          "content-type": "image/svg+xml; charset=utf-8",
          "cache-control": "public, max-age=600"
        }
      });
    }

    if (url.pathname === "/api/poster") {
      const id = (url.searchParams.get("id") || "").replace(/[^A-Za-z0-9_-]/g, "");
      try {
        const img = id ? await posterFromPuterin(id) : "";
        if (img) return Response.redirect(img, 302);
      } catch (e) {}
      return new Response(SVG, {
        status: 200,
        headers: { "content-type": "image/svg+xml; charset=utf-8" }
      });
    }

    if (url.pathname.startsWith("/v/") && env.ASSETS) {
      const id = url.pathname.split("/").filter(Boolean)[1] || "";
      const watch = new URL("/api/watch", url.origin);
      watch.searchParams.set("id", id);
      const asset = await env.ASSETS.fetch(new Request(watch.toString(), request));
      if (asset && asset.status !== 404) return asset;
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("ASSETS binding missing", { status: 500 });
  }
};
