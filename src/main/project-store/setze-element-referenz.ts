// GENERIERT aus dem Signaturblock von Issue #152.
// [project-store] setzeElementReferenz
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
// GERUEST-PRUEFSUMME: c5c6ace32b1fa1ec
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.
// [ERLEDIGT: Die Zeile ist mit dem Fuellen des Rumpfes entfernt - alle Parameter
//  und Importe werden benutzt.]

import { holeAktivesProjekt } from './aktives-projekt'   // #192
import { planeAutoSpeicherung } from './auto-speichern'  // #47
import { mitD1Lock } from './d1-lock'                    // #32

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre);
//         // der kritische Abschnitt darf NICHT erneut mitD1Lock rufen (Deadlock-Gefahr).
//   #47:  planeAutoSpeicherung(projekt: Project): void
//         // merkt projekt als zu speichernde, aktuelle Version vor und (re-)startet den
//         // Entprellungstimer. SYNCHRON, kein Rueckgabewert, nimmt KEIN Lock.
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die
//         // die Instant-Operationen mutieren), kein Projekt offen -> null. SYNCHRON, NIMMT
//         // KEIN LOCK, WIRFT NIE.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'   // #72
import type { Listenelement } from '../../shared/contracts/project'
export async function setzeElementReferenz(
  elementId: string,
  referenz: string,   // Ziel-ID; WELCHER Bestand gemeint ist, entscheidet die art des Elements:
                      //   art: 'video'   -> Asset-ID aus Project.assets, Asset.typ === 'video'
                      //   art: 'segment' -> AKTIONS-ID aus Project.aktionen
): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> {
  // ABWEICHUNG ZUM SIGNATUR-ZITAT, offen benannt und im Bericht gemeldet: Das Issue schreibt
  // `Ergebnis<Listenelement>` (einparametrig). Der GEBAUTE Bestand fuehrt seit dem 13.08.2026
  // ALLE project-store-Mutationen mit `Ergebnis<T, ProjectStoreFehlercode>` - so stehen es
  // setze-trim.ts (#44), setze-dauer.ts (#45) und setze-einblendung.ts (#120) heute im Baum.
  // Ohne den zweiten Parameter gaebe es fuer "kein Projekt geoeffnet" keinen Code, und der
  // gefuehrte Reparatur-Modus koennte "es ist keins offen" nicht von "das gibt es nicht"
  // unterscheiden - genau die Unterscheidung, die ProjectStoreFehlercode eingefuehrt hat.
  //
  // FUER AUFRUFER: Das Lock wird hier SELBST genommen - dieselbe Linie wie #44/#45/#120. Diese
  // Funktion darf NICHT noch einmal in mitD1Lock eingewickelt werden (#32 ist nicht reentrant).
  //
  // Das Lock liegt UM ALLES, nicht nur um die Zuweisung. Der kritische Abschnitt ist die Folge
  // Lesen -> Pruefen -> Schreiben: Zwischen dem Nachschlagen des Ziels und dem Setzen der
  // Referenz koennte sonst loescheMedium (#87) bzw. loescheAktion (#39) genau das gepruefte
  // Ziel entfernen - geprueft waere dann gegen einen Stand, den es beim Schreiben nicht mehr
  // gibt, und die Reparatur erzeugte die kaputte Stelle, die sie beheben sollte.
  return mitD1Lock(async (): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> => {
    // FORMPRUEFUNG ZUERST, vor jedem Blick ins Datenmodell. Der Aufruf kommt ueber IPC aus dem
    // Renderer (#153); was dort ankommt, ist zur Laufzeit ungeprueft - "Der Main validiert jede
    // eingehende Nutzlast, er vertraut dem Renderer nicht" (TK 9.1.1 Punkt 6). Ein statischer
    // Typ ist ueber die Prozessgrenze hinweg eine Zusage, kein Beleg.
    if (typeof elementId !== 'string' || elementId.trim() === '') {
      return fehler('ungueltige_eingabe', 'Es wurde kein Listenelement benannt.')
    }
    if (typeof referenz !== 'string' || referenz.trim() === '') {
      return fehler('ungueltige_eingabe', 'Es wurde kein neues Ziel benannt.')
    }

    const projekt = holeAktivesProjekt()
    if (projekt === null) {
      // NICHT in der Fehlerpfad-Tabelle des Issues - dort steht nur "elementId existiert nicht
      // in Project.liste". Ohne geoeffnetes Projekt gibt es diese Liste gar nicht. `kein_projekt`
      // ist am 13.08.2026 vom User entschieden und laut assets.ts (#72) fuer ALLE
      // project-store-Mutationen einheitlich; #44/#45/#120 benutzen ihn bereits.
      return fehler('kein_projekt', 'Es ist kein Projekt geoeffnet; es wurde nichts geaendert.')
    }

    // LEBENDE Referenz, keine Kopie: #192 gibt ausdruecklich "dieselbe Objektreferenz" heraus,
    // die die Instant-Operationen mutieren. Wer hier eine Kopie zoege, aenderte sie - und
    // planeAutoSpeicherung schriebe spaeter den unveraenderten Originalstand.
    const element = projekt.liste.find((eintrag) => eintrag.id === elementId)
    if (element === undefined) {
      return fehler('nicht_gefunden', 'Zu dieser Kennung gibt es kein Element in der Wiedergabeliste.')
    }

    // ------------------------------------------------------------------
    // DIE ART ENTSCHEIDET DEN ZIELBESTAND - und nur sie (ENTSCHIEDEN 1).
    //
    // Es wird NIE im jeweils anderen Bestand nachgeschlagen: Eine gueltige Aktions-ID unter
    // einem video-Element ist `nicht_gefunden`, keine Fundstelle; eine gueltige
    // Asset-ID unter einem segment-Element ebenso. Wuerde diese Operation den falschen Raum
    // durchsuchen, entstuende ein Element, dessen `ref` ins Leere zeigt - findeKaputteStellen
    // (#131) meldete danach eine kaputte Stelle, die die REPARATUR SELBST erzeugt hat.
    //
    // GEPRUEFT WIRD VOLLSTAENDIG, BEVOR IRGENDETWAS WIRKT. Bis zur Marke "AB HIER WIRKT ES"
    // steht in diesem Block keine einzige Zuweisung; damit ist "auf jedem Fehlerpfad bleibt
    // Project.liste unveraendert" (TK 9.1.1 Punkt 6) strukturell wahr statt nur zugesichert -
    // es gibt keinen Rueckweg, der etwas zurueckdrehen muesste.
    //
    // KEINE ZUSTANDSPRUEFUNG (Asset.zustand === 'fehlt', kaputte Ziel-Aktion): STOPP-Block des
    // Issues, ausdruecklich offen gelassen und mit #41 gleichzuziehen. Geprueft wird allein die
    // EXISTENZ im jeweiligen Bestand. Offen und gemeldet.
    // ------------------------------------------------------------------
    if (element.art === 'segment') {
      // `ref` eines Segments zeigt auf eine AKTION (TK 9.11.3) - deshalb Project.aktionen.
      // Eine Aktion hat keinen `typ`, der zusaetzlich passen muesste (ENTSCHIEDEN 1, Tabelle).
      const kennt = projekt.aktionen.some((aktion) => aktion.id === referenz)
      if (!kennt) {
        return fehler(
          'nicht_gefunden',
          `Zur Kennung ${referenz} gibt es in diesem Projekt keine Aktion.`,
        )
      }
    } else {
      const asset = projekt.assets.find((eintrag) => eintrag.id === referenz)
      if (asset === undefined) {
        return fehler(
          'nicht_gefunden',
          `Zur Kennung ${referenz} gibt es in diesem Projekt kein Medium.`,
        )
      }
      if (asset.typ !== element.art) {
        // `ungueltige_eingabe`, NICHT `nicht_gefunden`: Das Ziel EXISTIERT, es passt nur nicht.
        // Ein Bild-Asset unter einem video-Element ergaebe ein Element mit widerspruechlicher
        // Belegung (art: 'video', aber Asset.dauer === null); der render-service (M6) bekaeme
        // eine Quelle ohne Zeitachse, und der Fehler fiele erst mitten im Renderlauf auf.
        return fehler(
          'ungueltige_eingabe',
          `Das Medium ${referenz} ist ein ${asset.typ}-Medium; dieses Element ist ein ` +
            `${element.art}-Element. Ein Element behaelt beim Ersetzen seine Art.`,
        )
      }
    }

    // ------------------------------------------------------------------
    // AB HIER WIRKT ES.
    // ------------------------------------------------------------------
    element.ref = referenz

    // `element.art` wird NICHT angefasst - aus einem video wird hier kein segment (STOPP-Block).
    // Die Position in `liste` ebenfalls nicht: Geschrieben wird in das gefundene Objekt, es wird
    // weder entfernt noch neu eingefuegt. "Die Reihenfolge ist die Array-Reihenfolge von `liste`
    // - es gibt kein separates `position`-Feld." (TK 9.11.3)

    if (element.art === 'video') {
      // ENTSCHIEDEN 2 - und NUR hier. trimStart/trimEnde sind Positionen auf der Zeitachse der
      // ALTEN Quelldatei; nach dem Wechsel existiert diese Zeitachse nicht mehr. Ein
      // stehengelassenes trimEnde schnitte an einer Stelle, die es im neuen Video nicht gibt,
      // und die Pruefung `trimEnde <= Asset.dauer` aus setzeTrim (#44) waere umgangen.
      //
      // KEIN Umrechnen und KEIN Kappen (STOPP-Block: beides waere eine erfundene Zuordnung
      // zwischen zwei verschiedenen Videos). KEIN Vorbelegen auf 0/Asset.dauer: Beim ANLEGEN
      // (#41) ist die volle Laenge ein sinnvoller Startwert, beim ERSETZEN waere sie eine stille
      // Annahme ueber ein gerade erst gewaehltes Video.
      //
      // Der Aufrufer setzt danach `setzeTrim` (#44) mit Grenzen innerhalb der NEUEN Asset.dauer
      // (ENTSCHIEDEN 3). Solange beide null sind, ist das Element nicht renderbar; #134 liest
      // fehlenden Trim als "ganzes Video". setzeTrim wird hier NICHT selbst gerufen - zwei
      // D1-Mutationen in einem Aufruf haetten einen Zwischenzustand, und die Grenzen kaemen aus
      // einer Annahme statt aus einer Nutzereingabe (ausserdem naehme #44 das Lock ein zweites
      // Mal, #32 ist nicht reentrant).
      element.trimStart = null
      element.trimEnde = null

      // `element.einblendung` bleibt UNVERAENDERT (ENTSCHIEDEN 4). Das Werbeband gehoert zum
      // Listenelement, nicht zur Quelldatei; ist das neue Video kuerzer, wiederholt bzw.
      // beschneidet der Render das Band ohnehin ("Die Elementdauer bestimmt allein das Video
      // (Trim). Das Band verlaengert oder verkuerzt sie nie." - TK 9.2.8). Ein Verwerfen waere
      // unangekuendigter Arbeitsverlust bei einer Handlung, die der Nutzer als "Datei ersetzen"
      // versteht.
      //
      // `element.dauer` bleibt bei video ebenfalls unangetastet - "bleibt null" heisst
      // unveraendert, nicht neu gesetzt; ein kaputter Fremdstand bliebe sonst unsichtbar
      // (gleiche Linie wie #44/#45/#120).
    }

    // Bei art 'segment' wird AUSSER `ref` NICHTS geschrieben (ENTSCHIEDEN 2/5):
    // trimStart/trimEnde/einblendung sind dort laut TK 9.11.3 ohnehin null - ein "Zuruecksetzen"
    // waere ein Schreibvorgang ohne Wirkung, der beim Lesen den falschen Eindruck erweckt, es
    // gaebe dort einen Trim. Und `dauer` bleibt stehen: Die Anzeigedauer ist eine freie
    // Einstellung (10-45 s, setzeDauer #45), und die `standardDauer` der NEUEN Aktion wird NICHT
    // uebernommen - "standardDauer ist nur ein Default: massgeblich fuer den Render ist die
    // Listenelement-Dauer" (TK 9.8.4). Ein Referenzwechsel ist kein Platzieren; wuerde er die
    // Dauer mitziehen, aenderte eine Reparatur die Laenge des fertigen Films.

    // Entprelltes Speichern, KEIN sofortFlush: Instant-Operation, kein Auftrag (TK 9.5.4).
    // Uebergeben wird die LEBENDE Referenz, damit der ablaufende Termin den dann neuesten Stand
    // schreibt (#47). Der Aufruf steht NOCH INNERHALB des Locks - er ist synchron und nimmt
    // selbst kein Lock, es entsteht also keine Schachtelung.
    //
    // Auch im Fall "referenz ist schon die aktuelle ref" wird vorgemerkt: Bei einem
    // Video-Element sind trimStart/trimEnde dann trotzdem neu auf null gesetzt (Fehlerpfad-
    // Tabelle, letzte Zeile - ein Sonderweg "gleiche ID = nichts tun" waere ein zweites
    // Verhalten fuer dieselbe Operation).
    planeAutoSpeicherung(projekt)

    // Zurueck geht das LEBENDE Element, keine Kopie - ueber die IPC-Grenze wird ohnehin
    // serialisiert; main-intern bleibt es der eine Stand (gleiche Entscheidung wie #34/#44/#45).
    return { ok: true, wert: element }
  })
}

/** Die Fehlerseite der Huelle. */
function fehler(
  code: 'nicht_gefunden' | 'ungueltige_eingabe' | ProjectStoreFehlercode,
  meldung: string,
): Ergebnis<Listenelement, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// ---------------------------------------------------------------------------
// WAS HIER BEWUSST NICHT STEHT - UND GEMELDET IST
//
// 1. KEIN DATEISYSTEM, KEINE PFADAUFLOESUNG. Diese Datei importiert weder `fs` noch `path`,
//    ruft keine Pfad-Funktion aus #49 und prueft nicht, ob eine Mediendatei auf der Platte
//    liegt. Massgeblich ist allein der D1-Eintrag; eine Dateipruefung waere eine zweite
//    Wahrheit neben dem Reconcile (TK 9.4.7) und liefe zudem unter dem D1-Lock.
//
// 2. KEINE FRAME-ARITHMETIK. Es wird nichts gerundet und keine Bildrate genannt; Rundung ist
//    Sache des render-service (TK 9.2.6).
//
// 3. KEINE ZUSTANDSPRUEFUNG DES ZIELS. Ein Asset mit zustand "fehlt" und eine Aktion, deren
//    bildRef auf ein fehlendes Asset zeigt, sind hier gueltige Ziele. STOPP-Block: Eine Sperre
//    muesste einen eigenen Fehlercode haben, mit #41 gleich lauten und beide Zielarten gleich
//    behandeln. Offen und gemeldet.
//
// 4. KEIN ANFASSEN VON `Project.geaendertAm`. STOPP-Block; alle Liste-Mutationen (#41-#45,
//    #120) verhalten sich gleich, naemlich gar nicht. Die Luecke ist real - ausser
//    erstelleProjekt (#33) setzt den Zeitstempel im gesamten gebauten Bestand niemand.
//
// 5. KEIN ANFASSEN VON `Project.aktionen` ODER `Project.assets`. Kein Aufraeumen, kein Loeschen
//    "nicht mehr benutzter" Eintraege, und die ALTE, kaputte Aktion bleibt kaputt: "Ist ein
//    Aktions-Segment kaputt, weil das Bild der Aktion fehlt, liegt der Defekt an der Aktion,
//    nicht am einzelnen Listenelement." (TK 9.7.5) - diese Operation heilt genau EINE Stelle
//    der Liste. Ebenso keine Nebenwirkung auf andere Listenelemente, die auf dasselbe alte Ziel
//    zeigen.
//
// 6. KEIN BAND-ABSCHNITT. Ein Abschnitt in `einblendung.abschnitte` ist KEIN Listenelement und
//    hat keine elementId in `liste`; sein Austausch laeuft ueber setzeEinblendung (#120).
//
// 7. KEIN UNDO-SCHNAPPSCHUSS. TK 9.13.2 verlangt ihn vor jeder Instant-Operation; gebaut wird
//    er nach M7-Beschluss in der Huelle um die gemeinsame Projekt-Sicht (#243).
//
// 8. KEIN IPC-KANAL. `project:setzeElementReferenz` wird hier nicht angemeldet und nichts in
//    kanaele.ts eingetragen - das tut #153. Ausdrueckliches Verbot im STOPP-Block.
