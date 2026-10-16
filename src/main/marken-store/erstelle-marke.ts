// [marken-store] erstelleMarke(name, parentId?) – neue eigenständige oder abgeleitete Marke

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { MarkenEintrag } from './schreibe-marken'
import type { Marke } from '../../shared/contracts/marke'
import type { MarkenFehlercode } from './fehlercodes'
import { aendereBestand } from './schreibe-marken'
import { eingebauteMarke } from './anfangsbestand'
import { loeseMarkeAuf } from './vererbung'
import { erzeugeId } from '../../shared/contracts/id'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #277: interface MarkenEintrag { id: string; name: string; parent: string | null
//                                    eingebaut: boolean; farben: Partial<Record<FarbRolle, string>>
//                                    schriften: Partial<Record<SchriftRolle, Schrift>>
//                                    logo?: {...} | null; sicherheit?: {...}; radien?: {...}
//                                    schatten?: {...}; slogan?: {...} }
//          aendereBestand<T>(
//            aenderung: (bestand: MarkenEintrag[]) =>
//              Ergebnis<{ bestand: MarkenEintrag[]; wert: T }, MarkenFehlercode>,
//            schreibart: 'sofort' | 'entprellt',
//          ): Promise<Ergebnis<T, MarkenFehlercode>>
//          // `aenderung` ist SYNCHRON und bekommt eine tiefe Kopie des Bestands
//   #280: eingebauteMarke(): MarkenEintrag   // frische TIEFE Kopie der Fitnessworld24-Marke,
//          // VOLLSTÄNDIG befüllt (alle Rollen, Logo, Sicherheit, Radien, Schatten, Slogan)
//   #279: loeseMarkeAuf(eintrag: MarkenEintrag, bestand: MarkenEintrag[]): Ergebnis<Marke, MarkenFehlercode>
//   #20:   erzeugeId(): string   // UUID v4
//   #276: type MarkenFehlercode =
//            'marke_referenziert' | 'marke_eingebaut' | 'marke_nicht_gefunden'
//            | 'marken_datei_fehlt' | 'speicher_fehler'

export async function erstelleMarke(
  name: string,
  parentId: string | null,
): Promise<Ergebnis<Marke, MarkenFehlercode>> {
  // SCHRITT 1 (TK 9.1.1 Punkt 6): die Form - BEVOR irgendetwas passiert.
  // `name` wird getrimmt gespeichert; `parentId` ist ein PFLICHTPARAMETER mit | null,
  // damit „nichts übergeben" und „bewusst keine Ableitung" unverkennbar verschieden sind
  // (Begründung wie in M4-06 für hoehe).
  if (typeof name !== 'string') {
    return {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'erstelleMarke: Der Name ist kein Text.' },
    }
  }
  const getrimmt = name.trim()
  if (getrimmt.length === 0 || getrimmt.length > 80) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'erstelleMarke: Der Name ist nach dem Trimmen leer oder laenger als 80 Zeichen. Es wurde nichts angelegt.',
      },
    }
  }
  if (parentId !== null && (typeof parentId !== 'string' || parentId.length === 0)) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'erstelleMarke: parentId ist weder null noch eine nichtleere Kennung. Es wurde nichts angelegt.',
      },
    }
  }

  // SCHritte 2-5: Vorbedingungen INNERHALB der synchronen Aenderungsfunktion erneut
  // pruefen (dieselbe Antwort wie in M4-13 / loesche-vorlage.ts gebaut: zwischen Lesen
  // und Schreiben liegt keine asynchrone Pause mehr, in die ein fremder aendereBestand-
  // Aufruf hineinlaufen koennte - der Lost-Update-Fall ist damit ausgeschlossen).
  const ergebnis = await aendereBestand((bestand) => {
    let neu: MarkenEintrag
    if (parentId !== null) {
      const parentEintrag = bestand.find((kandidat) => kandidat.id === parentId)
      if (parentEintrag === undefined) {
        return {
          ok: false,
          fehler: {
            code: 'marke_nicht_gefunden',
            meldung: `erstelleMarke: Es steht keine Marke mit der Kennung '${parentId}' im Bestand. Es wurde nichts angelegt.`,
          },
        }
      }
      if (parentEintrag.parent !== null) {
        // KETTENSPERRE (TK 9.11.2/9.15.1): der Parent selbst darf keinen Parent haben.
        return {
          ok: false,
          fehler: {
            code: 'ungueltige_eingabe',
            meldung: `erstelleMarke: Die Marke '${parentEintrag.id}' hat selbst einen Parent - Ableitungsketten duerfen nur EINE Stufe tief sein. Es wurde nichts angelegt.`,
          },
        }
      }
      // ABGELEITET: kein Feld außer id/name/parent/eingebaut wird gesetzt (alles andere
      // bleibt geerbt - TK 9.11.2, „feldweise Vererbung, eine Stufe tief").
      neu = { id: erzeugeId(), name: getrimmt, parent: parentId, eingebaut: false, farben: {}, schriften: {} }
    } else {
      // EIGENSTAENDIG: tiefe Kopie der SECHS Werte-Felder der eingebauten Marke
      // (ENTSCHIEDEN, BRIEFING Abschnitt 3) - das einzige belegte, vollständige
      // Werteset. Das fremde Logo wird bewusst NICHT mitkopiert: `logo: null` ist der
      // Normalfall fuer Partner-Marken (TK 9.10.10) und liefert #293 seinen einzigen
      // Weg, den Ersatz-Logo-Pfad je auszuloesen.
      const quelle = eingebauteMarke()
      neu = {
        id: erzeugeId(),
        name: getrimmt,
        parent: null,
        eingebaut: false,
        farben: structuredClone(quelle.farben),
        schriften: structuredClone(quelle.schriften),
        logo: null,                                   // GESETZT auf null - kein Mitkopieren
        sicherheit: structuredClone(quelle.sicherheit),
        radien: structuredClone(quelle.radien),
        schatten: structuredClone(quelle.schatten),
        slogan: structuredClone(quelle.slogan),
      }
    }

    // Am ENDE des Bestands anhaengen - die Reihenfolge ist die der
    // Array-Reihenfolge (TK 9.11.4), die vorherigen Eintraege unveraendert.
    const neuerBestand: MarkenEintrag[] = [...bestand, neu]

    // SCHRITT 6 in derselben Einheit: die neue Marke AUFGLOEST zurueckgeben. Dessen
    // Weg verlaesst sich auf die gleiche Einheit: Der Parent steht zwischen den
    // Einheiten, und die Kettensperre ist im selben Lauf geprueft - die Resolution
    // kann bei einer validen Kette nur an dem hier bereits geprueften Parent scheitern.
    const aufgeloest = loeseMarkeAuf(neu, neuerBestand)
    if (!aufgeloest.ok) {
      // Betrifft nur den strukturell unmoglichen Fall (korrumpierter Parent ohne
      // Werte); dieser Code reist als Gesamtergebnis des Schreibens hinaus.
      return { ok: false, fehler: aufgeloest.fehler }
    }
    return { ok: true, wert: { bestand: neuerBestand, wert: aufgeloest.wert } }
  }, 'sofort')

  return ergebnis
}
