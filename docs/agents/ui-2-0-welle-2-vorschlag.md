# UI 2.0 – Ist-Stand gegen den Code und Vorschlag für Welle 2

**Angelegt:** 30.10.2026. **Prüfstand:** `main` = `16e9b57` (Arbeitsbaum sauber,
`main == origin/main`). **Grundlage:** [`oberflaeche-2-0-plan.md`](oberflaeche-2-0-plan.md)
vom 14.10.2026, Prüfstand dort `bb2c22c`.

**Zweck:** Der Plan ist sechs Wochen alt und beschreibt einen Ist-Zustand, den es nicht mehr
gibt. Dieses Dokument prüft seine vier Welle-1-Punkte gegen den heutigen Code, benennt die
Abweichungen und schlägt **Welle 2** vor. **Es ist gebaut: nichts.**

> **Entschieden am 30.10.2026 (Niklas):** Im Band läuft eine **Aktion**, kein eigenes
> Banner-Objekt. Die Banner-Spur ist damit **verworfen** — #365–#373 und #376 sind
> `not planned` geschlossen. Der gebaute Stand bleibt die einzige Quelle:
> `einblendung.abschnitte` trägt `aktionRef` (M9, Treiber `4f6`, `6295605`).
> **#374 und #375 bleiben offen** — sie sind nicht banner-gebunden (Aktionen-Overlay,
> Bibliothek-Reduktion) und brauchen eine eigene Entscheidung.
> **Welle 2 = Variante A** (Abschnitt 5); **#392** ist nach #446 das nächste Bau-Issue.

---

## 1. Welle 1 (Kernachse #411–#421): gebaut, mit einer benannten Abweichung

| Punkt | Plan (14.10.) | Code heute | Beleg |
|---|---|---|---|
| **#411** `position`-Vertrag | „optionaler Parameter auf `project:fügeElementHinzu`" | gebaut: `position?: number`, Klemmung `0..liste.length`, `splice(position, 0, element)` | `src/main/project-store/fuege-element-hinzu.ts:22`, `:128-139` |
| **#412** Spalten-Drop | „jede Lücke ist ein `useDroppable`-Ziel" | gebaut: eine Kante je Grenze (`kante-<n>`), sichtbar nur beim Neu-Drag, Messung in `spalt-drop.ts` / `verwende-zeitleisten-zug.ts` | `src/renderer/composer/zeitleiste.tsx:228` |
| **#413** Drag-Quellen | „Bibliothek/Galerie-Karten tragen `referenz`" | gebaut: `useDraggable` in der Bibliotheksansicht | `src/renderer/composer/bibliothek-ansicht.tsx:160` |
| **#414** Vorschau-Zentrum | „Bibliothek links, Video **mittig**, Zeitleiste unten" | gebaut als **Bühne oben (38 %, min. 160 px) über der vollen Breite**, Composer darunter: Bibliothek links (300 px), Galerie/Liste Mitte, Zeitleiste unten | `src/renderer/app-shell/inhalte.tsx:220`, `:308-320`; `src/renderer/composer/bibliothek-dock.tsx:35`; `src/renderer/composer/index.tsx:946` |

**Die Abweichung, offen benannt:** Der Plan sagt „Video im Zentrum". Gebaut ist „Video oben,
volle Breite". Der Code führt das selbst als gemeldete Ausnahme (`inhalte.tsx:307-309`):
die Bühne steht **über** dem Composer, nicht **zwischen** Bibliothek und Zeitleiste. Wer den
Plan wörtlich nimmt, findet das falsch; wer den Code nimmt, findet es entschieden. **Ich habe
keine Entscheidung gefunden, die das festhält** – sie steht nur im Dateikommentar.

**Abnahme:** Die Treiber-Matrix führt FA-05 (Reihenfolge per Drag-and-drop) als **gemessen**
(`4f`: Kanten-Drop, Position 2 trägt `art: "segment"`, ein Cmd+Z), FA-13 mit `4f6` seit
30.10.2026 (`docs/agents/treiber-matrix.md:49`, `:57`).

---

## 2. Welle 3 (Optik): zwei von drei Punkten sind schon gebaut

| Punkt | Stand |
|---|---|
| Zoom der Zeitleiste | **gebaut** (#428): `zeitleiste.tsx:138-151`, `ZOOM_STUFEN` in `zeitband.ts` |
| Thumbnails in den Blöcken | **gebaut** (#433): `VideoFilmstreifen` im Video-Block, `zeitleiste.tsx:359` |
| Playhead mit Wiedergabe-Mitscroll | **fehlt**: kein Treffer für `playhead`/`Abspielposition` in `composer/` und `preview-player/` |

Welle 3 ist damit kein eigener Schnitt mehr, sondern **ein Punkt**: der Playhead.

---

## 3. Welle 2, wie der Plan sie nennt: Banner-Spur – **verworfen**

Der Plan definiert Welle 2 als Banner-Spur auf der **BA-Familie #365+** (`BannerSchild`,
`Projekt.bannerSchilder`, Abschnitte auf `schildRef`). Drei Belege, warum sie nicht gebaut wurde:

1. **Das AD kennt das Wort „Banner" nicht.** `grep -n "Banner" docs/Anforderungsdokument_…md`
   → **0 Treffer** (Stand AD v1.11).
2. **Das TK nennt sie nur als Abgrenzung** und sagt selbst, dass die Plan-Quelle fehlt:
   „ihre Plan-Quelle `trennung-banner-aktionen-plan.md` **fehlt im Repo**"
   (`docs/Technisches_Konzept_…md:1476-1478`, Stand TK v3.32).
3. **Die Issues zitieren einen überholten Stand:** #365 nennt „AD v1.8, TK v3.22" – vier AD-
   und zehn TK-Versionen hinter heute. Und #365 würde `einblendung.abschnitte` von
   `aktionRef` auf `schildRef` **umstellen**. Genau diesen Vertrag hat M9/#453 am 30.10. auf
   `aktionRef` gebaut und mit `4f6` am Fenster belegt (`6295605`).

**Der harte Konflikt:** Seit M9 gibt es **ein** Band mit Abschnitten auf Aktionen
(`Band (1920 × 162)`). Die Banner-Linie würde ein **zweites** Modell daneben stellen
(`BannerSchild` + `schildRef`). Ohne Entscheidung, ob die Banner-Spur das Band **ersetzt**
oder **ergänzt**, erzeugt ihr Bau zwei konkurrierende Konzepte – dieselbe Fehlerklasse, gegen
die der Plan selbst die Regel setzt: *„Erst Entscheidung, dann AD/TK-Nachtrag, dann Issue mit
Signaturblock und Dateiliste."*

**Was das für #365–#376 heißt:** alle zwölf hängen an dieser einen Entscheidung. Sie sind
nicht „bald baubar", sie sind **unentschieden**.

**Die Entscheidung ist gefallen (30.10.2026, Niklas): „Es ist eine Aktion, kein Banner."**
Im Band steht dieselbe Aktion, die im Reiter Aktionen gepflegt wird. Damit ist die Banner-Spur
kein späterer Schnitt mehr, sondern **verworfen**. #365–#373 und #376 sind `not planned`
geschlossen. #374 (Aktionen-Overlay) und #375 (Bibliothek-Reduktion) bleiben offen: ihr Ziel
überlebt die Banner-Frage, ihre Begründung muss aber neu geschrieben werden.

**Was in der Doku noch fehlt:** Das TK trägt in Zeile 1476-1478 weiterhin den Satz, die
Banner-Spur sei „davon zu trennen" und ihre Plan-Quelle fehle. Nach der Entscheidung ist das
keine offene Frage mehr, sondern ein **überholter Stand**. Ein TK-Nachtrag (v3.33) sollte
festhalten: *Die Banner-Spur entfällt; Band-Abschnitte bleiben Aktionen (`aktionRef`).*
**Ich habe ihn nicht geschrieben** — AD/TK-Änderungen bekommen eine eigene Version und
gehören abgenommen.

---

## 4. Was sonst offen ist (gemessen, nicht vermutet)

| Issue | Stand im Code | Beleg |
|---|---|---|
| **#392** Mehrfachauswahl | **nicht gebaut** – kein `shiftKey`/`ctrlKey`/`metaKey` in `src/renderer/composer`, `mehrfachauswahl.tsx` existiert nicht | `grep` leer |
| **#388** Fehler-Kennzeichnung | **gebaut** über `baueListenZeilen` (`kaputt`-Flag, rote Zeile), **nicht** über `fehler-markierung.tsx` – die Datei hat **keinen Importeur** (tote Datei) | `liste-ansicht.ts:71ff`, `liste-ansicht.tsx:146-201` |
| **#383** Live-Vorschau | **montiert** (Bühne im Reiter Zusammenstellen) | `inhalte.tsx:316` |
| **#393** Vorlagen-Vorschau | **montiert** | `vorlagen-editor/index.tsx:57` |
| **#394** Statistik | **montiert** als Region über der Zeitleiste | `composer/index.tsx:780` |
| **#446** FA-03 | offen, braucht Fenster-Reproduktion (aus der Übergabe) | – |
| #376 | Banner-Fluss – mit der Banner-Entscheidung **entfallen** | Issue-Rumpf |
| #374 / #375 | **nicht** banner-gebunden: Aktionen-Overlay und Bibliothek-Reduktion; ihre Begründung setzt aber die verworfene Trennung voraus | Issue-Rümpfe |

**Wichtig:** `docs/ui-wellen.md` behauptet für #383/#388/#392/#393/#394 „FERTIG". Das ist
Stand 28.09. und für **#392 nachweislich falsch**. Die Datei ist als Quelle unbrauchbar
geworden; ich habe sie nicht angefasst.

---

## 5. Welle 2: drei Varianten, eine ist beschlossen

### Variante A – **Bedienfluss** (BESCHLOSSEN 30.10.2026)

Kein neuer Vertrag, alles auf gebautem Fundament, jeder Punkt einzeln abnehmbar:

1. **#446** Fenster-Reproduktion (FA-03). Der einzige offene Punkt, der ein echtes Fenster
   braucht – und der einzige, der einen **Produktfehler** verdeckt.
2. **#392** Mehrfachauswahl. Echte Lücke, keine Vertragsänderung, Welle-1-Fortsetzung.
3. **Playhead** in der Zeitleiste (Welle-3-Rest). Klein, sichtbar, keine Vertragsänderung.
4. **Buchhaltung:** #383/#388/#393/#394 gegen ihre DoD prüfen und mit Beleg schließen oder
   nachbessern; `fehler-markierung.tsx` **löschen oder anbinden** (tote Datei, #388 läuft an
   ihr vorbei).
5. **Lösch-Sperrgründe** aus der Marken-Kopfzeile lösen (offener UI-Punkt aus der Übergabe).

**Kosten:** klein bis mittel, fünf überschaubare Pakete. **Risiko:** niedrig. **Nutzen:**
schließt die einzige echte Funktionslücke (#392), räumt vier Issue-Leichen und den einzigen
bekannten Produktfehler ab.

### Variante B – **Banner-Linie zuerst** (VERWORFEN 30.10.2026)

Wäre: AD/TK-Kapitel für die Banner-Spur schreiben, die Frage **Band vs. BannerSchild**
entscheiden, dann #365–#373 schneiden. **Mit der Entscheidung „es ist eine Aktion, kein
Banner" entfällt sie.** Der Grund ist in Abschnitt 3 belegt: Der Vertrag, den sie geändert
hätte (`abschnitte.aktionRef`), ist seit M9 gebaut und mit `4f6` am Fenster belegt.

### Variante C – **Optik-Welle**

Playhead + Zoom-Feinschliff + Lücken im Filmstreifen. Klein und risikolos, aber der
Produktwert ist gering: Die Optik ist zu zwei Dritteln schon gebaut (Abschnitt 2).

---

## 6. Beschlossen

**Variante A, in dieser Reihenfolge:** #446 → #392 → Playhead → Buchhaltung → Kopfzeile.

Die Reihenfolge hat einen Grund: #446 ist der einzige Punkt, der einen **Fehler** verdeckt;
#392 die einzige **fehlende Funktion**; alles andere ist Aufräumen. Wer mit dem Aufräumen
anfängt, hat am Ende derselben Zeit keinen Fehler weniger.

---

## 7. Entschieden – und was noch offen ist

**Entschieden (30.10.2026):**

1. **Banner:** Im Band läuft eine Aktion. Die Banner-Spur ist verworfen; #365–#373 und #376
   sind geschlossen (`not planned`).
2. **Welle 2 = Variante A** („vermutlich" → als Ja genommen, Niklas kann widersprechen).
3. **#392 ist nach #446 das nächste Bau-Issue.**

**Offen:**

- **#374/#375 neu schneiden?** Beide sind nicht banner-gebunden, ihre Begründung nennt aber
  die verworfene Trennung (Badges, „neue Trennung"). Ihre Ziele überleben nur als reine
  UI-Issues: Aktionen-Overlay, Bibliothek auf Vollbild-Aktionen reduzieren.
- **Layout-Frage aus Welle 1:** Der Plan sagt „Video mittig", gebaut ist „Bühne oben". Das
  steht nur in einem Dateikommentar, nicht in einer Entscheidung.
- **TK-Nachtrag v3.33** zur Banner-Spur (Abschnitt 3, letzter Absatz).

---

## 8. Was ich **nicht** geprüft habe

- Die **DoD** von #383/#388/#393/#394. Ich habe nur die Montage im Code gesehen, nicht die
  Abnahme. Ein Schließen dieser Issues braucht einen eigenen Beleg je Issue.
- Ob die Treiber-Schritte der Welle 1 heute noch **grün** laufen – ich habe die Matrix
  gelesen, nicht `npm run durchlauf` gefahren.
- Den Inhalt von #374/#375 über die ersten Zeilen hinaus.
- Ob `fehler-markierung.tsx` bewusst als Vorbau steht (dann gehört ein Kommentar dazu) oder
  vergessen wurde.
