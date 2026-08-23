### Issue NA-01 (= #334): [project-store] setzeStandardSegmentdauer – die projektweite Standarddauer wird änderbar

## Ziel (in einem Satz)
Die Kette `aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10` bekommt ihren Schreibweg:
eine atomare Instant-Operation im `project-store`, die den Projektstandard setzt und abgewählte
Aktionen auf ihrem bisher wirksamen Wert einfriert – dazu der Kanal `project:setzeStandardSegmentdauer`
und seine Anmeldung im Main-Bootstrap.

## Modul & Datei
- Modul: `project-store` [D1] (Main) – und, als zweite und dritte Datei, die Kanal-Registry und die
  Anmeldung im `ipc-gateway` bzw. Main-Bootstrap
- Datei 1 (bestehend, **genau zwei Felder** ergänzt): `src/shared/contracts/project.ts` (**#15**,
  Nachtrag vom 23.08.2026 dort wörtlich ausgeschrieben) – `Project.standardSegmentdauer: number`
  und `Bearbeitungsstand.standardSegmentdauer: number` (drittes Feld)
- Datei 2 (neu): `src/main/project-store/setze-standard-segmentdauer.ts`
- Datei 3 (bestehend, **genau ein** neuer Eintrag): `src/shared/contracts/kanaele.ts` – der Block
  `project` wird um **eine** Zeile ergänzt. Die Registry ist laut #25 ausdrücklich dafür vorgesehen:
  „die Gruppe darf also wachsen" (Kommentar in der Datei selbst).
- Datei 4 (neu): `src/main/ipc-gateway/project-store-nachtrag-4.ts` – meldet genau den einen Kanal
  an (Vorbild: `project-store-nachtrag.ts`, #153)
- Datei 5 (bestehend, **genau ein** Import und **genau ein** Aufruf, dazu drei Zahlwörter):
  `src/main/index.ts` (**#3**) – s. „Der Eintrag im Main-Bootstrap"
- Zugehörige Testdateien: unter `tests/unit/` bzw. `tests/integration/`; sie zählen zum erlaubten
  Dateibereich.
- **Nicht erlaubt**: `src/main/ipc-gateway/project-store-verdrahtung.ts` (**#76**),
  `project-store-nachtrag.ts` (**#153**), `project-store-nachtrag-2.ts` (**#240**),
  `project-store-nachtrag-3.ts` (**#323**, falls bereits gebaut),
  `src/main/project-store/setze-dauer.ts` (**#44**), `schreibe-projekt.ts` (**#46**),
  `auto-speichern.ts` (**#47**), `bearbeitungsstand.ts` (**#237**), `d1-lock.ts` (**#32**),
  `src/shared/contracts/konstanten.ts` (**#21** – wird nur gelesen), `src/renderer/**`
- Vertrag: Technisches Konzept **9.5.2** (Operation, Kanal, Schreibweg – Quelle der Wahrheit,
  Festlegungen v3.17/v3.18), **9.11.3** (`Project.standardSegmentdauer`), **9.11.4**
  (Dauer-Bereich, Vorbelegung), **9.13.2** (`Bearbeitungsstand` als drittes Feld,
  Schnappschusspflicht), **9.5.5** (KEINE Migration), **9.1.1** (Ergebnis-Hülle, Validierung im
  Main), Anforderungsdokument **4.4** (der Dialog fragt, ob bestehende Aktionen mitziehen)
- Prozess/Speicher: D1 (`project.json`), schreibend – über das **eine** D1-Lock. Kein Auftrag,
  keine Queue.
- IPC-Kanal: `project:setzeStandardSegmentdauer` (**ein** Instant-Kanal). **Kein** Ereignis.

**HARTE REIHENFOLGE (bindend).** Dieses Issue läuft **NACH #309** und **NACH #323**, wenn deren
Verdrahtungen im Bootstrap stehen. **Prüfe die Dateien vor deiner Änderung:** Steht in
`src/shared/contracts/kanaele.ts` der Eintrag `setzeStandardMarke` noch nicht, ist **#323 nicht
gebaut** – dann **melden und anhalten**, nicht rechnen und nicht selbst nachziehen. Existiert
`project-store-nachtrag-3.ts` bereits, gehört deine Verdrahtung in **nachtrag-4** (wie hier
geschrieben); existiert nur bis `nachtrag-2`, nimmst du **nachtrag-3** und passt den Dateinamen in
diesem Issue und in deiner DoD-Beschreibung an – **eine** Abweichung, benannt, nicht still.

## Warum das im Gesamtsystem wichtig ist
Seit AD v1.6 / TK v3.16–v3.18 liest eine halbe Meilensteinbreite die Auflösungskette
(`aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10` – u. a. #123, #136, #152 und die
composer/action-editor-Stellen), aber **niemand kann den Projektstandard je schreiben**. Der Nutzer
könnte den Wert nie ändern – FA-06 wäre lesbar, aber tot. Und die Undo-Frage entscheidet sich genau
hier: `setzeStandardSegmentdauer` ändert **zwei Dinge in einem atomaren Zug** (TK 9.13.2):

> „Wer sie zusammen ausführt, muss sie zusammen zurücknehmen können; ohne das dritte Feld nähme ein
> Undo die Aktions-Dauern zurück und ließe den Standard stehen."

Deshalb trägt der `Bearbeitungsstand` seit v3.18 das **dritte Feld** – dieses Issue bringt beide
Felder an die Vertragsdatei, denn es ist der einzige Grund, warum sie sich ändern.

Drei lokale Entscheidungen wären hier teuer:

1. **Die Einfrier-Werte erst NACH dem Setzen des Standards berechnen.** Der „bisher wirksame" Wert
   einer Aktion ist `aktion.standardDauer ?? ALTER_projekt.standardSegmentdauer`. Wird der
   Standard zuerst überschrieben, frieren abgewählte Aktionen auf dem NEUEN Wert ein – der Nutzer
   hätte sie gar nicht abwählen können, sie wären einfach gleich geworden. Reihenfolge: erst alle
   Einfrier-Werte aus dem alten Stand lesen, dann schreiben.
2. **Den Bereich an einer zweiten Stelle prüfen.** Die Grenzen 10–45 s stehen in `DAUER_BEREICH`
   (#21) und sonst nirgends („aus dieser einen Konstante", TK 9.11.4). Ein lokales Literal hier
   wäre eine zweite Quelle für dieselbe Information – dieselbe Fehlerklasse wie das verbotene
   `position`-Feld.
3. **n Einzelaufrufe statt einer Operation.** Wären die Einfrierungen separate Aufrufe von
   `bearbeiteAktion`, wäre der Zug **nicht unteilbar** – scheitert der fünfte von zwölf, ist der
   Standard schon geändert (TK 9.5.2, bindend).

## Signatur (verbindlich – NICHT ändern)

### Datei 2 – die Operation
```ts
// src/main/project-store/setze-standard-segmentdauer.ts
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'
import type { ProjectStoreFehlercode } from './assets'
import { DAUER_BEREICH } from '../../shared/contracts/konstanten'
import { holeAktivesProjekt } from './aktives-projekt'
import { planeAutoSpeicherung } from './auto-speichern'
import { mitD1Lock } from './d1-lock'

export async function setzeStandardSegmentdauer(
  dauer: number,
  festzuschreibendeAktionen: string[],
): Promise<Ergebnis<Project, ProjectStoreFehlercode>>
// - nimmt das D1-Lock SELBST (mitD1Lock, #32); der Handler darf sie NICHT zusätzlich einwickeln
// - wirkt AUSSCHLIESSLICH auf das GELADENE Projekt (nur eines ist geladen, TK 9.5.1)
// - validiert dauer gegen DAUER_BEREICH (#21), nie gegen Zahlenliterale
```

Die Operationszeile des Vertrags, wörtlich – daraus ist die Signatur abgeschrieben, nicht gewählt:

> „| `setzeStandardSegmentdauer` | `dauer`, `festzuschreibendeAktionen` (Aktions-IDs) →
> `Ergebnis<Projekt>` – setzt `Project.standardSegmentdauer` des **geladenen** Projekts (9.11.3)
> **und** schreibt für jede genannte Aktion ihren **bisher wirksamen** Wert als eigene
> `Aktion.standardDauer` fest, in **einem** Schritt. Validiert `dauer` gegen den Dauer-Bereich
> (10–45 s, 9.11.4) – dieselbe Konstante wie `setzeDauer`; unbekannte Aktions-ID →
> `ungueltige_eingabe` |" (TK 9.5.2)

**`Ergebnis<Projekt>` im TK ist der TypeScript-Typ `Project`** aus
`src/shared/contracts/project.ts`. Einen Typ namens `Projekt` gibt es nicht; leg auch keinen an.

**Fremde Funktionen und Typen, die du benutzt** (weicht eine Signatur von der tatsächlichen Fassung
der definierenden Datei ab, ist das ein **Vertragsfehler**: melden, NICHT eigenmächtig anpassen):

```ts
// #12/#22 – src/shared/contracts/ergebnis.ts
export type GenerischerFehlercode = 'ungueltige_eingabe' | 'nicht_gefunden' | 'unbekannter_fehler'
export type Ergebnis<T, F extends string = GenerischerFehlercode> =
  | { ok: true; wert: T }
  | { ok: false; fehler: { code: F | GenerischerFehlercode; meldung: string; daten?: unknown } }

// #21 – src/shared/contracts/konstanten.ts
export const DAUER_BEREICH = { min: 10, max: 45 } as const

// #72 – src/main/project-store/assets.ts (dort deklariert, hier NUR importiert)
export type ProjectStoreFehlercode = 'speicher_fehler' | 'projekt_beschaeftigt' | 'kein_projekt'

// #32 – src/main/project-store/d1-lock.ts
export async function mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
// fuehrt aktion() garantiert seriell aus; `aktion` darf selbst NICHT erneut mitD1Lock aufrufen

// #192/M6-37 – src/main/project-store/aktives-projekt.ts
export function holeAktivesProjekt(): Project | null
// LEBENDER Stand (dieselbe Objektreferenz, die die Instant-Operationen mutieren) – KEINE Kopie.
// SYNCHRON. NIMMT KEIN LOCK. WIRFT NIE. MAIN-INTERN.

// #47 – src/main/project-store/auto-speichern.ts
export function planeAutoSpeicherung(projekt: Project): void
// merkt projekt als zu speichernde, aktuelle Version des AKTIVEN Projekts vor; SYNCHRON,
// nimmt KEIN Lock, kann nicht fehlschlagen.
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `dauer` | der neue projektweite Standard in Sekunden | ganzzahlig oder numerisch im geschlossenen Bereich `DAUER_BEREICH.min … DAUER_BEREICH.max` (#21); außerhalb → `ungueltige_eingabe` |
| `festzuschreibendeAktionen` | Aktions-IDs, deren `standardDauer` auf dem bisher wirksamen Wert **eingefroren** wird (die „Abwählbaren" des Dialogs, AD 4.4) | jede Kennung MUSS in `Project.aktionen` existieren, sonst `ungueltige_eingabe`; **leere Liste ist gültig** (nur den Standard ändern); Doppel-Einträge sind kein Fehler (idempotent) |

Ausgang bei Erfolg: das **mutierte** `Project` (lebender Stand) mit neuem
`standardSegmentdauer` und den eingefrorenen `Aktion.standardDauer`-Werten; Auto-Speicherung ist
vorgemerkt.
Ausgang bei Fehler: `ungueltige_eingabe`, `kein_projekt`, `speicher_fehler` – in jedem Fall
**ohne jede Wirkung** (alles oder nichts).

## Ablauf (bindend, in genau dieser Reihenfolge)
1. Prüfung `dauer` gegen `DAUER_BEREICH` – außerhalb: `ungueltige_eingabe`, keine Wirkung.
2. Innerhalb des Locks: `holeAktivesProjekt()` – `null`: `kein_projekt`, keine Wirkung.
3. Jede Kennung in `festzuschreibendeAktionen` in `Project.aktionen` suchen – eine fehlt:
   `ungueltige_eingabe`, **keine** Wirkung (auch der Standard ist noch nicht gesetzt).
4. Für jede genannte Aktion den **bisher wirksamen** Wert lesen:
   `aktion.standardDauer ?? projekt.standardSegmentdauer` (ALTER Stand!) und als
   `aktion.standardDauer` schreiben. Bereits eingefrorene Aktionen behalten ihren Wert (er ist ja
   ihr bisher wirksamer).
5. `projekt.standardSegmentdauer = dauer`.
6. `planeAutoSpeicherung(projekt)` – **einmal**, nach allen Mutationen.
7. Rückgabe: `{ ok: true, wert: projekt }`.

**Reichweite (TK 9.5.2, Entscheidung 3, bindend):** bereits platzierte Listenelemente behalten ihre
materialisierte `dauer` – die Operation fasst `liste` **nicht** an. Nur `Aktion.standardDauer` und
`Project.standardSegmentdauer` ändern sich.

## Der Eintrag im Main-Bootstrap (`src/main/index.ts`)
In SCHRITT 5 (Anmeldungen OHNE Fenster), unmittelbar nach der letzten gebauten
project-store-Anmeldung, als eigene nummerierte Position mit Kommentar im Stil der Nachbarn:

```ts
// 11. verdrahteProjectStoreNachtrag4IPC() - #334,
//     src/main/ipc-gateway/project-store-nachtrag-4.ts. Meldet GENAU EINEN Kanal an
//     (project:setzeStandardSegmentdauer). Unmittelbar nach der vorherigen
//     project-Verdrahtung - derselbe Namensraum, doppelte Registrierung faellt sofort auf.
```

(Nummer und Funktionsname der Position richten sich nach dem Stand der Datei; die Zahlwörter
„ZEHN/dreizehn/siebzehn" im Kopf von Schritt 5 und in der Datei-Übersicht sind mitzupflegen –
**Prüfe die Datei vor deiner Änderung**, s. HARTE REIHENFOLGE.)

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Validiert `dauer` gegen den Dauer-Bereich (10–45 s, 9.11.4) – **dieselbe Konstante** wie
  `setzeDauer`" (TK 9.5.2) – das ist `DAUER_BEREICH` (#21).
- „sie bekommt den neuen Standardwert **und** die Liste der abgewählten Aktionen (Anforderungsdokument
  4.4), schreibt unter dem **einen** D1-Schreib-Lock den Standard, schreibt für jede abgewählte
  Aktion den alten Wert fest und speichert **einmal**; scheitert etwas, ist **nichts** geändert."
  (TK 9.13.2 Änderungsliste, Punkt 2)
- „Bereits platzierte Listenelemente behalten ihre `dauer`: Sie ist beim Platzieren **materialisiert**
  worden … und ändert sich **nicht rückwirkend**." (TK 9.5.2, Entscheidung 3)
- „`schemaVersion` bleibt bei 1 – die Erhöhung auf 2 ist ZURÜCKGENOMMEN … Es gibt KEINE Migration."
  (TK 9.5.5) – dieses Issue baut **keine** Migrationslogik; ein fehlendes Feld in einer bestehenden
  `project.json` ist Sache der Lade-Validierung (#34/#48), nicht dieser Operation.
- **Schnappschusspflichtig (TK 9.13.2):** Die Operation ist eine Instant-Operation und läuft damit
  durch die bestehende Undo-Hülle um die gemeinsame Projekt-Sicht (**#243**) – der Schnappschuss
  entsteht an EINER Stelle, wie für jede Instant-Operation. **Kein** zweiter Undo-Eingang, **kein**
  Sonderweg.
- **Kein Ereignis:** Der Renderer erfährt das neue Projekt über den Rückgabewert (Entscheidung E1
  aus dem M5-Prüflauf – Operationen liefern den neuen Stand zurück, der Aufrufer gibt ihn an die
  gemeinsame Sicht weiter).

## Bedienort (entschieden am 23.08.2026)
Der Dialog zur Standarddauer liegt in der **Projektverwaltung** (`modul:projekt-verwaltung`,
M7) – Projekt-Einstellungen gehören dorthin, der Composer bleibt dem Zusammenstellen vorbehalten.
Das UI-Issue dafür entsteht separat; dieses Issue liefert die Operation, die jener Dialog ruft.
**Dieses Issue berührt KEINE Renderer-Datei.**

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `dauer` außerhalb 10–45 / nicht endliche Zahl | `ungueltige_eingabe` | keine Wirkung |
| eine Kennung aus `festzuschreibendeAktionen` existiert nicht | `ungueltige_eingabe` | keine Wirkung – auch der Standard ist unverändert |
| kein Projekt geladen | `kein_projekt` | keine Wirkung |
| Auto-Speichern kann nicht vormerken / D1-Fehler beim späteren Schreiben | `speicher_fehler` | s. Auto-Speicher-Vertrag (#47); die Operation selbst wirft nicht |

## Nicht selbst entscheiden – STOPP und fragen
- (keine offenen Punkte – der Bedienort ist entschieden, der Schreibweg steht im TK, die
  Reichweite ist festgelegt. Doppel-Einträge und die leere Liste sind oben LOKAL entschieden und
  begründet.)

## Definition of Done
- [ ] `Project.standardSegmentdauer: number` und `Bearbeitungsstand.standardSegmentdauer: number`
      stehen in `src/shared/contracts/project.ts`, kommentiert gemäß #15-Nachtrag (TK 9.11.3/9.13.2);
      **kein** weiteres Feld der beiden Typen hat sich geändert
- [ ] `setzeStandardSegmentdauer` friert jede genannte Aktion auf ihrem **bisher wirksamen** Wert
      ein (Gegenprobe: Aktion mit `standardDauer: null` + altem Standard 10 + neuem Standard 30 →
      danach `standardDauer === 10`, nicht 30)
- [ ] Bei `ungueltige_eingabe` (schlechte `dauer` ODER unbekannte Kennung) ist der Stand **bytegleich**
      zum Ausgangszustand – auch der Standard wurde nicht gesetzt (Reihenfolge der Prüfungen!)
- [ ] Die Validierung liest `DAUER_BEREICH` aus #21; `grep` findet **keinen** Zahlenliteral-Vergleich
      `10`/`45` in `setze-standard-segmentdauer.ts`
- [ ] `kanaele.ts` enthält genau einen neuen Eintrag `setzeStandardSegmentdauer:
      'project:setzeStandardSegmentdauer'`; der Vertragstest von #25 läuft grün
- [ ] `src/main/index.ts` ruft die neue Verdrahtung in SCHRITT 5 auf; die Zahlwörter stimmen mit der
      tatsächlichen Anzahl der Anmeldungen überein
- [ ] Typecheck, Lint und Tests laufen grün; die Tests der betroffenen Verträge (#15-Typen, #25-
      Registry, #47-Auto-Speicher-Nutzung) wurden ausgeführt
- [ ] Keine Datei außerhalb der oben genannten (+ Testdateien) geändert

## Abhängigkeiten
- Blockiert von: #15 (Typen), #21 (DAUER_BEREICH), #32 (mitD1Lock), #47 (Auto-Speichern),
  #192 (holeAktivesProjekt); für die Verdrahtung: #76/#153 als Muster, #3 (Bootstrap),
  hart NACH #309 und #323 (s. o.)
- Blockiert: das UI-Issue des Standarddauer-Dialogs (projekt-verwaltung, M7); indirekt alles,
  was die Kette aus TK 9.8.4 **änderbar** machen soll

## Bezug
TK 9.5.2 (v3.17/v3.18-Festlegungen), 9.5.5, 9.11.3, 9.11.4, 9.13.2, 9.1.1; AD 4.4 (FA-06)
