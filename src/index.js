export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/v/") && env.ASSETS) {
      const id = url.pathname.split("/").filter(Boolean)[1] || "";
      const watch = new URL("/api/watch", url.origin);
      watch.searchParams.set("id", id);
      const asset = await env.ASSETS.fetch(new Request(watch, request));
      if (asset && asset.status !== 404) return asset;
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("ASSETS binding missing", { status: 500 });
  }
};
