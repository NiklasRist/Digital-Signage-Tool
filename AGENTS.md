# Agent-Einstieg

**Die vollständige Übergabe steht in [`CLAUDE.md`](CLAUDE.md).** Lies sie zuerst und vollständig –
unabhängig davon, welches Werkzeug du bist. Der Dateiname ist historisch; der Inhalt ist
werkzeugneutral.

Diese Datei ist bewusst nur ein Zeiger. Eine zweite Kopie derselben Angaben würde in diesem Projekt
innerhalb weniger Tage auseinanderlaufen – genau die Fehlerklasse, gegen die hier an mehreren
Stellen gearbeitet wird.

---

## Das Wichtigste in Kürze

**Die Wahrheit steht in den Dokumenten, nicht im Code.** Die Kette läuft in **eine** Richtung:

```
docs/Anforderungsdokument_…md   (das WAS)
  → docs/Technisches_Konzept_…md (das WIE)
    → GitHub-Issues (zitieren beides WÖRTLICH)
      → Code
```

Ein Issue ist ein Arbeitspaket mit einem Block **„Signatur (verbindlich)"**. Du füllst **nur den
Rumpf**. Signaturen ändert man im Issue, nicht in der Datei. Widerspricht ein Issue dem gebauten
Code, **gewinnt der gebaute Code** – und du **meldest** den Widerspruch, statt ihn stillschweigend
aufzulösen.

**Bevor du anfängst:**

```bash
python tools/bereitschaft.py     # welche Issues sind JETZT baubar
```

**Zwei Anforderungsänderungen sind entschieden und dokumentiert** (AD v1.6, TK v3.18): die
**projektweite Standarddauer** (je Aktion überschreibbar) und die **Streichung der Elementart
`bild`**. Details im Abschnitt „STAND HEUTE" von `CLAUDE.md`. Der Code-Umbau läuft; wogenau
wann ein Folge-Issue baubar ist, sagt `python tools/bereitschaft.py`.

**Regeln, die dieses Projekt teuer gelernt hat** – ausführlich in `CLAUDE.md`:

- Behaupte nichts, was du nicht geprüft hast. Schreib „ich habe X nicht geprüft" statt zu raten.
- Arbeite die Definition of Done **mechanisch** ab. Nennt ein Punkt eine Quelle, prüf gegen **diese
  Quelle** – nicht gegen dein Gedächtnis. Die DoD wird nicht umgeschrieben, damit sie passt.
- Bau Gegenproben und **beleg, dass jede die Datei wirklich verändert hat**. Nimm jede nachweislich
  zurück (Prüfsumme oder `diff`). *Eine Probe ohne Beleg ist keine Probe.*
- Für jedes Artefakt, das du voraussetzt: **wer erzeugt es?** „Fertige Funktion ohne Aufrufer" ist
  die häufigste Lücke dieses Projekts.
- Deutsch ist die Projektsprache – Code-Bezeichner, Kommentare, Commit-Nachrichten und Issue-Texte.
