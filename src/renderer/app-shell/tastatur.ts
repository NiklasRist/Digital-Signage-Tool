// #350 - die Tastatur bekommt einen Aufrufer (E11).
//
// `registriereTastaturHandler` lag gebaut und ohne Aufrufer (E2E-Fund: die Historie
// lief, nur die Bedienung fehlte). Die Registrierung sitzt in App.tsx; dort ist
// Realmoeglich heute: Rueckgaengig/Wiederherstellen ueber den Projekt-Zugang
// (#197/9.13). Die anderen Ziele (Vorschau-Play, Listen-Markierung) sind ohne
// moduluebergreifende Aufrufe (Entscheidung E1) von der Shell aus nicht
// erreichbar - ihre Vorgaben bleiben deshalb AUS und die Taste wird nicht
// abgefangen (kein preventDefault auf eine Taste, deren Ziel nicht existiert;
// space wuerde sonst Textfelder kaputt machen). Najhrad: solange keine Verkabelung
// da ist, gar nichts tun, kein Noop munchen.
//
// Signaturen bleiben insgesamt dieselbe Form: EIN Einestiegspunkt, Abbau als
// Rueckgabe. Abweichung vom Erstbau (gemeldet im Issue): Die Vorgaben sind
// optional geworden - eine unverdrahtete Wirkung war vorher Pflicht und haette
// Noop-Funktionen oder globale preventDefault-Effekte erzwungen.

export interface TastaturVorgaben {
  /** Play/Pause in der Vorschau. FEHLT sie, wird "Space" nicht abgefangen. */
  abspielenOderPausiere?(): void
  /** Entfernt das markierte Element in der Liste. FEHLT sie, wird "Delete" nicht abgefangen. */
  entferneMarkiert?(): void
  rueckgaengig?(): void
  wiederherstellen?(): void
  rechts?(): void
  links?(): void
  runter?(): void
  hoch?(): void
}

/**
 * Ist das Ereignisziel ein editierbares Feld (Texteingabe)? Dann gehoert Cmd+Z dem Feld
 * (native Tipp-Undo), nicht der Projekt-Bearbeitung (#431). Rein lesend, wirft nie.
 * `contentEditable` deckt Rich-Text-Felder mit ab; `isContentEditable` fehlt an Nicht-HTMLElementen.
 */
function istEingabefeld(ziel: EventTarget | null): boolean {
  if (!(ziel instanceof HTMLElement)) return false
  const marke = ziel.tagName
  return marke === 'INPUT' || marke === 'TEXTAREA' || ziel.isContentEditable
}

/**
 * Registriert die Tastenkuerzel an `document` und liefert die Abbauroutine.
 * Sie laeuft nach dem Registrieren selbststaendig; ein erneutes Mounten macht
 * nichts Besonderes noetig (Abbau, dann Neu-Registrieren).
 */
export function registriereTastaturHandler(vorgaben: TastaturVorgaben): () => void {
  const laeuft = (ereignis: KeyboardEvent): void => {
    if (ereignis.ctrlKey || ereignis.metaKey) {
      if (ereignis.key.toLowerCase() === 'z') {
        // #431: In einem fokussierten Textfeld gehoert Cmd+Z dem Feld (native Tipp-Undo) -
        // NICHT der Projekt-Bearbeitung. Seit dem eigenen Menue (#431) fehlt die
        // Menue-Rolle "undo", die das vorher abfing; ohne diesen Waechter wuerde Cmd+Z
        // beim Tippen versehentlich das Projekt zuruecknehmen. Kein preventDefault:
        // Chromium macht die Feld-Undo selbst.
        if (istEingabefeld(ereignis.target)) return
        if (vorgaben.rueckgaengig === undefined && vorgaben.wiederherstellen === undefined) return
        ereignis.preventDefault()
        if (ereignis.shiftKey) {
          vorgaben.wiederherstellen?.()
        } else {
          vorgaben.rueckgaengig?.()
        }
      }
      return
    }

    switch (ereignis.key) {
      case " ": {
        if (vorgaben.abspielenOderPausiere === undefined) return
        ereignis.preventDefault()
        vorgaben.abspielenOderPausiere()
        break
      }
      case "Delete": {
        if (vorgaben.entferneMarkiert === undefined) return
        ereignis.preventDefault()
        vorgaben.entferneMarkiert()
        break
      }
      case "ArrowRight": {
        if (vorgaben.rechts === undefined) return
        ereignis.preventDefault()
        vorgaben.rechts()
        break
      }
      case "ArrowLeft": {
        if (vorgaben.links === undefined) return
        ereignis.preventDefault()
        vorgaben.links()
        break
      }
      case "ArrowDown": {
        if (vorgaben.runter === undefined) return
        ereignis.preventDefault()
        vorgaben.runter()
        break
      }
      case "ArrowUp": {
        if (vorgaben.hoch === undefined) return
        ereignis.preventDefault()
        vorgaben.hoch()
        break
      }
      default:
        break
    }
  }

  document.addEventListener("keydown", laeuft)
  return () => document.removeEventListener("keydown", laeuft)
}
