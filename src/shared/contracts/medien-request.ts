// [contracts] Typen ImportRequest und LöschRequest definieren

/** Nutzlast des Auftrags art: 'import' (TK 9.4.3). */
export interface ImportRequest {
  projektId: string
  quellPfad: string
}

/** Nutzlast des Auftrags art: 'loeschen' (TK 9.4.3). */
export interface LöschRequest {
  projektId: string
  assetId: string
}
