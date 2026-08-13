// GENERIERT aus dem Signaturblock von Issue #88.
// [media-service] Aufräumen: verwaiste Dateien und .part-Leichen entfernen
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
// GERUEST-PRUEFSUMME: 0e170be5605c1e10
//
// ERLEDIGT (13.08.2026): Abschaltzeile fuer no-unused-vars entfernt, der Rumpf ist
// gefuellt - alle Parameter und Importe werden benutzt.
//
// DIE EINZIGE STELLE IM SYSTEM, DIE MEDIENDATEIEN OHNE NUTZERAUFTRAG LOESCHT.
// "Datei in `media/` ohne D1-Eintrag (Crash-/`unlink`-Waise, `.part`-Leiche) ->
// loeschen, Speicher zurueck." (TK 9.4.7) Sie laeuft beim OEFFNEN eines Projekts,
// also bevor jemand hinsieht, und was sie loescht, holt der Nutzer nicht zurueck.
// Deshalb ist JEDE Entscheidung in dieser Datei nach derselben Asymmetrie gefaellt:
// Eine liegengebliebene Waise kostet Speicherplatz, eine faelschlich geloeschte
// Datei kostet ein Video. Im Zweifel bleibt etwas liegen.
//
// GELOESCHT WIRD AUSSCHLIESSLICH:
//   - eine REGULAERE DATEI direkt in `media/`, deren Name nicht in
//     `bekannteDateinamen` steht (Vergleich ohne Ruecksicht auf Gross-/
//     Kleinschreibung, s. u.), und
//   - jede REGULAERE DATEI in `media/<STAGING_ORDNER>/` - dort ist per Konstruktion
//     alles ein Importrest: Ein `Asset.dateiname` traegt "ohne Verzeichnisanteil"
//     (TK 9.4.8, Punkt 1) und kann nie auf das Staging zeigen, und eine fertige
//     Datei wird durch `fs.rename` aus dem Staging HERAUS bewegt (TK 9.4.5,
//     Schritt 3).
//
// NIE ANGEFASST WERDEN: Unterordner (auch der Staging-Ordner SELBST bleibt stehen -
// er gehoert zum Layout, das der `project-store` verantwortet, TK 9.5.7), alles was
// keine regulaere Datei ist (Verknuepfungen, Geraetenamen), und alles ausserhalb von
// `media/` - insbesondere `projects/<id>/output/`, wo die gerenderten MP4s liegen
// (FA-22). Die haben grundsaetzlich keinen D1-Eintrag und wuerden von einer
// Waisen-Logik allesamt vernichtet.
//
// KEIN LOCK, KEIN D1-ZUGRIFF, KEIN TIMER: "`media-service` fuehrt kein eigenes Lock
// und keine OS-Dateisperren ein (Over-Engineering-Falle)." (TK 9.4.8, Punkt 9) Und
// "kein periodisches Aufraeumen im laufenden Betrieb" (TK 9.4.8, Punkt 8) - diese
// Funktion laeuft EINMAL je Projektoeffnen. Ein Intervall wuerde irgendwann eine
// `.part`-Datei loeschen, die ein LAUFENDER Import gerade schreibt. Die zeitliche
// Ordnung stellt der Ablauf beim Projektoeffnen her (#94), nicht eine Sperre hier.
//
// KEIN SCHREIBEN AN D1, KEINE MELDUNG AN Q2: Diese Funktion markiert keinen Zustand
// (das ist #89), streicht keine offene Loeschung (das ist #90) und legt keinen
// Eintrag an. Sie loescht Dateien und zaehlt.

import { readdir, unlink } from 'node:fs/promises'
import path from 'node:path'

import { medienOrdner } from '../project-store/pfade'

import { STAGING_ORDNER } from './import-datei'
// ENTSCHIEDEN: importiert wird GENAU EINE Konstante – STAGING_ORDNER. `PART_ENDUNG` wird hier
// NICHT gebraucht und deshalb NICHT importiert (ein ungenutzter Import bricht den Typecheck).
// Begründung: Der Staging-Ordner wird KOMPLETT geleert – jede Datei darin ist per Konstruktion
// ein Importrest (s. Invarianten). Auf die Endung zu sehen, würde nichts hinzufügen und würde
// eine `.part`-Leiche mit abweichender Endung übersehen.
// Abgeschrieben wird der Wert trotzdem nicht: KEIN Literal '.staging' in dieser Datei.

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { ReconcileFehlercode } from './fehlercodes'
import type { Dirent } from 'node:fs'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #49:  medienOrdner(projektId: string): string
//         // absoluter Pfad `<Datenort>/projects/<projektId>/media`; reine String-Operation,
//         // KEIN Dateisystemzugriff, KEINE Existenzpruefung, kann nicht fehlschlagen.
//   #84:  export const STAGING_ORDNER = '.staging'  // Ordnername INNERHALB des Medienordners
//
// Mehr braucht diese Datei nicht. Insbesondere NICHT `loeseAssetPfad` (#49): Es prueft einen
// `dateiname` gegen die Regeln des Datenmodells und lieferte fuer genau die Namen, um die es
// hier geht (`<uuid>.<ext>.part`, Reste beliebiger Herkunft), teils `ok: false`. Der Pfad einer
// zu loeschenden Datei entsteht hier aus `medienOrdner(projektId)` plus dem Namen, den das
// Betriebssystem beim Auflisten geliefert hat - ein Name aus dem Verzeichnis selbst kann per
// Konstruktion nicht aus ihm ausbrechen.
//
// AUCH NICHT `entferneDatei` (#86), obwohl es im selben Modul liegt - GEPRUEFT UND VERWORFEN:
// Jene Funktion wiederholt bei `EBUSY`/`EPERM` vier Mal mit insgesamt 1,5 s Wartezeit. Die
// Fehlertabelle dieses Issues fuehrt genau diese beiden Codes aber unter "Datei ueberspringen,
// weitermachen" - hier geht es um Speicherplatz, nicht um Konsistenz, und eine belegte Waise
// bekommt beim naechsten Projektoeffnen ohnehin eine neue Gelegenheit. Bei mehreren belegten
// Dateien stuende der Projektstart sonst sekundenweise still, sichtbar fuer den Nutzer. Zweitens
// wertet `entferneDatei` eine bereits fehlende Datei als ERFOLG (idempotent, gewollt fuer die
// vorgemerkten Loeschungen in #90) - hier waere das falsch: `entfernt` zaehlt nur, "was wirklich
// verschwunden ist - nicht, was versucht wurde", und eine Datei, die zwischen Auflisten und
// Loeschen von selbst verschwand, hat diese Funktion nicht entfernt. Das Issue nennt #86
// folgerichtig weder unter den fremden Funktionen noch unter "Blockiert von".

/**
 * Zeichen, die aus der `projektId` einen Pfad statt eines Segments machen wuerden.
 *
 * Beide Trenner, unabhaengig vom Betriebssystem - dieselbe Ueberlegung wie in `pfade.ts` (#49)
 * und `reconcile-fehlt.ts` (#89): Ein unter Windows geschriebener Wert wandert per USB-Stick auf
 * einen Mac, und eine Pruefung, die nur den heimischen Trenner kennt, laesst ihn genau dort
 * durch.
 */
const PFAD_TRENNER = ['/', '\\']

export async function entferneWaisen(
  projektId: string,
  bekannteDateinamen: Set<string>,
): Promise<Ergebnis<{ entfernt: number }, ReconcileFehlercode>> {
  // EIN Fangnetz um den ganzen Lauf. Der Reconcile laeuft beim Projektstart; eine
  // durchgereichte Ausnahme wuerde dort das Oeffnen abbrechen, statt einen Befund zu melden -
  // "Kein `throw` nach aussen" (TK 9.1.1, Punkt 2).
  try {
    // `typeof` trotz `string` in der Signatur: "Der Main validiert jede eingehende Nutzlast"
    // (TK 9.1.1, Punkt 6). Geprueft wird VOR dem ersten Dateisystemzugriff - "keine Datei wird
    // angefasst; kein Ordner gelesen". `medienOrdner` kann das nicht uebernehmen: Es gibt einen
    // String zurueck, keinen `Ergebnis`, und wuerde fuer `../x` klaglos einen Pfad ausserhalb
    // des Datenorts liefern (Schlussvermerk in #49, Punkt 2).
    if (
      typeof projektId !== 'string' ||
      projektId.trim() === '' ||
      PFAD_TRENNER.some((zeichen) => projektId.includes(zeichen)) ||
      projektId.includes('..')
    ) {
      return fehler('ungueltige_eingabe', 'Es wurde keine brauchbare Projekt-ID uebergeben.')
    }

    // ZWEITE SCHRANKE, und sie ist keine Formalie: Kaeme statt der Menge eine ZEICHENKETTE
    // herein, liefe `for...of` ueber ihre BUCHSTABEN, keine einzige Datei gaelte als bekannt -
    // und dieser Lauf loeschte den gesamten Medienbestand des Projekts. Der Fehler saehe im
    // Aufrufer wie ein Tippfehler aus und waere hier lautlos. `Set` und `Array` sind beide
    // zulaessig; alles andere wird abgewiesen, bevor irgendein Ordner gelesen wird.
    if (!(bekannteDateinamen instanceof Set) && !Array.isArray(bekannteDateinamen)) {
      return fehler(
        'ungueltige_eingabe',
        'Die Liste der bekannten Dateinamen fehlt oder ist keine Menge.',
      )
    }

    // VOR dem Auflisten gebildet - nicht je Datei: Bei mehreren hundert Medien waere das sonst
    // ein vollstaendiger Durchlauf der Menge JE Verzeichniseintrag.
    const bekanntKlein = kleinGeschrieben(bekannteDateinamen)

    const ordner = medienOrdner(projektId)

    let eintraege: Dirent[]
    try {
      eintraege = await readdir(ordner, { withFileTypes: true })
    } catch (ursache) {
      if (systemCode(ursache) === 'ENOENT') {
        // Ein Projekt, in das noch nie etwas importiert wurde. Kein Fehler - und der Ordner
        // wird NICHT angelegt: Das Anlegen des Layouts gehoert dem `project-store` (TK 9.5.7),
        // und ein Aufraeumlauf, der Ordner erzeugt, waere ein Widerspruch in sich.
        return { ok: true, wert: { entfernt: 0 } }
      }
      // NICHT `unbekannter_fehler`: "Der Code ist der einzige Hinweis darauf, dass hier das
      // Dateisystem und nicht die Programmlogik das Problem ist." Nichts wurde geloescht.
      return fehler(
        'datei_fehler',
        `Der Medienordner des Projekts liess sich nicht lesen (${beschreibung(ursache)}).`,
      )
    }

    let entfernt = 0

    for (const eintrag of eintraege) {
      // NUR REGULAERE DATEIEN. Ein Unterordner wird "stehen gelassen, nicht betreten" - ein
      // rekursives Loeschen unbekannter Verzeichnisse ist die gefaehrlichste denkbare Auslegung
      // von "Datei in `media/`" und ist ausgeschlossen. Damit ist auch der Staging-Ordner hier
      // schon abgedeckt, ohne ihn beim Namen zu nennen; geleert wird er weiter unten.
      //
      // Alles andere (Verknuepfung, Geraetename, Socket) bleibt ebenfalls liegen: `unlink`
      // entfernte bei einer Verknuepfung zwar nur den Verweis, aber der Vertrag spricht von
      // einer DATEI, und liegenbleiben kostet nur Platz.
      if (!eintrag.isFile()) {
        continue
      }

      // OHNE RUECKSICHT AUF GROSS-/KLEINSCHREIBUNG. Windows und macOS unterscheiden im Regelfall
      // nicht; bei exaktem Vergleich gaelte eine Datei, die sich von ihrem D1-Eintrag nur in der
      // Schreibweise unterscheidet, als Waise - und genau die Datei, auf die der Eintrag zeigt,
      // waere weg. Der umgekehrte Fehler (eine echte Waise bleibt liegen, weil sie einem Eintrag
      // gleicht) kostet nur Speicherplatz. Die Asymmetrie der Folgen entscheidet.
      if (bekanntKlein.has(eintrag.name.toLowerCase())) {
        continue
      }

      // `path.join` mit dem Namen AUS DEM VERZEICHNISLISTING - nichts wird aus
      // `bekannteDateinamen` abgeleitet, kein Muster geraten, keine Heuristik ueber das Alter
      // einer Datei.
      if (await loescheEinzeln(path.join(ordner, eintrag.name))) {
        entfernt += 1
      }
    }

    entfernt += await leereStaging(path.join(ordner, STAGING_ORDNER))

    return { ok: true, wert: { entfernt } }
  } catch (ursache) {
    // "Eine rohe Exception-Meldung wird nie zum Code" (TK 9.1.1, Punkt 3) - der Code ist
    // `unbekannter_fehler`, der Text der Ausnahme reist nur als Begruendung mit.
    return fehler(
      'unbekannter_fehler',
      `Das Aufraeumen des Medienordners ist unerwartet gescheitert. Grund: ${textVon(ursache)}`,
    )
  }
}
// - liest und loescht ausschliesslich in D2; kein D1-Zugriff, kein Lock, kein Timer
// - der Ordnerpfad kommt ausschliesslich aus medienOrdner(projektId) (#49)
// - `entfernt` zaehlt nur Dateien, die dieser Lauf tatsaechlich entfernt hat
// - ein Fehlschlag bei EINER Datei bricht den Lauf nicht ab und macht ihn nicht `ok: false`

/**
 * Leert `media/<STAGING_ORDNER>/` und liefert die Zahl der entfernten Dateien.
 *
 * DER ORDNER SELBST BLEIBT STEHEN. Ihn zu entfernen hiesse, dass der naechste Import ihn wieder
 * anlegen muss - eine stillschweigende Kopplung zwischen Aufraeumen und Import, die keiner der
 * beiden Vertraege vorsieht. (Dass `kopiereInsStaging` (#84) ihn mit `recursive: true` ohnehin
 * anlegt, ist dort eine Bequemlichkeit und hier keine Erlaubnis.)
 *
 * EIN NICHT LESBARER STAGING-ORDNER IST HIER KEIN FEHLER. Die Fehlertabelle bindet
 * `datei_fehler` an "der Medienordner SELBST liess sich nicht auflisten"; das Staging ist nicht
 * der Medienordner. Und die Folge waere unverhaeltnismaessig: Der Aufraeum-Ablauf (#91) meldete
 * einen Fehler, obwohl das Projekt vollkommen in Ordnung ist - und nach #94 wuerde es dann nicht
 * normal geoeffnet. Dieselbe Ueberlegung wie beim Fehlschlag an einer einzelnen Waise.
 */
async function leereStaging(stagingPfad: string): Promise<number> {
  let eintraege: Dirent[]
  try {
    eintraege = await readdir(stagingPfad, { withFileTypes: true })
  } catch (ursache) {
    if (systemCode(ursache) !== 'ENOENT') {
      protokolliere(`der Zwischenordner liess sich nicht lesen`, ursache)
    }
    // ENOENT: Es wurde noch nie importiert. Uebersprungen - und der Ordner wird NICHT angelegt.
    return 0
  }

  let entfernt = 0
  for (const eintrag of eintraege) {
    // Auch hier gilt die Ausnahme fuer Unterordner NICHT weiter: Ein Verzeichnis IM Staging wird
    // ebenso wenig betreten wie eines in `media/`. Der Import legt dort nur Dateien an; was
    // sonst dort liegt, hat diese Funktion nicht angelegt und raeumt sie nicht weg.
    if (!eintrag.isFile()) {
      continue
    }
    // KEIN FILTER AUF DIE ENDUNG. Der Ordner wird vollstaendig geleert; ein Filter auf `.part`
    // uebersaehe nur Reste, die ein abgebrochener Kopiervorgang unter anderem Namen hinterlassen
    // hat. Ein `Asset.dateiname` kann hier ohnehin nichts treffen ("ohne Verzeichnisanteil",
    // TK 9.4.8 Punkt 1), deshalb wird `bekanntKlein` hier bewusst nicht befragt.
    if (await loescheEinzeln(path.join(stagingPfad, eintrag.name))) {
      entfernt += 1
    }
  }
  return entfernt
}

/**
 * Entfernt EINE Datei. `true` heisst: Sie war da und ist jetzt weg - nur das wird gezaehlt.
 *
 * EIN FEHLSCHLAG BRICHT DEN LAUF NICHT AB. Hier geht es um Speicherplatz, nicht um Konsistenz:
 * D1 ist bereits stimmig, eine liegengebliebene Waise hat definitionsgemaess keinen Eintrag und
 * kann deshalb weder in der Liste erscheinen noch einen Render kaputt machen. Wuerde eine
 * einzelne gesperrte Datei (unter Windows der Regelfall, wenn ein Virenscanner oder ein
 * Explorer-Fenster sie gerade anfasst) den Lauf abbrechen, blieben die NACHFOLGENDEN Waisen fuer
 * immer liegen - und der Aufraeum-Ablauf (#91) meldete einen Fehler fuer ein gesundes Projekt.
 *
 * `unlink` und NICHT `fs.rm`: `rm({ force: true })` verschluckt Fehler stillschweigend, und
 * `rm({ recursive: true })` naehme ein ganzes Verzeichnis mit. Kein Retry, keine Wartestaffel -
 * s. den Vermerk zu #86 im Kopf dieser Datei.
 */
async function loescheEinzeln(pfad: string): Promise<boolean> {
  try {
    await unlink(pfad)
    return true
  } catch (ursache) {
    if (systemCode(ursache) === 'ENOENT') {
      // Zwischen Auflisten und Loeschen verschwunden. Kein Fehler und KEIN Zaehler: Diese
      // Funktion hat die Datei nicht entfernt, und `entfernt` reist bis in die Oberflaeche.
      return false
    }
    protokolliere(`${path.basename(pfad)} liess sich nicht entfernen`, ursache)
    return false
  }
}

/**
 * Die Namen in Kleinschreibung - die Vergleichsgrundlage fuer "kennen wir diese Datei?".
 *
 * `toLowerCase` und NICHT `toLocaleLowerCase`: Letzteres haengt an der Spracheinstellung des
 * Rechners (im Tuerkischen wird aus `I` kein `i`, sondern `ı`). Ein Aufraeumlauf, der je nach
 * Systemsprache andere Dateien loescht, waere nicht pruefbar.
 *
 * `String(...)` statt einer Typpruefung: `bekannteDateinamen` stammt aus `project.json`, kann
 * also aus einer beschaedigten Datei kommen. Einen Nicht-String zu UEBERSPRINGEN waere die
 * gefaehrliche Richtung - dann gaelte die zugehoerige Datei als Waise. So steht er wenigstens
 * als Text in der Menge und kann nichts freigeben, was er nicht meint.
 */
function kleinGeschrieben(namen: Iterable<string>): Set<string> {
  const klein = new Set<string>()
  for (const name of namen) {
    klein.add(String(name).toLowerCase())
  }
  return klein
}

/**
 * "Intern vermerken" - dieselbe vorlaeufige Loesung wie in `dispatcher.ts`,
 * `beende-auftrag.ts` und `q4-journal.ts` des `auftrags-manager`.
 *
 * Das Issue verbietet einen EIGENEN Logger, eine Log-Datei, ein `console.log`, das in der
 * OBERFLAECHE landet, und ein zusaetzliches Feld im Rueckgabewert - und stellt fest, es gebe
 * projektweit keinen Mechanismus (#23 ist offen). Inzwischen gibt es eine Hausform, und genau
 * die wird hier benutzt: `console.error` im HAUPTPROZESS, mit Modul-Praefix. Sie verletzt keines
 * der vier Verbote (kein eigener Logger, keine Datei, nichts davon erreicht den Renderer, der
 * Rueckgabewert bleibt `{ entfernt }`) - und ohne sie waere eine dauerhaft unloeschbare Waise
 * voellig unauffindbar: Nach aussen bleibt von ihr nur eine um eins kleinere Zahl.
 */
function protokolliere(stelle: string, ursache: unknown): void {
  console.error(`[media-service] entferneWaisen: ${stelle}:`, ursache)
}

/**
 * Liest den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den er nicht
 * hat. Leerer String = kein verwertbarer Code.
 */
function systemCode(ursache: unknown): string {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return ''
  }
  const code = (ursache as { code?: unknown }).code
  return typeof code === 'string' ? code : ''
}

/** Betriebssystem-Code, sonst der Meldungstext - fuer die Klartext-Ergaenzung. */
function beschreibung(ursache: unknown): string {
  const code = systemCode(ursache)
  if (code !== '') {
    return code
  }
  return textVon(ursache)
}

/** Der Text einer Ausnahme, ohne Stacktrace - der reist nicht ueber die Grenze. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * Die Fehlerhuelle. Ohne `daten`: "Das Feld ist optional - Codes ohne Zusatzdaten lassen es weg"
 * (TK 9.1.1), und kein Code dieser Datei traegt Zusatzdaten.
 *
 * Der Pfad des Medienordners steht ABSICHTLICH in keiner Meldung: Sie reist ueber IPC bis in die
 * Oberflaeche, und der Renderer sieht "nur relative Referenzen (dateiname), nie absolute Pfade"
 * (TK 9.5.7). Der Betriebssystem-Code reicht zum Beheben.
 */
function fehler(
  code: ReconcileFehlercode | GenerischerFehlercode,
  meldung: string,
): Ergebnis<{ entfernt: number }, ReconcileFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. `speicher_fehler` AUS `ReconcileFehlercode` ENTSTEHT IN DIESER DATEI NICHT - sie schreibt
//    nichts. Der Wert gehoert zur gemeinsamen Union des Aufraeumlaufs (#91) und steht im
//    Rueckgabetyp nur, weil der Aufrufer den Code unveraendert weiterreicht.
//
// 2. KEINE UNICODE-NORMALISIERUNG DER NAMEN. macOS legt Dateinamen zerlegt ab (NFD), Windows
//    zusammengesetzt (NFC); zwei am Bildschirm gleich aussehende Namen koennen verschiedene
//    Zeichenketten sein, und ein solcher Name gaelte hier als Waise. Heute ist das folgenlos,
//    weil ein `dateiname` `<uuid>.<ext_kleingeschrieben>` lautet (TK 9.4.8, Punkt 1) und damit
//    reines ASCII ist. Faellt diese Form je, ist DIESE Stelle nachzuziehen - `pfade.ts` (#49)
//    fuehrt dieselbe Luecke in seinem Schlussvermerk.
//
// 3. KEIN ABGLEICH GEGEN Q2 (die offenen Loeschungen). Bleibt eine Loeschung aus Schritt 1 (#90)
//    liegen, weil die Datei gesperrt war, hat sie definitionsgemaess keinen D1-Eintrag und
//    erscheint hier als ganz gewoehnliche Waise; sie wird regulaer geloescht und mitgezaehlt.
//    Der Vermerk in Q2 heilt sich beim naechsten Projektoeffnen selbst: Dort findet
//    `entferneDatei` (#86) keine Datei mehr, meldet Erfolg und der Vermerk wird gestrichen. Ein
//    Blick in Q2 waere ein zweiter Zugriffsweg auf einen fremden Speicher, der nichts
//    verhinderte, sondern nur die Reihenfolge der beiden Schritte von einer Zusicherung des
//    Nachbarn abhaengig machte.
//
// 4. KEINE SYMLINK-AUFLOESUNG. Eine Verknuepfung in `media/` ist keine regulaere Datei und wird
//    deshalb hier gar nicht angefasst - weder gefolgt noch geloescht. Damit kann diese Funktion
//    ueber eine Verknuepfung auch nichts ausserhalb des Medienordners erreichen.
