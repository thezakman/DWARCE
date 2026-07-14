# 🟥 DWARCE — Days Without An RCE

![Ops](assets/ops.png)

Uma placa de segurança industrial — daquelas de *"Estamos há ___ dias sem acidentes de
trabalho, nosso recorde é ___ dias"* — mas que conta os **dias sem um RCE**
(Remote Code Execution).

App desktop (Electron) com um **painel LED dot-matrix vermelho** embutido numa **placa amarela
desgastada**, contador que evolui em tempo real, recorde, histórico de incidentes, dois idiomas
(EN / PT-BR) e persistência local.

![Days Without An RCE — English](assets/preview-en.png)

![Dias Sem Um RCE — Português](assets/preview-pt.png)

## Rodar

```bash
npm install   # baixa o Electron
npm start
```

## Recursos

- ⏱️ Contador de **dias** que cresce sozinho a partir do último incidente, + relógio ao vivo
  `HH:MM:SS`.
- 💥 **Registrar RCE** — zera o contador com animação (shake + flash/sirene + som WebAudio),
  atualiza o recorde se o streak for batido, e salva uma nota (CVE / serviço / componente).
- 🏆 **Recorde** em selo estampado.
- 📜 **Histórico** de incidentes (data/hora + streak + nota).
- ⚙️ **Ajustar** — semear/corrigir dias e recorde à mão, e **trocar idioma EN ↔ PT-BR**.
- 🔊 Som ligável/desligável.
- 🎨 Visual caprichado: moldura de placa amarela com ferrugem, arranhões, grão, parafusos, tinta
  descascando; painel LED com glow, scanline, reflexo de vidro e flicker sutil.

## Persistência

O estado fica em `rce-board.json` dentro da pasta de dados do usuário do Electron
(`app.getPath('userData')`). Use **📁 Dados** (dentro de *Ajustar*) para revelar o arquivo.
Toda escrita é atômica (grava em `.tmp` e renomeia).

## Segurança

`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` e uma CSP restritiva —
um app sobre RCE não podia ter RCE. 😏

## Estrutura

```
main.js            processo principal (janela + IPC)
store.js           lógica de estado + persistência (testável isoladamente)
preload.js         ponte segura (contextBridge)
renderer/
  index.html       markup da placa + modais
  styles.css       todo o visual (grunge + LED dot-matrix)
  segments.js      dígitos LED dot-matrix em SVG (7 segmentos de "LEDs")
  renderer.js      UI, tick por segundo, animações, i18n
```

## Licença

MIT
