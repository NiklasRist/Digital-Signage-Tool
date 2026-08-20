// GENERIERT aus dem Signaturblock von Issue #83.
// [media-service] Metadaten auswerten: Maße, Rotation, Dauer
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
// GERUEST-PRUEFSUMME: 21e2c985d5150653
//
// ERLEDIGT (13.08.2026): Abschaltzeile entfernt, der Rumpf ist gefuellt.
// `ImportFehlercode` bleibt importiert und wird unten per `satisfies` benutzt - der vom
// Issue verlangte BELEG, dass 'probe_fehler' aus der Modul-Union (#79) stammt, ist damit
// eine echte Compiler-Pruefung statt eines Kommentars. Die im Issue vorgesehene
// Ausweichloesung (Beleg in die Testdatei) wird deshalb nicht gebraucht.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ImportFehlercode } from './fehlercodes'

// DIE EINZIGE STELLE, AN DER DAS ffprobe-JSON GEDEUTET WIRD.
//
// #82 (ffprobe.ts) BESCHAFFT die Rohausgabe und liefert sie bewusst als `unknown` - es
// liest dort weder `streams` noch `width`, `height`, `rotate` oder `duration`. Der Grund
// steht in jener Datei: "Zwei Stellen, die dasselbe JSON auslegen, runden frueher oder
// spaeter verschieden."
//
// WAS HIER ENTSTEHT, WIRD DAUERHAFT GESPEICHERT und nirgends nachgerechnet: Die
// Oberflaeche zeigt die Masse an, der composer begrenzt den Trim-Regler an der Dauer, der
// render-service skaliert und schneidet auf ihrer Grundlage. Ein Fehler hier ist spaeter
// nur durch einen Neu-Import aller Medien zu heilen.
//
// REIN UND DETERMINISTISCH: kein fs, kein Prozessstart, kein await, kein Zufall, kein
// Blick auf Datum oder Umgebung. Dieselbe Eingabe liefert immer dasselbe Ergebnis -
// deshalb ist jeder Sonderfall mit einem von Hand geschriebenen Objekt testbar, ohne
// Binary und ohne Testvideo.
//
// UND NIEMALS throw: `roh` stammt aus einem fremden Programm, jeder Zugriff wird geprueft.
// Eine Ausnahme hier liesse den Import-Auftrag ohne brauchbaren Code scheitern
// (TK 9.1.1).

/**
 * Der einzige fachliche Fehlercode dieser Funktion.
 *
 * `satisfies ImportFehlercode` ist der BELEG, dass das Literal aus der Fehlercode-Union
 * des Moduls (#79) stammt und nicht hier erfunden wurde: Verschwindet der Code eines
 * Tages aus jener Union oder verschreibt sich jemand hier, bricht der Typecheck.
 *
 * Warum `satisfies` und keine Annotation `: ImportFehlercode`: Eine Annotation
 * verbreiterte den Wert auf die ganze Union, der Rueckgabetyp laesst aber nur dieses eine
 * Literal zu - diese Enge soll der Typechecker weiter durchsetzen.
 *
 * Dass eine unbrauchbare Rohausgabe denselben Code bekommt wie ein fehlgeschlagener
 * Probe-Lauf, ist Vertrag: "| `probe_fehler` | `ffprobe` liefert keine Metadaten
 * (beschaedigte Datei) **oder** Timeout (gekillt) |" (TK 9.4.9).
 */
const PROBE_FEHLER = 'probe_fehler' satisfies ImportFehlercode

/** Der Ergebnistyp dieser Funktion - einmal benannt, damit die Helfer ihn tragen koennen. */
type MetadatenErgebnis = Ergebnis<
  { maße: { breite: number; höhe: number }; dauer: number | null },
  'probe_fehler'
>

/**
 * Wertet die Rohausgabe von `ffprobe` zu Display-Massen und Dauer aus.
 *
 * @param roh Die mit `JSON.parse` geparste Ausgabe von #82 - `unknown`, weil jede
 *            Struktur denkbar ist. Es wird NICHTS ungeprueft angefasst.
 * @param typ `'video'` oder `'bild'`, wie ihn `pruefeFormat` (#80) aus der Endung
 *            bestimmt hat. Er steuert ALLEIN die Dauer.
 */
export function werteMetadatenAus(roh: unknown, typ: 'video' | 'bild'): MetadatenErgebnis {
  // Schritt 1: `roh` defensiv pruefen.
  const wurzel = alsObjekt(roh)
  if (wurzel === null) {
    return gescheitert('Die ffprobe-Ausgabe ist kein Objekt.')
  }

  const streams = wurzel['streams']
  if (!Array.isArray(streams)) {
    return gescheitert('Die ffprobe-Ausgabe enthaelt kein Feld "streams" als Liste.')
  }

  // Schritt 2: den ERSTEN Video-Stream nehmen.
  //
  // Warum nicht `streams[0]`: Eine Datei mit vorangestellter Tonspur haette dort Audio
  // stehen, und Audio-Streams tragen weder width noch height - der Import einer voellig
  // gesunden Datei schluege dann fehl. Gemessen am 13.08.2026 mit dem gebuendelten
  // ffprobe: Ein MP4 mit Bild und Ton liefert beide Streams in einer Liste, die
  // Reihenfolge bestimmt die Datei, nicht ffprobe.
  //
  // Bilder erscheinen hier EBENFALLS als Video-Stream (`codec_type: "video"`,
  // `codec_name: "png"`/`"mjpeg"`/`"webp"` - gemessen); sie brauchen also keinen
  // Sonderweg, nur die Dauer unten unterscheidet sich.
  const videoStrom = streams.map(alsObjekt).find((s) => s !== null && s['codec_type'] === 'video')
  if (videoStrom === undefined || videoStrom === null) {
    // Eine reine Tondatei ist kein importierbares Medium.
    return gescheitert('Die Datei enthaelt keinen Video-Stream.')
  }

  // Schritt 3: codierte Masse lesen. ffprobe liefert width/height als ZAHLEN (gemessen) -
  // anders als duration und rotate, die als Zeichenkette kommen.
  const breiteRoh = alsPositiveZahl(videoStrom['width'])
  const hoeheRoh = alsPositiveZahl(videoStrom['height'])
  if (breiteRoh === null || hoeheRoh === null) {
    return gescheitert('Der Video-Stream nennt keine brauchbaren Masse.')
  }

  // TK 9.4.8 Punkt 3 verlangt ganzzahlige Werte ausdruecklich. Kein Math.floor: Ein
  // 1919,6 breites Bild ist 1920 breit, nicht 1919.
  const codiertBreite = Math.round(breiteRoh)
  const codiertHoehe = Math.round(hoeheRoh)

  // Schritte 4 und 5: Rotationskorrektur - hier entstehen aus codierten Massen
  // DISPLAY-Masse.
  const drehung = leseDrehung(videoStrom)
  const gedreht = drehung === 90 || drehung === 270
  const maße = gedreht
    ? { breite: codiertHoehe, höhe: codiertBreite }
    : { breite: codiertBreite, höhe: codiertHoehe }

  // Schritt 6: Dauer.
  const dauer = leseDauer(wurzel, videoStrom, typ)
  if (dauer === 'unbrauchbar') {
    return gescheitert('Weder der Container noch der Video-Stream nennt eine brauchbare Dauer.')
  }

  // Schritt 7.
  return { ok: true, wert: { maße, dauer } }
}

/**
 * Die Drehung des Video-Streams in Grad, normalisiert auf 0-359.
 *
 * GEMESSEN am 13.08.2026 mit dem gebuendelten ffprobe (Version 4.0.2, aus ffprobe-static
 * 3.1.0) an einem MP4 mit echter Display-Matrix: Der Tag IST vorhanden, als
 * ZEICHENKETTE, und ffprobe hat ihn bereits auf 0-359 normalisiert -
 * `tags: { "rotate": "270", ... }`. Der STOPP-Punkt des Issues ("neuere ffprobe-Fassungen
 * legen die Drehung nicht mehr unter tags.rotate ab") trifft auf DIESES Binary also
 * NICHT zu; `tags.rotate` allein zu lesen reicht heute aus. Zur Kehrseite dieser Messung
 * - was passiert, wenn ffprobe-static einmal angehoben wird - s. den Bericht zum Issue;
 * hier wird nichts auf Verdacht eingebaut.
 *
 * ZUR NORMALISIERUNG: `ffprobe` liefert je nach Quelle "90" oder "-90" fuer dieselbe
 * Drehung. Ohne `((n % 360) + 360) % 360` wuerde die eine Schreibweise erkannt und die
 * andere uebersehen - und die Uebersehene ist genau der Hochkant-Fall.
 *
 * Fehlt der Tag oder ist er nicht numerisch, gilt 0 - das ist KEIN Fehler, sondern der
 * Normalfall: Die ueberwaeltigende Mehrheit aller Dateien traegt gar keine Drehung.
 */
function leseDrehung(videoStrom: Record<string, unknown>): number {
  const tags = alsObjekt(videoStrom['tags'])
  if (tags === null) return 0

  const roh = tags['rotate']
  // Nur Zeichenkette oder Zahl kommen in Frage. Ohne diese Schranke wuerde `Number(null)`
  // und `Number([])` zu 0 - hier zufaellig harmlos, aber es ist der Zufall, der spaeter
  // bricht.
  if (typeof roh !== 'string' && typeof roh !== 'number') return 0

  const grad = Number(roh)
  if (!Number.isFinite(grad)) return 0

  return ((grad % 360) + 360) % 360
}

/**
 * Die Dauer in Sekunden mit drei Dezimalstellen - oder `null` (Bild) bzw.
 * `'unbrauchbar'` (Fehler).
 *
 * BILDER: immer `null`, ohne einen Blick in die Daten. Gemessen am 13.08.2026: PNG, JPG
 * und WebP liefern durch die *_pipe-Demuxer ueberhaupt kein `duration` - weder im Stream
 * noch im Container. Es gibt aber Faelle, in denen ffprobe fuer ein Einzelbild eine
 * erfundene Dauer meldet (die Bildrate eines gedachten Einzelbild-Videos), und die waere
 * schlicht falsch. Deshalb entscheidet der TYP, nicht der Fund.
 *
 * VIDEOS: Der Container-Wert hat VORRANG, weil er die Laenge beschreibt, die ein
 * Abspieler tatsaechlich zeigt; der Stream-Wert ist die Ersatzquelle. Gemessen an einer
 * echten Datei weichen beide leicht voneinander ab (`format.duration` "1.034000" gegen
 * `streams[0].duration` "1.033984") - die Reihenfolge ist also keine Formalie.
 *
 * Ein unbrauchbarer Container-Wert (fehlend, "N/A", 0) faellt auf den Stream zurueck,
 * statt sofort zu scheitern: "ersatzweise" meint die Ersatzquelle, nicht nur den Fall
 * eines voellig fehlenden Feldes.
 *
 * DREI DEZIMALSTELLEN, NIE GANZE SEKUNDEN: Aus 12,033 s wuerden sonst 12 s, und der
 * frame-genaue Schnitt (30 fps, TK 9.2.6) verschoebe sich um bis zu einer Sekunde - bei
 * JEDEM Element, in einer Schleife aufsummiert. Der Fehler sieht dabei richtig aus, was
 * ihn so teuer macht. Und kein `toFixed` als Rueckgabewert: das liefert eine
 * Zeichenkette, `Asset.dauer` ist eine Zahl.
 */
function leseDauer(
  wurzel: Record<string, unknown>,
  videoStrom: Record<string, unknown>,
  typ: 'video' | 'bild',
): number | null | 'unbrauchbar' {
  if (typ === 'bild') return null

  const format = alsObjekt(wurzel['format'])
  const ausContainer = format === null ? null : alsPositiveZahl(format['duration'])
  const sekunden = ausContainer ?? alsPositiveZahl(videoStrom['duration'])
  if (sekunden === null) return 'unbrauchbar'

  return Math.round(sekunden * 1000) / 1000
}

/**
 * Ein Objekt - oder `null`, wenn der Wert keines ist.
 *
 * Arrays sind ausgeschlossen: `roh` und `format` sollen Objekte sein, und ein Array
 * kaeme hier nur bei einer voellig fremdartigen Struktur an. Es fruehzeitig abzuweisen
 * ist ehrlicher, als seine Indizes wie Feldnamen zu behandeln.
 */
function alsObjekt(wert: unknown): Record<string, unknown> | null {
  if (typeof wert !== 'object' || wert === null || Array.isArray(wert)) return null
  // SAFETY: die Bedingung hat wert als nicht-null, nicht-Array Objekt belegt; der Cast
  // benennt genau diese belegte Index-Form.
  return wert as Record<string, unknown>
}

/**
 * Eine endliche Zahl > 0 - oder `null`.
 *
 * Nimmt Zeichenketten AN, weil ffprobe Dauern genau so liefert ("12.033000"), und Zahlen,
 * weil es Masse genau so liefert (1920). Alles andere - `null`, `"N/A"`, `""`, ein
 * Objekt, ein fehlendes Feld - ergibt `null`.
 *
 * Die leere Zeichenkette ist der Grund fuer die Typschranke: `Number("")` ist 0 und damit
 * "endlich", nur eben nicht das, was jemand gemeint hat. Sie faellt hier ueber die
 * Bedingung > 0. Ein Wert von 0 ist ohnehin fuer beide Verwendungen unbrauchbar - eine
 * Datei mit Breite 0 oder Dauer 0 ist nicht abspielbar.
 */
function alsPositiveZahl(wert: unknown): number | null {
  if (typeof wert !== 'string' && typeof wert !== 'number') return null

  const zahl = Number(wert)
  if (!Number.isFinite(zahl) || zahl <= 0) return null
  return zahl
}

/**
 * Ein gescheitertes Ergebnis.
 *
 * Der TEXT dient allein der Fehlersuche und ist nie Grundlage einer Fallunterscheidung
 * beim Aufrufer - dafuer ist der Code da, und der ist hier immer derselbe.
 */
function gescheitert(meldung: string): MetadatenErgebnis {
  return { ok: false, fehler: { code: PROBE_FEHLER, meldung } }
}
