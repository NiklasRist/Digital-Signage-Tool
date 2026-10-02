/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #237.
// [project-store] Bearbeitungsstand zurückschreiben
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
// GERUEST-PRUEFSUMME: 08a96f6a7fc135a5
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

import type { Project, Bearbeitungsstand, Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { mitD1Lock } from './d1-lock'
import { holeAktivesProjekt } from './aktives-projekt'
import { planeAutoSpeicherung } from './auto-speichern'
import type { ProjectStoreFehlercode } from './assets'
import { ladeBestand } from '../vorlagen-store/schreibe-vorlagen'

/**
 * Ersetzt `aktionen` UND `liste` des geladenen Projekts ALS GANZES durch den Schnappschuss –
 * unter dem D1-Lock und VOLL validiert. Der einzige Rueckschreib-Weg fuer Undo/Redo.
 *
 * `assets` und `letzterAusgabeName` bleiben UNANGETASTET (TK 9.5.2, ENTSCHIEDEN 3).
 *
 * ZUR SIGNATUR (gemeldet, nicht stillschweigend): Die Hülle ist wie im übrigen
 * project-store auf `Ergebnis<Project, ProjectStoreFehlercode>` verengt - dieselbe
 * Richtung wie setze-trim (#43): `kein_projekt` ist hier ein REGULÄRER Code (TK 9.5.2),
 * und die generische Einparametrigkeit des Gerüsts hätte ihn ausgesperrt. Widerstreit
 * mit dem Issue-Text möglich - gemeldet an den Auftraggeber.
 */
export async function setzeBearbeitungsstand(
  stand: Bearbeitungsstand,
): Promise<Ergebnis<Project, ProjectStoreFehlercode>> {
  // Ein Halbzustand waere schlimmer als keine Ruecknahme; der Schnappschuss ist KEINE
  // Vertrauensfrage (TK 9.5.2). Vorpruefungen der FORM, bevor irgendetwas angewendet wird.
  if (typeof stand !== 'object' || stand === null) {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'setzeBearbeitungsstand braucht einen Stand als Objekt.' } }
  }
  if (!Array.isArray(stand.aktionen) || !Array.isArray(stand.liste)) {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'aktionen und liste muessen Arrays sein.' } }
  }

  // Die Vorlagen-Bibliothek (bandVorlageId-Ziel) - app-weit, kein D1-Lock, rein lesend.
  const vorlagen = await ladeBestand()
  if (!vorlagen.ok) {
    // Der Schreibfehler, nicht der fachliche Code der Quelle, beschreibt hier die
    // Eigenheit: Der Bestand ist nicht lesbar, also kann kein Stand geprueft werden.
    return {
      ok: false,
      fehler: {
        code: 'speicher_fehler',
        meldung: `Der Vorlagen-Bestand ist nicht lesbar: ${vorlagen.fehler.meldung}`,
      },
    }
  }

  const projekt = holeAktivesProjekt()
  if (projekt === null) {
    return {
      ok: false,
      fehler: {
        code: 'kein_projekt',
        meldung: 'Es ist kein Projekt geoeffnet; ein Bearbeitungsstand ohne offenes Projekt ist nicht einspielbar.',
      },
    }
  }

  const fehler = pruefeStandVollstaendig(stand, projekt, vorlagen.wert)
  if (fehler !== null) return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: fehler } }

  return mitD1Lock(async (): Promise<Ergebnis<Project, ProjectStoreFehlercode>> => {
    // NOCHMAL under dem Lock: Zwischen Vorpruefung und Lock kann der aktive Stand
    // gewechselt haben. Ein Halbzustand darf nicht entstehen (TK 9.5.2).
    const sicht = holeAktivesProjekt()
    if (sicht === null) {
      return { ok: false, fehler: { code: 'kein_projekt', meldung: 'Kein Projekt offen (während des Schreibens).' } }
    }
    const nochmal = pruefeStandVollstaendig(stand, sicht, vorlagen.wert)
    if (nochmal !== null) {
      return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: nochmal } }
    }

    // Ersetzen als GANZES (seit v3.18 auch `standardSegmentdauer` als drittes Feld im
    // Schnappschuss - TK 9.5.2/9.13.2); assets/letzterAusgabeName/schemaVersion/id/name bleiben.
    sicht.aktionen = stand.aktionen
    sicht.liste = [...stand.liste]
    sicht.standardSegmentdauer = stand.standardSegmentdauer

    // Entprelltes Speichern, keine Sofortspeicherung: Instant-Operation, kein Auftrag.
    planeAutoSpeicherung(sicht)

    return { ok: true, wert: sicht }
  })
}

/** Prueft JEDE Referenz und JEDE Dauer (TK 9.5.2, "Volle Validierung"). Rein, wirft nie. */
function pruefeStandVollstaendig(
  stand: Bearbeitungsstand,
  projekt: Project,
  vorlagen: ReadonlyArray<{ id: string }>,
): string | null {
  // Drittes Feld (v3.18): derselbe Bereich wie setzeDauer (10-45 s, TK 9.11.4) - eine
  // Obergrenze aus einer anderen Quelle waere die zweite Wahrheit neben dem Main.
  if (
    typeof stand.standardSegmentdauer !== 'number' ||
    !Number.isFinite(stand.standardSegmentdauer) ||
    stand.standardSegmentdauer < 10 ||
    stand.standardSegmentdauer > 45
  ) {
    return 'Die projektweite Standarddauer im Schnappschuss muss im Bereich 10-45 s liegen.'
  }

  const aktionsIds = new Set<string>()
  for (const aktion of stand.aktionen) {
    if (aktion === null || typeof aktion !== 'object') {
      return 'Eine Aktion im Schnappschuss ist kein Objekt.'
    }
    if (typeof aktion.id !== 'string' || aktion.id === '') {
      return 'Eine Aktion im Schnappschuss traegt keine id.'
    }
    if (aktionsIds.has(aktion.id)) {
      return `Die Aktions-Id ${aktion.id} ist mehrfach belegt; die Kennungen muessen eindeutig sein.`
    }
    aktionsIds.add(aktion.id)
  }

  const assetIds = new Map(projekt.assets.map((asset) => [asset.id, asset]))

  const elementIds = new Set<string>()
  for (const element of stand.liste) {
    const grund = pruefeElement(element, elementIds, aktionsIds, assetIds, vorlagen)
    if (grund !== null) return grund
  }
  return null
}

interface MinimalAsset { id: string; typ: string; dauer: number | null }
type MinimalAktion = { id: string }

function pruefeElement(
  element: Listenelement,
  elementIds: Set<string>,
  aktionsIds: ReadonlySet<string>,
  assetIds: ReadonlyMap<string, MinimalAsset>,
  vorlagen: ReadonlyArray<{ id: string }>,
): string | null {
  if (element === null || typeof element !== 'object') {
    return 'Ein Listenelement im Schnappschuss ist kein Objekt.'
  }
  if (typeof element.id !== 'string' || element.id === '') {
    return 'Ein Listenelement traegt keine id.'
  }
  if (elementIds.has(element.id)) {
    return `Die Element-Id ${element.id} ist mehrfach belegt; die Kennungen muessen eindeutig sein.`
  }
  elementIds.add(element.id)

  if (element.art !== 'video' && element.art !== 'segment') {
    return `Unbekannte Elementart ${JSON.stringify(element.art)}; zulaessig sind 'video' und 'segment'.`
  }

  if (typeof element.ref !== 'string' || element.ref === '') {
    return `Das Element ${element.id} traegt keine Referenz.`
  }

  if (element.art === 'segment') {
    if (!aktionsIds.has(element.ref)) {
      return `Das Segment ${element.id} verweist auf die Aktion ${element.ref}, die im Schnappschuss nicht existiert.`
    }
    if (typeof element.dauer !== 'number' || !Number.isFinite(element.dauer) || element.dauer < 10 || element.dauer > 45) {
      return `Die Dauer des Segments ${element.id} muss im Bereich 10-45 s liegen.`
    }
    if (element.trimStart !== null || element.trimEnde !== null) {
      return `Das Segment ${element.id} darf keine Trim-Grenzen tragen (TK 9.11.3).`
    }
    if (element.einblendung !== null) {
      return `Das Segment ${element.id} darf keine Einblendung tragen (TK 9.11.3).`
    }
    return null
  }

  // art: 'video'
  const asset = assetIds.get(element.ref)
  if (asset === undefined) {
    return `Das Video ${element.id} verweist auf das Asset ${element.ref}, das es in diesem Projekt nicht gibt.`
  }
  if (asset.typ !== 'video') {
    return `Das Video ${element.id} verweist auf das Asset ${element.ref} vom Typ ${asset.typ}; erwartet ist 'video'.`
  }
  if (
    typeof element.trimStart !== 'number' ||
    !Number.isFinite(element.trimStart) ||
    typeof element.trimEnde !== 'number' ||
    !Number.isFinite(element.trimEnde) ||
    element.trimStart < 0 ||
    element.trimStart >= element.trimEnde ||
    (asset.dauer !== null && element.trimEnde > asset.dauer)
  ) {
    return `Die Trim-Grenzen des Videos ${element.id} verletzen 0 <= start < ende <= Quelllaenge.`
  }

  if (element.einblendung === null) return null

  const einblendung = element.einblendung
  if (typeof einblendung.bandVorlageId !== 'string' || einblendung.bandVorlageId === '') {
    return `Das Video ${element.id} traegt eine Einblendung ohne bandVorlageId.`
  }
  if (!vorlagen.some((vorlage) => vorlage.id === einblendung.bandVorlageId)) {
    return `Die Band-Vorlage ${einblendung.bandVorlageId} von ${element.id} existiert nicht in der Vorlagen-Bibliothek.`
  }
  for (const abschnitt of einblendung.abschnitte) {
    if (typeof abschnitt.aktionRef !== 'string' || !aktionsIds.has(abschnitt.aktionRef)) {
      return `Ein Band-Abschnitt von ${element.id} verweist auf die Aktion ${String(abschnitt.aktionRef)}, die es im Schnappschuss nicht gibt.`
    }
    if (typeof abschnitt.dauer !== 'number' || !Number.isFinite(abschnitt.dauer) || abschnitt.dauer <= 0) {
      return `Ein Band-Abschnitt von ${element.id} hat keine endliche Dauer größer 0.`
    }
  }
  return null
}
