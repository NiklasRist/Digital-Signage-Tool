# Zitat-Abgleich ueber alle Issues

Geprueft: 8048 Zitate aus 328 Issues.

Zuordnung: A(TK/AD)=3816  B(Issue)=1059  C(rhetorisch/kurz)=3173


## Gruppe A - TK/AD zugeschrieben, NICHT in der aktuellen Quelle (699)

Davon **VERALTET** (stand in einer aelteren TK/AD-Fassung woertlich drin, heute nicht mehr): **42**

Die uebrigen 657 waren NIE woertlich - andere Fehlerklasse (Paraphrase als Zitat gesetzt).


### === A1: VERALTET durch Vertragsaenderung ===


### #8  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden daher als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor gezeichnet wird. Andernfalls rendert der Canvas still auf eine Fallback-Schrift → Vorschau ≠ Endvideo **und** Markenbruch.
steht in Issues: [110]
NAECHSTE: #### 9.10.4 Marken-Schriften werden mitgeliefert **Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden daher als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor gezeichnet wird.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden daher als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor gezeichnet wird. Andernfalls rendert der Canvas still auf eine Fallback-Schrift → Vorschau ≠ Endvideo **und** Markenbruch." (TK 9.10.

### #12  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-480cb3c,TK-f9cf686,TK-fd283f8
ZITAT   : **Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen (`{ referenzenIds: string[] }`, 9.4.9), `vorlage_referenziert` beide Trefferlisten (9.12.1). Ohne dieses Feld bliebe von der Zusage „der Code trägt echtes Verhalten" nur der Code selbst übrig, und der geführte Reparatur-Modus (FA-19) könnte den Nutzer nirgendwohin führen. Regeln: Das Feld ist **optional** – Codes ohne Zusatzdaten lassen es weg; seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1); es ist **kein Freitext-Anhang** und **kein Ersatz für `meldung`**. Ein Aufrufer, der `daten` nicht kennt, funktioniert unverändert weiter.
NAECHSTE: **Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen (`{ referenzenIds: string[] }`, 9.4.9), `vorlage_referenziert` beide Trefferlisten (9.12.1), `marke_referenziert` alle drei – einschließlich der **Projekte**, die die Marke als Standardmarke führen (`Markennutzung`, 9.15.1). Ohne dieses Feld bliebe von der Zusage „der Code trägt echtes Verhalten" nur der Code selbst übrig, und der geführte Reparatur-Modus (FA-19) könnte den Nutzer nirgendwohin führen. Regeln: Das Feld ist **optional** – Codes ohne Zusatzdaten lassen es weg; seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1, 9.15.5); es ist **kein Freitext-Anhang** und **
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`Ergebnis<T> = { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } }`" (TK 9.1.1, Punkt 2) - „**Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen (`{

### #20  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Alle IDs sind UUIDs** – `Project`, `Asset`, `Aktion`, `Listenelement`, `Vorlage`, `Auftrag`. **Keine** fortlaufenden Zähler: die kollidieren nach Löschen/Neu-Anlegen und beim Duplizieren von Projekten. **Keine** aus Namen abgeleiteten IDs: ein Umbenennen darf niemals Referenzen brechen.
steht in Issues: [100]
NAECHSTE: Keine** fortlaufenden Zähler: die kollidieren nach Löschen/Neu-Anlegen und beim Duplizieren von Projekten. **Keine** aus Namen abgeleiteten IDs: ein Umbenennen 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Alle IDs sind UUIDs** – `Project`, `Asset`, `Aktion`, `Listenelement`, `Vorlage`, `Auftrag`. **Keine** fortlaufenden Zähler: die kollidieren nach Löschen/Neu-Anlegen und beim Duplizieren von Projekten. **Keine** aus Namen abgeleiteten IDs: ein Umbenennen darf niemals Referenzen brechen." (TK 9.11.4) - „**IDs werden nie 

### #22  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-480cb3c,TK-f9cf686,TK-fd283f8
ZITAT   : Das Feld ist **optional** – Codes ohne Zusatzdaten lassen es weg; seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1); es ist **kein Freitext-Anhang** und **kein Ersatz für `meldung`**.
steht in Issues: [12, 107, 171, 211]
NAECHSTE: eg; seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1, 9.15.5); es ist **kein Freite
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3) - Diese Erweiterung darf die bestehende Signatur aus #12 (`Ergebnis

### #29  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : `leseMarke` | – → `Ergebnis<Marke>` (**nur lesend**)
steht in Issues: [77]
NAECHSTE: `leseMarke` und `listeMarken` liefern **fertige** Marken;
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`leseMarke` | – → `Ergebnis<Marke>` (**nur lesend**)" (TK 9.5.6, Operationstabelle) – Signatur und Nur-Lese-Charakter sind damit wörtlich festgelegt. - „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP." (TK 9.5.6, TK 9.11.2) – diese Funktion bietet **keine** Schrei

### #33  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : `erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`)
steht in Issues: [224]
NAECHSTE: Projekt` | `name`, `standardMarkeId` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`; die Marken-Kennung **bekommt** die Operation, sie holt sie nic
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`)" (TK 9.5.2) - „**[D1-Lock]**" – läuft über `mitD1Lock` (#32). - „Jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner" (TK 6) – `erstelleProjekt` legt auch den leeren `media/`-Unterordner an. - **Ordnerpfad `projects/<pr

### #52  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP.
steht in Issues: [112, 119, 139, 221]
NAECHSTE: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6);
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) ``` Marke { farben: { <FarbRolle>: string } // Hex, 6- oder 8-stellig (8 = mit Alpha) schriften: { <SchriftRolle>: Schrift } logo: { datei, seitenverhaeltnis } // Balken ist im Asset enthalten sicherheit: { horizontal: 96, vertikal: 54 } // absolute px im 1920×1080-RAHMEN radien: { pille: 40, karte: 10, klein: 2 } schatten: 

### #61  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Alle IDs sind UUIDs** – `Project`, `Asset`, `Aktion`, `Listenelement`, `Vorlage`, `Auftrag`. **Keine** fortlaufenden Zähler … **Keine** aus Namen abgeleiteten IDs
steht in Issues: [20, 100, 104]
NAECHSTE: sset`, `Aktion`, `Listenelement`, `Vorlage`, **`Marke`** (9.11.2), `Auftrag`. **Keine** fortlaufenden Zähler: die kollidieren nach Löschen/Neu-Anlegen und beim 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Begründung aus demselben Abschnitt: Renderer und Main sind „**getrennte Prozesse**"; ein `throw` über die Grenze verliert Fehlerklasse und Code – „**Fehle

### #76  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Alle IDs sind UUIDs** – `Project`, `Asset`, `Aktion`, `Listenelement`, `Vorlage`, `Auftrag`
steht in Issues: [20, 61, 100, 104, 152]
NAECHSTE: **Alle IDs sind UUIDs** – `Project`, `Asset`, `Aktion`, `Listenelement`, `Vorlage`, **`Marke`** (9.11.2), `Auftrag`. **Keine** fortla
KONTEXT : **ENTSCHIEDEN – warum `project:listeAusgaben` schärfer prüft als die übrigen dreizehn Kanäle.** Diese `projektId` wird am Ende der Kette zu einem **Pfadsegment**: `listeAusgaben` (#75) reicht sie unverändert an `ausgabeOrdner(projektId)` (#49) weiter, und die ist eine „reine String-Operation, kein Dateisystemzugriff" (#49) – sie **prüft nichts**, sondern setzt den Wert nur ein. Anders als `loeseAs

### #77  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Marke gebündelt & read-only** im MVP (Palette #FF4040 …, Logo fix); ein Marken-Editor ist kein MVP (wie FA-13).
steht in Issues: [197]
NAECHSTE: ier: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP." Beides ist mit v3.4 überholt – die Marke gehör
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die fünf Operationen, wörtlich (TK 9.5.6) – diese Datei bildet genau sie ab, nicht mehr: ``` | `leseKonfig` | – → `Ergebnis<AppKonfig>` | | `setzeAktivesProjekt` | `projektId` → `Ergebnis<void>` | | `setzeExportZiel` | `pfad` → `Ergebnis<void>` | | `leseMarke` | – → `Ergebnis<Marke>` (**nur lesend**) | | `setzeUIVoreinstel

### #97  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-480cb3c,TK-f9cf686,TK-fd283f8
ZITAT   : **Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen (`{ referenzenIds: string[] }`, 9.4.9), `vorlage_referenziert` beide Trefferlisten (9.12.1).
steht in Issues: [12, 107, 109]
NAECHSTE: rierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** ne
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3) - „Bei uns hängt an den Codes **echtes Verhalten**: `asset_

### #100  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Alle IDs sind UUIDs** – `Project`, `Asset`, `Aktion`, `Listenelement`, `Vorlage`, `Auftrag`. **Keine** fortlaufenden Zähler: die kollidieren nach Löschen/Neu-Anlegen und beim Duplizieren von Projekten. **Keine** aus Namen abgeleiteten IDs: ein Umbenennen darf niemals Referenzen brechen.
steht in Issues: [20]
NAECHSTE: Keine** fortlaufenden Zähler: die kollidieren nach Löschen/Neu-Anlegen und beim Duplizieren von Projekten. **Keine** aus Namen abgeleiteten IDs: ein Umbenennen 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.12.1): „`erstelleVorlage` | `art`, `höhe?`, `name` → `Ergebnis<Vorlage>` mit `parent = null` (feste Zonen der Art vorbelegt)" - „**`art` ist nach dem Anlegen unveränderlich** – auch über die Arbeitskopie. Ein Wechsel würde alle Zonen-Rahmen ungültig machen (andere Fläche); stattdessen n

### #104  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Alle IDs sind UUIDs** – `Project`, `Asset`, `Aktion`, `Listenelement`, `Vorlage`, `Auftrag`. **Keine** fortlaufenden Zähler … **Keine** aus Namen abgeleiteten IDs: ein Umbenennen darf niemals Referenzen brechen.
steht in Issues: [20, 100]
NAECHSTE: sset`, `Aktion`, `Listenelement`, `Vorlage`, **`Marke`** (9.11.2), `Auftrag`. **Keine** fortlaufenden Zähler: die kollidieren nach Löschen/Neu-Anlegen und beim 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operation, wörtlich (TK 9.12.1, Operationstabelle): ``` | `alsEigenstaendige` | `arbeitsId`, `name` → `Ergebnis<Vorlage>` – setzt **`parent = null`**, Arbeitskopie wird eine echte Vorlage | ``` - **Die Begründung, warum das Feld genullt wird – wörtlich (TK 9.12.1):** „**Zweck des `parent`-Feldes (und warum es genullt w

### #109  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-480cb3c,TK-f9cf686,TK-fd283f8
ZITAT   : **Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen (`{ referenzenIds: string[] }`, 9.4.9), `vorlage_referenziert` beide Trefferlisten (9.12.1). … Ein Aufrufer, der `daten` nicht kennt, funktioniert unverändert weiter.
steht in Issues: [12]
NAECHSTE: rierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** ne
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #110  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden daher als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor gezeichnet wird. Andernfalls rendert der Canvas still auf eine Fallback-Schrift → Vorschau ≠ Endvideo **und** Markenbruch.
steht in Issues: [8]
NAECHSTE: #### 9.10.4 Marken-Schriften werden mitgeliefert **Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden daher als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor gezeichnet wird.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Schriften sind vor dem Zeichnen geladen.** Der Aufruf wartet, bis alle benötigten Fonts einsatzbereit sind. Zeichnen mit Fallback-Schrift ist ein **Vertragsbruch** (lautloser Drift zwischen Vorschau und Endvideo)." (TK 9.10.3, Punkt 3) - „**Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schrif

### #112  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP.
steht in Issues: [52, 119, 139, 221]
NAECHSTE: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6);
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Vorlagen verweisen **ausschließlich über Rollen** darauf – niemals auf Hex-Werte oder Schriftnamen (9.11.1, Punkt 7)." (TK 9.11.2) - „**Farben und Schriften sind Rollen-Verweise in die `Marke`** (z. B. `farbRolle: "akzent"`, `schriftRolle: "headlineDisplay"`), **keine** Hex-Werte oder Font-Namen. So bleibt ein Marken-Wech

### #119  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP.
steht in Issues: [52, 112, 139, 221]
NAECHSTE: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6);
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Der **feste Markenrahmen** wird **immer** gezeichnet (Logo, Grundgestaltung) und ist **nicht abschaltbar** (FA-11); gestalterischer Spielraum besteht ausschließlich in den **freien Zonen** (FA-12)." (TK 9.10.5) - „**Bilder sind vor dem Zeichnen dekodiert.** Der Aufruf wartet auf das Motiv (geladen über `media://`, 9.5.7) 

### #138  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-480cb3c,TK-f9cf686,TK-fd283f8
ZITAT   : **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1); es ist **kein Freitext-Anhang**
steht in Issues: [12, 22, 107, 171, 211]
NAECHSTE: eg; seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1, 9.15.5); es ist **kein Freite
KONTEXT : **ENTSCHIEDEN – ein Teilerfolg reist NICHT durch `fehler.daten`.** Bricht die Einreih-Schleife nach dem ersten erfolgreichen Auftrag ab, ist das Ergebnis `ok: true` mit der bis dahin vergebenen Teilmenge und dem gesetzten `abbruchGrund`. Der naheliegende Gegenentwurf – `ok: false` und die schon vergebenen IDs in `fehler.daten` – verstößt gegen TK 9.1.1: Die Form von `daten` ist „**je Fehlercode fe

### #139  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus.
steht in Issues: [250, 318, 325]
NAECHSTE: „nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus".
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Diese Auswahl ist der einzige Ort im ganzen Programm, an dem ein Nutzer eine **Farbe** bestimmt. Genau deshalb ist sie eingeschränkt: „**Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus." (TK 9.8.4) Ein Farbrad an dieser Stelle wäre eine Ein-Zeilen-Entscheidung mit da

### #139  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : aus der Markenpalette (feste Auswahl, v1)
steht in Issues: [14, 136]
NAECHSTE: „nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus".
KONTEXT : **Entscheidung dieses Issues – welche drei Rollen (kein TK-Zitat, aber verbindlich).** Das TK sagt „aus der Markenpalette (feste Auswahl, v1)", benennt die Teilmenge aber nicht. Angeboten werden genau die drei `akzent*`-Rollen. Begründung: Die Akzentfarbe wirkt laut Anforderungsdokument 4.1 auf „Akzentfarbe oder Aktions-Badge zur Hervorhebung" – also auf Preis-Pille und CTA. Die übrigen zehn Rolle

### #139  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP.
steht in Issues: [52, 112, 119, 221]
NAECHSTE: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6);
KONTEXT : Die Hex-Werte stehen hier **zur Orientierung**; sie werden in dieser Datei **nicht** hingeschrieben. Gelesen werden sie zur Laufzeit aus `marke.farben`. „**Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP." (TK 9.11.2)

### #139  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus.
steht in Issues: [250, 318, 325]
NAECHSTE: „nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus".
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus." (TK 9.8.4) - Das Feld im `Aktion`-Datensatz, wörtlich (TK 9.8.2): ``` akzentfarbe: string // aus der Markenpalette (feste Auswahl, v1) ``` - „**Farben und Schriften sind Rollen-Ve

### #139  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP.
steht in Issues: [52, 112, 119, 221]
NAECHSTE: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6);
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus." (TK 9.8.4) - Das Feld im `Aktion`-Datensatz, wörtlich (TK 9.8.2): ``` akzentfarbe: string // aus der Markenpalette (feste Auswahl, v1) ``` - „**Farben und Schriften sind Rollen-Ve

### #144  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Sicherheitsabstand ist eine Eigenschaft des Bildrahmens, nicht der Vorlagenfläche.** Er gilt absolut im 1920×1080-Rahmen (96 px horizontal, 54 px vertikal, 9.10.5). **Wichtige Folge für Bänder:** Ein Band sitzt am unteren Rahmenrand – die unteren **54 px des Rahmens liegen damit *innerhalb* des Bandes**. Bei einem 162 px hohen Band sind also nur die oberen **108 px** sicher nutzbar; Inhalt darunter kann am TV abgeschnitten werden.
steht in Issues: [148]
NAECHSTE: **Sicherheitsabstand ist eine Eigenschaft des Bildrahmens, nicht der Vorlagenfläche.** Er gilt absolut im 1920×1080-Rahmen (96 px horizontal, 54 px vertikal, 9.10.5).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Canvas mit Zonen-Rechtecken:** ziehen und an Griffen bemaßen – für das schnelle Gestalten." (TK 9.12.2) - „**Einrasten** an den Sicherheitsabstand-Linien, an Kanten anderer Zonen und an ein **8-px-Raster** – saubere Layouts ohne Verlust der Pixel-Genauigkeit." (TK 9.12.2) - „**Zonen-Rahmen in absoluten Pixeln** der jewe

### #148  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Sicherheitsabstand ist eine Eigenschaft des Bildrahmens, nicht der Vorlagenfläche.** Er gilt absolut im 1920×1080-Rahmen (96 px horizontal, 54 px vertikal, 9.10.5). **Wichtige Folge für Bänder:** Ein Band sitzt am unteren Rahmenrand – die unteren **54 px des Rahmens liegen damit *innerhalb* des Bandes**. Bei einem 162 px hohen Band sind also nur die oberen **108 px** sicher nutzbar; Inhalt darunter kann am TV abgeschnitten werden. Der `vorlagen-editor` zeigt diese Linie an und warnt (9.12.2).
NAECHSTE: **Sicherheitsabstand ist eine Eigenschaft des Bildrahmens, nicht der Vorlagenfläche.** Er gilt absolut im 1920×1080-Rahmen (96 px horizontal, 54 px vertikal, 9.10.5).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die vollständige Prüftabelle (TK 9.12.2), Zeile für Zeile: - „Zone ganz oder teilweise **außerhalb der Fläche** | **Sperre** – nicht speicherbar" - „`höhe` ≤ 0 oder ≥ 1080 (bei `split`/`einblendung`) | **Sperre**" - „`höhe` **ungerade** (bei `split`/`einblendung`) | **Sperre** – `yuv420p` verlangt gerade Höhen und Versätze

### #152  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Alle IDs sind UUIDs** – `Project`, `Asset`, `Aktion`, `Listenelement`, `Vorlage`, `Auftrag`. … **IDs werden nie wiederverwendet**, auch nicht nach dem Löschen.
steht in Issues: [20, 100, 104]
NAECHSTE: . #### 9.11.4 ID-Schema und Konstanten - **Alle IDs sind UUIDs** – `Project`, `Asset`, `Aktion`, `Listenelement`, `Vorlage`, **`Marke`** (9.11.2), `Auftrag`. **
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fix-Optionen je Element:** Medium **neu verknüpfen/importieren** (media-service), durch ein **anderes ersetzen** (Referenz umsetzen), oder das **Element entfernen** (`entferneElement`, project-store). Es werden ausschließlich bestehende Operationen genutzt." (TK 9.7.5) – der Klammerzusatz „(Referenz umsetzen)" **ist** d

### #164  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-fd283f8
ZITAT   : Der `render-service` holt den Wert **über die Marke** (`config-store.leseMarke`, 9.5.6) und tippt ihn **nie** als Hexzahl in eine Filterkette – sonst hätte das Projekt zwei Quellen für dieselbe Farbe (9.11.1, Punkt 7).
steht in Issues: [177, 218]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Art A – `split` (Hauptbetriebsart): Band *unter* dem verkleinerten Video.**" (TK 9.2.8) - Die Geometrie-Tabelle aus TK 9.2.8, wörtlich: „| Video-Bereich | **1920 × (1080 − H)** bei y = 0 |" „| Band | **1920 × H** bei y = 1080 − H |" „| Video eingepasst (16:9) | höhenbegrenzt → Breite = (1080 − H) × 16/9, **abgerundet au

### #164  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-fd283f8
ZITAT   : **Video vorbereiten:** bei `split` **contain** in den Video-Bereich skalieren und mit **`flaecheDunkel`** auffüllen (Wert aus der Marke, s. o.); bei `einblendung` normal auf 1920 × 1080 nach 9.2.4.
NAECHSTE: Video vorbereiten:** bei `split` **contain** in den Video-Bereich skalieren und mit **`flaecheDunkel`** auffüllen (Wert aus der **Projekt-Standardmarke** `Proje
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Art A – `split` (Hauptbetriebsart): Band *unter* dem verkleinerten Video.**" (TK 9.2.8) - Die Geometrie-Tabelle aus TK 9.2.8, wörtlich: „| Video-Bereich | **1920 × (1080 − H)** bei y = 0 |" „| Band | **1920 × H** bei y = 1080 − H |" „| Video eingepasst (16:9) | höhenbegrenzt → Breite = (1080 − H) × 16/9, **abgerundet au

### #171  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-480cb3c,TK-f9cf686,TK-fd283f8
ZITAT   : seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1)
steht in Issues: [12, 22, 107, 211]
NAECHSTE: seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird:
KONTEXT : 1. **`ElementFehlerdaten` wird hier deklariert, obwohl `daten` sonst dort beschrieben wird, wo der Code vergeben wird.** TK 9.1.1 sagt: „seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1)". Im `media-service` (#79) genügte deshalb ein Kommentar, denn dort vergibt **genau eine** Datei den betroffenen Code. Hier ist es ander

### #177  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-fd283f8
ZITAT   : Der `render-service` holt den Wert **über die Marke** (`config-store.leseMarke`, 9.5.6) und tippt ihn **nie** als Hexzahl in eine Filterkette – sonst hätte das Projekt zwei Quellen für dieselbe Farbe (9.11.1, Punkt 7).
steht in Issues: [164, 218]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - „**Main (`render-service`):** schreibt die PNGs nach T1; **normalisiert jedes Element** (`scale` + `pad` → Profil) zu einem Zwischenclip `seg_*.mp4`“ (TK 9.2.5) - „Die absoluten Pfade der Importe (`medienRef`) löst er über die Pfad-Autorität `project-store` auf (9.5.7), statt das Layout selbst zu kennen.“ (TK 9.2.5) - „**`project-store` ist die eine Pfad-Autorität.**“ (TK 9.5.7) - „**Normalisier

### #197  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Marke gebündelt & read-only** im MVP (Palette #FF4040 …, Logo fix); ein Marken-Editor ist kein MVP (wie FA-13).
steht in Issues: [77]
NAECHSTE: ier: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP." Beides ist mit v3.4 überholt – die Marke gehör
KONTEXT : 1. **Diese Datei ist die EINZIGE Datei in `src/renderer/app-shell/`, die aus einem anderen Renderer-Modul importiert.** Alle übrigen Shell-Dateien bekommen, was sie brauchen, als Parameter aus dieser Datei. *Begründung:* So gibt es genau **eine** Stelle, an der man nachsehen muss, wenn die Frage „wer hängt an der Projekt-Sicht?" aufkommt – und genau eine Stelle, die angepasst werden muss, wenn ein

### #197  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Marke gebündelt & read-only** im MVP (Palette #FF4040 …, Logo fix); ein Marken-Editor ist kein MVP (wie FA-13).
steht in Issues: [77]
NAECHSTE: ier: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP." Beides ist mit v3.4 überholt – die Marke gehör
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Module **außerhalb** dieses Ordners importieren die Sicht **nicht** direkt; sie bekommen die Aktualisierungsfunktion als **Parameter** übergeben. Wer sie beim Aufbau der Oberfläche durchreicht, ist Sache der `app-shell` (M7) und ausdrücklich **nicht** Teil von M5." (#155, ENTSCHIEDEN 1) – **das ist der Auftrag dieser Date

### #211  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-480cb3c,TK-f9cf686,TK-fd283f8
ZITAT   : Regeln: Das Feld ist **optional** – Codes ohne Zusatzdaten lassen es weg; seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1); es ist **kein Freitext-Anhang** und **kein Ersatz für `meldung`**. Ein Aufrufer, der `daten` nicht kennt, funktioniert unverändert weiter.
steht in Issues: [12, 171]
NAECHSTE: eg; seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1, 9.15.5); es ist **kein Freite
KONTEXT : Bei uns hängt an den Codes **echtes Verhalten**: `asset_referenziert` zeigt die betroffenen Listenelemente, `vorlage_referenziert` beide Trefferlisten (9.12.1), `datei_zu_gross_fat32` erklärt exFAT, `kein_platz` und `ziel_gesperrt` brauchen verschiedene Hinweise. Geht der Code verloren, degradieren Reparatur-Modus, Wiederholen und der FAT32-Hinweis alle zu „irgendwas ist schiefgelaufen". - „Der Au

### #218  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-fd283f8
ZITAT   : **`split`:** Das `<video>` wird in den oberen Bereich **1920 × (1080 − H)** gelegt (`contain`), die Restflächen links/rechts in der Farb-Rolle **`flaecheDunkel`** gefüllt – **derselben**, die der Render benutzt (9.2.8, 9.11.2); das Band-Canvas (**1920 × H**) sitzt **darunter**.
NAECHSTE: - **`split`:** Das `<video>` wird in den oberen Bereich **1920 × (1080 − H)** gelegt (`contain`), die Restflächen links/rechts in der Farb-Rolle **`flaecheDunkel`** gefüllt – **derselben**, die der Render benutzt (9.2.8, 9.11.2), und aus **derselben Quelle**:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**`split`:** Das `<video>` wird in den oberen Bereich **1920 × (1080 − H)** gelegt (`contain`), die Restflächen links/rechts in der Farb-Rolle **`flaecheDunkel`** gefüllt – **derselben**, die der Render benutzt (9.2.8, 9.11.2); das Band-Canvas (**1920 × H**) sitzt **darunter**." (TK 9.9.2) - „Die Vorschau **rechnet die Ge

### #218  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-fd283f8
ZITAT   : Der `render-service` holt den Wert **über die Marke** (`config-store.leseMarke`, 9.5.6) und tippt ihn **nie** als Hexzahl in eine Filterkette – sonst hätte das Projekt zwei Quellen für dieselbe Farbe (9.11.1, Punkt 7).
steht in Issues: [164, 177]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**`split`:** Das `<video>` wird in den oberen Bereich **1920 × (1080 − H)** gelegt (`contain`), die Restflächen links/rechts in der Farb-Rolle **`flaecheDunkel`** gefüllt – **derselben**, die der Render benutzt (9.2.8, 9.11.2); das Band-Canvas (**1920 × H**) sitzt **darunter**." (TK 9.9.2) - „Die Vorschau **rechnet die Ge

### #221  [TK+AD, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP.
steht in Issues: [52, 112, 119, 139]
NAECHSTE: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6);
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Kaputte Elemente** (`fehlt`-Asset, 9.4.7) zeigen einen **Platzhalter** (konsistent mit `action-editor` 9.8.5); die eigentliche Reparatur erfolgt im `composer` (9.7.5)." (TK 9.9.3) – **die Kernregel dieses Issues**, in beiden Hälften: **zeigen** ja, **reparieren** nein. - „Zeigt `bildRef` auf ein `fehlt`-Asset (media-ser

### #224  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : `erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`)
steht in Issues: [33]
NAECHSTE: Projekt` | `name`, `standardMarkeId` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`; die Marken-Kennung **bekommt** die Operation, sie holt sie nic
KONTEXT : **Warum nach dem Anlegen trotzdem geöffnet wird.** TK 9.5.2 trennt beides ausdrücklich: „`erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`)" gegenüber „`öffneProjekt` | `id` → `Ergebnis<Projekt>` (lädt in den Speicher; setzt aktives Projekt via `config-store`)". Nur das Öffnen setzt das **aktive** Projekt in D3 – ohne diesen Schritt fände die Sitzungswiederhers

### #224  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : `erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`)
steht in Issues: [33]
NAECHSTE: Projekt` | `name`, `standardMarkeId` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`; die Marken-Kennung **bekommt** die Operation, sie holt sie nic
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Beim Öffnen eines Projekts wechselt die Shell in den Reiter Zusammenstellen** – der Nutzer landet dort, wo er weiterarbeitet, statt in der Liste stehen zu bleiben." (TK 9.14.3) - „Das **aktive** Projekt lebt zur Laufzeit **im Speicher** (Quelle der Wahrheit während der Sitzung; Lesezugriffe sind sofortig). Nur *ein* Pro

### #250  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : **Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus.
steht in Issues: [139, 318, 325]
NAECHSTE: „nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus".
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „ Aktionen = action-editor [P2] + große Live-Vorschau" (TK 9.14.1) - „**`template-canvas` ist die einzige Pixelquelle:** die Live-Vorschau ist **pixelgleich** zur Vorschau (P5) und zum finalen Segment-PNG (Variante A). Es gibt **keinen** zweiten Gestaltungs-/Renderpfad." (TK 9.8.4) – deshalb führt der einzige Zeichenweg üb

### #265  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : Besitzt `config.json` (app-weit): aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen, Marke.
NAECHSTE: aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Besitzt `config.json` (app-weit): aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen, Marke." (TK 9.5.6) – die drei Felder oben sind die ersten drei dieser Aufzählung, in dieser Reihenfolge. Zur vierten (Marke) siehe den übernächsten Punkt. - „**App-Zustand** – aktives Projekt, letztes Export-Ziel, UI-Voreinstellun

### #280  [TK+AD, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-3d0ad13,TK-480cb3c,TK-c8f8af0,TK-f9cf686,TK-fd283f8
ZITAT   : Balken ist im Asset enthalten
steht in Issues: [52, 119]
NAECHSTE: der dunkle Balken ist im Logo-Asset **enthalten** – es braucht keine eigene Hintergrundzone).
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ECHTE OFFENE FRAGE: Bundle-Dateiname und `seitenverhaeltnis` des Fitnessworld24-Logos.** Anders als die vier Schriftdateien (bereits vorhanden, s. o.) existiert im Repository **noch keine** gebündelte Logo-Datei für `template-canvas` (`bereiteLogoVor`, M4-25, wirft heute noch „Noch nicht umgesetzt"; `tools/assets/logo.png` ist ein **Dokument-Brand

### #316  [TK, anfuehrung]  VERALTET seit: TK-14b30d1,TK-3a93139,TK-fd283f8
ZITAT   : Der `render-service` holt den Wert **über die Marke** (`config-store.leseMarke`, 9.5.6) …
steht in Issues: [164, 177, 218]
NAECHSTE: Der `render-service` liefert nur, was **nur er** weiß:
KONTEXT : - Die `einblendung`-Tabelle aus TK 9.2.2 – **vier** Felder, `flaecheDunkel` das vierte: | Feld | Inhalt | |---|---| | `art` | `"split"` \| `"einblendung"` – Kompositionsart (Band **unter** bzw. **über** dem Video, 9.2.8) | | `höhe` | Bandhöhe `H` in Pixeln (ganzzahlig und **gerade**, 9.2.8) | | `abschnitte` | geordnete Folge `{ png (Binärpuffer, 1920 × H), dauer }` | | `flaecheDunkel` | **fertiger

### === A2: nie woertlich (Paraphrase) ===


### #1  [TK, anfuehrung]
ZITAT   : Nur der Main-Prozess berührt ffmpeg und Dateisystem.
steht in Issues: [3, 193]
NAECHSTE: - **Nur der Main** berührt das Dateisystem.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Nur der Main-Prozess berührt ffmpeg und Dateisystem." (TK 2) - „Renderer ↔ Main reden AUSSCHLIESSLICH über den typisierten IPC-Vertrag." (TK 9, Modulübersicht) - Modulordner heißen exakt wie die Module aus TK Abschnitt 9 (Übergabe-Prompt 8b, Falle zu #1).

### #1  [TK, anfuehrung]
ZITAT   : Renderer ↔ Main reden AUSSCHLIESSLICH über den typisierten IPC-Vertrag.
NAECHSTE: Renderer ↔ Main reden **ausschließlich** über den typisierten IPC-Vertrag.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Nur der Main-Prozess berührt ffmpeg und Dateisystem." (TK 2) - „Renderer ↔ Main reden AUSSCHLIESSLICH über den typisierten IPC-Vertrag." (TK 9, Modulübersicht) - Modulordner heißen exakt wie die Module aus TK Abschnitt 9 (Übergabe-Prompt 8b, Falle zu #1).

### #2  [TK, anfuehrung]
ZITAT   : Nur der Main-Prozess berührt ffmpeg und Dateisystem
steht in Issues: [1, 3, 193]
NAECHSTE: - **Nur der Main** berührt das Dateisystem;
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „gebündeltes ffmpeg (ffmpeg-static + fluent-ffmpeg)" (CLAUDE.md, Wichtigste Festlegungen) – die Bündelung erfolgt über electron-builder/asarUnpack (#6/#7), **nicht** über den JS-Bundler. - „Nur der Main-Prozess berührt ffmpeg und Dateisystem" (TK 2) – der Main-Build darf daher kein Browser-Target (`lib: dom`) verwenden.

### #3  [TK, anfuehrung]
ZITAT   : Nur der Main-Prozess berührt ffmpeg und Dateisystem
steht in Issues: [1, 2, 193]
NAECHSTE: - **Nur der Main** berührt das Dateisystem;
KONTEXT : ## Modul & Datei - Modul: Grundgerüst / Main-Bootstrap (Basis für `ipc-gateway`, M1) - Datei: `src/main/index.ts` - Vertrag: kein einzelner TK-Abschnitt; TK 2 „Nur der Main-Prozess berührt ffmpeg und Dateisystem", TK 9.5.4 (Einzel-Instanz: hier nur der **Aufrufpunkt** und die Fenster-Fokussierung; die Sperre selbst kommt aus M1) - Prozess/Speicher: –

### #3  [TK, anfuehrung]
ZITAT   : **Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **unmittelbar bevor ein `render`- oder `export`-Auftrag startet**, (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 verändert hat** (Import, Löschen – s. 9.4.5/9.4.6). Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist (kein Schließen mit ausstehendem Schreiben).
steht in Issues: [47]
NAECHSTE: ** (Import, Löschen – s. 9.4.5/9.4.6). Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist (kein Schließen mit ausstehendem Schreiben).
KONTEXT : „**Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **unmittelbar bevor ein `render`- oder `export`-Auftrag startet**, (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 verändert hat** (Import, Löschen – s. 9.4.5/9.4.6). Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist (kein Schließen mit ausstehendem Schreiben)." (TK 9.5.4)

### #3  [TK, anfuehrung]
ZITAT   : Nur der Main-Prozess berührt ffmpeg und Dateisystem.
steht in Issues: [1, 193]
NAECHSTE: - **Nur der Main** berührt das Dateisystem.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Nur der Main-Prozess berührt ffmpeg und Dateisystem." (TK 2) - „Die drei Sicherheitsflags sind nicht verhandelbar, auch nicht ‚temporär zum Debuggen'." (Übergabe-Prompt 8b, Falle zu #3) - CSP gesetzt (Übergabe-Prompt 8b, Tabelle #3). - „Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist (kein Sch

### #4  [TK, anfuehrung]
ZITAT   : Ereignisse sind Einbahnstraßen und tragen keine Hülle und keinen Endzustand.
steht in Issues: [151]
NAECHSTE: Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Das Preload darf die Hülle NICHT ‚vereinfachen'. Verboten: den `wert` auspacken und im Fehlerfall werfen." (Übergabe-Prompt 8b, Falle zu #4) - „kein rohes `ipcRenderer` im Renderer" (Übergabe-Prompt 8b, Tabelle #4) - „Ereignisse sind Einbahnstraßen und tragen keine Hülle und keinen Endzustand." (TK 9.1.1, Punkt 5) – die `

### #5  [TK, anfuehrung]
ZITAT   : an den DATENORT gebunden
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Modul & Datei - Modul: Grundgerüst / Main (Basis für `project-store`, `config-store`, `vorlagen-store`, `auftrags-manager`) - Datei: `src/main/datenort.ts` - Vertrag: kein einzelner TK-Abschnitt; TK 6 „Speicher- und Ordnerkonventionen", TK 9.5.4 (Einzel-Instanz „an den DATENORT gebunden") - Prozess/Speicher: Grundlage für D1, D2, D3, Q2, Q3, Q4, V1

### #5  [TK, anfuehrung]
ZITAT   : Die Sperre muss an den DATENORT gebunden sein, nicht an den Programmpfad.
NAECHSTE: **Wichtig für die portable Auslieferung:** Die Sperre muss an den **Datenort** gebunden sein (den App-Ordner mit `projects/`), nicht an den Programmpfad.
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Jeder persistente Speicher der Anwendung hängt von diesem einen Pfad ab. Wählt diese Funktion für Dev und für den gepackten Build unterschiedliche Orte, „verliert" der Nutzer beim ersten echten Test scheinbar alle Projekte. Die Wahl zwischen „neben der portablen EXE" (mitnehmbar auf dem USB-Stick, aber evtl. schreibgeschützt) und `userData` (immer schreibba

### #5  [TK, anfuehrung]
ZITAT   : **Wichtig für die portable Auslieferung:** Die Sperre muss an den **Datenort** gebunden sein (den App-Ordner mit `projects/`), nicht an den Programmpfad. Sonst könnten zwei Kopien der portablen EXE, die auf **dieselben** Daten zeigen, beide starten.
NAECHSTE: ie Sperre muss an den **Datenort** gebunden sein (den App-Ordner mit `projects/`), nicht an den Programmpfad. Sonst könnten zwei Kopien der portablen EXE, die a
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Wichtig für die portable Auslieferung:** Die Sperre muss an den **Datenort** gebunden sein (den App-Ordner mit `projects/`), nicht an den Programmpfad. Sonst könnten zwei Kopien der portablen EXE, die auf **dieselben** Daten zeigen, beide starten." (TK 9.5.4) - „Verpackung `electron-builder` Portable-Target" (TK 3) – ke

### #5  [TK, anfuehrung]
ZITAT   : Verpackung `electron-builder` Portable-Target
NAECHSTE: SQLite optional | | Verpackung | `electron-builder`, Portable-Target | ## 4.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Wichtig für die portable Auslieferung:** Die Sperre muss an den **Datenort** gebunden sein (den App-Ordner mit `projects/`), nicht an den Programmpfad. Sonst könnten zwei Kopien der portablen EXE, die auf **dieselben** Daten zeigen, beide starten." (TK 9.5.4) - „Verpackung `electron-builder` Portable-Target" (TK 3) – ke

### #7  [TK, anfuehrung]
ZITAT   : Verpackung: `electron-builder`, Portable-Target
NAECHSTE: SQLite optional | | Verpackung | `electron-builder`, Portable-Target | ## 4.
KONTEXT : ## Modul & Datei - Modul: Grundgerüst / Verpackung - Datei: `electron-builder.yml` (oder `build`-Feld in `package.json`) - Vertrag: kein einzelner TK-Abschnitt; TK 3 „Verpackung: `electron-builder`, Portable-Target" - Prozess/Speicher: –

### #7  [AD, anfuehrung]
ZITAT   : ein dummer TV-Player + ein Desktop-Tool
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Die gesamte Produktentscheidung „ein dummer TV-Player + ein Desktop-Tool" (Anforderungsdokument 3) setzt voraus, dass das Tool **ohne Installation und ohne Admin-Rechte** auf einem beliebigen Studio-Laptop läuft (NFA-08). Eine falsch konfigurierte Verpackung – ein versehentlicher Installer, fehlende Font-Dateien oder ein falsch gepacktes ffmpeg (#6) – fällt

### #7  [TK, anfuehrung]
ZITAT   : Verpackung `electron-builder`, Portable-Target
NAECHSTE: SQLite optional | | Verpackung | `electron-builder`, Portable-Target | ## 4.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Verpackung `electron-builder`, Portable-Target" (TK 3) - „Verpackung electron-builder Portable (Win 10/11 + macOS 13+, kein Installer, ohne Admin)" (CLAUDE.md)

### #8  [TK, anfuehrung]
ZITAT   : **Schrift-Rollen (v1, fest) – alle Dateien werden mitgeliefert (9.10.4):** `headlineElegant` = Playfair Display 700 · `headlinePlakativ` = Archivo Black 900 · `fliesstext`/`fliesstextFett` = Arimo 400/700.
NAECHSTE:  `#000000B3` | Verlauf für Textlesbarkeit über Fotos | **Schrift-Rollen (v1, fest) – alle Dateien werden mitgeliefert (9.10.4):** | Rolle | Schrift | Lizenz | B
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden daher als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor gezeichnet wird. Andernfalls rendert der Canvas still auf eine Fallback-Schrift → Vorschau ≠ Endvideo **und** Markenbruch." (TK 9.10.

### #9  [TK, anfuehrung]
ZITAT   : Pfad-Autorität & media://-Protokoll
NAECHSTE: - Ist die **Pfad-Autorität** des Projekts:
KONTEXT : ## Modul & Datei - Modul: Grundgerüst / Main (Basis für `project-store`s Pfad-Autorität, M1) - Datei: `src/main/media-protokoll.ts` - Vertrag: kein einzelner TK-Abschnitt; TK 9.5.7 „Pfad-Autorität & media://-Protokoll" (nur die Registrierung, **nicht** die Auflösung) - Prozess/Speicher: Vorstufe zu D2/D1

### #9  [TK, anfuehrung]
ZITAT   : `project-store` ist die eine Pfad-Autorität. […] Jeder Main-Dienst, der eine Mediendatei anfassen muss, resolved den Pfad über den `project-store`, statt das Layout selbst zu kennen.
NAECHSTE: Jeder Main-Dienst, der eine Mediendatei anfassen muss, **resolved den Pfad über den `project-store`**, statt das Layout selbst zu kennen:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`project-store` ist die eine Pfad-Autorität. […] Jeder Main-Dienst, der eine Mediendatei anfassen muss, resolved den Pfad über den `project-store`, statt das Layout selbst zu kennen." (TK 9.5.7) – **hier** wird nichts aufgelöst, nur registriert. - „Hier entsteht KEINE Pfadauflösung. Die gehört dem `project-store` (9.5.7, 

### #10  [TK, anfuehrung]
ZITAT   : Warteschlangen-Leiste nie verstecken
NAECHSTE: die Warteschlangen-Leiste nutzt sie so (9.14.2).
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Alle Renderer-Module aus M4–M7 (`composer`, `action-editor`, `vorlagen-editor`, `preview-player`, `queue-panel`) brauchen einen Ort, an dem sie eingehängt werden. Dieses Issue liefert nur die **Anordnung**, damit spätere Module nicht zusätzlich noch die Navigation neu erfinden müssen. Die fachlichen Invarianten der `app-shell` (Reparatur-Modus-Reiterwechsel

### #12  [TK, anfuehrung]
ZITAT   : `Ergebnis<T> = { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } }`
steht in Issues: [22, 48]
NAECHSTE: s über die Grenze.** ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` **Struktu
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`Ergebnis<T> = { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } }`" (TK 9.1.1, Punkt 2) - „**Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen (`{

### #12  [TK, anfuehrung]
ZITAT   : Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code.
steht in Issues: [22, 72, 73, 74, 75]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`Ergebnis<T> = { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } }`" (TK 9.1.1, Punkt 2) - „**Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen (`{

### #13  [TK, anfuehrung]
ZITAT   : `dateiname`: string // ‚<uuid>.<ext_kleingeschrieben>' — OHNE Verzeichnisanteil
NAECHSTE: string // "<uuid>.<ext_kleingeschrieben>" — OHNE Verzeichnisanteil originalname:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`dateiname`: string // ‚<uuid>.<ext_kleingeschrieben>' — OHNE Verzeichnisanteil" (TK 9.4.4) - „`maße`: { breite: number, höhe: number } // DISPLAY-Maße in Pixeln, ganzzahlig (9.4.8)" (TK 9.4.4) - „`dauer`: number | null // Sekunden, 3 Nachkommastellen (Video); null (Bild)" (TK 9.4.4) - „Der Formatfilter des Dialogs (9.4.3

### #13  [TK, anfuehrung]
ZITAT   : `maße`: { breite: number, höhe: number } // DISPLAY-Maße in Pixeln, ganzzahlig (9.4.8)
NAECHSTE: number } // DISPLAY-Maße in Pixeln, ganzzahlig (9.4.8) dauer:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`dateiname`: string // ‚<uuid>.<ext_kleingeschrieben>' — OHNE Verzeichnisanteil" (TK 9.4.4) - „`maße`: { breite: number, höhe: number } // DISPLAY-Maße in Pixeln, ganzzahlig (9.4.8)" (TK 9.4.4) - „`dauer`: number | null // Sekunden, 3 Nachkommastellen (Video); null (Bild)" (TK 9.4.4) - „Der Formatfilter des Dialogs (9.4.3

### #13  [TK, anfuehrung]
ZITAT   : `dauer`: number | null // Sekunden, 3 Nachkommastellen (Video); null (Bild)
NAECHSTE: number | null // Sekunden, 3 Nachkommastellen (Video);
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`dateiname`: string // ‚<uuid>.<ext_kleingeschrieben>' — OHNE Verzeichnisanteil" (TK 9.4.4) - „`maße`: { breite: number, höhe: number } // DISPLAY-Maße in Pixeln, ganzzahlig (9.4.8)" (TK 9.4.4) - „`dauer`: number | null // Sekunden, 3 Nachkommastellen (Video); null (Bild)" (TK 9.4.4) - „Der Formatfilter des Dialogs (9.4.3

### #14  [TK, anfuehrung]
ZITAT   : Bild = Referenz, nie Kopie: die Aktion hält nur eine Asset-ID.
NAECHSTE: Aktion ohne Titel ist nicht speicherbar. - **Bild = Referenz, nie Kopie:** die Aktion hält nur eine Asset-ID; das Asset bleibt projektweit und wird beim Löschen
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) ``` Aktion { id: string titel: string // Pflicht beschreibung: string | null preis: string | null bildRef: string | null // Referenz auf eine Asset-ID (NICHT eingebettet) cta: string | null // Call-to-Action, z. B. "Gratis Probetraining" standardDauer:number | null // Default-Anzeigedauer; nur Vorgabe (s. 9.8.4) vorlagenId: 

### #14  [TK, anfuehrung]
ZITAT   : Akzentfarbe nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler).
NAECHSTE: Farbwert** (9.8.2, 9.8.4). *Zurückgenommen wird damit:* „Akzentfarbe nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine A
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) ``` Aktion { id: string titel: string // Pflicht beschreibung: string | null preis: string | null bildRef: string | null // Referenz auf eine Asset-ID (NICHT eingebettet) cta: string | null // Call-to-Action, z. B. "Gratis Probetraining" standardDauer:number | null // Default-Anzeigedauer; nur Vorgabe (s. 9.8.4) vorlagenId: 

### #15  [TK, anfuehrung]
ZITAT   : zwei Quellen für dieselbe Information unweigerlich auseinanderlaufen
NAECHSTE: Zwei Quellen für dieselbe Information würden unweigerlich auseinanderlaufen.
KONTEXT : ## Warum das im Gesamtsystem wichtig ist `Listenelement` ist das Herzstück der Wiedergabeliste – `composer` (M5) manipuliert es, `render-service` (M6) liest es 1:1 in `RenderItem` um. Ein zusätzliches `position`-Feld neben der Array-Reihenfolge wäre eine zweite Quelle für dieselbe Information; TK betont ausdrücklich, dass „zwei Quellen für dieselbe Information unweigerlich auseinanderlaufen" – ein

### #15  [TK, anfuehrung]
ZITAT   : `Vorlage` und `Marke` liegen NICHT im Projekt – sie sind app-weit. Das Projekt hält nur Referenzen (`vorlagenId`, `bandVorlageId`).
NAECHSTE: enderRequest`, 9.2.1.) - **`Vorlage` und `Marke` liegen NICHT im Projekt** – sie sind app-weit (9.11.1.1, 9.5.6). Das Projekt hält nur **Referenzen** (`vorlagen
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Die Reihenfolge ist die Array-Reihenfolge von `liste`** – es gibt **kein** separates `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerlich auseinanderlaufen." (TK 9.11.3) - „`Vorlage` und `Marke` liegen NICHT im Projekt – sie sind app-weit. Das Projekt hält nur Referenzen (`vorlagenId`, `bandVorlage

### #16  [TK, anfuehrung]
ZITAT   : P1 (Import/Löschen) und P4 (Render/Export) laufen **ausschließlich als Aufträge** über P6.
NAECHSTE: Q1–Q4 | FA-16/17/18, NFA-09 | **Ausführung:** P1 (Import/Löschen) und P4 (Render/Export) laufen **ausschließlich als Aufträge über P6** (seriell freigegeben).
KONTEXT : ``` | `fehler` | `{ code, meldung, daten? }` oder `null` | gesetzt bei `fehlgeschlagen`; `code` stammt aus dem Fachdienst, `daten` trägt die Nutzdaten des Codes (9.1.1) | | `ergebnis` | fachliche Nutzdaten des Dienstes oder `null` | gesetzt bei `erfolg`: `import` → der fertige `Asset` (9.4.4), `loeschen` → `{ assetId }`, `render` → Pfad/Größe/Dauer (9.2.3), `export` → `{ zielPfad, dateigroesse }` 

### #17  [TK, anfuehrung]
ZITAT   : nur gerenderte Segment-PNGs reisen über IPC
NAECHSTE: ndvideo laufen auseinander – und wurde deshalb verworfen. **Daraus folgende Festlegungen für den Vertrag:** 1. **Nur gerenderte Segment-PNGs reisen über IPC.** 
KONTEXT : ## Warum das im Gesamtsystem wichtig ist `RenderItem` ist die Stelle, an der IPC-Granularität Variante A (TK 9.1) typmäßig sichtbar wird: Bei `art:"segment"` reist ein fertiges PNG als Binärpuffer, **keine** Aktions-/Vorlagendaten. Würde `RenderItem` stattdessen `aktion`+`vorlage` mitschicken (statt eines fertigen `png`-Buffers), wäre das ein struktureller Bruch der Zusicherung „nur gerenderte Seg

### #17  [TK, anfuehrung]
ZITAT   : **Nur gerenderte Segment-PNGs reisen über IPC.** Importierte Videos und Bilder liegen bereits kopiert in `media/` (D2) und werden vom Main **direkt per relativem Pfad** gelesen […] – sie gehen **nie** über IPC.
NAECHSTE: **Nur gerenderte Segment-PNGs reisen über IPC.** Importierte Videos und Bilder liegen bereits kopiert in `media/` (D2) und werden vom Main **direkt per relativem Pfad** gelesen (Pfadauflösung über die Pfad-Autorität `project-store`, 9.5.7) – sie gehen **nie** über IPC.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Nur gerenderte Segment-PNGs reisen über IPC.** Importierte Videos und Bilder liegen bereits kopiert in `media/` (D2) und werden vom Main **direkt per relativem Pfad** gelesen […] – sie gehen **nie** über IPC." (TK 9.1, Punkt 1) - „**PNG-Übergabe als Binärpuffer** (kein Base64 im Nachrichtenkörper)." (TK 9.1, Punkt 3) - 

### #17  [TK, anfuehrung]
ZITAT   : Bei `‚segment'` werden **keine** Aktions-/Vorlagendaten mitgeschickt – die Pixel sind bereits final; das ist der Kern von Variante A.
NAECHSTE: lgung/Fehlerzuordnung). Bei `"segment"` werden **keine** Aktions-/Vorlagendaten mitgeschickt – die Pixel sind bereits final; das ist der Kern von Variante A. **
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Nur gerenderte Segment-PNGs reisen über IPC.** Importierte Videos und Bilder liegen bereits kopiert in `media/` (D2) und werden vom Main **direkt per relativem Pfad** gelesen […] – sie gehen **nie** über IPC." (TK 9.1, Punkt 1) - „**PNG-Übergabe als Binärpuffer** (kein Base64 im Nachrichtenkörper)." (TK 9.1, Punkt 3) - 

### #17  [TK, anfuehrung]
ZITAT   : **Die Bandhöhe `H` stammt ausschließlich aus der Vorlage** – sie ist **kein** Wert am Listenelement und **nicht** pro Element überschreibbar. […] Dass `H` (und `art`) im `RenderRequest` **mitreisen** (9.2.2), ist **keine** zweite Quelle: Es ist der beim Einreihen eingefrorene Stand **derselben** Vorlage (9.3.5) – dieselbe Beziehung wie zwischen Aktion und fertigem Segment-PNG.
NAECHSTE: Es ist der beim Einreihen eingefrorene Stand **derselben** Vorlage (9.3.5) – dieselbe Beziehung wie zwischen Aktion und fertigem Segment-PNG.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Nur gerenderte Segment-PNGs reisen über IPC.** Importierte Videos und Bilder liegen bereits kopiert in `media/` (D2) und werden vom Main **direkt per relativem Pfad** gelesen […] – sie gehen **nie** über IPC." (TK 9.1, Punkt 1) - „**PNG-Übergabe als Binärpuffer** (kein Base64 im Nachrichtenkörper)." (TK 9.1, Punkt 3) - 

### #18  [TK, anfuehrung]
ZITAT   : RenderProfile (aktuell fest)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) TK 9.2.4, Tabelle „RenderProfile (aktuell fest)", wörtlich übernommen:

### #18  [TK, anfuehrung]
ZITAT   : Alle Werte gelten identisch für jedes Segment – sonst scheitert die Uniformitäts-Voraussetzung von `-c copy` (9.2.6).
NAECHSTE: **Alle Werte gelten identisch für jedes Segment** – sonst scheitert die Uniformitäts-Voraussetzung von `-c copy` (9.2.6).
KONTEXT : - „**Ausdrücklich verboten** (typische „für mehr Qualität"-Fehlgriffe, die den TV aussperren): 10-Bit-Tiefe, 4:2:2/4:4:4-Abtastung, exotisch hohe Referenzframe-Zahlen, offene GOPs, unbegrenztes CRF ohne VBV-Deckel." (TK 9.2.4) - „Alle Werte gelten identisch für jedes Segment – sonst scheitert die Uniformitäts-Voraussetzung von `-c copy` (9.2.6)." (TK 9.2.4)

### #19  [TK, anfuehrung]
ZITAT   : Bei `fehler` und `abgebrochen` entsteht **keine** neue Ausgabedatei; eine **bereits vorhandene Datei gleichen Namens bleibt unversehrt** (9.2.6). Aufgeräumt sind in beiden Fällen **der Arbeitsbereich T1 *und* die angefangene `<name>.mp4.part` im Ausgabeordner** […] **Der Q3-Protokolleintrag entsteht trotzdem:** Q3 hält *einen Eintrag je beendetem Versuch*, also auch für Fehlschlag und Abbruch (9.3); nur das Feld `ausgabe` bleibt dort `null`.
NAECHSTE: ts vorhandene Datei gleichen Namens bleibt unversehrt** (9.2.6). Aufgeräumt sind in beiden Fällen **der Arbeitsbereich T1 *und* die angefangene `<name>.mp4.part
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Genau **ein** terminaler Ausgang je Lauf, diskriminiert über `status` ∈ { `erfolg`, `fehler`, `abgebrochen` }. Alle drei tragen die `renderId`." (TK 9.2.3) - „| `ausgabeName` | der **tatsächlich verwendete** Ausgabename **ohne Endung** – derselbe Wert, der im `RenderRequest` stand (9.2.1) |" (TK 9.2.3) - „Ohne ihn im Erge

### #19  [TK, anfuehrung]
ZITAT   : **Keine** Restzeit-Schätzung – bei `ffmpeg` unzuverlässig.
NAECHSTE: `prozent` | grober Gesamtfortschritt 0–100 | **Keine** Restzeit-Schätzung – bei `ffmpeg` unzuverlässig, sie würde nur falsche Erwartungen erzeugen. Reine Laufze
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Genau **ein** terminaler Ausgang je Lauf, diskriminiert über `status` ∈ { `erfolg`, `fehler`, `abgebrochen` }. Alle drei tragen die `renderId`." (TK 9.2.3) - „| `ausgabeName` | der **tatsächlich verwendete** Ausgabename **ohne Endung** – derselbe Wert, der im `RenderRequest` stand (9.2.1) |" (TK 9.2.3) - „Ohne ihn im Erge

### #19  [TK, anfuehrung]
ZITAT   : Der Fortschrittskanal trägt **keinen** Endzustand. Erfolg, Fehler und Abbruch kommen **ausschließlich** über das `RenderResult`.
NAECHSTE: h nichts doppelt):** - Der Fortschrittskanal trägt **keinen** Endzustand. Erfolg, Fehler und Abbruch kommen **ausschließlich** über das `RenderResult` (9.2.3). 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Genau **ein** terminaler Ausgang je Lauf, diskriminiert über `status` ∈ { `erfolg`, `fehler`, `abgebrochen` }. Alle drei tragen die `renderId`." (TK 9.2.3) - „| `ausgabeName` | der **tatsächlich verwendete** Ausgabename **ohne Endung** – derselbe Wert, der im `RenderRequest` stand (9.2.1) |" (TK 9.2.3) - „Ohne ihn im Erge

### #19  [TK, anfuehrung]
ZITAT   : **`gesamtdauer`** | Summe der (getrimmten) Elementdauern in Sekunden – **framegerundet** gezählt (Frame-Anzahl / 30, s. 9.2.6)
steht in Issues: [174]
NAECHSTE: lbe Wert, der im `RenderRequest` stand (9.2.1) | | `gesamtdauer` | Summe der (getrimmten) Elementdauern in Sekunden – **framegerundet** gezählt (Frame-Anzahl / 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Genau **ein** terminaler Ausgang je Lauf, diskriminiert über `status` ∈ { `erfolg`, `fehler`, `abgebrochen` }. Alle drei tragen die `renderId`." (TK 9.2.3) - „| `ausgabeName` | der **tatsächlich verwendete** Ausgabename **ohne Endung** – derselbe Wert, der im `RenderRequest` stand (9.2.1) |" (TK 9.2.3) - „Ohne ihn im Erge

### #21  [TK, anfuehrung]
ZITAT   : Konstanten an EINER Stelle
NAECHSTE: - **Konstanten in `contracts/types`** (an *einer* Stelle, nicht verstreut):
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Die Dauer-Grenzen (10–45 s) werden an mindestens drei Stellen gebraucht: `project-store` (`setzeDauer`-Validierung, M1), `composer` (UI-Regler-Grenzen, M5) und `template-canvas` (Standbild-Aushaltedauer, M4). Stünde die `45` an jeder Stelle als Literal, würde eine spätere Änderung des Bereichs (z. B. auf 60 s) mit hoher Wahrscheinlichkeit eine der drei Stel

### #21  [TK, anfuehrung]
ZITAT   : Aktuelle schemaVersion | 1 | wird von öffneProjekt, schreibeProjekt und der Migration // gelesen (9.5.5) – eine Stelle, sonst laufen drei Kopien auseinander
NAECHSTE:  Risiko R-08) | | Aktuelle `schemaVersion` | **1** | wird von `öffneProjekt`, `schreibeProjekt` und der Migration gelesen (9.5.5) – **eine** Stelle, sonst laufe
KONTEXT : ## Signatur (verbindlich – NICHT ändern) ```ts // src/shared/contracts/konstanten.ts export const STANDARD_ANZEIGEDAUER_SEKUNDEN = 10 export const DAUER_BEREICH = { min: 10, max: 45 } as const export const SICHERHEITSABSTAND_PX = { horizontal: 96, vertikal: 54 } as const // Die Schema-Version, auf die `project.json` und `config.json` beim Schreiben gebracht werden. // EINE zentrale Stelle – sie wi

### #21  [TK, anfuehrung]
ZITAT   : Konstanten in `contracts/types` (an *einer* Stelle, nicht verstreut).
steht in Issues: [308, 320]
NAECHSTE: - **Konstanten in `contracts/types`** (an *einer* Stelle, nicht verstreut):
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) ``` | Konstante | Wert | Bezug | |---|---|---| | Standard-Anzeigedauer | 10 s | Vorbelegung für Bild/Segment und Aktion.standardDauer | | Dauer-Bereich | 10–45 s | Validierung in setzeDauer (9.5.2) | | Sicherheitsabstand | 96 / 54 px | im 1920×1080-Rahmen (9.10.5, 9.11.2) | | Format-Whitelist | MP4 / JPG, PNG, WebP | Dialog 

### #22  [TK, anfuehrung]
ZITAT   : Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code.
steht in Issues: [12, 72, 73, 74, 75]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3) - Diese Erweiterung darf die bestehende Signatur aus #12 (`Ergebnis

### #22  [TK, anfuehrung]
ZITAT   : `Ergebnis<T> = { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } }`
steht in Issues: [12, 48]
NAECHSTE: s über die Grenze.** ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` **Struktu
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3) - Diese Erweiterung darf die bestehende Signatur aus #12 (`Ergebnis

### #23  [TK, anfuehrung]
ZITAT   : Fehlerklasse und eigene Felder wie `code` sind verloren – übrig ist Text
NAECHSTE: Datei nicht gefunden ``` **Fehlerklasse und eigene Felder wie `code` sind verloren** – übrig ist Text.
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Dies ist die **einzige** Stelle, an der aus einer Main-seitigen Funktion (die intern durchaus werfen darf) ein IPC-Handler wird, der garantiert die Hülle einhält. Ohne diesen zentralen Wrapper müsste **jedes** der über 50 Main-seitigen Operationen aus M2–M7 selbst ein `try/catch` um sich bauen – mit dem Risiko, dass eine davon es vergisst und eine rohe Exce

### #23  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [61, 71, 76, 77, 93]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen." (TK 9.1.1, Punkt 6) - „**Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code." (TK 9.1.1

### #23  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
steht in Issues: [68, 71, 76, 77, 93]
NAECHSTE: Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen." (TK 9.1.1, Punkt 6) - „**Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code." (TK 9.1.1

### #23  [TK, anfuehrung]
ZITAT   : **Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche.
steht in Issues: [71, 76, 77, 93, 109]
NAECHSTE: as Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche. **9. 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen." (TK 9.1.1, Punkt 6) - „**Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code." (TK 9.1.1

### #23  [TK, anfuehrung]
ZITAT   : `import`, `loeschen`, `render` und `export` werden damit **nicht** als direkte Request/Response- Operationen aufgerufen, sondern über `reiheEin` eingereiht; ihr Fach-Ergebnis (`erfolg`/ `fehlgeschlagen` samt Fachfehlercode) kommt über den Auftrags-Zustand.
steht in Issues: [61, 71]
NAECHSTE:  **nicht** als direkte Request/Response-Operationen aufgerufen, sondern über `reiheEin` eingereiht; ihr Fach-Ergebnis (`erfolg`/`fehlgeschlagen` samt Fachfehler
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen." (TK 9.1.1, Punkt 6) - „**Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code." (TK 9.1.1

### #24  [TK, anfuehrung]
ZITAT   : Ausschreiben statt andeuten. In **allen** Operations-Signaturen von Abschnitt 9 steht die Hülle **explizit** (`→ Ergebnis<Asset>`), nicht nur die Nutzlast. Wer nur seine eigene Tabelle liest, sieht damit sofort die richtige Rückgabe.
NAECHSTE:  In **allen** Operations-Signaturen von Abschnitt 9 steht die Hülle **explizit** (`→ Ergebnis<Asset>`), nicht nur die Nutzlast. Wer nur seine eigene Tabelle lie
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Das Preload darf die Hülle NICHT ‚vereinfachen'." (Übergabe-Prompt 8b, sinngemäß auf `ipc-client` übertragen – dieselbe Regel gilt eine Ebene höher) - „Ausschreiben statt andeuten. In **allen** Operations-Signaturen von Abschnitt 9 steht die Hülle **explizit** (`→ Ergebnis<Asset>`), nicht nur die Nutzlast. Wer nur seine e

### #25  [TK, anfuehrung]
ZITAT   : **Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queue:geaendert`, `render:fortschritt`. Damit erfindet niemand eigene Kanalnamen.
steht in Issues: [65, 71, 77, 93, 109]
NAECHSTE: operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queu
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queue:geaendert`, `render:fortschritt`. Damit erfindet niemand eigene Kanalnamen." (TK 9.1.1, Punkt 4)

### #26  [TK, anfuehrung]
ZITAT   : **Sitzungswiederherstellung (FA-15):** beim Start das zuletzt aktive Projekt laden; **fehlt** es (extern gelöscht) → sanfter Rückfall auf ‚kein aktives Projekt / Projektliste', **kein** Absturz.
NAECHSTE: ` | - **Sitzungswiederherstellung (FA-15):** beim Start das zuletzt aktive Projekt laden; **fehlt** es (extern gelöscht) → sanfter Rückfall auf „kein aktives Pr
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Sitzungswiederherstellung (FA-15):** beim Start das zuletzt aktive Projekt laden; **fehlt** es (extern gelöscht) → sanfter Rückfall auf ‚kein aktives Projekt / Projektliste', **kein** Absturz." (TK 9.5.6) – gilt analog für eine fehlende `config.json` selbst. - „Ist `project.json` beim Laden defekt → aus `.bak` wiederher

### #27  [TK, anfuehrung]
ZITAT   : `Ergebnis<void>` […] das gelungene `ok` **ist** die Information.
NAECHSTE: **`Ergebnis<void>`** – das gelungene `ok` **ist** die Information.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`Ergebnis<void>` […] das gelungene `ok` **ist** die Information." (TK 9.1.1, Punkt 2) - „**Instant-Op vs. Speichern getrennt:** Eine Instant-Operation […] validiert und wendet **im Speicher** an, *bevor* sie ‚ok' meldet – ihr Erfolg bedeutet ‚gültig übernommen', **nicht** ‚schon auf Platte'." (TK 9.5.4, sinngemäß auch für

### #27  [TK, anfuehrung]
ZITAT   : **Instant-Op vs. Speichern getrennt:** Eine Instant-Operation […] validiert und wendet **im Speicher** an, *bevor* sie ‚ok' meldet – ihr Erfolg bedeutet ‚gültig übernommen', **nicht** ‚schon auf Platte'.
NAECHSTE: Speichern getrennt:** Eine Instant-Operation (9.5.2) validiert und wendet **im Speicher** an, *bevor* sie „ok" meldet – ihr Erfolg bedeutet „gültig übernommen", **nicht** „schon auf Platte".
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`Ergebnis<void>` […] das gelungene `ok` **ist** die Information." (TK 9.1.1, Punkt 2) - „**Instant-Op vs. Speichern getrennt:** Eine Instant-Operation […] validiert und wendet **im Speicher** an, *bevor* sie ‚ok' meldet – ihr Erfolg bedeutet ‚gültig übernommen', **nicht** ‚schon auf Platte'." (TK 9.5.4, sinngemäß auch für

### #32  [TK, anfuehrung]
ZITAT   : Referenzprüfung und Entfernen im **selben** kritischen Abschnitt
NAECHSTE: tastet. **Referenzprüfung und Entfernen im selben kritischen Abschnitt** → schließt die TOCTOU-Lücke gegen ein gleichzeitiges Setzen einer neuen Referenz durch 
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Dies ist **das eine** D1-Schreib-Lock, auf dem die gesamte Konsistenzgarantie des Systems ruht: Es schließt die TOCTOU-Lücke zwischen „Referenz prüfen" und „Eintrag entfernen" beim Löschen (TK 9.4.6: „Referenzprüfung und Entfernen im **selben** kritischen Abschnitt"), und es ist der **einzige** Sperr-Mechanismus für D1 (TK 9.3.5 nennt den `auftrags-manager`

### #32  [TK, anfuehrung]
ZITAT   : **[D1-Lock]** Referenzen prüfen. Referenziert (ListItem zeigt darauf)? → Fehler `asset_referenziert` (mit `referenzenIds`), Abbruch. Sonst: Asset-Eintrag aus D1 entfernen, danach **Sofort-Flush** (9.5.4) – erst wenn der Eintrag **dauerhaft** weg ist, darf Schritt 2 die Datei anfassen […] Scheitert der Flush → `speicher_fehler`, die Datei bleibt unangetastet. **Referenzprüfung und Entfernen im selben kritischen Abschnitt** → schließt die TOCTOU-Lücke gegen ein gleichzeitiges Setzen einer neuen Referenz durch den `composer`.
NAECHSTE: **Referenzprüfung und Entfernen im selben kritischen Abschnitt** → schließt die TOCTOU-Lücke gegen ein gleichzeitiges Setzen einer neuen Referenz durch den `composer`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Besitzt `project.json` je Projekt … und das **eine D1-Schreib-Lock**." (TK 9.5.1) - „**[D1-Lock]** Referenzen prüfen. Referenziert (ListItem zeigt darauf)? → Fehler `asset_referenziert` (mit `referenzenIds`), Abbruch. Sonst: Asset-Eintrag aus D1 entfernen, danach **Sofort-Flush** (9.5.4) – erst wenn der Eintrag **dauerhaf

### #32  [TK, anfuehrung]
ZITAT   : Das **D1-Schreib-Lock** ist ein **prozessinternes** Lock.
NAECHSTE: - **Genau eine App-Instanz (Voraussetzung für das ganze Lock-Design):** Das D1-Schreib-Lock ist ein **prozessinternes** Lock.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Besitzt `project.json` je Projekt … und das **eine D1-Schreib-Lock**." (TK 9.5.1) - „**[D1-Lock]** Referenzen prüfen. Referenziert (ListItem zeigt darauf)? → Fehler `asset_referenziert` (mit `referenzenIds`), Abbruch. Sonst: Asset-Eintrag aus D1 entfernen, danach **Sofort-Flush** (9.5.4) – erst wenn der Eintrag **dauerhaf

### #33  [TK, anfuehrung]
ZITAT   : Jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner
steht in Issues: [328]
NAECHSTE: nventionen Aus den Entscheidungen 1 + 3 folgt: jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner; Listenelemente verweisen **relativ** dorthin
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`)" (TK 9.5.2) - „**[D1-Lock]**" – läuft über `mitD1Lock` (#32). - „Jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner" (TK 6) – `erstelleProjekt` legt auch den leeren `media/`-Unterordner an. - **Ordnerpfad `projects/<pr

### #33  [TK, anfuehrung]
ZITAT   : **FA-22**: Vorbelegung des Render-Zielnamens; **null = noch nie gerendert**
NAECHSTE: Vorbelegung des Render-Zielnamens;
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`)" (TK 9.5.2) - „**[D1-Lock]**" – läuft über `mitD1Lock` (#32). - „Jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner" (TK 6) – `erstelleProjekt` legt auch den leeren `media/`-Unterordner an. - **Ordnerpfad `projects/<pr

### #34  [TK, anfuehrung]
ZITAT   : **Ein Backup:** `project.json.bak` = letzte heile Version. Ist `project.json` beim Laden defekt → aus `.bak` wiederherstellen; ist auch das defekt → **Fehler melden**, **nicht** leer/ verlustbehaftet weiterstarten.
NAECHSTE: . - **Ein Backup:** `project.json.bak` = letzte heile Version. Ist `project.json` beim Laden defekt → aus `.bak` wiederherstellen; ist auch das defekt → **Fehle
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`öffneProjekt` | `id` → `Ergebnis<Projekt>` (lädt in den Speicher; setzt aktives Projekt via `config-store`)" (TK 9.5.2) - „**Ein Backup:** `project.json.bak` = letzte heile Version. Ist `project.json` beim Laden defekt → aus `.bak` wiederherstellen; ist auch das defekt → **Fehler melden**, **nicht** leer/ verlustbehaftet

### #34  [TK, anfuehrung]
ZITAT   : Das **aktive** Projekt lebt zur Laufzeit **im Speicher**.
steht in Issues: [48]
NAECHSTE: Vorlagen-Ref) und das **eine D1-Schreib-Lock**. - Das **aktive** Projekt lebt zur Laufzeit **im Speicher** (Quelle der Wahrheit während der Sitzung; Lesezugriff
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`öffneProjekt` | `id` → `Ergebnis<Projekt>` (lädt in den Speicher; setzt aktives Projekt via `config-store`)" (TK 9.5.2) - „**Ein Backup:** `project.json.bak` = letzte heile Version. Ist `project.json` beim Laden defekt → aus `.bak` wiederherstellen; ist auch das defekt → **Fehler melden**, **nicht** leer/ verlustbehaftet

### #35  [TK, anfuehrung]
ZITAT   : **Operationen (Instant, über das D1-Lock)**
NAECHSTE: - Führt alle **Instant-Operationen** aus (nicht über die Queue):
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „| `listeProjekte` | – → `Ergebnis<ProjektMeta[]>` (id, name, erstelltAm, geaendertAm, ordner, **beschaedigt**) – listet **auch** Projekte mit defekter `project.json`, gekennzeichnet statt weggelassen (s. u.) |" (TK 9.5.2) - „Die **Projekt-Liste** (FA-10) sind leichte Metadaten (Name, Erstell-/Änderungsdatum, Ordner, **Ken

### #35  [TK, anfuehrung]
ZITAT   : ` anzahlMedien: number // Dateien in media/ – aus dem ORDNER gezählt, nicht aus project.json`
NAECHSTE: number // Dateien in media/ – aus dem ORDNER gezählt, nicht aus project.json anzahlAusgaben:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „| `listeProjekte` | – → `Ergebnis<ProjektMeta[]>` (id, name, erstelltAm, geaendertAm, ordner, **beschaedigt**) – listet **auch** Projekte mit defekter `project.json`, gekennzeichnet statt weggelassen (s. u.) |" (TK 9.5.2) - „Die **Projekt-Liste** (FA-10) sind leichte Metadaten (Name, Erstell-/Änderungsdatum, Ordner, **Ken

### #35  [TK, anfuehrung]
ZITAT   : `beschaedigt: boolean // true = weder project.json noch project.json.bak lesbar`
NAECHSTE: boolean // true = weder project.json noch project.json.bak lesbar anzahlMedien:
KONTEXT : - **Reihenfolge der Quellen je Ordner:** erst `project.json`; ist sie unlesbar oder ungültig, dann `project.json.bak` (die letzte heile Version, TK 9.5.4). Gelingt eine der beiden, ist `beschaedigt: false`, und die Metadaten stammen aus der gelesenen Datei. Erst wenn **beide** scheitern, ist `beschaedigt: true` – so schreibt es die Felddefinition selbst: „`beschaedigt: boolean // true = weder proj

### #37  [TK, anfuehrung]
ZITAT   : **fehlt** es (extern gelöscht) → sanfter Rückfall auf ‚kein aktives Projekt / Projektliste', **kein** Absturz.
steht in Issues: [26]
NAECHSTE: **fehlt** es (extern gelöscht) → sanfter Rückfall auf „kein aktives Projekt / Projektliste", **kein** Absturz.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`löscheProjekt` | `id` → `Ergebnis<void>` (entfernt den Projektordner; war es aktiv, fällt `config-store` sanft zurück – und die Oberfläche leert ihre gemeinsame Projekt-Sicht, 9.7.4)" (TK 9.5.2) - „**fehlt** es (extern gelöscht) → sanfter Rückfall auf ‚kein aktives Projekt / Projektliste', **kein** Absturz." (TK 9.5.6, s

### #37  [TK+AD, anfuehrung]
ZITAT   : `output/` # A: gerenderte MP4s DIESES Projekts
NAECHSTE: gerenderte MP4s DIESES Projekts – mehrere, frei benannt (FA-22) <name>.mp4 # A:
KONTEXT : ## Definition of Done - [ ] `löscheProjekt` entfernt den kompletten Projektordner (`project.json`, `.bak`, `media/`, `output/`, `queue-retry.json`) – `output/` ist der seit FA-22 projektbezogene Ausgabeordner (TK Abschnitt 6: „`output/` # A: gerenderte MP4s DIESES Projekts") und darf beim Entfernen nicht vergessen werden. Ein rekursives Löschen kann an einer noch geöffneten Datei im Ausgabeordner 

### #38  [TK, anfuehrung]
ZITAT   : Titel ist Pflicht: eine Aktion ohne Titel ist nicht speicherbar
NAECHSTE:  gibt **keinen** zweiten Gestaltungs-/Renderpfad. - **Titel ist Pflicht:** eine Aktion ohne Titel ist nicht speicherbar. - **Bild = Referenz, nie Kopie:** die A
KONTEXT : ## Warum das im Gesamtsystem wichtig ist `erstelleAktion` ist der Main-seitige Gegenpart zum `action-editor` (M5) – „Titel ist Pflicht: eine Aktion ohne Titel ist nicht speicherbar" (TK 9.8.4) muss **hier**, im Main, durchgesetzt werden, nicht nur in der Renderer-UI. Verließe sich das System allein auf eine UI-Prüfung, könnte ein Bug im `action-editor` oder ein direkter (fehlerhafter) IPC-Aufruf e

### #38  [TK, anfuehrung]
ZITAT   : Aktionen sind **referenzierbare** Datensätze – mehrere Listenelemente dürfen auf dieselbe Aktion zeigen … Aktions-Bibliothek je Projekt.
NAECHSTE: **Aktionen sind referenzierbare Datensätze** – mehrere Listenelemente dürfen auf dieselbe Aktion zeigen (3a);
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Titel ist Pflicht:** eine Aktion ohne Titel ist nicht speicherbar." (TK 9.8.4) - „**[D1-Lock]**" – läuft über `mitD1Lock`. - „Aktionen sind **referenzierbare** Datensätze – mehrere Listenelemente dürfen auf dieselbe Aktion zeigen … Aktions-Bibliothek je Projekt." (TK 5, Punkt 2)

### #38  [TK, anfuehrung]
ZITAT   : kein aktives Projekt geladen
steht in Issues: [72, 73, 74, 85]
NAECHSTE: kein aktives Projekt / Projektliste", **kein** Absturz. Im Renderer wird dieser 
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - Ob `vorlagenId` gegen die tatsächlich existierende Vorlagen-Bibliothek (`vorlagen-store`, M4) geprüft wird – diese Prüfung würde eine Abhängigkeit von `project-store` (M1) auf `vorlagen-store` (M4) einführen, was der Reihenfolge M1→M4 widerspricht. Vermutlich bleibt die Prüfung hier auf „ist gesetzt und ein String" beschränkt, und eine tiefere Prüfu

### #40  [TK, anfuehrung]
ZITAT   : **Rückgabe:** `löscheAktion` meldet **beide** Wirkungen – `entfernteElementIds` … **und** `geaenderteElementIds`.
NAECHSTE: ste eine Bandspur der Länge 0 bauen. **Rückgabe:** `löscheAktion` meldet **beide** Wirkungen – `entfernteElementIds` (entfernte Listenelemente) **und** `geaende
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Eine Aktion kann an **zwei** Stellen referenziert sein … 1. **Listenelement mit `art: "segment"`**, dessen `ref` die Aktion ist → das Element **ist** diese Aktion und wird **entfernt**. 2. **`einblendung.abschnitte[].aktionRef`** in einem **Video**-Element → die Aktion ist nur **ein Abschnitt** eines rotierenden Bandes. H

### #41  [TK, anfuehrung]
ZITAT   : Die Reihenfolge ist die Array-Reihenfolge von `liste` – es gibt kein separates `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerlich auseinanderlaufen.
NAECHSTE:  **Die Reihenfolge ist die Array-Reihenfolge von `liste`** – es gibt **kein** separates `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerli
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`fügeElementHinzu` | `referenz` (Asset- **oder** Aktions-ID) → `Ergebnis<Listenelement>`" (TK 9.5.2) - Belegung je `art` (TK 9.11.3, Tabelle, wörtlich in #15 zitiert). - „**`standardDauer` ist nur ein Default:** … Beim Platzieren wird `standardDauer` als Startwert übernommen, danach überschreibbar." (TK 9.8.4) - „Die Reih

### #42  [TK, anfuehrung]
ZITAT   : Die Reihenfolge ist die Array-Reihenfolge von `liste` – es gibt **kein** separates `position`-Feld.
steht in Issues: [43, 95]
NAECHSTE: **Die Reihenfolge ist die Array-Reihenfolge – es gibt kein separates Positions-Feld** (9.11.3).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`entferneElement` | `elementId` → `Ergebnis<void>`" (TK 9.5.2) - „Die Reihenfolge ist die Array-Reihenfolge von `liste` – es gibt **kein** separates `position`-Feld." (TK 9.11.3) – das Entfernen darf daher kein Platzhalter-Element hinterlassen, sondern muss den Eintrag echt aus dem Array streichen. - „`fügeElementHinzu` (

### #42  [TK, anfuehrung]
ZITAT   : **Fix-Optionen je Element:** Medium neu verknüpfen/importieren (media-service), durch ein anderes ersetzen (Referenz umsetzen), oder das **Element entfernen** (`entferneElement`, project-store). Es werden ausschließlich bestehende Operationen genutzt.
NAECHSTE: - **Fix-Optionen je Element:** Medium **neu verknüpfen/importieren** (media-service), durch ein **anderes ersetzen** (Referenz umsetzen), oder das **Element entfernen** (`entferneElement`, project-store).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`entferneElement` | `elementId` → `Ergebnis<void>`" (TK 9.5.2) - „Die Reihenfolge ist die Array-Reihenfolge von `liste` – es gibt **kein** separates `position`-Feld." (TK 9.11.3) – das Entfernen darf daher kein Platzhalter-Element hinterlassen, sondern muss den Eintrag echt aus dem Array streichen. - „`fügeElementHinzu` (

### #43  [TK, anfuehrung]
ZITAT   : Reorder/Trim/Dauer werden lokal sofort angezeigt, dann per Instant-Op bestätigt
NAECHSTE: ung & Fehlerbehandlung - **Optimistisch mit Abgleich:** Reorder/Trim/Dauer werden **lokal sofort** angezeigt, dann per Instant-Op bestätigt; der zurückgegebene 
KONTEXT : ## Warum das im Gesamtsystem wichtig ist `ordneNeu` ist die einzige Operation, die die komplette Array-Reihenfolge von `Project.liste` auf einmal ersetzt – genau die Reihenfolge, die laut TK 9.11.3 die **einzige** Ordnungsquelle ist (es gibt kein separates `position`-Feld). Der `composer` bedient dnd-kit **optimistisch**: Er zeigt die neue Reihenfolge sofort an und schickt danach die komplette neu

### #43  [TK, anfuehrung]
ZITAT   : Die Reihenfolge ist die Array-Reihenfolge von `liste` – es gibt **kein** separates `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerlich auseinanderlaufen.
steht in Issues: [95]
NAECHSTE:  **Die Reihenfolge ist die Array-Reihenfolge von `liste`** – es gibt **kein** separates `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerli
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`ordneNeu` | `reihenfolge` (elementIds) → `Ergebnis<void>`" (TK 9.5.2) - „Die Reihenfolge ist die Array-Reihenfolge von `liste` – es gibt **kein** separates `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerlich auseinanderlaufen." (TK 9.11.3) - „Optimistisch mit Abgleich: Reorder/Trim/Dauer werden **l

### #43  [TK, anfuehrung]
ZITAT   : Optimistisch mit Abgleich: Reorder/Trim/Dauer werden **lokal sofort** angezeigt, dann per Instant-Op bestätigt; der zurückgegebene Stand wird abgeglichen (nie dauerhaft driften).
NAECHSTE: ung & Fehlerbehandlung - **Optimistisch mit Abgleich:** Reorder/Trim/Dauer werden **lokal sofort** angezeigt, dann per Instant-Op bestätigt; der zurückgegebene 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`ordneNeu` | `reihenfolge` (elementIds) → `Ergebnis<void>`" (TK 9.5.2) - „Die Reihenfolge ist die Array-Reihenfolge von `liste` – es gibt **kein** separates `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerlich auseinanderlaufen." (TK 9.11.3) - „Optimistisch mit Abgleich: Reorder/Trim/Dauer werden **l

### #44  [TK+AD, anfuehrung]
ZITAT   : Video (FA-14): zwei Griffe (Anfang/Ende) innerhalb der **Quelllänge** des Videos. Kürzen schneidet Anfang/Ende weg; Verlängern ist **nur bis zur Quelllänge** möglich (mehr Material existiert nicht).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`setzeTrim` | `elementId`, `trimStart`, `trimEnde` → `Ergebnis<Listenelement>` (validiert `0 ≤ start < ende ≤ Videodauer`)" (TK 9.5.2) - „`video` | `Asset` (typ `video`) | `null` – die Dauer ergibt sich aus dem Trim | gesetzt | erlaubt" (TK 9.11.3, Belegungstabelle) – `dauer` bleibt bei `art: "video"` immer `null`, unabhä

### #45  [TK, anfuehrung]
ZITAT   : Konstanten in `contracts/types` (an *einer* Stelle, nicht verstreut):
NAECHSTE: - **Konstanten in `contracts/types`** (an *einer* Stelle, nicht verstreut):
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`setzeDauer` | `elementId`, `dauer` → `Ergebnis<Listenelement>` (validiert Bereich **10–45 s** für Bild/Segment)" (TK 9.5.2) - „`video` | `Asset` (typ `video`) | `null` – die Dauer ergibt sich aus dem Trim | gesetzt | erlaubt" (TK 9.11.3, Belegungstabelle) – ein Video-Element hat **kein** setzbares `dauer`-Feld; ein Aufru

### #46  [TK, anfuehrung]
ZITAT   : Nicht selbst entscheiden
steht in Issues: [1, 2, 3, 4, 5]
NAECHSTE: Der Torwächter selbst darf ihn **nicht** auslösen:
KONTEXT : ## Fehlerpfade (vollständig) | Situation | Code | Verhalten | |---|---|---| | I/O-Fehler beim Kopieren nach `.bak` (vor dem eigentlichen Schreiben) | `speicher_fehler` | Verhalten (Abbruch vs. trotzdem schreiben mit veraltetem Backup) nicht durch TK 9.5.4 festgelegt, s. „Nicht selbst entscheiden" | | I/O-Fehler beim Schreiben von `.tmp` (Platte voll, Rechte) | `speicher_fehler` | `project.json` bl

### #47  [TK, anfuehrung]
ZITAT   : Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle
steht in Issues: [200, 238, 278]
NAECHSTE: **Ereignisse** (Main → Renderer) tragen ebenfalls keine Hülle (Punkt 5).
KONTEXT : ## Signatur (verbindlich – NICHT ändern) ```ts import type { Ergebnis, Fehlercode } from '../../shared/contracts/ergebnis' import type { Project } from '../../shared/contracts/project' export type AutoSpeichernEreignis = | { typ: "gespeichert" } | { typ: "fehler"; code: Fehlercode } // KEINE Ergebnis<T>-Hülle: „Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle" (TK 9.1.1) // Kanalname (an 

### #47  [TK, anfuehrung]
ZITAT   : **Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **unmittelbar bevor ein `render`- oder `export`-Auftrag startet**, (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 verändert hat** (Import, Löschen – s. 9.4.5/9.4.6). Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist (kein Schließen mit ausstehendem Schreiben).
steht in Issues: [3]
NAECHSTE: ** (Import, Löschen – s. 9.4.5/9.4.6). Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist (kein Schließen mit ausstehendem Schreiben).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Entprellt 3–5 s** nach der letzten Änderung (kein Platten-Hämmern beim Slider-Ziehen)." (TK 9.5.4) - „**Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **unmittelbar bevor ein `render`- oder `export`-Auftrag startet**, (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 veränd

### #47  [TK, anfuehrung]
ZITAT   : *Wer Fall 1 auslöst und wann – ausdrücklich festgelegt:* Der **Main** löst ihn aus, und zwar beim Übergang `anstehend` → `laeuft` (9.3.3) – also **unmittelbar vor dem Start**, **nicht** beim Einreihen. *Begründung:* Die Warteschlange ist streng seriell; zwischen Einreihen und Start können **Minuten** liegen, und der Nutzer darf in dieser Zeit weiterarbeiten. Ein Flush beim Einreihen schriebe einen Stand fest, der beim Start längst überholt ist, und verlöre bei einem Absturz genau die Arbeit dazwischen. Dass der **Main** auslöst und nicht der Renderer, spart zudem einen IPC-Kanal […]
NAECHSTE: *Wer Fall 1 auslöst und wann – ausdrücklich festgelegt:* Der **Main** löst ihn aus, und zwar beim Übergang `anstehend` → `laeuft` (9.3.3) – also **unmittelbar vor dem Start**, **nicht** beim Einreihen.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Entprellt 3–5 s** nach der letzten Änderung (kein Platten-Hämmern beim Slider-Ziehen)." (TK 9.5.4) - „**Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **unmittelbar bevor ein `render`- oder `export`-Auftrag startet**, (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 veränd

### #47  [TK, anfuehrung]
ZITAT   : Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle
steht in Issues: [200, 238, 278]
NAECHSTE: **Ereignisse** (Main → Renderer) tragen ebenfalls keine Hülle (Punkt 5).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Entprellt 3–5 s** nach der letzten Änderung (kein Platten-Hämmern beim Slider-Ziehen)." (TK 9.5.4) - „**Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **unmittelbar bevor ein `render`- oder `export`-Auftrag startet**, (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 veränd

### #48  [TK, anfuehrung]
ZITAT   : höhere (unbekannte) Version → Fehler
NAECHSTE: **höhere** (unbekannte) Version → Fehler (nicht raten);
KONTEXT : **Abgrenzung zu #34 (Arbeitsteilung, nicht doppeln):** `öffneProjekt` (#34) entscheidet und prüft **beide** Fälle von 9.5.5 – „höhere (unbekannte) Version → Fehler" **und** „ältere Version → Migration" – und ruft diese Funktion **ausschließlich** dann auf, wenn es die Version bereits eindeutig als **älter** erkannt hat. Diese Funktion prüft deshalb **nicht erneut**, ob die mitgegebene `schemaVersi

### #48  [TK, anfuehrung]
ZITAT   : ältere Version → Migration
NAECHSTE: **ältere** Version → definierte Migration auf die aktuelle.
KONTEXT : **Abgrenzung zu #34 (Arbeitsteilung, nicht doppeln):** `öffneProjekt` (#34) entscheidet und prüft **beide** Fälle von 9.5.5 – „höhere (unbekannte) Version → Fehler" **und** „ältere Version → Migration" – und ruft diese Funktion **ausschließlich** dann auf, wenn es die Version bereits eindeutig als **älter** erkannt hat. Diese Funktion prüft deshalb **nicht erneut**, ob die mitgegebene `schemaVersi

### #48  [TK, anfuehrung]
ZITAT   : `Ergebnis<T> = { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } }`
steht in Issues: [12, 22]
NAECHSTE: s über die Grenze.** ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` **Struktu
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Jede `project.json` und `config.json` trägt eine `schemaVersion`. Beim Laden: **höhere** (unbekannte) Version → Fehler (nicht raten); **ältere** Version → definierte Migration auf die aktuelle. So bleiben ältere Projekte nach App-Updates lesbar." (TK 9.5.5) - Die Ergebnis-Hülle gilt auch hier, obwohl diese Funktion kein e

### #48  [TK, anfuehrung]
ZITAT   : Das **aktive** Projekt lebt zur Laufzeit **im Speicher**.
steht in Issues: [34]
NAECHSTE: Vorlagen-Ref) und das **eine D1-Schreib-Lock**. - Das **aktive** Projekt lebt zur Laufzeit **im Speicher** (Quelle der Wahrheit während der Sitzung; Lesezugriff
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Jede `project.json` und `config.json` trägt eine `schemaVersion`. Beim Laden: **höhere** (unbekannte) Version → Fehler (nicht raten); **ältere** Version → definierte Migration auf die aktuelle. So bleiben ältere Projekte nach App-Updates lesbar." (TK 9.5.5) - Die Ergebnis-Hülle gilt auch hier, obwohl diese Funktion kein e

### #49  [TK, anfuehrung]
ZITAT   : `<uuid>.<ext_kleingeschrieben>` — OHNE Verzeichnisanteil
NAECHSTE: string // "<uuid>.<ext_kleingeschrieben>" — OHNE Verzeichnisanteil originalname:
KONTEXT : ## Eingang → Ausgang | Eingang | Bedeutung | Grenzen/Validierung | |---|---|---| | `projektId` | Projekt-ID (UUID, TK 9.11.3/9.11.4) | nicht leer; wird nur als Pfadsegment verwendet, nie gegen die Platte geprüft (das ist Sache der Aufrufer, z. B. `öffneProjekt`, #34) | | `dateiname` (nur `loeseAssetPfad`) | `Asset.dateiname` — „`<uuid>.<ext_kleingeschrieben>` — OHNE Verzeichnisanteil" (TK 9.4.4) |

### #49  [TK, anfuehrung]
ZITAT   : Der Resolver stellt sicher, dass das Ziel **innerhalb** des `media/`-Ordners des Projekts bleibt (kein `..`-Ausbruch, keine Symlink-Flucht).
steht in Issues: [288]
NAECHSTE: Der Resolver stellt sicher, dass das Ziel **innerhalb** des `media/`-Ordners des Projekts bleibt (kein `..`-Ausbruch, keine Symlink-Flucht);
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**`project-store` ist die eine Pfad-Autorität.** Er löst `(projektId, dateiname) → absoluter Pfad` auf – die **einzige** Quelle der Wahrheit für das Datei-Layout eines Projekts (`projects/<id>/media/<datei>`). Jeder Main-Dienst, der eine Mediendatei anfassen muss, **resolved den Pfad über den `project-store`**, statt das 

### #49  [TK, anfuehrung]
ZITAT   : `dateiname` = `<uuid>.<ext_kleingeschrieben>`, ohne Verzeichnisanteil. Auflösung immer per `path.join(projektMediaDir, dateiname)`. Nie der Originalname, nie ein gespeicherter OS-Pfad mit `\`/`/` — sonst ist das Projekt nicht zwischen Windows und macOS portabel.
NAECHSTE: ösung immer per `path.join(projektMediaDir, dateiname)`. Nie der Originalname, nie ein gespeicherter OS-Pfad mit `\`/`/` — sonst ist das Projekt nicht zwischen 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**`project-store` ist die eine Pfad-Autorität.** Er löst `(projektId, dateiname) → absoluter Pfad` auf – die **einzige** Quelle der Wahrheit für das Datei-Layout eines Projekts (`projects/<id>/media/<datei>`). Jeder Main-Dienst, der eine Mediendatei anfassen muss, **resolved den Pfad über den `project-store`**, statt das 

### #50  [TK, anfuehrung]
ZITAT   : registriert der Main ein eigenes Protokoll `media://<projektId>/<dateiname>`
steht in Issues: [290]
NAECHSTE: *Renderer** Medien anzeigen. Dafür registriert der Main ein eigenes Protokoll **`media://<projektId>/<dateiname>`**, dessen Handler die Auflösung des `project-s
KONTEXT : ## Eingang → Ausgang | Eingang | Bedeutung | Grenzen/Validierung | |---|---|---| | `request.url` | Anfrage-URL im Schema **`media://<projektId>/<dateiname>`** (TK 9.5.7: „registriert der Main ein eigenes Protokoll `media://<projektId>/<dateiname>`") | muss exakt diesem Schema entsprechen (Host = `projektId`, Pfad = `dateiname`); alles andere ist eine ungültige Anfrage | | `request.method` | HTTP-a

### #51  [TK, anfuehrung]
ZITAT   : (Einzel-Instanz, hier nur die Fenster-Seite)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Reicht Electrons eingebautes `app.requestSingleInstanceLock()` allein aus – oder braucht es zusätzlich eine eigene, datenort-gebundene Sperre?** Das ist der Kern dieses Issues und darf **nicht** geraten werden: - `app.requestSingleInstanceLock()` ist laut Electron-Dokumentation an die **Anwendung** gebunden (intern über den `userData`-Pfad der Chr

### #52  [TK, anfuehrung]
ZITAT   : Der Sicherheitsabstand [...] gilt absolut im 1920×1080-Rahmen (96 px horizontal, 54 px vertikal, 9.10.5).
NAECHSTE: **Sicherheitsabstand ist eine Eigenschaft des Bildrahmens, nicht der Vorlagenfläche.** Er gilt absolut im 1920×1080-Rahmen (96 px horizontal, 54 px vertikal, 9.10.5).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) ``` Marke { farben: { <FarbRolle>: string } // Hex, 6- oder 8-stellig (8 = mit Alpha) schriften: { <SchriftRolle>: Schrift } logo: { datei, seitenverhaeltnis } // Balken ist im Asset enthalten sicherheit: { horizontal: 96, vertikal: 54 } // absolute px im 1920×1080-RAHMEN radien: { pille: 40, karte: 10, klein: 2 } schatten: 

### #53  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [58, 69, 76, 77, 79]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : JournalEintrag { // Q4 – eine Zeile je Bewegung zeit: string // ISO-8601 UTC auftragId: string bewegung: "eingereiht" | "gestartet" | "entfernt" | "erneut_eingereiht" position: number | null // Platz in der Schlange, wo sinnvoll } ``` - „**Q3 protokolliert nur, was tatsächlich gelaufen ist.** Ein Auftrag, der die Schlange nie verlassen hat, erzeugt **keinen** Protokolleintrag – es gibt nichts zu b

### #53  [TK, anfuehrung]
ZITAT   : **Es gibt bewusst *kein* Feld `historieEintrag`.** Der Q3-Protokolleintrag wird **allein von der Auftragsverwaltung** gebaut (9.3) – sie besitzt ohnehin `auftragId`, `art`, `projektId`, `versuch`, `begonnenAm` und `beendetAm`. Der `render-service` liefert nur, was **nur er** weiß: Pfad, Größe, Gesamtdauer und den verwendeten Ausgabenamen; aus den ersten dreien wird `ProtokollEintrag.ausgabe`.
steht in Issues: [68]
NAECHSTE: **Es gibt bewusst *kein* Feld `historieEintrag`.** Der Q3-Protokolleintrag wird **allein von der Auftragsverwaltung** gebaut (9.3) – sie besitzt ohnehin `auftragId`, `art`, `projektId`, `versuch`, `begonnenAm` und `beendetAm`.
KONTEXT : JournalEintrag { // Q4 – eine Zeile je Bewegung zeit: string // ISO-8601 UTC auftragId: string bewegung: "eingereiht" | "gestartet" | "entfernt" | "erneut_eingereiht" position: number | null // Platz in der Schlange, wo sinnvoll } ``` - „**Q3 protokolliert nur, was tatsächlich gelaufen ist.** Ein Auftrag, der die Schlange nie verlassen hat, erzeugt **keinen** Protokolleintrag – es gibt nichts zu b

### #56  [TK, anfuehrung]
ZITAT   : ab 10 000 Einträgen die ältesten weg
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Keine Reaktion auf den eigenen Fehler.** Diese Funktion meldet einen Schreibfehler über die Ergebnis-Hülle und hört dort auf: kein Verändern eines Auftragszustands, kein Ereignis, keine Anzeige in der Warteschlangen-Leiste, kein eigener Wiederholversuch. Was daraus folgt, gehört dem Aufrufer (#70). - **Keine Leseoperation nach außen und kein IPC-K

### #57  [TK, anfuehrung]
ZITAT   : **Bewegungen** der Schlange (eingereiht/gestartet/ entfernt/erneut eingereiht)
NAECHSTE: die **Bewegungen** der Schlange (eingereiht, gestartet, entfernt, erneut eingereiht).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Q4 laut Speicher-Tabelle (TK 9.3): Inhalt „**Bewegungen** der Schlange (eingereiht/gestartet/ entfernt/erneut eingereiht)", Persistenz „**dauerhaft, rotierend** (letzte N)", Ort „`warteschlangen-journal.json` (app-weit)", Begründung „rein **diagnostisch** („warum lief das nie?"); getrennt von Q3, damit das Protokoll lesbar

### #58  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 69, 76, 77, 79]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**`fehlgeschlagen`/`abgebrochen`/`erfolg`** sind terminal. `fehlgeschlagen` ist über `wiederhole` reaktivierbar; der **selbe** Eintrag wird wieder `anstehend` und **ans Ende** gestellt (kein neuer Eintrag)." (TK 9.3.3) - „**`anstehend` → `laeuft`:** nur wenn **kein** anderer Auftrag `laeuft` (serielle Invariante). Auswahl

### #59  [TK, anfuehrung]
ZITAT   : **Render friert seinen Eingang beim Einreihen ein:** die geordnete Liste + Profil des `RenderRequest` werden **zum Einreih-Zeitpunkt** als Snapshot genommen. Spätere Listenänderungen betreffen einen bereits eingereihten Render **nicht**.
steht in Issues: [60]
NAECHSTE: nreihen ein:** die geordnete Liste + Profil des `RenderRequest` werden **zum Einreih-Zeitpunkt** als Snapshot genommen. Spätere Listenänderungen betreffen einen
KONTEXT : - „**Seriell:** höchstens **ein** Auftrag in `laeuft`. Das ist der einzige Sperr-Mechanismus des Systems; ein zweites Lock ist nicht nötig und darf nicht eingeführt werden." (TK 9.3.5) - „**FIFO** unter `anstehend`; `wiederhole` hängt hinten an." (TK 9.3.5) - „**`anstehend` → `laeuft`:** nur wenn **kein** anderer Auftrag `laeuft` (serielle Invariante). Auswahl in FIFO-Reihenfolge." (TK 9.3.3) - „*

### #60  [TK, anfuehrung]
ZITAT   : wie ging der Vorgang aus
NAECHSTE: **Dazu seit v3.11 ein weiterer Vorgang:
KONTEXT : `HandlerErgebnis` ist **nicht** die Ergebnis-Hülle und darf nicht mit ihr verwechselt werden: Es ist das **Auftrags-Ergebnis** („wie ging der Vorgang aus"), nicht das **Aufruf-Ergebnis** („hat der Aufruf geklappt"). TK 9.1.1 trennt beides ausdrücklich; das Auftrags-Ergebnis reist über den Auftrags-Zustand, nicht als `Ergebnis<T>`.

### #60  [TK, anfuehrung]
ZITAT   : hat der Aufruf geklappt
NAECHSTE: Ab v3.4 braucht jeder Aufrufer eine `markeId`.
KONTEXT : `HandlerErgebnis` ist **nicht** die Ergebnis-Hülle und darf nicht mit ihr verwechselt werden: Es ist das **Auftrags-Ergebnis** („wie ging der Vorgang aus"), nicht das **Aufruf-Ergebnis** („hat der Aufruf geklappt"). TK 9.1.1 trennt beides ausdrücklich; das Auftrags-Ergebnis reist über den Auftrags-Zustand, nicht als `Ergebnis<T>`.

### #60  [TK, anfuehrung]
ZITAT   : **Zwei Ebenen nicht verwechseln.** … **Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert … **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3).
steht in Issues: [61, 71]
NAECHSTE: reiht", „Trim gesetzt")? - **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sonder
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Zuordnung Art → Dienst laut TK 9.3.2: `import` → `media-service` (`ImportRequest`), `loeschen` → `media-service` (`LöschRequest`), `render` → `render-service` (`RenderRequest`), `export` → `export-service` (`ExportRequest`). Diese Datei kennt **keinen** dieser Dienste beim Namen – sie kennt nur die vier Arten und die einge

### #60  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [68, 71, 85, 87, 88]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Zuordnung Art → Dienst laut TK 9.3.2: `import` → `media-service` (`ImportRequest`), `loeschen` → `media-service` (`LöschRequest`), `render` → `render-service` (`RenderRequest`), `export` → `export-service` (`ExportRequest`). Diese Datei kennt **keinen** dieser Dienste beim Namen – sie kennt nur die vier Arten und die einge

### #60  [TK, anfuehrung]
ZITAT   : **Render friert seinen Eingang beim Einreihen ein:** die geordnete Liste + Profil des `RenderRequest` werden **zum Einreih-Zeitpunkt** als Snapshot genommen. Spätere Listenänderungen betreffen einen bereits eingereihten Render **nicht**.
steht in Issues: [59]
NAECHSTE: nreihen ein:** die geordnete Liste + Profil des `RenderRequest` werden **zum Einreih-Zeitpunkt** als Snapshot genommen. Spätere Listenänderungen betreffen einen
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Zuordnung Art → Dienst laut TK 9.3.2: `import` → `media-service` (`ImportRequest`), `loeschen` → `media-service` (`LöschRequest`), `render` → `render-service` (`RenderRequest`), `export` → `export-service` (`ExportRequest`). Diese Datei kennt **keinen** dieser Dienste beim Namen – sie kennt nur die vier Arten und die einge

### #61  [TK, anfuehrung]
ZITAT   : `reiheEin(art, payload) → Ergebnis<{ auftragId }> // kehrt SOFORT zurück; sagt nichts über den Ausgang
steht in Issues: [134]
NAECHSTE: reiheEin(art, payload) → Ergebnis<{ auftragId }> // kehrt SOFORT zurück; sagt nichts über den Ausgang entferne(auftragId) → Ergebnis<void> // anstehend: aus Sch
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Begründung aus demselben Abschnitt: Renderer und Main sind „**getrennte Prozesse**"; ein `throw` über die Grenze verliert Fehlerklasse und Code – „**Fehle

### #61  [TK, anfuehrung]
ZITAT   : **Zwei Ebenen nicht verwechseln.** … **Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert … **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3).
steht in Issues: [60, 71]
NAECHSTE: reiht", „Trim gesetzt")? - **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sonder
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Begründung aus demselben Abschnitt: Renderer und Main sind „**getrennte Prozesse**"; ein `throw` über die Grenze verliert Fehlerklasse und Code – „**Fehle

### #61  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 71, 76, 77, 93]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Begründung aus demselben Abschnitt: Renderer und Main sind „**getrennte Prozesse**"; ein `throw` über die Grenze verliert Fehlerklasse und Code – „**Fehle

### #61  [TK, anfuehrung]
ZITAT   : `import`, `loeschen`, `render` und `export` werden damit **nicht** als direkte Request/Response- Operationen aufgerufen, sondern über `reiheEin` eingereiht; ihr Fach-Ergebnis (`erfolg`/ `fehlgeschlagen` samt Fachfehlercode) kommt über den Auftrags-Zustand.
steht in Issues: [23, 71]
NAECHSTE:  **nicht** als direkte Request/Response-Operationen aufgerufen, sondern über `reiheEin` eingereiht; ihr Fach-Ergebnis (`erfolg`/`fehlgeschlagen` samt Fachfehler
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Begründung aus demselben Abschnitt: Renderer und Main sind „**getrennte Prozesse**"; ein `throw` über die Grenze verliert Fehlerklasse und Code – „**Fehle

### #62  [TK, anfuehrung]
ZITAT   : `entferne(auftragId) → Ergebnis<void> // anstehend: aus Schlange nehmen; laeuft+render: Abbruch (→ cancelRender)
steht in Issues: [209]
NAECHSTE: chts über den Ausgang entferne(auftragId) → Ergebnis<void> // anstehend: aus Schlange nehmen; laeuft+render: Abbruch (→ cancelRender) wiederhole(auftragId) → Er
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Niemals eine Exception über die Prozessgrenze werfen; nie Meldungstexte vergleichen – nur `code`. - „`entferne(auftragId) → Ergebnis<void> // anstehend: a

### #63  [TK, anfuehrung]
ZITAT   : `wiederhole(auftragId) → Ergebnis<void> // fehlgeschlagen → anstehend, ans Ende (versuche steigt erst beim Start, 9.3.3)
steht in Issues: [210]
NAECHSTE: lange nehmen; laeuft+render: Abbruch (→ cancelRender) wiederhole(auftragId) → Ergebnis<void> // fehlgeschlagen → anstehend, ans Ende (versuche steigt erst beim 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Niemals eine Exception über die Prozessgrenze werfen; nie Meldungstexte vergleichen – nur `code`. - „`wiederhole(auftragId) → Ergebnis<void> // fehlgeschl

### #64  [TK, anfuehrung]
ZITAT   : `holeStand() → Ergebnis<Auftrag[]> // Snapshot für die UI (z. B. beim Öffnen des Panels)
NAECHSTE: Start, 9.3.3) holeStand() → Ergebnis<Auftrag[]> // Snapshot für die UI (z. B. beim Öffnen des Panels) ``` ``` QueueGeändert(Auftrag[]) // Main → Renderer: Push 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Niemals eine Exception über die Prozessgrenze werfen; nie Meldungstexte vergleichen – nur `code`. - „`holeStand() → Ergebnis<Auftrag[]> // Snapshot für di

### #65  [TK, anfuehrung]
ZITAT   : **Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand.
steht in Issues: [71]
NAECHSTE: n Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand. **6. Der M
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand." (TK 9.1.1, Punkt 5) - „**Ereignisse** (Main → Renderer) tragen ebenfalls keine Hülle (Punkt 5)." (TK 9.1.1, Punkt 2) - „`Qu

### #65  [TK, anfuehrung]
ZITAT   : `QueueGeändert(Auftrag[]) // Main → Renderer: Push bei jeder Zustandsänderung → speist das queue-panel
steht in Issues: [71, 151]
NAECHSTE: im Öffnen des Panels) ``` ``` QueueGeändert(Auftrag[]) // Main → Renderer: Push bei jeder Zustandsänderung → speist das queue-panel // Ereignis: OHNE Hülle und 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand." (TK 9.1.1, Punkt 5) - „**Ereignisse** (Main → Renderer) tragen ebenfalls keine Hülle (Punkt 5)." (TK 9.1.1, Punkt 2) - „`Qu

### #65  [TK, anfuehrung]
ZITAT   : **Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queue:geaendert`, `render:fortschritt`. Damit erfindet niemand eigene Kanalnamen.
steht in Issues: [25, 71, 77, 93, 109]
NAECHSTE: operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queu
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand." (TK 9.1.1, Punkt 5) - „**Ereignisse** (Main → Renderer) tragen ebenfalls keine Hülle (Punkt 5)." (TK 9.1.1, Punkt 2) - „`Qu

### #65  [TK, anfuehrung]
ZITAT   : **Zwei Ebenen nicht verwechseln.** … **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3).
steht in Issues: [60, 61, 71]
NAECHSTE: reiht", „Trim gesetzt")? - **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sonder
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand." (TK 9.1.1, Punkt 5) - „**Ereignisse** (Main → Renderer) tragen ebenfalls keine Hülle (Punkt 5)." (TK 9.1.1, Punkt 2) - „`Qu

### #66  [TK, anfuehrung]
ZITAT   : nur wenn die Datei offensichtlich frei ist
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **`q2-wiederholung.ts` (#55) nicht anfassen.** `aenderePendingDeletions` wird dort gebaut, nicht hier; aus diesem Issue heraus ist die Datei eine **fremde** Datei (Regel E). Keine zusätzliche Funktion dort erfinden, keine bestehende umschreiben – das kollidiert mit dem Agenten von #55. Fehlt die Funktion beim Bauen, ist das eine Reihenfolge-Frage, k

### #68  [TK, anfuehrung]
ZITAT   : Der **Ausgabename** reist dabei **nur** in `Auftrag.ergebnis` […] In `ProtokollEintrag.ausgabe` steht er **nicht** – er ist dort bereits Teil des Pfades.
steht in Issues: [70]
NAECHSTE: In `ProtokollEintrag.ausgabe` steht er **nicht** – er ist dort bereits Teil des Pfades.
KONTEXT : 1. **Handler für `art: 'render'`** über `registriereAuftragsHandler('render', handler, brichAb)` in der Handler-Registry (#60) eintragen. Beim Start eines `render`-Auftrags ruft er `renderReel(auftrag.payload, aufFortschritt)` auf – **ausschließlich** mit `auftrag.payload`, nie mit frisch aus dem Projekt geholten Daten (Snapshot, TK 9.3.5). 2. **Fortschritt abbilden:** `RenderProgress.prozent` → `

### #68  [TK, anfuehrung]
ZITAT   : **Es gibt bewusst *kein* Feld `historieEintrag`.** Der Q3-Protokolleintrag wird **allein von der Auftragsverwaltung** gebaut (9.3) – sie besitzt ohnehin `auftragId`, `art`, `projektId`, `versuch`, `begonnenAm` und `beendetAm`. Der `render-service` liefert nur, was **nur er** weiß: Pfad, Größe, Gesamtdauer und den verwendeten Ausgabenamen; aus den ersten dreien wird `ProtokollEintrag.ausgabe`.
steht in Issues: [53]
NAECHSTE: **Es gibt bewusst *kein* Feld `historieEintrag`.** Der Q3-Protokolleintrag wird **allein von der Auftragsverwaltung** gebaut (9.3) – sie besitzt ohnehin `auftragId`, `art`, `projektId`, `versuch`, `begonnenAm` und `beendetAm`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Ein `render`-Auftrag führt beim Start intern `renderReel(payload)` aus – **nach** dem Sofort-Flush von D1 (9.5.4). `RenderProgress.prozent` (Kanal `render:fortschritt`, 9.2.7) speist `Auftrag.fortschritt`; `RenderResult` bestimmt den terminalen Auftrags-`status` (erfolg/fehlgeschlagen/abgebrochen) und liefert bei Erfolg d

### #68  [TK, anfuehrung]
ZITAT   : **Die betroffene Element-ID erreicht die Oberfläche über die strukturierten Fehlerdaten.** `RenderResult.fehlerhaftesElementId` ist Modul-intern; beim Abschluss des Auftrags übernimmt die Auftragsverwaltung `fehlercode` → `Auftrag.fehler.code`, `meldung` → `Auftrag.fehler.meldung` und `fehlerhaftesElementId` → **`Auftrag.fehler.daten = { elementId }`** (9.1.1, 9.3.1). Ohne diesen Weg käme die ID **nie** beim Nutzer an […] Die Form von `daten` ist damit **je Fehlercode festgelegt**: `{ elementId: string }` bei `medium_fehlt` und `ungueltiges_element`, sonst nicht gesetzt.
NAECHSTE: beim Abschluss des Auftrags übernimmt die Auftragsverwaltung `fehlercode` → `Auftrag.fehler.code`, `meldung` → `Auftrag.fehler.meldung` und `fehlerhaftesElementId` → **`Auftrag.fehler.daten = { elementId }`** (9.1.1, 9.3.1).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Ein `render`-Auftrag führt beim Start intern `renderReel(payload)` aus – **nach** dem Sofort-Flush von D1 (9.5.4). `RenderProgress.prozent` (Kanal `render:fortschritt`, 9.2.7) speist `Auftrag.fortschritt`; `RenderResult` bestimmt den terminalen Auftrags-`status` (erfolg/fehlgeschlagen/abgebrochen) und liefert bei Erfolg d

### #68  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 71, 85, 87, 88]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Ein `render`-Auftrag führt beim Start intern `renderReel(payload)` aus – **nach** dem Sofort-Flush von D1 (9.5.4). `RenderProgress.prozent` (Kanal `render:fortschritt`, 9.2.7) speist `Auftrag.fortschritt`; `RenderResult` bestimmt den terminalen Auftrags-`status` (erfolg/fehlgeschlagen/abgebrochen) und liefert bei Erfolg d

### #68  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [71, 76, 77, 93, 103]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Ein `render`-Auftrag führt beim Start intern `renderReel(payload)` aus – **nach** dem Sofort-Flush von D1 (9.5.4). `RenderProgress.prozent` (Kanal `render:fortschritt`, 9.2.7) speist `Auftrag.fortschritt`; `RenderResult` bestimmt den terminalen Auftrags-`status` (erfolg/fehlgeschlagen/abgebrochen) und liefert bei Erfolg d

### #69  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 58, 76, 77, 79]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Lock-Grenze:** Das D1-Lock schützt **nur** `project.json`. Die Auftragsverwaltungs-Speicher Q2/Q3 (eigene Dateien, 9.3) haben ihre **eigene** Serialisierung – der `auftrags-manager` hängt **nicht** am `project-store`-Lock." (TK 9.5.4) – **diese** Funktion *ist* die eigene Serialisierung. Sie ruft **kein** `mitD1Lock` au

### #70  [TK, anfuehrung]
ZITAT   : Der **Ausgabename** reist dabei **nur** in `Auftrag.ergebnis` […] In `ProtokollEintrag.ausgabe` steht er **nicht** – er ist dort bereits Teil des Pfades.
steht in Issues: [68]
NAECHSTE: In `ProtokollEintrag.ausgabe` steht er **nicht** – er ist dort bereits Teil des Pfades.
KONTEXT : - **`ausgabeName` geht NICHT ins Protokoll (TK v3.2).** Das Render-Ergebnis trägt seit TK v3.2 als vierte Nutzdate den verwendeten Ausgabenamen (#68); `ProtokollEintrag.ausgabe` bekommt dafür **kein** Feld. „Der **Ausgabename** reist dabei **nur** in `Auftrag.ergebnis` […] In `ProtokollEintrag.ausgabe` steht er **nicht** – er ist dort bereits Teil des Pfades." (TK 9.3.6) **Praktische Folge für die

### #70  [TK, anfuehrung]
ZITAT   : **`ausgabe.gesamtdauer` darf `null` sein – und ist es beim Export immer.** Ein `render` kennt die Spieldauer der erzeugten Datei (framegerundet, 9.2.6); ein `export` kopiert nur eine fertige Datei und kennt sie **nicht** – er müsste sie eigens mit `ffprobe` ermitteln, ohne dass jemand den Wert braucht. Deshalb ein **nullbares Feld** statt zweier Formen von `ausgabe` […] **`pfad` ist beim `render` die erzeugte Ausgabedatei, beim `export` die Zieldatei auf dem Stick** (`zielPfad` + Dateiname, 9.6.1) – in beiden Fällen die Datei, die dieser Versuch hervorgebracht hat.
NAECHSTE: **`pfad` ist beim `render` die erzeugte Ausgabedatei, beim `export` die Zieldatei auf dem Stick** (`zielPfad` + Dateiname, 9.6.1) – in beiden Fällen die Datei, die dieser Versuch hervorgebracht hat.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Q3-Datensatz laut TK 9.3 – **so und nicht anders** zu befüllen: ``` ProtokollEintrag { // Q3 – ein Eintrag je BEENDETEM Versuch id: string // UUID auftragId: string // derselbe Auftrag kann mehrere Einträge haben (Wiederholungen) art: "import" | "loeschen" | "render" | "export" projektId: string versuch: number // 1, 2, 3 

### #71  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 61, 76, 77, 93]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #71  [TK, anfuehrung]
ZITAT   : **Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queue:geaendert`, `render:fortschritt`. Damit erfindet niemand eigene Kanalnamen.
steht in Issues: [25, 65, 77, 93, 109]
NAECHSTE: operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queu
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #71  [TK, anfuehrung]
ZITAT   : **Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand.
steht in Issues: [65]
NAECHSTE: n Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand. **6. Der M
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #71  [TK, anfuehrung]
ZITAT   : `QueueGeändert(Auftrag[]) // Main → Renderer: Push bei jeder Zustandsänderung → speist das queue-panel
steht in Issues: [65, 151]
NAECHSTE: im Öffnen des Panels) ``` ``` QueueGeändert(Auftrag[]) // Main → Renderer: Push bei jeder Zustandsänderung → speist das queue-panel // Ereignis: OHNE Hülle und 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #71  [TK, anfuehrung]
ZITAT   : **Zwei Ebenen nicht verwechseln.** … **Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert … **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3).
steht in Issues: [60, 61]
NAECHSTE: reiht", „Trim gesetzt")? - **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sonder
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #71  [TK, anfuehrung]
ZITAT   : `import`, `loeschen`, `render` und `export` werden damit **nicht** als direkte Request/Response- Operationen aufgerufen, sondern über `reiheEin` eingereiht; ihr Fach-Ergebnis (`erfolg`/ `fehlgeschlagen` samt Fachfehlercode) kommt über den Auftrags-Zustand.
steht in Issues: [23, 61]
NAECHSTE:  **nicht** als direkte Request/Response-Operationen aufgerufen, sondern über `reiheEin` eingereiht; ihr Fach-Ergebnis (`erfolg`/`fehlgeschlagen` samt Fachfehler
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #71  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 68, 85, 87, 88]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #71  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [68, 76, 77, 93, 103]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #71  [TK, anfuehrung]
ZITAT   : **Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche.
steht in Issues: [23, 76, 77, 93, 109]
NAECHSTE: as Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche. **9. 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #71  [TK, anfuehrung]
ZITAT   : zuletzt benutztes Fenster
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Daraus folgt für diese Datei: **kein** `BrowserWindow.getAllWindows()`, **keine** Schleife über Fenster, **kein** `getFocusedWindow()`, **keine** Empfängerliste und **kein** Merker „zuletzt benutztes Fenster". Es gibt genau einen Empfänger, und es ist keine Auswahl zu treffen. *Begründung (TK 9.1.1 Punkt 10):* „Die erste Stufe ist **ein Studio, ein Bildschirm, ein Laptop** (Anforderungsdokument, A

### #72  [TK, anfuehrung]
ZITAT   : **Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **unmittelbar bevor ein `render`- oder `export`-Auftrag startet**, (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 verändert hat** (Import, Löschen – s. 9.4.5/9.4.6).
steht in Issues: [3, 47, 73, 87]
NAECHSTE: **Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **als erster Schritt im `render`- bzw. `export`-Handler**, bevor dieser die eigentliche Arbeit aufnimmt (9.3.3 – nicht im Torwächter, dessen Auswahl- und Statuswechsel-Abschnitt kein `await` enthalten darf), (2) **bei** Projektwechsel, (3) **bei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**`media-service` besitzt:** den Dateizugriff auf D2 (kopieren, löschen), das `ffprobe`-Auslesen beim Import, den nativen Datei-Dialog (weil der Formatfilter zum Dienst gehört) sowie den Reconcile beim Projektstart (9.4.7). Alle D1-Schreibvorgänge delegiert er an den `project-store` (dessen einziges Schreib-Lock, 9.3.5)."

### #72  [TK, anfuehrung]
ZITAT   : Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code.
steht in Issues: [12, 22, 73, 74, 75]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : Fehlercodes werden **nicht erfunden**: „Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3) Der einzige fachliche Code dieser Funktion ist `speicher_fehler` aus der Union `ProjectStoreFehlercode`,

### #73  [TK, anfuehrung]
ZITAT   : **Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **unmittelbar bevor ein `render`- oder `export`-Auftrag startet**, (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 verändert hat** (Import, Löschen – s. 9.4.5/9.4.6).
steht in Issues: [3, 47, 72, 87]
NAECHSTE: **Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **als erster Schritt im `render`- bzw. `export`-Handler**, bevor dieser die eigentliche Arbeit aufnimmt (9.3.3 – nicht im Torwächter, dessen Auswahl- und Statuswechsel-Abschnitt kein `await` enthalten darf), (2) **bei** Projektwechsel, (3) **bei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**[D1-Lock]** Referenzen prüfen. Referenziert (ListItem zeigt darauf)? → Fehler `asset_referenziert` (mit `referenzenIds`), Abbruch. Sonst: Asset-Eintrag aus D1 entfernen, danach **Sofort-Flush** (9.5.4) – erst wenn der Eintrag **dauerhaft** weg ist, darf Schritt 2 die Datei anfassen; sonst wäre „D1 zuerst" nur im Arbeits

### #73  [TK, anfuehrung]
ZITAT   : die Datei bleibt unangetastet, **weil Schritt 1 nie abgeschlossen wurde**
NAECHSTE:  Entfernen des Eintrags (Platte voll, Rechte) – die Datei bleibt unangetastet, weil Schritt 1 nie abgeschlossen wurde | --- ### 9.5 Schnittstellen `project-stor
KONTEXT : **ENTSCHIEDEN – scheitert der Flush, wird das Entfernen zurückgenommen.** Liefert `sofortFlush` `ok: false`, setzt diese Funktion den entfernten Eintrag **an seiner ursprünglichen Stelle** in `Project.assets` wieder ein (gleiche Position, gleiche Reihenfolge der übrigen Assets) und meldet `speicher_fehler`. Begründung: TK 9.4.9 sagt für genau diesen Code „die Datei bleibt unangetastet, **weil Schr

### #73  [TK, anfuehrung]
ZITAT   : die Änderungen bleiben im Speicher (kein Rollback, kein Arbeitsverlust)
NAECHSTE: die Änderungen **bleiben im Speicher** (kein Rollback, kein Arbeitsverlust).
KONTEXT : **ENTSCHIEDEN – scheitert der Flush, wird das Entfernen zurückgenommen.** Liefert `sofortFlush` `ok: false`, setzt diese Funktion den entfernten Eintrag **an seiner ursprünglichen Stelle** in `Project.assets` wieder ein (gleiche Position, gleiche Reihenfolge der übrigen Assets) und meldet `speicher_fehler`. Begründung: TK 9.4.9 sagt für genau diesen Code „die Datei bleibt unangetastet, **weil Schr

### #73  [TK, anfuehrung]
ZITAT   : Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code.
steht in Issues: [12, 22, 72, 74, 75]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : Fehlercodes werden **nicht erfunden**: „Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3) Die beiden operationseigenen Codes stehen bereits **inline** in der Signatur, der dritte (`speicher_fehl

### #73  [TK, anfuehrung]
ZITAT   : `bildRef`: string | null // Referenz auf eine Asset-ID (NICHT eingebettet)
NAECHSTE: string | null // Referenz auf eine Asset-ID (NICHT eingebettet) cta:
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ECHTE OFFENE FRAGE: Zählt `Aktion.bildRef` als Referenz?** TK 9.4.6 und TK 9.4.9 nennen ausschließlich das ListItem („ein ListItem zeigt noch darauf"). Eine **Aktion** hält aber ebenfalls eine Asset-ID: „`bildRef`: string | null // Referenz auf eine Asset-ID (NICHT eingebettet)" (TK 9.8.2). Wird ein Asset entfernt, auf das nur eine Aktion zeigt, b

### #74  [TK, anfuehrung]
ZITAT   : Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code.
steht in Issues: [12, 22, 72, 73, 75]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : Fehlercodes werden **nicht erfunden**: „Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3)

### #74  [TK, anfuehrung]
ZITAT   : (1) **unmittelbar bevor ein `render`- oder `export`-Auftrag startet**, (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 verändert hat**
steht in Issues: [3, 47, 72, 73, 87]
NAECHSTE: - und Statuswechsel-Abschnitt kein `await` enthalten darf), (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 verändert hat
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – kein zweiter, exportierter Zugriff auf das geladene Projekt.** Innerhalb des `project-store` braucht es keinen: Diese Funktion arbeitet auf dem **modul-internen** Zustand, den `öffneProjekt` (#34) beim Laden gefüllt hat – wie jede andere `project-store`-Operation auch. Lege **keine** exportierte Zugriffsfunktion an (kein `holeAktivesProje

### #75  [TK, anfuehrung]
ZITAT   : **`geaendertAm` ist der Renderzeitpunkt, nicht das Protokoll.** Die Datei wird als `<name>.mp4.part` **im Ausgabeordner selbst** geschrieben und bekommt erst nach der Verifikation ihren endgültigen Namen (Rename-mit-Ersetzen im selben Ordner, 9.2.6). […] **Q3 ist NICHT die Quelle dieser Liste** – Q3 ist Historie und Nachweis (auch der Fehlschläge), die Ausgabe-Liste zeigt den **Ist-Bestand** des Ordners.
NAECHSTE: - **`geaendertAm` ist der Renderzeitpunkt, nicht das Protokoll.** Die Datei wird als `<name>.mp4.part` **im Ausgabeordner selbst** geschrieben und bekommt erst nach der Verifikation ihren endgültigen Namen (Rename-mit-Ersetzen im selben Ordner, 9.2.6).
KONTEXT : AusgabeDatei { dateiname: string // MIT Endung, z. B. "sommeraktion.mp4" dateigroesse: number // Bytes geaendertAm: string // ISO-8601 UTC – zugleich der Renderzeitpunkt (die Datei entsteht atomar, 9.2.6) } ``` - „**`geaendertAm` ist der Renderzeitpunkt, nicht das Protokoll.** Die Datei wird als `<name>.mp4.part` **im Ausgabeordner selbst** geschrieben und bekommt erst nach der Verifikation ihren 

### #75  [TK, anfuehrung]
ZITAT   : Gelistet werden **ausschließlich fertige `.mp4`-Dateien**; Arbeitsdateien (`.part`, Temporäres) bleiben unsichtbar. […] Fehlt der Ordner (noch nie gerendert), ist das Ergebnis eine **leere Liste**, **kein** Fehler.
NAECHSTE: Lock. - Gelistet werden **ausschließlich fertige `.mp4`-Dateien**; Arbeitsdateien (`.part`, Temporäres) bleiben unsichtbar. **Das ist bindend, nicht kosmetisch:
KONTEXT : AusgabeDatei { dateiname: string // MIT Endung, z. B. "sommeraktion.mp4" dateigroesse: number // Bytes geaendertAm: string // ISO-8601 UTC – zugleich der Renderzeitpunkt (die Datei entsteht atomar, 9.2.6) } ``` - „**`geaendertAm` ist der Renderzeitpunkt, nicht das Protokoll.** Die Datei wird als `<name>.mp4.part` **im Ausgabeordner selbst** geschrieben und bekommt erst nach der Verifikation ihren 

### #75  [TK, anfuehrung]
ZITAT   : Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code.
steht in Issues: [12, 22, 72, 73, 74]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : Fehlercodes werden **nicht erfunden**: „Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3)

### #76  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 61, 71, 77, 93]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #76  [TK, anfuehrung]
ZITAT   : **Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`.
steht in Issues: [25, 65, 71, 77, 93]
NAECHSTE: *Eine rohe Exception-Meldung wird nie zum Code.** **4. Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:lösch
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #76  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [68, 71, 77, 93, 103]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #76  [TK, anfuehrung]
ZITAT   : **Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche.
steht in Issues: [23, 71, 77, 93, 109]
NAECHSTE: as Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche. **9. 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #76  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 58, 69, 77, 79]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #77  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 61, 71, 76, 93]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die fünf Operationen, wörtlich (TK 9.5.6) – diese Datei bildet genau sie ab, nicht mehr: ``` | `leseKonfig` | – → `Ergebnis<AppKonfig>` | | `setzeAktivesProjekt` | `projektId` → `Ergebnis<void>` | | `setzeExportZiel` | `pfad` → `Ergebnis<void>` | | `leseMarke` | – → `Ergebnis<Marke>` (**nur lesend**) | | `setzeUIVoreinstel

### #77  [TK, anfuehrung]
ZITAT   : **Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queue:geaendert`, `render:fortschritt`. Damit erfindet niemand eigene Kanalnamen.
steht in Issues: [25, 65, 71, 93, 109]
NAECHSTE: operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queu
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die fünf Operationen, wörtlich (TK 9.5.6) – diese Datei bildet genau sie ab, nicht mehr: ``` | `leseKonfig` | – → `Ergebnis<AppKonfig>` | | `setzeAktivesProjekt` | `projektId` → `Ergebnis<void>` | | `setzeExportZiel` | `pfad` → `Ergebnis<void>` | | `leseMarke` | – → `Ergebnis<Marke>` (**nur lesend**) | | `setzeUIVoreinstel

### #77  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [68, 71, 76, 93, 103]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die fünf Operationen, wörtlich (TK 9.5.6) – diese Datei bildet genau sie ab, nicht mehr: ``` | `leseKonfig` | – → `Ergebnis<AppKonfig>` | | `setzeAktivesProjekt` | `projektId` → `Ergebnis<void>` | | `setzeExportZiel` | `pfad` → `Ergebnis<void>` | | `leseMarke` | – → `Ergebnis<Marke>` (**nur lesend**) | | `setzeUIVoreinstel

### #77  [TK, anfuehrung]
ZITAT   : **Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche.
steht in Issues: [23, 71, 76, 93, 109]
NAECHSTE: as Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche. **9. 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die fünf Operationen, wörtlich (TK 9.5.6) – diese Datei bildet genau sie ab, nicht mehr: ``` | `leseKonfig` | – → `Ergebnis<AppKonfig>` | | `setzeAktivesProjekt` | `projektId` → `Ergebnis<void>` | | `setzeExportZiel` | `pfad` → `Ergebnis<void>` | | `leseMarke` | – → `Ergebnis<Marke>` (**nur lesend**) | | `setzeUIVoreinstel

### #77  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 58, 69, 76, 79]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die fünf Operationen, wörtlich (TK 9.5.6) – diese Datei bildet genau sie ab, nicht mehr: ``` | `leseKonfig` | – → `Ergebnis<AppKonfig>` | | `setzeAktivesProjekt` | `projektId` → `Ergebnis<void>` | | `setzeExportZiel` | `pfad` → `Ergebnis<void>` | | `leseMarke` | – → `Ergebnis<Marke>` (**nur lesend**) | | `setzeUIVoreinstel

### #77  [TK, anfuehrung]
ZITAT   : bevor die UI Medien zeigt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keine Schutzprüfung an `config:setzeAktivesProjekt`.** Der Kanal wird registriert und reicht durch, mehr nicht. Baue **keine** Regel der Art „nur erlauben, wenn dieses Projekt geladen ist" ein, keine Existenzprüfung, keinen Abgleich mit dem `project-store`. Diese Datei enthält keine Fachlogik, und eine hier versteckte Regel fände später n

### #78  [TK, anfuehrung]
ZITAT   : ENTSCHIEDEN – der Importpfad in `auftrag.ts`
steht in Issues: [156]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Modul & Datei - Modul: `contracts/types` (geteilt) - Datei: `src/shared/contracts/medien-request.ts` - Zweite erlaubte Datei: **genau eine Zeile** in `src/shared/contracts/auftrag.ts` (#16) – die Importzeile, die die beiden hier definierten Typen dort verfügbar macht (s. „ENTSCHIEDEN – der Importpfad in `auftrag.ts`" unten). Sonst nichts an dieser Datei. - Vertrag: Technisches Konzept **9.4.3**

### #78  [AD, anfuehrung]
ZITAT   : Forward-Referenzen auf Typen aus den jeweiligen Fach-Issues
steht in Issues: [16]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **ENTSCHIEDEN – der Importpfad in `auftrag.ts` gehört zu diesem Issue.** #16 nennt `ImportRequest`/`LöschRequest` als „Forward-Referenzen auf Typen aus den jeweiligen Fach-Issues", legt aber **keinen** Importpfad fest – und ohne ihn bleibt `auftrag.ts` nach dem Anlegen dieser Datei **nicht übersetzbar**. Diese Zeile darf keine andere Datei setzen: Sie zeigt auf `medien-request.ts`, und die entsteh

### #78  [TK, anfuehrung]
ZITAT   : ist die Nutzlast überhaupt wohlgeformt?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Die Fehlerbehandlung zu diesen Nutzlasten liegt woanders und wird hier **nicht** vorweggenommen: Die Prüfung „ist die Nutzlast überhaupt wohlgeformt?" macht die IPC-Validierung beim Einreihen (`ungueltige_eingabe`, TK 9.1.1 Punkt 6); die fachlichen Fehler (`datei_nicht_gefunden`, `asset_nicht_gefunden`, …) liegen in #79.

### #79  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 58, 69, 76, 77]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3) - „Bei uns hängt an den Codes **echtes Verhalten**: `asset_

### #79  [TK, anfuehrung]
ZITAT   : je Fehlercode festgelegt und typisiert (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1)
steht in Issues: [97]
NAECHSTE: seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3) - „Bei uns hängt an den Codes **echtes Verhalten**: `asset_

### #82  [TK, anfuehrung]
ZITAT   : ich lege das schon mal im ffmpeg-adapter an
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**ffprobe/ffmpeg-Argumente nie per String-Konkatenation, immer als Argument-Array.** Windows-Pfade enthalten regelmäßig Leerzeichen; ein zusammengebautes Kommando bricht dort und funktioniert auf macOS scheinbar." (TK 9.4.8, Punkt 2) → Konkret verboten: `exec`, `spawn` mit `shell: true`, Template-Strings mit dem Pfad dari

### #85  [TK, anfuehrung]
ZITAT   : Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**.
steht in Issues: [87, 97, 100, 101, 102]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : | # | Schritt | Aufruf | Warum genau hier | |---|---|---|---| | 0 | Nutzlast prüfen | – | `projektId` und `quellPfad` nicht leer, beides Zeichenketten. „Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**." (TK 9.1.1, Punkt 6). Fehlschlag → `ungueltige_eingabe`, **ohne jede Wirkung** | | 1 | Format prüfen | `pruefeFormat(auftrag.payload.quellPfad)` (#80) | **Vor** dem 

### #85  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 68, 71, 87, 88]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Der Ablauf laut TK 9.4.5, vollständig: 1. „Quelle → `media/.staging/<uuid>.<ext>.part` kopieren *(langsam, **außerhalb** des D1-Locks)*." 2. „`ffprobe` auf die `.part`-Datei, **mit Timeout** *(außerhalb des Locks)*." 3. „`fs.rename` `.part` → `media/<uuid>.<ext>` — **atomar**, weil gleiche Partition (Staging liegt in `medi

### #85  [TK, anfuehrung]
ZITAT   : Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten.
steht in Issues: [97, 100, 101, 102, 284]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Der Ablauf laut TK 9.4.5, vollständig: 1. „Quelle → `media/.staging/<uuid>.<ext>.part` kopieren *(langsam, **außerhalb** des D1-Locks)*." 2. „`ffprobe` auf die `.part`-Datei, **mit Timeout** *(außerhalb des Locks)*." 3. „`fs.rename` `.part` → `media/<uuid>.<ext>` — **atomar**, weil gleiche Partition (Staging liegt in `medi

### #85  [TK, anfuehrung]
ZITAT   : schon mal auf 1920×1080 bringt
NAECHSTE: 54 } // absolute px im 1920×1080-RAHMEN radien:
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – für den fertigen `Asset` keinen zweiten Transportweg bauen.** Er reist im Feld `ergebnis` des `HandlerErgebnis` (s. „Eingang → Ausgang") und von dort über den Auftrags-Zustand. Also: **kein** eigener IPC-Kanal, **kein** eigenes Ereignis `media:assetHinzugefuegt`, **kein** direkter Push an den Renderer, **kein zusätzliches Feld** in `Handl

### #86  [TK, anfuehrung]
ZITAT   : **Windows:** gesperrte Datei → `EBUSY`/`EPERM`. **macOS:** `unlink` gelingt still, obwohl noch geöffnet. Beide Fälle **explizit** behandeln.
steht in Issues: [172, 187]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`fs.unlink` der Datei *(außerhalb des Locks)*, auf Windows mit **Retry + Backoff** bei `EBUSY`/`EPERM` (Handle der Vorschau hängt evtl. Millisekunden nach; der Render-Fall ist durch die serielle Queue bereits ausgeschlossen)." (TK 9.4.6, Schritt 2) - „Schlägt `unlink` endgültig fehl → **`dateiname`** (ohne Verzeichnisante

### #87  [TK, anfuehrung]
ZITAT   : Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**.
steht in Issues: [85, 97, 100, 101, 102]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : | # | Schritt | Aufruf | Warum genau hier | |---|---|---|---| | 0 | Nutzlast prüfen | – | `projektId` und `assetId` nicht leer, beides Zeichenketten. „Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**." (TK 9.1.1, Punkt 6). Fehlschlag → `ungueltige_eingabe`, **ohne jede Wirkung** | | 1 | **D1 zuerst:** Referenzprüfung **und** Entfernen, danach **Sofort-Flush** | `ent

### #87  [TK, anfuehrung]
ZITAT   : **Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **unmittelbar bevor ein `render`- oder `export`-Auftrag startet**, (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 verändert hat** (Import, Löschen – s. 9.4.5/9.4.6).
steht in Issues: [3, 47, 72, 73]
NAECHSTE: **Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **als erster Schritt im `render`- bzw. `export`-Handler**, bevor dieser die eigentliche Arbeit aufnimmt (9.3.3 – nicht im Torwächter, dessen Auswahl- und Statuswechsel-Abschnitt kein `await` enthalten darf), (2) **bei** Projektwechsel, (3) **bei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - **DIE Invariante dieses Issues, TK 9.4.6:** „**Bewusster Trade-off (D1 zuerst):** Referenz-Konsistenz ist **immer** garantiert (nie zeigt ein ListItem auf eine gelöschte Datei = nie ein kaputter Render). Preis: bei fehlgeschlagenem `unlink` liegt kurzzeitig eine Datei **ohne** D1-Eintrag auf der Platte (Speicher erst nach 

### #87  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 68, 71, 85, 88]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - **DIE Invariante dieses Issues, TK 9.4.6:** „**Bewusster Trade-off (D1 zuerst):** Referenz-Konsistenz ist **immer** garantiert (nie zeigt ein ListItem auf eine gelöschte Datei = nie ein kaputter Render). Preis: bei fehlgeschlagenem `unlink` liegt kurzzeitig eine Datei **ohne** D1-Eintrag auf der Platte (Speicher erst nach 

### #87  [TK, anfuehrung]
ZITAT   : unverändert durchreichen – **kein** Umschreiben, **kein** Vereinheitlichen
steht in Issues: [60, 71, 76, 77, 93]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Festlegungen, die du NICHT neu treffen musst (lokale Entscheidungen, hier bereits getroffen) 1. **Vorgemerkt wird der `dateiname`, nicht der absolute Pfad.** Der Vertrag sagt es selbst: „Schlägt `unlink` endgültig fehl → **`dateiname`** (ohne Verzeichnisanteil, s. 9.4.8 Punkt 1) in `pendingDeletions`" (TK 9.4.6, Schritt 3), und die Schnittstelle `merkePendingDeletion(projektId, dateiname)` (#66

### #88  [TK, anfuehrung]
ZITAT   : **ohne** Verzeichnisanteil
steht in Issues: [61, 66, 72, 84, 85]
NAECHSTE: Schlägt `unlink` endgültig fehl → **`dateiname`** (ohne Verzeichnisanteil, s.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Datei in `media/` ohne D1-Eintrag** (Crash-/`unlink`-Waise, `.part`-Leiche) → löschen, Speicher zurück." (TK 9.4.7) – das ist der ganze Auftrag dieser Datei, wörtlich. - „Crash vor 3 → nur eine `.part`-Leiche; Crash nach 3 vor 4 → eine fertige Waise ohne D1-Eintrag. Beides räumt der Reconcile (9.4.7) auf." (TK 9.4.5) – 

### #88  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 68, 71, 85, 87]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : Fehlercodes werden **nicht erfunden:** „**Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3). Diese Datei benutzt ausschließlich die generischen Codes und `ReconcileFehlercode` (#79); die Codes von Import und Löschen (`ImportFehlercode`, `LoeschFehlercode`, ebenfalls #79) gehören zu jenen Operationen und haben hier nicht

### #89  [TK, anfuehrung]
ZITAT   : der `render-service` bricht **früh** ab statt mitten im Lauf
steht in Issues: [74]
NAECHSTE: der `render-service` bricht **früh** mit `medium_fehlt` ab statt mitten im Lauf.
KONTEXT : **Warum diese Datei bei einem D1-Schreibfehler abbricht, #88 bei einem Löschfehler dagegen nicht:** Dort ging es um Speicherplatz, hier geht es um **Konsistenz**. Läuft das Markieren nach einem Schreibfehler einfach weiter, entsteht ein Datenbestand, in dem ein Teil der Medien korrekt rot ist und ein anderer Teil unauffällig aussieht, obwohl er fehlt – und genau das Versprechen „der `render-servic

### #89  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 68, 71, 85, 87]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : Fehlercodes werden **nicht erfunden:** „**Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3).

### #89  [TK+AD, anfuehrung]
ZITAT   : vielleicht liegt sie ja im Downloads-Ordner
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Keine eigene Fehlercode-Union in dieser Datei.** Der Rückgabetyp ist `Ergebnis<{ markiert: number }, ReconcileFehlercode>`, und `ReconcileFehlercode` steht in `fehlercodes.ts` (#79) – dort und nur dort. Kein zusätzlicher Code, kein `as`-Cast, kein `@ts-expect-error`, keine Erweiterung der fremden Datei (Regel E). Fehlt dort ein Code, den diese Dat

### #90  [TK, anfuehrung]
ZITAT   : gehört diese Datei noch zu einem Asset?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Der Auftrag dieser Datei, wörtlich: „**`pendingDeletions` aus Q2** (`projects/<id>/queue-retry.json`) → jetzt nachholen. Q2 liegt **pro Projekt**, weil ausstehende Löschungen zum Projekt gehören und mit ihm verschwinden (9.3)." (TK 9.4.7) - Woher die Einträge stammen: „Schlägt `unlink` endgültig fehl → **`dateiname`** (ohn

### #90  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 68, 71, 85, 87]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : Fehlercodes werden **nicht erfunden:** „**Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3).

### #90  [TK, anfuehrung]
ZITAT   : damit es im `queue-panel` sichtbar wird
NAECHSTE: Für den Nutzer ist das über das `queue-panel` sichtbar.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Hier entsteht kein Auftrag.** Kein `reiheEin`, kein `Auftrag`-Objekt, keine Verbindung zur Warteschlange, auch nicht „damit es im `queue-panel` sichtbar wird". Die Begründung steht oben wörtlich in den Invarianten (TK 9.3, Punkt 3) und ist der Kern dieses Issues: Ein erneut eingereihter `loeschen`-Auftrag scheiterte **deterministisch** mit `asset_

### #91  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 68, 71, 85, 87]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : Fehlercodes werden **nicht erfunden** und **nicht umgeschrieben:** „**Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3). Was aus einem Schritt kommt, kommt unverändert heraus.

### #91  [TK, anfuehrung]
ZITAT   : nach dem Import nochmal kurz aufräumen
NAECHSTE: ein Import wäre unsichtbar geblieben.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Die Asset-Liste nicht selbst beschaffen.** Sie kommt als Parameter herein (entschieden, s. Invarianten). Verboten ist deshalb: - `öffneProjekt(projektId)` aufrufen – das lädt neu, setzt über den `config-store` erneut das aktive Projekt und macht aus einem Aufräumlauf einen zweiten Ladevorgang mit eigenem `.bak`-Fallback; - `project.json` selbst le

### #91  [TK, anfuehrung]
ZITAT   : schnelle Variante ohne Schritt 2
NAECHSTE: die Lösch-Invariante unten).
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Die Asset-Liste nicht selbst beschaffen.** Sie kommt als Parameter herein (entschieden, s. Invarianten). Verboten ist deshalb: - `öffneProjekt(projektId)` aufrufen – das lädt neu, setzt über den `config-store` erneut das aktive Projekt und macht aus einem Aufräumlauf einen zweiten Ladevorgang mit eigenem `.bak`-Fallback; - `project.json` selbst le

### #92  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 58, 69, 76, 77]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Zuordnung laut Tabelle TK 9.3.2 (Spalten `art` / ausführender Dienst / Nutzlast): `import` → `media-service` (9.4) → `ImportRequest`; `loeschen` → `media-service` (9.4) → `LöschRequest`. Diese Datei trägt genau diese zwei Arten ein – **keine** dritte, **keine** für `render` oder `export`. - „`import`, `loeschen`, `rend

### #93  [TK, anfuehrung]
ZITAT   : **Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queue:geaendert`, `render:fortschritt`. Damit erfindet niemand eigene Kanalnamen.
steht in Issues: [25, 65, 71, 77, 109]
NAECHSTE: operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queu
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operation, wörtlich (TK 9.4.3): ``` öffneMedienDialog() → Ergebnis<{ pfade: string[] }> // Instant ``` und dazu die Tabelle: „Nutzer wählt Dateien | `pfade` = Array absoluter Quellpfade" · „Nutzer bricht ab | `ok: true` mit `pfade = []` – Abbruch ist **kein** Fehler". Diese Datei macht aus einem Abbruch also **niemals*

### #93  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operation, wörtlich (TK 9.4.3): ``` öffneMedienDialog() → Ergebnis<{ pfade: string[] }> // Instant ``` und dazu die Tabelle: „Nutzer wählt Dateien | `pfade` = Array absoluter Quellpfade" · „Nutzer bricht ab | `ok: true` mit `pfade = []` – Abbruch ist **kein** Fehler". Diese Datei macht aus einem Abbruch also **niemals*

### #93  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [68, 71, 76, 77, 103]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operation, wörtlich (TK 9.4.3): ``` öffneMedienDialog() → Ergebnis<{ pfade: string[] }> // Instant ``` und dazu die Tabelle: „Nutzer wählt Dateien | `pfade` = Array absoluter Quellpfade" · „Nutzer bricht ab | `ok: true` mit `pfade = []` – Abbruch ist **kein** Fehler". Diese Datei macht aus einem Abbruch also **niemals*

### #93  [TK, anfuehrung]
ZITAT   : **Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche.
steht in Issues: [23, 71, 76, 77, 109]
NAECHSTE: as Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche. **9. 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operation, wörtlich (TK 9.4.3): ``` öffneMedienDialog() → Ergebnis<{ pfade: string[] }> // Instant ``` und dazu die Tabelle: „Nutzer wählt Dateien | `pfade` = Array absoluter Quellpfade" · „Nutzer bricht ab | `ok: true` mit `pfade = []` – Abbruch ist **kein** Fehler". Diese Datei macht aus einem Abbruch also **niemals*

### #93  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 68, 71, 85, 87]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : Fehlercodes werden **nicht erfunden**: „**Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3)

### #95  [TK, anfuehrung]
ZITAT   : Die Reihenfolge ist die Array-Reihenfolge von `liste` – es gibt **kein** separates `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerlich auseinanderlaufen.
steht in Issues: [43]
NAECHSTE:  **Die Reihenfolge ist die Array-Reihenfolge von `liste`** – es gibt **kein** separates `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerli
KONTEXT : Und: „Alle `rahmen`-Werte einer Zone beziehen sich auf die Fläche **ihrer** Vorlagenart. Die Arten sind **nicht** austauschbar: `composer` und `action-editor` bieten jeweils nur die passende Art an (vollflächig für eigenständige Segmente, `split`/`einblendung` für parallele Bänder)." (TK 9.11.1) **Folge für diesen Typ:** `Rahmen` bekommt **keinen** Hinweis auf 1920×1080; die Bezugsfläche ergibt si

### #96  [AD, anfuehrung]
ZITAT   : den Scrim malen wir fest
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Diese Datei ist der Beweis, dass das Layout **datengetrieben** ist: Wenn die drei mitgelieferten Vorlagen sich vollständig als `Vorlage`-Werte ausdrücken lassen, kann eine eigene Vorlage (FA-13) das auch – „eine eigene Vorlage ist nur ein neuer Datensatz, kein Code-Umbau" (Anforderungsdokument FA-13). Lässt der Agent hier auch nur eine Kleinigkeit als Sonde

### #96  [TK, anfuehrung]
ZITAT   : Hintergründe gehören doch nach hinten
NAECHSTE: `wiederhole` hängt hinten an.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Gemeinsame Basis, wörtlich (TK 9.11.1): - „Raster 1920×1080; Sicherheitsbereich 96/54 → **Inhaltsbox x 96–1824, y 54–1026** (9.10.5)." - „**Logo 420×120**, **oben links** (Seitenverhältnis des Assets ≈ 3,5 : 1; der dunkle Balken ist im Logo-Asset **enthalten** – es braucht keine eigene Hintergrundzone)." - „Die Zone **`hin

### #96  [TK, anfuehrung]
ZITAT   : **Farben und Schriften sind Rollen-Verweise in die `Marke`** […] **keine** Hex-Werte oder Font-Namen.
NAECHSTE: **Farben und Schriften sind Rollen-Verweise in die `Marke`** (z.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Gemeinsame Basis, wörtlich (TK 9.11.1): - „Raster 1920×1080; Sicherheitsbereich 96/54 → **Inhaltsbox x 96–1824, y 54–1026** (9.10.5)." - „**Logo 420×120**, **oben links** (Seitenverhältnis des Assets ≈ 3,5 : 1; der dunkle Balken ist im Logo-Asset **enthalten** – es braucht keine eigene Hintergrundzone)." - „Die Zone **`hin

### #96  [TK, anfuehrung]
ZITAT   : für immer mitgeliefert und unveränderlich
NAECHSTE: `ffprobe` wird ohnehin mitgeliefert (Abschnitt 3).
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – kein Dateizugriff.** Kein `fs`, kein `path`, kein `ermittleDatenOrt()`. Diese Datei ist eine reine Datenquelle; das Anlegen von `vorlagen.json` beim ersten Start gehört zu #98. - **Verbot – keine vierte Vorlage.** Insbesondere **keine** eingebaute Vorlage der Art `"einblendung"`, so plausibel eine solche auch wäre: TK 9.11.1 nennt genau d

### #97  [TK, anfuehrung]
ZITAT   : Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten.
steht in Issues: [85, 100, 101, 102, 284]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : **Warum die generischen Codes die restlichen Fälle abdecken** (damit niemand einen vierten Wert erfindet): Eine unbekannte `id` oder `arbeitsId` ist `nicht_gefunden`. Eine ungültige Nutzlast – `höhe` ausserhalb `> 0` und `< 1080`, eine Zone ausserhalb der Fläche, eine Textzone ohne Text-Parameter, ein Versuch, `art` oder eine feste Zone zu ändern, ein leerer `name` – ist `ungueltige_eingabe`; TK 9

### #97  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 58, 69, 76, 77]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3) - „Bei uns hängt an den Codes **echtes Verhalten**: `asset_

### #97  [TK, anfuehrung]
ZITAT   : je Fehlercode festgelegt und typisiert (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1)
steht in Issues: [79]
NAECHSTE: seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3) - „Bei uns hängt an den Codes **echtes Verhalten**: `asset_

### #97  [TK, anfuehrung]
ZITAT   : an den Codes hängt echtes Verhalten
NAECHSTE: Bei uns hängt an den Codes **echtes Verhalten**:
KONTEXT : **ENTSCHIEDEN – warum `parent_eingebaut` dazugehört, obwohl TK 9.12.1 nur `vorlage_referenziert` namentlich nennt.** Der Vertrag verlangt das Verhalten ausdrücklich: „**`uebernehmeInParent` ist gesperrt, wenn der Parent eingebaut ist.** Eingebaute Vorlagen bleiben unveränderlich (9.11.1.1); dort bleibt nur `alsEigenstaendige`. Der Editor macht das vorher sichtbar, statt beim Speichern zu scheitern

### #98  [TK, anfuehrung]
ZITAT   : Beim Beenden blockiert die App, bis der Schreibvorgang * abgeschlossen ist
NAECHSTE: Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist (kein Schließen mit ausstehendem Schreiben).
KONTEXT : /** * Schreibt einen noch ausstehenden entprellten Stand sofort und bricht den Timer ab. * Steht nichts aus, ist das ein erfolgreicher Leerlauf ({ ok: true }), kein Fehler. * Aufrufer: das Beenden der App (#3) – „Beim Beenden blockiert die App, bis der Schreibvorgang * abgeschlossen ist" (TK 9.5.4). */ export async function flushBestand(): Promise<Ergebnis<void, VorlagenFehlercode>>

### #98  [TK, anfuehrung]
ZITAT   : Nutzlast und Verhalten **gleichartig** zu * `project:autoSpeichernStatus` (9.5.4)
NAECHSTE: Status`**, Nutzlast und Verhalten **gleichartig** zu `project:autoSpeichernStatus` (9.5.4): dauerhafter Hinweis „nicht gespeichert" in der Oberfläche, automatis
KONTEXT : /** * Ereignisform des Speicherstatus dieses Stores. Gleichartig zu `AutoSpeichernEreignis` des * project-store (#47) – TK 9.12.1: „Nutzlast und Verhalten **gleichartig** zu * `project:autoSpeichernStatus` (9.5.4)". KEINE Ergebnis-Huelle: Ereignisse tragen keine * (TK 9.1.1 Punkte 2 und 5). */ export type VorlagenSpeichernEreignis = | { typ: 'gespeichert' } | { typ: 'fehler'; code: VorlagenFehlerc

### #99  [TK, anfuehrung]
ZITAT   : nur Arbeitskopien mit vollständigen Zonen
NAECHSTE: den vollständigen `stand` (Typ `Bearbeitungsstand`, s.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Tabelle, wörtlich (TK 9.12.1): - „`listeVorlagen` | – → `Ergebnis<Vorlage[]>` – **nur nutzbare** (`parent = null`); Arbeitskopien erscheinen hier **nicht**" - „`listeArbeitskopien` | – → `Ergebnis<Vorlage[]>` (`parent ≠ null`) – für „Bearbeitung fortsetzen"" - „**Arbeitskopien (`parent ≠ null`) sind nicht au

### #99  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
steht in Issues: [23, 68, 71, 76, 77]
NAECHSTE: Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Tabelle, wörtlich (TK 9.12.1): - „`listeVorlagen` | – → `Ergebnis<Vorlage[]>` – **nur nutzbare** (`parent = null`); Arbeitskopien erscheinen hier **nicht**" - „`listeArbeitskopien` | – → `Ergebnis<Vorlage[]>` (`parent ≠ null`) – für „Bearbeitung fortsetzen"" - „**Arbeitskopien (`parent ≠ null`) sind nicht au

### #100  [AD, anfuehrung]
ZITAT   : arrangiert nur die **freien Zonen** […] innerhalb des **festen Markenrahmens** (Logo, Sicherheitsabstände)
NAECHSTE: ge arrangiert nur die **freien Zonen** (Position/Größe/Feldzuordnung) innerhalb des **festen Markenrahmens** (Logo, Sicherheitsabstände), der nicht abschaltbar 
KONTEXT : **Der feste Markenrahmen entsteht hier.** FA-11 verlangt ein einheitliches Grundlayout, das „nicht abschaltbar" ist; FA-13 sagt, eine eigene Vorlage „arrangiert nur die **freien Zonen** […] innerhalb des **festen Markenrahmens** (Logo, Sicherheitsabstände)". Legt diese Funktion eine Vorlage **ohne** feste Zonen an, gibt es diesen Rahmen für alle eigenen Vorlagen nicht mehr – und weil der Editor fe

### #100  [TK, anfuehrung]
ZITAT   : Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.12.1): „`erstelleVorlage` | `art`, `höhe?`, `name` → `Ergebnis<Vorlage>` mit `parent = null` (feste Zonen der Art vorbelegt)" - „**`art` ist nach dem Anlegen unveränderlich** – auch über die Arbeitskopie. Ein Wechsel würde alle Zonen-Rahmen ungültig machen (andere Fläche); stattdessen n

### #100  [TK, anfuehrung]
ZITAT   : automatische Umlayouten
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Welche festen Zonen bekommt ein Band, das nicht 162 px hoch ist – und welche eine Vorlage der Art `einblendung`?** Das ist die einzige echte Lücke dieses Issues, und sie hat zwei Teile: 1. **Logo-Geometrie bei beliebiger Bandhöhe.** Die Werte der eingebauten Band-Vorlage (Logo 96, 20, 240, 69) sind auf `höhe = 162` zugeschnitten: „Sicher nutzbar s

### #100  [AD, anfuehrung]
ZITAT   : Standard-Zonen zum Loslegen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Nicht raten, nicht „vorläufig wie beim Band" ausfüllen, keinen Platzhalter einbauen.** Die Antwort bestimmt, wie jede künftige eigene Band-Vorlage aussieht. - **Verbot – die festen Zonen nicht neu hinschreiben.** Sie werden aus `eingebauteVorlagen()` kopiert. Wer die Zahlen hier noch einmal tippt, erzeugt eine zweite Quelle für den Markenrahmen. - **Verbot – keine freien Zonen vorbelegen.** Kein

### #101  [TK, anfuehrung]
ZITAT   : **Alle IDs sind UUIDs** […] **Keine** fortlaufenden Zähler […] **Keine** aus Namen abgeleiteten IDs
NAECHSTE: **Keine** aus Namen abgeleiteten IDs:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.12.1): „`oeffneZurBearbeitung` | `id` → `Ergebnis<Vorlage>` – legt eine **Arbeitskopie** mit `parent = id` an und gibt sie zurück" - „**Höchstens eine Arbeitskopie pro Parent.** Wird eine Vorlage geöffnet, für die bereits eine Arbeitskopie existiert, wird **diese fortgesetzt** statt ein

### #101  [TK, anfuehrung]
ZITAT   : Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten.
steht in Issues: [85, 97, 100, 102, 284]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.12.1): „`oeffneZurBearbeitung` | `id` → `Ergebnis<Vorlage>` – legt eine **Arbeitskopie** mit `parent = id` an und gibt sie zurück" - „**Höchstens eine Arbeitskopie pro Parent.** Wird eine Vorlage geöffnet, für die bereits eine Arbeitskopie existiert, wird **diese fortgesetzt** statt ein

### #102  [TK, anfuehrung]
ZITAT   : vertraut dem Renderer nicht
steht in Issues: [97, 173]
NAECHSTE: Läuft vollständig im Renderer.
KONTEXT : Die zweite Verantwortung ist die **Validierung**. Der Main „vertraut dem Renderer nicht" (TK 9.1.1 Punkt 6). Eine Zone, die halb aus der Fläche ragt, eine Textzone ohne Grössenbereich, eine verschobene feste Zone – all das käme sonst ungeprüft in `vorlagen.json` und würde beim Zeichnen zu einem stillen Fehler: Der Text wird abgeschnitten, das Logo steht falsch, und die Ursache liegt Wochen zurück 

### #102  [TK+AD, anfuehrung]
ZITAT   : **Feste Zonen sind Teil der Vorlage**, nicht hartkodiert […] Der Editor darf Zonen mit `rolle:
NAECHSTE: ehbar. 4. **Feste Zonen sind Teil der Vorlage**, nicht hartkodiert – dadurch bleibt FA-13 ein reiner Datensatz. Der Editor darf Zonen mit `rolle: "fest"` **nich
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.12.1): „`speichereArbeitskopie` | `arbeitsId`, `vorlage` → `Ergebnis<Vorlage>` – **Auto-Speichern** während des Bearbeitens" - „**Auto-Speichern trifft nur die Arbeitskopie.** Während des Bearbeitens wird entprellt gesichert (3–5 s, wie 9.5.4) – aber **ausschließlich** in die Arbeitskop

### #102  [TK, anfuehrung]
ZITAT   : Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten.
steht in Issues: [85, 97, 100, 101, 284]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.12.1): „`speichereArbeitskopie` | `arbeitsId`, `vorlage` → `Ergebnis<Vorlage>` – **Auto-Speichern** während des Bearbeitens" - „**Auto-Speichern trifft nur die Arbeitskopie.** Während des Bearbeitens wird entprellt gesichert (3–5 s, wie 9.5.4) – aber **ausschließlich** in die Arbeitskop

### #103  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 58, 69, 76, 77]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operation, wörtlich (TK 9.12.1, Operationstabelle): ``` | `uebernehmeInParent` | `arbeitsId` → `Ergebnis<Vorlage>` – **mergt** in den Parent, Arbeitskopie verschwindet („überarbeiten") | ``` - „**Merge ist ein vollständiges Ersetzen, kein Feld-Abgleich.** `uebernehmeInParent` schreibt den Stand der Arbeitskopie **kompl

### #103  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [68, 71, 76, 77, 93]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operation, wörtlich (TK 9.12.1, Operationstabelle): ``` | `uebernehmeInParent` | `arbeitsId` → `Ergebnis<Vorlage>` – **mergt** in den Parent, Arbeitskopie verschwindet („überarbeiten") | ``` - „**Merge ist ein vollständiges Ersetzen, kein Feld-Abgleich.** `uebernehmeInParent` schreibt den Stand der Arbeitskopie **kompl

### #103  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : 1. **Der Store ist die letzte Instanz vor der Platte.** Nach dieser Funktion gibt es keine Prüfung mehr; was hier durchgeht, steht in `vorlagen.json` und wird von jedem künftigen Lauf als gültig gelesen. Der `render-service` prüft die Höhe zwar noch einmal (`ungueltiges_element`, TK 9.2.3) – aber erst, wenn der Nutzer die Vorlage längst benutzt und ein Video eingereiht hat. 2. **`vorlagen.json` is

### #103  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : **ENTSCHIEDEN – der eingebaute Parent meldet `parent_eingebaut`, nicht `ungueltige_eingabe`.** Die Union `VorlagenFehlercode` (#97) führt diesen Code ausdrücklich für **diese** Operation; er wird nirgendwo sonst vergeben. Der Grund steht dort ausgeschrieben: `ungueltige_eingabe` würde dem Nutzer suggerieren, er habe etwas falsch eingegeben, obwohl seine Eingabe korrekt ist – nur der gewählte Weg i

### #103  [TK, anfuehrung]
ZITAT   : hat sich der Parent inzwischen geändert
NAECHSTE: Wird der Parent gelöscht, wird deren `parent` genullt (s.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keinen Timer anfassen, keinen Flush auslösen.** Kein `flushBestand()` (#98), kein eigener `setTimeout`, kein Abbrechen oder Vorziehen der Entprellung aus #102, kein „sicherheitshalber vorher noch einmal speichern". Warum das ausreicht, steht oben ausgeschrieben: `'entprellt'` übernimmt sofort im Speicher, und `'sofort'` schreibt alles Aus

### #104  [TK, anfuehrung]
ZITAT   : geht nicht, weil der Parent eingebaut ist
NAECHSTE: null = eigenständig eingebaut:
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Dies ist der **einzige** Weg, auf dem eine eigene Vorlage aus einer eingebauten entsteht – und damit der einzige Weg, auf dem FA-13 (eigene Vorlagen anlegen und bearbeiten) für die mitgelieferten Layouts überhaupt funktioniert: Bei eingebauten Vorlagen „bleibt nur `alsEigenstaendige`" (TK 9.12.1). Wer hier zusätzlich Sperren einbaut, die es im Vertrag nicht

### #104  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operation, wörtlich (TK 9.12.1, Operationstabelle): ``` | `alsEigenstaendige` | `arbeitsId`, `name` → `Ergebnis<Vorlage>` – setzt **`parent = null`**, Arbeitskopie wird eine echte Vorlage | ``` - **Die Begründung, warum das Feld genullt wird – wörtlich (TK 9.12.1):** „**Zweck des `parent`-Feldes (und warum es genullt w

### #104  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
steht in Issues: [23, 68, 71, 76, 77]
NAECHSTE: Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operation, wörtlich (TK 9.12.1, Operationstabelle): ``` | `alsEigenstaendige` | `arbeitsId`, `name` → `Ergebnis<Vorlage>` – setzt **`parent = null`**, Arbeitskopie wird eine echte Vorlage | ``` - **Die Begründung, warum das Feld genullt wird – wörtlich (TK 9.12.1):** „**Zweck des `parent`-Feldes (und warum es genullt w

### #104  [AD, anfuehrung]
ZITAT   : Parent ist eingebaut → abbrechen
NAECHSTE: Die **Bandhöhe legt die Vorlage fest** (eingebaute Vorlage:
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – den Parent nicht anfassen.** Kein Löschen, kein Umbenennen, kein Ändern seiner Zonen, kein Setzen irgendeines Feldes, kein „Aufräumen", weil er jetzt keine Kopie mehr hat. TK 9.12.1 sagt es in Klammern: „(nicht der Parent verändert!)". - **Verbot – keine neue ID, kein zusätzlicher Eintrag.** Der Bestand hat danach **genauso viele** Einträ

### #105  [TK, anfuehrung]
ZITAT   : nur wenn `parent ≠ null`
NAECHSTE: abgeleiteter (`parent ≠ null`);
KONTEXT : Fällt die Trennung weg, ist der Schaden groß: Wird hier ein Eintrag mit `parent === null` akzeptiert – etwa weil die Oberfläche eine falsche ID schickt oder weil jemand den Prüfschritt „spart" –, dann verschwindet eine **genutzte** Vorlage an der Referenzprüfung vorbei. Die Aktionen, die auf sie zeigen, behalten ihre `vorlagenId`, finden aber keine Vorlage mehr: Der `action-editor` kann sie nicht 

### #105  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [68, 71, 76, 77, 93]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operation, wörtlich (TK 9.12.1, Operationstabelle): ``` | `verwerfeArbeitskopie` | `arbeitsId` → `Ergebnis<void>` | ``` - Der Arbeitskopie-Fluss, wörtlich (TK 9.12.1) – die letzte Zeile ist diese Funktion: ``` Vorlage X bearbeiten └─ oeffneZurBearbeitung(X) → Arbeitskopie (parent = X) └─ Bearbeiten → speichereArbeitsko

### #105  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operation, wörtlich (TK 9.12.1, Operationstabelle): ``` | `verwerfeArbeitskopie` | `arbeitsId` → `Ergebnis<void>` | ``` - Der Arbeitskopie-Fluss, wörtlich (TK 9.12.1) – die letzte Zeile ist diese Funktion: ``` Vorlage X bearbeiten └─ oeffneZurBearbeitung(X) → Arbeitskopie (parent = X) └─ Bearbeiten → speichereArbeitsko

### #105  [TK, anfuehrung]
ZITAT   : hatte mal eine Kopie
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – niemals einen Eintrag mit `parent === null` entfernen.** Auch nicht „weil die ID ja stimmt", auch nicht mit Zusatzprüfung, auch nicht für Tests. Nutzbare Vorlagen löscht **ausschließlich** #107, und zwar erst nach der Referenzprüfung über alle Projekte. Eine zweite Löschtür ohne Prüfung wäre der direkte Weg zu verwaisten `vorlagenId`-Refe

### #106  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [68, 71, 76, 77, 93]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - **Die Kernvorschrift, wörtlich (TK 9.12.1):** „**Löschen nur, wenn die Vorlage in *keinem* Projekt mehr benutzt wird.** Die Prüfung muss **beide** Referenzarten erfassen – das ist die entscheidende Feinheit: 1. **`aktion.vorlagenId`** – Aktionen, die die Vorlage als vollflächiges Segment nutzen. 2. **`listenelement.einblen

### #106  [TK, anfuehrung]
ZITAT   : dieses Projekt benutzt die Vorlage nicht
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **ENTSCHIEDEN – Abbruch statt Überspringen bei jedem Lesefehler.** Kann auch nur **ein** `project.json` nicht gelesen oder nicht ausgewertet werden, bricht die gesamte Prüfung mit `speicher_fehler` ab; es wird **kein** Teilergebnis geliefert. Begründung: Der einzige Aufrufer ist die Löschsperre. Ein Teilergebnis wäre von einem vollständigen Ergebnis nicht unterscheidbar, und „das Projekt konnte ic

### #106  [TK, anfuehrung]
ZITAT   : Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code.
steht in Issues: [12, 22, 72, 73, 74]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : Fehlercodes werden **nicht erfunden**: „Fehlercodes sind ein geschlossener, typisierter Satz: die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3) – insbesondere vergibt **diese** Funktion niemals `vorlage_referenziert`: Sie **meldet** Nutzung, sie **

### #107  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
steht in Issues: [23, 68, 71, 76, 77]
NAECHSTE: Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
KONTEXT : - „**Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code." (TK 9.1.1, Punkt 7)

### #107  [TK, anfuehrung]
ZITAT   : atomar (Temp + Rename)
NAECHSTE: - **Atomar:** Schreiben nach Temp-Datei + Rename (gleiche Partition).
KONTEXT : vermeidet **ein** Schreibvorgang, weil #98 die Datei „atomar (Temp + Rename)" schreibt (TK 9.12.1).

### #108  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
steht in Issues: [23, 68, 71, 76, 77]
NAECHSTE: Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
KONTEXT : Diese Funktion vergibt **keine** Fehlercodes und wirft nicht: Sie hat keine Fehlerquelle. „**Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code." (TK 9.1.1, Punkt 7) gilt für die IPC-bedienten Operationen; hier antwortet die Funktion mit ihrem Rückgabewert.

### #109  [TK, anfuehrung]
ZITAT   : **Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queue:geaendert`, `render:fortschritt`. Damit erfindet niemand eigene Kanalnamen.
steht in Issues: [25, 65, 71, 77, 93]
NAECHSTE: operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queu
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #109  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #109  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [68, 71, 76, 77, 93]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #109  [TK, anfuehrung]
ZITAT   : **Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche.
steht in Issues: [23, 71, 76, 77, 93]
NAECHSTE: as Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche. **9. 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #109  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 58, 69, 76, 77]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #111  [TK, anfuehrung]
ZITAT   : innerhalb einer Sitzung […] ein bereits gezeichnetes Canvas zur *Anzeige* weiterverwendet werden
NAECHSTE: innerhalb einer Sitzung darf ein bereits gezeichnetes Canvas zur *Anzeige* weiterverwendet werden.
KONTEXT : **Festlegungen dieses Issues (verbindlich, keine Zitate):** 1. **`new Image()` + `await img.decode()`, niemals `onload`.** Reihenfolge: Element erzeugen, `src` setzen, dann `decode()` awaiten (`decode()` auf einem Bild ohne `src` lehnt ab). `onload`, `addEventListener('load', …)` und `img.complete` kommen in dieser Datei nicht vor. 2. **Kein `encodeURIComponent`, keine eigene Pfadprüfung.** `datei

### #112  [TK, anfuehrung]
ZITAT   : `// Hex, 6- oder 8-stellig (8 = mit Alpha)`
steht in Issues: [318]
NAECHSTE: string } // Hex, 6- oder 8-stellig (8 = mit Alpha) schriften:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Vorlagen verweisen **ausschließlich über Rollen** darauf – niemals auf Hex-Werte oder Schriftnamen (9.11.1, Punkt 7)." (TK 9.11.2) - „**Farben und Schriften sind Rollen-Verweise in die `Marke`** (z. B. `farbRolle: "akzent"`, `schriftRolle: "headlineDisplay"`), **keine** Hex-Werte oder Font-Namen. So bleibt ein Marken-Wech

### #116  [AD, anfuehrung]
ZITAT   : die Preis-Pille ist immer rot mit Radius 40
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Diese Funktion ist der Grund, warum eigene Vorlagen (FA-13) ein **reiner Datensatz** bleiben können. Alles, was ein Nutzer gestalterisch ergänzen darf – eine farbige Fläche, eine abgerundete Pille, ein Verlauf, ein fester Text –, entsteht hier aus vier Feldern des Zonen-Modells. Wird stattdessen auch nur ein Element hart in den Code geschrieben („die Preis-

### #117  [TK, anfuehrung]
ZITAT   : Durchgesetzt wird das **an der Quelle**, wo die Höhe entsteht: der `vorlagen-editor` sperrt eine ungerade Bandhöhe sofort (9.12.2), der `vorlagen-store` weist sie ab (9.12.1) […] Der `render-service` prüft sie **zusätzlich** und meldet `ungueltiges_element` (9.2.3)
NAECHSTE: setzt wird das **an der Quelle**, wo die Höhe entsteht: der `vorlagen-editor` sperrt eine ungerade Bandhöhe sofort (9.12.2), der `vorlagen-store` weist sie ab (
KONTEXT : TK 9.2.8 sagt dazu wörtlich: „Durchgesetzt wird das **an der Quelle**, wo die Höhe entsteht: der `vorlagen-editor` sperrt eine ungerade Bandhöhe sofort (9.12.2), der `vorlagen-store` weist sie ab (9.12.1) […] Der `render-service` prüft sie **zusätzlich** und meldet `ungueltiges_element` (9.2.3)". Diese Datei ist keine dieser drei Stellen – sie ist die **einzige Pixelquelle** (TK 9.10), nicht die V

### #117  [AD, anfuehrung]
ZITAT   : kein Bild ausgewählt
steht in Issues: [150]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : | Situation | Verhalten | |---|---| | `sindSchriftenBereit()` liefert `false` | `Error` werfen, **bevor** ein Canvas entsteht – **kein** Zeichnen mit Systemschrift, **kein** Warten, **kein** Nachladen | | `vorlage.art ∈ { split, einblendung }` und `höhe` fehlt, ist ≤ 0, nicht endlich oder ≥ 1080 | `Error` werfen, Meldung nennt `vorlage.id` und den Wert – **keine** Ersatzhöhe | | `vorlage.art ∈ { s

### #118  [TK, anfuehrung]
ZITAT   : **Binärdaten** (Segment- und Band-PNGs) reisen als **Binärpuffer**, nicht als Base64 (9.1, Punkt 3) – die Hülle ändert daran nichts.
NAECHSTE: Binärdaten** (Segment- und Band-PNGs) reisen als **Binärpuffer**, nicht als Base64 (9.1, Punkt 3) – die Hülle ändert daran nichts.
KONTEXT : „**Invariante:** Es gibt **keinen zweiten Zeichenpfad.** Anzeige und Export stammen immer aus **demselben** Aufruf – sonst driften Vorschau und Endvideo auseinander." (TK 9.10.1) - „**PNG-Übergabe als Binärpuffer** (kein Base64 im Nachrichtenkörper). Der **Renderer schreibt nichts auf die Platte**; er liefert die Bytes, der **Main** persistiert sie in den flüchtigen Arbeitsbereich (T1). Die Regel 

### #118  [TK, anfuehrung]
ZITAT   : gleiche Eingabe → gleiches Bild
steht in Issues: [111, 113, 115, 117, 119]
NAECHSTE: Das Ergebnis darf **nicht** vom Gerät abhängen (HiDPI-Laptop = gleiches Bild).
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – nicht neu zeichnen.** Kein Aufruf von `zeichneSegment`, kein `document.createElement('canvas')`, kein `getContext`, kein `drawImage`. Auch nicht „nur um das Canvas zu kopieren". - **Verbot – kein Base64.** Kein `toDataURL`, kein `btoa`, kein `FileReader.readAsDataURL`, keine Zeichenketten-Zwischenstufe. Auch nicht als Rückfallebene. - **V

### #119  [AD, anfuehrung]
ZITAT   : fester Markenrahmen, nicht abschaltbar
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Warum das im Gesamtsystem wichtig ist **Ohne diese Datei bleibt das Logo in jedem einzigen Segment leer.** Die Bindung `logo` ist eine **Bild**bindung: `zeichneSegment` (#117) reicht ein `Motiv` an die Bildzone (#115), und die zeichnet bei `{ zustand: 'fehlt' }` den Platzhalter „Bild fehlt". Der einzige andere Bildlader des Moduls (#111) holt Motive über `media://`, und dieses Protokoll löst **

### #119  [TK, anfuehrung]
ZITAT   : Nicht selbst entscheiden
steht in Issues: [1, 2, 3, 4, 5]
NAECHSTE: Der Torwächter selbst darf ihn **nicht** auslösen:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Der **feste Markenrahmen** wird **immer** gezeichnet (Logo, Grundgestaltung) und ist **nicht abschaltbar** (FA-11); gestalterischer Spielraum besteht ausschließlich in den **freien Zonen** (FA-12)." (TK 9.10.5) - „**Bilder sind vor dem Zeichnen dekodiert.** Der Aufruf wartet auf das Motiv (geladen über `media://`, 9.5.7) 

### #120  [TK, anfuehrung]
ZITAT   : existiert die Vorlage, und ist ihre `art` `split` oder `einblendung`?
NAECHSTE: teht nur, dass die Rollen-Verweise der Vorlage davon betroffen sind. 8. **`höhe` ist geradzahlig** – bei `art: "split"` und `"einblendung"` muss die Bandhöhe ei
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Existenz und Art der `bandVorlageId` werden hier NICHT geprüft – und ob das so bleibt, ist offen.** Vorlagen sind app-weit und gehören dem `vorlagen-store` (TK 9.12.1, Speicher V1), nicht dem `project-store`. Eine Prüfung „existiert die Vorlage, und ist ihre `art` `split` oder `einblendung`?" (TK 9.11.1) wäre fachlich sinnvoll, würde aber eine **n

### #121  [TK, anfuehrung]
ZITAT   : letzten bestätigten Stand
steht in Issues: [126]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Der zweite teure Fehler wäre, den Zustand **in place** zu ändern (das Element im Array direkt umschreiben). Dann gibt es keinen „letzten bestätigten Stand" mehr, auf den ein Rollback (TK 9.7.3, Fehlerklasse 1) zurückkehren könnte – der optimistische Schritt hätte die alte Wahrheit bereits überschrieben, und ein abgelehnter Aufruf ließe die Oberfläche in einem Zustand zurück, den weder Nutzer noch 

### #124  [TK, anfuehrung]
ZITAT   : das Asset wird jetzt nirgends mehr benutzt
NAECHSTE: Der Typ war bis hierher **nirgends ausgeschrieben**:
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – kein Löschen von Medien oder Aktionen.** Diese Datei ruft **ausschließlich** `project:entferneElement`. Kein `media:`-Kanal, kein `project:löscheAktion`, keine „Aufräumen"- Logik („das Asset wird jetzt nirgends mehr benutzt"). Verwaiste Medien behandelt der Reconcile des `media-service` (TK 9.4.7), nicht der `composer`. - **Verbot – keine

### #125  [AD, anfuehrung]
ZITAT   : **derselbe** Bedien-Baustein
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## ENTSCHIEDEN (lokale Festlegungen dieses Issues) 1. **Ein Einstiegspunkt, zwei Zieloperationen.** `uebernehmeGrenzen` verzweigt anhand `element.art` auf `setzeTrim` bzw. `setzeDauer` (Tabelle oben). Begründung: Genau so wird „**derselbe** Bedien-Baustein" (AD 4.4) strukturell wahr – die Oberfläche kennt nur **einen** Aufruf und kann die beiden Fälle gar nicht verschieden behandeln. Zwei Einstieg

### #128  [TK, anfuehrung]
ZITAT   : keine Akzentfarbe gewählt
steht in Issues: [14, 131, 135, 136, 150]
NAECHSTE: **Die Vorlage bestimmt, WO Akzentfarbe hingehört;
KONTEXT : **Hinweis (TK v3.0):** `akzentfarbe` ist seit TK 9.8.2 **`string | null`**. `null` heißt „keine Akzentfarbe gewählt" und ist ein gültiger Zustand – dann gelten die Markenwerte der Akzent-Rollen (TK 9.10.9). Ist sie gesetzt, **ersetzt** sie beim Zeichnen die drei Akzent-Rollen der Vorlage (`akzent`, `akzentKraeftig`, `akzentTief`); alle übrigen Rollen bleiben unberührt.

### #128  [TK, anfuehrung]
ZITAT   : **`media://`-Protokoll (Renderer-Lesezugriff).** Für die Vorschau (P5) und Thumbnails (`composer`, `action-editor`) muss der **Renderer** Medien anzeigen. Dafür registriert der Main ein eigenes Protokoll **`media://<projektId>/<dateiname>`** […] Der Renderer verwendet diese URLs direkt in `<video>`/`<img>`.
NAECHSTE: ** Für die Vorschau (P5) und Thumbnails (`composer`, `action-editor`) muss der **Renderer** Medien anzeigen. Dafür registriert der Main ein eigenes Protokoll **
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Thumbnails renderer-seitig, ohne ffmpeg:** Video-Vorschaubild per nativem `<video>` (auf `trimStart` spulen → Frame ins Canvas), Aktions-Segment per `template-canvas` (pixelgleich zur Vorschau), Bild direkt als `<img>`. Der Main bekommt **keine** Thumbnail-Pflicht (konsistent mit Variante A)." (TK 9.7.4) - „**Ist NICHT:

### #130  [TK, anfuehrung]
ZITAT   : Beide Grenzen werden auf **dasselbe** 30-fps-Raster gerundet: `startFrame = round(trimStart × 30)`, `endFrame = round(trimEnde × 30)`; behalten werden die Frames `[startFrame, endFrame)`. Die effektive Elementdauer ist damit `(endFrame − startFrame) / 30` – **nicht** die rohe Sekundendifferenz. […] Dieselbe Rundungsregel gilt ausnahmslos (kein `floor` an einer, `round` an anderer Stelle) – sonst weicht die Dauer um einen Frame ab.
NAECHSTE: rt × 30)`, `endFrame = round(trimEnde × 30)`; behalten werden die Frames `[startFrame, endFrame)`. Die effektive Elementdauer ist damit `(endFrame − startFrame)
KONTEXT : „Beide Grenzen werden auf **dasselbe** 30-fps-Raster gerundet: `startFrame = round(trimStart × 30)`, `endFrame = round(trimEnde × 30)`; behalten werden die Frames `[startFrame, endFrame)`. Die effektive Elementdauer ist damit `(endFrame − startFrame) / 30` – **nicht** die rohe Sekundendifferenz. […] Dieselbe Rundungsregel gilt ausnahmslos (kein `floor` an einer, `round` an anderer Stelle) – sonst 

### #130  [TK, blockzitat]
ZITAT   : „Abschnitts-Dauern unterliegen **derselben Frame-Rundung** wie alles andere (30 fps, 9.2.6) – sonst driftet das Band gegen das Video." (TK 9.2.8)
steht in Issues: [120, 127, 168, 174, 220]
NAECHSTE: **Zeitverhalten:** - Abschnitts-Dauern unterliegen **derselben Frame-Rundung** wie alles andere (30 fps, 9.2.6) – sonst driftet das Band gegen das Video.
KONTEXT : „Abschnitts-Dauern unterliegen **derselben Frame-Rundung** wie alles andere (30 fps, 9.2.6) – sonst driftet das Band gegen das Video." (TK 9.2.8) **2. Das Zeitverhalten** – die drei Fälle stehen wörtlich im Vertrag (TK 9.2.8):

### #131  [TK, anfuehrung]
ZITAT   : keine Akzentfarbe gewählt
steht in Issues: [14, 128, 135, 136, 150]
NAECHSTE: **Die Vorlage bestimmt, WO Akzentfarbe hingehört;
KONTEXT : **Hinweis (TK v3.0):** `akzentfarbe` ist seit TK 9.8.2 **`string | null`**. `null` heißt „keine Akzentfarbe gewählt" und ist ein gültiger Zustand – dann gelten die Markenwerte der Akzent-Rollen (TK 9.10.9). Ist sie gesetzt, **ersetzt** sie beim Zeichnen die drei Akzent-Rollen der Vorlage (`akzent`, `akzentKraeftig`, `akzentTief`); alle übrigen Rollen bleiben unberührt.

### #132  [TK, blockzitat]
ZITAT   : - **Zurückleiten:** Beim Render-Versuch mit kaputten Elementen (oder auf Hinweis direkt nach dem Öffnen) wird der Nutzer in den **Bearbeitungsmodus** zurückgeleitet – kein stiller Abbruch. - **Eins nach dem anderen:** Das erste kaputte Element wird hervorgehoben; ein Fortschritt zeigt „**X von N behoben**". Ist es behoben, springt die UI **automatisch zum nächsten** kaputten Element – bis keins mehr übrig ist. - **Freigabe:** Erst wenn **kein** kaputtes Element mehr existiert, ist der Render wieder frei. So kann ein Lauf nicht an einem übersehenen kaputten Element scheitern.
NAECHSTE: - **Zurückleiten:** Beim Render-Versuch mit kaputten Elementen (oder auf Hinweis direkt nach dem Öffnen) wird der Nutzer in den **Bearbeitungsmodus** zurückgeleitet – kein stiller Abbruch.
KONTEXT : - **Zurückleiten:** Beim Render-Versuch mit kaputten Elementen (oder auf Hinweis direkt nach dem Öffnen) wird der Nutzer in den **Bearbeitungsmodus** zurückgeleitet – kein stiller Abbruch. - **Eins nach dem anderen:** Das erste kaputte Element wird hervorgehoben; ein Fortschritt zeigt „**X von N behoben**". Ist es behoben, springt die UI **automatisch zum nächsten** kaputten Element – bis keins me

### #134  [TK, anfuehrung]
ZITAT   : **Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert (z. B. „Auftrag eingereiht", „Trim gesetzt")? **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3).
steht in Issues: [228, 231]
NAECHSTE: reiht", „Trim gesetzt")? - **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sonder
KONTEXT : „**Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert (z. B. „Auftrag eingereiht", „Trim gesetzt")? **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3)." (TK 9.1.1)

### #134  [TK, anfuehrung]
ZITAT   : innerhalb von `projects/<id>/output/`
steht in Issues: [173, 231]
NAECHSTE: Der aufgelöste Pfad muss **innerhalb** von `projects/<id>/output/` liegen.
KONTEXT : Diese Prüfung hier ist **frühe Rückmeldung, kein Ersatz**: Die maßgebliche Validierung macht der Main (TK 9.1.1 Punkt 6). Die Prüfung „innerhalb von `projects/<id>/output/`" kann der Renderer **nicht** leisten – er kennt keine absoluten Pfade (TK 9.5.7); sie bleibt allein beim Main.

### #134  [TK, anfuehrung]
ZITAT   : **`anstehend` → `laeuft`:** […] Bei `render` und `export` erzwingt der Main **unmittelbar vor** diesem Übergang den **Sofort-Flush** von D1 (9.5.4) – nicht beim Einreihen.
NAECHSTE: Bei `render` und `export` erzwingt der Main den **Sofort-Flush** von D1 (9.5.4) – nicht beim Einreihen.
KONTEXT : **7. Entscheidungen, die bereits getroffen sind (nicht erneut abwägen):** - **Der Wurf von `zeichneSegment` wird NICHT gefangen** (#117 wirft bei nicht bereiten Schriften oder defekter Vorlage). Ein mit Systemschrift gemaltes Segment sieht gültig aus, misst aber andere Textbreiten – ein hier geglätteter Wurf brächte genau diesen Drift in die fertige Datei. - **Die Zeichenvoraussetzungen stellt #15

### #134  [TK, anfuehrung]
ZITAT   : **Kaputte Stellen blockieren den Render und starten die geführte Reparatur (9.7.5):** […] ein Render wird nicht gestartet (er würde mit `medium_fehlt` scheitern bzw. einen Platzhalter einbetten), sondern der Nutzer in den Reparatur-Modus geführt.
NAECHSTE: **rot markiert**; ein Render wird nicht gestartet (er würde mit `medium_fehlt` scheitern bzw. einen Platzhalter einbetten), sondern der Nutzer in den Reparatur-
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Kaputte Stellen blockieren den Render und starten die geführte Reparatur (9.7.5):** […] ein Render wird nicht gestartet (er würde mit `medium_fehlt` scheitern bzw. einen Platzhalter einbetten), sondern der Nutzer in den Reparatur-Modus geführt." (TK 9.7.4) - „**Render friert die Liste beim Einreihen ein (9.3.5):** die L

### #134  [TK+AD, anfuehrung]
ZITAT   : `reiheEin(art, payload) → Ergebnis<{ auftragId }> // kehrt SOFORT zurück; sagt nichts über den Ausgang
steht in Issues: [61]
NAECHSTE: reiheEin(art, payload) → Ergebnis<{ auftragId }> // kehrt SOFORT zurück; sagt nichts über den Ausgang entferne(auftragId) → Ergebnis<void> // anstehend: aus Sch
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Kaputte Stellen blockieren den Render und starten die geführte Reparatur (9.7.5):** […] ein Render wird nicht gestartet (er würde mit `medium_fehlt` scheitern bzw. einen Platzhalter einbetten), sondern der Nutzer in den Reparatur-Modus geführt." (TK 9.7.4) - „**Render friert die Liste beim Einreihen ein (9.3.5):** die L

### #134  [TK, anfuehrung]
ZITAT   : **Der Ausgabename ist Nutzereingabe und wird validiert (FA-22):** […] Verstoß → `ungueltige_eingabe`, **ohne** Wirkung. Andernfalls könnte ein Name wie `../../config` aus dem Projekt ausbrechen.
NAECHSTE: ad muss **innerhalb** von `projects/<id>/output/` liegen. Verstoß → `ungueltige_eingabe`, **ohne** Wirkung. Andernfalls könnte ein Name wie `../../config` aus d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Kaputte Stellen blockieren den Render und starten die geführte Reparatur (9.7.5):** […] ein Render wird nicht gestartet (er würde mit `medium_fehlt` scheitern bzw. einen Platzhalter einbetten), sondern der Nutzer in den Reparatur-Modus geführt." (TK 9.7.4) - „**Render friert die Liste beim Einreihen ein (9.3.5):** die L

### #134  [TK, anfuehrung]
ZITAT   : Der Render **friert seinen Eingang beim Einreihen ein** (9.3.5). Beide Werte stammen aus der Band-Vorlage und werden **beim Einreihen** aus ihr abgeleitet. […] Ändert jemand die Bandhöhe, während der Auftrag in der Warteschlange wartet, passten die bereits gezeichneten Band-PNGs (1920 × H **zum Einreih-Zeitpunkt**) nicht mehr zur nachgeschlagenen Höhe – das Band im fertigen Video wäre verzerrt oder falsch platziert.
NAECHSTE: Ändert jemand die Bandhöhe, während der Auftrag in der Warteschlange wartet, passten die bereits gezeichneten Band-PNGs (1920 × H **zum Einreih-Zeitpunkt**) nicht mehr zur nachgeschlagenen Höhe – das Band im fertigen Video wäre verzerrt oder falsch platziert.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Kaputte Stellen blockieren den Render und starten die geführte Reparatur (9.7.5):** […] ein Render wird nicht gestartet (er würde mit `medium_fehlt` scheitern bzw. einen Platzhalter einbetten), sondern der Nutzer in den Reparatur-Modus geführt." (TK 9.7.4) - „**Render friert die Liste beim Einreihen ein (9.3.5):** die L

### #135  [TK, anfuehrung]
ZITAT   : keine Akzentfarbe gewählt
steht in Issues: [14, 128, 131, 136, 150]
NAECHSTE: **Die Vorlage bestimmt, WO Akzentfarbe hingehört;
KONTEXT : **Hinweis (TK v3.0):** `akzentfarbe` ist seit TK 9.8.2 **`string | null`**. `null` heißt „keine Akzentfarbe gewählt" und ist ein gültiger Zustand – dann gelten die Markenwerte der Akzent-Rollen (TK 9.10.9). Ist sie gesetzt, **ersetzt** sie beim Zeichnen die drei Akzent-Rollen der Vorlage (`akzent`, `akzentKraeftig`, `akzentTief`); alle übrigen Rollen bleiben unberührt.

### #135  [TK, anfuehrung]
ZITAT   : `bildRef` zeigt auf ein `fehlt`-Asset
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Entscheidung dieses Issues (kein TK-Zitat, aber verbindlich für die Umsetzung).** Das TK nennt in 9.8.5 nur den Fall „`bildRef` zeigt auf ein `fehlt`-Asset". Der Fall „`bildRef` zeigt auf eine Asset-ID, die in `Project.assets` **gar nicht** vorkommt" wird hier **gleich** behandelt und zählt ebenfalls als kaputt. Begründung: `template-canvas` unterscheidet die beiden Fälle nicht – `holeMotiv(schl

### #135  [TK, anfuehrung]
ZITAT   : `bildRef` zeigt auf eine Asset-ID, die in `Project.assets` **gar nicht** vorkommt
NAECHSTE: "video"`/`"bild"` → ein `Asset` in `Project.assets` mit passendem `typ`;
KONTEXT : **Entscheidung dieses Issues (kein TK-Zitat, aber verbindlich für die Umsetzung).** Das TK nennt in 9.8.5 nur den Fall „`bildRef` zeigt auf ein `fehlt`-Asset". Der Fall „`bildRef` zeigt auf eine Asset-ID, die in `Project.assets` **gar nicht** vorkommt" wird hier **gleich** behandelt und zählt ebenfalls als kaputt. Begründung: `template-canvas` unterscheidet die beiden Fälle nicht – `holeMotiv(schl

### #136  [TK+AD, anfuehrung]
ZITAT   : die Dauer der Aktion
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Zweitens `standardDauer`.** „**`standardDauer` ist nur ein Default:** maßgeblich für den Render ist die **Listenelement-Dauer** (composer, Anforderungsdokument 4.4)." (TK 9.8.4) Wer sie hier als „die Dauer der Aktion" beschriftet oder beim Bearbeiten rückwirkend in bestehende Listenelemente schreibt, ändert stillschweigend die Länge bereits zusammengestellter Wiedergabelisten – Aktionen sind ref

### #136  [TK, anfuehrung]
ZITAT   : keine gewählt, es gilt der Markenwert
NAECHSTE: Wählt eine Aktion **keine** Akzentfarbe, gilt der Markenwert;
KONTEXT : **ENTSCHIEDEN – `akzentfarbe` wird gegen die Rollen-Liste geprüft.** `Aktion.akzentfarbe` ist ein Rollen-Verweis, kein Hex-Wert (#14). Seit TK v3.0 ist das Feld **`string | null`**; `null` heißt „keine gewählt, es gilt der Markenwert" (TK 9.8.2/9.10.9) und ist ein **gültiger** Wert, kein Befund – die Prüfung greift nur bei einem **gesetzten** Wert. Geprüft wird mit `istAkzentRolle` aus #139 – ders

### #136  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Wird `vorlagenId` gegen die tatsächlich existierende Vorlagen-Bibliothek geprüft – und wenn ja, hier?** #38 und #39 lassen diese Frage ausdrücklich offen und vermuten, die tiefere Prüfung („existiert diese Vorlage wirklich?") gehöre „erst zum `action-editor` (M5), der die Vorlagen-Bibliothek ohnehin kennt – aber das ist eine Architektur-Entscheidu

### #138  [TK, anfuehrung]
ZITAT   : importiert und danach zuweist
NAECHSTE: importierte Logos und Schriften je Marke.
KONTEXT : **`starteBildImport` weist kein Bild zu – und das ist kein Versehen.** Der Import ist ein **Auftrag**: Der Aufruf antwortet sofort mit der `auftragId`, das fachliche Ergebnis (der fertige `Asset`) reist über den Auftrags-Zustand (TK 9.1.1, Punkt 1; TK 9.4.3). Eine Funktion, die „importiert und danach zuweist", müsste auf den Auftrag warten – und würde damit die Oberfläche für die Dauer des Imports

### #142  [TK, anfuehrung]
ZITAT   : das Bild wird mitgelöscht
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Und ein Punkt, der leicht untergeht: Die von der Aktion verwendeten **Medien** bleiben. „Die von der Aktion **verwendeten Medien-Assets bleiben unangetastet** und projektweit verfügbar – eine Aktion *referenziert* ein Asset nur, sie besitzt es nicht." (TK 9.5.3) Wer in der Vorschau „das Bild wird mitgelöscht" behauptet, erzeugt eine Angst, die sachlich falsch ist.

### #142  [TK, anfuehrung]
ZITAT   : löschen ohne Rückfrage
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ENTSCHIEDEN – wie der `composer` von den entfernten Listenelementen erfährt.** Das Löschen geschieht im Aktions-Reiter, wirkt aber auf die Wiedergabeliste im Bearbeitungs-Reiter (TK 9.14.1). In der Kanal-Registry gibt es unter `project` **vierzehn Aufrufkanäle und kein einziges Ereignis** (#76) – ein `project:geaendert` existiert nicht, **und es w

### #144  [AD, anfuehrung]
ZITAT   : mit gedrückter Umschalttaste doch
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keine Prozentwerte, keine relativen Einheiten.** `rahmen` ist absolut in Flächenpixeln. Rechne **nicht** in Bildschirm- oder CSS-Pixeln und speichere **nichts** als Anteil. Die Umrechnung von der (per CSS skalierten) Anzeige in Flächenpixel macht der Aufrufer, bevor er `dx` und `dy` übergibt. - **Verbot – `devicePixelRatio` wird nirgends 

### #144  [TK, anfuehrung]
ZITAT   : Es gibt **kein** automatisches Umlayouten
NAECHSTE: Es gibt **kein automatisches Umlayouten** – sonst erfindet jeder Agent eine eigene Layout-Logik und das Ergebnis wird unvorhersehbar.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keine Prozentwerte, keine relativen Einheiten.** `rahmen` ist absolut in Flächenpixeln. Rechne **nicht** in Bildschirm- oder CSS-Pixeln und speichere **nichts** als Anteil. Die Umrechnung von der (per CSS skalierten) Anzeige in Flächenpixel macht der Aufrufer, bevor er `dx` und `dy` übergibt. - **Verbot – `devicePixelRatio` wird nirgends 

### #147  [TK, anfuehrung]
ZITAT   : Titel/Beschreibung/ Preis/CTA
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **ENTSCHIEDEN – `slogan` gehört zu den Textbindungen, obwohl TK 9.12.2 nur „Titel/Beschreibung/ Preis/CTA" aufzählt.** Drei Gründe: (a) #102 behandelt `slogan` ausdrücklich als Textbindung, die `text`-Parameter braucht – der Store rechnet also damit; (b) `Marke.slogan` existiert mit `{ text, aktiv }` (TK 9.11.2) und das Anforderungsdokument nennt in 4.1 einen „Optionaler, wiederkehrender Marken-Sl

### #148  [TK, anfuehrung]
ZITAT   : Zone außerhalb der Fläche
steht in Issues: [145, 149]
NAECHSTE: P5 (Vorschau) läuft **außerhalb** der Queue.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – Überlappung ist kein Fehler und keine Warnung.** Keine Ausnahme „bei zwei Textzonen vielleicht doch". Die eingebauten Vorlagen überlappen absichtlich. - **Verbot – keine zweite Berechnung der Sicherheitsbox oder der Fläche.** Beide kommen aus #144. Rechne sie hier **nicht** noch einmal aus `SICHERHEITSABSTAND_PX` aus – auch nicht in `band

### #149  [TK, anfuehrung]
ZITAT   : Nicht selbst entscheiden
steht in Issues: [1, 2, 3, 4, 5]
NAECHSTE: Der Torwächter selbst darf ihn **nicht** auslösen:
KONTEXT : **Die Nutzungsanzeige ist NICHT Teil dieses Issues.** TK 9.12.2 verlangt sie ausdrücklich, und seit TK v3.0 gibt es dafür auch eine Operation samt Kanal (`pruefeVorlagenReferenzen`, `vorlagen:pruefeVorlagenReferenzen`, TK 9.12.1) – **hier** wird sie trotzdem nicht gerufen und nicht angezeigt, s. „Nicht selbst entscheiden". Baue **keinen** Ersatz, keine Schätzung und keine „vorerst leere" Anzeige.

### #149  [TK+AD, anfuehrung]
ZITAT   : **Zweck des `parent`-Feldes (und warum es genullt wird):** Das Feld `parent` ist **die Merge-Beziehung** … Wählt der Nutzer „als eigenständige Vorlage", wird **das Feld** auf `null` gesetzt (nicht der Parent verändert!). Damit ist die Beziehung **bewusst durchtrennt** – genau das schließt spätere **Merge-Konflikte** aus.
NAECHSTE: eld** auf `null` gesetzt (nicht der Parent verändert!). Damit ist die Beziehung **bewusst durchtrennt** – genau das schließt spätere **Merge-Konflikte** aus: ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Bearbeitet wird immer eine Arbeitskopie** (9.12.1). … und beim Speichern die zwei Wege: **„Vorlage überarbeiten"** (Merge in den Parent) oder **„als neue eigenständige Vorlage"** (`parent = null`). Ist der Parent eingebaut, ist „überarbeiten" **von Anfang an deaktiviert** samt Begründung." (TK 9.12.2) - „**Merge ist ein

### #150  [TK, anfuehrung]
ZITAT   : keine Akzentfarbe gewählt
steht in Issues: [14, 128, 131, 135, 136]
NAECHSTE: **Die Vorlage bestimmt, WO Akzentfarbe hingehört;
KONTEXT : **Hinweis (TK v3.0):** `akzentfarbe` ist seit TK 9.8.2 **`string | null`**. `null` heißt „keine Akzentfarbe gewählt" und ist ein gültiger Zustand – dann gelten die Markenwerte der Akzent-Rollen (TK 9.10.9). Ist sie gesetzt, **ersetzt** sie beim Zeichnen die drei Akzent-Rollen der Vorlage (`akzent`, `akzentKraeftig`, `akzentTief`); alle übrigen Rollen bleiben unberührt.

### #150  [AD, anfuehrung]
ZITAT   : kein Bild ausgewählt
steht in Issues: [117]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Warum `bildRef: null` und kein mitgeliefertes Beispielbild:** Motive kommen ausschließlich über `media://`, und dieses Protokoll „löst ausschließlich innerhalb des Medienordners eines Projekts auf" (#119). Ein Bundle-Bild ließe sich also gar nicht in den Motiv-Bestand bringen, ohne einen zweiten Ladeweg zu erfinden. Ein leeres `bildRef` ist außerdem **nicht** dasselbe wie ein fehlendes Motiv: Es

### #151  [TK, anfuehrung]
ZITAT   : `QueueGeändert(Auftrag[]) // Main → Renderer: Push bei jeder Zustandsänderung → speist das queue-panel
steht in Issues: [65, 71]
NAECHSTE: im Öffnen des Panels) ``` ``` QueueGeändert(Auftrag[]) // Main → Renderer: Push bei jeder Zustandsänderung → speist das queue-panel // Ereignis: OHNE Hülle und 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**5. Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand." (TK 9.1.1) – diese Funktion leitet aus einer Meldung **nie** ab, dass ein Vorgang beendet ist, und ergänzt keine Felder.

### #152  [TK, anfuehrung]
ZITAT   : **Fix-Optionen je Element**
NAECHSTE: **Listenelement mit `art:
KONTEXT : **Und zur Reichweite auf `art: 'segment'`:** TK 9.7.5 nennt die Fix-Option „durch ein **anderes ersetzen** (Referenz umsetzen)" unter „**Fix-Optionen je Element**" – **ohne** sie auf Medien zu beschränken. Wörtlich ausgeschrieben ist „durch eine andere Aktion ersetzen" dort nur für den **Band-Abschnitt** (Fall 3), der aber **kein** Listenelement ist und über `setzeEinblendung` (#120) läuft. Für da

### #152  [TK, anfuehrung]
ZITAT   : `video` → `ref`=Asset(video), `dauer`=`null`, `trimStart`/`trimEnde` gesetzt, `einblendung` erlaubt · `bild` → `ref`=Asset(bild), `dauer` gesetzt (10–45s), `trimStart`/`trimEnde`/`einblendung`=`null` · `segment` → `ref`=Aktion, `dauer` gesetzt (10–45s), `trimStart`/`trimEnde`/`einblendung`=`null`.
steht in Issues: [15]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fix-Optionen je Element:** Medium **neu verknüpfen/importieren** (media-service), durch ein **anderes ersetzen** (Referenz umsetzen), oder das **Element entfernen** (`entferneElement`, project-store). Es werden ausschließlich bestehende Operationen genutzt." (TK 9.7.5) – der Klammerzusatz „(Referenz umsetzen)" **ist** d

### #152  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fix-Optionen je Element:** Medium **neu verknüpfen/importieren** (media-service), durch ein **anderes ersetzen** (Referenz umsetzen), oder das **Element entfernen** (`entferneElement`, project-store). Es werden ausschließlich bestehende Operationen genutzt." (TK 9.7.5) – der Klammerzusatz „(Referenz umsetzen)" **ist** d

### #152  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
steht in Issues: [23, 68, 71, 76, 77]
NAECHSTE: Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fix-Optionen je Element:** Medium **neu verknüpfen/importieren** (media-service), durch ein **anderes ersetzen** (Referenz umsetzen), oder das **Element entfernen** (`entferneElement`, project-store). Es werden ausschließlich bestehende Operationen genutzt." (TK 9.7.5) – der Klammerzusatz „(Referenz umsetzen)" **ist** d

### #153  [TK, anfuehrung]
ZITAT   : von M2–M7 **iterativ ergänzt**
steht in Issues: [25, 71, 93, 191, 238]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Modul & Datei - Modul: `ipc-gateway` (Main) - Datei: `src/main/ipc-gateway/project-store-nachtrag.ts` - Zusätzlich erlaubte Datei: `src/shared/contracts/kanaele.ts` – **nur** für die zwei neuen Einträge im bestehenden Block `project`. Die Registry ist laut #25 ausdrücklich dafür vorgesehen, „von M2–M7 **iterativ ergänzt**" zu werden. - Vertrag: Technisches Konzept **9.1.1** (IPC-Konventionen), 

### #153  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #153  [TK, anfuehrung]
ZITAT   : **Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`.
steht in Issues: [25, 65, 71, 76, 77]
NAECHSTE: *Eine rohe Exception-Meldung wird nie zum Code.** **4. Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:lösch
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #153  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [68, 71, 76, 77, 93]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #153  [TK, anfuehrung]
ZITAT   : **Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche.
steht in Issues: [23, 71, 76, 77, 93]
NAECHSTE: as Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche. **9. 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #153  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 58, 69, 76, 77]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2): ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` Sie wird hier **unverändert durchgereicht** – nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. Begründung aus demselben Abschnitt:

### #154  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
steht in Issues: [23, 68, 71, 76, 77]
NAECHSTE: Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Ein Segment mit Platzhalter darf nie in den finalen Render gelangen** – diese Sperre sitzt im `composer` (Reparatur-Modus 9.7.5), nicht hier." (TK 9.10.7) - „**Schriften sind vor dem Zeichnen geladen.** Der Aufruf wartet, bis alle benötigten Fonts einsatzbereit sind. Zeichnen mit Fallback-Schrift ist ein **Vertragsbruch

### #155  [TK, anfuehrung]
ZITAT   : bevor überarbeitet **oder gelöscht** wird
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Die Übersicht ist die gemeinsame Vorlagen-Sicht des Renderers.** Sie wird **nicht** über IPC-Ereignisse aktuell gehalten: `vorlagen-editor`, `composer` und `action-editor` laufen im **selben** Renderer-Prozess, und der `vorlagen-store` hat in v1 ausdrücklich **kein** Ereignis (#109: „**Verbot – kein Ereignis.** Der `vorlagen-store` hat in v1 **keinen** Push an den Renderer"). Module **außerha

### #155  [TK, anfuehrung]
ZITAT   : **Höchstens eine Arbeitskopie pro Parent.** Wird eine Vorlage geöffnet, für die bereits eine Arbeitskopie existiert, wird **diese fortgesetzt** statt eine zweite anzulegen. So kann es strukturell **keinen** Merge-Konflikt geben.
NAECHSTE: o Parent.** Wird eine Vorlage geöffnet, für die bereits eine Arbeitskopie existiert, wird **diese fortgesetzt** statt eine zweite anzulegen. So kann es struktur
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Über die eingebauten Vorlagen hinaus können **eigene Vorlagen angelegt und bearbeitet** werden – **bereits im Prototyp**. Dabei wird die **Art** der Vorlage gewählt: vollflächiges Segment, **Split-Screen-Band** oder **Einblendung** (s. 4.5)." (FA-13, **Muss**) - „**Arbeitskopien (`parent ≠ null`) sind nicht auswählbar.** 

### #155  [TK, anfuehrung]
ZITAT   : **Nutzung wird angezeigt,** bevor überarbeitet oder gelöscht wird („wird von 7 Aktionen in 2 Projekten verwendet") – ein Merge verändert **alle** davon. Die Zahlen kommen aus **`pruefeVorlagenReferenzen`** (9.12.1) und aus **keiner** zweiten, editor-eigenen Zählung. […] Die Lösch-**Sperre** selbst sitzt weiterhin im `vorlagen-store`.
NAECHSTE: - **Nutzung wird angezeigt,** bevor überarbeitet oder gelöscht wird („wird von 7 Aktionen in 2 Projekten verwendet") – ein Merge verändert **alle** davon.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Über die eingebauten Vorlagen hinaus können **eigene Vorlagen angelegt und bearbeitet** werden – **bereits im Prototyp**. Dabei wird die **Art** der Vorlage gewählt: vollflächiges Segment, **Split-Screen-Band** oder **Einblendung** (s. 4.5)." (FA-13, **Muss**) - „**Arbeitskopien (`parent ≠ null`) sind nicht auswählbar.** 

### #155  [TK, anfuehrung]
ZITAT   : **Ist:** die UI zum Anlegen und Bearbeiten – **Art wählen** (vollflächig / Split-Screen / Einblendung), Bandhöhe setzen, freie und dekorative Zonen anlegen, verschieben, bemaßen, `bindung` und `wennLeer` wählen, Text-Parameter setzen.
NAECHSTE: #### 9.12.2 `vorlagen-editor` [Renderer] **Ist:** die UI zum Anlegen und Bearbeiten – **Art wählen** (vollflächig / Split-Screen / Einblendung), Bandhöhe setzen, freie und dekorative Zonen anlegen, verschieben, bemaßen, `bindung` und `wennLeer` wählen, Text-Parameter setzen (Schrift-/Farb-Rolle, Größenbereich, Max-Zeilen).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Über die eingebauten Vorlagen hinaus können **eigene Vorlagen angelegt und bearbeitet** werden – **bereits im Prototyp**. Dabei wird die **Art** der Vorlage gewählt: vollflächiges Segment, **Split-Screen-Band** oder **Einblendung** (s. 4.5)." (FA-13, **Muss**) - „**Arbeitskopien (`parent ≠ null`) sind nicht auswählbar.** 

### #155  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
steht in Issues: [23, 68, 71, 76, 77]
NAECHSTE: Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Über die eingebauten Vorlagen hinaus können **eigene Vorlagen angelegt und bearbeitet** werden – **bereits im Prototyp**. Dabei wird die **Art** der Vorlage gewählt: vollflächiges Segment, **Split-Screen-Band** oder **Einblendung** (s. 4.5)." (FA-13, **Muss**) - „**Arbeitskopien (`parent ≠ null`) sind nicht auswählbar.** 

### #156  [TK, anfuehrung]
ZITAT   : ENTSCHIEDEN – der Importpfad in `auftrag.ts`
steht in Issues: [78]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Modul & Datei - Modul: `contracts/types` (geteilt) - Datei: `src/shared/contracts/export-request.ts` - Zweite erlaubte Datei: **genau eine Zeile** in `src/shared/contracts/auftrag.ts` (#16) – die Importzeile, die den hier definierten Typ dort verfügbar macht (s. „ENTSCHIEDEN – der Importpfad in `auftrag.ts`" unten). Sonst **nichts** an dieser Datei. - Vertrag: Technisches Konzept **9.6.1** (Ope

### #156  [TK, anfuehrung]
ZITAT   : Woher `dateiname` kommt: Die Auswahl speist sich aus `listeAusgaben` (9.5.2); der Renderer liest den Ausgabeordner **nie** selbst und kennt **keine** absoluten Pfade.
NAECHSTE: dateiname` kommt:** Die Auswahl speist sich aus `listeAusgaben` (9.5.2); der Renderer liest den Ausgabeordner **nie** selbst und kennt **keine** absoluten Pfade
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „| `projektId` | Projekt-Kontext; zusammen mit `dateiname` die Quelle |" (TK 9.6.1, Tabelle `ExportRequest`) - „| `dateiname` | **welche** Ausgabedatei kopiert wird (FA-22) – aufgelöst zu `projects/<id>/output/<dateiname>` |" (TK 9.6.1, Tabelle `ExportRequest`) – weil der Name **ohne** weitere Ergänzung an den Ordner gehän

### #157  [TK, anfuehrung]
ZITAT   : **Der Kanal `render:fortschritt` wird gebaut, nicht nur erwähnt.** […] Der `render-service` meldet darauf, das `ipc-gateway` meldet ihn an, der Renderer abonniert ihn.
NAECHSTE: Der `render-service` meldet darauf, das `ipc-gateway` meldet ihn an, der Renderer abonniert ihn.
KONTEXT : - „**Keine** Restzeit-Schätzung – bei `ffmpeg` unzuverlässig, sie würde nur falsche Erwartungen erzeugen. Reine Laufzeitdaten (Kategorie D), **keine** Persistenz." (TK 9.2.7) – deshalb **kein** Feld `verbleibendeSekunden`, `eta` oder Ähnliches, und dieser Typ taucht in **keiner** Datei auf der Platte auf. - „**5. Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` b

### #158  [TK, anfuehrung]
ZITAT   : **3. Fehlercodes sind ein geschlossener, typisierter Satz** […] **Eine rohe Exception-Meldung wird nie zum Code.**
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**ffprobe/ffmpeg-Argumente nie per String-Konkatenation, immer als Argument-Array.** Windows-Pfade enthalten regelmäßig Leerzeichen; ein zusammengebautes Kommando bricht dort und funktioniert auf macOS scheinbar." (TK 9.4.8 Punkt 2) → Konkret verboten: `exec`, `spawn`/`execFile` mit `shell: true`, Template-Strings mit ein

### #161  [TK, anfuehrung]
ZITAT   : Video-Codec \| **H.264**, Profil **High**, **Level 4.0**
NAECHSTE:  fps, CFR** (konstant) | Voraussetzung für die Frame-Rundung (9.2.6) | | Video-Codec | **H.264**, Profil **High**, **Level 4.0** | 1080p30 bei ~12 Mbit/s liegt 
KONTEXT : | Flag | Wert kommt aus | Warum genau so | |---|---|---| | `-c:v` | `ENCODER_JE_CODEC[profil.videoCodec]` → `libx264` | `h264` ist das **Format**, `libx264` der **Encoder**. Die Zuordnung steht als benannte Tabelle in dieser Datei, weil #18 den Encoder-Namen bewusst nicht kennt (er ist eine ffmpeg-Eigenheit, kein fachlicher Wert). Hardware-Encoder sind verboten, s. STOPP | | `-profile:v` | `profil

### #161  [TK, anfuehrung]
ZITAT   : Bildrate \| **30 fps, CFR** (konstant) \| Voraussetzung für die Frame-Rundung (9.2.6)
NAECHSTE: |---|---|---| | Auflösung | **1920 × 1080** | Ausgabe-Profil | | Bildrate | **30 fps, CFR** (konstant) | Voraussetzung für die Frame-Rundung (9.2.6) | | Video-C
KONTEXT : | Flag | Wert kommt aus | Warum genau so | |---|---|---| | `-c:v` | `ENCODER_JE_CODEC[profil.videoCodec]` → `libx264` | `h264` ist das **Format**, `libx264` der **Encoder**. Die Zuordnung steht als benannte Tabelle in dieser Datei, weil #18 den Encoder-Namen bewusst nicht kennt (er ist eine ffmpeg-Eigenheit, kein fachlicher Wert). Hardware-Encoder sind verboten, s. STOPP | | `-profile:v` | `profil

### #161  [TK, anfuehrung]
ZITAT   : **GOP** \| **geschlossen**, ≤ 2 s (60 Frames)
NAECHSTE: reines CRF) erzeugt Spitzen → **Ruckler** am TV | | **GOP** | **geschlossen**, ≤ 2 s (60 Frames);
KONTEXT : | Flag | Wert kommt aus | Warum genau so | |---|---|---| | `-c:v` | `ENCODER_JE_CODEC[profil.videoCodec]` → `libx264` | `h264` ist das **Format**, `libx264` der **Encoder**. Die Zuordnung steht als benannte Tabelle in dieser Datei, weil #18 den Encoder-Namen bewusst nicht kennt (er ist eine ffmpeg-Eigenheit, kein fachlicher Wert). Hardware-Encoder sind verboten, s. STOPP | | `-profile:v` | `profil

### #162  [TK+AD, anfuehrung]
ZITAT   : **`-c copy` setzt Uniformität voraus:** Alle `seg_*.mp4` müssen **identische** Parameter tragen (Codec, Profil, Auflösung, `fps`, Zeitbasis, Pixelformat, **Streamlayout**). Deshalb die vorherige Normalisierung; **kein** concat auf Rohdateien.
NAECHSTE: - **`-c copy` setzt Uniformität voraus:** Alle `seg_*.mp4` müssen **identische** Parameter tragen (Codec, Profil, Auflösung, `fps`, Zeitbasis, Pixelformat, Streamlayout).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Einheitliche stille Tonspur:** Jeder Zwischenclip erhält **dieselbe** stille AAC-Spur (9.2.4), damit das Streamlayout über alle Segmente gleich bleibt (Voraussetzung für verlustfreies `-c copy`). Eine Quelle **mit** Ton wird verworfen und durch die stille Spur **ersetzt**; eine Quelle **ohne** Ton bekommt sie hinzugefüg

### #165  [TK, anfuehrung]
ZITAT   : für bessere Qualität
steht in Issues: [163, 177]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Die Kompositionsart wird NIE erraten.** Diese Datei baut ausschließlich Art B. Wer sie für Elemente mit `art === 'split'` benutzt, erzeugt ein Video, in dem das Band das Bild verdeckt, obwohl der Nutzer einen Split gewählt hat. Trifft der Dispatcher (#177) auf ein `art`, das weder `'split'` noch `'einblendung'` ist, ist das ein **Vertragsfehler** 

### #168  [TK, anfuehrung]
ZITAT   : das Band nicht mitten im Abschnitt abbricht
NAECHSTE: siehe Schluss von Abschnitt 9).
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **OFFENE FRAGE (Experiment, nicht am Schreibtisch entscheidbar): Kennt das mitgelieferte ffmpeg den `qtrle`-Encoder?** Das hängt vom konkreten Binary aus `ffmpeg-static` ab (#6) und lässt sich nur am gebauten Programm feststellen. **Versuchsaufbau:** 1. Den ffmpeg-Pfad über `ermittleFfmpegPfad()` (#6) ermitteln – in Entwicklung **und** in der gepack

### #171  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 58, 69, 76, 77]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3) - „**`abgebrochen` ist *kein* Fehlercode.**" (TK 9.2.3) – v

### #171  [TK, anfuehrung]
ZITAT   : **Strukturierte Fehlerdaten (`daten`, optional).** […] Regeln: Das Feld ist **optional** – Codes ohne Zusatzdaten lassen es weg; seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1); es ist **kein Freitext-Anhang** und **kein Ersatz für `meldung`**. Ein Aufrufer, der `daten` nicht kennt, funktioniert unverändert weiter.
NAECHSTE: n führen. Regeln: Das Feld ist **optional** – Codes ohne Zusatzdaten lassen es weg; seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3) - „**`abgebrochen` ist *kein* Fehlercode.**" (TK 9.2.3) – v

### #171  [TK, anfuehrung]
ZITAT   : Fachliche Module deklarieren ihre eigene Union in ihrer eigenen Datei
steht in Issues: [22, 79, 97, 276]
NAECHSTE: Auf dem Speicher dürfen mehrere Ausgabedateien unter eigenen Namen liegen;
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1, Punkt 3) - „**`abgebrochen` ist *kein* Fehlercode.**" (TK 9.2.3) – v

### #172  [TK, anfuehrung]
ZITAT   : verwirft T1 nach dem Lauf
NAECHSTE: **verwirft T1** nach dem Lauf.
KONTEXT : ## Modul & Datei - Modul: `render-service` [P4] (Main) - Datei: `src/main/render-service/arbeitsbereich.ts` - Vertrag: Technisches Konzept **Abschnitt 6** (Ordnerbaum, T1), **9.2.3** (Aufräumen bei Fehler und Abbruch), **9.2.5** (Verantwortungsteilung: „verwirft T1 nach dem Lauf"), **9.2.6** (das Staging der Enddatei liegt **nicht** in T1) – Quelle der Wahrheit - Prozess/Speicher: P4, **T1** (flüc

### #172  [TK, anfuehrung]
ZITAT   : `<Temp>/reel-XXXX/ # C/T1: flüchtig (PNG, seg_*.mp4, concat.txt) – NUR Zwischenprodukte`
steht in Issues: [175]
NAECHSTE:  + pendingDeletions (persistent bis erledigt) <Temp>/reel-XXXX/ # C/T1: flüchtig (PNG, seg_*.mp4, concat.txt) – NUR Zwischenprodukte # Q1 (aktive Warteschlange)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`<Temp>/reel-XXXX/ # C/T1: flüchtig (PNG, seg_*.mp4, concat.txt) – NUR Zwischenprodukte`" (TK Abschnitt 6, Ordnerbaum) - „Aus Entscheidung 4 folgt: Segment-PNGs, Zwischenclips und concat-Liste leben ausschließlich im temporären Bereich (T1) und werden nach jedem Lauf verworfen." (TK Abschnitt 6) - „**T1 behält** die Segme

### #172  [TK, anfuehrung]
ZITAT   : **Genau eine App-Instanz (Voraussetzung für das ganze Lock-Design)** […] **Wichtig für die portable Auslieferung:** Die Sperre muss an den **Datenort** gebunden sein (den App-Ordner mit `projects/`), nicht an den Programmpfad.
NAECHSTE: **Wichtig für die portable Auslieferung:** Die Sperre muss an den **Datenort** gebunden sein (den App-Ordner mit `projects/`), nicht an den Programmpfad.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`<Temp>/reel-XXXX/ # C/T1: flüchtig (PNG, seg_*.mp4, concat.txt) – NUR Zwischenprodukte`" (TK Abschnitt 6, Ordnerbaum) - „Aus Entscheidung 4 folgt: Segment-PNGs, Zwischenclips und concat-Liste leben ausschließlich im temporären Bereich (T1) und werden nach jedem Lauf verworfen." (TK Abschnitt 6) - „**T1 behält** die Segme

### #173  [TK, anfuehrung]
ZITAT   : eins nach dem anderen
steht in Issues: [132, 174, 221]
NAECHSTE: - **Eins nach dem anderen:** Das erste kaputte Element wird hervorgehoben;
KONTEXT : 1. **Die Zeichenregeln für den `ausgabeName` werden hier NICHT nachgebaut.** Diese Datei ruft `loeseAusgabePfad(projektId, ausgabeName)` (#49) auf und wertet **nur** aus, ob das Ergebnis `ok` ist; den gelieferten Pfad **verwirft** sie. Begründung: #49 ist die Pfad-Autorität und führt die Prüfung aus TK 9.2.6 bereits vollständig durch (Pfadtrenner, `..`, unzulässige Zeichen, reservierte Windows-Nam

### #173  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen." (TK 9.1.1, Punkt 6) - „| `ungueltige_eingabe` | Die **Anfrage** verletzt den Vertrag, unabhängig von einz

### #173  [TK, anfuehrung]
ZITAT   : **Die betroffene Element-ID erreicht die Oberfläche über die strukturierten Fehlerdaten.** […] Die Form von `daten` ist damit **je Fehlercode festgelegt**: `{ elementId: string }` bei `medium_fehlt` und `ungueltiges_element`, sonst nicht gesetzt.
NAECHSTE: der er führt. Die Form von `daten` ist damit **je Fehlercode festgelegt**: `{ elementId: string }` bei `medium_fehlt` und `ungueltiges_element`, sonst nicht ges
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen." (TK 9.1.1, Punkt 6) - „| `ungueltige_eingabe` | Die **Anfrage** verletzt den Vertrag, unabhängig von einz

### #173  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [68, 71, 76, 77, 93]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen." (TK 9.1.1, Punkt 6) - „| `ungueltige_eingabe` | Die **Anfrage** verletzt den Vertrag, unabhängig von einz

### #174  [TK, anfuehrung]
ZITAT   : Warum das wichtig ist
steht in Issues: [172, 175, 176]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Gerundet wird mit `Math.round`, ohne jedes Epsilon.** Kein `toFixed`, keine Toleranz, kein `Number.EPSILON`-Zuschlag, keine Vorab-Rundung der Sekunden auf drei Nachkommastellen. Begründung: Der `composer` (#127) rechnet mit derselben Formel auf denselben Gleitkommazahlen. Solange **beide** Seiten exakt `Math.round(x * fps)` schreiben, liefern sie **bitgleich** dasselbe Ergebnis – IEEE-754 ist

### #174  [TK+AD, anfuehrung]
ZITAT   : eins nach dem anderen
steht in Issues: [132, 173, 221]
NAECHSTE: - **Eins nach dem anderen:** Das erste kaputte Element wird hervorgehoben;
KONTEXT : 1. **Gerundet wird mit `Math.round`, ohne jedes Epsilon.** Kein `toFixed`, keine Toleranz, kein `Number.EPSILON`-Zuschlag, keine Vorab-Rundung der Sekunden auf drei Nachkommastellen. Begründung: Der `composer` (#127) rechnet mit derselben Formel auf denselben Gleitkommazahlen. Solange **beide** Seiten exakt `Math.round(x * fps)` schreiben, liefern sie **bitgleich** dasselbe Ergebnis – IEEE-754 ist

### #174  [TK, anfuehrung]
ZITAT   : **`gesamtdauer`** | Summe der (getrimmten) Elementdauern in Sekunden – **framegerundet** gezählt (Frame-Anzahl / 30, s. 9.2.6)
steht in Issues: [19]
NAECHSTE: lbe Wert, der im `RenderRequest` stand (9.2.1) | | `gesamtdauer` | Summe der (getrimmten) Elementdauern in Sekunden – **framegerundet** gezählt (Frame-Anzahl / 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Video-Trim ist framegenau (30 fps):** Bei `"video"`-Items wird der Ausschnitt `[trimStart, trimEnde)` **framegenau** geschnitten […] Beide Grenzen werden auf **dasselbe** 30-fps-Raster gerundet: `startFrame = round(trimStart × 30)`, `endFrame = round(trimEnde × 30)`; behalten werden die Frames `[startFrame, endFrame)`. 

### #175  [TK, anfuehrung]
ZITAT   : Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**
steht in Issues: [85, 87, 97, 100, 101]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : 1. **Die Puffer über ihren zugrunde liegenden Speicher schreiben.** Ein `Uint8Array` ist oft nur ein **Ausschnitt** eines größeren Speicherblocks. Wer `Buffer.from(png.buffer)` schreibt, schreibt den **ganzen** Block – die Datei enthält dann Fremdbytes vor und hinter dem PNG. `ffmpeg` liest sie je nach Fall trotzdem, oder es entsteht ein schwarzes Segment. Der Fehler tritt nur auf, wenn der Puffer

### #175  [TK, anfuehrung]
ZITAT   : Der Ausgabe-**Pfad** ist **nicht** Teil der Anfrage – nur der **Name** […] Der Renderer kennt **keine** absoluten Pfade.
NAECHSTE: vorige Fassung, ein neuer legt eine zusätzliche Datei an | Der Ausgabe-**Pfad** ist **nicht** Teil der Anfrage – nur der **Name**: Der Main setzt ihn über die P
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**PNG-Übergabe als Binärpuffer** (kein Base64 im Nachrichtenkörper). Der **Renderer schreibt nichts auf die Platte**; er liefert die Bytes, der **Main** persistiert sie in den flüchtigen Arbeitsbereich (T1). Die Regel „nur der Main berührt das Dateisystem" bleibt unangetastet." (TK 9.1, Punkt 3) – **dies ist die Datei, di

### #175  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**PNG-Übergabe als Binärpuffer** (kein Base64 im Nachrichtenkörper). Der **Renderer schreibt nichts auf die Platte**; er liefert die Bytes, der **Main** persistiert sie in den flüchtigen Arbeitsbereich (T1). Die Regel „nur der Main berührt das Dateisystem" bleibt unangetastet." (TK 9.1, Punkt 3) – **dies ist die Datei, di

### #175  [TK, anfuehrung]
ZITAT   : `<Temp>/reel-XXXX/ # C/T1: flüchtig (PNG, seg_*.mp4, concat.txt) – NUR Zwischenprodukte`
steht in Issues: [172]
NAECHSTE:  + pendingDeletions (persistent bis erledigt) <Temp>/reel-XXXX/ # C/T1: flüchtig (PNG, seg_*.mp4, concat.txt) – NUR Zwischenprodukte # Q1 (aktive Warteschlange)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**PNG-Übergabe als Binärpuffer** (kein Base64 im Nachrichtenkörper). Der **Renderer schreibt nichts auf die Platte**; er liefert die Bytes, der **Main** persistiert sie in den flüchtigen Arbeitsbereich (T1). Die Regel „nur der Main berührt das Dateisystem" bleibt unangetastet." (TK 9.1, Punkt 3) – **dies ist die Datei, di

### #176  [TK, anfuehrung]
ZITAT   : welche Bandhoehe ist zulaessig
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : /** * Prueft die mitgereiste Einblendung und liefert die Geometrie der GETEILTEN Rechenfunktion * unveraendert weiter. Einzige Autoritaet fuer die Regel „welche Bandhoehe ist zulaessig" – * die Regel „wo liegt was" gehoert seit TK v3.1 in den geteilten Bereich. * * Diese Datei rechnet NICHTS: kein Math.floor, keine 16/9, keine Vierer-Rundung, keine Versaetze. * Sie ruft berechneBandGeometrie(einbl

### #176  [TK, anfuehrung]
ZITAT   : Das Video wird wie gewohnt auf **1920 × 1080** normalisiert (schwarze Balken nach 9.2.4, **keine** Verkleinerung, **keine** Markenfarb-Flaechen). Das Band (1920 × H, **mit Alpha**) wird **unten ueberlagert** (y = 1080 − H).
NAECHSTE:  1080** normalisiert (schwarze Balken nach 9.2.4, **keine** Verkleinerung, **keine** Markenfarb-Flächen). Das Band (1920 × H, **mit Alpha**) wird **unten überla
KONTEXT : **Die Rechenfunktion kennt die Kompositionsart NICHT – der Vertrag gibt ihr genau einen Parameter.** Sie beschreibt die **`split`**-Aufteilung. Fuer `art: 'einblendung'` gilt: „Das Video wird wie gewohnt auf **1920 × 1080** normalisiert (schwarze Balken nach 9.2.4, **keine** Verkleinerung, **keine** Markenfarb-Flaechen). Das Band (1920 × H, **mit Alpha**) wird **unten ueberlagert** (y = 1080 − H).

### #176  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : ## Eingang → Ausgang | Eingang | Bedeutung | Grenzen/Validierung | |---|---|---| | `einblendung.art` | Kompositionsart, beim Einreihen aus der Band-Vorlage abgeleitet | genau `'split'` oder `'einblendung'`; jeder andere Wert → `ungueltiges_element`. **Auch dann prüfen, wenn der Typ es schon zusagt** – der Wert kommt aus dem Renderer, und „**Der Main validiert jede eingehende Nutzlast** – er vertra

### #176  [TK, anfuehrung]
ZITAT   : Warum das wichtig ist
steht in Issues: [172, 174, 175]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Diese Datei schlägt nichts nach.** Sie importiert **nicht** aus dem `vorlagen-store`, ruft **keine** Leseoperation für Vorlagen auf und kennt den Typ `Vorlage` nicht. `bandVorlageId` reist im Auftrag zwar mit, ist hier aber **kein** Eingang – sie dient allein der Nachvollziehbarkeit. Begründung: die Einfrier-Zusage aus TK 9.3.5 (s. „Warum das wichtig ist" und die wörtliche Invariante unten). 

### #176  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : Die **dritte** Zeile ist die Rechenvorschrift für `videoBreite`/`videoVersatzX` und gehört seit TK v3.1 in den **geteilten Bereich** (M7-46), nicht mehr in diese Datei (ENTSCHIEDEN 4). Die **vierte** Zeile ist eine Farb-Entscheidung und gehört in die Filterkette #164 (ENTSCHIEDEN 5). - „**Warum die Breite auf ein Vielfaches von 4 abgerundet wird – bindend:** `yuv420p` (9.2.4) tastet die Farbe in *

### #180  [AD, anfuehrung]
ZITAT   : Fallback für den EXDEV-Fall
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **Verbot – kein zweiter ffprobe-Aufruf, auch nicht „nur für die Dauer“.** Der Istwert steht in `eigenschaften.dauerSekunden` aus **demselben** Lauf (ENTSCHIEDEN oben). Ein zweiter Aufruf verstiesse gegen „**genau einmal** mit `ffprobe` ausgelesen“ (TK 9.2.6) und schüfe die zweite Stelle im `render-service`, die einen ffprobe-Prozess startet. Fehlt `dauerSekunden` in der Umsetzung von #170: **mel

### #180  [TK, blockzitat]
ZITAT   : „**T1 bleibt** für Segment-PNGs, Zwischenclips `seg_*.mp4` und concat-Liste zuständig (Abschnitt 6).“
steht in Issues: [181]
NAECHSTE: **T1 bleibt** für Segment-PNGs, Zwischenclips `seg_*.mp4` und concat-Liste zuständig (Abschnitt 6).
KONTEXT : „**T1 bleibt** für Segment-PNGs, Zwischenclips `seg_*.mp4` und concat-Liste zuständig (Abschnitt 6).“ Und aus TK Abschnitt 6:

### #180  [AD, blockzitat]
ZITAT   : „`ffmpeg` schreibt deshalb **nie** direkt auf den Zielnamen, sondern auf **`projects/<id>/output/<ausgabeName>.mp4.part`**; erst die **fertige und verifizierte** Datei wird **innerhalb desselben Ordners** per Rename-mit-Ersetzen zu `<ausgabeName>.mp4`. Ein Abbruch, ein Fehler oder ein Absturz lässt die vorhandene Datei damit **unversehrt** – ohne diese Regel zerstörte ein fehlgeschlagener Probelauf die letzte funktionierende Ausgabe. Endet der Lauf nicht mit Erfolg, wird die `.part`-Datei entfernt (9.2.3).“
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „`ffmpeg` schreibt deshalb **nie** direkt auf den Zielnamen, sondern auf **`projects/<id>/output/<ausgabeName>.mp4.part`**; erst die **fertige und verifizierte** Datei wird **innerhalb desselben Ordners** per Rename-mit-Ersetzen zu `<ausgabeName>.mp4`. Ein Abbruch, ein Fehler oder ein Absturz lässt die vorhandene Datei damit **unversehrt** – ohne diese Regel zerstörte ein fehlgeschlagener Probelau

### #181  [TK, anfuehrung]
ZITAT   : **Es gibt bewusst *kein* Feld `historieEintrag`.** Der Q3-Protokolleintrag wird **allein von der Auftragsverwaltung** gebaut (9.3) … Der `render-service` liefert nur, was **nur er** weiß: Pfad, Größe, Gesamtdauer und den verwendeten Ausgabenamen; aus den ersten dreien wird `ProtokollEintrag.ausgabe`.
steht in Issues: [53, 68]
NAECHSTE: ervice` liefert nur, was **nur er** weiß: Pfad, Größe, Gesamtdauer und den verwendeten Ausgabenamen; aus den ersten dreien wird `ProtokollEintrag.ausgabe` – der
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Genau **ein** terminaler Ausgang je Lauf, diskriminiert über `status` ∈ { `erfolg`, `fehler`, `abgebrochen` }. Alle drei tragen die `renderId`.“ (TK 9.2.3) - „**Es gibt bewusst *kein* Feld `historieEintrag`.** Der Q3-Protokolleintrag wird **allein von der Auftragsverwaltung** gebaut (9.3) … Der `render-service` liefert nu

### #182  [TK, anfuehrung]
ZITAT   : das Ziel ist in Ordnung, die **interne** Platte nicht
NAECHSTE: Schreibt **nichts** auf die Platte.
KONTEXT : ## Warum das im Gesamtsystem wichtig ist An diesen sieben Codes hängt **unterschiedliches Verhalten in der Oberfläche**, nicht nur unterschiedlicher Text. `datei_zu_gross_fat32` muss dem Nutzer erklären, dass er den Stick auf exFAT formatieren soll; `kein_platz` muss zum Aufräumen führen; `ziel_gesperrt` bedeutet „Datei ist offen, schließe den Player und wiederhole"; `ziel_nicht_verfügbar` bedeute

### #182  [TK, anfuehrung]
ZITAT   : Verbindliche Invarianten
steht in Issues: [1, 2, 3, 4, 5]
NAECHSTE: #### 9.4.8 Invarianten (bindend) 1.
KONTEXT : **Das ist eine Vertragsänderung, kein Alleingang dieses Issues:** TK 9.6.4 führt den Code seit **v2.9** selbst; die Tabelle unter „Verbindliche Invarianten" ist die wörtliche Abschrift dieser Fassung. Findest du in TK 9.6.4 **sechs** statt sieben Zeilen vor, liest du eine ältere Fassung – **melden**, nicht eigenmächtig einen Code streichen oder hinzufügen.

### #182  [TK, anfuehrung]
ZITAT   : Bei uns hängt an den Codes **echtes Verhalten**: […] `datei_zu_gross_fat32` erklärt exFAT, `kein_platz` und `ziel_gesperrt` brauchen verschiedene Hinweise. Geht der Code verloren, degradieren Reparatur-Modus, Wiederholen und der FAT32-Hinweis alle zu „irgendwas ist schiefgelaufen".
NAECHSTE: 1), `datei_zu_gross_fat32` erklärt exFAT, `kein_platz` und `ziel_gesperrt` brauchen verschiedene Hinweise. Geht der Code verloren, degradieren Reparatur-Modus, 
KONTEXT : - „**3. Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**" (TK 9.1.1) - „Bei uns hängt an den Codes **echtes Verhalten**: […] `datei_zu_gross_fat32` erklärt exFAT, `kein_platz` und `ziel_gesperrt` brauchen ver

### #182  [AD, blockzitat]
ZITAT   : „Bei uns hängt an den Codes **echtes Verhalten**: `asset_referenziert` zeigt die betroffenen Listenelemente, `vorlage_referenziert` beide Trefferlisten (9.12.1), `datei_zu_gross_fat32` erklärt exFAT, `kein_platz` und `ziel_gesperrt` brauchen verschiedene Hinweise. Geht der Code verloren, degradieren Reparatur-Modus, Wiederholen und der FAT32-Hinweis alle zu „irgendwas ist schiefgelaufen"." (TK 9.1.1)
steht in Issues: [97]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Bei uns hängt an den Codes **echtes Verhalten**: `asset_referenziert` zeigt die betroffenen Listenelemente, `vorlage_referenziert` beide Trefferlisten (9.12.1), `datei_zu_gross_fat32` erklärt exFAT, `kein_platz` und `ziel_gesperrt` brauchen verschiedene Hinweise. Geht der Code verloren, degradieren Reparatur-Modus, Wiederholen und der FAT32-Hinweis alle zu „irgendwas ist schiefgelaufen"." (TK 9.1

### #184  [TK, anfuehrung]
ZITAT   : nur noch 5 % frei, ich warne mal
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **ENTSCHIEDEN – `Ergebnis<void>` und nicht `Ergebnis<{ dateisystem, freierPlatz }>`.** Der Aufrufer (#188) braucht die Messwerte nicht; er braucht die Entscheidung „darf ich kopieren". Ein Prüfbericht wäre eine zweite Datenquelle, aus der jemand später eigene Schlüsse zieht („nur noch 5 % frei, ich warne mal"). Das TK verlangt: „Wo eine Operation **nichts** zu melden hat, lautet die Nutzlast `void

### #185  [TK, anfuehrung]
ZITAT   : vorhanden, aber unlesbar
steht in Issues: [67]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **ENTSCHIEDEN – jeder Zugriffsfehler auf die Quelldatei ist `keine_ausgabe`, nicht `schreib_fehler`.** TK 9.6.4 beschreibt `schreib_fehler` als „sonstiger I/O-Fehler beim Kopieren"; hier wird nichts kopiert. Für den Nutzer ist die Aussage in beiden Fällen dieselbe: „Diese Ausgabedatei steht nicht zur Verfügung – rendere sie neu oder wähle eine andere." Ein zusätzlicher Code für „vorhanden, aber un

### #187  [TK, anfuehrung]
ZITAT   : kein modulübergreifender Import
NAECHSTE: ein Logo trägt praktisch immer `"importiert"`.
KONTEXT : 1. **#86 gehört zum `media-service`.** Ein Import aus dem `export-service` heraus wäre der **erste modulübergreifende Import zwischen zwei Main-Fachdiensten** im ganzen Projekt und damit ein Präzedenzfall, der den Modulschnitt aufweicht – ausgerechnet zwischen zwei Diensten, die fachlich nichts miteinander zu tun haben. 2. **Die Operationen sind verschieden.** #86 macht `unlink` (löschen), diese D

### #187  [TK, anfuehrung]
ZITAT   : **Windows:** gesperrte Datei → `EBUSY`/`EPERM`. **macOS:** `unlink` gelingt still, obwohl noch geöffnet. Beide Fälle **explizit** behandeln.
steht in Issues: [86, 172]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Atomar ersetzen:** `.part` → `<dateiname>` per Rename-mit-Ersetzen. Auf Windows bei `EBUSY`/`EPERM` **Retry+Backoff**." (TK 9.6.2, Schritt 5) - „**Die vorhandene Zieldatei ist geschützt:** Eine Datei gleichen Namens auf dem Ziel wird **nie** gelöscht oder überschrieben, bevor die neue **vollständig kopiert und größen-ve

### #188  [TK, anfuehrung]
ZITAT   : Kein Projekt geöffnet
steht in Issues: [192]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **ENTSCHIEDEN – bei `holeAktivesProjekt() === null` wird der Flush übersprungen, nicht gescheitert.** „Kein Projekt geöffnet" ist laut #192 ein regulärer Rückgabewert, kein Fehler, und TK 9.5.6 sieht den Zustand ausdrücklich vor („**fehlt** es (extern gelöscht) → sanfter Rückfall auf „kein aktives Projekt / Projektliste", **kein** Absturz."). Ist nichts geöffnet, gibt es auch **nichts**, was der F

### #188  [TK, anfuehrung]
ZITAT   : welche Leiche gehört zu welcher Datei
NAECHSTE: Der Sicherheitsabstand gehört der MARKE;
KONTEXT : **ENTSCHIEDEN – der `.part`-Name ist `<dateiname>.mp4.part`, also der volle Zielname plus `.part`.** So steht es in TK 9.6.2 Schritt 3 („nach `zielPfad/<dateiname>.part`"), und so bleibt die Zuordnung „welche Leiche gehört zu welcher Datei" für den Nutzer im Explorer erkennbar. **Nicht** die Endung ersetzen (`sommer.part`) – das kollidierte mit einem echten Export namens `sommer.part` und verlöre 

### #188  [TK, anfuehrung]
ZITAT   : weil der Stick eben noch da war
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ### Verbote (keine Rückfrage nötig, aber bindend) - **Verbot – der Zugriff auf das aktive Projekt wird nicht improvisiert.** Ausschließlich `holeAktivesProjekt()` (#192). **Kein** eigener Zwischenspeicher für das Projekt, **kein** eigenes Lesen von `project.json`, **kein** erneuter Aufruf von `öffneProjekt` (#34) – das löste einen **Projektwechsel** samt eigenem Flush aus. Existiert `holeAktivesPr

### #188  [TK, blockzitat]
ZITAT   : „Bei `render` und `export` erzwingt der Main den **Sofort-Flush** von D1 (9.5.4) – nicht beim Einreihen. **Er läuft als erster Schritt IM HANDLER**, also nach dem Statuswechsel und bevor der Handler die eigentliche Arbeit aufnimmt."
steht in Issues: [68, 192]
NAECHSTE:  D1 (9.5.4) – nicht beim Einreihen. **Er läuft als erster Schritt IM HANDLER**, also nach dem Statuswechsel und bevor der Handler die eigentliche Arbeit aufnimm
KONTEXT : „Bei `render` und `export` erzwingt der Main den **Sofort-Flush** von D1 (9.5.4) – nicht beim Einreihen. **Er läuft als erster Schritt IM HANDLER**, also nach dem Statuswechsel und bevor der Handler die eigentliche Arbeit aufnimmt." Und die Begründung, ebenfalls wörtlich (TK 9.3.3):

### #191  [TK, blockzitat]
ZITAT   : **10. Die App hat GENAU EIN Fenster – und jedes Ereignis geht an dieses eine Fenster.** […] Der Sender im Main adressiert das eine Fenster; es gibt **keine** Verteilerlogik, **keine** Empfängerliste, **kein** „an alle Fenster senden". Wer im Main ein Ereignis verschickt, hat **keine** Wahl zu treffen.
steht in Issues: [71, 238]
NAECHSTE: *: Der Sender im Main adressiert das eine Fenster; es gibt **keine** Verteilerlogik, **keine** Empfängerliste, **kein** „an alle Fenster senden". Wer im Main ei
KONTEXT : **10. Die App hat GENAU EIN Fenster – und jedes Ereignis geht an dieses eine Fenster.** […] Der Sender im Main adressiert das eine Fenster; es gibt **keine** Verteilerlogik, **keine** Empfängerliste, **kein** „an alle Fenster senden". Wer im Main ein Ereignis verschickt, hat **keine** Wahl zu treffen. (TK 9.1.1 Punkt 10, wörtlich)

### #192  [TK, anfuehrung]
ZITAT   : Lesezugriffe sind sofortig.
NAECHSTE: Lesezugriffe sind sofortig).
KONTEXT : 1. **Deadlock.** `mitD1Lock` ist laut #32 eine **FIFO-Warteschlange innerhalb des Prozesses**: „ruft ein zweiter Aufrufer `mitD1Lock()` auf, während der erste noch läuft, wartet er, bis der erste fertig ist". #32 schreibt als Eingangsbedingung ausdrücklich fest, dass die übergebene Aktion „selbst nicht erneut `mitD1Lock` aufrufen (Deadlock-Gefahr)" darf. Genau das wäre der Normalfall hier: Der Ren

### #192  [TK, anfuehrung]
ZITAT   : am Ende jedes Auftrags, der D1 verändert hat (Import, Löschen)
NAECHSTE: echsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 verändert hat** (Import, Löschen – s. 9.4.5/9.4.6). Beim Beenden **blockiert** die App, bis d
KONTEXT : - **Die in #3 erwogene Alternative bleibt möglich.** #3 fragt, „ob der `project-store` dafür eine eigene, argumentlose Beenden-Funktion anbietet (die sich aktiven Stand und Lock selbst holt)". Dieses Issue baut die **kleinere** Variante: nur den Getter, Lock und Flush bleiben beim Aufrufer. Grund: Eine argumentlose Flush-Funktion müsste das Lock selbst nehmen und wäre damit aus einem bereits gespe

### #193  [TK, anfuehrung]
ZITAT   : Nur der Main-Prozess berührt ffmpeg und Dateisystem.
steht in Issues: [1, 3]
NAECHSTE: - **Nur der Main** berührt das Dateisystem.
KONTEXT : Damit hängt die Invariante aus TK 2 – **„Nur der Main-Prozess berührt ffmpeg und Dateisystem."** – für diesen Fall an nichts als der Aufmerksamkeit des Schreibenden. Dieses Issue ist der richtige Ort für die Schranke, aus demselben Grund wie beim Verbot der Nicht-Null-Behauptung: Der Typechecker kann es nicht, der Linter schon.

### #194  [TK, anfuehrung]
ZITAT   : erst holen, dann abonnieren
steht in Issues: [199, 205, 208, 222, 230]
NAECHSTE: „Erst holen, dann abonnieren" lässt dagegen **keine Lücke**:
KONTEXT : 1. **`ReiterId` wird HIER deklariert und exportiert – nicht in `src/shared/contracts/`.** Der Reiter ist ein reiner Renderer-Begriff; der Main kennt ihn nicht, sendet ihn nicht und empfängt ihn nicht. Ein Eintrag im geteilten Vertrag wäre eine Abhängigkeit ohne Nutzer. Die vier Werte sind **wörtlich** aus #10 übernommen (s. „Fremde Signaturen"); dort steht der Typ **nicht exportiert** in `src/rend

### #194  [TK, anfuehrung]
ZITAT   : Reiterwechsel gerade verboten
NAECHSTE: Ein Reiterwechsel **vermischt** die Historien nicht.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Kein zweiter Navigationsbegriff.** Auch wenn es naheliegt, hier Unter-Ansichten, einen „Vollbild"-Modus, eine Verlaufs-Historie („zurück") oder eine Sperre („Reiterwechsel gerade verboten") zu ergänzen: Das Konzept kennt **vier** Reiter und sonst nichts (TK 9.14.1). Eine Wechsel-Sperre wäre außerdem der direkte Widerspruch zu „Ein Reiterwechsel ve

### #195  [TK, anfuehrung]
ZITAT   : **Die Shell rendert selbst keine Inhalte** – sie ordnet an, wechselt und hält die Warteschlangen-Leiste. Alles Fachliche liegt in den **sechs** Modulen (einschließlich `projekt-verwaltung`, 9.14.3).
steht in Issues: [244, 252, 262]
NAECHSTE:  - **Die Shell rendert selbst keine Inhalte** – sie ordnet an, wechselt und hält die Warteschlangen-Leiste. Alles Fachliche liegt in den **sieben** Modulen (ein
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Die Warteschlangen-Leiste ist in *jedem* Reiter sichtbar.** Sie ist die einzige Stelle, an der laufende, anstehende und fehlgeschlagene Aufträge erkennbar sind (FA-16) – sie darf nie hinter einem Moduswechsel verschwinden. Eingeklappt zeigt sie den Zustand in einer Zeile, aufgeklappt die volle Liste (9.3.4)." (TK 9.14.2

### #197  [TK, anfuehrung]
ZITAT   : **Ausgenommen sind Projekte und Vorlagen:** Beide bleiben ohne offenes Projekt **voll benutzbar** – der Reiter Projekte ist die Einstiegsstelle, und die Vorlagen-Bibliothek ist **app-weit** (9.11.1.1), gehört also keinem Projekt.
steht in Issues: [198, 244, 252]
NAECHSTE: **Ausgenommen sind Projekte, Vorlagen und Marken:** Alle drei bleiben ohne offenes Projekt **voll benutzbar** – der Reiter Projekte ist die Einstiegsstelle, und Vorlagen-Bibliothek (9.11.1.1) wie Marken-Bestand (9.15.1) sind **app-weit**, gehören also keinem Projekt.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Module **außerhalb** dieses Ordners importieren die Sicht **nicht** direkt; sie bekommen die Aktualisierungsfunktion als **Parameter** übergeben. Wer sie beim Aufbau der Oberfläche durchreicht, ist Sache der `app-shell` (M7) und ausdrücklich **nicht** Teil von M5." (#155, ENTSCHIEDEN 1) – **das ist der Auftrag dieser Date

### #198  [TK, anfuehrung]
ZITAT   : **Ohne offenes Projekt sind die Reiter Zusammenstellen/Aktionen leer statt kaputt.** Beim Start ohne wiederherstellbares Projekt (9.5.6) landet der Nutzer im Reiter **Projekte**; **Zusammenstellen** und **Aktionen** zeigen dort einen Hinweis mit dem Weg zum Reiter Projekte, keine Fehlermeldung. **Ausgenommen sind Projekte und Vorlagen:** Beide bleiben ohne offenes Projekt **voll benutzbar** – der Reiter Projekte ist die Einstiegsstelle, und die Vorlagen-Bibliothek ist **app-weit** (9.11.1.1), gehört also keinem Projekt. Wer eine Vorlage bauen will, bevor er ein Projekt anlegt, darf das; ein Hinweis dort wäre eine erfundene Abhängigkeit.
NAECHSTE: - **Ohne offenes Projekt sind die Reiter Zusammenstellen/Aktionen leer statt kaputt.** Beim Start ohne wiederherstellbares Projekt (9.5.6) landet der Nutzer im Reiter **Projekte**;
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Ohne offenes Projekt sind die Reiter Zusammenstellen/Aktionen leer statt kaputt.** Beim Start ohne wiederherstellbares Projekt (9.5.6) landet der Nutzer im Reiter **Projekte**; **Zusammenstellen** und **Aktionen** zeigen dort einen Hinweis mit dem Weg zum Reiter Projekte, keine Fehlermeldung. **Ausgenommen sind Projekte

### #198  [TK, anfuehrung]
ZITAT   : der Vollständigkeit halber
steht in Issues: [76, 92, 109, 153, 164]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keinen dritten Reiter ergänzen.** Auch wenn es beim Bauen naheliegt, den Reiter Vorlagen „der Vollständigkeit halber" mitzunehmen: TK 9.14.2 nennt ihn ausdrücklich als **Ausnahme**, mit Begründung. Wer ihn ergänzt, macht die Vorlagen-Bibliothek von einem Projekt abhängig, das sie nicht braucht. - **Verbot – kein Projekt anlegen, kein Dial

### #199  [TK, anfuehrung]
ZITAT   : erst holen, dann abonnieren
steht in Issues: [194, 205, 208, 222, 230]
NAECHSTE: „Erst holen, dann abonnieren" lässt dagegen **keine Lücke**:
KONTEXT : 1. **Die Undo-Historie wird bei JEDEM terminalen Zustand eines `import`/`loeschen`-Auftrags geleert – nicht nur bei Erfolg.** *Begründung:* Der Lösch-Ablauf ist ausdrücklich „D1 zuerst, Datei danach" (TK 9.4.6). Ein Löschauftrag, der **nach** dem D1-Schritt scheitert, hat den Datenbestand bereits verändert; ein danach gedrücktes Undo würde einen Schnappschuss von **vor** dieser Änderung zurückschr

### #200  [TK, anfuehrung]
ZITAT   : Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle
steht in Issues: [47, 238, 278]
NAECHSTE: **Ereignisse** (Main → Renderer) tragen ebenfalls keine Hülle (Punkt 5).
KONTEXT : ```ts // #47 – src/main/project-store/auto-speichern.ts (DEFINIERENDE QUELLE der Ereignisform) export type AutoSpeichernEreignis = | { typ: "gespeichert" } | { typ: "fehler"; code: Fehlercode } // KEINE Ergebnis<T>-Hülle: „Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle" (TK 9.1.1) // Kanalname (an ipc-gateway zu übergeben, M2/später): "project:autoSpeichernStatus" export function aufAut

### #201  [TK, anfuehrung]
ZITAT   : kehrt danach zum Reiter **Zusammenstellen** zurück
NAECHSTE: erst danach ruft er den Store.
KONTEXT : 1. **Der `rueckkehrReiter` wird beim Wechsel gemerkt, nicht geraten.** `uebernimmUebergabe` bekommt den `aktiverReiter` als Parameter und legt ihn ab; `beendeUebergabe` gibt ihn zurück. *Begründung:* TK 9.14.2 sagt „kehrt danach zum Reiter **Zusammenstellen** zurück" – und das ist im Normalfall auch der Ausgangsreiter. Ein fest verdrahtetes `'zusammenstellen'` wäre trotzdem falsch: Der Nutzer kann

### #201  [AD, anfuehrung]
ZITAT   : wodurch beginnt die Führung?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Der `rueckkehrReiter` wird beim Wechsel gemerkt, nicht geraten.** `uebernimmUebergabe` bekommt den `aktiverReiter` als Parameter und legt ihn ab; `beendeUebergabe` gibt ihn zurück. *Begründung:* TK 9.14.2 sagt „kehrt danach zum Reiter **Zusammenstellen** zurück" – und das ist im Normalfall auch der Ausgangsreiter. Ein fest verdrahtetes `'zusammenstellen'` wäre trotzdem falsch: Der Nutzer kann

### #201  [TK, anfuehrung]
ZITAT   : **Aktions-Segmente werden auf Aktions-Ebene repariert:** Ist ein Aktions-Segment kaputt, weil das **Bild der Aktion** fehlt, liegt der Defekt an der **Aktion**, nicht am einzelnen Listenelement. Die Reparatur leitet dann in den `action-editor` [P2] über (Bild neu verknüpfen/ersetzen/ entfernen). Da Aktionen **referenzierbar** sind, behebt **ein** Fix an der Aktion **alle** Stellen, die sie verwenden – Listenelemente **und Band-Abschnitte**. Der Fortschritt „X von N" kann dadurch um mehr als eins sinken.
steht in Issues: [203]
NAECHSTE: - **Aktions-Segmente werden auf Aktions-Ebene repariert:** Ist ein Aktions-Segment kaputt, weil das **Bild der Aktion** fehlt, liegt der Defekt an der **Aktion**, nicht am einzelnen Listenelement.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Der geführte Reparatur-Modus wechselt den Reiter.** Führt die Reparatur eines Aktions-Bildes in den `action-editor` (9.7.5, 9.8.5), wechselt die Shell in den Reiter **Aktionen**, hebt die betroffene Aktion hervor und **kehrt danach zum Reiter Zusammenstellen zurück**, zur nächsten kaputten Stelle. Der Fortschritt „X von

### #201  [TK+AD, blockzitat]
ZITAT   : 1. **Wodurch die Führung beginnt, ist vollständig entschieden – erledigt.** Der Anlass liegt bei #261 (ENTSCHIEDEN 8), und die Funktionswahl ist jetzt ebenfalls getroffen: **`starteFuehrung` ist ersatzlos gestrichen**, #256 bildet `meldeReparaturStand` einheitlich auf `uebernimmStand` ab – auch den ersten Stand –, weil `stand.aktiv` den geführten Modus bereits trägt (#132). Damit ist „wodurch beginnt die Führung?" an **genau einer** Stelle beantwortbar. Nachgezogen sind: die Signatur oben, ENTSCHIEDEN 8, der Ablauf-Test in der Definition of Done sowie in #256 der Signaturblock, das STOPP-Verbot und die Grep-Probe. 2. **`Uebergabe` trägt beim Medien-Import die Element-Kennung – erledigt.** #133 führt seit dem Nachzug `| { ziel: 'medien-import'; elementId: string }`; der Typ ist oben zeichengleich nachgezogen. Am Verhalten dieser Datei ändert sich nichts: `reiterFuerUebergabe` liefert für `'medien-import'` weiterhin `null` (der Datei-Dialog ist kein Reiter).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte, beide erledigt: 1. **Wodurch die Führung beginnt, ist vollständig entschieden – erledigt.** Der Anlass liegt bei #261 (ENTSCHIEDEN 8), und die Funktionswahl ist jetzt ebenfalls getroffen: **`starteFuehrung` ist ersatzlos gestrichen**, #256 bildet `meldeReparaturStand` einheitlich auf `uebernimmStand` ab – auch

### #203  [TK, anfuehrung]
ZITAT   : **Aktions-Segmente werden auf Aktions-Ebene repariert:** Ist ein Aktions-Segment kaputt, weil das **Bild der Aktion** fehlt, liegt der Defekt an der **Aktion**, nicht am einzelnen Listenelement. Die Reparatur leitet dann in den `action-editor` [P2] über (Bild neu verknüpfen/ersetzen/ entfernen). Da Aktionen **referenzierbar** sind, behebt **ein** Fix an der Aktion **alle** Stellen, die sie verwenden – Listenelemente **und Band-Abschnitte**. Der Fortschritt „X von N" kann dadurch um mehr als eins sinken.
steht in Issues: [201]
NAECHSTE: - **Aktions-Segmente werden auf Aktions-Ebene repariert:** Ist ein Aktions-Segment kaputt, weil das **Bild der Aktion** fehlt, liegt der Defekt an der **Aktion**, nicht am einzelnen Listenelement.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Aktions-Segmente werden auf Aktions-Ebene repariert:** Ist ein Aktions-Segment kaputt, weil das **Bild der Aktion** fehlt, liegt der Defekt an der **Aktion**, nicht am einzelnen Listenelement. Die Reparatur leitet dann in den `action-editor` [P2] über (Bild neu verknüpfen/ersetzen/ entfernen). Da Aktionen **referenzierb

### #204  [TK, anfuehrung]
ZITAT   : **ENTSCHIEDEN – was mit den mehreren Pfaden geschieht, ist geklärt und nicht deine Sache.** Die **Oberfläche** fächert die Mehrfachauswahl auf: Sie reiht für **jeden** zurückgegebenen Pfad einen eigenen Auftrag ein (`reiheEin('import', …)` je Pfad), weil die Warteschlange sie dann einzeln und sichtbar abarbeitet und jeder Fehlschlag einzeln wiederholbar ist (FA-17); ein Sammel-Auftrag wäre unteilbar.
steht in Issues: [81]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**1. Zwei Ebenen nicht verwechseln.**" (TK 9.1.1) – und die beiden Ebenen im Wortlaut: „**Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert (z. B. „Auftrag eingereiht", „Trim gesetzt")?" sowie „**Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, son

### #204  [TK+AD, blockzitat]
ZITAT   : 1. **Der Rückweg von `medium_neu_verknuepfen` ist entschieden UND die Vertragsänderung an #133 vollzogen – erledigt.** Die Übergabe trägt die Kennung des betroffenen Listenelements mit: #133 führt `| { ziel: 'medien-import'; elementId: string }`. Dieses Issue ist davon **nicht** betroffen – seine Signatur bleibt, wie sie ist (ENTSCHIEDEN 7). Der erzwungene Zitat-Abgleich über alle Stellen, die den Typ wörtlich abschreiben – #201, #202, #203, #261, #256 und #262 –, ist gelaufen. Der Ablauf des Abschlusses steht unverändert in #256, ENTSCHIEDEN 12/13; die dortige Melde-Klausel ist gegenstandslos und ersetzt.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Ein Punkt: 1. **Der Rückweg von `medium_neu_verknuepfen` ist entschieden UND die Vertragsänderung an #133 vollzogen – erledigt.** Die Übergabe trägt die Kennung des betroffenen Listenelements mit: #133 führt `| { ziel: 'medien-import'; elementId: string }`. Dieses Issue ist davon **nicht** betroffen – seine Signatur bleibt

### #206  [TK+AD, anfuehrung]
ZITAT   : passiert gerade etwas?
NAECHSTE: Es verlangt gerade Höhen und gerade Versätze.
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Die eingeklappte Zeile ist im Regelbetrieb die **einzige** sichtbare Rückmeldung des ganzen Auftragswesens: Sie ist in jedem Reiter zu sehen (TK 9.14.2) und beantwortet die Frage „passiert gerade etwas?" ohne einen Klick. FA-16 verlangt genau das.

### #208  [TK, anfuehrung]
ZITAT   : erst holen, dann abonnieren
steht in Issues: [194, 199, 205, 222, 230]
NAECHSTE: „Erst holen, dann abonnieren" lässt dagegen **keine Lücke**:
KONTEXT : **ENTSCHIEDEN – dieser Kanal wird OHNE vorheriges Holen abonniert, und das ist kein Widerspruch zu „erst holen, dann abonnieren".** Die Regel aus TK 9.1.1 gilt für Ereignisse, die einen **Stand** tragen, den man verpassen kann – `queue:geaendert` ist so eines, und für die Warteschlange gibt es mit `holeStand()` die passende Leseoperation. Für `render:fortschritt` gibt es **keine** Leseoperation, u

### #209  [AD, anfuehrung]
ZITAT   : der Main validiert ja ohnehin
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Der teuerste lokale Fehlgriff ist, den Schalter **immer** anzubieten und den Main entscheiden zu lassen. Das klingt robust („der Main validiert ja ohnehin"), erzeugt aber genau die Bedienung, die FA-18 vermeiden will: Der Nutzer drückt „Abbrechen" bei einem laufenden **Import**, bekommt `ungueltige_eingabe` zurück, und die Oberfläche muss ihm erklären, warum ein Knopf da war, den es nicht geben du

### #209  [TK, anfuehrung]
ZITAT   : `entferne(auftragId) → Ergebnis<void> // anstehend: aus Schlange nehmen; laeuft+render: Abbruch (→ cancelRender)`
NAECHSTE: chts über den Ausgang entferne(auftragId) → Ergebnis<void> // anstehend: aus Schlange nehmen; laeuft+render: Abbruch (→ cancelRender) wiederhole(auftragId) → Er
KONTEXT : **ENTSCHIEDEN 1 – ein Kanal, nicht zwei.** TK 9.3.4 legt `entferne(auftragId)` für **beide** Fälle fest: „`entferne(auftragId) → Ergebnis<void> // anstehend: aus Schlange nehmen; laeuft+render: Abbruch (→ cancelRender)`". Der Renderer ruft **nicht** `cancelRender` direkt und kennt die `renderId` an dieser Stelle **nicht** – „`entferne` auf einen laufenden `render` delegiert an `cancelRender(render

### #209  [TK, anfuehrung]
ZITAT   : `entferne(auftragId) → Ergebnis<void> // anstehend: aus Schlange nehmen; laeuft+render: Abbruch (→ cancelRender)`
NAECHSTE: chts über den Ausgang entferne(auftragId) → Ergebnis<void> // anstehend: aus Schlange nehmen; laeuft+render: Abbruch (→ cancelRender) wiederhole(auftragId) → Er
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Ein noch nicht gestarteter Auftrag kann aus der Warteschlange entfernt, ein laufender Render abgebrochen werden." (Anforderungsdokument, FA-18) – **die** Regel für `moeglicheAktion`: der laufende **Render**, kein anderer laufender Auftrag. - „`entferne(auftragId) → Ergebnis<void> // anstehend: aus Schlange nehmen; laeuft+

### #210  [TK+AD, anfuehrung]
ZITAT   : `wiederhole(auftragId) → Ergebnis<void> // fehlgeschlagen → anstehend, ans Ende (versuche steigt erst beim Start, 9.3.3)`
NAECHSTE: lange nehmen; laeuft+render: Abbruch (→ cancelRender) wiederhole(auftragId) → Ergebnis<void> // fehlgeschlagen → anstehend, ans Ende (versuche steigt erst beim 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Ein fehlgeschlagener Auftrag bleibt mit Fehlergrund sichtbar und kann erneut ausgeführt werden; er wird dabei ans Ende der Warteschlange gestellt." (Anforderungsdokument, FA-17) - „Ein fehlgeschlagener Auftrag (z. B. Import einer beschädigten Datei, Export auf einen vollen USB-Stick) kann per Klick erneut ausgeführt werde

### #211  [TK, anfuehrung]
ZITAT   : wird beim nächsten Öffnen des Projekts nachgeholt
NAECHSTE: der Reconcile beim nächsten Öffnen des Projekts holt es nach (9.4.7).
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – NIE Meldungstexte vergleichen.** Kein `meldung.includes(...)`, kein `startsWith`, kein `match`, kein `toLowerCase()`-Vergleich auf `meldung`. Ausschließlich `code` entscheidet. (Grep-Probe ist Teil der Definition of Done.) - **Verbot – kein Stacktrace, kein Rohtext als Hauptmeldung.** `titel`, `erklaerung` und `handlung` werden **immer** 

### #212  [TK+AD, blockzitat]
ZITAT   : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Unter den zehn `preview-player`-Issues #212 bis #221 gibt es **keines**, das die Teile zusammensetzt: Niemand wählt anhand des aktuellen Achsenabschnitts den passenden Darstellungs-Baustein aus, niemand treibt `tick` (#214) mit einem Bildtakt an, und niemand hängt die Bühne in den Reiter „Zusammenstellen" (TK 9.14.1: „Zusammenstellen = composer [P3] + preview-player [P5]"). Die Teile sind einzeln vollständig und prüfbar, die laufende Vorschau entsteht daraus aber erst mit dieser Verdrahtung. Sie hier anzuhängen wäre ein Regel-E-Bruch (der Prüfpunkt hinge an sechs fremden Dateien) – deshalb steht es als Vermerk.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Unter den zehn `preview-player`-Issues #212 bis #221 gibt es **keines**, das die Teile zusammensetzt: Niemand wählt anhand des aktuellen Achsenabschnitts den passenden Darstellungs-Baustein aus, niemand treibt `tick` (#214) mit einem Bildtakt an, und niemand hängt die Bühne in den Reiter „Zusammenstellen" (TK 9.14.1: „Zusa

### #217  [TK, anfuehrung]
ZITAT   : kein zweiter Zeichenpfad
steht in Issues: [115, 117, 140, 150, 250]
NAECHSTE: Es wird **kein zweiter Typ** dafür erfunden:
KONTEXT : **ENTSCHIEDEN 1 – das gelieferte Canvas wird EINGEHÄNGT, nicht abgemalt.** Das `HTMLCanvasElement` aus `zeichneSegment` wird per Verweis in einen Behälter eingefügt. Es wird **nicht** in ein zweites Canvas kopiert, **nicht** über `toDataURL`/`alsPng` in ein `<img>` verwandelt und **nicht** neu gezeichnet. Seine Anzeigegrösse wird auf **exakt** seine native Grösse gesetzt (`breite`/`höhe` aus dem R

### #221  [TK, anfuehrung]
ZITAT   : Datei neu verknüpfen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Nach oben:** Sie darf **nicht reparieren**. Das Technische Konzept ist eindeutig: „**Kaputte Elemente** (`fehlt`-Asset, 9.4.7) zeigen einen **Platzhalter** (konsistent mit `action-editor` 9.8.5); die eigentliche Reparatur erfolgt im `composer` (9.7.5)." (TK 9.9.3) Die naheliegende Freundlichkeit – ein Knopf „Datei neu verknüpfen" direkt im Platzhalter – wäre ein schwerer Fehler. Der `composer` f

### #222  [TK, anfuehrung]
ZITAT   : Sie haben keine Projekte
NAECHSTE: string // für die Meldung „… in 2 Projekten" id:
KONTEXT : **Der teuerste lokale Fehlgriff wäre eine Liste, die lügt, indem sie schweigt.** Solange `listeProjekte` noch nicht geantwortet hat, ist der Bestand **unbekannt** – nicht leer. Wer beides zusammenfallen lässt, zeigt einem Nutzer, dessen Datenort gerade nicht erreichbar ist (portable App auf einem abgezogenen USB-Datenträger, TK 9.5.4), die Aussage „Sie haben keine Projekte". Der naheliegende nächs

### #222  [TK, anfuehrung]
ZITAT   : hier geht nichts verloren
steht in Issues: [226, 247]
NAECHSTE: für Marken ist nichts Neues erfunden.
KONTEXT : 1. **Es wird geholt, aber nichts abonniert.** Für Projekte gibt es **kein** Ereignis vom Main, und es wird auch keins erfunden. *Begründung:* Alles, was den Bestand ändert, geht durch dieses Modul selbst (anlegen, duplizieren, löschen – #224 bis #226); der Aufrufer ruft danach `ladeProjektliste()` erneut. Ein IPC-Ereignis wäre eine Reise durch den Main und zurück, nur um mitzuteilen, was der Rende

### #222  [AD, anfuehrung]
ZITAT   : Erstell-/ Änderungsdatum
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Es wird geholt, aber nichts abonniert.** Für Projekte gibt es **kein** Ereignis vom Main, und es wird auch keins erfunden. *Begründung:* Alles, was den Bestand ändert, geht durch dieses Modul selbst (anlegen, duplizieren, löschen – #224 bis #226); der Aufrufer ruft danach `ladeProjektliste()` erneut. Ein IPC-Ereignis wäre eine Reise durch den Main und zurück, nur um mitzuteilen, was der Rende

### #223  [TK, anfuehrung]
ZITAT   : Fehler melden, nicht leer weiterstarten
NAECHSTE: ist auch das defekt → **Fehler melden**, **nicht** leer/verlustbehaftet weiterstarten.
KONTEXT : ## Modul & Datei - Modul: `projekt-verwaltung` (Renderer) – das **sechste** Renderer-Modul (TK 9.14.3) - Dateien dieses Issues (+ zugehörige Testdateien): - `src/renderer/projekt-verwaltung/beschaedigt.ts` – die **reine** Ableitung und der eine IPC-Aufruf (ohne React, ohne JSX, vollständig ohne Browser prüfbar) - `src/renderer/projekt-verwaltung/beschaedigt.tsx` – die Darstellung der beschädigten 

### #223  [TK, anfuehrung]
ZITAT   : daneben aber überall in der * Projektverwaltung
NAECHSTE: o.), das sich nicht öffnen lässt – daneben aber überall in der Projektverwaltung (9.14.3).
KONTEXT : /** * Öffnet `projects/<projektId>/` im Datei-Explorer des Betriebssystems (TK 9.5.2). * INSTANT-Aufruf, KEIN Auftrag der Queue. Diese Funktion baut KEINEN Pfad – sie schickt nur die * Projektkennung; der Main ist die Pfad-Autorität (TK 9.5.7). * Auch für NICHT beschädigte Projekte benutzbar (TK 9.5.2: „daneben aber überall in der * Projektverwaltung"). */ export async function oeffneProjektordner

### #223  [TK, anfuehrung]
ZITAT   : `beschaedigt: boolean` // true = weder project.json noch project.json.bak lesbar
NAECHSTE: boolean // true = weder project.json noch project.json.bak lesbar anzahlMedien:
KONTEXT : 1. **`beschaedigt` ist das einzige Kriterium – es wird nichts nachgeprüft.** Kein zweiter Test („Name leer?", „Datum verdächtig?", „Ordner sieht komisch aus?"). *Begründung:* Der Main hat die Prüfung bereits gemacht, und zwar mit der einzigen Information, die sie beantworten kann – dem Leseversuch auf `project.json` **und** `project.json.bak` (TK 9.5.2: „`beschaedigt: boolean` // true = weder proj

### #224  [TK, anfuehrung]
ZITAT   : beim Öffnen eines Projekts
steht in Issues: [67, 91, 94, 243, 259]
NAECHSTE: der Reconcile beim nächsten Öffnen des Projekts holt es nach (9.4.7).
KONTEXT : 1. **Ein frisch angelegtes Projekt wird immer auch geöffnet.** *Begründung:* Alles andere wäre eine Sackgasse – der Nutzer hat „Neues Projekt" gedrückt, um damit zu arbeiten. TK 9.14.3 verlangt den Reiterwechsel ohnehin „beim Öffnen eines Projekts", und ein angelegtes, aber nicht geöffnetes Projekt hinterließe die Anwendung im Zustand vor der Aktion. **Zur Kenntnis, nicht zum Nachbessern:** #33 sc

### #224  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : 1. **Ein frisch angelegtes Projekt wird immer auch geöffnet.** *Begründung:* Alles andere wäre eine Sackgasse – der Nutzer hat „Neues Projekt" gedrückt, um damit zu arbeiten. TK 9.14.3 verlangt den Reiterwechsel ohnehin „beim Öffnen eines Projekts", und ein angelegtes, aber nicht geöffnetes Projekt hinterließe die Anwendung im Zustand vor der Aktion. **Zur Kenntnis, nicht zum Nachbessern:** #33 sc

### #224  [TK, anfuehrung]
ZITAT   : Verwirft den Motiv-Bestand. Vor jedem Projektwechsel und nach jedem abgeschlossenen Import aufzurufen; danach muss bereiteZeichnenVor erneut laufen.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Beim Öffnen eines Projekts wechselt die Shell in den Reiter Zusammenstellen** – der Nutzer landet dort, wo er weiterarbeitet, statt in der Liste stehen zu bleiben." (TK 9.14.3) - „Das **aktive** Projekt lebt zur Laufzeit **im Speicher** (Quelle der Wahrheit während der Sitzung; Lesezugriffe sind sofortig). Nur *ein* Pro

### #225  [TK, anfuehrung]
ZITAT   : nach dem Beschneiden leer
steht in Issues: [224]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Der Auslöser wird für die Dauer des Aufrufs gesperrt, und der Hinweis steht sichtbar.** *Begründung:* `dupliziereProjekt` ist eine **Instant-Operation** und läuft ausdrücklich **nicht** über die Warteschlange (TK 9.5.2 führt sie unter „Operationen (Instant, über das D1-Lock)") – es gibt also weder Fortschrittsanzeige noch Abbruch, und die Warteschlangen-Leiste bleibt leer. Zugleich kopiert si

### #227  [TK, anfuehrung]
ZITAT   : Bild ohne Maße ist kaputt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Der teuerste lokale Fehlgriff wäre eine zweite Wahrheit darüber, was „kaputt" heißt.** Ob eine Aktion brauchbar ist, entscheidet bereits #135 (`istAktionKaputt`), und ob ein Medium fehlt, steht als `Asset.zustand` im Datensatz – gesetzt vom Reconcile beim Projekt-Öffnen (TK 9.4.7). Wer hier eine eigene Regel erfindet („Bild ohne Maße ist kaputt", „Video ohne Dauer ist kaputt"), erzeugt eine Anze

### #227  [TK, anfuehrung]
ZITAT   : Video ohne Dauer ist kaputt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Der teuerste lokale Fehlgriff wäre eine zweite Wahrheit darüber, was „kaputt" heißt.** Ob eine Aktion brauchbar ist, entscheidet bereits #135 (`istAktionKaputt`), und ob ein Medium fehlt, steht als `Asset.zustand` im Datensatz – gesetzt vom Reconcile beim Projekt-Öffnen (TK 9.4.7). Wer hier eine eigene Regel erfindet („Bild ohne Maße ist kaputt", „Video ohne Dauer ist kaputt"), erzeugt eine Anze

### #228  [TK, anfuehrung]
ZITAT   : Nutzer bricht ab | `ok: true` // mit `pfade = []` – Abbruch ist kein Fehler
NAECHSTE:  Array absoluter Quellpfade | | Nutzer bricht ab | `ok: true` mit `pfade = []` – Abbruch ist **kein** Fehler | **`importMedium` (Auftrag `art: import`):** Einga
KONTEXT : // #81 – src/main/media-service/dialog.ts (ruft #204, NICHT diese Datei) export async function öffneMedienDialog(): Promise<Ergebnis<{ pfade: string[] }>> // „Nutzer wählt Dateien | `pfade` = Array absoluter Quellpfade" / „Nutzer bricht ab | `ok: true` // mit `pfade = []` – Abbruch ist kein Fehler" (TK 9.4.3)

### #228  [TK, anfuehrung]
ZITAT   : **Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert (z. B. „Auftrag eingereiht", „Trim gesetzt")? **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus …? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3).
steht in Issues: [134, 231]
NAECHSTE: ln.** - **Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert (z. B. „Auftrag eingereiht", „Trim gesetzt")? - **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`R
KONTEXT : 1. **Aus der Bibliothek heraus wird mit `nurTyp: null` importiert – beide Typen.** *Begründung:* Die Medien-Bibliothek führt Videos **und** Bilder (#227), und der Nutzer stellt eine Werbeschleife aus beidem zusammen. Müsste er vorher den Typ wählen, könnte er nicht beides in einem Zug auswählen – genau die Begründung, mit der #81 den kombinierten ersten Dialog-Filter festgelegt hat. Der Fall `nurT

### #228  [TK, anfuehrung]
ZITAT   : **Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert (z. B. „Auftrag eingereiht", „Trim gesetzt")? **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3).
steht in Issues: [134, 231]
NAECHSTE: reiht", „Trim gesetzt")? - **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sonder
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert (z. B. „Auftrag eingereiht", „Trim gesetzt")? **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3)." (TK 9.1.1) - „Nutzer bricht ab | `ok: true` mit `pfad

### #228  [TK, anfuehrung]
ZITAT   : Die **Oberfläche** fächert die Mehrfachauswahl auf: Sie reiht für **jeden** zurückgegebenen Pfad einen eigenen Auftrag ein (`reiheEin('import', …)` je Pfad), weil die Warteschlange sie dann einzeln und sichtbar abarbeitet und jeder Fehlschlag einzeln wiederholbar ist (FA-17); ein Sammel-Auftrag wäre unteilbar.
steht in Issues: [81, 204]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert (z. B. „Auftrag eingereiht", „Trim gesetzt")? **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3)." (TK 9.1.1) - „Nutzer bricht ab | `ok: true` mit `pfad

### #231  [TK, anfuehrung]
ZITAT   : der aufgelöste Pfad liegt innerhalb von `projects/<id>/output/`
NAECHSTE: Der aufgelöste Pfad muss **innerhalb** von `projects/<id>/output/` liegen.
KONTEXT : `pruefeAusgabeName` setzt genau diese Liste um – als **frühe Rückmeldung**. Die Prüfung „der aufgelöste Pfad liegt innerhalb von `projects/<id>/output/`" kann der Renderer **nicht** leisten: Er kennt keine absoluten Pfade (TK 9.5.7). Sie bleibt allein beim Main, und die maßgebliche Validierung ist ohnehin dort (TK 9.1.1 Punkt 6).

### #231  [TK, anfuehrung]
ZITAT   : **Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert (z. B. „Auftrag eingereiht", „Trim gesetzt")? **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3).
steht in Issues: [134, 228]
NAECHSTE: reiht", „Trim gesetzt")? - **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sonder
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Der Ausgabename ist Nutzereingabe und wird validiert (FA-22):** Erlaubt ist ein reiner Dateiname **ohne** Endung – **keine** Pfadtrenner (`/`, `\`), **kein** `..`, keine für Windows/macOS/FAT32 unzulässigen Zeichen (`< > : " | ? *`, Steuerzeichen), nicht leer, keine reservierten Windows-Namen (`CON`, `PRN`, `AUX`, `NUL`

### #232  [TK+AD, anfuehrung]
ZITAT   : **Eine gewählte** Ausgabedatei
NAECHSTE: die **fertige** Ausgabedatei.
KONTEXT : 1. **Die wählbaren Dateien kommen als PARAMETER aus #230 – sie werden hier nicht geladen.** *Begründung:* TK 9.6.1 nennt die Quelle ausdrücklich: „**Woher `dateiname` kommt:** Die Auswahl speist sich aus `listeAusgaben` (9.5.2)". #230 ist der Halter dieses Bestands und sein einziger Aufrufer; ein zweiter Ladeweg wäre ein zweiter Stand, und dann böte der Export womöglich eine Datei an, die in der L

### #232  [TK, anfuehrung]
ZITAT   : `wähleExportZiel() → Ergebnis<{ pfad }> // Instant; Ordner-/Laufwerks-Dialog, vorbelegt mit letztem Ziel (config-store)`
NAECHSTE: uftrag):** ``` wähleExportZiel() → Ergebnis<{ pfad }> // Instant; Ordner-/Laufwerks-Dialog, vorbelegt mit letztem Ziel (config-store) ``` **`export` (Auftrag `a
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Eine gewählte Ausgabedatei kann in einen Zielordner bzw. direkt auf den USB-Speicher exportiert werden – **unter ihrem eigenen Namen**. Auf dem Speicher dürfen mehrere Ausgabedateien nebeneinander liegen." (Anforderungsdokument, FA-09) - „Der Nutzer wählt, **welche** Ausgabedatei auf den USB-Speicher geht; sie behält dort

### #233  [TK+AD, blockzitat]
ZITAT   : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Issues führen `leereProjektHistorie` unter „Kommt aus #233": **#199**, **#224** (Verbot „kein eigener Undo-Stapel") und **#226** (`LoeschWirkungen.leereProjektHistorie`). Die Funktion entsteht tatsächlich in **#234** (`undo-historien.ts`), weil **dieses** Issue bewusst zustandslos ist und deshalb keine benannte Historie leeren kann. Name und Signatur (`() => void`) sind identisch, nur die Datei ist eine andere – für den Aufrufer ändert sich nichts. In #224 und #226 ist die Angabe bereits auf #234 berichtigt; #199 gehört einer anderen Gruppe und wird dort nachgezogen.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Issues führen `leereProjektHistorie` unter „Kommt aus #233": **#199**, **#224** (Verbot „kein eigener Undo-Stapel") und **#226** (`LoeschWirkungen.leereProjektHistorie`). Die Funktion entsteht tatsächlich in **#234** (`undo-historien.ts`), weil **dieses** Issue bewusst zustandslos ist und deshalb keine benannte Histor

### #234  [TK, anfuehrung]
ZITAT   : nach App-Neustart leer
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Zwei getrennte Historien:** Projekt-Bearbeitung und Vorlagen-Editor haben **eigene** Stapel (sie bearbeiten verschiedene Datensätze) und werden nie vermischt." (TK 9.13.2) - „**Undo/Redo gilt im jeweils aktiven Reiter** und arbeitet auf dessen Historie (9.13.2: getrennte Stapel für Projekt-Bearbeitung und Vorlagen-Edito

### #234  [TK, blockzitat]
ZITAT   : „**Zwei getrennte Historien:** Projekt-Bearbeitung und Vorlagen-Editor haben **eigene** Stapel (sie bearbeiten verschiedene Datensätze) und werden nie vermischt." (TK 9.13.2)
steht in Issues: [233, 236, 243, 244, 245]
NAECHSTE: - **Zwei getrennte Historien:** Projekt-Bearbeitung und Vorlagen-Editor haben **eigene** Stapel (sie bearbeiten verschiedene Datensätze) und werden nie vermischt.
KONTEXT : „**Zwei getrennte Historien:** Projekt-Bearbeitung und Vorlagen-Editor haben **eigene** Stapel (sie bearbeiten verschiedene Datensätze) und werden nie vermischt." (TK 9.13.2) „**Undo/Redo gilt im jeweils aktiven Reiter** und arbeitet auf dessen Historie (9.13.2: getrennte Stapel für Projekt-Bearbeitung und Vorlagen-Editor). Ein Reiterwechsel **vermischt** die Historien nicht." (TK 9.14.2)

### #236  [TK, anfuehrung]
ZITAT   : Diese Datei merkt sich **keinen** vorherigen Rahmen.
steht in Issues: [144]
NAECHSTE: macht **keinen** finalen Render;
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – niemals in den Parent schreiben.** Diese Datei ruft **nicht** `uebernehmeInParent`, **nicht** `alsEigenstaendige`, **nicht** `verwerfeArbeitskopie`, **nicht** `erstelleVorlage`, **nicht** `löscheVorlage` und **nicht** `oeffneZurBearbeitung`. Ein Rückgängig darf die **genutzte** Vorlage unter keinen Umständen berühren – sie bestimmt das Au

### #236  [TK, blockzitat]
ZITAT   : „**Beide** Editoren – Projekt-Bearbeitung und Vorlagen-Editor – bieten **Undo/Redo** für Bearbeitungsschritte (Liste, Reihenfolge, Trim, Dauer, Aktionen, Zonen). **Nicht** rückgängig machbar sind abgeschlossene Vorgänge mit Dateiwirkung (Import, Löschen von Medien, Render, Export) – ein gelöschtes Medium muss neu importiert werden." (Anforderungsdokument, FA-21)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Beide** Editoren – Projekt-Bearbeitung und Vorlagen-Editor – bieten **Undo/Redo** für Bearbeitungsschritte (Liste, Reihenfolge, Trim, Dauer, Aktionen, Zonen). **Nicht** rückgängig machbar sind abgeschlossene Vorgänge mit Dateiwirkung (Import, Löschen von Medien, Render, Export) – ein gelöschtes Medium muss neu importiert werden." (Anforderungsdokument, FA-21) „**Undo/Redo** gilt im Editor für a

### #236  [TK, blockzitat]
ZITAT   : „**Auto-Speichern trifft nur die Arbeitskopie.** Während des Bearbeitens wird entprellt gesichert (3–5 s, wie 9.5.4) – aber **ausschließlich** in die Arbeitskopie." (TK 9.12.1)
steht in Issues: [245, 251]
NAECHSTE: - **Auto-Speichern trifft nur die Arbeitskopie.** Während des Bearbeitens wird entprellt gesichert (3–5 s, wie 9.5.4) – aber **ausschließlich** in die Arbeitskopie.
KONTEXT : „**Auto-Speichern trifft nur die Arbeitskopie.** Während des Bearbeitens wird entprellt gesichert (3–5 s, wie 9.5.4) – aber **ausschließlich** in die Arbeitskopie." (TK 9.12.1) „**Merge ist ein vollständiges Ersetzen, kein Feld-Abgleich.**" (TK 9.12.1)

### #238  [TK, anfuehrung]
ZITAT   : Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle
steht in Issues: [47, 200, 278]
NAECHSTE: **Ereignisse** (Main → Renderer) tragen ebenfalls keine Hülle (Punkt 5).
KONTEXT : ```ts // #47 – src/main/project-store/auto-speichern.ts (DEFINIERENDE QUELLE der project-Seite) export type AutoSpeichernEreignis = | { typ: "gespeichert" } | { typ: "fehler"; code: Fehlercode } // KEINE Ergebnis<T>-Hülle: „Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle" (TK 9.1.1) // Kanalname (an ipc-gateway zu uebergeben, M2/spaeter): "project:autoSpeichernStatus"

### #239  [TK, anfuehrung]
ZITAT   : nur schnell, damit nichts Kaputtes durchgeht
steht in Issues: [258]
NAECHSTE: Der **Renderer schreibt nichts auf die Platte**;
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keine Validierung, keine Fehlercodes, keine `Ergebnis`-Hülle.** Auch nicht „nur schnell, damit nichts Kaputtes durchgeht". Die Prüfung ist Vertrag des `render-service` (TK 9.2.8, wörtlich oben); eine zweite, leicht abweichende Prüfung hier wäre eine zweite Wahrheit über zulässige Bandhöhen – und welche gewinnt, hinge davon ab, welche zuer

### #239  [TK, anfuehrung]
ZITAT   : was zeige ich, wenn die Höhe unbrauchbar ist?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keine Validierung, keine Fehlercodes, keine `Ergebnis`-Hülle.** Auch nicht „nur schnell, damit nichts Kaputtes durchgeht". Die Prüfung ist Vertrag des `render-service` (TK 9.2.8, wörtlich oben); eine zweite, leicht abweichende Prüfung hier wäre eine zweite Wahrheit über zulässige Bandhöhen – und welche gewinnt, hinge davon ab, welche zuer

### #239  [TK+AD, blockzitat]
ZITAT   : 1. **#176 ist nachzuziehen.** `src/main/render-service/band-geometrie.ts` wurde vor dem Absatz „Die Rechnung liegt im geteilten Bereich" (TK 9.2.8) geschrieben und weicht in **Name und Feldnamen** vom Vertrag ab: `bestimmeBandgeometrie` statt `berechneBandGeometrie`, `Bandgeometrie` statt `BandGeometrie`, und die Felder heißen dort `bandHoehe`, `bandBreite`, `bandX`, `bandY`, `videoBreite`, `videoHoehe`, `videoEingepasstBreite`, `videoEingepasstX` (acht Felder, ohne Umlaute) statt der sieben aus TK 9.2.8. Nachzuziehen ist: #176 behält seine Signatur, seine **Prüfung** und seine Fehlercode-Vergabe und ruft für die Werte `berechneBandGeometrie(höhe)` aus dieser Datei auf, statt sie selbst zu rechnen. **Kein Issue fasst ein fremdes an**, deshalb steht das hier als Vermerk und nicht in der Definition of Done. Solange #176 nicht nachgezogen ist, existiert die Rechnung **zweimal** – genau der Zustand, den dieses Issue beendet. 2. **Ein Punkt zum Nachschärfen im TK:** Die Vertragssignatur `berechneBandGeometrie(höhe)` hat **keinen** Parameter für die Kompositionsart, und sechs ihrer sieben Felder gelten nur für `split`; ein `einblendung`-Aufrufer benutzt daraus **allein** `bandY`. Das ist widerspruchsfrei (bei `einblendung` ist das Video vollflächig, es gibt nichts einzupassen), aber der Rückgabe- datensatz führt in dieser Betriebsart sechs Werte mit, die nicht gelten. Wenn das so bleiben soll, gehört ein Satz dazu ins TK; andernfalls bräuchte die Funktion die `art` – dann ändert sich der Vertrag, und dieses Issue ist entsprechend anzupassen. **Entschieden habe ich hier nichts** – die Signatur folgt dem Vertrag, wie er heute steht.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** 1. **#176 ist nachzuziehen.** `src/main/render-service/band-geometrie.ts` wurde vor dem Absatz „Die Rechnung liegt im geteilten Bereich" (TK 9.2.8) geschrieben und weicht in **Name und Feldnamen** vom Vertrag ab: `bestimmeBandgeometrie` statt `berechneBandGeometrie`, `Bandgeometrie` statt `BandGeometrie`, und die Felder he

### #240  [TK, blockzitat]
ZITAT   : „**Eigener IPC-Kanal** nach 9.1.1 Punkt 4: `project:setzeBearbeitungsstand`." (TK 9.5.2)
NAECHSTE: **Eigener IPC-Kanal** nach 9.1.1 Punkt 4:
KONTEXT : „**Eigener IPC-Kanal** nach 9.1.1 Punkt 4: `project:setzeBearbeitungsstand`." (TK 9.5.2) „Sie braucht nach 9.1.1 Punkt 4 einen **eigenen IPC-Kanal** (`project:öffneProjektordner`) – ohne Anmeldung im `ipc-gateway` bliebe sie eine Main-Funktion ohne Aufrufer." (TK 9.5.2)

### #240  [TK, blockzitat]
ZITAT   : „Diese `projektId` wird am Ende der Kette zu einem **Pfadsegment**" (#76)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Diese `projektId` wird am Ende der Kette zu einem **Pfadsegment**" (#76) „Geprüft wird die **Form**: nicht leerer String, UUID-Form nach TK 9.11.4" (#76)

### #242  [TK, anfuehrung]
ZITAT   : app-shell: die sechs Renderer-Oberflächen in die vier Reiter eintragen
NAECHSTE: :** Die `app-shell` ist der Rahmen, der die **sieben** Renderer-Oberflächen anordnet und den Wechsel zwischen ihnen führt. Ohne sie wäre offen, wo `composer`, `
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **Die Zusammensetzung des Reiters „Zusammenstellen" hat keinen Eigentümer.** #195 übergibt ausdrücklich Platzhalter, #242 liefert die Vorschau als Komponente – aber niemand setzt `composer` und `preview-player` nebeneinander und verbindet sie mit den Sichten aus #197. Dieselbe Lücke gilt für die drei übrige

### #242  [TK+AD, blockzitat]
ZITAT   : 1. **Die Zusammensetzung des Reiters „Zusammenstellen" hat keinen Eigentümer.** #195 übergibt ausdrücklich Platzhalter, #242 liefert die Vorschau als Komponente – aber niemand setzt `composer` und `preview-player` nebeneinander und verbindet sie mit den Sichten aus #197. Dieselbe Lücke gilt für die drei übrigen Reiter. Es fehlt ein Verdrahtungs-Issue der Art „app-shell: die sechs Renderer-Oberflächen in die vier Reiter eintragen". 2. **#234 zitiert TK 9.14.1 ungenau.** Dort steht „Zusammenstellen = composer [P3] + preview-player [P5]" und „Aktionen = action-editor [P2] + große Live-Vorschau" mit **einfachen** Leerzeichen um das Pluszeichen; im Technischen Konzept stehen die Zeilen in einem Codeblock mit **zwei** Leerzeichen davor und dahinter. Inhaltlich unverändert, aber Regel D verlangt Zeichengleichheit – dieses Issue verwendet die Fassung aus dem Technischen Konzept. 3. **`sindSchriftenBereit` (#110) wird hier NICHT gerufen.** Diese Datei leitet „Schriften bereit" aus `voraussetzungen !== null` ab, weil #154 `'schriften_fehlen'` als eigenen Fehlercode führt und ein erfolgreiches Vorbereiten den Fall damit ausschließt. #217 ruft `sindSchriftenBereit` zusätzlich selbst. Das sind zwei Wege zu derselben Auskunft; sie können heute nicht auseinanderlaufen, aber falls #154 je ohne Schriftprüfung erfolgreich zurückkehren kann, gehört die Ableitung hier korrigiert.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **Die Zusammensetzung des Reiters „Zusammenstellen" hat keinen Eigentümer.** #195 übergibt ausdrücklich Platzhalter, #242 liefert die Vorschau als Komponente – aber niemand setzt `composer` und `preview-player` nebeneinander und verbindet sie mit den Sichten aus #197. Dieselbe Lücke gilt für die drei übrige

### #243  [TK, anfuehrung]
ZITAT   : vor jeder Instant-Operation
NAECHSTE: - Führt alle **Instant-Operationen** aus (nicht über die Queue):
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Schnappschuss-basiert:** Vor jeder Instant-Operation wird ein Schnappschuss des betroffenen Datensatzes gehalten; Undo stellt ihn wieder her. **Nicht** über „inverse Operationen" – eine falsch implementierte Umkehrung ist eine stille Fehlerquelle, ein Schnappschuss ist trivial korrekt." (TK 9.13.2) – **das ist der Auftr

### #243  [TK, anfuehrung]
ZITAT   : Änderungen innerhalb einer Sekunde zusammenfassen
steht in Issues: [245]
NAECHSTE: number | null // Sekunden, 3 Nachkommastellen (Video);
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keine Zeile in einer M5-Datei.** Weder im `composer`, noch im `action-editor`, noch im `vorlagen-editor` wird ein `merkeVorAenderung` nachgetragen. Die dortigen Verbote („Baue hier **keinen** Undo-Stapel", #124) bleiben unverändert gültig, und ein Nachtrag in fremden Dateien ist genau die Kollision, die der Modulschnitt ausschließt. - **V

### #243  [TK+AD, blockzitat]
ZITAT   : 1. **Die offene Frage aus #235 („Wer ruft `merkeVorAenderung` vor jeder Instant-Operation?") ist mit diesem Issue beantwortet.** Der Auslöser ist die Hülle um die gemeinsame Projekt-Sicht, nicht der Editor. M7-42s zweite Frage (Leeren beim Projektwechsel) beantwortet **#252/#224**: `leereProjektHistorie` ist ein Feld von `ProjektWechselWirkungen` und wird beim Öffnen eines Projekts gerufen. 2. **Ein `verwerfeObersten()` in #233 würde den letzten Rest der Optimistik-Falle schließen.** Heute bleibt nach einer abgelehnten Operation ein Schnappschuss liegen, der dem jetzigen Stand entspricht; ein Rückgängig in diesem schmalen Zeitfenster bewirkt sichtbar nichts und verbraucht einen Schritt. Regel R2 sorgt dafür, dass er spätestens mit der nächsten Änderung wieder nützlich wird, und **kein** abgelehnter Zustand wird je erreicht. Ob #233 um eine Verwerfen-Operation ergänzt wird, ist eine Vertragsentscheidung – dieses Issue kommt bewusst ohne sie aus, weil es #233 nicht ändern darf.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte: 1. **Die offene Frage aus #235 („Wer ruft `merkeVorAenderung` vor jeder Instant-Operation?") ist mit diesem Issue beantwortet.** Der Auslöser ist die Hülle um die gemeinsame Projekt-Sicht, nicht der Editor. M7-42s zweite Frage (Leeren beim Projektwechsel) beantwortet **#252/#224**: `leereProjektHistorie` ist e

### #244  [TK, anfuehrung]
ZITAT   : **Ausgenommen sind Projekte und Vorlagen:** Beide bleiben ohne offenes Projekt **voll benutzbar** – der Reiter Projekte ist die Einstiegsstelle, und die Vorlagen-Bibliothek ist **app-weit** (9.11.1.1), gehört also keinem Projekt.
steht in Issues: [197, 198, 252]
NAECHSTE: **Ausgenommen sind Projekte, Vorlagen und Marken:** Alle drei bleiben ohne offenes Projekt **voll benutzbar** – der Reiter Projekte ist die Einstiegsstelle, und Vorlagen-Bibliothek (9.11.1.1) wie Marken-Bestand (9.15.1) sind **app-weit**, gehören also keinem Projekt.
KONTEXT : „**Ausgenommen sind Projekte und Vorlagen:** Beide bleiben ohne offenes Projekt **voll benutzbar** – der Reiter Projekte ist die Einstiegsstelle, und die Vorlagen-Bibliothek ist **app-weit** (9.11.1.1), gehört also keinem Projekt." (TK 9.14.2)

### #244  [TK, anfuehrung]
ZITAT   : erst holen, dann abonnieren
steht in Issues: [194, 199, 205, 208, 222]
NAECHSTE: „Erst holen, dann abonnieren" lässt dagegen **keine Lücke**:
KONTEXT : 1. **Die fünf Modul-Wurzeln kommen als PARAMETER, nicht per Import.** *Begründung – drei Gründe:* (a) Es ist die Regel des Meilensteins: Module außerhalb des besitzenden Ordners bekommen, was sie brauchen, als Parameter, nicht per Import (Entscheidung E1, in #197 ausgeschrieben). (b) #197 hat für sich in Anspruch genommen, „die EINZIGE Datei in `src/renderer/app-shell/`" zu sein, „die aus einem an

### #244  [TK, anfuehrung]
ZITAT   : **Die Shell rendert selbst keine Inhalte** – sie ordnet an, wechselt und hält die Warteschlangen-Leiste. Alles Fachliche liegt in den **sechs** Modulen (einschließlich `projekt-verwaltung`, 9.14.3).
steht in Issues: [195, 252, 262]
NAECHSTE:  - **Die Shell rendert selbst keine Inhalte** – sie ordnet an, wechselt und hält die Warteschlangen-Leiste. Alles Fachliche liegt in den **sieben** Modulen (ein
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „ Zusammenstellen = composer [P3] + preview-player [P5]" (TK 9.14.1) - „ Aktionen = action-editor [P2] + große Live-Vorschau" (TK 9.14.1) - „ Vorlagen = vorlagen-editor (Canvas + Zonen-Liste + Inspektor)" (TK 9.14.1) - „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1) - „Der gewählte Reiter nutzt die ganze Fläch

### #244  [TK, anfuehrung]
ZITAT   : **Ausgenommen sind Projekte und Vorlagen:** Beide bleiben ohne offenes Projekt **voll benutzbar** – der Reiter Projekte ist die Einstiegsstelle, und die Vorlagen-Bibliothek ist **app-weit** (9.11.1.1), gehört also keinem Projekt.
steht in Issues: [197, 198, 252]
NAECHSTE: **Ausgenommen sind Projekte, Vorlagen und Marken:** Alle drei bleiben ohne offenes Projekt **voll benutzbar** – der Reiter Projekte ist die Einstiegsstelle, und Vorlagen-Bibliothek (9.11.1.1) wie Marken-Bestand (9.15.1) sind **app-weit**, gehören also keinem Projekt.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „ Zusammenstellen = composer [P3] + preview-player [P5]" (TK 9.14.1) - „ Aktionen = action-editor [P2] + große Live-Vorschau" (TK 9.14.1) - „ Vorlagen = vorlagen-editor (Canvas + Zonen-Liste + Inspektor)" (TK 9.14.1) - „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1) - „Der gewählte Reiter nutzt die ganze Fläch

### #244  [TK, blockzitat]
ZITAT   : „ Zusammenstellen = composer [P3] + preview-player [P5]" (TK 9.14.1)
steht in Issues: [261]
NAECHSTE: : │ │ Zusammenstellen = composer [P3] + preview-player [P5] │ │ Aktionen = action-editor [P2] + große Live-Vorschau │ │ Vorlagen = vorlagen-editor (Canvas + Zon
KONTEXT : „ Zusammenstellen = composer [P3] + preview-player [P5]" (TK 9.14.1) „ Aktionen = action-editor [P2] + große Live-Vorschau" (TK 9.14.1) „ Vorlagen = vorlagen-editor (Canvas + Zonen-Liste + Inspektor)" (TK 9.14.1) „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1)

### #244  [TK, blockzitat]
ZITAT   : „ Aktionen = action-editor [P2] + große Live-Vorschau" (TK 9.14.1)
steht in Issues: [250]
NAECHSTE: : │ │ Zusammenstellen = composer [P3] + preview-player [P5] │ │ Aktionen = action-editor [P2] + große Live-Vorschau │ │ Vorlagen = vorlagen-editor (Canvas + Zon
KONTEXT : „ Zusammenstellen = composer [P3] + preview-player [P5]" (TK 9.14.1) „ Aktionen = action-editor [P2] + große Live-Vorschau" (TK 9.14.1) „ Vorlagen = vorlagen-editor (Canvas + Zonen-Liste + Inspektor)" (TK 9.14.1) „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1)

### #244  [TK+AD, blockzitat]
ZITAT   : „ Vorlagen = vorlagen-editor (Canvas + Zonen-Liste + Inspektor)" (TK 9.14.1)
steht in Issues: [251]
NAECHSTE: n-editor [P2] + große Live-Vorschau │ │ Vorlagen = vorlagen-editor (Canvas + Zonen-Liste + Inspektor) │ │ Marken = marken-editor (Liste + Rollen + Live-Vorschau
KONTEXT : „ Zusammenstellen = composer [P3] + preview-player [P5]" (TK 9.14.1) „ Aktionen = action-editor [P2] + große Live-Vorschau" (TK 9.14.1) „ Vorlagen = vorlagen-editor (Canvas + Zonen-Liste + Inspektor)" (TK 9.14.1) „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1)

### #244  [TK, blockzitat]
ZITAT   : „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1)
steht in Issues: [252]
NAECHSTE: - **Bedient wird sie in der `projekt-verwaltung`** (Reiter [Projekte], 9.14.3), **nicht** im `marken-editor`.
KONTEXT : „ Zusammenstellen = composer [P3] + preview-player [P5]" (TK 9.14.1) „ Aktionen = action-editor [P2] + große Live-Vorschau" (TK 9.14.1) „ Vorlagen = vorlagen-editor (Canvas + Zonen-Liste + Inspektor)" (TK 9.14.1) „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1) Daraus folgt Zeile für Zeile:

### #244  [AD, blockzitat]
ZITAT   : 1. **ERLEDIGT.** Hier stand, vier von fünf Modul-Wurzeln existierten nicht. Sie liegen inzwischen alle vor: `composer` (#261), `action-editor` (#250), `vorlagen-editor` (#251), `projekt-verwaltung` (#252) – neben der Vorschau (#242). 2. **ERLEDIGT.** Hier stand, die Wiedergabeliste habe gar keine Ansicht. **#248** zeichnet sie, **#249** liefert die Bedienelemente je Zeile. 3. **`App.tsx` muss nachgezogen werden.** #195 besitzt die Datei und übergibt dort noch die Platzhalter aus #10. Der Aufruf von `verteileZugaenge` und `baueReiterInhalte` gehört genau dorthin – zusammen mit dem Start-Ablauf (#196), dem Auftrags-Nachlauf (#199), dem Speicherhinweis (#200) und der Warteschlangen-Leiste (#205). **Kein** Issue beauftragt diesen Nachzug; #195 verbietet ihn sich selbst nicht, hat ihn aber auch nicht in seiner Definition of Done. **ERLEDIGT: Dieser Nachzug ist inzwischen als #260 und #262 beauftragt** – es bildet dort auch `umgebung.composerVerdrahtung` aus dem Reparaturhalter (#256) und `umgebung.wechsleZuZusammenstellen`. Für **dieses** Issue ändert sich dadurch nichts: `src/renderer/App.tsx` bleibt ausserhalb seines Dateibereichs. 4. **ERLEDIGT.** Hier stand, die Reparatur-Führung bleibe halb verdrahtet. **#256** ruft `uebernimmUebergabe`/`beendeUebergabe` und führt den Reiterwechsel aus; **#262** verdrahtet die Melde-Wege. Offen bleibt allein, wer `UebergabeOverlay` einsetzt (s. #256, VERMERK 2).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Vier Punkte, von denen drei erledigt sind – die Nummerierung bleibt, weil andere Issues sie zitieren: 1. **ERLEDIGT.** Hier stand, vier von fünf Modul-Wurzeln existierten nicht. Sie liegen inzwischen alle vor: `composer` (#261), `action-editor` (#250), `vorlagen-editor` (#251), `projekt-verwaltung` (#252) – neben der Vorsc

### #245  [TK, anfuehrung]
ZITAT   : nach Editor-Schluss leer
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Schnappschuss-basiert:** Vor jeder Instant-Operation wird ein Schnappschuss des betroffenen Datensatzes gehalten; Undo stellt ihn wieder her. **Nicht** über „inverse Operationen" – eine falsch implementierte Umkehrung ist eine stille Fehlerquelle, ein Schnappschuss ist trivial korrekt." (TK 9.13.2) – **das ist der Auftr

### #245  [TK, blockzitat]
ZITAT   : „**Schnappschuss-basiert:** Vor jeder Instant-Operation wird ein Schnappschuss des betroffenen Datensatzes gehalten; Undo stellt ihn wieder her. **Nicht** über „inverse Operationen" – eine falsch implementierte Umkehrung ist eine stille Fehlerquelle, ein Schnappschuss ist trivial korrekt." (TK 9.13.2)
steht in Issues: [233, 235, 236, 237, 243]
NAECHSTE: nen Datensatzes gehalten; Undo stellt ihn wieder her. **Nicht** über „inverse Operationen" – eine falsch implementierte Umkehrung ist eine stille Fehlerquelle, 
KONTEXT : „**Schnappschuss-basiert:** Vor jeder Instant-Operation wird ein Schnappschuss des betroffenen Datensatzes gehalten; Undo stellt ihn wieder her. **Nicht** über „inverse Operationen" – eine falsch implementierte Umkehrung ist eine stille Fehlerquelle, ein Schnappschuss ist trivial korrekt." (TK 9.13.2) „**Undo/Redo** gilt im Editor für alle Zonen- und Parameter-Änderungen (9.13)." (TK 9.12.2)

### #245  [TK+AD, blockzitat]
ZITAT   : 1. **Zwei der drei offenen Fragen aus #236 sind mit diesem Issue beantwortet.** „Wer ruft `merkeVorlageVorAenderung` vor jeder Zonen- oder Parameter-Änderung?" → der Sitzungshalter, vor jeder Übernahme. „Wer ruft `leereVorlagenHistorie` beim Editor-Schluss?" → `beendeSitzung()`. Die dritte (`alsEigenstaendige`) wird gegenstandslos, sobald `beendeSitzung` beim Abschluss gerufen wird. 2. **Die Aufrufer liegen in #251.** Die Wurzel des `vorlagen-editor` nimmt den Halter als Eigenschaft `sitzung: Sitzungshalter` entgegen und ruft alle drei Wege; #244 reicht ihn über `Reiterumgebung.vorlagenSitzung` durch, #262 holt ihn in `App.tsx`. Damit ist die Kette geschlossen. Offen bleibt allein, ob die Bearbeitungsschritte selbst (#144 bis #147) auf Gestenende zusammenfassen – das ist Punkt 3. 3. **Die Granularität einer Ziehbewegung ist die einzige echte Produktentscheidung hier.** Sie gehört zu #144 und ist oben im STOPP ausgeschrieben. Bleibt sie offen, ist Rückgängig im Vorlagen-Editor zwar korrekt, aber unbrauchbar fein.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **Zwei der drei offenen Fragen aus #236 sind mit diesem Issue beantwortet.** „Wer ruft `merkeVorlageVorAenderung` vor jeder Zonen- oder Parameter-Änderung?" → der Sitzungshalter, vor jeder Übernahme. „Wer ruft `leereVorlagenHistorie` beim Editor-Schluss?" → `beendeSitzung()`. Die dritte (`alsEigenstaendige`

### #246  [TK, blockzitat]
ZITAT   : 3. **Der `media-service` verlässt sich weiterhin auf sein Netz – zu Recht.** Die Freigabe macht
NAECHSTE: - **`media-service` besitzt NICHT:** das Lesen der Asset-Liste (das macht `project-store`);
KONTEXT : 3. **Der `media-service` verlässt sich weiterhin auf sein Netz – zu Recht.** Die Freigabe macht den Retry aus TK 9.4.6 nicht überflüssig; sie macht ihn nur zu dem, was er sein soll: die

### #247  [TK+AD, blockzitat]
ZITAT   : 1. **#35 und #75 sind nachzuziehen:** Sie sollen `ProjektMeta` bzw. `AusgabeDatei` künftig aus `src/shared/contracts/projekt-meta.ts` **importieren und re-exportieren**, statt sie lokal zu deklarieren – so bleiben bestehende Importe aus dem Main gültig. Ein Issue fasst kein fremdes an, deshalb steht der Nachzug hier und nicht in der Definition of Done. 2. **#222 und #230 sind nachgezogen – ERLEDIGT.** Beide ersetzen ihre strukturgleiche Zweitdeklaration samt der ausgeschriebenen ACHTUNG-Blöcke jetzt durch `import type` **UND** `export type` – nicht nur `import type` –, also durch ```ts import type { ProjektMeta } from '../../shared/contracts/projekt-meta' export type { ProjektMeta } ``` bzw. dasselbe für `AusgabeDatei`. **Ohne das Re-Export brechen neun Importe**, denn beide Typen werden heute aus der jeweiligen Modul-Datei bezogen, nicht aus dem geteilten Vertrag: - `ProjektMeta` aus `'./liste'` (#222) – **sechs** Stellen: #223 (`beschaedigt.ts` **und** `beschaedigt.tsx`), #225 (`duplizieren.ts`), #226 (`loeschen.ts` **und** `loeschen.tsx`) und #252 (`verwaltung-montage.ts`). - `AusgabeDatei` aus `'./ausgabe-liste'` (#230) – **drei** Stellen: #231 (`render-dialog.ts`) und #232 (`export-dialog.ts` **und** `export-dialog.tsx`). Alle neun bleiben mit dem Re-Export **Zeichen für Zeichen** gültig; ein Umschreiben dieser neun Dateien ist damit **nicht** nötig und ausdrücklich **nicht** gewollt – es wäre ein Eingriff in sieben fremde Issues für einen Import-Pfad. Dabei entfällt in #222 und #230 auch der Satz, `src/shared/contracts/**` sei für das Issue gesperrt – er war die Begründung für die Zweitdeklaration. 3. **Der überholte Vermerk in #222 ist bereinigt – ERLEDIGT.** Er warnte, `ProjektMeta` in #35 trage `anzahlMedien` und `anzahlAusgaben` „noch **nicht**". Beide Felder sind vorhanden; die ACHTUNG-Kastenzeile in #222 verweist jetzt auf den geteilten Typ statt auf #35, sodass in keinem angelegten Issue eine falsche Tatsachenbehauptung stehen bleibt. 4. **Zwei Kommentarabweichungen bleiben nach dem Nachzug übrig und sollten mitbereinigt werden:** #35 schreibt die Umlaute in seinen Kommentaren aus (`gezaehlt`, `Zaehlweise`), TK 9.5.2 nicht; und #75 führt `geaendertAm` mit einem verkürzten Kommentar ohne den Zusatz „(die Datei entsteht atomar, 9.2.6)". Beides ist harmlos, solange die Deklaration nur an **einer** Stelle steht – und genau das stellt dieses Issue her.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Vier Punkte: 1. **#35 und #75 sind nachzuziehen:** Sie sollen `ProjektMeta` bzw. `AusgabeDatei` künftig aus `src/shared/contracts/projekt-meta.ts` **importieren und re-exportieren**, statt sie lokal zu deklarieren – so bleiben bestehende Importe aus dem Main gültig. Ein Issue fasst kein fremdes an, deshalb steht der Nachzu

### #250  [TK, anfuehrung]
ZITAT   : die betroffene Aktion hervorhebt
NAECHSTE: die betroffene Aktion hervor und **kehrt danach zum Reiter Zusammenstellen zurüc
KONTEXT : 1. **Der neue Stand geht über `projekt.setzeProjekt(mitAktion(projekt, aktion))` in die gemeinsame Sicht – nach JEDEM erfolgreichen Schreibvorgang.** Betroffen sind `legeAktionAn` (#136), `speichereAktion` (#136), `weiseBildZu` und `entferneBild` (#138), `setzeAkzentfarbe` (#139) und `behebeAktionsBild` (#141). **ACHTUNG – die Rückgabeform ist bei fünf Wegen gleich und beim sechsten anders.** Die 

### #250  [AD, blockzitat]
ZITAT   : „**Der praktische Grund wiegt am schwersten:** Alle fünf Wurzeln liegen inzwischen vor – die Vorschau (#242), der `composer` (#261), der `action-editor` (#250), der `vorlagen-editor` (#251) und die `projekt-verwaltung` (#252) –, aber als **Pflichtfelder eines Typs** bleibt jedes Fehlen unübersehbar: Es kompiliert nicht ohne sie." (#244, ENTSCHIEDEN 1)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Der praktische Grund wiegt am schwersten:** Alle fünf Wurzeln liegen inzwischen vor – die Vorschau (#242), der `composer` (#261), der `action-editor` (#250), der `vorlagen-editor` (#251) und die `projekt-verwaltung` (#252) –, aber als **Pflichtfelder eines Typs** bleibt jedes Fehlen unübersehbar: Es kompiliert nicht ohne sie." (#244, ENTSCHIEDEN 1) Dieses Issue liefert eine davon. Es hängt dara

### #250  [TK, blockzitat]
ZITAT   : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte:
steht in Issues: [243, 254, 255, 258]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte: 1. **ERLEDIGT mit TK v3.2: „Aktion löschen" ist undo-fähig.** Der Auftraggeber hat entschieden, dass `löscheAktion` den vollständigen neuen `stand` (Typ `Bearbeitungsstand`) **zusätzlich** zu den beiden Kennungslisten liefert (TK 9.5.2/9.5.3). Damit geht der Weg in die Sicht über `setzeProjekt`, und die Undo-H

### #250  [AD, blockzitat]
ZITAT   : 1. **ERLEDIGT mit TK v3.2: „Aktion löschen" ist undo-fähig.** Der Auftraggeber hat entschieden, dass `löscheAktion` den vollständigen neuen `stand` (Typ `Bearbeitungsstand`) **zusätzlich** zu den beiden Kennungslisten liefert (TK 9.5.2/9.5.3). Damit geht der Weg in die Sicht über `setzeProjekt`, und die Undo-Hülle (#243) legt den Schnappschuss von selbst an – ohne Sonderfall und ohne zweiten Eingang in die Rückgängig-Verwaltung, der ausdrücklich verworfen wurde. Nachgezogen sind #40 (Main), #76 (Gateway), #142 (Renderer-Aufruf) und ENTSCHIEDEN 6 dieses Issues. Der Typ ist `Bearbeitungsstand` und **nicht** `Projekt`, weil `assets` und `letzterAusgabeName` von `löscheAktion` gar nicht angefasst werden. 2. **Der Rückweg der Reparatur-Übergabe bleibt offen.** Diese Wurzel hebt die benannte Aktion hervor, meldet aber nicht, wann die Reparatur dort abgeschlossen ist. #201 stellt `beendeUebergabe` bereit, #244 führt die Frage „Wer meldet den Abschluss einer Reparatur-Übergabe?" als offen – sie ist es weiterhin. Ohne eine Antwort kehrt der geführte Ablauf nicht in den Reiter Zusammenstellen zurück, und TK 9.14.2 („**kehrt danach zum Reiter Zusammenstellen zurück**") bleibt unerfüllt.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte: 1. **ERLEDIGT mit TK v3.2: „Aktion löschen" ist undo-fähig.** Der Auftraggeber hat entschieden, dass `löscheAktion` den vollständigen neuen `stand` (Typ `Bearbeitungsstand`) **zusätzlich** zu den beiden Kennungslisten liefert (TK 9.5.2/9.5.3). Damit geht der Weg in die Sicht über `setzeProjekt`, und die Undo-H

### #251  [TK, anfuehrung]
ZITAT   : Nutzung wird angezeigt, bevor überarbeitet wird
steht in Issues: [254]
NAECHSTE: - **Nutzung wird angezeigt,** bevor überarbeitet oder gelöscht wird („wird von 7 Aktionen in 2 Projekten verwendet") – ein Merge verändert **alle** davon.
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **Die Live-Vorschau des Vorlagen-Editors kann keine echte Aktion zeigen.** TK 9.12.2 verlangt sie ausdrücklich („Gezeichnet wird mit einer **echten Aktion aus der Bibliothek** (im Editor wählbar)"), und #150 ist genau dafür gebaut – aber #244 gibt dieser Wurzel bewusst **keinen** Projektzugang (ENTSCHIEDEN 

### #251  [TK, blockzitat]
ZITAT   : „ Vorlagen = vorlagen-editor (Canvas + Zonen-Liste + Inspektor)" (TK 9.14.1)
steht in Issues: [244]
NAECHSTE: n-editor [P2] + große Live-Vorschau │ │ Vorlagen = vorlagen-editor (Canvas + Zonen-Liste + Inspektor) │ │ Marken = marken-editor (Liste + Rollen + Live-Vorschau
KONTEXT : „ Vorlagen = vorlagen-editor (Canvas + Zonen-Liste + Inspektor)" (TK 9.14.1) Daraus und aus TK 9.12.2 folgt die feste Aufteilung – **zwei** Ansichten, zwischen denen die Sitzung entscheidet:

### #251  [TK, blockzitat]
ZITAT   : „**Zahlen-Inspektor** (`x` / `y` / `breite` / `höhe`): für exakte Werte. Reines Ziehen trifft einen Wert wie 1056 nie genau, deshalb sind **beide** Wege Pflicht." (TK 9.12.2)
steht in Issues: [145]
NAECHSTE: emaßen – für das schnelle Gestalten. - **Zahlen-Inspektor** (`x` / `y` / `breite` / `höhe`): für exakte Werte. Reines Ziehen trifft einen Wert wie 1056 nie gena
KONTEXT : „**Zahlen-Inspektor** (`x` / `y` / `breite` / `höhe`): für exakte Werte. Reines Ziehen trifft einen Wert wie 1056 nie genau, deshalb sind **beide** Wege Pflicht." (TK 9.12.2) ## ENTSCHIEDEN (lokale Festlegungen dieses Issues – kein TK-Zitat, aber verbindlich)

### #251  [TK, blockzitat]
ZITAT   : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte:
steht in Issues: [242, 245, 246, 253, 256]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **Die Live-Vorschau des Vorlagen-Editors kann keine echte Aktion zeigen.** TK 9.12.2 verlangt sie ausdrücklich („Gezeichnet wird mit einer **echten Aktion aus der Bibliothek** (im Editor wählbar)"), und #150 ist genau dafür gebaut – aber #244 gibt dieser Wurzel bewusst **keinen** Projektzugang (ENTSCHIEDEN 

### #251  [TK+AD, blockzitat]
ZITAT   : 1. **Die Live-Vorschau des Vorlagen-Editors kann keine echte Aktion zeigen.** TK 9.12.2 verlangt sie ausdrücklich („Gezeichnet wird mit einer **echten Aktion aus der Bibliothek** (im Editor wählbar)"), und #150 ist genau dafür gebaut – aber #244 gibt dieser Wurzel bewusst **keinen** Projektzugang (ENTSCHIEDEN 6: die Vorlagen-Bibliothek ist app-weit). Damit bleibt in v1 nur `BEISPIEL_AKTION`. Der Widerspruch ist auflösbar, aber nur durch eine Entscheidung: entweder bekommt die Wurzel einen **lesenden** Projektzugang (der Reiter bliebe ohne offenes Projekt trotzdem benutzbar – dann greift die Beispiel-Aktion), oder TK 9.12.2 wird auf die Beispiel-Aktion zurückgenommen. **Der zweite Weg kostet Vertrauen in die Vorschau**, weil eine Vorlage dann nie mit echten Texten geprüft wird und die Überlauf-Kaskade (9.10.6) genau dort zuschlägt, wo echte Titel länger sind als das Beispiel. 2. **`p.zeichnen` ist in dieser Wurzel unbenutzbar.** `ZeichenZugang.bereiteVor` verlangt ein `Project`, das hier nicht vorliegt. Die Eigenschaft steht in `VorlagenEditorWurzelProps` (#244), wird aber nie gerufen. Entweder gehört sie dort weg, oder sie kommt zusammen mit Punkt 1 zu einer Verwendung. 3. **ERLEDIGT – „Nutzung wird angezeigt, bevor überarbeitet wird" hat eine Datenquelle:** #254 (`holeNutzung`) mit dem Kanal aus #255; eingesetzt wird sie in ENTSCHIEDEN 9a dieses Issues (Überarbeiten) und in #155, ENTSCHIEDEN 8/9 (Löschen). Der ursprüngliche Befund lautete: **„Nutzung wird angezeigt, bevor überarbeitet wird" hat keine Datenquelle.** TK 9.12.2 nennt `pruefeVorlagenReferenzen` (9.12.1), aber in M5 gibt es dafür **keinen** Renderer-Weg: #155 liefert die Trefferlisten nur im Fehlerfall von `entferneVorlage` (unter `fehler.daten`). Für das **Überarbeiten** – also genau den Fall, in dem ein Merge „alle davon verändert" – fehlt sie. Nötig ist ein Renderer-Aufruf auf `vorlagen:pruefeVorlagenReferenzen` und, falls der Kanal noch nicht angemeldet ist, seine Verdrahtung.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **Die Live-Vorschau des Vorlagen-Editors kann keine echte Aktion zeigen.** TK 9.12.2 verlangt sie ausdrücklich („Gezeichnet wird mit einer **echten Aktion aus der Bibliothek** (im Editor wählbar)"), und #150 ist genau dafür gebaut – aber #244 gibt dieser Wurzel bewusst **keinen** Projektzugang (ENTSCHIEDEN 

### #252  [TK, anfuehrung]
ZITAT   : `ok: false` heißt: Es DARF nicht gelöscht werden.
NAECHSTE: ein zweites Lock ist nicht nötig und darf nicht eingeführt werden.
KONTEXT : 1. **Die drei Wirkungs-Bündel entstehen an GENAU EINER Stelle – in `verwaltung-montage.ts`.** *Begründung:* Sie überschneiden sich (`verwirfMotivBestand`, `leereProjektHistorie` und `aktualisiereProjektliste` kommen in mehreren vor). Zwei Bauplätze hätten unweigerlich zwei Belegungen, und die Abweichung fiele erst beim Projektwechsel auf – als falsches Motiv oder als Rückgängig, das Daten vernicht

### #252  [TK, anfuehrung]
ZITAT   : `anzahlMedien === 0` sieht kaputt aus
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Die drei Wirkungs-Bündel entstehen an GENAU EINER Stelle – in `verwaltung-montage.ts`.** *Begründung:* Sie überschneiden sich (`verwirfMotivBestand`, `leereProjektHistorie` und `aktualisiereProjektliste` kommen in mehreren vor). Zwei Bauplätze hätten unweigerlich zwei Belegungen, und die Abweichung fiele erst beim Projektwechsel auf – als falsches Motiv oder als Rückgängig, das Daten vernicht

### #252  [TK, anfuehrung]
ZITAT   : **Der Reiter Projekte bleibt ohne offenes Projekt voll benutzbar.** […]
NAECHSTE: der Reiter **Projekte** bleibt ohne offenes Projekt voll benutzbar).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1) - „**Ist:** die Liste der Projekte (`listeProjekte`, 9.5.2) mit Name, Datum und **Beschädigt-Kennzeichnung**; die Bedienung der fünf Vorgänge über die Operationen des `project-store`; die **Lösch-Bestätigung**, die Name, Medienzahl, Ausgabenzahl und die Unumkehrb

### #252  [TK, anfuehrung]
ZITAT   : **Ausgenommen sind Projekte und Vorlagen:** Beide bleiben ohne offenes Projekt **voll benutzbar** – der Reiter Projekte ist die Einstiegsstelle, und die Vorlagen-Bibliothek ist **app-weit** (9.11.1.1), gehört also keinem Projekt.
steht in Issues: [197, 198, 244]
NAECHSTE: **Ausgenommen sind Projekte, Vorlagen und Marken:** Alle drei bleiben ohne offenes Projekt **voll benutzbar** – der Reiter Projekte ist die Einstiegsstelle, und Vorlagen-Bibliothek (9.11.1.1) wie Marken-Bestand (9.15.1) sind **app-weit**, gehören also keinem Projekt.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1) - „**Ist:** die Liste der Projekte (`listeProjekte`, 9.5.2) mit Name, Datum und **Beschädigt-Kennzeichnung**; die Bedienung der fünf Vorgänge über die Operationen des `project-store`; die **Lösch-Bestätigung**, die Name, Medienzahl, Ausgabenzahl und die Unumkehrb

### #252  [TK, anfuehrung]
ZITAT   : **Die Shell rendert selbst keine Inhalte** – sie ordnet an, wechselt und hält die Warteschlangen-Leiste. Alles Fachliche liegt in den **sechs** Modulen (einschließlich `projekt-verwaltung`, 9.14.3).
steht in Issues: [195, 244, 262]
NAECHSTE:  - **Die Shell rendert selbst keine Inhalte** – sie ordnet an, wechselt und hält die Warteschlangen-Leiste. Alles Fachliche liegt in den **sieben** Modulen (ein
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1) - „**Ist:** die Liste der Projekte (`listeProjekte`, 9.5.2) mit Name, Datum und **Beschädigt-Kennzeichnung**; die Bedienung der fünf Vorgänge über die Operationen des `project-store`; die **Lösch-Bestätigung**, die Name, Medienzahl, Ausgabenzahl und die Unumkehrb

### #252  [TK, anfuehrung]
ZITAT   : **Ein Reiterwechsel verwirft nie Arbeit.** […]
NAECHSTE: - **Ein Reiterwechsel verwirft nie Arbeit.** Instant-Änderungen sind bereits gesichert (9.5.4);
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1) - „**Ist:** die Liste der Projekte (`listeProjekte`, 9.5.2) mit Name, Datum und **Beschädigt-Kennzeichnung**; die Bedienung der fünf Vorgänge über die Operationen des `project-store`; die **Lösch-Bestätigung**, die Name, Medienzahl, Ausgabenzahl und die Unumkehrb

### #252  [TK+AD, anfuehrung]
ZITAT   : in der Reihenfolge, die der Main geliefert hat
steht in Issues: [222, 230, 329]
NAECHSTE: Die umgekehrte Reihenfolge wäre falsch:
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – der Projektzugang wird NICHT umhüllt.** Kein `umhuelleFuerBearbeitung`, kein `merkeVorAenderung`, kein `baueUndoZugang`. Die Begründung steht in ENTSCHIEDEN 4. - **Verbot – kein Feld der drei Bündel bleibt leer, und keins wird durch eine leere Funktion ersetzt.** Ein `() => {}` an Stelle von `leereProjektHistorie` oder `verwirfMotivBestan

### #252  [TK, blockzitat]
ZITAT   : „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1)
steht in Issues: [244]
NAECHSTE: - **Bedient wird sie in der `projekt-verwaltung`** (Reiter [Projekte], 9.14.3), **nicht** im `marken-editor`.
KONTEXT : „ Projekte = projekt-verwaltung (FA-10, 9.14.3)" (TK 9.14.1) „**Ist:** die Liste der Projekte (`listeProjekte`, 9.5.2) mit Name, Datum und **Beschädigt-Kennzeichnung**; die Bedienung der fünf Vorgänge über die Operationen des `project-store`; die **Lösch-Bestätigung**, die Name, Medienzahl, Ausgabenzahl und die Unumkehrbarkeit nennt (9.5.2); der Knopf **„Ordner öffnen"** (`öffneProjektordner`, 9.5

### #253  [TK, blockzitat]
ZITAT   : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte:
steht in Issues: [242, 245, 246, 251, 256]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **TK 9.7.2 nennt eine Vorlagenart, die es nicht gibt.** Dort steht „**Band-Vorlage** wählen (`art: "band"`, 9.11.1)"; `Vorlage.art` kennt aber nur `vollflaeche`, `split` und `einblendung` (9.11.1, 9.2.8, 9.12.1). #129 hat es richtig umgesetzt (`split` **oder** `einblendung`, `parent === null`). Der Satz sol

### #253  [TK, blockzitat]
ZITAT   : 1. **TK 9.7.2 nennt eine Vorlagenart, die es nicht gibt.** Dort steht „**Band-Vorlage** wählen (`art: "band"`, 9.11.1)"; `Vorlage.art` kennt aber nur `vollflaeche`, `split` und `einblendung` (9.11.1, 9.2.8, 9.12.1). #129 hat es richtig umgesetzt (`split` **oder** `einblendung`, `parent === null`). Der Satz sollte im TK korrigiert werden – solange er dasteht, muss ihn jedes Issue mit einer Warnung zitieren, wie dieses es tut.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **TK 9.7.2 nennt eine Vorlagenart, die es nicht gibt.** Dort steht „**Band-Vorlage** wählen (`art: "band"`, 9.11.1)"; `Vorlage.art` kennt aber nur `vollflaeche`, `split` und `einblendung` (9.11.1, 9.2.8, 9.12.1). #129 hat es richtig umgesetzt (`split` **oder** `einblendung`, `parent === null`). Der Satz sol

### #253  [AD, blockzitat]
ZITAT   : 3. **Ein kaputter Band-Abschnitt ist hier sichtbar, aber nicht reparierbar – und das ist Absicht.** TK 9.7.5 führt ihn als eigene Reparatur-Position mit drei Fix-Optionen; die Optionen liegen in #133, die Führung in #132, der Rückweg in `schliesseAbschnittsFixAb`. Diese Ansicht kennzeichnet nur. **Die Kette ist inzwischen geschlossen:** #261 (Modul-Wurzel) startet die Führung und reicht die `Uebergabe` an die Shell, **#256** zeigt die Aktions-Auswahl (#203) und ruft `schliesseAbschnittsFixAb`. Offen bleibt allein, wer `UebergabeOverlay` einsetzt (s. #256, VERMERK 2). Der frühere Nebenbefund – #203 verlange `schliesseAbschnittFixAb` mit **drei** Parametern und behaupte, es gebe sie nicht – ist **erledigt**: #203 führt die Funktion inzwischen als `schliesseAbschnittsFixAb` mit **vier** Parametern.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **TK 9.7.2 nennt eine Vorlagenart, die es nicht gibt.** Dort steht „**Band-Vorlage** wählen (`art: "band"`, 9.11.1)"; `Vorlage.art` kennt aber nur `vollflaeche`, `split` und `einblendung` (9.11.1, 9.2.8, 9.12.1). #129 hat es richtig umgesetzt (`split` **oder** `einblendung`, `parent === null`). Der Satz sol

### #254  [TK, anfuehrung]
ZITAT   : von 3 Listenelementen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Es gibt genau EINEN Zählmechanismus, und er sitzt im Main.** Diese Datei ruft `vorlagen:pruefeVorlagenReferenzen` und zählt **nichts** selbst über Projekte. *Begründung:* Der Vertrag lässt keinen Spielraum – „Die Zahlen kommen aus **`pruefeVorlagenReferenzen`** (9.12.1) und aus **keiner** zweiten, editor-eigenen Zählung." (TK 9.12.2). Eine Zählung im Renderer könnte ohnehin nur das **geladene

### #254  [TK+AD, anfuehrung]
ZITAT   : Nutzung wird angezeigt, bevor überarbeitet oder gelöscht wird
NAECHSTE: - **Nutzung wird angezeigt,** bevor überarbeitet oder gelöscht wird („wird von 7 Aktionen in 2 Projekten verwendet") – ein Merge verändert **alle** davon.
KONTEXT : ## Abhängigkeiten - Blockiert von: **#255** (`[ipc-gateway]`, `src/main/ipc-gateway/vorlagen-nachtrag.ts`) – es meldet `vorlagen:pruefeVorlagenReferenzen` an, ergänzt den Eintrag in `KANAELE.vorlagen` (#25) und legt die Nutzlast `{ vorlagenId }` fest; **ohne das ist `holeNutzung` nicht baubar**; #106 (`pruefeVorlagenReferenzen` im Main – existiert bereits), #95 (`Vorlagennutzung`, `VorlagenReferen

### #254  [TK, blockzitat]
ZITAT   : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte:
steht in Issues: [243, 250, 255, 258]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte: 1. **Ohne diese Anzeige ist eine Entscheidung des Auftraggebers nicht umgesetzt.** TK v3.0 hat `pruefeVorlagenReferenzen` eigens geschaffen, damit die Nutzung **vor** dem Überarbeiten und **vor** dem Löschen sichtbar ist. Heute erscheint die Trefferliste nur im **Fehlerfall** des Löschens (über `fehler.daten`,

### #254  [TK+AD, blockzitat]
ZITAT   : 2. **Die Trefferliste kann Fundstellen heute nur mit UUID benennen.** `VorlagenReferenz` trägt `projektId`, `projektName` und `id`; die `id` ist eine Aktions- bzw. Listenelement-UUID. Für das **offene** Projekt liesse sich daraus ein Titel auflösen, für alle anderen nicht – im Speicher liegt immer nur eins (TK 9.5.1). Wenn der Auftraggeber lesbare Fundstellen möchte, müsste #106 zusätzlich einen Anzeigenamen mitliefern (etwa `Aktion.titel` bzw. die 1-basierte Listenposition). Das ist eine kleine Erweiterung an **einer** Stelle im Main und würde die Anzeige deutlich brauchbarer machen – gerade beim Löschen: „Beim Löschen ist genau diese Liste die einzige Auskunft darüber, wo aufgeräumt werden müsste." (TK 9.12.2)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte: 1. **Ohne diese Anzeige ist eine Entscheidung des Auftraggebers nicht umgesetzt.** TK v3.0 hat `pruefeVorlagenReferenzen` eigens geschaffen, damit die Nutzung **vor** dem Überarbeiten und **vor** dem Löschen sichtbar ist. Heute erscheint die Trefferliste nur im **Fehlerfall** des Löschens (über `fehler.daten`,

### #255  [TK, blockzitat]
ZITAT   : „**Eigener IPC-Kanal** nach 9.1.1 Punkt 4: `vorlagen:pruefeVorlagenReferenzen`. Ohne Anmeldung im `ipc-gateway` bliebe die Operation eine Main-Funktion ohne Aufrufer." (TK 9.12.1)
steht in Issues: [106, 109, 254]
NAECHSTE: e von beiden wäre die falsche. - **Eigener IPC-Kanal** nach 9.1.1 Punkt 4: `vorlagen:pruefeVorlagenReferenzen`. Ohne Anmeldung im `ipc-gateway` bliebe die Opera
KONTEXT : „**Eigener IPC-Kanal** nach 9.1.1 Punkt 4: `vorlagen:pruefeVorlagenReferenzen`. Ohne Anmeldung im `ipc-gateway` bliebe die Operation eine Main-Funktion ohne Aufrufer." (TK 9.12.1) Die Folge trifft eine **Entscheidung des Auftraggebers** unmittelbar. TK 9.12.2 macht die Anzeige zur Pflicht:

### #255  [TK, blockzitat]
ZITAT   : „**Nutzung wird angezeigt,** bevor überarbeitet oder gelöscht wird („wird von 7 Aktionen in 2 Projekten verwendet") – ein Merge verändert **alle** davon." (TK 9.12.2)
steht in Issues: [251]
NAECHSTE: - **Nutzung wird angezeigt,** bevor überarbeitet oder gelöscht wird („wird von 7 Aktionen in 2 Projekten verwendet") – ein Merge verändert **alle** davon.
KONTEXT : „**Nutzung wird angezeigt,** bevor überarbeitet oder gelöscht wird („wird von 7 Aktionen in 2 Projekten verwendet") – ein Merge verändert **alle** davon." (TK 9.12.2) Und TK 9.12.1 begründet, warum eine Anzeige ohne diesen Kanal nicht nachbaubar ist:

### #255  [TK+AD, blockzitat]
ZITAT   : 1. **Bootstrap #3 braucht genau einen weiteren Eintrag.** Der Aufruf `verdrahteVorlagenNachtragIPC()` gehört in die feste Startreihenfolge als **achter** der Anmeldungen **ohne** Fenster, **unmittelbar nach** `verdrahteVorlagenIPC()` (#109); die bisherigen Einträge 8 und 9 (`meldeRenderHandlerAn`, `meldeExportHandlerAn`) rücken auf 9 und 10. Die Gesamtzahl steigt damit von **zwölf** auf **dreizehn** (zehn ohne Fenster, drei mit). Die Nachträge von #240 (`verdrahteProjectStoreNachtrag2IPC`) und #238 (`verdrahteSpeicherstatusIPC`) sind in den zwölf **bereits enthalten**. **Kein** Issue fasst #3 an; das wird gesondert nachgezogen. 2. **Die Lückenklasse „Operation ohne Kanal" ist hier zum fünften Mal aufgetreten.** Vorgänger sind #72–#77, #71, #153 sowie #192 und #240. Für die Sache ist die Zählung gleichgültig; für die Frage, ob das Muster erkannt und abgestellt wird, nicht: Die Klasse „Operation ohne Kanal" ist in **jedem** Meilenstein seit M1 mindestens einmal aufgetreten und wurde **jedes Mal** erst im Prüflauf gefunden. Ein Zuschnitt-Schritt „für jede neue Operation in 9.x: Wer meldet ihren Kanal an?" wäre die billigere Vorsorge.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte: 1. **Bootstrap #3 braucht genau einen weiteren Eintrag.** Der Aufruf `verdrahteVorlagenNachtragIPC()` gehört in die feste Startreihenfolge als **achter** der Anmeldungen **ohne** Fenster, **unmittelbar nach** `verdrahteVorlagenIPC()` (#109); die bisherigen Einträge 8 und 9 (`meldeRenderHandlerAn`, `meldeExport

### #256  [TK, anfuehrung]
ZITAT   : ausschliesslich bestehende
NAECHSTE: Es werden ausschließlich bestehende Operationen genutzt.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Der geführte Reparatur-Modus wechselt den Reiter.** Führt die Reparatur eines Aktions-Bildes in den `action-editor` (9.7.5, 9.8.5), wechselt die Shell in den Reiter **Aktionen**, hebt die betroffene Aktion hervor und **kehrt danach zum Reiter Zusammenstellen zurück**, zur nächsten kaputten Stelle. Der Fortschritt „X von

### #256  [TK+AD, blockzitat]
ZITAT   : 1. **`medium_neu_verknuepfen` hat seinen Abschluss – entschieden UND #133 nachgezogen: erledigt.** Der Auftraggeber hat die erste der beiden früher genannten Varianten gewählt: Die Übergabe trägt die `elementId` mit, und #199 meldet den fertigen Asset an die Führung weiter. Ausgeschrieben ist der Weg in ENTSCHIEDEN 12/13, in `schliesseMedienImportAb` und in den zugehörigen DoD-Punkten; #199 führt dafür die neue Wirkstelle `meldeImportErgebnis`, und #262 verdrahtet beide. **Die Vertragsänderung an #133 ist vollzogen:** `Uebergabe` führt `| { ziel: 'medien-import'; elementId: string }`. Der dadurch erzwungene Zitat-Abgleich über alle Stellen, die den Typ wörtlich abschreiben – #201, #202, #203, #261, #256 und #262 –, ist gelaufen; die frühere **Melde-Klausel** im Signaturblock dieses Issues ist gegenstandslos und durch die Feststellung ersetzt, dass das Feld geführt wird (der Vertragsfehler-Hinweis bleibt als Rückfallebene stehen). TK 9.7.5 verlangt die Option ausdrücklich („Medium **neu verknüpfen/importieren**") – sie ist damit vollständig abschließbar. 2. **Der Einsetzer von `UebergabeOverlay` ist entschieden und nachgezogen – erledigt.** **#262** holt `reparaturhalter()`, bildet daraus `umgebung.composerVerdrahtung` (`reparatur: holeLage().stand`, `meldeReparaturStand: (s) => meldeStand(u, s)`, `meldeUebergabe: (an) => nimmUebergabeEntgegen(u, an)`, `starteMedienImport` aus #204) und abonniert `aufLageGeaendert` – **und setzt seit dem Nachzug auch das Overlay ein**: als Geschwister von `<Rahmen …/>` in `App.tsx`, **kein** Schlitz des Rahmens (#262, Schritt 8 und ENTSCHIEDEN 5). Der frühere STOPP-Eintrag dort („**Baue hier kein Overlay** und ergänze den Rahmen nicht") ist gestrichen; das Verbot, den Rahmen um einen **weiteren** Eintrag zu ergänzen, gilt unverändert weiter – der vierte (`meldungsFlaeche`) ist inzwischen entschieden und gehört den Meldungen, nicht diesem Overlay. Damit sind Melde-Kette **und** Anzeige geschlossen, und FA-19 sowie Akzeptanzkriterium 7 sind aus der Oberfläche erreichbar. 3. **Wodurch die Führung beginnt, ist entschieden – offen bleibt nur noch die Funktionswahl.** Der Auftraggeber hat den Auslöser festgelegt: **#261** startet den Modus, mit **zwei** Anlässen (Klick auf die Kennzeichnung; Render mit `kaputte_elemente` abgelehnt) und **ohne** Auto-Start beim Öffnen (#259, ENTSCHIEDEN 4; #201, ENTSCHIEDEN 8). Der Stand reist über `meldeReparaturStand` und #262 hierher. **Auch die Funktionswahl ist jetzt entschieden – erledigt:** `starteFuehrung` ist in #201 **ersatzlos gestrichen**, weil `uebernimmStand` dasselbe leistet und `starteFuehrung` keinen Aufrufer hätte, der sie rufen dürfte (#261 liegt im `composer`, die Funktion in der `app-shell`; Entscheidung E1 lässt modulübergreifend nur Typen reisen). Zwei Funktionen, die dasselbe tun, sind eine Einladung, die falsche zu rufen. **Für dieses Issue ändert sich am Verhalten nichts:** `meldeStand` bildet `meldeReparaturStand` weiterhin **einheitlich** auf `uebernimmStand` ab und unterscheidet den ersten Stand **nicht**, weil `stand.aktiv` den geführten Modus bereits trägt (#132). Nachgezogen sind allein die Nennungen: Signaturblock, STOPP-Verbot und Grep-Probe führen `starteFuehrung` jetzt als gestrichen.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **`medium_neu_verknuepfen` hat seinen Abschluss – entschieden UND #133 nachgezogen: erledigt.** Der Auftraggeber hat die erste der beiden früher genannten Varianten gewählt: Die Übergabe trägt die `elementId` mit, und #199 meldet den fertigen Asset an die Führung weiter. Ausgeschrieben ist der Weg in ENTSCH

### #257  [TK+AD, blockzitat]
ZITAT   : 1. **In #206 bis #211 sind die Verweise auf „#195" auf dieses Issue umzuschreiben.** Alle sechs Dateien nennen unter „Blockiert" bzw. in ihren ENTSCHIEDEN-Blöcken den **Rahmen** als die Stelle, die ihre Bausteine einsetzt, `aufgeklappt` hält, `zeileSchalter` liefert und `leseAktuelleRenderId` bildet. Das trifft seit diesem Issue nicht mehr zu – #195 darf davon ausdrücklich nichts, es setzt nur den fertigen Schlitz. Betroffen sind mindestens #206 (STOPP und Abhängigkeiten), #207 (ENTSCHIEDEN zu `zeileSchalter`, Fehlerpfad „zeileSchalter wirft", Abhängigkeiten), #208 (ENTSCHIEDEN zu `leseAktuelleRenderId`, Abhängigkeiten), #209 (ENTSCHIEDEN 4), #210 (ENTSCHIEDEN 4) und #211. 2. **Die offene Frage aus #205 ist mit diesem Issue beantwortet** (Aufbau an der Lebensdauer der Wurzel, nicht am Aufklappen – ENTSCHIEDEN 2) und dort zu streichen. 3. **`zeileSchalter` trägt jetzt mehr, als sein Name sagt** (Schalter **und** Fehlertext, ENTSCHIEDEN 5). Der Grund ist, dass `ListeProps` (#207) genau eine Einspeisestelle je Zeile hat und #207 die Übersetzung in seiner eigenen Datei verbietet. Sauberer wäre ein zweiter Schlitz `zeileFehlertext` in `ListeProps`; das wäre eine Änderung an einer fremden Datei und ist deshalb hier nicht erfolgt.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **In #206 bis #211 sind die Verweise auf „#195" auf dieses Issue umzuschreiben.** Alle sechs Dateien nennen unter „Blockiert" bzw. in ihren ENTSCHIEDEN-Blöcken den **Rahmen** als die Stelle, die ihre Bausteine einsetzt, `aufgeklappt` hält, `zeileSchalter` liefert und `leseAktuelleRenderId` bildet. Das triff

### #258  [TK, anfuehrung]
ZITAT   : nur schnell, damit nichts Kaputtes durchgeht
steht in Issues: [239]
NAECHSTE: Der **Renderer schreibt nichts auf die Platte**;
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keine Validierung, keine Fehlercodes, keine `Ergebnis`-Hülle.** Auch nicht „nur schnell, damit nichts Kaputtes durchgeht". Die Prüfung ist Vertrag des Resolvers im Main (TK 9.5.7, wörtlich oben). - **Verbot – keine Pfadauflösung.** Kein `path.join`, kein `projects/`, kein `media/`, kein `file://`, kein absoluter Pfad, kein `app://`. Diese

### #258  [TK+AD, blockzitat]
ZITAT   : 1. **Drei Stellen sind nachzuziehen.** `src/renderer/preview-player/medien-url.ts` (#215), `src/renderer/composer/bibliothek-ansicht.ts` (#227) und `src/renderer/composer/thumbnails.ts` (#128) bilden die Adresse heute selbst. Nachzuziehen ist: alle drei rufen `medienUrl` aus `src/shared/medien-url.ts` auf, statt sie zu bauen; #215 verliert damit seine eigene Datei, #227 verliert die Funktion aus seiner Signatur, und die Abnahme „**ohne Kodierungsumbau**" in #227 ist zu ersetzen – sie prüft heute das **Gegenteil** von #215. **Kein Issue fasst ein fremdes an**, deshalb steht das hier als Vermerk und nicht in der Definition of Done. Solange der Nachzug aussteht, existiert die Bildung **dreimal** – genau der Zustand, den dieses Issue beendet. 2. **Die Abnahme in #227 ist der eigentliche Befund, nicht die Umsetzung.** Beide Fassungen liefern für jeden heute vorkommenden Wert dieselbe Zeichenkette; der Widerspruch steckt ausschließlich in den **Tests**. Wer beide grün bekommen will, muss zwei Implementierungen schreiben – und ab dann driften sie, ohne dass irgendetwas fehlschlägt.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte: 1. **Drei Stellen sind nachzuziehen.** `src/renderer/preview-player/medien-url.ts` (#215), `src/renderer/composer/bibliothek-ansicht.ts` (#227) und `src/renderer/composer/thumbnails.ts` (#128) bilden die Adresse heute selbst. Nachzuziehen ist: alle drei rufen `medienUrl` aus `src/shared/medien-url.ts` auf, sta

### #259  [TK, blockzitat]
ZITAT   : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Ein Punkt:
steht in Issues: [204]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Ein Punkt: 1. **TK 9.7.2 nennt eine Vorlagenart, die es nicht gibt.** Dort steht „**Band-Vorlage** wählen (`art: "band"`, 9.11.1)" – `art` kennt aber nur `vollflaeche`, `split` und `einblendung` (9.11.1, 9.2.8, 9.12.1). Gemeint sind offensichtlich `split` und `einblendung`; so hat es #129 auch umgesetzt. Der Satz sollte im

### #259  [TK+AD, blockzitat]
ZITAT   : 1. **TK 9.7.2 nennt eine Vorlagenart, die es nicht gibt.** Dort steht „**Band-Vorlage** wählen (`art: "band"`, 9.11.1)" – `art` kennt aber nur `vollflaeche`, `split` und `einblendung` (9.11.1, 9.2.8, 9.12.1). Gemeint sind offensichtlich `split` und `einblendung`; so hat es #129 auch umgesetzt. Der Satz sollte im TK korrigiert werden, bevor ihn jemand wörtlich zitiert und daraus eine vierte Art ableitet.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Ein Punkt: 1. **TK 9.7.2 nennt eine Vorlagenart, die es nicht gibt.** Dort steht „**Band-Vorlage** wählen (`art: "band"`, 9.11.1)" – `art` kennt aber nur `vollflaeche`, `split` und `einblendung` (9.11.1, 9.2.8, 9.12.1). Gemeint sind offensichtlich `split` und `einblendung`; so hat es #129 auch umgesetzt. Der Satz sollte im

### #260  [TK+AD, blockzitat]
ZITAT   : 1. **Die Grep-Probe in #195 ist einzugrenzen.** Dessen Definition of Done verlangt heute, dass `src/renderer/App.tsx` **keinen** IPC-Aufruf enthält. Nach diesem Issue enthält die Datei zwangsläufig `abonniere` und `KANAELE` – ohne sie gibt es weder Auftrags-Nachlauf noch Speicherhinweis. Die Probe ist auf „**kein `rufeAuf`**" einzugrenzen (Aufrufe an den Main gehören weiterhin nicht in diese Datei); die übrigen drei Verbote – keine eigene `ReiterId`-Deklaration, kein `useState` für den aktiven Reiter, keine Fachlogik – bleiben unverändert gültig und werden von diesem Issue eingehalten. 2. **Eine Melde-Aufforderung ist mit diesem Issue erledigt und dort zu streichen.** #195, STOPP: „**Wer den Auftrags-Nachlauf (#199) startet und beendet, ist noch nicht entschieden** – s. STOPP in #199." Sie ist hier beantwortet (Schritt 4). #199 und #197 sind inzwischen nachgezogen und nennen #260 bereits; #197 lässt zu Recht nur noch offen, **was die Oberfläche** bei einem Fehlschlag von `baueSichten` zeigt – das entscheidet #262, ENTSCHIEDEN 3 dieses Issues, und der dortige Punkt kann entsprechend verkürzt werden. M7-51s VERMERK 3 zeigt nun auf dieses Issue. 3. **Die beiden Vertragslücken sind geschlossen – erledigt.** Der Auftraggeber hat entschieden: `RahmenEigenschaften` (#195) bekommt einen **vierten** Eintrag, die anwendungsweite `meldungsFlaeche` unmittelbar unter der Reiterleiste. Dorthin gehen **beide** bislang heimatlosen Quellen – die Fehler aus `meldeFehler` (#199) und der `StartHinweis` (#196). Gehalten werden die Meldungen in `App.tsx` (#262, ENTSCHIEDEN 7); `ProjektVerwaltungWurzelProps` (#252) bleibt unverändert. Begründung des Auftraggebers: Ein Fehler, der niemandem angezeigt wird, ist schlimmer als keiner – und beide Quellen sind reiterunabhängig, gehören also in den Rahmen und nicht in einen Reiter. 4. **`UebergabeOverlay` (#256) hat seinen Einsetzer – erledigt.** Der Auftraggeber hat die Naht entschieden: Das Overlay wird **hier** eingesetzt, als Geschwister von `<Rahmen …/>` in `App.tsx` (Schritt 8, #262, ENTSCHIEDEN 5, DoD-Punkte). Der frühere STOPP-Eintrag „Baue hier kein Overlay" ist damit gestrichen; das Verbot eines **fünften Eintrags** im Rahmen bleibt unverändert bestehen, und der vierte (`meldungsFlaeche`, s. Punkt 3) gehört den Meldungen, nicht dem Overlay. FA-19 und Akzeptanzkriterium 7 sind damit aus der Oberfläche erreichbar.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Vier Punkte: 1. **Die Grep-Probe in #195 ist einzugrenzen.** Dessen Definition of Done verlangt heute, dass `src/renderer/App.tsx` **keinen** IPC-Aufruf enthält. Nach diesem Issue enthält die Datei zwangsläufig `abonniere` und `KANAELE` – ohne sie gibt es weder Auftrags-Nachlauf noch Speicherhinweis. Die Probe ist auf „**k

### #262  [TK, anfuehrung]
ZITAT   : **Die Shell rendert selbst keine Inhalte** – sie ordnet an, wechselt und hält die Warteschlangen-Leiste. Alles Fachliche liegt in den **sechs** Modulen (einschließlich `projekt-verwaltung`, 9.14.3).
steht in Issues: [195, 244, 252]
NAECHSTE:  - **Die Shell rendert selbst keine Inhalte** – sie ordnet an, wechselt und hält die Warteschlangen-Leiste. Alles Fachliche liegt in den **sieben** Modulen (ein
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Den Ausgleich schafft die Oberfläche selbst, und zwar in **genau dieser Reihenfolge**: Beim Aufbau holt sie **einmal den vollständigen Stand** über eine lesende Operation und **abonniert erst danach** das zugehörige Ereignis." (TK 9.1.1) - „Die umgekehrte Reihenfolge (erst abonnieren, dann holen) wäre **falsch** – die Ant

### #268  [TK, anfuehrung]
ZITAT   : Startablauf (verbindlich – die Reihenfolge ist Teil des Vertrags)
steht in Issues: [3, 269, 270, 271, 272]
NAECHSTE: „Erst holen, dann abonnieren" ist die einzige Reihenfolge, die **keine Lücke** lässt;
KONTEXT : ## Modul & Datei - Modul: Grundgerüst / Main-Bootstrap (die Datei gehört #3) - Datei: `src/main/index.ts` – **die einzige** Datei dieses Issues - Vertrag: **#3** („Startablauf (verbindlich – die Reihenfolge ist Teil des Vertrags)" und „Beenden-Ablauf"), TK 9.5.4 (Einzel-Instanz, Sofort-Flush) - Prozess/Speicher: –

### #275  [TK, anfuehrung]
ZITAT   : `löscheMarke` | `markeId` → `Ergebnis<void>`; im Fehlerfall Code `marke_referenziert` mit **allen drei** Trefferlisten: betroffene **Aktionen** (je mit Projekt), betroffene **abgeleitete Marken** und die **Projekte**, die die Marke als **Standardmarke** führen.
NAECHSTE: cheMarke` | `markeId` → `Ergebnis<void>`; im Fehlerfall Code `marke_referenziert` mit **allen drei** Trefferlisten: betroffene **Aktionen** (je mit Projekt), be
KONTEXT : Markennutzung { aktionen: MarkenReferenz[] // Treffer über aktion.markeId abgeleiteteMarken: { id: string, name: string }[] // Marken mit parent = dieser markeId standardInProjekten: { projektId: string, projektName: string }[] // Treffer über Project.standardMarkeId } ``` **Die drei Feldnamen `aktionen`/`abgeleiteteMarken`/`standardInProjekten` und ihre getrennte Führung sind damit wörtlich vorge

### #275  [TK, anfuehrung]
ZITAT   : `pruefeMarkenReferenzen` | `markeId` → `Ergebnis<Markennutzung>` – **rein lesend**: ermittelt über **alle** Projekte, wer die Marke nutzt; speist die Warnung **vor** dem Löschen.
steht in Issues: [302]
NAECHSTE: rdmarke** führen | | `pruefeMarkenReferenzen` | `markeId` → `Ergebnis<Markennutzung>` – **rein lesend**: ermittelt über **alle** Projekte, wer die Marke nutzt; 
KONTEXT : Markennutzung { aktionen: MarkenReferenz[] // Treffer über aktion.markeId abgeleiteteMarken: { id: string, name: string }[] // Marken mit parent = dieser markeId standardInProjekten: { projektId: string, projektName: string }[] // Treffer über Project.standardMarkeId } ``` **Die drei Feldnamen `aktionen`/`abgeleiteteMarken`/`standardInProjekten` und ihre getrennte Führung sind damit wörtlich vorge

### #276  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [53, 58, 69, 76, 77]
NAECHSTE: Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Fehlercode-Tabelle, wörtlich (TK 9.15.5): | Fehlercode | Ursache | |---|---| | `marke_referenziert` | Löschen abgelehnt – Aktionen, abgeleitete Marken und/oder Projekte, die sie als **Standardmarke** führen, nutzen sie noch. `fehler.daten` trägt die vollständige `Markennutzung` mit **allen drei** Trefferlisten (9.15.1,

### #276  [TK, anfuehrung]
ZITAT   : Fachliche Fehlercode-Unionen liegen in `src/main/**` und dürfen vom Renderer nicht importiert werden; die Enge sitzt dort, wo der Code entsteht
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – `src/shared/contracts/ergebnis.ts` wird nicht angefasst**, auch nicht „nur um den Re-Export zu ergänzen". - **Verbot – kein sechster Wert.** Insbesondere **kein** `parent_eingebaut` (die Kettensperre bei `erstelleMarke` ist laut TK 9.15.1 `ungueltige_eingabe`, kein eigener Code – anders als beim `vorlagen-store`, wo `parent_eingebaut` **w

### #277  [TK, anfuehrung]
ZITAT   : **Besitzt** `marken.json` (app-weiter Bestand, Abschnitt 6) samt **eigener** Schreib-Serialisierung. Die Schreib-Invarianten sind **dieselben** wie in 9.5.4: **atomar** (Temp + Rename), **`marken.json.bak`** als letzte heile Version, **`schemaVersion`**, und Speicherfehler werden **sichtbar** gemacht statt still verschluckt.
NAECHSTE: **atomar** (Temp + Rename), **`vorlagen.json.bak`** als letzte heile Version, **`schemaVersion`**, und Speicherfehler werden **sichtbar** gemacht statt still verschluckt.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Besitzt** `marken.json` (app-weiter Bestand, Abschnitt 6) samt **eigener** Schreib-Serialisierung. Die Schreib-Invarianten sind **dieselben** wie in 9.5.4: **atomar** (Temp + Rename), **`marken.json.bak`** als letzte heile Version, **`schemaVersion`**, und Speicherfehler werden **sichtbar** gemacht statt still verschluc

### #277  [TK+AD, anfuehrung]
ZITAT   : `schemaVersion` und Migration wie 9.5.5
NAECHSTE: - **`schemaVersion` und Migration** wie 9.5.5.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Besitzt** `marken.json` (app-weiter Bestand, Abschnitt 6) samt **eigener** Schreib-Serialisierung. Die Schreib-Invarianten sind **dieselben** wie in 9.5.4: **atomar** (Temp + Rename), **`marken.json.bak`** als letzte heile Version, **`schemaVersion`**, und Speicherfehler werden **sichtbar** gemacht statt still verschluc

### #278  [TK, anfuehrung]
ZITAT   : gültig übernommen im Speicher
NAECHSTE: sonst direkt übernommen.
KONTEXT : ## Warum das im Gesamtsystem wichtig ist `bearbeiteMarke` (#285) sichert **entprellt**: Der Aufrufer bekommt sein `ok: true` (Änderung „gültig übernommen im Speicher", TK 9.5.4), lange bevor der eigentliche Schreibvorgang – 4 Sekunden später, im Hintergrund – überhaupt läuft. Scheitert **der**, gibt es **keine Antwort**, an die sich ein Fehler hängen könnte; ohne diese Datei ist ein Fehlschlag **v

### #278  [TK, anfuehrung]
ZITAT   : **Kanalbenennung** … Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queue:geaendert`, `render:fortschritt`.
NAECHSTE: eVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queue:geaendert`, `render:fortschritt`. Damit erfindet niemand eigene Kanalnamen. **
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Die Schreib-Invarianten sind **dieselben** wie in 9.5.4 … und Speicherfehler werden **sichtbar** gemacht statt still verschluckt – über einen **eigenen** Kanal `marken:autoSpeichernStatus`, gleichartig zu `vorlagen:autoSpeichernStatus` (9.12.1). Ein eigener Kanal ist nötig, weil die Oberfläche „deine Marke ist nicht gesic

### #278  [TK, anfuehrung]
ZITAT   : Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle
steht in Issues: [47, 200, 238]
NAECHSTE: **Ereignisse** (Main → Renderer) tragen ebenfalls keine Hülle (Punkt 5).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Die Schreib-Invarianten sind **dieselben** wie in 9.5.4 … und Speicherfehler werden **sichtbar** gemacht statt still verschluckt – über einen **eigenen** Kanal `marken:autoSpeichernStatus`, gleichartig zu `vorlagen:autoSpeichernStatus` (9.12.1). Ein eigener Kanal ist nötig, weil die Oberfläche „deine Marke ist nicht gesic

### #278  [TK, anfuehrung]
ZITAT   : Ereignisse sind Einbahnstraßen und tragen keinen Endzustand.
NAECHSTE: Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Die Schreib-Invarianten sind **dieselben** wie in 9.5.4 … und Speicherfehler werden **sichtbar** gemacht statt still verschluckt – über einen **eigenen** Kanal `marken:autoSpeichernStatus`, gleichartig zu `vorlagen:autoSpeichernStatus` (9.12.1). Ein eigener Kanal ist nötig, weil die Oberfläche „deine Marke ist nicht gesic

### #278  [TK, anfuehrung]
ZITAT   : **Die App hat GENAU EIN Fenster** – und jedes Ereignis geht an dieses eine Fenster.
NAECHSTE: 64 (9.1, Punkt 3) – die Hülle ändert daran nichts. **10. Die App hat GENAU EIN Fenster – und jedes Ereignis geht an dieses eine Fenster.** Damit ist die **Empfä
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Die Schreib-Invarianten sind **dieselben** wie in 9.5.4 … und Speicherfehler werden **sichtbar** gemacht statt still verschluckt – über einen **eigenen** Kanal `marken:autoSpeichernStatus`, gleichartig zu `vorlagen:autoSpeichernStatus` (9.12.1). Ein eigener Kanal ist nötig, weil die Oberfläche „deine Marke ist nicht gesic

### #279  [TK, anfuehrung]
ZITAT   : Bei `parent ≠ null` sind `farben` und `schriften` **Teilmengen**: Für jede Rolle, die die abgeleitete Marke **nicht** setzt, gilt der Wert des Parents – **feldweise, nicht objektweise**. Ein Saison-Look, der nur `farben.akzent` setzt, erbt damit alle übrigen Farben, alle Schriften, Logo, Abstände, Radien, Schatten und Slogan. Setzt er ein Feld, gilt seins. Das gilt für **jedes** Feld außer `id`, `name`, `parent` und `eingebaut`.
NAECHSTE: n**: Für jede Rolle, die die abgeleitete Marke **nicht** setzt, gilt der Wert des Parents – **feldweise**, nicht objektweise. Ein Saison-Look, der nur `farben.a
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Bei `parent ≠ null` sind `farben` und `schriften` **Teilmengen**: Für jede Rolle, die die abgeleitete Marke **nicht** setzt, gilt der Wert des Parents – **feldweise, nicht objektweise**. Ein Saison-Look, der nur `farben.akzent` setzt, erbt damit alle übrigen Farben, alle Schriften, Logo, Abstände, Radien, Schatten und Slo

### #279  [TK, anfuehrung]
ZITAT   : feldweise, nicht objektweise
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **ENTSCHIEDEN – Granularität außerhalb von `farben`/`schriften` ist FELD-, nicht UNTERFELD-genau (lokale Festlegung, durch einen bereits verfassten Nachbarn bestätigt).** TK 9.11.2 spricht von „feldweise, nicht objektweise" im Zusammenhang mit `farben`/`schriften` – beides sind `Record`-Typen, bei denen „Feld" sinnvoll eine einzelne Rolle bezeichnet. Für `logo`, `sicherheit`, `radien`, `schatten`,

### #279  [TK, anfuehrung]
ZITAT   : Nicht selbst entscheiden
steht in Issues: [1, 2, 3, 4, 5]
NAECHSTE: Der Torwächter selbst darf ihn **nicht** auslösen:
KONTEXT : ## Fehlerpfade (vollständig) | Situation | Code | Verhalten | |---|---|---| | `eintrag.parent !== null`, Parent-`id` nicht in `bestand` | `marke_nicht_gefunden` | kein Ergebnis; **kein** Rückfall auf den unaufgelösten `eintrag` | | `eintrag.parent === null` | – (kein Fehler) | `eintrag` wird 1:1 als `Marke` zurückgegeben | | gefundener Parent hat selbst `parent !== null` (verletzte Kettensperre) |

### #279  [TK, anfuehrung]
ZITAT   : Saison-Look setzt nur Farben
steht in Issues: [283]
NAECHSTE: Ein Saison-Look setzt nur die Farben und erbt Schriften, Logo und Abstände;
KONTEXT : ## Definition of Done - [ ] `loeseMarkeAuf(<eigenständiger, vollständiger Eintrag>, [<dieser Eintrag>])` liefert diesen Eintrag unverändert als `Marke` zurück - [ ] Für eine abgeleitete Marke, die nur `farben.akzent` setzt, liefert `loeseMarkeAuf` eine `Marke`, bei der **alle** übrigen Farben, alle Schriften, `logo`, `sicherheit`, `radien`, `schatten` und `slogan` die Werte des Parents tragen, und

### #280  [TK, anfuehrung]
ZITAT   : Marken sind ein app-weiter Bestand und bearbeitbar (`marken-store`, 9.15.1; FA-23/FA-24). […] **Gebündelt bleiben** die vier OFL-Schriften und das Fitnessworld24-Logo; importierte Dateien tragen die Herkunft `importiert`.
NAECHSTE: **Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1;
KONTEXT : - „Marken sind ein app-weiter Bestand und bearbeitbar (`marken-store`, 9.15.1; FA-23/FA-24). […] **Gebündelt bleiben** die vier OFL-Schriften und das Fitnessworld24-Logo; importierte Dateien tragen die Herkunft `importiert`." (TK 9.11.2) – das Logo dieser Marke trägt deshalb `herkunft: 'gebuendelt'`, **nicht** `'importiert'`, und **nicht** `logo: null` (s. „Nicht selbst entscheiden" zum genauen Da

### #281  [TK, anfuehrung]
ZITAT   : Die Migration legt daraus die eingebaute Marke in `marken.json` an (`eingebaut: true`, `parent: null`, neue `id`), setzt `Project.standardMarkeId` und `Aktion.markeId` aller Projekte darauf und entfernt das Feld aus `config.json`.
steht in Issues: [319]
NAECHSTE:  Marke in `marken.json` an (`eingebaut: true`, `parent: null`, **`logo: null`**, neue `id`), setzt `Project.standardMarkeId` und `Aktion.markeId` aller Projekte
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Die Migration legt daraus die eingebaute Marke in `marken.json` an (`eingebaut: true`, `parent: null`, neue `id`), setzt `Project.standardMarkeId` und `Aktion.markeId` aller Projekte darauf und entfernt das Feld aus `config.json`." (TK 9.15.1) – die beiden Zuweisungen (`standardMarkeId`, `markeId`) sind damit wörtlich vor

### #281  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast**
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Die Migration legt daraus die eingebaute Marke in `marken.json` an (`eingebaut: true`, `parent: null`, neue `id`), setzt `Project.standardMarkeId` und `Aktion.markeId` aller Projekte darauf und entfernt das Feld aus `config.json`." (TK 9.15.1) – die beiden Zuweisungen (`standardMarkeId`, `markeId`) sind damit wörtlich vor

### #281  [TK, anfuehrung]
ZITAT   : ein Projekt ist aktiv
NAECHSTE: ein Projekt ist nicht gesichert", der andere „deine Vorlage ist nicht gesichert"
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ECHTE OFFENE FRAGE, die zentrale dieses Issues: Wie und wann läuft diese Migration über ALLE Projekte – und wer schreibt das Ergebnis zurück?** Zwei grundverschiedene, beide plausible Herangehensweisen stehen offen, und TK 9.15.1/9.5.5 entscheiden nicht zwischen ihnen: 1. **Bulk-Migration beim App-Start**, analog zur Referenzprüfung `pruefeMarkenR

### #281  [TK, anfuehrung]
ZITAT   : das Feld aus config.json entfernen
NAECHSTE: ``` <App-Ordner>/ config.json # B/D3:
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ECHTE OFFENE FRAGE, die zentrale dieses Issues: Wie und wann läuft diese Migration über ALLE Projekte – und wer schreibt das Ergebnis zurück?** Zwei grundverschiedene, beide plausible Herangehensweisen stehen offen, und TK 9.15.1/9.5.5 entscheiden nicht zwischen ihnen: 1. **Bulk-Migration beim App-Start**, analog zur Referenzprüfung `pruefeMarkenR

### #282  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
steht in Issues: [23, 68, 71, 76, 77]
NAECHSTE: Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`listeMarken` | – → `Ergebnis<Marke[]>` – **aufgelöst**, einschließlich abgeleiteter, je samt `herkunftJeFeld`" - „**Die Vererbung wird an genau EINER Stelle aufgelöst** – hier. `leseMarke` und `listeMarken` liefern **fertige** Marken; kein Aufrufer sieht je eine Teilmenge." (TK

### #282  [TK, anfuehrung]
ZITAT   : Arbeitskopien (`parent ≠ null`) sind nicht auswählbar. `composer` und `action-editor` bekommen sie nicht angeboten – halbfertige Vorlagen können nicht in einen Render geraten.
NAECHSTE: - **Arbeitskopien (`parent ≠ null`) sind nicht auswählbar.** `composer` und `action-editor` bekommen sie nicht angeboten – halbfertige Vorlagen können nicht in einen Render geraten.
KONTEXT : **ENTSCHIEDEN – warum diese Funktion NICHT filtert (lokale Entscheidung, mit Begründung).** Beim `vorlagen-store` verschwinden Arbeitskopien aus `listeVorlagen`, weil sie ein **bewusst halbfertiger** Zwischenstand sind: „Arbeitskopien (`parent ≠ null`) sind nicht auswählbar. `composer` und `action-editor` bekommen sie nicht angeboten – halbfertige Vorlagen können nicht in einen Render geraten." (T

### #282  [AD, anfuehrung]
ZITAT   : einen Saison- oder Kampagnen-Look
NAECHSTE: Eine Marke kann von einer anderen **abgeleitet** sein und einzelne Werte überschreiben (Saison- oder Kampagnen-Look).
KONTEXT : **ENTSCHIEDEN – warum diese Funktion NICHT filtert (lokale Entscheidung, mit Begründung).** Beim `vorlagen-store` verschwinden Arbeitskopien aus `listeVorlagen`, weil sie ein **bewusst halbfertiger** Zwischenstand sind: „Arbeitskopien (`parent ≠ null`) sind nicht auswählbar. `composer` und `action-editor` bekommen sie nicht angeboten – halbfertige Vorlagen können nicht in einen Render geraten." (T

### #283  [TK, anfuehrung]
ZITAT   : Nicht selbst entscheiden
steht in Issues: [1, 2, 3, 4, 5]
NAECHSTE: Der Torwächter selbst darf ihn **nicht** auslösen:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`leseMarke` | `markeId` → `Ergebnis<Marke>` – **aufgelöst** (Vererbung angewandt, 9.11.2), samt `herkunftJeFeld`" - **Der Herkunfts-Stempel reist mit** (TK 9.15.1, wörtlich): „**Jede Marke, die dieses Modul herausgibt, trägt ihren Herkunfts-Stempel** (`herkunftJeFeld`, 9.11.2)".

### #283  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`leseMarke` | `markeId` → `Ergebnis<Marke>` – **aufgelöst** (Vererbung angewandt, 9.11.2), samt `herkunftJeFeld`" - **Der Herkunfts-Stempel reist mit** (TK 9.15.1, wörtlich): „**Jede Marke, die dieses Modul herausgibt, trägt ihren Herkunfts-Stempel** (`herkunftJeFeld`, 9.11.2)".

### #283  [TK, anfuehrung]
ZITAT   : Saison-Look setzt nur Farben
steht in Issues: [279]
NAECHSTE: Ein Saison-Look setzt nur die Farben und erbt Schriften, Logo und Abstände;
KONTEXT : ## Definition of Done - [ ] `leseMarke(<id der eingebauten Marke>)` liefert die eingebaute Marke vollständig (alle 12 `FarbRolle`n, alle 4 `SchriftRolle`n gesetzt) - [ ] Für eine abgeleitete Marke, die nur `farben.akzent` setzt, liefert `leseMarke` eine Marke, bei der **alle** übrigen Farben, alle Schriften, Logo, Sicherheitsabstand, Radien, Schatten und Slogan die Werte des Parents tragen, und `f

### #284  [TK, anfuehrung]
ZITAT   : **Ableitung über `parent`** – feldweise Vererbung, **eine** Stufe tief.
NAECHSTE: **Marken sind ableitbar (`parent`), und die Vererbung wird an genau EINER Stelle aufgelöst** (9.11.2, 9.15.1).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`erstelleMarke` | `name`, `parentId?` → `Ergebnis<Marke>` (`parentId` gesetzt → abgeleitet)" - „**Ableitungsketten sind auf eine Stufe begrenzt** (9.11.2): `erstelleMarke` mit einer `parentId`, deren Marke selbst einen Parent hat, wird mit `ungueltige_eingabe` abgewiesen." (TK 9

### #284  [TK, anfuehrung]
ZITAT   : Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten.
steht in Issues: [85, 97, 100, 101, 102]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`erstelleMarke` | `name`, `parentId?` → `Ergebnis<Marke>` (`parentId` gesetzt → abgeleitet)" - „**Ableitungsketten sind auf eine Stufe begrenzt** (9.11.2): `erstelleMarke` mit einer `parentId`, deren Marke selbst einen Parent hat, wird mit `ungueltige_eingabe` abgewiesen." (TK 9

### #284  [TK, anfuehrung]
ZITAT   : `Marke.logo` ist seit v3.4 `| null` – bei Werbepartnern der Normalfall. Ist es `null`, zeichnet `template-canvas` in **jeder** Zone mit `bindung: logo` einen **Ersatz**: den **Markennamen** (`marke.name`) auf einer Fläche in der **Akzentfarbe der Marke**. Kein leerer Bereich, und **kein** fremdes Logo an dieser Stelle – eine geliehene Marke wäre schlimmer als gar keine.
NAECHSTE: -canvas` in **jeder** Zone mit `bindung: logo` einen **Ersatz**: den **Markennamen** (`marke.name`) auf einer Fläche in der **Akzentfarbe der Marke**. Kein leer
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`erstelleMarke` | `name`, `parentId?` → `Ergebnis<Marke>` (`parentId` gesetzt → abgeleitet)" - „**Ableitungsketten sind auf eine Stufe begrenzt** (9.11.2): `erstelleMarke` mit einer `parentId`, deren Marke selbst einen Parent hat, wird mit `ungueltige_eingabe` abgewiesen." (TK 9

### #284  [TK, anfuehrung]
ZITAT   : `Marke.logo` ist seit v3.4 `| null` – bei Werbepartnern der Normalfall. Ist es `null`, zeichnet `template-canvas` in **jeder** Zone mit `bindung: logo` einen **Ersatz**: den **Markennamen** (`marke.name`) auf einer Fläche in der **Akzentfarbe der Marke**. Kein leerer Bereich, und **kein** fremdes Logo an dieser Stelle – eine geliehene Marke wäre schlimmer als gar keine.
NAECHSTE: -canvas` in **jeder** Zone mit `bindung: logo` einen **Ersatz**: den **Markennamen** (`marke.name`) auf einer Fläche in der **Akzentfarbe der Marke**. Kein leer
KONTEXT : **Was der Vertrag dazu sagt** – wörtlich (TK 9.10.10): „`Marke.logo` ist seit v3.4 `| null` – bei Werbepartnern der Normalfall. Ist es `null`, zeichnet `template-canvas` in **jeder** Zone mit `bindung: logo` einen **Ersatz**: den **Markennamen** (`marke.name`) auf einer Fläche in der **Akzentfarbe der Marke**. Kein leerer Bereich, und **kein** fremdes Logo an dieser Stelle – eine geliehene Marke w

### #284  [TK, anfuehrung]
ZITAT   : keins = weder eigen noch geerbt gesetzt -> Ersatz-Logo greift (9.10.10)
NAECHSTE: "eigen" | "geerbt" | "keins" // keins = weder eigen noch geerbt gesetzt // -> Ersatz-Logo greift (9.10.10) sicherheit:
KONTEXT : **Die Entscheidung setzt auch den Herkunfts-Stempel – ohne dass du dafür etwas tust.** `#279` setzt ihn beim Auflösen: „Bei einem **eigenständigen** Eintrag (`parent === null`) ist **jeder** Wert in `herkunftJeFeld` `"eigen"` – Ausnahme `logo`, das `"keins"` trägt, wenn die aufgelöste `logo` `null` ist" (#279, DoD). Weil hier `logo: null` gesetzt wird, meldet die zurückgegebene Marke also **`herku

### #284  [AD, anfuehrung]
ZITAT   : Saison- und Kampagnen-Looks. Dieselbe Fitnessworld24-Marke in einer abweichenden Anmutung
NAECHSTE: ers, nicht die des Studios. - **Saison- und Kampagnen-Looks.** Dieselbe Fitnessworld24-Marke in einer abweichenden Anmutung (Sommeraktion, Jahreswechsel) – glei
KONTEXT : **Gegengeprüft an #279 (11.08.):** Dessen Kopfkommentar sagt, bei `eintrag.parent === null` werde der Eintrag „unveraendert (reshaped) als `Marke` zurueckgegeben" und die Systeminvariante der Vollständigkeit sei „durch #280/#284 strukturell erzwungen". Das bleibt mit `logo: null` richtig: `null` **ist** der vollständige Wert dieses Feldes (TK 9.11.2: `logo: … | null`), keine Lücke. Gerade **weil**

### #285  [TK, anfuehrung]
ZITAT   : kein eigenes Logo, Ersatz-Logo greift
NAECHSTE: { datei, herkunft, seitenverhaeltnis } | null // null -> Ersatz-Logo (9.10.10) sicherheit:
KONTEXT : **Warum `{ geerbt: true }` statt `null` als Sentinel.** Bei `logo` ist der reale Wertebereich bereits `T | null` (`null` heißt „kein eigenes Logo, Ersatz-Logo greift", TK 9.10.10) – ein `null` als „zurück auf geerbt" wäre mit einem echten, gewollten `null`-Logo **nicht unterscheidbar**. Ein eigenes Objekt `{ geerbt: true }` ist von jedem denkbaren Fachwert (auch `null`) klar unterscheidbar und mac

### #285  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : **Die Bereichsprüfung für `sicherheit`** (Nachtrag, vom Auftraggeber am 10.08. entschieden): Ist `teilwerte.sicherheit` gesetzt **und kein** `{ geerbt: true }`, dann gilt für **beide** Achsen: endliche Zahl, `Number.isInteger`, und `min ≤ wert ≤ max` aus `SICHERHEITSABSTAND_BEREICH` (`horizontal` 0…480, `vertikal` 0…270). Ein Verstoß ist `ungueltige_eingabe` **ohne jede Wirkung auf die Daten** – k

### #285  [TK, anfuehrung]
ZITAT   : Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**.
steht in Issues: [85, 87, 97, 100, 101]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`bearbeiteMarke` | `markeId`, `teilwerte` → `Ergebnis<Marke>` – **Auto-Speichern** während des Bearbeitens" - „**Bei einer abgeleiteten Marke ist sichtbar, was geerbt und was eigen ist.** Ein Wert, den der Nutzer nicht setzt, bleibt geerbt und folgt künftigen Änderungen des Pare

### #286  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
steht in Issues: [23, 68, 71, 76, 77]
NAECHSTE: Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`pruefeMarkenReferenzen` | `markeId` → `Ergebnis<Markennutzung>` – **rein lesend**: ermittelt über **alle** Projekte, wer die Marke nutzt; speist die Warnung **vor** dem Löschen" - „**Löschen blockiert bei Referenz**, es kaskadiert **nicht** – wie bei den Vorlagen (9.12.1). Eine

### #287  [TK, anfuehrung]
ZITAT   : **Die eingebaute Marke ist nie löschbar** (`eingebaut: true`): Sie ist der Projekt-Standard und die Basis der abgeleiteten Looks. **Bearbeitbar ist sie aber** – anders als die eingebauten Vorlagen, die eingefroren sind.
NAECHSTE: e Marke ist nie löschbar** (`eingebaut: true`): Sie ist der Projekt-Standard und die Basis der abgeleiteten Looks. **Bearbeitbar ist sie aber** – anders als die
KONTEXT : Zweitens ist die eingebaute Marke **anders geschützt als bei den Vorlagen**: „**Die eingebaute Marke ist nie löschbar** (`eingebaut: true`): Sie ist der Projekt-Standard und die Basis der abgeleiteten Looks. **Bearbeitbar ist sie aber** – anders als die eingebauten Vorlagen, die eingefroren sind." (TK 9.15.1) Diese Sperre trägt einen **eigenen** Fehlercode (`marke_eingebaut`), nicht den wiederverw

### #287  [TK, anfuehrung]
ZITAT   : **Eingebaute Marke unlöschbar, aber bearbeitbar** – anders als die eingebauten Vorlagen.
steht in Issues: [302]
NAECHSTE: **Die eingebaute Marke ist unlöschbar, aber bearbeitbar** (9.15.1) – anders als die eingebauten **Vorlagen**, die eingefroren sind (9.12.1).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`löscheMarke` | `markeId` → `Ergebnis<void>`; im Fehlerfall Code `marke_referenziert` mit **allen drei** Trefferlisten: betroffene **Aktionen** (je mit Projekt), betroffene **abgeleitete Marken** und die **Projekte**, die die Marke als **Standardmarke** führen" - Anforderungsdok

### #287  [TK, anfuehrung]
ZITAT   : Diese sieben Punkte sind **nach** dem ersten Schreiben von M8 entstanden. Wo sie einer älteren Festlegung widersprechen, **gewinnen sie**.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`löscheMarke` | `markeId` → `Ergebnis<void>`; im Fehlerfall Code `marke_referenziert` mit **allen drei** Trefferlisten: betroffene **Aktionen** (je mit Projekt), betroffene **abgeleitete Marken** und die **Projekte**, die die Marke als **Standardmarke** führen" - Anforderungsdok

### #287  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … Eine rohe Exception-Meldung wird nie zum Code.
steht in Issues: [60, 68, 71, 85, 87]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`löscheMarke` | `markeId` → `Ergebnis<void>`; im Fehlerfall Code `marke_referenziert` mit **allen drei** Trefferlisten: betroffene **Aktionen** (je mit Projekt), betroffene **abgeleitete Marken** und die **Projekte**, die die Marke als **Standardmarke** führen" - Anforderungsdok

### #287  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeile, wörtlich (TK 9.15.1): „`löscheMarke` | `markeId` → `Ergebnis<void>`; im Fehlerfall Code `marke_referenziert` mit **allen drei** Trefferlisten: betroffene **Aktionen** (je mit Projekt), betroffene **abgeleitete Marken** und die **Projekte**, die die Marke als **Standardmarke** führen" - Anforderungsdok

### #287  [AD, anfuehrung]
ZITAT   : **nicht selbst durch eine dritte, hier erfundene Prüfung**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ERLEDIGT (11.08.2026) – NICHT mehr melden, BAUEN.** Hier stand die gemeldete Lücke, dass der Vertrag **nicht** prüfe, ob die zu löschende Marke gerade `Project.standardMarkeId` eines Projekts ist, samt der Anweisung, sie „**nicht selbst durch eine dritte, hier erfundene Prüfung**" zu schließen. **Die Lücke war echt und ist entschieden:** Anforderu

### #288  [TK, anfuehrung]
ZITAT   : Die **importierten Dateien** dagegen in einem Ordner **je Marke** (`marken-assets/<marken-id>/`) – dasselbe Muster wie `projects/<id>/media/`.
NAECHSTE: die **importierten Dateien** dagegen in einem Ordner **je Marke** (`marken-assets/<marken-id>/`) – dasselbe Muster wie `projects/<id>/media/`.
KONTEXT : ## Warum das im Gesamtsystem wichtig ist „**Ablage neben den Daten, nicht im Programmordner.** `marken-assets/` liegt im Datenort (Abschnitt 6)." (TK 9.15.3) und „Die **importierten Dateien** dagegen in einem Ordner **je Marke** (`marken-assets/<marken-id>/`) – dasselbe Muster wie `projects/<id>/media/`." (TK Abschnitt 6) Genau weil das Muster demselben Prinzip folgt wie Projekt-Medien, liegt die 

### #288  [TK, anfuehrung]
ZITAT   : **Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf …, `importiert` auf `marken-assets/<markeId>/`. Der Renderer bekommt importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie** über absolute Pfade. **Genau eine** Stelle löst auf – nicht jede Zonen-Sorte einzeln.
steht in Issues: [290, 315]
NAECHSTE: ommt importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie** über absolute Pfade. **Genau eine** Stelle löst auf –
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Der `project-store` ist Pfad-Autorität für **Projekt**-Daten (`projects/<id>/…`, TK 9.5.7); `marken-assets/` liegt **app-weit** neben `vorlagen.json`. Eine zweite Autorität für einen fremden Ordner wäre genau die Doppelung, die 9.5.7 ausschließt." (BRIEFING Abschnitt 4) – der `marken-store`, **nicht** der `project-store`,

### #288  [TK, anfuehrung]
ZITAT   : `marken-assets/` # A/V2: IMPORTIERTE Logos und Schriften (FA-24, 9.15.3)
NAECHSTE: etzte heile Version (9.15.1) marken-assets/ # A/V2: IMPORTIERTE Logos und Schriften (FA-24, 9.15.3) <marken-id>/ logo.<ext> # importiertes Logo dieser Marke sch
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Der `project-store` ist Pfad-Autorität für **Projekt**-Daten (`projects/<id>/…`, TK 9.5.7); `marken-assets/` liegt **app-weit** neben `vorlagen.json`. Eine zweite Autorität für einen fremden Ordner wäre genau die Doppelung, die 9.5.7 ausschließt." (BRIEFING Abschnitt 4) – der `marken-store`, **nicht** der `project-store`,

### #289  [TK+AD, anfuehrung]
ZITAT   : Import von Logo und Schriftdateien
NAECHSTE: importierte Logos und Schriften je Marke.
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Diese Datei ist der **Bündelungs-Riegel**, der mit v3.4 aufgebrochen wird: „Bis v3.3 verwiesen `Schrift.datei` und `logo.datei` auf **zur Bauzeit gebündelte** Dateien … Eine vom Nutzer angelegte Marke hätte dort **keine Datei, auf die sie zeigen könnte**." (TK 9.15.3) Ohne eine funktionierende Datei-Verwaltung bleibt FA-24 („Import von Logo und Schriftdatei

### #289  [TK, anfuehrung]
ZITAT   : Import kopiert. Die Quelldatei bleibt unberührt
NAECHSTE: ivilegiertes Schema). - **Import kopiert.** Die Quelldatei bleibt unberührt, die Kopie gehört der Marke – wie beim Medien-Import (9.4.5). Format-Whitelist: **`.
KONTEXT : Drei Fehler wären hier besonders teuer, weil sie erst am Fernseher auffallen: **Erstens** eine fehlende oder falsch geprüfte Whitelist – eine falsch importierte Datei bringt `template-canvas` (#291) in einen Zustand, der nicht mehr dem TK 9.10.3-Determinismus folgt. **Zweitens** ein Kopiervorgang, der die Quelldatei verändert oder verschiebt – TK 9.15.3 verlangt ausdrücklich „Import kopiert. Die Q

### #289  [TK, anfuehrung]
ZITAT   : **Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf …, `importiert` auf `marken-assets/<markeId>/`.
steht in Issues: [288, 290, 297, 315]
NAECHSTE: - **Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf – in v1 sind das **die vier OFL-Schriften und sonst nichts**:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeilen, wörtlich (TK 9.15.1): „`importiereMarkenDatei` | `markeId`, `art: "logo"\|"schrift"`, `schriftRolle?`, `quellPfad` → `Ergebnis<Marke>` (kopiert nach `marken-assets/<markeId>/`, 9.15.3)" / „`entferneMarkenDatei` | `markeId`, `art`, `schriftRolle?` → `Ergebnis<Marke>` – zurück auf den geerbten bzw. geb

### #289  [TK, anfuehrung]
ZITAT   : Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer **nicht**.
steht in Issues: [85, 87, 97, 100, 101]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeilen, wörtlich (TK 9.15.1): „`importiereMarkenDatei` | `markeId`, `art: "logo"\|"schrift"`, `schriftRolle?`, `quellPfad` → `Ergebnis<Marke>` (kopiert nach `marken-assets/<markeId>/`, 9.15.3)" / „`entferneMarkenDatei` | `markeId`, `art`, `schriftRolle?` → `Ergebnis<Marke>` – zurück auf den geerbten bzw. geb

### #290  [TK, anfuehrung]
ZITAT   : **Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf (die vier OFL-Schriften, das Fitnessworld24-Logo), `importiert` auf `marken-assets/<markeId>/`. Der Renderer bekommt importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie** über absolute Pfade. **Genau eine** Stelle löst auf – nicht jede Zonen-Sorte einzeln.
steht in Issues: [315]
NAECHSTE: ommt importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie** über absolute Pfade. **Genau eine** Stelle löst auf –
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf (die vier OFL-Schriften, das Fitnessworld24-Logo), `importiert` auf `marken-assets/<markeId>/`. Der Renderer bekommt importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie** über absolute Pfade. **Gen

### #290  [TK, anfuehrung]
ZITAT   : Für die Vorschau (P5) und Thumbnails (`composer`, `action-editor`) muss der **Renderer** Medien anzeigen. Dafür registriert der Main ein eigenes Protokoll `media://<projektId>/<dateiname>`, dessen Handler die Auflösung des `project-store` nutzt und die Datei **nur lesend** ausliefert.
NAECHSTE: Dafür registriert der Main ein eigenes Protokoll **`media://<projektId>/<dateiname>`**, dessen Handler die Auflösung des `project-store` nutzt und die Datei **nur lesend** ausliefert.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf (die vier OFL-Schriften, das Fitnessworld24-Logo), `importiert` auf `marken-assets/<markeId>/`. Der Renderer bekommt importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie** über absolute Pfade. **Gen

### #290  [TK, anfuehrung]
ZITAT   : Der Renderer sieht **nur relative** Referenzen (`dateiname`), **nie** absolute Pfade. Der Resolver stellt sicher, dass das Ziel **innerhalb** des […] Ordners […] bleibt (kein `..`-Ausbruch, keine Symlink-Flucht); Zugriff strikt **read-only**.
NAECHSTE: olver stellt sicher, dass das Ziel **innerhalb** des `media/`-Ordners des Projekts bleibt (kein `..`-Ausbruch, keine Symlink-Flucht); Zugriff strikt **read-only
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf (die vier OFL-Schriften, das Fitnessworld24-Logo), `importiert` auf `marken-assets/<markeId>/`. Der Renderer bekommt importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie** über absolute Pfade. **Gen

### #291  [TK, anfuehrung]
ZITAT   : **Fehlt eine importierte Datei, wird gar nicht erst gezeichnet – die Prüfung sitzt im RENDERER, vor dem Zeichnen (v3.7, geschärft).** […] Schlägt das Laden fehl, **entsteht kein Segment-PNG**; der `composer` behandelt das wie jede andere ins Leere zeigende Referenz und führt in den **geführten Reparatur-Modus** (FA-19, 9.7.5) – und dort gilt: **Render erst frei, wenn alles behoben ist.** Der fehlerhafte Auftrag wird also **gar nicht erst eingereiht**. Ein stiller Rückfall auf die gebündelte Schrift bleibt verboten (er zeigte den Markenbruch erst am Fernseher).
NAECHSTE: d führt in den **geführten Reparatur-Modus** (FA-19, 9.7.5) – und dort gilt: **Render erst frei, wenn alles behoben ist.** Der fehlerhafte Auftrag wird also **g
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Seit v3.4 gilt dasselbe für importierte Schriften** (FA-24): Sie werden **je Marke** registriert und geladen, **bevor** die erste Zone gezeichnet wird, und der Nachweis unten gilt für sie mit (9.15.3)." (TK 9.10.4) - „**Determinismus muss neu erfüllt werden.** 9.10.3 verlangt, dass Schriften **vor** dem Zeichnen geladen

### #291  [TK, anfuehrung]
ZITAT   : bricht der Render FRÜH ab, vor dem ersten `ffmpeg`-Aufruf, mit dem Fehlercode `marken_datei_fehlt`
NAECHSTE: te Datei zur Renderzeit, bricht der Render **früh** ab – vor dem ersten ffmpeg-Aufruf"; v3.6 machte daraufhin die geschlossene Fehlercode-Tabelle 9.2.3 „konsist
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Seit v3.4 gilt dasselbe für importierte Schriften** (FA-24): Sie werden **je Marke** registriert und geladen, **bevor** die erste Zone gezeichnet wird, und der Nachweis unten gilt für sie mit (9.15.3)." (TK 9.10.4) - „**Determinismus muss neu erfüllt werden.** 9.10.3 verlangt, dass Schriften **vor** dem Zeichnen geladen

### #292  [TK, anfuehrung]
ZITAT   : **Kontrast-Warnung (FA-24):** Der Editor berechnet den Kontrast zwischen Akzentfläche und dem darauf liegenden Text und **warnt sichtbar**, ohne die Wahl zu verhindern. […] Die Restverantwortung bleibt beim Nutzer (Risiko R-08).
NAECHSTE: - **Kontrast-Warnung (FA-24):** Der Editor berechnet den Kontrast zwischen Akzentfläche und dem darauf liegenden Text und **warnt sichtbar**, ohne die Wahl zu verhindern.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Textfarbe nach gemessenem Kontrast**, nicht fest: Der Canvas wählt zwischen den Rollen `textAufDunkel` und `textAufHell` die mit dem **besseren Kontrast** zur Akzentfläche." (TK 9.10.10) - „Es ist dieselbe Rechnung wie bei der Kontrast-Warnung des Editors (9.15.2) – **einmal gebaut, zweimal genutzt**. Hier entscheidet s

### #292  [TK, anfuehrung]
ZITAT   : **Gleiche Eingabe → gleiches Bild.** Keine Zeit-, Zufalls- oder Zustandsabhängigkeit.
NAECHSTE: **Gleiche Eingabe → gleiches Bild.** Keine Zeit-, Zufalls- oder Zustandsabhängigkeit (keine Animation, kein Datum, kein `Math.random`).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Textfarbe nach gemessenem Kontrast**, nicht fest: Der Canvas wählt zwischen den Rollen `textAufDunkel` und `textAufHell` die mit dem **besseren Kontrast** zur Akzentfläche." (TK 9.10.10) - „Es ist dieselbe Rechnung wie bei der Kontrast-Warnung des Editors (9.15.2) – **einmal gebaut, zweimal genutzt**. Hier entscheidet s

### #292  [TK+AD, anfuehrung]
ZITAT   : Ob `aktion.akzentfarbe` je einen 8-stelligen Hex-Wert (mit Alpha) tragen darf, ist nicht spezifiziert
NAECHSTE: `akzentfarbe` ist ein **freier** Hex-Wert, damit Partner-Hausfarben darstellbar sind.
KONTEXT : Über die Oberfläche kann also **kein** achtstelliger Wert in `Aktion.akzentfarbe` entstehen. Verstärkend: Diese Datei **sieht** `aktion.akzentfarbe` ohnehin nie – ihr einziger Canvas-Aufrufer #293 liest für die Akzentfläche `marke.farben.akzent` **direkt** („`aktion.akzentfarbe` wird von dieser Datei **nicht gelesen**", #293). **Für das Verhalten dieser Datei hat das seit dem 11.08.2026 keine Folg

### #292  [TK, anfuehrung]
ZITAT   : `farben: { <FarbRolle>: string } // Hex, 6- oder 8-stellig (8 = mit Alpha)`
steht in Issues: [301]
NAECHSTE: string } // Hex, 6- oder 8-stellig (8 = mit Alpha) schriften:
KONTEXT : Über die Oberfläche kann also **kein** achtstelliger Wert in `Aktion.akzentfarbe` entstehen. Verstärkend: Diese Datei **sieht** `aktion.akzentfarbe` ohnehin nie – ihr einziger Canvas-Aufrufer #293 liest für die Akzentfläche `marke.farben.akzent` **direkt** („`aktion.akzentfarbe` wird von dieser Datei **nicht gelesen**", #293). **Für das Verhalten dieser Datei hat das seit dem 11.08.2026 keine Folg

### #293  [TK, anfuehrung]
ZITAT   : Der **feste Markenrahmen** wird **immer** gezeichnet (Logo, Grundgestaltung) und ist **nicht abschaltbar** (FA-11).
NAECHSTE:  Der **feste Markenrahmen** wird **immer** gezeichnet (Logo, Grundgestaltung) und ist **nicht abschaltbar** (FA-11); gestalterischer Spielraum besteht ausschlie
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Bei Werbepartnern (der Anlass für FA-23) ist ein fehlendes Logo der **Normalfall**, nicht die Ausnahme – die Marke besteht oft nur aus Namen und Akzentfarbe. Der feste Markenrahmen ist laut TK 9.10.5 **nicht abschaltbar**: „Der **feste Markenrahmen** wird **immer** gezeichnet (Logo, Grundgestaltung) und ist **nicht abschaltbar** (FA-11)." Eine leere Logo-Zo

### #293  [TK, anfuehrung]
ZITAT   : **Die Akzentfarbe des Ersatz-Logos ist die der MARKE** (`marke.farben.akzent`), nicht die der Aktion. Das ist eine ausdrückliche Ausnahme von 9.10.9 […] **Rahmen und Marken-Identität sind stabil, nur Inhalte folgen der Aktion.**
NAECHSTE: Logos ist die der MARKE** (`marke.farben.akzent`), nicht die der Aktion. Das ist eine ausdrückliche Ausnahme von 9.10.9 und dort im Abschnitt „Abgrenzung" verze
KONTEXT : Und die Abgrenzung, ebenfalls wörtlich: „**Die Akzentfarbe des Ersatz-Logos ist die der MARKE** (`marke.farben.akzent`), nicht die der Aktion. Das ist eine ausdrückliche Ausnahme von 9.10.9 […] **Rahmen und Marken-Identität sind stabil, nur Inhalte folgen der Aktion.**" (TK 9.10.10)

### #293  [TK, anfuehrung]
ZITAT   : Der **feste Markenrahmen** wird **immer** gezeichnet (Logo, Grundgestaltung) und ist **nicht abschaltbar** (FA-11).
NAECHSTE:  Der **feste Markenrahmen** wird **immer** gezeichnet (Logo, Grundgestaltung) und ist **nicht abschaltbar** (FA-11); gestalterischer Spielraum besteht ausschlie
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) Siehe den vollständigen wörtlichen ENTSCHIEDEN-Block oben (TK 9.10.10) sowie zusätzlich: - „Das Ersatz-Logo entsteht in **derselben** Zeichenroutine wie alles andere (9.10.1) und ist damit pixelgleich in Vorschau und Render." (TK 9.10.10) - „Erstens das **Ersatz-Logo** (9.10.10): Es nimmt `marke.farben.akzent` und **nicht** 

### #293  [TK, blockzitat]
ZITAT   : - **Schrift: die gebündelte Rolle `headlinePlakativ`** (Archivo Black), **nicht** die eigene Headline-Schrift der Marke. *Begründung:* Eine Marke ohne Logo hat oft auch keine importierte Schrift – und hat sie eine, kann **genau diese Datei zur Renderzeit fehlen** (9.15.3). Dann wäre nicht einmal der *Ersatz* zeichenbar. Die gebündelte Schrift ist immer vorhanden, und `headlinePlakativ` ist laut 9.11.2 die Rolle mit „hoher Signalwirkung auf dem TV" – genau das, was ein Logo leisten muss. - **Textfarbe nach gemessenem Kontrast**, nicht fest: Der Canvas wählt zwischen den Rollen `textAufDunkel` und `textAufHell` die mit dem **besseren Kontrast** zur Akzentfläche. - **Lange Namen werden verkleinert, nicht abgeschnitten:** […] Also **einzeilig auf die Zonenbreite verkleinern** bis zur Mindestgröße, darunter **zweizeilig umbrechen**, **kein** `…`. - **`seitenverhaeltnis` ist bei `logo === null` bedeutungslos.** Die Fläche kommt aus dem Zonen-`rahmen` – in der eingebauten Vorlage 420 × 120 px oben links (9.11.1).
NAECHSTE: - **Schrift: die gebündelte Rolle `headlinePlakativ`** (Archivo Black), **nicht** die eigene Headline-Schrift der Marke. *Begründung:* Eine Marke ohne Logo hat oft auch keine importierte Schrift – und hat sie eine, kann **genau diese Datei zur Renderzeit fehlen** (9.15.3). Dann wäre nicht einmal der *Ersatz* zeichenbar. Die gebündelte Schrift ist immer vorhanden, und `headlinePlakativ` ist laut 9.11.2 die Rolle mit „hoher Signalwirkung auf dem TV" – genau das, was ein Logo leisten muss. - **Textfarbe nach gemessenem Kontrast**, nicht fest: Der Canvas wählt zwischen den Rollen `textAufDunkel` und `textAufHell` die mit dem **besseren Kontrast** zur Akzentfläche. *Begründung:* Die Akzentfarbe ist seit FA-24 ein **freier** Wert und kann hell oder dunkel sein; eine feste Textfarbe wäre auf der einen Hälfte des Farbraums unlesbar. Es ist dieselbe Rechnung wie bei der Kontrast-Warnung des Editors (9.15.2) – **einmal gebaut, zweimal genutzt**. Hier entscheidet sie automatisch statt zu warnen: Beim Ersatz-Logo gibt es keine Nutzerwahl, die man warnen kön
KONTEXT : ## ENTSCHIEDEN – die vier Festlegungen aus TK 9.10.10, wörtlich - **Schrift: die gebündelte Rolle `headlinePlakativ`** (Archivo Black), **nicht** die eigene Headline-Schrift der Marke. *Begründung:* Eine Marke ohne Logo hat oft auch keine importierte Schrift – und hat sie eine, kann **genau diese Datei zur Renderzeit fehlen** (9.15.3). Dann wäre nicht einmal der *Ersatz* zeichenbar. Die gebündelte

### #294  [TK, anfuehrung]
ZITAT   : neues Issue = neue Datei
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Modul & Datei - Modul: `template-canvas` (Renderer, geteilt) - Datei: `src/renderer/template-canvas/zeichne-segment.ts` (**bestehende Datei, M4-23 – wird erweitert, keine neue Datei**; dieselbe Art Edit wie an `Marke`/`Aktion`/`Project` in diesem Meilenstein, s. STOPP für die Begründung, warum das nicht als „neues Issue = neue Datei" zu lösen ist) - Vertrag: Technisches Konzept **9.15.4** (die 

### #294  [TK, anfuehrung]
ZITAT   : Rotieren im Band Aktionen verschiedener Partner, wechselte sonst die Flächenfarbe im Sekundenrhythmus – links und rechts neben dem Video und im Bandhintergrund. Auf einem 85-Zoll-Schirm ist das unruhig, nicht professionell.
NAECHSTE: schiedener Partner, wechselte sonst die Flächenfarbe im Sekundenrhythmus – links und rechts neben dem Video und im Bandhintergrund. Auf einem 85-Zoll-Schirm ist
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Rotieren im Werbeband (FA-20) Aktionen verschiedener Partner, ändert sich mit jedem Abschnitt die `markeId` – und damit potenziell Logo, Schriften und Farben. TK 9.15.4 legt fest, dass der **Inhalt** dieser Wechsel folgt, der **Rahmen** aber nicht: „Rotieren im Band Aktionen verschiedener Partner, wechselte sonst die Flächenfarbe im Sekundenrhythmus – links

### #294  [TK, anfuehrung]
ZITAT   : **die Prüfung sitzt im RENDERER, vor dem Zeichnen**
NAECHSTE: **Die Prüfung sitzt im RENDERER, vor dem Zeichnen** (9.15.3).
KONTEXT : **Die Schrift-Prüfung (Ablauf-Punkt 0).** M4-23 prüft heute `sindSchriftenBereit()` – das sind die **vier gebündelten** Schriften. Seit FA-24 kann jede Marke **eigene** Schriften mitbringen; #291 baut deren Ladeweg und den synchronen Nachweis `sindMarkenSchriftenBereit(marke)`, hat aber keinen Ort, an dem er abgefragt wird. Ohne diese Ergänzung liefe der gesamte Ladeweg aus #291 ins Leere: Der Can

### #294  [TK, anfuehrung]
ZITAT   : Logo-Zone bleibt leer
NAECHSTE: Zone bleibt leer, Layout unverändert.
KONTEXT : *Warum diese Zeile mitgeändert werden MUSS:* `marke.logo` ist seit dem Edit an **#52** (= **#320**) `… | null`. Bliebe 4.a unverändert, wäre der Zugriff `marke.logo.datei` bei einer Marke ohne Logo ein Laufzeitfehler – und selbst mit einem `?.` davor wäre der Wert `undefined`, die Leer-Prüfung (4.b) schlüge an, und die Zone wäre nach 4.e **fertig**, bevor 4.f überhaupt erreicht wird. Der Dispatch 

### #294  [TK, anfuehrung]
ZITAT   : Es ist dieselbe Linie wie beim Ersatz-Logo (9.10.10): Marken-Identität und Rahmen sind stabil.
NAECHSTE:  Es ist dieselbe Linie wie beim Ersatz-Logo (9.10.10): Marken- Identität und Rahmen sind stabil. #### 9.15.5 Fehlercodes | Fehlercode | Ursache | |---|---| | `m
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die vollständige Tabelle und der bindende Satz aus TK 9.15.4 (oben, wörtlich zitiert). - „Es ist dieselbe Linie wie beim Ersatz-Logo (9.10.10): Marken-Identität und Rahmen sind stabil." (TK 9.15.4) - „Der **feste Markenrahmen** wird **immer** gezeichnet (Logo, Grundgestaltung) und ist **nicht abschaltbar** (FA-11); gestalt

### #294  [TK, anfuehrung]
ZITAT   : **Zeichenreihenfolge = Array-Reihenfolge** (später gezeichnete Zone liegt oben). **Kein** implizites Sortieren.
NAECHSTE: **Zeichenreihenfolge = Array-Reihenfolge** (später gezeichnete Zone liegt oben).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die vollständige Tabelle und der bindende Satz aus TK 9.15.4 (oben, wörtlich zitiert). - „Es ist dieselbe Linie wie beim Ersatz-Logo (9.10.10): Marken-Identität und Rahmen sind stabil." (TK 9.15.4) - „Der **feste Markenrahmen** wird **immer** gezeichnet (Logo, Grundgestaltung) und ist **nicht abschaltbar** (FA-11); gestalt

### #295  [TK, anfuehrung]
ZITAT   : gefahrlos wie bei Vorlagen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Warum keine Arbeitskopie wie im `vorlagen-editor`.** TK 9.15.1 kennt für Marken **kein** `oeffneZurBearbeitung`/`speichereArbeitskopie`-Paar: `bearbeiteMarke` schreibt **direkt** auf die Marke, entprellt und sichtbar gemacht über einen eigenen Auto-Speichern-Kanal (9.15.1). Ein Experimentieren „gefahrlos wie bei Vorlagen" gibt es hier **nicht** – das ist eine bewusste TK-Entscheidung (kein Undo 

### #295  [TK, anfuehrung]
ZITAT   : `listeMarken` … aufgelöst, einschließlich abgeleiteter
NAECHSTE: entliche Wert. | Operation | Eingang → Ausgang | |---|---| | `listeMarken` | – → `Ergebnis<Marke[]>` – **aufgelöst**, einschließlich abgeleiteter, je samt `herk
KONTEXT : 1. **Diese Datei ist die gemeinsame Marken-Sicht des Renderers**, analog zur Vorlagen-Übersicht des `vorlagen-editor` (TK 9.12.2, dortige Umsetzung). Sie wird **nicht** über IPC-Ereignisse aktuell gehalten: `marken-editor` ist der einzige Renderer-Nutzer der Marken-Bearbeitung, und der `marken-store` hat für Änderungen aus der eigenen Sitzung **kein** Ereignis vorgesehen – `marken:autoSpeichernSta

### #295  [TK, anfuehrung]
ZITAT   : Sie zeigt die Rollen aus 9.11.2 mit ihren Werten … und stellt das Ergebnis über `template-canvas` dar.
NAECHSTE:  aus 9.11.2 mit ihren Werten, erlaubt den Import von Logo und Schriften und stellt das Ergebnis über `template-canvas` dar – **dieselbe** Zeichenroutine wie übe
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Die Vererbung wird an genau EINER Stelle aufgelöst** – hier. `leseMarke` und `listeMarken` liefern **fertige** Marken; kein Aufrufer sieht je eine Teilmenge." (TK 9.15.1) – diese Datei implementiert deshalb **keine eigene** Vererbungslogik und reicht die Marken **unverändert** durch. - „Sie zeigt die Rollen aus 9.11.2 m

### #295  [TK, anfuehrung]
ZITAT   : Auto-Speichern während des Bearbeitens
steht in Issues: [296, 307, 308]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – kein Ereignis, kein Abonnement eines Main-Push in dieser Datei.** `marken:autoSpeichernStatus` (#278) meldet ausschließlich einen gescheiterten Schreibvorgang; sein Abonnement gehört in die Oberfläche, die den Hinweis anzeigt – und die ist seit dem 11.08.2026 **vergeben: #327** im Modul **`app-shell`** (`src/renderer/app-shell/marken-spei

### #296  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : 1. **Die Nutzlast von `bearbeiteMarke` trägt nur die geänderte Rolle, nicht alle dreizehn.** #285 legt das inzwischen verbindlich fest: `teilwerte.farben` ist ein **partielles** Objekt, das der Store **rollenweise** in `Marke.farben` mischt (#285, Ablauf-Schritt 2b: „bei `farben`/`schriften`: nur die genannte Rolle, die übrigen Rollen des Objekts bleiben unangetastet") – **nicht** die vollständige

### #296  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Rollen sind fest, Werte frei.** Der Editor kann **keine** Rollen hinzufügen oder entfernen – die Farb- und Schrift-Rollen aus 9.11.2 sind der Vertrag, auf den **jede** Vorlage verweist (9.11.1 Punkt 7). Eine fehlende Rolle brächte jede Vorlage zum Stillstand, die sie auflöst." (TK 9.15.2) - „Farben und Schriften sind Ro

### #297  [AD, anfuehrung]
ZITAT   : Für **importierte** Schriften trägt der Nutzer die Nutzungsrechte – die Anwendung brennt sie in ein Video ein, das weitergegeben und öffentlich gezeigt wird.
NAECHSTE: Für **importierte** Schriften (FA-24) trägt der Nutzer die Nutzungsrechte – die Anwendung brennt sie in ein Video ein, das weitergegeben und öffentlich gezeigt wird.
KONTEXT : **Zweitens die Lizenz-Verantwortung.** „Für **importierte** Schriften trägt der Nutzer die Nutzungsrechte – die Anwendung brennt sie in ein Video ein, das weitergegeben und öffentlich gezeigt wird." (Anforderungsdokument R-07) Diese Zusage hat **keine** technische Durchsetzung (es gibt keine Lizenzprüfung im Code) – sie hängt vollständig daran, dass der Nutzer den Hinweis **sieht**, bevor er impor

### #297  [TK, anfuehrung]
ZITAT   : **Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf …, `importiert` auf `marken-assets/<markeId>/`.
steht in Issues: [288, 289, 290, 315]
NAECHSTE: - **Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf – in v1 sind das **die vier OFL-Schriften und sonst nichts**:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf …, `importiert` auf `marken-assets/<markeId>/`." (TK 9.15.3) – diese Datei unterscheidet die Anzeige **ausschließlich** über `herkunft`, nie über einen Datei-Pfad-Vergleich. - „**Import kopiert.** Die Quelldatei bleibt unberührt, die Kopie gehör

### #297  [TK, anfuehrung]
ZITAT   : **Import kopiert.** Die Quelldatei bleibt unberührt, die Kopie gehört der Marke … Format-Whitelist: **`.woff2`** für Schriften … *Nur `.woff2`, weil die gebündelten Schriften dasselbe Format haben: ein Ladepfad statt zwei*.
NAECHSTE: woff2`** für Schriften, die Bild-Whitelist (9.4.2) für Logos. *Nur `.woff2`, weil die gebündelten Schriften dasselbe Format haben: ein Ladepfad statt zwei, und 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf …, `importiert` auf `marken-assets/<markeId>/`." (TK 9.15.3) – diese Datei unterscheidet die Anzeige **ausschließlich** über `herkunft`, nie über einen Datei-Pfad-Vergleich. - „**Import kopiert.** Die Quelldatei bleibt unberührt, die Kopie gehör

### #298  [TK, anfuehrung]
ZITAT   : **Kein leerer Bereich**, und **kein** fremdes Logo an dieser Stelle
NAECHSTE: en** (`marke.name`) auf einer Fläche in der **Akzentfarbe der Marke**. Kein leerer Bereich, und **kein** fremdes Logo an dieser Stelle – eine geliehene Marke wä
KONTEXT : ## Warum das im Gesamtsystem wichtig ist `Marke.logo` ist seit v3.4 `| null` – „bei Werbepartnern der Normalfall" (TK 9.10.10). Genau darum ist diese Datei heikel: **Entfernen ist keine Fehlerbehandlung, sondern eine reguläre Handlung**, deren Ergebnis ein sichtbar anderes, aber **weiterhin markenkonformes** Bild ist – der Ersatz zeigt den Markennamen auf der Akzentfläche der Marke. Zeigt der Edit

### #298  [TK, anfuehrung]
ZITAT   : `Marke.logo` ist seit v3.4 `| null` – bei Werbepartnern der Normalfall. Ist es `null`, zeichnet `template-canvas` in **jeder** Zone mit `bindung: logo` einen **Ersatz**: den **Markennamen** … auf einer Fläche in der **Akzentfarbe der Marke**. Kein leerer Bereich, und **kein** fremdes Logo an dieser Stelle.
NAECHSTE: -canvas` in **jeder** Zone mit `bindung: logo` einen **Ersatz**: den **Markennamen** (`marke.name`) auf einer Fläche in der **Akzentfarbe der Marke**. Kein leer
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „`Marke.logo` ist seit v3.4 `| null` – bei Werbepartnern der Normalfall. Ist es `null`, zeichnet `template-canvas` in **jeder** Zone mit `bindung: logo` einen **Ersatz**: den **Markennamen** … auf einer Fläche in der **Akzentfarbe der Marke**. Kein leerer Bereich, und **kein** fremdes Logo an dieser Stelle." (TK 9.10.10) -

### #299  [TK, anfuehrung]
ZITAT   : Bei einer abgeleiteten Marke ist sichtbar, was geerbt und was eigen ist. Ein Wert, den der Nutzer nicht setzt, bleibt geerbt und folgt künftigen Änderungen des Parents; ein gesetzter Wert löst sich davon. **Ohne diese Anzeige wüsste niemand, warum sich eine Farbe „von selbst" geändert hat.**
NAECHSTE: - **Bei einer abgeleiteten Marke ist sichtbar, was geerbt und was eigen ist.** Ein Wert, den der Nutzer nicht setzt, bleibt geerbt und folgt künftigen Änderungen des Parents;
KONTEXT : ## Warum das im Gesamtsystem wichtig ist „Bei einer abgeleiteten Marke ist sichtbar, was geerbt und was eigen ist. Ein Wert, den der Nutzer nicht setzt, bleibt geerbt und folgt künftigen Änderungen des Parents; ein gesetzter Wert löst sich davon. **Ohne diese Anzeige wüsste niemand, warum sich eine Farbe „von selbst" geändert hat.**" (TK 9.15.2) Diese Anzeige ist also kein Komfortmerkmal – ohne si

### #299  [TK, anfuehrung]
ZITAT   : an die Vererbung zurückzugeben
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Der Auftrag hat zwei Hälften mit sehr unterschiedlichem Stand.** Als dieses Issue geschrieben wurde, war offen, ob es überhaupt einen Weg gibt, einen eigenen Wert wieder „an die Vererbung zurückzugeben" – TK 9.15.1 kennt dafür nur `entferneMarkenDatei`, und das **ausschließlich** für `art: 'logo'|'schrift'`, nicht für Farben, Sicherheitsabstand, Radien, Schatten oder Slogan. **#285 (`bearbeiteMa

### #299  [TK, anfuehrung]
ZITAT   : **kein** Aufrufer sieht je eine Teilmenge
NAECHSTE: kein Aufrufer sieht je eine Teilmenge.
KONTEXT : Drei unabhängig geschriebene Issues (#282, #283, dieses) stießen auf denselben Widerspruch zwischen „**kein** Aufrufer sieht je eine Teilmenge" (TK 9.11.2/9.15.1) und der von TK 9.15.2 verlangten Sichtbarkeit von Herkunft je Feld. Die Lücke lag **strukturell** in der Operationstabelle, nicht in einer einzelnen Implementierung.

### #299  [TK, anfuehrung]
ZITAT   : außer id, name, parent * und eingebaut
NAECHSTE: Das gilt für **jedes** Feld außer `id`, `name`, `parent` und `eingebaut`.
KONTEXT : /** Ein einzelnes änderbares Feld einer Marke, adressiert für Rückgabe UND Anzeige. `name` fehlt * absichtlich: „name" kennt laut #285 kein `{ geerbt: true }` (TK 9.11.2: „außer id, name, parent * und eingebaut"). */ export type HerkunftPfad = | { art: 'farbe'; rolle: FarbRolle } | { art: 'schrift'; rolle: SchriftRolle } | { art: 'logo' } | { art: 'sicherheit' } | { art: 'radien' } | { art: 'schat

### #299  [TK, anfuehrung]
ZITAT   : Bei einer abgeleiteten Marke ist sichtbar, was geerbt und was eigen ist. Ein Wert, den der Nutzer nicht setzt, bleibt geerbt und folgt künftigen Änderungen des Parents; ein gesetzter Wert löst sich davon.
NAECHSTE: - **Bei einer abgeleiteten Marke ist sichtbar, was geerbt und was eigen ist.** Ein Wert, den der Nutzer nicht setzt, bleibt geerbt und folgt künftigen Änderungen des Parents;
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Bei einer abgeleiteten Marke ist sichtbar, was geerbt und was eigen ist. Ein Wert, den der Nutzer nicht setzt, bleibt geerbt und folgt künftigen Änderungen des Parents; ein gesetzter Wert löst sich davon." (TK 9.15.2) - „Bei `parent ≠ null` sind `farben` und `schriften` **Teilmengen**: Für jede Rolle, die die abgeleitete 

### #299  [TK, anfuehrung]
ZITAT   : Die Vererbung wird an genau EINER Stelle aufgelöst – hier. … kein Aufrufer sieht je eine Teilmenge.
NAECHSTE: **Invarianten (bindend):** - **Die Vererbung wird an genau EINER Stelle aufgelöst** – hier.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Bei einer abgeleiteten Marke ist sichtbar, was geerbt und was eigen ist. Ein Wert, den der Nutzer nicht setzt, bleibt geerbt und folgt künftigen Änderungen des Parents; ein gesetzter Wert löst sich davon." (TK 9.15.2) - „Bei `parent ≠ null` sind `farben` und `schriften` **Teilmengen**: Für jede Rolle, die die abgeleitete 

### #300  [TK, anfuehrung]
ZITAT   : **Ketten sind auf EINE Stufe begrenzt:** Ein Parent darf selbst keinen Parent haben. Sonst müsste die Auflösung beliebig tief laufen und die Referenzprüfung beim Löschen … rekursiv über einen Baum statt über eine Liste laufen.
NAECHSTE:  begrenzt:** Ein Parent darf selbst keinen Parent haben. Sonst müsste die Auflösung beliebig tief laufen und die Referenzprüfung beim Löschen (9.15.1) rekursiv 
KONTEXT : ## Warum das im Gesamtsystem wichtig ist „**Ketten sind auf EINE Stufe begrenzt:** Ein Parent darf selbst keinen Parent haben. Sonst müsste die Auflösung beliebig tief laufen und die Referenzprüfung beim Löschen … rekursiv über einen Baum statt über eine Liste laufen." (TK 9.11.2) Diese Grenze ist **serverseitig durchgesetzt** (`erstelleMarke` weist eine zu tiefe Kette mit `ungueltige_eingabe` ab,

### #300  [TK, anfuehrung]
ZITAT   : Ableitungsketten sind auf eine Stufe begrenzt (9.11.2): `erstelleMarke` mit einer `parentId`, deren Marke selbst einen Parent hat, wird mit `ungueltige_eingabe` abgewiesen.
NAECHSTE: igen"` (9.11.2). - **Ableitungsketten sind auf eine Stufe begrenzt** (9.11.2): `erstelleMarke` mit einer `parentId`, deren Marke selbst einen Parent hat, wird m
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Eine Marke kann von einer anderen **abgeleitet** sein und einzelne Werte überschreiben (Saison- oder Kampagnen-Look)." (Anforderungsdokument FA-23) - „**Ketten sind auf EINE Stufe begrenzt:** Ein Parent darf selbst keinen Parent haben." (TK 9.11.2) - „Ableitungsketten sind auf eine Stufe begrenzt (9.11.2): `erstelleMarke`

### #301  [AD, anfuehrung]
ZITAT   : warnen, nicht blockieren
steht in Issues: [330]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : /** * Zeigt NICHTS (`null`), solange der Kontrast ausreicht. Reicht er nicht, zeigt sie einen * nicht-blockierenden Hinweis. Es gibt KEINEN Bestätigungs-Dialog, KEINEN deaktivierten * Speichern-Knopf und KEINE zweite Bestätigung – „warnen, nicht blockieren" (FA-24). */ export function KontrastWarnung(props: KontrastWarnungProps): JSX.Element | null ```

### #301  [TK, anfuehrung]
ZITAT   : 6- **oder 8-stellig**
NAECHSTE: string } // Hex, 6- oder 8-stellig (8 = mit Alpha) schriften:
KONTEXT : Ausgang bei „ausreichendem" Kontrast: `KontrastWarnung` liefert `null` – keine sichtbare Änderung. Ausgang bei unzureichendem Kontrast: `KontrastWarnung` liefert ein sichtbares Hinweis-Element; das `verhaeltnis` aus `ermittleKontrastHinweis(marke, schwellenwert)` darf im Text angezeigt werden. Es gibt **keinen** Fehlerausgang – diese Funktionen überqueren keine IPC-Grenze; ein für #292 ungültiges 

### #301  [TK+AD, anfuehrung]
ZITAT   : **Der Schwellenwert ist `4,5:1` (v3.10 entschieden)** – WCAG AA für Fließtext, geführt als Konstante **`KONTRAST_SCHWELLE`** (9.11.4). […] **Die Zahl steht an genau einer Stelle** – weder `kontrastVerhaeltnis` noch der Editor führen eine eigene.
steht in Issues: [320]
NAECHSTE: **Der Schwellenwert ist `4,5:1` (v3.10 entschieden)** – WCAG AA für Fließtext, geführt als Konstante **`KONTRAST_SCHWELLE`** (9.11.4).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Kontrast-Warnung (FA-24):** Der Editor berechnet den Kontrast zwischen Akzentfläche und dem darauf liegenden Text und **warnt sichtbar**, ohne die Wahl zu verhindern." (TK 9.15.2) - „Die Akzentfarbe ist seit FA-24 ein freier Wert, damit Partner-Hausfarben darstellbar sind – ein Schwellenwert machte genau die unbrauchbar

### #301  [TK, anfuehrung]
ZITAT   : `farben: { <FarbRolle>: string } // Hex, 6- oder 8-stellig (8 = mit Alpha)`
steht in Issues: [292]
NAECHSTE: string } // Hex, 6- oder 8-stellig (8 = mit Alpha) schriften:
KONTEXT : **Das Verbot bleibt deshalb wortgleich bestehen** (s. unten): kein `4.5` als Literal in dieser Datei, kein Vorgabewert am Prop, keine eigene Konstante. - **ERLEDIGT – nicht mehr melden: Der 8-stellige Hex-Wert (mit Alpha) in `marke.farben` wird gerechnet, nicht geworfen.** Der Befund war: TK 9.11.2 lässt ihn ausdrücklich zu – wörtlich: „`farben: { <FarbRolle>: string } // Hex, 6- oder 8-stellig (8

### #301  [TK, anfuehrung]
ZITAT   : muss zusätzlich den `schwellenwert` klären
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Abhängigkeiten - Blockiert von: **#292** (`kontrastVerhaeltnis`/`erreichtKontrastSchwelle`, bereits geschrieben), M1-40/#52 (`Marke`-Vertrag, `farben`-Feld, TK 9.11.2) - **Nicht** blockiert von **#320**: Diese Datei importiert `KONTRAST_SCHWELLE` nicht. Die Konstante entsteht dort und wird von **#330** gelesen; erst dessen Rendering braucht sie. - Blockiert: **#330** (die Editor-Wurzel `src/ren

### #302  [TK, anfuehrung]
ZITAT   : `pruefeMarkenReferenzen` | `markeId` → `Ergebnis<Markennutzung>` – **rein lesend**: ermittelt über **alle** Projekte, wer die Marke nutzt; speist die Warnung **vor** dem Löschen.
steht in Issues: [275]
NAECHSTE: rdmarke** führen | | `pruefeMarkenReferenzen` | `markeId` → `Ergebnis<Markennutzung>` – **rein lesend**: ermittelt über **alle** Projekte, wer die Marke nutzt; 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Löschen fragt vorher.** Vor `löscheMarke` zeigt der Editor das Ergebnis von `pruefeMarkenReferenzen`: welche Aktionen in welchen Projekten, welche abgeleiteten Looks und **welche Projekte die Marke als Standardmarke führen** (alle drei Listen, 9.15.1). Für die dritte Liste verweist er auf den Reiter **Projekte**: Dort –

### #303  [TK, anfuehrung]
ZITAT   : [Der Editor] stellt das Ergebnis über `template-canvas` dar – **dieselbe** Zeichenroutine wie überall, damit die Vorschau im Editor dem späteren Segment entspricht (9.10.1).
NAECHSTE: lt das Ergebnis über `template-canvas` dar – **dieselbe** Zeichenroutine wie überall, damit die Vorschau im Editor dem späteren Segment entspricht (9.10.1). **I
KONTEXT : TK 9.15.2 verlangt deshalb ausdrücklich: „[Der Editor] stellt das Ergebnis über `template-canvas` dar – **dieselbe** Zeichenroutine wie überall, damit die Vorschau im Editor dem späteren Segment entspricht (9.10.1)." Das schließt insbesondere das **Ersatz-Logo** (#293, TK 9.10.10) ein: Wer eine Marke ohne Logo anlegt, muss im Editor **sofort** sehen, wie ihr Markenname als Ersatz-Logo aussieht – s

### #303  [TK, anfuehrung]
ZITAT   : kein Auftrag der Queue – eine reine, synchron aufrufbare Renderer-Funktion
NAECHSTE: - Ist **kein** Auftrag der Queue – eine reine, synchron aufrufbare Renderer-Funktion.
KONTEXT : Ausgang: `SegmentBild` (Canvas + native Fläche) – **identisch** in Form und Herkunft zu jedem anderen Aufruf von `zeichneSegment` im System. Es gibt **keinen** Fehlerausgang, weil `zeichneSegment` selbst keinen liefert (TK 9.10.8: „kein Auftrag der Queue – eine reine, synchron aufrufbare Renderer-Funktion").

### #303  [TK, anfuehrung]
ZITAT   : [Der `marken-editor`] stellt das Ergebnis über `template-canvas` dar – **dieselbe** Zeichenroutine wie überall, damit die Vorschau im Editor dem späteren Segment entspricht (9.10.1).
NAECHSTE: lt das Ergebnis über `template-canvas` dar – **dieselbe** Zeichenroutine wie überall, damit die Vorschau im Editor dem späteren Segment entspricht (9.10.1). **I
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Invariante:** Es gibt **keinen zweiten Zeichenpfad.** Anzeige und Export stammen immer aus **demselben** Aufruf – sonst driften Vorschau und Endvideo auseinander." (TK 9.10.1) - „[Der `marken-editor`] stellt das Ergebnis über `template-canvas` dar – **dieselbe** Zeichenroutine wie überall, damit die Vorschau im Editor d

### #303  [TK, anfuehrung]
ZITAT   : **das** [eine] gebündelte Marken-Logo
NAECHSTE: Wer einen Zweig „gebündeltes Logo" baut, baut toten Code.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – kein zweiter Zeichenpfad.** Diese Datei zeichnet **nichts** selbst auf ein `CanvasRenderingContext2D` – jede Pixelentscheidung läuft ausschließlich über `zeichneSegment`. - **Verbot – keine eigene Platzhalter-Logik für das Bild.** `baueVorschauAktion` setzt `bildRef: null`; ob und wie die Bild-Zone das anzeigt, entscheidet die Vorlage übe

### #303  [TK, anfuehrung]
ZITAT   : eine Stelle lädt vorher
NAECHSTE: **Genau eine** Stelle löst auf – nicht jede Zonen-Sorte einzeln.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – kein zweiter Zeichenpfad.** Diese Datei zeichnet **nichts** selbst auf ein `CanvasRenderingContext2D` – jede Pixelentscheidung läuft ausschließlich über `zeichneSegment`. - **Verbot – keine eigene Platzhalter-Logik für das Bild.** `baueVorschauAktion` setzt `bildRef: null`; ob und wie die Bild-Zone das anzeigt, entscheidet die Vorlage übe

### #304  [AD, anfuehrung]
ZITAT   : fertige Funktion ohne Aufrufer
steht in Issues: [268, 295, 309, 314, 322]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **NACHTRAG (10.08.) – der NEUNTE Instant-Kanal `marken:öffneMarkenDateiDialog`.** Die erste Fassung dieses Issues führte **acht** Instant-Kanäle und schloss einen neunten ausdrücklich aus. Das war ein Widerspruch zu **vier** anderen Issues: **#306** baut `öffneMarkenDateiDialog` und hält fest, dass die Verdrahtung „in **#304**" geschieht; **#297** und **#298** rufen den Kanal wörtlich als „`marken

### #304  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2), wörtlich wie in M5-34/M7-45 zitiert – hier **unverändert durchgereicht**, nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. - „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne

### #304  [TK, anfuehrung]
ZITAT   : **Kanalbenennung `<modul>:<operation>`**
steht in Issues: [25, 65, 71, 76, 77]
NAECHSTE: Kanalbenennung `<modul>:<operation>`** – z.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2), wörtlich wie in M5-34/M7-45 zitiert – hier **unverändert durchgereicht**, nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. - „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne

### #304  [TK, anfuehrung]
ZITAT   : **10. Die App hat GENAU EIN Fenster** – und jedes Ereignis geht an dieses eine Fenster. […] Der Sender im Main adressiert das eine Fenster; es gibt **keine** Verteilerlogik, **keine** Empfängerliste, **kein** „an alle Fenster senden". Wer im Main ein Ereignis verschickt, hat **keine** Wahl zu treffen.
NAECHSTE: *: Der Sender im Main adressiert das eine Fenster; es gibt **keine** Verteilerlogik, **keine** Empfängerliste, **kein** „an alle Fenster senden". Wer im Main ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2), wörtlich wie in M5-34/M7-45 zitiert – hier **unverändert durchgereicht**, nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. - „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne

### #304  [TK, anfuehrung]
ZITAT   : **Die Vererbung wird an genau EINER Stelle aufgelöst** – hier [`marken-store`]. `leseMarke` und `listeMarken` liefern **fertige** Marken; kein Aufrufer sieht je eine Teilmenge.
NAECHSTE: ln lässt. **Invarianten (bindend):** - **Die Vererbung wird an genau EINER Stelle aufgelöst** – hier. `leseMarke` und `listeMarken` liefern **fertige** Marken; 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Ergebnis-Hülle (TK 9.1.1, Punkt 2), wörtlich wie in M5-34/M7-45 zitiert – hier **unverändert durchgereicht**, nicht ausgepackt, nicht vereinfacht, nicht in eine Exception verwandelt. - „**Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne

### #305  [TK, anfuehrung]
ZITAT   : Marken sind ein app-weiter Bestand und bearbeitbar (`marken-store`, 9.15.1; FA-23/FA-24).
steht in Issues: [280]
NAECHSTE: **Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1;
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Module **außerhalb** dieses Ordners importieren die Sicht **nicht** direkt; sie bekommen die Aktualisierungsfunktion als **Parameter** übergeben. Wer sie beim Aufbau der Oberfläche durchreicht, ist Sache der `app-shell` (M7) und ausdrücklich **nicht** Teil von M5." (#155, ENTSCHIEDEN 1, zitiert in M7-04) - „Module **außer

### #305  [TK, anfuehrung]
ZITAT   : fünfter Reiter oder Unterbereich des Reiters Vorlagen?
NAECHSTE: Listenelement-ID des Treffers } Vorlagennutzung { aktionen:
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ERLEDIGT – nicht mehr melden, nicht mehr fragen: Der Marken-Editor bekommt einen FÜNFTEN Reiter [Marken].** Hier stand bis zum 10.08. eine offene Frage („fünfter Reiter oder Unterbereich des Reiters Vorlagen?"). Sie ist **seit TK v3.6 entschieden** (9.14.1) und im Briefing als Punkt 3 von Abschnitt 3a geführt: „**Der `marken-editor` sitzt in einem

### #305  [TK, anfuehrung]
ZITAT   : **Der `marken-editor` sitzt in einem eigenen, FÜNFTEN Reiter [Marken]** (v3.6, 9.14.1), neben [Vorlagen].
NAECHSTE: Der `marken-editor` bekommt einen FÜNFTEN Reiter [Marken]** (9.14.1/9.14.2).
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ERLEDIGT – nicht mehr melden, nicht mehr fragen: Der Marken-Editor bekommt einen FÜNFTEN Reiter [Marken].** Hier stand bis zum 10.08. eine offene Frage („fünfter Reiter oder Unterbereich des Reiters Vorlagen?"). Sie ist **seit TK v3.6 entschieden** (9.14.1) und im Briefing als Punkt 3 von Abschnitt 3a geführt: „**Der `marken-editor` sitzt in einem

### #306  [TK, anfuehrung]
ZITAT   : ein konstanter Wert für Dialog **und** Import
NAECHSTE: **Format-Whitelist** kommt aus **einem** konstanten Wert in `contracts/types` (Dialog-Filter **und** Import-Prüfung).
KONTEXT : ## Modul & Datei - Modul: `marken-store` [V2] (Main) - Datei: `src/main/marken-store/dialog.ts` - Vertrag: Technisches Konzept **9.15.3** (Format-Whitelist `.woff2` bzw. Bild-Whitelist – Quelle der Wahrheit für die Formate), **9.4.2** (die Invariante „ein konstanter Wert für Dialog **und** Import"), **9.4.3** (`öffneMedienDialog` – das **Bauvorbild**, dessen Abbruch-Regel hier übernommen wird), **

### #306  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 68, 71, 85, 87]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Formate, wörtlich (TK 9.15.3): „**Import kopiert.** Die Quelldatei bleibt unberührt, die Kopie gehört der Marke – wie beim Medien-Import (9.4.5). Format-Whitelist: **`.woff2`** für Schriften, die Bild-Whitelist (9.4.2) für Logos." - Warum ausgerechnet `.woff2` und nichts sonst, wörtlich (TK 9.15.3): „*Nur `.woff2`, wei

### #306  [TK, anfuehrung]
ZITAT   : weil das die üblichen Schriftformate sind
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – Abbruch ist niemals ein Fehler.** Kein `nicht_gefunden`, kein `ungueltige_eingabe`, kein eigens erfundener Code `abgebrochen`. Das Bauvorbild ist hier eindeutig (TK 9.4.3), und der Aufrufer **#326** ist ebenso darauf geschrieben wie die beiden Import-Funktionen (#297, #298), an die er weiterreicht. - **Verbot – keine Endungs-Literale.** K

### #306  [TK, anfuehrung]
ZITAT   : weil Logos oft Vektoren sind
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – Abbruch ist niemals ein Fehler.** Kein `nicht_gefunden`, kein `ungueltige_eingabe`, kein eigens erfundener Code `abgebrochen`. Das Bauvorbild ist hier eindeutig (TK 9.4.3), und der Aufrufer **#326** ist ebenso darauf geschrieben wie die beiden Import-Funktionen (#297, #298), an die er weiterreicht. - **Verbot – keine Endungs-Literale.** K

### #307  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Das Feld selbst (TK 9.11.2, `Marke`): `slogan: { text: string, aktiv: boolean }` - „Ein Saison-Look, der nur `farben.akzent` setzt, erbt damit alle übrigen Farben, alle Schriften, Logo, Abstände, Radien, Schatten und Slogan. Setzt er ein Feld, gilt seins." (TK 9.11.2) – ein Aufruf dieser Funktion macht den Slogan einer abg

### #308  [TK, anfuehrung]
ZITAT   : Konstanten in `contracts/types` (an *einer* Stelle, nicht verstreut).
steht in Issues: [21, 320]
NAECHSTE: - **Konstanten in `contracts/types`** (an *einer* Stelle, nicht verstreut):
KONTEXT : 1. **Ein Aufruf mit dem vollständigen Objekt, nicht zwei mit je einer Achse.** `MarkenTeilwerte.sicherheit` ist `MarkenFeld<{ horizontal: number; vertikal: number }>` (#285) und **kein** partielles Objekt – anders als `farben`/`schriften`, die der Store rollenweise mischt. Schickte diese Datei nur `{ horizontal: 120 }`, ersetzte der Store das **ganze** Feld und `vertikal` ginge verloren. Die aufru

### #308  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Das Feld selbst (TK 9.11.2, `Marke`): `sicherheit: { horizontal: 96, vertikal: 54 } // absolute px im 1920×1080-RAHMEN` - „**Sicherheitsabstand: 5 % Innenabstand** – bei 1920×1080 also **96 px** links/rechts und **54 px** oben/unten. Innerhalb dieses Randes liegt **kein bedeutungstragender Inhalt** (TV-Overscan, Anforderun

### #309  [TK, anfuehrung]
ZITAT   : Die Trennlinie ist kein Stilfrage, sondern die einzige mögliche Reihenfolge: Wer ein Ereignis an den Renderer schickt, braucht den Empfänger; vor Schritt 6 existiert er nicht.
steht in Issues: [3]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Der Anmeldezeitpunkt, wörtlich (TK 9.15.3): „**Das Protokoll heißt `marken://<markeId>/<dateiname>` (v3.6, entschieden).** Gleiche Bauart und gleiche Schutzregeln wie `media://` (9.5.7): **nur lesend**, kein `..`-Ausbruch, keine absoluten Pfade im Renderer; die `markeId` steht an derselben Stelle, an der dort die `projektI

### #309  [TK, anfuehrung]
ZITAT   : **Die App hat GENAU EIN Fenster – und jedes Ereignis geht an dieses eine Fenster.** […] Der Sender im Main adressiert das eine Fenster; es gibt **keine** Verteilerlogik, **keine** Empfängerliste, **kein** „an alle Fenster senden".
NAECHSTE: *: Der Sender im Main adressiert das eine Fenster; es gibt **keine** Verteilerlogik, **keine** Empfängerliste, **kein** „an alle Fenster senden". Wer im Main ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Der Anmeldezeitpunkt, wörtlich (TK 9.15.3): „**Das Protokoll heißt `marken://<markeId>/<dateiname>` (v3.6, entschieden).** Gleiche Bauart und gleiche Schutzregeln wie `media://` (9.5.7): **nur lesend**, kein `..`-Ausbruch, keine absoluten Pfade im Renderer; die `markeId` steht an derselben Stelle, an der dort die `projektI

### #309  [TK, anfuehrung]
ZITAT   : Registriert den eigentlichen Anfrage-Handler. Wird NACH app.whenReady(), vor dem Laden des Hauptfensters aufgerufen – dieselbe Reihenfolge wie beim bestehenden 'media'-Handler.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Der Anmeldezeitpunkt, wörtlich (TK 9.15.3): „**Das Protokoll heißt `marken://<markeId>/<dateiname>` (v3.6, entschieden).** Gleiche Bauart und gleiche Schutzregeln wie `media://` (9.5.7): **nur lesend**, kein `..`-Ausbruch, keine absoluten Pfade im Renderer; die `markeId` steht an derselben Stelle, an der dort die `projektI

### #309  [TK, anfuehrung]
ZITAT   : **Sofort-Flush** unabhängig vom Timer, in vier Fällen: […] (3) **beim Beenden** […]. Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist (kein Schließen mit ausstehendem Schreiben).
NAECHSTE: Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist (kein Schließen mit ausstehendem Schreiben).
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Der Anmeldezeitpunkt, wörtlich (TK 9.15.3): „**Das Protokoll heißt `marken://<markeId>/<dateiname>` (v3.6, entschieden).** Gleiche Bauart und gleiche Schutzregeln wie `media://` (9.5.7): **nur lesend**, kein `..`-Ausbruch, keine absoluten Pfade im Renderer; die `markeId` steht an derselben Stelle, an der dort die `projektI

### #310  [TK, anfuehrung]
ZITAT   : Es sind exakt dieselben Werte, mit denen `zeichneSegment` das Band gezeichnet hat
steht in Issues: [134]
NAECHSTE: er hat das Band damit gezeichnet.
KONTEXT : **Warum #134 die Rahmen-Marke über #312 holt – und nicht als weiterer Parameter und nicht per eigenem IPC-Aufruf.** Ein fünfter Parameter an `loeseRenderAus` änderte eine **fremde**, abgenommene Signatur, die #231 (M7-38, `RenderDialogWirkungen.loeseRenderAus`) und #261 (M7-68) wörtlich führen – aus einem Edit an fünf Dateien würde einer an acht. Ein **eigener** `rufeAuf` auf `marken:leseMarke` wä

### #311  [AD, anfuehrung]
ZITAT   : Das ist **keine** zweite Wahrheit, weil die Marke im MVP unveränderlich ist … Zwei Lesevorgänge derselben unveränderlichen Datenmenge können nicht auseinanderlaufen.
steht in Issues: [197]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Der zweite Grund ist die **Begründung, auf der #197 sein Feld gebaut hat**, und die heute nicht mehr trägt: „Das ist **keine** zweite Wahrheit, weil die Marke im MVP unveränderlich ist … Zwei Lesevorgänge derselben unveränderlichen Datenmenge können nicht auseinanderlaufen." (#197, ENTSCHIEDEN 2). Marken sind seit FA-24 **bearbeitbar**. Ein Wert, der beim Fensteraufbau einmal gelesen und danach ni

### #311  [TK, anfuehrung]
ZITAT   : Module **außerhalb** dieses Ordners importieren die Sicht **nicht** direkt; sie bekommen die Aktualisierungsfunktion als **Parameter** übergeben. Wer sie beim Aufbau der Oberfläche durchreicht, ist Sache der `app-shell` (M7) und ausdrücklich **nicht** Teil von M5.
steht in Issues: [155, 197, 243, 305]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - „**Die Marke liegt seit v3.4 NICHT mehr hier.** … `AppKonfig` führt das Feld ausdrücklich **nicht** – lägen `leseKonfig().marke` und `leseMarke(...)` nebeneinander, könnten sie auseinanderlaufen, ohne dass etwas bricht." (TK 9.5.6) – deshalb wird der Aufruf **ersatzlos** gestrichen und **nicht** durch einen zweiten Lesepfad ersetzt. - Die Operationstabelle des `config-store` (TK 9.5.6) – **vier*

### #311  [TK, anfuehrung]
ZITAT   : das Feld aus `config.json` entfernen
steht in Issues: [317]
NAECHSTE: #### 9.5.6 `config-store` [D3] Besitzt `config.json` (app-weit):
KONTEXT : - **ERLEDIGT – nicht mehr melden, nicht mehr fragen: `config:leseMarke` entfällt ERSATZLOS.** Die Frage war echt und lautete: Meint „das Feld aus `config.json` entfernen" (TK 9.15.1) nur das persistierte JSON-Feld, oder auch den Rückbau der Operation `config-store.leseMarke` (**#29**) samt ihrem IPC-Kanal `config:leseMarke` (**#77**)? **Der Vertrag beantwortet sie bereits, und der Beleg steht in d

### #311  [TK, anfuehrung]
ZITAT   : **Die Marke kommt immer aus `p.marke`**
steht in Issues: [250]
NAECHSTE: **Die Marke kommt seit v3.4 aus V2, nicht mehr aus D3**; `config.json` führt nur
KONTEXT : - **ERLEDIGT – nicht mehr melden, nicht mehr fragen: `config:leseMarke` entfällt ERSATZLOS.** Die Frage war echt und lautete: Meint „das Feld aus `config.json` entfernen" (TK 9.15.1) nur das persistierte JSON-Feld, oder auch den Rückbau der Operation `config-store.leseMarke` (**#29**) samt ihrem IPC-Kanal `config:leseMarke` (**#77**)? **Der Vertrag beantwortet sie bereits, und der Beleg steht in d

### #311  [TK, anfuehrung]
ZITAT   : Vorschau und Vorschaubilder: dieselbe Marke wie beim Render – nie eine andere
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Und die Verdrahtung ist in #313 ausgeführt** – demselben Issue, das schon den Nachzug in `inhalte.tsx`, **#154** und den Modul-Wurzeln trägt (Punkt darüber): `bereiteZeichnenVor(projekt)` (#154) stellt vorab „**alle** `aktion.markeId` aus `projekt.aktionen` **plus** `projekt.standardMarkeId` – entdoppelt" bereit; danach holt `action-editor/index.tsx` (#250) `holeBereiteMarke(gewaehlteAktion.mark

### #312  [TK, anfuehrung]
ZITAT   : gleiche Eingabe → gleiches Bild
steht in Issues: [111, 113, 115, 117, 118]
NAECHSTE: Das Ergebnis darf **nicht** vom Gerät abhängen (HiDPI-Laptop = gleiches Bild).
KONTEXT : 1. **Zwei Funktionen, asynchron und synchron – dasselbe Muster wie bei Motiven (#111) und Logo (#119).** `zeichneSegment` ist **synchron** und darf nicht `await`en; wer zeichnet, muss die Marke also schon haben. Deshalb: `stelleMarkeBereit(markeId)` (asynchron, beschafft und bereitet vor) und `holeBereiteMarke(markeId)` (synchron, schlägt nur nach). Eine einzige asynchrone Funktion zwänge jeden Ze

### #312  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : - „**Die Auflösung geschieht an genau EINER Stelle:** im `marken-store`. `leseMarke(markeId)` liefert die **fertig aufgelöste** Marke; kein Aufrufer sieht je eine Teilmenge, keiner implementiert Vererbung selbst. Das ist dieselbe Begründung wie bei den Farb-Rollen (9.10.9): **neunzehn** Aufrufer holen die Marke (9.15.1) – neunzehn eigene Vererbungslogiken liefen unweigerlich auseinander." (TK 9.11

### #312  [TK, blockzitat]
ZITAT   : ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` (TK 9.1.1)
steht in Issues: [129, 133, 134]
NAECHSTE: s über die Grenze.** ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` **Struktu
KONTEXT : **Die Ergebnis-Hülle, wörtlich aus TK 9.1.1:** ``` Ergebnis<T> = | { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } } ``` (TK 9.1.1) **Der Fehlercode reist als `string`.** Die fachliche Union `MarkenFehlercode` liegt in `src/main/marken-store/fehlercodes.ts` (#276); der Renderer darf wegen der getrennten tsconfigs (**#1**) **nicht** aus `src/m

### #313  [AD, anfuehrung]
ZITAT   : es gibt **die** Marke
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ### 1. `Zeichenvoraussetzungen.marke` fällt ERSATZLOS weg ```ts export interface Zeichenvoraussetzungen { vorlagen: readonly Vorlage[] } ``` *Begründung:* Es gibt keinen Wert, der an die Stelle treten könnte. Jede Marke, die man dort hinterlegte – die eingebaute, die des Projekts, die der ersten Aktion –, wäre wieder die Behauptung „es gibt **die** Marke", die FA-23 abgeschafft hat, und sie würde 

### #313  [TK, anfuehrung]
ZITAT   : gleiche Eingabe → gleiches Bild
steht in Issues: [111, 113, 115, 117, 118]
NAECHSTE: Das Ergebnis darf **nicht** vom Gerät abhängen (HiDPI-Laptop = gleiches Bild).
KONTEXT : 1. **`zeichneSegment` kann nicht nachladen.** Es ist synchron; die einzige Stelle, an der ein `await` möglich ist, liegt **vor** dem Zeichnen. „Erst beim Zeichnen je Element" hieße also entweder ein `await` im Zeichenpfad (dann ist „gleiche Eingabe → gleiches Bild", TK 9.10.3 Punkt 5, nicht mehr prüfbar und die Vorschau flackert) oder ein erster Zeichenversuch, der wirft bzw. mit Ersatzschrift zei

### #313  [TK, anfuehrung]
ZITAT   : liefert AUSSCHLIESSLICH die Farb-Rolle `flaecheDunkel`
NAECHSTE: **Welche Markenfarbe – festgelegt:** die Farb-Rolle **`flaecheDunkel`** (9.11.2).
KONTEXT : ### 6. `SplitProps` und `EinblendungProps` brauchen ZWEI Marken statt einer Beide führen heute **ein** `marke: Marke`. Das reicht seit TK 9.15.4 nicht mehr, und bei `Split` ist es sogar **falsch**: Sein `marke` „liefert AUSSCHLIESSLICH die Farb-Rolle `flaecheDunkel`" (#218) – und die Restflächen nehmen laut Tabelle die **Projekt-Standardmarke**, während der Band-Abschnitt darin die Marke der rotie

### #313  [TK, anfuehrung]
ZITAT   : lade halt nach, wenn `null`
steht in Issues: [319, 325]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **ECHTE OFFENE FRAGE: Gegen WELCHE Marke zeichnet der `vorlagen-editor`?** Er ist **app-weit** und ohne offenes Projekt voll benutzbar (TK 9.14.2); `VorlagenEditorWurzelProps` führt ausdrücklich **keinen** Projektzugang (#244, ENTSCHIEDEN 6). Es gibt dort also weder eine Aktion mit `markeId` noch eine `Project.standardMarkeId`. Zugleich ist die Frage seit TK v3.6 **nicht mehr gleichgültig**: `Ma

### #314  [TK, anfuehrung]
ZITAT   : Undo/Redo abgeschaltet
NAECHSTE: Undo/Redo (FA-21:
KONTEXT : - Modul: `app-shell` (Renderer) - Dateien dieses Issues (+ jeweils zugehörige Testdatei) – **alle bestehend**: 1. `src/renderer/app-shell/reiter.ts` — **#194** (M7-01). `ReiterId` bekommt einen fünften Wert, `REITER_REIHENFOLGE` einen fünften Eintrag. **Der Kern dieses Issues.** 2. `src/renderer/app-shell/rahmen.tsx` — **#195** (M7-02). Die Reiterleiste zeigt danach **fünf** Knöpfe; die fünfte Bes

### #314  [TK, anfuehrung]
ZITAT   : welche Undo-Historie gilt in diesem Reiter?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Zwei Korrekturen an der Annahme von #311.** Erstens: Es sind **vier** Dateien, nicht zwei. Der Rahmen (**#195**) zeichnet die Reiterknöpfe und trägt laut eigener Invariante „**keinen** eigenen Text außer den vier Reiterbeschriftungen" (M7-02) – die fünfte Beschriftung entsteht dort und nirgends sonst. Und `bereichFuerReiter` (**#234**) beantwortet die Frage „welche Undo-Historie gilt in diesem R

### #314  [TK, blockzitat]
ZITAT   : „**Verbot – kein eigener Reiter- oder Routing-Code in dieser Datei.** Diese Datei liefert ausschließlich den `MarkenZugang`; sie entscheidet nicht, wo er benutzt wird." (#305, STOPP)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Verbot – kein eigener Reiter- oder Routing-Code in dieser Datei.** Diese Datei liefert ausschließlich den `MarkenZugang`; sie entscheidet nicht, wo er benutzt wird." (#305, STOPP) „**Verbot – der Reiter [Marken] wird hier nicht angelegt.** Der fünfte Reiter (TK 9.14.1, v3.6) ist Sache von `reiter.ts` (#194) und `inhalte.tsx` (#244); diese drei Dateien führen **keine** Reiter-Liste und bekommen 

### #315  [TK, anfuehrung]
ZITAT   : **Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1; FA-23/FA-24). *Bis v3.3 stand hier: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP." Beides ist mit v3.4 überholt – die Marke gehört nicht mehr dem `config-store`, und der Editor ist ein Muss.* **Gebündelt bleiben** die vier OFL-Schriften und das Fitnessworld24-Logo; importierte Dateien tragen die Herkunft `importiert` (9.15.3).
NAECHSTE: ein Marken-Editor ist kein MVP." Beides ist mit v3.4 überholt – die Marke gehört nicht mehr dem `config-store`, und der Editor ist ein Muss.* **Gebündelt bleiben** die vier OFL-Schriften;
KONTEXT : „**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1; FA-23/FA-24). *Bis v3.3 stand hier: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP." Beides ist mit v3.4 überholt – die Marke gehört nicht mehr dem `config-store`, und der Editor ist ein Muss.* **Gebündelt bleiben** die vier OFL-Schriften und das Fitnessworld

### #315  [AD, anfuehrung]
ZITAT   : sie kann sich zur Laufzeit nicht ändern
steht in Issues: [119]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. „sie kann sich zur Laufzeit nicht ändern" – **falsch seit FA-24**: `importiereMarkenDatei` und `entferneMarkenDatei` (#289) tauschen die Logo-Datei einer Marke im laufenden Fenster aus. Deshalb **braucht** es `leereLogoBestand()`, und deshalb hat der Auslöser einen Ort: `leereMarkenBestand()` (#312) ruft es mit. 2. „Es gibt genau eine Marke und genau ein Logo" – **falsch seit FA-23**: Jede Akti

### #315  [TK+AD, anfuehrung]
ZITAT   : Es gibt genau eine Marke und genau ein Logo
NAECHSTE: Es gibt genau eine Auflösungsstelle.** Keine Zonen-Sorte (Text, Bild, Deko, Verlauf
KONTEXT : 1. „sie kann sich zur Laufzeit nicht ändern" – **falsch seit FA-24**: `importiereMarkenDatei` und `entferneMarkenDatei` (#289) tauschen die Logo-Datei einer Marke im laufenden Fenster aus. Deshalb **braucht** es `leereLogoBestand()`, und deshalb hat der Auslöser einen Ort: `leereMarkenBestand()` (#312) ruft es mit. 2. „Es gibt genau eine Marke und genau ein Logo" – **falsch seit FA-23**: Jede Akti

### #315  [TK, anfuehrung]
ZITAT   : **Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf (die vier OFL-Schriften, das Fitnessworld24-Logo), `importiert` auf `marken-assets/<markeId>/`. Der Renderer bekommt importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie** über absolute Pfade. **Genau eine** Stelle löst auf – nicht jede Zonen-Sorte einzeln.
steht in Issues: [290]
NAECHSTE: ommt importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie** über absolute Pfade. **Genau eine** Stelle löst auf –
KONTEXT : - „**Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf (die vier OFL-Schriften, das Fitnessworld24-Logo), `importiert` auf `marken-assets/<markeId>/`. Der Renderer bekommt importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie** über absolute Pfade. **Genau eine** Stelle löst auf – nicht jede Zonen-Sorte einzeln." (TK 9.15.3) -

### #315  [TK, anfuehrung]
ZITAT   : **Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1; FA-23/FA-24). … **Gebündelt bleiben** die vier OFL-Schriften und das Fitnessworld24-Logo; importierte Dateien tragen die Herkunft `importiert` (9.15.3).
NAECHSTE: **Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1;
KONTEXT : - „**Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf (die vier OFL-Schriften, das Fitnessworld24-Logo), `importiert` auf `marken-assets/<markeId>/`. Der Renderer bekommt importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie** über absolute Pfade. **Genau eine** Stelle löst auf – nicht jede Zonen-Sorte einzeln." (TK 9.15.3) -

### #315  [TK, blockzitat]
ZITAT   : „**Ein einziger Bestand, kein weiterer Cache.** Eine modul-globale Variable für das gemerkte Promise und das Ergebnis; **kein** `localStorage`/`sessionStorage`/`IndexedDB`, keine `Map` nach Dateinamen, kein zweites Logo. **Es gibt genau eine Marke und genau ein Logo.**" (M4-25, Festlegung 6)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Ein einziger Bestand, kein weiterer Cache.** Eine modul-globale Variable für das gemerkte Promise und das Ergebnis; **kein** `localStorage`/`sessionStorage`/`IndexedDB`, keine `Map` nach Dateinamen, kein zweites Logo. **Es gibt genau eine Marke und genau ein Logo.**" (M4-25, Festlegung 6) **Die Begründung, auf der beides steht, ist mit TK v3.4 weggefallen.** M4-25 stützt sich auf einen Satz, de

### #316  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast**
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**.
KONTEXT : 1. **Der Wert wird UNVERÄNDERT durchgereicht – keine Normalisierung.** `#134` schreibt genau `standardMarke.farben.flaecheDunkel` in das Feld: kein Großschreiben, kein Anhängen oder Entfernen des `#`, kein Kürzen eines 8-stelligen auf einen 6-stelligen Wert, kein Umrechnen nach `0xRRGGBB`. *Begründung:* Der Wert muss **zeichengleich** derselbe sein, mit dem der Renderer die Band-PNGs gezeichnet ha

### #316  [TK, anfuehrung]
ZITAT   : **tippt sie nie als Hexzahl in eine Filterkette**
NAECHSTE: er nimmt den eingefrorenen Wert und tippt **nie** eine Hexzahl selbst in eine Filterkette (9.11.1, Punkt 7).
KONTEXT : - **ECHTE OFFENE FRAGE: Wer prüft `flaecheDunkel` im Auftrag?** `pruefeRenderRequest` (**#173**, M6-18) ist die Stelle, die dem Renderer **nicht** vertraut („wird **vollständig** misstraut – der Typ sagt nichts über die Laufzeitwerte (TK 9.1.1 Punkt 6)", `#173`), und sie führt eine eigene **Einblendungs-Prüfung** mit heute **fünf** Punkten (Geometrie, Abschnitte vorhanden, PNG-Puffer, PNG-Maße, Ab

### #316  [AD, blockzitat]
ZITAT   : „*Folge ohne die Einfrierung:* Ändert jemand die Marke, während der Auftrag in der Warteschlange wartet, füllte der `render-service` die Restflächen in einer **anderen** Farbe als die bereits gezeichneten Band-PNGs – **nebeneinander im selben Bild**. Es ist derselbe Fehler wie bei einer nachgeschlagenen Bandhöhe, nur sichtbarer." (TK 9.2.2)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „*Folge ohne die Einfrierung:* Ändert jemand die Marke, während der Auftrag in der Warteschlange wartet, füllte der `render-service` die Restflächen in einer **anderen** Farbe als die bereits gezeichneten Band-PNGs – **nebeneinander im selben Bild**. Es ist derselbe Fehler wie bei einer nachgeschlagenen Bandhöhe, nur sichtbarer." (TK 9.2.2) **Der zweite Grund ist, dass es sonst gar nicht mehr läuf

### #317  [TK, anfuehrung]
ZITAT   : **Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>` … Damit erfindet niemand eigene Kanalnamen.
steht in Issues: [25, 65, 71, 77, 93]
NAECHSTE: operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queu
KONTEXT : - Die Operationstabelle des `config-store` (TK 9.5.6) – **vier** Einträge, `leseMarke` **nicht** darunter. Sie ist die Quelle der Wahrheit dieses Issues: | Operation | Eingang → Ausgang | |---|---| | `leseKonfig` | – → `Ergebnis<AppKonfig>` | | `setzeAktivesProjekt` | `projektId` → `Ergebnis<void>` | | `setzeExportZiel` | `pfad` → `Ergebnis<void>` | | `setzeUIVoreinstellung` | `schlüssel`, `wert` 

### #317  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : - Die Operationstabelle des `config-store` (TK 9.5.6) – **vier** Einträge, `leseMarke` **nicht** darunter. Sie ist die Quelle der Wahrheit dieses Issues: | Operation | Eingang → Ausgang | |---|---| | `leseKonfig` | – → `Ergebnis<AppKonfig>` | | `setzeAktivesProjekt` | `projektId` → `Ergebnis<void>` | | `setzeExportZiel` | `pfad` → `Ergebnis<void>` | | `setzeUIVoreinstellung` | `schlüssel`, `wert` 

### #317  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.
steht in Issues: [68, 71, 76, 77, 93]
NAECHSTE: * Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft. **8. Unerwartete Ausnahmen fängt d
KONTEXT : - Die Operationstabelle des `config-store` (TK 9.5.6) – **vier** Einträge, `leseMarke` **nicht** darunter. Sie ist die Quelle der Wahrheit dieses Issues: | Operation | Eingang → Ausgang | |---|---| | `leseKonfig` | – → `Ergebnis<AppKonfig>` | | `setzeAktivesProjekt` | `projektId` → `Ergebnis<void>` | | `setzeExportZiel` | `pfad` → `Ergebnis<void>` | | `setzeUIVoreinstellung` | `schlüssel`, `wert` 

### #317  [TK, anfuehrung]
ZITAT   : das Feld aus `config.json` entfernen
steht in Issues: [311]
NAECHSTE: #### 9.5.6 `config-store` [D3] Besitzt `config.json` (app-weit):
KONTEXT : - **ERLEDIGT – nicht mehr melden, nicht mehr fragen: der Rückbau IST entschieden.** Die Frage lautete, ob „das Feld aus `config.json` entfernen" (TK 9.15.1) nur das persistierte JSON-Feld meint oder auch den Rückbau der Operation. **Sie meint ihn** – der Beleg ist die Operationstabelle in TK 9.5.6, die `leseMarke` nicht mehr führt. **#281** hat diese Frage in seinem STOPP-Block offen gelassen und 

### #318  [TK, anfuehrung]
ZITAT   : `farben: { <FarbRolle>: string }` – „`// Hex, 6- oder 8-stellig (8 = mit Alpha)`"
steht in Issues: [112]
NAECHSTE: string } // Hex, 6- oder 8-stellig (8 = mit Alpha) schriften:
KONTEXT : 1. **Gespeichert wird ein Hex-Wert, nie ein Rollenname.** `Aktion.akzentfarbe` ist entweder `null` oder genau `#` gefolgt von **sechs** Hex-Ziffern. Das ist die exakte Umkehrung des Verbots aus #139 („`Aktion.akzentfarbe` bekommt **nie** einen Wert, der mit `#` beginnt") – dieses Verbot gilt **nicht mehr** und wird durch sein Gegenteil ersetzt (ENTSCHIEDEN 9). 2. **Die Markenpalette bleibt – als V

### #318  [TK+AD, anfuehrung]
ZITAT   : `// Hex, 6- oder 8-stellig (8 = mit Alpha)`
steht in Issues: [112]
NAECHSTE: string } // Hex, 6- oder 8-stellig (8 = mit Alpha) schriften:
KONTEXT : - „**Akzentfarbe ist ein freier Farbwert** (FA-24). Bis v3.3 stand hier das Gegenteil: „nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus". Diese Zusage ist mit FA-24 **bewusst zurückgenommen**, weil Partner-Hausfarben in keiner Palette stehen. Eine Aktion **kann** damit aus dem Corporate Design ausbrechen; die Gegenmaßnah

### #319  [TK, anfuehrung]
ZITAT   : vorbelegt mit Project.standardMarkeId
steht in Issues: [320]
NAECHSTE: vorbelegt mit // Project.standardMarkeId.
KONTEXT : **Die zweite Falle ist die Vorbelegung.** Wer eine neue Aktion mit „irgendeiner" Marke belegt – der ersten der Liste, der eingebauten, der zuletzt benutzten –, bricht die Zusage „Rahmen stabil, Inhalt wechselt" (TK 9.15.4) an der Wurzel: Der Standardfall im Studio ist die eigene Marke, und die steht in `Project.standardMarkeId`. TK 9.8.2 schreibt das wörtlich vor („vorbelegt mit Project.standardMa

### #319  [TK, anfuehrung]
ZITAT   : **Löschen blockiert bei Referenz**, es kaskadiert **nicht** – wie bei den Vorlagen (9.12.1). Eine Marke steckt in Aktionen **und** möglicherweise in abgeleiteten Looks … Geprüft wird über **alle** Projekte, nicht nur das geladene.
NAECHSTE: ferenz**, es kaskadiert **nicht** – wie bei den Vorlagen (9.12.1). Eine Marke steckt in Aktionen, **möglicherweise in abgeleiteten Looks** und **möglicherweise 
KONTEXT : - Das Feld im `Aktion`-Datensatz, wörtlich (TK 9.8.2): ``` markeId: string // GENAU EINE Marke (FA-23, 9.15.1). Pflicht; vorbelegt mit // Project.standardMarkeId. Bestimmt Logo, Schriften und Farb-Rollen ``` - Das Feld im `Project`-Datensatz, wörtlich (TK 9.11.3): ``` standardMarkeId: string // FA-23: färbt Band-Hintergrund und Split-Restflächen und // belegt neue Aktionen vor. Beim Anlegen die ei

### #319  [TK, anfuehrung]
ZITAT   : Die Migration legt daraus die eingebaute Marke in `marken.json` an (`eingebaut: true`, `parent: null`, neue `id`), setzt `Project.standardMarkeId` und `Aktion.markeId` aller Projekte darauf und entfernt das Feld aus `config.json`.
steht in Issues: [281]
NAECHSTE:  Marke in `marken.json` an (`eingebaut: true`, `parent: null`, **`logo: null`**, neue `id`), setzt `Project.standardMarkeId` und `Aktion.markeId` aller Projekte
KONTEXT : - Das Feld im `Aktion`-Datensatz, wörtlich (TK 9.8.2): ``` markeId: string // GENAU EINE Marke (FA-23, 9.15.1). Pflicht; vorbelegt mit // Project.standardMarkeId. Bestimmt Logo, Schriften und Farb-Rollen ``` - Das Feld im `Project`-Datensatz, wörtlich (TK 9.11.3): ``` standardMarkeId: string // FA-23: färbt Band-Hintergrund und Split-Restflächen und // belegt neue Aktionen vor. Beim Anlegen die ei

### #319  [TK, anfuehrung]
ZITAT   : lade halt nach, wenn `null`
steht in Issues: [313, 325]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Die Entscheidung berührt zwei Module (`gemeinsam/marken-bereitstellung.ts` und `composer/zeichen-vorbereitung.ts`), von denen dieses Issue keines besitzt. **Nicht selbst entscheiden** – `setzeMarke` ruft **nur** `speichereAktion` und sonst nichts. **Verbot bis zur Klärung:** in keiner der vier Dateien ein „lade halt nach, wenn `null`" einbauen; das wäre ein `await` im Zeichenpfad und bräche TK 9.1

### #319  [TK, blockzitat]
ZITAT   : „**Feld ohne Befüller** – die Umkehrung derselben Klasse. Ein neues Vertragsfeld braucht **drei** Stellen: den Typ, den **Befüller** und den Verbraucher. Fehlt der mittlere, ist das Feld vorhanden und immer leer, und der Typecheck merkt nichts." (BRIEFING, Abschnitt 8)
steht in Issues: [328]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Feld ohne Befüller** – die Umkehrung derselben Klasse. Ein neues Vertragsfeld braucht **drei** Stellen: den Typ, den **Befüller** und den Verbraucher. Fehlt der mittlere, ist das Feld vorhanden und immer leer, und der Typecheck merkt nichts." (BRIEFING, Abschnitt 8) **Verbraucher gibt es reichlich.** TK 9.15.4 nennt `aktion.markeId` als Marken-Quelle jedes Aktions-Segments; **#313** ruft `holeB

### #320  [TK, anfuehrung]
ZITAT   : `markeId: string // GENAU EINE Marke (FA-23, 9.15.1). Pflicht
NAECHSTE: string // GENAU EINE Marke (FA-23, 9.15.1).
KONTEXT : 1. **Feldnamen, Feldreihenfolge und Schreibweise folgen TK 9.11.2 / 9.8.2 / 9.11.3 – und zwar zeichengleich zu dem, was die übrigen M8-Issues bereits abgeschrieben haben.** Es wird nichts umsortiert, nichts umbenannt, nichts „aufgeräumt". Neue Felder stehen an der Stelle, an der sie im TK-Codeblock stehen: `id`, `name`, `parent`, `eingebaut` **vor** `farben`; `herkunftJeFeld` **als letztes** Feld 

### #320  [TK, anfuehrung]
ZITAT   : Beim Anlegen die eingebaute Marke
steht in Issues: [319]
NAECHSTE: **Die eingebaute Marke startet mit `logo:
KONTEXT : 1. **Feldnamen, Feldreihenfolge und Schreibweise folgen TK 9.11.2 / 9.8.2 / 9.11.3 – und zwar zeichengleich zu dem, was die übrigen M8-Issues bereits abgeschrieben haben.** Es wird nichts umsortiert, nichts umbenannt, nichts „aufgeräumt". Neue Felder stehen an der Stelle, an der sie im TK-Codeblock stehen: `id`, `name`, `parent`, `eingebaut` **vor** `farben`; `herkunftJeFeld` **als letztes** Feld 

### #320  [TK, anfuehrung]
ZITAT   : Konstanten in `contracts/types` (an *einer* Stelle, nicht verstreut).
steht in Issues: [21, 308]
NAECHSTE: - **Konstanten in `contracts/types`** (an *einer* Stelle, nicht verstreut):
KONTEXT : 1. **Feldnamen, Feldreihenfolge und Schreibweise folgen TK 9.11.2 / 9.8.2 / 9.11.3 – und zwar zeichengleich zu dem, was die übrigen M8-Issues bereits abgeschrieben haben.** Es wird nichts umsortiert, nichts umbenannt, nichts „aufgeräumt". Neue Felder stehen an der Stelle, an der sie im TK-Codeblock stehen: `id`, `name`, `parent`, `eingebaut` **vor** `farben`; `herkunftJeFeld` **als letztes** Feld 

### #320  [TK, anfuehrung]
ZITAT   : **Akzentfarbe ist ein freier Farbwert** (FA-24). Bis v3.3 stand hier das Gegenteil: „nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus". Diese Zusage ist mit FA-24 **bewusst zurückgenommen**, weil Partner- Hausfarben in keiner Palette stehen.
NAECHSTE: t** (FA-24). Bis v3.3 stand hier das Gegenteil: „nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corpor
KONTEXT : - Der `Marke`-Codeblock aus TK 9.11.2, **vollständig** – Quelle der Wahrheit für Datei 1: ``` Marke { id: string // UUID (9.11.4) name: string // im Editor sichtbar, trägt das Ersatz-Logo (9.10.10) parent: string | null // abgeleitet von dieser Marke; null = eigenständig eingebaut: boolean // true NUR bei Fitnessworld24 – nicht löschbar (9.15.1) farben: { <FarbRolle>: string } // Hex, 6- oder 8-st

### #320  [TK, anfuehrung]
ZITAT   : **Der Schwellenwert ist `4,5:1` (v3.10 entschieden)** – WCAG AA für Fließtext, geführt als Konstante **`KONTRAST_SCHWELLE`** (9.11.4). […] **Die Zahl steht an genau einer Stelle** – weder `kontrastVerhaeltnis` noch der Editor führen eine eigene.
steht in Issues: [301]
NAECHSTE: **Der Schwellenwert ist `4,5:1` (v3.10 entschieden)** – WCAG AA für Fließtext, geführt als Konstante **`KONTRAST_SCHWELLE`** (9.11.4).
KONTEXT : - Der `Marke`-Codeblock aus TK 9.11.2, **vollständig** – Quelle der Wahrheit für Datei 1: ``` Marke { id: string // UUID (9.11.4) name: string // im Editor sichtbar, trägt das Ersatz-Logo (9.10.10) parent: string | null // abgeleitet von dieser Marke; null = eigenständig eingebaut: boolean // true NUR bei Fitnessworld24 – nicht löschbar (9.15.1) farben: { <FarbRolle>: string } // Hex, 6- oder 8-st

### #320  [TK, anfuehrung]
ZITAT   : **Konstanten in `contracts/types`** (an *einer* Stelle, nicht verstreut).
NAECHSTE: - **Konstanten in `contracts/types`** (an *einer* Stelle, nicht verstreut):
KONTEXT : - Der `Marke`-Codeblock aus TK 9.11.2, **vollständig** – Quelle der Wahrheit für Datei 1: ``` Marke { id: string // UUID (9.11.4) name: string // im Editor sichtbar, trägt das Ersatz-Logo (9.10.10) parent: string | null // abgeleitet von dieser Marke; null = eigenständig eingebaut: boolean // true NUR bei Fitnessworld24 – nicht löschbar (9.15.1) farben: { <FarbRolle>: string } // Hex, 6- oder 8-st

### #320  [TK, anfuehrung]
ZITAT   : der Vollständigkeit halber
steht in Issues: [76, 92, 109, 153, 164]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #328, Datei 2 – src/main/ipc-gateway/projekt-anlegen-ablauf.ts (NEU): holt ueber listeMarken() // die EINGEBAUTE Marke und reicht deren id weiter, damit der project-store den marken-store // niemals zu sehen bekommt. export async function erstelleProjektAblauf( name: string, ): Promise<Ergebnis<Project, ProjectStoreFehlercode | MarkenFehlercode>> ``` Hier ist davon **nichts** zu tun und **nicht

### #321  [TK, anfuehrung]
ZITAT   : WARUM HIER NICHTS AUFGELOEST WIRD
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Was sich an dieser Datei sonst NICHT ändert:** - `const SCHEMA = "media"` bleibt – der Name wird **nicht** ausgeschrieben und **nicht** inline gesetzt; die Konstante ist die eine Stelle, an der der Schema-Name steht (der Handler-Stub liest sie ebenfalls). - `registriereMediaProtokollHandlerStub()` bleibt **eine Funktion** und behält Rumpf, Status 404, Meldungstext und den gesamten Kommentar darü

### #323  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Sie wirkt auch auf ein NICHT geladenes Projekt.** Das ist der Regelfall: Wer eine Marke freibekommen will, muss sie in **allen** Projekten wechseln, die sie führen (`Markennutzung.standardInProjekten`, 9.15.1) – und geladen ist immer höchstens **eines** (9.5.1). Ist `projektId` das geladene Projekt, ändert sich der Wert

### #323  [AD, blockzitat]
ZITAT   : „Zusammen mit der Lösch-Sperre aus FA-23 (eine als Standardmarke geführte Marke ist nicht löschbar, s. 9.15.1) wäre das eine **Sackgasse** gewesen: Der Nutzer erführe, was ihn blockiert, könnte den Grund aber nicht beseitigen." (TK 9.5.2)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Zusammen mit der Lösch-Sperre aus FA-23 (eine als Standardmarke geführte Marke ist nicht löschbar, s. 9.15.1) wäre das eine **Sackgasse** gewesen: Der Nutzer erführe, was ihn blockiert, könnte den Grund aber nicht beseitigen." (TK 9.5.2) Das Anforderungsdokument führt beides seit v1.4 als **Muss** zusammen: „Jedes Projekt führt zusätzlich eine **Standardmarke**, die den Rahmen färbt (Band-Hinterg

### #323  [TK, blockzitat]
ZITAT   : „`setzeStandardMarke` | `projektId`, `markeId` → `Ergebnis<Projekt>` – setzt `Project.standardMarkeId` (9.11.3). Prüft die `markeId` **nicht** gegen den Marken-Bestand; das tut der Handler, s. u. Unbekannte `projektId` → `nicht_gefunden`" (TK 9.5.2)
NAECHSTE: t `Project.standardMarkeId` (9.11.3). Prüft die `markeId` **nicht** gegen den Marken-Bestand; das tut der Handler, s. u. Unbekannte `projektId` → `nicht_gefunde
KONTEXT : „`setzeStandardMarke` | `projektId`, `markeId` → `Ergebnis<Projekt>` – setzt `Project.standardMarkeId` (9.11.3). Prüft die `markeId` **nicht** gegen den Marken-Bestand; das tut der Handler, s. u. Unbekannte `projektId` → `nicht_gefunden`" (TK 9.5.2) **`Ergebnis<Projekt>` im TK ist der TypeScript-Typ `Project`** aus `src/shared/contracts/project.ts` (#15, erweitert in #320). Einen Typ namens `Proje

### #324  [TK, anfuehrung]
ZITAT   : wer aus `hole()?.marken` eine Marke herausfischt, umgeht die Bereitstellung von Schriften und Logo und zeichnet mit Ersatzschrift.
steht in Issues: [311, 313, 329]
NAECHSTE: **während** `template-canvas` zeichnet, und genau dort greift schon 9.10.3/9.10.4: Schriften und Motive müssen **vor** dem Zeichnen geladen sein, nachgewiesen ü
KONTEXT : - „**Dazu seit v3.11 ein weiterer Vorgang: die Projekt-Standardmarke wechseln.** Die Aufzählung der **fünf** Vorgänge oben beschreibt den **Lebenszyklus** des Projekts; daneben tritt eine Einstellung **am** Projekt: `Project.standardMarkeId` (9.11.3) über **`setzeStandardMarke`** (9.5.2). Angeboten wird sie je Eintrag der Projektliste – der Nutzer sieht die aktuelle Marke und wählt eine andere aus

### #324  [TK, anfuehrung]
ZITAT   : **Nicht undo-fähig**
NAECHSTE: **Aufträge sind daher grundsätzlich nicht undo-fähig**;
KONTEXT : - **ECHTE OFFENE FRAGE, die wichtigste dieses Issues: Was geschieht mit einem GEÖFFNETEN Projekt, dessen Standardmarke gewechselt wird, nachdem bereits Band-PNGs gezeichnet wurden?** *Die Lage, damit sie entscheidbar ist:* 1. **Für einen bereits eingereihten Render ist die Frage BEANTWORTET – hier ist nichts zu tun.** Der Auftrag friert seinen Eingang beim Einreihen ein, einschließlich der Rahmenf

### #324  [TK, blockzitat]
ZITAT   : „**Wo die Auswahl sitzt – vom Auftraggeber entschieden (11.08.):** in der **Projekt-Verwaltung** (`modul:projekt-verwaltung`, Reiter [Projekte]), **nicht** im Marken-Reiter und **nicht** am Kopf der Zusammenstellung." (`docs/agents/m8-entscheidungen-11-08.md`, E-2)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Wo die Auswahl sitzt – vom Auftraggeber entschieden (11.08.):** in der **Projekt-Verwaltung** (`modul:projekt-verwaltung`, Reiter [Projekte]), **nicht** im Marken-Reiter und **nicht** am Kopf der Zusammenstellung." (`docs/agents/m8-entscheidungen-11-08.md`, E-2) Das Technische Konzept trägt beides seit v3.11 nach – einmal aus Sicht des Moduls:

### #324  [TK, blockzitat]
ZITAT   : | `setzeStandardMarke` | `projektId`, `markeId` → `Ergebnis<Projekt>` – setzt `Project.standardMarkeId` (9.11.3). Prüft die `markeId` **nicht** gegen den Marken-Bestand; das tut der Handler, s. u. Unbekannte `projektId` → `nicht_gefunden` | (TK 9.5.2)
NAECHSTE: t `Project.standardMarkeId` (9.11.3). Prüft die `markeId` **nicht** gegen den Marken-Bestand; das tut der Handler, s. u. Unbekannte `projektId` → `nicht_gefunde
KONTEXT : | `setzeStandardMarke` | `projektId`, `markeId` → `Ergebnis<Projekt>` – setzt `Project.standardMarkeId` (9.11.3). Prüft die `markeId` **nicht** gegen den Marken-Bestand; das tut der Handler, s. u. Unbekannte `projektId` → `nicht_gefunden` | (TK 9.5.2) „**Eigener IPC-Kanal** nach 9.1.1 Punkt 4: `project:setzeStandardMarke`. Ohne Anmeldung im `ipc-gateway` bliebe sie eine Main-Funktion ohne Aufrufer

### #325  [AD, anfuehrung]
ZITAT   : **Die Akzentfarbe einer Aktion**
steht in Issues: [318]
NAECHSTE: - Akzentfarbe oder Aktions-Badge zur Hervorhebung.
KONTEXT : - **ECHTE OFFENE FRAGE, die wichtigste dieses Issues: Wer warnt bei einer schlecht lesbaren AKTIONS-Akzentfarbe – und gegen welchen Text?** R-08 nennt ausdrücklich „**Die Akzentfarbe einer Aktion**" als Risiko und die Warnung als Gegenmaßnahme, und FA-24 verlangt sie. **Gebaut ist sie nirgends für diesen Fall:** Die einzige Kontrast-Warnung ist **#301** im `marken-editor`, und sie misst die **Mark

### #325  [TK, anfuehrung]
ZITAT   : `kontrastVerhaeltnis(marke.farben.akzent, marke.farben.textAufDunkel)`
steht in Issues: [318]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **ECHTE OFFENE FRAGE, die wichtigste dieses Issues: Wer warnt bei einer schlecht lesbaren AKTIONS-Akzentfarbe – und gegen welchen Text?** R-08 nennt ausdrücklich „**Die Akzentfarbe einer Aktion**" als Risiko und die Warnung als Gegenmaßnahme, und FA-24 verlangt sie. **Gebaut ist sie nirgends für diesen Fall:** Die einzige Kontrast-Warnung ist **#301** im `marken-editor`, und sie misst die **Mark

### #325  [AD, anfuehrung]
ZITAT   : keine Geschmacks-Sperre
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - [ ] Das Akzentfarb-Feld zeigt **genau drei** Vorschläge aus `akzentVorschlaege(holeBereiteMarke(markeId))`, beschriftet mit `rolle`, eingefärbt mit `hex` (benannter Test) - [ ] Ein Klick auf einen Vorschlag ruft `setzeAkzentfarbe(aktionId, eintrag.hex)` – das zweite Argument beginnt mit `#` und ist **nie** `'akzent'`, `'akzentKraeftig'` oder `'akzentTief'` (benannter Test, prüft das Argument zei

### #325  [AD, anfuehrung]
ZITAT   : keine – Marke entscheidet
steht in Issues: [318]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - [ ] Das Akzentfarb-Feld zeigt **genau drei** Vorschläge aus `akzentVorschlaege(holeBereiteMarke(markeId))`, beschriftet mit `rolle`, eingefärbt mit `hex` (benannter Test) - [ ] Ein Klick auf einen Vorschlag ruft `setzeAkzentfarbe(aktionId, eintrag.hex)` – das zweite Argument beginnt mit `#` und ist **nie** `'akzent'`, `'akzentKraeftig'` oder `'akzentTief'` (benannter Test, prüft das Argument zei

### #325  [TK, blockzitat]
ZITAT   : „„**Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus." (TK 9.8.4) – die Auswahl kommt aus `akzentAuswahl(marke)` (#139); **kein** Farbwähler, **kein** Hex-Eingabefeld." (#250)
steht in Issues: [318]
NAECHSTE: „nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus".
KONTEXT : „„**Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus." (TK 9.8.4) – die Auswahl kommt aus `akzentAuswahl(marke)` (#139); **kein** Farbwähler, **kein** Hex-Eingabefeld." (#250) An seine Stelle treten die zwei Sätze, die TK 9.8.4 **heute** führt (unten wörtlich im Invarianten-Block). **Kein Alias, keine auskom

### #326  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 68, 71, 85, 87]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : - Die Abbruch-Regel, wörtlich aus dem Bauvorbild (TK 9.4.3): „| Nutzer bricht ab | `ok: true` mit `pfade = []` – Abbruch ist **kein** Fehler |" und „| Nutzer wählt Dateien | `pfade` = Array absoluter Quellpfade |". Diese Datei übersetzt den Abbruch in `{ ok: true, wert: null }` und **niemals** in einen Fehlercode. - Beide Import-Issues sind bereits wörtlich darauf geschrieben: „Bricht der Nutzer d

### #327  [TK, anfuehrung]
ZITAT   : trotzdem schließen und verwerfen
NAECHSTE: daneben der benannte Ausweg „Trotzdem schließen und Änderungen verwerfen".
KONTEXT : - **Was dieses Issue leistet:** Ein gescheiterter Flush beim Beenden erzeugt – wie **jeder** andere Schreibversuch, „sofort/entprellt/Flush" (#278) – ein `{ typ: 'fehler', code }` auf `marken:autoSpeichernStatus`. Dieser Hinweis zeigt es an. Der **Zustand** ist damit sichtbar. - **Was dieses Issue NICHT leistet und nicht leisten kann:** Das **Abbrechen** des Beendens, die ursachenbezogene Empfehlu

### #328  [TK, anfuehrung]
ZITAT   : färbt Band-Hintergrund und Split-Restflächen und belegt neue Aktionen vor
NAECHSTE: färbt Band-Hintergrund und Split-Restflächen und // belegt neue Aktionen vor.
KONTEXT : 1. **Der Rahmen jedes Videos verliert seine Farbe.** `Project.standardMarkeId` „färbt Band-Hintergrund und Split-Restflächen und belegt neue Aktionen vor" (TK 9.11.3). Ein leeres Feld heißt: Die Marke ist beim Zeichnen nicht auflösbar – derselbe Ausgang, den die Auftraggeber-Entscheidung für den Löschfall beschreibt („Der nächste Render wäre in `marke_nicht_gefunden` gelaufen – für Band-Hintergrun

### #328  [TK, anfuehrung]
ZITAT   : Pflicht; vorbelegt mit `Project.standardMarkeId`
NAECHSTE: vorbelegt mit // Project.standardMarkeId.
KONTEXT : 1. **Der Rahmen jedes Videos verliert seine Farbe.** `Project.standardMarkeId` „färbt Band-Hintergrund und Split-Restflächen und belegt neue Aktionen vor" (TK 9.11.3). Ein leeres Feld heißt: Die Marke ist beim Zeichnen nicht auflösbar – derselbe Ausgang, den die Auftraggeber-Entscheidung für den Löschfall beschreibt („Der nächste Render wäre in `marke_nicht_gefunden` gelaufen – für Band-Hintergrun

### #328  [TK, anfuehrung]
ZITAT   : **Ordnerpfad `projects/<projekt-id>/`** (TK Abschnitt 6 …) – der Projektordner heißt exakt wie die Projekt-**ID**.
steht in Issues: [33]
NAECHSTE: der Knopf **„Ordner öffnen"** (`öffneProjektordner`, 9.5.2), vor allem beim beschädigten Projekt.
KONTEXT : - Die Operationszeile von `listeMarken` (TK 9.15.1): „`listeMarken` | – → `Ergebnis<Marke[]>` – **aufgelöst**, einschließlich abgeleiteter, je samt `herkunftJeFeld`" – daraus folgt: Die Liste ist **vollständig**; wer darin keine eingebaute Marke findet, findet sie auch nirgends sonst. - Was aus #33 **unverändert** gilt und mitgeprüft wird: „**Ordnerpfad `projects/<projekt-id>/`** (TK Abschnitt 6 …

### #328  [TK, anfuehrung]
ZITAT   : Jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner
steht in Issues: [33]
NAECHSTE: nventionen Aus den Entscheidungen 1 + 3 folgt: jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner; Listenelemente verweisen **relativ** dorthin
KONTEXT : - Die Operationszeile von `listeMarken` (TK 9.15.1): „`listeMarken` | – → `Ergebnis<Marke[]>` – **aufgelöst**, einschließlich abgeleiteter, je samt `herkunftJeFeld`" – daraus folgt: Die Liste ist **vollständig**; wer darin keine eingebaute Marke findet, findet sie auch nirgends sonst. - Was aus #33 **unverändert** gilt und mitgeprüft wird: „**Ordnerpfad `projects/<projekt-id>/`** (TK Abschnitt 6 …

### #328  [TK, anfuehrung]
ZITAT   : `letzterAusgabeName: string | null` **muss beim Anlegen auf `null` gesetzt werden**
steht in Issues: [33]
NAECHSTE: letzterAusgabeName: string | null // FA-22: Vorbelegung des Render-Zielnamens; null = noch nie gerendert standardMarkeId: string // FA-23: färbt Band-Hintergrun
KONTEXT : - Die Operationszeile von `listeMarken` (TK 9.15.1): „`listeMarken` | – → `Ergebnis<Marke[]>` – **aufgelöst**, einschließlich abgeleiteter, je samt `herkunftJeFeld`" – daraus folgt: Die Liste ist **vollständig**; wer darin keine eingebaute Marke findet, findet sie auch nirgends sonst. - Was aus #33 **unverändert** gilt und mitgeprüft wird: „**Ordnerpfad `projects/<projekt-id>/`** (TK Abschnitt 6 …

### #328  [TK, anfuehrung]
ZITAT   : **Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.
steht in Issues: [23, 61, 71, 76, 77]
NAECHSTE: ain validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ei
KONTEXT : - Die Operationszeile von `listeMarken` (TK 9.15.1): „`listeMarken` | – → `Ergebnis<Marke[]>` – **aufgelöst**, einschließlich abgeleiteter, je samt `herkunftJeFeld`" – daraus folgt: Die Liste ist **vollständig**; wer darin keine eingebaute Marke findet, findet sie auch nirgends sonst. - Was aus #33 **unverändert** gilt und mitgeprüft wird: „**Ordnerpfad `projects/<projekt-id>/`** (TK Abschnitt 6 …

### #328  [TK, anfuehrung]
ZITAT   : **Fehlercodes sind ein geschlossener, typisierter Satz** … **Eine rohe Exception-Meldung wird nie zum Code.**
steht in Issues: [60, 68, 71, 85, 87]
NAECHSTE: **Eine rohe Exception-Meldung wird nie zum Code.** **4.
KONTEXT : - Die Operationszeile von `listeMarken` (TK 9.15.1): „`listeMarken` | – → `Ergebnis<Marke[]>` – **aufgelöst**, einschließlich abgeleiteter, je samt `herkunftJeFeld`" – daraus folgt: Die Liste ist **vollständig**; wer darin keine eingebaute Marke findet, findet sie auch nirgends sonst. - Was aus #33 **unverändert** gilt und mitgeprüft wird: „**Ordnerpfad `projects/<projekt-id>/`** (TK Abschnitt 6 …

### #328  [TK, anfuehrung]
ZITAT   : **Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
steht in Issues: [23, 68, 71, 76, 77]
NAECHSTE: Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code.
KONTEXT : - Die Operationszeile von `listeMarken` (TK 9.15.1): „`listeMarken` | – → `Ergebnis<Marke[]>` – **aufgelöst**, einschließlich abgeleiteter, je samt `herkunftJeFeld`" – daraus folgt: Die Liste ist **vollständig**; wer darin keine eingebaute Marke findet, findet sie auch nirgends sonst. - Was aus #33 **unverändert** gilt und mitgeprüft wird: „**Ordnerpfad `projects/<projekt-id>/`** (TK Abschnitt 6 …

### #328  [TK, anfuehrung]
ZITAT   : **Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler`
steht in Issues: [23, 71, 76, 77, 93]
NAECHSTE: Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert).
KONTEXT : - Die Operationszeile von `listeMarken` (TK 9.15.1): „`listeMarken` | – → `Ergebnis<Marke[]>` – **aufgelöst**, einschließlich abgeleiteter, je samt `herkunftJeFeld`" – daraus folgt: Die Liste ist **vollständig**; wer darin keine eingebaute Marke findet, findet sie auch nirgends sonst. - Was aus #33 **unverändert** gilt und mitgeprüft wird: „**Ordnerpfad `projects/<projekt-id>/`** (TK Abschnitt 6 …

### #328  [TK, blockzitat]
ZITAT   : „`erstelleProjekt` | `name`, `standardMarkeId` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`; die Marken-Kennung **bekommt** die Operation, sie holt sie nicht – s. u.)" (TK 9.5.2)
NAECHSTE: Projekt` | `name`, `standardMarkeId` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`; die Marken-Kennung **bekommt** die Operation, sie holt sie nic
KONTEXT : „`erstelleProjekt` | `name`, `standardMarkeId` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`; die Marken-Kennung **bekommt** die Operation, sie holt sie nicht – s. u.)" (TK 9.5.2) **`Ergebnis<Projekt>` im TK ist der TypeScript-Typ `Project`** aus `src/shared/contracts/project.ts` (#15, erweitert in #320). Einen Typ namens `Projekt` gibt es **nicht**; leg auch keinen an.

### #329  [TK, anfuehrung]
ZITAT   : Ein beschädigtes Projekt bleibt auch hier ausgenommen: […] also ist der Wechsel dort **deaktiviert**, nicht stillschweigend wirkungslos.
NAECHSTE: Seine `project.json` ist nicht lesbar, also ist der Wechsel dort **deaktiviert**, nicht stillschweigend wirkungslos.
KONTEXT : 1. **`standardMarkeId` steht als NEUNTES und LETZTES Feld in `ProjektMeta`, mit dem Kommentar aus TK 9.5.2, Zeichen für Zeichen.** *Begründung:* TK 9.5.2 führt es an letzter Stelle, und #247 hat sich die Zeichengleichheit selbst auferlegt: „**Die Kommentare werden mitübernommen, Zeichen für Zeichen.**" (#247, ENTSCHIEDEN 3). Eine andere Position wäre eine Vertragsabweichung, die niemand bemerkt, w

### #329  [TK, anfuehrung]
ZITAT   : Der Projektzugang bleibt der ROHE.
steht in Issues: [252]
NAECHSTE: nur das Feld `ausgabe` bleibt dort `null`.
KONTEXT : 1. **`standardMarkeId` steht als NEUNTES und LETZTES Feld in `ProjektMeta`, mit dem Kommentar aus TK 9.5.2, Zeichen für Zeichen.** *Begründung:* TK 9.5.2 führt es an letzter Stelle, und #247 hat sich die Zeichengleichheit selbst auferlegt: „**Die Kommentare werden mitübernommen, Zeichen für Zeichen.**" (#247, ENTSCHIEDEN 3). Eine andere Position wäre eine Vertragsabweichung, die niemand bemerkt, w

### #329  [TK, anfuehrung]
ZITAT   : einen vollständigen Zugang mit gefüllter Übersicht oder einen benannten Fehler – NIE einen Zugang mit `hole() === null` im Erfolgsfall
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **`standardMarkeId` steht als NEUNTES und LETZTES Feld in `ProjektMeta`, mit dem Kommentar aus TK 9.5.2, Zeichen für Zeichen.** *Begründung:* TK 9.5.2 führt es an letzter Stelle, und #247 hat sich die Zeichengleichheit selbst auferlegt: „**Die Kommentare werden mitübernommen, Zeichen für Zeichen.**" (#247, ENTSCHIEDEN 3). Eine andere Position wäre eine Vertragsabweichung, die niemand bemerkt, w

### #329  [TK, anfuehrung]
ZITAT   : Warum das im Gesamtsystem wichtig ist
steht in Issues: [1, 2, 3, 4, 5]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - Die neunte Zeile des Vertragsblocks `ProjektMeta` (TK 9.5.2) – zeichengleich, einschließlich der zwei Leerzeichen vor dem Kommentar: ``` standardMarkeId: string | null // Project.standardMarkeId; bei beschaedigt: true null (v3.12) ``` Die acht vorhandenen Zeilen stehen oben im Signaturblock 1 und bleiben **unverändert**. - Der Absatz „**Warum `standardMarkeId` in `ProjektMeta` steht (v3.12).**" 

### #329  [TK, anfuehrung]
ZITAT   : **je Eintrag der Projektliste**
NAECHSTE: sein Preis ist eine kurze Wartezeit beim Öffnen der Projektliste.
KONTEXT : - Die neunte Zeile des Vertragsblocks `ProjektMeta` (TK 9.5.2) – zeichengleich, einschließlich der zwei Leerzeichen vor dem Kommentar: ``` standardMarkeId: string | null // Project.standardMarkeId; bei beschaedigt: true null (v3.12) ``` Die acht vorhandenen Zeilen stehen oben im Signaturblock 1 und bleiben **unverändert**. - Der Absatz „**Warum `standardMarkeId` in `ProjektMeta` steht (v3.12).**" 

### #329  [TK, anfuehrung]
ZITAT   : wer aus `hole()?.marken` eine Marke herausfischt, umgeht die Bereitstellung von Schriften und Logo und zeichnet mit Ersatzschrift.
steht in Issues: [311, 313, 324]
NAECHSTE: **während** `template-canvas` zeichnet, und genau dort greift schon 9.10.3/9.10.4: Schriften und Motive müssen **vor** dem Zeichnen geladen sein, nachgewiesen ü
KONTEXT : - Die neunte Zeile des Vertragsblocks `ProjektMeta` (TK 9.5.2) – zeichengleich, einschließlich der zwei Leerzeichen vor dem Kommentar: ``` standardMarkeId: string | null // Project.standardMarkeId; bei beschaedigt: true null (v3.12) ``` Die acht vorhandenen Zeilen stehen oben im Signaturblock 1 und bleiben **unverändert**. - Der Absatz „**Warum `standardMarkeId` in `ProjektMeta` steht (v3.12).**" 

### #329  [TK, blockzitat]
ZITAT   : „Vor allem aber ist dies der **Ausweg aus der Lösch-Sperre**: `löscheMarke` blockiert, solange ein Projekt die Marke als Standard führt (9.15.1), und nennt die betroffenen Projekte **namentlich**. Ohne eine Stelle, an der sich der Wechsel vollziehen lässt, wäre die Sperre eine Sackgasse – und weil in der Regel **mehrere**, nicht geladene Projekte betroffen sind, muss der Wechsel hier möglich sein, ohne jedes davon vorher zu öffnen." (TK 9.14.3)
NAECHSTE: olange ein Projekt die Marke als Standard führt (9.15.1), und nennt die betroffenen Projekte **namentlich**. Ohne eine Stelle, an der sich der Wechsel vollziehe
KONTEXT : „Vor allem aber ist dies der **Ausweg aus der Lösch-Sperre**: `löscheMarke` blockiert, solange ein Projekt die Marke als Standard führt (9.15.1), und nennt die betroffenen Projekte **namentlich**. Ohne eine Stelle, an der sich der Wechsel vollziehen lässt, wäre die Sperre eine Sackgasse – und weil in der Regel **mehrere**, nicht geladene Projekte betroffen sind, muss der Wechsel hier möglich sein,

### #329  [AD, blockzitat]
ZITAT   : 1. **#324 trägt nach diesem Issue überholte Tatsachenbehauptungen** – „ACHTUNG: `ProjektMeta` traegt HEUTE KEINE `standardMarkeId`" und, im STOPP-Block, „Solange Edit 1 (s. o.) nicht gelaufen ist, kann der Aufrufer ihn nicht liefern – das ist bekannt und **nicht erneut zu melden**." Beides ist mit diesem Issue erledigt; nach der Vorwärts-Regel sind die Sätze zu ersetzen und der Verweis auf **#329** zu setzen – auch in der Tabelle „Die benannten Edits" und im Satz „Ausführender: ein eigenes Nachzieh-Issue, das der Auftraggeber anlegt". #324 bleibt im Übrigen richtig: Es liest weiterhin **kein** Feld von `meta`. 2. **Der in #247 gemeldete Nachzug ist nur zur HÄLFTE erledigt.** #35 wird hier auf Import und Re-Export umgestellt (ENTSCHIEDEN 4); **#75 (`ausgaben.ts`, `AusgabeDatei`) bleibt offen** und braucht denselben Handgriff, ebenso die beiden in #247 Punkt 4 genannten Kommentar-Abweichungen. 3. **Zwei Zahlenangaben in fremden Issues laufen nach:** #244 nennt „**fünf** Eigenschaften" für die `projektVerwaltung`-Wurzel (jetzt sechs), #252 verbietet ein „sechstes" Feld (jetzt: ein siebtes). Oben unter „Was dieses Issue ERSETZT" zitiert und ersetzt; auf GitHub zusätzlich nachziehen, damit kein bauender Agent zwei Verbote gegeneinander stehen sieht.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **#324 trägt nach diesem Issue überholte Tatsachenbehauptungen** – „ACHTUNG: `ProjektMeta` traegt HEUTE KEINE `standardMarkeId`" und, im STOPP-Block, „Solange Edit 1 (s. o.) nicht gelaufen ist, kann der Aufrufer ihn nicht liefern – das ist bekannt und **nicht erneut zu melden**." Beides ist mit diesem Issue

### #330  [AD, anfuehrung]
ZITAT   : fertige Funktion ohne Aufrufer
steht in Issues: [268, 295, 304, 309, 314]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Ohne dieses Issue wären sechsundzwanzig Funktionen aus zwölf abgenommenen Dateien gebaut, geprüft, grün – und für den Nutzer unerreichbar.** **FA-24 ist ein Muss** – dieselbe Lückenklasse „fertige Funktion ohne Aufrufer", die dieses Projekt seit M1 in **jedem** Meilenstein bezahlt hat.

### #330  [TK, anfuehrung]
ZITAT   : `action-editor`, `vorlagen-editor` und `marken-editor` brauchen **alle drei** eine Live-Vorschau über `template-canvas` in **lesbarer** Größe (9.8, 9.12.2, 9.15.2).
NAECHSTE: ction-editor`, `vorlagen-editor` und `marken-editor` brauchen **alle drei** eine Live-Vorschau über `template-canvas` in **lesbarer** Größe (9.8, 9.12.2, 9.15.2
KONTEXT : **Begründung der drei Spalten.** Die Reihenfolge ist die der Skizze und trägt fachlich: Die Liste ist die Navigation (sie wechselt, was rechts steht), die Mitte ist die Arbeit, die Vorschau ist das Ergebnis. TK 9.14.1 begründet auch die volle Fläche: „`action-editor`, `vorlagen-editor` und `marken-editor` brauchen **alle drei** eine Live-Vorschau über `template-canvas` in **lesbarer** Größe (9.8, 

### #330  [AD, anfuehrung]
ZITAT   : warnen, nicht blockieren
steht in Issues: [301]
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // ── #301 – src/renderer/marken-editor/kontrast-warnung.tsx ── export interface KontrastWarnungProps { marke: Marke schwellenwert: number // von der aufrufenden Stelle geliefert } /** Zeigt NICHTS (`null`), solange der Kontrast ausreicht, sonst einen nicht-blockierenden Hinweis. * KEIN Dialog, KEIN deaktivierter Speichern-Knopf – „warnen, nicht blockieren" (FA-24). */ export function KontrastWarn

### #330  [TK, anfuehrung]
ZITAT   : **Löschen fragt vorher.** Vor `löscheMarke` zeigt der Editor das Ergebnis von `pruefeMarkenReferenzen`: welche Aktionen in welchen Projekten und welche abgeleiteten Looks betroffen sind.
NAECHSTE: *Löschen fragt vorher.** Vor `löscheMarke` zeigt der Editor das Ergebnis von `pruefeMarkenReferenzen`: welche Aktionen in welchen Projekten, welche abgeleiteten
KONTEXT : - „**Fachlich:** Die UI zum Anlegen, Bearbeiten und Ableiten von Marken (FA-24). Sie zeigt die Rollen aus 9.11.2 mit ihren Werten, erlaubt den Import von Logo und Schriften und stellt das Ergebnis über `template-canvas` dar – **dieselbe** Zeichenroutine wie überall, damit die Vorschau im Editor dem späteren Segment entspricht (9.10.1)." (TK 9.15.2) – **das ist der Auftrag dieses Bildschirms in ein

### #330  [TK, anfuehrung]
ZITAT   : letzte Änderung verwerfen
NAECHSTE: daneben der benannte Ausweg „Trotzdem schließen und Änderungen verwerfen".
KONTEXT : - „**Fachlich:** Die UI zum Anlegen, Bearbeiten und Ableiten von Marken (FA-24). Sie zeigt die Rollen aus 9.11.2 mit ihren Werten, erlaubt den Import von Logo und Schriften und stellt das Ergebnis über `template-canvas` dar – **dieselbe** Zeichenroutine wie überall, damit die Vorschau im Editor dem späteren Segment entspricht (9.10.1)." (TK 9.15.2) – **das ist der Auftrag dieses Bildschirms in ein

## Gruppe B - Issue zugeschrieben, nirgends woertlich gefunden (337)


### #2  [anfuehrung]
ZITAT   : Fenster öffnet sich, Renderer lädt mit HMR
NAECHSTE: Ein Fehler im Renderer darf D1 niemals beschädigen.
KONTEXT : - [ ] Der Vite-Devserver startet eigenständig und ist unter der konfigurierten URL mit funktionierendem HMR erreichbar (nachweisbar daran, dass das ausgelieferte HTML den `@vite/client` enthält); das Watch-Tool erkennt Änderungen unter `src/main/**` und `src/preload/**` und löst einen Neustart aus. (Der Ende-zu-Ende-Nachweis „Fenster öffnet sich, Renderer lädt mit HMR" gehört zur Definition of Don

### #27  [anfuehrung]
ZITAT   : derselben Auto-Speichern-Logik wie `project-store`
NAECHSTE: Die Kennung kommt aber **nicht** aus dem `project-store`:
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Synchron oder entprellt?** Dieses Issue schreibt sinngemäß über „derselben Auto-Speichern-Logik wie `project-store`" (#31 schreibt tatsächlich physisch). Für `project-store` gibt es ein eigenes Entprellungs-Issue (3–5 s, Sofort-Flush, Fehler-Ereignis); für `config-store` **fehlt** ein solches – #31 wird stattdessen direkt von dieser Operation aufg

### #47  [anfuehrung]
ZITAT   : erst sperren, dann Stand lesen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Mit ihr lautet der ganze Beenden-Ablauf `await flushBeimBeenden()` gefolgt von `await flushBestand()` (#98) – **beide argumentlos, symmetrisch**, und die Reihenfolge „erst sperren, dann Stand lesen" bleibt dort gekapselt, wo das Lock zu Hause ist.

### #48  [anfuehrung]
ZITAT   : `schemaVersion` höher als bekannt | `unbekannter_fehler` (oder eigener Code) | kein Laden
NAECHSTE: rt**. *Folge ohne die Änderung:* Der Export hätte einen realen, benennbaren Fehler als `unbekannter_fehler` oder – schlimmer – unter einem selbst erfundenen Nam
KONTEXT : **Abgrenzung zu #34 (Arbeitsteilung, nicht doppeln):** `öffneProjekt` (#34) entscheidet und prüft **beide** Fälle von 9.5.5 – „höhere (unbekannte) Version → Fehler" **und** „ältere Version → Migration" – und ruft diese Funktion **ausschließlich** dann auf, wenn es die Version bereits eindeutig als **älter** erkannt hat. Diese Funktion prüft deshalb **nicht erneut**, ob die mitgegebene `schemaVersi

### #48  [anfuehrung]
ZITAT   : die aktuelle Version
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : export const MIGRATIONS_KETTE: ReadonlyMap<number, MigrationsSchritt> = new Map([ // Aktuell LEER: es gibt bislang nur EINE schemaVersion. Der erste Eintrag (Schlüssel = alte // Version, Wert = Schritt auf Version+1) entsteht erst mit der nächsten tatsächlichen // Formatänderung. Die Konstante für „die aktuelle Version" ist AKTUELLE_SCHEMA_VERSION aus // src/shared/contracts/konstanten.ts (#21) – 

### #48  [anfuehrung]
ZITAT   : schemaVersion höher als bekannt
NAECHSTE: - **`schemaVersion` und Migration** wie 9.5.5.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Fehlercode für eine lückenhafte/inkonsistente Kette:** TK 9.5.5 sagt nur, dass eine „definierte Migration" existieren soll, benennt aber keinen Fehlerfall für den (aktuell rein hypothetischen) Fall, dass für einen Versionssprung **kein** Schritt definiert ist. Genau dieselbe Art Lücke hat bereits #34 offen für „schemaVersion höher als bekannt" (do

### #48  [anfuehrung]
ZITAT   : Migration für dieses Projektformat fehlt
NAECHSTE: **ältere** Version → definierte Migration auf die aktuelle.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Fehlercode für eine lückenhafte/inkonsistente Kette:** TK 9.5.5 sagt nur, dass eine „definierte Migration" existieren soll, benennt aber keinen Fehlerfall für den (aktuell rein hypothetischen) Fall, dass für einen Versionssprung **kein** Schritt definiert ist. Genau dieselbe Art Lücke hat bereits #34 offen für „schemaVersion höher als bekannt" (do

### #51  [anfuehrung]
ZITAT   : eine andere Instanz läuft bereits
NAECHSTE: Ein Render/Export ist bereits geschrieben.
KONTEXT : Ausgang bei Erfolg: `true`, wenn diese Instanz weiterlaufen darf. Ausgang bei Fehler: entfällt im Sinne der `Ergebnis<T>`-Hülle – diese Funktion überquert **nicht** die Renderer↔Main-Grenze (TK 9.1.1 gilt für IPC-Operationen; dies ist reiner Main-Bootstrap vor der ersten Fensterinstanz, analog zu #3). `false` ist der reguläre, nicht-technische „eine andere Instanz läuft bereits"-Fall, kein Fehlerf

### #51  [anfuehrung]
ZITAT   : an den Datenort gebunden
NAECHSTE: So bleibt das Erscheinungsbild an die Vorlage gebunden.
KONTEXT : ## Abhängigkeiten - Blockiert von: #5 (`ermittleDatenOrt` – liefert den `datenOrt`, an den diese Sperre gebunden wird; ohne einen stabilen Datenort ist „an den Datenort gebunden" nicht umsetzbar), #3 (`src/main/index.ts` besitzt das `BrowserWindow`; muss `erzwingeEinzelInstanz` aufrufen und `beiZweitemStart` übergeben – S3s bisheriger Vertrag deckt diesen Aufruf noch **nicht** ab, s. „Nicht selbst

### #53  [anfuehrung]
ZITAT   : warum scheitert der Export immer
NAECHSTE: `render`, `export`.
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Q3 ist der **einzige** dauerhafte Nachweis darüber, was die Anwendung jemals produziert hat – jeder Render, jeder Export, jeder Fehlschlag, unbegrenzt aufbewahrt. Diese Datei wird über Jahre fortgeschrieben; ihr Format ist damit faktisch nicht mehr änderbar, ohne alte Einträge zu entwerten. Fehlt hier ein Feld (etwa `versuch`), lässt sich später nicht mehr 

### #60  [anfuehrung]
ZITAT   : gerade läuft ein Handler
NAECHSTE: das tut der Handler, s.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Keine Zeitgrenze je Auftrag einbauen** – kein Timeout, kein Wächter-Timer, kein `setTimeout` um den Handler herum, auch nicht „großzügig bemessen". Die Festlegung steht in den Invarianten. - **Eine erneute Registrierung nicht ablehnen und nicht still ignorieren** – sie ersetzt den vorherigen Eintrag. Siehe Invarianten. - **Keine Wiederholung hier 

### #68  [anfuehrung]
ZITAT   : der fachliche Code wird unverändert übernommen, nie abgebildet
NAECHSTE: Ein Aufrufer, der `daten` nicht kennt, funktioniert unverändert weiter.
KONTEXT : **Der Typparameter nimmt dir die Wertprüfung NICHT ab.** `HandlerFuer` verlangt `HandlerErgebnis<string>` – typmäßig ginge dort jede Zeichenkette durch. Genau deshalb prüft diese Datei den aus dem `RenderResult` kommenden `fehlercode` **zur Laufzeit** gegen die unten ausgeschriebene Wertliste (Punkt 3). Die Enge sitzt hier, weil hier der `string` zum Auftrags-Code **wird**: Ab #70 gilt „der fachli

### #68  [anfuehrung]
ZITAT   : der fachliche Fehlercode wird **unverändert** übernommen, nie abgebildet, nie auf `unbekannter_fehler` gesetzt
NAECHSTE: ner, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. *
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „Ein `render`-Auftrag führt beim Start intern `renderReel(payload)` aus – **nach** dem Sofort-Flush von D1 (9.5.4). `RenderProgress.prozent` (Kanal `render:fortschritt`, 9.2.7) speist `Auftrag.fortschritt`; `RenderResult` bestimmt den terminalen Auftrags-`status` (erfolg/fehlgeschlagen/abgebrochen) und liefert bei Erfolg d

### #69  [anfuehrung]
ZITAT   : nur schnell die schemaVersion mitschreiben
NAECHSTE: der schnelle Trim kann minimal anders schneiden.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Rename-mit-Ersetzen ist plattformabhängig.** Der Vertrag stellt das ausdrücklich fest: „**Rename-mit-Ersetzen plattformsicher:** Das atomare Ersetzen verhält sich auf Windows anders als auf POSIX; die Umsetzung muss ein **Ersetzen** garantieren, ohne die alte Datei vor Fertigstellung der neuen zu entfernen." (TK 9.6.3) Für den USB-Export ist die A

### #74  [anfuehrung]
ZITAT   : fehlende Datei → Zustand ‚fehlt'
NAECHSTE: - **D1-Eintrag ohne Datei** → `Asset.zustand = "fehlt"`.
KONTEXT : ## Abhängigkeiten - Blockiert von: #72 (liegt in derselben Datei und deklariert dort `ProjectStoreFehlercode`), #12 und #22 (`Ergebnis<T,F>` + generische Fehlercodes), #13 (Typ `Asset` mit dem Feld `zustand`), #15 (Typ `Project` mit dem Feld `assets`), #32 (`mitD1Lock`), #34 (`öffneProjekt` – lädt das aktive Projekt), #47 (`planeAutoSpeicherung`) - Blockiert: M3 Reconcile („fehlende Datei → Zustan

### #76  [anfuehrung]
ZITAT   : ENTSCHIEDEN – wer `verdrahteProjectStoreIPC` aufruft und wann
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Eingang → Ausgang | Eingang | Bedeutung | Grenzen/Validierung | |---|---|---| | – (`verdrahteProjectStoreIPC` hat kein Argument) | einmalige Verdrahtung beim Programmstart, aufgerufen von #3 | ein zweiter Aufruf würde 14 Kanäle doppelt registrieren (in Electron ein Fehler); er kommt im Ablauf aus #3 nicht vor – s. „ENTSCHIEDEN – wer `verdrahteProjectStoreIPC` aufruft und wann" | | Nutzlast je K

### #77  [anfuehrung]
ZITAT   : ENTSCHIEDEN – wer `verdrahteConfigStoreIPC` aufruft und wann
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Eingang → Ausgang | Eingang | Bedeutung | Grenzen/Validierung | |---|---|---| | – (`verdrahteConfigStoreIPC` hat kein Argument) | einmalige Verdrahtung beim Programmstart, aufgerufen von #3 | ein zweiter Aufruf würde fünf Kanäle doppelt registrieren (in Electron ein Fehler); er kommt im Ablauf aus #3 nicht vor – s. „ENTSCHIEDEN – wer `verdrahteConfigStoreIPC` aufruft und wann" | | Nutzlast je K

### #78  [anfuehrung]
ZITAT   : Fehlercode aus der // Union des ausfuehrenden Fachdienstes; hier bewusst weit typisiert, weil der GETEILTE Vertrag die // fachlichen Unionen der Main-Module (media-service, render-service, export-service) nicht kennen // darf - sonst muesste contracts/ auf Main-Code zeigen.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ```ts // #16 – src/shared/contracts/auftrag.ts, bereits angelegt. // Die Union referenziert die hier definierten Typen als FORWARD-Referenz. // `fehler.code` heißt dort `string`, NICHT `Fehlercode` – wörtlich aus #16: „Fehlercode aus der // Union des ausfuehrenden Fachdienstes; hier bewusst weit typisiert, weil der GETEILTE Vertrag die // fachlichen Unionen der Main-Module (media-service, render-s

### #82  [anfuehrung]
ZITAT   : ffprobe wird mitgeliefert
NAECHSTE: `ffprobe` wird ohnehin mitgeliefert (Abschnitt 3).
KONTEXT : 1. Den `ffprobe`-Binärpfad mit `ermittleFfprobePfad()` (#6) holen – **nicht** hier zusammenbauen (s. Invariante „ffprobe wird mitgeliefert" und das Verbot im STOPP-Block). 2. `execFile` mit **genau diesem Argument-Array** aufrufen – die Reihenfolge ist verbindlich, der Dateipfad steht **zuletzt** und wird **nicht** in Anführungszeichen gesetzt:

### #82  [anfuehrung]
ZITAT   : nur zum Prüfen, ob überhaupt etwas drin ist
NAECHSTE: ein Balken ohne Kontext lässt offen, ob überhaupt etwas passiert.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – den `ffprobe`-Pfad NICHT selbst zusammenbauen.** Er kommt ausschließlich aus `ermittleFfprobePfad()` (#6). Verboten sind insbesondere: das Ersetzen von „ffmpeg" durch „ffprobe" im Ergebnis von `ermittleFfmpegPfad()`, eigenes Auflösen über `app.asar.unpacked`, ein Pfad aus einer Umgebungsvariablen und ein Rückfall auf ein `ffprobe` aus dem

### #87  [anfuehrung]
ZITAT   : schnell nachschlagen
NAECHSTE: der schnelle Trim kann minimal anders schneiden.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **DIE REIHENFOLGE NIEMALS UMDREHEN.** Erst D1, dann Datei. Nicht „erst die Datei, dann der Eintrag, weil dann nichts liegen bleibt". Nicht „beides parallel, das ist schneller". Nicht „die Datei schon mal löschen, während das Lock gehalten wird". Die Begründung steht wörtlich in den Invarianten; das Ergebnis einer Umkehrung ist ein Listenelement, das

### #89  [anfuehrung]
ZITAT   : **ist seit dem letzten Mal etwas kaputtgegangen?**
NAECHSTE: Rein **diagnostisch** – deshalb genügen die letzten N Bewegungen.
KONTEXT : `markiert` zählt **ausschließlich** die Datensätze, die in diesem Lauf **neu** auf `fehlt` gesetzt wurden – nicht die, die schon `fehlt` waren, und nicht die Rückkehrer, die auf `ok` zurückgesetzt wurden. Grund: Der Zähler wandert in das Ergebnis des Aufräum-Ablaufs (#91) und beantwortet dort die Frage „**ist seit dem letzten Mal etwas kaputtgegangen?**". Ein Zähler, der Rückkehrer mitzählte, könn

### #90  [anfuehrung]
ZITAT   : so viel hängt weiter
NAECHSTE: true`) und reicht die `id` weiter.
KONTEXT : `erledigt` = Einträge, deren Datei weg **und** deren Vermerk gestrichen ist. `offen` = Einträge, die nach diesem Lauf **noch** in Q2 stehen. Die beiden Zahlen ergeben zusammen die Zahl der Einträge, die zu Beginn des Laufs vorlagen. Diese Aufteilung ist bewusst so gewählt, dass sie den **Bestand danach** beschreibt und nicht die Zahl der Versuche: Der Aufrufer (#91) meldet damit „so viel wurde fre

### #91  [anfuehrung]
ZITAT   : das Projekt hat keine Medien
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Eingang → Ausgang | Eingang | Bedeutung | Grenzen/Validierung | |---|---|---| | `projektId` | das gerade geöffnete Projekt | nicht leer, kein Pfadtrenner, kein `..`; wird unverändert an die drei Schritte weitergereicht | | `assets` | die Asset-Liste des **bereits geladenen** Projekts, vom Koordinations-Ablauf (#94) durchgereicht | muss ein Array sein; ein **leeres** Array ist zulässig und bedeu

### #95  [anfuehrung]
ZITAT   : nur um `headlineDisplay` zu ergänzen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keine Laufzeit-Werte in dieser Datei.** Kein `const`, keine `function`, keine Default-Objekte, keine Zod-/Schema-Objekte, keine Validierungshelfer. Insbesondere **nicht** die drei eingebauten Vorlagen – die sind Daten des `vorlagen-store` (#96) und liegen dort, damit sie nicht doppelt im Bundle landen. - **Verbot – kein zusätzliches Feld,

### #98  [anfuehrung]
ZITAT   : Reparieren beim Start
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Besitzt** `vorlagen.json` (app-weite Vorlagen-Bibliothek) samt **eigener** Schreib-Serialisierung. Die Schreib-Invarianten sind **dieselben** wie in 9.5.4: **atomar** (Temp + Rename), **`vorlagen.json.bak`** als letzte heile Version, **`schemaVersion`**, und Speicherfehler werden **sichtbar** gemacht statt still verschl

### #98  [anfuehrung]
ZITAT   : verwaiste Arbeitskopien beim Laden entfernen
NAECHSTE: - **Arbeitskopien blockieren das Löschen nicht** – sie sind kein „Benutzen".
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Rename-mit-Ersetzen ist plattformabhängig.** Der Vertrag stellt das ausdrücklich fest: „**Rename-mit-Ersetzen plattformsicher:** Das atomare Ersetzen verhält sich auf Windows anders als auf POSIX; die Umsetzung muss ein **Ersetzen** garantieren, ohne die alte Datei vor Fertigstellung der neuen zu entfernen." (TK 9.6.3) Für den USB-Export ist die A

### #98  [anfuehrung]
ZITAT   : nur schnell, damit nichts Kaputtes in die Datei kommt
NAECHSTE: Der **Renderer schreibt nichts auf die Platte**;
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Rename-mit-Ersetzen ist plattformabhängig.** Der Vertrag stellt das ausdrücklich fest: „**Rename-mit-Ersetzen plattformsicher:** Das atomare Ersetzen verhält sich auf Windows anders als auf POSIX; die Umsetzung muss ein **Ersetzen** garantieren, ohne die alte Datei vor Fertigstellung der neuen zu entfernen." (TK 9.6.3) Für den USB-Export ist die A

### #103  [anfuehrung]
ZITAT   : dann eben eigenständig
NAECHSTE: null = eigenständig eingebaut:
KONTEXT : ## Fehlerpfade (vollständig) | Situation | Code | Verhalten | |---|---|---| | `arbeitsId` ist kein String oder leer | `ungueltige_eingabe` | keine Wirkung; `aendereBestand` wird **gar nicht** aufgerufen | | `aendereBestand` kann den Bestand nicht laden (defekte Datei ohne brauchbares `.bak`, I/O-Fehler, falsche `schemaVersion`) | `speicher_fehler` | unverändert durchreichen; die Änderungsfunktion 

### #103  [anfuehrung]
ZITAT   : sicherheitshalber vorher noch einmal speichern
NAECHSTE: Deshalb die vorherige Normalisierung;
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keinen Timer anfassen, keinen Flush auslösen.** Kein `flushBestand()` (#98), kein eigener `setTimeout`, kein Abbrechen oder Vorziehen der Entprellung aus #102, kein „sicherheitshalber vorher noch einmal speichern". Warum das ausreicht, steht oben ausgeschrieben: `'entprellt'` übernimmt sofort im Speicher, und `'sofort'` schreibt alles Aus

### #103  [anfuehrung]
ZITAT   : nur diesmal doch überschreiben
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keinen Timer anfassen, keinen Flush auslösen.** Kein `flushBestand()` (#98), kein eigener `setTimeout`, kein Abbrechen oder Vorziehen der Entprellung aus #102, kein „sicherheitshalber vorher noch einmal speichern". Warum das ausreicht, steht oben ausgeschrieben: `'entprellt'` übernimmt sofort im Speicher, und `'sofort'` schreibt alles Aus

### #106  [anfuehrung]
ZITAT   : in keinem gemeldeten Projekt benutzt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Ausgang bei Erfolg: `Ergebnis<Vorlagennutzung>` mit **beiden** Listen. Beide leer bedeutet „in keinem gemeldeten Projekt benutzt" – geprüft wurden dann nachweislich **alle von `listeProjekte` (#35) gemeldeten** Projekte, und die Liste ist seit TK v3.0 vollständig (beschädigte Projekte werden gekennzeichnet statt weggelassen, TK 9.5.2 – s. ENTSCHIEDEN-Block). Ausgang bei Fehler: `ungueltige_eingabe

### #107  [anfuehrung]
ZITAT   : ist eine Arbeitskopie
NAECHSTE: 9.12 samt Arbeitskopie-Fluss);
KONTEXT : „eingebaut" und für „ist eine Arbeitskopie" kennt `VorlagenFehlercode` (#97) keinen eigenen Code,

### #107  [anfuehrung]
ZITAT   : schnelle Vorabprüfung nur im aktiven Projekt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „schnelle Vorabprüfung nur im aktiven Projekt", kein Nachzählen. Ausschließlich #106. Eine zweite

### #110  [anfuehrung]
ZITAT   : ist sie da und wie heißt sie für den Canvas?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Die Auflösung `SchriftRolle → Schrift` gehört NICHT hierher, sondern zu #112 (`loeseSchrift(marke, rolle): Schrift`).** Diese Datei kennt nur die fertige `Schrift`. Trennung: #112 beantwortet „welche Schrift?", #110 „ist sie da und wie heißt sie für den Canvas?".

### #111  [anfuehrung]
ZITAT   : nur das aktive Projekt
NAECHSTE: nur das aktive liegt im Speicher, 9.5.1). Blockierend, **nicht** kaskadierend. -
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Vorübergehender Ladefehler vs. wirklich fehlendes Medium – hier liegt eine Lücke im Gesamtvertrag.** Diese Funktion kann beides nicht unterscheiden; beides wird zu `fehlt` und damit zu einem Platzhalter. TK 9.10.7 verlangt aber: „**Ein Segment mit Platzhalter darf nie in den finalen Render gelangen** – diese Sperre sitzt im `composer` (Reparatur-M

### #119  [anfuehrung]
ZITAT   : woher die gebündelte Markendatei physisch stammt
NAECHSTE: für die gebündelten erledigt das der Start.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Wie aus `marke.logo.datei` eine ladbare URL wird – das ist offen und darf nicht geraten werden.** Zwei Dinge fehlen: (a) **wo** die Logo-Datei physisch liegt – #52 nennt nur das Feld, und #29 (`config-store.leseMarke`) führt ausdrücklich als offen, „woher die gebündelte Markendatei physisch stammt"; (b) **wie** der Renderer-Bundler einen zur **Lau

### #120  [anfuehrung]
ZITAT   : alle Abschnitte nutzen dieselbe Band-Vorlage
NAECHSTE: Die eingebaute Band-Vorlage (`höhe:
KONTEXT : 1. **Ganz-Ersetzen statt vier Einzeloperationen.** TK 9.7.2 nennt vier Bedienschritte („Band-Vorlage wählen, Abschnitte hinzufügen/ordnen/entfernen, Abschnitts-Dauern setzen"). Sie werden **nicht** zu vier Operationen: Die Operation nimmt das komplette Band entgegen und ersetzt das vorhandene. Begründung: (a) Dieselbe Bauweise wie `ordneNeu` (#43), das ebenfalls die **komplette** neue Abfolge beko

### #124  [anfuehrung]
ZITAT   : Element weg, dann brauchen wir die Datei ja nicht mehr
NAECHSTE: Beide Operationen brauchen einen Kanal;
KONTEXT : Der zweite Punkt ist die Löschgrenze. „Entfernen" heißt hier **nur** den Listeneintrag streichen. Ein Medium zu löschen ist ein **Auftrag** des `media-service` (blockiert sogar bei Referenz), eine Aktion zu löschen eine eigene Operation mit chirurgischer Kaskade (#40). Wer diese Wege hier zusammenfasst („Element weg, dann brauchen wir die Datei ja nicht mehr"), löscht dem Nutzer Material, das an a

### #136  [anfuehrung]
ZITAT   : `wert` zurückgeben und im Fehlerfall `null`
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Wird `vorlagenId` gegen die tatsächlich existierende Vorlagen-Bibliothek geprüft – und wenn ja, hier?** #38 und #39 lassen diese Frage ausdrücklich offen und vermuten, die tiefere Prüfung („existiert diese Vorlage wirklich?") gehöre „erst zum `action-editor` (M5), der die Vorlagen-Bibliothek ohnehin kennt – aber das ist eine Architektur-Entscheidu

### #140  [anfuehrung]
ZITAT   : tut beim zweiten Mal nichts
NAECHSTE: Sie nimmt keinen Eingang und liefert nichts;
KONTEXT : /** Einmalige Vorbereitung, BEVOR gezeichnet wird: Schriften, Logo und alle Motive der * Aktions-Bibliothek. Danach ist zeichneVorschau synchron aufrufbar. * Wirkungsgleich bei Mehrfachaufruf: ein zweiter Aufruf mit denselben Eingaben führt zum * gleichen Bestand (#111 überschreibt vorhandene Schlüssel und lädt neu – NICHT idempotent im * Sinne von „tut beim zweiten Mal nichts"). Nach einem Projek

### #143  [anfuehrung]
ZITAT   : weil der Nutzer ja überarbeiten will
NAECHSTE: Beides ist Arbeit, die der Nutzer nicht in Minuten wiederherstellt:
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – keine zweite Entprellung im Renderer.** Das Entprellen des Auto-Speicherns sitzt im Main (`#102` ruft `aendereBestand(…, 'entprellt')`). Baue hier **keinen** eigenen Timer, kein `setTimeout`-Sammeln, keine „nur alle n Sekunden schicken"-Logik. Zwei Entprellungen hintereinander ergeben eine unvorhersehbare Gesamtverzögerung, und im Fehlerf

### #145  [anfuehrung]
ZITAT   : nächste Linie ist ja fast dasselbe
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – kein Einrasten im Inspektor.** Kein Aufruf der Einrast-Funktion aus #144, kein Runden auf Vielfache von 8, kein „nächste Linie ist ja fast dasselbe". Das ist der ganze Zweck dieser Datei. - **Verbot – keine Nachkommastellen.** `rahmen` ist ganzzahlig. Nimm **keinen** Gleitkommawert entgegen und runde keinen; lehne ihn ab. Ein halber Pixel

### #149  [anfuehrung]
ZITAT   : ENTSCHIEDEN – wie die Oberfläche vom * neuen Stand erfährt
NAECHSTE: Stattdessen holt die Oberfläche beim Aufbau **einmal den vollständigen Stand** (für die Warteschlange:
KONTEXT : /** * Die Neulade-Funktion der gemeinsamen Vorlagen-Sicht – das ist `ladeUebersicht` aus #155. Sie * wird als PARAMETER hereingereicht und NICHT importiert (s. „ENTSCHIEDEN – wie die Oberfläche vom * neuen Stand erfährt"). Ihr Rückgabewert wird hier nicht ausgewertet, deshalb `unknown`. */ export type SichtNeuLaden = () => Promise<unknown>

### #150  [anfuehrung]
ZITAT   : nur zur Orientierung
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – kein zweiter Zeichenpfad, in keiner Form.** Kein eigenes `getContext('2d')`, kein `fillText`, kein `drawImage`, kein SVG-Nachbau, kein HTML/CSS-Nachbau der Zonen „nur zur Orientierung". Die einzige Pixelquelle ist `zeichneSegment` (#117). - **Verbot – nicht in das zurückgegebene Canvas zeichnen.** Zonenrahmen, Anfasser, Sicherheitslinie u

### #151  [anfuehrung]
ZITAT   : Kein Modul im Renderer importiert `window.api` direkt (Grep-Probe) – alles läuft über `rufeAuf`
NAECHSTE: der Renderer erhält eine URL, keinen direkten Dateizugriff.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**5. Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand." (TK 9.1.1) – diese Funktion leitet aus einer Meldung **nie** ab, dass ein Vorgang beendet ist, und ergänzt keine Felder.

### #151  [anfuehrung]
ZITAT   : bei der Zustellung wird nie geworfen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Was tut `abonniere`, wenn `window.api.on` nicht verfügbar ist?** (Denkbar nur bei einem Bug in #3/#4.) Bei `rufeAuf` ist dieselbe Frage offen – dort könnte notfalls ein synthetischer `unbekannter_fehler` in der Hülle reisen. **Hier gibt es diesen Weg nicht:** Ereignisse tragen keine Hülle, ein Fehler hätte keinen Empfänger. Die Möglichkeiten haben

### #151  [anfuehrung]
ZITAT   : Kein Modul im Renderer importiert `window.api` direkt (Grep-Probe) – alles läuft über `rufeAuf`
NAECHSTE: der Renderer erhält eine URL, keinen direkten Dateizugriff.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Was tut `abonniere`, wenn `window.api.on` nicht verfügbar ist?** (Denkbar nur bei einem Bug in #3/#4.) Bei `rufeAuf` ist dieselbe Frage offen – dort könnte notfalls ein synthetischer `unbekannter_fehler` in der Hülle reisen. **Hier gibt es diesen Weg nicht:** Ereignisse tragen keine Hülle, ein Fehler hätte keinen Empfänger. Die Möglichkeiten haben

### #151  [anfuehrung]
ZITAT   : kein Modul **außerhalb von `ipc-client`**
NAECHSTE: Der Export darf **nie** außerhalb von `zielPfad` schreiben.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Was tut `abonniere`, wenn `window.api.on` nicht verfügbar ist?** (Denkbar nur bei einem Bug in #3/#4.) Bei `rufeAuf` ist dieselbe Frage offen – dort könnte notfalls ein synthetischer `unbekannter_fehler` in der Hülle reisen. **Hier gibt es diesen Weg nicht:** Ereignisse tragen keine Hülle, ein Fehler hätte keinen Empfänger. Die Möglichkeiten haben

### #153  [anfuehrung]
ZITAT   : **Verbot – hier entsteht kein Ereigniskanal, insbesondere kein `project:autoSpeichernStatus`.** Diese Datei registriert **vierzehn Instant-Kanäle** und sonst nichts. Baue **keinen** Ereignis-Versand ein: kein `aufAutoSpeichernEreignis(...)`-Abonnement (#47), keine `BrowserWindow`-/`webContents`-Referenz, keinen fünfzehnten Eintrag in `kanaele.ts`.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Verbot – hier entsteht kein Ereigniskanal, insbesondere kein `project:autoSpeichernStatus`.** Diese Datei registriert **vierzehn Instant-Kanäle** und sonst nichts. Baue **keinen** Ereignis-Versand ein: kein `aufAutoSpeichernEreignis(...)`-Abonnement (#47), keine `BrowserWindow`-/`webContents`-Referenz, keinen fünfzehnten Eintrag in `kanaele.ts`." (#76)

### #153  [anfuehrung]
ZITAT   : `KANAELE.project` enthält genau diese 14 Namen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Was der Auftraggeber nachziehen muss (Vermerk, kein Arbeitsauftrag an den umsetzenden Agenten):** Der DoD-Punkt von #76 „`KANAELE.project` enthält genau diese 14 Namen" ist ab diesem Issue auf **sechzehn** zu lesen. #76 selbst wird **nicht** verändert; der DoD-Punkt ist dort zu präzisieren („die vierzehn Namen dieses Issues sind enthalten"), sonst schlägt der Test von #76 fehl, sobald dieses Iss

### #153  [anfuehrung]
ZITAT   : die vierzehn Namen dieses Issues sind enthalten
NAECHSTE: `ProtokollEintrag.versuch` (9.3) ist der Wert dieses Laufs und beginnt damit bei 1.
KONTEXT : **Was der Auftraggeber nachziehen muss (Vermerk, kein Arbeitsauftrag an den umsetzenden Agenten):** Der DoD-Punkt von #76 „`KANAELE.project` enthält genau diese 14 Namen" ist ab diesem Issue auf **sechzehn** zu lesen. #76 selbst wird **nicht** verändert; der DoD-Punkt ist dort zu präzisieren („die vierzehn Namen dieses Issues sind enthalten"), sonst schlägt der Test von #76 fehl, sobald dieses Iss

### #153  [blockzitat]
ZITAT   : „**Verbot – hier entsteht kein Ereigniskanal, insbesondere kein `project:autoSpeichernStatus`.** Diese Datei registriert **vierzehn Instant-Kanäle** und sonst nichts. Baue **keinen** Ereignis-Versand ein: kein `aufAutoSpeichernEreignis(...)`-Abonnement (#47), keine `BrowserWindow`-/`webContents`-Referenz, keinen fünfzehnten Eintrag in `kanaele.ts`." (#76)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Verbot – hier entsteht kein Ereigniskanal, insbesondere kein `project:autoSpeichernStatus`.** Diese Datei registriert **vierzehn Instant-Kanäle** und sonst nichts. Baue **keinen** Ereignis-Versand ein: kein `aufAutoSpeichernEreignis(...)`-Abonnement (#47), keine `BrowserWindow`-/`webContents`-Referenz, keinen fünfzehnten Eintrag in `kanaele.ts`." (#76) „**Verbot – in DIESER Datei keine Kanäle ü

### #154  [anfuehrung]
ZITAT   : Wirft NIE wegen eines Ladefehlers – ein nicht ladbares Logo landet als { zustand: 'fehlt' } im Bestand.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Warum Schritt 3 mit einem Fehler endet, obwohl #119 nie wirft:** #119 hält fest: „Wirft NIE wegen eines Ladefehlers – ein nicht ladbares Logo landet als { zustand: 'fehlt' } im Bestand." Das ist für #119 richtig (es ist ein Lader, kein Torwächter) – aber das Logo ist **gebündelt**, nicht vom Nutzer importiert, und die feste Logo-Zone kommt in **jeder** eingebauten Vorlage vor. Ein fehlendes Logo

### #154  [anfuehrung]
ZITAT   : `Asset.zustand` wird hier nicht gelesen. Maßgeblich ist allein, ob die Bytes ankommen.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - Grundmenge: **alle** Einträge aus `projekt.aktionen` mit `bildRef !== null`. **Nicht** nur die aktuell in der Liste verwendeten. Begründung: Ein Segment, ein Band-Abschnitt und die Live-Vorschau des `action-editor` greifen auf dieselben Aktionen zu; eine Teilmenge hieße, dass ein Motiv genau in dem Moment als Platzhalter erscheint, in dem der Nutzer eine Aktion in die Liste zieht – eine Sorte Fl

### #154  [anfuehrung]
ZITAT   : schlägt fehl, wenn `sindSchriftenBereit()` (#110) `false` liefert
NAECHSTE: Schlägt das Laden fehl, **entsteht kein Segment-PNG**;
KONTEXT : ## Abhängigkeiten - Blockiert von: #24 (`rufeAuf`), #12/#22 (`Ergebnis<T,F>`), #52 (`Marke`), #95 (`Vorlage`), #15 (`Project`), #13 (`Asset`), #14 (`Aktion.bildRef`), #110 (`stelleSchriftenBereit`), #119 (`bereiteLogoVor`/`holeLogo`), #111 (`bereiteMotiveVor`/`leereMotivBestand`), #29 + #77 (`leseMarke` und ihr Kanal), #99 + #109 (`listeVorlagen` und ihr Kanal) - Blockiert: **#128** (`thumbnails.t

### #155  [anfuehrung]
ZITAT   : soll ich das wirklich?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Die Übersicht ist die gemeinsame Vorlagen-Sicht des Renderers.** Sie wird **nicht** über IPC-Ereignisse aktuell gehalten: `vorlagen-editor`, `composer` und `action-editor` laufen im **selben** Renderer-Prozess, und der `vorlagen-store` hat in v1 ausdrücklich **kein** Ereignis (#109: „**Verbot – kein Ereignis.** Der `vorlagen-store` hat in v1 **keinen** Push an den Renderer"). Module **außerha

### #155  [anfuehrung]
ZITAT   : alte Arbeitskopie automatisch verwerfen
NAECHSTE: Hier entscheidet sie automatisch statt zu warnen:
KONTEXT : **Für diese Datei heißt das:** `ANLEGBARE_ARTEN` bleibt bei den zwei Einträgen oben. Erweitere sie **nicht** eigenmächtig, biete **keine** freie Höheneingabe „schon mal an" und baue **keine** eigene Vorbelegung fester Zonen im Renderer. Sobald #100 entschieden ist, wächst die Liste – das ist eine Änderung an **dieser** Konstante und an nichts sonst. - **Verbot mit Melde-Pflicht – der Weg zur Nutzu

### #156  [anfuehrung]
ZITAT   : Forward-Referenz auf Typen aus den jeweiligen Fach-Issues
NAECHSTE: - **Zonen-Rahmen in absoluten Pixeln** der jeweiligen Vorlagen-Fläche (9.11.1);
KONTEXT : **ENTSCHIEDEN – der Importpfad in `auftrag.ts` gehört zu diesem Issue.** #16 nennt `ExportRequest` als „Forward-Referenz auf Typen aus den jeweiligen Fach-Issues", legt aber **keinen** Importpfad fest – und ohne ihn bleibt `auftrag.ts` auch nach dem Anlegen dieser Datei **nicht übersetzbar**. Diese Zeile darf keine andere Datei setzen: Sie zeigt auf `export-request.ts`, und die entsteht erst hier.

### #157  [anfuehrung]
ZITAT   : Element 3 von 12, Phase Normalisieren
NAECHSTE: `fügeElementHinzu` (Asset- **oder** Aktions-Referenz;
KONTEXT : Aus dem übergebenen `RenderProgress` übernimmt #68 **ausschliesslich `prozent`** (nach `Auftrag. fortschritt`, auf 0–100 begrenzt); `phase`, `elementIndex`, `elementAnzahl` und `elementId` benutzt es **nicht**. **Das ist kein Argument, den Typ zu verkleinern:** Die vier übrigen Felder gehen an den *anderen* Empfänger, die Render-Ansicht im Renderer (Abonnent #151), die daraus „Element 3 von 12, Ph

### #158  [anfuehrung]
ZITAT   : nur um zu prüfen, ob überhaupt etwas kommt
NAECHSTE: ein Balken ohne Kontext lässt offen, ob überhaupt etwas passiert.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – den ffmpeg-Pfad NICHT selbst zusammenbauen.** Er kommt ausschließlich aus `ermittleFfmpegPfad()` (#6). Verboten sind insbesondere: eigenes Auflösen über `app.asar.unpacked`, ein Pfad aus einer Umgebungsvariablen, ein Rückfall auf ein `ffmpeg` aus dem `PATH` des Systems und `fluent-ffmpeg`s eigene Pfadsuche. Ein hier gebauter Pfad funktion

### #160  [anfuehrung]
ZITAT   : nur melden, wenn größer als zuletzt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – `out_time_ms` NICHT benutzen.** Der Name verspricht Millisekunden, die Einheit ist es je nach `ffmpeg`-Fassung **nicht** (dort stehen Mikrosekunden). Ein daraus errechneter Fortschritt liegt um den Faktor 1000 daneben: Der Balken springt in der ersten Sekunde auf 100 % und steht dann minutenlang still – ein Fehler, der wie ein Absturz aus

### #166  [anfuehrung]
ZITAT   : Warum diese Datei nichts ausführt
NAECHSTE: Der Editor rechnet **nichts** aus.
KONTEXT : /** * Baut das vollständige Argument-Array für EINEN ffmpeg-Aufruf – ohne Binärpfad und ohne den * festen Vorspann, den #158 selbst voranstellt. * Startet KEINEN Prozess: Das Ausführen übernimmt der Aufrufer (`render-service`, #177) über * `fuehreFfmpegAus` (#158). Begründung s. u. („Warum diese Datei nichts ausführt"). */ export function baueStandbildArgumente( auftrag: StandbildAuftrag, profil: 

### #166  [anfuehrung]
ZITAT   : das Bild ja noch skaliert werden muss
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Kein Wert des Ausgabe-Profils wird hier gesetzt oder verändert** – keine Bitrate, kein `-crf`, kein `-preset`, kein `-pix_fmt`, kein `-g`, kein `-r`, kein `-fps_mode`. Diese Datei übernimmt die Encoder-Argumente **unverändert** von #161 und die Tonspur-Argumente **unverändert** von #162. Wer hier „nur schnell" ein Flag ergänzt, hat eine zweite Que

### #172  [anfuehrung]
ZITAT   : nur diese eine Funktion
NAECHSTE: Ohne Anmeldung im `ipc-gateway` bliebe sie eine Main-Funktion ohne Aufrufer.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – nichts in T1 außer Zwischenprodukten.** Kein Pfad, keine Datei und kein Platzhalter für die fertige Ausgabe oder die `.part`-Datei. Seit TK v2.8 liegt das Staging der Enddatei im **Projekt-Ausgabeordner**; die Begründung (`EXDEV` auf einem portablen Datenort) steht wörtlich in den Invarianten. Wer hier „der Vollständigkeit halber" einen A

### #175  [anfuehrung]
ZITAT   : Uint8Array, nicht ArrayBuffer und nicht Buffer: `Buffer` gibt es im abgeschotteten Renderer // nicht, und die Zielfelder sind bereits als Uint8Array festgeschrieben (#17).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ```ts // #118 – src/renderer/template-canvas/als-png.ts (bereits angelegt) export async function alsPng(bild: SegmentBild): Promise<Ergebnis<Uint8Array, PngFehlercode>> // „Uint8Array, nicht ArrayBuffer und nicht Buffer: `Buffer` gibt es im abgeschotteten Renderer // nicht, und die Zielfelder sind bereits als Uint8Array festgeschrieben (#17)." (#118) ```

### #177  [anfuehrung]
ZITAT   : Das Ausführen übernimmt der Aufrufer (`render-service`, #177) über `fuehreFfmpegAus` (#158)
NAECHSTE: Zusätzlich entfällt damit eine Abhängigkeit `render-service` → `vorlagen-store`.
KONTEXT : Sie ist zugleich die Stelle, an der die reinen Bausteine des `ffmpeg-adapter` **ausgeführt** werden: #163 bis #167 bauen nur Filterketten und Argument-Arrays und starten selbst **keinen** Prozess – „Das Ausführen übernimmt der Aufrufer (`render-service`, #177) über `fuehreFfmpegAus` (#158)“ (#166/#167). Diese Datei setzt die Teile zusammen und drückt ab.

### #177  [anfuehrung]
ZITAT   : An JEDEN ffmpeg-Aufruf …
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #168 – src/main/ffmpeg-adapter/bandspur.ts (FUEHRT SELBST AUS) export interface BandAbschnitt { pngPfad: string; frames: number } export interface BandspurAuftrag { abschnitte: BandAbschnitt[] hoeheBand: number gesamtFrames: number // = endFrame − startFrame des Videos sequenzPfad: string zielPfad: string } export async function baueBandspur( auftrag: BandspurAuftrag, profil: RenderProfile, lau

### #178  [anfuehrung]
ZITAT   : nach dem terminalen Ergebnis feuert nichts mehr
NAECHSTE: Sie nimmt keinen Eingang und liefert nichts;
KONTEXT : ## Warum „nach dem terminalen Ergebnis feuert nichts mehr“ die wichtigste Zeile dieser Datei ist Der Fortschrittswert landet über #68 in `Auftrag.fortschritt`, und der Auftrag ist das, was die Warteschlangen-Leiste anzeigt – in **jedem** Reiter der Oberfläche (TK 9.14). Läuft nach dem terminalen `RenderResult` noch ein einziges Ereignis nach, schreibt es einen Prozentwert in einen Auftrag, der ber

### #181  [anfuehrung]
ZITAT   : Codes werden unverändert übernommen
NAECHSTE: sonst direkt übernommen.
KONTEXT : - **`RenderResult.ausgabeName` ist `request.ausgabeName`, unverändert durchgereicht (TK v3.2).** Er wird **nicht** aus `zielPfad` zurückgerechnet (`basename` ohne Endung) und **nicht** neu gebildet. *Begründung:* Das Feld existiert, damit die Oberfläche erfährt, unter welchem Namen gerendert wurde, und ihre Vorbelegung mit `Project.letzterAusgabeName` (FA-22) im Gleichklang hält: „| `ausgabeName` 

### #185  [anfuehrung]
ZITAT   : `dateiname: string // MIT Endung, z. B.
NAECHSTE: string // MIT Endung, z.
KONTEXT : Der zweite teure Punkt ist die **Endung**. Hier stoßen zwei Verträge aneinander: `ExportRequest.dateiname` kommt **MIT** Endung (er stammt aus `listeAusgaben`, #75: „`dateiname: string // MIT Endung, z. B. "sommeraktion.mp4"`"), `loeseAusgabePfad` (#49) erwartet den Namen **OHNE** Endung und hängt selbst `.mp4` an. Wer das übersieht, resolved `sommeraktion.mp4` zu `…/output/sommeraktion.mp4.mp4` –

### #187  [anfuehrung]
ZITAT   : kein modulübergreifender Import
NAECHSTE: ein Logo trägt praktisch immer `"importiert"`.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – die vorhandene Zieldatei wird NIE vorher angefasst.** Kein `unlink` auf `zielPfad`, kein `rm`, kein Leeren, kein Umbenennen auf `<name>.alt`, kein `truncate`, kein `copyFile`+`unlink`. **Auch nicht als Rückfalllösung**, wenn `rename` scheitert. Jede dieser Varianten erzeugt ein Zeitfenster, in dem am Ziel keine gültige Datei liegt – und g

### #188  [blockzitat]
ZITAT   : „Die Auswahl des nächsten Auftrags und der Statuswechsel bilden einen **synchronen** Abschnitt ohne `await` – nur so ist die serielle Invariante bewiesen. Ein Flush ist asynchron; dazwischengeschoben, öffnete er genau das Fenster, in dem ein zweiter Auftrag starten könnte. Nach dem Statuswechsel ist der Platz belegt, ein `await` also gefahrlos."
NAECHSTE: nen **synchronen** Abschnitt ohne `await` – nur so ist die serielle Invariante bewiesen. Ein Flush ist asynchron; dazwischengeschoben, öffnete er genau das Fens
KONTEXT : „Die Auswahl des nächsten Auftrags und der Statuswechsel bilden einen **synchronen** Abschnitt ohne `await` – nur so ist die serielle Invariante bewiesen. Ein Flush ist asynchron; dazwischengeschoben, öffnete er genau das Fenster, in dem ein zweiter Auftrag starten könnte. Nach dem Statuswechsel ist der Platz belegt, ein `await` also gefahrlos." **Ausgeschrieben, damit die Tragweite klar ist:** De

### #192  [anfuehrung]
ZITAT   : Woher der Beenden-Ablauf den `projekt`-Stand für `sofortFlush(projekt)` nimmt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Damit ist die Entscheidung **E-4** heute **nicht baubar**: Weder der Render-Handler (#68) noch der Export-Handler (#188) kommt an den Stand, den er vor der eigentlichen Arbeit auf die Platte zwingen soll. Dieselbe Lücke ist bereits beim Bootstrap (#3) aufgefallen – dort steht sie ausdrücklich als offene Frage im STOPP-Block („Woher der Beenden-Ablauf den `projekt`-Stand für `sofortFlush(projekt)` 

### #192  [anfuehrung]
ZITAT   : ruft ein zweiter Aufrufer `mitD1Lock()` auf, während der erste noch läuft, wartet er, bis der erste fertig ist
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Deadlock.** `mitD1Lock` ist laut #32 eine **FIFO-Warteschlange innerhalb des Prozesses**: „ruft ein zweiter Aufrufer `mitD1Lock()` auf, während der erste noch läuft, wartet er, bis der erste fertig ist". #32 schreibt als Eingangsbedingung ausdrücklich fest, dass die übergebene Aktion „selbst nicht erneut `mitD1Lock` aufrufen (Deadlock-Gefahr)" darf. Genau das wäre der Normalfall hier: Der Ren

### #192  [anfuehrung]
ZITAT   : MUSS von der aufrufenden Stelle innerhalb von `mitD1Lock` (#32) ausgeführt werden
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Nicht verwechseln:** Dass *diese Funktion* kein Lock nimmt, heißt **nicht**, dass der Aufrufer keines braucht. `sofortFlush` „MUSS von der aufrufenden Stelle innerhalb von `mitD1Lock` (#32) ausgeführt werden" (#47) – das bleibt unverändert Sache des Aufrufers.

### #192  [anfuehrung]
ZITAT   : schnell eines zu laden
NAECHSTE: der schnelle Trim kann minimal anders schneiden.
KONTEXT : Warum das ausdrücklich dasteht: Ein leeres Ersatzobjekt wäre der teuerste denkbare Fehlgriff. Es liefe durch `sofortFlush` in `schreibeProjekt` und **überschriebe die echte `project.json` mit einem leeren Projekt** – Aktionen-Bibliothek und Wiedergabeliste weg, und die `.bak`-Sicherung (#46, „vor jedem Schreiben") enthielte danach nur noch den vorletzten Stand. Ebenso verboten: `öffneProjekt` (#34

### #192  [anfuehrung]
ZITAT   : Woher der Beenden-Ablauf den `projekt`-Stand für `sofortFlush(projekt)` nimmt. […] Ob der `project-store` dafür eine eigene, argumentlose Beenden-Funktion anbietet (die sich aktiven Stand und Lock selbst holt) oder der Bootstrap den aktiven Stand über einen noch zu benennenden Weg bezieht: **nicht raten**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **#34 (`öffneProjekt`)** ist der einzige Erzeuger. Sein Ausgang lautet: „das geladene `Project`, als aktives Projekt im Speicher, `config-store` aktualisiert (`setzeAktivesProjekt`, #27)". Das Issue nennt aber **keine** Modulvariable, exportiert **keinen** Zugriff und legt **nicht** fest, in welcher Datei der Stand liegt. Es liefert das Projekt nur als Rückgabewert **seines** Aufrufs. - **#41 bi

### #192  [anfuehrung]
ZITAT   : Blockiert von: dieses Issue
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : | Stelle | Was dort heute steht | Was nachzuziehen ist | |---|---|---| | **#68** (`auftrags-manager`, Render-Handler) | Der STOPP-Block verlangt den Sofort-Flush „als erster Schritt", nennt aber keinen Weg zum `Project`: „`sofortFlush` (#47) wird **hier** gerufen, bevor `renderReel` startet – und **nur** hier". Bei Fehlschlag scheitert der Auftrag mit `speicher_fehler`. | Den Bezug auf `holeAktive

### #192  [anfuehrung]
ZITAT   : Woher der Beenden-Ablauf den `projekt`-Stand für `sofortFlush(projekt)` nimmt. #47 verlangt zweierlei vom Aufrufer: das **aktuelle** `Project` als Argument und die Ausführung „innerhalb von `mitD1Lock` (#32)". Der Bootstrap hält weder das eine noch das andere
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : | Stelle | Was dort heute steht | Was nachzuziehen ist | |---|---|---| | **#68** (`auftrags-manager`, Render-Handler) | Der STOPP-Block verlangt den Sofort-Flush „als erster Schritt", nennt aber keinen Weg zum `Project`: „`sofortFlush` (#47) wird **hier** gerufen, bevor `renderReel` startet – und **nur** hier". Bei Fehlschlag scheitert der Auftrag mit `speicher_fehler`. | Den Bezug auf `holeAktive

### #192  [anfuehrung]
ZITAT   : ob der `project-store` dafür eine eigene, argumentlose Beenden-Funktion anbietet (die sich aktiven Stand und Lock selbst holt)
NAECHSTE: lbe Melde-Weg wie beim `project-store`, auf einem eigenen Kanal (bindend).** Der `vorlagen-store` sendet bei einem gescheiterten Schreibvorgang ein **Ereignis v
KONTEXT : - **Die in #3 erwogene Alternative bleibt möglich.** #3 fragt, „ob der `project-store` dafür eine eigene, argumentlose Beenden-Funktion anbietet (die sich aktiven Stand und Lock selbst holt)". Dieses Issue baut die **kleinere** Variante: nur den Getter, Lock und Flush bleiben beim Aufrufer. Grund: Eine argumentlose Flush-Funktion müsste das Lock selbst nehmen und wäre damit aus einem bereits gespe

### #193  [anfuehrung]
ZITAT   : OFFEN (04.08.): noUncheckedIndexedAccess …
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Bezug CLAUDE.md („OFFEN (04.08.): noUncheckedIndexedAccess …"), #1 (`tsconfig.base.json`)

### #194  [anfuehrung]
ZITAT   : nächster/vorheriger Reiter
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Kein zweiter Navigationsbegriff.** Auch wenn es naheliegt, hier Unter-Ansichten, einen „Vollbild"-Modus, eine Verlaufs-Historie („zurück") oder eine Sperre („Reiterwechsel gerade verboten") zu ergänzen: Das Konzept kennt **vier** Reiter und sonst nichts (TK 9.14.1). Eine Wechsel-Sperre wäre außerdem der direkte Widerspruch zu „Ein Reiterwechsel ve

### #195  [anfuehrung]
ZITAT   : das zuletzt geöffnete Projekt ist beschädigt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **`src/renderer/App.tsx` darf geändert werden – ausschließlich, um `<Rahmen …/>` einzuhängen.** Der Rahmen braucht einen Aufhängepunkt, und den besitzt #10 (M0). Erlaubt ist genau: den `ReiterId`-Typ aus `./app-shell/reiter` (#194) importieren statt ihn lokal zu deklarieren, `<Rahmen>` mit den vier Eigenschaften rendern, und die leeren Platzhalter aus #10 als `inhalte`-Einträge übergeben, solan

### #196  [anfuehrung]
ZITAT   : welches Projekt ist offen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Nichts löschen, nichts anlegen, nichts reparieren.** Kein `setzeAktivesProjekt`, kein `erstelleProjekt` („dann eben ein leeres"), kein Anfassen von Dateien. Wenn dir beim Bauen ein Fall auffällt, in dem ein Aufräumen richtig wäre: melden. - **Verbot – dieses Issue abonniert `queue:geaendert` NICHT.** Der einzige Auswerter terminaler Auftrags-Überg

### #199  [anfuehrung]
ZITAT   : Die Abo-Funktion wird ÜBERGEBEN – der Aufrufer bildet sie aus `abonniere` (#151); diese Datei kennt keinen Kanalnamen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Die Undo-Historie wird bei JEDEM terminalen Zustand eines `import`/`loeschen`-Auftrags geleert – nicht nur bei Erfolg.** *Begründung:* Der Lösch-Ablauf ist ausdrücklich „D1 zuerst, Datei danach" (TK 9.4.6). Ein Löschauftrag, der **nach** dem D1-Schritt scheitert, hat den Datenbestand bereits verändert; ein danach gedrücktes Undo würde einen Schnappschuss von **vor** dieser Änderung zurückschr

### #199  [anfuehrung]
ZITAT   : läuft gerade eine Reparatur?
NAECHSTE: Es verlangt gerade Höhen und gerade Versätze.
KONTEXT : 1. **Die Undo-Historie wird bei JEDEM terminalen Zustand eines `import`/`loeschen`-Auftrags geleert – nicht nur bei Erfolg.** *Begründung:* Der Lösch-Ablauf ist ausdrücklich „D1 zuerst, Datei danach" (TK 9.4.6). Ein Löschauftrag, der **nach** dem D1-Schritt scheitert, hat den Datenbestand bereits verändert; ein danach gedrücktes Undo würde einen Schnappschuss von **vor** dieser Änderung zurückschr

### #200  [anfuehrung]
ZITAT   : Für `project:autoSpeichernStatus` (#47) gibt es keinen Sender. … Diese Datei // kann nur abonnieren, was jemand sendet – die Main-seitige Verdrahtung (samt Eintrag in #25) // FEHLT und ist ein eigenes Issue im `project-store`. Melden, nicht hier bauen – und schon gar // nicht ersatzweise pollen.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #151 – src/renderer/ipc-client/ereignisse.ts (der Aufrufer bildet daraus die beiden Abos) export function abonniere<T>( kanal: string, hoerer: (nutzlast: T) => void, ): () => void // Rückgabewert ist die Abmelde-Funktion; sie ist idempotent. Es wird NICHTS ausgepackt. // Aus #151, STOPP: „Für `project:autoSpeichernStatus` (#47) gibt es keinen Sender. … Diese Datei // kann nur abonnieren, was je

### #200  [anfuehrung]
ZITAT   : holeSpeicherzustand() liefert vor jedem Ereignis // { zustand: 'unbekannt', letzterFehlercode: null } – der Ausgangswert ist NICHT 'gespeichert' // (ENTSCHIEDEN 3)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : /** DREI Werte - nicht zwei. `'unbekannt'` ist der Ausgangswert und bedeutet: es ist noch keine * Meldung eingetroffen. Er wird NIE als „gespeichert" dargestellt (ENTSCHIEDEN 3). */ export interface Speicherzustand { zustand: 'unbekannt' | 'gespeichert' | 'nicht_gespeichert' // 'unbekannt' = kein Ereignis empfangen -> die Oberflaeche zeigt NICHTS an // 'gespeichert' = zuletzt gemeldet { typ: 'gesp

### #201  [anfuehrung]
ZITAT   : wodurch beginnt die Führung?
NAECHSTE: wird **beim Start** einer Ausführung erhöht (s.
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte, beide erledigt: 1. **Wodurch die Führung beginnt, ist vollständig entschieden – erledigt.** Der Anlass liegt bei #261 (ENTSCHIEDEN 8), und die Funktionswahl ist jetzt ebenfalls getroffen: **`starteFuehrung` ist ersatzlos gestrichen**, #256 bildet `meldeReparaturStand` einheitlich auf `uebernimmStand` ab – auch

### #201  [blockzitat]
ZITAT   : „**Der Stand ist ein Wert, keine Klasse und kein Modul-Zustand.** Jede Funktion liefert einen **neuen** `ReparaturStand`; keine mutiert die Eingabe. Grund: Der Stand muss **über einen Reiterwechsel hinweg** überleben (TK 9.14.2) – er wird deshalb von der `app-shell` gehalten und weitergereicht. Läge er als Modulvariable in dieser Datei, wäre er an die Lebensdauer des Renderer-Moduls gebunden und die Zusage nicht mehr prüfbar." (#132)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Der Stand ist ein Wert, keine Klasse und kein Modul-Zustand.** Jede Funktion liefert einen **neuen** `ReparaturStand`; keine mutiert die Eingabe. Grund: Der Stand muss **über einen Reiterwechsel hinweg** überleben (TK 9.14.2) – er wird deshalb von der `app-shell` gehalten und weitergereicht. Läge er als Modulvariable in dieser Datei, wäre er an die Lebensdauer des Renderer-Moduls gebunden und d

### #202  [anfuehrung]
ZITAT   : art 'video' -> referenz ist eine Asset-ID aus Project.assets, Asset.typ muss 'video' sein; art 'bild' -> … Asset.typ muss 'bild' sein; art 'segment' -> referenz ist eine AKTIONS-ID
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Der geforderte Typ wird aus dem Element abgeleitet, nicht aus der kaputten Stelle.** `Listenelement.art` ist `'video' | 'bild' | 'segment'`, und #152 leitet daraus den Zielbestand ab: „art 'video' -> referenz ist eine Asset-ID aus Project.assets, Asset.typ muss 'video' sein; art 'bild' -> … Asset.typ muss 'bild' sein; art 'segment' -> referenz ist eine AKTIONS-ID". Diese Datei bildet dieselbe

### #202  [anfuehrung]
ZITAT   : dann zeige ich eben Bilder
NAECHSTE: kopierte Videos und Bilder output/ # A:
KONTEXT : 1. **Der geforderte Typ wird aus dem Element abgeleitet, nicht aus der kaputten Stelle.** `Listenelement.art` ist `'video' | 'bild' | 'segment'`, und #152 leitet daraus den Zielbestand ab: „art 'video' -> referenz ist eine Asset-ID aus Project.assets, Asset.typ muss 'video' sein; art 'bild' -> … Asset.typ muss 'bild' sein; art 'segment' -> referenz ist eine AKTIONS-ID". Diese Datei bildet dieselbe

### #203  [anfuehrung]
ZITAT   : **welche Stellen** im Projekt sind kaputt?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Eine Anzeige für beide Fälle, unterschieden allein durch `abschnittIndex`.** Genau so hat #133 die Übergabe geschnitten. Zwei getrennte Komponenten wären zwei Stellen, an denen dieselbe Auswahlregel gepflegt werden müsste – und die Reihenfolge, in der Aktionen angeboten werden, liefe zwischen ihnen auseinander. 2. **Kaputte Aktionen werden nicht angeboten.** Eine Aktion, deren `bildRef` auf e

### #203  [anfuehrung]
ZITAT   : welche Aktion **taugt als Ersatz**?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Eine Anzeige für beide Fälle, unterschieden allein durch `abschnittIndex`.** Genau so hat #133 die Übergabe geschnitten. Zwei getrennte Komponenten wären zwei Stellen, an denen dieselbe Auswahlregel gepflegt werden müsste – und die Reihenfolge, in der Aktionen angeboten werden, liefe zwischen ihnen auseinander. 2. **Kaputte Aktionen werden nicht angeboten.** Eine Aktion, deren `bildRef` auf e

### #203  [anfuehrung]
ZITAT   : Kein Neurechnen der kaputten Stellen hier. Nach einem Fix ruft der Aufrufer `aktualisiereReparatur` (#132).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Eine Anzeige für beide Fälle, unterschieden allein durch `abschnittIndex`.** Genau so hat #133 die Übergabe geschnitten. Zwei getrennte Komponenten wären zwei Stellen, an denen dieselbe Auswahlregel gepflegt werden müsste – und die Reihenfolge, in der Aktionen angeboten werden, liefe zwischen ihnen auseinander. 2. **Kaputte Aktionen werden nicht angeboten.** Eine Aktion, deren `bildRef` auf e

### #209  [anfuehrung]
ZITAT   : der Auftrag ist beendet
NAECHSTE: Auftrags-Zustand.
KONTEXT : Ausgang `moeglicheAktion`: `'entfernen'`, `'abbrechen'` oder `null`. Ausgang `fuehreQueueAktionAus` bei Erfolg: `{ ok: true, wert: undefined }` – das bedeutet **„entfernt bzw. Abbruch angestoßen"**, ausdrücklich **nicht** „der Auftrag ist beendet". Der neue Zustand kommt über `queue:geaendert` (#205). Ausgang bei Fehler: die Codes `nicht_gefunden`, `ungueltige_eingabe`, `unbekannter_fehler` – **un

### #218  [anfuehrung]
ZITAT   : nur um eine Eigenschaft zu ergänzen
NAECHSTE: *Begründung:* Die Standardmarke ist eine Eigenschaft des **Projekts**;
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – kein `1080 - H`, kein `RENDER_PROFILE.hoehe - bandHöhe`, kein `videoBereichHöhe`, das du selbst bildest.** Diese Zahl heisst `g.videoBereichHöhe` bzw. `g.bandY` und kommt aus der geteilten Rechnung. Die **einzige** erlaubte eigene Subtraktion ist `RENDER_PROFILE.hoehe − g.bandY` für die Bandhöhe (ENTSCHIEDEN 2). - **Verbot – kein `16`, ke

### #224  [anfuehrung]
ZITAT   : Verwirft den Motiv-Bestand. Vor jedem Projektwechsel und nach jedem abgeschlossenen Import aufzurufen; danach muss bereiteZeichnenVor erneut laufen.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **Ohne `verwirfMotivBestand`** bleiben die Bilddaten des **alten** Projekts im Bestand. Der Bestand ist nach Schlüssel abgelegt, nicht nach Dateiinhalt – ein Bild des neuen Projekts, dessen Schlüssel zufällig zum alten passt, zeigt dann das **falsche Motiv**. Das fällt nicht als Fehler auf, sondern als ein Werbebild, das aussieht, als hätte es jemand vertauscht. #154 verlangt den Aufruf wörtlich

### #224  [anfuehrung]
ZITAT   : Muss abgeschlossen sein, BEVOR ein Thumbnail (#128), eine Vorschau oder ein Render (#134) entsteht. Erneut aufrufen nach jedem abgeschlossenen Import und bei jedem Projektwechsel.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Beim Öffnen eines Projekts wechselt die Shell in den Reiter Zusammenstellen** – der Nutzer landet dort, wo er weiterarbeitet, statt in der Liste stehen zu bleiben." (TK 9.14.3) - „Das **aktive** Projekt lebt zur Laufzeit **im Speicher** (Quelle der Wahrheit während der Sitzung; Lesezugriffe sind sofortig). Nur *ein* Pro

### #227  [anfuehrung]
ZITAT   : `referenz` ist ENTWEDER eine Asset-ID (Video/Bild) ODER eine Aktions-ID (Segment) – welche es ist, entscheidet der Main.
NAECHSTE: string // Asset-ID (video|bild) oder Aktions-ID (segment) dauer:
KONTEXT : ## Warum das im Gesamtsystem wichtig ist FA-05 ist ein **Muss**: „Alle Elemente (Videos + Aktions-Segmente) können zu einer Wiedergabeliste zusammengestellt und in der Reihenfolge angeordnet werden (z. B. per Drag-and-drop)." (Anforderungsdokument, FA-05) Das **Anordnen** baut #122, das **Hinzufügen** baut #123 – aber #123 nimmt eine `referenz` entgegen und sagt ausdrücklich, woher sie **nicht** k

### #227  [anfuehrung]
ZITAT   : es wird ans ENDE der Sicht // angehängt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ```ts // #123 – src/renderer/composer/element-hinzufuegen.ts (DEFINIERENDE QUELLE, wird AUFGERUFEN) /** Stellt den Eintrag mit dieser Referenz ans Ende der Liste. `referenz` ist ENTWEDER eine * Asset-ID (Video/Bild) ODER eine Aktions-ID (Segment) – welche es ist, entscheidet der Main. */ export async function fuegeElementHinzu(referenz: string): Promise<Ergebnis<Listenelement>> // Ausgang bei Erfo

### #229  [anfuehrung]
ZITAT   : Elemente entfernen und Medium löschen
NAECHSTE: Beim Entfernen gilt die Regel aus 9.5.3:
KONTEXT : **DAS GROSSE VERBOT – die referenzierenden Listenelemente werden NICHT mitentfernt.** Nicht automatisch, nicht „nach Rückfrage in einem Aufwasch", nicht als Knopf „Elemente entfernen und Medium löschen". Diese Datei ruft **kein** `entferneElement` (#124), **kein** `project:entferneElement` und **kein** `setzeBearbeitungsstand`. *Begründung:* Das Konzept hat für die beiden Löschfälle **bewusst vers

### #230  [anfuehrung]
ZITAT   : Objekt; // `projektId` ist ein nicht leerer String IN UUID-FORM, OHNE Pfadtrenner (`/`, `\`) und OHNE `..`
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #25/#76 – src/shared/contracts/kanaele.ts, Block `project` (Ausschnitt) KANAELE.project.listeAusgaben // === 'project:listeAusgaben' // Nutzlast-Form laut #76 (verbindlich): { projektId } // → der Main ruft listeAusgaben(nutzlast.projektId) // Prüfung im Gateway laut #76 – schärfer als bei den übrigen dreizehn Kanälen: „Objekt; // `projektId` ist ein nicht leerer String IN UUID-FORM, OHNE Pfadt

### #230  [anfuehrung]
ZITAT   : noch keine Ausgabedatei
NAECHSTE: die **fertige** Ausgabedatei.
KONTEXT : ## Fehlerpfade (vollständig) | Situation | Code | Verhalten | |---|---|---| | `projektId` leer oder kein String | `ungueltige_eingabe` | **keine** Wirkung, **kein** IPC-Aufruf | | `project:listeAusgaben` liefert `speicher_fehler` | Code **unverändert** | `ladefehler` wird gesetzt, der bisherige Bestand bleibt; die Ansicht zeigt den Fehler **mit** Knopf „Erneut laden" | | `project:listeAusgaben` li

### #231  [anfuehrung]
ZITAT   : Diese Datei // wartet auf NICHTS, zeigt KEINEN Fortschritt und meldet KEINEN Erfolg des Renders
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : export async function loeseRenderAus( projekt: Project, ausgabeName: string, marke: Marke, vorlagen: readonly Vorlage[], ): Promise<Ergebnis<{ auftragId: string }, AusloeseFehlercode>> // - prüft ZUERST auf kaputte Stellen: sind welche da → { ok: false, fehler: { code: // 'kaputte_elemente', meldung, daten: { stellen } } } – es wird KEIN PNG gezeichnet und NICHTS // eingereiht // - zeichnet danach

### #236  [anfuehrung]
ZITAT   : Die Entprellung (4000 ms nach der LETZTEN Änderung) sitzt IM MAIN – der Renderer baut KEINE zweite Entprellung.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Der Rückweg ist der Speicherweg des Editors – `sichereStand` (#143) – und damit `speichereArbeitskopie` (#102). Es gibt keinen zweiten.** *Begründung:* #102 nimmt eine **vollständige** Vorlage und ersetzt den Eintrag an seinem bisherigen Platz; genau das ist ein Schnappschuss-Rückschreiben. `sichereStand` ist der einzige Renderer-Weg dorthin: Es prüft vorher `stand.id === sitzung.arbeitsId`, 

### #236  [anfuehrung]
ZITAT   : Speichern: überarbeiten, als neue Vorlage, verwerfen
NAECHSTE: ntersteht – und beim Speichern die zwei Wege: **„Vorlage überarbeiten"** (Merge in den Parent) oder **„als neue eigenständige Vorlage"** (`parent = null`). Ist 
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – niemals in den Parent schreiben.** Diese Datei ruft **nicht** `uebernehmeInParent`, **nicht** `alsEigenstaendige`, **nicht** `verwerfeArbeitskopie`, **nicht** `erstelleVorlage`, **nicht** `löscheVorlage` und **nicht** `oeffneZurBearbeitung`. Ein Rückgängig darf die **genutzte** Vorlage unter keinen Umständen berühren – sie bestimmt das Au

### #238  [anfuehrung]
ZITAT   : ein anderer Name, weil ein zweiter gleichnamiger Export im selben Projekt bei einem falschen // Import lautlos den falschen Speicher beobachten wuerde
NAECHSTE: Nie der Originalname, nie ein gespeicherter OS-Pfad mit `\`/`/` — sonst ist das Projekt nicht zwischen Windows und macOS portabel.
KONTEXT : export function aufVorlagenSpeichernEreignis( hoerer: (ereignis: VorlagenSpeichernEreignis) => void, ): () => void // Registriert einen Hoerer fuer Statuswechsel des Vorlagen-Speichers; Rueckgabewert ist die // ABMELDE-Funktion. Baugleich zu `aufAutoSpeichernEreignis` (#47) – der ANDERE Name ist Absicht: // „ein anderer Name, weil ein zweiter gleichnamiger Export im selben Projekt bei einem falsch

### #238  [anfuehrung]
ZITAT   : Diese Datei kennt WEDER den Kanalnamen `vorlagen:autoSpeichernStatus` NOCH ein `BrowserWindow`: Sie meldet main-intern. Den Weg auf den IPC-Kanal baut die Verdrahtung im `ipc-gateway` (M7).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Beide Zweige haben ein Gegenstück im Main – die Naht ist geschlossen.** Auf der `project`-Seite ist es `aufAutoSpeichernEreignis` (#47), auf der `vorlagen`-Seite `aufVorlagenSpeichernEreignis` (#98, `src/main/vorlagen-store/schreibe-vorlagen.ts`). #98 sagt über den Kanalweg ausdrücklich: „Diese Datei kennt WEDER den Kanalnamen `vorlagen:autoSpeichernStatus` NOCH ein `BrowserWindow`: Sie meldet m

### #240  [anfuehrung]
ZITAT   : **EINZIGEN AUFRUFER**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Abhängigkeiten - Blockiert von: #23 (`registriereHandler` – ohne ihn gibt es keine Registrierung mit Hülle und Ausnahmefang), #25 (Kanal-Registry – die Datei, die hier ergänzt wird), #76 (legt den Block `KANAELE.project` an, der hier ergänzt wird), #153 (ergänzt ihn bereits einmal – die Reihenfolge im Bootstrap knüpft daran an), #12/#22 (`Ergebnis<T,F>` + geschlossener Fehlercode-Satz), **#15**

### #240  [blockzitat]
ZITAT   : „Diese Datei registriert **vierzehn Instant-Kanäle** und sonst nichts." (#76)
NAECHSTE: Sie nimmt keinen Eingang und liefert nichts;
KONTEXT : „Diese Datei registriert **vierzehn Instant-Kanäle** und sonst nichts." (#76) **Warum das diesem Issue nicht entgegensteht – drei Gründe. #153 hat den Präzedenzfall geschaffen, und dieses Issue baut ihn nach:**

### #243  [anfuehrung]
ZITAT   : Momentaufnahme der Sicht. Der zurueckgegebene // Wert wird NIE veraendert
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ```ts // #197 – src/renderer/app-shell/sichten.ts (DEFINIERENDE QUELLE des Zugangs) export interface Projektsicht { projekt: Project | null // null = noch kein Projekt geladen ladefehler: { code: string; meldung: string } | null } export interface ProjektZugang { lade: (projektId: string) => Promise<Ergebnis<Project>> hole: () => Projektsicht setzeProjekt: (projekt: Project) => void setzeListe: (l

### #243  [anfuehrung]
ZITAT   : Der Aufrufer nimmt vor dem optimistischen Schritt einen // Stand ueber holeSicht() (#121) und stellt ihn im zuruecknehmen-Rueckruf wieder her.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #126 – src/renderer/composer/optimistisch.ts (NUR zur Einordnung; NICHT importieren) export async function fuehreOptimistischAus<T>( anwenden: () => void, zuruecknehmen: () => void, bestaetigen: () => Promise<Ergebnis<T>>, ): Promise<Ergebnis<T>> // `anwenden` wird GENAU EINMAL und VOR `bestaetigen` gerufen; `zuruecknehmen` AUSSCHLIESSLICH bei // Fehlerklasse 1. #126, ENTSCHIEDEN 1: „Der Aufruf

### #243  [anfuehrung]
ZITAT   : Wer ruft `merkeVorAenderung` vor jeder Instant-Operation?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte: 1. **Die offene Frage aus #235 („Wer ruft `merkeVorAenderung` vor jeder Instant-Operation?") ist mit diesem Issue beantwortet.** Der Auslöser ist die Hülle um die gemeinsame Projekt-Sicht, nicht der Editor. M7-42s zweite Frage (Leeren beim Projektwechsel) beantwortet **#252/#224**: `leereProjektHistorie` ist e

### #243  [blockzitat]
ZITAT   : „Ein Rückgängig-Weg ist **Undo/Redo** und gehört zu FA-21 / TK 9.13 – ausdrücklich **nicht** M5. Baue hier **keinen** Undo-Stapel" (#124)
NAECHSTE: Die **fertige** Ausgabedatei gehört ausdrücklich **nicht** dazu – sie entsteht direkt im Projekt-Ausgabeordner (Begründung unten).
KONTEXT : „Ein Rückgängig-Weg ist **Undo/Redo** und gehört zu FA-21 / TK 9.13 – ausdrücklich **nicht** M5. Baue hier **keinen** Undo-Stapel" (#124) „In dieser Datei entsteht **kein** Undo-Stapel." (#132)

### #244  [anfuehrung]
ZITAT   : **Die parameterlose Fassung gehört in `Reiterumgebung` (#244, `inhalte.tsx`) – an genau die Stelle, an der #244 bereits `aufProjekteWechseln` bildet.**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Die fünf Modul-Wurzeln kommen als PARAMETER, nicht per Import.** *Begründung – drei Gründe:* (a) Es ist die Regel des Meilensteins: Module außerhalb des besitzenden Ordners bekommen, was sie brauchen, als Parameter, nicht per Import (Entscheidung E1, in #197 ausgeschrieben). (b) #197 hat für sich in Anspruch genommen, „die EINZIGE Datei in `src/renderer/app-shell/`" zu sein, „die aus einem an

### #245  [anfuehrung]
ZITAT   : Es gibt bislang **keinen einzigen Aufrufer**; ohne ihn bleibt die Historie leer und FA-21 ist für den Editor gebaut und wirkungslos.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Es gibt bislang **keinen einzigen Aufrufer**; ohne ihn bleibt die Historie leer und FA-21 ist für den Editor gebaut und wirkungslos." (#236, STOPP)

### #245  [anfuehrung]
ZITAT   : Wer ruft `merkeVorlageVorAenderung` vor jeder Zonen- oder Parameter-Änderung?
NAECHSTE: - **Undo/Redo** gilt im Editor für alle Zonen- und Parameter-Änderungen (9.13).
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **Zwei der drei offenen Fragen aus #236 sind mit diesem Issue beantwortet.** „Wer ruft `merkeVorlageVorAenderung` vor jeder Zonen- oder Parameter-Änderung?" → der Sitzungshalter, vor jeder Übernahme. „Wer ruft `leereVorlagenHistorie` beim Editor-Schluss?" → `beendeSitzung()`. Die dritte (`alsEigenstaendige`

### #245  [blockzitat]
ZITAT   : „**Ein Reiterwechsel verwirft nie Arbeit.** Instant-Änderungen sind bereits gesichert (9.5.4); eine offene Vorlagen-**Arbeitskopie** bleibt beim Verlassen des Reiters erhalten (9.12.1) und wird beim Zurückkehren fortgesetzt." (TK 9.14.2)
NAECHSTE: nt-Änderungen sind bereits gesichert (9.5.4); eine offene Vorlagen-**Arbeitskopie** bleibt beim Verlassen des Reiters erhalten (9.12.1) und wird beim Zurückkehr
KONTEXT : „**Ein Reiterwechsel verwirft nie Arbeit.** Instant-Änderungen sind bereits gesichert (9.5.4); eine offene Vorlagen-**Arbeitskopie** bleibt beim Verlassen des Reiters erhalten (9.12.1) und wird beim Zurückkehren fortgesetzt." (TK 9.14.2) ## DIE FALLE aus #243, geprüft: welche Hälfte hier zutrifft und welche nicht

### #246  [anfuehrung]
ZITAT   : Wer stellt `gibVideoHandlesFrei` bereit?
NAECHSTE: Undo stellt ihn wieder her.
KONTEXT : 1. **Die offene Frage aus #229 („Wer stellt `gibVideoHandlesFrei` bereit?") ist mit diesem Issue

### #246  [blockzitat]
ZITAT   : **NACHZUG – ERLEDIGT (kein Auftrag an den umsetzenden Agenten dieses Issues):** **#216**,
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **NACHZUG – ERLEDIGT (kein Auftrag an den umsetzenden Agenten dieses Issues):** **#216**, **#229** und **#261** nennen die Datei jetzt einheitlich unter

### #246  [blockzitat]
ZITAT   : 1. **Die offene Frage aus #229 („Wer stellt `gibVideoHandlesFrei` bereit?") ist mit diesem Issue
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Die offene Frage aus #229 („Wer stellt `gibVideoHandlesFrei` bereit?") ist mit diesem Issue beantwortet.** Der Aufrufer von #229 bildet `wirkungen.gibVideoHandlesFrei` aus dieser Datei.

### #246  [blockzitat]
ZITAT   : beantwortet.** Der Aufrufer von #229 bildet `wirkungen.gibVideoHandlesFrei` aus dieser Datei.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : beantwortet.** Der Aufrufer von #229 bildet `wirkungen.gibVideoHandlesFrei` aus dieser Datei. 2. **Beide Anmeldestellen sind nachgezogen – ERLEDIGT.** `VideoProps` (#216) trägt das Feld

### #246  [blockzitat]
ZITAT   : 2. **Beide Anmeldestellen sind nachgezogen – ERLEDIGT.** `VideoProps` (#216) trägt das Feld
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 2. **Beide Anmeldestellen sind nachgezogen – ERLEDIGT.** `VideoProps` (#216) trägt das Feld `assetId`, und #242 belegt es – das Register bleibt also auf der `Asset.id` und wird **nicht**

### #246  [blockzitat]
ZITAT   : auf den Dateinamen umgestellt. Die Anmeldung selbst steht jetzt in **beiden** Issues: (a)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : auf den Dateinamen umgestellt. Die Anmeldung selbst steht jetzt in **beiden** Issues: (a) `preview-player/video.tsx` (#216) meldet beim Einhängen an und beim Abbau ab, (b)

### #246  [blockzitat]
ZITAT   : `preview-player/video.tsx` (#216) meldet beim Einhängen an und beim Abbau ab, (b)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : `preview-player/video.tsx` (#216) meldet beim Einhängen an und beim Abbau ab, (b) `composer/thumbnails.ts` (**#128**, ein M5-Issue – gesondert nachgezogen) meldet für die Dauer

### #247  [anfuehrung]
ZITAT   : `ProjektMeta` ist die Nutzlast eines IPC-Kanals, wird aber **nur im Main** deklariert (#35) – ebenso `AusgabeDatei`
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „`ProjektMeta` ist die Nutzlast eines IPC-Kanals, wird aber **nur im Main** deklariert (#35) – ebenso `AusgabeDatei`" (#222, VERMERK)

### #247  [anfuehrung]
ZITAT   : eine fremde Vertragsdatei anfassen zu müssen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Eine NEUE Datei, keine Ergänzung von `project.ts` (#15).** *Begründung – fachlich, nicht organisatorisch:* `project.ts` beschreibt das **geladene** Projekt; diese Datei beschreibt zwei **Verzeichnis-Auskünfte** über Projekte, die gerade **nicht** geladen sind. `ProjektMeta` und `AusgabeDatei` sind **kein** Ausschnitt aus `Project` – sie tragen andere Felder und beantworten eine andere Frage. 

### #247  [anfuehrung]
ZITAT   : Sie enthält **nur** diesen Typ
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Eine NEUE Datei, keine Ergänzung von `project.ts` (#15).** *Begründung – fachlich, nicht organisatorisch:* `project.ts` beschreibt das **geladene** Projekt; diese Datei beschreibt zwei **Verzeichnis-Auskünfte** über Projekte, die gerade **nicht** geladen sind. `ProjektMeta` und `AusgabeDatei` sind **kein** Ausschnitt aus `Project` – sie tragen andere Felder und beantworten eine andere Frage. 

### #248  [anfuehrung]
ZITAT   : das erste kaputte Element wird hervorgehoben
NAECHSTE: - **Eins nach dem anderen:** Das erste kaputte Element wird hervorgehoben;
KONTEXT : Dieses Issue ist diese Oberflächen-Datei. Es hängt daran außerdem die **sichtbare** Hälfte des geführten Reparatur-Modus (FA-19, Akzeptanzkriterium 7): #131 findet die kaputten Stellen und #132 führt durch sie hindurch, aber „das erste kaputte Element wird hervorgehoben" ist eine Aussage über **Pixel** – und die entstehen hier.

### #248  [anfuehrung]
ZITAT   : #249 kommt als Parameter
NAECHSTE: Art, Zonen, Parameter;
KONTEXT : ## Signatur (verbindlich – NICHT ändern) ```ts // src/renderer/composer/liste-ansicht.ts (rein: kein JSX, kein react, kein dnd-kit, kein IPC) import type { Project, Listenelement } from '../../shared/contracts/project' import type { Asset } from '../../shared/contracts/asset' import type { Aktion } from '../../shared/contracts/aktion' import type { InlineMeldung } from './optimistisch' import type

### #248  [anfuehrung]
ZITAT   : ein Format je * Zeile
NAECHSTE: Format-Whitelist:
KONTEXT : /** Eine anzeigefertige Zeile der Wiedergabeliste. Rein abgeleitet, ohne Zustand. */ export interface ListenZeileModell { elementId: string /** 1-basierte Position in `Project.liste` – so, wie der Nutzer die Liste zaehlt. */ position: number /** `Asset.originalname` (video|bild) bzw. `Aktion.titel` (segment); sonst BEZEICHNUNG_UNBEKANNT. */ bezeichnung: string artLabel: 'Video' | 'Bild' | 'Aktion'

### #248  [anfuehrung]
ZITAT   : kein geführter Modus
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Eingang → Ausgang | Eingang | Bedeutung | Grenzen/Validierung | |---|---|---| | `projekt` | das geladene Projekt (#121) | wird **nur gelesen**; nichts wird verändert, nichts kopiert | | `stellen` | die kaputten Stellen (#131) | werden **übernommen**, nicht nachgerechnet und nicht gefiltert | | `aktuelleStelle` / `reparatur` | die Führung (#132) | `null` ist gültig und heißt „kein geführter Modu

### #249  [anfuehrung]
ZITAT   : Derselbe Bedien-Baustein
NAECHSTE: Das Feld folgt derselben Behelfs-Regel wie `name`:
KONTEXT : **„Derselbe Bedien-Baustein" ist die eigentliche Anforderung, nicht „ein Regler".** #125 hat sie strukturell wahr gemacht, indem es **einen** Einstiegspunkt (`uebernehmeGrenzen`) anbietet, der anhand `element.art` selbst auf `setzeTrim` bzw. `setzeDauer` verzweigt. Diese Datei muss dieselbe Zusage auf der Oberfläche einlösen: **ein** Bauteil, das für Video, Bild und Aktions-Segment gleich aussieht

### #249  [anfuehrung]
ZITAT   : lokal sofort … dann bestätigt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **„lokal sofort … dann bestätigt"** heißt: Während des Ziehens läuft **nur** die lokale Anzeige über `begrenze` (#125, rein rechnend, kein IPC). **Genau einmal**, beim Loslassen, wird `uebernehmeGrenzen` gerufen. Das ist in diesem Issue **entschieden** und keine offene Frage (ENTSCHIEDEN 3).

### #249  [anfuehrung]
ZITAT   : Bei Bild und Segment ist `anfang` immer 0. … Ein Aufruf mit `anfang !== 0` auf einem Bild/Segment ist ein Programmierfehler und wird mit `ungueltige_eingabe` abgewiesen.
NAECHSTE: `erstelleMarke` mit einer `parentId`, deren Marke selbst einen Parent hat, wird mit `ungueltige_eingabe` abgewiesen.
KONTEXT : 1. **EIN Bauteil für alle drei Elementarten – keine Verzweigung in zwei Bedienungen.** `ElementBedienung` zeichnet für Video, Bild und Aktions-Segment **dasselbe** Bauteil; verschieden sind allein die Zahl der Griffe (`modell.griffe`) und die Beschriftung der Grenzen. *Begründung:* AD 4.4 verlangt „**denselben** Bedien-Baustein" und begründet es mit der Konsistenz („Kürzen *und* Verlängern fühlen 

### #249  [anfuehrung]
ZITAT   : welche Grenze gilt für welche `art`
NAECHSTE: welcher Zweig je Feld (s.
KONTEXT : 1. **EIN Bauteil für alle drei Elementarten – keine Verzweigung in zwei Bedienungen.** `ElementBedienung` zeichnet für Video, Bild und Aktions-Segment **dasselbe** Bauteil; verschieden sind allein die Zahl der Griffe (`modell.griffe`) und die Beschriftung der Grenzen. *Begründung:* AD 4.4 verlangt „**denselben** Bedien-Baustein" und begründet es mit der Konsistenz („Kürzen *und* Verlängern fühlen 

### #250  [anfuehrung]
ZITAT   : Sie gibt den **Rückgabestand** des Main (`entfernteElementIds`, `geaenderteElementIds`) unverändert weiter – und damit ist ihre Pflicht erfüllt. Wer sie aufruft, spielt diesen Rückgabewert in die gemeinsame Projekt-Sicht (#121) ein
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Sie gibt den **Rückgabestand** des Main (`entfernteElementIds`, `geaenderteElementIds`) unverändert weiter – und damit ist ihre Pflicht erfüllt. Wer sie aufruft, spielt diesen Rückgabewert in die gemeinsame Projekt-Sicht (#121) ein" (#142)

### #250  [anfuehrung]
ZITAT   : Ein Teilerfolg ist ein ERFOLG mit // Teilmenge, kein Fehler.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #138 (#138) – src/renderer/action-editor/bild-zuweisen.ts export function waehlbareBilder(assets: Asset[]): Asset[] export async function weiseBildZu( aktionId: string, assetId: string, assets: readonly Asset[], ): Promise<Ergebnis<Aktion>> export async function entferneBild(aktionId: string): Promise<Ergebnis<Aktion>> export async function starteBildImport( projektId: string, ): Promise<Ergebn

### #250  [anfuehrung]
ZITAT   : Hängt das Canvas in ein Anzeigeelement und skaliert es AUSSCHLIESSLICH per CSS. // Verändert canvas.width/canvas.height NIEMALS.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #140 (#140) – src/renderer/action-editor/live-vorschau.ts export async function bereiteVorschauVor( projektId: string, aktionen: Aktion[], assets: Asset[], marke: Marke, ): Promise<void> // „Einmalige Vorbereitung, BEVOR gezeichnet wird: Schriften, Logo und alle Motive der // Aktions-Bibliothek. Danach ist zeichneVorschau synchron aufrufbar. … Nach einem Projektwechsel // oder einem abgeschloss

### #250  [anfuehrung]
ZITAT   : nutzbar **UND** vollflächig
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Der neue Stand geht über `projekt.setzeProjekt(mitAktion(projekt, aktion))` in die gemeinsame Sicht – nach JEDEM erfolgreichen Schreibvorgang.** Betroffen sind `legeAktionAn` (#136), `speichereAktion` (#136), `weiseBildZu` und `entferneBild` (#138), `setzeAkzentfarbe` (#139) und `behebeAktionsBild` (#141). **ACHTUNG – die Rückgabeform ist bei fünf Wegen gleich und beim sechsten anders.** Die 

### #250  [anfuehrung]
ZITAT   : MUSS vor dem ersten `zeichneVorschau` abgeschlossen sein
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Der neue Stand geht über `projekt.setzeProjekt(mitAktion(projekt, aktion))` in die gemeinsame Sicht – nach JEDEM erfolgreichen Schreibvorgang.** Betroffen sind `legeAktionAn` (#136), `speichereAktion` (#136), `weiseBildZu` und `entferneBild` (#138), `setzeAkzentfarbe` (#139) und `behebeAktionsBild` (#141). **ACHTUNG – die Rückgabeform ist bei fünf Wegen gleich und beim sechsten anders.** Die 

### #250  [anfuehrung]
ZITAT   : ist die Aktion kaputt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – kein IPC in diesen Dateien.** Kein `rufeAuf`, kein `abonniere`, kein `KANAELE`, kein `window.api`, kein Kanalname als Zeichenkette. Jeder Weg über die Grenze führt durch die aufgerufenen M5-Funktionen bzw. durch den übergebenen `ProjektZugang`. - **Verbot – keine zweite Prüfung und keine zweite Liste.** Keine eigene Titel-Prüfung, kein ei

### #250  [anfuehrung]
ZITAT   : Wer meldet den Abschluss einer Reparatur-Übergabe?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte: 1. **ERLEDIGT mit TK v3.2: „Aktion löschen" ist undo-fähig.** Der Auftraggeber hat entschieden, dass `löscheAktion` den vollständigen neuen `stand` (Typ `Bearbeitungsstand`) **zusätzlich** zu den beiden Kennungslisten liefert (TK 9.5.2/9.5.3). Damit geht der Weg in die Sicht über `setzeProjekt`, und die Undo-H

### #251  [anfuehrung]
ZITAT   : Arbeitskopie von <Parent>
NAECHSTE: 9.12 samt Arbeitskopie-Fluss);
KONTEXT : | Ansicht | Bereich | Inhalt | Quelle | |---|---|---|---| | `uebersicht` | ganze Fläche | die nutzbaren Vorlagen, die verwaisten Arbeitskopien, „Neu anlegen", „Bearbeiten", „Fortsetzen", „Löschen" | #155 | | `editor` | links | der **Zonen-Canvas** mit Sicherheitsbox, Einrastlinien und Griffen | #144 | | `editor` | rechts oben | die **Live-Vorschau** samt den fünf Feld-Schaltern | #150 | | `editor`

### #251  [anfuehrung]
ZITAT   : die festen Zonen, wie sie **beim Öffnen** der Arbeitskopie vorlagen
NAECHSTE: der Reconcile beim nächsten Öffnen des Projekts holt es nach (9.4.7).
KONTEXT : 1. **Diese Wurzel liefert die drei fehlenden Aufrufer des Sitzungshalters.** `uebernimmAenderung` nach **jeder abgeschlossenen** Bearbeitung, `uebernimmSpeicherstand` für den Nachhall von `sichereStand`, `beendeSitzung` nach jedem der drei Abschlüsse aus #149. *Begründung:* #245 hat den Halter gebaut und die Aufrufer namentlich hierher verwiesen (oben zitiert). Ohne sie bleibt die Vorlagen-Histori

### #251  [anfuehrung]
ZITAT   : alle n Sekunden sichern
NAECHSTE: Millisekunden nach;
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – kein zweiter Sitzungshalter.** Diese Wurzel ruft `sitzungshalter()` **nicht** und hält die `EditorSitzung` **nicht** in einem eigenen Zustand. Der Halter kommt als Eigenschaft. Ein zweiter Halter überlebte den Reiterwechsel nicht und bekäme nie einen Schnappschuss. - **Verbot – kein Schnappschuss und kein Stapel in dieser Datei.** Kein `m

### #252  [anfuehrung]
ZITAT   : Öffnet das Duplikat NICHT und wechselt KEINEN Reiter.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #225 – src/renderer/projekt-verwaltung/duplizieren.ts (DEFINIERENDE QUELLE) export type Namenspruefung = { ok: true; name: string } | { ok: false; grund: 'leer' } export function pruefeDuplikatname(eingabe: string): Namenspruefung export function schlageDuplikatnamenVor(meta: ProjektMeta): string export function baueDuplizierHinweis(meta: ProjektMeta): string | null export interface DuplizierWi

### #252  [blockzitat]
ZITAT   : „**Die Projektverwaltung ist ein eigenes Modul, kein Teil der Shell (bindend).**" (TK 9.14.3)
NAECHSTE: 4.3 Modul `projekt-verwaltung` [Renderer] **Die Projektverwaltung ist ein eigenes Modul, kein Teil der Shell (bindend).** 9.14.1 belegt den Reiter **Projekte** 
KONTEXT : „**Die Projektverwaltung ist ein eigenes Modul, kein Teil der Shell (bindend).**" (TK 9.14.3) #244 setzt die Wurzel deshalb als **Parameter** in den Reiter ein – dieses Issue liefert sie.

### #253  [blockzitat]
ZITAT   : „Werbeinhalte erscheinen auf **drei** Wegen. **Hauptbetriebsart ist die parallele Anzeige während eines Videos**; die sequenzielle Werbepause ist die zusätzliche Möglichkeit:" (Anforderungsdokument 4.5)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Werbeinhalte erscheinen auf **drei** Wegen. **Hauptbetriebsart ist die parallele Anzeige während eines Videos**; die sequenzielle Werbepause ist die zusätzliche Möglichkeit:" (Anforderungsdokument 4.5) Die **Logik** ist seit M5 vollständig: #129 baut den Entwurf und übernimmt ihn, #130 rechnet aus, was das Band während des Videos tut. **Ohne dieses Issue zeichnet sie niemand.** #249 öffnet ledigl

### #254  [blockzitat]
ZITAT   : „`vorlagen:pruefeVorlagenReferenzen` | `{ vorlagenId }` | `pruefeVorlagenReferenzen(nutzlast.vorlagenId)`" (#255, Nutzlast-Form)
NAECHSTE:  aktionen: VorlagenReferenz[] // Treffer über aktion.vorlagenId listenelemente: VorlagenReferenz[] // Treffer über listenelement.einblendung.bandVorlageId } ```
KONTEXT : „`vorlagen:pruefeVorlagenReferenzen` | `{ vorlagenId }` | `pruefeVorlagenReferenzen(nutzlast.vorlagenId)`" (#255, Nutzlast-Form) Das weicht **bewusst** von den übrigen `vorlagen`-Kanälen ab, die laut #109 `{ id }` tragen – rate die Form also nicht aus dem Nachbarkanal. #255 hält dazu ausdrücklich fest, dass ein hier gesendetes `{ id }` einen Kanal ergäbe, „der **jeden** Aufruf mit `ungueltige_eing

### #255  [anfuehrung]
ZITAT   : Operation ohne Kanal
NAECHSTE: Beide Operationen brauchen einen Kanal;
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte: 1. **Bootstrap #3 braucht genau einen weiteren Eintrag.** Der Aufruf `verdrahteVorlagenNachtragIPC()` gehört in die feste Startreihenfolge als **achter** der Anmeldungen **ohne** Fenster, **unmittelbar nach** `verdrahteVorlagenIPC()` (#109); die bisherigen Einträge 8 und 9 (`meldeRenderHandlerAn`, `meldeExport

### #255  [blockzitat]
ZITAT   : „**Arbeite dieses Issue also unverändert ab, als gäbe es den zehnten Kanal nicht, und registriere ihn NICHT**" (#109)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Arbeite dieses Issue also unverändert ab, als gäbe es den zehnten Kanal nicht, und registriere ihn NICHT**" (#109) **Warum das diesem Issue nicht entgegensteht – vier Gründe. #153 und #240 haben den Präzedenzfall geschaffen, und dieses Issue baut ihn nach:**

### #256  [anfuehrung]
ZITAT   : Was geschieht, wenn der Nutzer im Reiter Aktionen etwas ganz anderes tut und dann selbst den Reiter wechselt, statt die Übergabe abzuschliessen?
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – der Import-Rückweg läuft AUSSCHLIESSLICH über `schliesseMedienImportAb`.** Der Weg ist entschieden (ENTSCHIEDEN 12): #199 meldet den fertigen Asset, #262 ruft diese Funktion, und sie ruft `u.schliesseMediumFixAb`. **Baue insbesondere nicht:** ein Abo auf `queue:geaendert`, ein Warten auf `auftragIds`, ein Erraten des neuen Assets aus `pro

### #256  [anfuehrung]
ZITAT   : **Baue hier kein Overlay** und ergänze den Rahmen nicht
NAECHSTE: Marken- Identität und Rahmen sind stabil.
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **`medium_neu_verknuepfen` hat seinen Abschluss – entschieden UND #133 nachgezogen: erledigt.** Der Auftraggeber hat die erste der beiden früher genannten Varianten gewählt: Die Übergabe trägt die `elementId` mit, und #199 meldet den fertigen Asset an die Führung weiter. Ausgeschrieben ist der Weg in ENTSCH

### #257  [anfuehrung]
ZITAT   : `leseAktuelleRenderId` wird bei JEDEM eingetroffenen Ereignis neu gerufen – der Wert // darf sich waehrend der Laufzeit aendern (neuer Render nach einem Abbruch).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #208 – src/renderer/queue-panel/fortschritt.ts (DEFINIERENDE QUELLE) export type RenderFortschritt = | { zustand: 'unbekannt' } | { zustand: 'gemeldet'; ereignis: RenderProgress } export const ANFANGS_FORTSCHRITT: RenderFortschritt = { zustand: 'unbekannt' } export function beschreibeFortschritt(stand: RenderFortschritt): string export function baueRenderFortschrittAuf( leseAktuelleRenderId: ()

### #257  [anfuehrung]
ZITAT   : Der Aufrufer (#195) liest sie aus dem // laufenden Auftrag der Warteschlangen-Sicht: `Auftrag` mit `art: 'render'` und // `status: 'laeuft'` → `payload.renderId` (TK 9.2.1: das Feld des `RenderRequest`). Läuft kein // Render, ist der Wert `null`, und **jedes** Ereignis wird verworfen.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #208 – src/renderer/queue-panel/fortschritt.ts (DEFINIERENDE QUELLE) export type RenderFortschritt = | { zustand: 'unbekannt' } | { zustand: 'gemeldet'; ereignis: RenderProgress } export const ANFANGS_FORTSCHRITT: RenderFortschritt = { zustand: 'unbekannt' } export function beschreibeFortschritt(stand: RenderFortschritt): string export function baueRenderFortschrittAuf( leseAktuelleRenderId: ()

### #257  [blockzitat]
ZITAT   : „Die EINE Warteschlangen-Leiste. Wird genau einmal gerendert, außerhalb der Reiterinhalte." (#195, `RahmenEigenschaften.warteschlangenLeiste`)
NAECHSTE:  9.14.2 für die Warteschlangen-Leiste). Stattdessen holt die Oberfläche beim Aufbau **einmal den vollständigen Stand** (für die Warteschlange: `holeStand()`, 9.
KONTEXT : „Die EINE Warteschlangen-Leiste. Wird genau einmal gerendert, außerhalb der Reiterinhalte." (#195, `RahmenEigenschaften.warteschlangenLeiste`) **Niemand liefert sie.** Damit ruft niemand `baueAuftragsSichtAuf` (#205), niemand hält `aufgeklappt`, niemand liefert `zeileSchalter` an die Liste (#207), und niemand beantwortet `leseAktuelleRenderId` für den feinen Fortschritt (#208). Sieben fertig gebau

### #258  [anfuehrung]
ZITAT   : **ohne Kodierungsumbau**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Zwei Punkte: 1. **Drei Stellen sind nachzuziehen.** `src/renderer/preview-player/medien-url.ts` (#215), `src/renderer/composer/bibliothek-ansicht.ts` (#227) und `src/renderer/composer/thumbnails.ts` (#128) bilden die Adresse heute selbst. Nachzuziehen ist: alle drei rufen `medienUrl` aus `src/shared/medien-url.ts` auf, sta

### #258  [blockzitat]
ZITAT   : „`medienUrl('p1', 'a-b-c.png')` liefert exakt `'media://p1/a-b-c.png'` – ohne führenden Schrägstrich, ohne Kodierungsumbau, ohne Pfadanteil" (#227, Definition of Done)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „`medienUrl('p1', 'a-b-c.png')` liefert exakt `'media://p1/a-b-c.png'` – ohne führenden Schrägstrich, ohne Kodierungsumbau, ohne Pfadanteil" (#227, Definition of Done) Ein dritter Erzeuger derselben Adresse steht in #128 (`thumbnails.ts`, Variante `{ quelle: 'url'; url: string }`).

### #262  [anfuehrung]
ZITAT   : **Kein Feld für Reiter-spezifische Werkzeugleisten, kein // Menü, keine zweite Statuszeile** außer den **drei** Schlitzen in der Signatur // (`warteschlangenLeiste`, `speicherHinweis`, `meldungsFlaeche`).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #195 – src/renderer/app-shell/rahmen.tsx (DEFINIERENDE QUELLE) export type ReiterInhalt = (eigenschaften: { sichtbar: boolean }) => JSX.Element export interface RahmenEigenschaften { inhalte: Record<ReiterId, ReiterInhalt> warteschlangenLeiste: () => JSX.Element speicherHinweis?: () => JSX.Element /** Die ANWENDUNGSWEITE Meldungsflaeche, unmittelbar unter der Reiterleiste. */ meldungsFlaeche?: 

### #262  [anfuehrung]
ZITAT   : … der Rahmen HÄLT die Meldungen nicht. … Wer die Meldungen hält, ist #262 // (`src/renderer/App.tsx`).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #195 – src/renderer/app-shell/rahmen.tsx (DEFINIERENDE QUELLE) export type ReiterInhalt = (eigenschaften: { sichtbar: boolean }) => JSX.Element export interface RahmenEigenschaften { inhalte: Record<ReiterId, ReiterInhalt> warteschlangenLeiste: () => JSX.Element speicherHinweis?: () => JSX.Element /** Die ANWENDUNGSWEITE Meldungsflaeche, unmittelbar unter der Reiterleiste. */ meldungsFlaeche?: 

### #262  [anfuehrung]
ZITAT   : wenigstens den Reiter Projekte
NAECHSTE: Für die dritte Liste verweist er auf den Reiter **Projekte**:
KONTEXT : 1. **`App.tsx` ist der Kompositionswurzel-Punkt und darf als EINZIGE Renderer-Datei die Modul-Wurzeln als WERTE importieren.** *Begründung – und warum das E1 nicht bricht:* #197 hat für sich in Anspruch genommen, die einzige Datei **in `src/renderer/app-shell/`** zu sein, die aus einem anderen Renderer-Modul importiert. `src/renderer/App.tsx` liegt **nicht** in diesem Ordner. Und #244 verlangt die

### #262  [anfuehrung]
ZITAT   : Wohin gehen die Fehler aus `meldeFehler`?
NAECHSTE: Scheitert der Flush → `speicher_fehler` (9.4.9).
KONTEXT : 1. **`App.tsx` ist der Kompositionswurzel-Punkt und darf als EINZIGE Renderer-Datei die Modul-Wurzeln als WERTE importieren.** *Begründung – und warum das E1 nicht bricht:* #197 hat für sich in Anspruch genommen, die einzige Datei **in `src/renderer/app-shell/`** zu sein, die aus einem anderen Renderer-Modul importiert. `src/renderer/App.tsx` liegt **nicht** in diesem Ordner. Und #244 verlangt die

### #262  [blockzitat]
ZITAT   : „**Der Einsetzer ist `src/renderer/App.tsx` (#262)** – die einzige Datei, die den Reparaturhalter ohnehin holt (`reparaturhalter()`), daraus `umgebung.composerVerdrahtung` bildet und `reparaturhalter().aufLageGeaendert` abonniert. Wer die Lage schon hält, ist auch der Ort, an dem das Overlay dazu steht." (#256, ENTSCHIEDEN 11)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Der Einsetzer ist `src/renderer/App.tsx` (#262)** – die einzige Datei, die den Reparaturhalter ohnehin holt (`reparaturhalter()`), daraus `umgebung.composerVerdrahtung` bildet und `reparaturhalter().aufLageGeaendert` abonniert. Wer die Lage schon hält, ist auch der Ort, an dem das Overlay dazu steht." (#256, ENTSCHIEDEN 11) „**Es wird als GESCHWISTER von `<Rahmen …/>` eingesetzt, nicht in einen

### #262  [blockzitat]
ZITAT   : „**Es wird als GESCHWISTER von `<Rahmen …/>` eingesetzt, nicht in einen Schlitz.**" (#256, ENTSCHIEDEN 11)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Es wird als GESCHWISTER von `<Rahmen …/>` eingesetzt, nicht in einen Schlitz.**" (#256, ENTSCHIEDEN 11) *Warum kein Schlitz:* `RahmenEigenschaften` (#195) hat **genau vier** Einträge, und ein fünfter ist ausdrücklich verboten – das Verbot im STOPP-Block dieses Issues bleibt in **voller** Härte bestehen. Der vierte (`meldungsFlaeche`) gehört den **Meldungen** (ENTSCHIEDEN 7), nicht diesem Overla

### #265  [anfuehrung]
ZITAT   : 1. konfig + aktuelle schemaVersion nach `<Datenort>/config.json.tmp` schreiben
NAECHSTE: #### 9.5.5 `schemaVersion` & Migration Jede `project.json` und `config.json` trägt eine `schemaVersion`.
KONTEXT : **`schemaVersion` gehört NICHT in diesen Typ.** #31 schreibt sie beim Speichern hinzu – wörtlich: „1. konfig + aktuelle schemaVersion nach `<Datenort>/config.json.tmp` schreiben". Stünde sie auch im Datensatz, gäbe es zwei Quellen für dieselbe Zahl, und die Version im Speicher könnte von der geschriebenen abweichen, ohne dass etwas bricht.

### #265  [anfuehrung]
ZITAT   : mit sinnvollen Defaults (aktivesProjektId: null, …), OHNE Fehler
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Keine Defaults in dieser Datei.** #26 legt fest, was `leseKonfig` liefert, wenn `config.json` fehlt („mit sinnvollen Defaults (aktivesProjektId: null, …), OHNE Fehler"). Ein hier abgelegtes `STANDARD_KONFIG` wäre eine zweite Quelle dafür – und die Vorbelegung der `marke` hinge zusätzlich an #29 (`leseMarke`), das diese Datei nicht kennt. - **Keine

### #267  [anfuehrung]
ZITAT   : Diesen Schalter nicht anfassen und einen Verstoss nicht per
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Diesen Schalter nicht anfassen und einen Verstoss nicht per "skipLibCheck" wegdruecken (Issue #1, STOPP-Block) - stattdessen melden."

### #268  [anfuehrung]
ZITAT   : Verhalten beim Beenden
NAECHSTE: **`wennLeer`** bestimmt das Verhalten bei leerem Feld:
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen Dieser Block enthält **nur Verbote** – keine offene Frage. Alles, was hier einmal offen war, ist entschieden und steht im verbindlichen Teil (#3, „Entschieden beim Bauen" und „Verhalten beim Beenden"). Wer hier eine Rückfrage vermutet, liest einen veralteten Stand.

### #268  [anfuehrung]
ZITAT   : Verhalten beim Beenden
NAECHSTE: **`wennLeer`** bestimmt das Verhalten bei leerem Feld:
KONTEXT : - **Keine der übrigen dreizehn Lücken anfassen** (s. Invarianten). - **Kein Aufruf von `sofortFlush` direkt** – nur ueber `flushBeimBeenden()` (#47). Wer das Lock im Bootstrap selbst nimmt, verlagert eine Invariante des `project-store` an eine Stelle, die sie nicht bewachen kann. - **Keinen stillen Mittelweg beim Flush-Fehlschlag bauen**, bei dem der Fehler nur im Log landet. Wie der Fehlerzweig a

### #277  [anfuehrung]
ZITAT   : Es gibt **nur ein** D1-Schreib-Lock, und das gehört dem `project-store` und schützt **nur** `project.json`. Der `marken-store` hat seine **eigene** [Serialisierung] – wie der `vorlagen-store` (TK 9.12.1)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Warum das im Gesamtsystem wichtig ist Dies ist die **einzige** Stelle im ganzen Modul, die `fs` anfasst – Gegenstück zu `schreibeProjekt` (#46) für `project.json`, aber mit einem entscheidenden Unterschied: „Es gibt **nur ein** D1-Schreib-Lock, und das gehört dem `project-store` und schützt **nur** `project.json`. Der `marken-store` hat seine **eigene** [Serialisierung] – wie der `vorlagen-stor

### #277  [anfuehrung]
ZITAT   : durch #277 bereits gelöst
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Rename-mit-Ersetzen ist plattformabhängig.** Dieselbe offene Frage wie bei #31 (`config.json`), #46 (`project.json`), #69 (Queue-Dateien) und der `vorlagen-store`-Entsprechung (M4-04): Ob unter Windows bei `EBUSY`/`EPERM` ein Retry+Backoff nötig ist (wie beim Export, TK 9.6.2 entschieden), ist hier **nicht** festgelegt. **Falls dort bereits eine L

### #277  [anfuehrung]
ZITAT   : hier noch nicht geschrieben
NAECHSTE: `project.json` ist **nie** halb geschrieben.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Rename-mit-Ersetzen ist plattformabhängig.** Dieselbe offene Frage wie bei #31 (`config.json`), #46 (`project.json`), #69 (Queue-Dateien) und der `vorlagen-store`-Entsprechung (M4-04): Ob unter Windows bei `EBUSY`/`EPERM` ein Retry+Backoff nötig ist (wie beim Export, TK 9.6.2 entschieden), ist hier **nicht** festgelegt. **Falls dort bereits eine L

### #277  [anfuehrung]
ZITAT   : Auto-Speichern beim Bearbeiten + Ereignis
NAECHSTE: Push bei jeder Zustandsänderung → speist das queue-panel // Ereignis:
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Rename-mit-Ersetzen ist plattformabhängig.** Dieselbe offene Frage wie bei #31 (`config.json`), #46 (`project.json`), #69 (Queue-Dateien) und der `vorlagen-store`-Entsprechung (M4-04): Ob unter Windows bei `EBUSY`/`EPERM` ein Retry+Backoff nötig ist (wie beim Export, TK 9.6.2 entschieden), ist hier **nicht** festgelegt. **Falls dort bereits eine L

### #279  [anfuehrung]
ZITAT   : eine nicht abgeleitete Marke ist immer vollständig befüllt
NAECHSTE: die Werte selbst stehen wie bisher vollständig aufgelöst in der Marke.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ECHTE OFFENE FRAGE: Was passiert, wenn der gefundene Parent selbst `parent !== null` hat?** TK 9.11.2 sagt, das darf strukturell nie vorkommen – die Kettensperre sitzt in `erstelleMarke` (#284). Tritt es dennoch auf (Dateikorruption, ein Fehler in #284, ein manuell bearbeitetes `marken.json`), ist unklar, ob diese Funktion (a) den Parent so behand

### #280  [anfuehrung]
ZITAT   : gebündelt bleiben … das Fitnessworld24-Logo
NAECHSTE: für die gebündelten erledigt das der Start.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ECHTE OFFENE FRAGE: Bundle-Dateiname und `seitenverhaeltnis` des Fitnessworld24-Logos.** Anders als die vier Schriftdateien (bereits vorhanden, s. o.) existiert im Repository **noch keine** gebündelte Logo-Datei für `template-canvas` (`bereiteLogoVor`, M4-25, wirft heute noch „Noch nicht umgesetzt"; `tools/assets/logo.png` ist ein **Dokument-Brand

### #281  [anfuehrung]
ZITAT   : referenziert die gesuchte Marke nicht
NAECHSTE: Referenziert (ListItem zeigt darauf)?
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ECHTE OFFENE FRAGE, die zentrale dieses Issues: Wie und wann läuft diese Migration über ALLE Projekte – und wer schreibt das Ergebnis zurück?** Zwei grundverschiedene, beide plausible Herangehensweisen stehen offen, und TK 9.15.1/9.5.5 entscheiden nicht zwischen ihnen: 1. **Bulk-Migration beim App-Start**, analog zur Referenzprüfung `pruefeMarkenR

### #288  [anfuehrung]
ZITAT   : Der `project-store` ist Pfad-Autorität für **Projekt**-Daten (`projects/<id>/…`, TK 9.5.7); `marken-assets/` liegt **app-weit** neben `vorlagen.json`. Eine zweite Autorität für einen fremden Ordner wäre genau die Doppelung, die 9.5.7 ausschließt.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Warum das im Gesamtsystem wichtig ist „**Ablage neben den Daten, nicht im Programmordner.** `marken-assets/` liegt im Datenort (Abschnitt 6)." (TK 9.15.3) und „Die **importierten Dateien** dagegen in einem Ordner **je Marke** (`marken-assets/<marken-id>/`) – dasselbe Muster wie `projects/<id>/media/`." (TK Abschnitt 6) Genau weil das Muster demselben Prinzip folgt wie Projekt-Medien, liegt die 

### #289  [anfuehrung]
ZITAT   : Der Formatfilter des Dialogs und die Prüfung beim Import lesen **denselben** konstanten Wert
NAECHSTE: rab konvertieren. **Invariante:** Der Formatfilter des Dialogs (9.4.3) und die Prüfung beim Import lesen **denselben** konstanten Wert aus `contracts/types` — s
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Die Operations-Zeilen, wörtlich (TK 9.15.1): „`importiereMarkenDatei` | `markeId`, `art: "logo"\|"schrift"`, `schriftRolle?`, `quellPfad` → `Ergebnis<Marke>` (kopiert nach `marken-assets/<markeId>/`, 9.15.3)" / „`entferneMarkenDatei` | `markeId`, `art`, `schriftRolle?` → `Ergebnis<Marke>` – zurück auf den geerbten bzw. geb

### #291  [anfuehrung]
ZITAT   : Muss abgeschlossen sein, BEVOR ein Thumbnail, eine Vorschau oder ein Render entsteht. Erneut aufrufen nach jedem abgeschlossenen Import und bei jedem Projektwechsel.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : In dessen verbindlichem Ablauf ist es Schritt 5: „**`await stelleMarkenSchriftenBereit(marke)`** (#291). Diese Funktion **wirft**, wenn eine importierte Schrift-Datei hinter `marken://` fehlt oder ihr Format ungültig ist. Der Wurf wird **hier gefangen** und zu `{ ok: false, fehler: { code: MARKEN_DATEI_FEHLT, … } }`" (#312). Der **Zeitpunkt** ist **gebündelt und im Voraus**, nicht je Zeichenaufruf

### #291  [anfuehrung]
ZITAT   : dieselbe Klasse offener Fragen wie beim Aufwärm-Zeitpunkt der gebündelten Schriften in M4-16
NAECHSTE: *Nur `.woff2`, weil die gebündelten Schriften dasselbe Format haben:
KONTEXT : In dessen verbindlichem Ablauf ist es Schritt 5: „**`await stelleMarkenSchriftenBereit(marke)`** (#291). Diese Funktion **wirft**, wenn eine importierte Schrift-Datei hinter `marken://` fehlt oder ihr Format ungültig ist. Der Wurf wird **hier gefangen** und zu `{ ok: false, fehler: { code: MARKEN_DATEI_FEHLT, … } }`" (#312). Der **Zeitpunkt** ist **gebündelt und im Voraus**, nicht je Zeichenaufruf

### #294  [anfuehrung]
ZITAT   : **Marken-Kontext in die Zonen-Auflösung führen und den `logo === null`-Zweig einhängen** – beides in `zeichne-segment.ts`
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## DREI ÄNDERUNGEN, EIN ISSUE – warum `src/renderer/template-canvas/zeichne-segment.ts` (M4-23/#117) hat **einen** Eigentümer, und das ist dieses Issue. Drei M8-Bausteine brauchen eine Änderung genau in dieser Datei: der vierte Parameter (TK 9.15.4), der Dispatch auf das Ersatz-Logo (#293) und die Schrift-Prüfung vor dem Zeichnen (#291). Der Zuschnitt weist alle drei ausdrücklich hierher – wörtlic

### #294  [anfuehrung]
ZITAT   : **Warum der `logo === null`-Dispatch zu #294 wandert und kein eigenes Issue wird:** Beide Änderungen betreffen **dieselbe Datei** … Zwei Issues auf einer Datei sind genau die Doppelung, die dieser Zuschnitt vermeidet – das Datei-Eigentum bleibt bei einem Issue.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## DREI ÄNDERUNGEN, EIN ISSUE – warum `src/renderer/template-canvas/zeichne-segment.ts` (M4-23/#117) hat **einen** Eigentümer, und das ist dieses Issue. Drei M8-Bausteine brauchen eine Änderung genau in dieser Datei: der vierte Parameter (TK 9.15.4), der Dispatch auf das Ersatz-Logo (#293) und die Schrift-Prüfung vor dem Zeichnen (#291). Der Zuschnitt weist alle drei ausdrücklich hierher – wörtlic

### #294  [anfuehrung]
ZITAT   : `marke.name` ist eine leere Zeichenkette → wirft (Programmierfehler: `Marke.name` ist laut #52 Pflicht)
NAECHSTE: den **Markennamen** (`marke.name`) auf einer Fläche in der **Akzentfarbe der Marke**.
KONTEXT : *Warum diese Zeile mitgeändert werden MUSS:* `marke.logo` ist seit dem Edit an **#52** (= **#320**) `… | null`. Bliebe 4.a unverändert, wäre der Zugriff `marke.logo.datei` bei einer Marke ohne Logo ein Laufzeitfehler – und selbst mit einem `?.` davor wäre der Wert `undefined`, die Leer-Prüfung (4.b) schlüge an, und die Zone wäre nach 4.e **fertig**, bevor 4.f überhaupt erreicht wird. Der Dispatch 

### #294  [anfuehrung]
ZITAT   : Diese Datei liest `marke.logo` **nicht** (die Entscheidung ‚ist ein Ersatz nötig' trifft der Aufrufer, s. STOPP zu M4-23)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Diese Datei liest `marke.logo` – und `zeichneErsatzLogo` nicht.** #293 hält das in seiner DoD ausdrücklich fest: „Diese Datei liest `marke.logo` **nicht** (die Entscheidung ‚ist ein Ersatz nötig' trifft der Aufrufer, s. STOPP zu M4-23)". Die Fallunterscheidung ist damit hier – und nur hier.

### #294  [anfuehrung]
ZITAT   : **Zuallererst: Sind die Schriften da?** Liefert `sindSchriftenBereit()` `false`, wirft diese Funktion sofort einen `Error` – **bevor** ein Canvas erzeugt oder irgendetwas gezeichnet wird.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## ENTSCHIEDEN – die Schrift-Prüfung in Ablauf-Punkt 0 und was bei `false` geschieht Ablauf-Punkt 0 von M4-23 lautet heute: „**Zuallererst: Sind die Schriften da?** Liefert `sindSchriftenBereit()` `false`, wirft diese Funktion sofort einen `Error` – **bevor** ein Canvas erzeugt oder irgendetwas gezeichnet wird." Er bekommt **zwei** weitere Prüfungen, in dieser Reihenfolge, **vor** dem Erzeugen des

### #294  [anfuehrung]
ZITAT   : `zeichneSegment` (M4-23) ruft diese Abfrage vor dem Zeichnen ab und **wirft**, wenn sie `false` liefert
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Jede der drei Prüfungen wirft bei `false` sofort einen `Error`** – kein Ersatz, kein Rückfall auf eine gebündelte Schrift, kein leeres Canvas, kein Platzhalter, **kein** `Ergebnis<T>`. *Begründung, dreifach belegt:* - `zeichneSegment` ist **synchron** und kann nichts nachladen. Ein `await` an dieser Stelle machte aus einer synchronen eine asynchrone Funktion und bräche alle fünf Aufrufer (#310) 

### #294  [anfuehrung]
ZITAT   : jeder der **vier** bestehenden Aufrufer (`action-editor`/M5, `composer`-Thumbnails/M5, `preview-player`/M7, die Render-Vorbereitung/M6)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ERLEDIGT – nicht mehr melden: Die Erkennung `zone.id === 'hintergrund'` ist ENTSCHIEDEN.** Der Befund war: Ist der Name `hintergrund` eine geschützte Konstante oder nur eine Konvention? **Nachgeprüft in TK 9.11.1:** `Zone` führt `id: string` als **Pflichtfeld** des Vertrags („`id: string // "ueberschrift" | "motiv" | "preis" | "logo" …`" – die Auf

### #295  [anfuehrung]
ZITAT   : überarbeiten vs. ableiten
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Zwei Wahrheiten über dieselbe Marke.** Hielte jede Unterdatei ihre eigene Kopie der geöffneten Marke, zeigte die Farbfläche nach einem Schriftwechsel den alten Zustand, bis der Nutzer neu lädt – und ein Speicherfehler in #297 bliebe für #296 unsichtbar. 2. **Eingebaute Marke verwechselbar mit eigenständiger.** `Marke.eingebaut` und `Marke.parent` entscheiden, ob „löschen" (#302) und „überarbe

### #295  [anfuehrung]
ZITAT   : **Die Regel: nach `leiteMarkeAb` und `bestaetigeLoeschen` nachladen, nach `erstelleEigenstaendigeMarke` nicht.**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Diese Datei ist die gemeinsame Marken-Sicht des Renderers**, analog zur Vorlagen-Übersicht des `vorlagen-editor` (TK 9.12.2, dortige Umsetzung). Sie wird **nicht** über IPC-Ereignisse aktuell gehalten: `marken-editor` ist der einzige Renderer-Nutzer der Marken-Bearbeitung, und der `marken-store` hat für Änderungen aus der eigenen Sitzung **kein** Ereignis vorgesehen – `marken:autoSpeichernSta

### #296  [anfuehrung]
ZITAT   : Warum { geerbt: true } statt // null als Sentinel
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #285 – src/main/marken-store/bearbeite-marke.ts (Main; DEFINIERENDE QUELLE, nur über den Kanal // erreichbar). Der reale Vertrag ist reicher als eine einfache Teilmenge: ein Feld kann EIGEN // GESETZT (der Fachwert), AN DEN PARENT ZURÜCKGEGEBEN (Sentinel `{ geerbt: true }`) oder – als // fehlender Schlüssel im umgebenden Objekt – UNVERÄNDERT sein (#285, „Warum { geerbt: true } statt // null als

### #296  [anfuehrung]
ZITAT   : bei // farben/schriften: nur die genannte Rolle, die übrigen Rollen des Objekts bleiben unangetastet
NAECHSTE: Die gespeicherten Importe bleiben **roh/unangetastet**.
KONTEXT : // #285 – src/main/marken-store/bearbeite-marke.ts (Main; DEFINIERENDE QUELLE, nur über den Kanal // erreichbar). Der reale Vertrag ist reicher als eine einfache Teilmenge: ein Feld kann EIGEN // GESETZT (der Fachwert), AN DEN PARENT ZURÜCKGEGEBEN (Sentinel `{ geerbt: true }`) oder – als // fehlender Schlüssel im umgebenden Objekt – UNVERÄNDERT sein (#285, „Warum { geerbt: true } statt // null als

### #297  [anfuehrung]
ZITAT   : Schrift-Rollen anzeigen und Schrift importieren
NAECHSTE: Bestimmt Logo, Schriften und Farb-Rollen akzentfarbe:
KONTEXT : 1. **Die Anzeige liest ausschließlich `Marke.schriften[rolle].herkunft`.** Es gibt **keine** zweite Quelle dafür, ob eine Schrift importiert ist – die aufgelöste Marke trägt das Feld bereits (TK 9.11.2: `Schrift { familie, gewicht, datei, herkunft }`). `baueSchriftAnzeige` ist eine reine Funktion ohne IPC-Aufruf; sie arbeitet auf der **bereits geladenen** Marke aus #295. 2. **`importiereSchrift` l

### #299  [anfuehrung]
ZITAT   : Diese Funktion liefert – wie von TK 9.15.1 verbindlich vorgeschrieben – **nur** die vollständig aufgelöste `Marke`. Aus ihr ist **nicht** rekonstruierbar, welche Felder eigen und welche geerbt sind: ein geerbter und ein selbst gesetzter Wert sehen danach identisch aus. Die Operationstabelle (TK 9.15.1) kennt **keine** zweite Leseoperation, die den unaufgelösten Zustand liefert.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Diese Funktion liefert – wie von TK 9.15.1 verbindlich vorgeschrieben – **nur** die vollständig aufgelöste `Marke`. Aus ihr ist **nicht** rekonstruierbar, welche Felder eigen und welche geerbt sind: ein geerbter und ein selbst gesetzter Wert sehen danach identisch aus. Die Operationstabelle (TK 9.15.1) kennt **keine** zweite Leseoperation, die den unaufgelösten Zustand liefert." (#283, wortgleich

### #299  [blockzitat]
ZITAT   : „Diese Funktion liefert – wie von TK 9.15.1 verbindlich vorgeschrieben – **nur** die vollständig aufgelöste `Marke`. Aus ihr ist **nicht** rekonstruierbar, welche Felder eigen und welche geerbt sind: ein geerbter und ein selbst gesetzter Wert sehen danach identisch aus. Die Operationstabelle (TK 9.15.1) kennt **keine** zweite Leseoperation, die den unaufgelösten Zustand liefert." (#283, wortgleich sinngemäß in #282)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Diese Funktion liefert – wie von TK 9.15.1 verbindlich vorgeschrieben – **nur** die vollständig aufgelöste `Marke`. Aus ihr ist **nicht** rekonstruierbar, welche Felder eigen und welche geerbt sind: ein geerbter und ein selbst gesetzter Wert sehen danach identisch aus. Die Operationstabelle (TK 9.15.1) kennt **keine** zweite Leseoperation, die den unaufgelösten Zustand liefert." (#283, wortgleich

### #300  [anfuehrung]
ZITAT   : Übernimmt eine von #296/24/25/26/27/34/35 erfolgreich geschriebene Marke …
NAECHSTE: Erst nach erfolgreichem Schreiben verschwindet der Hinweis.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ERLEDIGT – nicht mehr melden: Die Übersicht lädt die Editor-Wurzel nach, und `uebernimmAktualisierteMarke` gehört nicht hierher.** Der Befund war doppelt: (a) `oeffneMarke` (#295) aktualisiert **nur** die geöffnete Marke, **nicht** die Listen-Übersicht – ohne einen zusätzlichen Aufruf zeigte die Marken-Liste die neue Marke erst nach der nächsten, 

### #300  [anfuehrung]
ZITAT   : **Nach `leiteMarkeAb` und nach `bestaetigeLoeschen` ruft diese Datei `marken.lade()`.** Beide ändern den **Bestand**, nicht ein Feld, und laufen deshalb **nicht** über `uebernimmAktualisierteMarke` (#295).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ERLEDIGT – nicht mehr melden: Die Übersicht lädt die Editor-Wurzel nach, und `uebernimmAktualisierteMarke` gehört nicht hierher.** Der Befund war doppelt: (a) `oeffneMarke` (#295) aktualisiert **nur** die geöffnete Marke, **nicht** die Listen-Übersicht – ohne einen zusätzlichen Aufruf zeigte die Marken-Liste die neue Marke erst nach der nächsten, 

### #301  [anfuehrung]
ZITAT   : Würde jede Stelle ihre eigene Kontrastformel schreiben, liefe früher oder später eine Konstellation durch, bei der der Editor eine Farbkombination als „ausreichend" durchwinkt, während dieselbe Rechnung im Canvas [beim Ersatz-Logo, #293] zu einer anderen Textfarben-Entscheidung käme.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Die teure lokale Entscheidung liegt **nicht** in der UI, sondern darin, die Rechnung **nicht ein zweites Mal zu bauen**. #292 begründet das ausdrücklich: „Würde jede Stelle ihre eigene Kontrastformel schreiben, liefe früher oder später eine Konstellation durch, bei der der Editor eine Farbkombination als „ausreichend" durchwinkt, während dieselbe Rechnung im Canvas [beim Ersatz-Logo, #293] zu eine

### #301  [anfuehrung]
ZITAT   : **Kein** exportierter `KONTRAST_SCHWELLENWERT` in dieser Datei.
NAECHSTE: Ohne einen **Weg dorthin** bliebe es bei dieser Information:
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Kontrast-Warnung (FA-24):** Der Editor berechnet den Kontrast zwischen Akzentfläche und dem darauf liegenden Text und **warnt sichtbar**, ohne die Wahl zu verhindern." (TK 9.15.2) - „Die Akzentfarbe ist seit FA-24 ein freier Wert, damit Partner-Hausfarben darstellbar sind – ein Schwellenwert machte genau die unbrauchbar

### #301  [anfuehrung]
ZITAT   : **Der Kontrast-Schwellenwert wird importiert, nicht geschrieben.** `KontrastWarnungProps.schwellenwert` ist ein Pflicht-Prop ohne Vorgabewert (#301) […] Diese Datei liest **ausschließlich** die Konstante aus `src/shared/contracts/konstanten.ts` und schreibt die Zahl **nirgends** selbst hin
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Was das für DIESE Datei heißt – der Vertrag ändert sich NICHT:** `KontrastWarnungProps.schwellenwert` und der zweite Parameter von `ermittleKontrastHinweis` bleiben **Pflicht ohne Vorgabewert**, und **diese Datei importiert `KONTRAST_SCHWELLE` NICHT**. Geliefert wird der Wert von der **Wurzel-Komponente des Marken-Editors (#330)**, die die Konstante als einzige liest und als Prop hereinreicht – 

### #301  [anfuehrung]
ZITAT   : **Blockiert:** #295 (Grundgerüst des Editors bindet diesen Hinweis in die Farb-Rollen-Bearbeitung ein, #296)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Abhängigkeiten - Blockiert von: **#292** (`kontrastVerhaeltnis`/`erreichtKontrastSchwelle`, bereits geschrieben), M1-40/#52 (`Marke`-Vertrag, `farben`-Feld, TK 9.11.2) - **Nicht** blockiert von **#320**: Diese Datei importiert `KONTRAST_SCHWELLE` nicht. Die Konstante entsteht dort und wird von **#330** gelesen; erst dessen Rendering braucht sie. - Blockiert: **#330** (die Editor-Wurzel `src/ren

### #302  [anfuehrung]
ZITAT   : bei Treffern in EINER DER DREI Listen -> fehler.code = 'marke_referenziert' mit fehler.daten = Markennutzung (also { aktionen: MarkenReferenz[], abgeleiteteMarken: AbgeleiteteMarkenReferenz[], standardInProjekten: StandardmarkenReferenz[] })
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - „**Löschen fragt vorher.** Vor `löscheMarke` zeigt der Editor das Ergebnis von `pruefeMarkenReferenzen`: welche Aktionen in welchen Projekten, welche abgeleiteten Looks und **welche Projekte die Marke als Standardmarke führen** (alle drei Listen, 9.15.1). Für die dritte Liste verweist er auf den Reiter **Projekte**: Dort –

### #302  [anfuehrung]
ZITAT   : **Blockiert:** #295 (Grundgerüst des Editors bindet die Löschbestätigung mit dieser Vorschau ein)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Abhängigkeiten - Blockiert von: **#275** (`Markennutzung`/`MarkenReferenz`/`AbgeleiteteMarkenReferenz`/`StandardmarkenReferenz`, bereits geschrieben), **#286** (`pruefeMarkenReferenzen`, erhebt alle drei Listen, bereits geschrieben), **#287** (`löscheMarke`, sperrt auf allen drei Listen, bereits geschrieben), **#304** (die beiden Kanäle `marken:pruefeMarkenReferenzen`/`marken:loescheMarke` müss

### #303  [anfuehrung]
ZITAT   : **Blockiert:** #295 (bindet diese Vorschau in den Editor-Bildschirm ein)
NAECHSTE: - **Löschen blockiert bei Referenz**, es kaskadiert **nicht** – wie bei den Vorlagen (9.12.1).
KONTEXT : ## Abhängigkeiten - Blockiert von: **M4-23** (`zeichneSegment`/`SegmentBild`), **#294** (ergaenzt den vierten Parameter `rahmenMarke` an genau dieser Funktion), **#275/#276**/M1-40 (`Marke`), Aktion-Vertrag (#14/M1-02), Vorlage-Vertrag (TK 9.11.1) - **Mittelbar blockiert von #315** (s. STOPP): Die korrekte **Anzeige** für jede nicht eingebaute Marke hängt an der Erweiterung von **#119**/M4-25 (`ho

### #304  [anfuehrung]
ZITAT   : `marken:öffneMarkenDateiDialog` (angemeldet in #304)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **NACHTRAG (10.08.) – der NEUNTE Instant-Kanal `marken:öffneMarkenDateiDialog`.** Die erste Fassung dieses Issues führte **acht** Instant-Kanäle und schloss einen neunten ausdrücklich aus. Das war ein Widerspruch zu **vier** anderen Issues: **#306** baut `öffneMarkenDateiDialog` und hält fest, dass die Verdrahtung „in **#304**" geschieht; **#297** und **#298** rufen den Kanal wörtlich als „`marken

### #304  [anfuehrung]
ZITAT   : ANGENOMMENE Form, #278 // existierte noch nicht
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #278 – src/main/marken-store/speicher-status.ts (DEFINIERENDE QUELLE; die Datei EXISTIERT und // stimmt mit dem Folgenden zeichengleich überein – der frühere Vorbehalt „ANGENOMMENE Form, #278 // existierte noch nicht" ist am 10.08. gegengeprüft und aufgehoben. Baugleich zu #47/#98, mit // eigenem Namen, weil "ein anderer Name, weil ein zweiter gleichnamiger Export im selben Projekt // bei einem

### #304  [anfuehrung]
ZITAT   : #76 hat die schärfere Prüfung (UUID-Form, kein `/`, kein `\`, kein `..`) ausdrücklich **nur** für `project:listeAusgaben` eingeführt, weil dessen `projektId` am Ende der Kette zu einem **Pfadsegment** wird.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **ENTSCHIEDEN – keine UUID-Formprüfung.** Alle `markeId`-Felder werden nur auf „nicht leerer String" geprüft, genau wie `elementId`/`referenz` in M5-34 – dieselbe Begründung: „#76 hat die schärfere Prüfung (UUID-Form, kein `/`, kein `\`, kein `..`) ausdrücklich **nur** für `project:listeAusgaben` eingeführt, weil dessen `projektId` am Ende der Kette zu einem **Pfadsegment** wird." Keine `markeId` 

### #304  [anfuehrung]
ZITAT   : project und vorlagen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **ERLEDIGT – die zwei Bootstrap-Zeilen sind vergeben, hier ist nichts mehr zu melden.** Sie gehören **#309**, das `src/main/index.ts` ohnehin als Einziges in ganz M8 öffnet (eine Datei, ein Eigentümer; alle M8-Einträge in den Bootstrap stehen damit an **einer** Stelle). Dort steht verbindlich: `verdrahteMarkenIPC()` als **elfte** Anmeldung der Gruppe „ohne Fenster", ans Ende hinter `meldeExportHan

### #305  [anfuehrung]
ZITAT   : dem Auftraggeber zu melden, nicht selbst anzulegen
NAECHSTE: keiner von beiden rechnet selbst.
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **ERLEDIGT – nicht mehr melden, nicht mehr fragen: Der Marken-Editor bekommt einen FÜNFTEN Reiter [Marken].** Hier stand bis zum 10.08. eine offene Frage („fünfter Reiter oder Unterbereich des Reiters Vorlagen?"). Sie ist **seit TK v3.6 entschieden** (9.14.1) und im Briefing als Punkt 3 von Abschnitt 3a geführt: „**Der `marken-editor` sitzt in einem

### #305  [blockzitat]
ZITAT   : „Module **außerhalb** dieses Ordners importieren die Sicht **nicht** direkt; sie bekommen die Aktualisierungsfunktion als **Parameter** übergeben. Wer sie beim Aufbau der Oberfläche durchreicht, ist Sache der `app-shell` (M7) und ausdrücklich **nicht** Teil von M5." (#155, ENTSCHIEDEN 1, zitiert in M7-04)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Module **außerhalb** dieses Ordners importieren die Sicht **nicht** direkt; sie bekommen die Aktualisierungsfunktion als **Parameter** übergeben. Wer sie beim Aufbau der Oberfläche durchreicht, ist Sache der `app-shell` (M7) und ausdrücklich **nicht** Teil von M5." (#155, ENTSCHIEDEN 1, zitiert in M7-04) #295 (die Marken-Übersicht selbst) benennt dieses Issue bereits **namentlich** als den vorges

### #306  [anfuehrung]
ZITAT   : nur die erste Datei behalten
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Nicht selbst entscheiden – STOPP und fragen - **Verbot – Abbruch ist niemals ein Fehler.** Kein `nicht_gefunden`, kein `ungueltige_eingabe`, kein eigens erfundener Code `abgebrochen`. Das Bauvorbild ist hier eindeutig (TK 9.4.3), und der Aufrufer **#326** ist ebenso darauf geschrieben wie die beiden Import-Funktionen (#297, #298), an die er weiterreicht. - **Verbot – keine Endungs-Literale.** K

### #307  [anfuehrung]
ZITAT   : text ändern, aktiv lassen
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Erstens: eine „partielle" Slogan-Schreibung.** Anders als `farben` und `schriften`, die der Store **rollenweise** mischt, ist `slogan` **ein** Feld mit **einem** Wert – dem Objekt `{ text, aktiv }`. `MarkenTeilwerte.slogan` ist deshalb `MarkenFeld<{ text: string; aktiv: boolean }>` und **nicht** `Partial<…>` (#285). Schickte diese Datei nur `{ text: 'neu' }`, wäre das nicht „text ändern, aktiv l

### #309  [anfuehrung]
ZITAT   : LUECKE 1: sofortFlush(projekt) - #47
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Dasselbe gilt für den Beenden-Ablauf, und er ist gebaut.** Der Kopfkommentar der Datei sagt wörtlich: „STAND HEUTE: Gebaut sind die beiden Protokoll-Registrierungen (#9, Schritt 1 und 4). Von den dreizehn Anmeldungen, den beiden Beenden-Funktionen und der Einzel-Instanz-Sperre existiert KEINE EINZIGE - sie entstehen erst in M1 bis M7." Die **Vorrichtung** dafür steht aber: `app.on` (`"before-qui

### #309  [anfuehrung]
ZITAT   : LUECKE 2: flushBestand() - #98
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Dasselbe gilt für den Beenden-Ablauf, und er ist gebaut.** Der Kopfkommentar der Datei sagt wörtlich: „STAND HEUTE: Gebaut sind die beiden Protokoll-Registrierungen (#9, Schritt 1 und 4). Von den dreizehn Anmeldungen, den beiden Beenden-Funktionen und der Einzel-Instanz-Sperre existiert KEINE EINZIGE - sie entstehen erst in M1 bis M7." Die **Vorrichtung** dafür steht aber: `app.on` (`"before-qui

### #309  [anfuehrung]
ZITAT   : Schritt 2 ist jetzt das Marken-Schema
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Die Schrittnummern 1 bis 8 des bestehenden Ablaufs bleiben unverändert.** Die vier Einträge des **Startablaufs** stehen **innerhalb** vorhandener Schritte – Einmal-Aufruf in Schritt 1, Handler in Schritt 4, `verdrahteMarkenIPC()` am Ende von Schritt 5, `verdrahteMarkenSpeicherstatusIPC(fenster)` am Ende von Schritt 7 (s. Signatur-Block) –, **keine** neuen Schritte. Eine Umnummerierung („Schritt 

### #309  [anfuehrung]
ZITAT   : Aufrufer: Main-Bootstrap (#3) beim Beenden der App.
NAECHSTE: kein Aufrufer sieht je eine Teilmenge.
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Der Anmeldezeitpunkt, wörtlich (TK 9.15.3): „**Das Protokoll heißt `marken://<markeId>/<dateiname>` (v3.6, entschieden).** Gleiche Bauart und gleiche Schutzregeln wie `media://` (9.5.7): **nur lesend**, kein `..`-Ausbruch, keine absoluten Pfade im Renderer; die `markeId` steht an derselben Stelle, an der dort die `projektI

### #309  [anfuehrung]
ZITAT   : Beide Aufrufe werden EINZELN ABGEWARTET, bevor das Fenster geschlossen und der Prozess beendet wird
NAECHSTE:  aber sofort die Fragen mit, wer den Abbruch auslösen darf und was ein geschlossenes Fenster während eines laufenden Auftrags bedeutet. Käme später ein zweites 
KONTEXT : ## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt) - Der Anmeldezeitpunkt, wörtlich (TK 9.15.3): „**Das Protokoll heißt `marken://<markeId>/<dateiname>` (v3.6, entschieden).** Gleiche Bauart und gleiche Schutzregeln wie `media://` (9.5.7): **nur lesend**, kein `..`-Ausbruch, keine absoluten Pfade im Renderer; die `markeId` steht an derselben Stelle, an der dort die `projektI

### #309  [anfuehrung]
ZITAT   : OFFENER WIDERSPRUCH - hier bewusst NICHT aufgeloest
NAECHSTE: Preis, bewusst in Kauf genommen:
KONTEXT : **Entschieden:** Die Module liefern ihre Schema-Beschreibung als **Daten** (`MEDIA_SCHEMA`, `MARKEN_SCHEMA`), und **der Bootstrap ruft die API genau einmal** mit dem Array auf. `registriereMediaProtokollSchema()` (#9) und `registriereMarkenAssetsSchema()` (#290) **entfallen**; die **Handler**-Funktionen bleiben unverändert Funktionen, für sie gilt der Zwang nicht. *Begründung, die nicht verloren g

### #309  [anfuehrung]
ZITAT   : weil es doch schon entschieden ist
NAECHSTE: Das ist hiermit entschieden.
KONTEXT : **Entschieden:** Die Module liefern ihre Schema-Beschreibung als **Daten** (`MEDIA_SCHEMA`, `MARKEN_SCHEMA`), und **der Bootstrap ruft die API genau einmal** mit dem Array auf. `registriereMediaProtokollSchema()` (#9) und `registriereMarkenAssetsSchema()` (#290) **entfallen**; die **Handler**-Funktionen bleiben unverändert Funktionen, für sie gilt der Zwang nicht. *Begründung, die nicht verloren g

### #309  [anfuehrung]
ZITAT   : ist überhaupt etwas geändert worden?
NAECHSTE: ein Balken ohne Kontext lässt offen, ob überhaupt etwas passiert.
KONTEXT : **Entschieden:** Die Module liefern ihre Schema-Beschreibung als **Daten** (`MEDIA_SCHEMA`, `MARKEN_SCHEMA`), und **der Bootstrap ruft die API genau einmal** mit dem Array auf. `registriereMediaProtokollSchema()` (#9) und `registriereMarkenAssetsSchema()` (#290) **entfallen**; die **Handler**-Funktionen bleiben unverändert Funktionen, für sie gilt der Zwang nicht. *Begründung, die nicht verloren g

### #310  [anfuehrung]
ZITAT   : fest in der Vorlage hinterlegten Text
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **ERLEDIGT – nicht mehr melden: `SegmentProps.rahmenMarke` befüllt #313.** Dieses Issue führt das Pflicht-Feld ein, aber die beiden Aufrufer von `Segment` liegen **außerhalb** seines Dateibereichs: `Split` (**#218** / M7-25, `preview-player/split.tsx`) und `Einblendung` (**#219** / M7-26, `preview-player/einblendung.tsx`). Beide führen heute nur `marke: Marke` und reichen es „**unverändert** an 

### #310  [anfuehrung]
ZITAT   : genau ein Aufruf von `zeichneSegment`
NAECHSTE: kein Aufrufer sieht je eine Teilmenge.
KONTEXT : - [ ] **#128:** `zeichneSegment` wird mit **vier** Argumenten gerufen; das vierte ist **`toBe`-gleich** zum dritten (Test mit Spion auf `zeichneSegment`) - [ ] **#134, Segment-Zweig:** viertes Argument **`toBe`-gleich** zum dritten (Spion) - [ ] **#134, Band-Zweig:** viertes Argument ist **`toBe`-gleich** zur Marke, die das `stelleMarkeBereit`-Doppel geliefert hat, und **nicht** gleich `marke` (Te

### #311  [anfuehrung]
ZITAT   : **eigenständigen Nachtrag**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Dieses Issue ist ein EDIT an drei bereits abgenommenen Dateien. Es legt keine neue Datei an.** Es ist der Nachtrag, den **#305** in seinem VERMERK ausdrücklich als „**eigenständigen Nachtrag**" gemeldet hat, weil #305 sich den Zugriff auf `sichten.ts` selbst verboten hat („fremde, bereits abgeschlossene Datei").

### #311  [anfuehrung]
ZITAT   : Die gemeinsamen Sichten einmal aufbauen und durchreichen
NAECHSTE: Dann wäre nicht einmal der *Ersatz* zeichenbar.
KONTEXT : - Modul: `app-shell` (Renderer) - Dateien dieses Issues (+ jeweils zugehörige Testdatei) – **alle bestehend**: 1. `src/renderer/app-shell/sichten.ts` — Ursprungs-Issue **#197** (M7-04, „Die gemeinsamen Sichten einmal aufbauen und durchreichen"). Führt heute `marke: Marke` und füllt es in Schritt 1 von `baueSichten()` über `config:leseMarke`. 2. `src/renderer/app-shell/inhalte-zugaenge.ts` — Urspru

### #311  [anfuehrung]
ZITAT   : **Gezeichnet wird mit `p.marke`**
NAECHSTE: Gezeichnet wird das **Ersatz-Logo** (9.10.10) aus Markenname und Akzentfarbe;
KONTEXT : | Stelle | Issue / Datei | Was dort steht | In diesem Issue? | |---|---|---|---| | `Sichten.marke: Marke` + Schritt 1 von `baueSichten()` | **#197**, `app-shell/sichten.ts` | die **Quelle** des Werts | **JA** | | `Reiterzugaenge.marke: Marke` in `verteileZugaenge` | **#244**, `app-shell/inhalte-zugaenge.ts` | reine Weiterreichung | **JA** | | Erläuterung zu Bootstrap-Schritt 1 | **#260**, `app-she

### #311  [anfuehrung]
ZITAT   : `p.marke` … wird **unverändert** an M7-38 weitergereicht
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : | Stelle | Issue / Datei | Was dort steht | In diesem Issue? | |---|---|---|---| | `Sichten.marke: Marke` + Schritt 1 von `baueSichten()` | **#197**, `app-shell/sichten.ts` | die **Quelle** des Werts | **JA** | | `Reiterzugaenge.marke: Marke` in `verteileZugaenge` | **#244**, `app-shell/inhalte-zugaenge.ts` | reine Weiterreichung | **JA** | | Erläuterung zu Bootstrap-Schritt 1 | **#260**, `app-she

### #311  [anfuehrung]
ZITAT   : Marken kommen später nach
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Das Feld heißt `marken` (Mehrzahl), nicht `marke`.** Es ist kein Wert mehr, sondern ein Zugang auf einen Bestand – benannt wie seine beiden Geschwister `vorlagen: VorlagenZugang` und `zeichnen: ZeichenZugang`. *Begründung:* Ein gleich benanntes Feld mit geändertem Typ ließe jeden bestehenden Lesezugriff `p.marke.farben…` **zur Übersetzungszeit** anders scheitern als er soll – und ein Umbenenn

### #311  [anfuehrung]
ZITAT   : die Übersicht erneut lädt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Das Feld heißt `marken` (Mehrzahl), nicht `marke`.** Es ist kein Wert mehr, sondern ein Zugang auf einen Bestand – benannt wie seine beiden Geschwister `vorlagen: VorlagenZugang` und `zeichnen: ZeichenZugang`. *Begründung:* Ein gleich benanntes Feld mit geändertem Typ ließe jeden bestehenden Lesezugriff `p.marke.farben…` **zur Übersetzungszeit** anders scheitern als er soll – und ein Umbenenn

### #311  [anfuehrung]
ZITAT   : `rufeAuf<Marke>(KANAELE.config.leseMarke)` – ohne Nutzlast.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ### Der Ablauf von `baueSichten` (verbindlich – ersetzt Schritt 1 aus #197) 1. **`await baueMarkenZugang()`** (#305). `ok: false` → Code **unverändert** zurückgeben; **kein** `ladeUebersicht`, **keine** Sichten. *(Bisher, #197: „`rufeAuf<Marke>(KANAELE.config.leseMarke)` – ohne Nutzlast." Dieser Aufruf wird **gelöscht**, nicht umgebogen: Die Operation `leseMarke` steht nicht mehr in der Operations

### #312  [anfuehrung]
ZITAT   : Ein abgelehntes Promise wird **NICHT** gemerkt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Zwei Funktionen, asynchron und synchron – dasselbe Muster wie bei Motiven (#111) und Logo (#119).** `zeichneSegment` ist **synchron** und darf nicht `await`en; wer zeichnet, muss die Marke also schon haben. Deshalb: `stelleMarkeBereit(markeId)` (asynchron, beschafft und bereitet vor) und `holeBereiteMarke(markeId)` (synchron, schlägt nur nach). Eine einzige asynchrone Funktion zwänge jeden Ze

### #312  [anfuehrung]
ZITAT   : Wirft NIE wegen eines Ladefehlers – ein nicht ladbares Logo landet als `{ zustand: 'fehlt' }` im Bestand
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Warum die Prüfung in Schritt 6 nötig ist, obwohl `bereiteLogoVor` nie wirft:** #119 ist ein Lader, kein Torwächter („Wirft NIE wegen eines Ladefehlers – ein nicht ladbares Logo landet als `{ zustand: 'fehlt' }` im Bestand", M4-25). Ohne die Prüfung ginge eine Marke mit fehlender Logo-Datei als „bereit" durch, und `zeichneSegment` malte an der festen Logo-Zone den Platzhalter – in jedem Segment d

### #313  [anfuehrung]
ZITAT   : es bleibt exakt so, wie es hereinkommt
NAECHSTE: Diese Frage bleibt **ungestellt**, solange es nur ein Fenster gibt.
KONTEXT : | Issue | Was DORT passiert | Was HIER passiert | |---|---|---| | **#310** | Die **fünf `zeichneSegment`-Aufrufer** bekommen das **vierte Argument** `rahmenMarke`: `thumbnails.ts` (#128), `render-ausloesen.ts` (#134), `live-vorschau.ts` (#140), `editor-vorschau.ts` (#150), `segment.tsx` (#217). Das **dritte** Argument (`marke`) bleibt dort **unangetastet** – „es bleibt exakt so, wie es hereinkommt

### #313  [anfuehrung]
ZITAT   : es darf gezeichnet werden
NAECHSTE: er hat das Band damit gezeichnet.
KONTEXT : ### 1. `Zeichenvoraussetzungen.marke` fällt ERSATZLOS weg ```ts export interface Zeichenvoraussetzungen { vorlagen: readonly Vorlage[] } ``` *Begründung:* Es gibt keinen Wert, der an die Stelle treten könnte. Jede Marke, die man dort hinterlegte – die eingebaute, die des Projekts, die der ersten Aktion –, wäre wieder die Behauptung „es gibt **die** Marke", die FA-23 abgeschafft hat, und sie würde 

### #313  [anfuehrung]
ZITAT   : `Segment` nicht rendern
NAECHSTE: Sonst `keine_ausgabe` (erst rendern bzw.
KONTEXT : | Eingang | Bedeutung | Grenzen/Validierung | |---|---|---| | `projekt` (`bereiteZeichnenVor`) | das geladene Projekt | liefert **beide** neuen Mengen: `aktionen[].markeId` und `standardMarkeId`; das Objekt wird **nicht** verändert | | `abschnittMarke` (#218/#219) | die aufgelöste Marke der sichtbaren Band-Aktion | `null` erlaubt und bedeutet „`Segment` nicht rendern"; **keine** Prüfung, ob sie zu

### #313  [anfuehrung]
ZITAT   : **MELDEN, nicht beheben: `#250` (M7-57) hat keine Markenwahl und bricht nach diesem Issue beim Übersetzen.** Die Modul-Wurzel des `action-editor` ordnet als Bearbeitungsfelder „Titel, Beschreibung, Preis, CTA, Standarddauer, Vorlagenwahl, Bildwahl, Akzentfarbe" an – **keine** Markenwahl – und ruft `leererEntwurf` mit **zwei** Argumenten. Nach diesem Issue verlangt `leererEntwurf` **drei**.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **ECHTE OFFENE FRAGE: Gegen WELCHE Marke zeichnet der `vorlagen-editor`?** Er ist **app-weit** und ohne offenes Projekt voll benutzbar (TK 9.14.2); `VorlagenEditorWurzelProps` führt ausdrücklich **keinen** Projektzugang (#244, ENTSCHIEDEN 6). Es gibt dort also weder eine Aktion mit `markeId` noch eine `Project.standardMarkeId`. Zugleich ist die Frage seit TK v3.6 **nicht mehr gleichgültig**: `Ma

### #313  [anfuehrung]
ZITAT   : [action-editor] Ein Weg, `Aktion.markeId` zu setzen
NAECHSTE: `aktion.markeId`;
KONTEXT : - Blockiert von: **#312** (`stelleMarkeBereit`/`holeBereiteMarke` – ohne sie gibt es keine Marke), **#311** (nimmt `Sichten.marke`/`Reiterzugaenge.marke` weg; liefe dieses Issue zuerst, stünden die Wurzeln kurzzeitig ohne Prop **und** mit einer Quelle da, die sie nicht mehr lesen), **#310** (führt `SegmentProps.rahmenMarke` ein – dieses Issue befüllt es), **Edit an #14** (= **#320**) (`Aktion.mark

### #314  [anfuehrung]
ZITAT   : REITER_MIT_LEERZUSTAND enthält genau ['zusammenstellen', 'aktionen']
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #198 – src/renderer/app-shell/leerzustand-regel.ts (UNVERAENDERT, nur zur Abgrenzung) export function zeigtLeerzustand(reiter: ReiterId, projektOffen: boolean): boolean export const REITER_MIT_LEERZUSTAND: readonly ReiterId[] // „REITER_MIT_LEERZUSTAND enthält genau ['zusammenstellen', 'aktionen']" (#198, DoD). // Damit liefert zeigtLeerzustand('marken', false) bereits false – NICHTS zu tun.

### #314  [anfuehrung]
ZITAT   : Spione auf allen sechs Wurzeln
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : *Für die Umsetzung heißt das unverändert:* Der Parameter `wurzeln.markenEditor` ist typmäßig Pflicht und in den Tests mit einer Attrappe zu belegen – **genau wie die fünf anderen Wurzeln**, die #244 ebenfalls nie importiert (`ModulWurzeln` trägt danach **sechs** Felder, s. die Signatur oben und die DoD-Zeile „Spione auf allen sechs Wurzeln"); die echte Wurzel aus #330 wird hier **nicht** importier

### #314  [anfuehrung]
ZITAT   : genau vier Schlüssel
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - [ ] Die Reiterleiste zeigt **fünf** Knöpfe in der Reihenfolge aus `REITER_REIHENFOLGE`; der vierte trägt die Beschriftung **„Marken"**; ein Klick darauf ruft `wechsleReiter('marken')` (Spion) – **ersetzt** den DoD-Punkt „vier Knöpfe" aus #195 - [ ] `RahmenEigenschaften` hat weiterhin **genau drei** Schlitze neben `inhalte` (Grep-/Typprobe); es ist **kein** vierter dazugekommen - [ ] `baueReiterI

### #314  [blockzitat]
ZITAT   : „**Verbot – der Reiter [Marken] wird hier nicht angelegt.** Der fünfte Reiter (TK 9.14.1, v3.6) ist Sache von `reiter.ts` (#194) und `inhalte.tsx` (#244); diese drei Dateien führen **keine** Reiter-Liste und bekommen auch keine." (#311, STOPP)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Verbot – der Reiter [Marken] wird hier nicht angelegt.** Der fünfte Reiter (TK 9.14.1, v3.6) ist Sache von `reiter.ts` (#194) und `inhalte.tsx` (#244); diese drei Dateien führen **keine** Reiter-Liste und bekommen auch keine." (#311, STOPP) **#313 besitzt `inhalte.tsx`, legt dort aber keinen Reiter an** – es entfernt nur die drei `…WurzelProps.marke`. Ohne dieses Issue wären elf fertige, geprüf

### #315  [anfuehrung]
ZITAT   : [template-canvas] Das gebündelte Marken-Logo laden und bereitstellen
NAECHSTE: ein Rückfall auf die gebündelte Schrift wäre genau der stille Markenbruch, den dieser Abschnitt verhindert.
KONTEXT : - Modul: `template-canvas` (Renderer, geteilt) - Datei dieses Issues (+ zugehörige Testdatei) – **bestehend**: 1. `src/renderer/template-canvas/logo-laden.ts` — Ursprungs-Issue **#119** (M4-25, „[template-canvas] Das gebündelte Marken-Logo laden und bereitstellen"). **Die einzige Datei dieses Issues.** - **Nicht** erlaubt: `src/renderer/template-canvas/zeichne-segment.ts` (**#294** – ruft `holeLog

### #315  [anfuehrung]
ZITAT   : **KOMMT ERST MIT DEM M8-EDIT AN #119 HINZU.** M4-25 führt ausdrücklich ‚Kein `leereLogoBestand()`' – diese Aussage ist mit FA-24 überholt. Fehlt die Funktion beim Umsetzen, ist der Edit an #119 noch nicht gebaut: MELDEN, NICHT selbst in logo-laden.ts nachtragen.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : | Wer | Was dort vorausgesetzt wird | Wörtlich | |---|---|---| | **#312** | `holeLogo(markeId)`, `leereLogoBestand()` | „**KOMMT ERST MIT DEM M8-EDIT AN #119 HINZU.** M4-25 führt ausdrücklich ‚Kein `leereLogoBestand()`' – diese Aussage ist mit FA-24 überholt. Fehlt die Funktion beim Umsetzen, ist der Edit an #119 noch nicht gebaut: MELDEN, NICHT selbst in logo-laden.ts nachtragen." (#312) | | **#2

### #315  [anfuehrung]
ZITAT   : Für das **Logo** gibt es im M8-Zuschnitt **kein** Issue, das `holeLogo()`/`bereiteLogoVor(marke)` (M4-25) auf mehrere, möglicherweise **importierte** Marken-Logos erweitert
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **#312 ist ohne diese Datei nicht baubar** – Schritt 6 seines Ablaufs und die Hälfte von `leereMarkenBestand` hängen daran. Zusätzlich meldet **#303** die Lücke aus der Editor-Richtung und fordert eine Meldung an den Auftraggeber („Für das **Logo** gibt es im M8-Zuschnitt **kein** Issue, das `holeLogo()`/`bereiteLogoVor(marke)` (M4-25) auf mehrere, möglicherweise **importierte** Marken-Logos erwei

### #315  [anfuehrung]
ZITAT   : endet auf `.woff2` → gebündelt
NAECHSTE: *Nur `.woff2`, weil die gebündelten Schriften dasselbe Format haben:
KONTEXT : **Verschärfend, und deshalb steht die Marke unten vollständig ausgeschrieben:** #312 schreibt `Marke.logo` als `{ datei: string; seitenverhaeltnis: number } | null` ab – **ohne `herkunft`**, also ausgerechnet ohne das Feld, an dem die Ladeweg-Verzweigung hängt. **Für diese Datei gilt die Fassung aus TK 9.11.2 / `#52`, die unten steht.** Fehlt `herkunft` beim Umsetzen im tatsächlichen Typ, ist das 

### #315  [anfuehrung]
ZITAT   : **Kein `leereLogoBestand()`.** Das Gegenstück zu `leereMotivBestand()` (M4-17) gibt es hier absichtlich **nicht**: Die `Marke` ist „in v1 gebündelt und read-only" (TK 9.11.2), sie kann sich zur Laufzeit nicht ändern, und das Logo gehört keinem Projekt. Ein Leeren hätte keinen Auslöser und wäre nur eine weitere Stelle, an der das Logo verschwinden kann.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Kein `leereLogoBestand()`.** Das Gegenstück zu `leereMotivBestand()` (M4-17) gibt es hier absichtlich **nicht**: Die `Marke` ist „in v1 gebündelt und read-only" (TK 9.11.2), sie kann sich zur Laufzeit nicht ändern, und das Logo gehört keinem Projekt. Ein Leeren hätte keinen Auslöser und wäre nur eine weitere Stelle, an der das Logo verschwinden kann." (M4-25)

### #315  [anfuehrung]
ZITAT   : **Ein einziger Bestand, kein weiterer Cache.** Eine modul-globale Variable für das gemerkte Promise und das Ergebnis; **kein** `localStorage`/`sessionStorage`/`IndexedDB`, keine `Map` nach Dateinamen, kein zweites Logo. **Es gibt genau eine Marke und genau ein Logo.**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Ein einziger Bestand, kein weiterer Cache.** Eine modul-globale Variable für das gemerkte Promise und das Ergebnis; **kein** `localStorage`/`sessionStorage`/`IndexedDB`, keine `Map` nach Dateinamen, kein zweites Logo. **Es gibt genau eine Marke und genau ein Logo.**" (M4-25, Festlegung 6)

### #315  [anfuehrung]
ZITAT   : Idempotent je markeId: merkt sich das Promise dieser Marke in einem modul-globalen Bestand (`Map<string, Promise<void>>`)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ### 1. Der Bestand ist je `markeId` geschlüsselt – Schlüssel ist immer `marke.id` Es entstehen **zwei** modul-globale `Map`s, beide mit `marke.id` als Schlüssel: eine `Map<string, Promise<void>>` für den laufenden Vorgang (Idempotenz, s. Punkt 6) und eine `Map<string, Motiv>` für das Ergebnis. **Kein** Schlüssel nach Dateiname, **kein** zusammengesetzter Schlüssel aus `id` und `datei`, **kein** dr

### #315  [anfuehrung]
ZITAT   : **keinen dritten Motiv-Zustand erfinden** („lädt noch", „unbekannt")
NAECHSTE: Es gibt keinen garantierten Urzustand, auf den man zurücksetzen kann.
KONTEXT : *Warum das trotzdem eindeutig ist:* Die Unterscheidung trifft der Aufrufer, und zwar an **einer** Stelle, die er ohnehin hat – `marke.logo === null`. #294 entscheidet daran zwischen `zeichneErsatzLogo` und `zeichneBildZone`; #312 entscheidet daran, ob es Schritt 6 überhaupt ausführt. Ein dritter Zustand wäre eine zweite Wahrheit über dieselbe Frage und ist ausdrücklich verboten (M4-25: „**keinen d

### #315  [anfuehrung]
ZITAT   : **Echte offene Frage, NICHT Teil dieses Issues – die Vorbereitung vor dem Zeichnen fehlt im M8-Zuschnitt**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **ECHTE OFFENE FRAGE, unverändert aus M4-25: Wie aus einer gebündelten `logo.datei` eine ladbare URL wird.** Zwei Dinge fehlen weiterhin: (a) **wo** die gebündelte Logo-Datei physisch liegt und wie sie heißt – **#280** führt genau das als offene Frage („Anders als die vier Schriftdateien (bereits vorhanden, s. o.) existiert im Repository **noch keine** gebündelte Logo-Datei für `template-canvas`

### #315  [blockzitat]
ZITAT   : „**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1; FA-23/FA-24). *Bis v3.3 stand hier: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP." Beides ist mit v3.4 überholt – die Marke gehört nicht mehr dem `config-store`, und der Editor ist ein Muss.* **Gebündelt bleiben** die vier OFL-Schriften und das Fitnessworld24-Logo; importierte Dateien tragen die Herkunft `importiert` (9.15.3)." (TK 9.11.2)
NAECHSTE: ein Marken-Editor ist kein MVP." Beides ist mit v3.4 überholt – die Marke gehört nicht mehr dem `config-store`, und der Editor ist ein Muss.* **Gebündelt bleiben** die vier OFL-Schriften;
KONTEXT : „**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1; FA-23/FA-24). *Bis v3.3 stand hier: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP." Beides ist mit v3.4 überholt – die Marke gehört nicht mehr dem `config-store`, und der Editor ist ein Muss.* **Gebündelt bleiben** die vier OFL-Schriften und das Fitnessworld

### #316  [anfuehrung]
ZITAT   : **Die Farbe kommt als fertiger Hexwert im Kontext an; diese Datei ruft `leseMarke()` NICHT selbst auf.** Sonst läse jedes Element die Markendatei erneut, und der `render-service` hätte zwei Stellen, die den `config-store` kennen. Die Umrechnung nach `0xRRGGBB` macht `markenFarbeZuFfmpeg` (M6-09), **nicht** diese Datei.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Die Farbe kommt als fertiger Hexwert im Kontext an; diese Datei ruft `leseMarke()` NICHT selbst auf.** Sonst läse jedes Element die Markendatei erneut, und der `render-service` hätte zwei Stellen, die den `config-store` kennen. Die Umrechnung nach `0xRRGGBB` macht `markenFarbeZuFfmpeg` (M6-09), **nicht** diese Datei." (`#177`, M6-22)

### #316  [anfuehrung]
ZITAT   : `/** Hexwert '#RRGGBB' der Farb-Rolle flaecheDunkel, vom Aufrufer aus leseMarke() (#29) */`
NAECHSTE: **Die Restflächen der Split-Komposition tragen die Farb-Rolle `flaecheDunkel`** (9.2.8, mitgezogen 9.2.4 und 9.9.2), geholt über die Marke (`leseMarke`;
KONTEXT : „`/** Hexwert '#RRGGBB' der Farb-Rolle flaecheDunkel, vom Aufrufer aus leseMarke() (#29) */`" (`#177`, `NormalisierKontext`)

### #316  [anfuehrung]
ZITAT   : Blockiert von #316 (bindend)
NAECHSTE: Vier Festlegungen, bindend:
KONTEXT : - **ECHTE OFFENE FRAGE: Wer prüft `flaecheDunkel` im Auftrag?** `pruefeRenderRequest` (**#173**, M6-18) ist die Stelle, die dem Renderer **nicht** vertraut („wird **vollständig** misstraut – der Typ sagt nichts über die Laufzeitwerte (TK 9.1.1 Punkt 6)", `#173`), und sie führt eine eigene **Einblendungs-Prüfung** mit heute **fünf** Punkten (Geometrie, Abschnitte vorhanden, PNG-Puffer, PNG-Maße, Ab

### #316  [blockzitat]
ZITAT   : „**#177** (M6-22) | `render-service/normalisieren.ts` | nimmt den Wert **aus dem Auftrag**, statt `leseMarke()` (**#29**) zu rufen und selbst aufzulösen" (`m8-zuschnitt.md`)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**#177** (M6-22) | `render-service/normalisieren.ts` | nimmt den Wert **aus dem Auftrag**, statt `leseMarke()` (**#29**) zu rufen und selbst aufzulösen" (`m8-zuschnitt.md`) **`#177` hat `leseMarke()` nie gerufen.** Es sagt das selbst, wörtlich, in seinem ENTSCHIEDEN-Block:

### #316  [blockzitat]
ZITAT   : „`/** Hexwert '#RRGGBB' der Farb-Rolle flaecheDunkel, vom Aufrufer aus leseMarke() (#29) */`" (`#177`, `NormalisierKontext`)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „`/** Hexwert '#RRGGBB' der Farb-Rolle flaecheDunkel, vom Aufrufer aus leseMarke() (#29) */`" (`#177`, `NormalisierKontext`) **Der Aufrufer ist `#181` (M6-26), und dort steht der Aufruf.** Wörtlich, Ablauf-Schritt 5:

### #316  [blockzitat]
ZITAT   : „*Das Feld ist Pflicht, auch wenn `art: "einblendung"` es nicht benutzt* (dort wird nichts gefüllt, das Band überlagert mit Alpha). Ein optionales Feld hätte den Fall ‚`split` ohne Farbe' zugelassen – und dann müsste der `render-service` raten oder eine Hexzahl tippen, was 9.11.1 Punkt 7 verbietet." (TK 9.2.2)
NAECHSTE: Ein optionales Feld hätte den Fall „`split` ohne Farbe" zugelassen – und dann müsste der `render-service` raten oder eine Hexzahl tippen, was 9.11.1 Punkt 7 verbietet.
KONTEXT : „*Das Feld ist Pflicht, auch wenn `art: "einblendung"` es nicht benutzt* (dort wird nichts gefüllt, das Band überlagert mit Alpha). Ein optionales Feld hätte den Fall ‚`split` ohne Farbe' zugelassen – und dann müsste der `render-service` raten oder eine Hexzahl tippen, was 9.11.1 Punkt 7 verbietet." (TK 9.2.2) ## Die Arbeitsteilung auf `#134` – KOLLISION mit #310, ausgeschrieben

### #316  [blockzitat]
ZITAT   : // Genau EINMAL je loeseRenderAus-Aufruf, unmittelbar VOR der Element-Schleife und NUR dann, // wenn mindestens ein Listenelement `einblendung !== null` trägt: const m = await stelleMarkeBereit(projekt.standardMarkeId) // ok: false -> { ok: false, fehler: { code: 'marke_nicht_ladbar', meldung } }; NICHTS wird // gezeichnet, NICHTS eingereiht (s. Fehlerpfade) // ok: true -> const standardMarke = m.wert; wird für JEDEN Band-Abschnitt DIESES Laufs benutzt // KEIN eigener rufeAuf auf 'marken:leseMarke' in dieser Datei – s. Begründung oben. ``` (#310, Datei 2)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ```ts import { stelleMarkeBereit } from '../gemeinsam/marken-bereitstellung' // #312 // Genau EINMAL je loeseRenderAus-Aufruf, unmittelbar VOR der Element-Schleife und NUR dann, // wenn mindestens ein Listenelement `einblendung !== null` trägt: const m = await stelleMarkeBereit(projekt.standardMarkeId) // ok: false -> { ok: false, fehler: { code: 'marke_nicht_ladbar', meldung } }; NICHTS wird // g

### #317  [anfuehrung]
ZITAT   : weiterhin außerhalb dieses Dateibereichs
NAECHSTE: Der Export darf **nie** außerhalb von `zielPfad` schreiben.
KONTEXT : **Dieses Issue ist ein EDIT an vier bereits abgenommenen Dateien. Es legt keine neue Datei an, und eine davon wird gelöscht.** Es ist der Rückbau, den **#281** in seinem STOPP-Block ausdrücklich an ein anderes Issue verwiesen hat („das gehört, sobald geklärt, in ein Issue, das `config-store` selbst ändert (**nicht** in dieses, das nur `Project` liest/schreibt)", #281) und den **#311** als „weiterh

### #317  [anfuehrung]
ZITAT   : [config-store] `leseMarke` implementieren
NAECHSTE: `leseMarke` und `listeMarken` liefern **fertige** Marken;
KONTEXT : - Modul: `config-store` [D3] (Main), mit einem Anteil am `ipc-gateway` - Dateien dieses Issues (+ jeweils zugehörige Testdatei) – **alle bestehend**: 1. `src/main/config-store/lese-marke.ts` — Ursprungs-Issue **#29** (M1-17, „[config-store] `leseMarke` implementieren"). **Diese Datei wird GELÖSCHT**, samt ihrer Testdatei. 2. `src/shared/contracts/kanaele.ts` — Ursprungs-Issue **#25**, ergänzt durc

### #317  [anfuehrung]
ZITAT   : Es begründet ausdrücklich, dass es **keinen Schreibkanal für die Marke** gibt … Diese Begründung ist jetzt **umgekehrt**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Der Rückbau ist ERSATZLOS.** Es entsteht **kein** Nachfolgekanal im `config`-Namensraum, **kein** `config:leseMarkeId`, **kein** inhaltsleerer Handler, der `nicht_gefunden` liefert, und **keine** auskommentierte Zeile „für später". Wer eine Marke braucht, ruft `marken:leseMarke` (#283/#304). *Begründung:* wörtlich der Absatz aus TK 9.5.6 oben – zwei nebeneinanderliegende Quellen „könnten … au

### #317  [blockzitat]
ZITAT   : „**Verbot – bestehende Blöcke in `kanaele.ts` nicht verändern.** Nur der **neue** Block `marken` entsteht; `project`, `queue`, `config`, `media`, `vorlagen` bleiben Zeichen für Zeichen unberührt." (#304)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Verbot – bestehende Blöcke in `kanaele.ts` nicht verändern.** Nur der **neue** Block `marken` entsteht; `project`, `queue`, `config`, `media`, `vorlagen` bleiben Zeichen für Zeichen unberührt." (#304) **Das ist eine Selbstbeschränkung von #304, keine Sperre für alle Zeit.** #304 sagt, dass **es** den `config`-Block nicht anfasst – dieses Issue ist der Eigentümer dieser Änderung. Der einzige tat

### #318  [anfuehrung]
ZITAT   : [action-editor] Akzentfarbe wählen – feste Auswahl aus der Markenpalette
NAECHSTE: Wählt eine Aktion **keine** Akzentfarbe, gilt der Markenwert;
KONTEXT : - Modul: **modulübergreifend** (Renderer). **Titel-Präfix `[action-editor]`, weil dort der fachliche Schwerpunkt liegt:** Die eigentliche Entscheidung – *was* der Nutzer wählen darf und *was* gespeichert wird – fällt in `akzentfarbe.ts`; `template-canvas/farben.ts` zieht nur nach, wie der gespeicherte Wert gelesen wird. - Dateien dieses Issues (+ jeweils zugehörige Testdatei) – **alle bestehend**:

### #318  [anfuehrung]
ZITAT   : [template-canvas] Farb- und Schriftrollen der Marke auflösen
NAECHSTE: `template-canvas` liefert beide in **1920 × H** (9.10.2).
KONTEXT : - Modul: **modulübergreifend** (Renderer). **Titel-Präfix `[action-editor]`, weil dort der fachliche Schwerpunkt liegt:** Die eigentliche Entscheidung – *was* der Nutzer wählen darf und *was* gespeichert wird – fällt in `akzentfarbe.ts`; `template-canvas/farben.ts` zieht nur nach, wie der gespeicherte Wert gelesen wird. - Dateien dieses Issues (+ jeweils zugehörige Testdatei) – **alle bestehend**:

### #318  [anfuehrung]
ZITAT   : eine stillschweigende Annahme darüber, welcher Hintergrund „durchscheint", wäre hier erfunden
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Gespeichert wird ein Hex-Wert, nie ein Rollenname.** `Aktion.akzentfarbe` ist entweder `null` oder genau `#` gefolgt von **sechs** Hex-Ziffern. Das ist die exakte Umkehrung des Verbots aus #139 („`Aktion.akzentfarbe` bekommt **nie** einen Wert, der mit `#` beginnt") – dieses Verbot gilt **nicht mehr** und wird durch sein Gegenteil ersetzt (ENTSCHIEDEN 9). 2. **Die Markenpalette bleibt – als V

### #318  [anfuehrung]
ZITAT   : **Verbot bis dahin:** In dieser Datei entsteht **keine** Kontrast-Rechnung und **keine** Warnung
NAECHSTE: „Abgrenzung", mit demselben Grund wie die erste. Mitentschieden: Textfarbe **nach gemessenem Kontrast** (dieselbe Rechnung wie die Warnung, einmal gebaut, zweim
KONTEXT : - **ECHTE OFFENE FRAGE, die schwerste dieses Issues: Was geschieht mit Aktionen, die einen ROLLENNAMEN in `akzentfarbe` tragen?** Jede vor diesem Issue angelegte Aktion trägt dort `'akzent'`, `'akzentKraeftig'` oder `'akzentTief'` – #139 hat es so vorgeschrieben. Nach diesem Issue **wirft** `loeseFarbe` bei genau diesen Werten, und zwar **mitten im Zeichnen**. Es gibt dafür **keine** Migration: **

### #318  [anfuehrung]
ZITAT   : ECHTE OFFENE FRAGE, von #292 hierher übergeben
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **ECHTE OFFENE FRAGE, die schwerste dieses Issues: Was geschieht mit Aktionen, die einen ROLLENNAMEN in `akzentfarbe` tragen?** Jede vor diesem Issue angelegte Aktion trägt dort `'akzent'`, `'akzentKraeftig'` oder `'akzentTief'` – #139 hat es so vorgeschrieben. Nach diesem Issue **wirft** `loeseFarbe` bei genau diesen Werten, und zwar **mitten im Zeichnen**. Es gibt dafür **keine** Migration: **

### #318  [blockzitat]
ZITAT   : „*Bis v3.3 stand hier: „Zugleich bleibt die Farbwahl auf die Markenpalette begrenzt (9.8.4): Es entsteht kein freier Farbwähler, und keine Aktion kann aus dem Corporate Design ausbrechen." Dieser Satz ist mit v3.4 zurückgenommen; er stand bis v3.5 versehentlich weiter hier und war wörtlich zitierbar.*" (TK 9.10.9)
NAECHSTE: ktion kann aus dem Corporate Design ausbrechen." Dieser Satz ist mit v3.4 zurückgenommen; er stand bis v3.5 versehentlich weiter hier und war wörtlich zitierbar
KONTEXT : „*Bis v3.3 stand hier: „Zugleich bleibt die Farbwahl auf die Markenpalette begrenzt (9.8.4): Es entsteht kein freier Farbwähler, und keine Aktion kann aus dem Corporate Design ausbrechen." Dieser Satz ist mit v3.4 zurückgenommen; er stand bis v3.5 versehentlich weiter hier und war wörtlich zitierbar.*" (TK 9.10.9) **Eine dritte Stelle ist betroffen und liegt außerhalb dieses Issues:** `#250` (M7-5

### #318  [blockzitat]
ZITAT   : **`akzentfarbe` ist ein freier Hex-Wert (FA-24, TK 9.8.4).** Die Ersetzung schlägt **nichts** in `marke.farben` nach; sie nimmt den Wert, wie er in der Aktion steht, und lässt ihn durch **dieselbe** Format-Umrechnung laufen wie einen regulären Markenwert. Es entstehen weiterhin **keine** zwei Formatwege. Ist der Wert weder `#RRGGBB` noch `#RRGGBBAA`, **wirft** die Funktion – **keine** Ersatzfarbe und **kein** stiller Rückfall auf den Markenwert der ursprünglich angefragten Rolle.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **`akzentfarbe` ist ein freier Hex-Wert (FA-24, TK 9.8.4).** Die Ersetzung schlägt **nichts** in `marke.farben` nach; sie nimmt den Wert, wie er in der Aktion steht, und lässt ihn durch **dieselbe** Format-Umrechnung laufen wie einen regulären Markenwert. Es entstehen weiterhin **keine** zwei Formatwege. Ist der Wert weder `#RRGGBB` noch `#RRGGBBAA`, **wirft** die Funktion – **keine** Ersatzfarbe 

### #319  [anfuehrung]
ZITAT   : [project-store] erstelleAktion implementieren
NAECHSTE: - **`project-store` ist die Wahrheit:** die Liste im composer ist nur eine Sicht;
KONTEXT : - Modul: **modulübergreifend** (Main + Renderer). **Titel-Präfix `[action-editor]`, weil dort der fachliche Schwerpunkt liegt:** Die einzige echte Entscheidung – *woher* die Auswahlliste kommt und *womit* eine neue Aktion vorbelegt wird – fällt im Renderer; die beiden Main-Dateien bekommen je **eine** zusätzliche Prüfung. - Dateien dieses Issues (+ jeweils zugehörige Testdatei): 1. `src/main/proje

### #319  [anfuehrung]
ZITAT   : [project-store] bearbeiteAktion implementieren
NAECHSTE: `erstelleAktion`, `bearbeiteAktion`, `löscheAktion` (Kaskade, 9.5.3).
KONTEXT : - Modul: **modulübergreifend** (Main + Renderer). **Titel-Präfix `[action-editor]`, weil dort der fachliche Schwerpunkt liegt:** Die einzige echte Entscheidung – *woher* die Auswahlliste kommt und *womit* eine neue Aktion vorbelegt wird – fällt im Renderer; die beiden Main-Dateien bekommen je **eine** zusätzliche Prüfung. - Dateien dieses Issues (+ jeweils zugehörige Testdatei): 1. `src/main/proje

### #319  [anfuehrung]
ZITAT   : `Aktion` | **#14** (M1-02) | neues Pflichtfeld `markeId`
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - Modul: **modulübergreifend** (Main + Renderer). **Titel-Präfix `[action-editor]`, weil dort der fachliche Schwerpunkt liegt:** Die einzige echte Entscheidung – *woher* die Auswahlliste kommt und *womit* eine neue Aktion vorbelegt wird – fällt im Renderer; die beiden Main-Dateien bekommen je **eine** zusätzliche Prüfung. - Dateien dieses Issues (+ jeweils zugehörige Testdatei): 1. `src/main/proje

### #319  [anfuehrung]
ZITAT   : `Project` | **#15** (M1-03) | neues Feld `standardMarkeId`
NAECHSTE: `project:setzeStandardMarke`.
KONTEXT : - Modul: **modulübergreifend** (Main + Renderer). **Titel-Präfix `[action-editor]`, weil dort der fachliche Schwerpunkt liegt:** Die einzige echte Entscheidung – *woher* die Auswahlliste kommt und *womit* eine neue Aktion vorbelegt wird – fällt im Renderer; die beiden Main-Dateien bekommen je **eine** zusätzliche Prüfung. - Dateien dieses Issues (+ jeweils zugehörige Testdatei): 1. `src/main/proje

### #319  [anfuehrung]
ZITAT   : Geprüft wird **AUSSCHLIESSLICH**, was im übergebenen Objekt tatsächlich vorkommt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **In `pruefeEntwurf` kommt genau eine Regel hinzu:** Ist `markeId` im übergebenen Objekt **vorhanden** und leer bzw. nur Leerzeichen, entsteht `{ feld: 'markeId', grund: 'leer' }`. Ein **fehlendes** Feld erzeugt weiterhin **keinen** Befund – „Geprüft wird **AUSSCHLIESSLICH**, was im übergebenen Objekt tatsächlich vorkommt" (#136). Die Signatur bleibt `pruefeEntwurf(entwurf: Partial<AktionsEntwurf>

### #319  [anfuehrung]
ZITAT   : bis der Zugang da ist
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **ERLEDIGT – nicht mehr melden: Die Marken-Liste reicht #313 herein, über ein neues Prop `marken: MarkenZugang` in `ActionEditorWurzelProps`.** Der Befund war: `markenAuswahl` braucht ein `readonly Marke[]`, und die einzige richtige Quelle ist die gemeinsame Sicht (ENTSCHIEDEN 1) – `Reiterzugaenge.marken: MarkenZugang` existiert seit **#311** und wird in `inhalte.tsx` (**#244**) verteilt –, aber

### #320  [anfuehrung]
ZITAT   : [contracts] Typ Marke definieren
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - Modul: `contracts/types` (geteilt – von Main **und** Renderer importierbar) - Dateien dieses Issues (+ jeweils zugehörige Testdatei) – **alle bestehend**: 1. `src/shared/contracts/marke.ts` — Ursprungs-Issue **#52** (M1-40, „[contracts] Typ Marke definieren"). **Der Kern dieses Issues.** `Marke` wächst um fünf Felder, `logo` wird nullbar, `Schrift` bekommt `herkunft`, und zwei Typen kommen hinzu

### #320  [anfuehrung]
ZITAT   : Ergänzung in src/shared/contracts/marke.ts – NICHT die bereits bestehenden Felder von Marke anfassen (id, name, parent, eingebaut, farben, schriften, logo, sicherheit, radien, schatten, slogan sind Gegenstand des separaten Zitat-Abgleichs zu #52, nicht dieses Issues).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Ergänzung in src/shared/contracts/marke.ts – NICHT die bereits bestehenden Felder von Marke anfassen (id, name, parent, eingebaut, farben, schriften, logo, sicherheit, radien, schatten, slogan sind Gegenstand des separaten Zitat-Abgleichs zu #52, nicht dieses Issues)." (#275, Signaturblock)

### #320  [anfuehrung]
ZITAT   : Treffer über `marke.parent === markeId`
NAECHSTE: `aktion.markeId`, `Marke.parent` und `Project.standardMarkeId`.
KONTEXT : 1. **Dieses Issue läuft ZUERST, #275 danach.** *Begründung, und sie ist inhaltlich, nicht organisatorisch:* #275 deklariert `AbgeleiteteMarkenReferenz` als „Fundort im Marken-Bestand" und kommentiert das Feld wörtlich mit „Treffer über `marke.parent === markeId`". Das Feld `parent` entsteht **hier**. Liefe #275 zuerst, stünde in einem abgenommenen Vertrag ein Verweis auf ein Feld, das es noch nich

### #320  [anfuehrung]
ZITAT   : Nur der **Kommentar** daneben (‚Rollen-Verweis in die Markenpalette, kein Hex') ist überholt, und er gehört zum bereits vorgesehenen Edit an **#14**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Feldnamen, Feldreihenfolge und Schreibweise folgen TK 9.11.2 / 9.8.2 / 9.11.3 – und zwar zeichengleich zu dem, was die übrigen M8-Issues bereits abgeschrieben haben.** Es wird nichts umsortiert, nichts umbenannt, nichts „aufgeräumt". Neue Felder stehen an der Stelle, an der sie im TK-Codeblock stehen: `id`, `name`, `parent`, `eingebaut` **vor** `farben`; `herkunftJeFeld` **als letztes** Feld 

### #320  [anfuehrung]
ZITAT   : Die Grenzen kommen aus `SICHERHEITSABSTAND_BEREICH` (#21); die Zahlen `480` und `270` stehen // **nirgends** als Literal in dieser Datei
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #285 – src/main/marken-store/bearbeite-marke.ts (LIEST die neue Konstante; nicht anfassen) import { SICHERHEITSABSTAND_BEREICH } from '../../shared/contracts/konstanten' // „Die Grenzen kommen aus `SICHERHEITSABSTAND_BEREICH` (#21); die Zahlen `480` und `270` stehen // **nirgends** als Literal in dieser Datei" (#285, DoD)

### #320  [anfuehrung]
ZITAT   : diese Zahlen stehen nirgends als Literal
NAECHSTE: die Werte stehen aufgelöst in der Marke selbst.
KONTEXT : - [ ] `SICHERHEITSABSTAND_BEREICH` existiert mit **genau** den vier Zahlen `0`, `480`, `0`, `270` unter den Schlüsseln `horizontal.min`, `horizontal.max`, `vertikal.min`, `vertikal.max` - [ ] Die Konstante trägt `as const`: `SICHERHEITSABSTAND_BEREICH.horizontal.max` hat den **literalen** Typ `480`, und eine Zuweisung daran kompiliert **nicht** (`@ts-expect-error`-Probe) - [ ] `KONTRAST_SCHWELLE` 

### #321  [anfuehrung]
ZITAT   : weil `marken` es vielleicht braucht
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **ERLEDIGT – nicht mehr melden, hier ist die Entscheidung.** Der Befund war: Electron lässt `protocol.registerSchemesAsPrivileged` **nur einmal** zu, zwei Registrier-Funktionen (#9 für `media`, #290 für `marken`) wären aber zwei Aufrufe gewesen. **Entschieden:** Die Module liefern ihre Schema-Beschreibung als **Daten** (`MEDIA_SCHEMA`, `MARKEN_SCHEMA`), und **der Bootstrap ruft die API genau ein

### #322  [anfuehrung]
ZITAT   : Und M7-51 verlangt die fünf Wurzeln ausdrücklich als **Parameter**, damit ihr Fehlen unübersehbar bleibt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Den Import der neuen Wurzel ergänzen** – `MarkenEditorWurzel` aus `src/renderer/marken-editor/index.tsx` (**#330**). Das ist derselbe Fall wie bei den fünf bestehenden Wurzeln und aus demselben Grund erlaubt: „**`App.tsx` ist der Kompositionswurzel-Punkt und darf als EINZIGE Renderer-Datei die Modul-Wurzeln als WERTE importieren.**" (#262, ENTSCHIEDEN 1) 2. **Sie als sechsten Eintrag in `Modu

### #322  [anfuehrung]
ZITAT   : eine `Reiterumgebung` mit **genau fünf** belegten Feldern
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - „eine `Reiterumgebung` mit **genau fünf** belegten Feldern" (#262, DoD) – das sind die **fünf Felder der `Reiterumgebung`** (`aufProjekteWechseln`, `wechsleZuZusammenstellen`, `composerVerdrahtung`, `hervorgehobeneAktionId`, `vorlagenSitzung`), **nicht** die Wurzeln. Sie bleibt **fünf**. - „`Rahmen` bekommt **alle vier** Eigenschaften" und „**kein** fünfter Eintrag im Rahmen" (#262) – das ist `R

### #322  [anfuehrung]
ZITAT   : `Rahmen` bekommt **alle vier** Eigenschaften
NAECHSTE: Der `render-service` bekommt dadurch **keine** Kenntnis von Aktionen:
KONTEXT : - „eine `Reiterumgebung` mit **genau fünf** belegten Feldern" (#262, DoD) – das sind die **fünf Felder der `Reiterumgebung`** (`aufProjekteWechseln`, `wechsleZuZusammenstellen`, `composerVerdrahtung`, `hervorgehobeneAktionId`, `vorlagenSitzung`), **nicht** die Wurzeln. Sie bleibt **fünf**. - „`Rahmen` bekommt **alle vier** Eigenschaften" und „**kein** fünfter Eintrag im Rahmen" (#262) – das ist `R

### #322  [anfuehrung]
ZITAT   : **kein** fünfter Eintrag im Rahmen
NAECHSTE: Marken- Identität und Rahmen sind stabil.
KONTEXT : - „eine `Reiterumgebung` mit **genau fünf** belegten Feldern" (#262, DoD) – das sind die **fünf Felder der `Reiterumgebung`** (`aufProjekteWechseln`, `wechsleZuZusammenstellen`, `composerVerdrahtung`, `hervorgehobeneAktionId`, `vorlagenSitzung`), **nicht** die Wurzeln. Sie bleibt **fünf**. - „`Rahmen` bekommt **alle vier** Eigenschaften" und „**kein** fünfter Eintrag im Rahmen" (#262) – das ist `R

### #322  [anfuehrung]
ZITAT   : `marken: ({ sichtbar }) => <wurzeln.markenEditor sichtbar={sichtbar} marken={zugaenge.marken} />`
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **Kein** Umbau, keine Umbenennung, keine Umsortierung, keine „Gelegenheit zum Aufräumen". - **Keine** der fünf bestehenden Wurzeln anfassen – weder ihre Importe noch ihre Belegung noch ihre Reihenfolge. - **Keine** Änderung an der Reihenfolge der acht Schritte, am Melde-Halter, an der `Reiterumgebung`, an der `UebergabeUmgebung`, am `UebergabeOverlay`, an den Abos oder am Abbau. Die Verbote aus 

### #322  [anfuehrung]
ZITAT   : Und M7-51 verlangt die fünf Wurzeln ausdrücklich als **Parameter**, damit ihr Fehlen unübersehbar bleibt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - „**`App.tsx` ist der Kompositionswurzel-Punkt und darf als EINZIGE Renderer-Datei die Modul-Wurzeln als WERTE importieren.**" (#262, ENTSCHIEDEN 1) – deshalb steht der Import **hier** und nirgends sonst. - „Und M7-51 verlangt die fünf Wurzeln ausdrücklich als **Parameter**, damit ihr Fehlen unübersehbar bleibt" (#262, ENTSCHIEDEN 1) – der Parameterweg bleibt; dieses Issue **belegt** nur ein weit

### #322  [anfuehrung]
ZITAT   : Was in `App.tsx` erlaubt ist – und was nicht
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - Blockiert von: **#330** (baut `src/renderer/marken-editor/index.tsx` mit der Komponente `MarkenEditorWurzel` – **ohne sie gibt es nichts zu montieren**; das ist die harte Reihenfolge dieses Issues), **#314** (deklariert `MarkenEditorWurzelProps` und `ModulWurzeln.markenEditor` – **ohne diese Deklaration gibt es kein Feld, das hier belegt werden könnte**), **#262** (M7-69 – die zu ändernde Datei;

### #322  [anfuehrung]
ZITAT   : Die Arbeitsteilung auf `App.tsx` – #327 fasst dieselbe Datei an
NAECHSTE: das wäre eine zweite Quelle für dieselbe Information.
KONTEXT : - Blockiert von: **#330** (baut `src/renderer/marken-editor/index.tsx` mit der Komponente `MarkenEditorWurzel` – **ohne sie gibt es nichts zu montieren**; das ist die harte Reihenfolge dieses Issues), **#314** (deklariert `MarkenEditorWurzelProps` und `ModulWurzeln.markenEditor` – **ohne diese Deklaration gibt es kein Feld, das hier belegt werden könnte**), **#262** (M7-69 – die zu ändernde Datei;

### #323  [anfuehrung]
ZITAT   : Der Eintrag im Main-Bootstrap
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : ## Modul & Datei - Modul: `project-store` [D1] (Main) – und, als zweiter Dateibereich, die Anmeldung im `ipc-gateway` - Datei 1 (neu): `src/main/project-store/setze-standard-marke.ts` - Datei 2 (neu): `src/main/ipc-gateway/project-store-nachtrag-3.ts` - Datei 3 (bestehend, **genau ein** neuer Eintrag): `src/shared/contracts/kanaele.ts` – der Block `project` wird um **eine** Zeile ergänzt. Die Regi

### #323  [anfuehrung]
ZITAT   : setzt `schemaVersion` beim Schreiben (neu)
NAECHSTE: - **`schemaVersion` und Migration** wie 9.5.5.
KONTEXT : **ENTSCHIEDEN – abweichende `schemaVersion` in Zweig B bricht ab, statt zu migrieren.** Die Migration lebt in `öffneProjekt` (#48, TK 9.5.5) und **nur** dort. Würde dieser Zweig einfach schreiben, käme der Schaden von `schreibeProjekt` (#46): Es „setzt `schemaVersion` beim Schreiben (neu)" – ein altes Projekt trüge danach die **aktuelle** Versionsnummer, **ohne** je migriert worden zu sein, und de

### #323  [anfuehrung]
ZITAT   : keine Fachlogik im Gateway
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : Ein Handler, der zwei Module in fester Reihenfolge zusammensetzt, ist in diesem Modul **kein Bruch der Regel „keine Fachlogik im Gateway"**, sondern der etablierte Fall: `project:öffneProjekt` ruft seit #76 nicht die Operation, sondern den Ablauf `oeffneProjektAblauf(projektId)` (#94). Der Unterschied bleibt gewahrt – hier entsteht **keine** Regel, **kein** Zustand und **keine** eigene Fehlerübers

### #325  [anfuehrung]
ZITAT   : [action-editor] Modul-Wurzel und Editor-Ansicht
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - Modul: `action-editor` [P2] (Renderer) - Datei dieses Issues (+ die zugehörige Testdatei) – **bestehend**: - `src/renderer/action-editor/index.tsx` — Ursprungs-Issue **#250** (M7-57, „[action-editor] Modul-Wurzel und Editor-Ansicht"). **Die einzige Datei dieses Issues.** - **Nicht** erlaubt: `src/renderer/action-editor/aktions-montage.ts` (**#250** – die reine Zusammensetz-Logik ändert sich durc

### #325  [anfuehrung]
ZITAT   : `speichereAktion` (#136) ist eine Instant-Operation und stößt jedes Mal das Auto-Speichern an; ein Absenden je Tastendruck wäre also dasselbe Problem wie der Regler in M7-56.
NAECHSTE: Es sähe richtig aus, aber jede folgende Instant-Operation liefe in `nicht_gefunden` (9.1.1), und das Auto-Speichern (9.5.4) legte womöglich einen Projektordner an, den **niemand angelegt hat**.
KONTEXT : *Begründung, Teil für Teil:* - **Die Vorschläge bleiben**, weil FA-24 verlangt, dass der Nutzer **nicht beschränkt** ist – nicht, dass ihm der Normalfall erschwert wird. #318 hat das schon entschieden: „Die Markenpalette bleibt – als VORSCHLAG, nicht als Grenze." (#318, ENTSCHIEDEN 2) - **Ein Textfeld statt `<input type="color">`.** Der native Farbwähler feuert beim **Ziehen** fortlaufend Änderung

### #325  [blockzitat]
ZITAT   : „**Für dich heißt das:** Hier entsteht aus ENTSCHIEDEN 2 nur das **Feld** `marken: MarkenZugang` und seine **Belegung** – die Auswahl selbst zeichnet ein späteres Issue." (#313, STOPP)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Für dich heißt das:** Hier entsteht aus ENTSCHIEDEN 2 nur das **Feld** `marken: MarkenZugang` und seine **Belegung** – die Auswahl selbst zeichnet ein späteres Issue." (#313, STOPP) **Dieses Issue ist das „spätere Issue".** #313 benennt seinen Auftrag ebenso wörtlich:

### #325  [blockzitat]
ZITAT   : **ACHTUNG – diese Falle ist behoben, aber sie erklärt, warum die Argumentfolge hier so ausdrücklich steht.** Bis zum 11.08.2026 lautete der zitierte Satz „`leererEntwurf` mit drei Argumenten rufen, **das dritte** aus `Project.standardMarkeId`". Diese Positionsangabe war **falsch**: Die Marken-Kennung ist das **ZWEITE** Argument, das dritte ist die Akzentfarbe. **Warum das nicht auffiel:** Wer „das dritte" wörtlich nimmt, schreibt die Marken-Kennung in den Akzentfarb-Parameter – das **übersetzt fehlerfrei**, weil beide `string` sind, und legt jede neue Aktion mit einer Akzentfarbe an, die `istAkzentfarbe` (#318) ablehnt. **Halte dich an die Signatur unten, nicht an eine Positionsangabe im Fließtext** – auch nicht an eine aus einem anderen Issue.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **ACHTUNG – diese Falle ist behoben, aber sie erklärt, warum die Argumentfolge hier so ausdrücklich steht.** Bis zum 11.08.2026 lautete der zitierte Satz „`leererEntwurf` mit drei Argumenten rufen, **das dritte** aus `Project.standardMarkeId`". Diese Positionsangabe war **falsch**: Die Marken-Kennung ist das **ZWEITE** Argument, das dritte ist die Akzentfarbe. **Warum das nicht auffiel:** Wer „das

### #325  [blockzitat]
ZITAT   : „**MELDEN, nicht beheben: `#250` (M7-57) bricht nach diesem Issue beim Übersetzen – und das ist gewollt.**" (#318, STOPP, Fassung bis 11.08.2026)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**MELDEN, nicht beheben: `#250` (M7-57) bricht nach diesem Issue beim Übersetzen – und das ist gewollt.**" (#318, STOPP, Fassung bis 11.08.2026) „**MELDEN, nicht beheben: `#250` (M7-57) hat keine Markenwahl und bricht nach diesem Issue beim Übersetzen.** … ruft `leererEntwurf` mit **zwei** Argumenten. Nach diesem Issue verlangt `leererEntwurf` **drei**." (#319, STOPP, Fassung bis 11.08.2026)

### #325  [blockzitat]
ZITAT   : „**Der neue Stand geht über `projekt.setzeProjekt(mitAktion(projekt, aktion))` in die gemeinsame Sicht – nach JEDEM erfolgreichen Schreibvorgang.** Betroffen sind `legeAktionAn` (#136), `speichereAktion` (#136), `weiseBildZu` und `entferneBild` (#138), `setzeAkzentfarbe` (#139) und `behebeAktionsBild` (#141)." (#250, ENTSCHIEDEN 1)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Der neue Stand geht über `projekt.setzeProjekt(mitAktion(projekt, aktion))` in die gemeinsame Sicht – nach JEDEM erfolgreichen Schreibvorgang.** Betroffen sind `legeAktionAn` (#136), `speichereAktion` (#136), `weiseBildZu` und `entferneBild` (#138), `setzeAkzentfarbe` (#139) und `behebeAktionsBild` (#141)." (#250, ENTSCHIEDEN 1) Die Liste wächst um **`setzeMarke` (#319)** – siebter Weg, **gleic

### #326  [anfuehrung]
ZITAT   : der Editor bekommt einen **zwölften** Baustein …, der den Dialog kapselt und den ersten Pfad zurückgibt – so, wie jede andere IPC-Berührung dieses Moduls in einer `.ts`-Datei liegt.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Warum die Lücke auch nicht in der Editor-Wurzel geschlossen wird.** `src/renderer/marken-editor/index.tsx` (#330) zeichnet den Bildschirm und ist ausdrücklich IPC-frei; jede IPC-Berührung dieses Moduls liegt in einer `.ts`-Datei. Genau diesen Weg nennt #330 selbst als eine der zwei offenen Möglichkeiten: „der Editor bekommt einen **zwölften** Baustein …, der den Dialog kapselt und den ersten Pfa

### #326  [anfuehrung]
ZITAT   : `schriftRolle` ist ein PFLICHT-Parameter mit `| null`
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Zwei Funktionen statt einer mit `art`-Parameter.** Eine gemeinsame `waehleUndImportiere(markeId, art, rolle?)` bräuchte einen Parameter, der nur bei `art: 'schrift'` gesetzt sein darf – genau die Form, die #289 und #304 im ganzen Marken-Vertrag vermeiden („`schriftRolle` ist ein PFLICHT-Parameter mit `| null`"). Zwei Funktionen machen die Aufrufstelle typsicher: Wer das Logo importiert, kann 

### #326  [anfuehrung]
ZITAT   : weil es nur drei Zeilen wären
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **ECHTE OFFENE FRAGE (nicht hier zu lösen, aber zu melden): Eine importierte Schrift lässt sich nirgends wieder entfernen.** `entferneMarkenDatei(markeId, art, schriftRolle)` (#289) kennt `art: 'schrift'`, und der Store setzt das Feld dabei zurück – bei einer abgeleiteten Marke auf den Sentinel-Wert für „geerbt", sonst auf den gebündelten Wert (#289). **Renderer-seitig ruft sie dafür niemand:** 

### #326  [blockzitat]
ZITAT   : „Sie nimmt `quellPfad` als **fertigen Aufrufparameter** entgegen. Wer den Dialog öffnet, wählt `art: 'schrift'` und reicht den **ersten** Pfad der Liste an `importiereSchrift` weiter – das ist die aufrufende, zeichnende Komponente, nicht diese Datei." (#297)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Sie nimmt `quellPfad` als **fertigen Aufrufparameter** entgegen. Wer den Dialog öffnet, wählt `art: 'schrift'` und reicht den **ersten** Pfad der Liste an `importiereSchrift` weiter – das ist die aufrufende, zeichnende Komponente, nicht diese Datei." (#297) #298 sagt dasselbe für das Logo: „Wer den Dialog öffnet, wählt `art: 'logo'` und reicht den **ersten** Pfad der Liste an `importiereLogo` wei

### #327  [anfuehrung]
ZITAT   : **Verbot – kein Ereignis, kein Abonnement eines Main-Push in dieser Datei.** `marken:autoSpeichernStatus` (#278) meldet ausschließlich einen gescheiterten Schreibvorgang; sein Abonnement gehört in die Oberfläche, die den Hinweis anzeigt (vermutlich #305), **nicht** in diese Datei
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**Verbot – kein Ereignis, kein Abonnement eines Main-Push in dieser Datei.** `marken:autoSpeichernStatus` (#278) meldet ausschließlich einen gescheiterten Schreibvorgang; sein Abonnement gehört in die Oberfläche, die den Hinweis anzeigt (vermutlich #305), **nicht** in diese Datei" (#295, STOPP)

### #327  [anfuehrung]
ZITAT   : Diese Datei abonniert **deshalb nichts** und zeigt **keinen** Speicherstatus-Hinweis – das bleibt eine **ungeklärte Lücke**, an derselben Stelle, an der TK 9.15.2 keine „nicht gespeichert"-Anzeige für Marken vorsieht, obwohl `marken:autoSpeichernStatus` (#278) sie bereits sendet.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „Diese Datei abonniert **deshalb nichts** und zeigt **keinen** Speicherstatus-Hinweis – das bleibt eine **ungeklärte Lücke**, an derselben Stelle, an der TK 9.15.2 keine „nicht gespeichert"-Anzeige für Marken vorsieht, obwohl `marken:autoSpeichernStatus` (#278) sie bereits sendet." (#305, STOPP)

### #327  [anfuehrung]
ZITAT   : **ECHTE OFFENE FRAGE: Wer zeigt „deine Marke ist nicht gesichert"?** `marken:autoSpeichernStatus` (#278) ist main-seitig gebaut und in #304 verdrahtet; einen Abonnenten hat es nicht.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**ECHTE OFFENE FRAGE: Wer zeigt „deine Marke ist nicht gesichert"?** `marken:autoSpeichernStatus` (#278) ist main-seitig gebaut und in #304 verdrahtet; einen Abonnenten hat es nicht." (#330, STOPP)

### #327  [anfuehrung]
ZITAT   : **Der Hinweis sitzt in der Reiterleiste, nicht im Reiterinhalt.** Der Rahmen (M7-02) bietet dafür den Schlitz `speicherHinweis` an. *Begründung:* Die Reiterleiste ist neben der Warteschlangen-Leiste die einzige Fläche, die jeden Reiterwechsel überlebt (TK 9.14.2).
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Der Hinweis sitzt in der Reiterleiste, in derselben Fläche wie der Hinweis für Projekt und Vorlagen – NICHT im Reiter [Marken].** *Begründung:* Der Schreibvorgang ist **entprellt**; die Meldung trifft Sekunden nach der letzten Änderung ein, und bis dahin kann der Nutzer längst im Reiter [Zusammenstellen] stehen. Läge der Hinweis im Reiterinhalt, wäre er in genau dem Augenblick unsichtbar, in 

### #327  [anfuehrung]
ZITAT   : **EIGENE** Datei statt eines dritten Zweigs dort, weil #238 eine fremde, bereits abgeschlossene Datei ist
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Die Gegenseite, ausdrücklich benannt:** Man könnte den Hinweis in den Reiter [Marken] legen – dort entsteht der Fehler, dort ist der Nutzer meistens, und die Anzeige stünde neben der Marke, um die es geht. Zwei Dinge geben trotzdem den Ausschlag: der entprellte Zeitversatz oben, und die Tatsache, dass es dann **zwei** Orte für dieselbe Aussage gäbe („X ist nicht gesichert") – einen in der Reiter

### #327  [anfuehrung]
ZITAT   : **Für dich heißt das:** Ruf den Flush auf, warte ihn ab, werte den Rückgabewert **nicht** aus, und schreib **keinen** eigenen Dialog, **keinen** eigenen Wiederholversuch und **kein** eigenes „trotzdem schließen". Sobald die Frage entschieden ist, wird der Marken-Flush **genauso** behandelt wie die beiden anderen; eine Sonderregel nur für Marken wäre der Anfang von drei verschiedenen Beenden-Verhalten in einer Funktion.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **Was dieses Issue leistet:** Ein gescheiterter Flush beim Beenden erzeugt – wie **jeder** andere Schreibversuch, „sofort/entprellt/Flush" (#278) – ein `{ typ: 'fehler', code }` auf `marken:autoSpeichernStatus`. Dieser Hinweis zeigt es an. Der **Zustand** ist damit sichtbar. - **Was dieses Issue NICHT leistet und nicht leisten kann:** Das **Abbrechen** des Beendens, die ursachenbezogene Empfehlu

### #327  [anfuehrung]
ZITAT   : KEINE Ergebnis-Huelle: Ereignisse tragen keine (TK 9.1.1 Punkte 2 und 5).
NAECHSTE: OHNE Hülle und ohne Endzustand (9.1.1 Punkte 5 und 2) // Empfänger:
KONTEXT : ```ts // #278 – src/main/marken-store/speicher-status.ts (DEFINIERENDE QUELLE der Ereignisform) export type MarkenSpeichernEreignis = | { typ: 'gespeichert' } | { typ: 'fehler'; code: MarkenFehlercode | GenerischerFehlercode } // „KEINE Ergebnis-Huelle: Ereignisse tragen keine (TK 9.1.1 Punkte 2 und 5)." // Kanalname (an ipc-gateway zu uebergeben, #304): "marken:autoSpeichernStatus" export functio

### #327  [anfuehrung]
ZITAT   : Interne Übersetzung (verbindlich)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #278, „Interne Übersetzung (verbindlich)" – das VERHALTEN des Senders, auf das sich die // Fehlerpfad-Tabelle unten stützt: // 1. Fehlschlag -> IMMER { typ: 'fehler', code } (auch zweimal hintereinander) // 2. Erfolg NACH einem Fehler -> genau einmal { typ: 'gespeichert' } // 3. Erfolg OHNE vorherigen Fehler -> es wird NICHTS gesendet // („kein Dauerfeuer aus „gespeichert" bei jedem Tastendruck

### #327  [anfuehrung]
ZITAT   : **Der Hinweis sitzt in der Reiterleiste, nicht im Reiterinhalt.** Der Rahmen (M7-02) bietet dafür den Schlitz `speicherHinweis` an.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - „Die Schreib-Invarianten sind **dieselben** wie in 9.5.4: **atomar** (Temp + Rename), **`marken.json.bak`** als letzte heile Version, **`schemaVersion`**, und Speicherfehler werden **sichtbar** gemacht statt still verschluckt – über einen **eigenen** Kanal `marken:autoSpeichernStatus`, gleichartig zu `vorlagen:autoSpeichernStatus` (9.12.1). Ein eigener Kanal ist nötig, weil die Oberfläche „deine

### #327  [anfuehrung]
ZITAT   : nur eine dritte Quelle im vorhandenen `Speicherlage`-Objekt
NAECHSTE: Für die dritte Liste verweist er auf den Reiter **Projekte**:
KONTEXT : - **ECHTE OFFENE FRAGE – lebt der Renderer beim Beenden überhaupt noch lange genug, um diesen Hinweis zu zeigen?** Der Sofort-Flush beim Beenden läuft im Main (`before-quit`, #309); scheitert er, sendet #278 ein `{ typ: 'fehler' }`, und **dieser** Hinweis wäre sein Empfänger. Ist das Fenster zu diesem Zeitpunkt bereits abgebaut, verwirft der Sender die Meldung **still** (so ausdrücklich in #304: b

### #327  [anfuehrung]
ZITAT   : `marken:autoSpeichernStatus` hat keinen Abonnenten
NAECHSTE: macht **keinen** finalen Render;
KONTEXT : - Blockiert von: **#278** (`MarkenSpeichernEreignis` – die definierende Form der Nutzlast; ohne sie wäre der Typ geraten), **#304** (`KANAELE.marken.autoSpeichernStatus` **und** der Sender `verdrahteMarkenSpeicherstatusIPC`; ohne den Registry-Eintrag gibt es in `App.tsx` keinen Kanal zu übergeben), **#309** (trägt den Sender in den Main-Bootstrap ein – ohne diesen Aufruf bleibt die Anzeige dauerha

### #328  [anfuehrung]
ZITAT   : [project-store] erstelleProjekt implementieren
NAECHSTE: - **`project-store` ist die Wahrheit:** die Liste im composer ist nur eine Sicht;
KONTEXT : ## Modul & Datei - Modul: `project-store` [D1] (Main) – **Titel-Präfix `[project-store]`, weil dort das Pflichtfeld befüllt wird**; die Beschaffung der Kennung liegt eine Schicht höher im `ipc-gateway`. - Datei 1 (**bestehend**, Ursprungs-Issue **#33** / M1-21 „[project-store] erstelleProjekt implementieren"): `src/main/project-store/erstelle-projekt.ts` – **ein** neuer Parameter, **ein** neues Fe

### #328  [anfuehrung]
ZITAT   : **ECHTE OFFENE FRAGE, die schwerste dieses Issues: Wer setzt `standardMarkeId` bei einem NEU angelegten Projekt?** `erstelleProjekt` (**#33**, M1-21) baut das initiale `Project` – seine Invarianten nennen ausdrücklich `letzterAusgabeName: null`, von einer Marke weiß es nichts, und **kein** M8-Issue fasst diese Datei an … Damit ist `standardMarkeId` nach diesem Issue ein **Pflichtfeld ohne Befüller für den Neuanlage-Fall**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**ECHTE OFFENE FRAGE, die schwerste dieses Issues: Wer setzt `standardMarkeId` bei einem NEU angelegten Projekt?** `erstelleProjekt` (**#33**, M1-21) baut das initiale `Project` – seine Invarianten nennen ausdrücklich `letzterAusgabeName: null`, von einer Marke weiß es nichts, und **kein** M8-Issue fasst diese Datei an … Damit ist `standardMarkeId` nach diesem Issue ein **Pflichtfeld ohne Befülle

### #328  [anfuehrung]
ZITAT   : Standard-Standardmarke
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **Den `project-store` selbst nachfragen lassen.** Das ist der naheliegende, kurze Weg – und ausdrücklich verboten (s. Invarianten). Er schließt einen **Ring** zwischen zwei Main-Modulen. - **Ein Ausweg im Typ oder ein Vorgabewert.** `standardMarkeId?:`, `| null`, `''` oder eine im Store hinterlegte „Standard-Standardmarke" decken die Lücke zu, statt sie zu schließen – und #320 verbietet jeden di

### #328  [anfuehrung]
ZITAT   : **MELDEN, aber hier nichts tun** … `AKTUELLE_SCHEMA_VERSION` bleibt auf `1` … **Melden**, damit die Frage ein Zuhause bekommt; **nicht** hier hochzählen, auch nicht „vorsorglich".
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **ECHTE OFFENE FRAGE: Muss `AKTUELLE_SCHEMA_VERSION` steigen, weil `project.json` ab jetzt ein Pflichtfeld mehr trägt?** #320 hat die Frage ausdrücklich offen gelassen und weitergereicht: „**MELDEN, aber hier nichts tun** … `AKTUELLE_SCHEMA_VERSION` bleibt auf `1` … **Melden**, damit die Frage ein Zuhause bekommt; **nicht** hier hochzählen, auch nicht „vorsorglich"." (#320) Mit diesem Issue vers

### #328  [anfuehrung]
ZITAT   : Beispielprojekt anlegen
NAECHSTE: stattdessen neu anlegen.
KONTEXT : - **ECHTE OFFENE FRAGE: Muss `AKTUELLE_SCHEMA_VERSION` steigen, weil `project.json` ab jetzt ein Pflichtfeld mehr trägt?** #320 hat die Frage ausdrücklich offen gelassen und weitergereicht: „**MELDEN, aber hier nichts tun** … `AKTUELLE_SCHEMA_VERSION` bleibt auf `1` … **Melden**, damit die Frage ein Zuhause bekommt; **nicht** hier hochzählen, auch nicht „vorsorglich"." (#320) Mit diesem Issue vers

### #328  [anfuehrung]
ZITAT   : Standard-Standardmarke
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : - **ECHTE OFFENE FRAGE: Muss `AKTUELLE_SCHEMA_VERSION` steigen, weil `project.json` ab jetzt ein Pflichtfeld mehr trägt?** #320 hat die Frage ausdrücklich offen gelassen und weitergereicht: „**MELDEN, aber hier nichts tun** … `AKTUELLE_SCHEMA_VERSION` bleibt auf `1` … **Melden**, damit die Frage ein Zuhause bekommt; **nicht** hier hochzählen, auch nicht „vorsorglich"." (#320) Mit diesem Issue vers

### #329  [anfuehrung]
ZITAT   : Die vier Edits, die es erreichbar machen, gehören **nicht** hierher […] **Ausführender: ein eigenes Nachzieh-Issue, das der Auftraggeber anlegt.**
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Dieses Issue ist ein EDIT an sechs bereits abgenommenen Dateien aus vier Modulen. Es legt keine neue Datei an.** Es ist der Nachzug, den **#324** in seinem Abschnitt „Die benannten Edits an fremden Dateien" benannt und einem eigenen Issue zugewiesen hat – wörtlich: „Die vier Edits, die es erreichbar machen, gehören **nicht** hierher […] **Ausführender: ein eigenes Nachzieh-Issue, das der Auftrag

### #329  [anfuehrung]
ZITAT   : steht sie schon da, NICHT ein zweites Mal importieren: ein doppelter Import derselben Kennung ist ein Uebersetzungsfehler.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **#313 und #314 laufen zuerst.** Dieses Issue setzt darauf auf und trägt seine Änderung **zusätzlich** ein. 2. **Die Import-Zeile für `MarkenZugang` wird hier NICHT geschrieben.** #313 setzt sie (`import type { MarkenZugang } from './sichten'`); #314 hat den Vorbehalt bereits ausgeschrieben („steht sie schon da, NICHT ein zweites Mal importieren: ein doppelter Import derselben Kennung ist ein U

### #329  [anfuehrung]
ZITAT   : diese Zeile kann keine haben
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **`standardMarkeId` steht als NEUNTES und LETZTES Feld in `ProjektMeta`, mit dem Kommentar aus TK 9.5.2, Zeichen für Zeichen.** *Begründung:* TK 9.5.2 führt es an letzter Stelle, und #247 hat sich die Zeichengleichheit selbst auferlegt: „**Die Kommentare werden mitübernommen, Zeichen für Zeichen.**" (#247, ENTSCHIEDEN 3). Eine andere Position wäre eine Vertragsabweichung, die niemand bemerkt, w

### #329  [anfuehrung]
ZITAT   : damit `inhalte-zugaenge.ts` weiterhin // GENAU EINE Bezugsquelle
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // #197 – src/renderer/app-shell/sichten.ts (DEFINIERENDE QUELLE des Projektzugangs; Ausschnitt) export interface Projektsicht { projekt: Project | null // null = noch kein Projekt geladen ladefehler: { code: string; meldung: string } | null } export interface ProjektZugang { hole: () => Projektsicht setzeProjekt: (projekt: Project) => void // … dazu unveraendert: lade, setzeListe, gleicheElementA

### #329  [anfuehrung]
ZITAT   : Die Wurzel `projektVerwaltung` bekommt **fünf** Eigenschaften: `sichtbar`, `projekt` (`zugaenge.projektRoh`, `toBe`), `zeichnen` (`zugaenge.zeichnen`, `toBe`), `leereProjektHistorie` (`toBe` zur Funktion aus M7-41) und `wechsleZuZusammenstellen` (`toBe` zu `umgebung.wechsleZuZusammenstellen`)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **Dieser Satz wird ersetzt.** Er lautet ab hier: *Schreibe die **sechs** Felder zeichengleich ab, füge **kein** siebtes hinzu und lass **keines** weg.* Der zweite Halbsatz galt dem **Bauplatz von #252** und bleibt für #252 richtig – **dieses** Issue hat `inhalte.tsx` im eigenen Dateibereich und ändert dort genau die eine, oben ausgeschriebene Zeile. *Warum die Änderung nötig ist:* Ohne sie bleibt 

### #329  [anfuehrung]
ZITAT   : Was dieses Issue ERSETZT
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : **VERMERK FÜR DEN AUFTRAGGEBER (kein Auftrag an den umsetzenden Agenten).** Drei Punkte: 1. **#324 trägt nach diesem Issue überholte Tatsachenbehauptungen** – „ACHTUNG: `ProjektMeta` traegt HEUTE KEINE `standardMarkeId`" und, im STOPP-Block, „Solange Edit 1 (s. o.) nicht gelaufen ist, kann der Aufrufer ihn nicht liefern – das ist bekannt und **nicht erneut zu melden**." Beides ist mit diesem Issue

### #329  [blockzitat]
ZITAT   : „**`inhalte.tsx` wird damit von DREI Issues angefasst** (#313, #314 und diesem Nachzug). Die Änderungen berühren keine gemeinsame Zeile; die Reihenfolge #313 → #314 → Nachzug ist einzuhalten." (#324)
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : „**`inhalte.tsx` wird damit von DREI Issues angefasst** (#313, #314 und diesem Nachzug). Die Änderungen berühren keine gemeinsame Zeile; die Reihenfolge #313 → #314 → Nachzug ist einzuhalten." (#324) | | **#313** | **#314** | **#329** (dieses Issue) | |---|---|---|---| | Anlass | die drei `…WurzelProps.marke` fallen weg | `ReiterId` bekommt einen fünften Wert | die `projekt-verwaltung` braucht den

### #330  [anfuehrung]
ZITAT   : Liefert entweder einen vollständigen Zugang mit gefüllter Übersicht oder einen benannten Fehler – **NIE** einen Zugang mit `hole() === null` im Erfolgsfall.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Die Liste kommt aus der Prop `marken`, die geöffnete Marke aus dem direkten Import von #295.** Kein Widerspruch, sondern die Arbeitsteilung aus #305 (`MarkenZugang` trägt nur die Listen-Sicht, s. dort). Diese Datei liegt **innerhalb** des Editor-Ordners und darf den Nachbarn direkt importieren; #295 verbietet das nur Modulen **außerhalb**. Für die **Liste** gilt trotzdem die Prop: `app-shell`

### #330  [anfuehrung]
ZITAT   : Wähle links eine Marke
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : 1. **Die Liste kommt aus der Prop `marken`, die geöffnete Marke aus dem direkten Import von #295.** Kein Widerspruch, sondern die Arbeitsteilung aus #305 (`MarkenZugang` trägt nur die Listen-Sicht, s. dort). Diese Datei liegt **innerhalb** des Editor-Ordners und darf den Nachbarn direkt importieren; #295 verbietet das nur Modulen **außerhalb**. Für die **Liste** gilt trotzdem die Prop: `app-shell`

### #330  [anfuehrung]
ZITAT   : Bewusst NUR die Listen-Sicht: oeffneMarke/holeGeoeffneteMarke … werden NICHT weitergereicht
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // ── #305 – src/renderer/app-shell/marken-zugang.ts (DEFINIERENDE QUELLE von MarkenZugang) ── export interface MarkenZugang { lade: () => Promise<Ergebnis<MarkenUebersicht, string>> // (erneutes) Laden über marken:listeMarken hole: () => MarkenUebersicht | null // Momentaufnahme; null vor dem 1. Laden aufGeaendert: (hoerer: (uebersicht: MarkenUebersicht) => void) => () => void } // „Bewusst NUR d

### #330  [anfuehrung]
ZITAT   : Der Editor … iteriert ÜBER DIESES ARRAY, nicht über Object.keys(marke.farben)
NAECHSTE: der Editor sperrt sie bereits vorher (9.12.2).
KONTEXT : // ── #296 – src/renderer/marken-editor/farben-bearbeiten.ts ── /** Die dreizehn Farb-Rollen in fester Anzeigereihenfolge (TK 9.11.2) – NICHT alphabetisch sortiert. */ export const FARB_ROLLEN: readonly FarbRolle[] export async function setzeFarbe( markeId: string, rolle: FarbRolle, wert: string, ): Promise<Ergebnis<Marke, string>> // „Der Editor … iteriert ÜBER DIESES ARRAY, nicht über Object.key

### #330  [anfuehrung]
ZITAT   : Exportiert, damit die zeichnende Komponente ihn UNVERÄNDERT anzeigt
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // ── #297 – src/renderer/marken-editor/schriften-bearbeiten.ts ── /** Die vier Schrift-Rollen in fester Anzeigereihenfolge (TK 9.11.2) – NICHT alphabetisch sortiert. */ export const SCHRIFT_ROLLEN: readonly SchriftRolle[] export interface SchriftAnzeige { rolle: SchriftRolle schrift: Schrift // vollständig, wie in `marke.schriften[rolle]` importiert: boolean // === (schrift.herkunft === 'importie

### #330  [anfuehrung]
ZITAT   : Diese // Datei selbst erzwingt die Reihenfolge nicht … das ist Aufgabe des Editor-Bildschirms
NAECHSTE: - **Determinismus durch sichtbare Reihenfolge:** Reihenfolge zweier Aufträge = Einreih-Reihenfolge, im Panel sichtbar.
KONTEXT : // ── #302 – src/renderer/marken-editor/loeschen-vorwarnung.ts ── export interface Loeschvorschau { darfLoeschen: boolean // false bei eingebaut:true ODER bei mindestens einer Referenz // in EINER der DREI Listen von Markennutzung eingebaut: boolean nutzung: Markennutzung | null // null NUR wenn eingebaut:true (Prüfung wird dann übersprungen) } export async function ermittleLoeschvorschau(marke: M

### #330  [anfuehrung]
ZITAT   : Die aufrufende Komponente hat beide Werte ohnehin im // Formular – sie übergibt sie zusammen.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // ── #307 – src/renderer/marken-editor/slogan-bearbeiten.ts ── export async function setzeSlogan( markeId: string, slogan: { text: string; aktiv: boolean }, ): Promise<Ergebnis<Marke, string>> // GANZES Feld, beide Schlüssel zusammen: „Die aufrufende Komponente hat beide Werte ohnehin im // Formular – sie übergibt sie zusammen." Wann gerufen wird, „entscheidet die aufrufende // Komponente" (#307)

### #330  [anfuehrung]
ZITAT   : entscheidet die aufrufende // Komponente
NAECHSTE: Hier entscheidet sie automatisch statt zu warnen:
KONTEXT : // ── #307 – src/renderer/marken-editor/slogan-bearbeiten.ts ── export async function setzeSlogan( markeId: string, slogan: { text: string; aktiv: boolean }, ): Promise<Ergebnis<Marke, string>> // GANZES Feld, beide Schlüssel zusammen: „Die aufrufende Komponente hat beide Werte ohnehin im // Formular – sie übergibt sie zusammen." Wann gerufen wird, „entscheidet die aufrufende // Komponente" (#307)

### #330  [anfuehrung]
ZITAT   : Die Oberfläche … ruft baueVorlagenHinweis mit dem alten Wert aus holeGeoeffneteMarke() und dem // neuen Wert aus dem Formular.
NAECHSTE: (kein aehnlicher Treffer)
KONTEXT : // ── #308 – src/renderer/marken-editor/sicherheitsabstand-bearbeiten.ts ── export interface Sicherheitsabstand { horizontal: number; vertikal: number } export async function setzeSicherheitsabstand( markeId: string, sicherheit: Sicherheitsabstand, ): Promise<Ergebnis<Marke, string>> /** Baut den Hinweistext, den die Oberfläche zeigt, wenn der Abstand WÄCHST … Gibt `null` zurück, * wenn beide Wert