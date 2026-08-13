// GENERIERT aus dem Signaturblock von Issue #79.
// [media-service] Fehlercode-Unionen des Moduls definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 1a46f21a96f02d1f

// ZU `kein_projekt` IN ALLEN DREI UNIONEN (nachgetragen am 13.08.2026, Issue-Nachtrag zu #79):
//
// Der `project-store` hat an diesem Tag den Code `kein_projekt` bekommen — „es ist überhaupt
// kein Projekt geöffnet" war vorher von „das genannte Projekt ist nicht das geöffnete" nicht zu
// unterscheiden, was den geführten Reparatur-Modus (FA-19) blind machte. Aus dem `media-service`
// führen DREI Wege dorthin, und jeder sagt zu, den Fehler UNVERÄNDERT durchzureichen:
//
//   fuegeAssetHinzu   (#72) → importMedium     (#85) → ImportFehlercode
//   entferneAsset     (#73) → löscheMedium     (#87) → LoeschFehlercode
//   setzeAssetZustand (#74) → markiereFehlende (#89) → ReconcileFehlercode
//
// Ohne den Eintrag fällt der Code auf `unbekannter_fehler`, und der echte steht nur noch im
// Meldungstext — worauf kein Aufrufer verzweigen kann. Der Fall ist in keinem der drei Wege
// theoretisch: Der Reconcile läuft beim Projektstart, und ein Import- oder Löschauftrag wird beim
// Einreihen eingefroren (TK 9.3.5) und kann laufen, NACHDEM der Nutzer das Projekt gewechselt
// oder geschlossen hat.
//
// NUR dieser eine Code. `projekt_beschaeftigt` ist aus allen dreien unerreichbar; eine Union um
// unerreichbare Fälle zu erweitern täuscht Pfade vor, die es nicht gibt.

/** Fachliche Fehlercodes von importMedium (TK 9.4.9). */
export type ImportFehlercode =
  | 'datei_nicht_gefunden'
  | 'format_nicht_unterstuetzt'
  | 'probe_fehler'
  | 'kopier_fehler'
  | 'speicher_fehler'
  | 'kein_projekt'

/** Fachliche Fehlercodes von löscheMedium (TK 9.4.9). */
export type LoeschFehlercode =
  | 'asset_nicht_gefunden'
  | 'asset_referenziert'
  | 'datei_fehler'
  | 'speicher_fehler'
  | 'kein_projekt'

/**
 * Fehlercodes des Aufräumlaufs (Reconcile, TK 9.4.7) – s. Begründung unten.
 *
 * `kein_projekt` ist am 13.08.2026 nachgetragen worden (Issue-Nachtrag zu #79). Grund: Der
 * `project-store` hat am selben Tag diesen Code bekommen, und `markiereFehlende` (#89) sagt zu,
 * den Fehler von `setzeAssetZustand` (#74) UNVERÄNDERT durchzureichen. Ohne den Eintrag fiel er
 * auf `unbekannter_fehler`, und der echte Code stand nur noch im Meldungstext – worauf kein
 * Aufrufer verzweigen kann. Der Fall ist beim Reconcile nicht theoretisch: Er läuft beim
 * Projektstart, also genau dann, wenn noch kein Projekt geladen sein kann.
 *
 * NUR dieser eine Code. `projekt_beschaeftigt` und `speicher_fehler` sind aus `setzeAssetZustand`
 * gar nicht erreichbar (die Funktion stößt nur das entprellte Speichern an, nie einen
 * Sofort-Flush) – eine Union um unerreichbare Fälle zu erweitern, täuscht Pfade vor, die es nicht
 * gibt.
 */
export type ReconcileFehlercode = 'speicher_fehler' | 'datei_fehler' | 'kein_projekt'
