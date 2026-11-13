// [contracts] ProduktQuellen normalisieren (FA-30 / TK 9.20.3)

// DIE EINE AUSLEGUNG VON `AppKonfig.produktQuellen`. Gelesen von `lese-konfig` (Main) und
// vom Aktions-Editor (er sagt VOR dem Klick, ob ueberhaupt eine Quelle hinterlegt ist).
// Zwei eigene Kopien liefen unweigerlich auseinander - dieselbe Begruendung wie bei
// `normalisiereProduktUrl` (#470).

import { PRODUKTSUCHE_GRENZEN } from './contracts/produktsuche'

import type { ProduktQuellen, ProduktQuelleShop } from './contracts/produktsuche'

/** Der Standard ohne Feld: keine Shops, kein Notweg (TK 9.20.3). Keine Config-Migration. */
function ohneQuellen(): ProduktQuellen {
  return { shops: [], webSuche: null }
}

/**
 * Ein Suchmuster: absolute `http`/`https`-Adresse mit **genau einem** `{q}`.
 *
 * Geprueft wird die Adresse MIT eingesetztem Platzhalter - ein Muster, das erst nach dem
 * Einsetzen unlesbar wird, waere keine Konfiguration, sondern eine Falle. Der Platzhalter
 * selbst darf ueberall stehen (Pfad oder Abfrage); er wird beim Suchen mit
 * `encodeURIComponent` gefuellt, damit das Stichwort die Adresse nicht umbaut.
 *
 * `null` heisst "unbrauchbar" - der Eintrag faellt beim Lesen weg, kein Absturz
 * (dieselbe Haltung wie `normalisiereProduktUrl`, 9.19.7).
 */
export function normalisiereSuchMuster(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const getrimmt = wert.trim()
  if (getrimmt.length === 0) return null
  // GENAU EIN Platzhalter: `split` liefert bei einem Vorkommen zwei Teile. Zwei `{q}`
  // waeren mehrdeutig (welches wird gefuellt?), keines waere eine feste Adresse - beides
  // ist keine Suche.
  if (getrimmt.split('{q}').length !== 2) return null
  try {
    const adresse = new URL(getrimmt.replace('{q}', 'q'))
    if (adresse.protocol !== 'http:' && adresse.protocol !== 'https:') return null
  } catch {
    return null
  }
  return getrimmt
}

/**
 * Der Host eines Musters, klein und ohne Port - der Vergleichswert fuer `ProduktQuelleShop.host`.
 *
 * `hostname` und nicht `host`: Ein Port (`:8080`) gehoert nicht in die Anzeige, und ein
 * Shop auf Port 80/443 traegt ihn ohnehin nicht.
 */
function hostAusMuster(muster: string): string {
  const adresse = new URL(muster.replace('{q}', 'q'))
  return adresse.hostname.toLowerCase()
}

/**
 * Ein Anzeige-Host: getrimmt, ohne Schema, ohne Pfad, ohne Port, klein.
 *
 * WARUM SO FREUNDLICH: Wer den Host aus der Adresszeile kopiert, hat `https://shop.de/`
 * in der Hand und nicht `shop.de`. Daran darf sein Eintrag nicht scheitern - der Host ist
 * Anzeige, kein Pfadanteil, und wird gleich danach ohnehin gegen das Muster geprueft.
 */
function normalisiereHost(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  let text = wert.trim().toLowerCase()
  if (text.length === 0) return null
  text = text.replace(/^https?:\/\//, '')
  const schraeg = text.indexOf('/')
  if (schraeg !== -1) text = text.slice(0, schraeg)
  // Port nur abschneiden, wenn er nicht zu einer IPv6-Adresse in eckigen Klammern gehoert.
  if (!text.startsWith('[')) text = text.replace(/:\d+$/, '')
  return text.length === 0 ? null : text
}

/**
 * Liest `AppKonfig.produktQuellen` und laesst alles weg, was nicht traegt (TK 9.20.3).
 *
 * DER HOST WIRD GEGEN DAS MUSTER GEPRUEFT, und ein Widerspruch wirft den Eintrag weg:
 * 9.20.3 nennt ihn ausdruecklich einen "Pruefwert". Zeigte die Anzeige auf einen anderen
 * Host als die Adresse, waere sie eine Luege ueber das Ziel der Suche - und der Nutzer
 * wuerde den Fehler erst im Protokoll sehen. Was nicht zusammenpasst, ist kein Shop.
 *
 * Hoechstens acht Eintraege (9.20.3). Mehr als drei werden nie befragt; der Rest ist
 * Vorrat, und der Vorrat darf nicht unbegrenzt wachsen.
 */
export function normalisiereProduktQuellen(wert: unknown): ProduktQuellen {
  if (typeof wert !== 'object' || wert === null || Array.isArray(wert)) return ohneQuellen()
  // SAFETY: Die Zeile davor belegt ein nicht-null, nicht-Array Objekt; der Cast macht die
  // Index-Form sichtbar, und jedes Feld wird darunter einzeln geprueft.
  const roh = wert as Record<string, unknown>

  const shops: ProduktQuelleShop[] = []
  const liste = roh['shops']
  if (Array.isArray(liste)) {
    for (const eintrag of liste) {
      if (shops.length >= PRODUKTSUCHE_GRENZEN.maxShopEintraege) break
      if (typeof eintrag !== 'object' || eintrag === null || Array.isArray(eintrag)) continue
      // SAFETY: wie oben - geprueft ist die Objektform, die Felder werden einzeln geprueft.
      const shop = eintrag as Record<string, unknown>
      const suchMuster = normalisiereSuchMuster(shop['suchMuster'])
      if (suchMuster === null) continue
      const host = normalisiereHost(shop['host'])
      if (host === null) continue
      if (host !== hostAusMuster(suchMuster)) continue
      shops.push({ host, suchMuster })
    }
  }

  return { shops, webSuche: normalisiereSuchMuster(roh['webSuche']) }
}
