// [contracts] Produktseiten-Suche: Quellen, Treffer, Grenzen (FA-30 / TK 9.20)

// WARUM DIESE TYPEN GETEILT SIND: Die Quellen stehen in `config.json` (9.20.3) und werden
// von Main UND Editor gelesen (der Editor sagt VOR dem Klick, ob ueberhaupt eine Quelle
// hinterlegt ist). Die Treffer reisen im Feld `Auftrag.ergebnis` (9.20, Signaturblock 3) -
// es sind Zeichenketten, keine Bytes, deshalb gibt es hier KEINEN zweiten Speicher im Main.

/**
 * Die harten Grenzen der Suche (TK 9.20.4). EINE Stelle - Main, Renderer und Tests lesen
 * dieselben Zahlen; ein zweites Zahlenpaar waere die Abweichung, die niemand merkt.
 *
 * `maxSeiteBytes` steht NICHT woertlich in 9.20.4; dort steht "Zeit- und Groessenlimits"
 * aus 9.19.4, und die dortigen Zahlen (8 MB je Bild, 20 MB gesamt) sind fuer BILDER
 * gedacht. Eine Suchseite ist HTML - 2 MB sind reichlich und begrenzen denselben Angriff
 * (eine Antwort, die den Speicher fuellt), ohne eine echte Seite abzuschneiden.
 */
export const PRODUKTSUCHE_GRENZEN = {
  /** Hoechstens so viele Treffer werden angeboten (TK 9.20.4). */
  maxTreffer: 5,
  /** Hoechstens so viele Shops werden befragt - die ersten der Liste (TK 9.20.4). */
  maxShops: 3,
  /** Hoechstens so viele Shops stehen in der Konfiguration; der Rest ist Vorrat (9.20.3). */
  maxShopEintraege: 8,
  /** Gesamtzeit fuer den gesamten Suchschritt (TK 9.20.4). */
  zeitgrenzeMs: 20_000,
  /** Hoechstens so viele Bytes je Suchseite (abgeleitet aus 9.19.4, s. oben). */
  maxSeiteBytes: 2 * 1024 * 1024,
} as const

/**
 * Ein hinterlegter Shop (TK 9.20.3).
 *
 * `host` ist NUR Anzeige und Pruefwert, kein Pfadanteil: Die Suchadresse steht vollstaendig
 * in `suchMuster`, damit kein Code eine Vorlage wie `<host>/search?s={q}` raten muss - die
 * trifft keinen echten Shop (Entscheidung 13.11.2026).
 */
export interface ProduktQuelleShop {
  /** Host des Shops - nur Anzeige und Pruefwert, kein Pfadanteil. */
  host: string
  /** Suchadresse des Shops; `{q}` wird durch das kodierte Stichwort ersetzt. */
  suchMuster: string
}

/** Die app-weite Konfiguration der Suche (TK 9.20.3, Feld `AppKonfig.produktQuellen`). */
export interface ProduktQuellen {
  /** Shops in Prioritaetsreihenfolge; hoechstens drei werden befragt (9.20.4). */
  shops: ProduktQuelleShop[]
  /** Notweg: Suchadresse einer allgemeinen Websuche, `{q}` = Stichwort. `null` = kein Notweg. */
  webSuche: string | null
}

/**
 * Eine gefundene Produktseite, wie sie der Editor zur Auswahl bekommt.
 *
 * KEIN Preis, kein Bild, keine Kennung: Die Suche findet eine ADRESSE; alles Weitere ist
 * 9.19 (Holen) und beginnt erst mit dem naechsten ausdruecklichen Klick (AD 4.14).
 */
export interface ProduktSeiteTreffer {
  /** Absolute http(s)-Adresse der Produktseite. */
  url: string
  /** Linktext bzw. `<title>` des Treffers, gekuerzt. */
  titel: string
  /** Anzeige, z. B. "best-body-shop.de". */
  host: string
}

/** Die Nutzlast des Auftrags `produktseite-suche` (TK 9.20, Signaturblock 3). */
export interface ProduktsucheRequest {
  projektId: string
  /** DARF LEER SEIN: im Modus „neu" gibt es die Aktion noch nicht. */
  aktionId: string
  /** Getrimmt, nicht leer. */
  stichwort: string
}

/** Das Ergebnis eines erfolgreichen Suchauftrags - reist im Feld `Auftrag.ergebnis`. */
export interface ProduktsucheErgebnis {
  /** Hoechstens fuenf; Duplikate sind ueber die normalisierte Adresse entfernt. */
  treffer: ProduktSeiteTreffer[]
}
