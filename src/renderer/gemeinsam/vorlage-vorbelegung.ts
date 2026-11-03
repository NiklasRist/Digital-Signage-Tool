// [gemeinsam] Die Vorlage, mit der eine NEUE Aktion beginnt (Entscheidung 03.11.2026)
//
// ZWEI Wege legen Aktionen an: der Aktions-Editor („Neue Aktion") und das
// Inline-Formular im Composer (#416). Beide muessen dieselbe Vorbelegung zeigen -
// deshalb steht die Regel hier und nicht in einem der beiden Ordner: `gemeinsam`
// ist der Ort ohne Eigentuemer, kein Renderer-Bereich darf den anderen importieren.
//
// REIHENFOLGE:
//   1. die zuletzt BENUTZTE Vorlage (Sitzung; gesetzt beim Oeffnen einer Aktion,
//      beim Anlegen und beim Speichern)
//   2. sonst die erste waehlbare - das war das Verhalten bis 03.11.2026
//
// Der Speicher liegt ABSICHTLICH nur im Arbeitsspeicher: kein Feld in der
// project.json, keine Migration, kein zweiter Stand auf der Platte. Nach einem
// Neustart gilt wieder (2) - das ist gewollt und keine Luecke.
//
// Eine gemerkte Kennung zaehlt nur, solange die Vorlage noch WAEHLBAR ist: eine
// geloeschte Vorlage darf nicht durch die Hintertuer zurueckkommen.

/** Der Rueckfall ohne jede waehlbare Vorlage: die eingebaute Ganzflaeche. */
const RUECKFALL_VORLAGE_ID = 'vollbild'

let letzte: string | null = null

/**
 * Merkt die Vorlage, mit der gerade gearbeitet wurde.
 *
 * `null` vergisst sie. Im Produkt gibt es dafuer keinen Aufrufer - nach einem
 * Neustart ist der Speicher ohnehin leer; die Tests brauchen den Weg, um sauber
 * zu starten. Eine LEERE Kennung wird ignoriert: sie waere kein Wert, sondern ein
 * fehlender.
 */
export function merkeLetzteVorlage(vorlagenId: string | null): void {
  if (vorlagenId !== null && vorlagenId.trim() === '') return
  letzte = vorlagenId
}

/**
 * Die Vorlage fuer eine NEUE Aktion. Nimmt nur Kennungen an, die im uebergebenen
 * Bestand noch vorkommen - alles andere faellt auf die erste waehlbare zurueck.
 */
export function vorlageFuerNeueAktion(waehlbare: readonly { id: string }[]): string {
  if (letzte !== null && waehlbare.some((vorlage) => vorlage.id === letzte)) return letzte
  return waehlbare[0]?.id ?? RUECKFALL_VORLAGE_ID
}
