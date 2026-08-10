// GENERIERT aus dem Signaturblock von Issue #103.
// [vorlagen-store] uebernehmeInParent – Arbeitskopie vollständig in den Parent übernehmen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export async function uebernehmeInParent(
  arbeitsId: string,
): Promise<Ergebnis<Vorlage, VorlagenFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #103."
  );
}
// - liefert bei Erfolg den PARENT in seinem neuen Zustand (nicht die Arbeitskopie)
// - Merge = vollständiges Ersetzen: name, art, höhe und zonen kommen aus der Arbeitskopie;
//   id und eingebaut bleiben die des Parents, und parent bleibt null (s. Invarianten)
// - die übernommene höhe wird GEPRÜFT: bei split/einblendung gerade ganze Zahl > 0 und < 1080,
//   bei vollflaeche null -> sonst ungueltige_eingabe, es wird NICHTS geschrieben (TK 9.12.1)
// - die Arbeitskopie wird im SELBEN Schreibvorgang aus vorlagen.json entfernt
// - ist der Parent eingebaut, wird NICHTS geändert -> Code parent_eingebaut
// - laeuft vollstaendig in EINER aendereBestand(…, 'sofort')-Einheit (#98)
// - kein fs, kein Lock, kein IPC-Kanal (den meldet #109 an)
