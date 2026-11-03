// Bundles src/main.js -> js/app.js (ESM, minified). `node build.mjs --watch` for dev.
import * as esbuild from 'esbuild';
import { readdirSync, rmSync } from 'node:fs';
// stale hashed chunks from earlier builds
for (const f of readdirSync('js')) if (/^(gl|chunk)-[A-Z0-9]{8}\.js$/.test(f)) rmSync('js/' + f);
const watch = process.argv.includes('--watch');
const opts = {
  entryPoints: ['src/main.js'],
  bundle: true,
  splitting: true,           // src/gl/index.js (Three.js) becomes its own chunk, loaded after first paint
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  format: 'esm',
  target: ['es2020', 'chrome90', 'safari15', 'firefox90'],
  outdir: 'js',
  entryNames: 'app',
  chunkNames: '[name]-[hash]',
  legalComments: 'none',
  logLevel: 'info',
  define: { 'process.env.NODE_ENV': '"production"' },
};
if (watch) { const ctx = await esbuild.context(opts); await ctx.watch(); console.log('watching…'); }
else await esbuild.build(opts);
