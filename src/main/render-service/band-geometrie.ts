// [render-service] Die Bandhoehe pruefen – die EINZIGE Autoritaet fuer zulaessige Hoehen
//
// ============================================================================
// WAS DIESE DATEI SEIT TK v3.31 IST – UND WAS SIE NICHT MEHR IST
// ============================================================================
// Sie ist nur noch die PRUEFENDE Stelle: Sie validiert `höhe` und vergibt den
// Fehlercode `ungueltiges_element`. Eine Geometrie wird NICHT mehr bestimmt und
// nicht mehr weitergereicht – es gibt genau EINE Komposition (9.2.8): Das Video
// wird auf 1920 x 1080 normalisiert, das Band (1920 x H, deckend) unten
// ueberlagert. Die einzige Zahl, die daraus folgt, ist `y = 1080 - H`; sie steht
// in `baueEinblendungFilter` (#165), weil eine Subtraktion keine eigene
// Fachlichkeit und damit keine eigene Funktion ist.
//
// DER NAME IST HISTORISCH und bleibt, weil Issue #450 ihn in der Signatur nennt.
// Wer hier eine "Geometrie" erwartet, findet stattdessen die Zusage: Die Hoehe ist
// brauchbar oder es gibt einen Fehler mit Code und Meldung.
//
// WAS ERSATZLOS ENTFALLEN IST (AD v1.10 / TK v3.31): die Kompositionsart `art`
// samt Laufzeitpruefung, die geteilte Rechnung `berechneBandGeometrie`
// (`src/shared/band-geometrie.ts`, geloescht) und die Mindestbreite der
// Split-Komposition. Mit dem gestrichenen Split-Screen gibt es kein verkleinertes
// Video mehr, fuer das eine Breite uebrig bleiben muesste.
//
// UND SIE SCHLAEGT NICHTS NACH: kein Import aus dem vorlagen-store, kein Lesen
// einer Vorlage. Der Render friert seinen Eingang beim EINREIHEN ein (TK 9.3.5).
// Ein Auftrag kann Minuten in der Warteschlange stehen; aendert jemand in dieser
// Zeit die Bandhoehe der Vorlage, passten die bereits gezeichneten Band-PNGs
// (1920 x H ZUM EINREIH-ZEITPUNKT) nicht mehr zur nachgeschlagenen Hoehe.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/**
 * Einheitlicher Fehlerausgang. `daten` wird NIE gesetzt: Diese Funktion kennt die
 * Element-ID nicht; der Aufrufer ergaenzt `daten = { elementId }` als
 * `ElementFehlerdaten` (TK 9.2.3).
 */
function ungueltig(meldung: string): Ergebnis<void, RenderFehlercode> {
  return { ok: false, fehler: { code: 'ungueltiges_element', meldung } }
}

/**
 * Prueft die mitgereiste Einblendung: Ist die Bandhoehe eine ganze, gerade Zahl
 * groesser 0 und kleiner als die Bildhoehe?
 *
 * Der Erfolgswert ist bewusst `void`: Es gibt nichts weiterzugeben. Der Aufrufer
 * kennt die Hoehe bereits und reicht sie unveraendert an `baueEinblendungFilter`
 * (#165) weiter, das daraus `y = 1080 - H` bildet.
 *
 * Die Meldungen sind gegenueber dem Stand vor v3.31 UNVERAENDERT (Issue #450:
 * „Meldung unverändert"); allein die beiden Zweige entfallen, die eine
 * Kompositionsart betrafen.
 */
export function bestimmeBandgeometrie(
  einblendung: { höhe: number },
): Ergebnis<void, RenderFehlercode> {
  try {
    // Die Nutzlast kommt aus dem Renderer. Der statische Typ ist ueber die
    // IPC-Grenze hinweg nur eine Zusage - hier wird sie geprueft, nicht geglaubt.
    // SAFETY: der Cast erweitert nur um null/undefined; die Pruefung der Form folgt
    // unmittelbar darunter (typeof- und Feld-Checks, Ergebnis-Huelle statt Wurf).
    const roh = einblendung as { höhe?: unknown } | null | undefined

    if (roh === null || roh === undefined || typeof roh !== 'object') {
      // Ohne Band bleibt die Verarbeitung unveraendert (TK 9.2.8) - dann wird
      // diese Funktion gar nicht erst gerufen. Sie hat keinen Fall dafuer und
      // liefert keine „Standard-Geometrie".
      return ungueltig(
        'Diese Funktion gilt nur fuer Elemente MIT Einblendung; uebergeben wurde keine.',
      )
    }

    const höhe = roh.höhe
    if (typeof höhe !== 'number' || !Number.isFinite(höhe)) {
      return ungueltig(
        `Die Bandhoehe muss eine endliche Zahl sein, vorgefunden: ${String(höhe)}.`,
      )
    }
    if (!Number.isInteger(höhe)) {
      return ungueltig(
        `Die Bandhoehe muss ganzzahlig sein (Pixel), vorgefunden: ${String(höhe)}.`,
      )
    }
    if (höhe <= 0) {
      return ungueltig(
        `Die Bandhoehe muss groesser als 0 sein, vorgefunden: ${String(höhe)}.`,
      )
    }
    if (höhe >= RENDER_PROFILE.hoehe) {
      // Die Gesamthoehe kommt aus dem Profil (#18), nicht als Literal - eine
      // spaetere Profil-Aenderung muss ein Datenwert bleiben (ENTSCHIEDEN 7).
      // Genau der in TK 9.2.3 genannte Fall „Einblendung … mit höhe >= 1080".
      return ungueltig(
        `Die Bandhoehe ${String(höhe)} erreicht oder ueberschreitet die Bildhoehe ` +
          `${String(RENDER_PROFILE.hoehe)}; es bliebe kein Video uebrig.`,
      )
    }
    if (höhe % 2 !== 0) {
      // KEINE Ausweich-Geometrie: nicht runden, das Band nicht um ein Pixel
      // verschieben. Eine solche Rettung erzwaenge eine Skalierung des bereits in
      // 1920 x H gezeichneten Band-PNGs - der Text im Band wuerde unscharf
      // (ENTSCHIEDEN 3). Das Ausgabe-Profil schreibt yuv420p fest (TK 9.2.4).
      const naechsteGerade = höhe - 1 > 0 ? höhe - 1 : höhe + 1
      return ungueltig(
        `Die Bandhoehe ${String(höhe)} ist ungerade. Das Ausgabe-Profil verlangt yuv420p; ` +
          'dabei sind nur GERADE Bandhoehen zulaessig. Naechstliegende gerade Hoehe: ' +
          `${String(naechsteGerade)}. Die Bandhoehe stammt aus der Band-Vorlage und ist ` +
          'dort anzupassen.',
      )
    }

    return { ok: true, wert: undefined }
  } catch (ursache) {
    // Niemals `throw`: Diese Funktion wird aus einer IPC-bedienten Operation heraus
    // benutzt (TK 9.1.1). Eine Ausnahme ueber die Prozessgrenze verlaere ihren Code.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Die Bandhoehe konnte nicht geprueft werden: ${
          ursache instanceof Error ? ursache.message : String(ursache)
        }`,
      },
    }
  }
}
