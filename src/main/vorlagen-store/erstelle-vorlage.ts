// [vorlagen-store] erstelleVorlage implementieren

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage, VorlagenArt, Zone } from '../../shared/contracts/vorlage'
import type { VorlagenFehlercode } from './fehlercodes'
import { aendereBestand } from './schreibe-vorlagen'
import { eingebauteVorlagen } from './eingebaute-vorlagen'
import { erzeugeId } from '../../shared/contracts/id'
import { berechneBandGeometrie } from '../../shared/band-geometrie'
import { text } from '../gemeinsam/systemfehler'
/**
 * Die drei zulaessigen Werte, hier als LAUFZEIT-Liste.
 *
 * Der Typ allein genuegt nicht: "Der Main validiert jede eingehende Nutzlast - er vertraut dem
 * Renderer NICHT" (TK 9.1.1 Punkt 6). Ueber IPC kommt beliebiges JSON an; ein `art: 'band'` waere
 * fuer TypeScript unsichtbar und laege danach dauerhaft in vorlagen.json - unveraenderlich, weil
 * die `art` nach dem Anlegen feststeht.
 */
const ARTEN: readonly VorlagenArt[] = ['vollflaeche', 'split', 'einblendung']

/** Groesste zulaessige Laenge des GETRIMMTEN Namens (Issue, Abschnitt "Eingang -> Ausgang"). */
const NAME_MAX_ZEICHEN = 80

/**
 * Obergrenze der Bandhoehe - ausschliesslich. Das ist die Hoehe der vollen Ausgabeflaeche: Ein Band
 * so hoch wie das Bild liesse keine Videoflaeche uebrig (TK 9.11.1 Punkt 8, Wertebereich > 0
 * und < 1080).
 *
 * SIE IST NICHT DIE GANZE SCHRANKE: H = 1078 liegt darunter und ergibt trotzdem eine
 * Videobreite von 0. Diesen Fall faengt weiter unten die Pruefung ueber
 * `berechneBandGeometrie` (#239) - dort steht die Begruendung.
 */
const HOEHE_AUSSCHLIESSLICHE_OBERGRENZE = 1080

/**
 * Die `id`s der Zonen, die den FESTEN MARKENRAHMEN ausmachen - in genau dieser Bedeutung, nicht in
 * dieser Reihenfolge: Die Reihenfolge kommt aus der Quell-Vorlage (s. `festeZonen`).
 *
 * NAMENTLICH und nicht "alle Zonen mit `rolle: 'fest'`": `'vollbild'` fuehrt DREI feste Zonen. Der
 * `scrim` ist kein Bestandteil des Markenrahmens, sondern eine Lesbarkeits-Hilfe fuer eine
 * formatfuellende Fotoflaeche - ein unerwarteter dunkler Verlauf ueber der unteren Bildhaelfte waere
 * fuer den Nutzer nicht erklaerbar (Issue, woertlich).
 */
const MARKENRAHMEN_ZONEN: readonly string[] = ['hintergrund', 'logo']

/**
 * Die `id` der eingebauten Vorlage, aus der eine VOLLFLAECHIGE Vorlage ihren Markenrahmen erbt.
 *
 * NICHT `'split'`, obwohl jene ebenfalls vollflaechig ist: Sie setzt ihr Logo nach RECHTS, weil dort
 * die Textspalte beginnt. Der Markenrahmen verlangt das Logo OBEN LINKS (TK 9.11.1) - nur
 * `'vollbild'` traegt es an dieser Stelle. (Die Zahlen stehen bewusst nirgends in dieser Datei.)
 */
const QUELLE_VOLLFLAECHE = 'vollbild'

/** Die `id` der eingebauten Band-Vorlage - Quelle des Markenrahmens fuer ein Band ihrer Hoehe. */
const QUELLE_BAND = 'band-standard'

/**
 * Legt eine eigene Vorlage an (FA-13) und haengt sie HINTEN an den Bestand.
 *
 * Der feste Markenrahmen entsteht HIER und nur hier: Der Editor darf feste Zonen nicht aendern und
 * kann sie deshalb auch nicht nachliefern (TK 9.11.1 Punkt 4). Ohne die Zone `hintergrund` wuerde
 * eine Aktion ohne Motiv SCHWARZ rendern statt markenkonform.
 */
export async function erstelleVorlage(
  art: VorlagenArt,
  höhe: number | null,
  name: string,
): Promise<Ergebnis<Vorlage, VorlagenFehlercode>> {
  try {
    // SCHRITT 1: VOLLSTAENDIG VALIDIEREN, BEVOR IRGENDETWAS PASSIERT (TK 9.1.1 Punkt 6). Bis zum
    // Aufruf von `aendereBestand` weiter unten wird nichts geschrieben, nichts angelegt und keine
    // ID vergeben - "ungueltige Eingabe -> ungueltige_eingabe, OHNE jede Wirkung auf die Daten".
    if (!ARTEN.includes(art)) {
      return fehler(
        'ungueltige_eingabe',
        `Unbekannte Vorlagenart ${String(art)}; erlaubt sind ${ARTEN.join(', ')}.`,
      )
    }

    if (typeof name !== 'string') {
      return fehler('ungueltige_eingabe', 'Der Name einer Vorlage muss eine Zeichenkette sein.')
    }
    // Gespeichert wird der GETRIMMTE Name, und an ihm haengen auch beide Laengenpruefungen: Sonst
    // liesse sich die Grenze mit Leerzeichen ueberschreiten, und gespeichert wuerde am Ende doch ein
    // kuerzerer Name - die Ablehnung waere fuer den Nutzer nicht nachvollziehbar.
    const getrimmt = name.trim()
    if (getrimmt.length === 0) {
      return fehler('ungueltige_eingabe', 'Der Name einer Vorlage darf nicht leer sein.')
    }
    if (getrimmt.length > NAME_MAX_ZEICHEN) {
      return fehler(
        'ungueltige_eingabe',
        `Der Name einer Vorlage darf hoechstens ${NAME_MAX_ZEICHEN} Zeichen lang sein ` +
          `(uebergeben: ${getrimmt.length}).`,
      )
    }
    // KEINE Pruefung auf Eindeutigkeit des Namens und kein automatisches "(2)": Zwei Vorlagen
    // duerfen gleich heissen, die Identitaet ist die `id` (TK 9.11.4).

    const hoehenFehler = pruefeHoehe(art, höhe)
    if (hoehenFehler !== null) {
      return hoehenFehler
    }

    // SCHRITT 2: die festen Zonen. Sie kommen aus #96 und werden hier NICHT neu hingeschrieben -
    // sonst gaebe es eine zweite Quelle fuer den Markenrahmen, die beim ersten Nachjustieren
    // auseinanderlaeuft.
    const zonen = festeZonen(art, höhe)
    if (!zonen.ok) {
      return zonen
    }

    // SCHRITT 3: die ID. Aus `erzeugeId()` (#20) - kein Zaehler, nicht aus dem Namen, kein
    // Zeitstempel: "Ein Umbenennen darf niemals Referenzen brechen" (TK 9.11.4).
    const vorlage: Vorlage = {
      id: erzeugeId(),
      name: getrimmt,
      art,
      höhe,
      // `parent: null` -> sofort nutzbare Vorlage, KEINE Arbeitskopie. Wer sie bearbeiten will,
      // ruft danach `oeffneZurBearbeitung` (#101).
      parent: null,
      // Nur die drei aus #96 sind eingebaut; an diesem Feld haengen die Sperren gegen Loeschen und
      // gegen `uebernehmeInParent` (TK 9.11.1.1).
      eingebaut: false,
      // Ausschliesslich die festen Zonen. KEINE freien vorbelegen - die legt der Nutzer im Editor
      // an (FA-13: die eigene Vorlage "arrangiert nur die freien Zonen").
      zonen: zonen.wert,
    }

    // SCHRITT 4: anhaengen - HINTEN, damit die Reihenfolge der bestehenden Eintraege unveraendert
    // bleibt (#99 liefert Bestandsreihenfolge).
    //
    // 'sofort', nicht 'entprellt': Das Anlegen ist eine ausdrueckliche Nutzeraktion, und die
    // zurueckgegebene Vorlage soll auf der Platte stehen, bevor der Aufrufer sie in Haenden haelt.
    // Der einzige Schreibweg des Moduls ist `aendereBestand` (#98) - kein eigener Dateizugriff.
    return await aendereBestand<Vorlage>(
      (bestand) => ({
        ok: true,
        // Der uebergebene Bestand ist bereits eine tiefe Kopie; ein neues Array statt `push` haelt
        // die Aenderung trotzdem an einer Stelle sichtbar.
        //
        // ZWEI VERSCHIEDENE OBJEKTE, mit Absicht: `aendereBestand` reicht `wert` unveraendert nach
        // aussen und behaelt `bestand` als lebenden Zwischenspeicher. Waere es dasselbe Objekt,
        // koennte ein Aufrufer, der an der zurueckgegebenen Vorlage etwas aendert, den
        // zwischengespeicherten Bestand hinter dem Ruecken des Stores verbiegen - wirksam, ohne je
        // geschrieben zu werden.
        wert: { bestand: [...bestand, vorlage], wert: structuredClone(vorlage) },
      }),
      'sofort',
    )
  } catch (ursache) {
    // Diese Funktion wirft NIE ueber die IPC-Grenze (TK 9.1.1); jeder Ausgang ist eine Huelle. Der
    // Text einer Ausnahme landet ausschliesslich in `meldung`, nie im Code.
    return fehler('unbekannter_fehler', `Anlegen der Vorlage abgebrochen: ${text(ursache)}`)
  }
}

/**
 * Prueft `höhe` gegen die `art`. Rueckgabe `null` = in Ordnung.
 *
 * Die `art` wird NICHT aus der `höhe` erraten ("höhe gesetzt, also wohl ein Band"): Sie ist nach dem
 * Anlegen unveraenderlich (TK 9.12.1), ein Fehlgriff zwingt den Nutzer, die Vorlage wegzuwerfen.
 */
function pruefeHoehe(
  art: VorlagenArt,
  höhe: number | null,
): Ergebnis<never, VorlagenFehlercode> | null {
  if (art === 'vollflaeche') {
    if (höhe !== null) {
      return fehler(
        'ungueltige_eingabe',
        'Eine vollflaechige Vorlage hat keine Bandhoehe; erwartet wird null.',
      )
    }
    return null
  }

  if (typeof höhe !== 'number' || !Number.isInteger(höhe)) {
    // GANZZAHLIG, weil die Bandhoehe zugleich die Hoehe der Canvas-Flaeche ist (TK 9.10.2:
    // "1920 x höhe"). Eine gebrochene Backing-Groesse ergibt eine gerundete Flaeche, und ab da
    // stimmen die absoluten Zonen-Pixel nicht mehr mit dem gezeichneten Bild ueberein.
    return fehler(
      'ungueltige_eingabe',
      `Die Bandhoehe muss eine ganze Zahl groesser 0 und kleiner ` +
        `${HOEHE_AUSSCHLIESSLICHE_OBERGRENZE} sein (uebergeben: ${String(höhe)}).`,
    )
  }
  if (höhe <= 0 || höhe >= HOEHE_AUSSCHLIESSLICHE_OBERGRENZE) {
    return fehler(
      'ungueltige_eingabe',
      `Die Bandhoehe muss groesser 0 und kleiner ${HOEHE_AUSSCHLIESSLICHE_OBERGRENZE} sein ` +
        `(uebergeben: ${String(höhe)}).`,
    )
  }
  if (höhe % 2 !== 0) {
    // GERADE - vom Vertrag vorgegeben, nicht von dieser Datei: Das Ausgabe-Profil (TK 9.2.4,
    // Chroma-Unterabtastung 4:2:0) verlangt gerade Hoehen und gerade Versaetze. Bei ungerader
    // Hoehe ist die Videoflaeche 1080 - höhe (bei
    // `split`) bzw. der Overlay-Versatz y = 1080 - höhe (bei `einblendung`) ungerade, und BEIDE
    // Kompositionsarten aus TK 9.2.8 brechen. Der Nutzer soll das HIER erfahren, nicht erst beim
    // Render (TK 9.11.1 Punkt 8).
    return fehler(
      'ungueltige_eingabe',
      `Die Bandhoehe muss gerade sein (uebergeben: ${String(höhe)}); ungerade Hoehen brechen die ` +
        `Komposition des Ausgabe-Profils.`,
    )
  }
  // DIE OBERGRENZE 1080 IST ZU WEIT - ES GIBT GENAU EINE ZULAESSIGE HOEHE, DIE KEIN BILD
  // MEHR UEBRIG LAESST: H = 1078.
  //
  // Die Videobreite der Split-Komposition wird auf ein Vielfaches von 4 ABGERUNDET
  // (TK 9.2.8). Bei H = 1078 bleiben 2 px Videoflaeche, und daraus wird
  // floor(2 x 16/9 / 4) x 4 = floor(3,55 / 4) x 4 = 0 x 4 = 0 - ein Video der Breite 0
  // ist nicht darstellbar. Es ist der EINZIGE solche Fall im ganzen Bereich: Schon bei
  // H = 1076 bleiben 4 px, und daraus wird floor(4 x 16/9 / 4) x 4 = 1 x 4 = 4.
  //
  // GERECHNET WIRD NICHT HIER, sondern mit dem geteilten Rechenkern (#239). Eine
  // abgeschriebene Formel waere eine zweite Wahrheit ueber die Bandgeometrie und liefe
  // beim ersten Nachjustieren der Rundung auseinander; die Grenze folgt so von selbst
  // der Rechnung, statt als Zahl daneben zu stehen.
  //
  // DIE GRENZE GILT FUER BEIDE BANDARTEN. Bei `einblendung` bleibt das Video
  // vollflaechig, die Videoflaeche des Split-Falls wird dort also gar nicht gebraucht -
  // aber die `art` steht nach dem Anlegen fest (TK 9.12.1), und der Wertebereich der
  // Bandhoehe ist im Vertrag EINER fuer beide (TK 9.11.1 Punkt 8). Zwei Obergrenzen
  // waeren zwei Regeln fuer eine Zahl; ein Band, das 1078 der 1080 Zeilen verdeckt, ist
  // ausserdem in keiner der beiden Betriebsarten ein sinnvolles Band.
  const geometrie = berechneBandGeometrie(höhe)
  if (geometrie.videoBreite <= 0) {
    return fehler(
      'ungueltige_eingabe',
      `Bei einer Bandhoehe von ${String(höhe)} bleiben nur ` +
        `${String(geometrie.videoBereichHöhe)} Bildzeilen fuer das Video uebrig; die auf ein ` +
        `Vielfaches von 4 abgerundete Videobreite ergibt ${String(geometrie.videoBreite)} und ` +
        `damit kein darstellbares Bild. Bitte eine kleinere Bandhoehe waehlen.`,
    )
  }
  return null
}

/**
 * Liefert die festen Zonen des Markenrahmens fuer die neue Vorlage - KOPIERT aus #96.
 *
 * Warum kopiert und nicht neu geschrieben: So stehen die Rahmenwerte des Markenrahmens an genau
 * EINER Stelle. Eine zweite Niederschrift hier wuerde beim ersten Nachjustieren auseinanderlaufen,
 * und die Abweichung faellt erst am 85-Zoll-Fernseher im Studio auf.
 *
 * Eine eigene tiefe Kopie ist NICHT noetig und waere irrefuehrend: `eingebauteVorlagen()` baut bei
 * JEDEM Aufruf frische Objekte aus Literalen auf. Die hier ausgewaehlten Zonen stammen aus einem
 * Aufruf, dessen uebriges Ergebnis sofort verfaellt - sie werden mit niemandem geteilt.
 */
function festeZonen(art: VorlagenArt, höhe: number | null): Ergebnis<Zone[], VorlagenFehlercode> {
  const mitgelieferte = eingebauteVorlagen()
  const quelle = quelleFuer(art, höhe, mitgelieferte)

  if (quelle === null) {
    // DIE VERBLIEBENE LUECKE, ausdruecklich NICHT geraten (STOPP-Block):
    //
    // Logo-Geometrie bei beliebiger Bandhoehe. Die Werte der eingebauten Band-Vorlage sind auf ihre
    // Hoehe zugeschnitten; sicher nutzbar sind nur die oberen 108 px des Bandes (TK 9.11.1). Bei
    // einem niedrigeren Band passt das Logo nicht mehr hinein. Ob es mitskaliert (und wie), ob es an
    // eine andere Position rutscht oder ob es eine Mindest-Bandhoehe gibt, sagt der Vertrag
    // NIRGENDS - eine erfundene Skalierungsregel waere genau das "automatische Umlayouten", das
    // TK 9.11.1 Punkt 3 verbietet.
    //
    // Die frueher hier stehende zweite Luecke - der Hintergrund einer `einblendung` - ist mit der
    // Entscheidung vom 23.10.2026 geschlossen (AD v1.9 / TK 9.11.1): Angelegt wird ausschliesslich
    // mit 162 px, die festen Zonen kommen aus `band-standard`, und die `hintergrund`-Zone traegt den
    // Scrim-Verlauf statt der deckenden Fuellung (s. `festeZonen` unten).
    //
    // Deshalb entsteht hier KEINE Vorlage. Der Ausgang ist eine Huelle (kein Wurf, nichts
    // geschrieben) und ausdruecklich KEIN `ungueltige_eingabe`: Die Eingabe ist gueltig, die
    // FESTLEGUNG fehlt.
    return fehler(
      'unbekannter_fehler',
      `Fuer eine Vorlage der Art ${art} mit der Hoehe ${String(höhe)} ist noch nicht festgelegt, ` +
        `welche festen Zonen den Markenrahmen bilden (offener Punkt in Issue #100). Es wurde ` +
        `nichts angelegt.`,
    )
  }

  // Die Reihenfolge kommt aus der Quell-Vorlage und wird NICHT umsortiert: Zeichenreihenfolge =
  // Array-Reihenfolge (TK 9.11.1 Punkt 2), und `hintergrund` steht dort zuerst - ans Ende sortiert
  // deckte er alles zu.
  const zonen = quelle.zonen
    .filter((zone) => MARKENRAHMEN_ZONEN.includes(zone.id))
    .map((zone) => (art === 'einblendung' && zone.id === 'hintergrund' ? mitScrimVerlauf(zone) : zone))
  if (zonen.length !== MARKENRAHMEN_ZONEN.length) {
    // Kann nur eintreten, wenn sich #96 aendert. Dann lieber ein sichtbarer Fehlschlag als eine
    // Vorlage ohne Markenrahmen: Die liesse sich spaeter nicht mehr reparieren, weil der Editor
    // feste Zonen nicht hinzufuegen kann.
    return fehler(
      'unbekannter_fehler',
      `Die eingebaute Vorlage ${quelle.id} liefert nicht die erwarteten festen Zonen ` +
        `(${MARKENRAHMEN_ZONEN.join(', ')}).`,
    )
  }
  return { ok: true, wert: zonen }
}

/**
 * Ersetzt die deckende Fuellung der `hintergrund`-Zone durch den Scrim-Verlauf.
 *
 * WOERTLICH (TK 9.11.1, Entscheidung 23.10.2026): "Die `hintergrund`-Zone traegt **keine** deckende
 * `flaecheDunkel`-Fuellung, sondern den **Scrim-Verlauf** `scrimStart` -> `scrimEnde`, Richtung
 * `unten` (durchsichtig -> 70 % Schwarz). Nur so traegt das Band Alpha und ueberlagert das Video."
 * (Deckkraft folgt der Vorlagenart, TK 9.2.8.)
 *
 * Geaendert wird NUR die Deko. Rahmen, `id`, `rolle`, `bindung`, `ausrichtung` und `wennLeer`
 * bleiben die der Band-Vorlage - sonst waere der Markenrahmen eine zweite Festlegung.
 */
function mitScrimVerlauf(zone: Zone): Zone {
  return {
    ...zone,
    deko: { verlauf: { vonFarbRolle: 'scrimStart', bisFarbRolle: 'scrimEnde', richtung: 'unten' } },
  }
}

/**
 * Die Quell-Vorlage des Markenrahmens - oder `null`, wenn fuer diese Kombination nichts festgelegt
 * ist.
 *
 * Die Bandhoehe wird gegen die Hoehe der eingebauten Band-Vorlage geprueft statt gegen eine hier
 * notierte Zahl: So gibt es auch fuer diese Zahl nur eine Quelle (#96). Bekommt die eingebaute
 * Vorlage je eine andere Hoehe, wandert der entschiedene Fall automatisch mit.
 */
function quelleFuer(
  art: VorlagenArt,
  höhe: number | null,
  mitgelieferte: readonly Vorlage[],
): Vorlage | null {
  if (art === 'vollflaeche') {
    return mitgelieferte.find((vorlage) => vorlage.id === QUELLE_VOLLFLAECHE) ?? null
  }
  if (art === 'split' || art === 'einblendung') {
    // BEIDE Bandarten holen ihren Markenrahmen aus derselben Vorlage: Angelegt wird nach der
    // Entscheidung vom 23.10.2026 ausschliesslich mit 162 px (TK 9.11.1), und `band-standard` ist
    // genau darauf zugeschnitten. Andere Hoehen bleiben unentschieden (s. `festeZonen`) - die
    // Oberflaeche bietet sie nicht an, der Store weist sie ab.
    const band = mitgelieferte.find((vorlage) => vorlage.id === QUELLE_BAND)
    return band !== undefined && band.höhe === höhe ? band : null
  }
  return null
}


/**
 * Die Fehlerseite der Huelle - bewusst OHNE Nutztyp, damit sie fuer `Ergebnis<Vorlage, …>` genauso
 * passt wie fuer `Ergebnis<Zone[], …>`. Gleiche Bauart wie in #98.
 */
function fehler(
  code: VorlagenFehlercode | 'ungueltige_eingabe' | 'unbekannter_fehler',
  meldung: string,
): { ok: false; fehler: { code: VorlagenFehlercode | 'ungueltige_eingabe' | 'unbekannter_fehler'; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND BEWUSST:
//
// 1. KEIN Dateizugriff. Der Bestand wird ausschliesslich ueber `aendereBestand` (#98) geaendert;
//    diese Datei kennt weder den Datenort noch den Dateinamen.
// 2. KEINE freien Zonen, keine leere Ueberschrift, kein Motiv-Platzhalter (STOPP-Block).
// 3. KEIN eigener ID-Erzeuger und keine aus dem Namen abgeleitete ID (TK 9.11.4).
// 4. KEINE Namens-Eindeutigkeit und kein automatisches "(2)" (STOPP-Block).
// 5. KEINE Arbeitskopie - `parent` ist immer null (#101 macht das Bearbeiten).
