// GENERIERT aus dem Signaturblock von Issue #25.
// [ipc] Kanal-Namens-Registry anlegen
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
// GERUEST-PRUEFSUMME: 8746a21b1aca094d

// Wird von JEDEM M2–M7-Issue ergänzt, das einen neuen Kanal/ein neues Ereignis einführt.
// Muster: '<modul>:<operation>' für Aufrufe, '<modul>:<ereignis>' für Ereignisse.
// Struktur ENTSCHIEDEN: verschachtelt (KANAELE.<modul>.<operation>), nicht flach – liest sich
// näher am aufrufenden Modul.
export const KANAELE = {
  // Beispiel-Einträge, tatsächliche Liste wächst mit M2-M7:
  // media: { importMedium: 'media:importMedium', ... },
  //
  // KORRIGIERT am 13.08.2026: Hier stand als zweites Beispiel
  // `auftrag: { reiheEin: 'auftrag:reiheEin', ... }`. Das Präfix ist FALSCH und
  // widerspricht dem Verbindlichen: Der auftrags-manager schreibt auf `queue:`
  // (#61 nennt `queue:reiheEin`, #71 die vier Kanäle, und TK 9.1.1 Punkt 4 nennt
  // `queue:geaendert`). Aufgefallen beim Bau von #61. Ein Beispiel mit falschem
  // Präfix ist gefährlicher als gar keins — es steht genau dort, wo #71 nachschaut.
  // Richtig wäre:
  // queue: { reiheEin: 'queue:reiheEin', geaendert: 'queue:geaendert', ... },

  // config-store (#77). Die fünf Namen ENTSTEHEN hier und nirgends sonst; die
  // Verdrahtung (src/main/ipc-gateway/config-store-verdrahtung.ts) und die
  // Renderer-Seite lesen sie beide von hier. Präfix `config:` nach dem Muster
  // `<modul>:<operation>`, Modulname `config-store` → `config`.
  // KEIN Schreibkanal für die Marke: `leseMarke` ist nur lesend (TK 9.5.6).
  config: {
    leseKonfig: 'config:leseKonfig',
    setzeAktivesProjekt: 'config:setzeAktivesProjekt',
    setzeExportZiel: 'config:setzeExportZiel',
    leseMarke: 'config:leseMarke',
    setzeUIVoreinstellung: 'config:setzeUIVoreinstellung',
  },
} as const
