// Die vier Marken-Schriften laden (#8).
//
// WARUM SIE MITGELIEFERT WERDEN: "Marken-Schriften werden mitgeliefert" (TK 9.10.4).
// Playfair Display ist auf Windows und macOS NICHT vorinstalliert. Waere sie nicht im
// Buendel, ersetzte der Browser sie stillschweigend durch irgendetwas Vorhandenes -
// die Segmente saehen auf dem Rechner des Entwicklers anders aus als auf dem des
// Studios, und der Unterschied wanderte in die fertige MP4, ohne dass irgendwo ein
// Fehler auftaucht.
//
// WARUM EXPLIZIT GELADEN WIRD UND NICHT NUR PER CSS: Ein Canvas zeichnet Text SOFORT.
// Ist die Schrift zu diesem Zeitpunkt noch nicht dekodiert, nimmt Chromium eine
// Ersatzschrift und zeichnet damit - ohne Fehler, ohne Warnung, ohne zweiten Versuch.
// Das Ergebnis ist ein Segment mit falscher Schrift, und weil dasselbe Bild in die
// MP4 geht (TK 9.1, Variante A), steht der Fehler dann auf dem Fernseher.
// TK 9.10.3 verlangt deshalb ausdruecklich, dass Schriften VOR dem Zeichnen geladen
// sind. Genau das leistet diese Funktion - und ihr Versprechen ist nur so viel wert
// wie das Abwarten: Wer sie ohne `await` ruft, hat nichts gewonnen.

// `new URL(..., import.meta.url)` statt eines Imports: Vite loest das beim Bauen auf
// den fertigen Asset-Pfad auf (mit Inhalts-Hash), und es braucht keine zusaetzliche
// Typdeklaration fuer *.woff2 - die waere sonst noetig, weil tsconfig.renderer.json
// mit "types": [] auch die Vite-Client-Typen aussperrt (der Schalter aus #1, der die
// Prozess-Trennung traegt und nicht angefasst wird).
const DATEIEN = {
  playfair: new URL("../assets/fonts/PlayfairDisplay-Bold.woff2", import.meta.url),
  archivo: new URL("../assets/fonts/ArchivoBlack-Regular.woff2", import.meta.url),
  arimo: new URL("../assets/fonts/Arimo-Regular.woff2", import.meta.url),
  arimoFett: new URL("../assets/fonts/Arimo-Bold.woff2", import.meta.url),
};

/**
 * Die vier Schriften mit der Gewichtsangabe, unter der sie angesprochen werden.
 *
 * Die Familiennamen sind die ECHTEN Namen der Schriften, nicht die Rollennamen aus
 * TK 9.11.2 (headlineElegant, headlinePlakativ, fliesstext …). Die Zuordnung
 * Rolle -> Familie gehoert in die Marke (M4) und darf hier nicht zum zweiten Mal
 * festgelegt werden; diese Datei stellt die Familien nur bereit.
 *
 * Zu Archivo Black und dem Gewicht 900: Die Schrift traegt intern das Gewicht 400 -
 * sie hat nur einen Schnitt, und der ist bereits sehr fett. Angesprochen wird sie als
 * 900, weil die Rolle "headlinePlakativ" das verlangt; die Angabe hier ist die
 * Vereinbarung, unter der sie gefunden wird, nicht eine Eigenschaft der Datei.
 */
const SCHRIFTEN: ReadonlyArray<{ familie: string; gewicht: string; quelle: URL }> = [
  { familie: "Playfair Display", gewicht: "700", quelle: DATEIEN.playfair },
  { familie: "Archivo Black", gewicht: "900", quelle: DATEIEN.archivo },
  { familie: "Arimo", gewicht: "400", quelle: DATEIEN.arimo },
  { familie: "Arimo", gewicht: "700", quelle: DATEIEN.arimoFett },
];

/**
 * Laedt alle vier Marken-Schriften und meldet erst zurueck, wenn sie benutzbar sind.
 *
 * KEIN Timeout - bewusst und nach Ruecksprache offen gelassen: Ein Timeout muesste
 * beantworten, was danach geschieht, und beide Antworten sind schlecht. Weiterzeichnen
 * hiesse, mit Ersatzschrift in die MP4 zu rendern - genau der Fehler, gegen den diese
 * Funktion existiert. Abbrechen hiesse, die App wegen eines Ladevorgangs unbenutzbar
 * zu machen, der aus dem eigenen Buendel kommt und keine Netzverbindung braucht.
 * Solange die Dateien mitgeliefert sind, gibt es kein Warten auf etwas Fremdes.
 */
export async function ladeMarkenSchriften(): Promise<void> {
  await Promise.all(
    SCHRIFTEN.map(async ({ familie, gewicht, quelle }) => {
      const face = new FontFace(familie, `url(${quelle.href}) format("woff2")`, {
        weight: gewicht,
        style: "normal",
      });
      // FontFace.load() ausdruecklich aufrufen: Ein bloss hinzugefuegtes FontFace
      // wird erst geladen, wenn etwas es benutzt - und "etwas benutzt es" tritt beim
      // Canvas eben nicht rechtzeitig ein.
      await face.load();
      document.fonts.add(face);
    }),
  );
}
