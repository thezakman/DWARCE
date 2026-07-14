# 🟥 DWARCE — Days Without An RCE

![License](https://img.shields.io/badge/license-MIT-3fb950)
![Electron](https://img.shields.io/badge/Electron-32-47848F?logo=electron&logoColor=white)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-8b949e)
![Runtime deps](https://img.shields.io/badge/runtime%20deps-0-3fb950)
![i18n](https://img.shields.io/badge/i18n-EN%20%7C%20PT--BR-3b82f6)
![Days without an RCE](https://img.shields.io/badge/days%20without%20an%20RCE-0-e01e1e)

![Ops](assets/ops.png)

A parody of those industrial safety signs — *"We've gone ___ days without a workplace
accident, our record is ___ days"* — but **with the moral flipped**: it counts the
**days without an RCE** (Remote Code Execution).

On a factory sign, many days **without an accident** is good. Here it's the **opposite**:
the longer you go **without popping an RCE**, the more **rusty** you are (*"not a hacker
anymore?"* 💀). Sitting at **0 days** means you just popped one = 🔥 **sinister**. Getting an
RCE is a **celebration** (confetti + fanfare), not an alarm.

A desktop app (Electron) styled like a dark tactical HUD: an **LED dot-matrix display** with
targeting-reticle overlays, framed by a **yellow industrial hazard bezel**, a chrome + glossy-red
title, a live counter, a roast verdict, a "longest dry spell" record, an RCE log, two languages
(EN / PT-BR) and local persistence.

![Days Without An RCE — English](assets/preview-en.png)

![Dias Sem Um RCE — Português](assets/preview-pt.png)

## Run

```bash
npm install   # pulls Electron
npm start
```

Already installed once? Just `npm start`.

## Features

- ⏱️ **Rust meter** — days since your last RCE, ticking up on its own in real time, plus a live
  `HH:MM:SS` clock.
- 💀 **Verdict** that shifts as you rust: `sinister` (0 days) → `still sharp` → `getting rusty`
  → `not a hacker anymore?` (100+), shown as a color-coded status pill.
- 💥 **Popped an RCE!** — celebration (confetti + triumphant fanfare + flash), resets the meter
  and logs it (optional note: CVE / target / service).
- 🏜️ **Longest dry spell** — the record (inverted!): the most days you ever went without an RCE.
- 🏆 **RCE log** — every RCE you popped (date/time + the dry spell it broke + note).
- ⚙️ **Adjust** — seed/fix the values by hand and **switch language EN ↔ PT-BR**.
- 🔊 Toggleable sound (WebAudio, no asset files).
- 🎨 Handcrafted visuals: dark carbon/circuit substrate, yellow hazard frame with hex bolts,
  true LED dot-matrix panel (digits are lit cells of the same grid), HUD tech-text, chrome and
  glossy-red 3D lettering, and a responsive layout that scales to fit any window size.

## Persistence

State lives in `rce-board.json` inside Electron's per-user data folder
(`app.getPath('userData')`), so it survives updates and is never committed. It's generated on
first run, and every write is atomic (writes to `.tmp`, then renames). Use **📁 Data**
(inside *Adjust*) to reveal the file.

## Security

`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` and a strict CSP — an app
about RCE couldn't have an RCE. 😏

## Structure

```
main.js            main process (window + IPC)
store.js           state logic + persistence (unit-testable in isolation)
preload.js         safe bridge (contextBridge)
renderer/
  index.html       board markup + modals
  styles.css       all the visuals (dark HUD + LED dot-matrix)
  segments.js      LED dot-matrix renderer (digits are lit cells of a shared grid)
  renderer.js      UI, per-second tick, animations, i18n, responsive scaling
```

## License

MIT
