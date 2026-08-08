# -*- coding: utf-8 -*-
"""Prueft die Ordnerstruktur gegen die Modulliste in TK 9 - die einzige Autoritaet.

    python tools/module-pruefen.py

Anlass: Die Liste ist die Abnahmegrundlage von #1. Zweimal ist ein Modul darin
gelandet, ohne dass der Ordner entstand - `projekt-verwaltung` und `gemeinsam` -,
und beide Male galt #1 trotzdem als erfuellt. Der Grund ist immer derselbe: Wer
die Liste aendert, aendert die Abnahme von #1 mit, aber niemand vergleicht.
Dieses Skript vergleicht.

Es meldet BEIDE Richtungen: ein Modul ohne Ordner (Baufehler) und ein Ordner ohne
Modul (verwaister Ordner oder fehlender Listeneintrag).
"""
import io, os, re, sys

TK = 'docs/Technisches_Konzept_Digital-Signage-Tool.md'
BT = chr(0x60)

# Die drei Zeilen der Modulliste in Abschnitt 9.
ZEILEN = {
    'src/renderer': ('- **Renderer (React-UI):**', 'ipc-client'),
    'src/main':     ('- **Main (Node):**',         'ipc-gateway'),
}

def module_aus_zeile(text, praefix, anker):
    """Alle in Backticks gesetzten Bezeichner der Modulzeile.

    ACHTUNG: Der Praefix kommt ZWEIMAL im Dokument vor - einmal als Prosa in
    Abschnitt 2 (ohne Backticks) und einmal als Modulliste in Abschnitt 9. Ohne
    den Anker greift die Suche die Prosa-Zeile, findet null Module und meldet
    jeden vorhandenen Ordner als verwaist. Genau so ist es beim ersten Lauf
    passiert - die Meldung sah nach einem Baufehler aus und war einer im Werkzeug.
    """
    treffer = [z for z in text.split('\n') if z.startswith(praefix) and anker in z]
    if len(treffer) != 1:
        print('ABBRUCH: %d Zeilen mit Praefix %s und Anker %s' % (len(treffer), praefix, anker))
        sys.exit(1)
    # nur einfache Bezeichner, keine Pfade und keine Funktionsnamen
    roh = re.findall(BT + r'([a-zA-Z][a-zA-Z0-9-]*)' + BT, treffer[0])
    return [m for m in roh if '-' in m or m.islower()]

def ordner(pfad):
    if not os.path.isdir(pfad): return set()
    return {d for d in os.listdir(pfad) if os.path.isdir(os.path.join(pfad, d))}

t = io.open(TK, encoding='utf-8').read()
version = [l for l in t.split('\n') if l.startswith('**Version:')][0]
print(version)

fehler = 0
for pfad, (praefix, anker) in ZEILEN.items():
    genannt = set(module_aus_zeile(t, praefix, anker))
    vorhanden = ordner(pfad)
    fehlt = sorted(genannt - vorhanden)
    verwaist = sorted(vorhanden - genannt)
    print('\n%s  (%d genannt, %d Ordner)' % (pfad, len(genannt), len(vorhanden)))
    if fehlt:
        print('  GENANNT, ABER KEIN ORDNER: ' + ', '.join(fehlt)); fehler += len(fehlt)
    if verwaist:
        print('  ORDNER, ABER NICHT GENANNT: ' + ', '.join(verwaist)); fehler += len(verwaist)
    if not fehlt and not verwaist:
        print('  deckungsgleich')

# Jeder Modulordner braucht eine index.ts (Git verfolgt keine leeren Ordner, tsc braucht Eingaben).
ohne = []
for wurzel in ['src/main', 'src/preload', 'src/renderer', 'src/shared']:
    for d, _, dateien in os.walk(wurzel):
        if d == wurzel: continue
        if not any(f.endswith(('.ts', '.tsx')) for f in dateien):
            ohne.append(d.replace(os.sep, '/'))
print('\nModulordner ohne .ts/.tsx: ' + (', '.join(ohne) if ohne else 'keiner'))
fehler += len(ohne)

print('\n' + ('BEFUNDE: %d' % fehler if fehler else 'OHNE BEFUND'))
sys.exit(1 if fehler else 0)
