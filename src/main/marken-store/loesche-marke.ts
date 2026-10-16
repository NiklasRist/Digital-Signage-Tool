// [marken-store] löscheMarke – blockierend löschen, eingebaute Marke unlöschbar

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { MarkenFehlercode } from './fehlercodes'
import { aendereBestand, ladeBestand } from './schreibe-marken'
import { pruefeMarkenReferenzen } from './referenzpruefung'
// Der Typ gehört #275 und wird hier NUR importiert, NIE neu deklariert: Er reist als fehler.daten
// über die IPC-Grenze, und der Renderer darf nicht aus src/main/** importieren.

export async function löscheMarke(
  markeId: string,
): Promise<Ergebnis<void, MarkenFehlercode>> {
  // SCHRITT 1: die Form, ohne irgendetwas zu lesen (TK 9.1.1 Punkt 6).
  if (typeof markeId !== 'string' || markeId.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'loescheMarke: Die markeId ist leer oder kein Text. Nichts wurde geprueft oder geloescht.',
      },
    }
  }

  // SCHRITT 2: Vorpruefung auf dem gelesenen Bestand - nichts wird hier veraendert.
  const bestand = await ladeBestand()
  if (!bestand.ok) {
    return bestand
  }
  const eintrag = bestand.wert.find((kandidat) => kandidat.id === markeId)
  if (eintrag === undefined) {
    // Der FACHLICHE Code, nie der generische 'nicht_gefunden' (TK 9.15.5, #276).
    return {
      ok: false,
      fehler: {
        code: 'marke_nicht_gefunden',
        meldung: `loescheMarke: Es steht keine Marke mit der Kennung '${markeId}' im Bestand.`,
      },
    }
  }
  if (eintrag.eingebaut) {
    // ENTSCHIEDEN: erst 'eingebaut', dann die Referenzpruefung - "nie loeschbar" gilt
    // absolut (TK 9.15.1); die teure Pruefung entfaellt hier vollstaendig.
    return {
      ok: false,
      fehler: {
        code: 'marke_eingebaut',
        meldung: `loescheMarke: Die Marke '${eintrag.name}' ist die eingebaute Fitnessworld24-Marke und nicht loeschbar (bearbeitbar bleibt sie).`,
      },
    }
  }

  // SCHRITT 3: Referenzpruefung ueber ALLE Projekte UND den Bestand (#286). Sie ist
  // ASYNCHRON und liegt deshalb VOR der Schreib-Einheit - ein await INNERHALB der
  // Aenderungsfunktion wuerde die Zusage von #277 (Lesen-Aendern-Schreiben als
  // unterbrechungsfreie Einheit) aufheben.
  const pruefung = await pruefeMarkenReferenzen(markeId)
  if (!pruefung.ok) {
    // Abbruch, es wird NICHT geloescht ("nicht nachgesehen" ist nicht "keine Treffer").
    return pruefung
  }
  const nutzung = pruefung.wert
  if (
    nutzung.aktionen.length > 0 ||
    nutzung.abgeleiteteMarken.length > 0 ||
    nutzung.standardInProjekten.length > 0
  ) {
    // DIE DRITTE BEDINGUNG IST GLEICHWERTIG: ein Treffer allein in standardInProjekten
    // sperrt genauso (AD v1.4, FA-23). Hier wird NICHT kaskadiert und NICHT korrigiert -
    // kein Projekt wird auf eine andere Marke umgestellt; den Wechsel nimmt der Nutzer
    // selbst vor (setzeStandardMarke, TK 9.5.2). daten traegt die VOLLSTAENDIGE
    // Markennutzung, MIT den leeren Listen - kein Ausschnitt, keine Umformung.
    return {
      ok: false,
      fehler: {
        code: 'marke_referenziert',
        meldung: `loescheMarke: Die Marke '${eintrag.name}' ist noch in Gebrauch (Aktionen, abgeleitete Marken und/oder als Standardmarke von Projekten).`,
        daten: nutzung,
      },
    }
  }

  // SCHRITT 4 + 5: Entfernen in EINER synchronen aendereBestand(…, 'sofort')-Einheit
  // (ENTSCHIEDEN: 'sofort' - das Loeschen ist unumkehrbar, es darf nach einem Absturz
  // nicht wiederkommen). Die Aenderungsfunktion enthaelt kein await und prueft die
  // Vorbedingungen ERNEUT: zwischen Schritt 2 und hier liegt das await auf #286.
  return aendereBestand((bestandNun) => {
    const aktuell = bestandNun.find((kandidat) => kandidat.id === markeId)
    if (aktuell === undefined) {
      return {
        ok: false,
        fehler: {
          code: 'marke_nicht_gefunden',
          meldung: `loescheMarke: Die Marke '${markeId}' ist seither aus dem Bestand verschwunden. Es wurde nichts geloescht.`,
        },
      }
    }
    if (aktuell.eingebaut) {
      return {
        ok: false,
        fehler: {
          code: 'marke_eingebaut',
          meldung: `loescheMarke: Die Marke '${aktuell.name}' ist inzwischen als eingebaut gekennzeichnet. Es wurde nichts geloescht.`,
        },
      }
    }
    return {
      ok: true,
      wert: {
        bestand: bestandNun.filter((kandidat) => kandidat.id !== markeId),
        wert: undefined,
      },
    }
  }, 'sofort')
}
// - blockierend, NICHT kaskadierend: kein Projekt und keine andere Marke wird verändert
// - eingebaute Marke -> fehler.code = 'marke_eingebaut'
// - bei Treffern in EINER DER DREI Listen -> fehler.code = 'marke_referenziert' mit
//   fehler.daten = Markennutzung (also { aktionen: MarkenReferenz[],
//   abgeleiteteMarken: AbgeleiteteMarkenReferenz[], standardInProjekten: StandardmarkenReferenz[] })
// - Referenzpruefung VOR der Schreib-Einheit (sie ist async), Entfernen in EINER
//   aendereBestand(…, 'sofort')-Einheit (#277)
// - kein fs, kein Lock, kein IPC-Kanal (den meldet #304 an)
