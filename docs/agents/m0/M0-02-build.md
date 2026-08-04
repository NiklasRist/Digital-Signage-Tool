# Issue M0-02 (#2): [grundgeruest] Vite-Renderer- und Main-Build mit dev/build-Skripten einrichten

<!--
Lokale Quelle zu GitHub-Issue #2, Stand 04.08.2026 nach dem Nachziehen beim Bauen
(Preload-Bau, Renderer-Einstiegspunkt, beide STOPP-Punkte entschieden).
ACHTUNG: docs/agents/issues-draft.md enthaelt unter "Issue S2" noch die ALTE Fassung.
Diese Datei hier ist der aktuelle Stand.
-->

## Ziel (in einem Satz)
Der Renderer läuft im Dev-Modus mit Hot-Module-Reload über Vite, Main **und Preload** werden von
esbuild gebaut und bei Änderungen neu gestartet, und `ffmpeg-static` bleibt in beiden Fällen eine
externe Abhängigkeit statt eingebündelt zu werden.

## Modul & Datei
- Modul: Grundgerüst (Build-Tooling)
- Datei: `vite.config.ts`, `scripts/build-main.mjs` (esbuild für Main **und** Preload),
  `scripts/dev.mjs` (Dev-Lauf: Vite-Server + Watcher + Electron-Neustart),
  `package.json` (Skripte `dev`, `build`, `build:renderer`, `build:main`),
  `index.html` (Renderer-Einstieg), `src/renderer/main.tsx` (Platzhalter-Einstiegspunkt,
  Inhalt ersetzt #10), `src/main/index.ts` (Platzhalter-Einstiegspunkt, Inhalt ersetzt #3)
- Vertrag: kein TK-Abschnitt; TK 3 „Technologie-Stack" (Vite, ffmpeg-static)
- Prozess/Speicher: –

> **Zuschnitt erweitert (04.08., vom Nutzer freigegeben).** Ursprünglich nannte dieses Issue nur
> `vite.config.ts`, `package.json` und eine „Main-Watch-Konfiguration". Beim Bauen fielen zwei
> Lücken auf, die kein anderes M0-Issue schließt:
> 1. **Das Preload-Skript wurde von niemandem gebaut.** #4 schreibt seinen Code, #3 verweist im
>    Fenster auf den Pfad – erzeugt hätte die Datei keiner. Der Bau liegt jetzt hier.
> 2. **Der Renderer hatte keinen Einstiegspunkt.** #10 nennt in seiner Datei-Liste nur `App.tsx`
>    und `shell/`. Ohne `index.html` und eine Einstiegsdatei kann `vite build` nichts erzeugen –
>    der zweite DoD-Punkt dieses Issues wäre unerfüllbar gewesen.

## Warum das im Gesamtsystem wichtig ist
`ffmpeg-static` liefert eine große, plattformspezifische Binärdatei. Bündelt Vite oder der
Main-Build sie versehentlich in ein JS-Bundle statt sie als externe Node-Abhängigkeit zu
behandeln, bricht entweder der Build oder die Binärdatei landet korrumpiert im Bundle – der
Fehler zeigt sich erst beim ersten echten Render-Aufruf. Verwandt mit #6 (dort wird der Pfad im
**gepackten** Zustand aufgelöst; hier geht es um den **Build-Schritt**, der das Binary nicht
anfassen darf).

## Signatur (verbindlich – NICHT ändern)
```
package.json Skripte:
  "dev":            node scripts/dev.mjs
                    Vite-Devserver (Renderer, HMR) + esbuild-Watch (Main/Preload)
                    + Electron mit Auto-Neustart bei Main-/Preload-Änderungen
  "build":          npm run build:renderer && npm run build:main
  "build:renderer": vite build
  "build:main":     node scripts/build-main.mjs      // baut Main UND Preload

vite.config.ts:
  base: './'                       // relative Pfade für file://-Laden im gepackten Zustand
  build.outDir: 'dist/renderer'
  server.strictPort: true          // sonst weicht Vite still auf einen anderen Port aus und
                                   // das Dev-Skript reicht Electron eine tote URL

scripts/build-main.mjs (esbuild):
  external: ['electron', 'ffmpeg-static', 'fluent-ffmpeg']   // der EINZIGE Ort dieser Regel
  platform: 'node', format: 'cjs'
  src/main/index.ts     -> dist/main/index.js
  src/preload/index.ts  -> dist/preload/index.js
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| Quellcode in `src/main/`, `src/renderer/` | zu bauender Code | – |
| `ffmpeg-static`-Modul | externe Binärabhängigkeit | MUSS in Main- und Bundler-Config als `external` markiert sein |

Ausgang bei Erfolg: `npm run dev` öffnet ein Electron-Fenster mit HMR im Renderer; `npm run build`
erzeugt `dist/renderer` + `dist/main`, `ffmpeg-static` bleibt unangetastet in `node_modules`.
Ausgang bei Fehler: entfällt (Build-Zeit).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „gebündeltes ffmpeg (ffmpeg-static + fluent-ffmpeg)" (CLAUDE.md, Wichtigste Festlegungen) – die
  Bündelung erfolgt über electron-builder/asarUnpack (#6/#7), **nicht** über den JS-Bundler.
- „Nur der Main-Prozess berührt ffmpeg und Dateisystem" (TK 2) – der Main-Build darf daher kein
  Browser-Target (`lib: dom`) verwenden.

## Fehlerpfade (vollständig)
Entfällt – Build-Zeit-Issue.

## Nicht selbst entscheiden – STOPP und fragen
Beide ursprünglichen Punkte sind am 04.08. vom Nutzer entschieden und stehen jetzt in der
Signatur. Sie bleiben hier als Begründung stehen, damit niemand sie erneut aufmacht:

- **Werkzeug für den Main-Build/Neustart: entschieden.** Drei Wege lagen vor (electron-vite;
  Vite + esbuild + eigenes Dev-Skript; Vite + `tsc` ohne Bundler). Gewählt wurde **Vite + esbuild
  + eigenes Dev-Skript**: hält die verbindliche Signatur ein (electron-vite hätte
  `electron.vite.config.ts` und `out/` verlangt) und macht die externals-Regel an genau einer
  sichtbaren Stelle prüfbar.
- **`ffmpeg-static` als `external`: entschieden, und zwar unterschiedlich je Seite.**
  In `scripts/build-main.mjs` **ja**. In `vite.config.ts` **nein** – und das ist kein Versehen:
  `external` heißt „diesen Import stehen lassen, zur Laufzeit auflösen". Der Renderer-Build liefe
  damit durch und die App bräche erst im Fenster, wo es kein `require()` gibt. Ohne den Eintrag
  scheitert schon der Build, laut und mit Dateinamen. Der Renderer darf ffmpeg nie importieren
  (TK 2), also soll der Versuch auffallen statt still zu gelingen.

Weiterhin offen und **nicht** selbst zu entscheiden:
- Vite meldet beim Laden von `vite.config.ts` eine Warnung („ESM syntax in a file loaded as
  CommonJS"), weil `package.json` kein `"type": "module"` trägt. Beide naheliegenden Auflösungen
  greifen den Bestand an: Umbenennen nach `vite.config.mts` widerspricht der verbindlichen
  Signatur, und `"type": "module"` in `package.json` würde `dist/main/index.js` zu ESM erklären
  und den Electron-Main brechen. Heute nur eine Warnung – vorlegen, bevor jemand daran dreht.

## Definition of Done
- [ ] Der Vite-Devserver startet eigenständig und ist unter der konfigurierten URL mit
      funktionierendem HMR erreichbar (nachweisbar daran, dass das ausgelieferte HTML den
      `@vite/client` enthält); das Watch-Tool erkennt Änderungen unter `src/main/**` und
      `src/preload/**` und löst einen Neustart aus. (Der Ende-zu-Ende-Nachweis „Fenster öffnet
      sich, Renderer lädt mit HMR" gehört zur Definition of Done von #3, weil dort der
      Main-Entry entsteht.)
- [ ] `npm run build` erzeugt `dist/renderer/`, `dist/main/index.js` **und**
      `dist/preload/index.js` für #7
- [ ] `ffmpeg-static` erscheint nach `npm run build` unverändert (Binärgröße identisch zu
      `node_modules/ffmpeg-static`) – keine Bundler-Transformation. Der Nachweis ist **mit** einem
      tatsächlichen Import zu führen: eine vorübergehend angelegte Datei unter `src/main/`, die
      `ffmpeg-static` importiert, muss nach dem Bau ein stehengebliebenes
      `require("ffmpeg-static")` im Bundle zeigen und das Bundle darf wenige Kilobyte groß
      bleiben. Ohne Import beweist der Größenvergleich nichts, weil dann gar nichts zu bündeln
      war. Die Nachweis-Datei wird danach wieder gelöscht
- [ ] `npm run typecheck` (aus #1) läuft unverändert weiter durch
- [ ] Keine Datei außerhalb der unter „Modul & Datei" genannten geändert; die Nachweis-Datei
      oben ist ausdrücklich ausgenommen, weil sie am Ende nicht mehr existiert

## Abhängigkeiten
- Blockiert von: #1
- Blockiert: #3, #6, #7, #10

## Bezug
TK 3, CLAUDE.md „Tech-Stack"

