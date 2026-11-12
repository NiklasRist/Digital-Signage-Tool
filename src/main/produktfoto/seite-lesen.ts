// [produktfoto] Produktseite lesen: Bildadressen aus JSON-LD und og:image (FA-27 / TK 9.19.3)
//
// REIN UND OHNE NETZ: Diese Datei bekommt HTML-Text und die Seitenadresse und liefert
// Adressen. Dadurch ist jeder Fall ohne Server pruefbar - und die Reihenfolge der Quellen
// ist an genau einer Stelle festgelegt:
//   1. strukturierte Produktdaten: `<script type="application/ld+json">` mit `@type: "Product"`
//      (auch innerhalb eines `@graph`-Arrays),
//   2. ersatzweise `og:image` / `og:image:secure_url`.
//
// KEIN HTML-Rendern und kein JavaScript (TK 9.19.4): Gelesen wird der ausgelieferte Text.

/** Attribut-Werte einer HTML-Marke, klein geschrieben als Schluessel. */
function attribute(marke: string): Map<string, string> {
  const werte = new Map<string, string>()
  const muster = /([a-zA-Z_:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  for (const treffer of marke.matchAll(muster)) {
    const name = (treffer[1] ?? '').toLowerCase()
    const wert = treffer[2] ?? treffer[3] ?? treffer[4] ?? ''
    if (name.length > 0) werte.set(name, wert)
  }
  return werte
}

/** Die kleinen Entities, die in `content`-Attributen real vorkommen. */
function entschluessle(text: string): string {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

/**
 * Loest eine Angabe gegen die Seitenadresse auf und laesst nur absolute http(s)-Ziele
 * ohne Fragment stehen. `data:`, `blob:`, `file:` und relative Reste fallen weg.
 */
export function normalisiereBildAdresse(roh: string, seitenUrl: string): string | null {
  const wert = entschluessle(roh).trim()
  if (wert.length === 0) return null
  let adresse: URL
  try {
    adresse = new URL(wert, seitenUrl)
  } catch {
    return null
  }
  if (adresse.protocol !== 'http:' && adresse.protocol !== 'https:') return null
  adresse.hash = ''
  return adresse.href
}

/** Ein `image`-Wert laut TK: string, string[], ImageObject oder ImageObject[]. */
function bilderAusWert(wert: unknown): string[] {
  if (typeof wert === 'string') return [wert]
  if (Array.isArray(wert)) return wert.flatMap((eintrag) => bilderAusWert(eintrag))
  if (typeof wert === 'object' && wert !== null && !Array.isArray(wert)) {
    // SAFETY: Die Zeile davor belegt ein nicht-null, nicht-Array Objekt; der Cast macht
    // die Felder lesbar, die Zugriffe darunter pruefen ihren Typ.
    const objekt = wert as Record<string, unknown>
    const url = objekt['url'] ?? objekt['contentUrl'] ?? objekt['@id']
    return typeof url === 'string' ? [url] : []
  }
  return []
}

/** Alle `Product`-Objekte in einem JSON-LD-Baum - in Dokumentreihenfolge. */
function findeProdukte(wert: unknown, gefunden: Array<Record<string, unknown>>): void {
  if (Array.isArray(wert)) {
    for (const eintrag of wert) findeProdukte(eintrag, gefunden)
    return
  }
  if (typeof wert !== 'object' || wert === null) return

  // SAFETY: Die Zeilen davor belegen ein nicht-null Nicht-Array-Objekt; der Cast macht
  // `@type` und die Kinder lesbar, ohne einen Wert zu veraendern.
  const objekt = wert as Record<string, unknown>
  const typ = objekt['@type']
  const istProdukt =
    typ === 'Product' || (Array.isArray(typ) && typ.some((eintrag) => eintrag === 'Product'))
  if (istProdukt) gefunden.push(objekt)

  for (const [schluessel, kind] of Object.entries(objekt)) {
    // `image` wird nur dann gelesen, wenn das Objekt selbst ein Product ist - sonst
    // zoege ein verschachteltes Bild eines anderen Typs Kandidaten ein, die nicht zur
    // Produktzusage gehoeren.
    if (schluessel === 'image') continue
    findeProdukte(kind, gefunden)
  }
}

function bilderAusJsonLd(html: string): string[] {
  const bilder: string[] = []
  const skripte = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  for (const treffer of html.matchAll(skripte)) {
    const inhalt = treffer[1] ?? ''
    let daten: unknown
    try {
      daten = JSON.parse(inhalt)
    } catch {
      // Ein kaputter JSON-LD-Block ist kein Grund, die Seite aufzugeben: Ein zweiter
      // Block kann die Daten tragen, und `og:image` bleibt als Rueckfall.
      continue
    }
    const produkte: Array<Record<string, unknown>> = []
    findeProdukte(daten, produkte)
    for (const produkt of produkte) {
      bilder.push(...bilderAusWert(produkt['image']))
    }
  }
  return bilder
}

function ogBilder(html: string): string[] {
  const secure: string[] = []
  const gewoehnlich: string[] = []
  for (const treffer of html.matchAll(/<meta\b[^>]*>/gi)) {
    const marke = treffer[0] ?? ''
    const werte = attribute(marke)
    const schluessel = (werte.get('property') ?? werte.get('name') ?? '').toLowerCase()
    const inhalt = werte.get('content')
    if (inhalt === undefined || inhalt.length === 0) continue
    if (schluessel === 'og:image:secure_url') secure.push(inhalt)
    else if (schluessel === 'og:image') gewoehnlich.push(inhalt)
  }
  // `secure_url` zuerst - sie ist die vom Anbieter bevorzugte, verschluesselte Variante.
  return [...secure, ...gewoehnlich]
}

/**
 * Die Kandidaten einer Produktseite, in der Reihenfolge ihres Auftretens.
 *
 * Duplikate werden ueber die NORMALISIERTE absolute Adresse entfernt (TK 9.19.3).
 * Die Obergrenze (hoechstens 5) setzt der Abruf - hier steht nur, was die Seite hergibt.
 */
export function findeBildAdressen(html: string, seitenUrl: string): string[] {
  const roh = bilderAusJsonLd(html)
  // `og:image` NUR als Rueckfall: "wenn keine strukturierten Daten da sind" (9.19.3).
  const quellen = roh.length > 0 ? roh : ogBilder(html)

  const gesehen = new Set<string>()
  const ergebnis: string[] = []
  for (const eintrag of quellen) {
    const adresse = normalisiereBildAdresse(eintrag, seitenUrl)
    if (adresse === null || gesehen.has(adresse)) continue
    gesehen.add(adresse)
    ergebnis.push(adresse)
  }
  return ergebnis
}
