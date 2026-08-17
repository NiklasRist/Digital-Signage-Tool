// GENERIERT aus dem Signaturblock von Issue #143.
// [vorlagen-editor] Auf einer Arbeitskopie arbeiten und den Parent durchgehend anzeigen
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
// GERUEST-PRUEFSUMME: bfaaf352bb24ca5d
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

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage, Zone } from '../../shared/contracts/vorlage'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/**
 * Der EINE Text, mit dem der Editor begründet, warum „überarbeiten" gesperrt ist.
 * Exportiert, weil #149 denselben Text als Ersatz braucht, wenn `ueberarbeitenGrund`
 * ausnahmsweise `null` ist – zwei Formulierungen für dieselbe Sperre wären zwei Wahrheiten.
 */
export const GRUND_PARENT_EINGEBAUT =
  'Diese Vorlage ist mitgeliefert und bleibt unverändert. Speichern ist nur als neue eigenständige Vorlage möglich.'

/** Der Kopf des Editors: die Arbeitskopie und alles, was über ihren Parent angezeigt wird. */
export interface EditorSitzung {
  arbeitsId: string             // = arbeitskopie.id; Adresse für alle Store-Aufrufe
  arbeitskopie: Vorlage         // parent !== null; DAS ist der bearbeitete Datensatz
  parentId: string              // = arbeitskopie.parent (nie null in einer Sitzung)
  parentName: string            // Anzeigename des Parents – für „Arbeitskopie von <Name>"
  parentEingebaut: boolean      // aus dem Parent-Datensatz, NICHT aus der Arbeitskopie
  ueberarbeitenErlaubt: boolean // === !parentEingebaut
  ueberarbeitenGrund: string | null  // GRUND_PARENT_EINGEBAUT, wenn nicht erlaubt; sonst null
  festeZonenSoll: readonly Zone[]    // die festen Zonen, wie sie BEIM ÖFFNEN vorlagen
}

/**
 * Öffnet `vorlagenId` zur Bearbeitung und baut daraus die Sitzung.
 * `vorlagenId` ist IMMER die ID einer nutzbaren Vorlage (parent === null) – nie die einer
 * Arbeitskopie. Existiert bereits eine Arbeitskopie zu dieser Vorlage, setzt der Store sie fort.
 */
export async function starteBearbeitung(
  vorlagenId: string,
): Promise<Ergebnis<EditorSitzung, string>> {
  // 1. vorlagenId pruefen: nicht-leerer String. Sonst ungueltige_eingabe, OHNE jeden Aufruf.
  if (vorlagenId === '') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Die vorlagenId darf nicht leer sein.',
      },
    }
  }

  try {
    // 2. listeVorlagen VOR oeffneZurBearbeitung - die Arbeitskopie ist ein geschriebener
    //    Datensatz; erst oeffnen und dann feststellen, dass man den Parent nicht kennt,
    //    hinterliesse eine Arbeitskopie ohne anzeigbaren Parent (#99 liefert nur nutzbare).
    const liste = await rufeAuf<Vorlage[], string>(KANAELE.vorlagen.listeVorlagen)
    if (!liste.ok) {
      // Fehler des Stores UNVERAENDERT durchreichen; oeffneZurBearbeitung wird nicht gerufen.
      return liste
    }

    // 3. Parent in der Liste suchen - Name und eingebaut stammen aus dem PARENT-Eintrag,
    //    nie aus der zurueckgegebenen Arbeitskopie (#101 setzt eingebaut dort immer auf false).
    const parent = liste.wert.find((eintrag) => eintrag.id === vorlagenId)
    if (parent === undefined) {
      // nicht_gefunden, und oeffneZurBearbeitung wird gar nicht erst gerufen.
      return {
        ok: false,
        fehler: {
          code: 'nicht_gefunden',
          meldung: `Die Vorlage "${vorlagenId}" ist nicht im Bestand; keine Arbeitskopie wird angelegt.`,
        },
      }
    }

    // 4. Arbeitskopie oeffnen bzw. fortsetzen.
    const arbeitskopieErgebnis = await rufeAuf<Vorlage, string>(
      KANAELE.vorlagen.oeffneZurBearbeitung,
      { id: vorlagenId },
    )
    if (!arbeitskopieErgebnis.ok) {
      // Fehler des Stores UNVERAENDERT durchreichen; keine Sitzung entsteht.
      return arbeitskopieErgebnis
    }
    const arbeitskopie = arbeitskopieErgebnis.wert

    // 6. Store-Vertrag pruefen: Die Arbeitskopie MUSS auf vorlagenId zeigen. Weicht sie ab,
    //    zeigt die Sitzung einen falschen Parent an - unbekannter_fehler mit beiden IDs.
    if (arbeitskopie.parent !== vorlagenId) {
      return {
        ok: false,
        fehler: {
          code: 'unbekannter_fehler',
          meldung: `Store-Vertrag verletzt: Die Arbeitskopie zeigt auf "${arbeitskopie.parent ?? 'null'}", erwartet wurde "${vorlagenId}".`,
        },
      }
    }

    // 5. Sitzung bauen. parentEingebaut kommt aus dem PARENT (#101 setzt eingebaut der
    //    Arbeitskopie immer auf false); festeZonenSoll ist die eingefrorene Momentaufnahme
    //    der festen Zonen der gerade zurueckgegebenen Arbeitskopie.
    return {
      ok: true,
      wert: {
        arbeitsId: arbeitskopie.id,
        arbeitskopie,
        parentId: vorlagenId,
        parentName: parent.name,
        parentEingebaut: parent.eingebaut,
        ueberarbeitenErlaubt: !parent.eingebaut,
        ueberarbeitenGrund: parent.eingebaut ? GRUND_PARENT_EINGEBAUT : null,
        festeZonenSoll: arbeitskopie.zonen.filter((zone) => zone.rolle === 'fest'),
      },
    }
  } catch (ursache) {
    // `rufeAuf` wirft, wenn die Preload-Bruecke fehlt (#24) - kein throw ueber die Grenze.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }
}

/**
 * Sichert den aktuellen Bearbeitungsstand in die Arbeitskopie (Auto-Speichern).
 * Liefert bei Erfolg die Sitzung mit dem vom Store zurückgegebenen – also geprüften und
 * getrimmten – Stand in `arbeitskopie`.
 */
export async function sichereStand(
  sitzung: EditorSitzung,
  stand: Vorlage,
): Promise<Ergebnis<EditorSitzung, string>> {
  // 1. stand.id MUSS sitzung.arbeitsId sein - Speichern unter fremder ID wuerde eine andere
  //    Arbeitskopie ueberschreiben. Kein Aufruf, sitzung bleibt unveraendert.
  if (stand.id !== sitzung.arbeitsId) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: `Der Bearbeitungsstand gehoert zu "${stand.id}", die Sitzung arbeitet auf "${sitzung.arbeitsId}".`,
      },
    }
  }

  try {
    // 2. Auto-Speichern - ausschliesslich mit sitzung.arbeitsId, niemals mit dem Parent
    //    (Verbot); das Entprellen (4000 ms) sitzt IM MAIN, hier entsteht KEIN Timer.
    const ergebnis = await rufeAuf<Vorlage, string>(
      KANAELE.vorlagen.speichereArbeitskopie,
      { arbeitsId: sitzung.arbeitsId, vorlage: stand },
    )
    if (!ergebnis.ok) {
      // Fehler des Stores UNVERAENDERT durchreichen; sitzung bleibt unveraendert. Eine
      // verbrauchte Sitzung (nach #149-Abschluss) scheitert hier zwangslaeufig und wird
      // NICHT repariert - kein Neuanlegen, kein Ersatz-Eintrag, kein Umbiegen.
      return ergebnis
    }

    // 3. Neue Sitzung: alle Felder uebernehmen, arbeitskopie = der ZURUECKGEGEBENE Stand
    //    (der Store trimmt und prueft). festeZonenSoll bleibt UNVERAENDERT uebernommen -
    //    nie aus dem neuen Stand neu bilden, sonst wuerde ein durchgerutschter Eingriff an
    //    einer festen Zone beim naechsten Speichern zum neuen Soll.
    return {
      ok: true,
      wert: {
        ...sitzung,
        arbeitskopie: ergebnis.wert,
      },
    }
  } catch (ursache) {
    // `rufeAuf` wirft, wenn die Preload-Bruecke fehlt (#24) - kein throw ueber die Grenze.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }
}
