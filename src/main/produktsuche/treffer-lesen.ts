// [produktsuche] Treffer aus einer Suchseite lesen (FA-30 / TK 9.20.2)
//
// REIN UND OHNE NETZ: Diese Datei bekommt HTML-Text und die Seitenadresse und liefert
// Treffer. Dadurch ist jeder Fall ohne Server pruefbar.
//
// ES WIRD KEIN MARKUP EINES ANBIETERS ANGENOMMEN: Gelesen werden ANKER - mehr gibt eine
// fremde Suchseite nicht her, ohne dass man ihr privates HTML nachbaut. Genau deshalb ist
// der Notweg fragil (9.20.6), und genau deshalb steht in der Oberflaeche „kann ausfallen".
// Kein HTML-Rendern, kein JavaScript (9.20.4).

import { entschluessleEntities, htmlAttribute } from '../gemeinsam/html'

import type { ProduktSeiteTreffer } from '../../shared/contracts/produktsuche'

/** Laenger wird keine Beschriftung angezeigt - der Rest ist abgeschnitten. */
const TITEL_MAX = 120

/** `<a …>…</a>` - der Inhalt darf Zeilenumbrueche enthalten (verschachtelte Marken). */
const ANKER = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi

/** Macht aus dem Inhalt eines Ankers eine einzeilige Beschriftung. */
function beschriftung(inhalt: string): string {
  const ohneMarken = inhalt.replace(/<[^>]*>/g, ' ')
  const text = entschluessleEntities(ohneMarken).replace(/\s+/g, ' ').trim()
  return text.length > TITEL_MAX ? `${text.slice(0, TITEL_MAX - 1)}…` : text
}

/**
 * Die Adresse eines Ankers, absolut und ohne Fragment.
 *
 * Relativ ist erlaubt (viele Shops schreiben `/produkt/42`); `new URL(wert, seitenUrl)`
 * loest gegen die NACH Weiterleitungen gueltige Adresse auf. `javascript:`, `mailto:` und
 * `data:` fallen weg, weil nur http(s) eine Produktseite sein kann (9.19.4).
 */
function zielAdresse(roh: string, seitenUrl: string): URL | null {
  const wert = entschluessleEntities(roh).trim()
  if (wert.length === 0 || wert.startsWith('#')) return null
  let adresse: URL
  try {
    adresse = new URL(wert, seitenUrl)
  } catch {
    return null
  }
  if (adresse.protocol !== 'http:' && adresse.protocol !== 'https:') return null
  adresse.hash = ''
  return adresse
}

/** Die letzte Stufe der Beschriftung: der Pfad selbst, wenn der Anker keinen Text traegt. */
function pfadName(adresse: URL): string {
  const teile = adresse.pathname.split('/').filter((teil) => teil.length > 0)
  const letzte = teile[teile.length - 1] ?? ''
  return letzte.length > 0 ? decodeURIComponent(letzte) : adresse.hostname
}

/**
 * Alle Treffer einer Suchseite, in der Reihenfolge ihres Auftretens.
 *
 * DREI REGELN, die eine Trefferliste von einer Navigation unterscheiden - alle generisch,
 * keine auf einen Anbieter zugeschnitten:
 *   1. Die Startseite eines Hosts ist keine Produktseite. Ein Anker auf `/` faellt weg;
 *      ohne die Regel fuellten „Impressum", „Startseite" und das Logo die fuenf Plaetze.
 *   2. Ein Anker ohne Text ist trotzdem brauchbar (Bild-Links): Dann gilt das
 *      `title`-Attribut, ersatzweise der letzte Pfadteil.
 *   3. Duplikate werden ueber die NORMALISIERTE Adresse entfernt (9.20.4).
 *
 * Die Obergrenze (hoechstens 5) setzt der Auftrag - hier steht nur, was die Seite hergibt.
 */
export function findeTreffer(html: string, seitenUrl: string): ProduktSeiteTreffer[] {
  const ergebnis: ProduktSeiteTreffer[] = []
  const gesehen = new Set<string>()

  for (const treffer of html.matchAll(ANKER)) {
    const attribute = htmlAttribute(treffer[1] ?? '')
    const href = attribute.get('href')
    if (href === undefined) continue

    const adresse = zielAdresse(href, seitenUrl)
    if (adresse === null) continue
    // Der Anker auf die Suchseite selbst („Seite 2" derselben Suche) ist kein Produkt.
    if (adresse.href === new URL(seitenUrl).href) continue

    const pfad = adresse.pathname
    // Die Startseite eines Hosts ist keine Produktseite (Regel 1).
    if (pfad === '/' || pfad === '') continue

    let titel = beschriftung(treffer[2] ?? '')
    if (titel.length === 0) titel = beschriftung(attribute.get('title') ?? '')
    if (titel.length === 0) titel = pfadName(adresse)

    const schluessel = adresse.href
    if (gesehen.has(schluessel)) continue
    gesehen.add(schluessel)

    ergebnis.push({ url: schluessel, titel, host: adresse.hostname })
  }

  return ergebnis
}
