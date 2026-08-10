/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #168.
// [ffmpeg-adapter] Bandspur aus den Band-PNGs bauen
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
// GERUEST-PRUEFSUMME: 472aaa2961c330bf
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

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { fuehreFfmpegAus } from './prozess'                     // #158
import type { FfmpegFehlercode, FfmpegLauf } from './prozess'  // #158

export interface BandAbschnitt {
  /** absoluter Pfad des Band-PNG in T1 (1920 × H) – bereits vom `render-service` abgelegt (#175) */
  pngPfad: string
  /** Länge dieses Abschnitts in Frames, GANZZAHLIG. Die Rundung hat der `render-service`
   *  erledigt (#174); hier wird NICHT von Sekunden umgerechnet. */
  frames: number
}

export interface BandspurAuftrag {
  /** geordnete Folge der Abschnitte, mindestens einer */
  abschnitte: BandAbschnitt[]
  /** Bandhöhe H in Pixeln, aus `RenderItemVideo.einblendung.höhe` (#17) */
  hoeheBand: number
  /** Gesamtlänge der Bandspur in Frames = endFrame − startFrame des Videos (#167).
   *  Diese Datei berechnet sie NICHT und leitet sie NICHT aus den Abschnitten ab. */
  gesamtFrames: number
  /** absoluter Pfad der Zwischendatei (die einmal durchlaufene Abschnittsfolge) in T1 */
  sequenzPfad: string
  /** absoluter Pfad der fertigen, auf gesamtFrames gebrachten Bandspur in T1 */
  zielPfad: string
}

/**
 * Schritt 1: die Abschnitte EINMAL hintereinander – reine Argument-Bildung.
 * Exportiert, damit es testbar ist: Nur so laesst sich die Sequenzkette ohne Prozessstart,
 * ohne Binary und ohne PNG-Dateien vollstaendig pruefen. Ein modulfremder Aufrufer hat hier
 * nichts zu suchen - gerufen wird die Funktion ausschliesslich von `baueBandspur`.
 */
export function baueBandSequenzArgumente(
  auftrag: BandspurAuftrag,
  profil: RenderProfile,
): Ergebnis<string[]> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #168."
  );
}

/**
 * Schritt 2: die Sequenz wiederholen und auf `gesamtFrames` abschneiden – reine Argument-Bildung.
 * Exportiert, damit es testbar ist (gleiche Begruendung wie bei Schritt 1); auch sie wird
 * ausschliesslich modulintern von `baueBandspur` gerufen.
 */
export function baueBandSchleifeArgumente(
  auftrag: BandspurAuftrag,
  profil: RenderProfile,
): Ergebnis<string[]> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #168."
  );
}

/**
 * Führt beide Schritte nacheinander aus. Die EINZIGE Funktion dieses Issues, die einen Prozess
 * startet – und sie tut es ausschließlich über `fuehreFfmpegAus` (#158).
 *
 * Der Rückgabetyp ist EXAKT der von `fuehreFfmpegAus` (#158) – das Ergebnis wird UNVERÄNDERT
 * durchgereicht: kein Code wird hier übersetzt, keine Meldung umformuliert.
 *
 * `lauf` ist optional und wird UNVERAENDERT an BEIDE `fuehreFfmpegAus`-Aufrufe weitergereicht.
 * Diese Datei erzeugt die drei Felder nicht, deutet sie nicht und legt sie nicht ab.
 */
export async function baueBandspur(
  auftrag: BandspurAuftrag,
  profil: RenderProfile,
  lauf?: Pick<FfmpegLauf, 'aufAusgabeZeile' | 'aufProzessStart' | 'abbruchSignal'>,
): Promise<Ergebnis<void, FfmpegFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #168."
  );
}
