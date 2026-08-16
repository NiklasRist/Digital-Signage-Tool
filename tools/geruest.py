# Erzeugt aus den "Signatur (verbindlich)"-Bloecken der GitHub-Issues das
# Funktionsgeruest fuer M1-M8: je Zieldatei die Typen/Interfaces unveraendert und
# je Funktion einen WERFENDEN Rumpf.
#
# Warum werfend und nicht leer: Ein leerer Rumpf gibt undefined zurueck und gilt dem
# Compiler bei "void" als gueltig - eine Funktion, die stillschweigend "gelingt", ist
# genau die Attrappe, die #3 verbietet. Ein throw scheitert laut und nennt sein Issue.
#
# Aufruf: python geruest.py <issues.json> <zielwurzel> [--nur N,N,N]

import json, io, os, re, sys, collections, hashlib

# Der Signaturblock wird NICHT mit einem einzigen Muster gesucht. Zwischen der
# Ueberschrift und dem Codezaun darf Prosa stehen (#247 tut das), und ein Muster, das
# beliebige Zwischenzeilen mit verschachtelten Quantoren ueberspringt, laeuft sich in
# langen Issue-Texten fest (gemessen: >3 Minuten ohne Ergebnis).
SIG_UEBERSCHRIFT = re.compile(r'^## Signatur.*$', re.M)
ZAUN_AUF = re.compile(r'^```(?:ts|tsx|typescript)?[ \t]*$', re.M)
ZAUN_ZU = re.compile(r'^```[ \t]*$', re.M)


def sig_block(text):
    """Erster ts-Codeblock nach der Signatur-Ueberschrift, vor der naechsten ##-Ueberschrift."""
    m = SIG_UEBERSCHRIFT.search(text)
    if not m:
        return None
    rest = text[m.end():]
    naechste = re.search(r'^## ', rest, re.M)
    bereich = rest[:naechste.start()] if naechste else rest
    auf = ZAUN_AUF.search(bereich)
    if not auf:
        return None
    ab = bereich[auf.end():].lstrip('\n')
    zu = ZAUN_ZU.search(ab)
    return ab[:zu.start()] if zu else None
PFAD_KOMMENTAR = re.compile(r'^//\s*(src/[A-Za-z0-9_\-./]+\.(?:ts|tsx))\s*$')
DATEI_ZEILE = re.compile(r'^- \*{0,2}Datei(?:en)?[^`\n]*`([^`]+)`', re.M)
FUNK_START = re.compile(r'^\s*(?:export\s+)?(?:declare\s+)?(?:async\s+)?function\s+[A-Za-z_$]')

# Zeichen, nach denen eine Zeile sicher NICHT zu Ende ist.
OFFEN_ENDE = (',', '|', '&', '(', '<', '=>', ':', '+')


def block_von(body):
    b = (body or '').replace('\r\n', '\n')
    return sig_block(b)


def zielpfade(body, block):
    """Primaer der // src/...-Kommentar im Block, hilfsweise die '- Datei:'-Zeile."""
    pfade = []
    if block:
        for z in block.split('\n'):
            m = PFAD_KOMMENTAR.match(z.strip())
            if m and m.group(1) not in pfade:
                pfade.append(m.group(1))
    if not pfade:
        b = (body or '').replace('\r\n', '\n')
        for treffer in DATEI_ZEILE.findall(b):
            t = treffer.strip()
            if t.startswith('src/') and t.endswith(('.ts', '.tsx')) and t not in pfade:
                pfade.append(t)
    return pfade


def signatur_ende(text, start):
    """Findet das Ende EINER Funktionssignatur ab Position `start`.

    Liefert (ende, art) mit art aus {'rumpf', 'semikolon', 'zeilenende'}:
      'rumpf'      - bei `ende` steht ein '{', die Funktion hat bereits einen Rumpf
      'semikolon'  - bei `ende` steht ein ';' (reine Deklaration)
      'zeilenende' - die Signatur endet am Zeilenumbruch ohne Abschlusszeichen

    Warum ein Scanner und keine Heuristik: Der Rueckgabetyp darf selbst geschweifte
    Klammern enthalten (`Promise<Ergebnis<{ stand: X }>>`). Ein Verfahren, das die
    erste '{' fuer den Rumpfanfang haelt, zerschneidet genau diese Signaturen - und
    zwar lautlos, weil das Ergebnis noch wie TypeScript aussieht.
    """
    rund = eckig = geschweift = spitz = 0
    params_fertig = False       # die Parameterliste ist geschlossen
    im_rueckgabetyp = False     # wir stehen hinter dem ':' des Rueckgabetyps
    i, n = start, len(text)
    while i < n:
        z = text[i]
        # Kommentare und Zeichenketten ueberspringen - sie zaehlen nicht mit.
        if text.startswith('//', i):
            i = text.find('\n', i)
            if i == -1:
                return n, 'zeilenende'
            continue
        if text.startswith('/*', i):
            e = text.find('*/', i + 2)
            i = n if e == -1 else e + 2
            continue
        if z in '"\'`':
            i += 1
            while i < n and text[i] != z:
                i += 2 if text[i] == '\\' else 1
            i += 1
            continue
        if text.startswith('=>', i):      # Pfeil ist kein spitze-Klammer-Ende
            i += 2
            continue

        if z == '(':
            rund += 1
        elif z == ')':
            rund -= 1
            if rund == 0:
                params_fertig = True
        elif z == ':' and params_fertig and rund == eckig == spitz == geschweift == 0:
            # Ab hier laeuft der Rueckgabetyp. Eine '{' bedeutet jetzt einen
            # OBJEKT-TYP (`): { anfang: number }`), nicht den Rumpfanfang. Ohne diese
            # Unterscheidung wird der Rueckgabetyp als Rumpf gelesen - die Funktion
            # bekommt keinen, und der Fehler zeigt sich erst zwei Deklarationen
            # spaeter als "Function implementation name must be ...".
            im_rueckgabetyp = True
        elif z == '[': eckig += 1
        elif z == ']': eckig -= 1
        elif z == '<':
            # Nur als Generic zaehlen, wenn davor ein Bezeichner oder ',' steht.
            davor = text[i - 1] if i else ' '
            if davor.isalnum() or davor in '_$,<': spitz += 1
        elif z == '>':
            if spitz > 0: spitz -= 1
        elif z == '{':
            if rund == eckig == spitz == 0 and not im_rueckgabetyp:
                return i, 'rumpf'
            geschweift += 1
        elif z == '}': geschweift -= 1
        elif z == ';' and rund == eckig == spitz == geschweift == 0:
            return i, 'semikolon'
        elif z == '\n' and rund == eckig == spitz == geschweift == 0:
            # Zeilenende auf Tiefe 0: nur ein Ende, wenn die Zeile nicht offen endet.
            zeile = text[text.rfind('\n', 0, i) + 1:i]
            ohne_kommentar = re.sub(r'//.*$', '', zeile).rstrip()
            if ohne_kommentar and not ohne_kommentar.endswith((',', '|', '&', '(', '<', ':', '=>', '=')):
                return i, 'zeilenende'
        i += 1
    return n, 'zeilenende'


def ruempfe_anhaengen(block, issue_nr):
    """Haengt jeder rumpflosen Funktionssignatur einen werfenden Rumpf an.

    Arbeitet auf dem Gesamttext, nicht zeilenweise: Signaturen erstrecken sich ueber
    mehrere Zeilen, und ihr Ende ist nur ueber die Klammerbilanz bestimmbar.
    """
    aus = []
    pos = 0
    angehaengt = 0
    while True:
        # [^\W\d] statt [A-Za-z_$]: Die Funktionsnamen dieses Projekts sind deutsch
        # (oeffneProjekt, loescheAktion, ...). Ein ASCII-Muster uebersieht jede
        # Funktion mit Umlaut - lautlos, denn sie bleibt einfach ohne Rumpf stehen.
        m = re.compile(r'^[ \t]*(?:export[ \t]+)?(?:declare[ \t]+)?(?:async[ \t]+)?'
                       r'function[ \t]+[^\W\d]', re.M | re.U).search(block, pos)
        if not m:
            aus.append(block[pos:])
            break

        aus.append(block[pos:m.start()])
        ende, art = signatur_ende(block, m.start())

        if art == 'rumpf':
            aus.append(block[m.start():ende + 1])   # hat schon einen Rumpf
            pos = ende + 1
            continue

        sig = block[m.start():ende]
        einrueckung = re.match(r'^[ \t]*', block[m.start():]).group(0)

        # Ein nachgestellter //-Kommentar auf derselben Zeile gehoert zur Signatur und
        # darf nicht zwischen ihr und der oeffnenden Klammer stehen - dort verschluckte
        # er die '{'. Er wandert ueber die Funktion.
        nachsatz = ''
        m_k = re.search(r'//.*$', sig)
        if m_k and '\n' not in sig[m_k.start():]:
            nachsatz = einrueckung + m_k.group(0).strip() + '\n'
            sig = sig[:m_k.start()].rstrip()

        aus.append(nachsatz + sig.rstrip() + ' {\n')
        aus.append(einrueckung + '  throw new Error(\n')
        aus.append(einrueckung + '    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #%d."\n' % issue_nr)
        aus.append(einrueckung + '  );\n')
        aus.append(einrueckung + '}')
        angehaengt += 1
        pos = ende + 1 if art == 'semikolon' else ende

    return ''.join(aus), angehaengt


def konstanten_belegen(text, issue_nr):
    """Gibt `export const X: T` ohne Wert einen werfenden Ausdruck.

    Warum nicht einfach einen passenden Wert einsetzen: Bei zwei der Faelle waere er
    aus dem Literaltyp ableitbar (`readonly ['import', 'loeschen']`), bei den uebrigen
    zwoelf ist er ECHTE IMPLEMENTIERUNG (`LEERE_PROJEKTLISTE: Projektliste`). Ein
    generator-erfundener Wert saehe richtig aus und waere die schlimmste Sorte Fehler:
    einer, den niemand mehr sucht. Deshalb wirft auch die Konstante.

    Der Wurf geschieht beim Laden des Moduls, nicht bei der ersten Benutzung - das ist
    Absicht: Ein ungefuelltes Geruest soll beim ersten Start auffallen, nicht irgendwann
    mitten im Betrieb.
    """
    muster = re.compile(r'^([ \t]*export[ \t]+const[ \t]+[^\W\d][\w$]*[ \t]*:[^\n=]+?)[ \t]*$',
                        re.M | re.U)

    def ersetze(m):
        return (m.group(1) + ' = (() => {\n'
                '  throw new Error(\n'
                '    "Noch nicht umgesetzt - Wert gehoert zu Issue #%d."\n'
                '  );\n'
                '})();' % issue_nr)

    return muster.subn(ersetze, text)


DIREKTIVE = '/* eslint-disable @typescript-eslint/no-unused-vars */\n'

BEGRUENDUNG = (
    '//\n'
    '// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:\n'
    '// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber\n'
    '// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile\n'
    '// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie\n'
    '// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,\n'
    '// weil dann nichts mehr rot ist.\n'
    '//\n'
    '// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem\n'
    '// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und\n'
    '// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.\n'
)


PRUEFSUMME_ZEILE = '// GERUEST-PRUEFSUMME: '


def herkunft(text):
    """Nummer des Issues, aus dem diese Datei erzeugt wurde - oder None."""
    m = re.search(r'^// GENERIERT aus dem Signaturblock von Issue #(\d+)\.', text, re.M)
    return int(m.group(1)) if m else None


def pruefsumme(text):
    return hashlib.sha1(text.encode('utf-8')).hexdigest()[:16]


def zerlege(text):
    """Trennt eine erzeugte Datei in (vermerkte Pruefsumme, Rumpftext ohne Kopf).

    Der Kopf endet an der ersten Leerzeile - dieses Format erzeugt `kopf` selbst.
    Liefert (None, None), wenn die Datei nicht von diesem Werkzeug stammt.
    """
    t = ohne_nachtrag(text)
    m = re.search(r'^' + re.escape(PRUEFSUMME_ZEILE) + r'([0-9a-f]+)\s*$', t, re.M)
    if not m:
        return None, None
    trenn = t.find('\n\n')
    if trenn == -1:
        return None, None
    return m.group(1), t[trenn + 2:]


def ohne_nachtrag(text):
    """Entfernt, was der Nachlauf `setze_direktiven` an eine Datei angehaengt hat.

    Ohne diese Umkehrung schluege der Byte-Vergleich bei JEDER Datei an, die eine
    Abschaltzeile bekommen hat - der Generator schreibt sie ja ohne, der Nachlauf setzt
    sie danach. Das Ergebnis waeren 192 falsche Abweichungs-Meldungen, und eine echte
    ginge darin unter.
    """
    if text.startswith(DIREKTIVE):
        text = text[len(DIREKTIVE):]
    return text.replace('\n' + BEGRUENDUNG + '\n', '\n\n', 1)


def setze_direktiven(ziel):
    """Fragt ESLint, welche erzeugten Dateien no-unused-vars melden, und versieht NUR diese.

    Warum gefragt und nicht geraten: Ob eine Datei die Abschaltzeile braucht, haengt
    nicht allein an den Parametern - auch Importe, die der werfende Rumpf benutzt
    haette, zaehlen. Zwei Anlaeufe mit Heuristik lagen daneben: erst blieben 18 Dateien
    mit echten Fehlern uebrig, dann trugen 18 die Zeile ueberfluessig. Eine Zeile, die
    ESLint selbst als unnoetig meldet, ist kein Schoenheitsfehler - sie erzeugt eine
    Warnung, die man ueberliest, und dann ueberliest man auch die naechste.

    Faellt ESLint aus (nicht installiert, kaputte Konfiguration), wird NICHTS gesetzt
    und das gemeldet - lieber sichtbar unfertig als stillschweigend halb.
    """
    import subprocess
    try:
        lauf = subprocess.run(['npx', 'eslint', '.', '--format', 'json'],
                              cwd=ziel, capture_output=True, text=True,
                              encoding='utf-8', shell=(os.name == 'nt'))
        bericht = json.loads(lauf.stdout or '[]')
    except (OSError, ValueError):
        print('  ACHTUNG: ESLint nicht auswertbar - keine Abschaltzeile gesetzt.')
        return 0

    gesetzt = 0
    for eintrag in bericht:
        if not any(m.get('ruleId') == '@typescript-eslint/no-unused-vars'
                   for m in eintrag.get('messages', [])):
            continue
        pfad = eintrag.get('filePath', '')
        try:
            t = io.open(pfad, encoding='utf-8').read()
        except OSError:
            continue
        if 'GENERIERT aus dem Signaturblock' not in t or t.startswith(DIREKTIVE):
            continue
        # Die Begruendung wandert ans Ende des Kopfblocks, also vor die erste Leerzeile.
        io.open(pfad, 'w', encoding='utf-8', newline='\n').write(
            DIREKTIVE + t.replace('\n\n', '\n' + BEGRUENDUNG + '\n', 1))
        gesetzt += 1
    return gesetzt


def kopf(nr, titel, pfad, summe):
    return (
        '// GENERIERT aus dem Signaturblock von Issue #%d.\n'
        '// %s\n'
        '//\n'
        '// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht\n'
        '// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt\n'
        '// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den\n'
        '// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.\n'
        '//\n'
        '// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.\n'
        '// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann\n'
        '// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie\n'
        '// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach\n'
        '// stehen; ihr Nichtmehrstimmen IST das Signal.\n'
        '%s%s\n\n'
        % (nr, titel, PRUEFSUMME_ZEILE, summe)
    )


def main():
    quelle, ziel = sys.argv[1], sys.argv[2]
    nur = None
    if '--nur' in sys.argv:
        nur = {int(x) for x in sys.argv[sys.argv.index('--nur') + 1].split(',')}

    daten = json.load(io.open(quelle, encoding='utf-8'))
    m17 = [i for i in daten
           if (i.get('milestone') or {}).get('title', '').startswith(('M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'))]

    beansprucht = collections.defaultdict(list)
    geschrieben, ohne_ziel, ohne_block, ruempfe = 0, [], [], 0
    unveraendert = []   # Datei stimmt Byte fuer Byte - unberuehrter Platzhalter
    abweichend = []     # Datei weicht ab - jemand hat gearbeitet, NICHT anfassen
    erneuert = []       # unberuehrter Platzhalter, Issue geaendert -> neu geschrieben
    konstanten = 0

    for iss in sorted(m17, key=lambda x: x['number']):
        nr = iss['number']
        if nur and nr not in nur:
            continue
        block = block_von(iss['body'])
        if not block:
            ohne_block.append(nr)
            continue
        pfade = zielpfade(iss['body'], block)
        if not pfade:
            ohne_ziel.append(nr)
            continue

        # Nur die erste Zieldatei bekommt den Block; mehrere Pfade werden gemeldet.
        pfad = pfade[0]
        beansprucht[pfad].append(nr)

        inhalt, n = ruempfe_anhaengen(block, nr)
        inhalt, k = konstanten_belegen(inhalt, nr)
        ruempfe += n
        konstanten += k
        # Die Pfad-Kommentarzeile selbst nicht mit in die Datei schreiben.
        inhalt = '\n'.join(z for z in inhalt.split('\n')
                           if not PFAD_KOMMENTAR.match(z.strip()))

        voll = os.path.join(ziel, pfad.replace('/', os.sep))
        rumpf = inhalt.strip() + '\n'
        neu = kopf(nr, iss['title'], pfad, pruefsumme(rumpf)) + rumpf

        # BYTE-VERGLEICH statt "existiert schon" oder "vorher alles loeschen".
        #
        # Die beiden naheliegenden Regeln sind beide falsch, und zwar gegenlaeufig:
        #   - "vorhandene ueberspringen" laesst eine geaenderte Signatur NIE im Code
        #     ankommen. Genau so blieb #22 (Ergebnis<T, F>) liegen, waehrend 104
        #     Typfehler auf ihn zeigten.
        #   - "erst alle generierten loeschen, dann neu schreiben" trifft eine
        #     GEFUELLTE Datei genauso wie einen unberuehrten Platzhalter. Der Kopf
        #     bleibt beim Fuellen ja stehen ("Zu fuellen ist ausschliesslich der
        #     Rumpf") - eine fertige Implementierung waere lautlos wieder ein
        #     werfender Rumpf.
        #
        # Der Vergleich braucht weder Marker noch Vertrauen: Stimmt die Datei Byte fuer
        # Byte mit dem ueberein, was dieser Lauf schreiben wuerde, hat sie niemand
        # angefasst und darf ersetzt werden. Weicht sie ab, hat jemand gearbeitet -
        # dann wird NICHT geschrieben, sondern gemeldet.
        if os.path.exists(voll):
            vorhanden = io.open(voll, encoding='utf-8', newline='').read()
            vermerkt, ist_rumpf = zerlege(vorhanden)

            if vermerkt is None:
                # Keine Pruefsumme im Kopf: entweder von Hand geschrieben (M0) oder aus
                # einem aelteren Lauf. Beides nicht anfassen.
                abweichend.append((pfad, nr, 'fremd oder alt'))
            elif vermerkt != pruefsumme(ist_rumpf):
                # Der Inhalt weicht von dem ab, was der Generator hier zuletzt
                # hinterlassen hat -> jemand hat gearbeitet. Unantastbar.
                abweichend.append((pfad, nr, 'bearbeitet'))
            elif herkunft(vorhanden) != nr:
                # Die Datei stammt von einem ANDEREN Issue. Mehrere Issues duerfen
                # dieselbe Datei beschreiben (assets.ts: #72, #73, #74). Ohne diese
                # Pruefung ueberschriebe hier jedes folgende Issue das vorige - bei
                # jedem Lauf aufs Neue, und der Inhalt haenge davon ab, wer zuletzt
                # dran war.
                abweichend.append((pfad, nr, 'gehoert #%s' % herkunft(vorhanden)))
            elif ohne_nachtrag(vorhanden) == neu:
                unveraendert.append(pfad)
            else:
                # Unberuehrt, aber das Issue hat sich seither geaendert: Der Vertrag
                # gehoert in den Code. Genau dieser Fall ist bisher liegengeblieben
                # (#22 stand im Issue, die Datei blieb alt, 104 Typfehler zeigten
                # darauf).
                io.open(voll, 'w', encoding='utf-8', newline='\n').write(neu)
                erneuert.append((pfad, nr))
            continue

        os.makedirs(os.path.dirname(voll), exist_ok=True)
        io.open(voll, 'w', encoding='utf-8', newline='\n').write(neu)
        geschrieben += 1

    print('Dateien NEU geschrieben    :', geschrieben)
    print('Unveraendert (Platzhalter) :', len(unveraendert))
    print('Erneuert (Issue geaendert) :', len(erneuert))
    print('Abschaltzeilen gesetzt     :', setze_direktiven(ziel))
    print('Werfende Ruempfe angehaengt:', ruempfe)
    print('Werfende Konstanten belegt :', konstanten)
    print('Issues ohne Signaturblock  :', len(ohne_block), ohne_block[:15])
    print('Issues ohne Zieldatei      :', len(ohne_ziel), ohne_ziel[:15])
    mehrfach = {p: v for p, v in beansprucht.items() if len(v) > 1}
    if abweichend:
        print()
        print('!!! %d DATEI(EN) WEICHEN AB - NICHT ANGETASTET !!!' % len(abweichend))
        print('    Diese Dateien stimmen nicht mit dem ueberein, was aus dem Issue folgen')
        print('    wuerde. Entweder wurde der Rumpf gefuellt (dann ist das richtig so und')
        print('    eine Vertragsaenderung ist VON HAND nachzuziehen), oder jemand hat die')
        print('    Signatur in der Datei geaendert statt im Issue (dann gehoert sie zurueck).')
        for p, nr, grund in abweichend:
            print('      #%-4d %-52s [%s]' % (nr, p, grund))
    print('Dateien mit mehreren Issues:', len(mehrfach))
    for p, v in list(mehrfach.items())[:10]:
        print('   ', p, '->', v)


main()
