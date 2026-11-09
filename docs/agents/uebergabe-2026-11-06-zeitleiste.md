# Übergabe 06.11.2026 — die Zeitleiste zeigt Aktionen als Motive (dreiundfünfzigste Sitzung)

**Auftrag (Niklas, 06.11.2026):** *„im projekteditor die aktionen in der frameleiste sein"* und
*„beim drag and drop muss die zeileiste automatisch scrollable sein"*. Nach der Rückfrage, was mit
„Frameleiste" gemeint ist: *„die aktionen sind schon in der leiste ... nur als lila boxen"*.

Damit war die Aufgabe klar: Die Aktionen **sind** in der Zeitleiste — aber als farbige Boxen. Sie
sollen dort ihr **Motiv** zeigen. Dazu der Auto-Scroll beim Ziehen.

## 1. Das Motiv in den Aktions-Boxen

- **Eigene Aktions-Blöcke** (`art: 'segment'`, bisher petrol) und **Unterbrechungen** im Video-Block
  (bisher lila) tragen jetzt das **gezeichnete Motiv** der Aktion.
- **Dieselbe Quelle wie die Bibliothek:** `gemeinsam/aktions-motiv.ts` (`holeMotiv`). Kein zweiter
  Zeichenweg, keine eigene Malroutine. Das gemerkte Canvas wird in ein **lokales** Canvas kopiert,
  bevor es in den Block gehängt wird: Dieselbe Aktion kann in mehreren Blöcken stehen, ein Canvas
  kann aber nur an **einer** Stelle im DOM hängen.
- **`object-fit: cover`:** Ein 16:9-Motiv in einer 80 × 64 breiten Box wird beschnitten, nicht
  gequetscht. Ein dunkler Verlauf sichert Titel und Dauer die Lesbarkeit; die Farbe des Blocks
  bleibt als Rahmen/Fallback (petrol für Segment, violett für Unterbrechung).
- **Kein erfundenes Bild:** Fehlt die Vorlage oder die Marke, bleibt die Farbfläche — dieselbe
  Haltung wie in der Bibliothek. Die Bilder werden über `bereiteMotiveVor` vorbereitet; der
  Composer reicht `vorlagen` und `holeMarke` an die Zeitleiste.
- **Kein neues Datenfeld, kein Schreibweg.** Das Motiv ist reine Anzeige.

## 2. Auto-Scroll beim Ziehen

- **Die reine Regel** steht in `composer/zeit-autoscroll.ts` (`autoScrollSchritt`, ohne DOM):
  Der Zeiger nahe der **Kante der Zeitleiste** verschiebt den Inhalt, je näher am Rand, desto
  schneller (48 px Auslösebereich, höchstens 18 px je Bild). Der Zeiger wird auf den Kasten
  geklemmt: Wer über den Rand hinauszieht, scrollt weiter; über oder unter dem Band wird **nicht**
  gescrollt.
- **Der Lauf** hängt an `useDndMonitor` und `requestAnimationFrame` (~60 Bilder/s). Die
  Zeigerposition ist **Drag-Start (`activatorEvent`) plus `delta`** — kein zweites
  Maus-Listener-Paar neben dnd-kit.
- **Auch der eigene Unterbrechungs-Zug.** Die lila Aktions-Kästen im Video ziehen mit **eigenem
  Pointer-Handling** (kein dnd-kit, `stopPropagation`). Sie starten denselben Lauf im `ZeilenBlock`;
  der Zug hält den **Scroll-Stand beim Start** fest und rechnet den **Scroll-Weg** in den Versatz
  ein (`pointerDelta + scrollDelta`). Ohne diesen Anteil bliebe der Kasten an der alten Zeitstelle,
  während die Leiste unter ihm wegscrollt — er landete beim Loslassen an der falschen Zeit. Der
  Versatz steuert **Anzeige und Schreibwert**; beide sind derselbe Wert.
- **dnd-kit scrollt bereits — aber an der falschen Kante.** Am Fenster gemessen (dieselbe Geste,
  20:42-Projekt): ohne die eigene Regel **2112 px in 1,2 s**, mit ihr **rund 3400 px**. Der
  Unterschied ist der Auslöser: dnd-kit reagiert an der **Fensterkante**, die Regel an der **Kante
  der Zeitleiste** — und die liegt bei 1440 px rund 16 px davor, bei kleineren Fenstern deutlich
  weiter innen.
- **Ein Nebenbefund — entschieden (Niklas, 06.11.2026):** Ein Drag, der außerhalb der Zeitleiste
  losgelassen wird, landet am zuletzt nächstgelegenen Ziel (die Probe legte eine Unterbrechung an,
  obwohl sie auf der Quellzeile losließ). **Das bleibt so:** *„das sollst ganz normal einfügen weil
  die aktionen sind teil des videos"*. Eingefügt wird auf der Zeitleiste (auch zwischen zwei
  Blöcken), und auch daneben wird eingefügt — **kein Sonderfall, keine Änderung**. Die Probe hatte
  das Projekt danach auf den Stand mit **3** Unterbrechungen zurückgesetzt.

## 3. Belege

- **Unit:** `tests/unit/zeit-autoscroll.spec.ts` (7 Fälle, reine Regel) und
  `tests/unit/zeitleiste-motiv.spec.ts` (der Block hängt ein Canvas ein; `holeMotiv` wird mit
  Aktion/Vorlage/Marke gerufen). Zusammen **+8** Fälle: **5625/5625**.
- **Fenster (Auto-Scroll):** `scrollLeft` **0 → 140 → 3470** in 1,2 s Halten an der rechten Kante
  des 20:42-Projekts (Bibliotheks-Zug); mit entfernter Schreibzeile **2112 px** (dnd-kit allein),
  also ein nachweisbarer Unterschied. **Unterbrechungs-Zug:** **0 → 28 → 1008**; ohne das lokale
  Scrollen **0 px**. Das Projekt blieb nach der Probe bei **3** Unterbrechungen (Fenster mit
  gedrückter Maustaste geschlossen, kein `pointerup`).
- **Fenster (Motiv):** Der Sichtvergleich (`scripts/schau.mjs --start --gross`) zeigt die
  Aktions-Boxen mit Motiv statt lila Fläche; das Bild ist der Beleg, nicht die Behauptung.
- **Treiber:** `npm run durchlauf` **0 Befunde** (1 Untersuchung: Mehrfachauswahl; 1 MANUELL:
  Export-Dialog).
- **Gegenproben:** 4, jede rot und **byte-identisch** zurückgenommen (SHA-256 vorher = nachher):
  1. `autoScrollSchritt` immer 0 → 3 Tests rot.
  2. Motiv aus dem Segment-Block entfernt → `zeitleiste-motiv` rot.
  3. `scrollLeft`-Schreiben im dnd-kit-Lauf entfernt → Fensterprobe **ohne** eigenen Scroll
     (2112 px = dnd-kit).
  4. Lokales Scrollen im Unterbrechungs-Zug entfernt → Fensterprobe **0 px**.
- **Werkzeug:** `scripts/schau.mjs` hat `--panel video|aktionen|eigenschaften` bekommen (zeigt ein
  Sidepanel ohne den Aktions-Editor); die Sichtprüfung der Bibliothek war vorher nicht möglich.

## 4. Ehrlich offen

- **Das Motiv ist klein:** Bei 8 px/s ist eine 10-s-Unterbrechung 80 px breit; sichtbar ist der
  linke Teil des Motivs (Logo/Titel). Das ist der Preis dafür, dass die Box die **Dauer** trägt;
  ein eigener, breiterer Aktionsstreifen war nicht der Auftrag.
- **dnd-kit scrollt weiter mit:** Die eigene Regel ersetzt den AutoScroller nicht, sie ergänzt ihn.
  Am Fenster ist die Summe gemessen (rund 3400 px), nicht getrennt.
- **Der Drop außerhalb** (siehe 2.) ist **entschieden**, kein Mangel: Er fügt am nächsten Ziel ein,
  weil die Aktionen Teil des Videos sind.
- **Kein Treiber-Schritt** für Motiv/Auto-Scroll: Der Treiber misst die neuen Dinge nicht, die
  Belege sind Unit + zwei Fensterproben + Sichtvergleich.

## 5. Doku

- TK **v3.54** (9.7.8), `.docx` **2541 Absätze**, `unzip -t` heil, **0 Backticks**, mit `--dfd`
  erzeugt. AD unverändert v1.13 (keine Anforderungsänderung).

## Stand am Sitzungsende

**Gebaut:** Aktions-Motive in der Zeitleiste (eigener Block und Unterbrechung) und Auto-Scroll beim
Ziehen — Bibliothek (dnd-kit), sortierbare Blöcke (dnd-kit) und der **eigene Unterbrechungs-Zug**
(Pointer-Handling, Scroll-Weg im Versatz). **Gate:** Typecheck 0 (auch tests), ESLint/oxlint 0, Build
0, Unit **5625/5625** (368), Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung:
Mehrfachauswahl; 1 MANUELL: Export-Dialog). **Doku:** TK **v3.54** (9.7.8), `.docx` **2541 Absätze**,
0 Backticks, `unzip -t` heil; AD v1.13 unverändert.

**Nicht gepusht:** **6 Commits** vor `origin/main` **vor** diesem Übergabe-Commit (`d02e56b`,
`73691fe`, `4f53b24`, `07da2a6`, `0e94615`, `f70b6e0`); mit diesem Commit **7**. Die Zahl wächst mit
jedem Doku-Commit — mit `git log --oneline origin/main..HEAD` zählen. **Push nur auf Anweisung.**
