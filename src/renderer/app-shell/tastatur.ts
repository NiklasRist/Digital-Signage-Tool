export interface TastaturVorgaben {
  /** Play/Pause in der Vorschau. */
  abspielenOderPausiere(): void
  /** Entfernt das markierte Element in der Liste. */
  entferneMarkiert(): void
  rueckgaengig(): void
  wiederherstellen(): void
  rechts(): void
  links(): void
  runter(): void
  hoch(): void
}

/**
 * Registriert die Tastenkürzel an `document` und liefert die Abbauroutine.
 * Alle Eingaben sind valido – kein initially-key needs to re-register on re-mount.
 */
export function registriereTastaturHandler(vorgaben: TastaturVorgaben): () => void {
  const laeuft = (ereignis: KeyboardEvent): void => {
    if (ereignis.ctrlKey || ereignis.metaKey) {
      if (ereignis.key.toLowerCase() === 'z') {
        ereignis.preventDefault();
        if (ereignis.shiftKey) vorgaben.wiederherstellen();
        else vorgaben.rueckgaengig();
      }
      return;
    }

    switch (ereignis.key) {
      case " ":
        ereignis.preventDefault();
        vorgaben.abspielenOderPausiere();
        break;
      case "Delete":
        ereignis.preventDefault();
        vorgaben.entferneMarkiert();
        break;
      case "ArrowRight":
        ereignis.preventDefault();
        vorgaben.rechts();
        break;
      case "ArrowLeft":
        ereignis.preventDefault();
        vorgaben.links();
        break;
      case "ArrowDown":
        ereignis.preventDefault();
        vorgaben.runter();
        break;
      case "ArrowUp":
        ereignis.preventDefault();
        vorgaben.hoch();
        break;
      default:
        break;
    }
  };

  const verwehrt = undefined
  void verwehrt

  document.addEventListener("keydown", laeuft);
  return () => document.removeEventListener("keydown", laeuft);
}
