// GENERIERT aus dem Signaturblock von Issue #35.
// [project-store] listeProjekte implementieren
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
// GERUEST-PRUEFSUMME: e2b4e33315f9f52b

import fs from 'node:fs/promises'
import path from 'node:path'

import { mitD1Lock } from './d1-lock'
import { ausgabeOrdner, medienOrdner, projektOrdner } from './pfade'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72
import type { Dirent } from 'node:fs'

// DIESE DATEI LIEST UND MELDET - SIE REPARIERT NICHTS.
//
// "Diese Operation repariert nichts. Sie schreibt keine project.json zurueck, benennt
// nichts um, legt nichts an und loescht nichts - auch nicht die kaputte Datei."
// (Issue #35) Deshalb steht hier kein writeFile, kein rename, kein mkdir, kein unlink.
//
// UND SIE LAESST NICHTS AUS. Ein Ordner ohne lesbare project.json wird GEKENNZEICHNET,
// nicht uebersprungen: "Ein beschaedigtes Projekt wird MIT WARNHINWEIS gelistet, nicht
// weggelassen (bindend)." (TK 9.5.2) Die Medien des Nutzers liegen weiter im Ordner;
// ein fehlender Eintrag saehe fuer ihn aus wie ein verlorenes Projekt.
//
// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32: mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//        // fuehrt aktion() garantiert seriell aus; die Aktion darf mitD1Lock NICHT
//        // erneut aufrufen (Deadlock). Deshalb wird das Lock hier GENAU EINMAL um den
//        // ganzen Scan gelegt und in keiner Hilfsfunktion ein zweites Mal.
//   #49: projektOrdner(projektId: string): string
//        medienOrdner(projektId: string): string
//        ausgabeOrdner(projektId: string): string
//        // reine String-Operationen, kein Dateisystemzugriff, keine Existenzpruefung.
//        // Die Pfad-Autoritaet ist die EINE Stelle, die das Datei-Layout kennt
//        // (TK 9.5.7) - hier wird deshalb kein Unterordnername selbst angehaengt.

/** Dateiname im Projektordner - gleichlautend mit dem Schreiber (#46). */
const DATEI = 'project.json'

/** Die letzte heile Fassung, die #46 vor jedem Schreiben anlegt (TK 9.5.4). */
const SICHERUNG = `${DATEI}.bak`

/** Die Endung einer fertigen Ausgabedatei - klein geschrieben zum Vergleich. */
const AUSGABE_ENDUNG = '.mp4'

/**
 * Eine unbedenkliche Projekt-ID, die NUR dazu dient, den `projects/`-Ordner aus der
 * Pfad-Autoritaet abzuleiten (s. `projekteWurzel`). Ihr Ordner wird nie angefasst.
 */
const VERGLEICHS_ID = 'vergleich'

/**
 * Zeitangabe fuer einen Eintrag, dessen Ordner sich nicht befragen laesst.
 *
 * 1970 ist hier ABSICHT und keine Verlegenheit: Der Wert ist auf den ersten Blick als
 * "unbekannt" zu erkennen, er sortiert ans Ende, und er erfuellt die Vorgabe des Issues
 * ("kein leerer String und keine Nullwerte"). Ein `new Date()` waere die schlechtere
 * Wahl - es behauptete, der Ordner sei soeben geaendert worden, und schoebe den kaputten
 * Eintrag in der Liste ganz nach oben.
 */
const UNBEKANNTE_ZEIT = new Date(0).toISOString()

export interface ProjektMeta {
  id: string          // = Ordnername unter projects/
  name: string        // aus project.json; bei beschaedigt: true der ORDNERNAME als Behelf
  erstelltAm: string  // ISO-8601 UTC; bei beschaedigt: true aus den Ordner-Zeitstempeln
  geaendertAm: string // ISO-8601 UTC; bei beschaedigt: true aus den Ordner-Zeitstempeln
  ordner: string      // relativer Ordnername
  beschaedigt: boolean // true = weder project.json noch project.json.bak lesbar
  anzahlMedien: number   // Dateien in media/ - aus dem ORDNER gezaehlt, nicht aus project.json
  anzahlAusgaben: number // fertige .mp4 in output/ - Zaehlweise wie listeAusgaben (.part zaehlt nicht)
}
export async function listeProjekte(): Promise<Ergebnis<ProjektMeta[], ProjectStoreFehlercode>> {
  // DAS LOCK UMSCHLIESST DEN GANZEN SCAN, nicht die einzelnen Projekte.
  //
  // "listeProjekte nimmt das D1-Lock, obwohl sie nur liest (bindend)." (TK 9.5.2) Der
  // Grund ist der Scan ueber FREMDE Projektordner: dupliziereProjekt legt einen solchen
  // Ordner schrittweise an, und ein Scan mitten hinein meldete ein voellig gesundes
  // Projekt als beschaedigt. Wuerde das Lock je Projekt genommen, laege genau dieses
  // Fenster zwischen zwei Eintraegen wieder offen - die Sperre waere dann Zierde.
  //
  // Kein Schnellpfad, kein Zeitlimit, kein zweites Lock: Wer wartet, wartet.
  return mitD1Lock(scanne)
}
// - liest NUR: keine project.json wird geschrieben, kein Ordner angelegt, nichts repariert
// - laeuft VOLLSTAENDIG innerhalb von mitD1Lock (#32) - ausdrueckliche Ausnahme zu
//   "lesen braucht kein Lock" (TK 9.5.2)
// - defekte Projekte sind ENTHALTEN (beschaedigt: true), nicht weggelassen
// - speicher_fehler NUR, wenn das projects/-Verzeichnis selbst nicht lesbar ist

// ---------------------------------------------------------------------------
// Intern. Bewusst nicht exportiert: Wer eine dieser Regeln braucht, braucht in
// Wahrheit listeProjekte - sonst entstuende eine zweite Stelle, die entscheidet, was
// als Projekt gilt und wann es beschaedigt ist.
// ---------------------------------------------------------------------------

/** Der eigentliche Scan - laeuft ausschliesslich im Lock (s. o.). */
async function scanne(): Promise<Ergebnis<ProjektMeta[], ProjectStoreFehlercode>> {
  const wurzel = projekteWurzel()

  let eintraege: Dirent[]
  try {
    // withFileTypes spart je Eintrag einen Systemaufruf und liefert zugleich die
    // lstat-Sicht - s. Vermerk 2 am Dateiende zu Verknuepfungen.
    eintraege = await fs.readdir(wurzel, { withFileTypes: true })
  } catch (ursache) {
    if (istCode(ursache, 'ENOENT')) {
      // Erster Start: Der Ordner entsteht erst mit dem ersten Projekt (#33). Kein
      // Fehler - und angelegt wird er hier NICHT.
      return { ok: true, wert: [] }
    }
    // Jeder andere Grund (EACCES, EIO, ENOTDIR - Letzteres, wenn `projects` eine DATEI
    // ist) heisst: Der Datenbestand ist als Ganzes nicht lesbar. Das ist der EINZIGE
    // Fehlerausgang dieser Operation.
    return {
      ok: false,
      fehler: {
        code: 'speicher_fehler',
        meldung: `Der Projektordner ${wurzel} ist nicht lesbar. Grund: ${text(ursache)}`,
      },
    }
  }

  const projekte: ProjektMeta[] = []
  for (const eintrag of eintraege) {
    // "id = Ordnername unter projects/" (Signatur): Ein Projekt IST ein Ordner. Lose
    // Dateien in projects/ sind keine und werden auch nicht als beschaedigte Projekte
    // gemeldet - das Issue spricht durchgehend vom "Unterverzeichnis".
    if (!eintrag.isDirectory()) {
      continue
    }
    // SEQUENZIELL, nicht Promise.all ueber alle Ordner: Jede project.json wird zum
    // Lesen vollstaendig geparst (s. Vermerk 1 am Dateiende), und bei vielen Projekten
    // mit grossen assets-Arrays laegen bei paralleler Bearbeitung ALLE gleichzeitig im
    // Speicher - genau das, was dieses Issue vermeiden soll. Innerhalb EINES Projekts
    // laufen die drei Zugriffe dagegen ueberlappend (s. `beschreibe`).
    const meta = await beschreibe(eintrag.name)
    if (meta !== null) {
      projekte.push(meta)
    }
  }

  return { ok: true, wert: sortiere(projekte) }
}

/**
 * Der `projects/`-Ordner - abgeleitet, nicht zusammengesetzt.
 *
 * `projektOrdner` (#49) liefert `<Datenort>/projects/<id>`; der Elternordner davon ist
 * `projects/`. Der Umweg ueber eine Vergleichs-ID ist Absicht: Die Pfad-Autoritaet
 * exportiert keinen Wurzelpfad, und ein eigenes `join(ermittleDatenOrt(), 'projects')`
 * waere eine zweite Stelle, die das Datei-Layout kennt - genau das verbietet TK 9.5.7.
 * Aendert sich das Layout in #49, wandert diese Funktion lautlos mit.
 */
function projekteWurzel(): string {
  return path.dirname(projektOrdner(VERGLEICHS_ID))
}

/**
 * Ein Eintrag der Liste. `null` heisst: Der Ordner ist waehrend des Scans verschwunden -
 * dann gibt es nichts zu melden, weil es das Projekt nicht mehr gibt.
 *
 * Das ist KEIN stilles Ueberspringen im Sinne des Verbots: Verboten ist, ein VORHANDENES
 * Projekt wegzulassen, weil seine Datei kaputt ist. Ein Ordner, den der Nutzer soeben im
 * Explorer geloescht hat, ist der umgekehrte Fall - ihn als "beschaedigt" zu melden waere
 * ein Schreckensruf ueber ein Projekt, das niemand vermisst.
 */
async function beschreibe(ordnername: string): Promise<ProjektMeta | null> {
  const ordner = projektOrdner(ordnername)

  // Die drei Zugriffe sind voneinander unabhaengig und laufen deshalb ueberlappend.
  // Die beiden Zaehlungen werden IMMER gebraucht - auch (und gerade) bei einem
  // beschaedigten Projekt: "dort sind sie die einzige belastbare Angabe des Eintrags."
  const [metadaten, anzahlMedien, anzahlAusgaben] = await Promise.all([
    leseMetadaten(ordner),
    zaehleDateien(medienOrdner(ordnername), () => true),
    zaehleDateien(ausgabeOrdner(ordnername), istFertigeAusgabe),
  ])

  const gemeinsam = { id: ordnername, ordner: ordnername, anzahlMedien, anzahlAusgaben }

  if (metadaten === null) {
    // WEDER project.json NOCH .bak lesbar - der Fall, um den dieses Issue kreist.
    const zeiten = await ordnerZeiten(ordner)
    if (zeiten === null) {
      return null // Ordner ist weg (s. Erklaerung oben).
    }
    return {
      ...gemeinsam,
      // Der ORDNERNAME als Behelf - "das Einzige, womit er den Ordner wiederfindet"
      // (Issue). Kein erfundener Anzeigename, kein leerer String.
      name: ordnername,
      erstelltAm: zeiten.erstelltAm,
      geaendertAm: zeiten.geaendertAm,
      beschaedigt: true,
    }
  }

  // Fehlt in einer LESBAREN Datei nur eine Datumsangabe, ist das Projekt trotzdem nicht
  // beschaedigt: Der Vertrag bindet `beschaedigt` woertlich an "weder project.json noch
  // project.json.bak lesbar", und der Name - das Einzige, woran der Nutzer sein Projekt
  // erkennt - ist ja da. Der Ordner-Zeitstempel springt dann als Anzeigewert ein.
  const brauchtZeiten = metadaten.erstelltAm === null || metadaten.geaendertAm === null
  const zeiten = brauchtZeiten ? await ordnerZeiten(ordner) : null

  return {
    ...gemeinsam,
    name: metadaten.name,
    erstelltAm: metadaten.erstelltAm ?? zeiten?.erstelltAm ?? UNBEKANNTE_ZEIT,
    geaendertAm: metadaten.geaendertAm ?? zeiten?.geaendertAm ?? UNBEKANNTE_ZEIT,
    beschaedigt: false,
  }
}

/** Genau die Felder, die die Liste anzeigt - mehr wird aus der Datei nicht uebernommen. */
interface Metadaten {
  name: string
  erstelltAm: string | null
  geaendertAm: string | null
}

/**
 * Erst `project.json`, dann `project.json.bak` - die Reihenfolge ist verbindlich
 * (Issue: "erst project.json; ist sie unlesbar oder ungueltig, dann project.json.bak").
 * `null` = beide gescheitert.
 */
async function leseMetadaten(ordner: string): Promise<Metadaten | null> {
  return (
    (await leseDatei(path.join(ordner, DATEI))) ??
    (await leseDatei(path.join(ordner, SICHERUNG)))
  )
}

/**
 * Liest EINE Datei und holt die drei Anzeigefelder heraus. Jeder Fehlschlag - fehlende
 * Datei, Rechte, kaputtes JSON, falsche Form - ergibt `null`, denn fuer die Liste sind
 * sie alle dasselbe: aus dieser Datei kommt kein Name.
 *
 * WAS "GUELTIG" HEISST: ein Objekt mit einem nicht-leeren `name`. Mehr NICHT - keine
 * Schema-Pruefung, keine Migration, kein Blick in `liste`/`assets`/`aktionen`. Der Name
 * traegt die Entscheidung, weil er das Einzige ist, was der Eintrag ohne ihn verloere;
 * ein fehlendes Datum kostet nur eine Anzeige (s. `beschreibe`).
 *
 * Die `id` aus der Datei wird ABSICHTLICH nicht gelesen: "id = Ordnername unter
 * projects/" (Signatur). Stuenden beide auseinander, waere der Ordnername der einzige
 * Wert, mit dem ein Aufrufer den Ordner auch wiederfindet.
 */
async function leseDatei(pfad: string): Promise<Metadaten | null> {
  let roh: string
  try {
    roh = await fs.readFile(pfad, 'utf8')
  } catch {
    return null
  }

  let inhalt: unknown
  try {
    inhalt = JSON.parse(roh)
  } catch {
    return null
  }
  if (typeof inhalt !== 'object' || inhalt === null) {
    return null
  }

  const felder = inhalt as { name?: unknown; erstelltAm?: unknown; geaendertAm?: unknown }
  if (typeof felder.name !== 'string' || felder.name.trim().length === 0) {
    return null
  }
  return {
    name: felder.name,
    erstelltAm: zeitOderNull(felder.erstelltAm),
    geaendertAm: zeitOderNull(felder.geaendertAm),
  }
}

/**
 * Eine Datumsangabe wird UNVERAENDERT durchgereicht, nicht umgerechnet.
 *
 * Der Vertrag sagt fuer beide Felder "ISO-8601 UTC" (TK 9.11.3), und geschrieben werden
 * sie ausschliesslich als `toISOString()`. Ein `new Date(x).toISOString()` hier waere
 * eine stille Umschrift fremder Daten: Es machte aus einer unverstandenen Angabe eine
 * plausibel aussehende und aus einem Tippfehler ein "Invalid Date" mit Ausnahme.
 */
function zeitOderNull(wert: unknown): string | null {
  return typeof wert === 'string' && wert.length > 0 ? wert : null
}

/**
 * Die Zeitstempel des ORDNERS - der Behelf fuer einen Eintrag ohne lesbare Datei.
 * `null` = der Ordner ist nicht mehr da.
 */
async function ordnerZeiten(ordner: string): Promise<{ erstelltAm: string; geaendertAm: string } | null> {
  try {
    const stat = await fs.stat(ordner)
    // birthtime, wo es sie gibt: Auf Windows und macOS ist sie die echte Anlegezeit.
    // Manche Linux-Dateisysteme liefern 0 - dann ist die Aenderungszeit die einzige
    // Angabe, die es gibt, und eine Anzeige "01.01.1970" waere schlechter als eine
    // etwas zu junge Anlegezeit.
    const geburt =
      Number.isFinite(stat.birthtimeMs) && stat.birthtimeMs > 0 ? stat.birthtimeMs : stat.mtimeMs
    return {
      erstelltAm: new Date(geburt).toISOString(),
      geaendertAm: new Date(stat.mtimeMs).toISOString(),
    }
  } catch (ursache) {
    if (istCode(ursache, 'ENOENT', 'ENOTDIR')) {
      return null
    }
    // Der Ordner IST da, laesst sich aber nicht befragen (Rechte). Ihn deshalb
    // wegzulassen waere genau das verbotene stille Ueberspringen - der Eintrag bleibt,
    // mit erkennbar unbekannter Zeit.
    return { erstelltAm: UNBEKANNTE_ZEIT, geaendertAm: UNBEKANNTE_ZEIT }
  }
}

/**
 * Zaehlt regulaere Dateien in einem Unterordner. Alles, was schiefgeht, ergibt `0`.
 *
 * "Ein fehlender oder unlesbarer Unterordner ergibt 0, keinen Fehler und kein null."
 * (Issue) Das weicht bewusst von `listeAusgaben` (#75) ab, wo ein unlesbarer Eintrag
 * `speicher_fehler` ergibt: Dort IST der Ordnerinhalt das Ergebnis, hier ist er eine
 * Beizahl - und ein Rechteproblem an einem einzigen `media/` darf nicht die ganze
 * Projektliste kosten. Fehlende Ordner sind ohnehin der Normalfall eines frischen
 * Projekts (sie entstehen erst beim ersten Import bzw. Render).
 */
async function zaehleDateien(ordner: string, passt: (name: string) => boolean): Promise<number> {
  let eintraege: Dirent[]
  try {
    eintraege = await fs.readdir(ordner, { withFileTypes: true })
  } catch {
    return 0
  }
  // Unterordner zaehlen nicht mit, und es wird NICHT rekursiv gezaehlt (Issue).
  return eintraege.filter((eintrag) => eintrag.isFile() && passt(eintrag.name)).length
}

/**
 * Dieselbe Regel wie in `listeAusgaben` (#75), NACHGEBAUT statt aufgerufen: Jene liefert
 * Groessen und Zeitstempel je Datei und laeuft ohne Lock; hier wird im Lock nur eine Zahl
 * gebraucht. Weicht die Zahl von der Liste ab, die der Nutzer sieht, ist sie falsch -
 * deshalb Zeichen fuer Zeichen dieselbe Bedingung, einschliesslich des Laengenvergleichs,
 * der eine Datei namens `.mp4` ausschliesst.
 */
function istFertigeAusgabe(dateiname: string): boolean {
  return (
    dateiname.length > AUSGABE_ENDUNG.length &&
    dateiname.toLowerCase().endsWith(AUSGABE_ENDUNG)
  )
}

/**
 * Absteigend nach `geaendertAm` (zuletzt bearbeitet zuerst), bei Gleichstand aufsteigend
 * nach Name und zuletzt nach Ordnername.
 *
 * Das Issue schreibt KEINE Reihenfolge vor - entschieden, nicht geraten: Die Reihenfolge
 * von `readdir` haengt vom Dateisystem ab, die Liste saehe also auf zwei Rechnern anders
 * aus. "Zuletzt bearbeitet zuerst" ist dieselbe Linie wie bei der Ausgabeliste (#75) und
 * die einzige, die ohne Zusatzwissen nuetzlich ist.
 *
 * Verglichen wird der GEPARSTE Zeitpunkt und nicht die Zeichenkette: Anders als in #75
 * stammt der Wert hier aus einer fremden Datei und muss keine feste Stellenzahl haben.
 * Was sich nicht lesen laesst, sortiert ans Ende. `localeCompare` waere falsch - es
 * haengt an der Sprachumgebung, und die Liste soll auf jedem Laptop gleich aussehen.
 */
function sortiere(projekte: ProjektMeta[]): ProjektMeta[] {
  return projekte.sort((a, b) => {
    const za = zeitpunkt(a.geaendertAm)
    const zb = zeitpunkt(b.geaendertAm)
    if (za !== zb) {
      return zb - za
    }
    if (a.name !== b.name) {
      return a.name < b.name ? -1 : 1
    }
    if (a.ordner === b.ordner) {
      return 0
    }
    return a.ordner < b.ordner ? -1 : 1
  })
}

function zeitpunkt(wert: string): number {
  const zahl = Date.parse(wert)
  return Number.isNaN(zahl) ? 0 : zahl
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
// 1. EINE project.json WIRD BEIM LESEN GANZ GEPARST. Die DoD verlangt "kein
//    vollstaendiges Parsen der liste/assets/aktionen-Arrays". Eingehalten ist der Zweck -
//    es wird kein Projekt geladen, nichts migriert, nichts validiert, und aus dem
//    geparsten Wert werden genau drei Felder uebernommen, der Rest faellt sofort weg.
//    Der Buchstabe geht nicht: JSON.parse kennt keinen Teilbereich, und ein
//    handgeschriebener Teil-Parser waere eine zweite, fehleranfaellige Lesart derselben
//    Datei. Abgefedert ist es durch die SEQUENZIELLE Schleife (nie mehr als eine Datei
//    gleichzeitig im Speicher). Wer wirklich Dateien im zweistelligen Megabyte-Bereich
//    erwartet, braucht einen stroemenden Parser - das ist ein eigenes Issue, keine
//    Entscheidung fuer diesen Rumpf.
//
// 2. VERKNUEPFUNGEN GELTEN NICHT ALS PROJEKT. `withFileTypes` liefert die lstat-Sicht:
//    Ein Symlink oder eine Windows-Junction unter projects/ meldet isDirectory() ===
//    false und faellt damit aus der Liste. Das ist die vorsichtige Seite und Absicht:
//    Wuerde ihm gefolgt, zaehlte diese Datei fremde Ordner irgendwo auf der Platte mit -
//    und `loescheProjekt` bekaeme einen Eintrag, dessen Ordner ausserhalb des Datenorts
//    liegt. Dieselbe offene Stelle ist in pfade.ts (#49, Vermerk 1) notiert; sie gehoert
//    EINMAL entschieden. Die App selbst legt solche Eintraege nicht an.
//
// 3. FREMDE ORDNER ERSCHEINEN ALS BESCHAEDIGTES PROJEKT. Legt jemand von Hand einen
//    Ordner in projects/, hat er weder project.json noch .bak - die Fehlertabelle des
//    Issues nennt genau diesen Fall ("auch: keine von beiden vorhanden") und verlangt
//    dafuer einen Eintrag mit beschaedigt: true. Eine Zusatzpruefung "sieht die ID wie
//    eine UUID aus?" waere eine zweite Vorstellung davon, was ein Projekt ist, und
//    verstiesse gegen das Verbot des stillen Ueberspringens.
//
// 4. `project.json` UND `.bak` STEHEN ALS NAMEN AUCH IN #46. Ein geteilter Ort dafuer
//    existiert nicht (die Pfad-Autoritaet #49 kennt media/ und output/, nicht die
//    Dateinamen). Solange nur der Schreiber (#46), das Laden (#34) und diese Datei sie
//    kennen, ist die Doppelung tragbar - gemeldet ist sie hiermit.
