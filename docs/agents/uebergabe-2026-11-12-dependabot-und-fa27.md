# Übergabe 12.11.2026 — Dependabot auf null, und dann der Differenzierer

**Vorgeschichte:** [`uebergabe-2026-11-11-referenzlauf.md`](uebergabe-2026-11-11-referenzlauf.md)
(57. Sitzung: die Messlatte wird genommen, nicht gebaut — AD v2.2, Issues #465/#466).

---

## 1. Womit die Sitzung begann

Zuerst die Dependabot-Findings: durchgehen, ranken, in eine Reihenfolge bringen. Danach kam über
mehrere Umwege der eigentliche Differenzierer dran — FA-27. Dazwischen lag eine Korrektur von Niklas,
die den Referenzlauf umgeschrieben hat (Abschnitt 5).

**Ergebnis in einem Satz:** Dependabot **71 → 1 offen** (lokal behoben, nicht gepusht), `npm audit`
**24 → 0**, AD **v2.2 → v2.5**, TK **v3.61 → v3.64**, #469 geschlossen, **#470** als Bau-Issue
angelegt.

---

## 2. Dependabot: der Befund, der alles ordnete

**Alle 71 Alerts lagen in `devDependency`-Ketten. Keine einzige Produktionsabhängigkeit war
betroffen.** In `dependencies` stehen nur `@dnd-kit/*`, `ffmpeg-static`, `ffprobe-static`, `react`,
`react-dom` — keins davon stand in der Liste. Das Paket enthält laut `electron-builder.yml` nur
`dist/**` + `package.json`.

> **Stand der Zählung, ehrlich:** GitHub meldet am Sitzungsende noch **1 offenen** Alert
> (`minimatch`), weil dessen Fix nur **lokal** liegt. Nach dem Push fällt er weg. `npm audit` ist
> **schon jetzt 0**, weil es den lokalen Baum liest.

**Die eine Ausnahme:** `electron` ist zwar devDependency, aber das Binary **ist** die Laufzeit der
ausgelieferten App. Chromium/V8 stecken darin. Deshalb Rang 1, obwohl „dev".

Die 71 sind ein Zählartefakt: **9 Pakete** teilen sich 52 GHSAs; `undici` allein stellte **28** Alerts
aus drei Instanzen (6.x in `node-gyp`, 7.x in `@electron/get`, 8.x in `jsdom`).

### Der Weg, den ich NICHT gegangen bin — und warum

Ein blankes `npm update` hätte ebenfalls 71/71 geräumt, aber **197 Paketwechsel** gekostet:
`react`/`react-dom` 19.2.8 → 19.3.1 und `scheduler` 0.27 → 0.28 (**ausgeliefert!**), dazu
`ajv` 6→8, `minimatch` 3→10, `which` 2→5 und `@noble/hashes` 2.3→**1.8** (Downgrade).

Gewählt wurde der **gestaffelte** Weg: **84 Wechsel**, `react` bleibt **19.2.8**. Gemessen, nicht
geschätzt — beide Wege wurden in einer Kopie außerhalb des Repos durchgerechnet.

### Die vier Stufen (alle: nur `package-lock.json`, `package.json` nie)

| Commit | Inhalt | Alerts |
|---|---|---|
| `14f6198` | electron 43.2.0 → **43.8.8** | 12 |
| `3118bf7` | electron-builder 26.15.3 → **26.18.0** (fast-uri, xmldom ganz) | +23 |
| `fb02bf8` | vite 8.3.8, vitest 4.1.12, jsdom 30.1.3 (zieht undici 8.12.4) | +22 |
| `fd3f1b1` | undici 7.30.2, brace-expansion, js-yaml 4.3.2, zod 4.6.7 | +14 |

**Belege:** volles Gate nach jeder Stufe; `npm run dist` packt (electron-builder 26.18.0,
Electron 43.8.8), ffmpeg + ffprobe in `app.asar.unpacked`, das **gepackte Bundle startet** und läuft
nach 7 s noch. Fensterbeleg nach allen Stufen unverändert: Canvas 950 × 534, Streifen 108,
Inspector 340; `config.json` byte-identisch.

### Der letzte Alert: minimatch, und ein erzwungener Hauptversionssprung

`minimatch` GHSA-g3hv-75wg-m249, geschlossen erst ab **11.0.1**. Upstream war nicht nachgezogen:
`app-builder-lib 26.18.0` hängt weiter an `^10.2.5`, `@typescript-eslint/typescript-estree 8.72.2` an
`^10.2.2`. Also **zwei erzwungene `overrides`** (`^9` und `^10`, nicht `^3`/`^5` — die sind nicht
betroffen).

Was dagegen geprüft wurde, bevor es committet wurde (`7866317`):

- 11.0 **entfernt** `makeRe()`, `Minimatch#regexp`, `AST`, `debug()`, `matchOne()`, `slashSplit()`,
  `levelTwoFileOptimize()` → **0 Treffer** bei allen vier Verbrauchern.
- 11.0 ändert die Semantik für Pfade mit **Schrägstrich am Ende** — genau die Form von
  `asarUnpack` (`**/ffmpeg-static/**`). Probe: nach `npm run dist` liegen **alle 5 Binaries** in
  `app.asar.unpacked`, inklusive ffmpeg.

**Restrisiko, offen benannt:** das Override bleibt auch dann stehen, wenn die Eltern später selbst auf
11 gehen. Weg damit = `"overrides"` aus `package.json` löschen, `npm install`.

---

## 3. npm auf dem Rechner: repariert, aber **nicht** auf die neueste Fassung

`npm 10.9.8` brach an diesem Baum reproduzierbar ab (`Cannot read properties of null (reading
'edgesOut')`) — auch auf einer frischen Kopie, also kein Projektproblem.

**`npm 12.2.2` wurde getestet und verworfen:**

| npm | frisches `npm install ffmpeg-static` |
|---|---|
| 11.21.2 | Binary da (78 MB) |
| **12.2.2** | **exit 0, kein Binary** — Installationsskript still übersprungen |

Ein frisches `npm ci` unter npm 12 hätte kein ffmpeg (und kein esbuild-Binary); die App zeigte beim
ersten Start den „Start nicht möglich"-Dialog, und niemand würde npm verdächtigen.

**Installiert: npm 11.21.2** global unter `~/.local`, `node v22.23.1` unverändert. Die Symlinks
`~/.local/bin/npm` und `npx` zeigten in die Hermes-Node-Installation und mussten weichen; Sicherungen
liegen als `npm.hermes-symlink.bak` / `npx.hermes-symlink.bak` daneben.

---

## 4. FA-27 in die Treiber-Matrix (Nachtrag zu #468)

Ein Test war rot: `tests/unit/treiber-matrix.spec.ts` → `fehlend: ['FA-27']`. **Vorbestehend**, per
`git stash`-Probe auf HEAD belegt (identisch rot) — nicht durch die Electron-Aktualisierung
verursacht.

Ursache: **AD v2.2** (`613c03b`) führte FA-27 ein, die Matrix kannte die Nummer nicht. Dieselbe
Fehlerklasse wie #468 (damals FA-26), dieselbe Datei.

**Damit war die Angabe „Unit 5741/5741" in der Übergabe vom 11.11. seit `613c03b` nicht mehr
zutreffend.** Nachgezogen (`988cc48`): Zeile FA-27 mit Status `Luecke`, `toBe(26)` → `toBe(27)`,
Lückenliste um Rang 10. Zählung **mechanisch nachgerechnet**, nicht addiert: **12 gemessen,
10 teilweise, 2 Lücken, 3 manuell; 16 Muss, 11 Soll**.

---

## 5. Die Korrektur: „du bist hyperfixiert auf präsentationen"

Der Referenzlauf (AD 12.1/14) war als Folienvergleich gebaut. Niklas hat das zweimal korrigiert:

> „warum powerpoint oder google slides … du bist hyperfixiert auf präsentationen"

**Der Vergleich ist Arbeit gegen Arbeit, nicht Folie gegen Folie.** Daraus **AD v2.3 / TK v3.62**
(`1caa0d4`):

- Messlatte ist die **Klasse** der **Allzweck-Werkzeuge** (PowerPoint, Google Slides, Canva) — welches
  davon, ist ausdrücklich Nebensache.
- **Beide Seiten erledigen dieselben drei Aufgaben:** fünf Angebote anlegen, einen Preis ändern, ein
  sechstes Angebot hinzufügen. Eine **fertige Vorlage** ist auf beiden Seiten erlaubt; der Unterschied
  soll aus dem Werkzeug kommen, nicht aus einem Vorsprung an Gestaltungsarbeit.
- Startwert heißt jetzt **„Referenz ≤ 14/24"** statt „PowerPoint ≤ 14/24".

Dabei fiel auf: das TK führte seit Wochen **„Bezug: Anforderungsdokument v1.13"**, während das AD bei
v2.2 stand. Mitgezogen.

**Plan und Protokoll** neu geschnitten: [`plan-referenzlauf-466.md`](plan-referenzlauf-466.md) (acht
Phasen, Stoppuhr als Hauptkriterium) und
[`abnahme-2026-11-11-referenzlauf.md`](abnahme-2026-11-11-referenzlauf.md) (erste Abnahme-Datei des
Projekts; leere Felder sind **Striche, keine Nullen**).

---

## 6. Die Referenzvorlage — und ein toter Verweis

Beide Kandidaten wurden an ihren **Vorschaubildern** gesichtet, nicht an ihrer Beschreibung.

**Befund: die „Salerio"-URL aus #466 führt nicht mehr zu Salerio.** Sie leitet auf ein anderes Deck um
(„Professional Business"). Wer sie benutzt, misst gegen etwas anderes als das Dokumentierte.

**Gewählt: PresentationGO „Fitness Studio"** — gym-spezifisch, also die **konservative** Wahl: die
Baseline sieht für diesen Zweck schon richtig aus.

**Trägerfolie ist die Trennfolie**, nicht die Stichpunktfolie: großer Titel (Produktname),
Untertitel (Preis/Beschreibung), rechte Bildfläche (Produktfoto). Eine erzwungene Stichpunktfolie
hätte die Baseline künstlich schwach gemacht — der Strohmann, den AD 12.1 verbietet.

Die Datei ist ohne Konto abrufbar (1,59 MB, gültiges PowerPoint 2007+, 8 Folien) und liegt als
`~/Downloads/fitness-studio-vorlage.pptx`. **Nicht im Repo** — fremdes Material.

---

## 7. #469: fünf Entscheidungen, und dann zwei Anforderungen mehr

Das Issue verlangte fünf Entscheidungen **vor** dem Schreiben („Nicht selbst wählen, sondern
entscheiden"). Niklas hat sie einzeln beantwortet:

| Frage | Entscheidung |
|---|---|
| Quelle der Bilder | **strukturierte Produktdaten** (`Product.image`), `og:image` als Rückfall — nicht nur `og:image` (das ist oft das Laden-Vorschaubild) |
| Produkt-URL speichern | **ja**, `Aktion.produktUrl` |
| Kandidaten | **höchstens 5** |
| Herkunft | **Pflichtfeld** am Asset — als Variante, nicht als leeres Feld |
| Nutzungsrechte | **ein Satz** im Dialog, keine Bestätigung (eine Bestätigung kostet die 5 Minuten) |

### Der Einwand, der eine neue Anforderung erzeugt hat

> „herkunft über url aber woher kommt die url"

Die Frage war nicht, **wie** die URL ins Feld kommt, sondern **warum der Nutzer sie haben sollte**.
Niemand kennt Herstellerseiten auswendig, und eine Produktliste gibt es im Tool nicht.

Daraus **FA-30** (Soll, AD 4.14 / TK **9.20**): **Produktseite finden** — Stichwortsuche, vorbelegt
mit dem Aktions-Titel; **zuerst in hinterlegten Shops**, danach eine allgemeine Websuche als
ausdrücklicher **Notweg** ohne Schlüssel. Die Trennung **Finden (9.20) / Holen (9.19)** ist Absicht:
Finden ist fragil, Holen nicht — eine fragile Zusage darf nicht in einer stabilen verschwinden.

### Und eine zweite

> „außerdem muss das bild bearbeitet werden eventuell enhancement und durchsichtiger hintergrund"

Daraus **FA-28** (Soll, AD 4.13): Aufbereiten — Zuschnitt, Helligkeit, Kontrast, Schärfe,
nicht destruktiv. Und **FA-29** (Kann, AD 4.13): Freistellen über ein **mitgeliefertes Modell**,
offline. Beide **nach** FA-27 und nicht Teil von 9.19.

### Was in 9.19 steht

Abruf im **Main** als Auftrag über `reiheEin`; Kandidaten im Speicher des Main (max. 5 à 8 MB,
Verfall nach 10 min), **erst die Wahl** legt ein Asset an; `Asset.herkunft` als Pflichtfeld mit
`{art:'manuell'}` / `{art:'abruf',url,abgerufenAm}`; harte Netzgrenzen (nur http/https, keine lokalen
Netze — geprüft auf der **aufgelösten** Adresse, 3 Weiterleitungen, 15 s, 8 MB je Bild).

---

## 8. Zwei eigene Fehler, beide gefunden und behoben

1. **FA-27-Zeile ersetzt statt umsortiert.** Mein erster Tabellen-Edit löschte die Zeile FA-27.
   Aufgefallen, weil ich danach **gezählt** habe. Aus `git show HEAD` wiederhergestellt:
   **440 Bytes, `diff` leer**, byte-identisch. Derselbe Fehler wie bei #468.
2. **Zitat ohne Fett-Auszeichnung.** Der Zitat-Abgleich meldete #469, weil ich einen AD-Satz ohne die
   `**`-Auszeichnung zitiert hatte. Statt sie zu erzwingen, habe ich das Meta-Zitat ganz entfernt.

---

## 9. SonarQube und Coverage: geprüft und verworfen

Niklas fragte, ob SonarQube zusätzlich zum Linter sinnvoll wäre. **Nein, nicht als Gate** — die
Begründung steht im eigenen Repo: `eslint.config.js` sagt, das Setup führe „bewusst NUR die zwei
Schranken" ein, weitere Regeln „gehoeren einzeln vorgelegt". Sonar bringt hunderte auf einmal.

Datenlage: 405 Quelldateien, 24 davon über 500 Zeilen, größte 1336 — Sonar hätte am ersten Tag eine
rote Tür, die nichts über den Code aussagt.

**Coverage** wurde ebenfalls verworfen, aus Niklas' Grund: nicht alle Tests sind gut, und klare
Anforderungen fehlen. Datenlage: **47 von 373** Spec-Dateien nennen überhaupt eine FA-Nummer. Das
Projekt hat mit `q4-test-audit.md` bereits das bessere Werkzeug (4.607 `it`, 2,59 `expect` je `it`,
20 Verdachtsfälle **gelesen**). Als Alternative wurde **Mutation Testing** (Stryker) benannt —
nicht eingerichtet, **keine Änderung vorgenommen**.

---

## 10. Ehrlich offen

- **Nichts aus 9.19/9.20 ist gebaut.** #470 ist angelegt, nicht bearbeitet.
- **Keine der beiden Suchquellen wurde je angesprochen.** Es ist keine Shop-Liste hinterlegt; der
  Notweg ist in 9.20.6 ausdrücklich als fragil bezeichnet.
- **Der Referenzlauf ist geparkt** (Niklas: „so stehen lassen für später"). Phase 0 ist so weit
  erledigt, wie sie ohne ihn ging; der nächste Schritt ist **Phase 1 mit der Stoppuhr**.
- `einzel-instanz` (#289) flaky. Der Dependabot-Listenendpunkt liefert gelegentlich einen bereits
  `fixed` markierten Datensatz unter `state=open` — die Wahrheit steht im einzelnen Alert.

---

## 11. Stand am Sitzungsende

**6 Commits** vor `origin/main`, Arbeitsbaum sauber, **nicht gepusht** — Push nur auf Anweisung.
Gepusht wurde in dieser Sitzung nur `1764274..fd3f1b1` (Stufe 1–4).

- `dcf5352` AD v2.5 / TK v3.64 (FA-30)
- `b97282e` AD v2.4 / TK v3.63 (FA-27, FA-28/29)
- `7866317` minimatch 11.0.1
- `4eeb065` Referenzvorlage
- `1caa0d4` AD v2.3 / TK v3.62
- `bc9c823` Protokollgerüst

**Dokumente:** AD **v2.5** (593 Absätze, 1 Bild), TK **v3.64** (3006 Absätze, 2 Bilder) — beide
`unzip -t` heil, 0 Backticks.

**Gate:** Unit **5741/5741**, Typecheck 0, Lint 0, Build 0, Integration **54/54**,
`npm run dist` packt.

**Zitat-Abgleich:** 8808 Zitate über **470** Issues, **A=1109, B=354** — unverändert gegenüber dem
Stand vor den Doku-Änderungen.

**Dependabot:** GitHub meldet **1 offenen** Alert (`minimatch`) — der Fix liegt lokal und ist nicht
gepusht. `npm audit` ist **0**.

**Issues:** #470 (bau, offen), #466 (Referenzlauf), #458 (überholt).
Geschlossen in dieser Sitzung: **#469**.

---

## 12. Nächster Schritt

1. **#470 bauen** — FA-27. Enthält die **erste echte Formatmigration** des Projekts:
   `AKTUELLE_SCHEMA_VERSION` 1 → 2, `MIGRATIONS_KETTE` (bisher leer) bekommt einen Schritt, der jedem
   Asset `herkunft: {art:'manuell'}` gibt. Reihenfolge offen: Typen + Migration zuerst (Fundament),
   oder Abruf im Main zuerst (früher sichtbar).
2. Danach **#466** Referenzlauf, Phase 1 mit der Stoppuhr.
3. **FA-30** (Suche) und **FA-28/29** (Bildbearbeitung) brauchen eigene Bau-Issues — absichtlich
   **nach** FA-27.
