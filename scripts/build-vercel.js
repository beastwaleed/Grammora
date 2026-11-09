// scripts/build-vercel.js
import { execSync } from 'child_process';
import fs from 'fs';

console.log('Building Grammora for Vercel...');
execSync('npx esbuild server/src/serverless.ts --bundle --platform=node --format=esm --outfile=index.js --packages=external', { stdio: 'inherit' });

fs.copyFileSync('index.js', 'app.js');
if (!fs.existsSync('api')) {
  fs.mkdirSync('api');
}
fs.copyFileSync('index.js', 'api/index.js');
fs.copyFileSync('index.js', 'api/[...path].js');

console.log('✅ Vercel entrypoints generated successfully: index.js, app.js, api/index.js, api/[...path].js');
