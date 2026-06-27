// generate-sitemap.js
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://videyy.icu';
const VIDEOS_JSON = path.join(__dirname, 'videos.json');
const OUTPUT_SITEMAP = path.join(__dirname, 'sitemap.xml');

console.log('🚀 Starting sitemap generation...');

try {
  const videos = JSON.parse(fs.readFileSync(VIDEOS_JSON, 'utf8'));
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Homepage
  xml += `  <url>\n`;
  xml += `    <loc>${SITE_URL}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // Semua video
  videos.forEach((video) => {
    const videoUrl = `${SITE_URL}/?v=${video.id}`;
    xml += `  <url>\n`;
    xml += `    <loc>${videoUrl}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  fs.writeFileSync(OUTPUT_SITEMAP, xml);
  console.log(`✅ Sitemap berhasil dibuat! Total: ${videos.length} video`);
} catch (error) {
  console.error('❌ Error generating sitemap:', error.message);
  process.exit(1);
}
