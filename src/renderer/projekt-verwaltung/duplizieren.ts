import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { ProjektMeta } from './liste'

/** Frühe Rückmeldung auf den eingegebenen Namen. KEIN Ersatz für die Prüfung im Main. */
export type Namenspruefung = { ok: true; name: string } | { ok: false; grund: 'leer' }

/** Schneidet führende/folgende Leerzeichen ab und weist einen danach leeren Namen zurück.
 *  Es wird NICHTS anderes geprüft (s. ENTSCHIEDEN 4). */
export function pruefeDuplikatname(eingabe: string): Namenspruefung {
  const name = eingabe.trim()
  if (name.length === 0) {
    return { ok: false, grund: 'leer' }
  }
  return { ok: true, name }
}

/** Der vorbelegte Vorschlag für das Eingabefeld: `<name> Kopie` (s. ENTSCHIEDEN 3). */
export function schlageDuplikatnamenVor(meta: ProjektMeta): string {
  return `${meta.name} Kopie`
}

/**
 * Der Hinweis, der VOR dem Auslösen zu zeigen ist. Nennt die Anzahl der mitkopierten Medien,
 * dass es dauern kann, und dass die gerenderten Ausgabedateien NICHT mitkopiert werden.
 * Liefert `null`, wenn `anzahlMedien` keine brauchbare Zahl ist (s. ENTSCHIEDEN 5).
 */
export function baueDuplizierHinweis(meta: ProjektMeta): string | null {
  if (typeof meta.anzahlMedien !== 'number' || !Number.isFinite(meta.anzahlMedien) || meta.anzahlMedien < 0) {
    return null
  }
  return `Es werden ${meta.anzahlMedien} Mediendateien kopiert. Dieser Vorgang kann einige Zeit in Anspruch nehmen. Die gerenderten Ausgabedateien werden nicht mitkopiert.`
}

/** Was der Aufrufer während des Laufs anzeigen und danach tun muss. */
export interface DuplizierWirkungen {
  /** Lädt die Projektliste neu (#222). Pflicht: sonst fehlt das Duplikat in der Übersicht. */
  aktualisiereProjektliste: () => Promise<unknown>
}

/**
 * Dupliziert das Projekt und frischt danach die Liste auf.
 * Öffnet das Duplikat NICHT (s. ENTSCHIEDEN 2) und wechselt KEINEN Reiter.
 */
export async function dupliziereProjekt(
  quellId: string,
  eingabe: string,
  wirkungen: DuplizierWirkungen,
): Promise<Ergebnis<Project, string>> {
  const pruefung = pruefeDuplikatname(eingabe)
  if (!pruefung.ok) {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'Der Name darf nicht leer sein.' } }
  }

  const ergebnis = await rufeAuf<Project, string>(KANAELE.project.dupliziereProjekt, {
    id: quellId,
    neuerName: pruefung.name,
  })

  if (ergebnis.ok) {
    try {
      await wirkungen.aktualisiereProjektliste()
    } catch {
      // Ignorieren: Das Duplikat existiert, nur die Anzeige ist veraltet
    }
  }

  return ergebnis
}
