// Die vier Modus-Reiter der Anwendung (#10, TK 9.14.1).
//
// Reihenfolge und Beschriftung sind aus TK 9.14.1 uebernommen:
//   [Zusammenstellen] [Aktionen] [Vorlagen] [Projekte]
// Sie sind hier NICHT frei waehlbar - der gefuehrte Reparatur-Modus wechselt spaeter
// gezielt in den Reiter "Aktionen" und kehrt danach nach "Zusammenstellen" zurueck
// (TK 9.14.2), und die Startregel "ohne offenes Projekt landet der Nutzer im Reiter
// Projekte" bezieht sich ebenfalls auf diese Kennungen.

export type ReiterId = "zusammenstellen" | "aktionen" | "vorlagen" | "projekte";

/**
 * Reiter in Anzeigereihenfolge.
 *
 * Bewusst eine Liste und kein Objekt: Die Reihenfolge ist Teil der Festlegung, und
 * die Eigenschaftsreihenfolge eines Objekts ist kein Vertrag, auf den man sich
 * stuetzen sollte.
 */
export const REITER: ReadonlyArray<{ id: ReiterId; beschriftung: string }> = [
  { id: "zusammenstellen", beschriftung: "Zusammenstellen" },
  { id: "aktionen", beschriftung: "Aktionen" },
  { id: "vorlagen", beschriftung: "Vorlagen" },
  { id: "projekte", beschriftung: "Projekte" },
];
