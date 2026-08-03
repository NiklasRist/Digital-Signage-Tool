# Issues-Draft – Digital-Signage-Tool

> **Status:** Dry-Run für M1–M7. M0 ist bereits als echte GitHub-Issues angelegt (siehe Mapping
> unten) – die Texte hier bleiben die Quelle der Wahrheit für spätere Bearbeitung/Neugenerierung.
> Wird nach Abschnitt 11 des Übergabe-Prompts (`docs/agents/issue-generation-prompt.md`)
> milestone-weise befüllt und je Milestone dem Nutzer zur Kontrolle vorgelegt, bevor der nächste
> Milestone geschrieben wird. Quelle der Wahrheit für jeden fachlichen Inhalt: Technisches Konzept
> v2.2 (`docs/Technisches_Konzept_Digital-Signage-Tool.md`).
>
> **Fortschritt:** M0 ✅ (Issues #1–#12) · M1 ✅ geschrieben, geprüft, korrigiert und **angelegt**
> (M1-01…M1-40 = Issues **#13–#52**, Milestone „M1 – Fundament") · M2 ✅ **angelegt**
> (M2-01…M2-19 = Issues **#53–#71**, Milestone „M2 – Torwächter"; Volltexte in `docs/agents/m2/`,
> s. Abschnitt am Dateiende) · M3–M7 offen.
>
> **Achtung vor dem Anlegen:** M1-01…M1-29 entstanden **vor** den Regeln C/D/E und vor der
> Anforderungsänderung vom 02.08. (mehrere benannte Ausgabedateien, FA-22). Sie brauchen denselben
> Prüflauf wie M0. Bereits nachgezogen: M1-03 (`letzterAusgabeName`), M1-06 (`dateiname` **raus** aus
> `RenderProfile`), M1-07, M1-09 (`AKTUELLE_SCHEMA_VERSION` – war nirgends definiert, wird aber von
> M1-22/M1-34/M1-36 gebraucht).
>
> **Prüflauf M0 vom 23.07.:** Vier unabhängige Prüfer gegen TK v2.2 und die Vorgaben des
> Übergabe-Prompts. 9 Befunde, davon 4 kritisch (S1 Definition of Done wegen TS18003 nicht
> erfüllbar · S5 fehlendes `PORTABLE_EXECUTABLE_DIR` → Datenverlust bei portabler EXE ·
> S7 `extraResources` unvereinbar mit dem Renderer-Bundling aus S8 · S11 Vitest-Konfiguration,
> die Integrationstests nie ausgeführt hätte). Zehn Issues korrigiert; **S4 und S9 waren ohne
> Befund**. Die Abschnitte unten sind die korrigierten Fassungen, deckungsgleich mit GitHub
> (dort in `#x`-, hier in `Sx`-Schreibweise).
>
> **Aus dem Prüflauf folgten drei neue Regeln im Übergabe-Prompt** (Abschnitt 7), die für M1–M7
> gelten: **Regel C** – in „Signatur (verbindlich)" darf nur Entschiedenes stehen, Offenes
> ausschließlich in „Nicht selbst entscheiden", nie beides; **Regel D** – Zitate wörtlich oder
> gar nicht; **Regel E** – jeder DoD-Punkt muss im erlaubten Dateibereich erfüllbar sein.

## M0 → GitHub-Mapping

Repo: `NiklasRist/Digital-Signage-Tool` (privat) · Milestone „M0 – Grundgerüst" (#1) ·
Board: [auffindbar-solutions/projects/4](https://github.com/orgs/auffindbar-solutions/projects/4).
Die S-Nummern unten entsprechen 1:1 den GitHub-Issue-Nummern (S1→#1 … S12→#12), da sie in dieser
Reihenfolge angelegt wurden. In den bereits hochgeladenen Issue-Bodies auf GitHub sind alle
`Sx`-Verweise bereits durch `#x` ersetzt; die Texte unten behalten die `Sx`-Form als lesbare
Planungsreferenz.

| S-Nr. | GitHub-Issue |
|---|---|
| S1 | [#1](https://github.com/NiklasRist/Digital-Signage-Tool/issues/1) |
| S2 | [#2](https://github.com/NiklasRist/Digital-Signage-Tool/issues/2) |
| S3 | [#3](https://github.com/NiklasRist/Digital-Signage-Tool/issues/3) |
| S4 | [#4](https://github.com/NiklasRist/Digital-Signage-Tool/issues/4) |
| S5 | [#5](https://github.com/NiklasRist/Digital-Signage-Tool/issues/5) |
| S6 | [#6](https://github.com/NiklasRist/Digital-Signage-Tool/issues/6) |
| S7 | [#7](https://github.com/NiklasRist/Digital-Signage-Tool/issues/7) |
| S8 | [#8](https://github.com/NiklasRist/Digital-Signage-Tool/issues/8) |
| S9 | [#9](https://github.com/NiklasRist/Digital-Signage-Tool/issues/9) |
| S10 | [#10](https://github.com/NiklasRist/Digital-Signage-Tool/issues/10) |
| S11 | [#11](https://github.com/NiklasRist/Digital-Signage-Tool/issues/11) |
| S12 | [#12](https://github.com/NiklasRist/Digital-Signage-Tool/issues/12) |

---

## Milestone M0 – Grundgerüst

Label `wer:grundgeruest` für alle Issues dieses Abschnitts. Reihenfolge S1→S12 spiegelt die
Abhängigkeitskette aus dem Übergabe-Prompt Abschnitt 8b.

---

### Issue S1: [grundgeruest] Ordnerstruktur und getrennte TypeScript-Toolchains anlegen

## Ziel (in einem Satz)
Main-, Preload-, Renderer- und geteilter Code liegen in eigenen Ordnern mit eigenen, streng
getrennten TypeScript-Konfigurationen, sodass kein Prozess Typen oder APIs eines anderen
Prozesses sehen kann.

## Modul & Datei
- Modul: Grundgerüst (kein Fachmodul; Basis für alle Renderer-/Main-Module aus TK 9)
- Datei: `tsconfig.base.json`, `tsconfig.main.json`, `tsconfig.preload.json`, `tsconfig.renderer.json`,
  `package.json` (Skripte), `src/main/`, `src/preload/`, `src/renderer/`, `src/shared/contracts/`,
  sowie je eine Platzhalterdatei `index.ts` in jedem angelegten Modulordner darunter
- Vertrag: kein einzelner TK-Abschnitt; abgeleitet aus TK 2 „Architektur-Überblick" und der
  Modulübersicht TK 9
- Prozess/Speicher: – (Grundgerüst für P1–P7)

## Warum das im Gesamtsystem wichtig ist
Alle 157 übrigen Issues legen Dateien in genau diese Struktur. Die Modulordnernamen müssen exakt
den Modulnamen aus TK 9 entsprechen (z. B. `src/main/render-service/`, nicht „nach Gefühl"), sonst
findet ein Agent sein Zielverzeichnis nicht oder legt parallele Strukturen an. Wichtiger noch:
Bekommt die Renderer-tsconfig `@types/node` oder `include`-Pfade, die Main-Code mitziehen,
kompiliert später ein `import fs from "fs"` im Renderer anstandslos durch – die Regel „nur der
Main berührt das Dateisystem" (TK 2) wäre nur noch Konvention, nicht mehr vom Compiler erzwungen.
Der Fehler fiele erst im gepackten Build auf.

## Signatur (verbindlich – NICHT ändern)
```
tsconfig.base.json        // strict:true, gemeinsame Compiler-Optionen
tsconfig.main.json        // extends base; include: src/main/**, src/shared/**; KEIN DOM-lib
tsconfig.preload.json     // extends base; include: src/preload/**, src/shared/**
tsconfig.renderer.json    // extends base; include: src/renderer/**, src/shared/**; KEIN @types/node
src/
  main/            // ipc-gateway, auftrags-manager, media-service, project-store, config-store,
                    // vorlagen-store, render-service, export-service, ffmpeg-adapter
    ipc-gateway/index.ts        // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    auftrags-manager/index.ts   // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    media-service/index.ts      // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    project-store/index.ts      // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    config-store/index.ts       // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    vorlagen-store/index.ts     // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    render-service/index.ts     // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    export-service/index.ts     // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    ffmpeg-adapter/index.ts     // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
  preload/         // contextBridge-Fläche (S4)
    index.ts       // Platzhalter: export {} — echte Implementierung folgt aus S4
  renderer/        // ipc-client, app-shell, composer, action-editor, template-canvas,
                    // preview-player, vorlagen-editor, queue-panel
    ipc-client/index.ts       // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    app-shell/index.ts        // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    composer/index.ts         // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    action-editor/index.ts    // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    template-canvas/index.ts  // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    preview-player/index.ts   // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    vorlagen-editor/index.ts  // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
    queue-panel/index.ts      // Platzhalter: export {} — echte Implementierung folgt aus dem jeweiligen späteren Issue
  shared/
    contracts/     // geteilte Typen (Ergebnis<T>, S12; Domänentypen ab M1)
      index.ts     // Platzhalter: export {} — echte Implementierung folgt aus S12 / M1
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| Modulnamen aus TK 9 (Modulübersicht) | verbindliche Ordnernamen | müssen exakt übereinstimmen, keine Abkürzungen/Synonyme |

Ausgang bei Erfolg: `npx tsc -p tsconfig.main.json --noEmit` (analog `preload`, `renderer`) läuft je
einzeln fehlerfrei durch; ein testweiser `import fs from "fs"` in `src/renderer/` erzeugt einen
Compile-Fehler.
Ausgang bei Fehler: entfällt (Build-Zeit-Issue, keine Laufzeit-Fehlercodes).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Nur der Main-Prozess berührt ffmpeg und Dateisystem." (TK 2)
- „Renderer ↔ Main reden AUSSCHLIESSLICH über den typisierten IPC-Vertrag." (TK 9, Modulübersicht)
- Modulordner heißen exakt wie die Module aus TK Abschnitt 9 (Übergabe-Prompt 8b, Falle zu S1).

## Fehlerpfade (vollständig)
Entfällt – reines Build-/Tooling-Issue ohne Laufzeit-Code.

## Nicht selbst entscheiden – STOPP und fragen
- **Renderer darf keine Node-Typen sehen.** Falls unklar ist, ob ein npm-Paket transitiv
  `@types/node` in die Renderer-tsconfig zieht – nicht selbst per `skipLibCheck` wegdrücken,
  sondern melden.
- Ob `strict: true` irgendwo (z. B. wegen eines Drittanbieter-Typs) abgeschwächt werden müsste –
  nicht selbst lockern, sondern den Fall zur Diskussion stellen.

## Definition of Done
- [ ] Drei tsconfig-Dateien kompilieren je isoliert fehlerfrei (`--noEmit`), ohne Abbruch durch
      TS18003 „No inputs were found in config file" (dank der Platzhalterdateien `index.ts` in
      jedem Modulordner)
- [ ] Ein testweiser `import` von `fs`/`path`/`child_process` in `src/renderer/` schlägt beim
      Typecheck fehl
- [ ] Ordnerstruktur enthält Platzhalter-Unterordner für alle in TK 9 genannten Module
- [ ] Jeder angelegte Modulordner unter `src/main/`, `src/preload/`, `src/renderer/`, `src/shared/`
      enthält eine Platzhalterdatei `index.ts` (Begründung: Git verfolgt keine leeren Ordner, und
      `tsc` braucht mindestens eine Eingabedatei je Config, sonst TS18003)
- [ ] `package.json` enthält Platzhalter-Skripte `typecheck:main`, `typecheck:preload`,
      `typecheck:renderer`
- [ ] Keine Datei außerhalb der oben genannten angelegt

## Abhängigkeiten
- Blockiert von: – (erstes Issue)
- Blockiert: S2, S3, S4, S6, S10, S11, S12

## Bezug
TK 2, TK 9 (Modulübersicht), CLAUDE.md „Tech-Stack"

---

### Issue S2: [grundgeruest] Vite-Renderer- und Main-Build mit dev/build-Skripten einrichten

## Ziel (in einem Satz)
Der Renderer läuft im Dev-Modus mit Hot-Module-Reload über Vite, der Main-Prozess wird bei
Änderungen neu gestartet, und `ffmpeg-static` bleibt in beiden Fällen eine externe Abhängigkeit
statt eingebündelt zu werden.

## Modul & Datei
- Modul: Grundgerüst (Build-Tooling)
- Datei: `vite.config.ts`, `package.json` (Skripte `dev`, `build`), Main-Watch-Konfiguration
- Vertrag: kein TK-Abschnitt; TK 3 „Technologie-Stack" (Vite, ffmpeg-static)
- Prozess/Speicher: –

## Warum das im Gesamtsystem wichtig ist
`ffmpeg-static` liefert eine große, plattformspezifische Binärdatei. Bündelt Vite oder der
Main-Build sie versehentlich in ein JS-Bundle statt sie als externe Node-Abhängigkeit zu
behandeln, bricht entweder der Build oder die Binärdatei landet korrumpiert im Bundle – der
Fehler zeigt sich erst beim ersten echten Render-Aufruf. Verwandt mit S6 (dort wird der Pfad im
**gepackten** Zustand aufgelöst; hier geht es um den **Build-Schritt**, der das Binary nicht
anfassen darf).

## Signatur (verbindlich – NICHT ändern)
```
package.json Skripte:
  "dev":   startet Vite-Devserver (Renderer, HMR) + Main-Prozess mit Auto-Neustart bei Main-Änderungen
  "build": baut Renderer (Vite) UND Main (separater TS-Build) für electron-builder (S7)
vite.config.ts:
  base: './'                       // relative Pfade für file://-Laden im gepackten Zustand
  build.outDir: 'dist/renderer'
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
  Bündelung erfolgt über electron-builder/asarUnpack (S6/S7), **nicht** über den JS-Bundler.
- „Nur der Main-Prozess berührt ffmpeg und Dateisystem" (TK 2) – der Main-Build darf daher kein
  Browser-Target (`lib: dom`) verwenden.

## Fehlerpfade (vollständig)
Entfällt – Build-Zeit-Issue.

## Nicht selbst entscheiden – STOPP und fragen
- Welches Tool den Main-Prozess im Dev-Modus neu startet (z. B. `tsx watch`, `nodemon`,
  `electron-vite`) – Optionen mit Trade-offs vorlegen statt eigenmächtig eine Dependency
  hinzuzufügen.
- Ob `ffmpeg-static` explizit in `vite.config.ts` UND in der Main-Build-Config als
  `external`/`noExternal`-Ausnahme eingetragen werden muss – abhängig vom gewählten
  Main-Bundler; im Zweifel nachfragen statt zu raten.

## Definition of Done
- [ ] Der Vite-Devserver startet eigenständig und ist unter der konfigurierten URL mit
      funktionierendem HMR erreichbar; das Watch-Tool erkennt Änderungen unter `src/main/**` und
      löst einen Neustart aus, sobald ein Main-Entry existiert. (Der Ende-zu-Ende-Nachweis
      „Fenster öffnet sich, Renderer lädt mit HMR" gehört zur Definition of Done von S3, weil dort
      der Main-Entry entsteht.)
- [ ] `npm run build` erzeugt lauffähige `dist/`-Ausgabe für S7
- [ ] `ffmpeg-static` erscheint nach `npm run build` unverändert (Binärgröße identisch zu
      `node_modules/ffmpeg-static`) – keine Bundler-Transformation
- [ ] Keine Datei außerhalb der genannten geändert

## Abhängigkeiten
- Blockiert von: S1
- Blockiert: S3, S6, S7, S10

## Bezug
TK 3, CLAUDE.md „Tech-Stack"

---

### Issue S3: [grundgeruest] Main-Bootstrap mit abgesicherter Fenster-Konfiguration erstellen

## Ziel (in einem Satz)
Die App startet einen einzigen `BrowserWindow` mit `contextIsolation`, `sandbox` und deaktivierter
`nodeIntegration`, sodass der Renderer strukturell keinen direkten Zugriff auf Node-APIs oder das
Dateisystem erhält.

## Modul & Datei
- Modul: Grundgerüst / Main-Bootstrap (Basis für `ipc-gateway`, M1)
- Datei: `src/main/index.ts`
- Vertrag: kein einzelner TK-Abschnitt; TK 2 „Nur der Main-Prozess berührt ffmpeg und
  Dateisystem", TK 9.5.4 (Einzel-Instanz, hier nur die Fenster-Seite)
- Prozess/Speicher: –

## Warum das im Gesamtsystem wichtig ist
Diese drei Sicherheitsflags sind die einzige technische Durchsetzung der Grenze „Renderer redet
nur über IPC mit dem Main". Mit `nodeIntegration: true` oder `contextIsolation: false` könnte
JavaScript im Renderer (z. B. durch eine kompromittierte Abhängigkeit oder einen Bug in
Aktions-Texten) direkt `require('fs')` aufrufen und `project.json` **am D1-Schreib-Lock vorbei**
verändern (TK 9.5) oder die Pfad-Autorität (TK 9.5.7) umgehen – genau die Invarianten, auf denen
Datenkonsistenz und Reparatur-Modus aufbauen, wären dann nur noch Konvention statt Garantie.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/main/index.ts
function erstelleHauptfenster(): BrowserWindow
// wird einmalig nach app.whenReady() aufgerufen
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | kein fachlicher Eingang | – |

Ausgang bei Erfolg: ein `BrowserWindow` mit
`webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true }`,
gesetztem CSP-Header und Preload-Pfad (Preload selbst: S4).
Ausgang bei Fehler: entfällt (Bootstrap-Code, kein IPC).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Nur der Main-Prozess berührt ffmpeg und Dateisystem." (TK 2)
- „Die drei Sicherheitsflags sind nicht verhandelbar, auch nicht ‚temporär zum Debuggen'."
  (Übergabe-Prompt 8b, Falle zu S3)
- CSP gesetzt (Übergabe-Prompt 8b, Tabelle S3).

## Fehlerpfade (vollständig)
Entfällt – Bootstrap-Code ohne IPC.

## Nicht selbst entscheiden – STOPP und fragen
- **Die drei Flags `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` dürfen
  unter keinem Umstand deaktiviert werden** – auch nicht befristet für einen einzelnen Debug-Lauf.
  Wer beim Debuggen versucht ist, sie „kurz" umzustellen: stoppen und den eigentlichen Fehler auf
  anderem Weg untersuchen (z. B. DevTools statt `nodeIntegration`).
- Konkreter Wortlaut der CSP (z. B. ob `media://` und `data:` explizit erlaubt werden müssen, wegen
  S9/TK 9.5.7) – nicht selbst festlegen, sondern zur Prüfung vorlegen: eine zu lockere CSP höhlt
  die Sicherheitsflags aus, eine zu strenge blockiert `media://`.
- Der Weg, auf dem der Main die Dev-Server-URL erfährt (fest verdrahteter String? Umgebungsvariable?
  eine Konvention des in S2 noch offenen Watch-Tools, z. B. `ELECTRON_RENDERER_URL` bei
  `electron-vite`) – hängt von der in S2 gewählten Watch-Lösung ab: nicht raten und keine URL fest
  verdrahten, sondern mit dem Ergebnis von S2 abgleichen bzw. vorab klären. Ein hart
  hineingeschriebenes `http://localhost:5173` wäre ein stiller Integrationsfehler, der erst beim
  ersten `npm run dev` auffällt.

## Definition of Done
- [ ] `webPreferences` enthält exakt `contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true`
- [ ] CSP-Header gesetzt (mindestens `default-src 'self'`)
- [ ] Fenster lädt die Vite-Dev-URL im Dev-Modus bzw. `dist/renderer/index.html` im Produktivbuild
- [ ] Ein manueller Test bestätigt: `window.require` ist im Renderer **nicht** definiert
- [ ] Keine Datei außerhalb von `src/main/index.ts` geändert

## Abhängigkeiten
- Blockiert von: S1, S2
- Blockiert: S4, S9, S10

## Bezug
TK 2, TK 9.5.4, Übergabe-Prompt Abschnitt 8b

---

### Issue S4: [grundgeruest] Preload-Bridge als einzige Renderer-Main-Fläche einrichten

## Ziel (in einem Satz)
Der Renderer erhält Zugriff auf Main-Funktionalität ausschließlich über eine per `contextBridge`
exponierte, typisierte API – kein rohes `ipcRenderer` ist im Renderer-Code erreichbar.

## Modul & Datei
- Modul: Grundgerüst / Preload (Basis für `ipc-client`, M1)
- Datei: `src/preload/index.ts`
- Vertrag: kein einzelner TK-Abschnitt; TK 9.1.1 (IPC-Konventionen gelten für den Vertrag, den
  diese Bridge später trägt – hier nur das Gerüst)
- Prozess/Speicher: –

## Warum das im Gesamtsystem wichtig ist
Diese Datei ist die **einzige** Stelle, an der Renderer- und Main-Welt sich berühren. Verschluckt
sie hier bereits die `Ergebnis<T>`-Hülle (z. B. indem sie `wert` auspackt und im Fehlerfall
wirft), ist das an dieser einen Stelle passiert, wirkt sich aber auf **jede** spätere
IPC-Operation aus M1–M7 aus: Der `Fehlercode` (TK 9.1.1) ginge verloren, und Reparatur-Modus,
Wiederholen (FA-17) und der FAT32-Hinweis (TK 9.6.4) würden alle zu einem undifferenzierten
„irgendwas ist schiefgelaufen" degradieren.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/preload/index.ts
contextBridge.exposeInMainWorld('api', {
  invoke: (kanal: string, nutzlast?: unknown) => Promise<unknown>,  // reicht Ergebnis<T> UNVERÄNDERT durch
  on: (ereignis: string, handler: (daten: unknown) => void) => () => void,  // liefert Unsubscribe-Funktion
})
```
Die **fachlichen** Kanalnamen und Typen kommen erst mit `ipc-client` (M1) – hier wird nur der
generische, typlose Transportmechanismus gebaut.

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `kanal` | Name des IPC-Kanals | MUSS später aus der Kanal-Namens-Registry (M1) stammen – hier noch keine Prüfung, Registry existiert noch nicht |
| `nutzlast` | beliebige, serialisierbare Daten | wird unverändert an `ipcRenderer.invoke` weitergereicht |

Ausgang bei Erfolg: das rohe Ergebnis von `ipcRenderer.invoke(kanal, nutzlast)` – **unverändert**,
keine Transformation.
Ausgang bei Fehler: entfällt hier – Fehlerbehandlung ist Sache des Gateways (M1), nicht der Bridge.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Das Preload darf die Hülle NICHT ‚vereinfachen'. Verboten: den `wert` auspacken und im
  Fehlerfall werfen." (Übergabe-Prompt 8b, Falle zu S4)
- „kein rohes `ipcRenderer` im Renderer" (Übergabe-Prompt 8b, Tabelle S4)
- „Ereignisse sind Einbahnstraßen und tragen keine Hülle und keinen Endzustand." (TK 9.1.1,
  Punkt 5) – die `on`-Funktion reicht Ereignis-Daten daher ebenfalls unverändert durch.

## Fehlerpfade (vollständig)
Entfällt – reiner Transport ohne eigene Fehlerlogik.

## Nicht selbst entscheiden – STOPP und fragen
- **Keine Vereinfachung der Rückgabe.** Auch wenn es „aufgeräumter" aussähe, `{ok:true,wert}` zu
  `wert` zu reduzieren: nicht tun.
- Falls unklar ist, ob an dieser generischen Stelle bereits typisiert werden kann (die konkreten
  `Ergebnis<T>`-Typen kommen aus S12 bzw. M1) – lieber `unknown` durchreichen und in `ipc-client`
  (M1) typisieren, statt hier zu raten.
- Ob `invoke`/`on` weitere Hilfsfunktionen brauchen (z. B. `off`) – falls unklar, nachfragen statt
  spekulativ zu erweitern.

## Definition of Done
- [ ] `window.api` ist im Renderer verfügbar, `window.require`/`window.ipcRenderer` sind es
      **nicht**
- [ ] `invoke` reicht die Rückgabe von `ipcRenderer.invoke` byte-identisch durch (Test:
      Main-seitiger Test-Handler gibt festes Objekt zurück, Renderer empfängt es exakt)
- [ ] Kein `try/catch`, das Fehler im Preload in eine andere Form bringt
- [ ] Keine Datei außerhalb von `src/preload/index.ts` geändert

## Abhängigkeiten
- Blockiert von: S3
- Blockiert: S10, M1-Issue „ipc-client"

## Bezug
TK 9.1.1, Übergabe-Prompt Abschnitt 8b

---

### Issue S5: [grundgeruest] Datenort der portablen App ermitteln

## Ziel (in einem Satz)
Eine einzige Funktion liefert den absoluten Pfad zum App-Datenordner (`projects/`, `config.json`,
`vorlagen.json`, `protokoll.json`, `warteschlangen-journal.json`), identisch im Dev-Modus und in
der gepackten portablen EXE.

## Modul & Datei
- Modul: Grundgerüst / Main (Basis für `project-store`, `config-store`, `vorlagen-store`,
  `auftrags-manager`)
- Datei: `src/main/datenort.ts`
- Vertrag: kein einzelner TK-Abschnitt; TK 6 „Speicher- und Ordnerkonventionen", TK 9.5.4
  (Einzel-Instanz „an den DATENORT gebunden")
- Prozess/Speicher: Grundlage für D1, D2, D3, Q2, Q3, Q4, V1

## Warum das im Gesamtsystem wichtig ist
Jeder persistente Speicher der Anwendung hängt von diesem einen Pfad ab. Wählt diese Funktion für
Dev und für den gepackten Build unterschiedliche Orte, „verliert" der Nutzer beim ersten echten
Test scheinbar alle Projekte. Die Wahl zwischen „neben der portablen EXE" (mitnehmbar auf dem
USB-Stick, aber evtl. schreibgeschützt) und `userData` (immer schreibbar, aber nicht mitwanderbar)
ist eine Produktentscheidung mit echten Nutzungs-Konsequenzen für das Studio-Personal – **keine**
Implementierungsdetail-Frage. An denselben Ort wird zudem die Einzel-Instanz-Sperre gebunden
(TK 9.5.4): „Die Sperre muss an den DATENORT gebunden sein, nicht an den Programmpfad." Zwei
Kopien der portablen EXE, die auf dieselben Daten zeigen, müssten sich sonst gegenseitig sehen
können.

## Signatur (verbindlich – NICHT ändern)
```ts
export function ermittleDatenOrt(): string
// absoluter Pfad zum Ordner, der projects/, config.json, vorlagen.json,
// protokoll.json, warteschlangen-journal.json enthält bzw. enthalten wird
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `process.resourcesPath` / `app.getPath(...)` / `process.execPath` (je nach Entscheidung) | Laufzeit-Kontext (Dev vs. gepackt) | muss über App-Neustarts hinweg denselben, stabilen Ordner liefern; unter Windows-Portable sind `process.execPath`/`process.resourcesPath` dafür **ungeeignet** (siehe Invarianten) – dort `PORTABLE_EXECUTABLE_DIR` verwenden |

Ausgang bei Erfolg: absoluter Ordnerpfad; die Funktion legt den Ordner **nicht selbst an** (Sache
der jeweiligen Store-Module beim ersten Schreiben).
Ausgang bei Fehler: entfällt – reine Pfad-Berechnung ohne I/O.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Wichtig für die portable Auslieferung:** Die Sperre muss an den **Datenort** gebunden sein
  (den App-Ordner mit `projects/`), nicht an den Programmpfad. Sonst könnten zwei Kopien der
  portablen EXE, die auf **dieselben** Daten zeigen, beide starten." (TK 9.5.4)
- „Verpackung `electron-builder` Portable-Target" (TK 3) – kein Installer, der einen
  `userData`-Pfad „garantiert" registrieren würde.
- **KRITISCH – Windows-Portable-Falle:** Das Windows-„Portable"-Target von `electron-builder` ist
  NSIS-basiert und **entpackt die Anwendung bei jedem Start** in ein temporäres Verzeichnis.
  `process.execPath` und `process.resourcesPath` zeigen dann in dieses **flüchtige
  Temp-Verzeichnis** – **nicht** dorthin, wo der Nutzer die portable EXE abgelegt hat (z. B.
  USB-Stick). Fällt die Entscheidung auf „neben der ausführbaren Datei", dürfen daher **weder**
  `process.execPath` **noch** `process.resourcesPath` als Datenort-Basis dienen; zu verwenden ist
  die von `electron-builder` für genau diesen Zweck bereitgestellte Umgebungsvariable
  **`PORTABLE_EXECUTABLE_DIR`** (daneben `PORTABLE_EXECUTABLE_FILE`).

## Fehlerpfade (vollständig)
Entfällt – reine Pfad-Berechnung, kein I/O.

## Nicht selbst entscheiden – STOPP und fragen
- **Ob der Datenort neben der portablen EXE oder in `app.getPath('userData')` liegt**
  (Übergabe-Prompt 8b, Falle zu S5) – Produktentscheidung (Mitnehmbarkeit vs. garantierte
  Schreibbarkeit), keine Implementierungsdetail-Frage. **Nicht selbst wählen – fragen.**
- Falls „neben der EXE": Umgang mit schreibgeschütztem Installationsort (USB-Stick mit
  Schreibschutz, `Program Files` ohne Admin-Rechte) – Fallback-Verhalten nicht selbst erfinden.

## Definition of Done
- [ ] `ermittleDatenOrt()` liefert im Dev-Modus einen stabilen, reproduzierbaren Pfad
- [ ] `ermittleDatenOrt()` liefert im gepackten Portable-Build einen stabilen, reproduzierbaren
      Pfad gemäß der geklärten Entscheidung
- [ ] Ein Unit-Test mit gemocktem `app`/`process` deckt beide Fälle ab
- [ ] Echter Portable-Build-Test (ein gemockter Unit-Test deckt diesen Fall **nicht** ab): EXE
      bauen, an einen anderen Ort verschieben (idealerweise Wechseldatenträger), starten, Daten
      anlegen, neu starten – die Daten müssen wieder auftauchen
- [ ] Keine Datei außerhalb von `src/main/datenort.ts` (+ Test) geändert

## Abhängigkeiten
- Blockiert von: S1
- Blockiert: S9, M1-Issues project-store/config-store, M2 (Q2–Q4), M4 (vorlagen-store)

## Bezug
TK 6, TK 9.5.4

---

### Issue S6: [grundgeruest] ffmpeg bündeln und Pfad im gepackten Zustand auflösen

## Ziel (in einem Satz)
Eine Funktion liefert den ausführbaren Pfad zum gebündelten ffmpeg-Binary zuverlässig in Dev- und
gepacktem Zustand (inkl. asar-Entpackung), und ein Selbsttest beim App-Start bestätigt, dass
ffmpeg aufrufbar ist.

## Modul & Datei
- Modul: Grundgerüst / Main (Basis für `ffmpeg-adapter`, M6)
- Datei: `src/main/ffmpeg-pfad.ts`, Ergänzung in `electron-builder`-Konfiguration (`asarUnpack`)
- Vertrag: kein einzelner TK-Abschnitt; TK 3 „gebündeltes ffmpeg (ffmpeg-static + fluent-ffmpeg)"
- Prozess/Speicher: Grundlage für P4 (render-service, ffmpeg-adapter)

## Warum das im Gesamtsystem wichtig ist
Standardmäßig landet das ffmpeg-Binary innerhalb von `app.asar` und ist dort **nicht ausführbar**
(asar ist ein Archiv, kein Dateisystem, aus dem ein Kindprozess direkt gestartet werden kann). Es
muss per `asarUnpack` ausgepackt und über `app.asar.unpacked` aufgelöst werden. Auf macOS kommen
zusätzlich Ausführbar-Bit und Gatekeeper-Quarantäne hinzu. Ohne den hier geforderten
Start-Selbsttest fällt ein falsch aufgelöster Pfad **nicht** beim App-Start auf, sondern erst beim
ersten echten Render-Versuch – im schlimmsten Fall beim Kunden im Studio. Das macht diesen
Fehlgriff zu einem der teuersten im ganzen Projekt.

## Signatur (verbindlich – NICHT ändern)
```ts
export function ermittleFfmpegPfad(): string
// absoluter Pfad zum ausführbaren ffmpeg-Binary (Dev: node_modules/ffmpeg-static;
// gepackt: app.asar.unpacked-Pfad)

export async function pruefeFfmpegVerfuegbar(pfad: string): Promise<boolean>
// führt `<pfad> -version` aus, true bei Exit-Code 0 und erkennbarer Versionsausgabe;
// wird beim App-Start (S3-Bootstrap) aufgerufen, Fehlschlag ist ein sichtbarer Start-Fehler,
// kein stiller Fallback
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `app.isPackaged` | unterscheidet Dev vs. gepackt | – |
| `process.resourcesPath` | Basis für den gepackten Pfad | nur im gepackten Fall relevant |

Ausgang bei Erfolg: `ermittleFfmpegPfad()` liefert einen Pfad, unter dem `pruefeFfmpegVerfuegbar`
`true` liefert.
Ausgang bei Fehler: `pruefeFfmpegVerfuegbar` liefert `false` → App-Start zeigt einen **sichtbaren**
Fehlerdialog statt stumm weiterzulaufen und erst beim ersten Render zu scheitern.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „gebündeltes ffmpeg (`ffmpeg-static` + `fluent-ffmpeg`)" (TK 3, CLAUDE.md)
- „**asar-Falle.** Standardmäßig landet das ffmpeg-Binary innerhalb von `app.asar` und ist dort
  nicht ausführbar. Es muss per `asarUnpack` ausgepackt und über `app.asar.unpacked` aufgelöst
  werden. Auf macOS zusätzlich Ausführbar-Bit und Quarantäne beachten." (Übergabe-Prompt 8b,
  Falle zu S6)
- „**Ohne** den Start-Selbsttest merkt man das erst beim ersten echten Render – beim Kunden."
  (Übergabe-Prompt 8b, Falle zu S6)
- **Prozessstart des Selbsttests (verbindlich):** Der Selbsttest MUSS den Prozess über `execFile`
  bzw. `spawn` mit den Argumenten als **Array** starten (Binary-Pfad als Programm, `['-version']`
  als Argumente) – **niemals** über eine Shell mit zusammengesetztem String (z. B.
  ``exec(`${pfad} -version`)``). Grund: Pfade mit Leerzeichen (z. B. unter
  `C:\Program Files\…` oder bei Benutzerprofilen mit Leerzeichen im Namen) brechen bei
  String-Konkatenation über eine Shell; der Selbsttest, der ein kaputtes ffmpeg früh finden soll,
  würde dann selbst falsch-negativ melden oder bei unsauberer Quotierung ein falsches Binary
  ausführen.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| Binary am ermittelten Pfad nicht vorhanden | – (kein IPC-Fehlercode; Start-Zeit-Prüfung) | sichtbarer Start-Fehlerdialog, App startet nicht in einen scheinbar funktionsfähigen Zustand |
| `ffmpeg -version` liefert Exit-Code ≠ 0 (z. B. fehlendes Ausführbar-Bit auf macOS) | – | derselbe sichtbare Start-Fehlerdialog |

## Nicht selbst entscheiden – STOPP und fragen
- Ob bei fehlgeschlagenem Selbsttest die App den Start komplett verweigert oder nur warnt und im
  „render-service deaktiviert"-Zustand weiterläuft – legitime Produktentscheidung, nicht selbst
  festlegen.
- macOS-Signierung/Notarisierung ist **nicht geplant** – falls Ausführbar-Bit oder Gatekeeper
  Probleme bereiten, keine eigenmächtigen Workarounds (z. B. Ad-hoc-Signierung), sondern melden.

## Definition of Done
- [ ] `ermittleFfmpegPfad()` liefert im Dev-Modus einen funktionierenden Pfad
- [ ] Nach `npm run build` + ungepacktem Test-Build liefert dieselbe Funktion einen funktionierenden
      Pfad aus `app.asar.unpacked`
- [ ] `pruefeFfmpegVerfuegbar` wird beim App-Start aufgerufen; ein manuell simulierter Fehlschlag
      zeigt den Fehlerdialog statt stillzuscheitern
- [ ] `electron-builder`-Konfiguration enthält den nötigen `asarUnpack`-Eintrag für `ffmpeg-static`
- [ ] Ein Testfall bestätigt, dass ein ffmpeg-Pfad mit Leerzeichen (z. B. in einem
      Verzeichnisnamen) korrekt behandelt wird (kein String-Shell-Aufruf)
- [ ] Keine Datei außerhalb der genannten geändert

## Abhängigkeiten
- Blockiert von: S1, S2
- Blockiert: S7, M6-Issues (ffmpeg-adapter)

## Bezug
TK 3, Übergabe-Prompt Abschnitt 8b

---

### Issue S7: [grundgeruest] Portable-Verpackung mit electron-builder einrichten

## Ziel (in einem Satz)
`npm run dist` erzeugt eine einzelne, ausführbare Portable-Datei für Windows und eine für macOS,
ohne Installer und ohne Admin-Rechte, die Logo, Marken-Schriften und ffmpeg korrekt enthält.

## Modul & Datei
- Modul: Grundgerüst / Verpackung
- Datei: `electron-builder.yml` (oder `build`-Feld in `package.json`)
- Vertrag: kein einzelner TK-Abschnitt; TK 3 „Verpackung: `electron-builder`, Portable-Target"
- Prozess/Speicher: –

## Warum das im Gesamtsystem wichtig ist
Die gesamte Produktentscheidung „ein dummer TV-Player + ein Desktop-Tool" (Anforderungsdokument 3)
setzt voraus, dass das Tool **ohne Installation und ohne Admin-Rechte** auf einem beliebigen
Studio-Laptop läuft (NFA-08). Eine falsch konfigurierte Verpackung – ein versehentlicher
Installer, fehlende Font-Dateien oder ein falsch gepacktes ffmpeg (S6) – fällt nicht im
Dev-Betrieb auf, sondern erst beim Test auf einem „sauberen" Rechner ohne Entwicklungsumgebung.

## Signatur (verbindlich – NICHT ändern)
```
electron-builder.yml (Auszug, verbindliche Felder):
  win:
    target: portable
  mac:
    # Zielformat NICHT entschieden (siehe "Nicht selbst entscheiden") – entschieden ist nur:
    # KEIN dmg, KEIN pkg, kein Installer, keine Admin-Rechte
  asarUnpack:
    - '**/ffmpeg-static/**'  # aus S6
  # extraResources: aktuell kein Bedarf. Marken-Schriften und Logo (aus S8) sind normale
  # Renderer-Bundle-Assets (über `files`, im asar) und laufen NICHT über extraResources; das
  # einzige Binary (ffmpeg) wird bereits über asarUnpack behandelt (siehe oben, aus S6).
```

Hinweis zur Font-/Logo-Verpackung: Der Renderer kann wegen der Sicherheitsflags
(`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`) nicht auf
`process.resourcesPath` zugreifen, und `@font-face`/Bild-URLs lösen relativ zum Renderer-Bundle
auf – Schriften und Logo müssen daher als Renderer-Bundle-Assets vorliegen, nicht als
`extraResources` (die nur über `process.resourcesPath` im Main-Prozess erreichbar wären).

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| Build-Ausgabe aus S2 (`dist/renderer`, `dist/main`) | zu verpackender Code | muss vorher fehlerfrei durchgelaufen sein |
| ffmpeg-Bündelung aus S6 | asarUnpack-Konfiguration | muss übernommen, nicht neu erfunden werden |
| Marken-Schriften aus S8 | zu bündelnde Font-Dateien | müssen als normale Renderer-Bundle-Assets (über `files`, im asar) enthalten sein |

Ausgang bei Erfolg: eine `.exe` (Windows, portable, kein Installer-Wizard) und ein macOS-Bundle
(kein `.pkg`/`.dmg` mit Admin-Installationsschritt), beide startbar ohne Admin-Rechte, mit
funktionierendem ffmpeg-Selbsttest (S6) und geladenen Marken-Schriften (S8).
Ausgang bei Fehler: entfällt (Build-Zeit).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Verpackung `electron-builder`, Portable-Target" (TK 3)
- „Verpackung electron-builder Portable (Win 10/11 + macOS 13+, kein Installer, ohne Admin)"
  (CLAUDE.md)

## Fehlerpfade (vollständig)
Entfällt – Build-Zeit-Issue.

## Nicht selbst entscheiden – STOPP und fragen
- **Signierung/Notarisierung ist nicht geplant.** Wenn der Build sie zu verlangen scheint:
  fragen, nicht auf eigene Faust Zertifikate oder Workarounds einbauen (Übergabe-Prompt 8b, Falle
  zu S7).
- Ob für macOS `dir` (Ordner, manuell zippen) oder `zip` als Zielformat gewählt wird.

## Definition of Done
- [ ] `npm run dist` erzeugt eine Windows-Portable-EXE ohne Installer-Dialog
- [ ] `npm run dist` erzeugt ein macOS-Artefakt ohne `.pkg`/Admin-Installationsschritt
- [ ] Beide Artefakte enthalten ffmpeg lauffähig (S6-Selbsttest besteht) und die Marken-Schriften
      (S8)
- [ ] Start auf einer Maschine ohne installiertes Node/Electron funktioniert (manueller Test)
- [ ] Keine Datei außerhalb der genannten geändert

## Abhängigkeiten
- Blockiert von: S1, S2, S6, S8
- Blockiert: – (Ende der Verpackungskette)

## Bezug
TK 3, Anforderungsdokument NFA-08

---

### Issue S8: [grundgeruest] Marken-Schriften bündeln und laden

## Ziel (in einem Satz)
Die drei Marken-Schriften (Playfair Display, Archivo Black, Arimo) liegen als Font-Dateien im
Projekt, werden im Renderer per `@font-face` registriert und sind zuverlässig geladen, bevor
irgendein Canvas-Text gezeichnet wird.

## Modul & Datei
- Modul: Grundgerüst / Marken-Assets (Basis für `template-canvas`, M4)
- Datei: `src/renderer/assets/fonts/`, `src/renderer/styles/fonts.css`
- Vertrag: kein einzelner TK-Abschnitt; TK 9.10.4 „Marken-Schriften werden mitgeliefert"
- Prozess/Speicher: Grundlage für `template-canvas` (P2, P4, P5, P7)

## Warum das im Gesamtsystem wichtig ist
Playfair Display ist auf Windows und macOS **nicht vorinstalliert**. Fehlt die gebündelte Datei
oder wird sie nicht rechtzeitig geladen, fällt der Canvas **still** auf eine Systemschrift zurück
– das Ergebnis „funktioniert" augenscheinlich, aber Vorschau und gerenderte `loop.mp4` weichen
**sichtbar** voneinander ab, und das Corporate Design (FA-11) ist gebrochen, ohne dass je eine
Fehlermeldung erscheint. Genau diese Fehlerklasse – kein Absturz, nur falsches Aussehen – soll die
Planung durchgängig vermeiden.

## Signatur (verbindlich – NICHT ändern)
```
src/renderer/assets/fonts/
  PlayfairDisplay-Bold.woff2       // Rolle headlineElegant, 700
  ArchivoBlack-Regular.woff2       // Rolle headlinePlakativ, 900
  Arimo-Regular.woff2              // Rolle fliesstext, 400
  Arimo-Bold.woff2                 // Rolle fliesstextFett, 700

export async function ladeMarkenSchriften(): Promise<void>
// erzeugt für jede der vier Schriften ein FontFace-Objekt, ruft FontFace.load() explizit auf,
// registriert die geladenen Faces via document.fonts.add() und wartet mit Promise.all auf
// alle vier Load-Promises
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | kein fachlicher Eingang | – |

Ausgang bei Erfolg: `ladeMarkenSchriften()` resolved erst, wenn alle vier Schriften nachweislich
einsatzbereit sind (nicht nur „Request gestartet").
Ausgang bei Fehler: Ladefehler (z. B. Datei fehlt im Bundle) wirft eine Exception, die den
App-Start sichtbar abbrechen lässt – **kein** stiller Fallback auf eine Systemschrift.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden
  daher als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor
  gezeichnet wird. Andernfalls rendert der Canvas still auf eine Fallback-Schrift → Vorschau ≠
  Endvideo **und** Markenbruch." (TK 9.10.4)
- „**Schrift-Rollen (v1, fest) – alle Dateien werden mitgeliefert (9.10.4):** `headlineElegant` =
  Playfair Display 700 · `headlinePlakativ` = Archivo Black 900 · `fliesstext`/`fliesstextFett` =
  Arimo 400/700." (TK 9.11.2)
- „Nie System-Schriften verwenden." (Übergabe-Prompt 8b, Falle zu S8)
- Begründung (kein Zitat, Entscheidung dieses Issues, verbindlich): Canvas-2D-Text fordert Schriften
  nicht automatisch an – anders als DOM-Text gibt es keinen Layout-Vorgang, der das Laden auslöst.
  Ohne expliziten `FontFace.load()`-Aufruf wird das Laden also womöglich nie angestoßen.
  `document.fonts.ready` garantiert nur, dass bereits angestoßene Ladevorgänge abgeschlossen sind,
  und kann deshalb **zu früh** auflösen, wenn kein Laden angestoßen wurde. Deshalb ist ausschließlich
  der Weg aus der Signatur zulässig: `FontFace.load()` explizit pro Schrift, Registrierung via
  `document.fonts.add()`, Warten auf alle vier Promises mit `Promise.all`.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| Font-Datei im Bundle fehlt | – (Start-Fehler, kein IPC-Fehlercode) | `ladeMarkenSchriften()` wirft, App-Start bricht sichtbar ab |
| `document.fonts.ready` löst nicht innerhalb angemessener Frist auf | – | wird zur Klärung vorgelegt (s. „Nicht selbst entscheiden") |

## Nicht selbst entscheiden – STOPP und fragen
- Ob ein Timeout für das Laden eingebaut wird (und wie lange) – falls `document.fonts.ready` in
  seltenen Fällen nie auflöst, ist unklar, ob die App ewig wartet oder abbricht; keine Zahl
  erfinden.
- Lizenz-Dateiformat: `.woff2` allein oder zusätzlich `.ttf`/`.otf` als Fallback – falls unklar, ob
  `template-canvas` (Canvas 2D) mit `.woff2` in allen Zielumgebungen zuverlässig arbeitet,
  nachfragen statt zu spekulieren.

## Definition of Done
- [ ] Alle vier Font-Dateien liegen im Projekt und sind OFL-lizenziert (keine `Arial
      Black`/`Avenir`-Dateien)
- [ ] `ladeMarkenSchriften()` resolved nachweislich erst nach vollständigem Laden (Test:
      Canvas-Textbreite vor/nach dem Await unterscheidet sich messbar)
- [ ] Nachgewiesen wird, dass nach dem Auflösen von `ladeMarkenSchriften()` alle vier Familien
      tatsächlich verfügbar sind (z. B. über `document.fonts.check()` mit der jeweiligen Familie)
      – nicht nur, dass ein Promise aufgelöst hat
- [ ] Ein manueller Test ohne Internetverbindung und ohne systemseitig installierte Playfair
      Display bestätigt korrekte Darstellung
- [ ] Keine Datei außerhalb der genannten geändert

## Abhängigkeiten
- Blockiert von: S1
- Blockiert: S7, M4-Issues (template-canvas)

## Bezug
TK 9.10.4, TK 9.11.2, Anforderungsdokument 4.2

---

### Issue S9: [grundgeruest] media://-Protokoll als Hülse registrieren

## Ziel (in einem Satz)
Das privilegierte Custom-Protokoll `media://` ist vor dem Laden des Fensters registriert, sodass
spätere `media://<projektId>/<dateiname>`-URLs im Renderer grundsätzlich funktionieren können –
die eigentliche Pfadauflösung bleibt bewusst ein Stub.

## Modul & Datei
- Modul: Grundgerüst / Main (Basis für `project-store`s Pfad-Autorität, M1)
- Datei: `src/main/media-protokoll.ts`
- Vertrag: kein einzelner TK-Abschnitt; TK 9.5.7 „Pfad-Autorität & media://-Protokoll" (nur die
  Registrierung, **nicht** die Auflösung)
- Prozess/Speicher: Vorstufe zu D2/D1

## Warum das im Gesamtsystem wichtig ist
Custom-Protokolle müssen in Electron **vor** `app.ready` bzw. vor dem Laden des ersten Fensters als
privilegiertes Schema registriert werden; geschieht das zu spät, greifen sie im Renderer nicht
zuverlässig. Dieses Issue baut **nur** die Registrierung – die eigentliche Auflösung
`(projektId, dateiname) → absoluter Pfad` gehört laut Vertrag ausschließlich dem `project-store`
(TK 9.5.7), der als einzige Pfad-Autorität feststeht. Würde diese Auflösung hier mit
implementiert, entstünde eine **zweite** Pfad-Autorität – genau das, was die Planung ausdrücklich
ausschließt.

## Signatur (verbindlich – NICHT ändern)
```ts
// aufgerufen VOR app.whenReady() bzw. vor protocol.handle-Registrierung
export function registriereMediaProtokollSchema(): void
// protocol.registerSchemesAsPrivileged([{ scheme: 'media', privileges: { secure: true, supportFetchAPI: true, stream: true, standard: true } }])

// aufgerufen NACH app.whenReady(), VOR dem Laden des Hauptfensters
export function registriereMediaProtokollHandlerStub(): void
// protocol.handle('media', ...) → liefert aktuell IMMER einen definierten Leer-/Fehlerzustand;
// echte Auflösung folgt in M1 (project-store)
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | kein fachlicher Eingang in diesem Issue | – |

Ausgang bei Erfolg: Ein `<img src="media://test/x.png">` im Renderer löst den registrierten
Handler aus (auch wenn er aktuell nur einen definierten Leerzustand liefert) – das beweist, dass
das Schema korrekt registriert ist.
Ausgang bei Fehler: entfällt (Registrierung, kein Laufzeit-Fehlercode).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`project-store` ist die eine Pfad-Autorität. […] Jeder Main-Dienst, der eine Mediendatei
  anfassen muss, resolved den Pfad über den `project-store`, statt das Layout selbst zu kennen."
  (TK 9.5.7) – **hier** wird nichts aufgelöst, nur registriert.
- „Hier entsteht KEINE Pfadauflösung. Die gehört dem `project-store` (9.5.7, M1). Wer sie ins
  Protokoll-Handler schreibt, erzeugt eine **zweite** Pfad-Autorität – genau das, was die Planung
  ausschließt." (Übergabe-Prompt 8b, Falle zu S9)
- „Protokolle **vor** `app.ready`/Fensterladen registrieren, sonst greifen sie nicht."
  (Übergabe-Prompt 8b, Falle zu S9)

## Fehlerpfade (vollständig)
Entfällt – Registrierungscode ohne Fachlogik.

## Nicht selbst entscheiden – STOPP und fragen
- **Keine Pfadauflösung hier einbauen** – auch nicht „nur testweise". Der Stub liefert immer einen
  definierten Leer-/Fehlerzustand; die echte Logik kommt ausschließlich über das M1-Issue
  „project-store: media://-Handler".
- Ob der Stub einen 404 oder eine leere Antwort liefert – falls das für spätere Tests einen
  Unterschied macht, zur Entscheidung vorlegen statt selbst zu wählen.

## Definition of Done
- [ ] `protocol.registerSchemesAsPrivileged` läuft nachweislich vor `app.whenReady()`
- [ ] `protocol.handle('media', …)` ist registriert, bevor das Hauptfenster lädt
- [ ] Ein Test-Request `media://irgendwas` im Renderer erreicht den Handler (per Log/Debugger
      nachgewiesen), auch wenn die Antwort ein definierter Leerzustand ist
- [ ] Die Datei enthält **keine** Pfadauflösungs-Logik (kein `path.join`, kein Zugriff auf ein
      Projektverzeichnis)
- [ ] Keine Datei außerhalb von `src/main/media-protokoll.ts` geändert

## Abhängigkeiten
- Blockiert von: S3
- Blockiert: S10, M1-Issue „project-store: media://-Handler" (ersetzt diesen Stub)

## Bezug
TK 9.5.7, Übergabe-Prompt Abschnitt 8b

---

### Issue S10: [grundgeruest] Leeres React-Shell-Skelett mit vier Reitern anlegen

## Ziel (in einem Satz)
Die App zeigt vier klickbare, leere Reiter (Zusammenstellen, Aktionen, Vorlagen, Projekte) sowie
eine leere Platzhalter-Leiste für die Warteschlange – ohne jede Fachlogik.

## Modul & Datei
- Modul: Grundgerüst / Renderer (Vorstufe zu `app-shell`, M7)
- Datei: `src/renderer/App.tsx`, `src/renderer/shell/`
- Vertrag: kein einzelner TK-Abschnitt; TK 9.14.1 „Grundstruktur" (nur das Layout-Skelett, **nicht**
  die dort beschriebenen Invarianten)
- Prozess/Speicher: –

## Warum das im Gesamtsystem wichtig ist
Alle Renderer-Module aus M4–M7 (`composer`, `action-editor`, `vorlagen-editor`, `preview-player`,
`queue-panel`) brauchen einen Ort, an dem sie eingehängt werden. Dieses Issue liefert nur die
**Anordnung**, damit spätere Module nicht zusätzlich noch die Navigation neu erfinden müssen. Die
fachlichen Invarianten der `app-shell` (Reparatur-Modus-Reiterwechsel, „Warteschlangen-Leiste nie
verstecken", Undo/Redo je Reiter getrennt) gehören ausdrücklich **nicht** hierher, sondern zu M7
(TK 9.14.2) – sonst kollidieren zwei Issues auf derselben Datei.

## Signatur (verbindlich – NICHT ändern)
```tsx
// src/renderer/App.tsx
type ReiterId = 'zusammenstellen' | 'aktionen' | 'vorlagen' | 'projekte'
function App(): JSX.Element
// zeigt eine Reiter-Leiste (vier ReiterId-Werte) + Inhalt des aktiven Reiters
// (aktuell: leere Platzhalter-Komponenten) + eine leere Leisten-Zeile am unteren Rand
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| Nutzer-Klick auf einen Reiter | Reiterwechsel | rein clientseitiger State, kein IPC |

Ausgang bei Erfolg: Klick auf einen Reiter zeigt dessen (noch leere) Platzhalter-Fläche; die
untere Leiste bleibt bei jedem Reiterwechsel sichtbar.
Ausgang bei Fehler: entfällt (keine Fachlogik, kein IPC in diesem Issue).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- Reiter (Modus-Wahl): [Zusammenstellen] [Aktionen] [Vorlagen] [Projekte] (Aufzählung, kein
  wörtliches Zitat). „Der gewählte Reiter nutzt die ganze Fläche:" (TK 9.14.1)
- „**Nur Struktur, kein Verhalten.** Die Invarianten von `app-shell` (Reparatur-Modus über
  Reiterwechsel hinweg sichtbar, Reiterwechsel verwirft nie Arbeit, Warteschlangen-Leiste in jedem
  Reiter – TK 9.14.2) sind **M7**. Hier nur leere Rahmen." (Übergabe-Prompt 8b, Falle zu S10)

## Fehlerpfade (vollständig)
Entfällt.

## Nicht selbst entscheiden – STOPP und fragen
- **Keine Fachlogik vorwegnehmen.** Auch wenn es naheliegt, hier schon eine
  Warteschlangen-Anbindung oder Reiterwechsel-Sperren einzubauen – das gehört zu M7-Issues und
  würde dort zu Konflikten auf derselben Datei führen. Bei Unsicherheit, ob etwas „nur Struktur"
  oder schon „Verhalten" ist: nachfragen.

## Definition of Done
- [ ] Vier Reiter sind sichtbar und klickbar, zeigen je einen leeren Platzhalter
- [ ] Eine leere Leisten-Zeile mit fester Höhe und einem stabilen `data-testid` (kein
      Platzhaltertext) ist in allen vier Reitern vorhanden und darüber prüfbar
- [ ] Keine IPC-Aufrufe, kein `ipc-client`-Import in diesem Code
- [ ] Keine Datei außerhalb der genannten geändert

## Abhängigkeiten
- Blockiert von: S1 (Ordnerstruktur), S2 (Renderer-Build, damit React-Code überhaupt kompiliert
  und geladen wird)
- Blockiert: M7-Issue „app-shell: Reiter-Navigation", M5/M6-Issues, die ihre UI in die Reiter
  einhängen

## Bezug
TK 9.14.1, Übergabe-Prompt Abschnitt 8b

---

### Issue S11: [grundgeruest] Test-Setup mit Vitest und getrenntem Integrationstest-Ordner einrichten

## Ziel (in einem Satz)
`npm test` führt schnelle Unit-Tests aus; langsame ffmpeg-Integrationstests liegen in einem
eigenen, standardmäßig **nicht** mitlaufenden Ordner, und ein Rauch-Test bestätigt, dass die
Test-Infrastruktur selbst funktioniert.

## Modul & Datei
- Modul: Grundgerüst / Test-Tooling
- Datei: `vitest.config.ts`, `vitest.integration.config.ts`, `tests/unit/`, `tests/integration/`, `tests/unit/rauchtest.spec.ts`
- Vertrag: kein einzelner TK-Abschnitt; Ableitung aus dem Gesamtprojekt
- Prozess/Speicher: –

## Warum das im Gesamtsystem wichtig ist
Fast jedes spätere Issue (M1–M7) verlangt in seiner Definition of Done Unit-Tests, einige davon
(render-service, ffmpeg-adapter) zusätzlich echte ffmpeg-Läufe. Liefen beide Arten im selben,
ungetrennten Lauf, würde `npm test` bei jedem Commit mehrere Minuten dauern (echte
Videoverarbeitung) – das verleitet dazu, Tests zu überspringen. Die Trennung ist daher keine
Kosmetik, sondern eine Voraussetzung dafür, dass die in jedem Fach-Issue geforderten Tests auch
tatsächlich regelmäßig laufen.

## Signatur (verbindlich – NICHT ändern)
```
vitest.config.ts:
  test.include: ['tests/unit/**/*.spec.ts']     // Standard-Lauf, schnell

vitest.integration.config.ts:
  test.include: ['tests/integration/**/*.spec.ts']   // eigene Config, nur explizit gestartet

package.json Skripte:
  "test":              vitest run tests/unit
  "test:integration":  vitest run --config vitest.integration.config.ts   // NICHT Teil von "test"
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | kein fachlicher Eingang | – |

Ausgang bei Erfolg: `npm test` läuft in wenigen Sekunden durch (nur `tests/unit`), enthält den
Rauch-Test; `npm run test:integration` ist separat aufrufbar für ffmpeg-lastige Tests.
Ausgang bei Fehler: entfällt (Tooling-Setup).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**getrennter** Ordner für langsame ffmpeg-Integrationstests" (Übergabe-Prompt 8b, Tabelle S11)
- „Render-Pipeline (bereits prototypisch mit echtem ffmpeg getestet)" (CLAUDE.md) – belegt, dass
  echte ffmpeg-Tests vorgesehen sind, aber getrennt vom schnellen Standardlauf.
- Ein Pfad-Argument auf der Kommandozeile (z. B. `vitest run tests/integration`) filtert nur
  **innerhalb** der über `test.include` bereits gefundenen Dateien und erweitert `include`
  **nicht** – deshalb braucht der Integrationslauf eine eigene Config-Datei mit eigenem `include`.

## Fehlerpfade (vollständig)
Entfällt.

## Nicht selbst entscheiden – STOPP und fragen
- Aktuell verbindlich: zwei getrennte Config-Dateien (siehe Signatur). Ob zu einem späteren
  Zeitpunkt auf Vitest-„Projects" in einer gemeinsamen Config umgestiegen wird – reine
  Tooling-Präferenz, bei Unsicherheit vorlegen, bevor umgestellt wird.

## Definition of Done
- [ ] `npm test` läuft nur `tests/unit`, dauert unter 10 Sekunden bei leerem Projekt
- [ ] `npm run test:integration` existiert als separates Skript für `tests/integration`
- [ ] Ein Rauch-Test in `tests/unit/rauchtest.spec.ts` besteht
- [ ] Ein bewusst platzierter Beispiel-Test unter `tests/integration/` wird von
      `npm run test:integration` tatsächlich ausgeführt (nicht nur „kein Fehler"), und der
      Unit-Lauf (`npm test`) führt ihn nicht mit aus
- [ ] Keine Datei außerhalb der genannten geändert

## Abhängigkeiten
- Blockiert von: S1 (benötigt die Ordnerstruktur und TypeScript-Toolchain aus S1)
- Blockiert: alle M1–M7-Issues, deren DoD Unit-Tests verlangt

## Bezug
CLAUDE.md „Render-Pipeline (bereits prototypisch mit echtem ffmpeg getestet)"

---

### Issue S12: [contracts] Ergebnis\<T\>-Hülle und generische Fehlercodes definieren

## Ziel (in einem Satz)
Der geteilte Typ `Ergebnis<T>` und die drei generischen Fehlercodes (`ungueltige_eingabe`,
`nicht_gefunden`, `unbekannter_fehler`) existieren als geteilte TypeScript-Typen – als **einzige**
Typen in M0, ohne jede Domänenlogik.

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/ergebnis.ts`
- Vertrag: Technisches Konzept **9.1.1** (Quelle der Wahrheit)
- Prozess/Speicher: geteilt, Grundlage für jede IPC-Operation aus M1–M7

## Warum das im Gesamtsystem wichtig ist
Diese Hülle ist das Rückgrat der gesamten Renderer↔Main-Kommunikation. Jede der über 100
IPC-Operationen aus M1–M7 gibt entweder `Ergebnis<T>` oder `Ergebnis<void>` zurück; wird der Typ
hier falsch modelliert (z. B. als Klasse statt als diskriminierte Union, oder mit optionalen statt
strikt diskriminierenden Feldern), muss jedes spätere Modul das kompensieren oder falsch benutzen.
Ein `wert: T | undefined` statt der strikten Union würde genau die Verwechslungsgefahr wieder
einführen, die die Hülle laut TK 9.1.1 explizit ausschließen soll.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/ergebnis.ts
export type Fehlercode =
  | 'ungueltige_eingabe'
  | 'nicht_gefunden'
  | 'unbekannter_fehler'
  // fachliche Codes (TK 9.4.9, 9.6.4, 9.12.1 etc.) werden NICHT hier ergänzt;
  // auf welchem Weg diese Union später um fachliche Codes erweitert wird, ist offen
  // (siehe „Nicht selbst entscheiden" unten)

export type Ergebnis<T> =
  | { ok: true; wert: T }
  | { ok: false; fehler: { code: Fehlercode; meldung: string } }

export type ErgebnisVoid = Ergebnis<void>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Typdefinition, kein Laufzeit-Eingang | – |

Ausgang bei Erfolg: `Ergebnis<T>` ist als diskriminierte Union (`ok` als Discriminant) nutzbar;
TypeScript verengt bei `if (ergebnis.ok)` automatisch auf `{wert:T}` bzw. `{fehler:...}`.
Ausgang bei Fehler: entfällt (Typdefinition, keine Laufzeit-Fehlerpfade).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`Ergebnis<T> = { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung:
  string } }`" (TK 9.1.1, Punkt 2)
- „Wo eine Operation **nichts** zu melden hat, lautet die Nutzlast `void`: **`Ergebnis<void>`** –
  das gelungene `ok` **ist** die Information. **Verboten** sind Ersatzformen wie
  `Ergebnis<boolean>`, `Ergebnis<null>` oder ein blankes `true`." (TK 9.1.1, Punkt 2)
- „Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4,
  9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine
  rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3)
- „**Keine Domänentypen.** Wer hier `Project` oder `Vorlage` mit definiert, kollidiert mit dem
  M1-Issue zu TK 9.11." (Übergabe-Prompt 8b, Falle zu S12)

## Fehlerpfade (vollständig)
Entfällt (Typdefinition).

## Nicht selbst entscheiden – STOPP und fragen
- **Keine Domänentypen hier ergänzen** – auch nicht „nur ein kleines Beispiel". Alle Domänentypen
  sind M1 (bzw. M4 für Vorlage/Marke). Bei Unsicherheit, ob ein Typ „generisch genug" für M0 ist:
  nachfragen.
- Ob `Fehlercode` als offene oder geschlossene Union mit zentraler Registrierungsstelle modelliert
  wird – falls das Projekt eine bestimmte Struktur für die spätere Ergänzung fachlicher Codes
  erwartet (z. B. `Fehlercode = GenerischerFehlercode | MediaFehlercode | ...`), das Muster vorab
  klären, da alle folgenden Fehlercode-Issues (M1–M6) sich danach richten müssen.

## Definition of Done
- [ ] `Ergebnis<T>` ist eine diskriminierte Union mit `ok` als Discriminant-Feld
- [ ] TypeScript verengt bei einer `if (ergebnis.ok)`-Prüfung nachweislich korrekt (Zugriff auf
      `.wert` im `true`-Zweig kompiliert, im `false`-Zweig schlägt der Typecheck fehl)
- [ ] `Fehlercode` enthält exakt die drei generischen Codes, keine fachlichen
- [ ] Datei enthält keine Domänentypen (`Project`, `Vorlage`, `Asset` etc.)
- [ ] Keine Datei außerhalb von `src/shared/contracts/ergebnis.ts` geändert

## Abhängigkeiten
- Blockiert von: S1 (der Ordner `src/shared/contracts` muss aus S1 existieren)
- Blockiert: M1-Issue „ipc-gateway", M1-Issue „ipc-client", praktisch jedes IPC-tragende Issue aus
  M1–M7

## Bezug
TK 9.1.1, Übergabe-Prompt Abschnitt 8b

---

## M1 → GitHub-Mapping

Milestone „M1 – Fundament" (#2) · angelegt 02.08.2026. In den GitHub-Bodies sind alle
`M1-xx`- und `Sx`-Verweise durch klickbare `#`-Nummern ersetzt; die Texte unten behalten die
`M1-xx`/`Sx`-Form als lesbare Planungsreferenz.

| M1-Nr. | GitHub-Issue |
|---|---|
| M1-01 | [#13](https://github.com/NiklasRist/Digital-Signage-Tool/issues/13) |
| M1-02 | [#14](https://github.com/NiklasRist/Digital-Signage-Tool/issues/14) |
| M1-03 | [#15](https://github.com/NiklasRist/Digital-Signage-Tool/issues/15) |
| M1-04 | [#16](https://github.com/NiklasRist/Digital-Signage-Tool/issues/16) |
| M1-05 | [#17](https://github.com/NiklasRist/Digital-Signage-Tool/issues/17) |
| M1-06 | [#18](https://github.com/NiklasRist/Digital-Signage-Tool/issues/18) |
| M1-07 | [#19](https://github.com/NiklasRist/Digital-Signage-Tool/issues/19) |
| M1-08 | [#20](https://github.com/NiklasRist/Digital-Signage-Tool/issues/20) |
| M1-09 | [#21](https://github.com/NiklasRist/Digital-Signage-Tool/issues/21) |
| M1-10 | [#22](https://github.com/NiklasRist/Digital-Signage-Tool/issues/22) |
| M1-11 | [#23](https://github.com/NiklasRist/Digital-Signage-Tool/issues/23) |
| M1-12 | [#24](https://github.com/NiklasRist/Digital-Signage-Tool/issues/24) |
| M1-13 | [#25](https://github.com/NiklasRist/Digital-Signage-Tool/issues/25) |
| M1-14 | [#26](https://github.com/NiklasRist/Digital-Signage-Tool/issues/26) |
| M1-15 | [#27](https://github.com/NiklasRist/Digital-Signage-Tool/issues/27) |
| M1-16 | [#28](https://github.com/NiklasRist/Digital-Signage-Tool/issues/28) |
| M1-17 | [#29](https://github.com/NiklasRist/Digital-Signage-Tool/issues/29) |
| M1-18 | [#30](https://github.com/NiklasRist/Digital-Signage-Tool/issues/30) |
| M1-19 | [#31](https://github.com/NiklasRist/Digital-Signage-Tool/issues/31) |
| M1-20 | [#32](https://github.com/NiklasRist/Digital-Signage-Tool/issues/32) |
| M1-21 | [#33](https://github.com/NiklasRist/Digital-Signage-Tool/issues/33) |
| M1-22 | [#34](https://github.com/NiklasRist/Digital-Signage-Tool/issues/34) |
| M1-23 | [#35](https://github.com/NiklasRist/Digital-Signage-Tool/issues/35) |
| M1-24 | [#36](https://github.com/NiklasRist/Digital-Signage-Tool/issues/36) |
| M1-25 | [#37](https://github.com/NiklasRist/Digital-Signage-Tool/issues/37) |
| M1-26 | [#38](https://github.com/NiklasRist/Digital-Signage-Tool/issues/38) |
| M1-27 | [#39](https://github.com/NiklasRist/Digital-Signage-Tool/issues/39) |
| M1-28 | [#40](https://github.com/NiklasRist/Digital-Signage-Tool/issues/40) |
| M1-29 | [#41](https://github.com/NiklasRist/Digital-Signage-Tool/issues/41) |
| M1-30 | [#42](https://github.com/NiklasRist/Digital-Signage-Tool/issues/42) |
| M1-31 | [#43](https://github.com/NiklasRist/Digital-Signage-Tool/issues/43) |
| M1-32 | [#44](https://github.com/NiklasRist/Digital-Signage-Tool/issues/44) |
| M1-33 | [#45](https://github.com/NiklasRist/Digital-Signage-Tool/issues/45) |
| M1-34 | [#46](https://github.com/NiklasRist/Digital-Signage-Tool/issues/46) |
| M1-35 | [#47](https://github.com/NiklasRist/Digital-Signage-Tool/issues/47) |
| M1-36 | [#48](https://github.com/NiklasRist/Digital-Signage-Tool/issues/48) |
| M1-37 | [#49](https://github.com/NiklasRist/Digital-Signage-Tool/issues/49) |
| M1-38 | [#50](https://github.com/NiklasRist/Digital-Signage-Tool/issues/50) |
| M1-39 | [#51](https://github.com/NiklasRist/Digital-Signage-Tool/issues/51) |
| M1-40 | [#52](https://github.com/NiklasRist/Digital-Signage-Tool/issues/52) |

---

## Milestone M1 – Fundament

Umfasst: `contracts/types` (Kern-Domänentypen, ohne Vorlage/Zone/Marke – die kommen erst in M4),
`ipc-gateway`/`ipc-client`, `config-store` [D3], `project-store` [D1]. Alle Issues blockiert von
den einschlägigen M0-Issues (insb. #1 Ordnerstruktur, #12 `Ergebnis<T>`, #5 Datenort, #9
`media://`-Hülse).

### contracts/types (geteilt) – Kern-Domänentypen

---

---

### Issue M1-01: [contracts] Typ Asset und Format-Whitelist-Konstante definieren

## Ziel (in einem Satz)
Der Typ `Asset` und die Format-Whitelist (erlaubte Video-/Bild-Formate) existieren als geteilte
Typen, sodass Dialog-Filter (media-service) und Import-Prüfung denselben Wert lesen.

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/asset.ts`
- Vertrag: Technisches Konzept **9.4.4**, **9.4.2** (Quelle der Wahrheit)
- Prozess/Speicher: D1 (Teil von `Project.assets`)

## Warum das im Gesamtsystem wichtig ist
`Asset` ist die einzige Repräsentation importierter Medien – `media-service` (M3) erzeugt sie,
`project-store` (M1) persistiert sie, `composer`/`preview-player`/`render-service` (M5/M6/M7)
lesen sie. Wird `maße` hier z. B. als optionale Felder statt als Pflichtfeld modelliert, oder
`dauer` als Integer statt mit 3 Nachkommastellen, pflanzt sich der Fehler in jedes lesende Modul
fort, ohne dass der Compiler ihn je anmahnt.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/asset.ts
export const FORMAT_WHITELIST = {
  video: ['mp4'] as const,       // H.264/H.265 innerhalb MP4
  // 'jpeg' ist eine bewusste Ergänzung ÜBER den TK hinaus (TK 9.4.2/9.11.4 nennen nur
  // JPG, PNG, WebP): dieselbe Bilddatei trägt real zwei übliche Endungen, eine Datei
  // "foto.jpeg" würde sonst grundlos abgewiesen.
  bild: ['jpg', 'jpeg', 'png', 'webp'] as const,
} as const

export interface Asset {
  id: string                                   // UUID
  typ: 'video' | 'bild'
  dateiname: string                             // "<uuid>.<ext_kleingeschrieben>", OHNE Verzeichnisanteil
  originalname: string                          // nur für UI-Anzeige
  maße: { breite: number; höhe: number }        // Display-Maße, Pixel, ganzzahlig
  dauer: number | null                          // Sekunden, 3 Nachkommastellen (Video); null (Bild)
  importdatum: string                           // ISO-8601 UTC
  zustand: 'ok' | 'fehlt'
}
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Typdefinition | – |

Ausgang bei Erfolg: `Asset` ist im ganzen Projekt importierbar; `FORMAT_WHITELIST` ist die
**einzige** Stelle, die Dateiendungen auflistet.
Ausgang bei Fehler: entfällt (Typdefinition).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`dateiname`: string // ‚<uuid>.<ext_kleingeschrieben>' — OHNE Verzeichnisanteil" (TK 9.4.4)
- „`maße`: { breite: number, höhe: number } // DISPLAY-Maße in Pixeln, ganzzahlig (9.4.8)" (TK 9.4.4)
- „`dauer`: number | null // Sekunden, 3 Nachkommastellen (Video); null (Bild)" (TK 9.4.4)
- „Der Formatfilter des Dialogs (9.4.3) und die Prüfung beim Import lesen **denselben** konstanten
  Wert aus `contracts/types` — sie dürfen nie auseinanderlaufen." (TK 9.4.2)
- „MKV/MOV/AVI werden **ausgeschlossen**" (TK 9.4.2) – die Whitelist enthält ausschließlich MP4 für
  Video.

## Fehlerpfade (vollständig)
Entfällt (Typdefinition, keine Laufzeit-Fehlerpfade).

## Nicht selbst entscheiden – STOPP und fragen
- Ob H.264 **und** H.265 innerhalb von MP4 gleichermaßen akzeptiert werden (TK 9.4.2 nennt beide),
  oder ob H.265 wegen TV-Kompatibilität (Anforderungsdokument 2.2) besser ausgeschlossen wird – der
  Typ selbst unterscheidet Codecs nicht, aber falls `media-service` (M3) das später prüfen soll,
  hier nicht eigenmächtig vorentscheiden.

## Definition of Done
- [ ] `Asset`-Interface exakt wie oben, keine zusätzlichen/fehlenden Felder
- [ ] `FORMAT_WHITELIST` ist `as const` (literale Typen, keine `string[]`)
- [ ] Keine Datei außerhalb von `src/shared/contracts/asset.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Ordnerstruktur)
- Blockiert: M3-Issues (media-service), M1-project-store-Issues (Aktion/Listenelement referenzieren Asset)

## Bezug
TK 9.4.2, TK 9.4.4

---

### Issue M1-02: [contracts] Typ Aktion definieren

## Ziel (in einem Satz)
Der Typ `Aktion` (Produkt/Werbeinhalt-Datensatz) existiert als geteilter Typ mit allen Feldern aus
dem Anforderungsdokument (Titel, Beschreibung, Preis, Bildreferenz, CTA, Standarddauer, Vorlage,
Akzentfarbe).

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/aktion.ts`
- Vertrag: Technisches Konzept **9.8.2** (Quelle der Wahrheit)
- Prozess/Speicher: D1 (Teil von `Project.aktionen`)

## Warum das im Gesamtsystem wichtig ist
Die `Aktion` ist die zentrale referenzierbare Einheit für Werbeinhalte (FA-02): mehrere
Listenelemente und Band-Abschnitte dürfen auf dieselbe Aktion zeigen (Modellierungs-Entscheidung 2,
TK 5). `bildRef` muss als **Referenz** (Asset-ID), nicht als eingebettetes Bild modelliert sein –
sonst bricht die Invariante „Bild = Referenz, nie Kopie" (TK 9.8.4) schon auf Typ-Ebene, und jede
spätere Änderung am Bild müsste alle Aktionen einzeln aktualisieren statt eine Referenz zu
verfolgen.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/aktion.ts
export interface Aktion {
  id: string
  titel: string                    // Pflicht
  beschreibung: string | null
  preis: string | null
  bildRef: string | null           // Referenz auf eine Asset-ID (NICHT eingebettet)
  cta: string | null
  standardDauer: number | null     // nur Vorgabe, s. TK 9.8.4
  vorlagenId: string
  akzentfarbe: string              // Rollen-Verweis in die Markenpalette, kein Hex
}
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Typdefinition | – |

Ausgang bei Erfolg: `Aktion` ist im ganzen Projekt importierbar.
Ausgang bei Fehler: entfällt.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
```
Aktion {
  id:           string
  titel:        string          // Pflicht
  beschreibung: string | null
  preis:        string | null
  bildRef:      string | null   // Referenz auf eine Asset-ID (NICHT eingebettet)
  cta:          string | null   // Call-to-Action, z. B. "Gratis Probetraining"
  standardDauer:number | null   // Default-Anzeigedauer; nur Vorgabe (s. 9.8.4)
  vorlagenId:   string          // gewählte Vorlage (eingebaut oder eigene, FA-13)
  akzentfarbe:  string          // aus der Markenpalette (feste Auswahl, v1)
}
```
(TK 9.8.2, wörtlich übernommen)
- „Bild = Referenz, nie Kopie: die Aktion hält nur eine Asset-ID." (TK 9.8.4)
- „Akzentfarbe nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler)." (TK 9.8.4)

## Fehlerpfade (vollständig)
Entfällt (Typdefinition; Validierung – Titel Pflicht – ist Sache der `erstelleAktion`/
`bearbeiteAktion`-Operationen in `project-store`, nicht dieses Typs).

## Nicht selbst entscheiden – STOPP und fragen
- Ob `akzentfarbe` als String-Literal-Union der v1-Farbrollen (z. B. `'akzent' | 'akzentKraeftig' | ...`)
  oder als freier `string` mit Laufzeit-Validierung modelliert wird – die Markenpalette selbst
  entsteht erst in M4 (`Marke`-Typ); falls die Rollen-Namen dort noch nicht feststehen, hier
  vorerst `string` verwenden und in M4 ggf. präzisieren, nicht raten.

## Definition of Done
- [ ] `Aktion`-Interface exakt wie oben
- [ ] `titel` ist non-optional (`string`, nicht `string | null`)
- [ ] Keine Datei außerhalb von `src/shared/contracts/aktion.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1
- Blockiert: M1-project-store-Issues (Aktion-CRUD), M3/M5-Issues

## Bezug
TK 9.8.2, TK 9.8.4, Anforderungsdokument FA-02, 4.1

---

### Issue M1-03: [contracts] Typen Project und Listenelement definieren

## Ziel (in einem Satz)
Die Typen `Project` und `Listenelement` existieren mit der Array-Reihenfolge als einziger
Ordnungsquelle (kein `position`-Feld) und der korrekten Feldbelegung je Element-Art.

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/project.ts`
- Vertrag: Technisches Konzept **9.11.3** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
`Listenelement` ist das Herzstück der Wiedergabeliste – `composer` (M5) manipuliert es,
`render-service` (M6) liest es 1:1 in `RenderItem` um. Ein zusätzliches `position`-Feld neben der
Array-Reihenfolge wäre eine zweite Quelle für dieselbe Information; TK betont ausdrücklich, dass
„zwei Quellen für dieselbe Information unweigerlich auseinanderlaufen" – ein Agent, der later ein
`ordneNeu` implementiert, dürfte dann nicht versucht sein, zusätzlich ein `position`-Feld zu
pflegen.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/project.ts
export interface Project {
  id: string
  name: string
  erstelltAm: string             // ISO-8601 UTC
  geaendertAm: string            // ISO-8601 UTC
  schemaVersion: number
  assets: Asset[]
  aktionen: Aktion[]
  liste: Listenelement[]         // Reihenfolge = Array-Reihenfolge, KEIN position-Feld
  letzterAusgabeName: string | null   // FA-22: Vorbelegung des Render-Zielnamens; null = noch nie gerendert
}

export interface Listenelement {
  id: string
  art: 'video' | 'bild' | 'segment'
  ref: string                                    // Asset-ID (video|bild) oder Aktions-ID (segment)
  dauer: number | null                           // Sekunden – bild/segment
  trimStart: number | null                       // Sekunden – nur video
  trimEnde: number | null                        // Sekunden – nur video
  einblendung: Einblendung | null                // nur video
}

export interface Einblendung {
  bandVorlageId: string
  abschnitte: Array<{ aktionRef: string; dauer: number }>
}
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Typdefinition | – |

Ausgang bei Erfolg: `Project`/`Listenelement`/`Einblendung` sind im ganzen Projekt importierbar;
TypeScript erzwingt bei `art:'video'` nicht automatisch die Feldbelegung (das ist Laufzeit-
Validierung in `project-store`, nicht Typsache) – die Tabelle unten dokumentiert die **beabsichtigte**
Belegung.
Ausgang bei Fehler: entfällt.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Die Reihenfolge ist die Array-Reihenfolge von `liste`** – es gibt **kein** separates
  `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerlich auseinanderlaufen."
  (TK 9.11.3)
- „`Vorlage` und `Marke` liegen NICHT im Projekt – sie sind app-weit. Das Projekt hält nur
  Referenzen (`vorlagenId`, `bandVorlageId`)." (TK 9.11.3)
- Belegung je `art` (TK 9.11.3, Tabelle): `video` → `ref`=Asset(video), `dauer`=`null`,
  `trimStart`/`trimEnde` gesetzt, `einblendung` erlaubt · `bild` → `ref`=Asset(bild), `dauer`
  gesetzt (10–45s), `trimStart`/`trimEnde`/`einblendung`=`null` · `segment` → `ref`=Aktion, `dauer`
  gesetzt (10–45s), `trimStart`/`trimEnde`/`einblendung`=`null`.
- **Bewusste Vereinfachung:** `Listenelement` bleibt ein **flaches** Interface, keine
  diskriminierte Union über `art`. Die Belegungsregel oben (aus der TK-9.11.3-Tabelle) wird damit
  **nicht** vom Typsystem erzwungen, sondern **ausschließlich** in den Operationen validiert
  (`setzeTrim`, `setzeDauer`, `fügeElementHinzu`) – das ist kein Versehen, sondern eine gezielte
  Entscheidung zugunsten eines einfacher zu handhabenden Typs für `composer` (M5).

## Fehlerpfade (vollständig)
Entfällt (Typdefinition; die Belegungs-Validierung je `art` ist Sache der `project-store`-Operationen
`fügeElementHinzu`/`setzeTrim`/`setzeDauer`/`setzeEinblendung`, nicht dieses Typs).

## Nicht selbst entscheiden – STOPP und fragen
- (keine offenen Punkte – `Listenelement` bleibt bewusst flach, s. Invarianten)

## Definition of Done
- [ ] `Project`/`Listenelement`/`Einblendung` exakt wie oben
- [ ] `liste` ist `Listenelement[]`, kein zusätzliches Sortier-/Positionsfeld irgendwo im Projekt
- [ ] Ein Kommentar im Code verweist auf die Belegungstabelle (TK 9.11.3), da TypeScript sie nicht
      erzwingen kann
- [ ] Keine Datei außerhalb von `src/shared/contracts/project.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1, M1-01 (Asset), M1-02 (Aktion)
- Blockiert: alle M1-project-store-Issues, M5/M6-Issues

## Bezug
TK 9.11.3, TK 9.2.8 (Einblendung)

---

### Issue M1-04: [contracts] Typ Auftrag und Auftragsarten definieren

## Ziel (in einem Satz)
Der Typ `Auftrag` mit seiner Zustandsmaschine (`status`) und die vier Auftragsarten
(`import`/`loeschen`/`render`/`export`) existieren als geteilte Typen.

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/auftrag.ts`
- Vertrag: Technisches Konzept **9.3.1**, **9.3.2** (Quelle der Wahrheit)
- Prozess/Speicher: Q1 (in-memory), Q2 (persistent bis erledigt)

## Warum das im Gesamtsystem wichtig ist
`Auftrag` ist der zentrale Datensatz des `auftrags-manager` (M2) – des **einzigen** seriellen
Sperr-Mechanismus im System (TK 9.3.5). Modelliert dieser Typ `status` als freien `string` statt
als geschlossene Union der fünf gültigen Zustände, kann ein Agent in M2 versehentlich einen sechsten
Zustand erfinden (z. B. `"pausiert"`), den die Zustandsmaschine nicht kennt – die serielle Garantie
„höchstens ein Auftrag `laeuft`" wäre dann nicht mehr durch den Typ, sondern nur noch durch
Disziplin abgesichert.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/auftrag.ts
export type AuftragArt = 'import' | 'loeschen' | 'render' | 'export'
export type AuftragStatus = 'anstehend' | 'laeuft' | 'erfolg' | 'fehlgeschlagen' | 'abgebrochen'

export type Auftrag =
  | { auftragId: string; art: 'import'; status: AuftragStatus; label: string; payload: ImportRequest; fortschritt: number | null; versuche: number; fehler: { code: Fehlercode; meldung: string } | null; erstelltAm: string }
  | { auftragId: string; art: 'loeschen'; status: AuftragStatus; label: string; payload: LöschRequest; fortschritt: number | null; versuche: number; fehler: { code: Fehlercode; meldung: string } | null; erstelltAm: string }
  | { auftragId: string; art: 'render'; status: AuftragStatus; label: string; payload: RenderRequest; fortschritt: number | null; versuche: number; fehler: { code: Fehlercode; meldung: string } | null; erstelltAm: string }
  | { auftragId: string; art: 'export'; status: AuftragStatus; label: string; payload: ExportRequest; fortschritt: number | null; versuche: number; fehler: { code: Fehlercode; meldung: string } | null; erstelltAm: string }
```
`ImportRequest`/`LöschRequest`/`RenderRequest`/`ExportRequest` sind Forward-Referenzen auf Typen aus
den jeweiligen Fach-Issues (M3: media-service, M6: render-service/export-service) – diese Referenz
gilt, auch wenn die referenzierten Typen zum Zeitpunkt dieses Issues noch nicht existieren; sie
werden in M3/M6 präzisiert, nicht hier durch `unknown` ersetzt.

`Auftrag` ist als **diskriminierte Union** über `art` modelliert (nicht als ein einziges flaches
Interface mit `art: AuftragArt` und `payload: ImportRequest | LöschRequest | RenderRequest |
ExportRequest`): `art` und `payload` wären sonst zwei unabhängige Felder, wodurch ein unmöglicher
Zustand wie `{ art: 'import', payload: <RenderRequest> }` anstandslos kompilieren würde. Da der
`auftrags-manager` (M2) – der **einzige** serielle Sperr-Mechanismus des Systems (TK 9.3.5) –
direkt mit diesem Typ arbeitet, darf ein solcher Widerspruch nicht einmal typmäßig darstellbar
sein.

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Typdefinition | – |

Ausgang bei Erfolg: `Auftrag` ist im ganzen Projekt importierbar; `AuftragStatus` erzwingt beim
Typecheck, dass nur die fünf gültigen Zustände zugewiesen werden.
Ausgang bei Fehler: entfällt.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
```
| Feld | Inhalt | Zweck |
|---|---|---|
| `auftragId` | ID des Auftrags (Main-vergeben) | eindeutige Referenz |
| `art` | `import` | `loeschen` | `render` | `export` | diskriminiert die `payload` |
| `status` | `anstehend` | `laeuft` | `erfolg` | `fehlgeschlagen` | `abgebrochen` | Zustand |
| `payload` | ... | vollständig aufbewahrt → Wiederholung ohne Neu-Eingabe möglich |
```
(TK 9.3.1, sinngemäß aus der Feldtabelle übernommen)
- „P1 (Import/Löschen) und P4 (Render/Export) laufen **ausschließlich als Aufträge** über P6."
  (TK 7.1)
- „Instant-Operationen sind KEINE Aufträge" (Übergabe-Prompt Agent-Kontext Abschnitt 8) – dieser
  Typ gilt **nicht** für Aktion-CRUD, Liste-Reorder, Trim/Dauer setzen.

## Fehlerpfade (vollständig)
Entfällt (Typdefinition).

## Nicht selbst entscheiden – STOPP und fragen
- (keine offenen Punkte – Forward-Referenz auf `ImportRequest | LöschRequest | RenderRequest |
  ExportRequest` gilt, s. Signatur; die diskriminierte Union über `art` ist entschieden)

## Definition of Done
- [ ] `AuftragArt`, `AuftragStatus`, `Auftrag` exakt wie oben (diskriminierte Union über `art`)
- [ ] `AuftragStatus` ist eine geschlossene String-Union mit genau fünf Werten
- [ ] `{ art: 'import', payload: <RenderRequest-Wert> }` kompiliert **nicht** (Test/Kommentar, der
      die Diskriminierung belegt)
- [ ] Keine Datei außerhalb von `src/shared/contracts/auftrag.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1, M1-10 (`Fehlercode` – #12/S12 aus M0 liefert nur `Ergebnis<T>` und die
  generischen Codes; `Auftrag.fehler.code` muss aber auch die in M1-10 zusammengeführten
  fachlichen Codes tragen können)
- Blockiert: M2-Issues (auftrags-manager), M3/M6-Issues

## Bezug
TK 9.3.1, TK 9.3.2, TK 7.1

---

### Issue M1-05: [contracts] Typen RenderRequest und RenderItem definieren

## Ziel (in einem Satz)
Die Typen `RenderRequest` und `RenderItem` (in den drei diskriminierten Varianten
`video`/`bild`/`segment`) existieren als geteilte Typen für den Render-Auftrag.

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/render-request.ts`
- Vertrag: Technisches Konzept **9.2.1**, **9.2.2** (Quelle der Wahrheit)
- Prozess/Speicher: P4 (Eingang von `render-service`)

## Warum das im Gesamtsystem wichtig ist
`RenderItem` ist die Stelle, an der IPC-Granularität Variante A (TK 9.1) typmäßig sichtbar wird:
Bei `art:"segment"` reist ein fertiges PNG als Binärpuffer, **keine** Aktions-/Vorlagendaten. Würde
`RenderItem` stattdessen `aktion`+`vorlage` mitschicken (statt eines fertigen `png`-Buffers), wäre
das ein struktureller Bruch der Zusicherung „nur gerenderte Segment-PNGs reisen über IPC" (TK 9.1,
Punkt 1) – der Main bekäme dann Rohdaten und müsste selbst zeichnen, was die ganze
Pixelgleichheits-Garantie (TK 8, TK 9.10.1) aufheben würde.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/render-request.ts
export interface RenderRequest {
  renderId: string
  projektId: string
  elemente: RenderItem[]           // bereits in Wiedergabereihenfolge
  profil: RenderProfile            // s. M1-06
  ausgabeName: string              // Dateiname OHNE Endung; Ziel projects/<projektId>/output/<ausgabeName>.mp4 (FA-22)
                                    // vorbelegt mit Project.letzterAusgabeName; gleicher Name ersetzt, neuer Name legt an
}

export type RenderItem = RenderItemVideo | RenderItemBild | RenderItemSegment

export interface RenderItemVideo {
  id: string
  art: 'video'
  medienRef: string                // relativer Pfad in media/
  trimStart: number                // Sekunden
  trimEnde: number                 // Sekunden
  einblendung: {
    bandVorlageId: string
    abschnitte: Array<{ png: Uint8Array; dauer: number }>   // Band-PNGs bereits gerendert
    // Uint8Array (nicht ArrayBuffer/Buffer): überlebt Electrons structured clone
    // verlustfrei und ist der kleinste gemeinsame Nenner zwischen Renderer und Main.
  } | null
}

export interface RenderItemBild {
  id: string
  art: 'bild'
  medienRef: string
  dauer: number
}

export interface RenderItemSegment {
  id: string
  art: 'segment'
  png: Uint8Array                  // Binärpuffer, vom Renderer via template-canvas gerendert
  dauer: number
}
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Typdefinition | – |
| `ausgabeName` | Dateiname ohne Endung für die Zieldatei | keine Pfadtrenner, kein `..`, keine für Windows/macOS/FAT32 unzulässigen Zeichen, nicht leer, keine reservierten Windows-Namen (Validierung selbst ist Sache von `render-service`, M6 – hier nur der Typ `string`) |

Ausgang bei Erfolg: `RenderRequest`/`RenderItem` sind im ganzen Projekt importierbar; TypeScript
verengt bei `item.art === 'segment'` automatisch auf `RenderItemSegment` (inkl. `png`-Feld).
Ausgang bei Fehler: entfällt.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Nur gerenderte Segment-PNGs reisen über IPC.** Importierte Videos und Bilder liegen bereits
  kopiert in `media/` (D2) und werden vom Main **direkt per relativem Pfad** gelesen […] – sie
  gehen **nie** über IPC." (TK 9.1, Punkt 1)
- „**PNG-Übergabe als Binärpuffer** (kein Base64 im Nachrichtenkörper)." (TK 9.1, Punkt 3)
- „Bei `‚segment'` werden **keine** Aktions-/Vorlagendaten mitgeschickt – die Pixel sind bereits
  final; das ist der Kern von Variante A." (TK 9.2.2)
- „Jedes `RenderItem` trägt eine `id` zur eindeutigen **Fehlerzuordnung**; die Reihenfolge ergibt
  sich aus der Listenposition, nicht aus einem separaten Feld." (TK 9.2.1)
- „`ausgabeName` | Dateiname **ohne** Endung | Zieldatei `projects/<id>/output/<ausgabeName>.mp4`
  (FA-22). Vorbelegt mit `Project.letzterAusgabeName`; ein gleicher Name **ersetzt** die vorige
  Fassung, ein neuer legt eine zusätzliche Datei an" (TK 9.2.1)
- „**Der Ausgabename ist Nutzereingabe und wird validiert (FA-22):** Erlaubt ist ein reiner
  Dateiname **ohne** Endung – **keine** Pfadtrenner (`/`, `\`), **kein** `..`, keine für
  Windows/macOS/FAT32 unzulässigen Zeichen (`< > : " | ? *`, Steuerzeichen), nicht leer, keine
  reservierten Windows-Namen (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`). Der
  aufgelöste Pfad muss **innerhalb** von `projects/<id>/output/` liegen. Verstoß →
  `ungueltige_eingabe`, **ohne** Wirkung." (TK 9.2.6)

## Fehlerpfade (vollständig)
Entfällt (Typdefinition; Validierung ist Sache von `render-service`, M6).

## Nicht selbst entscheiden – STOPP und fragen
- (keine offenen Punkte – `Uint8Array` für PNG-Binärdaten ist entschieden, s. Signatur)

## Definition of Done
- [ ] `RenderRequest`, `RenderItem` (drei Varianten) exakt wie oben
- [ ] TypeScript verengt bei `art`-Diskriminierung nachweislich korrekt (Test: Zugriff auf
      `.png` nur im `segment`-Zweig kompiliert)
- [ ] Keine Aktions-/Vorlagendaten in `RenderItemSegment` (nur `png`+`dauer`+`id`)
- [ ] Keine Datei außerhalb von `src/shared/contracts/render-request.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1, M1-06 (`RenderProfile`)
- Blockiert: M6-Issues (render-service, ffmpeg-adapter)

## Bezug
TK 9.1, TK 9.2.1, TK 9.2.2, TK 9.2.8

---

### Issue M1-06: [contracts] RenderProfile-Konstante definieren

## Ziel (in einem Satz)
Das feste `RenderProfile` (Auflösung, Bildrate, Codec, Pixelformat, Ratensteuerung, GOP,
Farbmetadaten, Audio) existiert als eine einzige, geteilte Konstante – das TV-kritische
Ausgabe-Profil des gesamten Projekts.

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/render-profile.ts`
- Vertrag: Technisches Konzept **9.2.4** (Quelle der Wahrheit)
- Prozess/Speicher: Eingang von `render-service`/`ffmpeg-adapter` (M6)

## Warum das im Gesamtsystem wichtig ist
Dieses Profil entscheidet, ob der Samsung-Fernseher (UE85AU7170, Anforderungsdokument 2.2) die
die Ausgabedatei überhaupt abspielt. Jede Abweichung – 10-Bit statt 8-Bit, fehlende BT.709-Metadaten,
unbegrenztes CRF ohne VBV-Deckel – fällt nicht beim Rendern auf (ffmpeg codiert klaglos), sondern
erst am echten Gerät im Studio: falsche Farben, Ruckler oder ein Bild, das gar nicht startet. Dieses
Issue existiert, damit **kein** M6-Agent diese Werte selbst „aus dem Kopf" in einen ffmpeg-Aufruf
tippt, sondern sie aus **einer** Konstante liest.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/render-profile.ts
export interface RenderProfile {
  breite: 1920
  hoehe: 1080
  fps: 30                          // CFR
  videoCodec: 'h264'
  profil: 'high'
  level: '4.0'
  pixelformat: 'yuv420p'
  bitTiefe: 8
  ratensteuerung: { zielBitrateKbps: 10000; maxBitrateKbps: 12000; vbvBufferKbit: 24000 }
  gopMaxSekunden: 2                // geschlossen, IDR je Segmentanfang
  farbmetadaten: { primaries: 'bt709'; transfer: 'bt709'; matrix: 'bt709' }
  sar: '1:1'
  audio: { codec: 'aac'; sampleRateHz: 48000; kanaele: 1; still: true }
  faststart: true
  container: 'mp4'
  // KEIN dateiname: Der Ausgabename ist NICHT Teil des Profils, sondern
  // kommt je Lauf als RenderRequest.ausgabeName (FA-22, TK 9.2.1).
}

export const RENDER_PROFILE: RenderProfile = {
  breite: 1920, hoehe: 1080, fps: 30,
  videoCodec: 'h264', profil: 'high', level: '4.0',
  pixelformat: 'yuv420p', bitTiefe: 8,
  ratensteuerung: { zielBitrateKbps: 10000, maxBitrateKbps: 12000, vbvBufferKbit: 24000 },
  gopMaxSekunden: 2,
  farbmetadaten: { primaries: 'bt709', transfer: 'bt709', matrix: 'bt709' },
  sar: '1:1',
  audio: { codec: 'aac', sampleRateHz: 48000, kanaele: 1, still: true },
  faststart: true, container: 'mp4',
}
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Konstante | – |

Ausgang bei Erfolg: `RENDER_PROFILE` ist die einzige Quelle für Render-Parameter im gesamten
Projekt; `ffmpeg-adapter` (M6) baut seine Argument-Arrays ausschließlich daraus.
Ausgang bei Fehler: entfällt.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
TK 9.2.4, Tabelle „RenderProfile (aktuell fest)", wörtlich übernommen:

| Feld | Wert | Begründung / Falle |
|---|---|---|
| Auflösung | **1920 × 1080** | Ausgabe-Profil |
| Bildrate | **30 fps, CFR** (konstant) | Voraussetzung für die Frame-Rundung (9.2.6) |
| Video-Codec | **H.264**, Profil **High**, **Level 4.0** | 1080p30 bei ~12 Mbit/s liegt sicher in Level 4.0 – der maximal kompatible Wert für Consumer-Geräte |
| **Pixelformat** | **`yuv420p`, 8 Bit** | Consumer-TVs decodieren **nur** 4:2:0/8 Bit. Wird das Format der Quelle übernommen (4:2:2, 4:4:4 oder 10 Bit), **spielt der TV die Datei nicht ab** |
| **Ratensteuerung** | **gedeckeltes VBR**: Ziel **10**, max **12 Mbit/s**, VBV-Puffer **24 Mbit** | Hardware-Decoder haben begrenzte Puffer; unbegrenztes VBR (z. B. reines CRF) erzeugt Spitzen → **Ruckler** am TV |
| **GOP** | **geschlossen**, ≤ 2 s (60 Frames); **jedes Segment beginnt mit einem Keyframe (IDR)** | **Voraussetzung für `concat -c copy`** (9.2.6): ohne Keyframe am Segmentanfang bricht die verlustfreie Verkettung |
| **Farbmetadaten** | **BT.709** explizit gesetzt (Primaries, Transfer, Matrix) | Ohne Metadaten **raten** Player, viele nehmen BT.601 an → die **Farben verschieben sich**, `#FF4040` sieht am TV falsch aus. Bei einer Marke inakzeptabel |
| **Pixel-Seitenverhältnis** | **1:1** (quadratisch, SAR 1:1) | Quellvideos mit nicht-quadratischen Pixeln würden am TV **verzerrt** dargestellt |
| Abtastung | **progressiv** | kein Interlacing |
| **Audio** | **stille AAC-Spur** (48 kHz, mono, niedrige Bitrate) – in **jedem** Segment identisch | Manche Player/TVs erwarten eine Audiospur und verhalten sich bei rein-Video-MP4 eigenartig. Das Ergebnis ist trotzdem **still** (Anforderungsdokument R-06 ist damit **entschieden**) |
| Seitenverhältnis-Politik | einpassen + schwarze Balken (`pad`; Letterbox/Pillarbox), **kein** Beschnitt | Ausnahme: Split-Komposition füllt in Markenfarbe (9.2.8) |
| Container / Dateiname | **MP4** mit **`+faststart`** / `<ausgabeName>.mp4` (frei, FA-22) | Index vorn – hilft Playern, die ihn früh erwarten |

- „**Ausdrücklich verboten** (typische „für mehr Qualität"-Fehlgriffe, die den TV aussperren):
  10-Bit-Tiefe, 4:2:2/4:4:4-Abtastung, exotisch hohe Referenzframe-Zahlen, offene GOPs,
  unbegrenztes CRF ohne VBV-Deckel." (TK 9.2.4)
- „Alle Werte gelten identisch für jedes Segment – sonst scheitert die
  Uniformitäts-Voraussetzung von `-c copy` (9.2.6)." (TK 9.2.4)

## Fehlerpfade (vollständig)
Entfällt (Konstante, keine Laufzeit-Fehlerpfade).

## Nicht selbst entscheiden – STOPP und fragen
- **Keiner dieser Werte darf „zur Verbesserung der Qualität" verändert werden** – auch nicht
  scheinbar harmlose Erhöhungen wie ein höheres `maxBitrateKbps`. Jede Abweichung vom TK-9.2.4-Wert
  ist ausdrücklich zu melden statt umzusetzen.
- Wie die Ratensteuerungs-Felder exakt in ffmpeg-CLI-Flags übersetzt werden (z. B. `-maxrate`,
  `-bufsize`) gehört **nicht** in diese Konstante, sondern in `ffmpeg-adapter` (M6) – hier nur die
  fachlichen Werte, keine ffmpeg-Syntax.

## Definition of Done
- [ ] `RENDER_PROFILE` enthält exakt die oben gelisteten Werte, keine Abweichung
- [ ] Typ ist literal genug, dass ein versehentlich falscher Wert (z. B. `hoehe: 1081`) einen
      Typfehler erzeugt, wo sinnvoll (literale Typen statt `number` bei festen Werten)
- [ ] Keine Datei außerhalb von `src/shared/contracts/render-profile.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1
- Blockiert: M1-05 (`RenderRequest`), M6-Issues (ffmpeg-adapter, render-service)

## Bezug
TK 9.2.4, Anforderungsdokument NFA-03, R-06

---

### Issue M1-07: [contracts] Typen RenderResult und RenderProgress definieren

## Ziel (in einem Satz)
Die Typen `RenderResult` (drei terminale Stati) und `RenderProgress` (Fortschritts-Ereignis)
existieren als geteilte Typen für den Ausgang von `renderReel`.

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/render-result.ts`
- Vertrag: Technisches Konzept **9.2.3**, **9.2.7** (Quelle der Wahrheit)
- Prozess/Speicher: Ausgang von P4, Eingang von P6 (Q3-Protokoll)

## Warum das im Gesamtsystem wichtig ist
`RenderResult` ist der einzige Weg, wie der Render-Ausgang das System verlässt – über den
Auftrags-Zustand (TK 9.1.1, Punkt 1), nicht als direkte Aufrufantwort. Wird `status` als offener
`string` statt als geschlossene Drei-Werte-Union modelliert, kann `auftrags-manager` (M2) nicht
erschöpfend auf alle Fälle prüfen (`switch` ohne `default`), und ein vierter, unbedachter Status
könnte durchrutschen, ohne dass ein Protokoll-Eintrag (Q3) entsteht.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/render-result.ts
export type RenderResult =
  | { status: 'erfolg'; renderId: string; ausgabePfad: string; gesamtdauer: number; dateigroesse: number; historieEintrag: HistorieEintrag }
  | { status: 'fehler'; renderId: string; fehlercode: string; fehlerhaftesElementId: string | null; meldung: string }
  | { status: 'abgebrochen'; renderId: string; abgebrochenBei: number | null }

// HistorieEintrag: TK 9.2.3 nennt nur die Inhalte "ID, Datum, Pfad, Dauer, Größe", legt aber
// weder exakte Feldnamen/Typen noch fest, ob "ID" hier bereits die auftragId ist und ob Datum
// vom render-service selbst oder erst vom auftrags-manager beim Schreiben nach Q3 ergänzt wird
// (s. "Nicht selbst entscheiden" unten). Platzhalter, bis das geklärt ist:
export type HistorieEintrag = unknown

export interface RenderProgress {
  renderId: string
  phase: 'normalisieren' | 'verketten'
  elementIndex: number | null
  elementAnzahl: number | null
  elementId: string | null
  prozent: number                  // 0–100
}
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Typdefinition | – |

Ausgang bei Erfolg: `RenderResult` verengt bei `status === 'erfolg'` typsicher auf `ausgabePfad`,
`gesamtdauer`, `dateigroesse` **und** `historieEintrag` (Inhalt ID/Datum/Pfad/Dauer/Größe, s.
Invarianten – exakte Feldstruktur noch offen, s. STOPP-Block); `RenderProgress` trägt keine
Endzustände.
Ausgang bei Fehler: entfällt.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Genau **ein** terminaler Ausgang je Lauf, diskriminiert über `status` ∈ { `erfolg`, `fehler`,
  `abgebrochen` }. Alle drei tragen die `renderId`." (TK 9.2.3)
- „Bei `fehler` und `abgebrochen` entsteht **keine** neue Ausgabedatei und **kein** Historie-Eintrag; eine
  **bereits vorhandene Datei gleichen Namens bleibt unversehrt** (9.2.6); der
  Arbeitsbereich T1 ist in beiden Fällen aufgeräumt." (TK 9.2.3)
- „**Keine** Restzeit-Schätzung – bei `ffmpeg` unzuverlässig." (TK 9.2.7)
- „Der Fortschrittskanal trägt **keinen** Endzustand. Erfolg, Fehler und Abbruch kommen
  **ausschließlich** über das `RenderResult`." (TK 9.2.7)
- „`historieEintrag` | ID, Datum, Pfad, Dauer, Größe → von der Auftragsverwaltung ins Protokoll Q3
  geschrieben (9.3)" (TK 9.2.3)
- „`RenderResult` bestimmt den terminalen Auftrags-`status` (erfolg/fehlgeschlagen/abgebrochen) und
  liefert bei Erfolg die reichen Nutzdaten (Pfad, Größe, Dauer, Historie-Eintrag)." (TK 9.3.6)

## Fehlerpfade (vollständig)
Entfällt (Typdefinition; `fehlercode` referenziert den Fehlercode-Typ aus M1-10, hier als `string`
platzhalterhaft, präzisiert sobald M1-10 existiert – Reihenfolge beachten, s. Abhängigkeiten).

## Nicht selbst entscheiden – STOPP und fragen
- Ob `fehlercode` in `RenderResult` bereits hier auf die konkrete Fehlercode-Union aus M1-10
  verweist oder als `string` bleibt, bis M1-10 abgeschlossen ist – falls die Bearbeitungsreihenfolge
  das nicht zulässt, `string` verwenden und in M1-10 nachschärfen, nicht raten.
- **Exakte Struktur von `HistorieEintrag`:** TK 9.2.3 nennt nur die Inhalte „ID, Datum, Pfad, Dauer,
  Größe", TK 9.3.6 bestätigt sie sinngemäß als „Pfad, Größe, Dauer, Historie-Eintrag", legt aber
  weder Feldnamen/Typen fest noch, ob `ID` hier die `auftragId` ist oder eine eigene ID, und ob
  `render-service` das Objekt bereits vollständig befüllt oder der `auftrags-manager` beim
  Schreiben nach Q3 (`protokoll.json`, 9.3) `auftragId`/Datum erst ergänzt. **Nicht raten** –
  nachfragen, bevor M2 (Q3-Mapping) darauf aufbaut.

## Definition of Done
- [ ] `RenderResult` (drei diskriminierte Varianten), `RenderProgress` und der `HistorieEintrag`-
      Platzhalter exakt wie oben
- [ ] TypeScript verengt bei `status`-Diskriminierung nachweislich korrekt (inkl. `historieEintrag`
      nur im `erfolg`-Zweig)
- [ ] Keine Datei außerhalb von `src/shared/contracts/render-result.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1, M1-05
- Blockiert: M2-Issues (Q3-Protokoll-Mapping), M6-Issues

## Bezug
TK 9.2.3, TK 9.2.7

---

### Issue M1-08: [contracts] ID-Schema (UUID-Generator) definieren

## Ziel (in einem Satz)
Eine einzige, geteilte Funktion erzeugt neue IDs (UUID v4) für alle Entitäten des Systems –
Project, Asset, Aktion, Listenelement, Vorlage, Auftrag –, sodass nirgends ein Zähler oder eine aus
Namen abgeleitete ID entstehen kann.

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/id.ts`
- Vertrag: Technisches Konzept **9.11.4** (Quelle der Wahrheit)
- Prozess/Speicher: geteilt, genutzt von jedem Modul, das neue Entitäten anlegt

## Warum das im Gesamtsystem wichtig ist
Fortlaufende Zähler kollidieren nach Löschen/Neu-Anlegen und beim Duplizieren von Projekten
(`dupliziereProjekt`, M1); aus Namen abgeleitete IDs brechen bei Umbenennungen alle Referenzen. Gäbe
es keine zentrale `erzeugeId()`-Funktion, würde vermutlich jedes Modul (media-service,
project-store, vorlagen-store, auftrags-manager) sein eigenes ID-Schema erfinden – mit dem Risiko,
dass eines davon (z. B. ein inkrementeller Zähler „zur Einfachheit") die hier festgelegte Invariante
unbemerkt verletzt.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/id.ts
export function erzeugeId(): string
// liefert eine UUID v4 (z. B. via crypto.randomUUID() – in Electron Main UND Renderer verfügbar)
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | kein Eingang | – |

Ausgang bei Erfolg: eine syntaktisch gültige UUID v4, garantiert eindeutig (kryptographischer
Zufall, keine Kollisionsprüfung nötig).
Ausgang bei Fehler: entfällt (kann nicht regulär fehlschlagen).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Alle IDs sind UUIDs** – `Project`, `Asset`, `Aktion`, `Listenelement`, `Vorlage`, `Auftrag`.
  **Keine** fortlaufenden Zähler: die kollidieren nach Löschen/Neu-Anlegen und beim Duplizieren von
  Projekten. **Keine** aus Namen abgeleiteten IDs: ein Umbenennen darf niemals Referenzen brechen."
  (TK 9.11.4)
- „**IDs werden nie wiederverwendet**, auch nicht nach dem Löschen." (TK 9.11.4)

## Fehlerpfade (vollständig)
Entfällt.

## Nicht selbst entscheiden – STOPP und fragen
- Ob `crypto.randomUUID()` (Node ≥ 14.17 / moderne Browser, in Electron in beiden Prozessen
  verfügbar) genügt, oder ob aus Kompatibilitätsgründen eine Bibliothek wie `uuid` nötig ist – falls
  die Ziel-Node-/Electron-Version das nicht sicher abdeckt, klären statt anzunehmen.

## Definition of Done
- [ ] `erzeugeId()` liefert eine gültige UUID v4 (Regex-Test)
- [ ] Zwei aufeinanderfolgende Aufrufe liefern unterschiedliche Werte
- [ ] Funktion ist sowohl aus `src/main/**` als auch aus `src/renderer/**` aufrufbar (kein
      Main-only-API wie `require('crypto')` ohne Renderer-Äquivalent)
- [ ] Keine Datei außerhalb von `src/shared/contracts/id.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1
- Blockiert: alle M1-project-store-Issues, M2–M7-Issues, die neue Entitäten anlegen

## Bezug
TK 9.11.4

---

### Issue M1-09: [contracts] Projektweite Konstanten definieren

## Ziel (in einem Satz)
Die fünf projektweiten Konstanten (Standard-Anzeigedauer, Dauer-Bereich, Sicherheitsabstand,
Format-Whitelist-Referenz, aktuelle `schemaVersion`) liegen gebündelt an einer einzigen Stelle.

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/konstanten.ts`
- Vertrag: Technisches Konzept **9.11.4** (Quelle der Wahrheit)
- Prozess/Speicher: geteilt

## Warum das im Gesamtsystem wichtig ist
Die Dauer-Grenzen (10–45 s) werden an mindestens drei Stellen gebraucht: `project-store`
(`setzeDauer`-Validierung, M1), `composer` (UI-Regler-Grenzen, M5) und `template-canvas`
(Standbild-Aushaltedauer, M4). Stünde die `45` an jeder Stelle als Literal, würde eine spätere
Änderung des Bereichs (z. B. auf 60 s) mit hoher Wahrscheinlichkeit eine der drei Stellen
übersehen – genau die Art von Drift, die TK 9.11.4 durch „Konstanten an EINER Stelle" ausschließen
will.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/konstanten.ts
export const STANDARD_ANZEIGEDAUER_SEKUNDEN = 10
export const DAUER_BEREICH = { min: 10, max: 45 } as const
export const SICHERHEITSABSTAND_PX = { horizontal: 96, vertikal: 54 } as const
// Die Schema-Version, auf die `project.json` und `config.json` beim Schreiben gebracht werden.
// EINE zentrale Stelle – sie wird von öffneProjekt (M1-22), schreibeProjekt (M1-34) und
// migriereProjekt (M1-36) gelesen; drei eigene Kopien würden unweigerlich auseinanderlaufen.
export const AKTUELLE_SCHEMA_VERSION = 1
// „Aktuelle schemaVersion | 1 | wird von öffneProjekt, schreibeProjekt und der Migration
//  gelesen (9.5.5) – eine Stelle, sonst laufen drei Kopien auseinander" (TK 9.11.4, wörtlich)
export { FORMAT_WHITELIST } from '../asset' // Re-Export aus M1-01 – hier NICHT dupliziert
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Konstanten | – |

Ausgang bei Erfolg: alle fünf Konstanten sind aus einer Datei importierbar.
Ausgang bei Fehler: entfällt.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
```
| Konstante | Wert | Bezug |
|---|---|---|
| Standard-Anzeigedauer | 10 s | Vorbelegung für Bild/Segment und Aktion.standardDauer |
| Dauer-Bereich | 10–45 s | Validierung in setzeDauer (9.5.2) |
| Sicherheitsabstand | 96 / 54 px | im 1920×1080-Rahmen (9.10.5, 9.11.2) |
| Format-Whitelist | MP4 / JPG, PNG, WebP | Dialog UND Import-Prüfung (9.4.2) |
```
(TK 9.11.4, wörtlich übernommen)
- „Konstanten in `contracts/types` (an *einer* Stelle, nicht verstreut)." (TK 9.11.4)

## Fehlerpfade (vollständig)
Entfällt.

## Nicht selbst entscheiden – STOPP und fragen
- Keine offenen Punkte – alle fünf Werte sind in TK 9.11.4 eindeutig festgelegt. Falls ein
  späteres Modul einen abweichenden Wert zu brauchen scheint (z. B. eine andere Dauer-Obergrenze
  für einen Spezialfall): das ist ein Zeichen, dass die Planung erneut geprüft werden muss – nicht
  selbst einen zweiten Wert einführen.

## Definition of Done
- [ ] Alle fünf Konstanten exakt wie oben; `FORMAT_WHITELIST` ist ein echter
      `export { FORMAT_WHITELIST } from …`-Re-Export aus M1-01, nicht dupliziert
- [ ] Keine dieser Zahlen taucht als Literal in einer anderen Datei des Projekts auf (Grep-Probe)
- [ ] Keine Datei außerhalb von `src/shared/contracts/konstanten.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Ordnerstruktur/tsconfig für `src/shared/contracts`), M1-01 (Format-Whitelist-Re-Export)
- Blockiert: M1-project-store-Issues (setzeDauer), M4/M5-Issues

## Bezug
TK 9.11.4

---

### Issue M1-10: [contracts] Fachliche Fehlercode-Unionen und generischen Fehlercode-Typ zusammenführen

## Ziel (in einem Satz)
Der in M0 (#12) begonnene `Fehlercode`-Typ wird um die Struktur erweitert, in die spätere
Module (media-service, export-service, vorlagen-store, …) ihre fachlichen Codes einhängen, ohne den
generischen Kern zu duplizieren.

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/ergebnis.ts` (Erweiterung der in #12 angelegten Datei)
- Vertrag: Technisches Konzept **9.1.1** Punkt 3 (Quelle der Wahrheit)
- Prozess/Speicher: geteilt, Grundlage jeder Fehlerbehandlung

## Warum das im Gesamtsystem wichtig ist
#12 hat bewusst nur `Ergebnis<T>` und die drei generischen Codes definiert, um nicht mit den
Domänentypen zu kollidieren (Grenze M0↔M1). **M1-10 erweitert diese Definition, ersetzt sie
nicht:** #12 bleibt die Quelle für `Ergebnis<T>` und `GenerischerFehlercode`; M1-10 fügt in
derselben Datei den zweiten Typparameter `F` hinzu, über den M3 (media-service:
`datei_nicht_gefunden`, `format_nicht_unterstuetzt`, …), M4 (vorlagen-store:
`vorlage_referenziert`, …) und M6 (export-service: `datei_zu_gross_fat32`, …) ihre jeweiligen
fachlichen Fehlercode-Unionen einhängen, ohne die generischen Codes je Modul erneut aufzuzählen.
Ohne dieses Muster würde jedes Modul entweder eine eigene, unverbundene Fehlercode-Union anlegen
(der Aufrufer könnte dann nicht mehr erschöpfend über *alle* möglichen Codes eines Aufrufs
schalten) oder in Versuchung geraten, `Fehlercode` direkt und unstrukturiert in M0 zu erweitern.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/ergebnis.ts (Ergänzung zu #12)
export type GenerischerFehlercode = 'ungueltige_eingabe' | 'nicht_gefunden' | 'unbekannter_fehler'

// Fachliche Module deklarieren ihre eigene Union in ihrer eigenen Datei, z. B.:
//   export type MediaFehlercode = 'datei_nicht_gefunden' | 'format_nicht_unterstuetzt' | ...
// und re-exportieren sie hier NICHT automatisch – der Aufrufer einer bestimmten Operation
// importiert die konkrete Fehlercode-Union der jeweiligen Operation direkt, z. B.
// `Ergebnis<Asset, MediaFehlercode | GenerischerFehlercode>`.

// Ergebnis<T> wird daher um einen optionalen zweiten Typparameter erweitert (Default = GenerischerFehlercode):
export type Ergebnis<T, F extends string = GenerischerFehlercode> =
  | { ok: true; wert: T }
  | { ok: false; fehler: { code: F | GenerischerFehlercode; meldung: string } }
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Typdefinition | – |

Ausgang bei Erfolg: Ein Modul wie `media-service` (M3) kann
`Ergebnis<Asset, MediaFehlercode>` schreiben und bekommt beim Typecheck exakt die Vereinigung aus
seinen eigenen Codes **und** den drei generischen – nicht mehr, nicht weniger.
Ausgang bei Fehler: entfällt.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4,
  9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine
  rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3)
- Diese Erweiterung darf die bestehende Signatur aus #12 (`Ergebnis<T>` ohne zweiten
  Typparameter, Default-Fall) nicht brechen – bestehender Code, der `Ergebnis<T>` einparametrig
  nutzt, muss weiter kompilieren (Rückwärtskompatibilität durch den Default-Typparameter).
- **Warum der `F`-Parameter gilt (nicht: jedes Modul schreibt seine eigene vollständige Union von
  Hand):** Nur so bleibt der Fehlercode am Aufrufer **typisiert** sichtbar, ohne dass jedes Modul
  die vollständige Union (generisch + fachlich) selbst pflegen muss. M3/M4/M6 folgen demselben
  Muster (`Ergebnis<T, ModulFehlercode>`); eine spätere Umstellung auf von Hand geschriebene
  Vollunionen wäre dann teuer, weil sie alle drei Module gleichzeitig träfe.

## Fehlerpfade (vollständig)
Entfällt (Typ-Infrastruktur).

## Nicht selbst entscheiden – STOPP und fragen
- Keine offenen Punkte – der zweite Typparameter (`F`) ist die verbindliche Signatur (s. o.).

## Definition of Done
- [ ] `GenerischerFehlercode` und die erweiterte `Ergebnis<T, F>`-Signatur existieren
- [ ] Bestehender Code aus #12, der `Ergebnis<SomeType>` (ohne zweiten Parameter) nutzt, kompiliert
      unverändert weiter
- [ ] Ein Test-Fall mit einer Beispiel-Fachunion (`type TestFehlercode = 'x' | 'y'`) zeigt, dass
      `Ergebnis<string, TestFehlercode>['fehler']['code']` sowohl `'x'`/`'y'` als auch die drei
      generischen Codes zulässt und nichts anderes
- [ ] Keine Datei außerhalb von `src/shared/contracts/ergebnis.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #12 (definiert `Ergebnis<T>` + `GenerischerFehlercode`, die hier um den
  `F`-Parameter erweitert werden)
- Blockiert: M1-11 (`ipc-gateway`), M3/M4/M6-Fehlercode-Issues

## Bezug
TK 9.1.1 Punkt 3, TK 9.4.9, TK 9.6.4, TK 9.12.1

---

### IPC-Vertrag (`ipc-gateway`/`ipc-client`)

---

### Issue M1-11: [ipc] ipc-gateway Kanal-Wrapper mit Validierung und Ergebnis-Hülle bauen

## Ziel (in einem Satz)
Eine Main-seitige Registrierungsfunktion sorgt dafür, dass jeder IPC-Handler seine Nutzlast prüft,
niemals eine rohe Exception über die Prozessgrenze wirft und immer die `Ergebnis<T>`-Hülle
zurückgibt.

## Modul & Datei
- Modul: `ipc-gateway` (Main)
- Datei: `src/main/ipc-gateway/registriere-handler.ts`
- Vertrag: Technisches Konzept **9.1.1** (Quelle der Wahrheit)
- Prozess/Speicher: geteilt genutzt von jedem Main-Modul mit IPC-Operationen (M2–M7)

## Warum das im Gesamtsystem wichtig ist
Dies ist die **einzige** Stelle, an der aus einer Main-seitigen Funktion (die intern durchaus
werfen darf) ein IPC-Handler wird, der garantiert die Hülle einhält. Ohne diesen zentralen Wrapper
müsste **jedes** der über 50 Main-seitigen Operationen aus M2–M7 selbst ein `try/catch` um sich
bauen – mit dem Risiko, dass eine davon es vergisst und eine rohe Exception über
`ipcRenderer.invoke` verschickt, die beim Renderer nur noch als Text ankommt (TK 9.1.1: „Fehlerklasse
und eigene Felder wie `code` sind verloren – übrig ist Text").

## Signatur (verbindlich – NICHT ändern)
```ts
// src/main/ipc-gateway/registriere-handler.ts
export function registriereHandler<T, F extends string>(
  kanal: string,
  validiere: (nutzlast: unknown) => Ergebnis<unknown, 'ungueltige_eingabe'> | { ok: true; wert: unknown },
  ausfuehren: (validierteNutzlast: unknown) => Promise<Ergebnis<T, F>>,
): void
// registriert einen ipcMain.handle(kanal, ...)-Listener, der:
//   1. validiere() aufruft; bei ok:false → sofort Ergebnis<T,F> mit code 'ungueltige_eingabe' zurück,
//      OHNE ausfuehren() aufzurufen (keine Wirkung auf Daten)
//   2. ausfuehren() in try/catch aufruft; jede uncaught Exception → Ergebnis<T,F> mit
//      code 'unbekannter_fehler', Exception intern geloggt, KEIN Stacktrace im Rückgabewert
//   3. das Ergebnis von ausfuehren() unverändert zurückgibt
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `kanal` | Kanalname `<modul>:<operation>` | MUSS aus der Kanal-Namens-Registry (M1-13) stammen |
| `validiere` | modulspezifische Nutzlast-Prüfung | MUSS **vor** jeder Datenwirkung laufen |
| `ausfuehren` | die eigentliche Fachoperation | darf intern werfen – wird vom Gateway gefangen |

Ausgang bei Erfolg: `Ergebnis<T,F>` mit `ok:true`.
Ausgang bei Fehler: `Ergebnis<T,F>` mit `ok:false`, entweder `ungueltige_eingabe` (Validierung) oder
dem von `ausfuehren` gemeldeten Fachcode oder `unbekannter_fehler` (unerwartete Exception).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige
  Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf
  D1 niemals beschädigen." (TK 9.1.1, Punkt 6)
- „**Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code." (TK 9.1.1, Punkt 7)
- „**Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler` (intern
  protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche."
  (TK 9.1.1, Punkt 8)
- „`import`, `loeschen`, `render` und `export` werden damit **nicht** als direkte Request/Response-
  Operationen aufgerufen, sondern über `reiheEin` eingereiht; ihr Fach-Ergebnis (`erfolg`/
  `fehlgeschlagen` samt Fachfehlercode) kommt über den Auftrags-Zustand." (TK 9.3.4) – dieser Wrapper
  registriert **Instant**-Operationen; Auftrags-Kanäle wie `reiheEin` selbst nutzen ihn ebenfalls (ihr
  `T` ist `{auftragId:string}`), aber die **Fach**-Operationen (import/loeschen/render/export)
  registrieren sich NICHT einzeln über diesen Wrapper als eigene Kanäle.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `validiere` liefert `ok:false` | `ungueltige_eingabe` | `ausfuehren` wird nicht aufgerufen, keine Datenwirkung |
| `ausfuehren` wirft eine Exception | `unbekannter_fehler` | Exception wird intern geloggt (z. B. `console.error`), kein Stacktrace im Rückgabewert |
| `ausfuehren` liefert regulär `ok:false` mit Fachcode | der von `ausfuehren` gelieferte Code | unverändert durchgereicht |

## Nicht selbst entscheiden – STOPP und fragen
- Wie „intern protokolliert" (TK 9.1.1, Punkt 8) konkret aussieht – reines `console.error` genügt
  für v1 vermutlich, aber falls das Projekt später ein strukturiertes Logging erwartet, das jetzt
  schon vorwegzunehmen wäre über-engineered; im Zweifel einfache Lösung wählen und explizit als
  vorläufig kennzeichnen, nicht schweigend eine Logging-Bibliothek einführen.

## Definition of Done
- [ ] `registriereHandler` fängt jede Exception aus `ausfuehren` und liefert `unbekannter_fehler`
- [ ] Ein Validierungsfehschlag ruft `ausfuehren` nachweislich **nicht** auf (Test mit Spy)
- [ ] Kein Stacktrace/keine rohe Fehlermeldung landet im zurückgegebenen `Ergebnis`
- [ ] Keine Datei außerhalb von `src/main/ipc-gateway/registriere-handler.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Ordnerstruktur/tsconfig für `src/main`), #3 (Main-Bootstrap, in dem
  `ipcMain.handle` registriert wird), #12 (`Ergebnis<T>`-Basistyp), M1-10 (`Ergebnis<T,F>` mit
  Fehlercode-Parameter)
- Blockiert: M1-13 (Kanal-Registry), praktisch jedes M2–M7-Main-Issue

## Bezug
TK 9.1.1

---

### Issue M1-12: [ipc] ipc-client typisierten Invoke-Wrapper bauen

## Ziel (in einem Satz)
Eine Renderer-seitige Funktion ruft einen benannten IPC-Kanal typisiert auf und liefert die
`Ergebnis<T>`-Hülle unverändert an den Aufrufer zurück – ohne die generische `window.api.invoke`
aus der Preload-Bridge (#4) direkt zu berühren.

## Modul & Datei
- Modul: `ipc-client` (Renderer)
- Datei: `src/renderer/ipc-client/rufe-auf.ts`
- Vertrag: Technisches Konzept **9.1.1** (Quelle der Wahrheit)
- Prozess/Speicher: geteilt genutzt von jedem Renderer-Modul (M5–M7)

## Warum das im Gesamtsystem wichtig ist
Ohne diese Schicht müsste jedes Renderer-Modul (`composer`, `action-editor`, …) direkt
`window.api.invoke('media:importMedium', {...})` mit `unknown`-Rückgabewert aufrufen und selbst
casten – mit demselben Risiko wie in #4 beschrieben: die Versuchung, die Hülle „mal eben" zu
vereinfachen, entsteht an **jeder** Aufrufstelle neu, statt an einer einzigen kontrollierten Stelle.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/renderer/ipc-client/rufe-auf.ts
export async function rufeAuf<T, F extends string = GenerischerFehlercode>(
  kanal: string,
  nutzlast?: unknown,
): Promise<Ergebnis<T, F>>
// delegiert an window.api.invoke(kanal, nutzlast) und castet NUR den Typ (keine Laufzeit-
// Transformation) – die Struktur, die der Main zurückgibt, MUSS bereits Ergebnis<T,F> sein
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `kanal` | Kanalname | MUSS aus der Kanal-Namens-Registry (M1-13) stammen |
| `nutzlast` | Aufruf-Argumente | wird unverändert an `window.api.invoke` weitergereicht |

Ausgang bei Erfolg/Fehler: exakt das, was der Main über `ipc-gateway` (M1-11) zurückgegeben hat –
`rufeAuf` transformiert **nichts**, es typisiert nur.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Das Preload darf die Hülle NICHT ‚vereinfachen'." (Übergabe-Prompt 8b, sinngemäß auf `ipc-client`
  übertragen – dieselbe Regel gilt eine Ebene höher)
- „Ausschreiben statt andeuten. In **allen** Operations-Signaturen von Abschnitt 9 steht die Hülle
  **explizit** (`→ Ergebnis<Asset>`), nicht nur die Nutzlast. Wer nur seine eigene Tabelle liest,
  sieht damit sofort die richtige Rückgabe." (TK 9.1.1) – `rufeAuf` muss daher generisch über
  `T`/`F` bleiben, nicht für jede Operation eine eigene Wrapper-Funktion mit stillschweigend
  anderem Rückgabemuster erzeugen.

## Fehlerpfade (vollständig)
Entfällt – reiner Typ-Wrapper ohne eigene Fehlerlogik; Fehler kommen unverändert vom Main.

## Nicht selbst entscheiden – STOPP und fragen
- Ob bei einem IPC-Transportfehler (z. B. Preload nicht verfügbar, extrem unwahrscheinlich, aber
  denkbar bei einem Bug in #3/#4) `rufeAuf` selbst einen synthetischen `unbekannter_fehler`
  erzeugen soll, oder ob das als „kann nicht passieren, wenn #3/#4 korrekt sind" unbehandelt bleibt
  – falls unklar, zur Diskussion stellen statt eine stille Annahme zu treffen.

## Definition of Done
- [ ] `rufeAuf<T,F>` liefert die Main-Antwort unverändert, nur typisiert
- [ ] Kein Modul im Renderer importiert `window.api` direkt (Grep-Probe) – alles läuft über
      `rufeAuf`
- [ ] Keine Datei außerhalb von `src/renderer/ipc-client/rufe-auf.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Ordnerstruktur/tsconfig für `src/renderer`), #4 (Preload-Bridge liefert
  `window.api.invoke`), #12 (`Ergebnis<T>`-Basistyp), M1-10 (`Ergebnis<T,F>` mit
  Fehlercode-Parameter)
- Blockiert: M1-13, praktisch jedes M5–M7-Renderer-Issue

## Bezug
TK 9.1.1

---

### Issue M1-13: [ipc] Kanal-Namens-Registry anlegen

## Ziel (in einem Satz)
Eine einzige, geteilte Liste aller IPC-Kanal- und Ereignisnamen existiert, sodass kein Modul einen
Kanalnamen frei erfindet oder sich zwischen Main und Renderer vertippt.

## Modul & Datei
- Modul: `ipc-gateway`/`ipc-client` (geteilt – die Registry selbst liegt in `contracts`)
- Datei: `src/shared/contracts/kanaele.ts`
- Vertrag: Technisches Konzept **9.1.1** Punkt 4 (Quelle der Wahrheit)
- Prozess/Speicher: geteilt

## Warum das im Gesamtsystem wichtig ist
Kanalnamen sind reine Strings – ohne eine zentrale, typisierte Liste kann sich Main
(`ipcMain.handle('medai:importMedium', ...)`, Tippfehler) und Renderer
(`rufeAuf('media:importMedium', ...)`) unbemerkt auseinanderentwickeln: kein Compile-Fehler, nur
ein IPC-Aufruf, der zur Laufzeit nie eine Antwort bekommt. Diese Registry macht Kanalnamen zu einem
Typ statt zu einem String, den jedes Modul neu abtippt.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/kanaele.ts
// Wird von JEDEM M2–M7-Issue ergänzt, das einen neuen Kanal/ein neues Ereignis einführt.
// Muster: '<modul>:<operation>' für Aufrufe, '<modul>:<ereignis>' für Ereignisse.
// Struktur ENTSCHIEDEN: verschachtelt (KANAELE.<modul>.<operation>), nicht flach – liest sich
// näher am aufrufenden Modul.
export const KANAELE = {
  // Beispiel-Einträge, tatsächliche Liste wächst mit M2-M7:
  // media: { importMedium: 'media:importMedium', ... },
  // auftrag: { reiheEin: 'auftrag:reiheEin', geaendert: 'auftrag:geaendert' },
} as const
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Konstanten-Registry | – |

Ausgang bei Erfolg: `KANAELE.<modul>.<operation>` ist der einzige Ort, aus dem sowohl
`ipc-gateway`-Registrierungen als auch `ipc-client`-Aufrufe ihren Kanalnamen beziehen.
Ausgang bei Fehler: entfällt.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`,
  `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B.
  `queue:geaendert`, `render:fortschritt`. Damit erfindet niemand eigene Kanalnamen." (TK 9.1.1,
  Punkt 4)

## Fehlerpfade (vollständig)
Entfällt.

## Nicht selbst entscheiden – STOPP und fragen
- Diese Datei wird von M2–M7 **iterativ ergänzt** – jedes Issue, das einen Kanal einführt, MUSS ihn
  hier eintragen, nicht als lokale Stringkonstante im eigenen Modul. Ein Agent, der versucht ist,
  „nur schnell" einen Kanalnamen direkt zu verwenden: stoppen und hier eintragen.

## Definition of Done
- [ ] `KANAELE`-Grundgerüst existiert (kann zunächst leer/minimal sein, wächst mit M2–M7),
      verschachtelt nach `<modul>.<operation>`
- [ ] Keine Datei außerhalb von `src/shared/contracts/kanaele.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Ordnerstruktur/tsconfig für `src/shared/contracts`), M1-11 (`ipc-gateway`
  registriert Kanäle aus dieser Registry), M1-12 (`ipc-client` ruft Kanäle aus dieser Registry auf)
- Blockiert: alle M2–M7-Issues mit IPC-Kanälen

**Blockiert (Prüfhinweis):** M1-11 und M1-12 MÜSSEN die Registry **verwenden** (kein
String-Literal an der Aufrufstelle) – die Prüfung dieser Vorgabe gehört in die jeweiligen Issues
(M1-11/M1-12), nicht hierher, da sie sonst eine Änderung an fremden Dateien verlangen würde.

## Bezug
TK 9.1.1 Punkt 4

---

### config-store [D3]

---

### Issue M1-14: [config-store] leseKonfig implementieren

## Ziel (in einem Satz)
Eine Instant-Operation liefert die aktuelle App-Konfiguration (aktives Projekt, letztes
Export-Ziel, UI-Voreinstellungen, gebündelte Marke) aus `config.json`.

## Modul & Datei
- Modul: `config-store` [D3] (Main)
- Datei: `src/main/config-store/lese-konfig.ts`
- Vertrag: Technisches Konzept **9.5.6** (Quelle der Wahrheit)
- Prozess/Speicher: D3

## Warum das im Gesamtsystem wichtig ist
`leseKonfig` ist der Einstieg für die Sitzungswiederherstellung (FA-15): `app-shell` (M7) ruft sie
beim Start auf, um zu wissen, welches Projekt zuletzt aktiv war. Liefert sie beim ersten Start (noch
keine `config.json` vorhanden) einen Fehler statt sinnvoller Defaults, kann die App nicht wie
gefordert „ohne Absturz" in den Zustand „kein aktives Projekt" fallen (TK 9.5.6).

## Signatur (verbindlich – NICHT ändern)
```ts
export async function leseKonfig(): Promise<Ergebnis<AppKonfig>>
// AppKonfig: { aktivesProjektId: string | null, letztesExportZiel: string | null,
//              uiVoreinstellungen: Record<string, unknown>, marke: Marke }
// existiert config.json nicht (erster Start) → liefert Ergebnis<AppKonfig> mit sinnvollen
// Defaults (aktivesProjektId: null, ...), OHNE Fehler
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | liest von `<Datenort>/config.json` (S5) | – |

Ausgang bei Erfolg: `Ergebnis<AppKonfig>` mit `ok:true`.
Ausgang bei Fehler: `speicher_fehler` nur bei tatsächlich **beschädigter** (nicht fehlender)
`config.json`, deren `.bak` (M1-19) ebenfalls nicht lesbar ist.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Sitzungswiederherstellung (FA-15):** beim Start das zuletzt aktive Projekt laden; **fehlt** es
  (extern gelöscht) → sanfter Rückfall auf ‚kein aktives Projekt / Projektliste', **kein**
  Absturz." (TK 9.5.6) – gilt analog für eine fehlende `config.json` selbst.
- „Ist `project.json` beim Laden defekt → aus `.bak` wiederherstellen; ist auch das defekt →
  **Fehler melden**, **nicht** leer/verlustbehaftet weiterstarten." (TK 9.5.4) – gilt laut TK 9.5.6
  („Gleiche Schreib-Invarianten wie 9.5.4") analog für `config.json`/`config.json.bak`.
- Marke ist **read-only** Teil der Konfiguration (TK 9.5.6).

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `config.json` existiert nicht | – (kein Fehler) | Defaults zurückgeben |
| `config.json` beschädigt, `.bak` **intakt** | – (kein Fehler) | aus `.bak` wiederherstellen, Ergebnis liefern wie bei intakter Datei |
| `config.json` beschädigt, `.bak` ebenfalls beschädigt/fehlt | `speicher_fehler` | sichtbarer Fehler, kein stiller Leerzustand |

## Nicht selbst entscheiden – STOPP und fragen
- Exakte Struktur von `uiVoreinstellungen` (freies `Record<string,unknown>` vs. typisierte Felder)
  – abhängig davon, was `app-shell`/`composer` (M5/M7) tatsächlich als UI-Voreinstellung brauchen;
  diese sind noch nicht ausgeschrieben, daher hier bewusst offen lassen und nicht vorwegnehmen.

## Definition of Done
- [ ] `leseKonfig()` liefert bei fehlender `config.json` Defaults ohne Fehler
- [ ] `leseKonfig()` liefert bei beschädigter Datei mit intaktem `.bak` das aus `.bak`
      wiederhergestellte Ergebnis, **ohne** Fehler
- [ ] `leseKonfig()` liefert bei beschädigter Datei + beschädigtem `.bak` `speicher_fehler`
- [ ] Keine Datei außerhalb von `src/main/config-store/lese-konfig.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Grundgerüst), #5 (Einzel-Instanz, Voraussetzung für unkoordinierte
  Schreibzugriffe), #12 (Projektstruktur/Build), M1-19 (liefert das atomare Schreiben inkl. `.bak`,
  das diese Wiederherstellung erst ermöglicht)
- Blockiert: M7-Issues (app-shell Sitzungswiederherstellung)

## Bezug
TK 9.5.6

---

### Issue M1-15: [config-store] setzeAktivesProjekt implementieren

## Ziel (in einem Satz)
Eine Instant-Operation setzt die ID des aktiven Projekts in `config.json`, damit die App beim
nächsten Start automatisch dort weitermacht.

## Modul & Datei
- Modul: `config-store` [D3] (Main)
- Datei: `src/main/config-store/setze-aktives-projekt.ts`
- Vertrag: Technisches Konzept **9.5.6** (Quelle der Wahrheit)
- Prozess/Speicher: D3

## Warum das im Gesamtsystem wichtig ist
Dies ist die Gegenstelle zu `öffneProjekt` (M1-22, `project-store`): Öffnet der Nutzer ein Projekt,
muss `config-store` das vermerken, sonst startet die App beim nächsten Mal wieder ohne aktives
Projekt – ein stiller Bruch von FA-15, der erst beim nächsten Neustart auffällt und dann wie
Datenverlust wirkt, obwohl das Projekt selbst intakt ist.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function setzeAktivesProjekt(projektId: string): Promise<Ergebnis<void>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `projektId` | ID des zu merkenden Projekts | nicht leer; Main validiert **nicht**, ob das Projekt tatsächlich existiert (das ist Sache des Aufrufers, i. d. R. direkt nach erfolgreichem `öffneProjekt`) |

Ausgang bei Erfolg: `Ergebnis<void>` – bedeutet „im Speicher übernommen", **nicht** zwingend „schon
auf Platte" (Schreiben folgt derselben Auto-Speichern-Logik wie `project-store`, s. M1-19).
Ausgang bei Fehler: `ungueltige_eingabe` bei leerem/fehlendem `projektId`.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`Ergebnis<void>` […] das gelungene `ok` **ist** die Information." (TK 9.1.1, Punkt 2)
- „**Instant-Op vs. Speichern getrennt:** Eine Instant-Operation […] validiert und wendet **im
  Speicher** an, *bevor* sie ‚ok' meldet – ihr Erfolg bedeutet ‚gültig übernommen', **nicht**
  ‚schon auf Platte'." (TK 9.5.4, sinngemäß auch für `config-store` geltend)

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `projektId` leer/kein String | `ungueltige_eingabe` | keine Wirkung |

## Nicht selbst entscheiden – STOPP und fragen
- **Synchron oder entprellt?** Dieses Issue schreibt sinngemäß über „derselben Auto-Speichern-Logik
  wie `project-store`" (M1-19 schreibt tatsächlich physisch). Für `project-store` gibt es ein
  eigenes Entprellungs-Issue (3–5 s, Sofort-Flush, Fehler-Ereignis); für `config-store` **fehlt**
  ein solches – M1-19 wird stattdessen direkt von dieser Operation aufgerufen. Es ist offen, ob
  `config-store` synchron schreibt (dann gehört `speicher_fehler` in die Fehlerpfad-Tabelle dieses
  Issues) oder ob eine fehlende Entprellungs-/Ereignis-Komponente analog zu `project-store` noch
  nachgezogen werden muss – **nicht** selbst festlegen. Die Fehlerpfad-Tabelle oben hängt direkt
  von dieser Entscheidung ab.

## Definition of Done
- [ ] `setzeAktivesProjekt` validiert `projektId` vor jeder Wirkung
- [ ] Rückgabe ist `Ergebnis<void>`, kein `Ergebnis<boolean>`
- [ ] Keine Datei außerhalb von `src/main/config-store/setze-aktives-projekt.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Grundgerüst), #12 (Projektstruktur/Build), M1-19 (liefert `schreibeConfig`,
  über das diese Operation persistiert)
- Blockiert: M1-22 (`öffneProjekt` ruft dies auf), M7-Issues

## Bezug
TK 9.5.6

---

### Issue M1-16: [config-store] setzeExportZiel implementieren

## Ziel (in einem Satz)
Eine Instant-Operation merkt sich den zuletzt gewählten Export-Zielpfad, damit der Export-Dialog
(M6) ihn beim nächsten Mal vorbelegt.

## Modul & Datei
- Modul: `config-store` [D3] (Main)
- Datei: `src/main/config-store/setze-export-ziel.ts`
- Vertrag: Technisches Konzept **9.5.6**, **9.6.5** (Quelle der Wahrheit)
- Prozess/Speicher: D3

## Warum das im Gesamtsystem wichtig ist
Ohne dieses gemerkte Ziel müsste das Studio-Personal bei **jedem** Export erneut den USB-Stick-Pfad
suchen – bei einer Zielgruppe ohne technische Vorkenntnisse (NFA-01) ein wiederkehrender
Stolperstein. Der `export-service` (M6) liest diesen Wert beim Öffnen des Zieldialogs.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function setzeExportZiel(pfad: string): Promise<Ergebnis<void>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `pfad` | absoluter Zielpfad | nicht leer; **keine** Existenzprüfung hier (der Stick kann später gezogen sein – das prüft `export-service` beim tatsächlichen Export, TK 9.6.2) |

Ausgang bei Erfolg: `Ergebnis<void>`.
Ausgang bei Fehler: `ungueltige_eingabe` bei leerem `pfad`.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Das gewählte Ziel merkt sich der `config-store` (`setzeExportZiel`, 9.5.6) und belegt den
  Dialog beim nächsten Mal vor." (TK 9.6.5)

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `pfad` leer/kein String | `ungueltige_eingabe` | keine Wirkung |

## Nicht selbst entscheiden – STOPP und fragen
- **Synchron oder entprellt?** Für `project-store` gibt es ein eigenes Entprellungs-Issue
  (3–5 s, Sofort-Flush, Fehler-Ereignis); für `config-store` **fehlt** ein analoges Issue – M1-19
  wird stattdessen direkt von dieser Operation aufgerufen. Es ist offen, ob `config-store` synchron
  schreibt (dann gehört `speicher_fehler` in die Fehlerpfad-Tabelle dieses Issues) oder ob eine
  fehlende Entprellungs-/Ereignis-Komponente analog zu `project-store` noch nachgezogen werden
  muss – **nicht** selbst festlegen. Die Fehlerpfad-Tabelle oben hängt direkt von dieser
  Entscheidung ab.

## Definition of Done
- [ ] `setzeExportZiel` validiert `pfad` vor jeder Wirkung
- [ ] **Keine** Existenz-/Erreichbarkeitsprüfung des Pfads in dieser Funktion (das ist Sache von
      `export-service`, nicht doppelt hier einbauen)
- [ ] Keine Datei außerhalb von `src/main/config-store/setze-export-ziel.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Grundgerüst), #12 (Projektstruktur/Build), M1-19 (liefert `schreibeConfig`,
  über das diese Operation persistiert)
- Blockiert: M6-Issues (export-service, `wähleExportZiel`)

## Bezug
TK 9.5.6, TK 9.6.5

---

### Issue M1-17: [config-store] leseMarke implementieren

## Ziel (in einem Satz)
Eine Instant-Operation liefert die gebündelte, read-only `Marke` (Palette, Schriften, Logo,
Sicherheitsabstände) für alle Rendering-Module.

## Modul & Datei
- Modul: `config-store` [D3] (Main)
- Datei: `src/main/config-store/lese-marke.ts`
- Vertrag: Technisches Konzept **9.5.6** (Quelle der Wahrheit)
- Prozess/Speicher: D3 (gebündelt, nicht editierbar in v1)

## Warum das im Gesamtsystem wichtig ist
`template-canvas` (M4) braucht die `Marke` bei **jedem** Zeichenaufruf – Farben, Schriften, Logo,
Sicherheitsabstand kommen ausschließlich hierüber. Der `Marke`-Typ gehört zu den M1-Domänentypen
(Übergabe-Prompt Abschnitt 8b) und wird in M1-40 definiert; `leseMarke` liefert daher von Anfang
an den konkreten `Marke`-Typ.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function leseMarke(): Promise<Ergebnis<Marke>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | liest die gebündelte Markenkonfiguration | – |

Ausgang bei Erfolg: das geladene Markenobjekt.
Ausgang bei Fehler: `unbekannter_fehler`, falls die gebündelte Markendatei fehlt (Verpackungsfehler,
sollte durch #7/#8 ausgeschlossen sein – tritt dieser Fehler auf, ist das ein Hinweis auf einen
Verpackungsfehler, nicht auf einen Nutzerfehler).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`leseMarke` | – → `Ergebnis<Marke>` (**nur lesend**)" (TK 9.5.6, Operationstabelle) – Signatur
  und Nur-Lese-Charakter sind damit wörtlich festgelegt.
- „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist
  kein MVP." (TK 9.5.6, TK 9.11.2) – diese Funktion bietet **keine** Schreiboperation.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| gebündelte Markendatei fehlt/beschädigt | `unbekannter_fehler` | intern geloggt (Verpackungsfehler-Hinweis) |

## Nicht selbst entscheiden – STOPP und fragen
- Woher die gebündelte Markendatei stammt (statisches JSON im Bundle vs. TypeScript-Konstante) –
  diese Entscheidung gehört eigentlich zu M1-40 (`Marke`-Typ), wird hier aber schon als Frage
  aufgeworfen, da `leseMarke` etwas laden muss: **nicht** selbst festlegen, sondern mit M1-40
  koordinieren.

## Definition of Done
- [ ] `leseMarke()` liefert das gebündelte Markenobjekt als `Marke`
- [ ] Kein Schreibpfad in dieser Datei (rein lesend)
- [ ] Keine Datei außerhalb von `src/main/config-store/lese-marke.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Grundgerüst), #12 (Projektstruktur/Build), M1-40 (definiert den `Marke`-Typ,
  `src/shared/contracts/marke.ts`, TK 9.11.2 – ohne ihn ist der Rückgabetyp dieser Funktion nicht
  typisierbar)
- Blockiert: M4-Issues (template-canvas)

## Bezug
TK 9.5.6, TK 9.11.2

---

### Issue M1-18: [config-store] setzeUIVoreinstellung implementieren

## Ziel (in einem Satz)
Eine Instant-Operation speichert einen einzelnen UI-Voreinstellungswert (Schlüssel/Wert) in
`config.json`.

## Modul & Datei
- Modul: `config-store` [D3] (Main)
- Datei: `src/main/config-store/setze-ui-voreinstellung.ts`
- Vertrag: Technisches Konzept **9.5.6** (Quelle der Wahrheit)
- Prozess/Speicher: D3

## Warum das im Gesamtsystem wichtig ist
UI-Voreinstellungen (z. B. zuletzt genutzter Reiter, Fenstergröße) sind Teil der
Sitzungswiederherstellung (FA-15: „stellt letztes Export-Ziel und UI-Voreinstellungen wieder her").
Ohne eine generische Schlüssel/Wert-Operation müsste für jede neue UI-Einstellung ein eigenes
Feld + eigene Funktion in `config-store` entstehen – bei einem UI, das sich über M5–M7 noch
entwickelt, eine unnötige Kopplung.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function setzeUIVoreinstellung(schlüssel: string, wert: unknown): Promise<Ergebnis<void>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `schlüssel` | Name der Einstellung | nicht leer |
| `wert` | beliebiger, JSON-serialisierbarer Wert | MUSS JSON.stringify-fähig sein (sonst `ungueltige_eingabe`) |

Ausgang bei Erfolg: `Ergebnis<void>`.
Ausgang bei Fehler: `ungueltige_eingabe` bei leerem Schlüssel oder nicht-serialisierbarem Wert.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**App-Zustand** – aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen." (TK 4, Kategorie B)
- Gleiche Schreib-Invarianten wie M1-19 (atomar, `schemaVersion`).

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `schlüssel` leer | `ungueltige_eingabe` | keine Wirkung |
| `wert` nicht JSON-serialisierbar (z. B. enthält Funktionen/zirkuläre Referenzen) | `ungueltige_eingabe` | keine Wirkung |

## Nicht selbst entscheiden – STOPP und fragen
- Welche konkreten Schlüssel später verwendet werden, entscheiden die jeweiligen M5–M7-Issues –
  das bleibt offen und ist hier nicht zu erraten.
- **Synchron oder entprellt?** Für `project-store` gibt es ein eigenes Entprellungs-Issue
  (3–5 s, Sofort-Flush, Fehler-Ereignis); für `config-store` **fehlt** ein analoges Issue – M1-19
  wird stattdessen direkt von dieser Operation aufgerufen. Es ist offen, ob `config-store` synchron
  schreibt (dann gehört `speicher_fehler` in die Fehlerpfad-Tabelle dieses Issues) oder ob eine
  fehlende Entprellungs-/Ereignis-Komponente analog zu `project-store` noch nachgezogen werden
  muss – **nicht** selbst festlegen. Die Fehlerpfad-Tabelle oben hängt direkt von dieser
  Entscheidung ab.

## Definition of Done
- [ ] `setzeUIVoreinstellung` validiert Schlüssel und Serialisierbarkeit vor jeder Wirkung
- [ ] Ein nicht-serialisierbarer Wert (z. B. `() => {}`) liefert `ungueltige_eingabe`
- [ ] Keine Datei außerhalb von `src/main/config-store/setze-ui-voreinstellung.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Grundgerüst), #12 (Projektstruktur/Build), M1-19 (liefert `schreibeConfig`,
  über das diese Operation persistiert)
- Blockiert: M5–M7-Issues, die UI-Zustand persistieren

## Bezug
TK 4 (Kategorie B), TK 9.5.6

---

### Issue M1-19: [config-store] Atomares Schreiben von config.json mit Backup und schemaVersion

## Ziel (in einem Satz)
Eine gemeinsame, modul-interne Schreibfunktion sorgt dafür, dass jede Änderung an `config.json`
atomar (Temp+Rename), mit `.bak`-Sicherung und `schemaVersion` geschieht – aufgerufen von allen
`config-store`-Schreiboperationen (M1-15, M1-16, M1-18).

## Modul & Datei
- Modul: `config-store` [D3] (Main)
- Datei: `src/main/config-store/schreibe-config.ts`
- Vertrag: Technisches Konzept **9.5.4** (sinngemäß auf `config-store` übertragen), **9.5.5**,
  **9.5.6** (Quelle der Wahrheit)
- Prozess/Speicher: D3

## Warum das im Gesamtsystem wichtig ist
`config.json` trägt das aktive Projekt – ist sie nach einem Absturz mitten im Schreiben
beschädigt, weiß die App beim nächsten Start nicht mehr, welches Projekt zuletzt offen war, und FA-15
(„kein Datenverlust") ist gebrochen, obwohl das Projekt selbst intakt wäre. Diese Funktion ist die
**einzige** Stelle, die tatsächlich auf die Platte schreibt; alle anderen `config-store`-Issues
rufen sie auf, statt selbst `fs.writeFile` aufzurufen.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function schreibeConfig(konfig: AppKonfig): Promise<Ergebnis<void>>
// 1. konfig + aktuelle schemaVersion nach <Datenort>/config.json.tmp schreiben
// 2. fs.rename config.json.tmp -> config.json (atomar, gleiche Partition)
// 3. VORHER (vor Schritt 1): bestehende config.json (falls vorhanden) nach config.json.bak kopieren
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `konfig` | vollständiges `AppKonfig`-Objekt | wird unverändert serialisiert |

Ausgang bei Erfolg: `Ergebnis<void>` – `config.json` ist entweder vollständig neu oder unverändert
(nie halb geschrieben).
Ausgang bei Fehler: `speicher_fehler` bei I/O-Fehlern (Platte voll, Rechte).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Atomar:** Schreiben nach Temp-Datei + Rename (gleiche Partition). `project.json` ist **nie**
  halb geschrieben." (TK 9.5.4, sinngemäß auf `config.json` übertragen)
- „**Ein Backup:** … = letzte heile Version." (TK 9.5.4, sinngemäß)
- „Jede `project.json` und `config.json` trägt eine `schemaVersion`." (TK 9.5.5)
- „Gleiche Schreib-Invarianten wie 9.5.4 (atomar, `schemaVersion`)." (TK 9.5.6, explizit für
  `config-store`)

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| I/O-Fehler beim Schreiben von `.tmp` (Platte voll, Rechte) | `speicher_fehler` | `config.json` bleibt unverändert (Rename fand nie statt) |
| I/O-Fehler beim Rename | `speicher_fehler` | im Normalfall bleibt entweder alte oder neue Datei vollständig bestehen (plattformabhängig, s. „Nicht selbst entscheiden") |

## Nicht selbst entscheiden – STOPP und fragen
- Wie ein Rename-Fehler auf Windows konkret behandelt wird (Windows kennt kein atomares
  Overwrite-Rename wie POSIX; ggf. ist ein Retry oder ein anderer Mechanismus nötig) – dieselbe
  Klasse von Problem wie beim `project-store` (M1-35) und `export-service` (M6); falls dort bereits
  eine Lösung feststeht, dieselbe hier wiederverwenden, sonst gemeinsam klären statt zwei
  unterschiedliche Workarounds für dasselbe Problem zu bauen.
- **Braucht `config-store` eine eigene Schreib-Serialisierung (Mutex/Warteschlange)?** `schreibeConfig`
  schreibt das **komplette** `AppKonfig`-Objekt; laufen zwei Aufrufe (z. B. `setzeAktivesProjekt` und
  `setzeUIVoreinstellung`) kurz hintereinander, überschreibt der zuletzt fertige Vorgang den anderen
  kommentarlos – ein Lost Update ohne jede Meldung, das FA-15 still bricht. Es gibt **nur ein**
  D1-Lock, und das schützt ausschließlich `project.json`:
  „**Lock-Grenze:** Das D1-Lock schützt **nur** `project.json`. Die Auftragsverwaltungs-Speicher
  Q2/Q3 (eigene Dateien, 9.3) haben ihre **eigene** Serialisierung – der `auftrags-manager` hängt
  **nicht** am `project-store`-Lock." (TK 9.5.4)
  Das etablierte Muster im Projekt ist eine **eigene** Serialisierung je Store:
  „**Besitzt** `vorlagen.json` (app-weite Vorlagen-Bibliothek) samt **eigener** Schreib-Serialisierung."
  (TK 9.12.1)
  Ob `config-store` ebenso eine eigene Serialisierung braucht: **nicht selbst entscheiden.**

## Definition of Done
- [ ] Ein Schreibvorgang, der mitten im `.tmp`-Schreiben simuliert abbricht, hinterlässt eine
      unveränderte `config.json`
- [ ] Vor jedem Schreiben wird `.bak` aktualisiert (Test: `.bak` enthält die vorherige Version)
- [ ] `schemaVersion` ist in jeder geschriebenen Datei vorhanden
- [ ] Keine Datei außerhalb von `src/main/config-store/schreibe-config.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Grundgerüst), #5 (Einzel-Instanz, Voraussetzung für unkoordinierte Schreibzugriffe), #12 (Projektstruktur/Build)
- Blockiert: M1-14, M1-15, M1-16, M1-18 (alle rufen `schreibeConfig` bzw. hängen an ihrem
  Wiederherstellungspfad)

## Bezug
TK 9.5.4, TK 9.5.5, TK 9.5.6

---

### project-store [D1]

---

### Issue M1-20: [project-store] D1-Schreib-Lock-Primitive bauen

## Ziel (in einem Satz)
Eine einzige, prozessinterne Sperre serialisiert **alle** Schreibzugriffe auf `project.json`, egal
ob sie von `project-store` selbst oder von `media-service` (delegiert) ausgelöst werden.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/d1-lock.ts`
- Vertrag: Technisches Konzept **9.5.1**, **9.4.1**, **9.4.5**, **9.4.6** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Dies ist **das eine** D1-Schreib-Lock, auf dem die gesamte Konsistenzgarantie des Systems ruht: Es
schließt die TOCTOU-Lücke zwischen „Referenz prüfen" und „Eintrag entfernen" beim Löschen
(TK 9.4.6: „Referenzprüfung und Entfernen im **selben** kritischen Abschnitt"), und es ist der
**einzige** Sperr-Mechanismus für D1 (TK 9.3.5 nennt den `auftrags-manager` als einzigen
Sperr-Mechanismus für die *Auftrags*-Ausführung – das D1-Lock ist eine separate, aber ebenso
einzige Sperre für *Daten*-Konsistenz). Baut ein Agent versehentlich ein zweites Lock (z. B. weil
`media-service` „der Einfachheit halber" selbst sperrt), können zwei Locks sich gegenseitig
umgehen – schlimmer als gar kein Lock, weil es Sicherheit vortäuscht.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
// führt aktion() garantiert seriell aus: ruft ein zweiter Aufrufer mitD1Lock() auf, während
// der erste noch läuft, wartet er, bis der erste fertig ist (FIFO-Warteschlange innerhalb
// des Prozesses, KEINE Datei-/OS-Sperre)
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `aktion` | die zu sperrende kritische Funktion | darf selbst nicht erneut `mitD1Lock` aufrufen (Deadlock-Gefahr) |

Ausgang bei Erfolg: Rückgabewert von `aktion()`, unverändert durchgereicht.
Ausgang bei Fehler: wirft `aktion()`, propagiert der Fehler unverändert (das Lock wird **trotzdem**
freigegeben – kein hängendes Lock nach einer Exception).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Besitzt `project.json` je Projekt … und das **eine D1-Schreib-Lock**." (TK 9.5.1)
- „**[D1-Lock]** Referenzen prüfen. Referenziert (ListItem zeigt darauf)? → Fehler
  `asset_referenziert` (mit `referenzenIds`), Abbruch. Sonst: Asset-Eintrag aus D1 entfernen,
  schreiben. **Referenzprüfung und Entfernen im selben kritischen Abschnitt** → schließt die
  TOCTOU-Lücke gegen ein gleichzeitiges Setzen einer neuen Referenz durch den `composer`."
  (TK 9.4.6)
- „**Kein zweites Lock.** Serialisierung von Operationen liefert die Queue (9.3), Serialisierung
  von D1-Schreibvorgängen das eine `project-store`-Lock. `media-service` führt **kein** eigenes
  Lock und **keine** OS-Dateisperren ein (Over-Engineering-Falle)." (TK 9.4.8, Punkt 9)
- „Das **D1-Schreib-Lock** ist ein **prozessinternes** Lock." (TK 9.5.4) – **keine** Datei-/OS-Sperre.

## Fehlerpfade (vollständig)
Entfällt (die Sperre selbst schlägt nicht fehl; Fehler innerhalb von `aktion()` propagieren
unverändert).

## Nicht selbst entscheiden – STOPP und fragen
- Ob bei einer innerhalb `aktion()` geworfenen Exception das Lock „fair" an den nächsten Wartenden
  übergeben wird oder ob die gesamte Warteschlange abgebrochen werden soll – Standardverhalten
  (Lock freigeben, nächster Wartender läuft normal weiter) ist der naheliegende Default; falls das
  Projekt ein anderes Verhalten bei Kettenfehlern erwartet, das explizit klären.

## Definition of Done
- [ ] Zwei gleichzeitige Aufrufe von `mitD1Lock` laufen nachweislich seriell (Test mit
      künstlicher Verzögerung + Reihenfolge-Assertion)
- [ ] Eine Exception in `aktion()` gibt das Lock frei (Test: dritter Aufruf nach einer
      fehlgeschlagenen `aktion()` läuft normal)
- [ ] Keine OS-/Datei-Sperre wird verwendet (reine In-Memory-Implementierung)
- [ ] Keine Datei außerhalb von `src/main/project-store/d1-lock.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (S1, liefert Ordnerstruktur/TS-Toolchain inkl. `src/main/project-store`)
- Blockiert: M1-21 bis M1-38, M3-Issues (media-service delegiert D1-Schreibvorgänge)

## Bezug
TK 9.5.1, TK 9.4.6, TK 9.4.8, TK 9.5.4

---

### Issue M1-21: [project-store] erstelleProjekt implementieren

## Ziel (in einem Satz)
Eine Instant-Operation legt einen neuen, leeren Projektordner mit initialer `project.json` an und
lädt das Projekt als aktives Projekt in den Speicher.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/erstelle-projekt.ts`
- Vertrag: Technisches Konzept **9.5.2** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Dies ist der Startpunkt jedes Projekts (FA-10). Ein Fehler hier – z. B. ein Projektordner-Name, der
Sonderzeichen aus dem Nutzer-Eingabefeld ungefiltert übernimmt – könnte auf Windows und macOS
unterschiedlich fehlschlagen (unterschiedliche verbotene Zeichen in Pfaden) und damit die
Portabilität (NFA-08) unterlaufen, ohne dass es im Dev-Alltag auf einem Rechner auffällt.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function erstelleProjekt(name: string): Promise<Ergebnis<Project>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `name` | Anzeigename des Projekts | nicht leer; wird NICHT direkt als Ordnername verwendet (Ordnername = Projekt-**ID**, s. „Nicht selbst entscheiden") |

Ausgang bei Erfolg: das neu angelegte, leere `Project` (assets/aktionen/liste = `[]`,
`letzterAusgabeName = null`), bereits als aktives Projekt im Speicher.
Ausgang bei Fehler: `ungueltige_eingabe` bei leerem Namen; `speicher_fehler` bei I/O-Fehlern beim
Anlegen des Ordners.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`)"
  (TK 9.5.2)
- „**[D1-Lock]**" – läuft über `mitD1Lock` (M1-20).
- „Jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner" (TK 6) – `erstelleProjekt`
  legt auch den leeren `media/`-Unterordner an.
- **Ordnerpfad `projects/<projekt-id>/`** (TK Abschnitt 6, Ordnerbaum: „projects/ … <projekt-id>/
  … project.json … media/ …") – der Projektordner heißt exakt wie die Projekt-**ID**.
- `letzterAusgabeName: string | null` **muss beim Anlegen auf `null` gesetzt werden** – „**FA-22**:
  Vorbelegung des Render-Zielnamens; **null = noch nie gerendert**" (TK 9.11.3). Fehlt das Feld,
  verletzt das neue Projekt den `Project`-Datenvertrag und der erste Render bricht, sobald er den
  Vorbelegungswert liest.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `name` leer | `ungueltige_eingabe` | keine Wirkung |
| Ordner kann nicht angelegt werden (Rechte, Platte voll) | `speicher_fehler` | keine Wirkung, kein Halbzustand |

## Nicht selbst entscheiden – STOPP und fragen
Entfällt. (Die vormals offene Frage nach Ordnername UUID-vs-lesbar ist bereits durch die DoD
(„`projects/<projektId>/`") und TK Abschnitt 6 beantwortet – s. Invarianten oben.)

## Definition of Done
- [ ] `erstelleProjekt` legt `projects/<projektId>/project.json` und `projects/<projektId>/media/`
      an
- [ ] Das neue Projekt ist danach über `öffneProjekt` (M1-22) mit identischem Inhalt ladbar
- [ ] `letzterAusgabeName` ist im neu angelegten `Project` `null`
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/erstelle-projekt.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (S1, liefert Ordnerstruktur/TS-Toolchain), #5 (S5, liefert `ermittleDatenOrt()`
  – Basispfad für `projects/`), M1-03 (liefert den `Project`-Typ inkl. `letzterAusgabeName`),
  M1-08 (liefert den UUID-Generator für die Projekt-ID), M1-20 (liefert `mitD1Lock`)
- Blockiert: M7-Issues (Projektverwaltung-UI)

## Bezug
TK 9.5.2, TK 6

---

### Issue M1-22: [project-store] öffneProjekt implementieren

## Ziel (in einem Satz)
Eine Instant-Operation lädt ein Projekt von der Platte in den Speicher, mit `.bak`-Fallback bei
defekter `project.json` und `schemaVersion`-Prüfung, und setzt es als aktives Projekt.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/oeffne-projekt.ts`
- Vertrag: Technisches Konzept **9.5.1**, **9.5.4**, **9.5.5** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Dies ist die kritischste Lesefunktion des Systems: Sie entscheidet, ob ein durch einen früheren
Absturz beschädigtes Projekt „einfach weg" ist oder über das `.bak`-Backup gerettet wird. Fehlt hier
der Fallback, wäre die in TK 9.5.4 versprochene Ausfallsicherheit reine Behauptung – ein einziger
Absturz während des entprellten Schreibens (M1-35) könnte dann ein ganzes Projekt unwiederbringlich
zerstören.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function öffneProjekt(id: string): Promise<Ergebnis<Project>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `id` | Projekt-ID | muss einem existierenden Projektordner entsprechen |

Ausgang bei Erfolg: das geladene `Project`, als aktives Projekt im Speicher, `config-store`
aktualisiert (`setzeAktivesProjekt`, M1-15).
Ausgang bei Fehler: `nicht_gefunden` bei fehlendem Projektordner; `speicher_fehler` wenn sowohl
`project.json` als auch `.bak` unlesbar sind.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`öffneProjekt` | `id` → `Ergebnis<Projekt>` (lädt in den Speicher; setzt aktives Projekt via
  `config-store`)" (TK 9.5.2)
- „**Ein Backup:** `project.json.bak` = letzte heile Version. Ist `project.json` beim Laden defekt
  → aus `.bak` wiederherstellen; ist auch das defekt → **Fehler melden**, **nicht** leer/
  verlustbehaftet weiterstarten." (TK 9.5.4)
- „**höhere** (unbekannte) Version → Fehler (nicht raten); **ältere** Version → definierte
  Migration auf die aktuelle." (TK 9.5.5) – ruft bei älterer `schemaVersion` M1-36 auf.
- „Das **aktive** Projekt lebt zur Laufzeit **im Speicher**." (TK 9.5.1) – nur ein Projekt
  gleichzeitig geladen; ein vorher aktives Projekt wird beim Öffnen eines neuen ersetzt (Sofort-
  Flush des alten vor dem Wechsel, s. M1-35).

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| Projektordner existiert nicht | `nicht_gefunden` | keine Wirkung |
| `project.json` defekt (JSON-Parse-Fehler), `.bak` lesbar | – (kein Fehler) | lädt aus `.bak`, meldet Erfolg |
| `project.json` UND `.bak` defekt | `speicher_fehler` | kein Laden, sichtbare Fehlermeldung |
| `schemaVersion` höher als bekannt | `unbekannter_fehler` (oder eigener Code, s. „Nicht selbst entscheiden") | kein Laden |
| `schemaVersion` niedriger als aktuell | – (kein Fehler) | Migration (M1-36) läuft, dann normal geladen |

## Nicht selbst entscheiden – STOPP und fragen
- Ob eine zu hohe `schemaVersion` einen eigenen Fehlercode (z. B. `schema_zu_neu`) bekommt oder
  unter `unbekannter_fehler` läuft – TK 9.5.5 sagt nur „Fehler (nicht raten)", ohne einen Code zu
  nennen; da dieser Fall dem Nutzer erklärbar sein sollte („Projekt wurde mit einer neueren
  App-Version erstellt"), lieber einen eigenen Code vorschlagen und bestätigen lassen, statt
  pauschal `unbekannter_fehler` zu verwenden (der laut TK 9.1.1 für **unerwartete** Ausnahmen
  gedacht ist, nicht für einen erkannten, benennbaren Zustand).

## Definition of Done
- [ ] `öffneProjekt` lädt ein intaktes Projekt korrekt
- [ ] `öffneProjekt` fällt bei defekter `project.json` nachweislich auf `.bak` zurück
- [ ] `öffneProjekt` liefert einen sichtbaren Fehler, wenn beide Dateien defekt sind (kein leerer
      Start)
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/oeffne-projekt.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1, #5, M1-03, M1-15, M1-20, M1-36
- Blockiert: M5–M7-Issues, die ein Projekt laden

## Bezug
TK 9.5.1, TK 9.5.2, TK 9.5.4, TK 9.5.5

---

### Issue M1-23: [project-store] listeProjekte implementieren

## Ziel (in einem Satz)
Eine Instant-Operation liefert leichte Metadaten (ID, Name, Erstell-/Änderungsdatum, Ordner) aller
vorhandenen Projekte, ohne sie vollständig zu laden.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/liste-projekte.ts`
- Vertrag: Technisches Konzept **9.5.1**, **9.5.2** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Die Projektübersicht (FA-10) darf nicht jedes Projekt vollständig in den Speicher laden, nur um
Name und Datum anzuzeigen – bei vielen/großen Projekten (potenziell mit großen `assets`-Arrays)
wäre das unnötig langsam und würde außerdem versehentlich mehrere Projekte gleichzeitig „geladen"
erscheinen lassen, obwohl TK 9.5.1 explizit nur **ein** aktives Projekt im Speicher vorsieht.

## Signatur (verbindlich – NICHT ändern)
```ts
export interface ProjektMeta {
  id: string
  name: string
  erstelltAm: string
  geaendertAm: string
  ordner: string
}
export async function listeProjekte(): Promise<Ergebnis<ProjektMeta[]>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | liest `projects/`-Ordner | – |

Ausgang bei Erfolg: Array aller gefundenen Projekte (leeres Array, wenn keine existieren – **kein**
Fehler).
Ausgang bei Fehler: `speicher_fehler` nur bei I/O-Fehler beim Lesen des `projects/`-Verzeichnisses
selbst (nicht bei einzelnen defekten Projekten – s. „Nicht selbst entscheiden").

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`listeProjekte` | – → `Ergebnis<ProjektMeta[]>` (id, name, erstelltAm, geändertAm, ordner)"
  (TK 9.5.2)
- „Die **Projekt-Liste** (FA-10) sind leichte Metadaten … bei Bedarf aus dem `projects/`-Ordner
  gelesen." (TK 9.5.1) – **kein** vollständiges Laden jedes Projekts.
- Der Abschnittstitel von TK 9.5.2 lautet „**Operationen (Instant, über das D1-Lock)**" und
  `listeProjekte` ist eine der fünf darin aufgeführten Operationen – laut TK-Gliederung läuft sie
  also ebenfalls über `mitD1Lock` (M1-20).

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `projects/`-Ordner existiert nicht (erster Start) | – (kein Fehler) | leeres Array |
| `projects/`-Verzeichnis selbst nicht lesbar (Rechte) | `speicher_fehler` | – |
| ein einzelnes Unterverzeichnis hat eine defekte `project.json` | – (kein Fehler für die Liste) | s. „Nicht selbst entscheiden" |

## Nicht selbst entscheiden – STOPP und fragen
- Wie mit einem einzelnen defekten Projekt in der Liste umgegangen wird (Metadaten lassen sich
  ohne volles Parsen evtl. nicht zuverlässig lesen, wenn `project.json` beschädigt ist) – zwei
  Optionen: das Projekt aus der Liste weglassen (Gefahr: Nutzer sieht sein Projekt nicht mehr und
  denkt, es sei weg) oder mit einem Fehler-Badge auflisten (Gefahr: mehr UI-Komplexität in M7). Ohne
  Vorgabe im TK zur Diskussion stellen statt einseitig zu entscheiden.
- `listeProjekte` ist ein reiner **Lesezugriff** auf `projects/`. Ob dafür wirklich das
  **Schreib**-Lock (`mitD1Lock`) genommen werden muss, oder ob der TK-Abschnittstitel „über das
  D1-Lock" nur pauschal für alle fünf Operationen formuliert ist, ohne dass ein reiner Verzeichnis-
  Scan das im Wortsinn bräuchte, ist eine echte Sachfrage. Dagegen spricht: ein Verzeichnis-Scan
  während einer laufenden `dupliziereProjekt`-Kopie (M1-24, kopiert `media/` außerhalb des Locks,
  aber `project.json` innerhalb) könnte sonst ein Projekt in einem inkonsistenten Zwischenzustand
  einlesen. Nicht selbst entscheiden – klären, ob `mitD1Lock` hier wörtlich genommen wird oder ob
  ein leichteres Read-Lock/keine Sperre reicht.

## Definition of Done
- [ ] `listeProjekte()` liefert korrekte Metadaten für alle intakten Projekte
- [ ] Fehlender `projects/`-Ordner liefert ein leeres Array, keinen Fehler
- [ ] Kein vollständiges Parsen der `liste`/`assets`/`aktionen`-Arrays jedes Projekts (nur die
      Metadatenfelder)
- [ ] Läuft innerhalb von `mitD1Lock` (TK 9.5.2 Abschnittstitel; s. STOPP-Punkt zur Sachfrage
      Lese- vs. Schreibzugriff)
- [ ] Keine Datei außerhalb von `src/main/project-store/liste-projekte.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (S1, liefert Ordnerstruktur/TS-Toolchain), #5 (S5, liefert `ermittleDatenOrt()`
  – Basispfad für `projects/`)
- Blockiert: M7-Issues (Projektverwaltung-UI)

## Bezug
TK 9.5.1, TK 9.5.2

---

### Issue M1-24: [project-store] dupliziereProjekt implementieren

## Ziel (in einem Satz)
Eine Instant-Operation kopiert `project.json` **und** den `media/`-Ordner eines Projekts unter
einer neuen Projekt-ID, bei unveränderten projektinternen IDs.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/dupliziere-projekt.ts`
- Vertrag: Technisches Konzept **9.5.2**, **9.11.4** (Quelle der Wahrheit)
- Prozess/Speicher: D1, D2

## Warum das im Gesamtsystem wichtig ist
FA-10 nennt Duplizieren explizit als Weg, „Inhalte effizient zu aktualisieren statt neu
anzulegen" – z. B. eine Saisonwerbung als Vorlage für die nächste Saison. Werden dabei
projektinterne IDs (Assets, Aktionen, Listenelemente) versehentlich neu vergeben, brechen alle
internen Referenzen (`Listenelement.ref` → `Asset.id`, `Aktion.bildRef` → `Asset.id`) im
duplizierten Projekt sofort.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function dupliziereProjekt(id: string, neuerName: string): Promise<Ergebnis<Project>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `id` | zu duplizierendes Projekt | muss existieren |
| `neuerName` | Anzeigename des Duplikats | nicht leer |

Ausgang bei Erfolg: das neue `Project` mit **neuer** `id`, aber **unveränderten** internen IDs
(Assets, Aktionen, Listenelemente) und einer physischen Kopie von `media/`.
Ausgang bei Fehler: `nicht_gefunden` (Quellprojekt fehlt), `ungueltige_eingabe` (leerer Name),
`speicher_fehler` (I/O beim Kopieren).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`dupliziereProjekt` | `id`, `neuerName` → `Ergebnis<Projekt>` (kopiert `project.json` **und**
  `media/`)" (TK 9.5.2)
- „**`dupliziereProjekt` vergibt eine neue Projekt-ID**, behält aber die projektinternen IDs
  (Assets, Aktionen, Listenelemente) – sie sind ohnehin nur projektweit eindeutig, und ein
  Umschreiben würde alle inneren Referenzen gefährden." (TK 9.11.4)
- **`dupliziereProjekt` ist eine Instant-Operation, kein Auftrag.** TK 9.3.2 (Auftragsarten) listet
  nur vier Auftragsarten – „`import`", „`loeschen`", „`render`", „`export`" – `dupliziere` ist
  **nicht** darunter. TK 9.5.2 führt `dupliziereProjekt` umgekehrt explizit unter den
  „Operationen (Instant, über das D1-Lock)" auf. Damit ist die Signatur (`Promise<Ergebnis<Project>>`,
  DoD „läuft innerhalb von `mitD1Lock`") korrekt und **nicht** zur Diskussion zu stellen.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| Quellprojekt `id` existiert nicht | `nicht_gefunden` | keine Wirkung |
| `neuerName` leer | `ungueltige_eingabe` | keine Wirkung |
| I/O-Fehler beim Kopieren von `media/` | `speicher_fehler` | teilweise kopierte Zieldaten werden aufgeräumt, kein Halbzustand sichtbar |

## Nicht selbst entscheiden – STOPP und fragen
- Wie mit einer sehr großen `media/`-Kopie umgegangen wird (Fortschrittsanzeige nötig?), da das
  Kopieren bei vielen/großen Videos durchaus spürbar dauern kann, obwohl `dupliziereProjekt`
  laut TK verbindlich eine Instant-Operation ist (s. Invariante oben) – **nicht** zur Diskussion
  steht, ob es stattdessen ein Auftrag sein sollte, sondern **nur**, ob z. B. ein unscheinbarer
  Lade-Indikator während der (weiterhin synchronen) Instant-Operation nötig ist.
- **`letzterAusgabeName` im Duplikat.** TK 9.5.2 sagt, `dupliziereProjekt` kopiert `project.json`
  **und** `media/` – **nicht** `output/`. Da `project.json` mitkopiert wird, erbt das Duplikat den
  `letzterAusgabeName` des Originals, der im neuen Projekt auf eine **nicht existierende** Datei
  zeigt (weil `output/` nicht mitkopiert wurde). Muss `letzterAusgabeName` im Duplikat explizit auf
  `null` zurückgesetzt werden? Das TK entscheidet das an dieser Stelle nicht – nicht selbst
  festlegen, klären.

## Definition of Done
- [ ] Das duplizierte Projekt hat eine neue `id`, aber identische Asset-/Aktions-/
      Listenelement-IDs wie das Original
- [ ] `media/` ist physisch kopiert (keine Referenz auf den Original-Ordner)
- [ ] Original bleibt unverändert
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/dupliziere-projekt.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (S1, liefert Ordnerstruktur/TS-Toolchain), #5 (S5, liefert `ermittleDatenOrt()`
  – Basispfad für `projects/`), M1-08 (liefert den UUID-Generator für die neue Projekt-ID),
  M1-20 (liefert `mitD1Lock`), M1-22 (das Duplikat muss über `öffneProjekt` identisch ladbar sein)
- Blockiert: M7-Issues (Projektverwaltung-UI)

## Bezug
TK 9.5.2, TK 9.11.4

---

### Issue M1-25: [project-store] löscheProjekt implementieren

## Ziel (in einem Satz)
Eine Instant-Operation entfernt den kompletten Projektordner; war das Projekt aktiv, fällt
`config-store` sanft auf „kein aktives Projekt" zurück.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/loesche-projekt.ts`
- Vertrag: Technisches Konzept **9.5.2**, **9.5.6** (Quelle der Wahrheit)
- Prozess/Speicher: D1, D2

## Warum das im Gesamtsystem wichtig ist
Löscht diese Funktion das gerade aktive Projekt, ohne `config-store` zu benachrichtigen, zeigt die
App beim nächsten Start einen Fehler statt des in TK 9.5.6 geforderten „sanften Rückfalls" –
`config.json` würde weiter auf ein nicht mehr existierendes Projekt zeigen.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function löscheProjekt(id: string): Promise<Ergebnis<void>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `id` | zu löschendes Projekt | muss existieren |

Ausgang bei Erfolg: `Ergebnis<void>`; Projektordner ist entfernt; war `id` das aktive Projekt, ist
`config-store`s aktives Projekt jetzt `null`.
Ausgang bei Fehler: `nicht_gefunden`, `speicher_fehler` (I/O beim Löschen).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`löscheProjekt` | `id` → `Ergebnis<void>` (entfernt den Projektordner; war es aktiv, fällt
  `config-store` sanft zurück)" (TK 9.5.2)
- „**fehlt** es (extern gelöscht) → sanfter Rückfall auf ‚kein aktives Projekt / Projektliste',
  **kein** Absturz." (TK 9.5.6, sinngemäß auch für den Fall „selbst gelöscht" geltend)

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `id` existiert nicht | `nicht_gefunden` | keine Wirkung |
| I/O-Fehler beim Löschen (Datei gesperrt) | `speicher_fehler` | teilweise gelöschter Zustand möglich, s. „Nicht selbst entscheiden" |

## Nicht selbst entscheiden – STOPP und fragen
- Diese Operation gehört laut Anforderungsdokument/TK zu den **unumkehrbaren** Vorgängen (kein
  Undo, TK 9.13.1 nennt zwar nur „Medien-Löschen"/"Render"/"Export" explizit als Auftrags-Vorgänge
  ohne Undo – ob `löscheProjekt` ebenfalls in diese Kategorie fällt oder eine Instant-Operation mit
  Undo sein sollte, ist im TK nicht eindeutig entschieden). Da ein gelöschtes Projekt physisch von
  der Platte verschwindet (anders als ein rein datenbank-internes Löschen), sollte ein „Undo" ohnehin
  nicht möglich sein – aber ob die App vor dem Löschen eine explizite Bestätigung verlangt (über
  diese Funktion hinaus, in M7), ist zu klären, nicht hier stillschweigend anzunehmen.
- Wie ein teilweise fehlgeschlagenes Löschen (z. B. `media/`-Unterordner entfernt, aber
  `project.json` durch einen Dateisystem-Lock blockiert) behandelt wird – Windows-`EBUSY`-Fälle
  analog zu media-service (TK 9.4.6) mit Retry+Backoff behandeln oder anders? Falls unklar, dieselbe
  Strategie wie media-service übernehmen, aber vorher bestätigen lassen, da hier ein ganzer Ordner
  statt einer einzelnen Datei betroffen ist.

## Definition of Done
- [ ] `löscheProjekt` entfernt den kompletten Projektordner (`project.json`, `.bak`, `media/`,
      `output/`, `queue-retry.json`) – `output/` ist der seit FA-22 projektbezogene Ausgabeordner
      (TK Abschnitt 6: „`output/` # A: gerenderte MP4s DIESES Projekts") und darf beim Entfernen
      nicht vergessen werden. Ein rekursives Löschen kann an einer noch geöffneten Datei im
      Ausgabeordner scheitern (Windows `EBUSY`/`EPERM`, z. B. wenn eine `loop.mp4` gerade extern
      geöffnet ist) – dieser Fall fällt unter den Fehlerpfad `speicher_fehler` oben, nicht
      übersehen.
- [ ] War das gelöschte Projekt aktiv, ist `config-store`s aktives Projekt danach `null`
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/loesche-projekt.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (S1, liefert Ordnerstruktur/TS-Toolchain), #5 (S5, liefert `ermittleDatenOrt()`
  – Basispfad für `projects/`), M1-15 (setzt das aktive Projekt in `config-store` zurück auf `null`),
  M1-20 (liefert `mitD1Lock`)
- Blockiert: M7-Issues (Projektverwaltung-UI)

## Bezug
TK 9.5.2, TK 9.5.6

---

### Issue M1-26: [project-store] erstelleAktion implementieren

## Ziel (in einem Satz)
Eine Instant-Operation fügt eine neue Aktion zur Aktions-Bibliothek des aktiven Projekts hinzu, mit
Pflichtprüfung auf `titel`.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/erstelle-aktion.ts`
- Vertrag: Technisches Konzept **9.5.2**, **9.8.4** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
`erstelleAktion` ist der Main-seitige Gegenpart zum `action-editor` (M5) – „Titel ist Pflicht: eine
Aktion ohne Titel ist nicht speicherbar" (TK 9.8.4) muss **hier**, im Main, durchgesetzt werden,
nicht nur in der Renderer-UI. Verließe sich das System allein auf eine UI-Prüfung, könnte ein
Bug im `action-editor` oder ein direkter (fehlerhafter) IPC-Aufruf eine titel-lose Aktion erzeugen,
die später z. B. in der Projektübersicht als leerer Eintrag auftaucht.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function erstelleAktion(
  aktionsdaten: Omit<Aktion, 'id'>,
): Promise<Ergebnis<Aktion>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `aktionsdaten` | alle `Aktion`-Felder außer `id` | `titel` MUSS nicht-leer sein; `vorlagenId` MUSS gesetzt sein (kein Default-Rätselraten) |

Ausgang bei Erfolg: die neu angelegte `Aktion` (mit vergebener `id`, M1-08).
Ausgang bei Fehler: `ungueltige_eingabe` bei leerem `titel` oder fehlender `vorlagenId`.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Titel ist Pflicht:** eine Aktion ohne Titel ist nicht speicherbar." (TK 9.8.4)
- „**[D1-Lock]**" – läuft über `mitD1Lock`.
- „Aktionen sind **referenzierbare** Datensätze – mehrere Listenelemente dürfen auf dieselbe
  Aktion zeigen … Aktions-Bibliothek je Projekt." (TK 5, Punkt 2)

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `titel` leer/fehlt | `ungueltige_eingabe` | keine Wirkung |
| `vorlagenId` fehlt | `ungueltige_eingabe` | keine Wirkung |
| kein aktives Projekt geladen | s. „Nicht selbst entscheiden" | keine Wirkung |

## Nicht selbst entscheiden – STOPP und fragen
- Ob `vorlagenId` gegen die tatsächlich existierende Vorlagen-Bibliothek (`vorlagen-store`, M4)
  geprüft wird – diese Prüfung würde eine Abhängigkeit von `project-store` (M1) auf `vorlagen-store`
  (M4) einführen, was der Reihenfolge M1→M4 widerspricht. Vermutlich bleibt die Prüfung hier auf
  „ist gesetzt und ein String" beschränkt, und eine tiefere Prüfung (existiert diese Vorlage
  wirklich?) gehört erst zum `action-editor` (M5), der die Vorlagen-Bibliothek ohnehin kennt – aber
  das ist eine Architektur-Entscheidung, die zu bestätigen ist, nicht stillschweigend anzunehmen.
- **Fehlercode bei „kein aktives Projekt geladen":** TK 9.5.5 kennt nur den Fall, dass beim
  App-Start **kein** zuletzt aktives Projekt existiert (Rückfall auf die Projektliste), sagt aber
  nichts darüber, welchen `Fehlercode` eine Instant-Operation wie `erstelleAktion` liefert, wenn sie
  aufgerufen wird, obwohl gerade **kein** Projekt aktiv im Speicher liegt. Ob dafür `nicht_gefunden`
  (es gibt kein Projekt, das die Aktion aufnehmen könnte) oder `ungueltige_eingabe` (der Aufruf
  selbst ist im aktuellen Zustand unzulässig) der passendere generische Code ist – **nicht selbst
  festlegen**, da diese Wahl für alle project-store-Mutationen konsistent getroffen werden muss.

## Definition of Done
- [ ] `erstelleAktion` lehnt leeren `titel` ab, ohne die Aktions-Liste zu verändern
- [ ] Neue Aktion erscheint danach in `Project.aktionen`
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/erstelle-aktion.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Ordnerstruktur/Toolchain), M1-02 (`Aktion`-Typ), M1-08 (UUID-Vergabe für die
  neue `id`), M1-20 (D1-Lock-Primitive `mitD1Lock`), M1-22 (`öffneProjekt` lädt das Projekt in den
  Speicher, ohne das existiert kein `Project.aktionen`, dem hinzugefügt werden könnte)
- Blockiert: M5-Issues (action-editor)

## Bezug
TK 9.5.2, TK 9.8.4

---

### Issue M1-27: [project-store] bearbeiteAktion implementieren

## Ziel (in einem Satz)
Eine Instant-Operation aktualisiert die Felder einer bestehenden Aktion, mit derselben
Titel-Pflichtprüfung wie beim Anlegen.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/bearbeite-aktion.ts`
- Vertrag: Technisches Konzept **9.5.2**, **9.8.4** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Da Aktionen **referenzierbar** sind (TK 5, Punkt 2), wirkt sich `bearbeiteAktion` potenziell auf
mehrere Listenelemente **und** Band-Abschnitte gleichzeitig aus – ändert der Nutzer z. B. das Bild
einer Aktion, die in drei rotierenden Bändern verwendet wird, ändern sich alle drei gleichzeitig
(gewollt, s. TK 9.8.5). Diese Funktion selbst ändert nur den `Aktion`-Datensatz; sie muss aber
korrekt sein, damit die überall referenzierende Logik (composer, template-canvas) konsistent
bleibt.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function bearbeiteAktion(
  id: string,
  aktionsdaten: Partial<Omit<Aktion, 'id'>>,
): Promise<Ergebnis<Aktion>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `id` | zu bearbeitende Aktion | muss existieren |
| `aktionsdaten` | zu ändernde Felder (Teilmenge) | wird `titel` mitgeschickt und ist leer → Fehler; `titel` NICHT mitschicken lässt den bestehenden Wert unverändert |

Ausgang bei Erfolg: die aktualisierte `Aktion`.
Ausgang bei Fehler: `nicht_gefunden` (Aktion existiert nicht), `ungueltige_eingabe` (leerer `titel`
im Update).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Titel ist Pflicht:** eine Aktion ohne Titel ist nicht speicherbar." (TK 9.8.4) – gilt auch für
  ein Update, das den Titel auf leer setzen würde.
- „**[D1-Lock]**"

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `id` existiert nicht | `nicht_gefunden` | keine Wirkung |
| `aktionsdaten.titel` explizit auf leeren String gesetzt | `ungueltige_eingabe` | keine Wirkung |

## Nicht selbst entscheiden – STOPP und fragen
- Ob eine mitgeschickte `vorlagenId` gegen die tatsächlich existierende Vorlagen-Bibliothek
  (`vorlagen-store`, M4) geprüft wird – diese Prüfung würde eine Abhängigkeit von `project-store`
  (M1) auf `vorlagen-store` (M4) einführen, was der Reihenfolge M1→M4 widerspricht. Vermutlich
  bleibt die Prüfung hier auf „ist gesetzt und ein String" beschränkt, und eine tiefere Prüfung
  (existiert diese Vorlage wirklich?) gehört erst zum `action-editor` (M5), der die
  Vorlagen-Bibliothek ohnehin kennt – aber das ist eine Architektur-Entscheidung, die zu bestätigen
  ist, nicht stillschweigend anzunehmen (dieselbe offene Frage wie bei `erstelleAktion`, M1-26).

## Definition of Done
- [ ] `bearbeiteAktion` ändert nur die mitgeschickten Felder, lässt andere unangetastet
- [ ] Ein Update mit leerem `titel` wird abgelehnt, ohne die Aktion zu verändern
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/bearbeite-aktion.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: M1-26 (`erstelleAktion` legt die Aktions-Bibliothek und die Titel-Pflichtprüfung
  an, auf der `bearbeiteAktion` aufbaut)
- Blockiert: M5-Issues (action-editor)

## Bezug
TK 9.5.2, TK 9.8.4

---

### Issue M1-28: [project-store] löscheAktion mit chirurgischer Kaskade implementieren

## Ziel (in einem Satz)
Eine Instant-Operation löscht eine Aktion und behandelt ihre beiden Referenzarten unterschiedlich:
Segment-Listenelemente werden entfernt, Band-Abschnitte werden aus dem Video-Element chirurgisch
herausgeschnitten, ohne das Video selbst zu entfernen.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/loesche-aktion.ts`
- Vertrag: Technisches Konzept **9.5.3** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Dies ist eine der heikelsten Funktionen im ganzen Projekt, weil sie **zwei** strukturell
unterschiedliche Referenzarten in einem Aufwasch behandeln muss. TK 9.5.3 erklärt explizit, warum
eine einheitliche Behandlung falsch wäre: „Würde Fall 2 wie Fall 1 behandelt, verlöre der Nutzer
sein **Video aus der Wiedergabeliste**, nur weil eine von mehreren rotierenden Werbeaktionen
gelöscht wurde." Ein Agent, der diese Funktion naiv als „entferne alle Elemente, die auf diese
Aktion zeigen" implementiert, würde genau diesen Fehler machen und dabei intakte Videos aus der
Wiedergabeliste reißen.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function löscheAktion(id: string): Promise<Ergebnis<{
  entfernteElementIds: string[]
  geaenderteElementIds: string[]
}>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `id` | zu löschende Aktion | muss existieren |

Ausgang bei Erfolg: `entfernteElementIds` = IDs der entfernten Segment-Listenelemente (Fall 1),
`geaenderteElementIds` = IDs der Video-Listenelemente, deren Band-Abschnitte gekürzt/entfernt
wurden (Fall 2). Die referenzierten Medien-**Assets** bleiben unangetastet. Die Aktion mit der
übergebenen `id` ist danach **nicht mehr** in `Project.aktionen` enthalten – die Kaskade entfernt
die Referenzen, aber `löscheAktion` löscht am Ende auch den Aktions-Datensatz selbst.
Ausgang bei Fehler: `nicht_gefunden`.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Eine Aktion kann an **zwei** Stellen referenziert sein … 1. **Listenelement mit
  `art: "segment"`**, dessen `ref` die Aktion ist → das Element **ist** diese Aktion und wird
  **entfernt**. 2. **`einblendung.abschnitte[].aktionRef`** in einem **Video**-Element → die
  Aktion ist nur **ein Abschnitt** eines rotierenden Bandes. Hier werden **ausschließlich die
  betroffenen Abschnitte** entfernt; das **Videoelement bleibt erhalten**." (TK 9.5.3)
- „**Randfall:** Wird ein Band durch das Entfernen leer (keine Abschnitte mehr), entfällt die
  **Einblendung ganz** (`einblendung = null`) – das **Videoelement bleibt**." (TK 9.5.3)
- „**Rückgabe:** `löscheAktion` meldet **beide** Wirkungen – `entfernteElementIds` … **und**
  `geaenderteElementIds`." (TK 9.5.3)
- „Die von der Aktion **verwendeten Medien-Assets bleiben unangetastet** und projektweit
  verfügbar – eine Aktion *referenziert* ein Asset nur, sie besitzt es nicht." (TK 9.5.3)

**Architektur-Entscheidung dieses Issues (kein TK-Zitat, aber verbindlich für die Umsetzung):**
Das TK beschreibt die Kaskade (Segment-Elemente entfernen, Band-Abschnitte kürzen), sagt aber nicht
ausdrücklich, dass die Aktion selbst danach aus `Project.aktionen` entfernt wird und in welcher
Reihenfolge das geschieht. Festgelegt: Erst wird die Kaskade vollständig aufgelöst (Segment-Elemente
entfernen, Band-Abschnitte kürzen/Einblendung leeren), **danach** wird die Aktion aus
`Project.aktionen` entfernt – beides in **einem** Durchlauf unter demselben `mitD1Lock`, damit kein
Zwischenzustand mit verwaisten Referenzen (Listenelemente oder Band-Abschnitte, die auf eine bereits
gelöschte Aktion zeigen) von außen sichtbar wird.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `id` existiert nicht | `nicht_gefunden` | keine Wirkung |

## Nicht selbst entscheiden – STOPP und fragen
- Keine offenen Punkte – die Kaskadenlogik ist in TK 9.5.3 vollständig und eindeutig beschrieben.
  Falls beim Implementieren ein dritter Referenztyp auffällt, der im TK nicht genannt ist: **nicht**
  selbst eine Behandlung erfinden, sondern melden (das TK erhebt Anspruch auf Vollständigkeit hier).

## Definition of Done
- [ ] Löschen einer Aktion, die in einem `segment`-Element verwendet wird, entfernt dieses Element
- [ ] Löschen einer Aktion, die in einem Band-Abschnitt verwendet wird, entfernt NUR den Abschnitt,
      das Video-Element bleibt in der Liste
- [ ] Wird ein Band dadurch leer, wird `einblendung` auf `null` gesetzt, das Video-Element bleibt
- [ ] Referenzierte Assets sind nach dem Löschen unverändert in `Project.assets` vorhanden
- [ ] Die Aktion mit der übergebenen `id` ist nach Erfolg nicht mehr in `Project.aktionen` enthalten
- [ ] Rückgabe enthält beide Listen korrekt befüllt (auch wenn eine davon leer ist)
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/loesche-aktion.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: M1-26, M1-03 (Listenelement/Einblendung-Typen)
- Blockiert: M5-Issues (composer, action-editor)

## Bezug
TK 9.5.3

---

### Issue M1-29: [project-store] fügeElementHinzu implementieren

## Ziel (in einem Satz)
Eine Instant-Operation fügt der Wiedergabeliste ein neues Element hinzu, dessen Referenz entweder
ein Asset (Video/Bild) oder eine Aktion (Segment) ist.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/fuege-element-hinzu.ts`
- Vertrag: Technisches Konzept **9.5.2**, **9.7.2**, **9.11.3** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Diese Funktion entscheidet anhand der Referenz, welche `art` das neue `Listenelement` bekommt und
mit welchen Default-Werten (z. B. `standardDauer` der Aktion als Startwert für `segment`-Elemente,
TK 9.8.4). Verwechselt sie Asset-Typ „video" mit „bild" (z. B. bei einer Referenz, die zufällig
beide Whitelist-Endungen unterstützt), landet das Element mit der falschen Feldbelegung
(`trimStart`/`trimEnde` statt `dauer`) in der Liste.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function fügeElementHinzu(referenz: string): Promise<Ergebnis<Listenelement>>
// referenz ist entweder eine Asset-ID (video|bild) oder eine Aktions-ID (segment)
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `referenz` | Asset-ID oder Aktions-ID | muss in `Project.assets` oder `Project.aktionen` existieren |

Ausgang bei Erfolg: das neue `Listenelement`, ans Ende von `Project.liste` angehängt, mit
Feldbelegung gemäß referenzierter Art (TK 9.11.3, Tabelle legt nur fest, dass die Felder **gesetzt**
sind, nicht die konkreten Werte). **Eigene, offen benannte Festlegung dieses Issues (kein
TK-Zitat):** bei `video`: `trimStart=0`, `trimEnde=Asset.dauer` (volle Länge als Default); bei
`bild`/`segment`: `dauer` = Standarddauer (M1-09) bzw. `Aktion.standardDauer`, falls gesetzt.
Ausgang bei Fehler: `nicht_gefunden` (Referenz existiert weder als Asset noch als Aktion).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`fügeElementHinzu` | `referenz` (Asset- **oder** Aktions-ID) → `Ergebnis<Listenelement>`"
  (TK 9.5.2)
- Belegung je `art` (TK 9.11.3, Tabelle, wörtlich in M1-03 zitiert).
- „**`standardDauer` ist nur ein Default:** … Beim Platzieren wird `standardDauer` als Startwert
  übernommen, danach überschreibbar." (TK 9.8.4)
- „Die Reihenfolge ist die Array-Reihenfolge von `liste` – es gibt kein separates `position`-Feld.
  Zwei Quellen für dieselbe Information würden unweigerlich auseinanderlaufen." (TK 9.11.3) – das
  neue Element wird ans Ende angehängt, kein `position`-Feld gesetzt.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `referenz` existiert weder als Asset noch als Aktion im aktiven Projekt | `nicht_gefunden` | keine Wirkung |

## Nicht selbst entscheiden – STOPP und fragen
- Ob bei einem Video-Asset mit `zustand:"fehlt"` das Hinzufügen trotzdem erlaubt ist (das Element
  landet dann sofort im Reparatur-Modus, TK 9.7.5) oder ob es hier schon verhindert wird – TK 9.7.5
  beschreibt die Reparatur als **nachträgliche** Erkennung bereits vorhandener kaputter Elemente,
  was dafür spricht, das Hinzufügen hier nicht zu blockieren; falls das TK an anderer Stelle
  Gegenteiliges nahelegt, vor der Umsetzung klären.
- **Zeitpunkt der Aktualisierung von `Project.geaendertAm`:** TK 9.5.1/9.5.4 legen fest, *dass*
  entprellt auf die Platte geschrieben wird, aber nicht, ob der `geaendertAm`-Zeitstempel bereits
  bei der Instant-Mutation im Speicher oder erst beim tatsächlichen Schreiben gesetzt wird. Da
  `listeProjekte` (9.5.2) `geändertAm` in der Projektübersicht anzeigt, hätte eine falsche Wahl
  sichtbare, aber schwer zu bemerkende Folgen (Projekt wirkt „älter" als es ist). Nicht selbst
  festlegen.

## Definition of Done
- [ ] Eine Video-/Bild-Asset-Referenz erzeugt ein Element mit korrekter `art` und Feldbelegung
- [ ] Eine Aktions-Referenz erzeugt ein `segment`-Element mit `Aktion.standardDauer` als Startwert
      (Fallback: M1-09-Standarddauer, falls `standardDauer` `null` ist)
- [ ] Eine unbekannte Referenz liefert `nicht_gefunden`
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/fuege-element-hinzu.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: M1-03, M1-09, M1-20, M1-22, M1-26
- Blockiert: M5-Issues (composer)

## Bezug
TK 9.5.2, TK 9.7.2, TK 9.8.4, TK 9.11.3

---

### Issue M1-30: [project-store] entferneElement implementieren

## Ziel (in einem Satz)
Eine Instant-Operation entfernt ein einzelnes Element aus der Wiedergabeliste, ohne das
referenzierte Asset oder die referenzierte Aktion anzutasten.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/entferne-element.ts`
- Vertrag: Technisches Konzept **9.5.2**, **9.7.2**, **9.7.5**, **9.11.3** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Diese Funktion ist die einfachste der vier Liste-Mutationen, aber sie wird an einer heiklen
Stelle wiederverwendet: Der geführte Reparatur-Modus (TK 9.7.5) nutzt genau diese Operation als
eine der drei Fix-Optionen für ein kaputtes Element („**Element entfernen** (`entferneElement`,
project-store). Es werden ausschließlich bestehende Operationen genutzt."). Würde diese Funktion
versehentlich das referenzierte Asset oder die referenzierte Aktion mitlöschen statt nur den
Listeneintrag, verlöre der Nutzer beim Reparieren eines einzelnen kaputten Elements zusätzlich
Bibliotheksinhalte, die an anderer Stelle noch gebraucht werden – Aktionen sind ausdrücklich
**referenzierbar** und mehrfach verwendbar, ein Asset kann von mehreren Listenelementen
gleichzeitig referenziert sein.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function entferneElement(elementId: string): Promise<Ergebnis<void>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `elementId` | ID des zu entfernenden Listenelements | muss in `Project.liste` existieren |

Ausgang bei Erfolg: `Ergebnis<void>` mit `ok: true`; das Element ist aus `Project.liste` entfernt,
die Reihenfolge der verbleibenden Elemente bleibt unverändert (Array-Verschiebung, kein Loch).
Ausgang bei Fehler: `nicht_gefunden` (keine Wirkung auf `Project.liste`).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`entferneElement` | `elementId` → `Ergebnis<void>`" (TK 9.5.2)
- „Die Reihenfolge ist die Array-Reihenfolge von `liste` – es gibt **kein** separates
  `position`-Feld." (TK 9.11.3) – das Entfernen darf daher kein Platzhalter-Element hinterlassen,
  sondern muss den Eintrag echt aus dem Array streichen.
- „`fügeElementHinzu` (Asset- **oder** Aktions-Referenz; mehrere Listenelemente dürfen dieselbe
  Aktion referenzieren)" (TK 9.7.2) – daraus folgt umgekehrt: Ein Listenelement zu
  entfernen darf niemals die referenzierte Aktion oder das referenzierte Asset selbst löschen,
  weil andere Elemente oder Band-Abschnitte noch darauf zeigen können.
- „Die von der Aktion **verwendeten Medien-Assets bleiben unangetastet** und projektweit
  verfügbar – eine Aktion *referenziert* ein Asset nur, sie besitzt es nicht." (TK 9.5.3) – dasselbe
  Prinzip gilt sinngemäß für `entferneElement`: Es löscht ausschließlich den Eintrag in `liste`,
  niemals einen Eintrag in `Project.assets` oder `Project.aktionen`.
- „**Fix-Optionen je Element:** Medium neu verknüpfen/importieren (media-service), durch ein
  anderes ersetzen (Referenz umsetzen), oder das **Element entfernen** (`entferneElement`,
  project-store). Es werden ausschließlich bestehende Operationen genutzt." (TK 9.7.5) – diese
  Funktion muss daher auch auf einem als „kaputt" markierten Element (Referenz zeigt auf ein
  `fehlt`-Asset) anstandslos funktionieren; sie prüft nur, dass die `elementId` existiert, nicht
  den Zustand der Referenz.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `elementId` existiert nicht in `Project.liste` | `nicht_gefunden` | keine Wirkung |

## Nicht selbst entscheiden – STOPP und fragen
- **Darf `entferneElement` die Liste vollständig leeren** (letztes verbliebenes Element
  entfernen)? Das Technische Konzept legt an keiner Stelle eine Untergrenze für `Project.liste`
  fest, und `render-service` (9.2) beschreibt keinen expliziten Fehlercode für eine leere
  `elemente`-Liste im `RenderRequest`. Nicht selbst festlegen, ob project-store das Leeren
  zulässt (und eine spätere Prüfung dem Render-Auftrag überlässt) oder ob es hier bereits
  verhindert werden soll – eine falsche Wahl könnte entweder unnötig blockieren oder einen
  Render-Auftrag mit einer leeren Liste zulassen, der erst spät und unklar fehlschlägt.
- **Zeitpunkt der Aktualisierung von `Project.geaendertAm`:** TK 9.5.1/9.5.4 legen fest, *dass*
  entprellt auf die Platte geschrieben wird, aber nicht, ob der `geaendertAm`-Zeitstempel bereits
  bei der Instant-Mutation im Speicher oder erst beim tatsächlichen Schreiben gesetzt wird. Da
  `listeProjekte` (9.5.2) `geändertAm` in der Projektübersicht anzeigt, hätte eine falsche Wahl
  sichtbare, aber schwer zu bemerkende Folgen (Projekt wirkt „älter" als es ist). Nicht selbst
  festlegen.

## Definition of Done
- [ ] Entfernen eines existierenden Elements liefert `Ergebnis<void>` mit `ok: true` und das
      Element ist danach nicht mehr in `Project.liste` enthalten
- [ ] Die verbleibenden Elemente behalten ihre relative Reihenfolge (kein `undefined`-Loch im
      Array)
- [ ] Entfernen eines Elements, dessen Referenz auf ein `Asset` mit `zustand: "fehlt"` zeigt,
      funktioniert identisch (kein Sonderfall)
- [ ] Das referenzierte `Asset` bzw. die referenzierte `Aktion` bleibt unverändert in
      `Project.assets` bzw. `Project.aktionen` erhalten
- [ ] Eine unbekannte `elementId` liefert `nicht_gefunden`, `Project.liste` bleibt unverändert
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/entferne-element.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: M1-03 (`Project`/`Listenelement`-Typen), M1-20 (D1-Lock-Primitive `mitD1Lock`),
  M1-22 (`öffneProjekt` lädt das Projekt in den Speicher, ohne das existiert kein `Project.liste`
  zum Mutieren)
- Blockiert: M5-Issues (composer, insbesondere der Reparatur-Modus 9.7.5)

## Bezug
FA-05, TK 9.5.2, TK 9.7.2, TK 9.7.5, TK 9.11.3

---

### Issue M1-31: [project-store] ordneNeu implementieren

## Ziel (in einem Satz)
Eine Instant-Operation übernimmt eine vom Renderer vorgegebene neue Reihenfolge der
Wiedergabeliste, nachdem sie geprüft hat, dass dabei kein Element verschwindet, verdoppelt wird
oder unbekannt ist.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/ordne-neu.ts`
- Vertrag: Technisches Konzept **9.5.2**, **9.7.3**, **9.11.3** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
`ordneNeu` ist die einzige Operation, die die komplette Array-Reihenfolge von `Project.liste` auf
einmal ersetzt – genau die Reihenfolge, die laut TK 9.11.3 die **einzige** Ordnungsquelle ist (es
gibt kein separates `position`-Feld). Der `composer` bedient dnd-kit **optimistisch**: Er zeigt die
neue Reihenfolge sofort an und schickt danach die komplette neue ID-Liste an diese Funktion (TK
9.7.3, „Reorder/Trim/Dauer werden lokal sofort angezeigt, dann per Instant-Op bestätigt"). Verlässt
sich diese Funktion darauf, dass der Renderer immer eine korrekte, vollständige Liste schickt, und
übernimmt eine fehlerhafte `reihenfolge` ungeprüft (z. B. weil ein UI-Bug ein Element beim
Drag-and-Drop verliert), verschwindet dieses Element **endgültig** aus `Project.liste` – ein
Datenverlust, der erst beim nächsten Öffnen des Projekts auffällt, wenn überhaupt.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function ordneNeu(reihenfolge: string[]): Promise<Ergebnis<void>>
// reihenfolge: die komplette neue Abfolge von Listenelement-IDs, in der gewünschten Reihenfolge
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `reihenfolge` | vollständige neue Abfolge der Listenelement-IDs | muss **exakt** dieselbe Menge an IDs enthalten wie das aktuelle `Project.liste` – keine fehlende, keine zusätzliche, keine doppelte ID |

Ausgang bei Erfolg: `Ergebnis<void>` mit `ok: true`; `Project.liste` enthält danach dieselben
`Listenelement`-Objekte (inhaltlich unverändert), aber in der durch `reihenfolge` vorgegebenen
Abfolge.
Ausgang bei Fehler: `ungueltige_eingabe` (keine Wirkung auf `Project.liste`).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`ordneNeu` | `reihenfolge` (elementIds) → `Ergebnis<void>`" (TK 9.5.2)
- „Die Reihenfolge ist die Array-Reihenfolge von `liste` – es gibt **kein** separates
  `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerlich auseinanderlaufen."
  (TK 9.11.3)
- „Optimistisch mit Abgleich: Reorder/Trim/Dauer werden **lokal sofort** angezeigt, dann per
  Instant-Op bestätigt; der zurückgegebene Stand wird abgeglichen (nie dauerhaft driften)."
  (TK 9.7.3)
- **Vollständigkeits-Invariante (Entscheidung dieses Issues, kein TK-Zitat):** Da es keine zweite
  Ordnungsquelle gibt, ist die übergebene `reihenfolge` die **einzige** Instanz, aus der die neue
  `Project.liste` gebaut wird. Enthält sie nicht exakt dieselbe Menge an IDs wie die aktuelle
  Liste, gibt es keine sichere Regel, was mit den fehlenden Elementen geschehen soll (stillschweigend
  entfernen? behalten und ans Ende hängen?) – jede dieser Regeln würde Daten unvorhersehbar
  verändern. Deshalb wird eine nicht exakt passende `reihenfolge` vollständig abgelehnt, bevor
  irgendetwas geschrieben wird.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `reihenfolge` enthält eine ID, die nicht in `Project.liste` existiert | `ungueltige_eingabe` | keine Wirkung |
| `reihenfolge` fehlt mindestens eine ID aus dem aktuellen `Project.liste` | `ungueltige_eingabe` | keine Wirkung |
| `reihenfolge` enthält dieselbe ID mehrfach | `ungueltige_eingabe` | keine Wirkung |
| `reihenfolge` hat exakt dieselbe Menge an IDs wie `Project.liste` (nur Reihenfolge unterscheidet sich) | – (Erfolg) | `Project.liste` wird in neuer Reihenfolge übernommen |

## Nicht selbst entscheiden – STOPP und fragen
- **Diagnose-Tiefe der Fehlermeldung:** Alle drei Abweichungen (fehlende ID, zusätzliche/unbekannte
  ID, doppelte ID) liefern denselben Code `ungueltige_eingabe` (s. Fehlerpfade) – das steht fest.
  Offen ist, ob das freie `meldung`-Feld der `Ergebnis`-Hülle die **betroffenen IDs konkret nennen**
  muss (z. B. „fehlt: 3 IDs, doppelt: 1 ID"), damit der `composer` (M5) dem Nutzer erklären kann,
  *was genau* nicht passt, oder ob ein generischer Text reicht, weil dieser Fall bei korrekt
  arbeitendem UI ohnehin nie eintreten sollte. Nicht selbst festlegen, wie detailliert `meldung`
  sein muss.
- **Zeitpunkt der Aktualisierung von `Project.geaendertAm`:** wie bei den übrigen
  Liste-Mutationen (M1-29/M1-30) ist im TK nicht festgelegt, ob der Zeitstempel bereits bei der
  Instant-Mutation im Speicher oder erst beim entprellten Schreiben gesetzt wird. Nicht selbst
  festlegen, damit alle Liste-Mutationen dasselbe Verhalten zeigen.

## Definition of Done
- [ ] Eine `reihenfolge`, die exakt dieselbe ID-Menge wie `Project.liste` in anderer Abfolge
      enthält, führt zu `Ergebnis<void>` mit `ok: true` und `Project.liste` in der neuen Abfolge
- [ ] Die `Listenelement`-Objekte selbst bleiben inhaltlich unverändert (nur die Array-Position
      ändert sich, keine Felder werden überschrieben)
- [ ] Eine `reihenfolge` mit einer unbekannten ID liefert `ungueltige_eingabe`, `Project.liste`
      bleibt unverändert
- [ ] Eine `reihenfolge`, der eine vorhandene ID fehlt, liefert `ungueltige_eingabe`,
      `Project.liste` bleibt unverändert
- [ ] Eine `reihenfolge` mit einer doppelten ID liefert `ungueltige_eingabe`, `Project.liste`
      bleibt unverändert
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/ordne-neu.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: M1-03 (`Project`/`Listenelement`-Typen), M1-20 (D1-Lock-Primitive `mitD1Lock`),
  M1-22 (`öffneProjekt` lädt das Projekt in den Speicher, ohne das existiert kein `Project.liste`
  zum Umsortieren)
- Blockiert: M5-Issues (composer, Drag-and-Drop-Reorder)

## Bezug
FA-05, TK 9.5.2, TK 9.7.3, TK 9.11.3

---

### Issue M1-32: [project-store] setzeTrim implementieren

## Ziel (in einem Satz)
Eine Instant-Operation validiert und übernimmt neue Trim-Grenzen (in rohen Sekunden) für ein
Video-Listenelement gegen die tatsächliche Länge des referenzierten Video-Assets.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/setze-trim.ts`
- Vertrag: Technisches Konzept **9.5.2**, **9.11.3** (Quelle der Wahrheit); Abgrenzung zu
  **9.2.2**/**9.2.6** (Frame-Rundung ist Aufgabe des `render-service`, nicht dieser Funktion);
  Anforderungsdokument **4.4** (Bedienkonzept)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Diese Funktion ist die einzige Stelle, an der ein Trim-Wunsch gegen die **echte** Quelllänge
geprüft wird, bevor er in `Project.liste` landet. Ließe sie `trimEnde` über `Asset.dauer` hinaus
zu, bekäme `render-service` (9.2) später ein `RenderItem` mit einem Ausschnitt, der länger ist als
die Quelldatei – abhängig von der ffmpeg-Version und den Seek-Parametern scheitert das entweder
mitten im Lauf oder erzeugt stillschweigend ein kürzeres, von der UI abweichendes Ergebnis. Beides
widerspricht der Zusicherung, dass die angezeigte Dauer im `composer` mit der gerenderten
Ausgabedatei übereinstimmt (9.2.6, „Vorschau-Abgleich").

## Signatur (verbindlich – NICHT ändern)
```ts
export async function setzeTrim(
  elementId: string,
  trimStart: number,   // Sekunden, ROH – keine Frame-Rundung hier, s. Invarianten
  trimEnde: number,    // Sekunden, ROH
): Promise<Ergebnis<Listenelement>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `elementId` | ID des zu trimmenden Listenelements | muss in `Project.liste` existieren **und** `art === 'video'` sein |
| `trimStart` | neuer Schnittanfang, Sekunden | `≥ 0`, `< trimEnde` |
| `trimEnde` | neues Schnittende, Sekunden | `≤ Asset.dauer` des über `ref` referenzierten Video-Assets |

Ausgang bei Erfolg: das aktualisierte `Listenelement` mit den neuen, **rohen** (nicht
frame-gerundeten) Werten in `trimStart`/`trimEnde`; `dauer` bleibt `null` (Belegung „video" gemäß
9.11.3-Tabelle: „die Dauer ergibt sich aus dem Trim").
Ausgang bei Fehler: `nicht_gefunden` (Element existiert nicht) oder `ungueltige_eingabe`
(Element ist kein Video, oder die Grenzen sind ungültig).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`setzeTrim` | `elementId`, `trimStart`, `trimEnde` → `Ergebnis<Listenelement>` (validiert
  `0 ≤ start < ende ≤ Videodauer`)" (TK 9.5.2)
- „`video` | `Asset` (typ `video`) | `null` – die Dauer ergibt sich aus dem Trim | gesetzt | erlaubt"
  (TK 9.11.3, Belegungstabelle) – `dauer` bleibt bei `art: "video"` immer `null`, unabhängig vom
  Trim.
- **Grenzziehung zum `render-service` (kein TK-Zitat, Entscheidung dieses Issues, aus TK 9.2.2 und
  9.2.6 abgeleitet):** TK 9.2.2 modelliert `RenderItem` für `"video"` mit `trimStart`/`trimEnde` in
  Sekunden und verweist für den framegenauen Schnitt ausdrücklich auf 9.2.6 – dort steht die
  Rundungsformel (`startFrame = round(trimStart × 30)`, `endFrame = round(trimEnde × 30)`) explizit
  im Abschnitt des `render-service`, nicht in 9.5 (`project-store`). `setzeTrim` speichert daher die
  **rohen** Sekundenwerte unverändert in `Listenelement.trimStart`/`trimEnde`; die Rundung auf das
  30-fps-Raster übernimmt ausschließlich der `render-service` beim Bau des Zwischenclips. Würde
  `setzeTrim` selbst runden, gäbe es zwei Stellen, die dieselbe Rundungsregel korrekt anwenden
  müssten – genau die Art von Duplikation, die 9.11.3 an anderer Stelle ausdrücklich ausschließt.
- „Video (FA-14): zwei Griffe (Anfang/Ende) innerhalb der **Quelllänge** des Videos. Kürzen
  schneidet Anfang/Ende weg; Verlängern ist **nur bis zur Quelllänge** möglich (mehr Material
  existiert nicht)." (Anforderungsdokument 4.4)
- „dauer:        number | null       // Sekunden, 3 Nachkommastellen (Video); null (Bild)"
  (TK 9.4.4, `Asset`-Typdefinition) – die Obergrenze für `trimEnde` ist exakt dieser
  `Asset.dauer`-Wert, ohne eigene Rundung.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `elementId` existiert nicht in `Project.liste` | `nicht_gefunden` | keine Wirkung |
| `elementId` existiert, aber `art !== 'video'` | `ungueltige_eingabe` | keine Wirkung |
| `trimStart < 0` oder nicht endlich | `ungueltige_eingabe` | keine Wirkung |
| `trimStart >= trimEnde` | `ungueltige_eingabe` | keine Wirkung |
| `trimEnde > Asset.dauer` des referenzierten Assets | `ungueltige_eingabe` | keine Wirkung |

## Nicht selbst entscheiden – STOPP und fragen
- **Verhalten bei `Asset.zustand === "fehlt"`:** Reconcile (9.4.7) setzt bei einer fehlenden Datei
  `Asset.zustand = "fehlt"`, löscht aber laut TK **nicht** den zuletzt bekannten `Asset.dauer`-Wert
  (das TK äußert sich dazu nicht ausdrücklich). Es ist unklar, ob `setzeTrim` in diesem Fall (a) mit
  dem zuletzt bekannten `Asset.dauer` normal weiter validiert, (b) die Operation grundsätzlich
  verweigert (mit welchem Code?), oder (c) sie zulässt, weil das Element ohnehin schon über den
  Reparatur-Modus (9.7.5) als kaputt markiert und blockiert ist. Nicht selbst entscheiden – eine
  falsche Wahl könnte entweder eine sinnvolle Reparatur-Aktion blockieren oder einen Trim gegen eine
  unzuverlässige Zahl validieren.
- **Mindestdauer-Prüfung bereits hier oder erst im `render-service`:** Das ausgearbeitete Beispiel
  zum Render-seitigen `berechneTrimFrames` (Übergabe-Prompt Abschnitt 8) behandelt eine Rundung, die
  `startFrame >= endFrame` ergibt, dort als eigenen Fehlerfall. Da `setzeTrim` nur auf
  Sekundenebene prüft (`trimStart < trimEnde`), könnte ein sehr kleiner, aber positiver
  Sekundenunterschied (z. B. `0.01 s`) hier als gültig durchgehen und erst beim Rendern als
  Sub-Frame-Bereich scheitern. Ob `setzeTrim` bereits eine praktische Mindestdauer (z. B. `1/30 s`)
  durchsetzt oder diesen Fall bewusst dem `render-service` überlässt, legt das TK nicht fest – nicht
  selbst festlegen.
- **Zeitpunkt der Aktualisierung von `Project.geaendertAm`:** wie bei den übrigen
  Liste-Mutationen ist im TK nicht festgelegt, ob der Zeitstempel bereits bei der Instant-Mutation
  im Speicher oder erst beim entprellten Schreiben gesetzt wird. Nicht selbst festlegen.

## Definition of Done
- [ ] Ein gültiger Trim innerhalb `[0, Asset.dauer]` mit `trimStart < trimEnde` liefert das
      aktualisierte `Listenelement` mit den **rohen**, ungerundeten Sekundenwerten
- [ ] `dauer` des aktualisierten `Listenelement` bleibt `null`
- [ ] `trimEnde > Asset.dauer` liefert `ungueltige_eingabe`, `Project.liste` bleibt unverändert
- [ ] `trimStart >= trimEnde` liefert `ungueltige_eingabe`, `Project.liste` bleibt unverändert
- [ ] Ein Aufruf auf ein Element mit `art !== 'video'` liefert `ungueltige_eingabe`
- [ ] Eine unbekannte `elementId` liefert `nicht_gefunden`
- [ ] Die Funktion selbst rundet an keiner Stelle auf das 30-fps-Raster (Grep-Probe: keine
      Frame-Arithmetik in dieser Datei)
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/setze-trim.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: M1-01 (`Asset`-Typ, liefert `Asset.dauer` als Obergrenze), M1-03
  (`Project`/`Listenelement`-Typen), M1-20 (D1-Lock-Primitive `mitD1Lock`), M1-22 (`öffneProjekt`
  lädt das Projekt in den Speicher, ohne das existiert kein `Project.liste` zum Mutieren)
- Blockiert: M5-Issues (composer, Dauer-/Trim-Regler), M6-Issues (render-service liest die hier
  gespeicherten rohen Sekundenwerte und rundet sie erst dort)

## Bezug
FA-14, TK 9.5.2, TK 9.2.2, TK 9.2.6, TK 9.11.3, Anforderungsdokument 4.4

---

### Issue M1-33: [project-store] setzeDauer implementieren

## Ziel (in einem Satz)
Eine Instant-Operation validiert und übernimmt eine neue Anzeigedauer für ein Bild- oder
Aktions-Segment-Listenelement gegen den projektweiten Dauer-Bereich; Video-Elemente werden
abgewiesen, weil ihre Dauer sich ausschließlich aus dem Trim ergibt.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/setze-dauer.ts`
- Vertrag: Technisches Konzept **9.5.2**, **9.11.3**, **9.11.4** (Quelle der Wahrheit);
  Anforderungsdokument **4.4** (Bedienkonzept, schließt Video hier explizit aus)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
`dauer` bestimmt, wie lange ein Standbild (Bild oder Aktions-Segment) im finalen Render „ausgehalten"
wird (TK 9.2.6: „`"segment"`- und `"bild"`-Items werden als Standbild über ihre `dauer` bei 30 fps
im Profil ausgehalten"). Würde diese Funktion den Bereich **10–45 s** nicht durchsetzen oder ihn als
Zahlenliteral statt aus der projektweiten Konstante prüfen, könnte ein UI-Bug im `composer` einen
beliebigen Wert (z. B. `0` oder `600`) bis in den Render durchreichen – im einen Fall ein
Standbild mit Nulldauer (ein `RenderItem` ohne Inhalt), im anderen eine Werbeeinblendung, die die
30-Minuten-Warnung (5.3) unbemerkt sprengt. Verwechselt sie zusätzlich ein Video-Element mit einem
Bild-/Segment-Element, würde sie versuchen, ein Feld zu setzen, das laut Datenmodell für Video
immer `null` bleiben muss.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function setzeDauer(
  elementId: string,
  dauer: number,   // Sekunden
): Promise<Ergebnis<Listenelement>>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `elementId` | ID des Listenelements | muss in `Project.liste` existieren **und** `art ∈ {'bild', 'segment'}` sein |
| `dauer` | neue Anzeigedauer, Sekunden | `DAUER_BEREICH.min ≤ dauer ≤ DAUER_BEREICH.max` (M1-09-Konstante, aktuell 10–45 s) |

Ausgang bei Erfolg: das aktualisierte `Listenelement` mit dem neuen `dauer`-Wert;
`trimStart`/`trimEnde`/`einblendung` bleiben `null` (Belegung „bild"/"segment" gemäß
9.11.3-Tabelle).
Ausgang bei Fehler: `nicht_gefunden` (Element existiert nicht) oder `ungueltige_eingabe`
(Element ist ein Video, oder `dauer` liegt außerhalb des Bereichs).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`setzeDauer` | `elementId`, `dauer` → `Ergebnis<Listenelement>` (validiert Bereich **10–45 s**
  für Bild/Segment)" (TK 9.5.2)
- „`video` | `Asset` (typ `video`) | `null` – die Dauer ergibt sich aus dem Trim | gesetzt | erlaubt"
  (TK 9.11.3, Belegungstabelle) – ein Video-Element hat **kein** setzbares `dauer`-Feld; ein Aufruf
  auf ein solches Element ist ein Fehler dieser Funktion, kein Sonderfall im Datenmodell.
- „**Bild / Aktions-Segment (FA-06):** die effektive Anzeigedauer ist frei im Bereich **10–45 s**
  einstellbar (Standard 10 s). Da es keine Quelllänge gibt, ist die Obergrenze die konfigurierte
  Maximaldauer; Kürzen und Verlängern laufen über denselben Regler." (Anforderungsdokument 4.4) –
  Video ist hier **ausdrücklich nicht genannt**; für Video regelt stattdessen die vorangehende
  Zeile (FA-14) den Trim innerhalb der Quelllänge (M1-32).
- „Dauer-Bereich | **10–45 s** | Validierung in `setzeDauer` (9.5.2)" (TK 9.11.4) – der Bereich
  kommt aus `DAUER_BEREICH` in `contracts/types` (M1-09), **nicht** als `10`/`45`-Literal in dieser
  Datei.
- „Konstanten in `contracts/types` (an *einer* Stelle, nicht verstreut):" (TK 9.11.4)

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `elementId` existiert nicht in `Project.liste` | `nicht_gefunden` | keine Wirkung |
| `elementId` existiert, aber `art === 'video'` | `ungueltige_eingabe` | keine Wirkung |
| `dauer < DAUER_BEREICH.min` | `ungueltige_eingabe` | keine Wirkung |
| `dauer > DAUER_BEREICH.max` | `ungueltige_eingabe` | keine Wirkung |
| `dauer` nicht endlich (`NaN`/`Infinity`) | `ungueltige_eingabe` | keine Wirkung |

## Nicht selbst entscheiden – STOPP und fragen
- **Rundung/Präzision von `dauer`:** TK 9.2.6 sagt für Bild/Segment nur, dass sie „als Standbild
  über ihre `dauer` bei 30 fps im Profil ausgehalten" werden – anders als beim Video-Trim (9.2.6,
  explizite Formel `round(... × 30)`) nennt das TK für die Umrechnung von `dauer` (Sekunden) in
  Frames **keine** Rundungsregel. Ob `setzeDauer` beliebige Kommazahlen entgegennimmt (Rundung wäre
  dann allein Sache des `render-service`) oder ob bereits hier auf ein sinnvolles Raster
  eingeschränkt wird (z. B. ganze Sekunden, oder das 30-fps-Raster wie beim Trim), ist nicht
  festgelegt – nicht selbst entscheiden, da dieselbe Drift-Gefahr besteht wie beim Trim (5.3,
  30-Minuten-Warnung hängt an der frame-gerundeten Summe aller Elementdauern, 9.7.4).
- **Zeitpunkt der Aktualisierung von `Project.geaendertAm`:** wie bei den übrigen
  Liste-Mutationen ist im TK nicht festgelegt, ob der Zeitstempel bereits bei der Instant-Mutation
  im Speicher oder erst beim entprellten Schreiben gesetzt wird. Nicht selbst festlegen.

## Definition of Done
- [ ] Ein gültiger Aufruf mit `dauer` innerhalb `[DAUER_BEREICH.min, DAUER_BEREICH.max]` auf ein
      `bild`- oder `segment`-Element liefert das aktualisierte `Listenelement` mit dem neuen
      `dauer`-Wert
- [ ] Ein Aufruf auf ein Element mit `art === 'video'` liefert `ungueltige_eingabe`,
      `Project.liste` bleibt unverändert
- [ ] `dauer` unterhalb von `DAUER_BEREICH.min` oder oberhalb von `DAUER_BEREICH.max` liefert
      `ungueltige_eingabe`, `Project.liste` bleibt unverändert
- [ ] Eine unbekannte `elementId` liefert `nicht_gefunden`
- [ ] Die Zahlen `10`/`45` tauchen in dieser Datei nirgends als Literal auf (Grep-Probe) – die
      Grenzen kommen ausschließlich aus `DAUER_BEREICH` (M1-09)
- [ ] Läuft innerhalb von `mitD1Lock`
- [ ] Keine Datei außerhalb von `src/main/project-store/setze-dauer.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: M1-03 (`Project`/`Listenelement`-Typen), M1-09 (projektweite Konstante
  `DAUER_BEREICH`), M1-20 (D1-Lock-Primitive `mitD1Lock`), M1-22 (`öffneProjekt` lädt das Projekt
  in den Speicher, ohne das existiert kein `Project.liste` zum Mutieren)
- Blockiert: M5-Issues (composer, Dauer-/Trim-Regler)

## Bezug
FA-06, TK 9.5.2, TK 9.11.3, TK 9.11.4, Anforderungsdokument 4.4

---

### Issue M1-34: [project-store] Atomares Schreiben von project.json mit .bak und schemaVersion

## Ziel (in einem Satz)
Eine gemeinsame, modul-interne Schreibfunktion sorgt dafür, dass jede Änderung an `project.json`
atomar (Temp+Rename), mit `.bak`-Sicherung und `schemaVersion` geschieht – aufgerufen vom
entprellten Auto-Speichern (M1-35) und von jeder Instant-Operation, die einen Sofort-Flush
auslöst.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/schreibe-projekt.ts`
- Vertrag: Technisches Konzept **9.5.4**, **9.5.5**, **9.5.1** (Quelle der Wahrheit)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Diese Funktion ist die **einzige** Stelle, die tatsächlich auf die Platte schreibt – das
Gegenstück zu `schreibeConfig` (M1-19) für `config.json`, jetzt für die fachlich weit wichtigere
Datei: `project.json` trägt Projekt, Aktionen-Bibliothek und Liste, also jede Wiedergabe- und
Werbeplanung des Studios. Schreibt sie fehlerhaft (kein Temp+Rename, kein Backup), zerstört ein
Absturz mitten im Schreiben nicht nur die Sitzungsinfo (wie bei `config.json`), sondern das
gesamte Projekt – FA-15 („kein Datenverlust") wäre gebrochen. Das bereits bestehende Issue M1-22
(`öffneProjekt`) verlässt sich beim Laden **auf genau das Backup**, das diese Funktion erzeugt:
liefert `schreibeProjekt` kein verlässliches `.bak`, ist der dortige Wiederherstellungspfad
wirkungslos.

**Abgrenzung zu M1-22 (wichtig, um Doppelarbeit zu vermeiden):** Das Laden mit Fallback auf `.bak`
und die `schemaVersion`-Prüfung/-Migration **beim Laden** sind bereits vollständig Teil von M1-22
(`öffneProjekt`) – dieselbe Aufgabenteilung wie im bestehenden Paar M1-19 (schreibt `config.json`)
und M1-14 (`leseKonfig`, macht dort den `.bak`-Fallback). Dieses Issue liefert **nur** die
Schreib-Seite: atomar schreiben, `.bak` aktuell halten, `schemaVersion` beim Schreiben setzen.

## Signatur (verbindlich – NICHT ändern)
```ts
export async function schreibeProjekt(projekt: Project): Promise<Ergebnis<void>>
// 1. projekt + aktuelle schemaVersion nach <Datenort>/projects/<projekt.id>/project.json.tmp schreiben
// 2. fs.rename project.json.tmp -> project.json (atomar, gleiche Partition)
// 3. VORHER (vor Schritt 1): bestehende project.json (falls vorhanden) nach project.json.bak
//    kopieren (fs.copyFile, KEIN Verschieben/Unlink der Quelle)
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `projekt` | vollständiges `Project`-Objekt des aktiven Projekts | wird unverändert serialisiert, nur `schemaVersion` wird beim Schreiben (neu) gesetzt |

Ausgang bei Erfolg: `Ergebnis<void>` – `project.json` ist entweder vollständig neu oder
unverändert (nie halb geschrieben), `project.json.bak` enthält die zuvor gültige Version.
Ausgang bei Fehler: `speicher_fehler` bei I/O-Fehlern (Platte voll, Rechte, gesperrte Datei).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Atomar:** Schreiben nach Temp-Datei + Rename (gleiche Partition). `project.json` ist **nie**
  halb geschrieben." (TK 9.5.4)
- „**Ein Backup:** `project.json.bak` = letzte heile Version." (TK 9.5.4) – die Wiederherstellung
  selbst („Ist `project.json` beim Laden defekt → aus `.bak` wiederherstellen …") ist Sache von
  M1-22; diese Funktion muss lediglich sicherstellen, dass `.bak` **vor** jedem Schreiben die
  vorherige, zu diesem Zeitpunkt noch intakte Version enthält.
- „Jede `project.json` und `config.json` trägt eine `schemaVersion`." (TK 9.5.5)
- „Besitzt `project.json` je Projekt … und das **eine D1-Schreib-Lock**." (TK 9.5.1) – diese
  Funktion ruft **selbst nicht** `mitD1Lock` (M1-20) auf, da sie ausschließlich aus Aufrufern
  heraus benutzt wird, die die Schreiboperation bereits innerhalb ihres eigenen
  `mitD1Lock`-Aufrufs ausführen (z. B. der entprellte Flush in M1-35). Laut M1-20 darf `aktion`
  „selbst nicht erneut `mitD1Lock` aufrufen (Deadlock-Gefahr)" – ein zweiter Lock-Aufruf hier wäre
  genau dieser Fehler.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| I/O-Fehler beim Kopieren nach `.bak` (vor dem eigentlichen Schreiben) | `speicher_fehler` | Verhalten (Abbruch vs. trotzdem schreiben mit veraltetem Backup) nicht durch TK 9.5.4 festgelegt, s. „Nicht selbst entscheiden" |
| I/O-Fehler beim Schreiben von `.tmp` (Platte voll, Rechte) | `speicher_fehler` | `project.json` bleibt unverändert (Rename fand nie statt) |
| I/O-Fehler beim Rename | `speicher_fehler` | im Normalfall bleibt entweder alte oder neue Datei vollständig bestehen (plattformabhängig, s. „Nicht selbst entscheiden") |

## Nicht selbst entscheiden – STOPP und fragen
- **Verhalten bei einem Fehlschlag des `.bak`-Kopierens:** Bricht ein fehlgeschlagenes Kopieren
  nach `.bak` den gesamten Schreibvorgang ab (kein Schreiben von `project.json` ohne frisches
  Backup) oder wird trotzdem geschrieben (Schreiben hat Vorrang, `.bak` bleibt veraltet)? Weder TK
  9.5.4 noch das Gegenstück M1-19 entscheiden das explizit. **Nicht selbst festlegen** – beide
  Varianten haben eine echte Konsequenz (verhindertes Schreiben trotz gültiger neuer Daten vs. ein
  Backup, das im Ernstfall nicht mehr die zuletzt gültige Version ist).
- **Windows-Rename-Verhalten:** Windows kennt kein atomares Overwrite-Rename wie POSIX; ein
  `fs.rename` auf eine bestehende, kurzzeitig geöffnete Zieldatei (Virenscanner, Backup-Tool) kann
  mit `EBUSY`/`EPERM` fehlschlagen. Ob hier ein Retry+Backoff nötig ist (wie beim `export-service`
  vorgezeichnet: „**Atomar ersetzen:** `.part` → `<dateiname>` per Rename-mit-Ersetzen. Auf Windows
  bei `EBUSY`/`EPERM` **Retry+Backoff**." TK 9.6.2) – dieselbe Klasse von Problem wie beim
  `config-store` (M1-19) und `export-service` (M6); falls dort bereits eine Lösung feststeht,
  dieselbe hier wiederverwenden, sonst gemeinsam klären statt drei unterschiedliche Workarounds für
  dasselbe Problem zu bauen. **Nicht selbst erfinden.**
- **`fsync` vor der Erfolgsmeldung:** Ob die `.tmp`-Datei vor dem Rename ge-`fsync`t wird (Bytes
  physisch auf der Platte, bevor „erfolgreich" gilt) und ob zusätzlich der Verzeichnis-Eintrag
  ge-`fsync`t werden muss, damit das Rename selbst einen Absturz übersteht (POSIX-Feinheit) – TK
  9.5.4 nennt dies für `project.json` nicht ausdrücklich (anders als TK 9.6.2/9.6.3 für den
  USB-Export), das Gegenstück M1-19 ebenfalls nicht. Da ein Absturz kurz nach einem ungesicherten Rename hier ein
  ganzes Projekt kosten könnte, **nicht stillschweigend weglassen** – explizit klären, ob dasselbe
  Sicherheitsniveau wie beim Export gilt.
- **macOS-Falle bewusst umgangen, nicht ignoriert:** „`unlink` gelingt still, obwohl die Datei noch
  geöffnet ist" betrifft ein `move`/`unlink`-basiertes Backup nicht, wenn die `.bak`-Erstellung wie
  oben festgelegt über `fs.copyFile` (kopieren, **nicht** verschieben) läuft. Wird stattdessen ein
  Verschieben/Unlink-Ansatz gewählt, muss dieser Fall zusätzlich behandelt werden – **nicht
  wechseln**, ohne das neu zu bewerten.

## Definition of Done
- [ ] Ein Schreibvorgang, der mitten im `.tmp`-Schreiben simuliert abbricht, hinterlässt eine
      unveränderte `project.json`
- [ ] Vor jedem Schreiben wird `.bak` aktualisiert (Test: `.bak` enthält die vorherige Version)
- [ ] `schemaVersion` ist in jeder geschriebenen Datei vorhanden
- [ ] Das Verhalten bei einem simulierten Fehlschlag des `.bak`-Kopierens entspricht nachweislich
      der im STOPP-Block geklärten Variante (Test erst nach dieser Klärung schreibbar)
- [ ] Keine Datei außerhalb von `src/main/project-store/schreibe-projekt.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Ordnerstruktur), #5 (`ermittleDatenOrt`, liefert den Basispfad), #12
  (`Ergebnis<T>` + generische Fehlercodes), M1-03 (`Project`-Typ, den diese Funktion serialisiert)
- Blockiert: M1-35 (Auto-Speichern ruft diese Funktion für jeden Flush auf), M1-21 bis M1-33
  (jede Instant-Operation, die einen Sofort-Flush auslösen kann)

## Bezug
FA-15, NFA-02, Akzeptanzkriterium 6, TK 9.5.4, TK 9.5.5, TK 9.5.1

---

### Issue M1-35: [project-store] Auto-Speichern: Entprellung, Sofort-Flush, Ereignis bei Fehler

## Ziel (in einem Satz)
Jede Änderung am aktiven Projekt landet spätestens 3–5 s später oder sofort bei einem definierten
Auslöser auf der Platte, ohne dass die App dabei jemals Änderungen verwirft oder Fehler
verschweigt.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/auto-speichern.ts`
- Vertrag: Technisches Konzept **9.5.4** (Quelle der Wahrheit), **9.1.1** (Ereignis-Konvention)
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Dies ist die zentrale Umsetzung von FA-15 („kein manuelles Speichern, kein Datenverlust") und
damit ein Rückgrat von NFA-02. Jede der ~13 Instant-Operationen aus M1-21 bis M1-33 ändert das
Projekt **nur im Speicher** (TK 9.5.4: „Instant-Op vs. Speichern getrennt") – **diese** Datei ist
die einzige Stelle, die dafür sorgt, dass diese Änderungen tatsächlich dauerhaft werden. Fehlt die
Entprellung, hämmert jeder Slider-Zug (Trim/Dauer) die Platte; fehlt der blockierende Flush beim
Beenden, kann die letzte Sekunde Arbeit beim Schließen der App verloren gehen; wird ein
Speicherfehler still verschluckt statt gemeldet, glaubt der Nutzer, gespeichert zu haben, obwohl
das nicht der Fall ist – für ein Werbe-Tool, das ein Studio-Mitarbeiter ohne IT-Hintergrund
bedient, wäre das der schädlichste denkbare stille Fehler.

**Klare Trennung zur Renderer-Seite:** Die **Anzeige** des „nicht gespeichert"-Hinweises ist Sache
von `app-shell` (M7, noch nicht ausgeschrieben). Dieses Issue liefert **nur** die Main-Seite: das
Auslösen der Speicherung, die automatische Wiederholung bei Fehlern und ein **Ereignis** an den
Renderer, aus dem `app-shell` später den Hinweis bauen kann.

## Signatur (verbindlich – NICHT ändern)
```ts
export type AutoSpeichernEreignis =
  | { typ: "gespeichert" }
  | { typ: "fehler"; code: Fehlercode }
// KEINE Ergebnis<T>-Hülle: „Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle" (TK 9.1.1)
// Kanalname (an ipc-gateway zu übergeben, M2/später): "project:autoSpeichernStatus"
// ("<modul>:<ereignis>", TK 9.1.1)

export function planeAutoSpeicherung(projekt: Project): void
// merkt projekt als zu speichernde, aktuelle Version des aktiven Projekts vor; (re-)startet den
// 3-5s-Entprellungstimer; KEIN Rückgabewert, da reine Terminplanung nicht fehlschlagen kann

export async function sofortFlush(projekt: Project): Promise<Ergebnis<void>>
// bricht einen laufenden Entprellungstimer ab und schreibt projekt sofort via schreibeProjekt
// (M1-34); MUSS von der aufrufenden Stelle innerhalb von mitD1Lock (M1-20) ausgeführt werden;
// wird aufgerufen: vor jedem Render/Export, bei Projektwechsel (öffneProjekt, M1-22), beim
// Beenden der App (Aufrufer wartet das zurückgegebene Promise ab, bevor die App tatsächlich
// schließt)

export function aufAutoSpeichernEreignis(
  hoerer: (ereignis: AutoSpeichernEreignis) => void,
): () => void
// registriert einen Listener für Statuswechsel; Rückgabewert ist die Abmelde-Funktion
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `projekt` (beide Funktionen) | die aktuelle, bereits im Speicher gültige Version des aktiven Projekts | wird unverändert an `schreibeProjekt` (M1-34) weitergereicht |
| `hoerer` | Callback für Statuswechsel | keine fachliche Validierung, reine Registrierung |

Ausgang bei Erfolg (`sofortFlush`): `Ergebnis<void>`; danach feuert `aufAutoSpeichernEreignis` mit
`{ typ: "gespeichert" }`, falls zuvor ein Fehler-Zustand aktiv war.
Ausgang bei Fehler (`sofortFlush`): `speicher_fehler` (durchgereicht von `schreibeProjekt`,
M1-34); zusätzlich feuert das Ereignis `{ typ: "fehler", code: "speicher_fehler" }`, und ein
automatischer Wiederholversuch wird angestoßen (s. Invarianten).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Entprellt 3–5 s** nach der letzten Änderung (kein Platten-Hämmern beim Slider-Ziehen)." (TK
  9.5.4)
- „**Sofort-Flush** unabhängig vom Timer: **vor** jedem Render/Export, **bei** Projektwechsel,
  **beim** Beenden. Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist
  (kein Schließen mit ausstehendem Schreiben)." (TK 9.5.4)
- „**Instant-Op vs. Speichern getrennt:** Eine Instant-Operation (9.5.2) validiert und wendet **im
  Speicher** an, *bevor* sie „ok" meldet – ihr Erfolg bedeutet „gültig übernommen", **nicht** „schon
  auf Platte". Die Platten-Schreibung ist die entprellte Auto-Speicherung." (TK 9.5.4)
- „**Speicherfehler sind sichtbar (NFA-02):** Scheitert eine Auto-Speicherung (Platte voll,
  Rechte), wird das **nicht still verschluckt** – die UI zeigt dauerhaft „nicht gespeichert" +
  automatischer Wiederholversuch; die Änderungen **bleiben im Speicher** (kein Rollback, kein
  Arbeitsverlust). Erst nach erfolgreichem Schreiben verschwindet der Hinweis." (TK 9.5.4)
- „Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle" (TK 9.1.1, Punkt 2) – und:
  „Ereignisse sind Einbahnstraßen und tragen keinen Endzustand" (TK 9.1.1, Punkt 5). Das
  `AutoSpeichernEreignis` ist daher **kein** `Ergebnis<T>` und **kein** Ersatz für den Rückgabewert
  von `sofortFlush`.
- „Kanalbenennung … Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B.
  `queue:geaendert`, `render:fortschritt`." (TK 9.1.1) – hier `project:autoSpeichernStatus`.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `schreibeProjekt` (M1-34) scheitert (Platte voll, Rechte, gesperrte Datei) | `speicher_fehler` | Änderungen bleiben im Speicher (kein Rollback); Ereignis `{ typ: "fehler", code: "speicher_fehler" }` feuert; automatischer Wiederholversuch wird geplant |
| Wiederholversuch scheitert erneut | `speicher_fehler` | Ereignis feuert erneut; Wiederholung läuft weiter, bis Erfolg oder App-Ende |
| `sofortFlush` beim Beenden scheitert | `speicher_fehler` | Aufrufer (Beenden-Handler) erhält den Fehler zurück; **STOPP-Punkt**, ob die App trotzdem schließen darf |

## Nicht selbst entscheiden – STOPP und fragen
- **Wiederholstrategie nach Fehlschlag:** TK 9.5.4 verlangt „automatischer Wiederholversuch",
  nennt aber weder Intervall noch Obergrenze. Fester Abstand? Exponentielles Backoff? Endlos oder
  mit Obergrenze (und was passiert danach)? **Nicht selbst festlegen** – ein zu aggressives Retry
  könnte bei „Platte voll" die Situation nur wiederholt prüfen, ohne Nutzen, ein zu träges Retry
  verlängert die Zeit mit sichtbarem „nicht gespeichert"-Hinweis unnötig.
- **Verhalten von `sofortFlush` beim Beenden, wenn der Schreibvorgang selbst fehlschlägt:** TK
  9.5.4 sagt nur, dass die App **blockiert**, bis „der Schreibvorgang abgeschlossen ist" – nicht,
  was bei einem *fehlgeschlagenen* Schreibvorgang beim Beenden passiert. Schließt die App trotzdem
  (Änderungen sind dann nur noch im flüchtigen Speicher und gehen beim Beenden verloren – ein
  Widerspruch zu „kein Arbeitsverlust")? Oder verhindert ein fehlgeschlagener Flush das Beenden
  ganz (Nutzer sitzt vor einer App, die sich nicht schließen lässt)? **Beides hat spürbare
  Nutzungs-Konsequenzen – nicht selbst wählen.**
- **Mehrfache `planeAutoSpeicherung`-Aufrufe während ein `sofortFlush` bereits läuft:** Setzt ein
  weiterer Instant-Op-Aufruf während eines laufenden Sofort-Flushs einfach den Entprellungstimer
  neu, oder muss auf das Ende des laufenden Flushs gewartet werden? TK 9.5.4 regelt dieses
  Zusammenspiel nicht explizit; da `schreibeProjekt` (M1-34) ohnehin unter `mitD1Lock` läuft, ist
  ein zeitliches Verschachteln zwar unmöglich – die **Reihenfolge**, in der wartende Schreibungen
  dann ausgeführt werden (immer der zuletzt übergebene `projekt`-Stand vs. jeder Aufruf einzeln),
  ist aber offen. Nicht raten.

## Definition of Done
- [ ] Mehrere `planeAutoSpeicherung`-Aufrufe innerhalb von 3–5 s lösen nur **einen** Schreibvorgang
      aus (Test mit künstlicher Zeitsteuerung)
- [ ] `sofortFlush` schreibt sofort, unabhängig vom laufenden Entprellungstimer (Test: Timer läuft
      noch, `sofortFlush` wird trotzdem sofort ausgeführt)
- [ ] Ein simulierter Fehlschlag von `schreibeProjekt` löst das Ereignis `{ typ: "fehler", code:
      "speicher_fehler" }` aus, **ohne** die zuvor übergebenen Projektdaten zu verwerfen
- [ ] Nach einem erfolgreichen Wiederholversuch feuert `{ typ: "gespeichert" }`
- [ ] Keine Datei außerhalb von `src/main/project-store/auto-speichern.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: M1-03 (`Project`-Typ, den diese Datei entgegennimmt), M1-20 (D1-Lock, muss den
  tatsächlichen Schreibvorgang jeder Instanz dieser Funktion umschließen), M1-34 (`schreibeProjekt`,
  die eigentliche Schreibfunktion, die hier aufgerufen wird)
- Blockiert: M1-21 bis M1-33 (jede Instant-Operation ruft `planeAutoSpeicherung` auf), M1-22
  (`öffneProjekt` ruft `sofortFlush` beim Projektwechsel auf), M7-Issues (app-shell zeigt den
  „nicht gespeichert"-Hinweis anhand von `aufAutoSpeichernEreignis`)

## Bezug
FA-15, NFA-02, Akzeptanzkriterium 6, TK 9.5.4, TK 9.1.1

---

### Issue M1-36: [project-store] schemaVersion-Migration für project.json

## Ziel (in einem Satz)
Ein bereits als **älter** erkanntes, geparstes `project.json`-Objekt wird schrittweise auf die
aktuelle `schemaVersion` gehoben, ohne dabei ein einziges Feld stillschweigend zu verwerfen.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/migriere-projekt.ts`
- Vertrag: Technisches Konzept **9.5.5** (Quelle der Wahrheit), im Zusammenspiel mit **9.5.1**,
  **9.5.4**, **9.11.3**
- Prozess/Speicher: D1

## Warum das im Gesamtsystem wichtig ist
Diese Funktion ist die einzige Stelle im System, die ein Projekt nach einem App-Update noch lesbar
macht, obwohl sich sein Datenformat geändert hat. `öffneProjekt` (M1-22) verlässt sich vollständig
auf sie: Erkennt `öffneProjekt` eine niedrigere `schemaVersion`, ruft es diese Funktion auf und lädt
danach normal weiter – liefert diese Funktion ein Objekt mit fehlenden oder verlorenen Feldern
zurück, merkt das im schlimmsten Fall niemand sofort, sondern erst Wochen später, wenn eine Aktion
oder ein Werbeband im Render plötzlich fehlt. Ein Fehler hier ist damit ein **verzögerter**
Datenverlust, der sich nicht auf den Moment des Updates zurückverfolgen lässt.

**Abgrenzung zu M1-22 (Arbeitsteilung, nicht doppeln):** `öffneProjekt` (M1-22) entscheidet und
prüft **beide** Fälle von 9.5.5 – „höhere (unbekannte) Version → Fehler" **und** „ältere Version →
Migration" – und ruft diese Funktion **ausschließlich** dann auf, wenn es die Version bereits
eindeutig als **älter** erkannt hat. Diese Funktion prüft deshalb **nicht erneut**, ob die
mitgegebene `schemaVersion` zu hoch ist – das ist vollständig Sache von M1-22 (siehe dort:
„`schemaVersion` höher als bekannt | `unbekannter_fehler` (oder eigener Code) | kein Laden"). Eine
zweite Prüfung an dieser Stelle würde dieselbe Fehlerentscheidung an zwei Stellen treffen, die dann
bei einer künftigen Änderung auseinanderlaufen können.

**Abgrenzung zu M1-34 (Arbeitsteilung, nicht doppeln):** Das **Schreiben** eines Objekts nach
`project.json` (atomar, mit `.bak`) ist vollständig Sache von `schreibeProjekt` (M1-34). Diese
Funktion schreibt **nichts** auf die Platte – sie ist eine reine Transformation **im Speicher** und
liefert das migrierte `Project`-Objekt an ihren Aufrufer zurück. Ob und wann das Ergebnis dieser
Funktion tatsächlich auf die Platte zurückgeschrieben wird (sofort nach dem Öffnen oder erst beim
nächsten regulären Auto-Speichern, 9.5.4), entscheidet `öffneProjekt` (M1-22) bzw. der dortige
Aufrufkontext – **nicht** dieses Issue.

## Signatur (verbindlich – NICHT ändern)
```ts
export type MigrationsSchritt = (
  alt: Record<string, unknown>,
) => Record<string, unknown>
// alt: das Objekt VOR diesem Schritt (Schlüssel in MIGRATIONS_KETTE = seine schemaVersion).
// Rückgabe: das Objekt NACH diesem Schritt – schemaVersion darin um GENAU 1 höher als in `alt`.
// Verbindlich für jede künftige Implementierung eines Schritts: alle aus `alt` unbekannten Felder
// werden per Spread unverändert in die Rückgabe übernommen (nie stillschweigend weglassen);
// bekannte, in der alten Fassung fehlende Felder werden auf einen dokumentierten Vorgabewert
// gesetzt (nie einfach `undefined` lassen).

export const MIGRATIONS_KETTE: ReadonlyMap<number, MigrationsSchritt> = new Map([
  // Aktuell LEER: es gibt bislang nur EINE schemaVersion. Der erste Eintrag (Schlüssel = alte
  // Version, Wert = Schritt auf Version+1) entsteht erst mit der nächsten tatsächlichen
  // Formatänderung. Die Konstante für „die aktuelle Version" ist AKTUELLE_SCHEMA_VERSION aus
  // src/shared/contracts/konstanten.ts (M1-09) – hier NICHT lokal neu definieren.
])

export function migriereProjekt(
  rohdaten: Record<string, unknown> & { schemaVersion: number },
  kette: ReadonlyMap<number, MigrationsSchritt> = MIGRATIONS_KETTE,
): Ergebnis<Project>
// wendet, beginnend bei rohdaten.schemaVersion, Schritte aus `kette` an, bis das Ergebnis die
// aktuelle schemaVersion erreicht (Kettenprinzip: 1→2, 2→3, … – nie ein Sprung in einem Schritt).
// `kette` hat einen Vorgabewert (MIGRATIONS_KETTE) und wird von öffneProjekt (M1-22) NIE explizit
// mitgegeben; der zweite Parameter existiert ausschließlich, damit Tests eine eigene, kleine Kette
// mit Test-Schritten einspeisen können, ohne eine fachlich noch nicht existierende Migration in
// MIGRATIONS_KETTE selbst erfinden zu müssen.
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `rohdaten` | bereits als JSON geparstes, aber noch unvalidiertes Objekt aus `project.json` bzw. `.bak`; von `öffneProjekt` (M1-22) bereits eindeutig als **älter** als `AKTUELLE_SCHEMA_VERSION` erkannt | muss ein Objekt mit lesbarem `schemaVersion: number` sein; die Prüfung „ist sie wirklich älter" ist **nicht** Aufgabe dieser Funktion (s. Abgrenzung oben) |
| `kette` | Migrationskette | Vorgabewert `MIGRATIONS_KETTE`; nur Tests geben etwas anderes mit |

Ausgang bei Erfolg: vollständiges `Project`-Objekt mit `schemaVersion === AKTUELLE_SCHEMA_VERSION`;
jedes aus `rohdaten` bekannte Feld ist erhalten (unbekannte Felder unverändert durchgereicht,
bekannte fehlende Felder auf ihren Vorgabewert gesetzt).
Ausgang bei Fehler: `unbekannter_fehler` bei lückenhafter/inkonsistenter Kette (oder ein eigener,
dem Nutzer erklärbarer Code – s. „Nicht selbst entscheiden").

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Jede `project.json` und `config.json` trägt eine `schemaVersion`. Beim Laden: **höhere**
  (unbekannte) Version → Fehler (nicht raten); **ältere** Version → definierte Migration auf die
  aktuelle. So bleiben ältere Projekte nach App-Updates lesbar." (TK 9.5.5)
- Die Ergebnis-Hülle gilt auch hier, obwohl diese Funktion kein eigener IPC-Kanal ist: „`Ergebnis<T>
  = { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string } }`" (TK
  9.1.1). **Niemals** `throw` – diese Funktion wird aus `öffneProjekt` heraus benutzt, das seinerseits
  einer IPC-bedienten Operation dient (TK 9.1.1).
- „Das **aktive** Projekt lebt zur Laufzeit **im Speicher**." (TK 9.5.1) – das Ergebnis dieser
  Funktion ist genau das Objekt, das anschließend als aktives Projekt im Speicher landet; es muss
  daher der vollständigen `Project`-Form aus TK 9.11.3 entsprechen.
- „Aktuelle `schemaVersion` | **1** | wird von `öffneProjekt`, `schreibeProjekt` und der Migration
  gelesen (9.5.5) – **eine** Stelle, sonst laufen drei Kopien auseinander" (TK 9.11.4) – die
  Konstante `AKTUELLE_SCHEMA_VERSION` liegt zentral in `src/shared/contracts/konstanten.ts` (M1-09)
  und wird von dieser Funktion importiert, nicht lokal neu definiert.

**Architektur-Entscheidung dieses Issues (kein TK-Zitat, aber verbindlich für die Umsetzung):**
Migrationen laufen **immer** als Kette einzelner Ein-Versions-Schritte (1→2, 2→3, …), niemals als
ein einziger Sprung von einer beliebig alten auf die aktuelle Version. Grund: Nur so bleibt jeder
einzelne Schritt klein, isoliert testbar und wiederverwendbar, wenn irgendwann eine dritte Version
dazukommt – ein monolithischer „von-irgendwas-auf-aktuell"-Konverter müsste sonst bei jeder neuen
Version komplett neu geschrieben werden und würde mit der Zeit unüberschaubar. Aus demselben Grund
darf kein Schritt mehr als eine Version überspringen, und kein Schritt darf ein ihm unbekanntes
Feld aus `alt` weglassen – Datenverlust durch eine Migration ist nicht akzeptabel.

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| Für die in `rohdaten` stehende (oder eine im Kettenverlauf durchlaufene) `schemaVersion` existiert **kein** Eintrag in `kette` | `unbekannter_fehler` (oder eigener Code, s. „Nicht selbst entscheiden") | Migration bricht sofort ab; **kein** Teilergebnis wird zurückgegeben, `rohdaten` bleibt beim Aufrufer unverändert im Spiel |
| Ein Schritt liefert eine `schemaVersion`, die **nicht genau** um 1 höher ist als vorher (Konsistenz-Schutz gegen einen fehlerhaften künftigen Schritt) | `unbekannter_fehler` (oder eigener Code, gleiche Entscheidung wie oben) | Migration bricht sofort ab; kein Teilergebnis |

## Nicht selbst entscheiden – STOPP und fragen
- **Fehlercode für eine lückenhafte/inkonsistente Kette:** TK 9.5.5 sagt nur, dass eine „definierte
  Migration" existieren soll, benennt aber keinen Fehlerfall für den (aktuell rein hypothetischen)
  Fall, dass für einen Versionssprung **kein** Schritt definiert ist. Genau dieselbe Art Lücke hat
  bereits M1-22 offen für „schemaVersion höher als bekannt" (dort als Vorschlag: eigener Code statt
  pauschal `unbekannter_fehler`, weil der Zustand dem Nutzer erklärbar sein sollte). Ob hier
  derselbe generische `unbekannter_fehler` reicht oder ein eigener, dem Nutzer erklärbarer Code
  (z. B. „Migration für dieses Projektformat fehlt") sinnvoller ist – **nicht selbst festlegen**,
  gemeinsam mit der offenen Frage aus M1-22 klären, damit beide Fälle nicht zwei unterschiedliche
  Codes für dieselbe Nutzer-Botschaft „dieses Projekt kann diese App-Version nicht öffnen" bekommen.
- **Laufzeit-Prüfung des Endergebnisses:** Ob das Ergebnis der letzten Kettenstufe zusätzlich gegen
  die vollständige `Project`-Form geprüft wird (z. B. fehlt nach einem fehlerhaft implementierten
  künftigen Schritt ein Pflichtfeld), oder ob die TypeScript-Typisierung von `MigrationsSchritt` als
  ausreichend gilt – TypeScript prüft zur Laufzeit **nichts**; ein Schritt, der ein Pflichtfeld
  vergisst, würde sonst unbemerkt durchrutschen. Da der Kernpunkt dieses Issues gerade das
  Verhindern von unbemerktem Datenverlust ist, **nicht stillschweigend** auf reine
  Compile-Zeit-Sicherheit vertrauen – klären, ob eine Mindest-Laufzeitprüfung nötig ist.

## Definition of Done
- [ ] `MIGRATIONS_KETTE` ist zur Laufzeit eine leere `Map` (`MIGRATIONS_KETTE.size === 0`), solange
      es fachlich nur eine `schemaVersion` gibt – dieses Issue erfindet **keine** Migration, die es
      noch nicht gibt
- [ ] Test mit einer im Testfile lokal gebauten `kette` mit genau einem Schritt (Ausgangsversion
      `n → n+1`, künstlich gewählt): `migriereProjekt({ schemaVersion: n, ...zusatzfeld }, kette)`
      liefert `Ergebnis<Project>` mit `schemaVersion === n+1` und dem im Test hinzugefügten,
      dem Schritt unbekannten Zusatzfeld unverändert erhalten (belegt: kein Datenverlust)
- [ ] Test mit einer zweistufigen Test-Kette (`n→n+1`, `n+1→n+2`): das Ergebnis zeigt, dass **beide**
      Schritte nacheinander angewendet wurden, nicht nur der erste (belegt das Kettenprinzip)
- [ ] Test: fehlt in `kette` ein Schritt für die durchlaufene `schemaVersion`, liefert die Funktion
      einen Fehler statt eines unveränderten oder halb migrierten Objekts (kein stilles Durchwinken)
- [ ] Test: ein absichtlich fehlerhafter Test-Schritt, der die `schemaVersion` um 2 statt 1 erhöht,
      wird erkannt und führt zum selben Fehlerfall wie eine lückenhafte Kette
- [ ] Alle Fehlerpfade oben liefern den genannten Code (kein `throw` über die IPC-Grenze)
- [ ] Keine Datei außerhalb von `src/main/project-store/migriere-projekt.ts` (+ zugehörige
      Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Ordnerstruktur/Toolchain), #12 (`Ergebnis<T>` + generische Fehlercodes),
  M1-03 (`Project`-Typ), M1-09 (liefert `AKTUELLE_SCHEMA_VERSION` zentral aus
  `src/shared/contracts/konstanten.ts` – diese Funktion definiert die Konstante nicht selbst)
- Blockiert: M1-22 (`öffneProjekt` ruft `migriereProjekt` bei älterer `schemaVersion` auf)

## Bezug
FA-15, NFA-02, Akzeptanzkriterium 6, TK 9.5.5, TK 9.5.1, TK 9.11.3

---

### Issue M1-37: [project-store] Pfad-Autorität: Auflösung von Projekt- und Medienpfaden

## Ziel (in einem Satz)
Der `project-store` liefert über eine einzige Funktionsgruppe die absoluten Pfade für Projektordner,
Medienordner, Ausgabeordner sowie einzelne Asset- und Ausgabedateien, sodass **kein** anderer
Main-Dienst das Datei-Layout eines Projekts selbst nachbaut oder errät.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/pfade.ts`
- Vertrag: Technisches Konzept **9.5.7** (Quelle der Wahrheit), TK Abschnitt 6, TK 9.4.8 Punkt 1,
  TK 9.2.6 (Namensvalidierung für Ausgabedateien)
- Prozess/Speicher: D1, D2

## Warum das im Gesamtsystem wichtig ist
`media-service` (Kopieren/Löschen), `render-service` (Lesen beim Normalisieren), `export-service`
(Quelle: die gewählte Datei aus `projects/<id>/output/`) und der `media://`-Handler (M1-38) müssen
alle **denselben** Pfad für dieselben Eingaben berechnen. Baut irgendeines dieser Module den Pfad stattdessen selbst zusammen
(„kennt“ das Layout), können zwei Stellen bei einer künftigen Layout-Änderung auseinanderlaufen –
und weil `dateiname` letztlich aus `project.json` stammt (potenziell aus einer beschädigten oder von
außen manipulierten Datei), ist eine fehlende Path-Traversal-Prüfung hier kein theoretisches
Risiko: Ein präparierter `dateiname`-Wert könnte sonst Dateien außerhalb des Projektordners lesbar
machen, sobald irgendein Main-Dienst ihn ungeprüft mit `path.join` verwendet.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/main/project-store/pfade.ts

export function projektOrdner(projektId: string): string
// absoluter Pfad des Projektordners, z. B. `<Datenort>/projects/<projektId>` (TK Abschnitt 6);
// reine String-Operation, kein Dateisystemzugriff, keine Existenzprüfung

export function medienOrdner(projektId: string): string
// absoluter Pfad des Medienordners dieses Projekts, z. B.
// `<Datenort>/projects/<projektId>/media` (TK Abschnitt 6, TK 9.5.7);
// reine String-Operation, kein Dateisystemzugriff

export function loeseAssetPfad(projektId: string, dateiname: string): Ergebnis<string>
// absoluter Pfad zur Asset-Datei; liefert NUR einen Pfad, wenn dieser nach Normalisierung
// nachweislich innerhalb von medienOrdner(projektId) liegt, sonst `ungueltige_eingabe`;
// reine String-/Pfad-Operation (kein `fs.*`-Aufruf, keine Existenzprüfung)

export function ausgabeOrdner(projektId: string): string
// absoluter Pfad des Ausgabeordners dieses Projekts, z. B.
// `<Datenort>/projects/<projektId>/output` (TK Abschnitt 6, TK 9.5.7);
// reine String-Operation, kein Dateisystemzugriff

export function loeseAusgabePfad(projektId: string, ausgabeName: string): Ergebnis<string>
// absoluter Pfad `ausgabeOrdner(projektId)/<ausgabeName>.mp4`; liefert NUR einen Pfad, wenn
// `ausgabeName` die Namensvalidierung aus TK 9.2.6 besteht (s. Invarianten) UND das normalisierte
// Ergebnis nachweislich innerhalb von ausgabeOrdner(projektId) liegt, sonst `ungueltige_eingabe`;
// reine String-/Validierungs-Operation (kein `fs.*`-Aufruf, keine Existenzprüfung)
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `projektId` | Projekt-ID (UUID, TK 9.11.3/9.11.4) | nicht leer; wird nur als Pfadsegment verwendet, nie gegen die Platte geprüft (das ist Sache der Aufrufer, z. B. `öffneProjekt`, M1-22) |
| `dateiname` (nur `loeseAssetPfad`) | `Asset.dateiname` — „`<uuid>.<ext_kleingeschrieben>` — OHNE Verzeichnisanteil" (TK 9.4.4) | darf laut Datenmodell keine Pfadtrenner/`..` enthalten — **muss aber trotzdem geprüft werden**, weil der Wert aus einer beschädigten oder fremd erzeugten `project.json` stammen kann |
| `ausgabeName` (nur `loeseAusgabePfad`) | Dateiname **ohne** Endung, Nutzereingabe (TK 9.2.1/9.2.6, FA-22) | muss die Namensvalidierung aus TK 9.2.6 bestehen (s. Invarianten) — **muss geprüft werden**, unabhängig davon, ob der Aufrufer bereits validiert hat |

Ausgang bei Erfolg (`loeseAssetPfad`/`loeseAusgabePfad`): absoluter, normalisierter Pfad, garantiert
innerhalb von `medienOrdner(projektId)` bzw. `ausgabeOrdner(projektId)`.
Ausgang bei Fehler (`loeseAssetPfad`/`loeseAusgabePfad`): `ungueltige_eingabe`.
`projektOrdner`, `medienOrdner` und `ausgabeOrdner` liefern immer einen String (reine Berechnung,
kein Fehlerfall).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**`project-store` ist die eine Pfad-Autorität.** Er löst `(projektId, dateiname) → absoluter
  Pfad` auf – die **einzige** Quelle der Wahrheit für das Datei-Layout eines Projekts
  (`projects/<id>/media/<datei>`). Jeder Main-Dienst, der eine Mediendatei anfassen muss,
  **resolved den Pfad über den `project-store`**, statt das Layout selbst zu kennen:
  `media-service` (kopieren/löschen), `render-service` (lesen beim Normalisieren),
  `export-service` (Quelle: die gewählte Datei aus `projects/<id>/output/`). Er löst ebenso
  `(projektId, ausgabeName) → projects/<id>/output/<name>.mp4` auf. So kann eine Layout-Änderung
  nirgends auseinanderlaufen." (TK 9.5.7)
- „**Der Ausgabename ist Nutzereingabe und wird validiert (FA-22):** Erlaubt ist ein reiner
  Dateiname **ohne** Endung – **keine** Pfadtrenner (`/`, `\`), **kein** `..`, keine für Windows/macOS/FAT32
  unzulässigen Zeichen (`< > : " | ? *`, Steuerzeichen), nicht leer, keine reservierten
  Windows-Namen (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`). Der aufgelöste Pfad muss
  **innerhalb** von `projects/<id>/output/` liegen. Verstoß → `ungueltige_eingabe`, **ohne**
  Wirkung. Andernfalls könnte ein Name wie `../../config` aus dem Projekt ausbrechen." (TK 9.2.6) —
  diese Validierung ist Aufgabe von `loeseAusgabePfad`; sie ist eine reine String-/Zeichen-Prüfung,
  keine `fs.*`-Existenzprüfung.
- „Der Resolver stellt sicher, dass das Ziel **innerhalb** des `media/`-Ordners des Projekts bleibt
  (kein `..`-Ausbruch, keine Symlink-Flucht)." (TK 9.5.7) — dieser Satz steht im TK im Kontext des
  `media://`-Protokolls, gilt aber wortgleich für **jede** Pfadauflösung dieses Moduls: „Zugriff
  strikt **read-only**" (unmittelbar folgender Halbsatz, ebenfalls TK 9.5.7) bezieht sich dort
  spezifisch auf den Renderer-**Lesezugriff** über `media://` (M1-38) — `loeseAssetPfad` selbst wird
  auch für **schreibende** Operationen genutzt (`media-service` kopiert/löscht darüber, s. o.); die
  Traversal-Schranke gilt für beide Nutzungsarten, die Read-only-Einschränkung nur für den
  `media://`-Handler. Dieselbe Traversal-Schranke gilt **wortgleich** für `loeseAusgabePfad`, nur
  mit `output/` statt `media/` als erlaubtem Bereich: Ziel muss innerhalb `ausgabeOrdner(projektId)`
  liegen, sonst `ungueltige_eingabe`.
- „`dateiname` = `<uuid>.<ext_kleingeschrieben>`, ohne Verzeichnisanteil. Auflösung immer per
  `path.join(projektMediaDir, dateiname)`. Nie der Originalname, nie ein gespeicherter OS-Pfad mit
  `\`/`/` — sonst ist das Projekt nicht zwischen Windows und macOS portabel." (TK 9.4.8, Punkt 1)
- „jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner; Listenelemente verweisen
  **relativ** dorthin, nie auf Originalpfade." (TK Abschnitt 6)

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `dateiname` enthält `..`, ist ein absoluter Pfad, oder das normalisierte Ergebnis (`path.resolve`) liegt außerhalb von `medienOrdner(projektId)` | `ungueltige_eingabe` | kein Pfad geliefert, keine Wirkung |
| `projektId` oder `dateiname` leer oder kein String | `ungueltige_eingabe` | kein Pfad geliefert |
| `ausgabeName` enthält Pfadtrenner (`/`, `\`), `..`, ist leer, enthält für Windows/macOS/FAT32 unzulässige Zeichen (`< > : " \| ? *`, Steuerzeichen), oder ist ein reservierter Windows-Name (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`) (TK 9.2.6) | `ungueltige_eingabe` | kein Pfad geliefert, keine Wirkung |
| `ausgabeName` besteht die Namensprüfung, aber das normalisierte Ergebnis (`path.resolve`) liegt außerhalb von `ausgabeOrdner(projektId)` | `ungueltige_eingabe` | kein Pfad geliefert, keine Wirkung |

## Nicht selbst entscheiden – STOPP und fragen
- **Symlink-Flucht ist mit einer reinen String-Funktion nicht prüfbar.** TK 9.5.7 verlangt „keine
  Symlink-Flucht", das erfordert aber `fs.realpath` (I/O) — nicht vereinbar mit einer synchronen,
  IO-freien Pfadfunktion. Klären: Bleibt `loeseAssetPfad` bewusst IO-frei (dann verlagert sich die
  Symlink-Prüfung auf die Stelle, die die Datei tatsächlich öffnet, z. B. `media-service`/den
  `media://`-Handler in M1-38), oder soll diese Funktion selbst `fs.realpath`/`fs.existsSync`
  aufrufen und damit ihren I/O-freien Charakter aufgeben?
- **Groß-/Kleinschreibung beim „liegt innerhalb"-Vergleich.** Windows- und (meist) macOS-Dateisysteme
  sind case-insensitive, Linux nicht. Ob der Innerhalb-`medienOrdner`-Vergleich case-sensitiv oder
  plattformabhängig gemacht wird, ist nicht spezifiziert — nicht selbst festlegen, da eine falsche
  Wahl auf einer Plattform eine echte Traversal-Lücke offen ließe, auf einer anderen unnötig streng
  wäre.

## Definition of Done
- [ ] `projektOrdner(projektId)` und `medienOrdner(projektId)` liefern für dieselbe `projektId`
      deterministisch denselben Pfad, abgeleitet von `ermittleDatenOrt()` (S5), und stimmen mit der
      Struktur aus TK Abschnitt 6 überein (`medienOrdner` = `projektOrdner` + `/media`)
- [ ] `loeseAssetPfad(projektId, dateiname)` liefert für ein gültiges `dateiname` ohne Pfadtrenner
      genau `medienOrdner(projektId)/<dateiname>`
- [ ] `loeseAssetPfad` liefert `ungueltige_eingabe` für alle folgenden Testfälle: `../../etc/passwd`,
      `..\\..\\secrets`, `/etc/passwd`, `C:\Windows\x`, leerer String
- [ ] Keine der fünf Funktionen ruft `fs.*` auf (Test durch Spy/Mock auf das `fs`-Modul, der nie
      aufgerufen wird)
- [ ] `ausgabeOrdner(projektId)` liefert deterministisch `projektOrdner(projektId) + '/output'`,
      übereinstimmend mit der Struktur aus TK Abschnitt 6
- [ ] `loeseAusgabePfad(projektId, ausgabeName)` liefert für ein gültiges `ausgabeName` ohne
      Pfadtrenner genau `ausgabeOrdner(projektId)/<ausgabeName>.mp4`
- [ ] `loeseAusgabePfad` liefert `ungueltige_eingabe` für alle folgenden Testfälle: `../../etc/passwd`,
      `..\\..\\secrets`, `/etc/passwd`, `C:\Windows\x`, leerer String, `a/b`, `a\b`, `CON`, `NUL`,
      `datei<name`, `datei|name`
- [ ] Keine Datei außerhalb von `src/main/project-store/pfade.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: S5 (liefert `ermittleDatenOrt()`, auf dem `projektOrdner` aufbaut)
- Blockiert von: S12 (liefert `Ergebnis<T>` und den generischen Code `ungueltige_eingabe`, die
  `loeseAssetPfad`/`loeseAusgabePfad` zurückgeben)
- Blockiert: M1-38 (`media://`-Auflösung nutzt `loeseAssetPfad` statt selbst Pfade zu bauen),
  M3-Issues (`media-service` kopiert/löscht über diese Auflösung), M6-Issue `render-service` (liest
  Medien über `loeseAssetPfad`, löst den Ausgabepfad über `loeseAusgabePfad` auf), M6-Issue
  `export-service` (löst die Quelldatei in `projects/<id>/output/` über `loeseAusgabePfad` auf)

## Bezug
TK 9.5.7, TK Abschnitt 6, TK 9.4.8, TK 9.2.1, TK 9.2.6, TK 9.6.1

---

### Issue M1-38: [project-store] `media://`-Auflösung: den Protokoll-Stub aus S9 füllen

## Ziel (in einem Satz)
Eine `media://<projektId>/<dateiname>`-Anfrage aus dem Renderer wird ausschließlich über die
Pfad-Auflösung aus M1-37 in eine echte, nur lesend ausgelieferte Datei übersetzt und ersetzt damit
den in S9 registrierten Stub-Handler.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/media-protokoll.ts`
- Vertrag: Technisches Konzept **9.5.7** (Quelle der Wahrheit)
- Prozess/Speicher: D1, D2

## Warum das im Gesamtsystem wichtig ist
Über dieses Protokoll zeigt der Renderer **jedes** Medien-Vorschaubild und -video an — Thumbnails im
`composer`, Bild-Referenzen im `action-editor`, Video-/Bildwiedergabe im `preview-player`. S9 hat das
Schema bereits **vor** dem Laden des Fensters registriert, aber bewusst nur mit einem Stub, damit an
dieser Stelle keine zweite Pfad-Autorität entsteht (Begründung von S9, s. Zitat unten). Dieses Issue
liefert die echte Logik — und
zwar **ausschließlich** über die in M1-37 gebaute Pfad-Auflösung. Baut dieser Handler stattdessen
selbst `path.join(projektOrdner, 'media', dateiname)` zusammen, entsteht exakt die **zweite**
Pfad-Autorität, die die Planung an dieser Stelle ausdrücklich ausschließt — und jede künftige
Verschärfung der Path-Traversal-Prüfung in M1-37 würde diesen Handler nicht mehr erreichen. Ebenso
kritisch: Dieser Handler ist der **einzige** Weg, auf dem der Renderer überhaupt an Bytes einer
Mediendatei kommt (IPC selbst transportiert laut TK 9.1.1 nur Segment-PNGs, keine Importe) — jede
Lücke hier (Traversal, Schreibzugriff) wäre ein Zugriff, den keine andere Schicht mehr abfängt.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/main/project-store/media-protokoll.ts
// Wird von S9 als Handler an `protocol.handle('media', ...)` übergeben; die Registrierung selbst
// (VOR app.whenReady()/Fensterladen) bleibt Sache von S9 — diese Datei liefert NUR die
// Anfrage-Behandlung, KEINE Protokoll-Registrierung.

export async function behandleMediaAnfrage(request: Request): Promise<Response>
// Electron protocol.handle-Signatur (Fetch-API-Typen). Löst NIE selbst Pfade auf — jede Auflösung
// läuft über loeseAssetPfad() aus M1-37 (src/main/project-store/pfade.ts). Liest NUR die Datei;
// schreibt, löscht oder verändert nichts.
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `request.url` | Anfrage-URL im Schema **`media://<projektId>/<dateiname>`** (TK 9.5.7: „registriert der Main ein eigenes Protokoll `media://<projektId>/<dateiname>`") | muss exakt diesem Schema entsprechen (Host = `projektId`, Pfad = `dateiname`); alles andere ist eine ungültige Anfrage |
| `request.method` | HTTP-artige Methode der Fetch-API | **nur `GET` erlaubt** — jede andere Methode wird abgelehnt, ohne die Auflösung überhaupt zu versuchen (erzwingt „nur lesend") |

Ausgang bei Erfolg: eine `Response` mit dem Dateiinhalt und einem passenden `Content-Type`-Header
(Status 200).
Ausgang bei Fehler: eine `Response` mit einem Fehlerstatus — **keine** `Ergebnis<T>`-Hülle (Begründung
s. u.), kein geworfener Fehler, der den Main-Prozess destabilisieren könnte.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Für die Vorschau (P5) und Thumbnails (`composer`, `action-editor`) muss der **Renderer** Medien
  anzeigen. Dafür registriert der Main ein eigenes Protokoll **`media://<projektId>/<dateiname>`**,
  dessen Handler die Auflösung des `project-store` nutzt und die Datei **nur lesend** ausliefert."
  (TK 9.5.7)
- „Der Renderer sieht **nur relative** Referenzen (`dateiname`), **nie** absolute Pfade. Der Resolver
  stellt sicher, dass das Ziel **innerhalb** des `media/`-Ordners des Projekts bleibt (kein
  `..`-Ausbruch, keine Symlink-Flucht); Zugriff strikt **read-only**." (TK 9.5.7)
- „Die Regel „**nur der Main berührt das Dateisystem**" bleibt gewahrt: der Main löst auf und liefert
  die Bytes; der Renderer erhält eine URL, keinen direkten Dateizugriff." (TK 9.5.7)
- „Hier entsteht KEINE Pfadauflösung. Die gehört dem `project-store` (9.5.7, M1). Wer sie ins
  Protokoll-Handler schreibt, erzeugt eine **zweite** Pfad-Autorität – genau das, was die Planung
  ausschließt." (Übergabe-Prompt 8b, Falle zu S9 — dieses Issue **ist** die angekündigte Ersetzung
  des Stubs und muss diese Falle einhalten, nicht wiederholen)

**Wichtige Klarstellung (keine TK-Invariante, sondern Abgrenzung zweier unterschiedlicher
Mechanismen, damit hier nicht versehentlich die falsche Hülle verwendet wird):** TK 9.1.1 schreibt:
„Diese Konventionen gelten für **jede** Operation über die Renderer↔Main-Grenze." — gemeint ist damit
die IPC-Kanal-Grenze (`ipc-gateway`/`ipc-client`, Kanäle `<modul>:<operation>`). Ein
Custom-Protocol-Handler wie dieser ist **kein** IPC-Kanal, sondern ein Ressourcen-Loader, den
Electron wie einen Netzwerk-Request behandelt (Fetch-API `Request`/`Response`). Dieser Handler gibt
deshalb **niemals** `Ergebnis<T>` zurück — Fehler werden über den HTTP-artigen Response-Status
ausgedrückt (z. B. „nicht gefunden"), nicht über `Fehlercode`. Wer hier `Ergebnis<T>` einbaut, baut
etwas, das der Renderer als `<img src="media://…">`/`<video src="media://…">` gar nicht auswerten
kann.

## Fehlerpfade (vollständig)
| Situation | Antwort | Verhalten |
|---|---|---|
| `request.method !== 'GET'` | Response mit Fehlerstatus, **kein** Auflösungsversuch | keine Dateisystemoperation — erzwingt „nur lesend" |
| `request.url` entspricht nicht dem Schema `media://<projektId>/<dateiname>` (fehlendes Segment, zusätzliche Pfadebenen, Query-String o. Ä.) | Response mit Fehlerstatus | keine Dateisystemoperation |
| `loeseAssetPfad(projektId, dateiname)` (M1-37) liefert `ok:false` (Path-Traversal-Versuch, leere Werte) | Response mit Fehlerstatus | keine Dateisystemoperation; die konkrete `meldung` aus `Ergebnis` wird **nicht** in die Response übernommen (keine Pfad-Details nach außen leaken) |
| Aufgelöster Pfad liegt (laut M1-37) innerhalb des Medienordners, aber die Datei existiert nicht auf der Platte (z. B. `Asset.zustand === "fehlt"`, TK 9.4.7) | Response mit Fehlerstatus | keine Dateisystemoperation über den Lesevorgang hinaus |
| Datei existiert, aber Lesen schlägt fehl (Windows-Sperre `EBUSY`/`EPERM`, Rechteproblem) | Response mit Fehlerstatus | Handler wirft **nicht**, Main-Prozess bleibt stabil |

## Nicht selbst entscheiden – STOPP und fragen
- **Gilt die Anfrage nur für das aktuell aktive Projekt, oder für jede `projektId`, zu der ein
  Projektordner existiert?** TK 9.5.1 hält fest: „Das **aktive** Projekt lebt zur Laufzeit **im
  Speicher** (Quelle der Wahrheit während der Sitzung; Lesezugriffe sind sofortig). Nur *ein*
  Projekt ist gleichzeitig geladen." M1-37 selbst prüft das nicht — seine
  Funktionen nehmen jede `projektId` entgegen. Soll dieser Handler zusätzlich verlangen, dass die
  angefragte `projektId` mit dem gerade geladenen Projekt übereinstimmt (und alles andere ablehnen),
  oder jede auf der Platte vorhandene Projekt-ID bedienen, solange die Datei existiert? TK 9.5.7
  spezifiziert nur `(projektId, dateiname) → Pfad`, ohne diese Einschränkung ausdrücklich zu machen
  — **nicht selbst festlegen**.
- **Exakte HTTP-artige Statuscodes** für die einzelnen Fehlerfälle oben (z. B. 400 vs. 403 vs. 404 vs.
  500) sind im TK nicht festgelegt. Da die UI diese Codes vermutlich nicht differenziert auswertet
  (ein `<img>`/`<video>` kennt nur „geladen" oder „Fehler"), scheint die genaue Wahl unkritisch — aber
  falls composer/action-editor/preview-player unterschiedliche Fehlerzustände (z. B. „Medium fehlt"
  vs. „Netzwerk-/Ladefehler") anhand des Status unterscheiden sollen, muss das vor der Umsetzung
  geklärt werden.
- **Content-Type-Bestimmung.** Diese Funktion bekommt nur `dateiname` aus der URL, keinen
  `Asset`-Datensatz (`typ: "video" | "bild"`, TK 9.4.4). Ob der `Content-Type` allein aus der
  Dateiendung geraten werden darf oder ob der Handler zusätzlich `Asset.typ` benötigt (und damit
  Zugriff auf das geladene Projekt bräuchte, nicht nur auf `pfade.ts`), ist nicht entschieden.
- **Streaming vs. vollständiges Puffern** großer Videodateien beim Aufbau der `Response` — TK legt
  das nicht fest; nicht selbst als Performance-Optimierung vorwegnehmen, ohne zu klären, ob das für
  die Vorschau-Nutzung überhaupt relevant ist.

## Definition of Done
- [ ] `behandleMediaAnfrage` löst eine gültige `media://<projektId>/<dateiname>`-Anfrage
      ausschließlich über einen Aufruf von `loeseAssetPfad` (M1-37) auf — **kein** eigenes
      `path.join`/`path.resolve` gegen einen selbst zusammengesetzten Medienordner-Pfad im Code
      dieser Datei
- [ ] Eine Anfrage mit `dateiname`, für das `loeseAssetPfad` `ok:false` liefert, führt nachweislich
      zu **keinem** Dateisystemzugriff (Test mit Spy auf `fs`)
- [ ] Eine Anfrage mit `request.method !== 'GET'` (z. B. `'POST'`) wird abgelehnt, ohne dass
      `loeseAssetPfad` überhaupt aufgerufen wird
- [ ] Kein Test- oder Produktionscode dieser Datei erzeugt oder verwendet ein `Ergebnis<T>` als
      Rückgabewert von `behandleMediaAnfrage` (die Funktion gibt ausschließlich `Response` zurück)
- [ ] Ein Lesefehler (simulierter `EBUSY`) führt zu einer Fehler-`Response`, nicht zu einer
      unbehandelten Exception im Main-Prozess
- [ ] Keine Datei außerhalb von `src/main/project-store/media-protokoll.ts` (+ zugehörige Testdatei)
      geändert

## Abhängigkeiten
- Blockiert von: M1-37 (liefert `loeseAssetPfad`, die einzige erlaubte Auflösungsquelle)
- Blockiert von: S9 (registriert `protocol.handle('media', …)` als Stub **vor** dem Fensterladen und
  übergibt diesen Handler an die Registrierung; dieses Issue ersetzt nur den Stub-Rückgabewert,
  nicht die Registrierung selbst)
- Blockiert: M5-Issues (`composer`-/`action-editor`-Thumbnails), M7-Issue `preview-player` (9.9) —
  alle laden Medien ausschließlich über `media://`

## Bezug
TK 9.5.7, TK 9.1.1, TK 9.4.4, TK 9.4.7, Übergabe-Prompt Abschnitt 8b (Falle zu S9)

---

### Issue M1-39: [project-store] Einzel-Instanz-Sperre, gebunden an den Datenort

## Ziel (in einem Satz)
Startet die App ein zweites Mal, während bereits eine Instanz läuft, wird **kein** zweiter Prozess
zugelassen – stattdessen wird die bereits laufende Instanz fokussiert –, und diese Prüfung bezieht
sich auf den **Datenort**, nicht auf den Pfad der ausführbaren Datei.

## Modul & Datei
- Modul: `project-store` [D1] (Main)
- Datei: `src/main/project-store/einzel-instanz.ts` (liegt beim `project-store`, weil die Sperre
  laut TK 9.5.4 genau dessen prozessinternes D1-Schreib-Lock absichert – ein Modulordner je
  TK-9-Modul, kein Streuen auf die `src/main/`-Wurzel)
- Vertrag: Technisches Konzept **9.5.4** (Quelle der Wahrheit)
- Prozess/Speicher: Voraussetzung für D1 (schützt das prozessinterne D1-Schreib-Lock, M1-20)

## Warum das im Gesamtsystem wichtig ist
Das D1-Schreib-Lock (M1-20) ist ein **prozessinternes** Lock – es serialisiert Schreibzugriffe
**innerhalb eines Prozesses**. Liefen zwei App-Instanzen gleichzeitig, hätte jede ihr **eigenes**,
voneinander unwissendes Lock auf derselben `project.json`: Beide könnten „gleichzeitig" schreiben,
jede glaubt, exklusiven Zugriff zu haben, und das Ergebnis ist ein Lost Update – die zuletzt
schreibende Instanz überschreibt die Änderungen der anderen kommentarlos. Damit wäre die gesamte
Konsistenzgarantie, auf der M1-20, M1-34 (atomares Schreiben) und M1-35 (Auto-Speichern) beruhen,
nur noch Theorie: Sie schützen zuverlässig gegen nebenläufige Schreibvorgänge **innerhalb** eines
Prozesses, aber nicht gegen einen zweiten Prozess. Diese Sperre schließt genau diese Lücke,
**bevor** ein zweiter Prozess überhaupt eine Fensterinstanz öffnen und mit dem Nutzer arbeiten
kann.

**Warum „Datenort" und nicht „Programmpfad" entscheidend ist:** Die App wird als **portable EXE**
ausgeliefert (kein Installer, kein fester Installationsort). Ein Studio-Mitarbeiter könnte
versehentlich zwei Kopien derselben EXE besitzen (z. B. eine auf dem USB-Stick, eine lokal
kopiert, „damit es schneller startet") und **beide auf denselben Datenordner** zeigen lassen. Bindet
die Sperre an den Programmpfad (oder an einen von der ausführbaren Datei abgeleiteten Bezeichner),
sehen sich zwei solche Kopien **nicht** gegenseitig und der oben beschriebene Lost-Update-Fall tritt
trotz vorhandener Sperre ein.

## Signatur (verbindlich – NICHT ändern)
```ts
export function erzwingeEinzelInstanz(
  datenOrt: string,
  beiZweitemStart: () => void,
): boolean
// MUSS aufgerufen werden, BEVOR app.whenReady() abgewartet bzw. das erste BrowserWindow erzeugt
// wird (S3, src/main/index.ts).
// Rückgabe false: eine andere Instanz haelt die Sperre für DIESEN datenOrt bereits. Der Aufrufer
// MUSS unmittelbar app.quit() aufrufen und darf KEIN Fenster mehr erzeugen.
// Rückgabe true: diese Instanz haelt die Sperre. beiZweitemStart() wird aufgerufen, sobald ein
// weiterer Prozess mit demselben datenOrt zu starten versucht (Zeitpunkt: nach dieser Instanz).
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `datenOrt` | absoluter Pfad aus `ermittleDatenOrt()` (S5) | derselbe Wert, den `project-store`/`config-store` für `projects/`, `config.json` etc. verwenden – **keine** eigene, zweite Berechnung des Datenorts hier |
| `beiZweitemStart` | Callback, der das bestehende Fenster fokussiert/wiederherstellt | wird von `src/main/index.ts` (S3) übergeben, das das `BrowserWindow` besitzt |

Ausgang bei Erfolg: `true`, wenn diese Instanz weiterlaufen darf.
Ausgang bei Fehler: entfällt im Sinne der `Ergebnis<T>`-Hülle – diese Funktion überquert **nicht**
die Renderer↔Main-Grenze (TK 9.1.1 gilt für IPC-Operationen; dies ist reiner Main-Bootstrap vor der
ersten Fensterinstanz, analog zu S3). `false` ist der reguläre, nicht-technische „eine andere
Instanz läuft bereits"-Fall, kein Fehlerfall.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „**Genau eine App-Instanz (Voraussetzung für das ganze Lock-Design):** Das D1-Schreib-Lock ist
  ein **prozessinternes** Lock. Zwei gleichzeitig laufende App-Instanzen hätten **zwei
  unabhängige** Locks auf derselben `project.json` – das Ergebnis wäre ein Lost Update und damit
  **Datenkorruption**. Deshalb erzwingt die App beim Start eine **Einzel-Instanz-Sperre**; ein
  zweiter Start **fokussiert das bestehende Fenster** statt eine zweite Instanz zu öffnen." (TK
  9.5.4)
- „**Wichtig für die portable Auslieferung:** Die Sperre muss an den **Datenort** gebunden sein
  (den App-Ordner mit `projects/`), nicht an den Programmpfad. Sonst könnten zwei Kopien der
  portablen EXE, die auf **dieselben** Daten zeigen, beide starten – genau der Fall, den die
  Sperre verhindern soll." (TK 9.5.4)

## Fehlerpfade (vollständig)
Entfällt im Sinne der IPC-`Ergebnis<T>`-Hülle (reiner Main-Bootstrap ohne Renderer-Beteiligung,
vergleiche S3). `false` ist kein Fehler, sondern der definierte „zweiter Start"-Fall (s. oben).

## Nicht selbst entscheiden – STOPP und fragen
- **Reicht Electrons eingebautes `app.requestSingleInstanceLock()` allein aus – oder braucht es
  zusätzlich eine eigene, datenort-gebundene Sperre?** Das ist der Kern dieses Issues und darf
  **nicht** geraten werden:
  - `app.requestSingleInstanceLock()` ist laut Electron-Dokumentation an die **Anwendung**
    gebunden (intern über den `userData`-Pfad der Chromium-„ProcessSingleton"-Implementierung
    ermittelt), **nicht** an einen frei wählbaren Ordner. Ob und wie zuverlässig sich dieser
    Mechanismus tatsächlich auf **unseren** `datenOrt` ausrichten lässt (z. B. durch
    `app.setPath('userData', datenOrt)` **vor** dem Aufruf der Sperre), ist eine technische
    Detailfrage mit Plattformunterschieden (Windows/macOS), die **vor der Umsetzung geklärt**
    werden muss, nicht während der Implementierung entschieden werden darf.
  - **Der konkrete Fall, um den es hier geht, ist ungeklärt:** Wie verhalten sich **zwei
    getrennte Kopien derselben portablen EXE-Datei**, die beide auf denselben `datenOrt` zeigen,
    gegenüber `app.requestSingleInstanceLock()`? Electrons Mechanismus wurde für „ein Nutzer
    startet dieselbe installierte App zweimal" entworfen, nicht für „zwei Dateien mit
    unterschiedlichem Pfad, aber identischem Inhalt, sollen sich als **eine** App erkennen". Ob
    das zutrifft, ist **experimentell zu verifizieren**, nicht anzunehmen.
  - Falls Electrons Mechanismus **nicht** ausreicht: Eine ergänzende, eigene Sperre müsste dann
    tatsächlich **im `datenOrt` selbst** liegen (z. B. eine Lock-Datei neben `projects/`) – das
    bringt eine eigene Fehlerklasse mit sich (s. nächster Punkt) und ist entsprechend aufwendiger
    als der eingebaute Mechanismus. **Nicht vorsorglich beides bauen** („Over-Engineering"), aber
    auch nicht auf Verdacht nur den eingebauten Mechanismus nehmen, ohne den obigen Punkt zu
    verifizieren.
  - **Vorschlag zum Vorgehen (keine Vorwegnahme der Entscheidung):** Zuerst mit
    `app.requestSingleInstanceLock()` (ggf. mit `app.setPath('userData', datenOrt)` davor)
    gegen genau das Szenario „zwei EXE-Kopien, ein Datenort" testen; **erst wenn** das
    nachweislich nicht zuverlässig funktioniert, eine zusätzliche datenort-gebundene Sperre
    entwerfen – gemeinsam mit dem Auftraggeber, nicht auf eigene Faust.
- **Falle bei einer dateibasierten Ersatz-/Zusatzsperre – falls sie nötig wird:** Eine Lock-Datei
  im Dateisystem kann nach einem Absturz (Stromausfall, Task-Kill, Systemabsturz) **verwaist**
  zurückbleiben, weil der Prozess, der sie angelegt hat, sie nie aufräumen konnte. Eine naive
  Prüfung „Datei existiert → eine Instanz läuft bereits" würde dann **jeden** künftigen,
  legitimen Start blockieren – ausgerechnet in dem Moment, in dem der Nutzer nach einem Absturz
  neu starten will, um weiterzuarbeiten. Ein tragfähiger Mechanismus müsste erkennen können, ob
  der in der Lock-Datei vermerkte Prozess tatsächlich noch läuft (z. B. PID-Prüfung – selbst
  plattformabhängig und mit eigenen Fallstricken wie PID-Wiederverwendung) oder einen anderen Weg
  finden, „verwaist" von „aktiv" zu unterscheiden. **Diese Mechanik nicht selbst entwerfen und
  stillschweigend einbauen** – falls eine Zusatzsperre nötig wird, das Verfahren gegen genau
  dieses Absturz-Szenario vorab klären und testen.
- **Windows `EBUSY`/`EPERM` bei einer eventuellen Lock-Datei:** Sollte die Klärung oben zu einer
  eigenen, dateibasierten Sperre führen, gilt dieselbe Plattform-Falle wie bei jedem anderen
  Dateisystem-Zugriff dieses Projekts: Unter Windows kann eine gesperrte Datei mit `EBUSY`/`EPERM`
  fehlschlagen, unter macOS kann `unlink` still gelingen, obwohl eine Handle noch offen ist – auch
  das müsste die Zusatzsperre (falls gebaut) explizit behandeln, nicht ignorieren.
- **Integrationslücke mit S3:** S3 (`src/main/index.ts`, bereits als eigenes Issue ausgeschrieben)
  nennt TK 9.5.4 zwar als Bezug „(Einzel-Instanz, hier nur die Fenster-Seite)", enthält in seiner
  eigenen Signatur/Definition of Done aber **keinen** Aufruf von `app.requestSingleInstanceLock()`
  oder einer vergleichbaren Sperre. Diese Funktion (`erzwingeEinzelInstanz`) bleibt wirkungslos,
  solange sie nicht **von S3 aus** vor der Fenstererzeugung aufgerufen wird. Ob das über eine
  nachträgliche Ergänzung von S3 geschieht oder auf andere Weise verdrahtet wird, ist **nicht**
  Teil dieses Issues (Regel E: nur Dateien dieses Issues) – aber es muss **irgendwo** ausdrücklich
  beauftragt werden, sonst existiert die Sperre im Code, wird aber nie aufgerufen.

## Definition of Done
- [ ] `erzwingeEinzelInstanz` liefert bei einem zweiten, gleichzeitigen Aufruf mit demselben
      `datenOrt` `false` (Test mit zwei simulierten Prozess-Kontexten, sofern technisch im
      Unit-Test nachstellbar; sonst manueller Test s. u.)
- [ ] `beiZweitemStart` wird nachweislich aufgerufen, wenn ein zweiter Start mit demselben
      `datenOrt` erfolgt
- [ ] Manueller Test (nicht durch einen Unit-Test ersetzbar): zwei Kopien derselben gepackten
      portablen EXE an unterschiedlichen Pfaden, beide auf denselben `datenOrt` zeigend, gleichzeitig
      gestartet – die zweite fokussiert nachweislich die erste, statt ein eigenes Fenster zu öffnen
- [ ] Nur falls die STOPP-Klärung zu einer zusätzlichen, dateibasierten Sperre führt: ein
      Absturz-Test (Prozess hart beendet, dann Neustart) zeigt, dass der nächste legitime Start
      **nicht** durch eine verwaiste Sperrdatei blockiert wird. Fällt die Entscheidung auf
      Electrons eingebauten Mechanismus allein, entfällt dieser Punkt (die Sperre endet dort
      automatisch mit dem Prozess, keine Datei bleibt zurück)
- [ ] Keine Datei außerhalb von `src/main/project-store/einzel-instanz.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #5 (S5, `ermittleDatenOrt` – liefert den `datenOrt`, an den diese Sperre gebunden
  wird; ohne einen stabilen Datenort ist „an den Datenort gebunden" nicht umsetzbar), #3 (S3,
  `src/main/index.ts` besitzt das `BrowserWindow`; muss `erzwingeEinzelInstanz` aufrufen und
  `beiZweitemStart` übergeben – S3s bisheriger Vertrag deckt diesen Aufruf noch **nicht** ab, s.
  „Nicht selbst entscheiden")
- Blockiert: M1-20 (D1-Lock ist ohne diese Sperre keine echte Garantie), M1-22 (`öffneProjekt`
  referenziert die Einzel-Instanz-Voraussetzung, TK 9.5.1/9.5.4)

## Bezug
NFA-02, Akzeptanzkriterium 6, TK 9.5.4, TK 6

---

### Issue M1-40: [contracts] Typ Marke definieren

## Ziel (in einem Satz)
Der Typ `Marke` (Farb-/Schrift-Rollen, Logo, Sicherheitsabstand, Radien, Schatten, Slogan) existiert
als geteilter, read-only Typ, den `config-store.leseMarke` liefert und `template-canvas` konsumiert.

## Modul & Datei
- Modul: `contracts/types` (geteilt)
- Datei: `src/shared/contracts/marke.ts`
- Vertrag: Technisches Konzept **9.11.2** (Quelle der Wahrheit)
- Prozess/Speicher: D3 (gebündelt, app-weit, nicht editierbar in v1)

## Warum das im Gesamtsystem wichtig ist
`Marke` ist die **konsumierbare** Fassung des Markenauftritts (Anforderungsdokument 4.2) und der
zweite Pflicht-Eingang von `template-canvas` (M4) neben `Vorlage`/`Aktion` – **jeder** Zeichenaufruf
braucht Farben, Schriften, Logo und Sicherheitsabstand von hier. Vorlagen verweisen auf Farben und
Schriften **ausschließlich über Rollen**, nie über Hex-Werte oder Schriftnamen im Zonen-Modell
(9.11.1, Punkt 7) – modelliert dieser Typ `farben`/`schriften` stattdessen als offene `Record<string,
string>` ohne feste Rollen-Schlüssel, kann eine Vorlage eine nicht existierende Rolle referenzieren,
ohne dass der Compiler das anmahnt, und der Fehler fällt erst beim Rendern als Platzhalter oder
falsche Farbe auf. Ebenso wichtig: `Marke` ist in v1 **read-only** – kein `setzeMarke` – daher
bekommt dieser Typ **keine** Schreib-Operation und keine partiellen/optionalen Varianten, die einen
Editor nahelegen würden.

## Signatur (verbindlich – NICHT ändern)
```ts
// src/shared/contracts/marke.ts
export type FarbRolle =
  | 'akzent' | 'akzentKraeftig' | 'akzentTief'
  | 'flaecheDunkel' | 'flaecheSehrDunkel' | 'flaecheHell' | 'flaecheAkzentZart'
  | 'textAufDunkel' | 'textAufHell' | 'textSekundaer'
  | 'linie' | 'scrimStart' | 'scrimEnde'

export type SchriftRolle = 'headlineElegant' | 'headlinePlakativ' | 'fliesstext' | 'fliesstextFett'

export interface Schrift {
  familie: string
  gewicht: number
  datei: string                     // gebündelter Dateiname, s. 9.10.4 (Playfair Display fehlt auf Win/macOS)
}

export interface Marke {
  farben: Record<FarbRolle, string>       // Hex, 6- oder 8-stellig (8 = mit Alpha)
  schriften: Record<SchriftRolle, Schrift>
  logo: { datei: string; seitenverhaeltnis: number }   // Balken ist im Asset enthalten
  sicherheit: { horizontal: 96; vertikal: 54 }          // absolute px im 1920×1080-Rahmen
  radien: { pille: 40; karte: 10; klein: 2 }
  schatten: { versatzY: 4; weichzeichnen: 8; farbe: string }
  slogan: { text: string; aktiv: boolean }
}
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| – | reine Typdefinition | – |

Ausgang bei Erfolg: `Marke`/`FarbRolle`/`SchriftRolle`/`Schrift` sind im ganzen Projekt
importierbar; `config-store.leseMarke` (M1-17) liefert `Ergebnis<Marke>`, `template-canvas` (M4)
verweist auf Farben/Schriften ausschließlich über `FarbRolle`/`SchriftRolle`.
Ausgang bei Fehler: entfällt (Typdefinition).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
```
Marke {
  farben:      { <FarbRolle>: string }      // Hex, 6- oder 8-stellig (8 = mit Alpha)
  schriften:   { <SchriftRolle>: Schrift }
  logo:        { datei, seitenverhaeltnis }  // Balken ist im Asset enthalten
  sicherheit:  { horizontal: 96, vertikal: 54 }   // absolute px im 1920×1080-RAHMEN
  radien:      { pille: 40, karte: 10, klein: 2 }
  schatten:    { versatzY: 4, weichzeichnen: 8, farbe: "#0000001A" }
  slogan:      { text: string, aktiv: boolean }
}
Schrift { familie, gewicht, datei }
```
(TK 9.11.2, wörtlich übernommen)
- „Vorlagen verweisen **ausschließlich über Rollen** darauf – niemals auf Hex-Werte oder
  Schriftnamen (9.11.1, Punkt 7)." (TK 9.11.2)
- „**Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein
  Marken-Editor ist kein MVP." (TK 9.11.2)
- „alle Dateien werden mitgeliefert (9.10.4)" (TK 9.11.2, zu den Schrift-Rollen) – die
  Marken-Schriften sind **gebündelt** auszuliefern, da Playfair Display auf Windows und macOS
  fehlt.
- „Der Sicherheitsabstand [...] gilt absolut im 1920×1080-Rahmen (96 px horizontal, 54 px
  vertikal, 9.10.5)." (TK 9.11.2)

## Fehlerpfade (vollständig)
Entfällt (Typdefinition, keine Laufzeit-Fehlerpfade).

## Nicht selbst entscheiden – STOPP und fragen
- Ob `radien`/`schatten`/`slogan` als literale Zahlen-/String-Typen (wie oben, analog zu
  `sicherheit`) oder als lockere `number`/`string`-Felder modelliert werden, falls sich diese
  Werte je Umgebung unterscheiden könnten (TK 9.11.2 nennt sie als feste v1-Werte, ohne
  Variationsmechanismus zu erwähnen) – falls unklar, ob künftige Marken-Varianten geplant sind,
  nachfragen statt eigenmächtig auf „fest" oder „variabel" zu entscheiden.
- Woher die gebündelte Markendatei physisch stammt (statisches JSON im Bundle vs.
  TypeScript-Konstante) – das betrifft `config-store.leseMarke` (M1-17), nicht diesen Typ selbst,
  ist hier aber zu vermerken, damit beide Issues konsistent bleiben.

## Definition of Done
- [ ] `Marke`, `FarbRolle`, `SchriftRolle`, `Schrift` exakt wie oben, keine zusätzlichen/fehlenden
      Felder oder Rollen
- [ ] `FarbRolle`/`SchriftRolle` sind geschlossene String-Unionen (keine offenen `string`-Typen)
- [ ] Keine Schreib-Operation, kein optionales/partielles Gegenstück in dieser Datei
- [ ] Keine Datei außerhalb von `src/shared/contracts/marke.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #1 (Ordnerstruktur)
- Blockiert: M1-14 (`leseKonfig` liefert die gebündelte Marke mit, TK 9.5.6), M1-17 (`leseMarke`
  gibt `Ergebnis<Marke>` zurück und braucht den konkreten Typ, TK 9.5.6), M4-Issues
  (`template-canvas` liest Farben/Schriften ausschließlich über `FarbRolle`/`SchriftRolle`)

## Bezug
TK 9.11.2, TK 9.5.6, TK 9.10.4, TK 9.10.5, Anforderungsdokument 4.2


---

## Milestone M2 – Torwächter (`auftrags-manager`, P6)

> **Die Volltexte stehen NICHT hier, sondern als eine Datei je Issue in `docs/agents/m2/`.**
> Das ist das Format, das `tools/create-issues.py` liest – und bewusst die einzige Quelle: Die Texte
> zusätzlich hierher zu kopieren, hieße zwei Fassungen zu pflegen, die unweigerlich auseinanderlaufen.
> (Bei M0/M1 lagen die Texte noch im Draft selbst; ab M2 gilt das Dateiformat.)
>
> **Stand:** 19 Issues, geschrieben 03.08.2026, von vier unabhängigen Prüfern geprüft (~45 Befunde,
> 11 kritische), in drei Durchgängen korrigiert und angelegt. Befund und Begründungen:
> `docs/agents/m2-pruefbefund.md`. Mapping maschinenlesbar: `docs/agents/m2/map.json`.
>
> **Aus dem Prüflauf entstanden:** M2-17 (gemeinsamer Schreib-Baustein), M2-18 (Auftrag abschließen)
> und M2-19 (IPC-Verdrahtung – ohne sie hätte die Oberfläche die Warteschlange nie erreicht).
>
> **`braucht-entscheidung` tragen 9 der 19:** #53, #61, #64, #65, #67, #68, #69, #70, #71.

| M2-Nr. | GitHub-Issue | Titel |
|---|---|---|
| M2-01 | [#53](https://github.com/NiklasRist/Digital-Signage-Tool/issues/53) | [contracts] Typen ProtokollEintrag und JournalEintrag definieren |
| M2-02 | [#54](https://github.com/NiklasRist/Digital-Signage-Tool/issues/54) | [auftrags-manager] Q1-Warteschlange im Arbeitsspeicher führen |
| M2-03 | [#55](https://github.com/NiklasRist/Digital-Signage-Tool/issues/55) | [auftrags-manager] Q2-Wiederholungsspeicher je Projekt führen |
| M2-04 | [#56](https://github.com/NiklasRist/Digital-Signage-Tool/issues/56) | [auftrags-manager] Q3-Ausführungsprotokoll anhängen |
| M2-05 | [#57](https://github.com/NiklasRist/Digital-Signage-Tool/issues/57) | [auftrags-manager] Q4-Warteschlangenjournal rotierend führen |
| M2-06 | [#58](https://github.com/NiklasRist/Digital-Signage-Tool/issues/58) | [auftrags-manager] Zustandsübergänge der Aufträge prüfen |
| M2-07 | [#59](https://github.com/NiklasRist/Digital-Signage-Tool/issues/59) | [auftrags-manager] Nächsten Auftrag seriell freigeben |
| M2-08 | [#60](https://github.com/NiklasRist/Digital-Signage-Tool/issues/60) | [auftrags-manager] Fachdienst-Handler registrieren und ausführen |
| M2-09 | [#61](https://github.com/NiklasRist/Digital-Signage-Tool/issues/61) | [auftrags-manager] reiheEin implementieren |
| M2-10 | [#62](https://github.com/NiklasRist/Digital-Signage-Tool/issues/62) | [auftrags-manager] entferne implementieren |
| M2-11 | [#63](https://github.com/NiklasRist/Digital-Signage-Tool/issues/63) | [auftrags-manager] wiederhole implementieren |
| M2-12 | [#64](https://github.com/NiklasRist/Digital-Signage-Tool/issues/64) | [auftrags-manager] holeStand implementieren |
| M2-13 | [#65](https://github.com/NiklasRist/Digital-Signage-Tool/issues/65) | [auftrags-manager] Ereignis queue:geaendert senden |
| M2-14 | [#66](https://github.com/NiklasRist/Digital-Signage-Tool/issues/66) | [auftrags-manager] pendingDeletions in Q2 führen |
| M2-15 | [#67](https://github.com/NiklasRist/Digital-Signage-Tool/issues/67) | [auftrags-manager] Beim Öffnen eines Projekts Q2 laden |
| M2-16 | [#68](https://github.com/NiklasRist/Digital-Signage-Tool/issues/68) | [auftrags-manager] Render-Handler verzahnen |
| M2-17 | [#69](https://github.com/NiklasRist/Digital-Signage-Tool/issues/69) | [auftrags-manager] Queue-Dateien atomar und serialisiert lesen und schreiben |
| M2-18 | [#70](https://github.com/NiklasRist/Digital-Signage-Tool/issues/70) | [auftrags-manager] Auftrag abschließen und die Schlange weiterdrehen |
| M2-19 | [#71](https://github.com/NiklasRist/Digital-Signage-Tool/issues/71) | [auftrags-manager] Die vier Queue-Kanäle und das Ereignis verdrahten |
