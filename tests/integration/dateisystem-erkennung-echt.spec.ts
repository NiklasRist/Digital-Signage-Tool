import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, describe, expect, it, vi } from 'vitest'

// Integrationstest zur Dateisystem-Erkennung aus #184.
//
// WARUM DIESE DREI TESTS HIER LIEGEN UND NICHT IN tests/unit/ziel-pruefung.spec.ts:
// Sie starten einen ECHTEN PowerShell-Prozess. Am 14.08.2026 standen sie zunaechst in
// der Unit-Datei und haben dort unter Last die 5-Sekunden-Grenze gerissen - waehrend
// mehrere Bau-Agents gleichzeitig liefen, brauchte ein einzelner
// `powershell -NoProfile -Command ...` auf diesem Rechner bis zu 24 Sekunden. Isoliert
// war die Datei gruen, unter Last wechselnd rot; DREI Agents haben sie unabhaengig
// voneinander als Fehlschlag gemeldet und Zeit darauf verwendet zu belegen, dass es
// nicht ihre Aenderung war.
//
// Die Hausregel dagegen gab es laengst - Tests gegen echte Binaries gehoeren nach
// tests/integration/ (so bei #159, #11, #168). Sie war hier nur nicht befolgt worden.
//
// Die Unit-Datei behaelt die Faelle, die die Erkennung STELLEN (vi.spyOn auf
// `dateisystemErkennung.erkenne`) - dort geht es um den Waechter, nicht um die Messung.

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '' } }))

const { dateisystemErkennung } = await import('../../src/main/export-service/ziel-pruefung')

const ordner: string[] = []

function frischerOrdner(): string {
  const p = mkdtempSync(path.join(tmpdir(), 'signage-fs-'))
  ordner.push(p)
  return p
}

afterAll(() => {
  for (const p of ordner) rmSync(p, { recursive: true, force: true })
})

describe('dateisystemErkennung.erkenne gegen das echte Betriebssystem (#184)', () => {
  // Das Experiment ist am 14.08.2026 an drei echten Wechseldatentraegern beantwortet
  // worden (exFAT 117 GB, zweimal FAT32 3,7 GB): `[IO.DriveInfo]::DriveFormat` liefert
  // NTFS/exFAT/FAT32 korrekt, in rund 370 ms einschliesslich Prozessstart.
  it('erkennt das Dateisystem eines echten Ordners, statt aufzugeben', async () => {
    const erkannt = await dateisystemErkennung.erkenne(frischerOrdner())

    if (process.platform === 'win32') {
      // Der Testordner liegt unter <Temp>, also auf der Systemplatte. Zugesichert wird
      // NICHT "NTFS" - das haengt am Rechner -, sondern dass ueberhaupt eine Antwort
      // kommt und dass sie nicht faelschlich `fat32` lautet.
      expect(erkannt).toBe('anderes')
    } else {
      // Auf macOS/Linux ist das Verfahren ungemessen; dort ist `null` die richtige,
      // ehrliche Antwort und keine Luecke.
      expect(erkannt).toBeNull()
    }
  }, 30_000)

  it('gibt bei einem unbrauchbaren Pfad auf, statt zu werfen', async () => {
    // Die Rueckfallregel darf nicht davon abhaengen, dass der Aufrufer faengt: Die
    // Erkennung selbst liefert `null`.
    await expect(dateisystemErkennung.erkenne('')).resolves.toBeNull()
  }, 30_000)

  it('fuehrt einen im Pfad eingeschleusten Befehl NICHT aus', async () => {
    // Der Pfad geht als UMGEBUNGSVARIABLE in die PowerShell, nicht in den Befehlstext.
    // Stuende er im Befehl, verliesse ein Anfuehrungszeichen die Zeichenkette und der
    // Rest liefe als eigener Befehl.
    //
    // WARUM DIESER TEST EINE DATEI BENUTZT: Ein blosser Blick auf den Rueckgabewert
    // kann das nicht zeigen. `DriveInfo` wertet nur die WURZEL des Pfades aus - der
    // Ordner muss gar nicht existieren -, also liefert der Aufruf so oder so 'anderes'.
    // Der eingeschleuste Befehl muss deshalb eine SPUR hinterlassen: Er soll eine Datei
    // anlegen. Bleibt sie aus, ist er nicht gelaufen.
    const ziel = frischerOrdner()
    const spur = path.join(ziel, 'GEKAPERT.txt')
    // Die Klammern werden BEWUSST sauber geschlossen: PowerShell parst die gesamte
    // Zeile, bevor es irgendetwas ausfuehrt. Eine Nutzlast, die einen Syntaxfehler
    // hinterlaesst, laeuft nie - der Test waere dann gruen, ohne etwas zu zeigen.
    // (Genau darauf ist die erste Fassung dieses Tests hereingefallen.)
    const eingeschleust = `C:\\egal'); New-Item -ItemType File -Path '${spur}'; ('`

    const erkannt = await dateisystemErkennung.erkenne(eingeschleust)

    expect(existsSync(spur)).toBe(false)
    // Und der Aufruf liefert weiterhin eine regulaere Antwort, statt zu werfen.
    expect(erkannt === 'anderes' || erkannt === null).toBe(true)
  }, 30_000)
})
