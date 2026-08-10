// GENERIERT aus dem Signaturblock von Issue #170.
// [ffmpeg-adapter] Uniformität der Zwischenclips vor dem concat prüfen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Die für die Uniformität bedeutsamen Eigenschaften EINER Datei. */
export interface StromEigenschaften {
  datei: string
  /** Spieldauer der DATEI in Sekunden, aus `format.duration` (deshalb ruft der ffprobe-Aufruf
   *  `-show_format` MIT auf). Wird fuer die Uniformitaet NICHT verglichen – die Segmente sind
   *  unterschiedlich lang, das ist gewollt. Das Feld existiert fuer #180: Die Verifikation der
   *  fertigen Datei (TK 9.2.6, „Dauer im erwarteten Rahmen") braucht die Dauer, und #180 darf
   *  ffprobe nur EINMAL rufen. ffprobe liefert sie im selben JSON – es kostet keinen zweiten
   *  Aufruf. */
  dauerSekunden: number
  stromAnzahl: number
  /** Arten der Ströme in Datei-Reihenfolge, z. B. ['video', 'audio'] */
  stromArten: string[]
  video: {
    codec: string            // codec_name,        erwartet 'h264'
    profil: string           // profile,           erwartet 'High'
    level: number            // level,             erwartet 40  (= Level 4.0)
    breite: number
    hoehe: number
    pixelformat: string      // pix_fmt,           erwartet 'yuv420p'
    bildrate: string         // r_frame_rate,      erwartet '30/1'
    mittlereBildrate: string // avg_frame_rate,    erwartet '30/1'
    zeitbasis: string        // time_base – NICHT im Profil, nur segmentübergreifend verglichen
    pixelSeitenverhaeltnis: string | null   // sample_aspect_ratio, erwartet '1:1' oder nicht gesetzt
    farbPrimaries: string | null            // color_primaries,  erwartet 'bt709'
    farbTransfer: string | null             // color_transfer,   erwartet 'bt709'
    farbMatrix: string | null               // color_space,      erwartet 'bt709'
    feldreihenfolge: string | null          // field_order, wenn gesetzt: 'progressive'
    drehung: number          // aus side_data_list bzw. tags.rotate; erwartet 0
  } | null
  audio: {
    codec: string            // codec_name,   erwartet 'aac'
    abtastrate: number       // sample_rate,  erwartet 48000
    kanaele: number          // channels,     erwartet 1
  } | null
}

export interface Abweichung {
  datei: string
  feld: string
  erwartet: string
  gefunden: string
}

export interface Uniformitaetsbefund {
  ok: boolean
  abweichungen: Abweichung[]
}

/** Wandelt die ffprobe-JSON-Ausgabe EINER Datei in `StromEigenschaften`. REINE Funktion. */
export function leseStromEigenschaften(
  ffprobeJson: unknown,
  datei: string,
): Ergebnis<StromEigenschaften> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #170."
  );
}

/**
 * Vergleicht alle Befunde gegen das Profil UND untereinander. REINE Funktion – der eigentliche
 * Prüfkern und die Stelle, an der dieses Issue ohne jedes Binary vollständig testbar ist.
 */
export function vergleicheStroeme(
  befunde: StromEigenschaften[],
  profil: RenderProfile,
): Uniformitaetsbefund {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #170."
  );
}

/**
 * Liest EINE Datei mit ffprobe aus. Exportiert, weil #180 dieselbe Auslesung braucht.
 * `ffprobePfad` wird HEREINGEREICHT, nicht hier ermittelt – genauso wie #180 ihn als Parameter
 * entgegennimmt (`verifiziereUndPlatziere(..., ffprobePfad)`). So gibt es EINE Stelle, die
 * `ermittleFfprobePfad()` (#6) ruft: den `render-service`.
 */
export async function liesStromEigenschaften(
  datei: string,
  ffprobePfad: string,
): Promise<Ergebnis<StromEigenschaften>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #170."
  );
}

/**
 * Prüft alle Zwischenclips. Wird vom `render-service` VOR dem concat-Schritt (#169) aufgerufen.
 *
 * WICHTIG zur Bedeutung des Rückgabewerts: Eine erkannte Abweichung ist KEIN `ok: false` der
 * Ergebnis-Hülle, sondern ein erfolgreicher Prüflauf mit `wert.ok === false` und der vollständigen
 * Liste der Abweichungen. Nur wenn die PRÜFUNG SELBST nicht durchführbar war (ffprobe startet
 * nicht, Ausgabe unlesbar), ist die Hülle `ok: false`.
 * Begründung: Der Aufrufer braucht die Abweichungsliste, um dem Nutzer sagen zu können, WAS nicht
 * passt. Ein Fehler-Ergebnis würde genau diese Diagnose wegwerfen und aus dem einzigen brauchbaren
 * Hinweis ein „irgendetwas ist schiefgelaufen" machen.
 */
export async function pruefeUniformitaet(
  dateien: string[],
  profil: RenderProfile,
  ffprobePfad: string,          // ermittleFfprobePfad() (#6) – vom Aufrufer geholt
): Promise<Ergebnis<Uniformitaetsbefund>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #170."
  );
}
