// GENERIERT aus dem Signaturblock von Issue #130.
// [composer] Wirkung der Abschnittsfolge anzeigen
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
// GERUEST-PRUEFSUMME: 516e26e705991a20
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

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

export type BandVerhalten = 'leer' | 'exakt' | 'wiederholt' | 'abgeschnitten'

export interface BandAblaufplan {
  verhalten: BandVerhalten
  videoFrames: number            // frame-gerundete Länge des GETRIMMTEN Videos
  folgeFrames: number            // frame-gerundete Summe aller Abschnitts-Dauern (ein Durchlauf)
  volleDurchlaeufe: number       // vollständig gezeigte Durchläufe der Folge
  restFrames: number             // Frames des angebrochenen letzten Durchlaufs (0 = keiner)
  angeschnittenerIndex: number | null   // Index des Abschnitts, der am Videoende abbricht
  abschnittsFrames: number[]     // frame-gerundete Dauer je Abschnitt, gleiche Reihenfolge
  nullFrameIndizes: number[]     // Indizes der Abschnitte mit abschnittsFrames[i] === 0
}

export function planeBandAblauf(
  trimStartSek: number,
  trimEndeSek: number,
  abschnitte: ReadonlyArray<{ aktionRef: string; dauer: number }>,
): BandAblaufplan {
  const fps = RENDER_PROFILE.fps

  // Reine Anzeige-Rechnung, keine Pruefstelle: nicht endliche Trim-Grenzen
  // zaehlen als 0 (Fehlerpfad „als 0 behandelt, kein Wurf"). `Number.isFinite`
  // verwirft auch `NaN` und unendliche Werte.
  const start = Number.isFinite(trimStartSek) ? trimStartSek : 0
  const ende = Number.isFinite(trimEndeSek) ? trimEndeSek : 0

  // DIE Frame-Rundung des Renders, Zeichen fuer Zeichen dieselbe Regel (TK 9.2.6):
  // zwei EINZELNE `Math.round` auf dem Raster des Ausgabe-Profils, danach die
  // Differenz. Kein Zwischenschritt in Sekunden, genau EIN Runden je Wert. Die
  // Elementdauer bestimmt allein das Video (TK 9.2.8) - `ende <= start` wird
  // deshalb auf 0 Frames geklemmt, nicht aufgerundet.
  const videoFrames = Math.max(
    0,
    Math.round(ende * fps) - Math.round(start * fps),
  )

  // Abschnitts-Dauern unterliegen derselben Frame-Rundung (TK 9.2.8). Eine
  // negative oder nicht endliche `dauer` zaehlt als 0 Frames (Fehlerpfad) - die
  // Gueltigkeitspruefung sitzt anderswo (#129, Main), nicht in dieser Anzeige.
  const abschnittsFrames = abschnitte.map((abschnitt) =>
    typeof abschnitt.dauer === 'number' &&
    Number.isFinite(abschnitt.dauer) &&
    abschnitt.dauer > 0
      ? Math.round(abschnitt.dauer * fps)
      : 0,
  )
  const folgeFrames = abschnittsFrames.reduce((summe, frames) => summe + frames, 0)

  // Die Abschnitte, die im Render lautlos verschwinden (auf 0 Frames gerundet) -
  // eigene Liste, damit die Oberflaeche darauf hinweisen kann. Immer vorhanden,
  // auch wenn sie leer ist.
  const nullFrameIndizes: number[] = []
  for (let i = 0; i < abschnittsFrames.length; i++) {
    if (abschnittsFrames[i] === 0) nullFrameIndizes.push(i)
  }

  // `folgeFrames === 0` ist ein EIGENER Zweig, keine Division: ohne ihn ergaebe
  // `videoFrames / 0` `Infinity` und die Anzeige behauptete unendlich viele
  // Durchlaeufe. Moeglich bei leerer Folge ODER wenn alle Dauern auf 0 runden.
  if (folgeFrames === 0) {
    return {
      verhalten: 'leer' as const,
      videoFrames,
      folgeFrames,
      volleDurchlaeufe: 0,
      restFrames: 0,
      angeschnittenerIndex: null,
      abschnittsFrames,
      nullFrameIndizes,
    }
  }

  // `volleDurchlaeufe` zaehlt nur VOLLSTAENDIGE Durchlaeufe; der angebrochene
  // letzte steckt in `restFrames` (Entscheidung im Issue).
  const volleDurchlaeufe = Math.floor(videoFrames / folgeFrames)
  const restFrames = videoFrames - volleDurchlaeufe * folgeFrames

  const verhalten: BandVerhalten =
    volleDurchlaeufe >= 1 && restFrames === 0
      ? 'exakt'
      : volleDurchlaeufe >= 1
        ? 'wiederholt'
        : 'abgeschnitten'

  // Der Abschnitt, der am Videoende nicht zu Ende gezeigt wird: der kleinste
  // Index i, dessen kumulierte Summe `abschnittsFrames[0..i]` den Rest echt
  // ueberschreitet. Bei `volleDurchlaeufe === 0` ist `restFrames` gleich
  // `videoFrames` - beide Lagen der Tabelle fallen also zusammen. Bei `'exakt'`
  // gibt es keinen.
  let angeschnittenerIndex: number | null = null
  if (restFrames > 0 || volleDurchlaeufe === 0) {
    let kumuliert = 0
    for (const [i, frames] of abschnittsFrames.entries()) {
      kumuliert += frames
      if (kumuliert > restFrames) {
        angeschnittenerIndex = i
        break
      }
    }
  }

  return {
    verhalten,
    videoFrames,
    folgeFrames,
    volleDurchlaeufe,
    restFrames,
    angeschnittenerIndex,
    abschnittsFrames,
    nullFrameIndizes,
  }
}
