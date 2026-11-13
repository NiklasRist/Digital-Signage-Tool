// [app-shell] Der einzige Auswerter der Warteschlangen-Ereignisse

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { Asset } from '../../shared/contracts/asset'
import type { ProduktSeiteTreffer } from '../../shared/contracts/produktsuche'
import type { ProduktfotoKandidat } from '../../shared/contracts/produktabruf'
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
  /** Optional: das Ergebnis eines Produktfoto-Abrufs (FA-27, #470). Der Abruf aendert D1
   *  NICHT - er meldet nur Kandidaten; deshalb laeuft er nicht durch den D1-Zweig, sondern
   *  hier. `status: 'fehler'` dient allein dazu, die Sperre im Editor zu loesen; der
   *  sichtbare Grund kam bereits ueber `meldeFehler`. */
  meldeProduktfotoAbruf?: (meldung: ProduktfotoMeldung) => void
  /** Optional: das Ergebnis einer Produktseiten-Suche (FA-30, #472). Dieselbe Aufteilung
   *  wie beim Abruf: kein D1-Schreibweg, `status: 'fehler'` loest nur die Sperre. */
  meldeProduktsuche?: (meldung: ProduktsucheMeldung) => void
  /** Meldeweg für Fehler, die beim Nachlauf selbst auftreten. LANDET in der anwendungsweiten
   *  meldungsFlaeche des Rahmens (#195), gehalten von #262 (App.tsx). */
  meldeFehler: (code: string, meldung: string) => void
}

/** Die Meldung, die der Nachlauf an den Editor weiterreicht (FA-27). */
export type ProduktfotoMeldung =
  | { status: 'erfolg'; auftragId: string; abrufId: string; kandidaten: ProduktfotoKandidat[] }
  | { status: 'fehler'; auftragId: string }

/** Die Meldung, die der Nachlauf an den Editor weiterreicht (FA-30). */
export type ProduktsucheMeldung =
  | { status: 'erfolg'; auftragId: string; treffer: ProduktSeiteTreffer[] }
  | { status: 'fehler'; auftragId: string }

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
  // Die gemerkten Kennungen: Jede AUSFUEHRUNG wird GENAU EINMAL ausgewertet. Das Ereignis
  // traegt die GANZE Liste, nicht einen Übergang - ohne Merker lief der selbe Erfolg je
  // Push mehrfach hinein und erzeugte Asset-Dubletten.
  //
  // DER SCHLUESSEL IST ID + VERSUCH, NICHT DIE ID ALLEIN (Nachtrag 21.10.2026, am echten
  // Fenster gemessen, Treiber 4k): Ein fehlgeschlagener Auftrag behaelt seine `auftragId`
  // ueber "Erneut versuchen" hinweg (TK 9.3.3); nur `versuche` steigt beim naechsten Start.
  // Mit der ID allein wurde der Fehlschlag als ausgewertet vermerkt - und der SPAETERE
  // ERFOLG derselben ID fiel unter den Tisch: kein `setzeProjekt`, kein Asset in der
  // Sicht/Galerie, obwohl D1 ihn trug. Der Versuch ist die Einheit, die TK 9.3.1 zaehlt
  // (`versuche`), und genau je Versuch entsteht ein Q3-Eintrag.
  const schluessel = (auftrag: Auftrag): string => `${auftrag.auftragId}:${auftrag.versuche}`
  const ausgewertet = new Set<string>()

  const merkAuftrag = async (auftrag: Auftrag): Promise<void> => {
    // Kein Cast auf eine `readonly string[]`: `some` vergleicht die Union direkt.
    if (!TERMINALE_ZUSTAENDE.some((zustand) => zustand === auftrag.status)) return
    if (ausgewertet.has(schluessel(auftrag))) return
    ausgewertet.add(schluessel(auftrag))

    const rohErgebnis: unknown = auftrag.ergebnis

    // kein Erfolg: KEIN Rollback (Fehlerklasse-Regel, TK 9.7.3) - Meldung, weiter arbeiten.
    if (auftrag.status === 'fehlgeschlagen' || auftrag.status === 'abgebrochen') {
      if (auftrag.status === 'fehlgeschlagen' && auftrag.fehler !== null) {
        wirkungen.meldeFehler(auftrag.fehler.code, auftrag.fehler.meldung)
      }
      // BEFUND, BEHOBEN am 13.11.2026 (#472): Hier stand ein blankes `return`. Damit war
      // die Fehlermeldung an den Editor (`status: 'fehler'`) UNERREICHBAR - der Editor
      // haelt waehrend eines Auftrags eine Sperre und loest sie nur ueber diese Meldung.
      // Am Fenster sichtbar: Nach einem fehlgeschlagenen Produktfoto-Abruf blieb der
      // Knopf auf „Foto wird abgerufen …" stehen, bis der Editor neu montiert wurde.
      // Der Befund stammt aus dem Bau von FA-30, betrifft aber FA-27 genauso; er wird im
      // Abschluss von #472 gemeldet.
      if (auftrag.art === 'produktfoto-abruf') {
        wirkungen.meldeProduktfotoAbruf?.({ status: 'fehler', auftragId: auftrag.auftragId })
      }
      if (auftrag.art === 'produktseite-suche') {
        wirkungen.meldeProduktsuche?.({ status: 'fehler', auftragId: auftrag.auftragId })
      }
      return
    }

    // #347 (M7-06, Ablaufschritt 5): Ein ERFOLGREICHER Render/Export frischt die
    // Ausgabe-Liste auf (der einzige Aktuell-Weg im Normalzustand). Kein
    // verwirfMotivBestand, kein bereiteZeichnenVor, kein leereProjektHistorie -
    // ein Render aendert weder Medien noch Bearbeitungsstand.
    if (auftrag.art === 'render' || auftrag.art === 'export') {
      wirkungen.aktualisiereAusgabenListe?.()
      // Zusatz, NUR bei render (TK v3.2 / 9.3.6): Der Render hat
      // Project.letzterAusgabeName in D1 bereits gesetzt; die Sicht wird hier
      // nachgefuehrt - ALLEIN dieses Feld, gleiche Array-Referenzen. Kein nicht
      // leerer Name => melden und überspringen (M7-06, ENTSCHIEDEN 7/8).
      if (auftrag.art === 'render') {
        // SAFETY: `rohErgebnis` ist `unknown` (IPC-Nutzlast); der Cast macht das Feld
        // LESBAR, geprueft wird der Wert in der Zeile darunter (`typeof name !== 'string'`).
        const ergebnis = rohErgebnis as { ausgabeName?: unknown }
        const name = (ergebnis ?? null)?.ausgabeName
        if (typeof name !== 'string' || name.length === 0) {
          wirkungen.meldeFehler(
            'unbekannter_fehler',
            `Der Render-Auftrag ${auftrag.auftragId} meldet Erfolg ohne gueltigen Ausgabename.`,
          )
          return
        }
        const projekt = wirkungen.holeProjekt()
        if (
          projekt !== null &&
          // SAFETY: wie oben - `payload` ist `unknown`; der Cast macht `projektId` lesbar,
          // verglichen wird er mit `projekt.id` (Text), kein Wert wird umgewandelt.
          projekt.id === (auftrag.payload as { projektId?: unknown }).projektId
        ) {
          wirkungen.setzeProjekt({ ...projekt, letzterAusgabeName: name })
        }
      }
      return
    }

    // FA-27 (#470): Der Produktfoto-Abruf aendert D1 NICHT. Sein Ergebnis geht an den
    // Editor; bei Fehlschlag wurde der Klartext oben bereits gemeldet - hier wird nur
    // die Sperre geloest.
    if (auftrag.art === 'produktfoto-abruf') {
      if (auftrag.status !== 'erfolg') {
        wirkungen.meldeProduktfotoAbruf?.({ status: 'fehler', auftragId: auftrag.auftragId })
        return
      }
      // SAFETY: `rohErgebnis` ist `unknown` (IPC-Nutzlast); der Cast macht die beiden
      // Felder lesbar, geprueft werden sie in der Zeile darunter.
      const ergebnis = rohErgebnis as { abrufId?: unknown; kandidaten?: unknown }
      if (typeof ergebnis?.abrufId !== 'string' || !Array.isArray(ergebnis.kandidaten)) {
        wirkungen.meldeFehler(
          'unbekannter_fehler',
          `Der Abruf ${auftrag.auftragId} meldet Erfolg ohne Kandidaten.`,
        )
        wirkungen.meldeProduktfotoAbruf?.({ status: 'fehler', auftragId: auftrag.auftragId })
        return
      }
      // SAFETY: `Array.isArray` ist oben geprueft; die Elemente stammen aus dem Main,
      // der sie als `ProduktfotoKandidat` gebaut hat (TK 9.19.2). Der Editor prueft die
      // Form beim Lesen nicht erneut - er benutzt nur `index`, `url`, `typ`, `groesse`.
      wirkungen.meldeProduktfotoAbruf?.({
        status: 'erfolg',
        auftragId: auftrag.auftragId,
        abrufId: ergebnis.abrufId,
        kandidaten: ergebnis.kandidaten as ProduktfotoKandidat[],
      })
      return
    }

    // FA-30 (#472): Die Produktseiten-Suche aendert D1 ebenfalls NICHT. Ihre Treffer sind
    // Zeichenketten; sie gehen an den Editor, und erst dessen Wahl setzt `produktUrl` im
    // ENTWURF. Kein Rollback, kein `setzeProjekt`, kein Motiv-Bestand.
    if (auftrag.art === 'produktseite-suche') {
      // SAFETY: `rohErgebnis` ist `unknown` (IPC-Nutzlast); der Cast macht `treffer`
      // lesbar, geprueft wird es in der Zeile darunter (`Array.isArray`). Die Elemente
      // hat der Main als `ProduktSeiteTreffer` gebaut (9.20); der Editor benutzt nur
      // `url`, `titel`, `host`.
      const ergebnis = rohErgebnis as { treffer?: unknown }
      if (!Array.isArray(ergebnis?.treffer)) {
        wirkungen.meldeFehler(
          'unbekannter_fehler',
          `Die Suche ${auftrag.auftragId} meldet Erfolg ohne Trefferliste.`,
        )
        wirkungen.meldeProduktsuche?.({ status: 'fehler', auftragId: auftrag.auftragId })
        return
      }
      // SAFETY: `Array.isArray` ist oben geprueft; die Elemente stammen aus dem Main,
      // der sie als `ProduktSeiteTreffer` gebaut hat (9.20, Signaturblock 2). Der Editor
      // benutzt nur `url`, `titel` und `host` - eine kaputte Form faellt dort als leere
      // Zeile auf, nicht als Absturz.
      wirkungen.meldeProduktsuche?.({
        status: 'erfolg',
        auftragId: auftrag.auftragId,
        treffer: ergebnis.treffer as ProduktSeiteTreffer[],
      })
      return
    }

    // D1-ändernde Arten (import/loeschen) ab hier (M7-06, Schritte 2.1-2.4, 2.6).
    if (!D1_AENDERNDE_ARTEN.some((art) => art === auftrag.art)) return
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
      // SAFETY: Das Ergebnis eines `import`-Auftrags ist im Main ein vollstaendiges
      // `Asset` (TK 9.3.1); geprueft wird hier nur die Kennung, weil nur sie ueber die
      // Dublette entscheidet - die uebrigen Felder hat der Main gebaut.
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
      // SAFETY: `rohErgebnis` ist `unknown`; der Cast macht `assetId` lesbar, die Pruefung
      // auf Text folgt direkt darunter.
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
      // SAFETY: Dieselbe Kennung wurde oben bereits als Text geprueft (`asset?.id`), hier
      // wird sie nur noch gemeldet - kein zweiter Zugriff auf ein ungeprueftes Feld.
      wirkungen.meldeImportErgebnis?.((rohErgebnis as Asset).id)
    }
    // Eine gelöschte Ausgabe-Liste nicht nachziehen (aktualisiereAusgabenListe?: optional
    // bleibt optional - die Löschwirkung auf output/ ist ein eigene Lauf der Queue).
  }

  return abonniereQueue((auftraege) => {
    for (const auftrag of auftraege) {
      // `abonniereQueue` liefert bereits `Auftrag[]` (Signatur oben) - kein Cast noetig.
      void merkAuftrag(auftrag)
    }
  })
}

