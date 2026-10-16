// [contracts] Projektweite Konstanten definieren

export const STANDARD_ANZEIGEDAUER_SEKUNDEN = 10
export const DAUER_BEREICH = { min: 10, max: 45 } as const
export const SICHERHEITSABSTAND_PX = { horizontal: 96, vertikal: 54 } as const

/** Erlaubte Spanne beim Bearbeiten von `Marke.sicherheit` (TK 9.11.4, v3.8). Obergrenze = ein
 *  Viertel der Kante; 0 ist erlaubt (warnen statt sperren, Risiko R-08). Gelesen von bearbeiteMarke
 *  im Main (#285) UND vom marken-editor (#308) – dieselbe Konstante, nie ein zweites Zahlenpaar. */
export const SICHERHEITSABSTAND_BEREICH = {
  horizontal: { min: 0, max: 480 },
  vertikal:   { min: 0, max: 270 },
} as const

/** Mindest-Kontrastverhaeltnis zwischen Akzentflaeche und darauf liegendem Text (TK 9.11.4/9.15.2,
 *  v3.10): WCAG AA fuer Fliesstext. WARNUNG, KEINE SPERRE - die Restverantwortung bleibt beim
 *  Nutzer (FA-24, Risiko R-08). Gelesen vom marken-editor (#301) und dort als `schwellenwert` an
 *  erreichtKontrastSchwelle (#292) uebergeben - die Zahl steht an genau EINER Stelle. */
export const KONTRAST_SCHWELLE = 4.5

// Die Schema-Version, auf die `project.json` und `config.json` beim Schreiben gebracht werden.
// EINE zentrale Stelle – sie wird von öffneProjekt (#34), schreibeProjekt (#46) und
// migriereProjekt (#48) gelesen; drei eigene Kopien würden unweigerlich auseinanderlaufen.
export const AKTUELLE_SCHEMA_VERSION = 1
// „Aktuelle schemaVersion | 1 | wird von öffneProjekt, schreibeProjekt und der Migration
//  gelesen (9.5.5) – eine Stelle, sonst laufen drei Kopien auseinander" (TK 9.11.4, wörtlich)
export { FORMAT_WHITELIST } from './asset' // Re-Export aus #13 – hier NICHT dupliziert
