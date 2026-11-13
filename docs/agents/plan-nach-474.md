# Plan nach FA-29 (13.11.2026, nach #474)

**Stand:** FA-29 ist gebaut, gemessen und committet. Was jetzt kommt, ist **keine** Fortsetzung
derselben Kette — es sind drei unabhängige Stränge, und zwei davon brauchen eine Entscheidung,
bevor jemand bauen kann. Reihenfolge unten ist die Empfehlung, nicht die Ausführung.

---

## 1. Doku-Nachtrag: TK v3.66 (klein, blockiert nichts)

**Warum überhaupt:** Der Bau hat drei Dinge entschieden, die im Vertrag noch anders stehen. Sie
sind in #474 **gemeldet** und im Code begründet, aber das TK sagt weiter das Gegenteil:

| Stelle | steht heute | gilt seit #474 |
|---|---|---|
| **9.21.9** | „Das Modell ist noch nicht gewählt. Der Zaun steht, die Datei nicht." | `u2netp`, 4 574 861 B, SHA-256 `309c8469…`, Apache 2.0 |
| **9.21.5** | `modell://freistellen.onnx` — **ein** Ziel | **drei** feste Namen: Modell, WASM-Runtime, Lader |
| **CSP** (9.14 / #3) | `script-src 'self'` | `'self' modell: 'wasm-unsafe-eval'` — ohne das startet kein WASM |

**Aufwand:** eine Textänderung im TK, `.docx` neu erzeugen, `npm run pruefung` nicht nötig
(kein Code). **Braucht:** ein eigenes `[doku]`-Issue, weil #474 eine AD/TK-Änderung ausdrücklich
ausschließt. **AD bleibt unverändert** — FA-29 sagt dort schon dasselbe.

**Empfehlung:** zuerst, weil es billig ist und sonst der nächste Agent wieder gegen einen
veralteten Satz prüft (dieselbe Fehlerklasse wie die „Bezug: AD v1.13"-Zeile).

## 2. #472 — FA-30 Produktseite finden (der nächste Bau)

**Warum es nicht sofort losgeht:** Das Issue nennt **zwei Lücken** selbst:

1. `shops: string[]` drückt **keinen Suchpfad** aus. Eine Shop-Suche braucht mehr als einen
   Namen: entweder eine URL-Vorlage (`https://shop/?s={stichwort}`) oder eine eigene
   Suchadresse je Shop. Ohne diese Entscheidung ist der Vertrag nicht baubar.
2. **Der Notweg-Anbieter ist nicht festgelegt.** „Allgemeine Websuche ohne Schlüssel" heißt
   konkret: welche Seite, welches Format, welche Grenzen? Das ist eine Marktentscheidung
   (und eine Datenschutzfrage), keine Implementierungsfrage.

**Was vor dem Bau zu entscheiden ist:**

- Form von `ProduktQuellen` (URL-Vorlage mit Platzhalter vs. feste Suchadresse je Shop)
- Notweg: welcher Anbieter, darf er überhaupt angesprochen werden (NFA-06 gilt weiter —
  FA-30 ist die **eine** benannte Ausnahme, 9.19.4 setzt die Grenzen)
- Ob überhaupt ein Notweg gebaut wird oder die Shops reichen

**Erst danach** ein Bau-Issue mit Signatur.

## 3. #466 — Referenzlauf (die Messung, die L-01 trägt)

**Stand:** Material liegt (`docs/artikel/` mit acht Fotos und `preise.md`,
`docs/artikel/referenzangebote/` mit fünf Angeboten), Vorlage gewählt (PresentationGO
„Fitness Studio"), Plan und Protokollgerüst stehen. **Nächster Schritt dort: Phase 1 mit der
Stoppuhr** — die drei Aufgaben (fünf Angebote, Preisänderung, sechstes Angebot) beidseitig.

**Warum es nicht „einfach gemessen" wird:** Es braucht Niklas' Zeit (Stoppuhr) und eine
Bewertung (14 Heuristik-Bogen). Das ist kein Agenten-Schritt.

## 4. Offene Messungen aus #474 (nachziehbar, kein Issue nötig)

- **Renderweg** (70 s je Segment): derselbe Zeichenweg, aber nicht am Fenster gemessen.
- **Schwächere Hardware**: 2,0–2,1 s bei 1920 × 1080 auf dem i9; der Zaun hat Luft bis 5 s.
- **Am Fernseher**: ein transparenter Rand und eine weiche Kante sehen auf 85 Zoll anders aus.
- **Ausfall am Fenster**: das Modell liegt im Paket; der Ausfall ist nur durch Tests belegt
  (dieselbe Aufteilung wie bei #470 für den Erfolgsweg).

---

## Reihenfolge (Empfehlung)

1. **Doku-Nachtrag TK v3.66** — klein, räumt einen falschen Satz weg.
2. **Entscheidungen zu #472** (Niklas) → dann Bau-Issue → dann Bau.
3. **#466 Phase 1** — sobald Niklas die Stoppuhr ansetzen will.
4. Nebenbei: die vier offenen Messungen aus #474, wenn ein Lauf ohnehin ansteht.
