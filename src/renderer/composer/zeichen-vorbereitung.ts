/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #154.
// [composer] Zeichenvoraussetzungen vorbereiten
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
// GERUEST-PRUEFSUMME: dae831c93a4efeb7
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

import type { Project } from '../../shared/contracts/project'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { stelleSchriftenBereit } from '../template-canvas/schriften'
import { bereiteLogoVor, holeLogo } from '../template-canvas/logo-laden'
import { bereiteMotiveVor, leereMotivBestand, holeMotiv } from '../template-canvas/bild-laden'
import { holeUebersicht, ladeUebersicht } from '../vorlagen-editor/vorlagen-uebersicht'

/** Alles, was zeichnende Aufrufe des composer als Parameter brauchen. */
export interface Zeichenvoraussetzungen {
  marke: Marke
  vorlagen: readonly Vorlage[]
}

/**
 * Stellt die Zeichenvoraussetzungen für DIESES Projekt her.
 * Muss abgeschlossen sein, BEVOR ein Thumbnail (#128), eine Vorschau oder ein Render (#134)
 * entsteht. Erneut aufrufen nach jedem abgeschlossenen Import und bei jedem Projektwechsel.
 */
export async function bereiteZeichnenVor(
  projekt: Project,
): Promise<Ergebnis<Zeichenvoraussetzungen, string>> {
  // REIHENFOLGE IST TEIL DES VERTRAGS (TK 9.10.3): Schriften UND Bild vor dem Zeichnen -
  // hier heisst das: Schriften, Logo, Motive; die Vorlagen kommen DATABSICHTLICH aus
  // der gemeinsamen Vorlagen-Sicht (#155) - niemand haelt hier einen zweiten Bestand.

  const markeErgebnis = await rufeAuf<Marke>(KANAELE.config.leseMarke)
  if (!markeErgebnis.ok) {
    return { ok: false, fehler: { code: markeErgebnis.fehler.code, meldung: markeErgebnis.fehler.meldung } }
  }
  const marke = markeErgebnis.wert

  // Schriften und Logo hängen an der Marke, nicht am Projekt – auch ohne Projekt ladbar.
  await stelleSchriftenBereit()
  await bereiteLogoVor(marke)

  // Motive: JEDE Aktion, deren bildRef auf ein vorhandenes, heiles Asset zeigt. Fehlende
  // Assets entfallen still - das Zeichnen behandelt sie als Platzhalter (TK 9.10.7) und der
  // Reparatur-Modus (9.7.5) macht sie sichtbar; die Vorbereitung redet nicht doppelt über
  // dieselbe Referenz.
  const eintraege: Array<{ schluessel: string; dateiname: string }> = []
  const assets = new Map(projekt.assets.map((asset) => [asset.id, asset]))
  for (const aktion of projekt.aktionen) {
    if (aktion.bildRef === null) continue
    const asset = assets.get(aktion.bildRef)
    if (asset === undefined || asset.zustand === 'fehlt') continue
    eintraege.push({ schluessel: aktion.bildRef, dateiname: asset.dateiname })
  }

  // Erst leeren caller-seitig (verwirfMotivBestand) - hier wird der BESTAND NICHT geleert:
  // Nach einem Import soll der alte Bestand WEITERLEBEN, der neue Eintrag kommt dazu. Der
  // Vertrag sagt "Erneut aufrufen nach jedem Import", nicht "Besand verwerfen und neu".
  if (eintraege.length > 0) {
    await bereiteMotiveVor(projekt.id, eintraege)
  }

  // Die nutzbaren Vorlagen kommen aus der gemeinsamen Übersicht (#155) - DIESELBE Sicht,
  // auch der vorlagen-editor liest von hier; ein zweiter Vorlagenweg wäre die zweite Quelle.
  const uebersicht = holeUebersicht() ?? (await ladeUebersicht().then((x) => (x.ok ? x.wert : null)))
  if (uebersicht === null) {
    return { ok: false, fehler: { code: 'unbekannter_fehler', meldung: 'Die Vorlagen-Übersicht ist nicht ladbar - Vorlagen fehlen.' } }
  }
  const vorlagen = uebersicht.nutzbare.map((eintrag) => eintrag.vorlage)

  return { ok: true, wert: { marke, vorlagen } }
}

/**
 * Verwirft den Motiv-Bestand. Vor jedem Projektwechsel und nach jedem abgeschlossenen Import
 * aufzurufen; danach muss bereiteZeichnenVor erneut laufen.
 */
export function verwirfMotivBestand(): void {
  // NUR der MOTIV-Bestand: Schriften und Logo hängen an der Marke und überleben einen
  // Projektwechsel - erst das Logo-Laden (#154-Logo) hängt an einer Marke, und die wird
  // beim nächsten bereiteZeichnenVor sowieso frisch geladen; hier ins Leere zu schießen
  // würde alles verlieren, was JEDER Marke identisch weiter dient.
  leereMotivBestand()
}
