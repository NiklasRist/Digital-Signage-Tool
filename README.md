# Digital-Signage-Tool

Desktop-Werkzeug für das Fitnessstudio **Fitnessworld24** (Baller Gruppe). Es stellt Videos und
gestaltete Aktions-Segmente zu einer Wiedergabeliste zusammen und erzeugt daraus **eine durchgehende
MP4**, die von einem USB-Stick am Fernseher in Endlosschleife läuft.

Electron · TypeScript · React · Vite · gebündeltes ffmpeg. Verpackt als portable EXE (Windows 10/11,
macOS 13+) – kein Installer, keine Administratorrechte.

---

## ⚠ Wenn du ein Agent bist: lies zuerst `CLAUDE.md`

**In [`CLAUDE.md`](CLAUDE.md) steht alles, was für die Arbeit an diesem Projekt wichtig ist.** Nicht
in dieser Datei. Der Abschnitt **„STAND HEUTE"** ganz oben gilt vor allen älteren Angaben und
enthält:

- **wo das Projekt steht** – was gebaut ist, was fehlt, je Meilenstein
- **wie du herausfindest, was zu tun ist** – `python tools/bereitschaft.py`, samt seiner Grenzen
- **entschiedene Anforderungsänderungen, die noch nicht in den Dokumenten stehen** – bau nichts,
  was sie berührt, bevor AD und TK nachgezogen sind
- **welche Werkzeuge es schon gibt**, damit du sie nicht ein zweites Mal baust
- **die Arbeitsweise beim Bauen** – Gegenproben, Rücknahme-Belege und die Fallen, die dieses Projekt
  teuer gelernt hat
- **offene Entscheidungen und Befunde**

Alles darunter in `CLAUDE.md` ist gewachsene Historie. Sie bleibt stehen, weil die **Begründungen**
darin wertvoll sind – aber sie ist Vergangenheit, nicht Anweisung.

---

## Die zwei maßgeblichen Dokumente

Die Wahrheit über das Produkt steht nicht im Code, sondern in:

| Dokument | Inhalt |
|---|---|
| `docs/Anforderungsdokument_Digital-Signage-Tool.md` | das **WAS** – Funktionen, Regeln, Ausgabe-Profil, Akzeptanz |
| `docs/Technisches_Konzept_Digital-Signage-Tool.md` | das **WIE** – Architektur, Datenbestand, Datenfluss, Modul-Verträge |

**Markdown ist die Quelle der Wahrheit.** Die `.docx`-Fassungen werden daraus erzeugt
(`node tools/generate-docx.js <in.md> <out.docx>`) und müssen synchron gehalten werden.

Die Kette läuft in **eine** Richtung: Anforderungsdokument → Technisches Konzept → GitHub-Issues
(die beides **wörtlich** zitieren) → Code. Wer den Code an den Dokumenten vorbei ändert, erzeugt
einen Widerspruch, den der nächste Agent nicht auflösen kann.

---

## Befehle

```bash
npm run dev              # Entwicklungslauf
npm run typecheck        # alle vier tsconfig-Bereiche
npm run lint
npm test                 # Unit-Tests (schnell)
npm run test:integration # echtes ffmpeg/Electron – dauert Minuten
npm run build
npm run dist             # portable EXE
```

```bash
python tools/bereitschaft.py       # welche Issues sind JETZT baubar
python tools/zitate-pruefen.py     # Zitat-Abgleich nach einer Vertragsänderung
```

---

## Aufbau

```
src/main/        Node-Seite: Dateisystem, ffmpeg, Warteschlange, IPC-Gateway
src/renderer/    React-Seite: Oberfläche, Canvas, Vorschau
src/shared/      geteilte Verträge – darf KEIN node:-Modul importieren
tests/unit/      schnell, ohne echte Prozesse
tests/integration/  echtes ffmpeg/Electron, Zeitgrenze 120 s
tools/           Werkzeuge (s. CLAUDE.md)
docs/            Anforderungsdokument, Technisches Konzept, Issue-Volltexte
```

Renderer und Main reden **ausschließlich** über den typisierten IPC-Vertrag. Nur der Main berührt
ffmpeg und das Dateisystem – das ist über getrennte `tsconfig`-Bereiche erzwungen, nicht nur
verabredet.
