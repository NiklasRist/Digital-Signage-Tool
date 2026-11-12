// [action-editor] Aktion anlegen und bearbeiten – Titel ist Pflicht
//
// UMGESTELLT durch Issue #318 (FA-24, TK v3.4): Die Akzentfarbe ist ein FREIER
// Hex-Wert (sechsstellig, mit #), kein Rollenname. Gegenueber dem alten Text:
//   - Befund { feld: 'akzentfarbe', grund: 'kein_hex' } statt 'keine_rolle'
//   - leererEntwurf nimmt akzentfarbe: string | null statt AkzentRolle
//   - importiert wird istAkzentfarbe aus ./akzentfarbe, nicht istAkzentRolle
//   - 'null' ist ein gueltiger Wert (es gilt der Markenwert, TK 9.10.9) und bleibt
//     befundfrei; ein Rollenname wie 'akzentTief' ist dagegen ein Befund.
// Der Bezeichner markeId kommt in dieser Datei NICHT vor - die Naht zu #319.
//
// UEBRIGES (unveraendert aus #136):
//   - Es gibt GENAU EINE Feldpruefung (pruefeEntwurf); sie nimmt Partial<> und
//     prueft NUR vorhandene Felder - ein fehlendes Feld ist kein Befund.
//   - Die Vollstaendigkeit der drei Pflichtfelder titel/vorlagenId/akzentfarbe
//     prueft ausschliesslich legeAktionAn (nur dort gibt es kein "bleibt
//     unverändert"). markeId ist bewusst NICHT Teil dieser Datei (#319).
//   - standardDauer wird hier STRENGER geprueft als im Main (#38/#39 pruefen das
//     Feld gar nicht): Bereich 10-45 s, AD 4.4 - die Abweichung ist begruendet,
//     die Luecke im Main ist GEMELDET, nicht hier ersetzt.
//   - Gesendet wird ausschliesslich ueber rufeAuf (#24) mit den Kanaelen aus
//     KANAELE (#25); die Ergebnis-Huelle wird UNVERAENDERT durchgereicht, kein
//     throw. Kein direkter window.api-Zugriff, kein Kanal-Literal.
//   - Kein Undo-Stapel (M7/9.13), kein Platzieren in der Liste (composer #123),
//     keine rueckwirkende Anwendung von standardDauer auf Listenelemente.

import type { Aktion, AktionsInhalt } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { DAUER_BEREICH } from '../../shared/contracts/konstanten'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { istAkzentfarbe } from './akzentfarbe'
import { GESTALTUNG_GRENZEN, istHexFarbe, istSchriftRolle } from '../../shared/gestaltung'

/** Der Entwurf im Formular: alle Felder der Aktion außer der ID, die der Main vergibt. */
export type AktionsEntwurf = AktionsInhalt

/** Feldbezogene Befunde für die Formularanzeige – KEIN IPC-Fehlercode. */
export type EntwurfBefund =
  | { feld: 'titel'; grund: 'leer' }
  | { feld: 'vorlagenId'; grund: 'leer' }
  | { feld: 'markeId'; grund: 'leer' }   // NEU mit #319 (FA-23)
  | { feld: 'standardDauer'; grund: 'ausserhalb_bereich' }
  | { feld: 'akzentfarbe'; grund: 'kein_hex' }
  // NEU 05.11.2026 (TK 9.8.8). EIN Befund je Feld, nicht je Zone: Der Editor zeigt die
  // Meldung am Schritt, und die Zone steht darin im Text (`befund-texte.tsx`).
  | { feld: 'zonenGestaltung'; grund: 'kein_hex' | 'ausserhalb_bereich' | 'unbekannte_schrift' }
  | { feld: 'bildAusschnitt'; grund: 'ausserhalb_bereich' }

/** Reine, synchrone Vorabprüfung. Geprüft wird AUSSCHLIESSLICH, was im übergebenen Objekt
 *  tatsächlich vorkommt – ein fehlendes Feld erzeugt KEINEN Befund. Leeres Array heißt
 *  „nichts zu beanstanden", NICHT „vollständig". */
export function pruefeEntwurf(entwurf: Partial<AktionsEntwurf>): EntwurfBefund[] {
  const befunde: EntwurfBefund[] = []

  if ('titel' in entwurf) {
    const titel = entwurf.titel
    if (typeof titel !== 'string' || titel.trim().length === 0) {
      befunde.push({ feld: 'titel', grund: 'leer' })
    }
  }

  if ('vorlagenId' in entwurf) {
    const vorlagenId = entwurf.vorlagenId
    if (typeof vorlagenId !== 'string' || vorlagenId.trim().length === 0) {
      befunde.push({ feld: 'vorlagenId', grund: 'leer' })
    }
  }

  // NEU mit #319 (FA-23): ein VORHANDENES, leeres markeId ist ein Befund. Ein
  // FEHLENDES ist weiterhin keiner - die Vollstaendigkeit prueft allein
  // legeAktionAn (unveraendert aus #136).
  if ('markeId' in entwurf) {
    const markeId = entwurf.markeId
    if (typeof markeId !== 'string' || markeId.trim().length === 0) {
      befunde.push({ feld: 'markeId', grund: 'leer' })
    }
  }

  if ('standardDauer' in entwurf && entwurf.standardDauer !== null) {
    const dauer = entwurf.standardDauer
    if (
      typeof dauer !== 'number' ||
      !Number.isFinite(dauer) ||
      dauer < DAUER_BEREICH.min ||
      dauer > DAUER_BEREICH.max
    ) {
      befunde.push({ feld: 'standardDauer', grund: 'ausserhalb_bereich' })
    }
  }

  if ('akzentfarbe' in entwurf && entwurf.akzentfarbe !== null) {
    const farbe = leseAkzentfarbeAlsText(entwurf)
    if (!istAkzentfarbe(farbe)) {
      befunde.push({ feld: 'akzentfarbe', grund: 'kein_hex' })
    }
  }

  // SEIT 05.11.2026 (TK 9.8.8): Gestaltung je Zone und Bildausschnitt.
  // Geprueft werden NUR die Werte, die da sind - ein fehlendes Feld ist kein Befund
  // (dieselbe Regel wie oben). Die Zonen-KENNUNG wird nicht geprueft: Welche Zonen es
  // gibt, weiss allein die Vorlage, und eine Angabe fuer eine Zone, die eine andere
  // Vorlage hat, ist beim Zurueckwechseln wieder da.
  if ('zonenGestaltung' in entwurf && entwurf.zonenGestaltung !== undefined) {
    for (const gestaltung of Object.values(entwurf.zonenGestaltung ?? {})) {
      for (const farbe of [gestaltung?.textfarbe, gestaltung?.flaechefarbe]) {
        if (typeof farbe === 'string' && !istHexFarbe(farbe)) {
          befunde.push({ feld: 'zonenGestaltung', grund: 'kein_hex' })
          break
        }
      }
      if (gestaltung?.schriftRolle !== undefined && !istSchriftRolle(gestaltung.schriftRolle)) {
        befunde.push({ feld: 'zonenGestaltung', grund: 'unbekannte_schrift' })
      }
      const groesse = gestaltung?.groesseProzent
      if (
        typeof groesse === 'number' &&
        (groesse < GESTALTUNG_GRENZEN.groesseProzent.min || groesse > GESTALTUNG_GRENZEN.groesseProzent.max)
      ) {
        befunde.push({ feld: 'zonenGestaltung', grund: 'ausserhalb_bereich' })
      }
    }
  }

  if ('bildAusschnitt' in entwurf && entwurf.bildAusschnitt !== null && entwurf.bildAusschnitt !== undefined) {
    const { zoom, versatzX, versatzY } = entwurf.bildAusschnitt
    const zahlAusserhalb = (wert: unknown, min: number, max: number): boolean =>
      typeof wert === 'number' && (wert < min || wert > max)
    if (
      zahlAusserhalb(zoom, GESTALTUNG_GRENZEN.zoom.min, GESTALTUNG_GRENZEN.zoom.max) ||
      zahlAusserhalb(versatzX, GESTALTUNG_GRENZEN.versatz.min, GESTALTUNG_GRENZEN.versatz.max) ||
      zahlAusserhalb(versatzY, GESTALTUNG_GRENZEN.versatz.min, GESTALTUNG_GRENZEN.versatz.max)
    ) {
      befunde.push({ feld: 'bildAusschnitt', grund: 'ausserhalb_bereich' })
    }
  }

  return befunde
}

function leseAkzentfarbeAlsText(entwurf: Partial<AktionsEntwurf>): string {
  const farbe = entwurf.akzentfarbe
  return typeof farbe === 'string' ? farbe : ''
}

/** Ein leerer Entwurf mit den Vorbelegungen für „Neue Aktion".
 *
 *  `markeId` kommt seit #320 aus `Project.standardMarkeId`. `standardDauer` ist
 *  seit der Entscheidung vom 03.11.2026 ein PFLICHT-Argument: vorher stand hier
 *  die Konstante 10, und damit koppelte JEDE neue Aktion den Projektstandard ab -
 *  ein Projekt mit 15 s bekam trotzdem Aktionen mit 10 s (AD 4.4, TK 9.8.4:
 *  `null` hiesse „folgt dem Projekt"; ein geschriebener Wert heisst „eigene Dauer").
 *  Der Aufrufer reicht den Projektstandard herein - eine zweite Zahl gibt es nicht. */
export function leererEntwurf(
  vorlagenId: string,
  markeId: string,
  akzentfarbe: string | null,
  standardDauer: number,
): AktionsEntwurf {
  return {
    titel: '',
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer,
    vorlagenId,
    markeId,
    akzentfarbe,
    // SEIT 05.11.2026 (TK 9.8.8): leer heisst „die Vorlage gilt" - nicht „null Farben".
    zonenGestaltung: {},
    bildAusschnitt: null,
    // SEIT 12.11.2026 (FA-27): keine Produktseite hinterlegt. Das Feld ist optional im
    // Vertrag; hier steht es ausdruecklich, damit ein neuer Entwurf nicht `undefined`
    // traegt und der erste Vergleich in `unterschiede` sauber ist.
    produktUrl: null,
  }
}

/** Legt die Aktion über den Kanal `project:erstelleAktion` an.
 *  Prüft ZUSÄTZLICH zu `pruefeEntwurf`, dass die Pflichtfelder überhaupt vorhanden sind. */
export async function legeAktionAn(entwurf: AktionsEntwurf): Promise<Ergebnis<Aktion>> {
  // SCHRITT 1 - Vollstaendigkeit: Bei einer neuen Aktion gibt es kein "bleibt
  // unverändert". Der Typ sagt vollstaendig, die Laufzeit sagt vielleicht nicht -
  // Formulareingaben ueberleben jede Typannahme nicht. Mit #319 vier Pflichtfelder:
  // titel, vorlagenId, markeId, akzentfarbe. `akzentfarbe: null` ist vorhanden und
  // gilt unveraendert aus #318.
  for (const pflichtfeld of ['titel', 'vorlagenId', 'markeId', 'akzentfarbe'] as const) {
    if (entwurf[pflichtfeld] === undefined) {
      return {
        ok: false,
        fehler: {
          code: 'ungueltige_eingabe',
          meldung: `Das Pflichtfeld "${pflichtfeld}" ist nicht gesetzt. Es wurde nichts gespeichert.`,
        },
      }
    }
  }

  // SCHRITT 2 - die EINE Feldpruefung; die Meldung nennt das betroffene Feld.
  const befunde = pruefeEntwurf(entwurf)
  if (befunde.length > 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: meldungZuBefunden(befunde),
      },
    }
  }

  // SCHRITT 3/4 - senden und die Huelle UNVERAENDERT durchreichen.
  return rufeAuf<Aktion>(KANAELE.project.erstelleAktion, { aktionsdaten: entwurf })
}

/** Schreibt geänderte Felder über den Kanal `project:bearbeiteAktion`. */
export async function speichereAktion(
  id: string,
  aenderungen: Partial<AktionsEntwurf>,
): Promise<Ergebnis<Aktion>> {
  // KEINE Vollstaendigkeitsstufe: Eine Teilmenge ist hier der Normalfall (#39 -
  // ein nicht mitgeschicktes Feld bleibt unverändert). Aber eine leere ID
  // kann nie treffen und ist eine Programmierlücke, keine Main-Antwort.
  if (id.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'id: Die Aktion-ID ist leer. Es wurde nichts gespeichert.',
      },
    }
  }

  const befunde = pruefeEntwurf(aenderungen)
  if (befunde.length > 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: meldungZuBefunden(befunde),
      },
    }
  }

  return rufeAuf<Aktion>(KANAELE.project.bearbeiteAktion, { id, aktionsdaten: aenderungen })
}

function meldungZuBefunden(befunde: EntwurfBefund[]): string {
  // Der Rueckgabetyp `string` an der Rueckruf-Funktion ist die SPERRE gegen einen
  // vergessenen Zweig: Ohne `case` waere der Wert `undefined`, und TypeScript bricht hier.
  // Genau das fehlte bis zum 29.10.2026 fuer `markeId` - die Meldung lautete dann
  // " Es wurde nichts gespeichert." ohne Feldnamen und mit fuehrendem Leerzeichen
  // (Charge 22, am laufenden Code gemessen).
  const texte = befunde.map((befund): string => {
    switch (befund.feld) {
      case 'titel':
        return 'titel: Der Titel ist Pflicht und darf nicht leer sein.'
      case 'vorlagenId':
        return 'vorlagenId: Es muss eine Vorlage gewählt sein.'
      case 'markeId':
        return 'markeId: Es muss eine Marke gewählt sein.'
      case 'standardDauer':
        return `standardDauer: Der Wert liegt außerhalb des erlaubten Bereichs (${DAUER_BEREICH.min}–${DAUER_BEREICH.max} Sekunden).`
      case 'akzentfarbe':
        return 'akzentfarbe: Der Wert ist kein gültiger Hex-Wert (#RRGGBB).'
      case 'zonenGestaltung':
        return befund.grund === 'kein_hex'
          ? 'zonenGestaltung: Eine Zonenfarbe ist kein gültiger Hex-Wert (#RRGGBB).'
          : 'zonenGestaltung: Die Textgröße einer Zone liegt außerhalb des erlaubten Bereichs.'
      case 'bildAusschnitt':
        return 'bildAusschnitt: Zoom oder Position liegen außerhalb des erlaubten Bereichs.'
    }
  })
  return texte.join(' ') + ' Es wurde nichts gespeichert.'
}
