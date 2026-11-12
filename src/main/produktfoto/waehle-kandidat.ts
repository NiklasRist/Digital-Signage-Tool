// [produktfoto] Den gewaehlten Kandidaten als Asset uebernehmen (FA-27 / TK 9.19.5)
//
// „Das gewaehlte Bild geht durch die bestehende Import-Pipeline nach
// projects/<id>/media/<uuid>.<ext> - atomar, mit denselben Pruefungen wie jeder andere
// Import. Es wird ein Asset wie jedes andere."
//
// DESHALB: staging/.part -> fsync+Rename ueber `macheEndgueltig`, Maße ueber `ffprobe`
// und `werteMetadatenAus`, Eintrag ueber `fuegeAssetHinzu` (Lock + Sofort-Flush). Diese
// Datei baut KEINEN zweiten Weg und KEINE zweite Metadatenquelle.

import fs from 'node:fs/promises'
import path from 'node:path'

import { erzeugeId } from '../../shared/contracts/id'
import { normalisiereProduktUrl } from '../../shared/produkt-url'
import { entferneDatei } from '../media-service/datei-entfernen'
import { leseRohMetadaten } from '../media-service/ffprobe'
import { PART_ENDUNG, STAGING_ORDNER, macheEndgueltig } from '../media-service/import-datei'
import { werteMetadatenAus } from '../media-service/metadaten'
import { fuegeAssetHinzu } from '../project-store/assets'
import { loeseAssetPfad, medienOrdner } from '../project-store/pfade'
import { endungFuerBildTyp } from './formate'
import { holeAbruf, verwirfAbruf } from './kandidaten-speicher'

import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { ProduktWahlErgebnis } from '../../shared/contracts/produktabruf'
import type { ProjectStoreFehlercode } from '../project-store/assets'

export type WahlFehlercode =
  | 'nicht_gefunden'
  | 'ungueltige_eingabe'
  | 'probe_fehler'
  | 'kopier_fehler'
  | ProjectStoreFehlercode

/**
 * Uebernimmt genau EINEN Kandidaten. Kennt den Abruf nicht (mehr), ist der Fehler
 * `nicht_gefunden` - der Abruf ist nach 10 Minuten verfallen oder wurde verworfen.
 */
export async function waehleKandidat(
  abrufId: string,
  kandidat: number,
): Promise<Ergebnis<ProduktWahlErgebnis, WahlFehlercode>> {
  if (typeof abrufId !== 'string' || abrufId.trim() === '') {
    return fehler('ungueltige_eingabe', 'Es wurde keine brauchbare Abruf-ID übergeben.')
  }
  if (!Number.isInteger(kandidat) || kandidat < 0) {
    return fehler('ungueltige_eingabe', 'Der Kandidat muss eine ganze Zahl ab 0 sein.')
  }

  const abruf = holeAbruf(abrufId)
  if (abruf === null) {
    return fehler(
      'nicht_gefunden',
      'Dieser Abruf ist nicht mehr vorhanden (abgelaufen oder verworfen); bitte erneut abrufen.',
    )
  }
  const gewaehlt = abruf.kandidaten[kandidat]
  if (gewaehlt === undefined) {
    return fehler('nicht_gefunden', 'Diesen Kandidaten gibt es in diesem Abruf nicht.')
  }

  const endung = endungFuerBildTyp(gewaehlt.typ)
  if (endung === null) {
    // Kann nur passieren, wenn ein Kandidat mit unbekanntem Typ abgelegt wurde - der
    // Abruf laesst das nicht zu. Der Code bleibt trotzdem der generische.
    return fehler('ungueltige_eingabe', 'Der Kandidat hat kein unterstütztes Bildformat.')
  }

  const assetId = erzeugeId()
  const dateiname = `${assetId}.${endung}`
  const ordner = medienOrdner(abruf.projektId)
  const endPfad = loeseAssetPfad(abruf.projektId, dateiname)
  if (!endPfad.ok) {
    return fehler(endPfad.fehler.code, endPfad.fehler.meldung)
  }

  const staging = path.join(ordner, STAGING_ORDNER)
  const partPfad = path.join(staging, `${dateiname}${PART_ENDUNG}`)

  // Schritt 1: Bytes in die .part-Datei. Der Ordner existiert beim ersten Abruf noch
  // nicht - `mkdir` ist billig und idempotent.
  try {
    await fs.mkdir(staging, { recursive: true })
    await fs.writeFile(partPfad, gewaehlt.bytes)
  } catch {
    return fehler('kopier_fehler', 'Das Bild ließ sich nicht in den Projektordner schreiben.')
  }

  // Schritt 2: Maße aus der Datei, die wirklich im Projekt landet (wie beim Import).
  const roh = await leseRohMetadaten(partPfad)
  if (!roh.ok) {
    await raeumeAuf(partPfad)
    return fehler(roh.fehler.code, roh.fehler.meldung)
  }
  const metadaten = werteMetadatenAus(roh.wert, 'bild')
  if (!metadaten.ok) {
    await raeumeAuf(partPfad)
    return fehler(metadaten.fehler.code, metadaten.fehler.meldung)
  }

  // Schritt 3: atomar uebernehmen.
  const uebernahme = await macheEndgueltig(partPfad, endPfad.wert)
  if (!uebernahme.ok) {
    await raeumeAuf(partPfad)
    return fehler(uebernahme.fehler.code, uebernahme.fehler.meldung)
  }

  // Schritt 4: Datensatz. Die Herkunft ist PFLICHT (TK 9.19.6) und nennt die Bildadresse
  // sowie den Zeitpunkt des Abrufs - nicht den der Wahl.
  const asset: Asset = {
    id: assetId,
    typ: 'bild',
    dateiname,
    originalname: `Produktfoto (${hostVon(gewaehlt.url)})`,
    maße: metadaten.wert.maße,
    dauer: null,
    importdatum: new Date().toISOString(),
    zustand: 'ok',
    herkunft: {
      art: 'abruf',
      url: normalisiereProduktUrl(gewaehlt.url) ?? gewaehlt.url,
      abgerufenAm: abruf.abgerufenAm,
    },
  }

  const eingetragen = await fuegeAssetHinzu(abruf.projektId, asset)
  if (!eingetragen.ok) {
    // Wie beim Import: Die fertige Datei bleibt als Waise liegen, der Reconcile raeumt
    // sie beim naechsten Start (TK 9.4.5). Ein Loeschen hier koennte bei einem
    // Schreibfehler die einzige Kopie vernichten.
    return fehler(eingetragen.fehler.code, eingetragen.fehler.meldung)
  }

  // Erst jetzt: Der Abruf hat seinen Zweck erfuellt. Die uebrigen Kandidaten werden
  // freigegeben - ein zweiter Klick auf denselben Abruf soll kein zweites Asset anlegen.
  verwirfAbruf(abrufId)

  return { ok: true, wert: { assetId: asset.id, bildRef: asset.id } }
}

/** Ein unbrauchbarer Abruf ist ein Fehlschlag - aber nie ein Wurf ueber die IPC-Grenze. */
async function raeumeAuf(pfad: string): Promise<void> {
  try {
    await entferneDatei(pfad)
  } catch {
    // Der Reconcile raeumt .part-Leichen (TK 9.4.7) - das Aufraeumen darf den gemeldeten
    // Grund nicht ueberschreiben.
  }
}

/** Der Host der Bildadresse fuer den Anzeigenamen - nie ein Pfad, nur Anzeige. */
function hostVon(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return 'Produktseite'
  }
}

function fehler(
  code: WahlFehlercode | GenerischerFehlercode,
  meldung: string,
): Ergebnis<ProduktWahlErgebnis, WahlFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}
