// [action-editor] Bild zuweisen – aus der Bibliothek wählen oder neu importieren
//
// ============================================================
// REGELN (issue-gebunden):
//  - Bild = REFERENZ, nie Kopie: bildRef traegt NUR eine Asset-ID ("Das Bild ist
//    stets eine Referenz." TK 9.8.3). Der leere String ist KEINE zweite
//    Schreibweise fuer "kein Bild"; es gibt nur null.
//  - Der Import ist ein AUFTRAG, nicht ein Direktaufruf: reiheEin je Pfad
//    (TK 9.3.4). Ein Sammel-Auftrag waere unteilbar (FA-17); ein Direktaufruf
//    hebelt die serielle Freigabe aus (NFA-09).
//  - starteBildImport weist NICHT zu: Das fertige Asset entsteht erst, wenn der
//    Auftrag durchgelaufen ist; der Empfangsweg ist queue:geaendert via
//    abonniere (#151) und gehoert dem app-shell (#199/#121), nicht dieser Datei.
//  - Abbruch im Dialog ist ERFOLG mit leerer Liste (TK 9.4.3).
//  - Ein Teilerfolg ist ein Erfolg mit Teilmenge + abbruchGrund - NICHT
//    fehler.daten (kein Freitext-Anhang, TK 9.1.1); und NICHT rückrollierbar
//    ("Aufträge sind daher grundsätzlich nicht undo-fähig", TK 9.13.1).
//  - Pfade werden NICHT angefasst (nicht sortiert, nicht dedupliziert, nicht
//    nach Endung gefiltert - FORMAT_WHITELIST ist Sache des Imports #80).
//  - Kein Kanal-Literal: Kanäle aus KANAELE (#25), Aufruf aus rufeAuf (#24).
//
// 04.11.2026: Der Schreibweg `weiseBildZu`/`entferneBild` ist entfallen - der Editor
// haelt einen ENTWURF und schreibt beim Abschluss (s. `aktions-entwurf.ts`). Geblieben
// ist die Pruefung der Wahl (`pruefeBildWahl`): sie sichert dieselbe Zusage wie vorher,
// nur ohne zu schreiben.

import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Die Bilder des Projekts, die als Motiv taugen: typ === 'bild' UND zustand === 'ok'.
 *  Reihenfolge = Reihenfolge in Project.assets, ohne Sortierung. */
export function waehlbareBilder(assets: Asset[]): Asset[] {
  return assets.filter((asset) => asset.typ === 'bild' && asset.zustand === 'ok')
}

/** Prueft eine Bildwahl aus der Bibliothek - OHNE zu schreiben.
 *
 *  SEIT 04.11.2026 ist der Aktions-Editor ein Entwurf: die Wahl wandert in `bildRef` des
 *  Entwurfs, geschrieben wird erst beim Abschluss. Damit faellt der frueher hier sitzende
 *  Schreibweg (`weiseBildZu`/`entferneBild`) weg - die PRUEFUNG bleibt, und zwar an
 *  derselben Stelle mit denselben Saetzen: bearbeiteAktion (#39) prueft `bildRef` NICHT,
 *  eine unbekannte Asset-ID laege sonst unbeanstandet in D1 und faende sich erst beim
 *  Zeichnen als Platzhalter wieder.
 *
 *  Rueckgabe: `null` heisst „darf gewaehlt werden"; sonst der Bediener-Satz. */
export function pruefeBildWahl(assetId: string, assets: readonly Asset[]): string | null {
  if (assetId.length === 0) {
    return 'assetId: Die Kennung ist leer. Es wurde nichts gespeichert.'
  }
  const asset = assets.find((eintrag) => eintrag.id === assetId)
  if (asset === undefined) {
    return `assetId: "${assetId}" gehört nicht zum Projektbestand. Es wurde nichts gespeichert.`
  }
  if (asset.zustand === 'fehlt') {
    // Ein bewusst zugewiesenes kaputtes Bild waere ein Defekt auf Bestellung;
    // die Reparatur laeuft über #141.
    return `assetId: "${asset.originalname}" gilt als fehlend und kann nicht zugewiesen werden.`
  }
  if (asset.typ === 'video') {
    return `assetId: "${asset.originalname}" ist ein Video und taugt nicht als Aktions-Bild.`
  }
  return null
}

/** Öffnet den Medien-Dialog und reiht für JEDEN gewählten Pfad einen EIGENEN Import-Auftrag ein.
 *  Setzt bildRef NICHT – die neue Asset-ID entsteht erst, wenn der Auftrag durchgelaufen ist.
 *  `abbruchGrund` ist der Fehlercode des Aufrufs, an dem die Schleife stehengeblieben ist, sonst
 *  null. Ein Teilerfolg ist ein ERFOLG mit Teilmenge, kein Fehler. */
export async function starteBildImport(
  projektId: string,
): Promise<Ergebnis<{ auftragIds: string[]; abbruchGrund: string | null }>> {
  // SCHRITT 1 - Dialog ohne Nutzlast.
  let dialog
  try {
    dialog = await rufeAuf<{ pfade: string[] }>(KANAELE.media.öffneMedienDialog)
  } catch {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: 'Der Bild-Dialog konnte nicht geöffnet werden.',
        daten: undefined,
      },
    }
  }

  // SCHRITT 2 - der Dialog fehl am Stick? Antwort unveraendert; NICHTS eingereiht.
  if (!dialog.ok) {
    return dialog
  }

  const pfade = dialog.wert.pfade

  // SCHRITT 3 - Abbruch oder nichts gewaehlt ist ERFOLG mit leerer Liste.
  if (pfade.length === 0) {
    return { ok: true, wert: { auftragIds: [], abbruchGrund: null } }
  }

  const auftragIds: string[] = []
  let abbruchGrund: string | null = null

  // SCHRITT 4 - je Pfad ein EIGENER Auftrag, in der Reihenfolge der Pfade.
  for (const pfad of pfade) {
    let einreihen: Ergebnis<{ auftragId: string }>
    try {
      einreihen = await rufeAuf<{ auftragId: string }>(KANAELE.queue.reiheEin, {
        art: 'import',
        payload: { projektId, quellPfad: pfad },
      })
    } catch {
      einreihen = {
        ok: false as const,
        fehler: { code: 'unbekannter_fehler' as const, meldung: 'Der Import-Auftrag konnte nicht eingereiht werden.', daten: undefined },
      }
    }
    if (einreihen.ok) {
      auftragIds.push(einreihen.wert.auftragId)
      continue
    }

    // SCHRITT 5 - Ein Fehlschlag bricht die Schleife ab; WEITERE Pfade bleiben
    // unversucht. Was zurueckkommt, haengt daran, ob schon etwas laeuft:
    if (auftragIds.length === 0) {
      // Erster Pfad: Es ist NICHTS geschehen - hierfuer die Antwort unveraendert.
      return einreihen
    }
    // Mindestens ein Auftrag laeuft bereits - verschweigen hiesse dem Nutzer
    // eine Wirkung verheimlichen; zurueckrollen verbietet TK 9.13.1.
    abbruchGrund = einreihen.fehler.code
    break
  }

  // SCHRITT 6 - vollstaendig oder Teilerfolg, beides ok: true.
  return { ok: true, wert: { auftragIds, abbruchGrund } }
}
