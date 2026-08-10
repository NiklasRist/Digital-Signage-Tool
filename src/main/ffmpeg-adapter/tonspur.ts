/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #162.
// [ffmpeg-adapter] Stille Tonspur und Container-Argumente bilden
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
// GERUEST-PRUEFSUMME: 8314e51ab2904f91
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

/**
 * Die EINGABE der stillen Tonquelle. Wird als ZUSAETZLICHE Eingabe an den ffmpeg-Aufruf
 * gehaengt - sie erzeugt endlos Stille.
 * Gehoert an JEDEN Normalisierungslauf (Zwischenclip), nicht an den concat-Lauf.
 */
export function baueStilleTonspurEingang(profil: RenderProfile): string[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #162."
  );
}

/**
 * Das ausdrueckliche Mapping der stillen Tonspur.
 * `audioEingangIndex` ist die Nummer der oben angehaengten Eingabe (0-basiert, in der
 * Reihenfolge der -i-Argumente).
 * WICHTIG: Sobald irgendein -map gesetzt ist, mappt ffmpeg NICHTS mehr automatisch.
 * Genau dadurch faellt der Quellton weg - das ist gewollt und vertraglich verlangt.
 * Der Aufrufer MUSS deshalb die Videospur ebenfalls ausdruecklich mappen.
 */
export function baueTonspurMapping(audioEingangIndex: number): string[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #162."
  );
}

/**
 * Die Kodierargumente der Tonspur. Gehoeren an JEDEN Normalisierungslauf.
 */
export function baueTonspurKodierArgumente(profil: RenderProfile): string[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #162."
  );
}

/**
 * Container-Argumente der FERTIGEN Datei (+faststart).
 * Gehoeren AUSSCHLIESSLICH an den abschliessenden concat-Lauf (#169),
 * nicht an die Zwischenclips - siehe Begruendung unten.
 */
export function baueContainerArgumente(profil: RenderProfile): string[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #162."
  );
}
