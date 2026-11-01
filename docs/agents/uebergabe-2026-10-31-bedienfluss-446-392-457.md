# Übergabe 31.10.2026 – Bedienfluss: #446, #392, #457

**Sitzung 35.** Gearbeitet wurde am 31.10. bis in den 01.11. hinein. Vorher:
[`uebergabe-2026-10-30-symbole-448.md`](uebergabe-2026-10-30-symbole-448.md).

---

## 1. Stand heute

| | Wert |
|---|---|
| Commits | **11 gepusht** (`16e9b57..114d047`), `main == origin/main`; diese Übergabe kommt als eigener Commit dazu |
| Arbeitsbaum | sauber |
| Gate | `npm run pruefung` **Exit 0** |
| Unit | **5.348** Tests in **352** Dateien |
| Integration | **50** in **13** Dateien |
| Treiber | **0 Befunde** |
| Lint | **0 Fehler**, **65 Warnungen** |
| Offene Issues | **6**: #383, #388, #393, #394, #374, #375 |

**Die Commits dieser Sitzung:**

| Commit | Inhalt |
|---|---|
| `cc960e9` | Doku: UI-2.0-Ist-Stand und Welle-2-Vorschlag |
| `7f53c68` | Doku: Welle 2 entschieden (Banner-Spur verworfen, Bedienfluss) |
| `c60b4b9` | **TK v3.33**: Banner-Spur entfällt |
| `13a7f29` | Treiber: 4g3/4q 20 s statt 8 s |
| `d164ba0` | Doku: #446-Messweg, Protokolle |
| `53ccaed` | **#392**: Mehrfachauswahl + atomares Gruppen-Entfernen |
| `9561c1b` | Doku: #392 gebaut |
| `cf37e7a` | **#457**: Abspielmarke; Treiber 4f7; 4f4 ohne eigenen Undo |
| `a76e3f7` | Doku: #457 gebaut, Gate offen |
| `70c66fa` | Test: `standbild-echt` ohne `spawnSync`-Deadlock |
| `114d047` | Doku: #457 geschlossen, Gate grün |

---

## 2. TK v3.33 – die Banner-Spur ist verworfen

**Entschieden vom Auftraggeber (31.10.2026):** Im Band läuft eine **Aktion**, kein eigenes
Banner-Objekt. `einblendung.abschnitte` bleibt auf `aktionRef` (so in M9 gebaut, Treiber `4f6`).

- **TK:** Version **3.33**, Abschnitt 9.7.7 ersetzt den „davon zu trennen"-Absatz, Nachtrag
  `nachtrag-v3-33` am Dokumentende. Das AD bleibt **v1.11** (es hatte nie Banner-Text).
- **GitHub:** **#365–#373 und #376** (`not planned`) geschlossen, je mit Begründung.
  **#374/#375 bleiben offen** — nicht banner-gebunden (Aktionen-Overlay, Bibliothek-Reduktion);
  ihre Begründung setzt aber die verworfene Trennung voraus und muss neu geschrieben werden.
- **Grundlage:** [`ui-2-0-welle-2-vorschlag.md`](ui-2-0-welle-2-vorschlag.md) (Ist-Stand,
  Widersprüche, Varianten).

---

## 3. #446 – der Messweg (geschlossen)

Der rote 4g3-Lauf vom 26.10. ist durch die **Frist** erklärt, nicht durch einen Produktfehler:

- `bearbeiteAktion` schreibt **entprellt nach 4 s** (`auto-speichern.ts:29`), 4g3 wartete **8 s**.
- **Probe:** Main nach dem Blur per `SIGSTOP` angehalten → `gefunden=false`; der Titel stand
  **251 ms nach der Frist** im `project.json`, Formularmeldung `null`, Bibliothekszeile neu.
- **Fix:** 4g3 **und** 4q warten **20 s**, die Dauer bis zum Fund steht im Protokoll.
- **Gegenprobe:** dieselbe Probe → grün nach **8045 ms**.

**Nicht nachgestellt:** der 26.10.-Lauf selbst. Der Kommentar an #446 sagt das wörtlich.

---

## 4. #392 – Mehrfachauswahl (geschlossen)

**Gebaut:** Shift = Bereich, Cmd/Strg = umschalten; sichtbar in **Liste und Zeitleiste**;
Gruppen-Entfernen ist **EIN Undo-Schritt**.

**Der Treiber fand einen echten Fehler:** Die erste Fassung schrieb die gefilterte Liste über
`setzeListe` — das ist der **Sicht-Schreiber** (`projektzustand.ts:178`) und schreibt
`project.json` **nicht**. Die Gruppe verschwand aus der UI, die Datei blieb bei 2. Erst die neue
Store-Operation macht daraus einen Schritt:

- NEU `src/main/project-store/entferne-elemente.ts` — ein Lock, ein Speichervorgang,
  **alles oder nichts** (eine unbekannte ID → nichts wird entfernt).
- Kanal **`project:entferneElemente`** in `kanaele.ts`, angemeldet im
  `project-store-nachtrag.ts` (weil #76 seiner Datei keinen fünfzehnten Kanal erlaubt).
- NEU `src/renderer/composer/mehrfachauswahl.ts` — reine Auswahl-Logik; `liste-ansicht.tsx`,
  `zeitleiste.tsx`, `index.tsx` tragen die Einbettung; `element-entfernen.ts` den Kanal-Weg.

**Treiber `4g5`:** Leiste „2 ausgewählt", beide Blöcke `data-ausgewaehlt=ja`, Liste **2 → 0**,
**ein** Cmd+Z → **2**. **9 Gegenproben**, jede rot und byte-identisch zurückgenommen.

**Nicht gebaut (entschieden):** Gruppen-**Verschieben** — es gibt keine Zielregel und keine
Operation; Folge-Issue.

---

## 5. #457 – Abspielmarke in der Zeitleiste (geschlossen)

- **NEU `src/renderer/gemeinsam/abspielposition.ts`** — der EINE Abspielstand (Frame + läuft).
  Die Vorschau veröffentlicht ihn (`vorschau.tsx`), **nur die Marke** abonniert ihn.
- **NEU `src/renderer/composer/abspiel-marke.tsx`** — Position `frame / fps * pxProSekunde`,
  Mitscrollen **nur bei laufender Uhr** und nur, wenn die Marke aus dem Bild läuft (zentriert).
- **Treiber `4f7`:** Start 0/0 px → nach 1,5 s 44/12 px, Pause 50 → 50 (still).
- **3 Gegenproben** (Position, Pause-Scroll, Zentrierung), alle rot und byte-identisch.
- **Ehrlich offen:** Die Veröffentlichung aus `vorschau.tsx` ist nur am Fenster belegt
  (`4f7`); eine Gegenprobe mit entferntem Effekt wurde nicht gefahren.

---

## 6. Der Integrationstest-Befund (`standbild-echt`)

Der Test hängte die Suite **912 s** und meldete dann ein 60-s-Timeout. Ursache war der Helfer,
nicht das Produkt:

- Die Gegenprobe (ohne `-frames:v`) läuft endlos und schreibt mit `-progress pipe:1` auf stdout.
- `spawnSync` leert die Pipe nicht; nach dem SIGTERM-Kill blockierte ffmpeg, der Orphan lief
  weiter und hielt die Suite offen.
- **Fix (`70c66fa`):** `spawn` mit Drain, SIGTERM nach der Frist, **SIGKILL nach 2 s**, plus
  `pkill`-Aufräumen in `afterAll`. Ergebnis: **15,8 s, Exit 0** statt 912 s.

Ein erster Async-Umbau half nicht und wurde **zurückgenommen** — erst das SIGKILL-Netz war die
Lösung.

---

## 7. Fallen für die nächste Sitzung

1. **`setzeListe` schreibt nur die Sicht.** Wer damit eine echte Store-Änderung vorhat, baut
   eine UI, die lügt (am Treiber gemessen, #392). Für Listen-Änderungen gehört ein Kanal dazu.
2. **Ein Messschritt darf nur undo-en, was er selbst geändert hat.** 4f4 drückte den Pfeil
   trotz unveränderter Dauer und nahm den vorherigen Schritt zurück (Liste 2 → 1); 4f6 erbte
   den Schaden. Die Sperre steht jetzt im Schritt.
3. **`spawnSync` + `-progress pipe:1` + endloser Lauf = Deadlock.** Async `spawn`, stdout
   leeren, SIGKILL-Netz.
4. **Treiber-Schritt-Nummern:** `4g5` (Mehrfachauswahl), `4f7` (Playhead). Die
   **Treiber-Matrix** (`tests/unit/treiber-matrix.spec.ts`) prüft die Zuordnung; nicht
   umnummerieren.
5. **Die 4f4-Dauer-Drag-Messung ist fragil:** Der synthetische Zug ändert die Dauer aktuell
   **nicht** (Untersuchung im Treiber). Wer sie repariert, misst die Regler-Geometrie neu.
6. **Zwei Gate-Läufe waren rot**, ohne Codeänderung: einmal „detached Frame" in Schritt 4n,
   einmal stiller Exit 1. Die Klasse ist bekannt (CDP-Abriss); der nächste Lauf war grün.

---

## 8. Offene Punkte ohne Bau

- **#383/#388/#393/#394** — Code vorhanden und montiert, **DoD ungeprüft** (aus dem
  UI-2.0-Abgleich, `ui-2-0-welle-2-vorschlag.md`, Abschnitt 4). `fehler-markierung.tsx` hat
  **keinen Importeur**; #388 läuft über `baueListenZeilen`.
- **#374/#375** — nicht banner-gebunden; Ziel überlebt, Begründung neu schreiben.
- **Lösch-Sperrgründe** erscheinen mitten in der Marken-Kopfzeile (älter als #456).
- **Beenden-Frist 15 s** ist weiter unbestätigt.
- **#456-Signaturblock** nennt `projektId`, gebaut ist zusätzlich `aktionen`.
- **71 Dependabot-Lücken** (33 high) — nicht angefasst.
- **Layout-Frage Welle 1:** Plan sagt „Video mittig", gebaut ist „Bühne oben".

---

## 9. Nächster Schritt

**Buchhaltung #383/#388/#393/#394.** Je Issue die DoD gegen den Code prüfen und mit Beleg
schließen — oder nachbessern. Danach die **Lösch-Sperrgründe** aus der Marken-Kopfzeile lösen.
Kein neuer Vertrag nötig. Erst danach #374/#375 neu schneiden.
