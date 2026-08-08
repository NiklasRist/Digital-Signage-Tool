# -*- coding: utf-8 -*-
"""
zitate-korrigieren.py - setzt die vom Abgleich gefundenen VERALTETEN Zitate auf
den aktuellen Wortlaut. Begleitwerkzeug zu tools/zitate-pruefen.py.

Jede Ersetzung muss in der Datei GENAU EINMAL passen. Trifft sie null- oder
mehrfach, wird nichts geschrieben - lieber ein Abbruch als eine halbe Korrektur
an der falschen Stelle.

Geaendert wird BEIDES: der Issue-Body auf GitHub und die lokale Quelldatei
(sonst ueberschreibt der naechste Anlege-/Nachzieh-Lauf die Korrektur wieder).

    python tools/zitate-korrigieren.py --trocken   # nur zeigen
    python tools/zitate-korrigieren.py             # schreiben
"""

import argparse
import json
import os
import subprocess
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(WURZEL, ".zitat-cache")

# (Issue, alt, neu, Begruendung)
KORREKTUREN = [

    # --- #59 (M2-07) : TK 9.3.1 nennt das Feld seit v2.5 anders -------------
    (59,
     '„Anzahl bisheriger Ausführungen" definiert.',
     '„Anzahl **tatsächlich gestarteter** Ausführungen" definiert.',
     'TK 9.3.1 sagt woertlich "Anzahl **tatsaechlich gestarteter** Ausfuehrungen".'),

    # --- #68 (M2-16) : TK 9.2.3, vierte Nutzdate seit v3.2 ------------------
    (68,
     'weiß: Pfad, Größe und Gesamtdauer;\n  daraus wird `ProtokollEintrag.ausgabe`."',
     'weiß: Pfad, Größe, Gesamtdauer und den\n  verwendeten Ausgabenamen; aus den ersten dreien wird `ProtokollEintrag.ausgabe`."',
     'TK v3.2 nahm den Ausgabenamen als vierte Nutzdate auf.'),

    # --- #107 (M4-13) : TK 9.12.2 seit v3.0 umformuliert --------------------
    (107,
     '„Die Lösch-Sperre selbst sitzt im `vorlagen-store`." (TK 9.12.2)',
     '„Die Lösch-**Sperre** selbst sitzt weiterhin im `vorlagen-store`" (TK 9.12.2)',
     'TK 9.12.2 lautet seit v3.0 anders.'),

    # --- #153 (M5-34) : Ueberschrift in #76 wurde eingegrenzt ---------------
    (153,
     '„**Verbot – keine Kanäle über die vierzehn hinaus.**" (#76)',
     '„**Verbot – in DIESER Datei keine Kanäle über die vierzehn hinaus.**" (#76)',
     '#76 wurde mit TK v2.7 auf DIESE Datei eingegrenzt; das Zitat blieb alt.'),

    # --- #155 (M5-36) : TK 9.12.2 seit v3.0 umformuliert --------------------
    (155,
     'Projekten verwendet") – ein Merge verändert **alle** davon. Die Lösch-Sperre selbst sitzt im\n  `vorlagen-store`." (TK 9.12.2)',
     'Projekten verwendet") – ein Merge verändert **alle** davon. Die Zahlen kommen aus\n  **`pruefeVorlagenReferenzen`** (9.12.1) und aus **keiner** zweiten, editor-eigenen Zählung. […]\n  Die Lösch-**Sperre** selbst sitzt weiterhin im `vorlagen-store`." (TK 9.12.2)',
     'TK 9.12.2 lautet seit v3.0 anders (Zahlen aus pruefeVorlagenReferenzen).'),

    # --- #171 (M6-16) : TK 9.2.9-Tabelle, zwei Zellen seit v2.9 geaendert ---
    (171,
     '`einblendung` ohne Abschnitte oder mit `höhe` ≥ 1080, PNG-Maße',
     '`einblendung` ohne Abschnitte, mit `höhe` ≥ 1080 oder mit **ungerader** `höhe` (9.2.8), PNG-Maße',
     'TK v2.9: ungerade Bandhoehen sind ungueltig (yuv420p).'),
    (171,
     'gesperrt (nach Retry) | Die Ausgabedatei in Player/Explorer schließen',
     'gesperrt (nach Retry) – **ebenso** ein gescheiterter Sofort-Flush von D1 zu Beginn des Handlers (9.3.3, 9.5.4) | Die Ausgabedatei in Player/Explorer schließen',
     'TK v2.9: der gescheiterte Sofort-Flush faellt unter speicher_fehler.'),

    # --- #181 (M6-26) : TK 9.2.3 und 9.2.5 seit v3.2 -----------------------
    (181,
     'weiß: Pfad,\n  Größe und Gesamtdauer; daraus wird `ProtokollEintrag.ausgabe`.“ (TK 9.2.3)',
     'weiß: Pfad,\n  Größe, Gesamtdauer und den verwendeten Ausgabenamen; aus den ersten dreien wird\n  `ProtokollEintrag.ausgabe`.“ (TK 9.2.3)',
     'TK v3.2 nahm den Ausgabenamen als vierte Nutzdate auf.'),
    (181,
     '„meldet **Pfad, Größe und Gesamtdauer** als Auftrags-Ergebnis',
     '„meldet **Pfad, Ausgabename, Größe und Gesamtdauer** als Auftrags-Ergebnis',
     'TK 9.2.5 nennt seit v3.2 vier Nutzdaten.'),

    # --- #226 (M7-33) : TK 9.5.2 seit v3.2 (leereProjektSicht) -------------
    (226,
     'fällt `config-store` sanft zurück)" (TK 9.5.2)',
     'fällt `config-store` sanft zurück – und die Oberfläche leert ihre gemeinsame\n   Projekt-Sicht, 9.7.4)" (TK 9.5.2)',
     'TK v3.2 ergaenzte das Leeren der gemeinsamen Projekt-Sicht (9.7.4).'),
    (226,
     '`config-store` sanft zurück). Die Oberfläche **muss vorher benennen, was verschwindet** – s. u."',
     '`config-store` sanft zurück – und die Oberfläche leert ihre gemeinsame Projekt-Sicht,\n  9.7.4). Die Oberfläche **muss vorher benennen, was verschwindet** – s. u."',
     'TK v3.2 ergaenzte das Leeren der gemeinsamen Projekt-Sicht (9.7.4).'),

    # --- #246 (M7-53) : die zitierte STOPP-Zeile steht nicht mehr in #229 ---
    (246,
     '„**Offen: Wer stellt `gibVideoHandlesFrei` bereit?**" (#229, STOPP)',
     '#229 fragte im STOPP-Block, wer `gibVideoHandlesFrei` bereitstellt; die Frage ist dort\n> inzwischen aufgelöst und verweist auf dieses Issue (#229, Abschnitt „Nicht selbst entscheiden").',
     'Regel D: der woertliche Satz steht nicht mehr in #229 - Zitat durch Verweis ersetzt.'),

    # ===================== ZWEITER DURCHGANG =============================
    # Sichtbar geworden, nachdem die Zeilenenden im Werkzeug vereinheitlicht
    # waren (GitHub liefert CRLF, der Cache lieferte LF - dadurch lagen die
    # Absatzgrenzen verschieden und ein Teil der Zitate wurde anders zerlegt).

    # --- #32 (M1-20) : TK 9.4.6 seit v2.6 (Sofort-Flush im Loesch-Ablauf) ---
    (32,
     'Sonst: Asset-Eintrag aus D1 entfernen,\n  schreiben. **Referenzprüfung und Entfernen im selben kritischen Abschnitt**',
     'Sonst: Asset-Eintrag aus D1 entfernen,\n  danach **Sofort-Flush** (9.5.4) – erst wenn der Eintrag **dauerhaft** weg ist, darf Schritt 2\n  die Datei anfassen […] Scheitert der Flush → `speicher_fehler`, die Datei bleibt unangetastet.\n  **Referenzprüfung und Entfernen im selben kritischen Abschnitt**',
     'TK v2.6 schob den Sofort-Flush zwischen D1-Entfernen und Dateiloeschen.'),

    # --- #37 (M1-25) : TK 9.5.2 seit v3.2 (leereProjektSicht) --------------
    (37,
     'fällt\n  `config-store` sanft zurück)" (TK 9.5.2)',
     'fällt\n  `config-store` sanft zurück – und die Oberfläche leert ihre gemeinsame Projekt-Sicht,\n  9.7.4)" (TK 9.5.2)',
     'TK v3.2 ergaenzte das Leeren der gemeinsamen Projekt-Sicht (9.7.4).'),

    # --- #49 (M1-37) : TK 9.5.7 seit v2.4 (listeAusgaben) ------------------
    (49,
     '`(projektId, ausgabeName) → projects/<id>/output/<name>.mp4` auf. So kann eine Layout-Änderung',
     '`(projektId, ausgabeName) → projects/<id>/output/<name>.mp4` auf und **listet diesen Ordner**\n  (`listeAusgaben`, 9.5.2). So kann eine Layout-Änderung',
     'TK v2.4 nahm listeAusgaben in die Pfad-Autoritaet auf.'),

    # --- #53 (M2-01) : TK 9.2.3 seit v3.2 ---------------------------------
    (53,
     'liefert nur, was **nur er** weiß: Pfad, Größe und Gesamtdauer; daraus wird\n  `ProtokollEintrag.ausgabe`."',
     'liefert nur, was **nur er** weiß: Pfad, Größe, Gesamtdauer und den verwendeten\n  Ausgabenamen; aus den ersten dreien wird `ProtokollEintrag.ausgabe`."',
     'TK v3.2 nahm den Ausgabenamen als vierte Nutzdate auf.'),

    # --- #58 (M2-06) : TK 9.3.3 seit v2.6 (versuche steigt beim Start) -----
    (58,
     'wieder `anstehend` und **ans Ende** gestellt, `versuche` +1\n  (kein neuer Eintrag)." (TK 9.3.3)',
     'wieder `anstehend` und **ans Ende** gestellt\n  (kein neuer Eintrag)." (TK 9.3.3)',
     'TK v2.6 strich "versuche +1" aus 9.3.3 - der Zaehler steigt beim Start.'),

    # --- #60 (M2-08) : TK 9.3.6 seit v2.6/v2.8 ----------------------------
    (60,
     '„Ein `render`-Auftrag führt beim Start intern `renderReel(payload)` aus. `RenderProgress.prozent`\n  speist `Auftrag.fortschritt`" (TK 9.3.6)',
     '„Ein `render`-Auftrag führt beim Start intern `renderReel(payload)` aus – **nach** dem\n  Sofort-Flush von D1 (9.5.4). `RenderProgress.prozent` (Kanal `render:fortschritt`, 9.2.7)\n  speist `Auftrag.fortschritt`" (TK 9.3.6)',
     'TK 9.3.6 nennt seit v2.6/v2.8 den Sofort-Flush und den Kanalnamen.'),

    # --- #63 (M2-11) : zwei Zitate zum selben Punkt ------------------------
    (63,
     'ans Ende,\n  versuche +1" (TK 9.3.4)',
     'ans Ende (versuche steigt erst beim Start, 9.3.3)"\n  (TK 9.3.4)',
     'TK v2.6 aenderte den Kommentar in der Signaturzeile 9.3.4.'),
    (63,
     '`anstehend` und **ans Ende** gestellt, `versuche` +1 (kein neuer Eintrag)." (TK 9.3.3)',
     '`anstehend` und **ans Ende** gestellt (kein neuer Eintrag)." (TK 9.3.3)',
     'TK v2.6 strich "versuche +1" aus 9.3.3.'),

    # --- #72 (M1-41) : TK 9.5.4, Anlass 4 ohne fuehrendes "und" ------------
    (72,
     '„**und am Ende jedes Auftrags, der D1\nverändert hat**"',
     '„**am Ende jedes Auftrags, der D1\nverändert hat**"',
     'TK 9.5.4 zaehlt den vierten Anlass ohne fuehrendes "und" auf.'),

    # --- #75 (M1-44) : TK 9.5.2 seit v2.8 (Staging im Ausgabeordner) ------
    (75,
     '„**`geaendertAm` ist der Renderzeitpunkt, nicht das Protokoll.** Weil die fertige Datei in\n  **einem** Schritt in den Ausgabeordner gebracht wird (Rename-mit-Ersetzen, 9.2.6), ist ihr\n  Änderungsdatum genau der Zeitpunkt des erfolgreichen Renders.',
     '„**`geaendertAm` ist der Renderzeitpunkt, nicht das Protokoll.** Die Datei wird als\n  `<name>.mp4.part` **im Ausgabeordner selbst** geschrieben und bekommt erst nach der\n  Verifikation ihren endgültigen Namen (Rename-mit-Ersetzen im selben Ordner, 9.2.6). […]',
     'TK v2.8: die Datei wird im Ausgabeordner selbst gestaget (E-3).'),
    (75,
     'bleiben unsichtbar. Fehlt der Ordner (noch nie gerendert)',
     'bleiben unsichtbar. […] Fehlt der Ordner (noch nie gerendert)',
     'TK v2.8 schob die Begruendung zur .part-Datei dazwischen.'),

    # --- #188 (M6-33) : TK 9.3.1 seit v3.2 --------------------------------
    (188,
     '`render` → Pfad/Größe/Dauer (9.2.3)',
     '`render` → Pfad/**Ausgabename**/Größe/Dauer (9.2.3)',
     'TK v3.2 nahm den Ausgabenamen in Auftrag.ergebnis auf.'),
]

# Die lokalen Quelldateien tragen ab M2 Kuerzel (M7-36) statt klickbarer
# #-Nummern - dieselbe Stelle sieht dort anders aus. Wo das den Suchtext trifft,
# steht hier die lokale Fassung.
LOKAL_ABWEICHEND = {
    ('„**Offen: Wer stellt `gibVideoHandlesFrei` bereit?**" (#229, STOPP)'):
        ('„**Offen: Wer stellt `gibVideoHandlesFrei` bereit?**" (M7-36, STOPP)',
         'M7-36 fragte im STOPP-Block, wer `gibVideoHandlesFrei` bereitstellt; die Frage ist dort\n> inzwischen aufgelöst und verweist auf dieses Issue (M7-36, Abschnitt „Nicht selbst entscheiden").'),
}

LOKAL = {59: "m2/M2-07", 68: "m2/M2-16", 107: "m4/M4-13", 153: "m5/M5-34",
         155: "m5/M5-36", 171: "m6/M6-16", 181: "m6/M6-26", 226: "m7/M7-33",
         246: "m7/M7-53",
         53: "m2/M2-01", 58: "m2/M2-06", 60: "m2/M2-08", 63: "m2/M2-11",
         72: "m1-nachzuegler/M1-41", 75: "m1-nachzuegler/M1-44",
         188: "m6/M6-33"}

# Die M1-Issues #13-#52 haben keine eigene Datei je Issue - ihre Volltexte
# stehen gesammelt in docs/agents/issues-draft.md.
SAMMELDATEI = {32: "issues-draft", 37: "issues-draft", 49: "issues-draft"}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--trocken", action="store_true")
    args = p.parse_args()

    nach_issue = {}
    for nr, alt, neu, grund in KORREKTUREN:
        nach_issue.setdefault(nr, []).append((alt, neu, grund))

    fehler = []
    for nr in sorted(nach_issue):
        pfad_cache = os.path.join(CACHE, "%d.md" % nr)
        body = open(pfad_cache, encoding="utf-8").read()
        pfad_lokal = os.path.join(
            WURZEL, "docs", "agents",
            (SAMMELDATEI.get(nr) or LOKAL[nr]) + ".md")
        lokal = open(pfad_lokal, encoding="utf-8").read() if os.path.exists(pfad_lokal) else None

        neu_body, neu_lokal = body, lokal
        for alt, neu, grund in nach_issue[nr]:
            # Idempotenz: schon angewandte Korrekturen still ueberspringen,
            # damit ein zweiter Lauf nicht als Fehler erscheint.
            if alt not in neu_body and neu in neu_body:
                print("#%-4d schon erledigt: %s" % (nr, grund))
                continue
            n = neu_body.count(alt)
            if n != 1:
                fehler.append("#%d: Muster %d-mal im Body (erwartet 1): %r" % (nr, n, alt[:70]))
                continue
            neu_body = neu_body.replace(alt, neu)
            print("#%-4d BODY  ok   %s" % (nr, grund))
            if neu_lokal is not None:
                l_alt, l_neu = LOKAL_ABWEICHEND.get(alt, (alt, neu))
                m = neu_lokal.count(l_alt)
                if m == 1:
                    neu_lokal = neu_lokal.replace(l_alt, l_neu)
                    print("      LOKAL ok   %s" % (SAMMELDATEI.get(nr) or LOKAL[nr]))
                else:
                    fehler.append("#%d: Muster %d-mal in %s (erwartet 1)" % (nr, m, SAMMELDATEI.get(nr) or LOKAL[nr]))

        if args.trocken:
            continue
        if neu_body != body:
            with open(pfad_cache, "w", encoding="utf-8") as f:
                f.write(neu_body)
            r = subprocess.run(["gh", "issue", "edit", str(nr), "--body-file", pfad_cache],
                               cwd=WURZEL, capture_output=True, text=True, encoding="utf-8")
            if r.returncode != 0:
                fehler.append("#%d: gh issue edit fehlgeschlagen: %s" % (nr, r.stderr[:200]))
            else:
                print("      GITHUB #%d aktualisiert" % nr)
        if neu_lokal is not None and neu_lokal != lokal:
            with open(pfad_lokal, "w", encoding="utf-8") as f:
                f.write(neu_lokal)

    if fehler:
        print("\nPROBLEME:", file=sys.stderr)
        for f in fehler:
            print("  " + f, file=sys.stderr)
        sys.exit(1)
    print("\nAlle Korrekturen sauber angewandt.")


if __name__ == "__main__":
    main()
