// GENERIERT aus dem Signaturblock von Issue #122.
// [composer] Die Liste per Drag-and-drop ordnen
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
// GERUEST-PRUEFSUMME: 0204f0376bdc68d1
//
// ============================================================================
// DIE REIHENFOLGE IST DIE ARRAY-REIHENFOLGE - UND SONST NICHTS
// ============================================================================
// „Die Reihenfolge ist die Array-Reihenfolge von `liste` - es gibt kein separates
// `position`-Feld. Zwei Quellen fuer dieselbe Information wuerden unweigerlich
// auseinanderlaufen." (TK 9.11.3)
//
// Daraus folgt die Bauform dieser Datei, und sie ist enger, als sie aussieht: Es
// entsteht hier NIRGENDS eine Zahl, die eine Position festhaelt. Die einzigen
// Indizes im Rumpf sind rechnende Zwischenwerte in `berechneNeueReihenfolge`, die
// die Funktion nicht ueberleben - sie werden weder gespeichert, noch an ein
// Listenelement geschrieben, noch an den Main geschickt. Was hinausgeht, ist EINE
// Folge von IDs; ihre Ordnung IST die Information. Wer hier „zur Sicherheit" einen
// Zielindex mitschickte, haette genau das zweite Feld gebaut, das TK 9.11.3
// verwirft - nur ausserhalb des Datenmodells und damit unsichtbar.
//
// VOLLSTAENDIG, NIE EIN AUSSCHNITT. „`ordneNeu` | `reihenfolge` (elementIds) ->
// `Ergebnis<void>`" (TK 9.5.2): `ordneNeu` (#43) prueft die Menge gegen die
// aktuelle Liste und lehnt jede fehlende, zusaetzliche oder doppelte ID mit
// `ungueltige_eingabe` ab, ohne jede Wirkung auf project.json. Die Folge entsteht
// deshalb aus `holeSicht()` (ENTSCHIEDEN 3) und NICHT aus dem, was die Oberflaeche
// gerade zeigt: Eine gefilterte Darstellung („nur kaputte Elemente", ein
// virtualisierter Ausschnitt) wuerde sonst beim ersten Zug alle uebrigen Elemente
// aus der Folge streichen. Der Store lehnte das zwar ab - aber der Nutzer staende
// vor einer Liste, die sich nicht mehr sortieren laesst, ohne einen sichtbaren
// Grund.
//
// KEIN JSX, KEIN dnd-kit, KEIN REACT (ENTSCHIEDEN 1). Diese Datei ist die Logik
// hinter dem Ziehen; sie nimmt die beiden IDs entgegen, die `onDragEnd` liefert.
// Der `DndContext`/`SortableContext`-Aufbau gehoert in die Oberflaechen-Datei. So
// ist der gesamte Reorder-Pfad ohne Browser und ohne Maus-Simulation pruefbar -
// genau der Teil, dessen Fehler sonst erst in der fertigen Ausgabedatei auffallen
// („Angezeigte Reihenfolge = gerenderte Reihenfolge - keine versteckte Sortierung.",
// TK 9.7.4).
//
// KEINE EIGENE ROLLBACK-REGEL. „Fehlerklasse 1 - Operation abgelehnt (synchron):
// z. B. ungueltiger Wert. -> optimistischen Schritt rueckgaengig machen (letzter
// bestaetigter Stand) + kurze Inline-Meldung." (TK 9.7.3) Diese Datei liefert die
// drei Rueckrufe (anwenden, zuruecknehmen, bestaetigen) und ruft
// `fuehreOptimistischAus` (#126); WANN zurueckgenommen wird, entscheidet
// ausschliesslich dort. Ein spaeter gescheitertes Auto-Speichern (Klasse 2) ist hier
// gar kein Thema - es fuehrt zu KEINEM Rollback und hat in dieser Datei keinen Pfad.
//
// UND KEINE SORTIERUNG „zur Sicherheit": weder alphabetisch, noch nach Art, noch
// „kaputte nach oben". Die Reihenfolge aendert sich ausschliesslich durch das Ziehen
// des Nutzers. Ebenso wenig wird eine Mehrfachauswahl bedient (ein Element je
// Ziehvorgang) und keine Tastatur-Sensorik gebaut - beide Wege muendeten ohnehin in
// `berechneNeueReihenfolge`.

import type { Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { holeSicht, setzeListe } from './projektzustand'
import { fuehreOptimistischAus } from './optimistisch'

/** Einheitlicher Fehlerausgang. Kein `throw` verlaesst diese Datei - die Signatur
 *  lautet auf `Ergebnis`, und der Aufrufer prueft `ok`, er faengt nichts. */
function fehler(meldung: string): Ergebnis<void> {
  // Nur EIN Code: `ungueltige_eingabe`. Alle hier selbst erzeugten Ablehnungen sind
  // Bedienfehler der Oberflaeche (unbekannte ID, kein Projekt) - dieselbe Lesart wie
  // in element-hinzufuegen.ts und element-entfernen.ts. Fachliche Codes kommen
  // ausschliesslich vom Main und reisen unveraendert durch.
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/** Ein nicht leerer Text - dieselbe Grenze, die die Nutzlast-Pruefung des
 *  ipc-gateway zieht (`typeof wert === 'string' && wert.trim() !== ''`). Zwei
 *  verschiedene Grenzen an derselben Naht waeren die Sorte Abweichung, die erst beim
 *  Kunden auffaellt. */
function istGefuellterText(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.trim() !== ''
}

/** Reine Umsortierung: entfernt `aktivId` und fügt es an der Position von `ueberId` wieder ein.
 *  Gleiche Semantik wie `arrayMove` aus @dnd-kit/sortable – hier als EINE Quelle für beide Wege. */
export function berechneNeueReihenfolge(
  ids: string[],
  aktivId: string,
  ueberId: string,
): string[] {
  // IMMER eine KOPIE - auch in jedem Rueckfall. Die Eingabe wird nicht veraendert
  // (Unveraenderlichkeits-Invariante aus #121); wer das Ergebnis weiterreicht, darf
  // nicht versehentlich die Liste der Sicht in der Hand halten. `splice` laeuft
  // deshalb ausschliesslich auf dieser Kopie.
  if (!Array.isArray(ids)) return []

  const kopie = [...ids]

  const von = kopie.indexOf(aktivId)
  const nach = kopie.indexOf(ueberId)

  // Unbekannte ID oder Selbstablage -> eine unveraenderte KOPIE. Die Signatur kann
  // nichts melden, sie gibt ein Array zurueck; „nichts tun" ist die einzige Antwort,
  // die nichts erfindet. Eine Notloesung wie „dann eben ans Ende" waere eine
  // Umsortierung, die der Nutzer nicht gezogen hat. Die Ablehnung mit Meldung
  // uebernimmt `ordneNeuOptimistisch`, das die Zugehoerigkeit selbst prueft.
  if (von === -1 || nach === -1 || von === nach) return kopie

  // arrayMove: erst herausnehmen, dann an der Stelle von `ueberId` wieder einsetzen.
  //
  // DIE STELLE, an der ein naheliegender Fehler sitzt: `nach` wird VOR dem
  // Herausnehmen bestimmt und danach NICHT korrigiert. Genau das ist richtig und
  // deckt beide Richtungen mit derselben Rechnung ab. Verschieben nach HINTEN
  // (von < nach): Das Entfernen rueckt alles hinter `von` um eins vor, `ueberId`
  // liegt danach auf `nach - 1`, und das Einsetzen AN `nach` platziert das Element
  // hinter `ueberId` - so, wie es der Nutzer beim Ziehen nach unten sieht.
  // Verschieben nach VORN (von > nach): Vor `von` verschiebt sich nichts, das
  // Element landet genau AUF der Stelle von `ueberId` und schiebt es nach hinten.
  // Wer hier „zur Sicherheit" um eins korrigierte, braeche einen der beiden Faelle -
  // und die DoD-Beispiele des Issues (['b','c','a','d'] bzw. ['d','a','b','c'])
  // nageln beide Richtungen fest.
  //
  // Die Menge kann sich dabei nicht aendern: Es wird genau EIN Eintrag entnommen und
  // genau derselbe wieder eingesetzt.
  const [bewegt] = kopie.splice(von, 1)
  if (bewegt === undefined) return [...ids]
  kopie.splice(nach, 0, bewegt)

  return kopie
}

/** Optimistischer Reorder: Sicht sofort umstellen, dann `ordneNeu` bestätigen lassen.
 *  `ueberId` ist `string | null`, weil dnd-kit bei einem Drop ausserhalb der Liste
 *  `event.over === null` liefert (s. ENTSCHIEDEN 2 und Fehlerpfade). */
export async function ordneNeuOptimistisch(
  aktivId: string,
  ueberId: string | null,
): Promise<Ergebnis<void>> {
  // ENTSCHIEDEN 2: EIN DROP OHNE GUELTIGES ZIEL WIRD NICHT ZUR OPERATION.
  //
  // `over === null` heisst „ausserhalb der Liste losgelassen", `aktivId === ueberId`
  // heisst „auf sich selbst". Beides ist ein abgebrochener Zug, kein Fehler - deshalb
  // `ok: true`, kein IPC-Aufruf, keine Beruehrung der Sicht. Ein Aufruf, der garantiert
  // dieselbe Reihenfolge setzt, erzeugte nur Last und eine unnoetige Auto-Speicherung
  // (und damit einen Speicher-Fehlerpfad ohne jeden Anlass).
  //
  // Geprueft wird mit `istGefuellterText`, nicht mit `!== null`: dnd-kit liefert bei
  // einem Abbruch je nach Sensor `null` oder `undefined`, und ein leerer Text ist
  // dasselbe abgebrochene Ziehen.
  if (!istGefuellterText(ueberId)) return { ok: true, wert: undefined }
  if (aktivId === ueberId) return { ok: true, wert: undefined }

  // KEIN Projekt geladen -> gar nicht erst fragen. Der Main haette keine Liste, die
  // er umordnen koennte, und die Sicht koennte das Ergebnis nirgends aufnehmen.
  // Dieselbe Vorpruefung wie in element-hinzufuegen.ts, element-entfernen.ts und
  // dauer-regler.ts.
  const projekt = holeSicht().projekt
  if (projekt === null) {
    return fehler('Es ist kein Projekt geladen, dessen Wiedergabeliste geordnet werden koennte.')
  }

  // DIE VOLLSTAENDIGE LISTE DER SICHT - ENTSCHIEDEN 3. Nicht das, was die Oberflaeche
  // gerade zeigt, und kein Argument des Aufrufers: Es gibt keinen Weg, hier einen
  // Ausschnitt hereinzureichen, weil die Signatur keinen anbietet. Das ist Absicht.
  const vorher = projekt.liste
  const alteIds = vorher.map((element) => element.id)

  // Die Zugehoerigkeit wird HIER geprueft, nicht in `berechneNeueReihenfolge`: Dort
  // gaebe es keinen Weg, sie zu melden. Eine unbekannte ID ist ein Bedienfehler der
  // Oberflaeche (ein Zug auf eine Zeile, die es in der Sicht nicht gibt) - er soll
  // nicht als Antwort des Main erscheinen und keinen Aufruf ausloesen, den `ordneNeu`
  // planmaessig ablehnt.
  if (!alteIds.includes(aktivId)) {
    return fehler(`Das gezogene Element ${aktivId} kommt in der Wiedergabeliste nicht vor.`)
  }
  if (!alteIds.includes(ueberId)) {
    return fehler(`Das Ziel ${ueberId} kommt in der Wiedergabeliste nicht vor.`)
  }

  const neueIds = berechneNeueReihenfolge(alteIds, aktivId, ueberId)

  // Die neue Liste entsteht durch UMSTELLEN derselben Objekte, nicht durch Nachbauen:
  // `map` ueber die neue ID-Folge, jedes Element aus der alten Liste geholt. Ein
  // Element wird dabei nirgends umgeschrieben - es wandert nur an eine andere Stelle
  // des NEUEN Arrays (Unveraenderlichkeits-Invariante aus #121, kein `splice` an der
  // Liste der Sicht). Und es bekommt kein Feld gesetzt: Seine Stelle im Array IST
  // seine Position (TK 9.11.3).
  const nachId = new Map(vorher.map((element) => [element.id, element]))
  const neueListe: Listenelement[] = []
  for (const id of neueIds) {
    const element = nachId.get(id)
    // Kann nach der Mengenpruefung oben nicht eintreten - `neueIds` traegt dieselbe
    // Menge wie `alteIds`. Ein `!` waere hier die bequeme Fluchttuer, die
    // `noUncheckedIndexedAccess` aushebelt; ein uebersprungener Eintrag dagegen
    // schickte eine unvollstaendige Folge hinaus, die `ordneNeu` ablehnt - sichtbar
    // statt still.
    if (element !== undefined) neueListe.push(element)
  }

  // OPTIMISTISCH: „Reorder/Trim/Dauer werden lokal sofort angezeigt, dann per
  // Instant-Op bestaetigt; der zurueckgegebene Stand wird abgeglichen (nie dauerhaft
  // driften)." (TK 9.7.3) `anwenden` laeuft VOR dem Warten auf die Antwort - das ist
  // der ganze Sinn; `zuruecknehmen` setzt exakt das Array zurueck, das vor dem Ziehen
  // in der Sicht stand („letzter bestaetigter Stand"). Es aendert sich nicht mit,
  // weil #121 bei jeder Aenderung ein NEUES Array setzt.
  //
  // Die Nutzlast ist AUSSCHLIESSLICH `{ reihenfolge }` - so verlangt es die
  // Form-Pruefung des ipc-gateway, die daraus `ordneNeu(nutzlast.reihenfolge)` macht.
  // Gesendet wird die KOMPLETTE Folge, nie ein Ausschnitt und nie ein
  // „von-nach"-Paar: Ein Zielindex waere die zweite Quelle fuer die Reihenfolge, die
  // TK 9.11.3 ausschliesst.
  //
  // `rufeAuf<void>` ohne zweiten Typparameter - dieselbe Form wie in den
  // Geschwisterdateien. Der Fehlercode reist zur LAUFZEIT unveraendert durch; enger
  // machen kann die Datei ihn nicht, weil die fachlichen Codes des project-store in
  // src/main/** liegen und im Renderer nicht importiert werden duerfen.
  return fuehreOptimistischAus<void>(
    () => {
      setzeListe(neueListe)
    },
    () => {
      setzeListe(vorher)
    },
    () => rufeAuf<void>(KANAELE.project.ordneNeu, { reihenfolge: neueIds }),
  )

  // KEIN Abgleich nach `ok: true`: `ordneNeu` liefert `Ergebnis<void>`, es gibt also
  // keinen zurueckgegebenen Stand zum Uebernehmen. Der Main hat die Folge validiert
  // und angewendet, bevor er `ok` meldete - die optimistisch gezeigte Reihenfolge IST
  // damit die bestaetigte. Ein Nachladen des Projekts waere hier zusaetzlich falsch:
  // Der einzige Weg zu einem `Project` loest den ganzen Oeffnen-Ablauf samt Reconcile
  // aus (#94, s. Kopf von projektzustand.ts).
  //
  // Und bei `ok: false` passiert hier NICHTS: Das Zuruecknehmen und die Inline-Meldung
  // hat #126 bereits veranlasst; Code und Meldung gehen UNVERAENDERT an den Aufrufer.
}
