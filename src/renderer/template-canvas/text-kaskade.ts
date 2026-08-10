// GENERIERT aus dem Signaturblock von Issue #113.
// [template-canvas] Text-Überlauf-Kaskade umbrechen, verkleinern, kürzen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export const ZEILENHOEHE_FAKTOR = 1.2
// Zeilenhöhe = Schriftgröße × ZEILENHOEHE_FAKTOR. Diese Konstante ist die EINZIGE Wahrheit über den
// Zeilenabstand: #114 muss sie importieren und für den Zeilenvorschub beim Zeichnen benutzen.
// Rechnet die Kaskade mit 1.2 und das Zeichnen mit einem anderen Wert, ragt der Text aus der Zone.

export interface KaskadenEingang {
  text: string
  breite: number      // Zonenbreite in px   – zone.rahmen.breite
  höhe: number        // Zonenhöhe in px     – zone.rahmen.höhe
  größeMax: number    // zone.text.größeMax
  größeMin: number    // zone.text.größeMin
  maxZeilen: number   // zone.text.maxZeilen
}

export interface KaskadenErgebnis {
  zeilen: string[]    // fertige Zeilen, in Zeichenreihenfolge; keine führenden/folgenden Leerzeichen
  größe: number       // gewählte Schriftgröße in px, ganzzahlig, immer in [größeMin, größeMax]
  gekürzt: boolean    // true, wenn Stufe 3 („…") gegriffen hat
}

export function passeTextEin(
  eingang: KaskadenEingang,
  messeBreite: (text: string, größe: number) => number,
): KaskadenErgebnis {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #113."
  );
}
// Reine Funktion: kein Canvas, kein DOM, keine Nebenwirkung. Gemessen wird ausschließlich über den
// übergebenen Messer.
