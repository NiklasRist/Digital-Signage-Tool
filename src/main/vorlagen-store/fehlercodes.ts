// [vorlagen-store] Fehlercode-Union des Moduls definieren

/**
 * Fachliche Fehlercodes des vorlagen-store (TK 9.12.1).
 *
 * Die drei generischen Codes (ungueltige_eingabe, nicht_gefunden, unbekannter_fehler) stehen hier
 * BEWUSST NICHT – sie kommen ueber den zweiten Typparameter von Ergebnis (#22) automatisch dazu.
 * Eine Wiederholung erzeugte zwei Quellen fuer denselben Wert.
 */
export type VorlagenFehlercode =
  | 'vorlage_referenziert'
  | 'parent_eingebaut'
  | 'speicher_fehler'
