// Issue #425 - band-aufnahme.ts: die REINE Fachlichkeit des Drops auf einen Video-Block
// (Ziel-Erkennung, Zeitstelle, Startdauer). Kein JSX, kein react, kein IPC, kein throw.
//
// ENTSCHEIDUNG des Users (29.10.2026, #442): Ein Drop auf den KOERPER eines Video-Blocks
// legt IMMER eine UNTERBRECHUNG an der Zeitstelle an (TK 9.2.9) - nicht mehr wahlweise
// einen Band-Abschnitt. Die fruehere Vorlagen-Heuristik (`vollflaeche` -> Unterbrechung,
// sonst Band) und der Band-Drop sind damit entfallen; Band-Abschnitte werden
// ausschliesslich in der Band-Bearbeitung des Elements gepflegt
// (`einblendung-ansicht.tsx`, #253). Der sequenzielle Weg (Kante zwischen zwei Bloecken)
// bleibt unveraendert bei `spalt-drop.ts` (#412/#417).
//
// WAS HIER BLEIBT:
// 1. Die STARTDAUER eines Einschubs = die Dauer-Kette des Produkts:
//    `aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10` (AD 4.4 / TK 9.11.3,
//    EINE Regel - dieselbe Kette gilt fuer Band-Abschnitte und Unterbrechungen).
// 2. Die MESSUNG des Video-Koerpers unter dem Zeiger (`bandZielAus`) und die Zeitstelle
//    darin (`bandZeitImVideo`) - die Geometrie der Zeitleiste (#412/#417).

import { STANDARD_ANZEIGEDAUER_SEKUNDEN } from '../../shared/contracts/konstanten'

/** Der Vorlauf im Slot bis zum Block-Koerper: Kante in Ruhelage (10 px) + eine
 *  Luecke (2 px). Dieselbe Rechnung wie `KANTEN_VORSCHUB_PX` in der Wurzel
 *  (10 + 2 + 2 = 14), hier nur in ihre zwei Teile zerlegt. */
const KOERPER_VORLAUF_PX = 12
/** Der Nachlauf: die Luecke (2 px) vor der naechsten Kante. */
const KOERPER_NACHLAUF_PX = 2

/**
 * Die Startdauer eines Einschubs nach der Dauer-Kette des Produkts:
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
  // Nur der Video-Koerper ist ein Drop-Ziel; ein Segment-Koerper faellt bewusst
  // durch (null) - die Kante daneben bleibt der sequenzielle Weg.
  return treffer.zeile.art === 'video' ? treffer.zeile.elementId : null
}

/**
 * #428: die ZEITSTELLE (Sekunden ab Videoanfang) unter dem Zeiger, wenn er im
 * Koerper eines VIDEO-Blocks steht; sonst null. Sie traegt die Stelle der
 * Unterbrechung (#437/#442).
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
