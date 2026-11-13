// [produktsuche] Eine Suchadresse bauen und eine Suchseite auswerten (FA-30 / TK 9.20)
//
// EINE NETZSCHICHT: `hole()` aus dem Produktfoto-Abruf wird WIEDERVERWENDET - geprüfte
// aufgeloeste Adresse, keine lokalen Netze, hoechstens drei Weiterleitungen, Zeitgrenze
// (9.19.4). Diese Datei bringt KEINE zweite Netzimplementierung mit; wer eine braucht,
// aendert 9.19.4, nicht dieses Modul.
//
// EINE ADRESSBILDUNG: `baueSuchadresse` ist die einzige Stelle, an der aus einem Muster und
// einem Stichwort eine Adresse wird. Kein `<host>/search?s={q}` im Code - was der Shop
// nicht kann, steht auch nicht in der Konfiguration (Entscheidung 13.11.2026, 9.20.3).

import { PRODUKTSUCHE_GRENZEN } from '../../shared/contracts/produktsuche'
import { hole } from '../produktfoto/netz'
import { findeTreffer } from './treffer-lesen'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProduktSeiteTreffer } from '../../shared/contracts/produktsuche'
import type { NetzFehlercode } from '../produktfoto/netz'

/** Die Fehlergruende einer Suchseite. Die Klartexte dazu entstehen im Auftrag. */
export type SuchseitenFehlercode = NetzFehlercode | 'keine_seite'

/**
 * Baut die Suchadresse aus einem Muster und dem Stichwort.
 *
 * `{q}` wird mit `encodeURIComponent` gefuellt: Das Stichwort ist Nutzereingabe und darf
 * die Adresse nicht umbauen - ein `&` im Titel wuerde sonst aus einem Parameter zwei
 * machen. `null` heisst "so laesst sich keine Adresse bauen"; der Aufrufer ueberspringt
 * die Quelle und meldet es, statt zu werfen.
 *
 * Die Pruefung des Musters steht hier NOCH EINMAL, obwohl `normalisiereSuchMuster` sie
 * beim Lesen schon macht: Diese Funktion ist der Ort, an dem die Adresse ENTSTEHT, und sie
 * wird auch von Tests ohne Konfiguration gerufen. Zwei Pruefungen derselben Zusage sind
 * hier kein Widerspruch - die eine haelt den Bestand sauber, die andere den Aufruf.
 */
export function baueSuchadresse(muster: string, stichwort: string): string | null {
  const begriff = stichwort.trim()
  if (begriff.length === 0) return null
  const teile = muster.split('{q}')
  if (teile.length !== 2) return null

  const roh = `${teile[0] ?? ''}${encodeURIComponent(begriff)}${teile[1] ?? ''}`
  try {
    const adresse = new URL(roh)
    if (adresse.protocol !== 'http:' && adresse.protocol !== 'https:') return null
    return adresse.href
  } catch {
    return null
  }
}

/**
 * Fragt EINE Suchseite ab und liest ihre Treffer.
 *
 * Der Ablauf ist derselbe wie beim Produktfoto-Abruf (9.19): laden, Status pruefen, auf
 * HTML bestehen, lesen. Fehlschlaege enden als `Ergebnis`, nie als Ausnahme - die
 * Suchseite eines Fremden ist kein Teil dieses Programms.
 */
export async function sucheMitMuster(
  muster: string,
  stichwort: string,
  bis: number,
): Promise<Ergebnis<ProduktSeiteTreffer[], SuchseitenFehlercode>> {
  const adresse = baueSuchadresse(muster, stichwort)
  if (adresse === null) {
    return { ok: false, fehler: { code: 'format', meldung: 'format' } }
  }

  const antwort = await hole(new URL(adresse), PRODUKTSUCHE_GRENZEN.maxSeiteBytes, bis)
  if (!antwort.ok) {
    return { ok: false, fehler: { code: antwort.fehler.code, meldung: antwort.fehler.meldung } }
  }
  if (antwort.wert.status < 200 || antwort.wert.status >= 300) {
    return {
      ok: false,
      fehler: { code: 'http_fehler', meldung: 'http_fehler', daten: { status: antwort.wert.status } },
    }
  }
  if (!istHtml(antwort.wert.contentType)) {
    return { ok: false, fehler: { code: 'keine_seite', meldung: 'keine_seite' } }
  }

  // Relative Anker werden gegen die NACH Weiterleitungen gueltige Adresse aufgeloest -
  // nicht gegen die eingetippte Suchadresse.
  const html = antwort.wert.bytes.toString('utf8')
  return { ok: true, wert: findeTreffer(html, antwort.wert.url) }
}

/** Ist die Antwort eine Suchseite? Leerer Content-Type gilt als "nicht entscheidbar". */
function istHtml(contentType: string): boolean {
  const typ = contentType.split(';')[0]?.trim().toLowerCase() ?? ''
  return (
    typ === '' ||
    typ === 'text/html' ||
    typ === 'application/xhtml+xml' ||
    typ === 'text/xml' ||
    typ === 'application/xml'
  )
}
