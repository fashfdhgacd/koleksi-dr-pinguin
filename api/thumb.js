module.exports = async function handler(req, res) {
  const svg = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">',
    '<rect width="640" height="360" fill="#141414"/>',
    '<circle cx="320" cy="180" r="36" fill="#ff9000"/>',
    '<polygon points="312,164 344,180 312,196" fill="#111"/>',
    '</svg>'
  ].join('');
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(svg);
};
