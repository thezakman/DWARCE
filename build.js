'use strict';

// Empacota o app pros 3 SOs, poda os locales não usados do Chromium
// e comprime com xz (LZMA) → dist/DWARCE-<ver>-<os>-<arch>.tar.xz
// Requer `tar` e `xz` no PATH (macOS/Linux). Uso: npm run dist

const { packager } = require('@electron/packager');
const ResEdit = require('resedit');
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
  // assets de README/fonte de ícone não precisam no bundle (só assets/icon.png em runtime)
  /^\/assets\/(ops|preview-en|preview-pt)\.png$/,
  /^\/assets\/icon\.(svg|icns|ico)$/,
  /^\/README\.md$/, /^\/package-lock\.json$/,
];

// ícone por plataforma (packager escolhe .icns no mac e .ico no win; linux via BrowserWindow)
const iconFor = {
  darwin: path.join(__dirname, 'assets', 'icon.icns'),
  win32: path.join(__dirname, 'assets', 'icon.ico'),
  linux: path.join(__dirname, 'assets', 'icon.png'),
};

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

// seta o ícone do .exe do Windows (packager precisaria de Wine; resedit faz em JS puro)
function setWindowsIcon(appDir) {
  const exePath = path.join(appDir, 'DWARCE.exe');
  const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath));
  const res = ResEdit.NtExecutableResource.from(exe);
  const ico = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, 'assets', 'icon.ico')));
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries, 1, 1033, ico.icons.map((i) => i.data),
  );
  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
}

(async () => {
  for (const t of targets) {
    console.log(`\n==> packing ${t.label}`);
    const [appDir] = await packager({
      dir: __dirname, name: 'DWARCE',
      platform: t.platform, arch: t.arch,
      out: OUT, overwrite: true, prune: true, ignore,
      icon: iconFor[t.platform],
    });
    pruneLocales(appDir);
    if (t.platform === 'win32') setWindowsIcon(appDir);
    const base = path.basename(appDir);
    const out = `DWARCE-${VER}-${t.label}.tar.xz`;
    execFileSync('/bin/bash', ['-c', `tar -cf - ${JSON.stringify(base)} | xz -9 -T0 -c > ${JSON.stringify(out)}`], { cwd: OUT, stdio: 'inherit' });
    const mb = (fs.statSync(path.join(OUT, out)).size / 1048576).toFixed(0);
    console.log(`    -> dist/${out} (${mb} MB)`);
  }
  console.log('\nDone.');
})().catch((e) => { console.error(e); process.exit(1); });
