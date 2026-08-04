# Issue M0-13: [grundgeruest] ESLint-Setup mit Verbot der Nicht-Null-Behauptung

<!--
ANGELEGT am 04.08.2026 als #193 (nicht #156 - M6 lag zu dem Zeitpunkt schon auf
#156-#192). Milestone: M0 - Grundgerüst.
Labels: wer:grundgeruest, ebene:build
(kein braucht-entscheidung: der STOPP-Block enthält nur Verbote, keine offene Frage,
die Schnittstelle oder Verhalten festlegt)
-->

## Ziel (in einem Satz)
`npm run lint` prüft den gesamten Code unter `src/` und **bricht ab**, sobald jemand eine
Nicht-Null-Behauptung (`wert!`) benutzt – die einzige Möglichkeit, die in `tsconfig.base.json`
gesetzte Prüfung `noUncheckedIndexedAccess` wieder auszuhebeln.

## Modul & Datei
- Modul: Grundgerüst / Lint-Tooling
- Datei: `eslint.config.js`, `package.json` (Skript `lint`), `package-lock.json` (durch `npm install`)
- Vertrag: kein einzelner TK-Abschnitt; sichert die Compiler-Einstellung aus #1 ab
- Prozess/Speicher: – (Grundgerüst für P1–P7)

## Warum das im Gesamtsystem wichtig ist
`tsconfig.base.json` setzt seit #1 `noUncheckedIndexedAccess: true`. Damit hat ein Array-Zugriff
`elemente[i]` den Typ `Listenelement | undefined`, und der Compiler erzwingt, dass der
`undefined`-Fall behandelt wird. Das ist genau die Fehlerklasse, die in diesem Projekt am
teuersten ist: ein Index am Rand (`"Element X von N"` im geführten Reparatur-Modus, Umsortieren
der Liste, `abschnitte[0]` beim Band) fällt nicht beim Entwickeln auf, sondern beim Nutzer, und
zwar als Absturz mitten in einem Arbeitsablauf.

Der Schalter hat aber eine Fluchttür: `elemente[i]!` sagt dem Compiler „vertrau mir, da liegt
etwas" und stellt exakt den Zustand von vorher wieder her. **Das ist schlechter als kein
Schalter**, denn der Code sieht danach geprüft aus. Für die Agents, die dieses Projekt füllen,
ist das der Weg des geringsten Widerstands: Ein Agent, der eine 30-Zeilen-Funktion isoliert
schreibt und einen Compiler-Fehler wegbekommen will, tippt das Ausrufezeichen, nicht die
Fallunterscheidung. Ohne dieses Issue ist die Einstellung aus #1 also eine Bitte, keine Regel –
und der Nutzer, der die Ergebnisse prüft, kann laut CLAUDE.md solche Fehler „nicht zuverlässig
erkennen oder gegenprüfen".

Zweitens ist ESLint der Ort, an dem spätere Meilensteine weitere Grenzen maschinell durchsetzen
können (z. B. dass `src/renderer/` nichts aus `src/main/` importiert). Dieses Issue schafft dafür
die Grundlage, führt solche Regeln aber **noch nicht** ein.

## Signatur (verbindlich – NICHT ändern)
```
eslint.config.js                 // Flat Config (ESLint 9), ESM, exportiert ein Array

  Geltungsbereich: ["src/**/*.ts", "src/**/*.tsx"]
  Ignoriert:       ["dist/**", "release/**", "node_modules/**", "coverage/**"]

  Regel (Fehler, nicht Warnung):
    "@typescript-eslint/no-non-null-assertion": "error"

  Grundlage: typescript-eslint, Konfiguration "recommended"
             (OHNE Typinformation - "recommended-type-checked" verlangt einen
              Programm-Verbund und ist mit den DREI getrennten tsconfigs aus #1
              nicht ohne Weiteres aufzusetzen; die Regel oben braucht keine)

package.json Skripte:
  "lint":     eslint .
  "lint:fix": eslint . --fix
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| Quelldateien unter `src/` | zu prüfender Code | alle drei Prozesse **und** `src/shared/` in einem Lauf |

Ausgang bei Erfolg: `npm run lint` endet mit Rückgabewert 0 und ohne Ausgabe, solange keine Regel
verletzt ist.
Ausgang bei Fehler: `npm run lint` endet mit Rückgabewert **ungleich 0** und benennt Datei, Zeile
und Regelnamen. Kein Laufzeit-Fehlercode (Bauzeit-Issue).

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „`noUncheckedIndexedAccess` ist in tsconfig.base.json AN. Der Schalter ist nur die halbe Miete -
  die Fluchttür `elemente[i]!` hebt ihn auf und lässt den Code zugleich geprüft aussehen."
  (CLAUDE.md)
- Die Regel gilt als **`error`**, nicht als `warning`. Eine Warnung ändert den Rückgabewert nicht
  und wird deshalb übersehen.
- Der Lauf umfasst **alle** drei Prozessordner und `src/shared/`. Ein Lint, der nur `src/main/`
  prüft, ließe die Fluchttür im Renderer offen – dort liegt mit `Listenelement[]` die
  array-lastigste Fachlogik.

## Fehlerpfade (vollständig)
Entfällt – reines Bauzeit-/Tooling-Issue ohne Laufzeit-Code.

## Nicht selbst entscheiden – STOPP und fragen
- **Die Regel nicht abschwächen.** Weder auf `"warn"` setzen, noch über
  `allowUnsafeArrayAccess`-artige Optionen, noch dateiweise per
  `/* eslint-disable @typescript-eslint/no-non-null-assertion */`. Stößt echter Code an eine
  Stelle, an der die Behauptung unvermeidlich scheint, ist das ein Befund zum Vorlegen – fast
  immer fehlt dort in Wahrheit eine Fallunterscheidung.
- **`noUncheckedIndexedAccess` in `tsconfig.base.json` nicht anfassen.** Dieses Issue sichert die
  Einstellung ab, es verhandelt sie nicht.
- **Keine weiteren Regeln über die Signatur hinaus einführen** (z. B. Import-Grenzen zwischen den
  Prozessen, Formatierung, Namenskonventionen). Sinnvoll, aber eigene Entscheidungen mit eigenen
  Folgen für 157 spätere Issues – separat vorlegen.

## Definition of Done
- [ ] `npm run lint` läuft auf dem unveränderten Bestand fehlerfrei durch (Rückgabewert 0)
- [ ] Eine **vorübergehend** angelegte Datei unter `src/main/` mit einer Nicht-Null-Behauptung
      (z. B. `const a: string[] = []; export const b = a[0]!;`) lässt `npm run lint` mit
      Rückgabewert ungleich 0 und der Meldung `@typescript-eslint/no-non-null-assertion`
      scheitern; dieselbe Datei unter `src/renderer/` ebenso. Beide Dateien werden nach dem
      Nachweis **wieder gelöscht** – sie sind Prüfmittel, kein Ergebnis
- [ ] `npm run typecheck` (aus #1) läuft unverändert weiter durch
- [ ] Keine Datei außerhalb der unter „Modul & Datei" genannten geändert; die beiden
      Nachweis-Dateien oben sind ausdrücklich ausgenommen, weil sie am Ende nicht mehr existieren

## Abhängigkeiten
- Blockiert von: #1 (braucht die Ordnerstruktur, die tsconfigs und die `package.json`)
- Blockiert: – (blockiert kein Issue technisch, sollte aber **vor** M1 stehen, damit die
  Fluchttür nie offen ist, während Fachlogik entsteht)

## Bezug
CLAUDE.md („OFFEN (04.08.): noUncheckedIndexedAccess …"), #1 (`tsconfig.base.json`)
