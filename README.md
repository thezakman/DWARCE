# 🟥 DWARCE — Days Without An RCE

![Ops](assets/ops.png)

Uma paródia das placas de segurança industrial — *"Estamos há ___ dias sem acidentes de
trabalho, nosso recorde é ___ dias"* — mas **com a moral invertida**: aqui conta os
**dias sem um RCE** (Remote Code Execution).

Na placa de fábrica, muitos dias **sem acidente** é bom. Aqui é o **contrário**: quanto mais
dias você fica **sem pegar um RCE**, mais **enferrujado** você está (*"não é mais hacker?"* 💀).
Estar em **0 dias** = você acabou de mandar um = 🔥 **sinistro**. Pegar um RCE é **comemoração**
(confete e fanfarra), não alarme.

App desktop (Electron) com **painel LED dot-matrix vermelho** embutido numa **placa amarela
desgastada** montada na parede, contador em tempo real, veredito que te zoa, "maior seca",
log de RCEs, dois idiomas (EN / PT-BR) e persistência local.

![Days Without An RCE — English](assets/preview-en.png)

![Dias Sem Um RCE — Português](assets/preview-pt.png)

## Rodar

```bash
npm install   # baixa o Electron
npm start
```

## Recursos

- ⏱️ **Medidor de ferrugem** — dias desde o seu último RCE, crescendo sozinho em tempo real,
  + relógio ao vivo `HH:MM:SS`.
- 💀 **Veredito** que muda conforme você enferruja: `🔥 sinistro` (0 dias) → `ainda afiado` →
  `começando a enferrujar…` → `não é mais hacker? 💀` (100+).
- 💥 **Peguei um RCE!** — comemoração (confete + fanfarra + flash dourado), zera o medidor e
  registra no seu log (com nota opcional: CVE / alvo / serviço).
- 🏜️ **Maior seca** — o recorde (invertido!) do maior nº de dias que você já ficou sem pegar um RCE.
- 🏆 **Log de RCEs** — cada RCE pego (data/hora + tamanho da seca que quebrou + nota).
- ⚙️ **Ajustar** — semear/corrigir os valores à mão e **trocar idioma EN ↔ PT-BR**.
- 🔊 Som ligável/desligável.
- 🎨 Visual caprichado: parede industrial com holofote, placa amarela com ferrugem, arranhões,
  grão, parafusos e tinta descascando; painel LED com glow, bloom vermelho, scanline e flicker.

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
