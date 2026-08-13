// GENERIERT aus dem Signaturblock von Issue #36.
// [project-store] dupliziereProjekt implementieren
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
// GERUEST-PRUEFSUMME: 0e09c6ad03dad99f
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

import fs from 'node:fs/promises'
import path from 'node:path'

import { erzeugeId } from '../../shared/contracts/id'                        // #20
import { AKTUELLE_SCHEMA_VERSION } from '../../shared/contracts/konstanten'  // #21

import { holeAktivesProjekt } from './aktives-projekt'                       // #192
import { mitD1Lock } from './d1-lock'                                        // #32
import { migriereProjekt } from './migriere-projekt'                         // #48
import { medienOrdner, projektOrdner } from './pfade'                        // #49
import { schreibeProjekt } from './schreibe-projekt'                         // #46

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern); "darf selbst nicht
//         // erneut mitD1Lock aufrufen (Deadlock-Gefahr)". Das Lock wird HIER genommen.
//   #46:  schreibeProjekt(projekt: Project): Promise<Ergebnis<void, ProjectStoreFehlercode>>
//         // schreibt <Datenort>/projects/<projekt.id>/project.json atomar (.tmp + Rename,
//         // .bak-Sicherung, schemaVersion wird beim Schreiben gesetzt) und nimmt SELBST KEIN
//         // Lock: "Wer schreibeProjekt AUSSERHALB von mitD1Lock ruft, hat keine Serialisierung."
//   #48:  migriereProjekt(rohdaten: Record<string, unknown> & { schemaVersion: number },
//                         kette?: ReadonlyMap<number, MigrationsSchritt>): Ergebnis<Project>
//         // reine Umformung IM SPEICHER, schreibt nichts; prueft am Ende die neun Pflichtfelder
//         // aus TK 9.11.3. Der zweite Parameter ist Testwerkzeug und wird von hier NIE mitgegeben.
//   #49:  projektOrdner(projektId: string): string
//         medienOrdner(projektId: string): string
//         // absolute Pfade, reine String-Operation, kein Dateisystemzugriff und KEINE Pruefung
//         // der projektId (s. `istKopierbareId`). Die Pfad-Autoritaet ist die EINE Stelle, die
//         // das Datei-Layout kennt (TK 9.5.7) - hier wird nichts zusammengesetzt.
//   #20:  erzeugeId(): string
//         // UUID v4, "die EINE Stelle, an der IDs entstehen" (TK 9.11.4).
//   #192: holeAktivesProjekt(): Project | null
//         // der LEBENDE Stand des offenen Projekts, keine Kopie. SYNCHRON, kein Lock, wirft nie.
//   #21:  const AKTUELLE_SCHEMA_VERSION = 1

/** Dateiname im Projektordner - gleichlautend mit #46, #34 und #35. */
const DATEI = 'project.json'

/**
 * Eine unbedenkliche Projekt-ID, die NUR als Vergleichswert dient (s. `istKopierbareId`).
 * Ihr Ordner wird nie angelegt und nie angefasst.
 */
const VERGLEICHS_ID = 'vergleich'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72
import type { Project } from '../../shared/contracts/project'
export async function dupliziereProjekt(id: string, neuerName: string): Promise<Ergebnis<Project, ProjectStoreFehlercode>> {
  // BEIDE PRUEFUNGEN LAUFEN VOR DEM LOCK. Ein unbrauchbarer Eingang beruehrt D1 nicht
  // ("keine Wirkung", Fehlerpfad-Tabelle); ihn erst hinter der Warteschlange abzuweisen
  // hiesse, einen laufenden Schreibvorgang abzuwarten, nur um nichts zu tun. Gleiche Linie
  // wie #33, #34 und #37.
  //
  // `typeof` trotz `neuerName: string`: Der Wert kommt ueber IPC aus dem Renderer, und ueber
  // die Prozessgrenze reist ein `unknown` als `string` getarnt (TK 9.1.1). Ohne die Pruefung
  // wuerde `null.trim()` werfen - und ein Wurf reist nie ueber die Grenze.
  if (typeof neuerName !== 'string' || neuerName.trim().length === 0) {
    return fehler('ungueltige_eingabe', 'Das Duplikat braucht einen nicht leeren Namen.')
  }
  if (!istKopierbareId(id)) {
    // Der beanstandete Wert steht ABSICHTLICH nicht in der Meldung - sie reist bis in die
    // Oberflaeche (gleiche Linie wie pfade.ts #49).
    return fehler(
      'ungueltige_eingabe',
      'Die Projekt-ID bezeichnet keinen einzelnen Ordner unterhalb von projects/; ' +
        'es wurde nichts kopiert.',
    )
  }

  // GETRIMMT gespeichert, wie in erstelleProjekt (#33). Zwei Wege, ein Projekt zu benennen,
  // duerfen nicht zwei verschiedene Ergebnisse liefern - sonst stuenden in der Projektliste
  // Eintraege, die identisch aussehen und es nicht sind.
  const anzeigename = neuerName.trim()
  const quellOrdner = projektOrdner(id)

  // DAS LOCK UMSCHLIESST ALLES: Quelle lesen, Ordner anlegen, media/ kopieren, schreiben.
  //
  // Es steht hier aus zwei Gruenden: (1) `schreibeProjekt` (#46) nimmt selbst kein Lock und
  // ist ohne eines nicht serialisiert. (2) Die Quelle wird gelesen, waehrend ein anderer
  // Abschnitt sie schreiben koennte - dessen Sicherung + Rename ist erst als GANZES
  // unteilbar, dazwischen ist project.json kurz die alte und das .bak die neue Fassung. Ohne
  // Lock kopierte das Duplikat genau diesen Zwischenzustand.
  //
  // FUER AUFRUFER: Diese Funktion nimmt das Lock SELBST (wie #33, #34, #37, #72). Sie darf
  // NICHT noch einmal in mitD1Lock eingewickelt werden - der innere Aufruf wartete auf den
  // aeusseren, der auf ihn wartet (#32, "Deadlock-Gefahr").
  //
  // Die Rueckgabeangabe am Rueckruf ist nicht Zierde: Ohne sie hat `return { ok: true, ... }`
  // keinen Zieltyp, `ok` weitete sich zu `boolean`, und die unterschiedene Union `Ergebnis`
  // waere nicht mehr diskriminierbar.
  return mitD1Lock(async (): Promise<Ergebnis<Project, ProjectStoreFehlercode>> => {
    const quelle = await leseQuelle(id, quellOrdner)
    if (!quelle.ok) {
      return quelle
    }

    const neueId = erzeugeId()
    const jetzt = new Date().toISOString()

    // DER KERN DIESES ISSUES, und die einzige Stelle, an der eine ID neu vergeben wird:
    //
    // "**`dupliziereProjekt` vergibt eine neue Projekt-ID**, behaelt aber die projektinternen
    // IDs (Assets, Aktionen, Listenelemente) - sie sind ohnehin nur projektweit eindeutig, und
    // ein Umschreiben wuerde alle inneren Referenzen gefaehrden." (TK 9.11.4, woertlich)
    //
    // Der Spread uebernimmt deshalb assets, aktionen und liste UNVERAENDERT: `Listenelement.ref`
    // zeigt auf eine Asset- oder Aktions-ID, `Aktion.bildRef` auf eine Asset-ID, und die
    // Mediendateien in media/ heissen nach der Asset-ID (TK 9.4.8). Wer hier durchnummerierte,
    // muesste alle vier Bezuege UND die Dateinamen im Gleichschritt umschreiben - und jede
    // vergessene Stelle waere ein Duplikat, das beim Rendern still auf Platzhalter faellt.
    //
    // Der Spread ist zugleich der Grund, warum ein spaeter zu `Project` hinzukommendes Feld
    // automatisch mitwandert; eine Aufzaehlung einzelner Felder liesse es lautlos fallen.
    const duplikat: Project = {
      ...quelle.wert,
      id: neueId,
      name: anzeigename,
      // ENTSCHIEDEN - die Zeitstempel werden auf JETZT gesetzt, nicht mitkopiert.
      //
      // Begruendungspflichtig, weil es ueber "kopiert project.json" hinausgeht: Das Duplikat
      // IST ein neues Projekt (neue ID, eigener Ordner), und `listeProjekte` (#35) zeigt genau
      // diese zwei Felder an. Geerbte Stempel liessen die soeben entstandene Kopie in jeder
      // nach Datum sortierten Liste an der Stelle des Originals stehen - der Nutzer suchte sein
      // frisches Duplikat dort, wo es nicht ist. `geaendertAm` erbt zusaetzlich eine Unwahrheit:
      // `schreibeProjekt` (#46) fasst das Feld ausdruecklich NICHT an, der Wert bliebe also
      // dauerhaft aelter als die Datei, in der er steht.
      erstelltAm: jetzt,
      geaendertAm: jetzt,
      // Wird von schreibeProjekt (#46) beim Schreiben ohnehin gesetzt. Hier steht sie trotzdem,
      // weil das ZURUECKGEGEBENE Objekt dieselbe Version tragen muss wie die Datei - sonst
      // haette der Aufrufer einen Stand, der so nicht auf der Platte liegt.
      schemaVersion: AKTUELLE_SCHEMA_VERSION,
      // letzterAusgabeName wird NICHT angefasst - er wird mitkopiert. Das ist der zweite
      // STOPP-Punkt des Issues und deshalb ausdruecklich KEINE eigene Entscheidung: Die
      // verbindliche Invariante sagt "kopiert project.json", also bleibt das Feld stehen; ein
      // Zuruecksetzen auf null waere die Festlegung, die das Issue verbietet. Folgenlos ist es
      // heute: Der Wert ist allein die Vorbelegung des Render-Zielnamens (FA-22), und weil
      // output/ nicht mitkopiert wird, legt der erste Render im Duplikat unter diesem Namen
      // eine neue Datei an, statt eine zu ersetzen. S. Bericht/STOPP.
    }

    const zielOrdner = projektOrdner(neueId)

    // ANLEGEN IN ZWEI SCHRITTEN, UND DER ZWEITE OHNE `recursive` - uebernommen aus #33, und
    // zwar nicht als Geschmacksfrage: `recursive: true` meldet Erfolg, egal ob der Ordner neu
    // ist oder schon stand. Ohne den Schalter bedeutet ein gelungener Aufruf "diesen Ordner
    // habe ICH angelegt" - und nur dann darf der Fehlerpfad weiter unten rekursiv loeschen.
    //
    // path.dirname statt eines eigenen join: Der Elternordner wird aus dem Pfad der Autoritaet
    // ABGELEITET, nicht aus Datenort und "projects" nachgebaut (TK 9.5.7).
    //
    // EEXIST hier heisst: Die frisch erzeugte UUID hat schon einen Ordner. Praktisch unmoeglich,
    // aber wenn doch, gehoert er jemand anderem - abbrechen, nichts anfassen und NICHTS
    // aufraeumen (an dieser Stelle besitzen wir noch keinen Ordner).
    try {
      await fs.mkdir(path.dirname(zielOrdner), { recursive: true })
      await fs.mkdir(zielOrdner)
    } catch (ursache) {
      return fehler(
        'speicher_fehler',
        `Der Ordner fuer das Duplikat konnte nicht angelegt werden: ${text(ursache)}`,
      )
    }

    // ERST DIE MEDIEN, DANN project.json. Scheitert das Kopieren, hat nie eine project.json
    // existiert - `listeProjekte` (#35) kann also zu keinem Zeitpunkt einen Halbzustand sehen,
    // und der Ordner faellt gleich mit weg.
    try {
      await kopiereMedien(medienOrdner(id), medienOrdner(neueId))
    } catch (ursache) {
      await raeumeAuf(zielOrdner)
      return fehler(
        'speicher_fehler',
        `Der Medienordner konnte nicht vollstaendig kopiert werden; das Duplikat wurde wieder ` +
          `entfernt. Grund: ${text(ursache)}`,
      )
    }

    const geschrieben = await schreibeProjekt(duplikat)
    if (!geschrieben.ok) {
      // "kein Halbzustand sichtbar" (Fehlerpfad-Tabelle). Ein Projektordner mit kopierten
      // Medien, aber ohne project.json, ist genau das: eine Leiche, die der Nutzer in der
      // Projektliste nicht wiederfindet und deshalb auch nicht loeschen kann. Das Aufraeumen
      // ist gefahrlos, weil der Ordner nachweislich in diesem Aufruf entstanden ist (s. oben)
      // und seine ID noch niemand kennt.
      await raeumeAuf(zielOrdner)
      // DURCHGEREICHT, nicht neu erfunden: #46 unterscheidet ungueltige_eingabe (nicht
      // serialisierbar) von speicher_fehler (Platte); beide Codes traegt diese Signatur.
      return { ok: false, fehler: geschrieben.fehler }
    }

    return { ok: true, wert: duplikat }
  })
}
// Ausgang bei Erfolg: das neue Project mit NEUER id, aber unveraenderten internen IDs (Assets,
// Aktionen, Listenelemente) und einer physischen Kopie von media/. Das Original bleibt in jeder
// Hinsicht unangetastet; das Duplikat wird NICHT geoeffnet und NICHT aktiv (s. Vermerk 2).

// ---------------------------------------------------------------------------
// Intern. Bewusst nichts davon exportiert: Wer eine dieser Regeln braucht, braucht in Wahrheit
// dupliziereProjekt - sonst entstuende eine zweite Stelle, die entscheidet, was kopiert werden
// darf.
// ---------------------------------------------------------------------------

/**
 * Beschafft den Stand, der kopiert wird - und zwar aus der Quelle, die ihn wirklich fuehrt.
 *
 * DER LEBENDE STAND SCHLAEGT DIE DATEI. Ist das Quellprojekt das gerade geoeffnete, wird die
 * Kopie aus dem Speicher gezogen und project.json gar nicht gelesen. Grund: Das Auto-Speichern
 * ist entprellt (3-5 s, TK 9.5.4), die Datei hinkt dem Bildschirm also regelmaessig hinterher.
 * Wer unmittelbar nach einer Aenderung dupliziert, bekaeme sonst lautlos eine Kopie OHNE diese
 * Aenderung - der schlimmste Ausgang, weil nichts fehlschlaegt und niemand es bemerkt.
 * Ein Sofort-Flush (#47) waere die Alternative gewesen; er wurde NICHT gewaehlt, weil er die
 * Quelle SCHREIBT und damit ein Duplizieren gefaehrlicher machte als Nichtstun ("Original bleibt
 * unveraendert", DoD) - und weil sein Fehlschlag ein reines Kopieren scheitern liesse.
 *
 * KOPIERT WIRD IN JEDEM FALL, nie die Original-Referenz weitergereicht: Das Duplikat teilt sich
 * sonst assets/aktionen/liste mit dem offenen Projekt, und die naechste Instant-Operation
 * aenderte beide zugleich.
 */
async function leseQuelle(
  id: string,
  ordner: string,
): Promise<Ergebnis<Project, ProjectStoreFehlercode>> {
  // SCHRITT 1: Gibt es das Projekt ueberhaupt? Diese Frage steht auch im Speicher-Fall vorn -
  // ohne Ordner gibt es kein media/ zu kopieren, und ein Duplikat ohne Medien waere kaputt.
  const zustand = await pruefeOrdner(ordner)
  if (zustand === 'fehlt') {
    return fehler('nicht_gefunden', `Es gibt kein Projekt mit dieser Kennung (${ordner}).`)
  }
  if (zustand === 'unlesbar') {
    return fehler(
      'speicher_fehler',
      `Der Projektordner ${ordner} laesst sich nicht befragen; es wurde nichts kopiert.`,
    )
  }

  const offen = holeAktivesProjekt()
  if (offen !== null && offen.id === id) {
    // Der Umweg ueber JSON statt structuredClone ist Absicht: Das Duplikat geht ohnehin durch
    // JSON.stringify (#46). Wer hier durch denselben Trichter klont, haelt genau das in der
    // Hand, was gleich in der Datei stehen wird - und ein nicht serialisierbarer Speicherstand
    // faellt hier auf, mit derselben Meldung wie beim Speichern, statt erst nach dem Anlegen
    // von Ordner und Medien.
    try {
      return { ok: true, wert: JSON.parse(JSON.stringify(offen)) as Project }
    } catch (ursache) {
      return fehler(
        'ungueltige_eingabe',
        `Der Speicherstand des offenen Projekts ist nicht serialisierbar: ${text(ursache)}`,
      )
    }
  }

  return leseVonPlatte(path.join(ordner, DATEI))
}

/**
 * Liest ein NICHT geoeffnetes Projekt aus seiner project.json.
 *
 * KEIN RUECKFALL AUF DIE .bak - anders als beim Oeffnen (#34, TK 9.5.4). Das ist eine
 * Abwaegung, keine Auslassung: Die Rettung aus der Sicherung ist ein Reparaturvorgang mit
 * Datenverlust (die .bak ist per Bauart die VORHERIGE Fassung), und sie gehoert an die Stelle,
 * die der Nutzer bewusst ausloest - er oeffnet das Projekt, sieht den geretteten Stand und
 * dupliziert erst dann. Waere der Rueckfall hier eingebaut, entstuende aus einer defekten
 * project.json still ein zweites, um eine Fassung zurueckliegendes Projekt, und der Nutzer
 * haette zwei Staende, von denen er nur einen kennt.
 *
 * Die Pflichtfeldpruefung wird WIEDERVERWENDET, nicht nachgebaut: `migriereProjekt` (#48)
 * fuehrt sie am Ende jedes Laufs aus, auch wenn die Kette bei gleicher Version leer bleibt.
 * Eine eigene Pruefung hier waere die zweite Vorstellung davon, was ein vollstaendiges Projekt
 * ist - #34 hat denselben Weg gewaehlt.
 */
async function leseVonPlatte(pfad: string): Promise<Ergebnis<Project, ProjectStoreFehlercode>> {
  let roh: string
  try {
    roh = await fs.readFile(pfad, 'utf8')
  } catch (ursache) {
    return fehler('speicher_fehler', `${DATEI} ist nicht lesbar: ${text(ursache)}`)
  }

  let inhalt: unknown
  try {
    inhalt = JSON.parse(roh)
  } catch (ursache) {
    return fehler('speicher_fehler', `${DATEI} ist kein gueltiges JSON: ${text(ursache)}`)
  }
  // Array-Pruefung ausdruecklich mit dabei: `typeof [] === 'object'`, und ein JSON-Array kaeme
  // sonst als "Objekt ohne Pflichtfelder" erst eine Ebene spaeter zur Ruhe.
  if (typeof inhalt !== 'object' || inhalt === null || Array.isArray(inhalt)) {
    return fehler('speicher_fehler', `${DATEI} enthaelt kein JSON-Objekt.`)
  }
  const rohdaten = inhalt as Record<string, unknown>

  const version: unknown = rohdaten.schemaVersion
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    return fehler(
      'speicher_fehler',
      `Die schemaVersion in ${DATEI} fehlt oder ist keine ganze Zahl (${String(version)}).`,
    )
  }
  // ZU NEU BRICHT AB, OHNE ZU RATEN (TK 9.5.5). Wuerde diese Pruefung fehlen, liefe eine Datei
  // aus einer neueren Programmfassung ungeprueft durch, und `schreibeProjekt` (#46) stempelte
  // dem Duplikat die HEUTIGE schemaVersion auf Daten, die diese App nicht versteht - eine
  // Faelschung, die spaeter niemand mehr als solche erkennt.
  //
  // Der Code dafuer ist `unbekannter_fehler` und nicht `schema_zu_neu`: Diesen fachlichen Code
  // fuehrt allein #34 in seiner eigenen Union (`OeffneProjektFehlergrund`), und
  // `ProjectStoreFehlercode` (#72) kennt nur `speicher_fehler`. Ein `speicher_fehler` waere hier
  // gelogen - die Platte ist in Ordnung. GEMELDET statt behelfsmaessig ausgeweitet, s. Bericht.
  if (version > AKTUELLE_SCHEMA_VERSION) {
    return fehler(
      'unbekannter_fehler',
      `${DATEI} hat die schemaVersion ${version}; diese App kennt hoechstens ` +
        `${AKTUELLE_SCHEMA_VERSION}. Das Projekt wurde mit einer neueren App-Version erstellt ` +
        'und deshalb NICHT dupliziert.',
    )
  }

  const migriert = migriereProjekt({ ...rohdaten, schemaVersion: version })
  if (!migriert.ok) {
    return fehler(
      'speicher_fehler',
      `${DATEI} ist als Vorlage fuer ein Duplikat unbrauchbar: ${migriert.fehler.meldung}`,
    )
  }
  // Die `id` aus der Datei wird NICHT uebernommen - sie wird vom Aufrufer ohnehin durch die neue
  // ersetzt. Deshalb steht hier auch kein Abgleich mit dem Ordnernamen wie in #34: Was das
  // Duplikat traegt, entsteht in dieser Operation.
  return migriert
}

/**
 * Kopiert `media/` Eintrag fuer Eintrag. Wirft bei jedem Fehlschlag - der Aufrufer setzt den
 * Wurf in `speicher_fehler` um und raeumt den halben Zielordner weg.
 *
 * KEIN fs.cp UND KEIN REKURSIVES KOPIEREN VON HAND: Der Unterschied liegt in den Eintraegen,
 * die KEINE Datei sind. `fs.cp` uebernaehme eine Verknuepfung als Verknuepfung, und das
 * Duplikat zeigte fuer dieses Medium weiterhin auf ein Ziel ausserhalb seines eigenen Ordners -
 * ein Loeschen des Originals risse es mit. Die Hausregel dazu ist eindeutig: Verknuepfungen im
 * Datenort werden nicht verfolgt, was wie ein Ziel aussieht, aber Symlink oder Junction ist,
 * gilt als nicht vorhanden (#49). `readdir(withFileTypes)` + `isFile()` sieht die Verknuepfung
 * selbst; ihr `isFile()` ist `false`, und dieser Fall wird ABGEWIESEN statt geraten.
 *
 * Abgewiesen und nicht uebersprungen, weil ein stilles Auslassen die schlechtere Haelfte der
 * Wahl ist: "Medien werden ins Projekt KOPIERT" (TK) heisst, media/ enthaelt ausschliesslich
 * Dateien, die der Import dort abgelegt hat - alles andere hat jemand von Hand hineingelegt.
 * Ein Duplikat, dem lautlos ein Video fehlt, faellt erst am Fernseher auf; ein Abbruch mit
 * Begruendung faellt sofort auf und kostet nichts.
 *
 * Ordner werden dennoch mitgenommen (rekursiv), obwohl das Layout flach ist: Kostet vier Zeilen
 * und verhindert, dass eine kuenftige Unterteilung von media/ hier lautlos Daten verliert.
 */
async function kopiereMedien(quelle: string, ziel: string): Promise<void> {
  // Ohne `recursive`, aus demselben Grund wie oben: Der Elternordner gehoert uns nachweislich,
  // also MUSS dieses mkdir gelingen. Tut es das nicht, stimmt eine Annahme nicht - dann ist ein
  // Fehler die richtige Antwort und kein stilles Weiterlaufen.
  await fs.mkdir(ziel)

  let eintraege
  try {
    eintraege = await fs.readdir(quelle, { withFileTypes: true })
  } catch (ursache) {
    // KEIN media/ IN DER QUELLE IST KEIN FEHLER. Projekte aus einer aelteren Fassung oder ein
    // von Hand aufgeraeumter Ordner sind denkbar; das Duplikat bekommt dann ein leeres media/,
    // genau wie ein frisch angelegtes Projekt (#33). Alles andere (EACCES, EIO) ist ein echtes
    // Speicherproblem und darf nicht als "leer" durchgehen.
    if (istCode(ursache, 'ENOENT', 'ENOTDIR')) {
      return
    }
    throw ursache
  }

  for (const eintrag of eintraege) {
    const von = path.join(quelle, eintrag.name)
    const nach = path.join(ziel, eintrag.name)
    if (eintrag.isFile()) {
      // Die Dateinamen bleiben gleich - sie MUESSEN es: Ein Asset heisst auf der Platte nach
      // seiner ID (`<uuid>.<ext>`, TK 9.4.8), und die IDs bleiben unveraendert. Wer hier
      // umbenennte, braeche jede Aufloesung ueber loeseAssetPfad (#49).
      await fs.copyFile(von, nach)
      continue
    }
    if (eintrag.isDirectory()) {
      await kopiereMedien(von, nach)
      continue
    }
    throw new Error(
      `In ${quelle} liegt mit "${eintrag.name}" weder eine Datei noch ein Ordner ` +
        '(vermutlich eine Verknuepfung); ein Duplikat davon waere kein eigenstaendiges Projekt.',
    )
  }
}

/**
 * Loescht den in diesem Aufruf angelegten Zielordner wieder. Uebernommen aus #33.
 *
 * Ein Fehlschlag beim Aufraeumen wird VERSCHLUCKT und ueberschreibt nicht den Grund, aus dem wir
 * hier sind: Die eigentliche Meldung ("Platte voll", "kein Zugriff") ist die, die dem Nutzer
 * weiterhilft. Bleibt der Ordner liegen, ist das ein Schoenheitsfehler - das Original ist
 * unberuehrt, verloren geht nichts.
 */
async function raeumeAuf(ordner: string): Promise<void> {
  await fs.rm(ordner, { recursive: true, force: true }).catch(() => undefined)
}

/**
 * Gibt es an dieser Stelle einen echten Ordner?
 *
 * `lstat` und NICHT `stat`: Eine Verknuepfung (Symlink, auf Windows auch eine Junction) meldete
 * bei `stat` `isDirectory() === true`. Wir kopierten dann ein Projekt, das `listeProjekte` (#35)
 * nicht auflistet, `öffneProjekt` (#34) nicht laedt und `löscheProjekt` (#37) nicht loeschen
 * kann. Diese Datei folgt der bereits gebauten, vorsichtigen Linie der drei anderen - und der
 * Hausregel, dass Verknuepfungen im Datenort nicht verfolgt werden.
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
 * `projektOrdner` (#49) prueft seine ID ausdruecklich NICHT ("koennen es nicht: Ihre Signatur
 * gibt einen String zurueck, kein Ergebnis") und weist die Pruefung den Aufrufern zu. Uebernommen
 * ist die Linie der bereits gebauten Schwesterfunktionen #34/#37/#46: Das ERGEBNIS von
 * `projektOrdner` wird gegen einen mit unbedenklicher ID gebildeten Vergleichspfad gehalten.
 * Liegt der Ordner im selben Elternverzeichnis und heisst er genau wie die ID, kann die ID kein
 * Pfad gewesen sein. Die Zeichenliste aus #49 wird NICHT abgeschrieben - sie ist dort bewusst
 * nicht exportiert, und eine Abschrift liefe beim naechsten Zusatz auseinander.
 *
 * Hier geht es nicht nur ums Lesen: `medienOrdner(id)` wird die QUELLE eines rekursiven
 * Kopiervorgangs. Eine ID wie `..` machte daraus den halben Datenort.
 */
function istKopierbareId(id: unknown): id is string {
  // `typeof` trotz `id: string`: Der Wert kommt ueber IPC aus dem Renderer (TK 9.1.1).
  if (typeof id !== 'string' || id.length === 0) {
    return false
  }
  // Windows schneidet Punkte und Leerzeichen am Ende eines Pfadsegments still ab: `"<uuid> "`
  // bestuende den Vergleich unten, zeigte auf der Platte aber auf `"<uuid>"` - wir kopierten ein
  // Projekt, nach dem gar nicht gefragt wurde.
  if (id.endsWith('.') || id.endsWith(' ')) {
    return false
  }
  const ordner = path.resolve(projektOrdner(id))
  const vergleich = path.resolve(projektOrdner(VERGLEICHS_ID))
  return path.dirname(ordner) === path.dirname(vergleich) && path.basename(ordner) === id
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

/**
 * Die Fehlerseite der Huelle.
 *
 * `speicher_fehler` stammt aus `ProjectStoreFehlercode` (#72) und ist seit dem Issue-Nachtrag vom
 * 12.08.2026 zuweisbar; die drei generischen Codes stehen jeder Operation ohnehin offen
 * (ergebnis.ts).
 */
function fehler(
  code: ProjectStoreFehlercode | 'nicht_gefunden' | 'ungueltige_eingabe' | 'unbekannter_fehler',
  meldung: string,
): Ergebnis<Project, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. `letzterAusgabeName` WIRD MITKOPIERT UND NICHT AUF null GESETZT. Der zweite STOPP-Punkt des
//    Issues; nicht entschieden, sondern beim woertlichen Vertrag belassen ("kopiert
//    project.json"). Begruendung an der Fundstelle oben.
//
// 2. DAS DUPLIKAT WIRD NICHT AKTIV UND NICHT GEOEFFNET. Anders als erstelleProjekt (#33), das
//    merkeAktivesProjekt (#192) ruft. Grund: Ein Projektwechsel ist mehr als eine Zuweisung -
//    öffneProjekt (#34) flusht zuvor das offene Projekt (#47) und schreibt die Kennung nach
//    config.json (#27). Wer hier nur den Halter umstellte, haette ein "offenes" Projekt, das der
//    naechste Start nicht wiederfindet, und der ungespeicherte Stand des vorherigen Projekts
//    ginge beim Beenden lautlos verloren (flushBeimBeenden flusht nur das AKTIVE Projekt). Will
//    die Oberflaeche (M7) direkt ins Duplikat springen, ruft sie öffneProjekt mit der
//    zurueckgegebenen id - das ist ein Aufruf und der einzige richtige Weg.
//
// 3. NUR project.json UND media/ - kein output/, kein queue-retry.json, kein project.json.bak.
//    So steht es in TK 9.5.2, und es ist auch richtig: Ausgabedateien gehoeren zu dem Lauf, der
//    sie erzeugt hat (FA-22), und eine geerbte Wiederholungs-Warteschlange (Q2) reichte Auftraege
//    eines fremden Projekts weiter.
//
// 4. KEINE FORTSCHRITTSANZEIGE UND KEIN fsync AUF DIE KOPIERTEN MEDIEN. Der erste STOPP-Punkt des
//    Issues (Lade-Indikator waehrend der weiterhin synchronen Instant-Operation) ist eine Frage
//    an die Oberflaeche und wird hier NICHT beantwortet: Diese Datei meldet nichts nach draussen,
//    solange sie laeuft, und ein Ereigniskanal dafuer waere eine Vertragsaenderung. Zu bedenken
//    ist die Groessenordnung - das Lock ist waehrend des gesamten Kopiervorgangs gehalten, ein
//    Projekt mit mehreren hundert MB Video blockiert also jede andere D1-Operation fuer diese
//    Zeit. Ein fsync je Datei wuerde das noch verlaengern; die Medien sind im Fehlerfall aus dem
//    Original erneut kopierbar, project.json dagegen ist ueber #46 gesynct.
//
// 5. KEINE PRUEFUNG, OB DIE ASSETS ZU DEN DATEIEN PASSEN. Fehlt in der Quelle die Datei zu einem
//    Asset, fehlt sie danach auch im Duplikat - unveraendert, nicht schlimmer. Sichtbar macht das
//    der gefuehrte Reparatur-Modus (FA-19, TK 9.7.5), nicht das Duplizieren; wer hier pruefte,
//    machte ein Projekt unkopierbar, das der Nutzer gerade reparieren will.
//
// 6. KEINE ABSTIMMUNG MIT DER AUFTRAGSVERWALTUNG. Wie löscheProjekt (#37) laeuft diese
//    Instant-Operation NICHT ueber den Torwaechter (TK 9.3). Laeuft waehrenddessen ein Import in
//    die Quelle, kann das Duplikat eine Datei enthalten, die im Duplikat-Projektstand noch nicht
//    als Asset steht (oder umgekehrt, wenn der Stand aus dem Speicher kommt). Beides ist kein
//    Datenverlust und im Reparatur-Modus behebbar; sauber schliessen liesse es sich nur mit
//    Zugang zu Q1, und einen zweiten Sperr-Mechanismus verbietet TK 9.4.8.
