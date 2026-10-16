// Issue #425 - band-aufnahme.ts: die REINE Fachlichkeit der Aufnahme einer Aktion
// ins Werbeband (Ziel-Erkennung + Entwurfs-Bau). Kein JSX, kein react, kein IPC,
// kein throw.
//
// ZWEI ENTSCHEIDUNGEN des Users (15.10.2026) sind hier festgehalten:
//
// 1. STARTDAUER eines per Drag angehaengten Band-Abschnitts = die Dauer-Kette des
//    Produkts: `aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10`
//    (dieselbe Reihenfolge wie `element.dauer`, AD 4.4 / TK 9.11.3 - EINE Regel).
//    Das ist NICHT der feste Wert `STANDARD_ANZEIGEDAUER_SEKUNDEN`; der bleibt nur
//    der Rueckfall, wenn weder Aktion noch Projekt eine Vorgabe tragen.
//
// 2. BAND-VORLAGE, wenn am Video noch keine gewaehlt ist: die ERSTE waehlbare
//    (`waehlbareBandVorlagen`, #129) - derselbe Startentwurf, den die
//    Einblendung-Ansicht (#253, ENTSCHIEDEN 3) benutzt. Keine zweite, unsichtbare
//    Ordnung neben der Bestandsreihenfolge.
//
// KEIN ZWEITER SCHREIBWEG: Diese Datei baut NUR den Entwurf. Geschrieben wird
// ausschliesslich ueber `uebernehmeBand` (#129) und die Sicht-Korrektur der Wurzel -
// genau der eine Weg, den TK 9.7.7 vorschreibt.
//
// KEINE GEOMETRIE-NEUERFINDUNG in der Anzeige: `bandZielAus` vermisst nur, ob der
// Zeiger im KOERPER eines Video-Blocks steht. Die Kanten-Messung der Einfuegung
// bleibt bei `waehleKanteAus` (#412/#417) - diese Datei entscheidet nichts ueber
// sequenzielle Einfuegung.

import type { Listenelement } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { STANDARD_ANZEIGEDAUER_SEKUNDEN } from '../../shared/contracts/konstanten'
import { fuegeAbschnittAn, waehlbareBandVorlagen, type BandEntwurf } from './einblendung-bearbeiten'
import { entwurfAus } from './einblendung-ansicht'

/** Der Vorlauf im Slot bis zum Block-Koerper: Kante in Ruhelage (10 px) + eine
 *  Luecke (2 px). Dieselbe Rechnung wie `KANTEN_VORSCHUB_PX` in der Wurzel
 *  (10 + 2 + 2 = 14), hier nur in ihre zwei Teile zerlegt. */
const KOERPER_VORLAUF_PX = 12
/** Der Nachlauf: die Luecke (2 px) vor der naechsten Kante. */
const KOERPER_NACHLAUF_PX = 2

/**
 * Die Startdauer eines Band-Abschnitts nach der Dauer-Kette des Produkts:
 * `aktionStandardDauer ?? projektStandarddauer ?? STANDARD_ANZEIGEDAUER_SEKUNDEN`.
 * `null` heisst „keine Vorgabe" - NICHT „0 Sekunden"; ein nicht endlicher Wert
 * faellt ebenfalls auf die naechste Stufe zurueck (eine erfundene Dauer waere
 * schlimmer als die Konstante aus #21).
 */
export function startdauerFuerBandabschnitt(
  aktionStandardDauer: number | null,
  projektStandarddauer: number | null,
): number {
  if (typeof aktionStandardDauer === 'number' && Number.isFinite(aktionStandardDauer) && aktionStandardDauer > 0) {
    return aktionStandardDauer
  }
  if (typeof projektStandarddauer === 'number' && Number.isFinite(projektStandarddauer) && projektStandarddauer > 0) {
    return projektStandarddauer
  }
  return STANDARD_ANZEIGEDAUER_SEKUNDEN
}

/**
 * Der Entwurf nach der Aufnahme: die ERSTE waehlbare Band-Vorlage (User-
 * Entscheidung 2) als Startentwurf, daran EIN Abschnitt mit `aktionId` und
 * `dauer`. null, wenn das Element kein Video ist (TK 9.2.8) ODER keine
 * Band-Vorlage zur Verfuegung steht - dann gibt es nichts aufzunehmen und die
 * Wurzel meldet es.
 *
 * GERUFEN WERDEN NUR DIE BESTEHENDEN #129/#253-Operationen
 * (`waehlbareBandVorlagen`, `entwurfAus`, `fuegeAbschnittAn`) - kein zweiter
 * Schreibweg, keine zweite Vorlagen-Auswahl.
 */
export function bandAufnahmeAus(
  element: Listenelement,
  aktionId: string,
  dauer: number,
  vorlagen: readonly Vorlage[],
): BandEntwurf | null {
  const bandWahl = waehlbareBandVorlagen(vorlagen)
  const erste = bandWahl[0]
  if (erste === undefined) return null

  // `entwurfAus` behaelt eine vorhandene `einblendung` bei (nur die Vorlage wird
  // beim ERSTEN Drop gesetzt); die Abschnitte werden ergaenzt, nie ersetzt.
  const entwurf = entwurfAus(element, erste.id)
  if (entwurf === null) return null

  return fuegeAbschnittAn(entwurf, aktionId, dauer)
}

/**
 * #428: Der Einfüge-Index für eine Aktion, die an einer ZEITSTELLE `zeitSekunden` auf
 * das Video gezogen wurde. Das Band bleibt eine ROTATION (Entscheidung 1a) - die
 * Zeit ist nur die Bedienung: sie wählt die Stelle in der Abschnittsfolge.
 *
 * Die Abbildung ist genau das Zeitverhalten aus TK 9.2.8: Ist die Folge kürzer als
 * das Video, WIEDERHOLT sie sich (`t mod bandGesamt`); ist sie länger, wird am
 * Videoende abgeschnitten (also `min(t, bandGesamt)`). Eingefügt wird VOR den
 * Abschnitt, in dessen Zeitfenster die wirksame Zeit fällt; hinter dem letzten
 * Abschnitt ans Ende.
 *
 * REIN: kein Zustand, kein IPC. Ein leerer Bestand ergibt 0 (der erste Abschnitt);
 * unbrauchbare Zahlen (NaN, negativ) fallen auf 0 zurück - eine erfundene Position
 * wäre schlimmer als der Anfang.
 */
export function bandEinfuegeIndex(
  zeitSekunden: number,
  abschnitte: readonly { dauer: number }[],
  videoDauer: number,
): number {
  if (abschnitte.length === 0) return 0
  if (!Number.isFinite(zeitSekunden) || zeitSekunden < 0) return 0
  if (!Number.isFinite(videoDauer) || videoDauer <= 0) return 0

  let bandGesamt = 0
  for (const abschnitt of abschnitte) {
    if (Number.isFinite(abschnitt.dauer) && abschnitt.dauer > 0) bandGesamt += abschnitt.dauer
  }
  if (bandGesamt <= 0) return 0

  // TK 9.2.8: kürzere Folge wiederholt sich, längere wird abgeschnitten.
  const wirksam = bandGesamt < videoDauer ? zeitSekunden % bandGesamt : Math.min(zeitSekunden, bandGesamt)

  let ende = 0
  for (let stelle = 0; stelle < abschnitte.length; stelle += 1) {
    const abschnitt = abschnitte[stelle]
    if (abschnitt === undefined) return stelle
    const dauer = Number.isFinite(abschnitt.dauer) && abschnitt.dauer > 0 ? abschnitt.dauer : 0
    ende += dauer
    if (wirksam < ende) return stelle
  }
  return abschnitte.length
}

/**
 * Die Kennung des Video-Blocks, in dessen KOERPER der Zeiger `xImKontext` steht;
 * sonst null. Ein Segment-Koerper liefert ABSICHTLICH null (User-Entscheidung 3):
 * Ein Drop darauf ordnet sequenziell davor/danach ein - das erledigt die
 * bestehende Kanten-Messung (`waehleKanteAus`), nicht diese Funktion.
 *
 * `breitePx(i)` ist die REINE Blockbreite (ohne Kanten-Vorschub); `vorschubPx`
 * wird je Block addiert (Kante + zwei Luecken, s. `KANTEN_VORSCHUB_PX`). Nur so
 * passen Koerper-Grenzen und die gemessenen Kanten-Grenzen aus #417 zusammen.
 */
/** Der gemeinsame Durchlauf fuer `bandZielAus` und `bandZeitImVideo`: der Blockkoerper
 *  unter dem Zeiger samt seinem Startpunkt. Ein Durchlauf fuer beide Fragen - sonst
 *  koennten Ziel und Zeit auseinanderlaufen. */
function findeKoerper(
  zeilen: readonly { elementId: string; art: 'video' | 'segment' | 'fehlt' }[],
  breitePx: readonly number[],
  xImKontext: number,
  vorschubPx: number,
): { zeile: { elementId: string; art: 'video' | 'segment' | 'fehlt' }; koerperStart: number } | null {
  if (!Number.isFinite(xImKontext)) return null
  if (!Number.isFinite(vorschubPx) || vorschubPx < 0) return null
  if (zeilen.length !== breitePx.length) return null

  let kante = 0
  for (let stelle = 0; stelle < zeilen.length; stelle += 1) {
    const breite = breitePx[stelle]
    const zeile = zeilen[stelle]
    if (breite === undefined || zeile === undefined) return null
    if (!Number.isFinite(breite) || breite < 0) return null

    const slot = breite + vorschubPx
    const koerperStart = kante + KOERPER_VORLAUF_PX
    const koerperEnde = kante + slot - KOERPER_NACHLAUF_PX
    if (xImKontext >= koerperStart && xImKontext <= koerperEnde) {
      return { zeile, koerperStart }
    }
    kante += slot
  }
  return null
}

/**
 * Die Kennung des Video-Blocks, in dessen KOERPER der Zeiger `xImKontext` steht;
 * sonst null. Ein Segment-Koerper liefert ABSICHTLICH null (User-Entscheidung 3):
 * Ein Drop darauf ordnet sequenziell davor/danach ein - das erledigt die
 * bestehende Kanten-Messung (`waehleKanteAus`), nicht diese Funktion.
 *
 * `breitePx(i)` ist die REINE Blockbreite (ohne Kanten-Vorschub); `vorschubPx`
 * wird je Block addiert (Kante + zwei Luecken, s. `KANTEN_VORSCHUB_PX`). Nur so
 * passen Koerper-Grenzen und die gemessenen Kanten-Grenzen aus #417 zusammen.
 */
export function bandZielAus(
  zeilen: readonly { elementId: string; art: 'video' | 'segment' | 'fehlt' }[],
  breitePx: readonly number[],
  xImKontext: number,
  vorschubPx: number,
): string | null {
  const treffer = findeKoerper(zeilen, breitePx, xImKontext, vorschubPx)
  if (treffer === null) return null
  // Nur der Video-Koerper ist ein Band-Ziel; ein Segment-Koerper faellt bewusst
  // durch (null) - die Kante daneben bleibt der sequenzielle Weg.
  return treffer.zeile.art === 'video' ? treffer.zeile.elementId : null
}

/**
 * #428: die ZEITSTELLE (Sekunden ab Videoanfang) unter dem Zeiger, wenn er im
 * Koerper eines VIDEO-Blocks steht; sonst null. Sie speist den Einfüge-Index
 * (`bandEinfuegeIndex`): der Drop an einer Zeitstelle waehlt die Stelle der Rotation.
 */
export function bandZeitImVideo(
  zeilen: readonly { elementId: string; art: 'video' | 'segment' | 'fehlt' }[],
  breitePx: readonly number[],
  xImKontext: number,
  vorschubPx: number,
  pxProSekunde: number,
): { elementId: string; zeitSekunden: number } | null {
  if (!Number.isFinite(pxProSekunde) || pxProSekunde <= 0) return null
  const treffer = findeKoerper(zeilen, breitePx, xImKontext, vorschubPx)
  if (treffer === null || treffer.zeile.art !== 'video') return null
  return {
    elementId: treffer.zeile.elementId,
    zeitSekunden: Math.max(0, (xImKontext - treffer.koerperStart) / pxProSekunde),
  }
}
