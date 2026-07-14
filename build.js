'use strict';

// Empacota o app pros 3 SOs (baixa o Electron certo por alvo).
// Uso: node build.js   (ou npm run dist)  → saídas em dist/

const packager = require('@electron/packager');
const path = require('path');

const OUT = path.join(__dirname, 'dist');

const targets = [
  { platform: 'darwin', arch: 'arm64' },
  { platform: 'darwin', arch: 'x64' },
  { platform: 'win32', arch: 'x64' },
  { platform: 'linux', arch: 'x64' },
];

// não empacotar arquivos de dev/repo dentro do app
const ignore = [
  /^\/dist($|\/)/,
  /^\/build\.js$/,
  /^\/store\.test\.js$/,
  /^\/\.git($|\/)/,
  /^\/\.gitignore$/,
  /^\/scratchpad($|\/)/,
  /^\/\.DS_Store$/,
];

(async () => {
  for (const t of targets) {
    console.log(`\n==> packing ${t.platform}-${t.arch}`);
    const paths = await packager({
      dir: __dirname,
      name: 'DWARCE',
      platform: t.platform,
      arch: t.arch,
      out: OUT,
      overwrite: true,
      prune: true,
      ignore,
    });
    console.log('    ->', paths.join(', '));
  }
  console.log('\nDone. Folders in dist/.');
})().catch((e) => { console.error(e); process.exit(1); });
