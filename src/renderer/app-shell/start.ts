// GENERIERT aus dem Signaturblock von Issue #196.
// [app-shell] Start-Ablauf: die Sitzung wiederherstellen
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
// GERUEST-PRUEFSUMME: 2c42008e2a614483
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// [ERLEDIGT: Die Zeile ist mit dem Fuellen des Rumpfes entfernt - alle Parameter
//  und Importe werden benutzt.]

import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { AppKonfig } from '../../shared/contracts/app-konfig'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import {
  type ReiterId,
  istGueltigerReiter,
  wechsleReiter,
  aufReiterGeaendert,
  START_REITER_OHNE_PROJEKT,
  REITER_NACH_PROJEKT_OEFFNEN,
} from './reiter'

/** Der Schlüssel, unter dem der zuletzt aktive Reiter in AppKonfig.uiVoreinstellungen liegt. */
export const UI_SCHLUESSEL_REITER = 'app-shell.aktiverReiter'

/** Der Schlüssel, unter dem der Klappzustand der Warteschlangen-Leiste liegt. */
export const UI_SCHLUESSEL_QUEUE_AUFGEKLAPPT = 'queue-panel.aufgeklappt'

/** Warum kein Projekt wiederhergestellt wurde. Wird der Oberfläche gezeigt, nicht verschluckt. */
export type StartHinweis =
  | { art: 'kein_aktives_projekt' }                              // Erststart oder nie eines geöffnet
  | { art: 'konfig_unlesbar';  code: string; meldung: string }   // leseKonfig hat abgelehnt
  | { art: 'projekt_unlesbar'; projektId: string; code: string; meldung: string }

export type StartErgebnis =
  | { art: 'projekt-geladen'; projekt: Project; reiter: ReiterId }
  | { art: 'kein-projekt';    reiter: 'projekte'; hinweis: StartHinweis }

/**
 * Führt den Start-Ablauf EINMAL aus und setzt dabei den aktiven Reiter (über wechsleReiter).
 * Wirft NIE. Jeder Fehler wird zu `kein-projekt` mit benanntem Hinweis.
 */
export async function starteSitzung(): Promise<StartErgebnis> {
  // Schritt 1 - Konfiguration lesen. Ohne sie gibt es keinen zu öffnenden Kandidaten.
  let konfig: AppKonfig
  try {
    const gelesen: Ergebnis<AppKonfig> = await rufeAuf<AppKonfig>(KANAELE.config.leseKonfig)
    if (!gelesen.ok) {
      wechsleReiter(START_REITER_OHNE_PROJEKT)
      return {
        art: 'kein-projekt',
        reiter: 'projekte',
        hinweis: {
          art: 'konfig_unlesbar',
          code: gelesen.fehler.code,
          meldung: gelesen.fehler.meldung,
        },
      }
    }
    konfig = gelesen.wert
  } catch (ursache) {
    wechsleReiter(START_REITER_OHNE_PROJEKT)
    return {
      art: 'kein-projekt',
      reiter: 'projekte',
      hinweis: {
        art: 'konfig_unlesbar',
        code: 'unbekannter_fehler',
        meldung: grundText(ursache),
      },
    }
  }

  // Schritt 2 - Erststart: kein aktives Projekt vermerkt. Das ist KEIN Fehlerfall.
  if (konfig.aktivesProjektId === null) {
    wechsleReiter(START_REITER_OHNE_PROJEKT)
    return {
      art: 'kein-projekt',
      reiter: 'projekte',
      hinweis: { art: 'kein_aktives_projekt' },
    }
  }

  // Schritt 3 - Das aktive Projekt öffnen (lädt Projekt, Wiederholungsspeicher und räumt
  // auf, #94). Erst danach darf die Oberfläche Medien zeigen - deshalb abgewartet.
  let projekt: Project
  try {
    const geoeffnet: Ergebnis<Project> = await rufeAuf<Project>(
      KANAELE.project.öffneProjekt,
      { id: konfig.aktivesProjektId },
    )
    if (!geoeffnet.ok) {
      wechsleReiter(START_REITER_OHNE_PROJEKT)
      return {
        art: 'kein-projekt',
        reiter: 'projekte',
        hinweis: {
          art: 'projekt_unlesbar',
          projektId: konfig.aktivesProjektId,
          // Der Code wird UNVERAENDERT durchgereicht - nicht umgeschrieben.
          code: geoeffnet.fehler.code,
          meldung: geoeffnet.fehler.meldung,
        },
      }
    }
    projekt = geoeffnet.wert
  } catch (ursache) {
    wechsleReiter(START_REITER_OHNE_PROJEKT)
    return {
      art: 'kein-projekt',
      reiter: 'projekte',
      hinweis: {
        art: 'projekt_unlesbar',
        projektId: konfig.aktivesProjektId,
        code: 'unbekannter_fehler',
        meldung: grundText(ursache),
      },
    }
  }

  // Schritt 4 - Reiter bestimmen. Ein gemerktes 'projekte' wird übergangen (TK 9.14.3):
  // die Projektliste ist die Einstiegsstelle OHNE geladenes Projekt.
  const gemerkt = konfig.uiVoreinstellungen[UI_SCHLUESSEL_REITER]
  const reiter = istGueltigerReiter(gemerkt) && gemerkt !== 'projekte'
    ? gemerkt
    : REITER_NACH_PROJEKT_OEFFNEN
  wechsleReiter(reiter)
  return { art: 'projekt-geladen', projekt, reiter }
}

/**
 * Merkt den aktiven Reiter über den Neustart hinweg: abonniert Reiterwechsel und schreibt den
 * neuen Wert als UI-Voreinstellung. Rückgabewert ist die Abmelde-Funktion.
 * DIESE Datei ist die EINZIGE Stelle der Shell, die eine UI-Voreinstellung schreibt.
 */
export function merkeAktivenReiter(): () => void {
  return aufReiterGeaendert((aktiv) => {
    void rufeAuf<void>(KANAELE.config.setzeUIVoreinstellung, {
      schlüssel: UI_SCHLUESSEL_REITER,
      wert: aktiv,
    })
      .then((ergebnis) => {
        if (!ergebnis.ok) {
          console.warn(`[app-shell] Reiter merken fehlgeschlagen: ${ergebnis.fehler.code}`)
        }
      })
      .catch((ursache) => {
        console.warn('[app-shell] Reiter merken fehlgeschlagen:', grundText(ursache))
      })
  })
}

/**
 * Liest den gemerkten Klappzustand der Warteschlangen-Leiste. Wirft NIE.
 * Fehlt der Wert, ist er kein `boolean` oder scheitert das Lesen, lautet die Antwort `false`
 * (eingeklappt) – s. ENTSCHIEDEN 7.
 */
export async function leseQueueAufgeklappt(): Promise<boolean> {
  let konfig: AppKonfig
  try {
    const gelesen: Ergebnis<AppKonfig> = await rufeAuf<AppKonfig>(KANAELE.config.leseKonfig)
    if (!gelesen.ok) {
      // ok:false → eingeklappt, ohne Hinweis und ohne Wurf (Fehlerpfad-Tabelle).
      return false
    }
    konfig = gelesen.wert
  } catch {
    return false
  }
  // NUR exakt `true` klappt auf; fehlend, 'true', 1 und null lauten `false` (ENTSCHIEDEN 6/7).
  return konfig.uiVoreinstellungen[UI_SCHLUESSEL_QUEUE_AUFGEKLAPPT] === true
}

/**
 * Merkt den Klappzustand über den Neustart hinweg. Wirft NIE und liefert nichts zurück:
 * Ein gescheitertes Schreiben kostet eine Bequemlichkeit, keine Arbeit – das Ergebnis wird
 * trotzdem ausgewertet und intern vermerkt (kein unbehandeltes Promise).
 */
export function merkeQueueAufgeklappt(aufgeklappt: boolean): void {
  void rufeAuf<void>(KANAELE.config.setzeUIVoreinstellung, {
    schlüssel: UI_SCHLUESSEL_QUEUE_AUFGEKLAPPT,
    wert: aufgeklappt,
  })
    .then((ergebnis) => {
      if (!ergebnis.ok) {
        console.warn(`[app-shell] Klappzustand merken fehlgeschlagen: ${ergebnis.fehler.code}`)
      }
    })
    .catch((ursache) => {
      console.warn('[app-shell] Klappzustand merken fehlgeschlagen:', grundText(ursache))
    })
}

/** Lesbarer Grund einer geworfenen Ausnahme - ohne Annahme darüber, was geworfen wurde. */
function grundText(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}
