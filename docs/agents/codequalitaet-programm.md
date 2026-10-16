# Programm: Codequalität

**Status:** Entwurf zur Abnahme. **Erstellt:** 16.10.2026.
**Anlass:** Befund „die Codebasis ist gut gebaut, aber schlecht erzählt" (Messung 16.10.2026).
**Oberste Regel (Lehre aus #432):** Kein Umbau ohne Plan – je Strang Ursache, Zweck,
Naht-Entscheidung und Beleg. Verhaltensneutral, ein Schritt = ein Commit, Beleg über
Suite/Treiber. Was ein Issue dem Code widerspricht: der Code gewinnt, der Widerspruch wird
gemeldet.

## Ausgangslage (gemessen 16.10.2026)

| Maß | Wert |
|---|---|
| Quelldateien `src` | 377 (Schnitt 196 Zeilen) |
| Dateien > 600 Zeilen | **12** |
| Kommentarzeilen in `src` | **47 %** |
| Dateien mit Gerüst-Kopf (`GERUEST-PRUEFSUMME`) | **241** |
| `any` / `@ts-ignore` / TODO-FIXME | **0 / 0 / 0** |
| Unit-Specs (`tests/unit`) | **318** (davon **197** mit `vi.mock`) |
| Integrationstests (`tests/integration`) | **12** |
| Treiber (echtes Fenster) | **`npm run durchlauf`** (1 Skript + 2 Sonden) |
| `npm test` läuft | **nur `tests/unit`** – Integration und Treiber sind NICHT im Gate |

## Arbeitsregeln (für alle Stränge)

- **Verhaltensneutral:** Testids/DOM zeichengleich; kein Optik-/Performance-/Bugfix-Umbau
  (Fixes gehören in ein eigenes Issue).
- **Ein Schritt = ein Commit**, je Schritt: `typecheck` 0, `lint` 0, Suite grün,
  Treiber-Abschnitte unverändert. Toter Code wird **zuerst inventarisiert, nicht gelöscht**
  (kann nach dem Umbau noch gebraucht werden).
- **Quelle vor Kürze:** Bevor eine Begründung reduziert wird, wird ihre Herkunft
  (Issue/TK) gesichert.

## Q2 – Gott-Dateien (zuerst)

**Befund.** 12 Dateien über 600 Zeilen; die größten:
`composer/index.tsx` 1113, `ffmpeg-adapter/uniformitaet.ts` 1012,
`vorlagen-store/schreibe-vorlagen.ts` 968, `render-service/normalisieren.ts` 939,
`renderer/vorlagen-editor/index.tsx` 849, `main/index.ts` 786,
`project-store/assets.ts` 683, `marken-store/schreibe-marken.ts` 623,
`auftrags-manager/schreibe-queue-json.ts` 621, `render-service/validierung.ts` 619,
`render-service/arbeitsbereich.ts` 617, `renderer/action-editor/index.tsx` 616.

**Vorgehen.** Je Datei die **Naht-Methode** des Composer-Plans:
1. Ursache messen (nicht „ist lang").
2. Zweck benennen (was wird dadurch möglich).
3. Naht-Entscheidung: was bleibt (Zustand/Ownership), was wandert – mit Begründung.
4. Schritte S0…Sn, jeder einzeln grün + Treiber-Beleg.

**Stand.** `composer/index.tsx`: **S1–S3 gebaut** (`docs/agents/composer-umbau-plan.md`);
**S4/S5 erst nach #428** (sonst Konflikt an der Zeitleisten-/DnD-Stelle).
**Offen:** die nächste Zieldatei (Vorschlag weiter unten).

## Q1 – Kommentare + Regelwerk (danach)

**Befund.** 47 % Kommentarzeilen, 241 Gerüst-Köpfe, wiederholte Begründungen
(`meldeAn` 6×, `#342` mehrfach nacherzählt).

**Regeln (abgenommen 16.10.2026):**
1. Kommentar erklärt **WARUM**, nie WAS.
2. Jede Begründung **nennt ihre Quelle** (Issue-Nr / TK) und bleibt **ein Satz**.
3. **Kein Gerüst-Kopf in fertigen Dateien.**
4. **Kopf max 3 Zeilen Zweck**; Doku nur, wo die Signatur nicht selbsterklärend ist.
5. **Keine Wiederholung** derselben Begründung – eine Adresse.
6. **Verboten:** auskommentierter Code, „später"-Notizen, Anekdoten.
7. Durchsetzung: Lint-Regel, wo mechanisch möglich (z. B. max Kopfzeilen), sonst Review.

**Risiko (offen):** Die Kommentare tragen oft echte Begründung – **Quelle zuerst sichern,
dann kürzen** (nie stillschweigend entfernen).

## Q3 – Prozess-Fragmentierung

**Befund.** `ipc-gateway/project-store-nachtrag.ts` / `-2` / `-3` / `-4` + `vorlagen-nachtrag.ts`
(eine Registry künstlich zerteilt, weil „die Stammdatei ihre Eintragszahl nicht überschreiten
darf"); `meldeAn` **6×** definiert; Platzhalter-Barrels (`shared/contracts/index.ts`,
`main/ipc-gateway/index.ts`) und `renderer/shell/` (eine Datei).

**Vorgehen.** Konsolidieren (eine Registry, ein `meldeAn` – deckt #337 ab); Barrels/`shell/`
bereinigen. Kleinster Strang.

## Q4 – Tests gegen die Anforderungen

**Befund.** `npm test` prüft **nur** 318 Unit-Dateien (62 % mit `vi.mock`) – **nicht** die
Anforderungsnähe. Die 12 Integrationstests und der Treiber (echtes Fenster) laufen **außerhalb
des Gates**. Der Nutzer hat recht: viele Tests ≠ gute/sinnvolle/anforderungsgerechte Tests.

**Vorgehen.**
1. **Audit:** Jeden Test klassifizieren – *was pinnt er? welches AD/TK?* Fälle aussortieren,
   die den **Mock** testen, nichts Relevantes behaupten oder Redundanz sind.
2. **Gate umstellen:** **Integration + Treiber ins Gate** – aber erst, wenn sie stark genug
   sind (Vorgabe des Users: „die sind bisher eventuell nicht gut genug").
3. **Investition verschieben:** vom Mock-Unit zum **echten Fenster** (Treiber-Szenarien, die
   die Anforderungen messen), wie vom Nutzer gefordert.

## Reihenfolge (abgenommen)

**Q2 (Gott-Dateien) → Q1 (Kommentare) → Q3 (Fragmentierung) → Q4 (Tests).**

## Nicht-Ziele

- keine Verhaltens-/Optik-/Performance-Änderung,
- keine Bugfixes unter dem Deckmantel „Umbau",
- kein Umbau „weil es groß aussieht" (der #432-Fehler).
