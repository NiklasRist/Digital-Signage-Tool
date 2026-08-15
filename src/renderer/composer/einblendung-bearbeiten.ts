// GENERIERT aus dem Signaturblock von Issue #129.
// [composer] Einblendung am Video-Element bearbeiten
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
// GERUEST-PRUEFSUMME: ff5f03f75c77f336
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// [ERLEDIGT: Die Zeile ist mit dem Fuellen des Rumpfes entfernt - alle Parameter
//  und Importe werden benutzt.]
//
// ============================================================================
// DIE HAUPTBETRIEBSART - UND WAS DIESE DATEI DESHALB NICHT TUT
// ============================================================================
// Das parallele Werbeband ist die Hauptbetriebsart des Produkts (FA-20). Was hier
// zusammengestellt wird, wird im Render zur Bandspur (TK 9.2.8) und bestimmt
// zugleich die Geometrie des Videos - bei `split` schrumpft das Bild auf `1080 - H`.
//
// DREI DINGE FEHLEN DESHALB ABSICHTLICH:
//
// 1. KEINE HOEHE. „Die Bandhoehe `H` stammt ausschliesslich aus der Vorlage - sie
//    ist kein Wert am Listenelement und nicht pro Element ueberschreibbar." (TK
//    9.2.8) Der Typ `Einblendung` (#15) hat genau zwei Felder, `bandVorlageId` und
//    `abschnitte`; ein Hoehenfeld gibt es nicht, weder zum Setzen noch zum Pruefen.
//    Ob eine Hoehe gerade ist und ob die Split-Geometrie aufgeht, entscheidet der
//    `vorlagen-store` beim Anlegen der Vorlage - nicht diese Datei.
//
// 2. KEINE VORLAGE JE ABSCHNITT. „Alle Abschnitte eines Elements nutzen dieselbe
//    Band-Vorlage (eine `bandVorlageId` pro Einblendung) - damit `H` und die
//    Kompositionsart waehrend eines Videos nicht wechseln. Ein Wechsel mitten im
//    Video wuerde die Geometrie springen lassen." (TK 9.2.8) `BandEntwurf.abschnitte`
//    traegt deshalb kein Vorlagenfeld, und es gibt keine Funktion, die einem
//    einzelnen Abschnitt eine Vorlage zuweist.
//
// 3. KEINE ARBEITSKOPIEN IN DER AUSWAHL. „Halbfertige Arbeitskopien stehen nicht zur
//    Auswahl fuer Aktionen - sie koennen also nicht versehentlich in ein Video
//    geraten." (Anforderungsdokument 4.6) Der Filter `parent === null` ist
//    bedingungslos.
//
// KEINE RUNDUNG, KEIN DAUERBEREICH. Die Frame-Rundung gehoert in den render-service
// (TK 9.2.6) und in die Wirkungsanzeige (#130); wuerde hier gerundet GESPEICHERT,
// waere die Nutzereingabe nach dem Speichern eine andere als eingegeben. Und der
// Bereich 10-45 s gilt laut TK fuer `setzeDauer` (Bild/Segment), NICHT fuer
// Band-Abschnitte - eine hier erfundene Grenze waere eine zweite Wahrheit neben dem
// Main. Geprueft wird nur, was ohne Projektwissen pruefbar ist.
//
// KEIN ROLLBACK IN DIESER DATEI. „Fehlerklasse 1 - Operation abgelehnt (synchron):
// [...] -> optimistischen Schritt rueckgaengig machen [...] Fehlerklasse 2 -
// Auto-Speichern fehlgeschlagen [...] -> kein Rollback; dauerhafter ,nicht
// gespeichert'-Hinweis + automatischer Wiederholversuch" (TK 9.7.3). Beide Klassen
// unterscheidet ausschliesslich der Fehlercode, und die Entscheidung faellt in
// optimistisch.ts (#126). Diese Datei reicht das `Ergebnis` deshalb UNVERAENDERT
// durch - wer hier einen Code ersetzte oder in einen Wurf umwandelte, naehme dem
// Aufrufer genau die Unterscheidung, an der die beiden Klassen haengen.
//
// KEINE OBERFLAECHE, KEIN DIALOG. `wechsleBandVorlage` aendert nur den ENTWURF; ins
// Projekt gelangt er erst mit `uebernehmeBand`. Solange nichts geschrieben ist, gibt
// es nichts zu bestaetigen - deshalb hier weder `confirm` noch ein Dialog.

import type { Listenelement, Einblendung } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

export interface BandEntwurf {
  bandVorlageId: string
  abschnitte: Array<{ aktionRef: string; dauer: number }>   // Reihenfolge = Abspielreihenfolge
}

/** Der einzige Fehlerausgang dieser Datei. Kein `throw` verlaesst sie: Die Signatur
 *  lautet auf `Ergebnis`, und der Aufrufer prueft `ok`, er faengt nichts. */
function fehler(meldung: string): Ergebnis<Listenelement> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/** Ein nicht leerer Text. Auch reine Leerzeichen zaehlen als leer - dieselbe Grenze,
 *  die die Nutzlast-Pruefung des ipc-gateway zieht (vgl. dauer-regler.ts). */
function istGefuellt(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.trim() !== ''
}

/** Ein Index, der auf einen vorhandenen Abschnitt zeigt.
 *
 *  `Number.isInteger` und nicht nur `>= 0 && < length`: `1.5` bestuende den
 *  Bereichstest, `abschnitte[1.5]` waere aber `undefined`, und ein Entnehmen mit
 *  `splice(1.5, 1)` traefe ueberraschend den Abschnitt 1. Ein krummer Index ist ein
 *  Programmierfehler des Aufrufers, kein Bedienwunsch - er faellt in denselben
 *  Randfall wie `-1`: Entwurf unveraendert. */
function istIndex(index: number, laenge: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < laenge
}

/** Die Vorlagen, die als Band-Vorlage angeboten werden dürfen. Reine Filterung, keine Sortierung. */
export function waehlbareBandVorlagen(vorlagen: readonly Vorlage[]): Vorlage[] {
  // `vollflaeche` scheidet aus: Eine vollflaechige Vorlage hat keine Bandhoehe
  // (`höhe === null`) und waere als Band nicht komponierbar - TK 9.2.8 leitet die
  // gesamte Geometrie aus `H` ab.
  //
  // GEFILTERT WIRD UEBER `art`, NICHT UEBER `höhe !== null`. Das sieht gleichwertig
  // aus, ist es aber nicht: `art` ist laut #95 nach dem Anlegen unveraenderlich und
  // benennt die KOMPOSITIONSART, `höhe` ist ein Zahlenfeld, das bei einem von Hand
  // veraenderten Vorlagenbestand auch mal an einer `vollflaeche` stehen kann. Der
  // Filter liefe dann eine vollflaechige Vorlage als Band an.
  //
  // KEINE SORTIERUNG und kein `slice().sort()`: „Die Reihenfolge ist die der
  // Eingabeliste. Eine eigene Sortierung waere eine zweite, unsichtbare Ordnung neben
  // der gespeicherten." (Issue #129)
  //
  // `filter` liefert ohnehin ein NEUES Array - die uebergebene `readonly`-Liste wird
  // nicht angefasst.
  return vorlagen.filter(
    (vorlage) =>
      (vorlage.art === 'split' || vorlage.art === 'einblendung') && vorlage.parent === null,
  )
}

/** Entwurfsbearbeitung – rein lokal, ohne IPC, ohne Seiteneffekt. Liefert je einen NEUEN Entwurf. */
export function fuegeAbschnittAn(entwurf: BandEntwurf, aktionRef: string, dauer: number): BandEntwurf {
  // NEUES Objekt UND neues Array. Der `composer` arbeitet optimistisch mit Abgleich
  // (TK 9.7.3); ein zurueckgenommener Schritt braucht den UNVERAENDERTEN Vorzustand.
  // Ein `entwurf.abschnitte.push(...)` haette ihn zerstoert - und zwar auch im
  // scheinbar neuen Objekt, weil `{ ...entwurf }` das Array nur als Referenz
  // uebernimmt.
  //
  // HIER WIRD NICHT GEPRUEFT. Ein halb ausgefuellter Entwurf ist ein normaler
  // Zwischenstand der Bedienung (der Nutzer haengt einen Abschnitt an und tippt die
  // Dauer danach). Geprueft wird beim UEBERNEHMEN, also genau dort, wo etwas ins
  // Projekt gelangt - eine Ablehnung mitten im Tippen waere keine Sicherheit,
  // sondern eine Sperre.
  return {
    bandVorlageId: entwurf.bandVorlageId,
    abschnitte: [...entwurf.abschnitte, { aktionRef, dauer }],
  }
}
export function entferneAbschnitt(entwurf: BandEntwurf, index: number): BandEntwurf {
  // Ausserhalb `[0, length)` -> „den Entwurf unveraendert zurueckgeben, kein Wurf"
  // (Issue #129). Zurueckgegeben wird dabei DIESELBE Referenz: „unveraendert" ist
  // hier woertlich zu nehmen, und ein frisch gebautes Zwillingsobjekt liesse eine
  // Oberflaeche, die auf Referenzgleichheit neu zeichnet, bei jedem Fehlgriff
  // umsonst arbeiten.
  if (!istIndex(index, entwurf.abschnitte.length)) return entwurf

  return {
    bandVorlageId: entwurf.bandVorlageId,
    abschnitte: entwurf.abschnitte.filter((_, stelle) => stelle !== index),
  }
}
export function verschiebeAbschnitt(entwurf: BandEntwurf, von: number, nach: number): BandEntwurf {
  // BEIDE Indizes muessen zeigen. Waere nur `von` geprueft, schoebe ein `nach` von
  // 99 den Abschnitt stillschweigend ans Ende - „keine stille Verschiebung"
  // (Issue #129).
  const laenge = entwurf.abschnitte.length
  if (!istIndex(von, laenge) || !istIndex(nach, laenge)) return entwurf

  // „`verschiebeAbschnitt` entnimmt bei `von` und fuegt bei `nach` wieder ein."
  // (Issue #129) Das ist die Reihenfolge, die dnd-kit meldet und die der Nutzer
  // sieht: Nach dem Entnehmen ruecken die folgenden Abschnitte auf, und `nach` zaehlt
  // in der VERKUERZTEN Liste. Ein Einfuegen vor dem Entnehmen ergaebe bei
  // Rueckwaertsbewegungen eine um eins verschobene Zielstelle.
  const abschnitte = [...entwurf.abschnitte]
  const [bewegt] = abschnitte.splice(von, 1)
  // `bewegt` kann nach der Indexpruefung nicht `undefined` sein; die Abfrage steht
  // wegen `noUncheckedIndexedAccess` und wird ohne Ausrufezeichen aufgeloest - eine
  // Fluchttuer `bewegt!` hoebe den Schalter auf und liesse den Code zugleich geprueft
  // aussehen.
  if (bewegt === undefined) return entwurf
  abschnitte.splice(nach, 0, bewegt)

  return { bandVorlageId: entwurf.bandVorlageId, abschnitte }
}
export function setzeAbschnittsDauer(entwurf: BandEntwurf, index: number, dauer: number): BandEntwurf {
  if (!istIndex(index, entwurf.abschnitte.length)) return entwurf

  // Der Wert wird UNGEPRUEFT uebernommen - ein leeres Zahlenfeld ergibt `NaN`, und
  // das ist waehrend des Tippens ein zulaessiger Zwischenstand. `uebernehmeBand`
  // laesst ihn nicht ins Projekt; hier zurechtzubiegen hiesse, eine Nutzereingabe zu
  // erfinden (dieselbe Linie wie `klemme` in dauer-regler.ts).
  //
  // Auch das ABSCHNITTSOBJEKT wird neu gebaut, nicht nur das Array: `{ ...alt, dauer }`
  // auf demselben Objekt zu setzen wuerde den Vorzustand mitaendern, weil die
  // uebrigen Abschnitte dieselben Objekte bleiben.
  return {
    bandVorlageId: entwurf.bandVorlageId,
    abschnitte: entwurf.abschnitte.map((abschnitt, stelle) =>
      stelle === index ? { aktionRef: abschnitt.aktionRef, dauer } : abschnitt,
    ),
  }
}
export function wechsleBandVorlage(entwurf: BandEntwurf, bandVorlageId: string): BandEntwurf {
  // ALLE ABSCHNITTE BLEIBEN. Das ist die Umsetzung der Invariante aus TK 9.2.8: EINE
  // `bandVorlageId` pro Einblendung. Wer beim Wechsel die Abschnitte leerte, zwaenge
  // den Nutzer, die Folge neu zu tippen - und wer die Vorlage stattdessen je
  // Abschnitt fuehrte, liesse `H` mitten im Video wechseln.
  return { bandVorlageId, abschnitte: [...entwurf.abschnitte] }
}

/** Übernimmt den Entwurf ins Projekt. Ein Entwurf OHNE Abschnitte wird als `null` übernommen. */
export async function uebernehmeBand(
  elementId: string,
  entwurf: BandEntwurf | null,
): Promise<Ergebnis<Listenelement>> {
  if (!istGefuellt(elementId)) {
    return fehler('uebernehmeBand braucht die Kennung des Video-Elements, an dem das Band haengt.')
  }

  // DIE LEER-REGEL, VOR ALLEN UEBRIGEN PRUEFUNGEN. „Wird ein Band durch das Entfernen
  // leer (keine Abschnitte mehr), entfaellt die Einblendung ganz (`einblendung =
  // null`) - das Videoelement bleibt." (TK 9.5.3) Ein Band mit null Abschnitten
  // duerfte nie ins Projekt gelangen; der Render muesste sonst eine Bandspur der
  // Laenge 0 bauen.
  //
  // Sie steht ZUERST, weil ein leerer Entwurf sonst an der Pruefung auf eine gefuellte
  // `bandVorlageId` scheiterte - und dann waere ausgerechnet das ENTFERNEN des Bandes
  // der einzige Weg, der sich nicht gehen liesse.
  const einblendung: Einblendung | null =
    entwurf === null || entwurf.abschnitte.length === 0
      ? null
      : { bandVorlageId: entwurf.bandVorlageId, abschnitte: entwurf.abschnitte }

  if (einblendung !== null) {
    if (!istGefuellt(einblendung.bandVorlageId)) {
      return fehler('Zum Werbeband gehoert eine Band-Vorlage; es ist keine gewaehlt.')
    }

    // LOKALE VORPRUEFUNG, KEIN ERSATZ FUER DEN MAIN. „Der Main validiert jede
    // eingehende Nutzlast - er vertraut dem Renderer nicht. Ungueltige Eingabe ->
    // `ungueltige_eingabe`, ohne jede Wirkung auf die Daten." (TK 9.1.1) Geprueft
    // wird hier nur, was ohne Projektwissen pruefbar ist; ob die Aktion existiert,
    // ob das Element ein Video ist und ob die Dauer im zulaessigen Bereich liegt,
    // entscheidet setze-einblendung.ts.
    for (let stelle = 0; stelle < einblendung.abschnitte.length; stelle += 1) {
      const abschnitt = einblendung.abschnitte[stelle]
      if (abschnitt === undefined) {
        // Ein Loch im Array (`new Array(3)`, `delete`) - kompiliert, weil
        // `noUncheckedIndexedAccess` genau diesen Fall offenhaelt, und liefe sonst
        // als `{ aktionRef: undefined }` in die Nutzlast.
        return fehler(`Der Abschnitt an Stelle ${stelle} fehlt.`)
      }
      if (!istGefuellt(abschnitt.aktionRef)) {
        return fehler(`Dem Abschnitt an Stelle ${stelle} ist keine Aktion zugeordnet.`)
      }
      // „endliche Zahl groesser 0" - mehr nicht. Eine Obergrenze waere die zweite
      // Wahrheit neben dem Main (s. Kopf der Datei). `NaN` faellt hier heraus, weil
      // `Number.isFinite(NaN)` falsch ist; ein blosses `dauer <= 0` haette es
      // durchgelassen, denn jeder Vergleich mit `NaN` ist falsch.
      if (typeof abschnitt.dauer !== 'number' || !Number.isFinite(abschnitt.dauer) || abschnitt.dauer <= 0) {
        return fehler(
          `Die Dauer des Abschnitts an Stelle ${stelle} muss eine endliche Zahl groesser 0 sein, ` +
            `vorgefunden: ${String(abschnitt.dauer)}.`,
        )
      }
    }
  }

  // Der Kanal kommt aus der Registry (#25/#153), nie als Textliteral. Nutzlastform
  // laut #153: `{ elementId, einblendung }`. Die Felder der Einblendung sind
  // zeichengenau die aus #15 - keine Umbenennung, kein Zusatzfeld, insbesondere
  // keine Hoehe.
  //
  // `rufeAuf<Listenelement>` ohne zweiten Typparameter: Der Fehlercode reist zur
  // LAUFZEIT unveraendert durch (nichts hier fasst ihn an); enger machen kann die
  // Datei ihn nicht, weil die fachlichen Codes des project-store in src/main/**
  // liegen und im Renderer nicht importiert werden duerfen (Modulgrenze E3).
  //
  // Das Ergebnis geht UNVERAENDERT an den Aufrufer: nicht auspacken, nicht in einen
  // Wurf umwandeln, keinen Fehlercode ersetzen. An den Codes haengt die
  // Unterscheidung der beiden Fehlerklassen aus TK 9.7.3.
  return rufeAuf<Listenelement>(KANAELE.project.setzeEinblendung, { elementId, einblendung })
}
