// GENERIERT aus dem Signaturblock von Issue #109.
// [vorlagen-store] Die Vorlagen-Kanäle verdrahten
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
// GERUEST-PRUEFSUMME: 9fee94138a61e545

import { KANAELE } from '../../shared/contracts/kanaele' // #25
import { abgelehnt, istGefuellterText, istObjekt, ohneNutzlast } from '../ipc-gateway/nutzlast-pruefer' // #332
import { registriereHandler } from '../ipc-gateway/registriere-handler' // #23

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage, VorlagenArt } from '../../shared/contracts/vorlage'
import { alsEigenstaendige } from './als-eigenstaendige' // #104
import { erstelleVorlage } from './erstelle-vorlage' // #100
import { listeArbeitskopien, listeVorlagen } from './liste' // #99
import { löscheVorlage } from './loesche-vorlage' // #107
import { oeffneZurBearbeitung } from './oeffne-zur-bearbeitung' // #101
import { speichereArbeitskopie } from './speichere-arbeitskopie' // #102
import { uebernehmeInParent } from './uebernehme-in-parent' // #103
import { verwerfeArbeitskopie } from './verwerfe-arbeitskopie' // #105

// Fremde Aufrufe - die Signaturen sind gegen die GEBAUTEN Dateien geprueft und
// decken sich mit dem Issue:
//   #99: listeVorlagen(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>>
//        listeArbeitskopien(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>>
//   #100: erstelleVorlage(art: VorlagenArt, höhe: number | null, name: string)
//          : Promise<Ergebnis<Vorlage, VorlagenFehlercode>>
//   #101: oeffneZurBearbeitung(id: string): Promise<Ergebnis<Vorlage, VorlagenFehlercode>>
//   #102: speichereArbeitskopie(arbeitsId: string, vorlage: Vorlage)
//          : Promise<Ergebnis<Vorlage, VorlagenFehlercode>>
//   #103: uebernehmeInParent(arbeitsId: string): Promise<Ergebnis<Vorlage, VorlagenFehlercode>>
//   #104: alsEigenstaendige(arbeitsId: string, name: string)
//          : Promise<Ergebnis<Vorlage, VorlagenFehlercode>>
//   #105: verwerfeArbeitskopie(arbeitsId: string): Promise<Ergebnis<void, VorlagenFehlercode>>
//   #107: löscheVorlage(id: string): Promise<Ergebnis<void, VorlagenFehlercode>>

/**
 * Die EINE Stelle, an der aus `unknown` etwas Getipptes wird - gleiche Bauform wie in
 * `project-store-verdrahtung.ts` (#76) und `config-store-verdrahtung.ts` (#77).
 *
 * `registriereHandler` (#23) reicht der Fachoperation genau das herein, was der Validierer
 * als `wert` zurueckgegeben hat; seine Signatur schreibt aber `validierteNutzlast: unknown`,
 * der Typ geht auf dem Weg verloren. `pruefe` und `rufe` sind ueber `W` aneinander gebunden:
 * Ein Validierer, der etwas anderes liefert als die Operation erwartet, uebersetzt nicht.
 */
function meldeAn<W, T, F extends string>(
  kanal: string,
  pruefe: (nutzlast: unknown) => Ergebnis<W, 'ungueltige_eingabe'>,
  rufe: (geprueft: W) => Promise<Ergebnis<T, F>>,
): void {
  registriereHandler<T, F>(kanal, pruefe, (validierteNutzlast) =>
    // SAFETY: pruefe hat die Nutzlast unmittelbar zuvor validiert und in die Huelle
    // gelegt; der Cast benennt diese belegte Form, damit rufe den geprueften Typ sieht.
    rufe(validierteNutzlast as W),
  )
}

/** "endliche Zahl" - `Number.isFinite` und NICHT `typeof === 'number'` (gleiche Regel wie #76). */
function istEndlicheZahl(wert: unknown): wert is number {
  return typeof wert === 'number' && Number.isFinite(wert)
}

/** Die drei zulaessigen Vorlagenarten - Laufzeitliste, gleiche wie in #100. */
const ARTEN: readonly VorlagenArt[] = ['vollflaeche', 'split', 'einblendung']

/** Geprueft wird die FORM, nicht die Fachlichkeit: ist `art` genau einer der drei Werte? */
function istArt(wert: unknown): wert is VorlagenArt {
  // SAFETY: ARTEN enthaelt nur gueltige Werte; der Cast macht das Einschliessen als
  // Vergleich zur Laufzeit moeglich - includes prueft den Wert echt.
  return ARTEN.includes(wert as VorlagenArt)
}

export function verdrahteVorlagenIPC(): void {
  // Alle neun Namen kommen aus der Registry (#25); in dieser Datei steht kein einziger
  // Kanalname als Zeichenkette - auch nicht in einer Fehlermeldung (Grep-Probe der DoD).
  //
  // KEIN Schutz gegen einen zweiten Aufruf: #3 ruft genau einmal, und `ipcMain.handle` wirft
  // bei einer doppelten Anmeldung von selbst (#23). KEIN Ereignis, keine Fensterreferenz,
  // kein Zustand, keine Fachlogik - diese Datei validiert die Form und ruft die Operation.

  // Die beiden Listen-Kanaele tragen KEINE Nutzlast. Eine trotzdem uebergebene wird
  // ignoriert (`ohneNutzlast`), nie als Fehler gemeldet und nie an die Operation
  // weitergereicht - die nimmt kein Argument.
  meldeAn(KANAELE.vorlagen.listeVorlagen, ohneNutzlast, () => listeVorlagen())
  meldeAn(KANAELE.vorlagen.listeArbeitskopien, ohneNutzlast, () => listeArbeitskopien())

  // erstelleVorlage - Nutzlast { art, höhe?, name }. `höhe` darf fehlen (= null), `null`
  // oder eine ENDLICHE Zahl sein; den Wertebereich (> 0, < 1080) und die Kopplung an `art`
  // prueft #100. Ein numerischer String wird abgelehnt - nicht umgewandelt ("keine
  // Nutzlast-Reparatur", STOPP-Block).
  meldeAn(
    KANAELE.vorlagen.erstelleVorlage,
    (nutzlast: unknown): Ergebnis<{ art: VorlagenArt; höhe: number | null; name: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('erstelleVorlage erwartet ein Objekt { art, höhe?, name }.')
      }
      const art = nutzlast.art
      if (!istArt(art)) {
        return abgelehnt(
          `erstelleVorlage braucht art aus ${ARTEN.join(', ')} (uebergeben: ${String(art)}).`,
        )
      }
      const name = nutzlast.name
      if (!istGefuellterText(name)) {
        return abgelehnt('erstelleVorlage braucht einen nicht leeren name.')
      }
      const hoehe = nutzlast.höhe
      if (hoehe !== undefined && hoehe !== null && !istEndlicheZahl(hoehe)) {
        return abgelehnt(
          `erstelleVorlage braucht eine endliche höhe oder null (uebergeben: ${String(hoehe)}).`,
        )
      }
      // Fehlt `höhe`, gilt es als null - die EINE festgelegte Vorbelegung des Issues,
      // kein Zurechtbiegen (die Renderer-Seite darf das Feld bei vollflaeche weglassen).
      return { ok: true, wert: { art, höhe: hoehe === undefined ? null : hoehe, name } }
    },
    ({ art, höhe, name }) => erstelleVorlage(art, höhe, name),
  )

  meldeAn(
    KANAELE.vorlagen.oeffneZurBearbeitung,
    (nutzlast: unknown): Ergebnis<{ id: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('oeffneZurBearbeitung erwartet ein Objekt { id }.')
      const id = nutzlast.id
      if (!istGefuellterText(id)) return abgelehnt('oeffneZurBearbeitung braucht eine nicht leere id.')
      return { ok: true, wert: { id } }
    },
    ({ id }) => oeffneZurBearbeitung(id),
  )

  // speichereArbeitskopie - die Vorlage wird hier NUR als Objekt geprueft (nicht null,
  // kein Array); die feldweise Pruefung (Zonen, feste Zonen, Flaeche) macht #102.
  meldeAn(
    KANAELE.vorlagen.speichereArbeitskopie,
    (
      nutzlast: unknown,
    ): Ergebnis<{ arbeitsId: string; vorlage: Vorlage }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('speichereArbeitskopie erwartet ein Objekt { arbeitsId, vorlage }.')
      }
      const arbeitsId = nutzlast.arbeitsId
      if (!istGefuellterText(arbeitsId)) {
        return abgelehnt('speichereArbeitskopie braucht eine nicht leere arbeitsId.')
      }
      const vorlage = nutzlast.vorlage
      if (!istObjekt(vorlage)) {
        return abgelehnt('speichereArbeitskopie braucht eine Vorlage als Objekt.')
      }
      // NUR die Form ist hier geprueft; der Typwechsel ist die eine Cast-Stelle dieser
      // Datei, gedeckt durch #102, das die Fachlichkeit prueft.
      // SAFETY: istObjekt hat die Objektform belegt; die Fachlichkeit prueft #102
      // (Ergebnis-Huelle statt Wurf) - die Kette entkommt dem Typ, nicht der Pruefung.
      return { ok: true, wert: { arbeitsId, vorlage: vorlage as unknown as Vorlage } }
    },
    ({ arbeitsId, vorlage }) => speichereArbeitskopie(arbeitsId, vorlage),
  )

  meldeAn(
    KANAELE.vorlagen.uebernehmeInParent,
    (nutzlast: unknown): Ergebnis<{ arbeitsId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('uebernehmeInParent erwartet ein Objekt { arbeitsId }.')
      }
      const arbeitsId = nutzlast.arbeitsId
      if (!istGefuellterText(arbeitsId)) {
        return abgelehnt('uebernehmeInParent braucht eine nicht leere arbeitsId.')
      }
      return { ok: true, wert: { arbeitsId } }
    },
    ({ arbeitsId }) => uebernehmeInParent(arbeitsId),
  )

  meldeAn(
    KANAELE.vorlagen.alsEigenstaendige,
    (
      nutzlast: unknown,
    ): Ergebnis<{ arbeitsId: string; name: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('alsEigenstaendige erwartet ein Objekt { arbeitsId, name }.')
      }
      const arbeitsId = nutzlast.arbeitsId
      const name = nutzlast.name
      if (!istGefuellterText(arbeitsId)) {
        return abgelehnt('alsEigenstaendige braucht eine nicht leere arbeitsId.')
      }
      if (!istGefuellterText(name)) {
        return abgelehnt('alsEigenstaendige braucht einen nicht leeren name.')
      }
      return { ok: true, wert: { arbeitsId, name } }
    },
    ({ arbeitsId, name }) => alsEigenstaendige(arbeitsId, name),
  )

  meldeAn(
    KANAELE.vorlagen.verwerfeArbeitskopie,
    (nutzlast: unknown): Ergebnis<{ arbeitsId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('verwerfeArbeitskopie erwartet ein Objekt { arbeitsId }.')
      }
      const arbeitsId = nutzlast.arbeitsId
      if (!istGefuellterText(arbeitsId)) {
        return abgelehnt('verwerfeArbeitskopie braucht eine nicht leere arbeitsId.')
      }
      return { ok: true, wert: { arbeitsId } }
    },
    ({ arbeitsId }) => verwerfeArbeitskopie(arbeitsId),
  )

  meldeAn(
    KANAELE.vorlagen.löscheVorlage,
    (nutzlast: unknown): Ergebnis<{ id: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('löscheVorlage erwartet ein Objekt { id }.')
      const id = nutzlast.id
      if (!istGefuellterText(id)) return abgelehnt('löscheVorlage braucht eine nicht leere id.')
      return { ok: true, wert: { id } }
    },
    ({ id }) => löscheVorlage(id),
  )
}
