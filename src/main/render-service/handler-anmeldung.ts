// GENERIERT aus dem Signaturblock von Issue #189.
// [render-service] Den Render-Handler beim Programmstart anmelden
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export function meldeRenderHandlerAn(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #189."
  );
}
// Ruft registriereRenderHandler (#68) GENAU EINMAL mit den beiden echten Funktionen des
// render-service auf:
//   1. renderReel     (#181, src/main/render-service/render-reel.ts)
//   2. cancelRender   (#179, src/main/render-service/abbruch.ts)
// Mehr passiert hier nicht: keine Übersetzung, kein try/catch, kein Zustand, kein Lambda um
// die beiden Funktionen herum.
