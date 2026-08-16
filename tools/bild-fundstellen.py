# -*- coding: utf-8 -*-
"""bild-fundstellen.py - einmalige Erhebung fuer die Streichung der Elementart `bild`
(AD v1.5 / TK v3.16, entschieden am 15.08.2026).

    python tools/bild-fundstellen.py

WARUM EIN EIGENES WERKZEUG: tools/zitate-pruefen.py prueft WOERTLICHE Zitate - Text in
deutschen Anfuehrungszeichen und Blockzitate. Die Elementart steht in den Issues aber in
SIGNATURBLOECKEN und Codebeispielen, und die sind fuer jenes Werkzeug keine Zitate. Es
hat fuer diese Aenderung drei Zeilen gefunden; die eigentliche Menge liegt woanders.

DIE ENTSCHEIDENDE UNTERSCHEIDUNG: `bild` kommt in ZWEI Bedeutungen vor.
  - `Listenelement.art === 'bild'`  -> GESTRICHEN, muss nachgezogen werden
  - `Asset.typ === 'bild'`          -> BLEIBT, Bilder werden weiter importiert
Wer beide zusammenwirft, ueberzeichnet die Aenderung um das Doppelte.
"""
import io
import json
import os
import re
import subprocess

# Elementart. KORRIGIERT am 15.08.2026: Die erste Fassung suchte nach
# `'video' | 'bild'` OHNE das folgende `| 'segment'` zu verlangen - damit zaehlte sie
# jede Asset-Union `typ: 'video' | 'bild'` mit und meldete rund doppelt so viele
# betroffene Issues. Genau der Fehler, vor dem der Dateikopf warnt.
# ZWEITE KORREKTUR am 15.08.2026 - der Fehler war schwerer als der erste.
# Hier stand `art\s*[:=!]==?\s*['"]bild['"]`. Nach dem Trennzeichen `[:=!]` steht ein
# ZWINGENDES `=`. Das Muster traf also `art === 'bild'` und `art !== 'bild'`, aber
# NIEMALS `art: 'bild'` - die Schreibweise, in der die Elementart in fast allen
# Signaturbloecken und Tabellen steht. NEUN betroffene Issues fehlten dadurch in der
# Erhebung, darunter #41: die EINZIGE Stelle im ganzen Baum, die ein Element der Art
# `bild` ueberhaupt erzeugt - und sie ist gebaut.
# Gefunden hat es ein Pruef-Agent, nicht dieses Werkzeug. Merke: Ein Suchmuster gehoert
# an seinen erwarteten Treffern geprueft, bevor man seiner Trefferzahl glaubt.
ELEMENTART = re.compile(
    r"""art\s*(?::|===|!==|==)\s*['"]bild['"]"""                          # art: 'bild' / art === 'bild'
    r"""|['"]video['"]\s*\\?\|\s*['"]bild['"]\s*\\?\|\s*['"]segment['"]"""  # Dreier-Union, auch \| in Tabellen
    r"""|RenderItemBild""",                                               # die Render-Variante
    re.I,
)

# SELBSTPRUEFUNG: Ein Muster, das seine eigenen Beispiele nicht trifft, taugt nichts.
for _probe in ("art: 'bild'", "art === 'bild'", "art !== 'bild'",
               "'video' | 'bild' | 'segment'", "RenderItemBild"):
    assert ELEMENTART.search(_probe), "Muster trifft die eigene Probe nicht: %r" % _probe
# Asset-Typ - bleibt unveraendert, dient nur der Abgrenzung im Bericht.
ASSETTYP = re.compile(r"""typ\s*[:=!]==?\s*['"]bild['"]|['"]video['"]\s*\|\s*['"]bild['"](?!\s*\|)""", re.I)


def hole_issues():
    r = subprocess.run(
        ["gh", "issue", "list", "--state", "all", "--limit", "400",
         "--json", "number,title,body,milestone"],
        capture_output=True, text=True, encoding="utf-8", shell=(os.name == "nt"),
    )
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout)


def main():
    betroffen, nur_asset = [], []
    for i in sorted(hole_issues(), key=lambda x: x["number"]):
        text = (i["body"] or "").replace("\r\n", "\n")
        if "bild" not in text.lower():
            continue
        treffer = [z for z in text.split("\n") if ELEMENTART.search(z)]
        if treffer:
            m = (i.get("milestone") or {}).get("title", "?")[:2]
            betroffen.append((i["number"], m, i["title"][:44], len(treffer), treffer[0].strip()[:90]))
        elif ASSETTYP.search(text):
            nur_asset.append(i["number"])

    print("BETROFFEN - Elementart `bild` im Text (%d Issues):\n" % len(betroffen))
    for nr, m, titel, anzahl, beispiel in betroffen:
        print("  #%-4d %-3s %-44s %2d Stelle(n)" % (nr, m, titel, anzahl))
        print("        %s" % beispiel)
    print("\nNUR Asset-Typ, NICHT betroffen (%d Issues): %s"
          % (len(nur_asset), ", ".join("#%d" % n for n in nur_asset[:30])))


main()
