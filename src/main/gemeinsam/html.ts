// [gemeinsam] HTML-Attribute und die kleinen Entities lesen
//
// ZWEI LESER BRAUCHEN DIESELBE ZERLEGUNG: der Produktfoto-Abruf (#470, TK 9.19.3) und die
// Produktseiten-Suche (#472, TK 9.20). Eine zweite Kopie waere genau die Stelle, an der ein
// Attribut in Anfuehrungszeichen beim einen gelesen wird und beim anderen nicht - und der
// Unterschied faellt erst an einer fremden Seite auf.
//
// KEIN HTML-RENDERN UND KEIN JAVASCRIPT: Gelesen wird der ausgelieferte Text.

/** Attribut-Werte einer HTML-Marke, klein geschrieben als Schluessel. */
export function htmlAttribute(marke: string): Map<string, string> {
  const werte = new Map<string, string>()
  const muster = /([a-zA-Z_:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  for (const treffer of marke.matchAll(muster)) {
    const name = (treffer[1] ?? '').toLowerCase()
    const wert = treffer[2] ?? treffer[3] ?? treffer[4] ?? ''
    if (name.length > 0) werte.set(name, wert)
  }
  return werte
}

/** Die kleinen Entities, die in Attributen und Linktexten real vorkommen. */
export function entschluessleEntities(text: string): string {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ')
}
