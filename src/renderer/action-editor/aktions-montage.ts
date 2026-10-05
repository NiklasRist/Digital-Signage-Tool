// Die reine Zusammensetz-Logik des Aktions-Editors (#250 / M7-57).
//
// Auswahl, Hervorhebung, Abgleich mit dem Bestand und das Einspeisen des neuen
// Standes in die gemeinsame Sicht - OHNE JSX/React/IPC. Die .tsx-Wurzel (index.tsx)
// ordnet nur; hier sitzt die Fachlichkeit.
//
// ENTSCHEIDENE Regeln (verbindlich):
//  - Der NEUE Stand geht über projekt.setzeProjekt(mitAktion(projekt, aktion))
//    in die gemeinsame Sicht - nach JEDER erfolgreichen Mutation. #141 warnt
//    ausdruecklich vor dem Gegenbeispiel: Wer ihn NICHT einspeist, sieht in
//    der Bibliothek scheinbar eine korrekte, aber VERALTETE Liste; die
//    Kaputt-Erkennung und der Reparatur-Fortschritt rechnen auf dem alten
//    Projekt weiter, "X von N" bleibt stehen und istRenderFreigegeben bleibt
//    dauerhaft false. Der Weg ist projekt.setzeProjekt auf dem UMHUELLTEN
//    Zugang - dort entsteht der Undo-Schnappschuss von selbst (#243/#244).
//    Es gibt bewusst KEIN project:geaendert-Ereignis (#141/ TK 9.7).
//  - mitAktion ersetzt an DERSELBEN Position (kein Springen beim Bearbeiten)
//    und haengt Unbekanntes ANS ENDE (Anhang nur fuer NEU angelegt);
//    liste/assets REFERENZGLEICH uebernommen - der action-editor platziert
//    nichts in die Liste (TK 9.8.1), und ein hier neu gebautes Teil-Array
//    wuerde der Undo-Huelle (#243 vergleicht Referenzgleichheit) einen
//    Schnappschuss fuer eine Nicht-Aenderung erzeugen.
//  - behebeAktionsBild (#141) liefert die aktion IM FELD wert.aktion - nicht
//    direkt: sonst haette mitAktion ein Objekt OHNE id verarbeitet und es
//    als unbekannt ANS ENDE gehaengt (die Bibliothek wuerde doppelt).
//  - Es gibt KEINEN IPC in diesen Dateien; jeder Weg laeuft durch die
//    M5-Funktionen und den ProjektZugang. Kein zeichneSegment (der Weg
//    fuehrt ueber zeichneVorschau #140 - kein zweiter Zeichenpfad, TK 9.8.4).
//  - Akzentfarbe folgt #318 (FA-24, freier Hex-Wert): die Vorschlaege kommen
//    ueber akzentVorschlaege(marke) (die Hex-Werte der Palette), gesetzt wird
//    ueber setzeAkzentfarbe(aktionId, hex) (#139, neugebaut); null = Markenwert.

import type { Project } from '../../shared/contracts/project'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'

/** Was der Editor gerade zeigt. Ein WERT – keine Funktion mutiert ihn. */
export type EditorLage =
  | { modus: 'keine' }                          // nichts gewaehlt – rechts steht der Leerhinweis
  | { modus: 'bestehend'; aktionId: string }    // eine Aktion der Bibliothek wird bearbeitet
  | { modus: 'neu' }                            // eine neue Aktion wird angelegt

export const LEERE_EDITOR_LAGE: EditorLage = Object.freeze({ modus: 'keine' }) as EditorLage

/** Eine Aktion der Bibliothek waehlen. */
export function waehleAktion(aktionId: string): EditorLage {
  return { modus: 'bestehend', aktionId }
}

/** „Neue Aktion" beginnen. Verwirft die bisherige Auswahl (s. ENTSCHIEDEN 4). */
export function beginneNeu(): EditorLage {
  return { modus: 'neu' }
}

/** Nach dem Anlegen: der Editor steht auf der SOEBEN entstandenen Aktion, nicht mehr auf 'neu'. */
export function nachAnlegen(aktion: Aktion): EditorLage {
  return { modus: 'bestehend', aktionId: aktion.id }
}

/** Nimmt die Hervorhebung aus der Reparatur-Fuehrung entgegen (#201, TK 9.14.2).
 *  `null` und eine im Bestand unbekannten Kennung lassen die Lage UNVERAENDERT. */
export function uebernimmHervorhebung(
  lage: EditorLage,
  hervorgehobeneAktionId: string | null,
  aktionen: readonly Aktion[],
): EditorLage {
  if (hervorgehobeneAktionId === null) {
    return lage
  }
  const vorhanden = aktionen.some((aktion) => aktion.id === hervorgehobeneAktionId)
  if (!vorhanden) {
    return lage
  }
  return { modus: 'bestehend', aktionId: hervorgehobeneAktionId }
}

/** Gleicht die Lage mit dem Bestand ab: Zeigt sie auf eine Aktion, die es nicht mehr gibt,
 *  faellt sie auf `{ modus: 'keine' }` zurueck. 'neu' und 'keine' bleiben unberuehrt. */
export function gleicheLageAb(lage: EditorLage, aktionen: readonly Aktion[]): EditorLage {
  if (lage.modus !== 'bestehend') {
    return lage
  }
  const vorhanden = aktionen.some((aktion) => aktion.id === lage.aktionId)
  return vorhanden ? lage : { modus: 'keine' }
}

/** Die Aktion, die die Lage bezeichnet; null bei 'neu', 'keine' und unbekannter Kennung. */
export function findeGewaehlte(lage: EditorLage, aktionen: readonly Aktion[]): Aktion | null {
  if (lage.modus !== 'bestehend') {
    return null
  }
  return aktionen.find((aktion) => aktion.id === lage.aktionId) ?? null
}

/** Der neue Projektstand nach einer Aktions-Aenderung (ENTSCHIEDEN 2 und 3):
 *  ersetzen an DERSELBEN Position, Anhängen ganz am Ende; liste/assets
 *  REFERENZGLEICH übernommen. */
export function mitAktion(projekt: Project, aktion: Aktion): Project {
  const stelle = projekt.aktionen.findIndex((eintrag) => eintrag.id === aktion.id)
  if (stelle === -1) {
    return {
      ...projekt,
      aktionen: [...projekt.aktionen, aktion],
    }
  }
  return {
    ...projekt,
    aktionen: [
      ...projekt.aktionen.slice(0, stelle),
      aktion,
      ...projekt.aktionen.slice(stelle + 1),
    ],
  }
}

/** Die Vorlage, mit der eine Aktion gezeichnet wird; null, wenn sie im Bestand fehlt. */
export function findeZeichenVorlage(
  aktion: Aktion,
  vorlagen: readonly Vorlage[],
): Vorlage | null {
  return vorlagen.find((eintrag) => eintrag.id === aktion.vorlagenId) ?? null
}
