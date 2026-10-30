// [marken-store] pruefeMarkenReferenzen(markeId) – rein lesend, über ALLE Projekte

import fs from 'node:fs/promises'
import path from 'node:path'

import type {
  AbgeleiteteMarkenReferenz,
  MarkenReferenz,
  Markennutzung,
  StandardmarkenReferenz,
} from '../../shared/contracts/marke'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { MarkenFehlercode } from './fehlercodes'
import { ladeBestand } from './schreibe-marken'
import { listeProjekte } from '../project-store/liste-projekte'
import { PROJEKT_DATEI, projektOrdner } from '../project-store/pfade'
// Der Typ gehoert #275 und wird hier NUR importiert, NIE neu deklariert: Er reist als fehler.daten
// ueber die IPC-Grenze (#287), und der Renderer darf nicht aus src/main/** importieren.

export async function pruefeMarkenReferenzen(
  markeId: string,
): Promise<Ergebnis<Markennutzung, MarkenFehlercode>> {
  // SCHRITT 1: die Form, ohne irgendetwas zu lesen (TK 9.1.1 Punkt 6).
  if (typeof markeId !== 'string' || markeId.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'pruefeMarkenReferenzen: Die markeId ist leer oder kein Text. Nichts wurde geprueft.',
      },
    }
  }

  // SCHRITT 2: Referenzart 2 ZUERST - billig, kein Projekt-I/O. Ein Bestand-Fehler
  // bricht ab, BEVOR listeProjekte gerufen wird ("die billige Pruefung laeuft zuerst").
  const bestand = await ladeBestand()
  if (!bestand.ok) {
    return bestand
  }
  const abgeleiteteMarken: AbgeleiteteMarkenReferenz[] = bestand.wert
    .filter((eintrag) => eintrag.parent === markeId)
    .map((eintrag) => ({ markeId: eintrag.id, markeName: eintrag.name }))

  // SCHRITT 3: die Menge der Projekte; ein Fehler kommt UNVERAENDERT durch - niemals
  // ersatzweise "keine Projekte, also keine Treffer" ("nicht nachgesehen" darf nicht
  // zu "nicht benutzt" werden, TK 9.15.1).
  const projekte = await listeProjekte()
  if (!projekte.ok) {
    // Der Fehlercode von #35 ist ProjectStoreFehlercode - er reist UNVERAENDERT als
    // Textcode (die IPC-Naht ist generisch, #60); die Huelle ist seit #60 ueber den Fehlercode generisch erweitert
    // ihn hier nur auf die Markennutzung-Huelle.
    // SAFETY: Der Code kommt UNVERAENDERT durch die IPC-Naht (Textcode, #60) - der Cast
    // verengt die generische Huelle auf die Markennutzung, der Wert bleibt derselbe.
    return { ok: false, fehler: { code: projekte.fehler.code as MarkenFehlercode & string, meldung: projekte.fehler.meldung } }
  }

  // SCHRITT 4: JEDES gemeldete Projekt wird EINMAL gelesen und bedient daraus BEIDE
  // Referenzarten (kein zweiter Durchlauf). Auch ein beschaedigt:true gemeldetes
  // Projekt wird VERSUCHT zu lesen - scheitert es, bricht ALLES mit speicher_fehler ab
  // (ENTSCHIEDEN; kein Ueberspringen - ein Teilergebnis gaebe es nicht).
  const aktionen: MarkenReferenz[] = []
  const standardInProjekten: StandardmarkenReferenz[] = []
  for (const meta of projekte.wert) {
    const datei = path.join(projektOrdner(meta.id), PROJEKT_DATEI)
    let roh: string
    try {
      roh = await fs.readFile(datei, 'utf8')
    } catch (ursache) {
      return {
        ok: false,
        fehler: {
          code: 'speicher_fehler',
          meldung: `pruefeMarkenReferenzen: project.json von Projekt '${meta.id}' ist nicht lesbar (${ursache instanceof Error ? ursache.message : String(ursache)}).`,
        },
      }
    }
    let projekt: unknown
    try {
      projekt = JSON.parse(roh)
    } catch {
      return {
        ok: false,
        fehler: {
          code: 'speicher_fehler',
          meldung: `pruefeMarkenReferenzen: project.json von Projekt '${meta.id}' ist nicht parsebar.`,
        },
      }
    }
    if (typeof projekt !== 'object' || projekt === null || Array.isArray(projekt)) {
      return {
        ok: false,
        fehler: {
          code: 'speicher_fehler',
          meldung: `pruefeMarkenReferenzen: project.json von Projekt '${meta.id}' traegt kein Objekt.`,
        },
      }
    }
    // SAFETY: Die Zeilen davor haben `projekt` als nicht-null Objekt (kein Array) belegt;
    // der Cast macht die zwei Felder als unknown LESBAR, beide werden einzeln geprueft.
    const daten = projekt as { aktionen?: unknown; standardMarkeId?: unknown }

    // Referenzart 1: aktion.markeId. Fehlt das Feld 'aktionen' ganz -> als leer gelten.
    // Vorhanden, aber kein Array -> 'speicher_fehler' (Abbruch).
    if (daten.aktionen !== undefined) {
      if (!Array.isArray(daten.aktionen)) {
        return {
          ok: false,
          fehler: {
            code: 'speicher_fehler',
            meldung: `pruefeMarkenReferenzen: 'aktionen' von Projekt '${meta.id}' ist kein Array.`,
          },
        }
      }
      for (const einlaufElement of daten.aktionen) {
        if (typeof einlaufElement !== 'object' || einlaufElement === null) {
          continue // kein Objekt - kann keine Referenz tragen (Muster aus M4-12)
        }
        // SAFETY: Die Zeile davor hat `einlaufElement` als nicht-null Objekt belegt; der
        // Cast macht die zwei Felder als unknown LESBAR, `markeId` wird verglichen,
        // `id` auf Text geprueft - vor jedem Zugriff.
        const aktion = einlaufElement as { id?: unknown; markeId?: unknown }
        if (aktion.markeId === markeId && typeof aktion.id === 'string') {
          aktionen.push({
            projektId: meta.id,
            projektName: meta.name,
            aktionId: aktion.id,        // das Feld heisst aktionId, NICHT id (TK v3.12)
          })
        }
      }
    }

    // Referenzart 3: Project.standardMarkeId. Fehlt ganz, null oder leer -> treffer-frei,
    // die Pruefung läuft weiter. Vorhanden, aber kein String -> Datei nicht auswertbar.
    const standardMarkeId = daten.standardMarkeId
    if (standardMarkeId !== undefined && standardMarkeId !== null) {
      if (typeof standardMarkeId !== 'string') {
        return {
          ok: false,
          fehler: {
            code: 'speicher_fehler',
            meldung: `pruefeMarkenReferenzen: 'standardMarkeId' von Projekt '${meta.id}' ist kein Text.`,
          },
        }
      }
      if (standardMarkeId === markeId) {
        // Der Name kommt aus ProjektMeta (#35, ENTSCHIEDEN) - denselbe Name wie in den
        // aktionen-Treffern desselben Projekts. NICHT entdoppelt: fuehrt ein Projekt die
        // Marke als Standard UND eine Aktion traegt sie, stehen beide Treffer da.
        standardInProjekten.push({ projektId: meta.id, projektName: meta.name })
      }
    }
  }

  // SCHRITT 5: alle drei Listen, getrennt; alle leer = KEIN Fehler.
  return { ok: true, wert: { aktionen, abgeleiteteMarken, standardInProjekten } }
}
// - durchsucht ALLE von listeProjekte (#35) gemeldeten Projekte (Referenzart 1 UND 3) UND den
//   GESAMTEN Marken-Bestand (Referenzart 2), nicht nur das geladene Projekt bzw. eine Teilmenge
// - Referenzart 1: aktion.markeId   Referenzart 2: marke.parent   Referenzart 3: Project.standardMarkeId
// - liefert ALLE DREI Trefferlisten GETRENNT zurück
// - keine Treffer => alle drei Arrays leer (ok: true) – das ist KEIN Fehler
// - liest ausschliesslich; schreibt nichts, legt nichts an, repariert nichts
