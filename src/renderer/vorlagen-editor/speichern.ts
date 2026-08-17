// GENERIERT aus dem Signaturblock von Issue #149.
// [vorlagen-editor] Speichern: überarbeiten, als neue Vorlage, verwerfen
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
// GERUEST-PRUEFSUMME: 06e777be8c43ec05
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

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
  // 1. eingebauter Parent: sofort abbrechen, OHNE jeden IPC-Aufruf. Derselbe Code, den
  //    der Store vergeben wuerde; der Ersatztext ist die importierte Konstante aus #143.
  if (!sitzung.ueberarbeitenErlaubt) {
    return {
      ok: false,
      fehler: {
        code: 'parent_eingebaut',
        meldung: sitzung.ueberarbeitenGrund ?? GRUND_PARENT_EINGEBAUT,
      },
    }
  }

  const sperre = blockierendeSperre(sitzung, stand)
  if (sperre !== null) {
    return sperre
  }

  // 3. sichereStand VOR dem Merge (Verbot – die Reihenfolge nicht umstellen):
  //    uebernehmeInParent liest die Arbeitskopie aus dem Store-Bestand, nicht vom Bildschirm.
  const gesichert = await sichereStand(sitzung, stand)
  if (!gesichert.ok) {
    // Fehlschlag verhindert den Merge; Code unveraendert durchreichen.
    return gesichert
  }

  // 4. Der Merge - nur auf dem gesicherten Stand.
  try {
    const ergebnis = await rufeAuf<Vorlage, string>(KANAELE.vorlagen.uebernehmeInParent, {
      arbeitsId: sitzung.arbeitsId,
    })
    // 5. Neuladen NUR bei Erfolg und NACH dem Kanalaufruf; dessen Ergebnis bleibt unberuehrt,
    //    auch wenn das Neuladen scheitert (ein Wurf wird gefangen, nicht weitergereicht).
    return ladeSichtUndReicheDurch(ergebnis, sichtNeuLaden)
  } catch (ursache) {
    // `rufeAuf` wirft, wenn die Preload-Bruecke fehlt (#24) - kein throw ueber die Grenze.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }
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
  // 1. Name pruefen: nach trim() nicht leer und hoechstens 80 Zeichen. Uebergeben wird der
  //    GETRIMMTE Name. Kein ueberarbeitenErlaubt-Test - dieser Weg steht eingebaut offen.
  const getrimmt = neuerName.trim()
  if (getrimmt === '' || getrimmt.length > 80) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Der Name der neuen Vorlage darf nicht leer sein und hoechstens 80 Zeichen umfassen.',
      },
    }
  }

  const sperre = blockierendeSperre(sitzung, stand)
  if (sperre !== null) {
    return sperre
  }

  // 3. sichereStand VOR alsEigenstaendige: die Zonen kommen aus dem Store-Bestand.
  const gesichert = await sichereStand(sitzung, stand)
  if (!gesichert.ok) {
    return gesichert
  }

  // 4. Die Verselbststaendigung am gespeicherten Eintrag, mit dem getrimmten Namen.
  try {
    const ergebnis = await rufeAuf<Vorlage, string>(KANAELE.vorlagen.alsEigenstaendige, {
      arbeitsId: sitzung.arbeitsId,
      name: getrimmt,
    })
    return ladeSichtUndReicheDurch(ergebnis, sichtNeuLaden)
  } catch (ursache) {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }
}

/** „Verwerfen" – der Bearbeitungsstand wird fallengelassen, der Parent bleibt unverändert. */
export async function verwerfeBearbeitung(
  sitzung: EditorSitzung,
  sichtNeuLaden: SichtNeuLaden,
): Promise<Ergebnis<void, string>> {
  // 1. KEIN sichereStand, KEINE Pruefung - der Stand ist egal, auch eine kaputte Arbeit
  //    soll verworfen werden koennen.
  try {
    const ergebnis = await rufeAuf<void, string>(KANAELE.vorlagen.verwerfeArbeitskopie, {
      arbeitsId: sitzung.arbeitsId,
    })
    // 3. Auch das Verwerfen aendert den Bestand - die Uebersicht wird neu geladen.
    return ladeSichtUndReicheDurch(ergebnis, sichtNeuLaden)
  } catch (ursache) {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }
}

/**
 * Die Sperren-Pruefung der beiden Speicherwege: mindestens ein Befund mit schwere 'sperre'
 * blockiert JEDEN der beiden Wege (TK 9.12.2), Warnungen blockieren nie. Die Befunde reisen
 * in `daten`, damit die Oberflaeche die betroffenen Zonen benennen kann.
 */
function blockierendeSperre(sitzung: EditorSitzung, stand: Vorlage): Ergebnis<Vorlage, string> | null {
  const befunde = pruefeVorlage(stand, sitzung.festeZonenSoll)
  if (istSpeicherbar(befunde)) {
    return null
  }
  const anzahlSperren = befunde.filter((befund: Befund) => befund.schwere === 'sperre').length
  return {
    ok: false,
    fehler: {
      code: 'ungueltige_eingabe',
      meldung: `${anzahlSperren} Sperre(n) blockieren das Speichern.`,
      daten: { befunde },
    },
  }
}

/**
 * Nach dem Kanalaufruf: die Sicht NEU laden, aber nur bei Erfolg, und der Rueckgabewert der
 * Speicherfunktion bleibt davon unberuehrt. Ein gescheitertes Neuladen macht aus einem
 * geglueckten Speichern KEINEN Fehler (TK 9.7.3) - ein Wurf wird gefangen, nicht weitergereicht.
 */
async function ladeSichtUndReicheDurch<T>(
  ergebnis: Ergebnis<T, string>,
  sichtNeuLaden: SichtNeuLaden,
): Promise<Ergebnis<T, string>> {
  if (!ergebnis.ok) {
    return ergebnis
  }
  try {
    await sichtNeuLaden()
  } catch {
    // Gespeichert ist gespeichert; die Sicht ist veraltet, aber das Speichern bleibt Erfolg.
  }
  return ergebnis
}
