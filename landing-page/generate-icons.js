import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imgPath = path.join(__dirname, 'src', 'assets', 'nova2.png');
const imgBuffer = fs.readFileSync(imgPath);

async function generateIcons() {
  try {
    console.log('Generating PWA icons from nova.png...');
    const resizeOptions = { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } };

    await sharp(imgBuffer).resize(192, 192, resizeOptions).png().toFile(path.join(__dirname, 'public', 'pwa-192x192.png'));
    await sharp(imgBuffer).resize(512, 512, resizeOptions).png().toFile(path.join(__dirname, 'public', 'pwa-512x512.png'));
    await sharp(imgBuffer).resize(64, 64, resizeOptions).png().toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));
    await sharp(imgBuffer).resize(32, 32, resizeOptions).png().toFile(path.join(__dirname, 'public', 'favicon-32x32.png'));
    await sharp(imgBuffer).resize(16, 16, resizeOptions).png().toFile(path.join(__dirname, 'public', 'favicon-16x16.png'));
    console.log('Icons generated successfully in public folder!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
