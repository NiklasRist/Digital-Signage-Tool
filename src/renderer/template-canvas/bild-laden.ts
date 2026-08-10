/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #111.
// [template-canvas] Motiv über media:// laden und dekodieren
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
// GERUEST-PRUEFSUMME: d99f3a7ec8ab6713
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

export type Motiv =
  | { zustand: 'geladen'; bild: ImageBitmap | HTMLImageElement; breite: number; höhe: number }
  | { zustand: 'fehlt' }
// Das unterscheidende Feld heißt `zustand` (nicht `status`). Diese Datei ist für den Typ
// DEFINIEREND; #115, #117 und #119 übernehmen ihn zeichengenau.
// breite/höhe = naturalWidth/naturalHeight des dekodierten Bildes (native Pixelmaße).
// Sie werden von der Bildzone (#115) für "contain"/"cover" gebraucht – und zwar AUSSCHLIESSLICH
// über diese beiden Felder. Ein Maß, das jede Zeichenfunktion selbst am Bildobjekt abliest,
// driftet; deshalb steht es genau einmal hier.

export async function ladeMotiv(projektId: string, dateiname: string): Promise<Motiv> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #111."
  );
}
// Baut die URL `media://${projektId}/${dateiname}`, lädt sie mit new Image() + await img.decode()
// und liefert das Ergebnis. Wirft NIE wegen eines Ladefehlers – jeder Ladefehler ist
// { zustand: 'fehlt' }.

export async function bereiteMotiveVor(
  projektId: string,
  eintraege: Array<{ schluessel: string; dateiname: string }>,
): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #111."
  );
}
// Lädt jeden Eintrag über ladeMotiv(projektId, dateiname) und legt das Ergebnis unter seinem
// `schluessel` im Motiv-Bestand ab. `schluessel` ist die ASSET-ID (aktion.bildRef), NICHT der
// Dateiname – unter dieser ID schlägt das Zeichnen später nach. Wirft nie: ein nicht ladbares
// Motiv landet als { zustand: 'fehlt' } im Bestand. Ein bereits vorhandener Schlüssel wird
// überschrieben.

export function holeMotiv(schluessel: string): Motiv {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #111."
  );
}
// SYNCHRON. Liest ausschließlich den vorbereiteten Bestand – lädt nichts, wartet auf nichts,
// erzeugt kein Image. Unbekannter Schlüssel → { zustand: 'fehlt' }.

export function leereMotivBestand(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #111."
  );
}
// Verwirft den gesamten Bestand. Wird bei jedem Projektwechsel und nach jedem Import aufgerufen.
