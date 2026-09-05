export default function middleware(request) {
  const host = String(request.headers.get("host") || "").split(":")[0].toLowerCase();
  const aliases = {
    "situskoleksidrpinguin.site": "koleksidrpinguin.site",
    "www.koleksidrpinguin.site": "koleksidrpinguin.site",
    "www.koleksidrpinguin.com": "koleksidrpinguin.com"
  };
  const dest = aliases[host];
  if (!dest) return;
  const url = new URL(request.url);
  url.hostname = dest;
  url.protocol = "https:";
  return Response.redirect(url.toString(), 308);
}
