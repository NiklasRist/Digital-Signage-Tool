// GENERIERT aus dem Signaturblock von Issue #136.
// [action-editor] Aktion anlegen und bearbeiten – Titel ist Pflicht
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 585a63a68616298b
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

import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { DAUER_BEREICH, STANDARD_ANZEIGEDAUER_SEKUNDEN } from '../../shared/contracts/konstanten'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { istAkzentfarbe } from './akzentfarbe'

/** Der Entwurf im Formular: alle Felder der Aktion außer der ID, die der Main vergibt. */
export type AktionsEntwurf = Omit<Aktion, 'id'>

/** Feldbezogene Befunde für die Formularanzeige – KEIN IPC-Fehlercode. */
export type EntwurfBefund =
  | { feld: 'titel'; grund: 'leer' }
  | { feld: 'vorlagenId'; grund: 'leer' }
  | { feld: 'standardDauer'; grund: 'ausserhalb_bereich' }
  | { feld: 'akzentfarbe'; grund: 'kein_hex' }

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

  return befunde
}

function leseAkzentfarbeAlsText(entwurf: Partial<AktionsEntwurf>): string {
  const farbe = entwurf.akzentfarbe
  return typeof farbe === 'string' ? farbe : ''
}

/** Ein leerer Entwurf mit den Vorbelegungen für „Neue Aktion". */
export function leererEntwurf(vorlagenId: string, akzentfarbe: string | null): AktionsEntwurf {
  return {
    titel: '',
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: STANDARD_ANZEIGEDAUER_SEKUNDEN,
    vorlagenId,
    akzentfarbe,
  }
}

/** Legt die Aktion über den Kanal `project:erstelleAktion` an.
 *  Prüft ZUSÄTZLICH zu `pruefeEntwurf`, dass die Pflichtfelder überhaupt vorhanden sind. */
export async function legeAktionAn(entwurf: AktionsEntwurf): Promise<Ergebnis<Aktion>> {
  // SCHRITT 1 - Vollstaendigkeit: Bei einer neuen Aktion gibt es kein "bleibt
  // unverändert". Der Typ sagt vollstaendig, die Laufzeit sagt vielleicht nicht -
  // Formulareingaben ueberleben jede Typannahme nicht.
  for (const pflichtfeld of ['titel', 'vorlagenId', 'akzentfarbe'] as const) {
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
  const texte = befunde.map((befund) => {
    switch (befund.feld) {
      case 'titel':
        return 'titel: Der Titel ist Pflicht und darf nicht leer sein.'
      case 'vorlagenId':
        return 'vorlagenId: Es muss eine Vorlage gewählt sein.'
      case 'standardDauer':
        return `standardDauer: Der Wert liegt außerhalb des erlaubten Bereichs (${DAUER_BEREICH.min}–${DAUER_BEREICH.max} Sekunden).`
      case 'akzentfarbe':
        return 'akzentfarbe: Der Wert ist kein gültiger Hex-Wert (#RRGGBB).'
    }
  })
  return texte.join(' ') + ' Es wurde nichts gespeichert.'
}
