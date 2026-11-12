// [contracts] Produktfoto-Abruf: Request, Kandidat, Ergebnis, Grenzen (FA-27 / TK 9.19)

// WARUM DIESE TYPEN GETEILT SIND: Der Renderer zeigt die Kandidaten, der Main laedt sie.
// Beide Seiten muessen dieselbe Form kennen; die Bytes selbst reisen NIE ueber IPC
// (TK 9.19.2) - der Renderer bekommt Adresse, Typ und Groesse, nicht das Bild.

/**
 * Die harten Grenzen des Abrufs (TK 9.19.4). EINE Stelle - Main, Renderer und Tests
 * lesen dieselben Zahlen; ein zweites Zahlenpaar waere die Abweichung, die niemand merkt.
 */
export const PRODUKTFOTO_GRENZEN = {
  /** Hoechstens so viele Kandidaten werden gesammelt und angezeigt (TK 9.19.3). */
  maxKandidaten: 5,
  /** Hoechstens so viele Bytes je Bild (TK 9.19.4). */
  maxBildBytes: 8 * 1024 * 1024,
  /** Hoechstens so viele Bytes ueber alle Kandidaten eines Abrufs. */
  maxGesamtBytes: 20 * 1024 * 1024,
  /** Gesamtzeit fuer Seite UND Bilder eines Abrufs (TK 9.19.4). */
  zeitgrenzeMs: 15_000,
  /** Hoechstens so viele Weiterleitungen, jede erneut geprueft (TK 9.19.4). */
  maxWeiterleitungen: 3,
  /** Kandidaten im Speicher des Main verfallen nach dieser Zeit (TK 9.19.2). */
  verfallMs: 10 * 60 * 1000,
} as const

/** Die Nutzlast des Auftrags `produktfoto-abruf` (TK 9.19.2). */
export interface ProduktfotoAbrufRequest {
  projektId: string
  aktionId: string
  produktUrl: string
}

/**
 * Ein Kandidat, wie ihn der Renderer zur Auswahl bekommt.
 *
 * KEINE Bildbytes: „Der Abruf liefert **keine** Bilder ueber IPC" (Issue #470).
 * `groesse` ist die Groesse der geladenen Bytes; `breite`/`hoehe` stehen bewusst NICHT
 * hier - die Maße ermittelt beim Uebernehmen `ffprobe`, die EINE Quelle (TK 9.4.8).
 */
export interface ProduktfotoKandidat {
  /** 0-basierter Index in der Kandidatenliste; Eingang von `produkt:waehlen`. */
  index: number
  /** Absolute, normalisierte Bildadresse (http/https, ohne Fragment). */
  url: string
  /** Der `Content-Type` der Antwort, z. B. `image/jpeg` (das Format entscheidet er, nicht die Endung). */
  typ: string
  /** Groesse der geladenen Bytes. */
  groesse: number
}

/** Das Ergebnis eines erfolgreichen Abrufs - reist im Feld `Auftrag.ergebnis`. */
export interface ProduktfotoAbrufErgebnis {
  /** Kennung des Speichers im Main; Eingang fuer `produkt:waehlen` und `produkt:verwerfen`. */
  abrufId: string
  kandidaten: ProduktfotoKandidat[]
}

/** Eingang von `produkt:waehlen` (Issue #470, Signaturblock 4). */
export interface ProduktWahlRequest {
  abrufId: string
  kandidat: number
}

/** Ausgang von `produkt:waehlen`: die neue Asset-ID und der Wert fuer `Aktion.bildRef`. */
export interface ProduktWahlErgebnis {
  assetId: string
  bildRef: string
}
