// GENERIERT aus dem Signaturblock von Issue #149.
// [vorlagen-editor] Speichern: überarbeiten, als neue Vorlage, verwerfen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { GRUND_PARENT_EINGEBAUT, sichereStand, type EditorSitzung } from './arbeitskopie'
import { istSpeicherbar, pruefeVorlage, type Befund } from './pruefungen'

/**
 * Die Neulade-Funktion der gemeinsamen Vorlagen-Sicht – das ist `ladeUebersicht` aus #155. Sie
 * wird als PARAMETER hereingereicht und NICHT importiert (s. „ENTSCHIEDEN – wie die Oberfläche vom
 * neuen Stand erfährt"). Ihr Rückgabewert wird hier nicht ausgewertet, deshalb `unknown`.
 */
export type SichtNeuLaden = () => Promise<unknown>

/**
 * „Vorlage überarbeiten" – der Stand wandert VOLLSTÄNDIG in den Parent, die Arbeitskopie
 * verschwindet. Liefert den PARENT in seinem neuen Zustand.
 */
export async function ueberarbeiteVorlage(
  sitzung: EditorSitzung,
  stand: Vorlage,
  sichtNeuLaden: SichtNeuLaden,
): Promise<Ergebnis<Vorlage, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #149."
  );
}

/**
 * „Als neue eigenständige Vorlage" – die Arbeitskopie wird selbst zur Vorlage (parent = null),
 * der bisherige Parent bleibt unverändert. Liefert die neue eigenständige Vorlage.
 */
export async function alsNeueVorlage(
  sitzung: EditorSitzung,
  stand: Vorlage,
  neuerName: string,
  sichtNeuLaden: SichtNeuLaden,
): Promise<Ergebnis<Vorlage, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #149."
  );
}

/** „Verwerfen" – der Bearbeitungsstand wird fallengelassen, der Parent bleibt unverändert. */
export async function verwerfeBearbeitung(
  sitzung: EditorSitzung,
  sichtNeuLaden: SichtNeuLaden,
): Promise<Ergebnis<void, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #149."
  );
}
