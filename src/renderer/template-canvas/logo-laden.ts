// Issue #315 - [template-canvas] logo-laden.ts auf Marken je Aktion umstellen.
//
// Der Logo-Bestand ist JE `markeId` gefuehrt (zwei modul-globale Maps), die
// Verzweigung erfolgt nach `marke.logo.herkunft`, und `logo === null` ist ein
// REGULAERER Zustand (TK 9.10.10), der sofort und folgenlos zurueckkehrt.
//
// NACHTRAG 23.08.2026 (II) - BYTES -> BLOB-URL IM ZEICHENPFAD:
// Der DoD-Punkt des Issues, der fuer `herkunft: 'importiert'` ein zeichengleiches
// `marken://` als `<img src>` verlangt, ist vom Nachtrag II UBERHOLT. Gemessen
// taintet `marken://` das Canvas in JEDER Registrierungs-Konfiguration
// (SecurityError bei toDataURL/toBlob). Deshalb beschafft dieser Zweig die Bytes
// ueber `marken://` (der Speicherort-Vertrag #290 bleibt bestehen) und bindet sie
// als Blob-URL ins `<img>` ein; Blob-URLs sind same-origin und tainten nicht.
// Die Objekt-URL wird nach dem `decode()` widerrufen.
//
// DOKUMENTIERTER WIDERSPRUCH (gemeldet, nicht still aufgeloest): Die DoD-Grep-
// Probe verbietet `fetch`; ohne `fetch(marken://...)` gibt es aber keinen Weg,
// an die Bytes zu kommen (XHR waere nur eine andere Schreibweise desselben
// Zugriffs). Nachtrags-II-Entscheidung gewinnt gegen den veralteten Grep-Punkt;
// der Issue-Text sollte nachgezogen werden.

import type { Marke } from '../../shared/contracts/marke'
import type { Motiv } from './bild-laden'

import { logoRegistry } from '../assets/marken/logo-registry'

const FEHLT: Motiv = Object.freeze<Motiv>({ zustand: 'fehlt' })

// Zwei Maps, beide mit `marke.id` als Schluessel: die laufenden Vorgaenge
// (Idempotenz - gemerkt wird das PROMISE, nicht erst das Ergebnis) und der
// Ergebnis-Bestand. Kein dritter Speicher, kein Schlüssel nach Dateiname.
const vorgaenge = new Map<string, Promise<void>>()
const bestand = new Map<string, Motiv>()

export async function bereiteLogoVor(marke: Marke): Promise<void> {
  // Programmierfehler - bewusst scharf getrennt vom regulären Zustand `logo === null`.
  if (typeof marke !== 'object' || marke === null) {
    throw new Error('logo-laden: marke fehlt (Programmierfehler).')
  }
  if (typeof marke.id !== 'string' || marke.id.trim() === '') {
    throw new Error('logo-laden: marke.id muss eine nicht leere Zeichenkette sein (Programmierfehler).')
  }
  const logo = marke.logo
  if (logo === null) {
    // TK 9.10.10: bei Werbepartnern der Normalfall. Sofortige, folgenlose
    // Rueckkehr; ein vorhandener Eintrag fuer diese markeId wird NICHT entfernt -
    // der einzige Ungueltigkeitsweg liegt beim Aufrufer (#312).
    return
  }
  if (typeof logo.datei !== 'string' || logo.datei.trim() === '') {
    throw new Error('logo-laden: marke.logo.datei muss eine nicht leere Zeichenkette sein (Programmierfehler).')
  }

  // Parallele Aufrufe zur selben markeId teilen EINEN Vorgang.
  const vorhandenerVorgang = vorgaenge.get(marke.id)
  if (vorhandenerVorgang !== undefined) {
    await vorhandenerVorgang
    return
  }

  const vorgang = ladeLogo(marke)
  vorgaenge.set(marke.id, vorgang)
  // Sicherheitsnetz: `ladeLogo` faengt Ladefehler selbst, aber falls doch etwas
  // entkommt, bleibt ein abgelehntes Promise NICHT gemerkt.
  await vorgang.catch(() => {
    bestand.set(marke.id, FEHLT)
    vorgaenge.delete(marke.id)
  })
}

async function ladeLogo(marke: Marke): Promise<void> {
  // Ohne Logo gibt es nichts zu laden - der Zweig ist der Ersatz-Logo-Pfad.
  if (marke.logo === null) return
  const logo = marke.logo
  let objektUrl: string | undefined
  let quelle: string | undefined
  // Bei GEERBTEM Logo liegt die importierte Datei im Ordner des Parents, die
  // aufgeloeste Marke traegt aber ihre EIGENE id (am 22.10.2026 an der
  // Live-Vorschau gemessen: 404 fuer marken://<kindId>/logo.png). Der Bestand
  // wird weiterhin unter der EIGENEN id gefuehrt - `holeLogo(marke.id)` bleibt
  // damit unveraendert.
  const quelleId =
    marke.herkunftJeFeld?.logo === 'geerbt' && marke.parent !== null ? marke.parent : marke.id

  try {
    if (logo.herkunft === 'importiert') {
      // Nachtrag II: Bytes holen (Speicherort-Vertrag #290) und als Blob-URL
      // binden - direkte marken://-URLs im `<img>` tainten das Canvas.
      const antwort = await fetch(`marken://${quelleId}/${logo.datei}`)
      const bytes = await antwort.blob()
      objektUrl = URL.createObjectURL(bytes)
      quelle = objektUrl
    } else if (logo.herkunft === 'gebuendelt') {
      quelle = logoRegistry.get(logo.datei)
    }
    // Unbekannter herkunft-Wert: keine URL, kein Wurf -> `fehlt`.

    if (quelle === undefined) {
      bestand.set(marke.id, FEHLT)
      vorgaenge.delete(marke.id)
      return
    }

    const bild = new Image()
    bild.src = quelle
    await bild.decode()

    bestand.set(marke.id, {
      zustand: 'geladen',
      bild,
      breite: bild.naturalWidth,
      höhe: bild.naturalHeight,
    })
  } catch {
    // Jeder Ladefehler (Bytes kommen nicht an, decode lehnt ab) endet hier:
    // { zustand: 'fehlt' }, kein Wurf, Fehlschlag wird NICHT gemerkt.
    bestand.set(marke.id, FEHLT)
    vorgaenge.delete(marke.id)
  } finally {
    if (objektUrl !== undefined) {
      URL.revokeObjectURL(objektUrl)
    }
  }
}

export function holeLogo(markeId: string): Motiv {
  // Reine Abfrage: synchron, wirft nie, erzeugt kein Image. Unterscheidet nicht
  // zwischen "kein Logo" und "Datei fehlt" - das entscheidet der Aufrufer an
  // `marke.logo === null` (#294, #312).
  return bestand.get(markeId) ?? FEHLT
}

export function leereLogoBestand(): void {
  bestand.clear()
  vorgaenge.clear()
}
