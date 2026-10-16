// [template-canvas] Ein SegmentBild als PNG - toBlob in ein Uint8Array
//
// DIE ZWEITE VERWENDUNG desselben Aufrufs (TK 9.10.1): Anzeige und Export golten
// aus DEMSELBEN SegmentBild; ES WIRD HIER NICHTS GEzeichnet - kein zweiter
// Zeichenpfad, kein eigener Kontext, kein Vorschau-Handel. toDataURL (Base64) ist
// ausdrücklich VERBOTEN ("Binärpuffer statt Base64", TK 9.1 Punkt 3): eine
// Zeichenkette würde ein Drittel mehr durch die IPC-Grenze tragen und die Hülle
// widerspricht dem Vertrag.
//
// DIE EBENENMaße vor allem anderen: das Setzen von canvas.width oder -
// .height LEERT das Canvas vollständig. Weichen die Werte ab, hat jemand nach dem
// Zeichnen an der Größe gedreht, und das PNG wäre eine LEERE Fläche - im Video
// ein schwarzes bzw. durchsichtiges Segment, ohne jede Fehlermeldung.
// Farbraum: sRGB, unangetastet - kein abweichendes Profil eingebettet, keins
// entfernt; die PNGs gehen unverändert in den ffmpeg-Lauf (BT.709 dort).

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { SegmentBild } from './zeichne-segment'

export type PngFehlercode = 'png_export_fehler'

export async function alsPng(bild: SegmentBild): Promise<Ergebnis<Uint8Array, PngFehlercode>> {
  try {
    // SCHRITT 1 - die Maßprüfung VOR allem anderen: Der einzige Wurf-Weg, der
    // vor toBlob steht (der zweite wäre der null-Rückruf).
    if (bild.canvas.width !== bild.breite || bild.canvas.height !== bild.höhe) {
      return {
        ok: false,
        fehler: {
          code: 'png_export_fehler' as const,
          meldung:
            `Die Canvas-Maße (${bild.canvas.width}×${bild.canvas.height}) stimmen nicht mit ` +
            `breite/höhe (${bild.breite}×${bild.höhe}) überein - das PNG wäre leere Fläche.`,
          daten: undefined,
        },
      }
    }

    // SCHRITT 2 - toBlob in ein Promise; der MIME-Typ steht AUSDRÜCKLICH im
    // Aufruf (die Absicht steht im Code). Ein Qualitätsargument entfällt: PNG ist
    // verlustfrei, der Parameter wäre dort wirkungslos.
    const blob = await new Promise<Blob | null>((auf) => {
      bild.canvas.toBlob((ergebnis) => {
        auf(ergebnis)
      }, 'image/png')
    })

    // SCHRITT 3 - null heißt Kodierungsergebnis (Kodierung gescheitert, Speichern).
    if (blob === null) {
      return {
        ok: false,
        fehler: { code: 'png_export_fehler' as const, meldung: 'toBlob liefert null - die Kodierung ist gescheitert.', daten: undefined },
      }
    }

    // SCHRITT 4 - der Binärpuffer (KEIN Base64, kein Datendünnstr scheduling).
    const puffer = new Uint8Array(await blob.arrayBuffer())

    // SCHRITT 5 - ein leerer Puffer wäre im Main erst beim ffmpeg-Lauf aufgefallen.
    if (puffer.byteLength === 0) {
      return {
        ok: false,
        fehler: { code: 'png_export_fehler' as const, meldung: 'Der PNG-Puffer ist leer.', daten: undefined },
      }
    }

    // SCHRITT 6 - der erfolgreiche Rückgabewert, binär.
    return { ok: true, wert: puffer }
  } catch (ausnahme) {
    // SCHRITT 7 - der GESAMTE Ablauf gefangen: der SecurityError eines
    // 'verunreinigten' Canvas läuft ebenso hier herein wie Formfehler - ES
    // VERLÄSST KEINE Ausnahme diese Funktion, denn das Ergebnis wandert in einen
    // RenderRequest, also über die IPC-Grenze.
    return {
      ok: false,
      fehler: {
        code: 'png_export_fehler' as const,
        meldung: ausnahme instanceof Error ? ausnahme.message : String(ausnahme),
        daten: undefined,
      },
    }
  }
}
