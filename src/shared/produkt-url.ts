// [contracts] Produkt-URL normalisieren (FA-27 / TK 9.19.7)

/**
 * Die EINE Auslegung von `Aktion.produktUrl` (TK 9.19.7, 12.11.2026).
 *
 * „Normalisierung: getrimmt; nur `http`/`https`; alles andere → `null`."
 *
 * Gelesen von `erstelle-aktion`, `bearbeite-aktion` und dem Aktions-Editor. Drei eigene
 * Kopien würden unweigerlich auseinanderlaufen – dieselbe Begründung wie bei
 * `AKTUELLE_SCHEMA_VERSION`.
 *
 * WAS HIER NICHT PASSIERT: keine Netzprüfung (kein DNS, kein Abruf) und keine
 * Erreichbarkeitsprüfung. Das ist Sache des Auftrags (9.19.4), nicht der Feldnormalisierung.
 * Die Rückgabe ist der GETRIMMTE Text, nicht `URL.href`: Eine vom Nutzer eingetragene
 * Adresse soll so gespeichert werden, wie sie dasteht – nur ohne Randleerzeichen.
 */
export function normalisiereProduktUrl(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const getrimmt = wert.trim()
  if (getrimmt.length === 0) return null
  try {
    const adresse = new URL(getrimmt)
    if (adresse.protocol !== 'http:' && adresse.protocol !== 'https:') return null
  } catch {
    // Kein absoluter URL – `new URL` wirft. Der Feldwert bleibt damit `null`, das Feld
    // ist optional und "keine Adresse" ein zugesagter Zustand (9.19.7).
    return null
  }
  return getrimmt
}
