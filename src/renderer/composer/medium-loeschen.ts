import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Ein Listenelement, das das Medium BLOCKIERT – mit einer für Menschen lesbaren Adresse. */
export interface BlockierendeStelle {
  elementId: string
  /** 1-basierte Position in `Project.liste` – so, wie der Nutzer die Liste zählt. */
  position: number
  // Nur `'video'`: Seit TK v3.16 kann allein ein Video-Listenelement ein Medium blockieren
  // (die Elementart `bild` ist gestrichen, TK 9.11.3). Ein Bild-Asset erreicht die Liste nur
  // noch ueber `Aktion.bildRef` - und das blockiert nicht, es steht in `betroffeneAktionen`.
  art: 'video'
  /** Der Anzeigename: `Asset.originalname` des referenzierten Mediums. */
  bezeichnung: string
}

/** Eine Aktion, die das Medium als Bild benutzt. Sie blockiert NICHT (TK 9.4.6), wird aber
 *  durch das Löschen kaputt und ist deshalb vorher zu nennen. */
export interface BetroffeneAktion {
  aktionId: string
  titel: string
}

/** Das Ergebnis der Vorprüfung auf dem geladenen Projekt. */
export interface LoeschLage {
  /** Nicht leer ⇒ das Löschen ist gesperrt (der Main lehnt es ohnehin ab). */
  blockierer: BlockierendeStelle[]
  /** Aktionen, deren `bildRef` auf dieses Medium zeigt. Warnung, KEINE Sperre. */
  betroffeneAktionen: BetroffeneAktion[]
  /** Der Text für die Anzeige – Bestätigung ODER Absage, je nach `blockierer`. */
  text: string
}

/**
 * Sucht auf dem GELADENEN Projekt, wer das Medium referenziert.
 * FRÜHE RÜCKMELDUNG, KEIN ERSATZ: Die maßgebliche Prüfung macht der Main unter dem D1-Lock
 * (TK 9.4.6). Diese Funktion greift NICHT auf das Dateisystem zu und ruft NICHTS auf.
 */
export function pruefeLoeschLage(projekt: Project, assetId: string): LoeschLage {
  const asset = projekt.assets.find((a) => a.id === assetId)
  const bezeichnung = asset ? asset.originalname : 'Unbekanntes Medium'

  const blockierer: BlockierendeStelle[] = []
  projekt.liste.forEach((el, index) => {
    if (el.art === 'video' && el.ref === assetId) {
      blockierer.push({
        elementId: el.id,
        position: index + 1,
        art: 'video',
        bezeichnung,
      })
    }
  })

  const betroffeneAktionen: BetroffeneAktion[] = projekt.aktionen
    .filter((a) => a.bildRef === assetId)
    .map((a) => ({ aktionId: a.id, titel: a.titel }))

  let text = ''
  if (blockierer.length > 0) {
    const stellen = blockierer.map((b) => `Position ${b.position} (${b.bezeichnung})`).join(', ')
    text = `Das Medium kann nicht gelöscht werden, da es noch an ${blockierer.length} Stelle(n) in der Wiedergabeliste verwendet wird: ${stellen}`
  } else {
    text = `Möchten Sie das Medium "${bezeichnung}" wirklich aus dem Projekt löschen?`
  }

  return {
    blockierer,
    betroffeneAktionen,
    text,
  }
}

/**
 * Übersetzt `referenzenIds` aus den Fehler-Nutzdaten von `asset_referenziert` in lesbare
 * Stellen. Unbekannte Kennungen werden übersprungen und NICHT erfunden (s. ENTSCHIEDEN 5).
 */
export function benenneReferenzen(
  projekt: Project,
  referenzenIds: readonly string[],
): BlockierendeStelle[] {
  const result: BlockierendeStelle[] = []
  for (const id of referenzenIds) {
    const index = projekt.liste.findIndex((el) => el.id === id)
    if (index === -1) continue

    const el = projekt.liste[index]
    if (el && el.art === 'video') {
      const asset = projekt.assets.find((a) => a.id === el.ref)
      result.push({
        elementId: el.id,
        position: index + 1,
        art: 'video',
        bezeichnung: asset ? asset.originalname : 'Unbekanntes Medium',
      })
    }
  }
  return result
}

/** Liest `referenzenIds` aus einem `fehler.daten`-Feld heraus. Passt die Form nicht, ist das
 *  Ergebnis ein leeres Array – NIE ein Wurf und NIE ein erfundener Eintrag. */
export function leseReferenzenIds(daten: unknown): string[] {
  if (
    daten &&
    typeof daten === 'object' &&
    'referenzenIds' in daten &&
    Array.isArray((daten as { referenzenIds?: unknown }).referenzenIds)
  ) {
    const ids = (daten as { referenzenIds?: unknown[] }).referenzenIds ?? []
    if (ids.every((id) => typeof id === 'string')) {
      return ids as string[]
    }
  }
  return []
}

/** Alles, worauf das Löschen wirkt. Wird als Parameter übergeben (Entscheidung E1). */
export interface LoeschWirkungen {
  /**
   * Gibt JEDEN offenen `<video>`-Handle auf dieses Asset frei (`src=""`, `load()`).
   * PFLICHT vor dem Einreihen – TK 9.4.6, „Vorbedingung Vorschau (Regel B)". Wer die Handles
   * hält, ist der `preview-player`; deshalb kommt die Funktion von außen. Sie wird von
   * **#246** geliefert (Handle-Register, Signatur `gibVideoHandlesFrei(assetId: string): void`),
   * und zwar aus `src/renderer/gemeinsam/video-handles.ts`. DIESE Datei importiert sie NICHT –
   * der Pfad steht hier nur, damit klar ist, welche Funktion gemeint ist.
   */
  gibVideoHandlesFrei: (assetId: string) => void
}

/**
 * Reiht den Löschauftrag ein – NACHDEM die Vorprüfung frei ist und der Nutzer bestätigt hat
 * (beides prüft die Anzeige, nicht diese Funktion).
 * Wartet NICHT auf den Ausgang: Das Ergebnis reist über den Auftrags-Zustand (TK 9.1.1 Punkt 1)
 * und wird von #199 ausgewertet.
 */
export async function loescheMedium(
  projektId: string,
  assetId: string,
  wirkungen: LoeschWirkungen,
): Promise<Ergebnis<{ auftragId: string }, string>> {
  try {
    wirkungen.gibVideoHandlesFrei(assetId)
    return await rufeAuf<{ auftragId: string }, string>(KANAELE.queue.reiheEin, {
      art: 'loeschen',
      payload: { projektId, assetId },
    })
  } catch (fehler) {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: fehler instanceof Error ? fehler.message : String(fehler),
      },
    }
  }
}

