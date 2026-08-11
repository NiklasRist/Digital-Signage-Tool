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

    # ===================== DRITTER DURCHGANG (M8-Zitatbefund, Gruppe A1) =====
    # Vertragsaenderungen der TK-Fassungen v3.4 bis v3.13 (Marken-Bestand,
    # Marken-Editor, freie Akzentfarbe, standardMarkeId, marke_referenziert).
    # Quelle: docs/agents/m8-zitatbefund.md, Abschnitt A1.

    # --- #20 ------------------------------------------------------------
    (20,
     '`Listenelement`, `Vorlage`, `Auftrag`',
     '`Listenelement`, `Vorlage`, **`Marke`** (9.11.2), `Auftrag`',
     'TK v3.6: 9.11.4 fuehrt `Marke` als eigene UUID-Art mit (FA-23, 9.15.1).'),

    # --- #61 ------------------------------------------------------------
    (61,
     '`Listenelement`, `Vorlage`, `Auftrag`',
     '`Listenelement`, `Vorlage`, **`Marke`** (9.11.2), `Auftrag`',
     'TK v3.6: 9.11.4 fuehrt `Marke` als eigene UUID-Art mit (FA-23, 9.15.1).'),

    # --- #76 ------------------------------------------------------------
    (76,
     '`Listenelement`, `Vorlage`, `Auftrag`',
     '`Listenelement`, `Vorlage`, **`Marke`** (9.11.2), `Auftrag`',
     'TK v3.6: 9.11.4 fuehrt `Marke` als eigene UUID-Art mit (FA-23, 9.15.1).'),

    # --- #100 -----------------------------------------------------------
    (100,
     '`Listenelement`, `Vorlage`, `Auftrag`',
     '`Listenelement`, `Vorlage`, **`Marke`** (9.11.2), `Auftrag`',
     'TK v3.6: 9.11.4 fuehrt `Marke` als eigene UUID-Art mit (FA-23, 9.15.1).'),

    # --- #104 -----------------------------------------------------------
    (104,
     '`Listenelement`, `Vorlage`, `Auftrag`',
     '`Listenelement`, `Vorlage`, **`Marke`** (9.11.2), `Auftrag`',
     'TK v3.6: 9.11.4 fuehrt `Marke` als eigene UUID-Art mit (FA-23, 9.15.1).'),

    # --- #152 -----------------------------------------------------------
    (152,
     '`Listenelement`, `Vorlage`, `Auftrag`',
     '`Listenelement`, `Vorlage`, **`Marke`** (9.11.2), `Auftrag`',
     'TK v3.6: 9.11.4 fuehrt `Marke` als eigene UUID-Art mit (FA-23, 9.15.1).'),

    # --- #8 -------------------------------------------------------------
    (8,
     '- „**Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden\n  daher als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor\n  gezeichnet wird. Andernfalls rendert der Canvas still auf eine Fallback-Schrift → Vorschau ≠\n  Endvideo **und** Markenbruch." (TK 9.10.4)',
     '- „**Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden\n  daher als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor\n  gezeichnet wird. **Seit v3.4 gilt dasselbe für importierte Schriften** (FA-24): Sie werden **je\n  Marke** registriert und geladen, **bevor** die erste Zone gezeichnet wird, und der Nachweis unten\n  gilt für sie mit (9.15.3). Fehlt eine importierte Datei, **entsteht gar kein Segment-PNG** – die\n  Prüfung sitzt im **Renderer, vor dem Zeichnen** (9.15.3); ein Rückfall auf die gebündelte Schrift\n  wäre genau der stille Markenbruch, den dieser Abschnitt verhindert. […] Andernfalls rendert der\n  Canvas still auf eine Fallback-Schrift → Vorschau ≠ Endvideo **und** Markenbruch." (TK 9.10.4)',
     'TK v3.4/v3.8: 9.10.4 nennt jetzt auch die importierten Schriften (FA-24, 9.15.3).'),

    # --- #110 -----------------------------------------------------------
    (110,
     '- „**Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden daher\n  als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor\n  gezeichnet wird. Andernfalls rendert der Canvas still auf eine Fallback-Schrift → Vorschau ≠\n  Endvideo **und** Markenbruch." (TK 9.10.4)',
     '- „**Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden daher\n  als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor\n  gezeichnet wird. **Seit v3.4 gilt dasselbe für importierte Schriften** (FA-24): Sie werden **je\n  Marke** registriert und geladen, **bevor** die erste Zone gezeichnet wird, und der Nachweis unten\n  gilt für sie mit (9.15.3). Fehlt eine importierte Datei, **entsteht gar kein Segment-PNG** – die\n  Prüfung sitzt im **Renderer, vor dem Zeichnen** (9.15.3); ein Rückfall auf die gebündelte Schrift\n  wäre genau der stille Markenbruch, den dieser Abschnitt verhindert. […] Andernfalls rendert der\n  Canvas still auf eine Fallback-Schrift → Vorschau ≠ Endvideo **und** Markenbruch." (TK 9.10.4)',
     'TK v3.4/v3.8: 9.10.4 nennt jetzt auch die importierten Schriften (FA-24, 9.15.3).'),

    # --- #12 ------------------------------------------------------------
    (12,
     '- „**Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten\n  bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen\n  (`{ referenzenIds: string[] }`, 9.4.9), `vorlage_referenziert` beide Trefferlisten (9.12.1). Ohne\n  dieses Feld bliebe von der Zusage „der Code trägt echtes Verhalten" nur der Code selbst übrig, und\n  der geführte Reparatur-Modus (FA-19) könnte den Nutzer nirgendwohin führen. Regeln: Das Feld ist\n  **optional** – Codes ohne Zusatzdaten lassen es weg; seine Form ist **je Fehlercode festgelegt und\n  typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1); es ist **kein\n  Freitext-Anhang** und **kein Ersatz für `meldung`**. Ein Aufrufer, der `daten` nicht kennt,\n  funktioniert unverändert weiter." (TK 9.1.1, Punkt 2)',
     '- „**Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten\n  bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen\n  (`{ referenzenIds: string[] }`, 9.4.9), `vorlage_referenziert` beide Trefferlisten (9.12.1),\n  `marke_referenziert` alle drei – einschließlich der **Projekte**, die die Marke als Standardmarke\n  führen (`Markennutzung`, 9.15.1). Ohne dieses Feld bliebe von der Zusage „der Code trägt echtes Verhalten" nur der Code selbst übrig, und\n  der geführte Reparatur-Modus (FA-19) könnte den Nutzer nirgendwohin führen. Regeln: Das Feld ist\n  **optional** – Codes ohne Zusatzdaten lassen es weg; seine Form ist **je Fehlercode festgelegt und\n  typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1, 9.15.5); es ist\n  **kein Freitext-Anhang** und **kein Ersatz für `meldung`**. Ein Aufrufer, der `daten` nicht kennt,\n  funktioniert unverändert weiter." (TK 9.1.1, Punkt 2)',
     'TK v3.11/v3.13: 9.1.1 nennt zusaetzlich `marke_referenziert` (alle drei Trefferlisten) und 9.15.5.'),

    # --- #97 ------------------------------------------------------------
    (97,
     '„**Strukturierte Fehlerdaten (`daten`,\n  optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die\n  **betroffenen Listenelemente** nennen (`{ referenzenIds: string[] }`, 9.4.9),\n  `vorlage_referenziert` beide Trefferlisten (9.12.1)." (TK 9.1.1)',
     '„**Strukturierte Fehlerdaten (`daten`,\n  optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die\n  **betroffenen Listenelemente** nennen (`{ referenzenIds: string[] }`, 9.4.9),\n  `vorlage_referenziert` beide Trefferlisten (9.12.1), `marke_referenziert` alle drei –\n  einschließlich der **Projekte**, die die Marke als Standardmarke führen (`Markennutzung`,\n  9.15.1)." (TK 9.1.1)',
     'TK v3.11/v3.13: 9.1.1 nennt zusaetzlich `marke_referenziert` (alle drei Trefferlisten).'),
    (97,
     'Die Form von `daten` ist „je\n  Fehlercode festgelegt und typisiert (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4,\n  9.12.1)" (TK 9.1.1)',
     'Die Form von `daten` ist „je\n  Fehlercode festgelegt und typisiert (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4,\n  9.12.1, 9.15.5)" (TK 9.1.1)',
     'TK v3.13: die Aufzaehlung in 9.1.1 fuehrt zusaetzlich 9.15.5 (marken-store).'),

    # --- #109 -----------------------------------------------------------
    (109,
     '- „**Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten\n  bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen\n  (`{ referenzenIds: string[] }`, 9.4.9), `vorlage_referenziert` beide Trefferlisten (9.12.1). …\n  Ein Aufrufer, der `daten` nicht kennt, funktioniert unverändert weiter." (TK 9.1.1)',
     '- „**Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten\n  bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen\n  (`{ referenzenIds: string[] }`, 9.4.9), `vorlage_referenziert` beide Trefferlisten (9.12.1),\n  `marke_referenziert` alle drei – einschließlich der **Projekte**, die die Marke als\n  Standardmarke führen (`Markennutzung`, 9.15.1). …\n  Ein Aufrufer, der `daten` nicht kennt, funktioniert unverändert weiter." (TK 9.1.1)',
     'TK v3.11/v3.13: 9.1.1 nennt zusaetzlich `marke_referenziert` (alle drei Trefferlisten).'),

    # --- #22 ------------------------------------------------------------
    (22,
     'festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1);',
     'festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1,\n  9.15.5);',
     'TK v3.13: die Aufzaehlung in 9.1.1 fuehrt zusaetzlich 9.15.5 (marken-store).'),

    # --- #138 -----------------------------------------------------------
    (138,
     'Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4,\n9.12.1);',
     'Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4,\n9.12.1, 9.15.5);',
     'TK v3.13: die Aufzaehlung in 9.1.1 fuehrt zusaetzlich 9.15.5 (marken-store).'),

    # --- #171 -----------------------------------------------------------
    (171,
     '   (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1)". Im `media-service`',
     '   (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1, 9.15.5)". Im `media-service`',
     'TK v3.13: die Aufzaehlung in 9.1.1 fuehrt zusaetzlich 9.15.5 (marken-store).'),
    (171,
     '  (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1); es ist **kein\n  Freitext-Anhang**',
     '  (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1, 9.15.5); es ist **kein\n  Freitext-Anhang**',
     'TK v3.13: die Aufzaehlung in 9.1.1 fuehrt zusaetzlich 9.15.5 (marken-store).'),

    # --- #211 -----------------------------------------------------------
    (211,
     '  Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4,\n  9.12.1);',
     '  Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4,\n  9.12.1, 9.15.5);',
     'TK v3.13: die Aufzaehlung in 9.1.1 fuehrt zusaetzlich 9.15.5 (marken-store).'),

    # --- #29 ------------------------------------------------------------
    (29,
     '- „`leseMarke` | – → `Ergebnis<Marke>` (**nur lesend**)" (TK 9.5.6, Operationstabelle) – Signatur\n  und Nur-Lese-Charakter sind damit wörtlich festgelegt.',
     '- **ENTFALLEN – diese Operationszeile steht seit TK v3.4 nicht mehr in 9.5.6.** Die Marke gehört\n  nicht mehr dem `config-store`: „**Die Marke liegt seit v3.4 NICHT mehr hier.** Sie ist mit FA-23\n  zu einem app-weiten **Bestand** geworden und gehört dem `marken-store` (9.15.1); `leseMarke` ist\n  dorthin gewandert und trägt jetzt eine `markeId`. `AppKonfig` führt das Feld ausdrücklich\n  **nicht**" (TK 9.5.6). Die heutige Zeile lautet „`leseMarke` | `markeId` → `Ergebnis<Marke>` –\n  **aufgelöst** (Vererbung angewandt, 9.11.2), samt `herkunftJeFeld`" (TK 9.15.1). **Vor dem Bauen\n  klären** – dieses Issue beschreibt eine Funktion, die es im heutigen Vertrag so nicht gibt.',
     'TK v3.4: leseMarke ist aus 9.5.6 entfallen und liegt mit markeId im marken-store (9.15.1).'),
    (29,
     '- „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist\n  kein MVP." (TK 9.5.6, TK 9.11.2) – diese Funktion bietet **keine** Schreiboperation.',
     '- **ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.11.2 „Marke ist in v1\n  gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP."\n  Heute gilt: „**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1;\n  FA-23/FA-24)" (TK 9.11.2) – der Marken-Editor ist ein Muss.',
     'TK v3.4: die Read-only-Zusage aus 9.11.2 ist zurueckgenommen (FA-23/FA-24).'),

    # --- #33 ------------------------------------------------------------
    (33,
     '`erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`)"\n  (TK 9.5.2)',
     '`erstelleProjekt` | `name`, `standardMarkeId` → `Ergebnis<Projekt>` (neuer Ordner + leeres\n  `project.json`; die Marken-Kennung **bekommt** die Operation, sie holt sie nicht – s. u.)"\n  (TK 9.5.2)',
     'TK v3.11: erstelleProjekt bekommt `standardMarkeId` als zweiten Parameter (FA-23).'),

    # --- #224 -----------------------------------------------------------
    (224,
     '„`erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`)" gegenüber',
     '„`erstelleProjekt` | `name`, `standardMarkeId` → `Ergebnis<Projekt>` (neuer Ordner + leeres\n`project.json`; die Marken-Kennung **bekommt** die Operation, sie holt sie nicht – s. u.)" gegenüber',
     'TK v3.11: erstelleProjekt bekommt `standardMarkeId` als zweiten Parameter (FA-23).'),
    (224,
     '- „`erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`)"\n  (TK 9.5.2)',
     '- „`erstelleProjekt` | `name`, `standardMarkeId` → `Ergebnis<Projekt>` (neuer Ordner + leeres\n  `project.json`; die Marken-Kennung **bekommt** die Operation, sie holt sie nicht – s. u.)"\n  (TK 9.5.2)',
     'TK v3.11: erstelleProjekt bekommt `standardMarkeId` als zweiten Parameter (FA-23).'),

    # --- #52 ------------------------------------------------------------
    (52,
     '- „**Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein\n  Marken-Editor ist kein MVP." (TK 9.11.2)',
     '- **ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.11.2 „Marke ist in\n  v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP."\n  Heute gilt: „**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1;\n  FA-23/FA-24)" (TK 9.11.2). `leseMarke` liegt im `marken-store` und trägt eine `markeId`\n  (TK 9.15.1).',
     'TK v3.4: die Read-only-Zusage aus 9.11.2 ist zurueckgenommen (Marken-Editor, FA-23/FA-24).'),

    # --- #112 -----------------------------------------------------------
    (112,
     '- „**Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor\n  ist kein MVP." (TK 9.11.2)',
     '- **ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.11.2 „Marke ist in\n  v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP."\n  Heute gilt: „**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1;\n  FA-23/FA-24)" (TK 9.11.2). `leseMarke` liegt im `marken-store` und trägt eine `markeId`\n  (TK 9.15.1).',
     'TK v3.4: die Read-only-Zusage aus 9.11.2 ist zurueckgenommen (Marken-Editor, FA-23/FA-24).'),

    # --- #119 -----------------------------------------------------------
    (119,
     '- „**Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor\n  ist kein MVP." (TK 9.11.2)',
     '- **ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.11.2 „Marke ist in\n  v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP."\n  Heute gilt: „**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1;\n  FA-23/FA-24)" (TK 9.11.2). `leseMarke` liegt im `marken-store` und trägt eine `markeId`\n  (TK 9.15.1).',
     'TK v3.4: die Read-only-Zusage aus 9.11.2 ist zurueckgenommen (Marken-Editor, FA-23/FA-24).'),

    # --- #139 -----------------------------------------------------------
    (139,
     '„**Marke ist in v1 gebündelt und read-only**\n(`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP." (TK 9.11.2)',
     '**ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.11.2 „Marke ist in\nv1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP."\nHeute gilt: „**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1;\nFA-23/FA-24)" (TK 9.11.2). `leseMarke` liegt im `marken-store` und trägt eine `markeId`\n(TK 9.15.1).',
     'TK v3.4: die Read-only-Zusage aus 9.11.2 ist zurueckgenommen (Marken-Editor, FA-23/FA-24).'),
    (139,
     '- „**Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor\n  ist kein MVP." (TK 9.11.2) – diese Datei schreibt **nie** in die Marke.',
     '- **ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.11.2 „Marke ist in\n  v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP."\n  Heute gilt: „**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1;\n  FA-23/FA-24)" (TK 9.11.2). `leseMarke` liegt im `marken-store` und trägt eine `markeId`\n  (TK 9.15.1). Diese Datei schreibt **nie** in die Marke.',
     'TK v3.4: die Read-only-Zusage aus 9.11.2 ist zurueckgenommen (Marken-Editor, FA-23/FA-24).'),

    # --- #221 -----------------------------------------------------------
    (221,
     '- „**Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor\n  ist kein MVP." (TK 9.11.2) – die `Marke` wird gelesen, **nie** verändert.',
     '- **ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.11.2 „Marke ist in\n  v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP."\n  Heute gilt: „**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1;\n  FA-23/FA-24)" (TK 9.11.2). `leseMarke` liegt im `marken-store` und trägt eine `markeId`\n  (TK 9.15.1). In dieser Datei wird die `Marke` nur gelesen, **nie** verändert.',
     'TK v3.4: die Read-only-Zusage aus 9.11.2 ist zurueckgenommen (Marken-Editor, FA-23/FA-24).'),

    # --- #77 ------------------------------------------------------------
    (77,
     '- „**Marke gebündelt & read-only** im MVP (Palette #FF4040 …, Logo fix); ein Marken-Editor ist kein\n  MVP (wie FA-13)." (TK 9.5.6) – deshalb **kein** Schreibkanal für die Marke.',
     '- **ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.5.6 „Marke gebündelt\n  & read-only im MVP (Palette #FF4040 …, Logo fix); ein Marken-Editor ist kein MVP (wie FA-13)."\n  Heute steht dort: „**Die Marke liegt seit v3.4 NICHT mehr hier.** Sie ist mit FA-23 zu einem\n  app-weiten **Bestand** geworden und gehört dem `marken-store` (9.15.1); `leseMarke` ist dorthin\n  gewandert und trägt jetzt eine `markeId`. `AppKonfig` führt das Feld ausdrücklich **nicht**."\n  (TK 9.5.6) **Folge für die oben zitierte Operationstabelle:** Die Zeile `leseMarke` steht\n  seit v3.4 nicht mehr in 9.5.6; `config-store` hat dort nur noch **vier** Operationen. **Vor dem\n  Bauen klären**, ob dieses Issue noch fünf Kanäle anmelden soll.',
     'TK v3.4: 9.5.6 fuehrt die Marke nicht mehr; sie gehoert dem marken-store (9.15.1), FA-23/FA-24.'),

    # --- #197 -----------------------------------------------------------
    (197,
     'weil die Marke im MVP unveränderlich ist: „**Marke\n   gebündelt & read-only** im MVP (Palette #FF4040 …, Logo fix); ein Marken-Editor ist kein MVP\n   (wie FA-13)." (TK 9.5.6). Zwei Lesevorgänge derselben unveränderlichen Datenmenge können nicht\n   auseinanderlaufen.',
     'weil die Marke im MVP unveränderlich sei.\n   **ACHTUNG – diese Begründung ist ZURÜCKGENOMMEN.** Bis TK v3.3 stand in 9.5.6 „Marke gebündelt &\n   read-only im MVP (Palette #FF4040 …, Logo fix); ein Marken-Editor ist kein MVP (wie FA-13)."\n   Heute gilt: „**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1;\n   FA-23/FA-24)" (TK 9.11.2) – die Marke **kann** sich zur Laufzeit ändern. **Vor dem Bauen\n   klären**, ob die Marke weiterhin einmal je Fenster gelesen werden darf.',
     'TK v3.4: 9.5.6 fuehrt die Marke nicht mehr; sie gehoert dem marken-store (9.15.1), FA-23/FA-24.'),
    (197,
     '- „**Marke gebündelt & read-only** im MVP (Palette #FF4040 …, Logo fix); ein Marken-Editor ist kein\n  MVP (wie FA-13)." (TK 9.5.6) – deshalb wird die Marke **einmal** gelesen und danach nie erneut.',
     '- **ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.5.6 „Marke gebündelt\n  & read-only im MVP (Palette #FF4040 …, Logo fix); ein Marken-Editor ist kein MVP (wie FA-13)."\n  Heute steht dort: „**Die Marke liegt seit v3.4 NICHT mehr hier.** Sie ist mit FA-23 zu einem\n  app-weiten **Bestand** geworden und gehört dem `marken-store` (9.15.1); `leseMarke` ist dorthin\n  gewandert und trägt jetzt eine `markeId`. `AppKonfig` führt das Feld ausdrücklich **nicht**."\n  (TK 9.5.6) Die Begründung „deshalb wird die Marke **einmal** gelesen und danach nie\n  erneut" trägt damit nicht mehr von selbst – **vor dem Bauen klären**.',
     'TK v3.4: 9.5.6 fuehrt die Marke nicht mehr; sie gehoert dem marken-store (9.15.1), FA-23/FA-24.'),

    # --- #139 -----------------------------------------------------------
    (139,
     'Genau deshalb ist sie eingeschränkt: „**Akzentfarbe nur aus der Markenpalette** (feste Auswahl in\nv1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus." (TK 9.8.4)',
     'Genau deshalb war sie eingeschränkt.\n**ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.8.4 „Akzentfarbe nur\naus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus\ndem Corporate Design aus." Heute gilt das Gegenteil: „**Akzentfarbe ist ein freier Farbwert**\n(FA-24). … Diese Zusage ist mit FA-24 **bewusst zurückgenommen**, weil Partner-Hausfarben in\nkeiner Palette stehen. Eine Aktion **kann** damit aus dem Corporate Design ausbrechen; die\nGegenmaßnahme ist die **Kontrast-Warnung** (9.15.2), nicht die Sperre – ein Schwellenwert\nwürde eine echte Hausfarbe unbrauchbar machen (Risiko R-08)." (TK 9.8.4)',
     'TK v3.4: 9.8.4 nimmt die Palettenbindung zurueck - akzentfarbe ist ein freier Hex-Wert (FA-24, R-08).'),
    (139,
     '- „**Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so\n  bricht keine Aktion aus dem Corporate Design aus." (TK 9.8.4)\n- Das Feld im `Aktion`-Datensatz, wörtlich (TK 9.8.2):\n  ```\n  akzentfarbe:  string          // aus der Markenpalette (feste Auswahl, v1)\n  ```',
     '- **ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.8.4 „Akzentfarbe nur\n  aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus\n  dem Corporate Design aus." Heute gilt das Gegenteil: „**Akzentfarbe ist ein freier Farbwert**\n  (FA-24). … Diese Zusage ist mit FA-24 **bewusst zurückgenommen**, weil Partner-Hausfarben in\n  keiner Palette stehen. Eine Aktion **kann** damit aus dem Corporate Design ausbrechen; die\n  Gegenmaßnahme ist die **Kontrast-Warnung** (9.15.2), nicht die Sperre – ein Schwellenwert\n  würde eine echte Hausfarbe unbrauchbar machen (Risiko R-08)." (TK 9.8.4)\n- Das Feld im `Aktion`-Datensatz, wörtlich (TK 9.8.2):\n  ```\n  akzentfarbe:  string | null   // FREIER Hex-Wert (FA-24; bis v3.3 nur Auswahl aus der Palette).\n                                //   ERSETZT beim Zeichnen die Akzent-Rollen der Vorlage (9.10.9).\n                                //   null = Markenwert gilt\n  ```',
     'TK v3.4: 9.8.4 nimmt die Palettenbindung zurueck - akzentfarbe ist ein freier Hex-Wert (FA-24, R-08).'),
    (139,
     'Das TK sagt\n„aus der Markenpalette (feste Auswahl, v1)", benennt die Teilmenge aber nicht.',
     'Das TK sagte bis v3.3\n„aus der Markenpalette (feste Auswahl, v1)" und benannte die Teilmenge nicht; seit v3.4 ist\n`akzentfarbe` ein „**FREIER** Hex-Wert (FA-24; bis v3.3 nur Auswahl aus der Palette)" (TK 9.8.2),\nalso überhaupt keine Rollen-Auswahl mehr.',
     'TK v3.4: 9.8.4 nimmt die Palettenbindung zurueck - akzentfarbe ist ein freier Hex-Wert (FA-24, R-08).'),

    # --- #250 -----------------------------------------------------------
    (250,
     '- „**Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so\n  bricht keine Aktion aus dem Corporate Design aus." (TK 9.8.4) – die Auswahl kommt aus\n  `akzentAuswahl(marke)` (#139); **kein** Farbwähler, **kein** Hex-Eingabefeld.',
     '- **ZURÜCKGENOMMEN – nicht mehr als Vorgabe lesen.** Bis TK v3.3 stand in 9.8.4 „Akzentfarbe nur\n  aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus\n  dem Corporate Design aus." Heute gilt das Gegenteil: „**Akzentfarbe ist ein freier Farbwert**\n  (FA-24). … Diese Zusage ist mit FA-24 **bewusst zurückgenommen**, weil Partner-Hausfarben in\n  keiner Palette stehen. Eine Aktion **kann** damit aus dem Corporate Design ausbrechen; die\n  Gegenmaßnahme ist die **Kontrast-Warnung** (9.15.2), nicht die Sperre – ein Schwellenwert\n  würde eine echte Hausfarbe unbrauchbar machen (Risiko R-08)." (TK 9.8.4) **Vor dem Bauen klären**, ob\n  `akzentAuswahl(marke)` (#139) und das Verbot eines Hex-Eingabefelds noch gelten.',
     'TK v3.4: 9.8.4 nimmt die Palettenbindung zurueck - akzentfarbe ist ein freier Hex-Wert (FA-24, R-08).'),

    # --- #144 -----------------------------------------------------------
    (144,
     '- „**Sicherheitsabstand ist eine Eigenschaft des Bildrahmens, nicht der Vorlagenfläche.** Er gilt\n  absolut im 1920×1080-Rahmen (96 px horizontal, 54 px vertikal, 9.10.5). **Wichtige Folge für\n  Bänder:** Ein Band sitzt am unteren Rahmenrand – die unteren **54 px des Rahmens liegen damit\n  *innerhalb* des Bandes**. Bei einem 162 px hohen Band sind also nur die oberen **108 px** sicher\n  nutzbar; Inhalt darunter kann am TV abgeschnitten werden." (TK 9.11.2)',
     '- „**Sicherheitsabstand ist eine Eigenschaft des Bildrahmens, nicht der Vorlagenfläche.** Er gilt\n  absolut im 1920×1080-Rahmen (96 px horizontal, 54 px vertikal, 9.10.5).\n  **Der Wert gehört der MARKE, nicht der Konstanten (v3.6, entschieden).** `Marke.sicherheit`\n  ist seit v3.4 **bearbeitbar** – FA-24 nennt „Sicherheitsabstände" ausdrücklich. Die 96/54 px in\n  9.11.4 sind damit nur noch die **Vorbelegung der eingebauten Marke**; wer zeichnet oder prüft,\n  liest den Wert aus der **jeweils zuständigen Marke** (9.15.4). **Folge, die beim Bauen zählt:**\n  Vorlagen sind **app-weit** und kennen die Marke nicht, mit der sie später gezeichnet werden –\n  eine für 54 px gebaute Vorlage ist bei einer Marke mit größerem Abstand **nicht mehr sicher**.\n  Der `vorlagen-editor` zeichnet seine Sicherheitslinie deshalb gegen eine **benannte** Marke (die\n  Projekt-Standardmarke bzw. die eingebaute, wenn kein Projekt offen ist) und **sagt dazu, gegen\n  welche** – eine Linie ohne diese Angabe wäre eine Zusage, die die Vorlage nicht halten kann.\n  **Wichtige Folge für Bänder:** Ein Band sitzt am unteren Rahmenrand – die unteren **54 px des\n  Rahmens liegen damit *innerhalb* des Bandes**. Bei einem 162 px hohen Band sind also nur die\n  oberen **108 px** sicher nutzbar; Inhalt darunter kann am TV abgeschnitten werden." (TK 9.11.2)',
     'TK v3.6: 9.11.2 stellt den Sicherheitsabstand auf Marke.sicherheit um (96/54 nur noch Vorbelegung).'),

    # --- #148 -----------------------------------------------------------
    (148,
     '- „**Sicherheitsabstand ist eine Eigenschaft des Bildrahmens, nicht der Vorlagenfläche.** Er gilt\n  absolut im 1920×1080-Rahmen (96 px horizontal, 54 px vertikal, 9.10.5). **Wichtige Folge für\n  Bänder:** Ein Band sitzt am unteren Rahmenrand – die unteren **54 px des Rahmens liegen damit\n  *innerhalb* des Bandes**. Bei einem 162 px hohen Band sind also nur die oberen **108 px** sicher\n  nutzbar; Inhalt darunter kann am TV abgeschnitten werden. Der `vorlagen-editor` zeigt diese Linie\n  an und warnt (9.12.2)." (TK 9.11.2)',
     '- „**Sicherheitsabstand ist eine Eigenschaft des Bildrahmens, nicht der Vorlagenfläche.** Er gilt\n  absolut im 1920×1080-Rahmen (96 px horizontal, 54 px vertikal, 9.10.5).\n  **Der Wert gehört der MARKE, nicht der Konstanten (v3.6, entschieden).** `Marke.sicherheit`\n  ist seit v3.4 **bearbeitbar** – FA-24 nennt „Sicherheitsabstände" ausdrücklich. Die 96/54 px in\n  9.11.4 sind damit nur noch die **Vorbelegung der eingebauten Marke**; wer zeichnet oder prüft,\n  liest den Wert aus der **jeweils zuständigen Marke** (9.15.4). **Folge, die beim Bauen zählt:**\n  Vorlagen sind **app-weit** und kennen die Marke nicht, mit der sie später gezeichnet werden –\n  eine für 54 px gebaute Vorlage ist bei einer Marke mit größerem Abstand **nicht mehr sicher**.\n  Der `vorlagen-editor` zeichnet seine Sicherheitslinie deshalb gegen eine **benannte** Marke (die\n  Projekt-Standardmarke bzw. die eingebaute, wenn kein Projekt offen ist) und **sagt dazu, gegen\n  welche** – eine Linie ohne diese Angabe wäre eine Zusage, die die Vorlage nicht halten kann.\n  **Wichtige Folge für Bänder:** Ein Band sitzt am unteren Rahmenrand – die unteren **54 px des\n  Rahmens liegen damit *innerhalb* des Bandes**. Bei einem 162 px hohen Band sind also nur die\n  oberen **108 px** sicher nutzbar; Inhalt darunter kann am TV abgeschnitten werden. Der\n  `vorlagen-editor` zeigt diese Linie an und warnt (9.12.2)." (TK 9.11.2)',
     'TK v3.6: 9.11.2 stellt den Sicherheitsabstand auf Marke.sicherheit um (96/54 nur noch Vorbelegung).'),

    # --- #164 -----------------------------------------------------------
    (164,
     '- „Der `render-service` holt den Wert **über die Marke** (`config-store.leseMarke`, 9.5.6) und tippt\n  ihn **nie** als Hexzahl in eine Filterkette – sonst hätte das Projekt zwei Quellen für dieselbe\n  Farbe (9.11.1, Punkt 7)." (TK 9.2.8)',
     '- „**Aufgelöst wird die Rolle beim EINREIHEN, nicht zur Laufzeit (v3.7):** Der Renderer liest sie\n  aus der **Projekt-Standardmarke** (`Project.standardMarkeId`, 9.15.4) – derselben Marke, mit der\n  er die Band-PNGs zeichnet – und legt den fertigen Hex-Wert als `einblendung.flaecheDunkel` in\n  den Auftrag (9.2.2). Der `render-service` **schlägt keine Marke nach**; er nimmt den\n  eingefrorenen Wert und tippt **nie** eine Hexzahl selbst in eine Filterkette (9.11.1, Punkt 7)." (TK 9.2.8)',
     'TK v3.7: der Laufzeit-Nachschlag ueber config-store.leseMarke ist ersetzt - die Rolle wird beim EINREIHEN aus der Projekt-Standardmarke aufgeloest.'),

    # --- #177 -----------------------------------------------------------
    (177,
     '- „Der `render-service` holt den Wert **über die Marke** (`config-store.leseMarke`, 9.5.6) und tippt\n  ihn **nie** als Hexzahl in eine Filterkette – sonst hätte das Projekt zwei Quellen für dieselbe\n  Farbe (9.11.1, Punkt 7).“ (TK 9.2.8)',
     '- „**Aufgelöst wird die Rolle beim EINREIHEN, nicht zur Laufzeit (v3.7):** Der Renderer liest sie\n  aus der **Projekt-Standardmarke** (`Project.standardMarkeId`, 9.15.4) – derselben Marke, mit der\n  er die Band-PNGs zeichnet – und legt den fertigen Hex-Wert als `einblendung.flaecheDunkel` in\n  den Auftrag (9.2.2). Der `render-service` **schlägt keine Marke nach**; er nimmt den\n  eingefrorenen Wert und tippt **nie** eine Hexzahl selbst in eine Filterkette (9.11.1, Punkt 7).“ (TK 9.2.8)',
     'TK v3.7: der Laufzeit-Nachschlag ueber config-store.leseMarke ist ersetzt - die Rolle wird beim EINREIHEN aus der Projekt-Standardmarke aufgeloest.'),

    # --- #218 -----------------------------------------------------------
    (218,
     '- „Der `render-service` holt den Wert **über die Marke** (`config-store.leseMarke`, 9.5.6) und tippt\n  ihn **nie** als Hexzahl in eine Filterkette – sonst hätte das Projekt zwei Quellen für dieselbe\n  Farbe (9.11.1, Punkt 7)." (TK 9.2.8) – dieselbe Regel gilt hier für das CSS.',
     '- „**Aufgelöst wird die Rolle beim EINREIHEN, nicht zur Laufzeit (v3.7):** Der Renderer liest sie\n  aus der **Projekt-Standardmarke** (`Project.standardMarkeId`, 9.15.4) – derselben Marke, mit der\n  er die Band-PNGs zeichnet – und legt den fertigen Hex-Wert als `einblendung.flaecheDunkel` in\n  den Auftrag (9.2.2). Der `render-service` **schlägt keine Marke nach**; er nimmt den\n  eingefrorenen Wert und tippt **nie** eine Hexzahl selbst in eine Filterkette (9.11.1, Punkt 7)." (TK 9.2.8) – dieselbe Regel gilt hier für das CSS.',
     'TK v3.7: der Laufzeit-Nachschlag ueber config-store.leseMarke ist ersetzt - die Rolle wird beim EINREIHEN aus der Projekt-Standardmarke aufgeloest.'),

    # --- #164 -----------------------------------------------------------
    (164,
     '- „**Video vorbereiten:** bei `split` **contain** in den Video-Bereich skalieren und mit\n  **`flaecheDunkel`** auffüllen (Wert aus der Marke, s. o.); bei `einblendung` normal auf\n  1920 × 1080 nach 9.2.4." (TK 9.2.8)',
     '- „**Video vorbereiten:** bei `split` **contain** in den Video-Bereich skalieren und mit\n  **`flaecheDunkel`** auffüllen (Wert aus der **Projekt-Standardmarke** `Project.standardMarkeId`,\n  **nicht** aus der Marke der gerade sichtbaren Aktion – s. u.); bei `einblendung` normal auf\n  1920 × 1080 nach 9.2.4." (TK 9.2.8)',
     'TK v3.7: 9.2.8 nennt als Quelle ausdruecklich die Projekt-Standardmarke.'),

    # --- #218 -----------------------------------------------------------
    (218,
     '- „**`split`:** Das `<video>` wird in den oberen Bereich **1920 × (1080 − H)** gelegt (`contain`),\n  die Restflächen links/rechts in der Farb-Rolle **`flaecheDunkel`** gefüllt – **derselben**, die\n  der Render benutzt (9.2.8, 9.11.2); das Band-Canvas (**1920 × H**) sitzt **darunter**."\n  (TK 9.9.2)',
     '- „**`split`:** Das `<video>` wird in den oberen Bereich **1920 × (1080 − H)** gelegt (`contain`),\n  die Restflächen links/rechts in der Farb-Rolle **`flaecheDunkel`** gefüllt – **derselben**, die\n  der Render benutzt (9.2.8, 9.11.2), und aus **derselben Quelle**: der **Projekt-Standardmarke**\n  (`Project.standardMarkeId`, 9.15.4), **nicht** aus der Marke der gerade sichtbaren Aktion; das\n  Band-Canvas (**1920 × H**) sitzt **darunter**." (TK 9.9.2)',
     'TK v3.7: 9.9.2 nennt die Projekt-Standardmarke als Quelle der Rolle flaecheDunkel.'),

    # --- #265 -----------------------------------------------------------
    (265,
     '- „Besitzt `config.json` (app-weit): aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen,\n  Marke." (TK 9.5.6) – die drei Felder oben sind die ersten drei dieser Aufzählung, in dieser\n  Reihenfolge. Zur vierten (Marke) siehe den übernächsten Punkt.',
     '- „Besitzt `config.json` (app-weit): aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen."\n  (TK 9.5.6) – die drei Felder oben sind genau diese Aufzählung, in dieser Reihenfolge. Die Marke\n  stand bis v3.3 als vierter Eintrag dort und ist **entfallen**: „**Die Marke liegt seit v3.4 NICHT\n  mehr hier.** Sie ist mit FA-23 zu einem app-weiten **Bestand** geworden und gehört dem\n  `marken-store` (9.15.1) … `AppKonfig` führt das Feld ausdrücklich **nicht**." (TK 9.5.6) – das\n  deckt sich mit der Entscheidung dieses Issues vom 10.08.',
     'TK v3.4: die Marke ist aus 9.5.6 und aus AppKonfig entfallen (marken-store, 9.15.1).'),

    # --- #280 -----------------------------------------------------------
    (280,
     'der\n  Kommentar „Balken ist im Asset enthalten" (TK 9.11.2, zu `Marke.logo`) beschreibt nur die',
     'der\n  Kommentar „der dunkle Balken ist im Logo-Asset **enthalten** – es braucht keine eigene\n  Hintergrundzone" (TK 9.11.1; der frühere Kommentar „Balken ist im Asset enthalten" steht seit\n  v3.6 nicht mehr in 9.11.2 – `Marke.logo` lautet dort jetzt\n  `{ datei, herkunft, seitenverhaeltnis } | null`) beschreibt nur die',
     'TK v3.6: der Kommentar an Marke.logo lautet jetzt anders; die Aussage steht in 9.11.1.'),
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
         188: "m6/M6-33",
         # dritter Durchgang (M8-Zitatbefund, Gruppe A1)
         61: "m2/M2-09",
         76: "m1-nachzuegler/M1-45", 77: "m1-nachzuegler/M1-46",
         97: "m4/M4-03", 100: "m4/M4-06", 104: "m4/M4-10", 109: "m4/M4-15",
         110: "m4/M4-16", 112: "m4/M4-18", 119: "m4/M4-25",
         138: "m5/M5-19", 139: "m5/M5-20", 144: "m5/M5-25", 148: "m5/M5-29",
         152: "m5/M5-33",
         164: "m6/M6-09", 177: "m6/M6-22",
         197: "m7/M7-04", 211: "m7/M7-18", 218: "m7/M7-25", 221: "m7/M7-28",
         224: "m7/M7-31", 250: "m7/M7-57",
         280: "m8/M8-06",
         # Diese drei Issue-Bodies haben in diesem Arbeitsbaum KEINE lokale
         # Quelldatei mehr, in der die betroffene Stelle vorkommt: #12 und #22
         # sind seit dem Anlegen ueber den Draft hinausgewachsen, #265 stammt
         # aus einem Stapel ohne map.json. Der Pfad existiert absichtlich
         # nicht -> das Werkzeug aendert nur den GitHub-Body (os.path.exists).
         12: "_ohne-lokale-quelle/12",
         22: "_ohne-lokale-quelle/22",
         265: "_ohne-lokale-quelle/265"}

# Die M1-Issues #13-#52 haben keine eigene Datei je Issue - ihre Volltexte
# stehen gesammelt in docs/agents/issues-draft.md.
SAMMELDATEI = {32: "issues-draft", 37: "issues-draft", 49: "issues-draft",
               # dritter Durchgang: diese Stellen stehen dort woertlich
               8: "issues-draft", 20: "issues-draft", 29: "issues-draft",
               33: "issues-draft", 52: "issues-draft"}


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
