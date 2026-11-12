// [produktfoto] Kandidaten im Speicher des Main (FA-27 / TK 9.19.2)
//
// „Kandidaten leben im Speicher des Main, nicht auf der Platte: je Abruf hoechstens 5
// Bilder a 8 MB, unter einer `abrufId`. Sie verfallen nach 10 Minuten oder beim Schliessen
// des Fensters. Nur das GEWAEHLTE Bild geht durch die Import-Pipeline."
//
// KEIN ZWEITER SPEICHERORT: Hier liegen Bytes nur so lange, bis der Nutzer waehlt oder
// verwirft. Ein Asset entsteht ausschliesslich ueber `fuegeAssetHinzu` (dieselbe Pipeline
// wie jeder Dateiimport).

import { erzeugeId } from '../../shared/contracts/id'
import { PRODUKTFOTO_GRENZEN } from '../../shared/contracts/produktabruf'

/** Ein geladener Kandidat samt Bytes - nur main-intern. */
export interface KandidatIntern {
  /** Absolute Bildadresse, mit der er geladen wurde. */
  url: string
  /** Der `Content-Type` der Antwort (das Format entscheidet er, TK 9.19.4). */
  typ: string
  bytes: Buffer
}

export interface AbrufImSpeicher {
  abrufId: string
  projektId: string
  aktionId: string
  /** Zeitpunkt des Abrufs, ISO-8601 UTC - wird `Asset.herkunft.abgerufenAm`. */
  abgerufenAm: string
  kandidaten: KandidatIntern[]
}

interface Eintrag extends AbrufImSpeicher {
  verfaelltAm: number
}

const abrufe = new Map<string, Eintrag>()

/**
 * Legt einen Abruf ab und liefert seine Kennung. `jetzt` ist fuer Tests einspeisbar -
 * die Verfallsregel ist eine Zusage und muss ohne echtes Warten pruefbar sein.
 */
export function legeAbrufAb(
  abruf: Omit<AbrufImSpeicher, 'abrufId'>,
  jetzt: number = Date.now(),
): string {
  const abrufId = erzeugeId()
  abrufe.set(abrufId, {
    ...abruf,
    abrufId,
    verfaelltAm: jetzt + PRODUKTFOTO_GRENZEN.verfallMs,
  })
  return abrufId
}

/** Holt einen Abruf - oder `null`, wenn er unbekannt oder abgelaufen ist. */
export function holeAbruf(abrufId: string, jetzt: number = Date.now()): AbrufImSpeicher | null {
  const eintrag = abrufe.get(abrufId)
  if (eintrag === undefined) return null
  if (eintrag.verfaelltAm <= jetzt) {
    abrufe.delete(abrufId)
    return null
  }
  // Ohne den Verfallsstempel: Er ist Speicher-Verwaltung, nicht Teil der Zusage an den
  // Aufrufer. Explizit gebaut, damit kein `no-unused-vars`-Rest stehen bleibt.
  return {
    abrufId: eintrag.abrufId,
    projektId: eintrag.projektId,
    aktionId: eintrag.aktionId,
    abgerufenAm: eintrag.abgerufenAm,
    kandidaten: eintrag.kandidaten,
  }
}

/** Entfernt einen Abruf. Idempotent - ein zweites Verwerfen ist kein Fehler. */
export function verwirfAbruf(abrufId: string): void {
  abrufe.delete(abrufId)
}

/**
 * Leert den Speicher vollstaendig - beim Schliessen des Fensters (TK 9.19.2).
 *
 * KEIN Verfallstimer daneben: Der Speicher wird bei jedem Zugriff gefegt. Ein Timer
 * waere ein zweiter Mechanismus fuer dieselbe Zusage und hielte den Prozess wach.
 */
export function leereAbrufe(): void {
  abrufe.clear()
}

/** Nur fuer Tests: Anzahl der gehaltenen Abrufe (auch abgelaufene, bis zum naechsten Zugriff). */
export function anzahlAbrufe(): number {
  return abrufe.size
}
