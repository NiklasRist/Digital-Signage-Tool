// [vorlagen-store] Verwaiste Arbeitskopien vom gelöschten Parent lösen

import type { Vorlage } from '../../shared/contracts/vorlage'

// Fremde Typen – vollstaendig ausgeschrieben, damit hier nichts geraten wird:
//   #95: interface Vorlage { id: string; name: string; höhe: number | null
//                            parent: string | null; eingebaut: boolean; zonen: Zone[] }
//        (v3.31: `art` ist entfallen - `höhe === null` heisst Ganzbild, Zahl heisst Band.)
//        parent !== null -> ARBEITSKOPIE; parent === null -> eigenstaendige, nutzbare Vorlage
//
// EINZIGER AUFRUFER: #107 (löscheVorlage), main-intern, INNERHALB der einen
// aendereBestand(aenderung, 'sofort')-Einheit aus #98 - also zwischen Lesen und Schreiben.
// Dort ist die Aenderungsfunktion SYNCHRON (in #98 steht ueber ihrem Aufruf woertlich:
// "AB HIER BIS ZUM SCHREIBEN STEHT KEIN `await` - genau das macht Lesen-Aendern-Schreiben
// unteilbar"). Diese Datei ist deshalb synchron und ohne I/O - sie kann gar nicht in
// Versuchung geraten, selbst zu speichern und damit einen ZWEITEN Schreibvorgang zu
// eroeffnen, zwischen dem die Vorlage schon weg und die Kopie noch angebunden waere.

/**
 * Loest alle Arbeitskopien der gerade geloeschten Vorlage von ihrem Parent.
 *
 * „Eine Arbeitskopie haelt den Parent nicht am Leben: Wird der Parent geloescht, waehrend eine
 * Arbeitskopie existiert, wird deren `parent` auf `null` gesetzt (sie wird zur eigenstaendigen
 * Vorlage) – keine verwaiste Referenz." (TK 9.12.1)
 *
 * ES WIRD NICHTS ENTFERNT. Getroffene Eintraege enthalten Nutzerarbeit („Auto-Speichern trifft nur
 * die Arbeitskopie.", TK 9.12.1); sie werden GELOEST, nicht geloescht. Das Ergebnis hat deshalb
 * dieselbe Laenge und dieselbe Reihenfolge wie die Eingabe. Auch der Eintrag mit `id === parentId`
 * bleibt hier stehen - ihn herauszufiltern ist Sache von #107, im selben Schreibvorgang.
 */
export function löseArbeitskopienVomParent(
  bestand: Vorlage[],
  parentId: string,
): Vorlage[] {
  // Schutz gegen den einen Fall, den der Typ nicht abfaengt: einen Aufrufer, der zur Laufzeit
  // etwas anderes durchreicht (dieselbe Vorsorge wie in #98 vor `aendereBestand`).
  //
  // Das Issue sagt zu diesem Fall: „ist er kein nicht leerer String, wird der Bestand unveraendert
  // (als neues Array) zurueckgegeben". Seine Begruendung („trifft die Bedingung schlicht auf
  // nichts zu") stimmt fuer JEDEN String - aber nicht fuer `undefined`: `vorlagen.json` ist von
  // Hand editierbar und #98 prueft den INHALT ausdruecklich nicht, ein Eintrag OHNE Feld `parent`
  // ist also moeglich, und `undefined === undefined` waere ein Treffer. Ohne diese Schranke
  // bekaeme ein voellig unbeteiligter Eintrag beim Loeschen irgendeiner Vorlage sein `parent`
  // gesetzt. Kein Fehler, keine Ausnahme - die Funktion hat keine Huelle, in der ein Fehler Platz
  // haette, und ihr Aufrufer (#107) prueft die Eingabe bereits.
  if (typeof parentId !== 'string' || parentId === '') {
    return [...bestand]
  }

  return bestand.map((eintrag) =>
    // Treffer: FLACHE Kopie mit ausgetauschtem Feld. `zonen` bleibt dieselbe Array-Referenz - das
    // ist gewollt (kein Modul dieses Ordners schreibt in Zonen hinein), eine tiefe Kopie wuerde bei
    // jedem Loeschvorgang den ganzen Zonenbaum verdoppeln, ohne etwas zu schuetzen.
    //
    // Nicht-Treffer: dieselbe Objekt-Referenz, KEINE Kopie. So laesst sich mit `toBe` beweisen,
    // dass sie unangetastet blieben - und das uebergebene Array selbst bleibt ebenfalls unberuehrt
    // (`map` legt ein neues darueber), damit der Aufrufer es unveraendert vorfindet, falls sein
    // Schreibvorgang scheitert.
    //
    // NUR DIESE EINE EBENE, keine Rekursion ueber die Kette: Eine Arbeitskopie einer Arbeitskopie
    // kann nicht entstehen (#101 oeffnet nur nutzbare Vorlagen), und wer der Kette trotzdem folgt,
    // nullt bei einem beschaedigten Bestand fremde Arbeitskopien mit - Datenverlust als
    // Nebenwirkung eines Aufraeumschritts.
    //
    // Das `?.` gilt dem Eintrag, nicht dem Feld: Steht in der von Hand editierbaren Datei ein
    // `null` in der Liste, wuerde `eintrag.parent` werfen - und diese Funktion soll NIE werfen,
    // schon gar nicht mitten in einer offenen Lesen-Aendern-Schreiben-Einheit. Ein solcher Eintrag
    // ist wegen der Schranke oben nie ein Treffer und wird unveraendert durchgereicht.
    eintrag?.parent === parentId ? { ...eintrag, parent: null } : eintrag,
  )
}
// - SYNCHRON, rein: kein await, kein fs, kein Lesen, kein Schreiben, kein Ergebnis<T>
// - liefert ein NEUES Array gleicher Länge und gleicher Reihenfolge
// - jeder Eintrag mit parent === parentId wird durch ein NEUES Objekt mit parent: null ersetzt
// - jeder andere Eintrag wird UNVERÄNDERT durchgereicht (dieselbe Objekt-Referenz)
// - der Eintrag mit id === parentId bleibt unangetastet; ENTFERNT wird er von #107
// - mutiert weder das übergebene Array noch die darin enthaltenen Objekte

// NICHT HIER, UND ABSICHTLICH:
//
// 1. KEIN Entfernen und kein Filtern - auch nicht der Eintrag mit `id === parentId`. Das Entfernen
//    und der EINE Schreibvorgang gehoeren #107; wer hier zusaetzlich filtert, macht die
//    Aufgabenteilung unklar und erzeugt bei doppelter Anwendung Ueberraschungen.
// 2. KEIN Umbenennen, kein Merkmal „(verwaist)", kein Zeitstempel, kein Setzen von `eingebaut`.
//    Die geloeste Kopie soll danach aussehen wie jede andere eigenstaendige Vorlage - die
//    Merge-Beziehung ist ja gerade absichtlich durchtrennt (TK 9.12.1).
// 3. KEINE Sonderbehandlung fuer Kopien EINGEBAUTER Vorlagen. Eingebaute Vorlagen sind zwar
//    unloeschbar (#96/#107 weisen das vorher ab), aber falls dieser Fall je eintritt, gilt
//    dieselbe Regel: geloest, nicht geloescht. `eingebaut` der Kopie bleibt unberuehrt.
// 4. KEINE Reparatur kaputter `parent`-Werte. Ein Eintrag, dessen `parent` weder String noch
//    `null` ist (Datei von Hand editiert), ist hier kein Treffer und bleibt, wie er ist. Er als
//    „verwaist" einzustufen hiesse, ohne Rueckfrage an fremder Nutzerarbeit zu drehen; diese
//    Funktion kennt nur EINE Frage: „zeigt der Eintrag auf die Vorlage, die gerade geloescht
//    wird?" (Der Hinweis in #99/liste.ts, die Reparatur solcher Eintraege sei „das ist #108",
//    trifft also nicht zu - #108 hat dafuer keinen Auftrag.)
// 5. KEIN `aendereBestand`, kein `ladeBestand`, kein `fs`, kein `async`, kein IPC-Kanal.
