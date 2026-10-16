/* eslint-disable @typescript-eslint/no-unused-vars */
// [composer] Zeichenvoraussetzungen vorbereiten

import type { Project } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { stelleMarkeBereit } from '../gemeinsam/marken-bereitstellung'
import { stelleSchriftenBereit } from '../template-canvas/schriften'
import { bereiteMotiveVor, leereMotivBestand, holeMotiv } from '../template-canvas/bild-laden'
import { holeUebersicht, ladeUebersicht } from '../vorlagen-editor/vorlagen-uebersicht'

/** Alles, was zeichnende Aufrufe des composer als Parameter brauchen.
 *  Trägt seit #313 KEIN Feld `marke` mehr – die Marke kommt je Aktion aus #312
 *  (`holeBereiteMarke`). `voraussetzungen !== null` heißt: ALLE Marken des Projekts
 *  stehen bereit (zusätzlich zu Schriften/Motiven, TK 9.10.3 Punkt 3). */
export interface Zeichenvoraussetzungen {
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
  // REIHENFOLGE IST TEIL DES VERTRAGS (#313, TK 9.10.3): Vorlagen, Schriften,
  // Marken, Motive - alles VOR dem ersten Zeichen; die Marken brauchen
  // `projekt.aktionen` (steht sofort zur Verfuegung), ihr Fehlschlag soll den
  // teureren Motiv-Lauf nicht erst ausloesen.

  // Kein `config:leseMarke` mehr: die Operation ist aus der Operationstabelle
  // des config-store entfallen (TK 9.5.6); kein Ersatzaufruf, kein Rest.
  // Die nutzbaren Vorlagen kommen aus der gemeinsamen Übersicht (#155) - DIESELBE Sicht,
  // auch der vorlagen-editor liest von hier; ein zweiter Vorlagenweg wäre die zweite Quelle.
  const uebersicht = holeUebersicht() ?? (await ladeUebersicht().then((x) => (x.ok ? x.wert : null)))
  if (uebersicht === null) {
    return { ok: false, fehler: { code: 'unbekannter_fehler', meldung: 'Die Vorlagen-Übersicht ist nicht ladbar - Vorlagen fehlen.' } }
  }
  const vorlagen = uebersicht.nutzbare.map((eintrag) => eintrag.vorlage)

  // Schriften: die VIER gebuendelten Schriften haengen an keiner Marke (#291/#110).
  // #119 wirft einen Ladeproblem-Wurf; hier gefangen und auf den EINEN Code gebracht -
  // dieses Modul wirft nie Takes (Ergebnis-Huelle, TK 9.1.1).
  try {
    await stelleSchriftenBereit()
  } catch (ursache) {
    return {
      ok: false,
      fehler: {
        code: 'schriften_fehlen',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }

  // Marken bereitstellen (#312): ALLE `aktion.markeId` aus `projekt.aktionen` - nicht
  // nur die der Liste - plus `projekt.standardMarkeId` (die Marke des RAHMENS, TK 9.15.4),
  // entdoppelt. Alles-oder-nichts: Eine unmoegliche Marke laesst den GANZEN Aufruf
  // scheitern, mit UNVERAENDETEM Code - halb bereit gibt es nicht darstellbar.
  const markeIds = new Set<string>(projekt.aktionen.map((aktion) => aktion.markeId))
  markeIds.add(projekt.standardMarkeId)
  for (const markeId of markeIds) {
    const bereit = await stelleMarkeBereit(markeId)
    if (!bereit.ok) {
      return { ok: false, fehler: { code: bereit.fehler.code, meldung: bereit.fehler.meldung } }
    }
  }

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
  // Erst leeren caller-seitig (verwirfMotivBestand) - hier wird der BESTAND NICHT geleert:
  // Nach einem Import soll der alte Bestand WEITERLEBEN, der neue Eintrag kommt dazu. Der
  // Vertrag sagt "Erneut aufrufen nach jedem Import", nicht "Besand verwerfen und neu".
  if (eintraege.length > 0) {
    await bereiteMotiveVor(projekt.id, eintraege)
  }

  return { ok: true, wert: { vorlagen } }
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
