// Probe zu #431: Zeigt, welches Anwendungsmenue Electron ohne eigenes `setApplicationMenu`
// anlegt - und ob die Standard-Menuepunkte Cmd+Z / Shift+Cmd+Z als Accelerator beanspruchen.
//
// Beleg: Electron legt auf macOS ein Standardmenue mit `Edit -> Undo (role "undo",
// CommandOrControl+Z)` und `Redo (role "redo", Shift+CommandOrControl+Z)` an. Diese
// Menue-Acceleratoren werden VOR dem Renderer verarbeitet; das `document`-`keydown` des
// Renderers (#350, app-shell/tastatur.ts) sieht Cmd+Z daher nie. Der Treiber sendet die
// Taste dagegen per CDP direkt an die Seite und umgeht das Menue - ein falscher Beleg.
//
// Aufruf: ./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron scripts/pruefe-menue.cjs
const { app, Menu } = require('electron')

app.whenReady().then(() => {
  const menue = Menu.getApplicationMenu()
  if (!menue) {
    console.log('MENUE: null (kein Standardmenue)')
    app.quit()
    return
  }
  console.log('MENUE-Titel:', JSON.stringify(menue.items.map((i) => i.label)))
  for (const punkt of menue.items) {
    if (
      punkt.submenu &&
      punkt.submenu.items.some((s) => s.role === 'undo' || s.role === 'redo')
    ) {
      console.log(
        'EDIT-ACCELERATOREN:',
        JSON.stringify(
          punkt.submenu.items
            .filter((s) => s.role === 'undo' || s.role === 'redo')
            .map((s) => ({ role: s.role, accelerator: s.accelerator })),
        ),
      )
    }
  }
  app.quit()
})
