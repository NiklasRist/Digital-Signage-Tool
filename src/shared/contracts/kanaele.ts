// GENERIERT aus dem Signaturblock von Issue #25.
// [ipc] Kanal-Namens-Registry anlegen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

// Wird von JEDEM M2–M7-Issue ergänzt, das einen neuen Kanal/ein neues Ereignis einführt.
// Muster: '<modul>:<operation>' für Aufrufe, '<modul>:<ereignis>' für Ereignisse.
// Struktur ENTSCHIEDEN: verschachtelt (KANAELE.<modul>.<operation>), nicht flach – liest sich
// näher am aufrufenden Modul.
export const KANAELE = {
  // Beispiel-Einträge, tatsächliche Liste wächst mit M2-M7:
  // media: { importMedium: 'media:importMedium', ... },
  // auftrag: { reiheEin: 'auftrag:reiheEin', geaendert: 'auftrag:geaendert' },
} as const
