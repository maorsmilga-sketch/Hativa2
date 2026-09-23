import sharp from 'sharp';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const logoPath = path.join(root, 'public', 'logo.png');
const outPath = path.join(root, 'public', 'og-whatsapp.png');

if (!existsSync(logoPath)) {
  console.warn('generate-og-image: public/logo.png missing, skipping');
  process.exit(0);
}

const width = 1200;
const height = 630;
const logoSize = 380;
const logoX = width - logoSize - 72;
const logoY = Math.round((height - logoSize) / 2);

const logoBuffer = await sharp(logoPath)
  .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07388A"/>
      <stop offset="100%" stop-color="#0E66C5"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="80" y="220" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700" direction="rtl">חטיבת כרמלי</text>
  <text x="80" y="290" fill="#DDF3FD" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600" direction="rtl">מערכת טיפולים ושיקום</text>
  <text x="80" y="360" fill="#DDF3FD" font-family="Arial, Helvetica, sans-serif" font-size="26" direction="rtl">לוח טיפולים מתעדכן — רפואה חטיבת כרמלי</text>
  <image href="${logoDataUrl}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}"/>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log('Generated public/og-whatsapp.png for WhatsApp link preview');
