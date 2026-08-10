// GENERIERT aus dem Signaturblock von Issue #213.
// [preview-player] Die frame-gerundete Zeitachse und die Gesamtdauer der Vorschau
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import { frameDauer } from '../composer/gesamtlaenge'

/** Der Platz genau eines Listenelements auf der Achse. Halboffen: [startFrame, endeFrame). */
export interface Achsenabschnitt {
  elementId: string
  /** Position in der übergebenen Liste (0-basiert) – die „Markierung des aktuellen Elements". */
  index: number
  /** Erster Frame dieses Elements, einschliesslich. */
  startFrame: number
  /** Erster Frame des NÄCHSTEN Elements, ausschliesslich. */
  endeFrame: number
  /** endeFrame − startFrame. */
  frames: number
}

export interface Zeitachse {
  abschnitte: readonly Achsenabschnitt[]
  /** Summe aller Abschnitts-Frames. */
  gesamtFrames: number
  /** gesamtFrames / RENDER_PROFILE.fps – exaktes Vielfaches von 1/fps. */
  gesamtSekunden: number
}

/**
 * Baut die Achse. Eine LEERE Liste ergibt eine leere Achse mit 0 Frames und ist KEIN Fehler.
 * Scheitert `frameDauer` an EINEM Element, bricht der Aufbau ab und der Fehler des ersten
 * gescheiterten Elements wird UNVERÄNDERT durchgereicht (Code und Meldung).
 */
export function baueZeitachse(liste: readonly Listenelement[]): Ergebnis<Zeitachse, string> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #213."
  );
}

/** Der Abschnitt, in dem `frame` liegt; null ausserhalb von [0, gesamtFrames). */
export function findeAbschnitt(achse: Zeitachse, frame: number): Achsenabschnitt | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #213."
  );
}

/** Position INNERHALB des Abschnitts: frame − abschnitt.startFrame. Klemmt nicht. */
export function lokalerFrame(abschnitt: Achsenabschnitt, frame: number): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #213."
  );
}

/** frame / RENDER_PROFILE.fps. */
export function frameZuSekunden(frame: number): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #213."
  );
}

/** Math.round(sekunden × RENDER_PROFILE.fps) – die EINZIGE Rundung dieser Datei, s. ENTSCHIEDEN 3. */
export function sekundenZuFrame(sekunden: number): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #213."
  );
}
