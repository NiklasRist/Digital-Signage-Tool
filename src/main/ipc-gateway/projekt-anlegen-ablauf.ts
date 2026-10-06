// GENERIERT aus dem Signaturblock von Issue #328.
// [project-store] erstelleProjekt(name, standardMarkeId) – ein neuer Ablauf, der die
// EINGEBAUTE Marke über listeMarken() holt und erstelleProjekt (#33) damit ruft.
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellet, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 62477cb2f1c0bbf3

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'
import type { ProjectStoreFehlercode } from '../project-store/assets'
import type { MarkenFehlercode } from '../marken-store/fehlercodes'
import { erstelleProjekt } from '../project-store/erstelle-projekt'
import { listeMarken } from '../marken-store/liste'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #282: listeMarken(): Promise<Ergebnis<Marke[], MarkenFehlercode>>
//         // alle Marken des Bestands, jede AUFGELOEST, in BESTANDSREIHENFOLGE
//   #33:  erstelleProjekt(name: string, standardMarkeId: string): Promise<Ergebnis<Project, ProjectStoreFehlercode>>

/**
 * Holt die EINGEBAUTE Marke und legt damit das Projekt an. KEIN Zustand, KEIN Lock, KEIN fs,
 * KEIN ipcMain, KEINE eigene Namenspruefung, KEIN Zwischenspeicher.
 *
 * Reihenfolge ist festgelegt (ENTSCHIEDEN 7): ERST die Marke, DANN das Projekt - ein
 * Marken-Fehler darf keinen Projektordner mit einem vertragswidrigen project.json
 * zuruecklassen. Die Existenzpruefung sitzt NICHT im project-store (der Ring); der
 * Handler liegt eine Schicht ueber beiden - dieselbe Rolle wie bei oeffneProjektAblauf (#94).
 */
export async function erstelleProjektAblauf(
  name: string,
): Promise<Ergebnis<Project, ProjectStoreFehlercode | MarkenFehlercode>> {
  const markenErgebnis = await listeMarken()
  if (!markenErgebnis.ok) {
    // UNVERAENDERT durchgereicht: kein Auspacken, kein Anreichern, kein Code-Umschreiben.
    return markenErgebnis
  }

  // Der ERSTE Eintrag mit eingebaut === true, in BESTANDSREIHENFOLGE - nicht sortieren,
  // nicht filtern, nicht einfach wert[0] nehmen (ENTSCHIEDEN 4).
  const eingebaute = markenErgebnis.wert.find((marke) => marke.eingebaut)
  if (eingebaute === undefined) {
    // ENTSCHIEDEN 2 + 3: der bereits geschlossene CodeTK 9.15.5, kein neuer Code, keine
    // Ersatzmarke (kein wert[0], keine erste eigenstaendige Marke, kein Anlegen von hier).
    return {
      ok: false,
      fehler: {
        code: 'marke_nicht_gefunden',
        meldung: 'erstelleProjektAblauf: Es steht keine eingebaute Marke (eingebaut: true) im Bestand - ein Projekt braucht sie als Standard.',
      },
    }
  }

  return erstelleProjekt(name, eingebaute.id)
}
