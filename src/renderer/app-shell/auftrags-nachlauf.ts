// GENERIERT aus dem Signaturblock von Issue #199.
// [app-shell] Der einzige Auswerter der Warteschlangen-Ereignisse
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue.

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { Asset } from '../../shared/contracts/asset'
import type { Project } from '../../shared/contracts/project'
import type { Zeichenvoraussetzungen } from '../composer/zeichen-vorbereitung'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Alles, worauf der Nachlauf wirkt. Wird als Parameter übergeben (Entscheidung E1, #197) –
 *  diese Datei importiert KEINE Sicht und KEINEN Undo-Stapel direkt. */
export interface NachlaufWirkungen {
  /** Das aktuell geladene Projekt; null, wenn keins offen ist. Aus #197: projekt.hole().projekt */
  holeProjekt: () => Project | null
  /** Ersetzt das Projekt in der gemeinsamen Sicht (#121, über #197). */
  setzeProjekt: (projekt: Project) => void
  /** Verwirft den Motiv-Bestand und den gemerkten Stand (#154, über #197). */
  verwirfMotivBestand: () => void
  /** Stellt die Zeichenvoraussetzungen erneut her (#154, über #197). */
  bereiteZeichnenVor: (projekt: Project) => Promise<Ergebnis<Zeichenvoraussetzungen, string>>
  /** Leert die Undo-Historie der Projekt-Bearbeitung (TK 9.13.3). Kommt aus #234. */
  leereProjektHistorie: () => void
  /** Optional: die Ausgabe-Liste neu laden (#230). Fehlt sie, geschieht nichts. */
  aktualisiereAusgabenListe?: () => void
  /** Optional: meldet der Reparatur-Führung die Kennung eines ERFOLGREICH importierten Assets
   *  (#256 `schliesseMedienImportAb`, über #262). NUR bei art 'import' und status 'erfolg'. */
  meldeImportErgebnis?: (assetId: string) => void
  /** Meldeweg für Fehler, die beim Nachlauf selbst auftreten. LANDET in der anwendungsweiten
   *  meldungsFlaeche des Rahmens (#195), gehalten von #262 (App.tsx). */
  meldeFehler: (code: string, meldung: string) => void
}

/** Die drei terminalen Zustände (TK 9.3.3). */
export const TERMINALE_ZUSTAENDE = ['erfolg', 'fehlgeschlagen', 'abgebrochen'] as const

/** Die beiden Auftragsarten, die D1 verändern (TK 9.13.3). */
export const D1_AENDERNDE_ARTEN = ['import', 'loeschen'] as const

/**
 * Startet den Nachlauf: abonniert die Warteschlange und wertet TERMINALE Übergänge aus.
 */
export function starteAuftragsNachlauf(
  abonniereQueue: (hoerer: (auftraege: Auftrag[]) => void) => () => void,
  wirkungen: NachlaufWirkungen,
): () => void {
  // Die gemerkten Kennungen: Jede Kennung wird GENAU EINMAL ausgewertet. Das Ereignis
  // traegt die GANZE Liste, nicht einen Übergang - ohne Merker lief der selbe Erfolg je
  // Push mehrfach hinein und erzeugte Asset-Dubletten.
  const ausgewertet = new Set<string>()

  const merkAuftrag = async (auftrag: Auftrag): Promise<void> => {
    if (!(TERMINALE_ZUSTAENDE as readonly string[]).includes(auftrag.status)) return
    if (ausgewertet.has(auftrag.auftragId)) return
    ausgewertet.add(auftrag.auftragId)

    if (!(D1_AENDERNDE_ARTEN as readonly string[]).includes(auftrag.art)) return

    // kein Erfolg: KEIN Rollback (Fehlerklasse-Regel, TK 9.7.3) - Meldung, weiter arbeiten.
    if (auftrag.status === 'fehlgeschlagen' || auftrag.status === 'abgebrochen') {
      if (auftrag.status === 'fehlgeschlagen' && auftrag.fehler !== null) {
        wirkungen.meldeFehler(auftrag.fehler.code, auftrag.fehler.meldung)
      }
      return
    }

    const rohErgebnis: unknown = auftrag.ergebnis
    if (rohErgebnis === null || rohErgebnis === undefined) {
      wirkungen.meldeFehler('unbekannter_fehler', `Der Auftrag ${auftrag.auftragId} meldet Erfolg ohne Ergebnis.`)
      return
    }

    const projekt = wirkungen.holeProjekt()
    if (projekt === null) {
      wirkungen.meldeFehler('kein_projekt', `Der Auftrag ${auftrag.auftragId} ist fertig, aber es ist kein Projekt geladen.`)
      return
    }

    // Rückgabewert je Art (9.3.1): import → Asset; loeschen → { assetId }.
    let merged: Project
    if (auftrag.art === 'import') {
      const asset = rohErgebnis as Asset
      if (typeof asset?.id !== 'string') {
        wirkungen.meldeFehler('unbekannter_fehler', 'Ein Import meldet Erfolg ohne Asset-Kennung.')
        return
      }
      // Dubletten-Wächter: Das Ereignis kann denselben Erfolg nach einem Abgleich noch
      // einmal tragen; die Kennung im Bestand entscheidet, nicht der Merker allein.
      if (projekt.assets.some((vorhanden) => vorhanden.id === asset.id)) {
        return
      }
      merged = { ...projekt, assets: [...projekt.assets, asset] }
    } else {
      const kennung = (rohErgebnis as { assetId?: unknown }).assetId
      if (typeof kennung !== 'string') {
        wirkungen.meldeFehler('unbekannter_fehler', 'Eine Löschung meldet Erfolg ohne assetId.')
        return
      }
      merged = { ...projekt, assets: projekt.assets.filter((asset) => asset.id !== kennung) }
    }

    // ZUERST die Sicht weiterschalten, DANN die Motive neu vorbereiten: #154 liest
    // aktionen/assets des ÜBERGEBENEN Projekts - die Sicht muss den MERGED Stand tragen.
    wirkungen.setzeProjekt(merged)
    wirkungen.verwirfMotivBestand()
    const vorbereitet = await wirkungen.bereiteZeichnenVor(merged)
    if (!vorbereitet.ok) {
      wirkungen.meldeFehler(vorbereitet.fehler.code, vorbereitet.fehler.meldung)
    }

    if (auftrag.art === 'import') {
      wirkungen.meldeImportErgebnis?.((rohErgebnis as Asset).id)
    }
    // Eine gelöschte Ausgabe-Liste nicht nachziehen (aktualisiereAusgabenListe?: optional
    // bleibt optional - die Löschwirkung auf output/ ist ein eigene Lauf der Queue).
  }

  return abonniereQueue((auftraege) => {
    for (const auftrag of auftraege) {
      void merkAuftrag(auftrag as unknown as Auftrag)
    }
  })
}
