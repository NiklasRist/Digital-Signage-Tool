// Die REINE Auswahlregel hinter der Asset-Auswahl im Reparatur-Modus (#202).
// Kein JSX, kein React, kein IPC - nur die zwei Fragen, die jede Auswahl braucht:
// "Welchen Asset-Typ braucht dieses Element?" und "Welche Assets sind anbietbar?".
//
// Warum ein Filter und keine Anzeige-Liste mit Alles: Der Main (#152) lehnt
// eine Referenz des falschen Typs im Main mit 'nicht_gefunden' ab. Biete die
// Oberfläche beide Typen an, liest der Nutzer eine Liste, deren Haelfte beim
// Bestätigen scheitert - und der Fehler kommt als technische Meldung aus dem
// Main, obwohl die Oberfläche ihn hätte vermeiden koennen. Genauso wertlos:
// ein 'fehlt'-Asset als Ersatz fuer ein 'fehlt'-Asset - die Reparatur waere
// danach NICHT abgeschlossen, und der Nutzer laeuft im Kreis.
//
// NACHTRAG (15.08.2026, TK v3.16 / AD v1.5): Listenelement.art hat nur noch
// 'video' | 'segment'. Die Fallunterscheidung ist damit eine ZWEI statt einer
// Drei. Der Asset-Typ 'bild' BLEIBT unberuehrt - Bilder werden weiter importiert
// und von Aktionen benutzt; sie sind nur nicht mehr selbst Elemente der Liste.
// Zur Verdraehnung - art ist in der Vertragsdatei auf 'video' | 'segment'
// eingeengt, aber der Bestand entsteht aus JSON, die TypeScript nicht prueft:
// Die Frage art === 'bild' bleibt bewusst eine RUNTIME-Frage. Bau dazu nichts
// fuer eine Migration (TK 9.11.3, offen) - gefiltert wird nur.

import type { Asset } from '../../shared/contracts/asset'
import type { Listenelement } from '../../shared/contracts/project'

/** Welchen Asset-Typ dieses Element braucht. null für 'segment' – dort ist die Referenz eine
 *  Aktions-ID, kein Asset (s. #203). */
export function benoetigterAssetTyp(element: Listenelement): 'video' | 'bild' | null {
  if (element.art === 'video') {
    return 'video'
  }
  if (element.art === 'segment') {
    return null
  }
  // Rest: art 'bild'. Die Streichung (TK v3.16) leert die Liste künftig, aber
  // ein Bestandsdatensatz kann den Namen noch tragen - die Typzuordnung ist
  // dieselbe wie vor der Streichung, denn eine Anzeige auf 'bild'-Assets wäre
  // genau das, was der Elementname verlangt.
  return 'bild'
}

/**
 * Die anbietbaren Assets: NUR zustand 'ok' UND typ === gefordert.
 * Reihenfolge = Bestandsreihenfolge aus `assets`; es wird NICHT sortiert - eine
 * Sortierung hier wäre eine zweite, unsichtbare Ordnung neben der gespeicherten.
 * Das aktuell referenzierte Asset wird NICHT herausgefiltert: Es ist genau das
 * fehlende und faellt damit ohnehin durch den Zustandsfilter; taucht es
 * zwischenzeitlich wieder auf (TK 9.4.7 setzt zustand auf 'ok'), ist es ein
 * voellig legitimer Kandidat.
 */
export function waehlbareAssets(
  assets: readonly Asset[],
  typ: 'video' | 'bild',
): Asset[] {
  return assets.filter((asset) => asset.zustand === 'ok' && asset.typ === typ)
}
