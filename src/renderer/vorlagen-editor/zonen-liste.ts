// [vorlagen-editor] Die Zonen-Liste als Zeichenreihenfolge führen

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage, Zone } from '../../shared/contracts/vorlage'

/** Eine Zeile der Zonen-Liste. Die Reihenfolge der Zeilen IST die Zeichenreihenfolge. */
export interface ZonenListenEintrag {
  zone: Zone
  index: number       // Position in vorlage.zonen – identisch mit der Position in dieser Liste
  ebene: number       // index + 1; 1 = zuunterst, die höchste Zahl = zuoberst. NUR Anzeigetext.
  beweglich: boolean  // zone.rolle === 'frei' – nur diese Zeilen sind ziehbar
}

/** Baut die Liste. Reine Abbildung 1:1 auf vorlage.zonen – ohne jede Sortierung. */
export function baueZonenListe(vorlage: Vorlage): ZonenListenEintrag[] {
  return vorlage.zonen.map((zone, index) => ({
    zone,
    index,
    ebene: index + 1,
    beweglich: zone.rolle === 'frei',
  }))
}

/**
 * Verschiebt den Eintrag von `vonIndex` an die Position `nachIndex`.
 * Liefert ein NEUES Array; das übergebene bleibt unverändert.
 */
export function ordneZonenNeu(
  zonen: readonly Zone[],
  vonIndex: number,
  nachIndex: number,
): Ergebnis<Zone[]> {
  const indexGueltig = (index: number) =>
    Number.isInteger(index) && index >= 0 && index < zonen.length

  if (!indexGueltig(vonIndex) || !indexGueltig(nachIndex)) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: `Die Indizes müssen ganze Zahlen im Bereich 0 bis ${zonen.length - 1} sein.`,
      },
    }
  }

  if (vonIndex === nachIndex) {
    return { ok: true, wert: [...zonen] }
  }

  const verschobeneZone = zonen[vonIndex]
  if (verschobeneZone === undefined) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: `Keine Zone an Position ${vonIndex}.`,
      },
    }
  }

  if (verschobeneZone.rolle === 'fest') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung:
          'Feste Zonen gehören zum Markenrahmen und behalten ihren Platz in der Zeichenreihenfolge.',
      },
    }
  }

  const folge = [...zonen]
  folge.splice(vonIndex, 1)
  folge.splice(nachIndex, 0, verschobeneZone)

  const festIds = (liste: readonly Zone[]) =>
    liste.filter((zone) => zone.rolle === 'fest').map((zone) => zone.id)
  const vorher = festIds(zonen)
  const nachher = festIds(folge)
  const festeReihenfolgeGleich =
    vorher.length === nachher.length && vorher.every((id, i) => id === nachher[i])

  if (!festeReihenfolgeGleich) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Das Umsortieren verändert die relative Reihenfolge der festen Zonen.',
      },
    }
  }

  return { ok: true, wert: folge }
}
