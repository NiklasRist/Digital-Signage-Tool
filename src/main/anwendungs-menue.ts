// [main] Das Anwendungsmenue der App (#431).
//
// WARUM ES DIESE DATEI GIBT: Ohne eigenes `setApplicationMenu` legt Electron auf macOS ein
// STANDARDMENUE an. Auf diesem Mac gemessen (`scripts/pruefe-menue.cjs`):
//   Edit -> Undo  (role "undo", Accelerator "CommandOrControl+Z")
//   Edit -> Redo  (role "redo", Accelerator "Shift+CommandOrControl+Z")
// Menue-Acceleratoren werden VOR dem Renderer verarbeitet. Der Renderer hoert Cmd+Z ueber
// `app-shell/tastatur.ts` (#350) an `document` - dieses `keydown` erreicht ihn im echten
// Fenster also nie. Folge: Undo/Redo der Projekt-Bearbeitung ist nur ueber die sichtbaren
// Pfeile (#424) erreichbar, Cmd+Z tut nichts. (Der Treiber `scripts/durchlauf.mjs` mass es
// trotzdem gruen, weil er die Taste per CDP direkt an die Seite sendet und das Menue umgeht.)
//
// DIE VORLAGE LAESST DIE EDIT-GRUPPE OHNE Undo/Redo. Cut/Copy/Paste/Select All bleiben -
// nur die beiden Acceleratoren, die dem Renderer im Weg stehen, fallen weg. Damit erreicht
// Cmd+Z die Seite; dort entscheidet `registriereTastaturHandler` (#350), und bei
// fokussiertem Textfeld greift die native Feld-Undo (der Waechter in tastatur.ts).
//
// REIN ALS DATEN: kein `Menu.buildFromTemplate`, kein `setApplicationMenu`. Das tut der
// Aufrufer (index.ts) - und nur auf macOS, denn nur dort gibt es das Standardmenue; auf
// Windows/Linux wird gar kein Menue gesetzt (kein Menuebalken ueber dem Fenster).

import type { MenuItemConstructorOptions } from 'electron'

/** Die Menue-Vorlage fuer macOS: App-Rollen, eine Edit-Gruppe OHNE Undo/Redo, Fenster-Rollen. */
export function menueVorlage(): MenuItemConstructorOptions[] {
  return [
    // Die macOS-App-Rolle (About, Hide, Quit ...) - ohne sie fehlten die Systemmenuepunkte.
    { role: 'appMenu' },
    {
      label: 'Edit',
      submenu: [
        // Undo/Redo FEHLEN absichtlich (s. Kopf). Alles andere bleibt, damit Texteingabe
        // sich wie ueberall verhaelt.
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    { role: 'windowMenu' },
  ]
}
