// #364 - media://-Bytes als Blob-URL fuer CANVAS-Nutzer.
//
// BEFUND (gemessen): `drawImage` aus einem `media://`-<video> taintet das
// Ziel-Canvas. Anzeigen funktioniert, aber jedes Pixel-Auslesen
// (`getImageData`, `toDataURL`, `toBlob`) scheitert an der Browser-
// Sicherheitsgrenze. Damit waeren Thumbnail-Speicherung, Frame-Export und
// Bildvergleichstests ueber Pixel dauerhaft verbaut.
//
// DERSELBE WEG WIE #315/NACHTRAG II fuer `marken://`: Die Bytes kommen ueber den
// Speicherort-Vertrag (TK 9.5.7, `media://` bleibt unveraendert), gebunden wird
// aber eine Objekt-URL. Blob-URLs sind same-origin und tainten nicht - jsdom und
// Chromium gleich.
//
// EINE STELLE, NICHT ZWEI: Weitere Canvas-Nutzer (kuenftige Thumbnail-Exporte,
// Bildvergleich) rufen diese Datei; keine Kopie des Wegs in einem zweiten Modul.
//
// DIE BUEHNE BLEIBT DRAUSSEN: `preview-player/video.tsx` bindet weiterhin die
// direkte `media://`-URL. Sie zeigt nur an, braucht kein ungetaintetes Canvas -
// eine Byte-Kopie eines 255-MB-Videos waere dort reine Verschwendung.
//
// SPEICHER: Der Blob haelt die GANZE Datei im Speicher. Fuer den Filmstreifen ist
// das die akzeptierte Ausnahme (ein Video je Projekt); der Aufrufer gibt die URL
// nach dem letzten Bild ueber `gibMediaBlobUrlFrei` wieder frei.

/** Holt `media://<projektId>/<dateiname>` als Blob und liefert eine Objekt-URL.
 *  Wirft nie: im Fehlerfall eine leere Zeichenkette und ein `console.warn` mit Ursache. */
export async function mediaBlobUrl(projektId: string, dateiname: string): Promise<string> {
  try {
    const antwort = await fetch(`media://${projektId}/${dateiname}`)
    if (!antwort.ok) {
      console.warn(
        `[media-blob-url] media://${projektId}/${dateiname} antwortete mit ${String(antwort.status)}.`,
      )
      return ''
    }
    const bytes = await antwort.blob()
    return URL.createObjectURL(bytes)
  } catch (fehler) {
    // Jeder Weg endet hier: kein Netz, kein Handler, kein Blob, kein Objekt-URL.
    console.warn(`[media-blob-url] Bytes fuer media://${projektId}/${dateiname} nicht ladbar:`, fehler)
    return ''
  }
}

/** Gibt eine von `mediaBlobUrl` erzeugte Objekt-URL frei. Total: wirft nie. */
export function gibMediaBlobUrlFrei(url: string): void {
  if (url === '') {
    return
  }
  try {
    URL.revokeObjectURL(url)
  } catch {
    // Freigeben ist Aufraeumen, kein Fachschritt - ein Fehler hier darf nichts kippen.
  }
}
