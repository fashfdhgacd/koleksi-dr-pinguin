export default function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname === "/" || url.pathname === "/index.html") {
    const v = url.searchParams.get("v");
    if (v) {
      url.pathname = "/v/" + encodeURIComponent(v);
      url.search = "";
      return Response.redirect(url, 301);
    }
  }
}
