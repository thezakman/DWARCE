'use strict';

// Empacota o app pros 3 SOs, poda os locales não usados do Chromium
// e comprime com xz (LZMA) → dist/DWARCE-<ver>-<os>-<arch>.tar.xz
// Requer `tar` e `xz` no PATH (macOS/Linux). Uso: npm run dist

const { packager } = require('@electron/packager');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'dist');
const VER = require('./package.json').version;
const KEEP = new Set(['en-US', 'pt-BR', 'en', 'pt']); // locales mantidos

const targets = [
  { platform: 'darwin', arch: 'arm64', label: 'macos-arm64' },
  { platform: 'darwin', arch: 'x64', label: 'macos-x64' },
  { platform: 'win32', arch: 'x64', label: 'win-x64' },
  { platform: 'linux', arch: 'x64', label: 'linux-x64' },
];

const ignore = [
  /^\/dist($|\/)/, /^\/build\.js$/, /^\/store\.test\.js$/,
  /^\/\.git($|\/)/, /^\/\.gitignore$/, /^\/scratchpad($|\/)/, /^\/\.DS_Store$/,
];

// remove locales .pak (linux/win) e *.lproj (mac) fora do KEEP
function pruneLocales(dir) {
  const locales = path.join(dir, 'locales');
  if (fs.existsSync(locales)) {
    for (const f of fs.readdirSync(locales)) {
      if (f.endsWith('.pak') && !KEEP.has(f.slice(0, -4))) fs.rmSync(path.join(locales, f));
    }
  }
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name.endsWith('.lproj') && !KEEP.has(e.name.slice(0, -6))) fs.rmSync(p, { recursive: true, force: true });
        else walk(p);
      }
    }
  };
  walk(dir);
}

(async () => {
  for (const t of targets) {
    console.log(`\n==> packing ${t.label}`);
    const [appDir] = await packager({
      dir: __dirname, name: 'DWARCE',
      platform: t.platform, arch: t.arch,
      out: OUT, overwrite: true, prune: true, ignore,
    });
    pruneLocales(appDir);
    const base = path.basename(appDir);
    const out = `DWARCE-${VER}-${t.label}.tar.xz`;
    execFileSync('/bin/bash', ['-c', `tar -cf - ${JSON.stringify(base)} | xz -9 -T0 -c > ${JSON.stringify(out)}`], { cwd: OUT, stdio: 'inherit' });
    const mb = (fs.statSync(path.join(OUT, out)).size / 1048576).toFixed(0);
    console.log(`    -> dist/${out} (${mb} MB)`);
  }
  console.log('\nDone.');
})().catch((e) => { console.error(e); process.exit(1); });
