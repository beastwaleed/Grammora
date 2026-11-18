// scripts/build-vercel.js
import esbuild from 'esbuild';
import fs from 'fs';

console.log('Building Grammora for Vercel...');

await esbuild.build({
  entryPoints: ['server/src/serverless.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'index.js',
  packages: 'external',
});

fs.copyFileSync('index.js', 'app.js');
if (!fs.existsSync('api')) {
  fs.mkdirSync('api');
}
fs.copyFileSync('index.js', 'api/index.js');
fs.copyFileSync('index.js', 'api/[...path].js');

console.log('✅ Vercel entrypoints generated successfully: index.js, app.js, api/index.js, api/[...path].js');
