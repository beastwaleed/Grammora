// grammora-showcase/src/encode-logo.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.resolve(__dirname, '../assets/Grammora-Logo.png');
const outPath = path.resolve(__dirname, 'logo-data.js');

const b64 = fs.readFileSync(logoPath).toString('base64');
const content = `window.GRAMMORA_LOGO_B64 = "data:image/png;base64,${b64}";\n`;
fs.writeFileSync(outPath, content, 'utf8');

console.log(`Successfully generated ${outPath} (${(content.length / 1024 / 1024).toFixed(2)} MB)`);

