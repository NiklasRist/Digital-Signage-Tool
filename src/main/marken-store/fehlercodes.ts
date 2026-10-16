// [marken-store] Fehlercode-Union des Moduls definieren

/**
 * Fachliche Fehlercodes des marken-store (TK 9.15.5).
 *
 * `ungueltige_eingabe` steht hier BEWUSST NICHT: Sie kommt über den zweiten Typparameter von
 * Ergebnis (#12/#22) automatisch dazu, ebenso `nicht_gefunden` und `unbekannter_fehler`. TK 9.15.5
 * fuehrt sie in der GLEICHEN Tabelle wie die vier folgenden Codes auf, aber das Modul definiert
 * ausdruecklich eine EIGENE, fachlich schaerfere Variante von "nicht gefunden"
 * (marke_nicht_gefunden statt des generischen nicht_gefunden) - beide existieren nebeneinander,
 * s. Invarianten. Eine Wiederholung der drei generischen Codes hier erzeugte zwei Quellen fuer
 * denselben Wert.
 */
export type MarkenFehlercode =
  | 'marke_referenziert'
  | 'marke_eingebaut'
  | 'marke_nicht_gefunden'
  | 'marken_datei_fehlt'
  | 'speicher_fehler'
