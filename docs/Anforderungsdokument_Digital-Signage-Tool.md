# Anforderungsdokument – Digital-Signage-Tool

**Projekt:** Digital-Signage-Tool für das Fitnessstudio der Baller Gruppe
**Auftraggeber:** Baller Gruppe
**Bearbeitung:** [Name], Berufspraktikum
**Datum:** 30.06.2026
**Version:** 0.3 (Entwurf)
**Status:** In Abstimmung

---

## 1. Einleitung und Zielsetzung

Im Rahmen des Berufspraktikums bei der Baller Gruppe wird ein Digital-Signage-Tool für das Fitnessstudio der Gruppe konzipiert und entwickelt. Ziel ist eine moderne, flexibel einsetzbare Softwarelösung, mit der Produktwerbung, studiointerne Angebote und sportbezogene Videoinhalte zentral verwaltet und auf dem Studio-Bildschirm professionell ausgespielt werden können.

Der Kern des Werkzeugs ist eine intern genutzte Anwendung, mit der Mitarbeitende verschiedene Medieninhalte (Videos sowie Produkte/Aktionen) strukturiert pflegen, in eine gewünschte Reihenfolge bringen und daraus **ein einziges, fertiges Ausgabevideo** erzeugen. Dieses Video wird auf einem USB-Speicher abgelegt und am Studio-Fernseher als Endlosschleife wiedergegeben.

Im Fokus stehen eine intuitive Bedienbarkeit, eine stabile Systemstruktur sowie eine flexible und visuell ansprechende Ausspielung der Inhalte im Studioalltag.

---

## 2. Ausgangslage und Rahmenbedingungen

### 2.1 Fachlicher Kontext

Anzuzeigen sind drei Arten von Inhalten:

- **Produktwerbung** – beworbene Produkte des Studios bzw. der Gruppe.
- **Studiointerne Angebote / Aktionen** – zeitlich begrenzte Aktionen, Hinweise, Informationen.
- **Sportbezogene Videoinhalte** – bestehende Videoclips (z. B. Übungen, Imagevideos).

### 2.2 Hardware-Umgebung (Wiedergabegerät)

Die Wiedergabe erfolgt auf einem vorhandenen Consumer-Fernseher. Es steht **keine** zusätzliche Abspiel-Hardware (z. B. Mediaplayer, Mini-PC) zur Verfügung. Die Inhalte werden über einen **USB-Speicher** bereitgestellt und über den integrierten Media Player des Fernsehers im **Demo-/Store-Modus** als Schleife abgespielt.

| Merkmal | Wert |
|---|---|
| Modell (MN) | UE85AU7170UXXN (85", 4K UHD, Tizen) |
| Seriennummer (SN) | 0EAS3SUT800009L |
| Firmware (FW) | T-KSU2EDEUC-2111.1 |
| Firmware-Paket (FC) | SWU-OU_T-KSU2EDEUC_2111_221104 |
| Modell-ID (MI) | T-KSU2EDEUC |
| Region (LS) | EU_BENELUX |
| Geräte-ID (DI) | MTCAXEUHRAU3G |
| MAC-Adresse (MA) | 04:B9:E3:F6:E4:80 |
| Empfohlene Ausgabeauflösung | 3840 × 2160 (4K) bzw. 1920 × 1080 als Fallback |

### 2.3 Organisatorische Rahmenbedingungen

- Die Anwendung wird **intern** genutzt; es wird maximal **ein Nutzer gleichzeitig** mit dem Tool arbeiten.
- Es ist **keine Netzwerk- oder Cloud-Anbindung** erforderlich; das Tool arbeitet lokal/offline.
- Die Anwendung läuft auf einem Arbeitsplatzrechner (Laptop), **nicht** auf dem Fernseher.

---

## 3. Systemüberblick / Lösungskonzept

Das System ist bewusst zweigeteilt, um die Einschränkungen des Consumer-Fernsehers zu umgehen:

1. **Management- und Render-Tool (auf dem Laptop):** Verwaltung von Videos und Produkten/Aktionen, Festlegung der Reihenfolge, Rendering zu einer einzigen MP4-Datei, Ablage auf USB.
2. **Wiedergabe (am Fernseher):** Der Fernseher gibt die fertige MP4 vom USB-Speicher im Demo-/Store-Modus als Endlosschleife aus.

```
[Laptop: Management- & Render-Tool]  --rendert-->  [eine MP4]  --kopiert-->  [USB-Stick]  --steckt in-->  [TV: Demo-Modus, Endlosschleife]
```

**Begründung der Entkopplung:** Eine eigene App direkt auf dem Fernseher ist für den Dauerbetrieb ungeeignet, da Consumer-Geräte sideloadete Apps nicht automatisch beim Booten starten, sich nach Abstürzen nicht selbst wiederherstellen und durch Firmware-Updates oder ablaufende Zertifikate ausfallen können. Die gewählte Lösung verlagert die gesamte Software auf den Laptop und nutzt am Fernseher nur die robuste, eingebaute USB-Wiedergabe.

---

## 4. Funktionale Anforderungen

Priorität nach MoSCoW: **Muss** (zwingend), **Soll** (wichtig), **Kann** (optional).

| ID | Anforderung | Beschreibung | Priorität |
|---|---|---|---|
| FA-01 | Video importieren | Ein oder mehrere bestehende Videos (mind. MP4) können in das Projekt importiert und in einer Liste verwaltet werden. | Muss |
| FA-02 | Produkt/Aktion anlegen | Produkte bzw. Aktionen können neu angelegt werden (Felder z. B.: Titel, Beschreibung/Text, optional Preis, optional Bild, Anzeigedauer). | Muss |
| FA-03 | Inhalte bearbeiten/löschen | Vorhandene Videos und Produkte/Aktionen können bearbeitet und entfernt werden. | Muss |
| FA-04 | Aktions-Segment erzeugen | Aus einem Produkt/einer Aktion (Text + optional Bild) wird ein anzeigbares Video-/Bildsegment mit definierter Anzeigedauer erzeugt. | Muss |
| FA-05 | Reihenfolge festlegen | Alle Elemente (Videos + Aktions-Segmente) können zu einer Wiedergabeliste zusammengestellt und in der Reihenfolge angeordnet werden (z. B. per Drag-and-drop). | Muss |
| FA-06 | Anzeigedauer steuern | Je Element (insb. Aktions-Segmente) ist eine individuelle Anzeigedauer einstellbar. | Soll |
| FA-07 | Vorschau | Die zusammengestellte Sequenz kann vor dem Rendern in der Anwendung vorab betrachtet werden. | Soll |
| FA-08 | Ausgabe-Rendering | Aus der Wiedergabeliste wird **eine einzige MP4-Datei** in definierter Auflösung und Codierung erzeugt (Verkettung aller Segmente). | Muss |
| FA-09 | Export auf USB | Die fertige MP4 kann in einen Zielordner bzw. direkt auf den USB-Speicher exportiert werden. | Muss |
| FA-10 | Projekt speichern/laden | Eine Zusammenstellung kann gespeichert und später wieder geladen werden, um Inhalte effizient zu aktualisieren statt neu anzulegen. | Soll |
| FA-11 | Einheitliches Grundlayout | Aktions-Segmente verwenden ein einheitliches Grundlayout im Corporate Design von Fitnessworld24 (Logo, Farbwelt, Typografie), abgeleitet aus dem Markenauftritt der Website fitnessworld24.li. | Soll |
| FA-12 | Gestalterischer Spielraum | Innerhalb des Grundlayouts sind definierte Bereiche frei gestaltbar (z. B. Überschrift, Motiv-/Produktbild, Preis bzw. Call-to-Action, Akzentfarbe), damit jede Werbung individuell und wirkungsvoll gestaltet werden kann. | Soll |

### 4.1 Gestaltung der Aktions-Segmente (Corporate Design)

Aktions-Segmente folgen dem Markenauftritt von Fitnessworld24 (24/7-Fitnessstudio, Weißensberg/Lindau am Bodensee). Gestalterische Grundlage ist die Website fitnessworld24.li. Ziel ist eine **Balance aus Wiedererkennbarkeit und Werbewirkung**: ein fester Markenrahmen sorgt für ein einheitliches, professionelles Erscheinungsbild, während klar definierte freie Bereiche jeder Aktion einen eigenen, ansprechenden Auftritt erlauben.

**Fester Rahmen (einheitlich, FA-11):**

- Studio-Logo an einer definierten Position.
- Durchgängige Markenfarbwelt und Typografie gemäß Website.
- Einheitliche Ränder/Sicherheitsabstände, abgestimmt auf die TV-Auflösung (4K bzw. 1080p) inkl. Rand zum Bildschirmrand.
- Optionaler, wiederkehrender Marken-Slogan im Stil der Website (z. B. „Trainiere wann du willst. Nicht wann es passt.").

**Variable Bereiche (Spielraum, FA-12):**

- Überschrift / Aktionstext (z. B. Angebot, Aktionsname).
- Motiv- oder Produktbild.
- Preis bzw. Call-to-Action (z. B. „Gratis Probetraining sichern").
- Akzentfarbe oder Aktions-Badge zur Hervorhebung.

### 4.2 Design-Tokens / Style-Guide

Aus dem Markenauftritt (Export der Website-Tokens) ergibt sich folgende Gestaltungsbasis. Wix-spezifische Editor-/Systemfarben wurden aussortiert (siehe Hinweis unten).

**Farben**

| Rolle | Hex | Anmerkung |
|---|---|---|
| Primär / Akzent (Rot) | `#FF4040` | **Primärfarbe** – Signal für Aktionen, Badges, CTA |
| Akzent kräftig | `#DF3131` | satte Variante |
| Akzent alternativ | `#D62B2B` | zweite Rot-Stufe |
| Dunkelrot | `#971316` | Akzenttext, Tiefe |
| Bordeaux / sehr dunkel | `#4B090B` | dunkle Flächen, starker Kontrast |
| Rot-Tint hell | `#F5AEAF` | dezente Hintergründe/Flächen |
| Schwarz / Text | `#212121` / `#202020` | Haupttext |
| Hintergrund dunkel (Charcoal) | `#2F2E2E` | dunkle Segment-Hintergründe |
| Weiß | `#FFFFFF` | Flächen, Text auf Dunkel |
| Grautöne | `#8F8F8F`, `#646464`, `#A0A09F`, `#CCCCCC`, `#E2E2E2` | Sekundärtext, Linien, Flächen |

**Typografie**

| Rolle | Schrift | Anmerkung |
|---|---|---|
| Headline / Display (elegant) | Playfair Display | Serif, für Überschriften |
| Headline / Display (kräftig) | Avenir 85 Heavy bzw. Arial Black | für plakative Werbe-Headlines/Slogans |
| Fließtext / UI | Helvetica / Helvetica Neue (Light, Roman, Bold) | Standardtext |

**Form & Tiefe**

- Eckenradius: Buttons/Badges als Pille (`30–50px`), Karten/Flächen `8–10px`, kleine Elemente `2px`.
- Schatten (Karten/Flächen, dezent): `0 4px 8px rgba(0,0,0,.1)`.

**Hinweis (aussortierte Wix-Artefakte):** Das Editor-Blau `#116DFF` (inkl. der zugehörigen Fokus-Schatten), das Standard-Link-Blau `#0000EE`, die Wix-Systemschrift „Madefor" sowie unaufgelöste Theme-Variablen (`color_xx`, Ricos-Text-Tupel) und CSS-Systemfarben (`Highlight`) gehören **nicht** zum Studio-Branding und werden nicht verwendet.

**Logo & Primärfarbe (geklärt):** Die verbindliche Primärfarbe ist `#FF4040`. Das offizielle Logo liegt vor (Quelle: Markenauftritt / Website).

---

## 5. Nicht-funktionale Anforderungen

| ID | Anforderung | Beschreibung | Priorität |
|---|---|---|---|
| NFA-01 | Bedienbarkeit | Übersichtliche, intuitive Oberfläche, ohne technische Vorkenntnisse durch Studio-Personal bedienbar. | Muss |
| NFA-02 | Stabilität | Die Anwendung arbeitet zuverlässig; ein Renderlauf läuft reproduzierbar und ohne Datenverlust durch. | Muss |
| NFA-03 | Ausgabe-Kompatibilität | Das erzeugte Video ist mit dem Media Player des Samsung-Fernsehers kompatibel (Container/Codec, z. B. MP4 mit H.264-Video und AAC-Audio). | Muss |
| NFA-04 | USB-Kompatibilität | Die Ausgabe funktioniert von einem gängig formatierten USB-Speicher (z. B. exFAT/FAT32). | Muss |
| NFA-05 | Performance | Das Rendern einer üblichen Sequenz erfolgt in vertretbarer Zeit auf dem Arbeitsplatzrechner. | Soll |
| NFA-06 | Offline-Fähigkeit | Die Anwendung funktioniert vollständig lokal, ohne Internet- oder Serververbindung. | Muss |
| NFA-07 | Wartbarkeit | Klar strukturierter, dokumentierter Aufbau, damit das Tool später erweitert werden kann. | Soll |
| NFA-08 | Portabilität | Die Anwendung lässt sich auf einem Standard-Arbeitsplatzrechner einrichten und betreiben. | Soll |

---

## 6. Technische Rahmenbedingungen (Vorschlag)

Die konkrete Technologiewahl ist nicht festgeschrieben; vorgeschlagen wird:

- **Render-Engine:** `ffmpeg` für das Verketten der Clips, das Erzeugen der Aktions-Segmente (Bild/Text → Videosegment) und das Encoding der finalen MP4.
- **Benutzeroberfläche:** Web- oder Desktop-Oberfläche (z. B. Browser-App oder Electron) mit Liste, Drag-and-drop-Reihenfolge und Vorschau.
- **Datenhaltung:** lokale Speicherung der Projektdaten (z. B. JSON oder SQLite) sowie der importierten Medien im Dateisystem.
- **Zielformat der Ausgabe:** MP4 (H.264 / AAC), 3840 × 2160 oder 1920 × 1080.

---

## 7. Wiedergabe am Fernseher (Demo-Modus)

Die Wiedergabe der fertigen MP4 erfolgt über den eingebauten Media Player. Folgende Punkte sind für einen stabilen Dauerbetrieb relevant:

- **Wiederholung:** Quelle USB wählen und „Wiederholen / Repeat All" aktivieren, damit das Video als Endlosschleife läuft.
- **Demo-/Store-Modus:** Über den Store-Modus (mit deaktiviertem Demo-Overlay/E-POP) kann der Fernseher die USB-Schleife nach dem Einschalten automatisch starten. Dieses Verhalten ist **modell- und firmwareabhängig und am vorhandenen Gerät zu verifizieren** (siehe Risiken).
- **Energieoptionen:** Automatisches Ausschalten, Energiesparmodus und Bildschirmschoner sind zu deaktivieren, damit der Loop nicht unterbrochen wird.
- **Aktualisierung der Inhalte:** Inhalte werden aktualisiert, indem die MP4 auf dem USB-Speicher durch eine neue Version ersetzt wird.

---

## 8. Abgrenzung (Out of Scope)

Nicht Bestandteil der ersten Version:

- Entwicklung und Deployment einer App **direkt auf dem Fernseher** (Tizen/Smart-TV-App).
- Cloud-Anbindung, Netzwerk-Synchronisation oder Fernverwaltung.
- Mehrbenutzerbetrieb bzw. gleichzeitige Bearbeitung.
- Zeit-/Kalendersteuerung (Scheduling) der Wiedergabe.
- Verwaltung mehrerer Standorte/Bildschirme von zentraler Stelle.
- Automatische Verteilung des Videos (außer Ablage auf USB).

---

## 9. Annahmen

- Es ist zunächst **ein** Studio-Bildschirm zu bespielen (Prototyp/erste Ausbaustufe).
- Die Inhalte (Videos, Produktinfos, Bilder) liegen in verwertbarer Form vor bzw. werden vom Studio bereitgestellt.
- Der Fernseher verbleibt im Studio dauerhaft eingeschaltet bzw. wird täglich von Personal eingeschaltet.
- Das Ausgabevideo wird voraussichtlich **ohne Ton** (stummgeschaltet) wiedergegeben.

---

## 10. Risiken und offene Punkte

| ID | Thema | Beschreibung / zu klären |
|---|---|---|
| R-01 | Auto-Start im Demo-Modus | Ob der konkrete Fernseher (UE85AU7170, FW T-KSU2EDEUC-2111.1) die USB-Schleife nach dem Einschalten automatisch startet, muss am Gerät getestet werden. |
| R-02 | Manueller Neustart | Ohne funktionierenden Auto-Start muss der Loop nach Stromausfall/Einschalten manuell gestartet werden – Ablauf für das Personal definieren. |
| R-03 | Codec-/Format-Kompatibilität | Konkrete Encoding-Parameter sind am Gerät zu verifizieren (Auflösung, Bitrate, Audiospur). |
| R-04 | Steuerleisten-Einblendung | Beim Wiederholen kann sich kurz eine Bedienleiste einblenden; durch eine einzige lange MP4 wird dies minimiert. |
| R-05 | Energie-/Timeout-Verhalten | Energiespar- und Abschalt-Einstellungen müssen korrekt gesetzt sein, damit die Schleife nicht abbricht. |
| R-06 | Ton | Voraussichtlich **kein Ton** – das Video wird stummgeschaltet ausgespielt (Audio würde im Studio stören). Finale Festlegung steht noch aus. |

---

## 11. Ausbaustufen (Roadmap, optional)

Bei späterem Bedarf ohne Architekturbruch erweiterbar:

- **Dedizierter Player (z. B. Raspberry Pi):** ermöglicht echten Auto-Start beim Booten und automatische Wiederherstellung nach Absturz.
- **Mehrere Studios / zentrale Verwaltung:** zentrale Inhaltsverwaltung mit Verteilung an mehrere Bildschirme.
- **Scheduling:** zeit- oder tagesabhängige Steuerung der angezeigten Inhalte.

---

## 12. Akzeptanzkriterien

Die erste Version gilt als erfolgreich, wenn:

1. Videos sowie Produkte/Aktionen über die Oberfläche angelegt, bearbeitet, gelöscht und in der Reihenfolge angeordnet werden können (FA-01 bis FA-05).
2. Aus der Zusammenstellung **eine** abspielbare MP4-Datei erzeugt und auf einen USB-Speicher exportiert wird (FA-08, FA-09).
3. Diese MP4 auf dem Studio-Fernseher als Endlosschleife wiedergegeben wird (Abschnitt 7).
4. Die Bedienung ohne technische Vorkenntnisse möglich ist (NFA-01).

---

## 13. Glossar

- **Digital Signage:** Digitale Beschilderung – computergesteuerte Anzeige von Inhalten auf Bildschirmen.
- **Aktions-Segment:** Aus einem Produkt/einer Aktion erzeugter Video- oder Bildabschnitt mit fester Anzeigedauer.
- **Rendering:** Erzeugen der finalen Videodatei aus den zusammengestellten Einzelelementen.
- **Demo-/Store-Modus:** Betriebsmodus des Fernsehers, der u. a. die automatische USB-Wiedergabe ermöglicht.
