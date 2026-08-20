// GENERIERT aus dem Signaturblock von Issue #176.
// [render-service] Bandgeometrie aus Art und Höhe der Einblendung bestimmen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: d1604cbea8b4865a
//
// ============================================================================
// WAS DIESE DATEI IST - UND WAS SIE SEIT TK v3.1 NICHT MEHR IST
// ============================================================================
// Sie ist der PRUEFENDE AUFRUFER, nicht der Rechner. Sie validiert `art` und
// `höhe`, ruft `berechneBandGeometrie(höhe)` aus dem GETEILTEN Bereich und
// reicht deren Ergebnis UNVERAENDERT durch. Sie vergibt die Fehlercodes.
//
// WARUM DIE RECHNUNG WOANDERS LIEGT: Die Vorschau (P5) muss dieselbe Aufteilung
// zeigen wie die gerenderte Datei - das ist ihr ganzer Zweck. Laege die Formel
// hier im Main, koennte der Renderer sie nicht importieren (TK 9.1) und muesste
// sie abschreiben; abgeschriebene Formeln driften. Verschaerfend: Der
// Abschreibfehler bliebe UNSICHTBAR, weil die eingebaute Band-Vorlage (H = 162)
// als einzige zufaellig aufgeht (918 x 16/9 = 1632, bereits durch 4 teilbar) -
// jeder Test mit ihr ist gruen, egal ob gerundet wird oder nicht. Auseinander
// liefen Vorschau und fertiges Video erst bei einer EIGENEN Band-Vorlage, also
// beim Nutzer und nicht beim Entwickler.
//
// DESHALB GILT HIER: kein Math.floor/round/ceil, keine 16, keine 9, keine
// Division, keine Zentrierung, kein Nachbessern eines gelieferten Werts.
// Wer die Rundung hier "zur Sicherheit" nachbaut, stellt genau den Zustand
// wieder her, den die Verlagerung beenden sollte: zwei Rundungsstellen.
//
// UND SIE SCHLAEGT NICHTS NACH: kein Import aus dem vorlagen-store, kein
// Lesen einer Vorlage, auch nicht "nur zum Gegenpruefen". Der Render friert
// seinen Eingang beim EINREIHEN ein (TK 9.3.5). Ein Auftrag kann Minuten in der
// Warteschlange stehen; aendert jemand in dieser Zeit die Bandhoehe der Vorlage,
// passten die bereits gezeichneten Band-PNGs (1920 x H ZUM EINREIH-ZEITPUNKT)
// nicht mehr zur nachgeschlagenen Hoehe - das Band waere verzerrt oder falsch
// platziert, und es gaebe KEINEN Fehler, nur ein falsches Video.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'
import { berechneBandGeometrie, type BandGeometrie } from '../../shared/band-geometrie'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/** Die beiden Kompositionsarten aus TK 9.2.8. Ein Band ist nie `vollflaeche`. */
export type Bandart = 'split' | 'einblendung'

/**
 * Die zulaessigen Werte fuer `art` als LAUFZEIT-Liste.
 *
 * Warum ueberhaupt geprueft wird, obwohl der Typ `Bandart` es schon zusagt:
 * „Der Main validiert jede eingehende Nutzlast - er vertraut dem Renderer nicht."
 * (TK 9.1.1 Punkt 6). Der Wert reist ueber die IPC-Grenze; dort ist der Typ
 * geloescht und nur noch eine Zusage, keine Schranke.
 */
const ZULAESSIGE_ARTEN: readonly string[] = ['split', 'einblendung']

/**
 * Kleinste Videobreite, die bei `art: 'split'` noch ein Bild ergibt.
 *
 * Sie ist KEIN Bestandteil der Rechnung, sondern eine SCHRANKE auf deren Ergebnis
 * (ENTSCHIEDEN 6): Bei `H = 1078` bleiben 2 px Videoflaeche, 2 x 16/9 = 3,55…,
 * und das groesste Vielfache von 4 darunter ist 0. Eine Breite von 0 ist kein
 * Bild - ffmpeg braeche mit einer Meldung ab, die niemand auf die Bandhoehe
 * zurueckfuehren koennte. Betroffen ist ausschliesslich H = 1078; ab H = 1076 ist
 * die Breite 4 und damit gueltig.
 *
 * KEIN Klemmen, kein `Math.max(4, …)` - weder hier noch in der Rechenfunktion:
 * Die geteilte Funktion ist TOTAL, sie liefert folgerichtig 0 und meldet nichts.
 * Dass dieses Ergebnis unbrauchbar ist, stellt der Torwaechter fest.
 *
 * VERMERK ZU EINEM WIDERSPRUCH IM ISSUE #176 (gemeldet, nicht eigenmaechtig
 * aufgeloest): ENTSCHIEDEN 6 und die Fehlerpfad-Tabelle schreiben die Schranke
 * woertlich als `geo.videoBreite < 4`; die Grep-Probe der Definition of Done
 * verbietet dagegen das Literal `4` im ausfuehrbaren Teil. Umgesetzt ist das
 * VERHALTEN (die Tabelle ist als vollstaendig bezeichnet, und die DoD verlangt
 * selbst die Grenzfaelle 1078 ungueltig / 1076 gueltig mit Breite 4). Die
 * Grep-Absicht - keine RECHNUNG in dieser Datei - bleibt gewahrt: Die 4 steht
 * hier als Vergleichswert, nicht als Rundungsmodul.
 */
const MINDEST_VIDEOBREITE_SPLIT = 4

/**
 * Einheitlicher Fehlerausgang. `daten` wird NIE gesetzt: Diese Funktion kennt die
 * Element-ID nicht; der Aufrufer ergaenzt `daten = { elementId }` als
 * `ElementFehlerdaten` (TK 9.2.3).
 */
function ungueltig(meldung: string): Ergebnis<BandGeometrie, RenderFehlercode> {
  return { ok: false, fehler: { code: 'ungueltiges_element', meldung } }
}

/**
 * Prueft die mitgereiste Einblendung und liefert die Geometrie der GETEILTEN Rechenfunktion
 * unveraendert weiter. Einzige Autoritaet fuer die Regel „welche Bandhoehe ist zulaessig" –
 * die Regel „wo liegt was" gehoert seit TK v3.1 in den geteilten Bereich.
 *
 * Diese Datei rechnet NICHTS: kein Math.floor, keine 16/9, keine Vierer-Rundung, keine Versaetze.
 * Sie ruft berechneBandGeometrie(einblendung.höhe) und reicht das Ergebnis DURCH.
 */
export function bestimmeBandgeometrie(
  einblendung: { art: Bandart; höhe: number },
): Ergebnis<BandGeometrie, RenderFehlercode> {
  try {
    // Die Nutzlast kommt aus dem Renderer. Der statische Typ ist ueber die
    // IPC-Grenze hinweg nur eine Zusage - hier wird sie geprueft, nicht geglaubt.
    // SAFETY: der Cast erweitert nur um null/undefined; die Pruefung der Form folgt
    // unmittelbar darunter (typeof- und Feld-Checks, Ergebnis-Huelle statt Wurf).
    const roh = einblendung as
      | { art?: unknown; höhe?: unknown }
      | null
      | undefined

    if (roh === null || roh === undefined || typeof roh !== 'object') {
      // Ohne Band bleibt die Verarbeitung unveraendert (TK 9.2.8) - dann wird
      // diese Funktion gar nicht erst gerufen. Sie hat keinen Fall dafuer und
      // liefert keine „Standard-Geometrie".
      return ungueltig(
        'Diese Funktion gilt nur fuer Elemente MIT Einblendung; uebergeben wurde keine.',
      )
    }

    const art = roh.art
    if (typeof art !== 'string' || !ZULAESSIGE_ARTEN.includes(art)) {
      // Die beiden Arten aus TK 9.2.8: „split" = Band unter dem verkleinerten
      // Video, „einblendung" = Band ueber dem vollflaechigen Video.
      return ungueltig(
        `Unbekannte Kompositionsart ${JSON.stringify(art)}. ` +
          'Zulaessig sind ausschliesslich "split" und "einblendung".',
      )
    }

    const höhe = roh.höhe
    if (typeof höhe !== 'number' || !Number.isFinite(höhe)) {
      return ungueltig(
        `Die Bandhoehe muss eine endliche Zahl sein, vorgefunden: ${String(höhe)}.`,
      )
    }
    if (!Number.isInteger(höhe)) {
      return ungueltig(
        `Die Bandhoehe muss ganzzahlig sein (Pixel), vorgefunden: ${String(höhe)}.`,
      )
    }
    if (höhe <= 0) {
      return ungueltig(
        `Die Bandhoehe muss groesser als 0 sein, vorgefunden: ${String(höhe)}.`,
      )
    }
    if (höhe >= RENDER_PROFILE.hoehe) {
      // Die Gesamthoehe kommt aus dem Profil (#18), nicht als Literal - eine
      // spaetere Profil-Aenderung muss ein Datenwert bleiben (ENTSCHIEDEN 7).
      // Genau der in TK 9.2.3 genannte Fall „einblendung … mit höhe >= 1080".
      return ungueltig(
        `Die Bandhoehe ${String(höhe)} erreicht oder ueberschreitet die Bildhoehe ` +
          `${String(RENDER_PROFILE.hoehe)}; es bliebe kein Video uebrig.`,
      )
    }
    if (höhe % 2 !== 0) {
      // KEINE Ausweich-Geometrie: nicht runden, das Band nicht um ein Pixel
      // verschieben, die Videoflaeche nicht kuerzen. Jede dieser Rettungen
      // erzwaenge eine Skalierung des bereits in 1920 x H gezeichneten Band-PNGs -
      // der Text im Band wuerde unscharf (ENTSCHIEDEN 3).
      // Das Ausgabe-Profil schreibt yuv420p fest (TK 9.2.4). Dabei wird die Farbe
      // in BEIDEN Richtungen um den Faktor zwei untergetastet - nur GERADE Hoehen
      // und Versaetze sind zulaessig.
      const naechsteGerade = höhe - 1 > 0 ? höhe - 1 : höhe + 1
      return ungueltig(
        `Die Bandhoehe ${String(höhe)} ist ungerade. Das Ausgabe-Profil verlangt yuv420p; ` +
          'dabei sind nur GERADE Bandhoehen zulaessig. Naechstliegende gerade Hoehe: ' +
          `${String(naechsteGerade)}. Die Bandhoehe stammt aus der Band-Vorlage und ist ` +
          'dort anzupassen.',
      )
    }

    // Erst pruefen, dann rechnen (ENTSCHIEDEN 9). Die geteilte Funktion ist zwar
    // total und wirft nicht, liefert bei einer unzulaessigen Hoehe aber Zahlen,
    // die niemand benutzen darf - ein Aufruf davor waere die Einladung, sie doch
    // zu benutzen. Bei JEDEM Fehlerpfad oben wird sie gar nicht gerufen.
    const geometrie = berechneBandGeometrie(höhe)

    // Nur bei `split`. Bei `einblendung` bleibt das Video vollflaechig 1920 x 1080;
    // die eingepasste Breite wird dort gar nicht benutzt (einziges bedeutungstragendes
    // Feld ist `bandY`). Eine Abweisung waere dort eine erfundene Regel und liesse
    // einen zulaessigen Auftrag scheitern (ENTSCHIEDEN 6).
    if (art === 'split' && geometrie.videoBreite < MINDEST_VIDEOBREITE_SPLIT) {
      return ungueltig(
        `Bei der Bandhoehe ${String(höhe)} bleibt fuer das Video kein Bild mehr uebrig ` +
          '(eingepasste Breite 0). Bei "split" ist diese Bandhoehe deshalb unzulaessig; ' +
          'bei "einblendung" waere sie zulaessig, weil das Video dort vollflaechig bleibt.',
      )
    }

    // UNVERAENDERT durchreichen: kein Feld ergaenzt, keines umbenannt, keines
    // nachgerundet oder geklemmt (ENTSCHIEDEN 8). Wer hier ein Feld hinzufuegt,
    // hat wieder zwei Typen fuer dieselbe Sache - und der zweite gilt nur im Main,
    // waehrend die Vorschau mit dem ersten rechnet.
    return { ok: true, wert: geometrie }
  } catch (ursache) {
    // Niemals `throw`: Diese Funktion wird aus einer IPC-bedienten Operation heraus
    // benutzt (TK 9.1.1). Eine Ausnahme ueber die Prozessgrenze verlaere ihren Code.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Die Geometrie des Bandes konnte nicht bestimmt werden: ${
          ursache instanceof Error ? ursache.message : String(ursache)
        }`,
      },
    }
  }
}
