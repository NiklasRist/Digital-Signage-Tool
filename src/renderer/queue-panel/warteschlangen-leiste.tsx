import type { JSX } from "react";

// Die Warteschlangen-Leiste (#10) - hier NUR als leere Zeile mit fester Hoehe.
//
// Sie steht bewusst AUSSERHALB des Reiter-Wechsels: "Die Warteschlangen-Leiste ist in
// jedem Reiter sichtbar. Sie ist die einzige Stelle, an der laufende, anstehende und
// fehlgeschlagene Auftraege erkennbar sind (FA-16) - sie darf nie hinter einem
// Moduswechsel verschwinden." (TK 9.14.2)
//
// Warum sie hier LEER bleibt und keinen Beispieltext traegt: Ein Platzhaltertext wie
// "Keine Auftraege" waere eine Tatsachenbehauptung ueber einen Zustand, den diese
// Datei nicht kennt - sie fragt nichts ab. Beim Start liegen typischerweise bereits
// Fehlschlaege aus Q2 vor (persistent, TK 9.3.5); ein fest eingebautes "keine
// Auftraege" waere dann schlicht falsch, und zwar genau in dem Moment, in dem die
// Leiste zaehlt.
//
// Wer sie fuellt, steht fest und ist NICHT dieses Issue: Das zustaendige M7-Issue
// ruft beim Aufbau einmal `holeStand()` und abonniert ERST DANACH `queue:geaendert`
// (TK 9.14.2). Die umgekehrte Reihenfolge waere falsch - die Antwort auf `holeStand()`
// koennte einen aelteren Stand tragen als ein zwischenzeitlich empfangenes Ereignis
// und es ueberschreiben.

/** Feste Hoehe der eingeklappten Leiste. */
const HOEHE_PX = 32;

export function WarteschlangenLeiste(): JSX.Element {
  return (
    <footer
      data-testid="warteschlangen-leiste"
      style={{
        height: HOEHE_PX,
        flex: "0 0 auto",
        borderTop: "1px solid #444",
      }}
    />
  );
}
