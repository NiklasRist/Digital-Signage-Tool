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

**GESCHNITTEN am 13.11.2026: [#475](https://github.com/NiklasRist/Digital-Signage-Tool/issues/475)**
(`[doku] TK 9.21.5/9.21.9: das Freistell-Modell ist gewählt …`, Labels `documentation`,
`ebene:main`, `ebene:renderer`, `modul:template-canvas`, `risiko:sicherheit`). Dort sind auch die
drei Änderungen im Wortlaut hinterlegt (Modell mit Zahlen, drei feste Namen, CSP-Regel).

**Empfehlung:** zuerst, weil es billig ist und sonst der nächste Agent wieder gegen einen
veralteten Satz prüft (dieselbe Fehlerklasse wie die „Bezug: AD v1.13"-Zeile).

## 2. #472 — FA-30 Produktseite finden (der nächste Bau)

**ENTSCHIEDEN am 13.11.2026 (Niklas, auf die Frage nach den zwei Lücken):**

1. **Form von `ProduktQuellen`: Muster je Shop.** Nicht `shops: string[]`, sondern ein Eintrag
   je Shop mit **Suchmuster** und `{q}`-Platzhalter. Der Suchpfad steht damit sichtbar in der
   Konfiguration, statt geraten zu werden.
2. **Notweg: konfigurierbare Suchadresse.** Kein Anbieter im Code. Der Notweg ist selbst ein
   Muster mit `{q}`; ohne Eintrag gibt es keinen Notweg. Kein Schlüssel, kein Konto, FA-30
   bleibt erfüllt, ohne einen Fremdanbieter festzuschreiben.

**Vorgeschlagene Typen (noch NICHT im Issue — GitHub-Schreiben braucht Freigabe):**

```ts
export interface ProduktQuelleShop {
  /** Host des Shops - nur Anzeige und Prüfwert, kein Pfadanteil. */
  host: string
  /** Suchadresse des Shops; `{q}` wird durch das kodierte Stichwort ersetzt. */
  suchMuster: string
}

export interface ProduktQuellen {
  /** Shops in Prioritätsreihenfolge; höchstens drei werden befragt (9.20.4). */
  shops: ProduktQuelleShop[]
  /** Notweg: Suchadresse einer allgemeinen Websuche, `{q}` = Stichwort. `null` = kein Notweg. */
  webSuche: string | null
}
```

Vorgabe ohne Feld: `{ shops: [], webSuche: null }` — keine Config-Migration.

**Regeln, die dazu gehören:** `suchMuster` und `webSuche` müssen **absolute http(s)-Adressen**
sein und **genau ein** `{q}` enthalten; sonst fällt der Eintrag beim Lesen weg (dieselbe Haltung
wie `normalisiereProduktUrl`). `{q}` wird mit `encodeURIComponent` eingesetzt. Es gelten
unverändert alle Netzgrenzen aus 9.19.4 (aufgelöste Adresse, keine lokalen Netze, 3
Weiterleitungen, 20 s Budget).

**Folge für den Vertrag:** TK **9.20.3** sagt heute `shops: string[]` und `webSuche: boolean` —
das ist mit dieser Entscheidung überholt. Der Nachtrag gehört in **denselben Doku-Schritt** wie
die 9.21-Korrekturen (Issue **#475**, dort zu ergänzen) **oder** in ein eigenes `[doku]`-Issue.
Erst danach ist die Signatur von #472 dran (sie ist „verbindlich" und wird im Issue geändert,
nicht in der Datei).

**Erst danach** der Bau.

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
