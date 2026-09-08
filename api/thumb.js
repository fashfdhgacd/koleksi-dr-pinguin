module.exports = async function handler(req, res) {
  const q = req.query || {};
  const title = String(q.title || "Dr. Pinguin").replace(/\s+/g, " ").trim().slice(0, 90);
  const cat = String(q.cat || "18+").replace(/\s+/g, " ").trim().slice(0, 24);
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }
  const lines = [];
  const words = title.split(" ");
  let line = "";
  words.forEach((w) => {
    const next = line ? line + " " + w : w;
    if (next.length > 22 && line) {
      lines.push(line);
      line = w;
    } else line = next;
  });
  if (line) lines.push(line);
  const shown = lines.slice(0, 4);
  const text = shown
    .map((t, i) => `<text x="32" y="${148 + i * 36}" font-size="28" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">${esc(t)}</text>`)
    .join("");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0d0d0d"/>
  <rect x="24" y="24" width="1152" height="582" rx="18" fill="#161616" stroke="#ff9000" stroke-width="4"/>
  <text x="32" y="80" font-size="22" font-weight="900" fill="#ff9000" font-family="system-ui,sans-serif">DR.PINGUIN</text>
  <text x="32" y="112" font-size="16" fill="#888" font-family="system-ui,sans-serif">${esc(cat)} · 18+</text>
  ${text}
  <circle cx="1080" cy="520" r="44" fill="#ff9000"/>
  <polygon points="1070,500 1108,520 1070,540" fill="#111"/>
</svg>`;
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
  res.status(200).send(svg);
};
