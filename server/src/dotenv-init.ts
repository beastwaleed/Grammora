import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Automatically locate server/.env or root .env
const candidates = [
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(import.meta.dirname || '', '../.env'),
];

for (const cand of candidates) {
  if (fs.existsSync(cand)) {
    dotenv.config({ path: cand });
    break;
  }
}
