// GENERIERT aus dem Signaturblock von Issue #236.
// [app-shell] Rückgängig und Wiederherstellen im Vorlagen-Editor anwenden
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
// GERUEST-PRUEFSUMME: d9b156bb9b807e69

import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { EditorSitzung } from '../vorlagen-editor/arbeitskopie'   // NUR der Typ (import type)
import { vorlagenHistorie, leereVorlagenHistorie } from './undo-historien'

/**
 * Der Zugang zur laufenden Editor-Sitzung. Wird als PARAMETER übergeben (Entscheidung E1,
 * #197) – diese Datei ruft NICHTS aus `vorlagen-editor` auf und kennt keinen Kanalnamen.
 */
export interface VorlagenUndoZugang {
  /** Die laufende Editor-Sitzung; null, wenn der Editor nicht geöffnet ist. */
  holeSitzung: () => EditorSitzung | null
  /** Ersetzt die laufende Sitzung durch den vom Store zurückgegebenen Stand. */
  setzeSitzung: (sitzung: EditorSitzung) => void
  /** Der EINE Speicherweg des Editors (#149/#143 `sichereStand`), der hinter
   *  `vorlagen:speichereArbeitskopie` (#102) sitzt. */
  sichereStand: (
    sitzung: EditorSitzung,
    stand: Vorlage,
  ) => Promise<Ergebnis<EditorSitzung, string>>
}

/** Was ein Rückgängig/Wiederherstellen bewirkt hat. */
export type UndoWirkungVorlage =
  | { art: 'nichts_zu_tun' }
  | { art: 'angewendet'; sitzung: EditorSitzung }

/**
 * Legt den JETZIGEN Stand der Arbeitskopie als Schnappschuss ab.
 * VOR jeder Zonen- oder Parameter-Änderung aufzurufen (TK 9.13.2).
 * Ohne offene Sitzung geschieht nichts.
 */
export function merkeVorlageVorAenderung(zugang: VorlagenUndoZugang): void {
  // 1. Ohne offene Sitzung geschieht NICHTS - kein Fehler, keine Meldung. Ein Editor, der
  //    die Sitzung nicht haelt (#245), darf diesen Aufruf bedenkenlos tun.
  const sitzung = zugang.holeSitzung()
  if (sitzung === null) {
    return
  }

  // 2. Der Schnappschuss ist die Vorlage selbst, OHNE Kopie (ENTSCHIEDEN 6): Der alte Wert
  //    wird nie verändert - jedes Speichern ersetzt die Sitzung durch eine neue (#143).
  vorlagenHistorie().ablegen(sitzung.arbeitskopie)
}

/** Ob ein Rückgängig gerade angeboten werden darf (Stand vorhanden UND zur offenen Arbeitskopie). */
export function kannVorlageRueckgaengig(zugang: VorlagenUndoZugang): boolean {
  const sitzung = zugang.holeSitzung()
  if (sitzung === null) {
    return false
  }
  const ziel = vorlagenHistorie().vorschauZurueck()
  return ziel !== null && ziel.id === sitzung.arbeitsId
}

/** Gegenstück für das Wiederherstellen. */
export function kannVorlageWiederherstellen(zugang: VorlagenUndoZugang): boolean {
  const sitzung = zugang.holeSitzung()
  if (sitzung === null) {
    return false
  }
  const ziel = vorlagenHistorie().vorschauVor()
  return ziel !== null && ziel.id === sitzung.arbeitsId
}

/** Schreibt den vorherigen Schnappschuss über den Speicherweg des Editors zurück. */
export async function macheVorlageRueckgaengig(
  zugang: VorlagenUndoZugang,
): Promise<Ergebnis<UndoWirkungVorlage, string>> {
  // 1. Keine Sitzung: sofort abbrechen, der Stapel bleibt unangetastet (Fehlerpfad).
  const sitzung = zugang.holeSitzung()
  if (sitzung === null) {
    return {
      ok: false,
      fehler: {
        code: 'nicht_gefunden',
        meldung: 'Es ist keine Editor-Sitzung geoeffnet, ein Rueckgaengig ist nicht moeglich.',
      },
    }
  }

  // 2. Nichts zu tun: KEIN Fehler, kein Speichern, Stapel unveraendert.
  const ziel = vorlagenHistorie().vorschauZurueck()
  if (ziel === null) {
    return { ok: true, wert: { art: 'nichts_zu_tun' } }
  }

  // 3. Kennungspruefung (ENTSCHIEDEN 3): Ein Schnappschuss der VORIGEN Arbeitskopie waere
  //    hier nicht nur falsch, er wuerde an sichereStand scheitern - der Nutzer bekäme einen
  //    Store-Fehler ohne erkennbaren Zusammenhang. Geleert wird die GANZE Historie, weil sie
  //    in keinem Eintrag zu dieser Arbeitskopie passt. Es wird nicht gespeichert.
  if (ziel.id !== sitzung.arbeitsId) {
    leereVorlagenHistorie()
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung:
          `Der Schnappschuss gehoert zur Arbeitskopie "${ziel.id}", geoeffnet ist ` +
          `"${sitzung.arbeitsId}". Die Historie wurde geleert.`,
      },
    }
  }

  // 4+5. Der Stand vor dem Rueckgaengig ist die JETZIGE Arbeitskopie; das Ziel ist der
  //      Schnappschuss. GENAU EIN Aufruf, mit der VOLLSTAENDIGEN Vorlage.
  const aktuell: Vorlage = sitzung.arbeitskopie
  let antwort: Ergebnis<EditorSitzung, string>
  try {
    antwort = await zugang.sichereStand(sitzung, ziel)
  } catch (ursache) {
    // Fehlerpfad: ein Wurf wird gefangen, kein throw nach außen; Stapel unveraendert.
    return unbekannterFehler(ursache)
  }

  // 6. Fehlschlag: Code UNVERAENDERT zurueck, Stapel und Sitzung bleiben exakt wie vorher.
  if (!antwort.ok) {
    return antwort
  }

  // 7. Erfolg - in DIESER Reihenfolge (ENTSCHIEDEN 5): erst den Stapel vollziehen, dann die
  //    Sitzung erschieben. Ein werfendes setzeSitzung faengt dieser catch; der Stapel ist
  //    dann bereits vollzogen und bleibt es (die Arbeit ist im Store gespeichert).
  try {
    vorlagenHistorie().vollzieheZurueck(aktuell)
    zugang.setzeSitzung(antwort.wert)
  } catch (ursache) {
    return unbekannterFehler(ursache)
  }
  return { ok: true, wert: { art: 'angewendet', sitzung: antwort.wert } }
}

/** Schreibt den zuvor zurückgenommenen Schnappschuss wieder vor. */
export async function stelleVorlageWiederHer(
  zugang: VorlagenUndoZugang,
): Promise<Ergebnis<UndoWirkungVorlage, string>> {
  // Spiegelbild von macheVorlageRueckgaengig, mit vorschauVor()/vollzieheVor().
  const sitzung = zugang.holeSitzung()
  if (sitzung === null) {
    return {
      ok: false,
      fehler: {
        code: 'nicht_gefunden',
        meldung: 'Es ist keine Editor-Sitzung geoeffnet, ein Wiederherstellen ist nicht moeglich.',
      },
    }
  }

  const ziel = vorlagenHistorie().vorschauVor()
  if (ziel === null) {
    return { ok: true, wert: { art: 'nichts_zu_tun' } }
  }

  if (ziel.id !== sitzung.arbeitsId) {
    leereVorlagenHistorie()
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung:
          `Der Schnappschuss gehoert zur Arbeitskopie "${ziel.id}", geoeffnet ist ` +
          `"${sitzung.arbeitsId}". Die Historie wurde geleert.`,
      },
    }
  }

  const aktuell: Vorlage = sitzung.arbeitskopie
  let antwort: Ergebnis<EditorSitzung, string>
  try {
    antwort = await zugang.sichereStand(sitzung, ziel)
  } catch (ursache) {
    return unbekannterFehler(ursache)
  }

  if (!antwort.ok) {
    return antwort
  }

  try {
    vorlagenHistorie().vollzieheVor(aktuell)
    zugang.setzeSitzung(antwort.wert)
  } catch (ursache) {
    return unbekannterFehler(ursache)
  }
  return { ok: true, wert: { art: 'angewendet', sitzung: antwort.wert } }
}

/** Fehlerpfad: ein Wurf aus sichereStand oder setzeSitzung wird NICHT weitergereicht. */
function unbekannterFehler(ursache: unknown): Ergebnis<never, string> {
  return {
    ok: false,
    fehler: {
      code: 'unbekannter_fehler',
      meldung: ursache instanceof Error ? ursache.message : String(ursache),
    },
  }
}
