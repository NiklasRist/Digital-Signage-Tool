// GENERIERT aus dem Signaturblock von Issue #200.
// [app-shell] Der dauerhafte Hinweis „nicht gespeichert"
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf: gefuellt (Issue #200);
// die GERUEST-PRUEFSUMME-Abschalt-Logik geht nicht aus dieser Datei hervor,
// sie trug den werfenden Rumpf und trägt jetzt die Umsetzung.
//
// ============================================== ====
// DER ANFANGSZUSTAND HEISST 'unbekannt' - und das ist der ORIGINALENTSCHEID
// dieses Issues: So lange KEIN Ereignis kam, behauptet die Oberfläche NICHTS
// ("weder das Wort 'gespeichert' noch 'nicht gespeichert'"). Eine Anzeige,
// die aus dem AUSBLEIBEN einer Fehlermeldung Entwarnung ableitet, lügt dauerhaft,
// wenn der Sender fehlt (#238) - und genau so verliert sie NFA-02.
//
// Die Abos werden ÜBERGEBEN: kein Kanalname, kein KANAELE-Zugriff, kein rufeAuf.
// Der Speicherzustand ist MODUL-Zustand mit Abo (ENTSCHIEDEN 8): Der Hinweis
// sitzt in der Reiterleiste (Schlitz speicherHinweis von #195; Entscheidung
// 23.08.2026: dauerhafte Fußleiste am unteren Rand), und der Stand kann auch
// ausserhalb gebraucht werden (z. B. beim Beenden warnen). Kein Schliessen-Knopf,
// kein Ausblenden - der Hinweis verschwindet AUSSCHLIESSLICH durch ein
// { typ: 'gespeichert' } dergleichen Quelle (TK 9.5.4).
//
// KEINE UEbersetztabelle Code -> Text (#211); der Code reise als Zusatzangabe.
// Kein Wiederholknopf; der Wiederholversuch laeuft im Main und meldet als
// { typ: 'gespeichert' }.

import { useEffect, useMemo, useState, type JSX } from 'react'
import type { SpeicherEreignis, Speicherlage, Speicherquelle } from './speicherstatus-lage'
import {
  ANFANGSLAGE,
  betroffeneQuellen,
  verarbeiteSpeicherEreignis,
  zeigtHinweis,
} from './speicherstatus-lage'

/** Die beiden Abos werden ÜBERGEBEN – der Aufrufer bildet sie aus `abonniere` (#151).
 *  Diese Datei kennt keinen Kanalnamen und importiert die Kanal-Registry nicht.
 *  (Gleiche Bauweise wie `verbindeSpeicherstatus` in #126.) */
export interface SpeicherHinweisEigenschaften {
  abonniereProjekt: (hoerer: (ereignis: SpeicherEreignis) => void) => () => void
  abonniereVorlagen: (hoerer: (ereignis: SpeicherEreignis) => void) => () => void
}

// --------------------------------------------------------------------------
// Modul-Zustand: EINE Bindung, notify verteilt an alle Hoerer, setter schaltet.
// --------------------------------------------------------------------------

let lage: Speicherlage = ANFANGSLAGE

const hoererListe: Array<(stand: Speicherlage) => void> = []

function schalteUm(neu: Speicherlage): void {
  lage = neu
  for (const hoerer of [...hoererListe]) {
    try {
      hoerer(lage)
    } catch (fehler) {
      // Ein werfender Hoerer dorft nicht die anderen abschneiden.
      console.error('[app-shell] Ein Hoerer des Speicherstatuss hat geworfen.', fehler)
    }
  }
}

/** Reiner Umweg für die Abos: Quelle fest, Ereignis kommt vom Main. */
function verarbeite(quelle: Speicherquelle, ereignis: SpeicherEreignis): void {
  schalteUm(verarbeiteSpeicherEreignis(lage, quelle, ereignis))
}

/** Nur für Tests und für Anzeigen außerhalb der Reiterleiste: die aktuelle Lage. */
export function holeSpeicherlage(): Speicherlage {
  return lage
}

/** Für nicht-Anzeige-Aufrufer (z. B. Beenden-Ablauf): Stand abonnieren. */
export function aufSpeicherlage(hoerer: (stand: Speicherlage) => void): () => void {
  hoererListe.push(hoerer)
  let abgemeldet = false
  return () => {
    if (abgemeldet) return
    abgemeldet = true
    const stelle = hoererListe.indexOf(hoerer)
    if (stelle !== -1) hoererListe.splice(stelle, 1)
  }
}

export function SpeicherHinweis(eigenschaften: SpeicherHinweisEigenschaften): JSX.Element {
  const [, setzeTakt] = useState(0)

  const abos = useMemo(() => eigenschaften, [eigenschaften])

  useEffect(() => {
    // Jede Abo-Funktion GENAU EINMAL beim Aufbau; Abmeldung beim Abbau.
    // Wirft eine beim Anmelden, wird die ANDERE trotzdem angemeldet und die
    // betroffene Quelle bleibt 'unbekannt' (Fehlertabelle).
    const abmeldungen: Array<() => void> = []
    const melde = (quelle: Speicherquelle): ((ereignis: SpeicherEreignis) => void) =>
      (ereignis: SpeicherEreignis): void => {
        verarbeite(quelle, ereignis)
        setzeTakt((t) => t + 1)
      }
    try {
      abmeldungen.push(abos.abonniereProjekt(melde('projekt')))
    } catch (fehler) {
      console.error('[app-shell] Das Abo auf die Projekt-Auto-Speicherung scheiterte beim Aufbau.', fehler)
    }
    try {
      abmeldungen.push(abos.abonniereVorlagen(melde('vorlagen')))
    } catch (fehler) {
      console.error('[app-shell] Das Abo auf die Vorlagen-Auto-Speicherung scheiterte beim Aufbau.', fehler)
    }
    return () => {
      for (const abmelden of abmeldungen.splice(0)) {
        try {
          abmelden()
        } catch (fehler) {
          console.error('[app-shell] Eine Abmeldung des Speicherstatus hat geworfen.', fehler)
        }
      }
    }
  }, [abos])

  useEffect(() => aufSpeicherlage(() => setzeTakt((t) => t + 1)), [])

  if (!zeigtHinweis(holeSpeicherlage())) {
    // 'unbekannt' und 'gespeichert' zeigen NICHTS - kein Haken, keine Entwarnung.
    return null as unknown as JSX.Element
  }

  const quellen = betroffeneQuellen(holeSpeicherlage())
  const ortVon = (quelle: Speicherquelle): string =>
    quelle === 'projekt' ? 'das Projekt' : 'die Vorlagen'
  const text = `Änderungen nicht gespeichert: ${quellen
    .map((quelle) => {
      const code = holeSpeicherlage()[quelle].letzterFehlercode
      const ort = ortVon(quelle)
      return code === null ? ort : `${ort} (${code})`
    })
    .join(', ')}.`

  return (
    <div data-testid="speicherhinweis" role="status" style={{ fontSize: 12, padding: '4px 8px', color: '#d9a441' }}>
      {text}
      {/* Entscheidung 23.08.2026: Dauerhaft - verschwindet AUSSCHLIESSLICH durch
          ein { typ: 'gespeichert' } derselben Quelle; kein Schliessen-Knopf. */}
    </div>
  )
}
