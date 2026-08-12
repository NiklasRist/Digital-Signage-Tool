// GENERIERT aus dem Signaturblock von Issue #34.
// [project-store] öffneProjekt implementieren
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
// GERUEST-PRUEFSUMME: 68d2ac5ea4532c51

import fs from 'node:fs/promises'
import path from 'node:path'

import { AKTUELLE_SCHEMA_VERSION } from '../../shared/contracts/konstanten'   // #21
import { setzeAktivesProjekt } from '../config-store/setze-aktives-projekt'   // #27

import { holeAktivesProjekt, merkeAktivesProjekt } from './aktives-projekt'   // #192
import { sofortFlush } from './auto-speichern'                                // #47
import { mitD1Lock } from './d1-lock'                                         // #32
import { migriereProjekt } from './migriere-projekt'                          // #48
import { projektOrdner } from './pfade'                                       // #49

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern); die Aktion darf
//         // mitD1Lock NICHT erneut aufrufen (Deadlock). Das Lock wird hier SELBST genommen.
//   #47:  sofortFlush(projekt: Project): Promise<Ergebnis<void, ProjectStoreFehlercode>>
//         // bricht den Entprellungstimer ab und schreibt projekt sofort; "MUSS von der
//         // aufrufenden Stelle innerhalb von mitD1Lock (#32) ausgefuehrt werden" und wird
//         // ausdruecklich "(2) bei Projektwechsel (öffneProjekt, #34)" gerufen.
//   #48:  migriereProjekt(rohdaten: Record<string, unknown> & { schemaVersion: number },
//                         kette?: ReadonlyMap<number, MigrationsSchritt>): Ergebnis<Project>
//         // reine Umformung IM SPEICHER, schreibt nichts; prueft nach der Kette die neun
//         // Pflichtfelder aus TK 9.11.3. Der zweite Parameter ist Testwerkzeug und wird von
//         // hier NIE mitgegeben.
//   #49:  projektOrdner(projektId: string): string
//         // absoluter Pfad <Datenort>/projects/<projektId>; reine String-Operation, kein
//         // Dateisystemzugriff, KEINE Pruefung der projektId (s. `istLesbareId`).
//   #27:  setzeAktivesProjekt(projektId: string | null): Promise<Ergebnis<void, ConfigFehlercode>>
//         // schreibt die Kennung nach config.json (abgewartet, atomar). Prueft NICHT, ob es
//         // das Projekt gibt - "das ist laut Issue Sache des Aufrufers (i. d. R. direkt nach
//         // erfolgreichem oeffneProjekt, #34)".
//   #192: holeAktivesProjekt(): Project | null
//         merkeAktivesProjekt(projekt: Project | null): void
//         // der Halter des aktiven Projekts; haelt die LEBENDE Referenz, keine Kopie.
//         // SYNCHRON, nimmt KEIN Lock, wirft nie.
//   #21:  const AKTUELLE_SCHEMA_VERSION = 1
//         // "wird von öffneProjekt, schreibeProjekt und der Migration gelesen (9.5.5) - eine
//         // Stelle, sonst laufen drei Kopien auseinander" (TK 9.11.4). Deshalb steht die Zahl
//         // hier nicht noch einmal.

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'

/** Dateiname im Projektordner - gleichlautend mit dem Schreiber (#46) und mit #35. */
const DATEI = 'project.json'

/** Die letzte heile Fassung, die #46 vor jedem Schreiben anlegt (TK 9.5.4). */
const SICHERUNG = `${DATEI}.bak`

/**
 * Eine unbedenkliche Projekt-ID, die NUR als Vergleichswert dient (s. `istLesbareId`).
 * Ihr Ordner wird nie angefasst.
 */
const VERGLEICHS_ID = 'vergleich'

/**
 * Der maschinenlesbare Grund eines Fehlschlags - er reist in `fehler.daten`, NICHT im Code.
 *
 * WARUM DAS UEBERHAUPT NOETIG IST (und der wichtigste Meldepunkt dieser Datei): Die
 * verbindliche Signatur ist `Ergebnis<Project>`, also EINPARAMETRIG - der Fehlercode kann damit
 * nur `ungueltige_eingabe | nicht_gefunden | unbekannter_fehler` sein. Die Fehlerpfad-Tabelle
 * desselben Issues verlangt aber `speicher_fehler` ("wenn sowohl project.json als auch .bak
 * unlesbar sind"), und `speicher_fehler` gehoert zu `ProjectStoreFehlercode` (#72), der hier
 * nicht deklariert ist. Beides zugleich ist unmoeglich. Die Signatur ist verbindlich, also
 * wurde sie NICHT angetastet - der Widerspruch ist gemeldet (s. Bericht/STOPP).
 *
 * Bis er entschieden ist, faehrt der echte Grund als Nutzlast mit: Die Ergebnis-Huelle sieht
 * `daten?: unknown` genau dafuer vor ("seine Form ist je Fehlercode festgelegt und typisiert -
 * dokumentiert dort, wo der Code vergeben wird", ergebnis.ts). Das ist die kleinere Notloesung
 * als der Ausweg, den #46 vor seinem Nachtrag gehen musste - dort stand der echte Code als
 * TEXTPRAEFIX in der Meldung, "worauf kein Aufrufer verzweigen konnte".
 *
 * `schema_zu_neu` ist der zweite Fall: der STOPP-Punkt des Issues ("eigener Code oder
 * unbekannter_fehler?"). Ohne ihn waere "diese Datei stammt aus einer neueren App-Version"
 * fuer den Aufrufer nicht von "die Migration ist unvollstaendig" zu unterscheiden - genau das
 * hat #48 als offenen Punkt an diese Datei zurueckgegeben.
 */
export type OeffneProjektFehlergrund = 'speicher_fehler' | 'schema_zu_neu'

export async function öffneProjekt(id: string): Promise<Ergebnis<Project>> {
  // VOR dem Lock und vor jeder Wirkung. Ein unbrauchbarer Wert beruehrt D1 nicht; ihn erst
  // hinter der Warteschlange abzuweisen hiesse, einen laufenden Schreibvorgang abzuwarten, nur
  // um nichts zu tun (gleiche Linie wie #33/#37).
  if (!istLesbareId(id)) {
    return fehler(
      'ungueltige_eingabe',
      'Die Projekt-ID bezeichnet keinen einzelnen Ordner unterhalb von projects/; es wurde nichts geladen.',
    )
  }

  const ordner = projektOrdner(id)

  // DAS LOCK UMSCHLIESST ALLES - und ja, das ist zum groessten Teil eine Leseoperation.
  //
  // Es steht hier aus drei Gruenden, von denen jeder allein genuegen wuerde: (1) Diese Funktion
  // SCHREIBT, bevor sie liest - der Sofort-Flush des bisher offenen Projekts (#47) verlangt das
  // Lock ausdruecklich vom Aufrufer. (2) Der Halterwechsel (#192) darf nicht zwischen den
  // Schritten eines laufenden Schreibvorgangs stattfinden, sonst schriebe ein bereits gestarteter
  // Flush in einen Zustand hinein, den es nicht mehr gibt. (3) Das Lesen selbst konkurriert mit
  // schreibeProjekt (#46): Dessen Sicherung + Rename ist erst als GANZES unteilbar, dazwischen
  // ist die project.json des Zielprojekts kurz die alte, das .bak die neue Fassung.
  //
  // FUER AUFRUFER: Das Lock wird hier SELBST genommen (wie #33, #37, #72). Diese Funktion darf
  // NICHT noch einmal in mitD1Lock eingewickelt werden - der innere Aufruf wartete auf den
  // aeusseren, der auf ihn wartet (#32, "Deadlock-Gefahr").
  //
  // Die Rueckgabeangabe am Rueckruf ist nicht Zierde: Ohne sie hat `return { ok: true, ... }`
  // keinen Zieltyp, `ok` weitete sich zu `boolean`, und die unterschiedene Union `Ergebnis`
  // waere nicht mehr diskriminierbar.
  return mitD1Lock(async (): Promise<Ergebnis<Project>> => {
    // SCHRITT 1: Gibt es den Ordner? Diese Frage steht VOR dem Sofort-Flush, damit ein Tippfehler
    // in der Kennung nicht das offene Projekt anfasst ("keine Wirkung", Fehlerpfad-Tabelle).
    const zustand = await pruefeOrdner(ordner)
    if (zustand !== 'ordner') {
      return zustand === 'fehlt'
        ? fehler('nicht_gefunden', 'Zu dieser Kennung gibt es keinen Projektordner.')
        : fehler(
            'unbekannter_fehler',
            `Der Projektordner ${ordner} laesst sich nicht befragen; das Projekt wurde nicht geladen.`,
            'speicher_fehler',
          )
    }

    // SCHRITT 2: DAS BISHER OFFENE PROJEKT SICHERN - VOR dem Wechsel, nicht danach.
    //
    // "ein vorher aktives Projekt wird beim Oeffnen eines neuen ersetzt (Sofort-Flush des alten
    // vor dem Wechsel, s. #47)" (Invariante des Issues); #47 fuehrt den Projektwechsel als Fall
    // (2) seiner vier Ausloeser.
    //
    // WARUM ZUERST UND NICHT ERST NACH DEM LESEN: Wird DASSELBE Projekt erneut geoeffnet, ist
    // die Reihenfolge nicht gleichgueltig. Erst lesen, dann flushen hiesse: Wir laden den Stand
    // von der Platte, schreiben danach den (neueren) Speicherstand darueber und ersetzen ihn
    // anschliessend durch den soeben gelesenen alten - der naechste Auto-Speicherlauf schriebe
    // den Rueckschritt fest. So herum kann das nicht passieren: Was wir lesen, ist immer das,
    // was unmittelbar davor geschrieben wurde.
    //
    // EIN FEHLSCHLAG BRICHT AB. Das ist eine Abwaegung, keine Beilaeufigkeit: Der ungespeicherte
    // Stand bliebe zwar im Speicher (#47 merkt ihn vor und wiederholt alle 5 s), aber der
    // Beenden-Ablauf flusht ausschliesslich das AKTIVE Projekt (flushBeimBeenden, #47) - haetten
    // wir den Halter schon umgestellt, verschwaende die Arbeit am alten Projekt beim naechsten
    // Schliessen lautlos. Lieber ein Projektwechsel, der sich weigert, als einer, der Arbeit
    // verliert (TK 9.5.4: "nicht leer/verlustbehaftet weiterstarten").
    const offen = holeAktivesProjekt()
    if (offen !== null) {
      const gesichert = await sofortFlush(offen)
      if (!gesichert.ok) {
        return fehler(
          'unbekannter_fehler',
          `Das bisher geoeffnete Projekt "${offen.name}" konnte nicht gespeichert werden; ` +
            `deshalb wurde nicht gewechselt. Grund: ${gesichert.fehler.meldung}`,
          'speicher_fehler',
        )
      }
    }

    // SCHRITT 3: DASSELBE PROJEKT ERNEUT OEFFNEN HEISST NICHT NEU EINLESEN.
    //
    // "Das aktive Projekt lebt zur Laufzeit im Speicher." (TK 9.5.1) Wuerde hier ein zweites
    // Project-Objekt aus der Datei entstehen, gaebe es fuer dasselbe Projekt zwei Objekte - und
    // wer die alte Referenz haelt (der vorgemerkte Stand in #47, ein bereits eingereihter
    // Auftrag), bearbeitete ab dann einen Zwilling, dessen Aenderungen niemand mehr sieht. Genau
    // die "zweite Wahrheit", die #192 ausschliesst. Nach Schritt 2 ist der Speicherstand
    // ausserdem nachweislich derselbe wie die Datei, es geht also kein Inhalt verloren.
    // Der config-store wird trotzdem gesetzt (Schritt 5) - er koennte aus einem frueheren
    // Fehlschlag veraltet sein.
    const geladen = offen !== null && offen.id === id ? erfolg(offen) : await ladeVonPlatte(ordner, id)
    if (!geladen.ok) {
      return geladen
    }

    // SCHRITT 4: erst die Platte, dann der Speicher.
    //
    // `setzeAktivesProjekt` (#27) ist der einzige Schritt hier, der noch scheitern kann;
    // `merkeAktivesProjekt` (#192) ist synchron und wirft nie. In dieser Reihenfolge hinterlaesst
    // ein Fehlschlag deshalb KEINEN Halbzustand: Der Halter zeigt weiter auf das alte Projekt,
    // und der Aufrufer bekommt einen Fehler statt eines "offenen" Projekts, das der naechste
    // Start nicht wiederfindet. Umgekehrt haetten wir ein Projekt im Speicher, dessen Kennung
    // nirgends steht - und muessten den Halter von Hand zurueckdrehen.
    //
    // Der Aufruf liegt INNERHALB des D1-Locks. Das ist unbedenklich: config.json hat eine EIGENE
    // Serialisierung (#31), die nie zurueck in D1 greift - es gibt also keine zweite Sperre, die
    // auf diese warten koennte (gleiche Feststellung wie in #37).
    const vermerkt = await setzeAktivesProjekt(id)
    if (!vermerkt.ok) {
      return fehler(
        'unbekannter_fehler',
        'Das Projekt wurde gelesen, aber der Vermerk ueber das aktive Projekt in config.json ' +
          `konnte nicht geschrieben werden; es wurde nicht gewechselt. Grund: ${vermerkt.fehler.meldung}`,
        'speicher_fehler',
      )
    }

    // SCHRITT 5: der Halterwechsel. Gesetzt wird DIESELBE Referenz, die zurueckgegeben wird -
    // eine Kopie waere die zweite Wahrheit, die #192 ausschliesst.
    merkeAktivesProjekt(geladen.wert)
    return geladen
  })
}
// - laeuft VOLLSTAENDIG innerhalb von mitD1Lock (#32); das Lock wird hier SELBST genommen
// - liest erst project.json, bei Unbrauchbarkeit project.json.bak (TK 9.5.4)
// - eine ZU HOHE schemaVersion wird VOR der Migration erkannt und NICHT geraten (TK 9.5.5)
// - eine AELTERE schemaVersion laeuft durch migriereProjekt (#48)
// - SCHREIBT die geladene Fassung NICHT zurueck (Begruendung: Vermerk 1 am Dateiende)
// - bei jedem Fehlschlag bleibt das bisher offene Projekt unveraendert offen

// ---------------------------------------------------------------------------
// Intern. Bewusst nichts davon exportiert (ausser dem Fehlergrund oben): Wer eine dieser
// Regeln braucht, braucht in Wahrheit öffneProjekt - sonst entstuende eine zweite Stelle, die
// entscheidet, was als ladbares Projekt gilt.
// ---------------------------------------------------------------------------

/**
 * Liest das Projekt vom Datentraeger: erst `project.json`, dann `project.json.bak`.
 *
 * DIE REIHENFOLGE IST DIE INVARIANTE aus TK 9.5.4 ("Ist project.json beim Laden defekt -> aus
 * .bak wiederherstellen; ist auch das defekt -> Fehler melden"). Sie ist dieselbe wie in
 * `listeProjekte` (#35) - was dort die Anzeige rettet, rettet hier das Projekt.
 *
 * ZU NEU BRICHT SOFORT AB, OHNE RUECKFALL. Das ist der eine Punkt, an dem "defekt" und
 * "unbrauchbar" auseinandergehalten werden muessen: Die `.bak` ist per Bauart eine AELTERE
 * Fassung DERSELBEN Datei. Aus einer zu neuen project.json auf die .bak auszuweichen hiesse
 * entweder, dieselbe Absage ein zweites Mal zu bekommen - oder, schlimmer, eine tatsaechlich
 * aeltere Fassung stillschweigend zu laden und alles zu verlieren, was die neuere App-Version
 * seither hinzugefuegt hat. "Fehler (nicht raten)" (TK 9.5.5) meint genau das.
 */
async function ladeVonPlatte(ordner: string, id: string): Promise<Ergebnis<Project>> {
  const erste = await leseFassung(path.join(ordner, DATEI), id)
  if (erste.art !== 'defekt') {
    return ausLeseversuch(erste, DATEI)
  }

  const zweite = await leseFassung(path.join(ordner, SICHERUNG), id)
  if (zweite.art !== 'defekt') {
    return ausLeseversuch(zweite, SICHERUNG)
  }

  // BEIDE unbrauchbar - der Fall, um den dieses Issue kreist. Gemeldet wird mit BEIDEN Gruenden:
  // Der Nutzer (und die Fehlersuche) braucht die Auskunft, woran jede der zwei Dateien scheitert;
  // "Projekt kaputt" allein liesse offen, ob eine Rettung von Hand ueberhaupt aussichtsreich ist.
  // Es wird NICHT leer weitergestartet und nichts repariert (TK 9.5.4).
  return fehler(
    'unbekannter_fehler',
    `Weder ${DATEI} (${erste.grund}) noch ${SICHERUNG} (${zweite.grund}) sind brauchbar; ` +
      'das Projekt wurde nicht geladen.',
    'speicher_fehler',
  )
}

/** Der Ausgang eines Leseversuchs auf EINE Datei. */
type Leseversuch =
  | { art: 'geladen'; projekt: Project }
  | { art: 'zuNeu'; gefunden: number }
  | { art: 'defekt'; grund: string }

/** Setzt einen nicht-defekten Leseversuch in die Ergebnis-Huelle um. */
function ausLeseversuch(versuch: Leseversuch, datei: string): Ergebnis<Project> {
  if (versuch.art === 'geladen') {
    return erfolg(versuch.projekt)
  }
  if (versuch.art === 'zuNeu') {
    return fehler(
      'unbekannter_fehler',
      `${datei} hat die schemaVersion ${versuch.gefunden}; diese App kennt hoechstens ` +
        `${AKTUELLE_SCHEMA_VERSION}. Das Projekt wurde mit einer neueren App-Version erstellt und ` +
        'deshalb NICHT geladen - eine aeltere Fassung wuerde die neueren Daten ueberschreiben.',
      'schema_zu_neu',
    )
  }
  // Nicht erreichbar (der Aufrufer prueft `art !== 'defekt'`), aber ohne diesen Zweig waere der
  // Rueckgabetyp nicht vollstaendig - und ein spaeterer dritter Ausgang fiele hier sofort auf.
  return fehler('unbekannter_fehler', `${datei}: ${versuch.grund}`, 'speicher_fehler')
}

/**
 * Liest EINE Fassung und macht daraus ein ladbares `Project`.
 *
 * WAS HIER "UNGUELTIG" HEISST - und warum es STRENGER ist als in `listeProjekte` (#35): Dort
 * genuegt "ein Objekt mit einem nicht-leeren name", weil aus der Datei genau drei Anzeigefelder
 * uebernommen werden und der Rest sofort wegfaellt. Hier wird das Ergebnis das AKTIVE PROJEKT im
 * Speicher, auf dem anschliessend jede Instant-Operation arbeitet: Fehlt `liste`, wirft das erste
 * `push` in #42; fehlt `assets`, findet der Reparatur-Modus (FA-19) nichts vor. Der Massstab ist
 * deshalb die Pflichtfeld-Pruefung aus #48 (die neun Felder aus TK 9.11.3) - und zwar
 * WIEDERVERWENDET, nicht nachgebaut: `migriereProjekt` fuehrt sie am Ende jedes Laufs aus, auch
 * wenn die Kette (bei gleicher Version) leer bleibt. Eine eigene Pruefung hier waere die zweite
 * Vorstellung davon, was ein vollstaendiges Projekt ist. #35 hat diesen Abgleich ausdruecklich
 * offen gemeldet; hiermit ist er beantwortet.
 *
 * `defekt` fasst alle Arten des Scheiterns zusammen - fehlende Datei, Rechte, kaputtes JSON,
 * fehlende Pflichtfelder -, weil sie fuer den naechsten Schritt dasselbe bedeuten: Aus dieser
 * Datei kommt kein Projekt, also ist die andere dran. Der Grundtext bleibt erhalten und landet
 * in der Fehlermeldung.
 */
async function leseFassung(pfad: string, id: string): Promise<Leseversuch> {
  let roh: string
  try {
    roh = await fs.readFile(pfad, 'utf8')
  } catch (ursache) {
    return { art: 'defekt', grund: `nicht lesbar: ${text(ursache)}` }
  }

  let inhalt: unknown
  try {
    inhalt = JSON.parse(roh)
  } catch (ursache) {
    return { art: 'defekt', grund: `kein gueltiges JSON: ${text(ursache)}` }
  }
  // Array-Pruefung ausdruecklich mit dabei: `typeof [] === 'object'`, und ein JSON-Array kaeme
  // sonst als "Objekt ohne Pflichtfelder" erst eine Ebene spaeter zur Ruhe.
  if (typeof inhalt !== 'object' || inhalt === null || Array.isArray(inhalt)) {
    return { art: 'defekt', grund: 'der Inhalt ist kein JSON-Objekt' }
  }
  const rohdaten = inhalt as Record<string, unknown>

  // DIE VERSIONSFRAGE WIRD HIER ENTSCHIEDEN, VOR DEM AUFRUF VON #48 - und das ist Absicht.
  //
  // `migriereProjekt` weist eine zu hohe Version zwar ebenfalls ab (seine Schleife laeuft auf
  // Gleichheit, nicht auf "kleiner"), aber mit DEMSELBEN generischen Ausgang wie eine Luecke in
  // der Migrationskette. Sein eigener Bericht haelt fest, dass die Unterscheidung hierher gehoert:
  // Fuer den Nutzer sind das zwei voellig verschiedene Nachrichten - "diese Datei stammt aus einer
  // neueren App-Version" (er braucht die neuere App) gegen "die Migration fehlt" (ein Fehler der
  // App). Ohne diese drei Zeilen waere die zweite Nachricht die einzige, die je erscheint.
  const version: unknown = rohdaten.schemaVersion
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    return {
      art: 'defekt',
      grund: `die schemaVersion fehlt oder ist keine ganze Zahl (${String(version)})`,
    }
  }
  if (version > AKTUELLE_SCHEMA_VERSION) {
    return { art: 'zuNeu', gefunden: version }
  }

  const migriert = migriereProjekt({ ...rohdaten, schemaVersion: version })
  if (!migriert.ok) {
    return { art: 'defekt', grund: migriert.fehler.meldung }
  }

  // DIE KENNUNG KOMMT AUS DEM ORDNERNAMEN, NICHT AUS DER DATEI.
  //
  // Dieselbe Festlegung wie in #35 ("id = Ordnername unter projects/"), hier aber mit Zaehnen:
  // `schreibeProjekt` (#46) bildet seinen Zielpfad aus `projekt.id`. Stuenden die beiden
  // auseinander - weil jemand einen Projektordner kopiert oder umbenannt hat -, schriebe jedes
  // Auto-Speichern in den FREMDEN Ordner und ueberschriebe dort ein anderes Projekt, waehrend die
  // Medien dieses Projekts (loeseAssetPfad(projektId, ...), #49) weiter hier laegen. Der
  // Ordnername ist der einzige Wert, an dem beide Seiten haengen.
  return {
    art: 'geladen',
    projekt: migriert.wert.id === id ? migriert.wert : { ...migriert.wert, id },
  }
}

/**
 * Gibt es an dieser Stelle einen echten Ordner?
 *
 * `lstat` und NICHT `stat`: Eine Verknuepfung (Symlink, auf Windows auch eine Junction) meldete
 * bei `stat` `isDirectory() === true`, und wir laedten ein Projekt, das `listeProjekte` (#35)
 * gar nicht auflistet und `loescheProjekt` (#37) nicht loeschen kann - drei Funktionen mit drei
 * Vorstellungen davon, was ein Projekt ist. Diese Datei folgt der vorsichtigen, bereits gebauten
 * Linie der beiden anderen. Die Frage selbst gehoert EINMAL entschieden (pfade.ts #49, Vermerk 1);
 * sie wird hier nicht beantwortet, nur nicht neu erfunden.
 */
async function pruefeOrdner(ordner: string): Promise<'ordner' | 'fehlt' | 'unlesbar'> {
  try {
    return (await fs.lstat(ordner)).isDirectory() ? 'ordner' : 'fehlt'
  } catch (ursache) {
    // ENOTDIR heisst: ein Elternteil des Pfades ist eine Datei - fuer den Nutzer dasselbe wie
    // "gibt es nicht". Alles andere (EACCES, EIO) ist ein Speicherproblem und darf nicht als
    // "nicht gefunden" erscheinen; sonst suchte er ein Projekt, das sehr wohl da ist.
    return istCode(ursache, 'ENOENT', 'ENOTDIR') ? 'fehlt' : 'unlesbar'
  }
}

/**
 * Ist `id` ein Name, der genau EINEN Ordner unterhalb von `projects/` bezeichnet?
 *
 * `projektOrdner` (#49) prueft seine ID ausdruecklich NICHT und weist die Pruefung den Aufrufern
 * zu. Uebernommen ist die Linie der bereits gebauten Schwesterfunktionen #46/#37: Das ERGEBNIS
 * von `projektOrdner` wird gegen einen mit unbedenklicher ID gebildeten Vergleichspfad gehalten.
 * Liegt der Ordner im selben Elternverzeichnis und heisst er genau wie die ID, kann die ID kein
 * Pfad gewesen sein. Die Zeichenliste aus #49 wird NICHT abgeschrieben - sie ist dort bewusst
 * nicht exportiert, und eine Abschrift liefe beim naechsten Zusatz auseinander.
 *
 * Fuer eine Leseoperation ist der Schaden geringer als beim Loeschen (#37) - aber `id` landet
 * anschliessend als `Project.id` im Halter und von dort in JEDEM spaeteren Schreibpfad. Die
 * Pruefung steht deshalb hier und nicht erst dort.
 */
function istLesbareId(id: unknown): id is string {
  // `typeof` trotz `id: string`: Der Wert kommt ueber IPC aus dem Renderer, und ueber die
  // Prozessgrenze reist ein `unknown` als `string` getarnt (TK 9.1.1).
  if (typeof id !== 'string' || id.length === 0) {
    return false
  }
  // Windows schneidet Punkte und Leerzeichen am Ende eines Pfadsegments still ab: `"<uuid> "`
  // bestuende den Vergleich unten, zeigte auf der Platte aber auf `"<uuid>"` - wir laedten ein
  // Projekt und merkten es unter einer Kennung, unter der es nicht liegt.
  if (id.endsWith('.') || id.endsWith(' ')) {
    return false
  }
  const ordner = path.resolve(projektOrdner(id))
  const vergleich = path.resolve(projektOrdner(VERGLEICHS_ID))
  return path.dirname(ordner) === path.dirname(vergleich) && path.basename(ordner) === id
}

function erfolg(projekt: Project): Ergebnis<Project> {
  return { ok: true, wert: projekt }
}

/**
 * Die Fehlerseite der Huelle. `grund` ist der maschinenlesbare Anhang aus
 * `OeffneProjektFehlergrund` (s. dort) - er entfaellt, wo der Code selbst schon genau ist.
 */
function fehler(
  code: GenerischerFehlercode,
  meldung: string,
  grund?: OeffneProjektFehlergrund,
): Ergebnis<Project> {
  if (grund === undefined) {
    return { ok: false, fehler: { code, meldung } }
  }
  return { ok: false, fehler: { code, meldung, daten: { grund } } }
}

/** Prueft den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den er nicht hat. */
function istCode(ursache: unknown, ...codes: readonly string[]): boolean {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return false
  }
  const code = (ursache as { code?: unknown }).code
  return typeof code === 'string' && codes.includes(code)
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. DIE GELADENE FASSUNG WIRD NICHT ZURUECKGESCHRIEBEN - weder nach einer Migration noch nach
//    einer Rettung aus der .bak. #48 hat diese Entscheidung ausdruecklich hierher gegeben
//    ("sofort nach dem Oeffnen oder erst beim naechsten Auto-Speichern"). Sie faellt gegen das
//    Schreiben, und zwar aus einem Grund, der beim Bauen aufgefallen ist: `schreibeProjekt` (#46)
//    KOPIERT ALS ERSTES die vorhandene project.json nach project.json.bak. Nach einer Rettung aus
//    der .bak wuerde ein sofortiger Rueckschreibvorgang also die KAPUTTE project.json ueber die
//    einzige heile Fassung kopieren - und wenn dann das eigentliche Schreiben scheitert (volle
//    Platte, genau die Ursache, die den Schaden angerichtet hat), ist das Projekt endgueltig weg.
//    Ein Oeffnen darf nicht gefaehrlicher sein als Nichtstun.
//    OFFEN, UND NICHT VON HIER LOESBAR: Dasselbe Fenster steht beim naechsten Auto-Speichern
//    wieder offen (#47 -> #46 sichert dann ebenfalls die kaputte Datei ueber die heile .bak).
//    Sauber schliessen laesst es sich nur in #46 - etwa, indem dort nur eine LESBARE project.json
//    gesichert wird. Das ist eine Aenderung an einer fremden, bereits gebauten Datei und gehoert
//    in ein eigenes Issue.
//
// 2. KEIN `planeAutoSpeicherung` NACH DEM LADEN. Es waere die naheliegende Art, eine Migration
//    oder eine Rettung binnen 4 s auf die Platte zu bringen - aber es machte aus dem Oeffnen eine
//    Aenderung, faende dasselbe .bak-Fenster aus Vermerk 1 vor und liesse ein blosses Ansehen
//    eines Projekts als "ungespeicherte Aenderung" erscheinen. Das gehoert entschieden, nicht
//    nebenbei eingebaut.
//
// 3. KEIN EIGENER FEHLERCODE, OBWOHL DIE FEHLERTABELLE EINEN VERLANGT. Die verbindliche Signatur
//    `Ergebnis<Project>` kann `speicher_fehler` nicht tragen (s. `OeffneProjektFehlergrund`).
//    Gemeldet, nicht behoben - eine Signaturaenderung gehoert ins Issue.
//
// 4. KEINE PRUEFUNG DES MEDIENORDNERS UND KEIN ABGLEICH DER ASSET-DATEIEN. Ein Projekt, dessen
//    media/-Dateien fehlen, wird geladen; sichtbar macht das der gefuehrte Reparatur-Modus
//    (FA-19, TK 9.7.5), nicht das Oeffnen. Wer hier pruefte, wuerde ein Projekt unaufmachbar
//    machen, das der Nutzer gerade reparieren will.
