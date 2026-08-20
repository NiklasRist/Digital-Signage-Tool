// GENERIERT aus dem Signaturblock von Issue #188.
// [export-service] Den Export-Ablauf zusammensetzen und das Ziel merken
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
// GERUEST-PRUEFSUMME: d9687e7ceadcc8fb
//
// ERLEDIGT: Die Abschaltzeile fuer no-unused-vars ist mit dem Fuellen des Rumpfes
// entfernt - alle Importe werden jetzt benutzt.
//
// ============================================================================
// DER HANDLER DES `export`-AUFTRAGS - EIN AUSGANG, EINE REIHENFOLGE
// ============================================================================
//
// Diese Datei baut nichts selbst. Sie setzt fuenf fertige Bausteine in der einen
// Reihenfolge zusammen, die TK 9.6.2 vorschreibt, und sorgt dafuer, dass der
// Auftrag den Zustand `laeuft` GENAU EINMAL und IMMER verlaesst.
//
// WARUM DAS DER HEIKLE TEIL IST: Die serielle Ordnung der Warteschlange ist der
// EINZIGE Sperr-Mechanismus des Systems (TK 9.3.5). Verlaesst dieser Handler den
// Auftrag durch einen Wurf statt durch eine Antwort, bleibt der Auftrag auf
// `laeuft` stehen - und danach startet in dieser Sitzung KEIN Import, KEIN
// Loeschen, KEIN Render und KEIN Export mehr. Der Nutzer saehe eine Anwendung,
// die auf nichts mehr reagiert, ohne eine einzige Fehlermeldung. Deshalb liegt
// der gesamte Ablauf in einem `try`, und deshalb hat jeder Zweig ein `return`.
//
// DIE REIHENFOLGE IST DER SCHUTZ, nicht eine Geschmacksfrage:
//   - Die Vorabpruefung (#184) steht VOR dem Kopieren, damit ein 20-Minuten-
//     Kopiervorgang nicht am Ende an einem vollen Stick scheitert.
//   - Das Ersetzen (#187) steht NACH der Verifikation in #186, damit unter dem
//     Zielnamen nie eine halbe MP4 landet.
//   - Das Merken des Ziels (#28) steht NACH dem Erfolg, weil gemerkt wird, wohin
//     tatsaechlich geschrieben wurde (TK 9.6.5).
// Jede Umstellung hebt eine der Zusagen aus TK 9.6.3 auf.
//
// ============================================================================
// SCHRITT 0 - DER SOFORT-FLUSH GEHOERT HIERHER, NICHT IN DEN TORWAECHTER
// ============================================================================
//
// TK 9.3.3, woertlich: "Bei `render` und `export` erzwingt der Main den
// Sofort-Flush von D1 (9.5.4) - nicht beim Einreihen. Er laeuft als erster
// Schritt IM HANDLER, also nach dem Statuswechsel und bevor der Handler die
// eigentliche Arbeit aufnimmt."
//
// Und die Begruendung, ebenfalls woertlich (TK 9.3.3): "Die Auswahl des naechsten
// Auftrags und der Statuswechsel bilden einen synchronen Abschnitt ohne `await` -
// nur so ist die serielle Invariante bewiesen. Ein Flush ist asynchron;
// dazwischengeschoben, oeffnete er genau das Fenster, in dem ein zweiter Auftrag
// starten koennte. Nach dem Statuswechsel ist der Platz belegt, ein `await` also
// gefahrlos."
//
// Ausgeschrieben: Baute jemand den Flush in den Torwaechter (#59), entstuende
// dort ein `await`. Die Ereignisschleife waere in dieser Zeit frei, ein zweites
// `reiheEin` koennte den Torwaechter erneut betreten und - weil der Statuswechsel
// noch nicht erfolgt ist - EINEN ZWEITEN AUFTRAG STARTEN. Der Bruch der seriellen
// Invariante waere LAUTLOS. Nach dem Statuswechsel ist der Platz belegt.
//
// UND ER LAEUFT INNERHALB VON `mitD1Lock` (#32) - ZUSAMMEN MIT DEM ABRUF:
// `sofortFlush` (#47) verlangt beides vom Aufrufer, das `Project` als Argument und
// die Ausfuehrung im D1-Lock ("MUSS von der aufrufenden Stelle innerhalb von
// mitD1Lock (#32) ausgefuehrt werden"). Abruf UND Flush liegen in EINEM
// Lock-Abschnitt, weil `holeAktivesProjekt` den LEBENDEN Stand liefert (dieselbe
// Objektreferenz, die die Instant-Operationen mutieren). Laegen sie in zwei
// Abschnitten, koennte sich dazwischen eine Instant-Operation schieben; der Flush
// schriebe dann einen Stand, der zwischen Abruf und Schreiben schon wieder ein
// anderer war.
//
// DAS D1-LOCK IST NICHT DAS "ZWEITE LOCK", DAS TK 9.6.3 VERBIETET. Dort ist ein
// Lock gemeint, das die AUFTRAGS-AUSFUEHRUNG serialisiert - das leistet allein der
// Torwaechter. Das D1-Lock serialisiert Schreibvorgaenge auf `project.json`
// (TK 9.5.4: "Lock-Grenze: Das D1-Lock schuetzt nur `project.json`."). Es zu
// benutzen ist Vorschrift. Verboten bleibt ein EIGENES Lock, ein Semaphor oder ein
// "Export laeuft"-Flag - davon steht hier nichts.
//
// `holeAktivesProjekt` nimmt selbst KEIN Lock (#192, nachgelesen in
// src/main/project-store/aktives-projekt.ts) - deshalb ist der Aufruf von INNEN
// gefahrlos; #32 verbietet nur, dass die uebergebene Aktion erneut `mitD1Lock`
// ruft (Deadlock).
//
// ============================================================================
// GEPRUEFTE FREMDE SIGNATUREN (nachgelesen in der definierenden Datei am
// 14.08.2026, nicht aus dem Issue abgeschrieben)
// ============================================================================
//   #192 holeAktivesProjekt(): Project | null                       synchron, kein Lock, wirft nie
//   #47  sofortFlush(projekt: Project): Promise<Ergebnis<void, ProjectStoreFehlercode>>
//   #32  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//   #185 loeseExportQuelle(projektId: string, dateiname: string):
//          Promise<Ergebnis<ExportQuelle, ExportFehlercode>>        ExportQuelle = { quellPfad, dateigroesse }
//   #184 pruefeExportZiel(zielOrdner: string, benoetigteBytes: number):
//          Promise<Ergebnis<void, ExportFehlercode>>
//   #186 kopiereNachPart(quellPfad: string, partPfad: string, quellGroesse: number):
//          Promise<Ergebnis<void, ExportFehlercode>>
//   #187 ersetzeAtomar(partPfad: string, zielPfad: string):
//          Promise<Ergebnis<void, ExportFehlercode>>
//   #28  setzeExportZiel(pfad: string): Promise<Ergebnis<void, ConfigFehlercode>>
//
// ZWEI ABWEICHUNGEN gegenueber dem Zitat im Issue - beide GEMELDET, keine
// eigenmaechtige Anpassung und kein Adapter: Das Issue zitiert `sofortFlush` und
// `setzeExportZiel` mit `Ergebnis<void>`, gebaut sind sie mit
// `Ergebnis<void, ProjectStoreFehlercode>` bzw. `Ergebnis<void, ConfigFehlercode>`.
// Das ist eine ERWEITERUNG der Fehlercode-Union, keine Formaenderung; beide werden
// hier ohnehin nur ueber `ok` ausgewertet und ihr Code wandert allein in den
// Meldungstext. Der gebaute Code gewinnt.

import { unlink } from 'node:fs/promises'
import path from 'node:path'

import { setzeExportZiel } from '../config-store/setze-export-ziel' // #28
import { holeAktivesProjekt } from '../project-store/aktives-projekt' // #192
import { sofortFlush } from '../project-store/auto-speichern' // #47
import { mitD1Lock } from '../project-store/d1-lock' // #32
import { ersetzeAtomar } from './ersetzen' // #187
import { kopiereNachPart } from './kopieren' // #186
import { loeseExportQuelle } from './quelle' // #185
import { pruefeExportZiel } from './ziel-pruefung' // #184

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { AusfuehrungsKontext, HandlerErgebnis } from '../auftrags-manager/dispatcher'
import type { ExportFehlercode } from './fehlercodes'

/**
 * Der GESCHLOSSENE Satz der Codes, die diese Datei melden kann - die sieben fachlichen aus #182
 * plus die drei generischen. Es ist genau die Union, die `HandlerErgebnis<ExportFehlercode>` in
 * seinem `fehler.code` traegt; sie hier zu benennen erspart JEDEN `as`-Cast. Ein achter fachlicher
 * Code wird NICHT nachgetragen - die Union gehoert #182, ein fehlender Code ist ein Vertragsfehler
 * an TK 9.6.4 und wird gemeldet.
 */
type Fehlercode = ExportFehlercode | GenerischerFehlercode

/** Die Endung der Arbeitsdatei. Sie wird ANGEHAENGT, nicht ersetzt - Begruendung bei `bildePfade`. */
const PART_ENDUNG = '.part'

/**
 * "intern protokolliert" - dieselbe vorlaeufige Loesung wie im ipc-gateway (#23) und in der
 * Render-Verzahnung (#170). Ins Protokoll des Hauptprozesses darf die rohe Ursache samt
 * Stacktrace; verboten ist der Stacktrace nur im RUECKGABEWERT, auf dem Weg zur Oberflaeche
 * (TK 9.1.1 Punkt 8).
 */
function protokolliere(stelle: string, ursache: unknown): void {
  console.error(`[export-service] ${stelle}:`, ursache)
}

function fehlgeschlagen(code: Fehlercode, meldung: string): HandlerErgebnis<ExportFehlercode> {
  return { status: 'fehlgeschlagen', fehler: { code, meldung } }
}

/**
 * Reicht den Fehler eines Bausteins UNVERAENDERT weiter - Code, Meldung und ein etwaiges `daten`.
 *
 * KEIN Neu-Formulieren, KEIN Zusammenfassen auf `schreib_fehler`, KEIN `as`-Cast. TK 9.1.1:
 * "Geht der Code verloren, degradieren Reparatur-Modus, Wiederholen und der FAT32-Hinweis alle zu
 * 'irgendwas ist schiefgelaufen'." Was dieser Handler durchlaesst, steht danach UNKORRIGIERT in
 * Q3 - Q3 ist dauerhaft.
 *
 * `daten` wird nur gesetzt, wenn der Baustein es mitgibt: `daten: undefined` waere ein leerer
 * Beutel und damit eine dritte Bedeutung neben "da" und "nicht da".
 */
function durchreichen(fehler: {
  code: Fehlercode
  meldung: string
  daten?: unknown
}): HandlerErgebnis<ExportFehlercode> {
  const weiter: { code: Fehlercode; meldung: string; daten?: unknown } = {
    code: fehler.code,
    meldung: fehler.meldung,
  }
  if (fehler.daten !== undefined) weiter.daten = fehler.daten
  return { status: 'fehlgeschlagen', fehler: weiter }
}

/** Nicht leerer String - die eine Formpruefung, die dieser Handler selbst macht. */
function istText(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.length > 0
}

/**
 * SCHRITT 0. Rueckgabe: `null`, wenn der Export weiterlaufen darf; sonst der fertige Fehlschlag.
 *
 * GENAU EIN `mitD1Lock`-Aufruf, und darin steht NICHTS ausser Abruf und Flush. Der kritische
 * Abschnitt haelt alle D1-Schreibvorgaenge der Anwendung an - das Kopieren von 2,5 GB gehoert
 * nicht hinein.
 *
 * KEINE PRUEFUNG, OB DAS AKTIVE PROJEKT DASSELBE IST WIE `payload.projektId`: Der Flush hat genau
 * einen Zweck - nichts, was im Speicher steht, darf waehrend eines minutenlangen Auftrags nur im
 * Speicher stehen (TK 9.5.4). Dieser Zweck haengt nicht daran, welches Projekt die Nutzlast nennt.
 * Eine Gleichheitspruefung liesse im Ungleichheitsfall genau die Aenderungen ungeschrieben, die
 * der Flush retten soll.
 *
 * DAS ZURUECKGEGEBENE `Project` WIRD NICHT VERAENDERT UND NICHT FESTGEHALTEN. Es ist der lebende
 * Stand. Es wird an `sofortFlush` durchgereicht und danach vergessen - kein Feld gelesen, keines
 * gesetzt, keine Kopie, kein Merken ueber den Lock-Abschnitt hinaus.
 */
async function flusheD1(): Promise<HandlerErgebnis<ExportFehlercode> | null> {
  const geschrieben = await mitD1Lock(async () => {
    const projekt = holeAktivesProjekt()
    // "Kein Projekt geoeffnet" ist laut #192 ein regulaerer Rueckgabewert, kein Fehler. Ist
    // nichts geoeffnet, gibt es auch nichts, was der Flush auf die Platte zwingen koennte - der
    // Zweck des Schritts ist bereits erfuellt. Den Export deswegen scheitern zu lassen hiesse:
    // Der Nutzer kann eine laengst fertig gerenderte Datei nicht auf den Stick kopieren, weil
    // zufaellig kein Projekt offen ist - und der Auftrag landete in Q2 fuer einen Zustand, den
    // ein Wiederholen nicht aendert.
    if (projekt === null) return null
    return sofortFlush(projekt)
  })

  if (geschrieben === null) {
    // Intern protokolliert, NICHT in das Auftrags-Ergebnis gehoben.
    console.warn(
      '[export-service] Kein Projekt geoeffnet - der Sofort-Flush entfaellt, der Export laeuft weiter.',
    )
    return null
  }

  if (geschrieben.ok) return null

  // JEDER Flush-Fehlschlag wird zu `speicher_fehler` - dem siebten Code aus TK 9.6.4 (v2.9). Die
  // uebrigen sechs beschreiben ausnahmslos Zustaende des ZIELSPEICHERS und passen nicht:
  // `schreib_fehler` heisst laut Tabelle "sonstiger I/O-Fehler beim Kopieren" - hier wurde noch
  // nichts kopiert, und das Problem liegt auf der INTERNEN Platte, waehrend der Nutzer auf den
  // Stick schaut. `unbekannter_fehler` ist fuer unerwartete Ausnahmen reserviert (TK 9.1.1
  // Punkt 8) und verewigte einen exakt benennbaren Zustand in Q3 als "unbekannt".
  //
  // Der urspruengliche Code des project-store (`speicher_fehler`, `ungueltige_eingabe`, ...)
  // steht nicht in `ExportFehlercode`; er reist in der MELDUNG mit, damit die Diagnose nicht
  // verloren geht. Das ist kein Umdeuten eines Bausteinfehlers, sondern die im Issue
  // entschiedene Zuordnung fuer genau diesen einen Schritt.
  return fehlgeschlagen(
    'speicher_fehler',
    'Der aktuelle Projektstand konnte vor dem Export nicht gespeichert werden ' +
      `(${geschrieben.fehler.code}): ${geschrieben.fehler.meldung}`,
  )
}

/**
 * SCHRITT 3. Die beiden Zielpfade entstehen HIER, und das ist KEIN Verstoss gegen die
 * Pfad-Autoritaet.
 *
 * Der `project-store` ist Pfad-Autoritaet fuer das DATEI-LAYOUT EINES PROJEKTS (TK 9.5.7:
 * "projects/<id>/media/<datei>", "projects/<id>/output/"). Der Zielordner ist KEIN Projektpfad,
 * sondern ein vom Nutzer im Dialog (#183) gewaehlter fremder Ort, meist eine USB-Wurzel.
 * `loeseAusgabePfad`/`ausgabeOrdner` (#49) sind dafuer weder zustaendig noch geeignet - sie
 * pruefen gegen den PROJEKT-Ausgabeordner und wiesen jeden USB-Pfad ab.
 *
 * SICHER ist das Zusammensetzen, weil `dateiname` bereits von #185 ueber `loeseAusgabePfad` (#49)
 * gegen die Namensregeln aus TK 9.2.6 geprueft wurde: keine Pfadtrenner, kein "..", keine
 * unzulaessigen Zeichen. Damit ist TK 9.6.3 gewahrt: "Der Export darf nie ausserhalb von
 * `zielPfad` schreiben."
 *
 * DIE `.part`-ENDUNG WIRD ANGEHAENGT, NICHT ERSETZT: `sommer.mp4.part`, nicht `sommer.part`. So
 * steht es in TK 9.6.2 Schritt 3, so bleibt im Explorer erkennbar, welche Leiche zu welcher Datei
 * gehoert - und ein echter Export namens `sommer.part` kollidierte nicht damit.
 */
function bildePfade(zielOrdner: string, dateiname: string): { zielDateiPfad: string; partPfad: string } {
  const zielDateiPfad = path.join(zielOrdner, dateiname)
  return { zielDateiPfad, partPfad: zielDateiPfad + PART_ENDUNG }
}

/**
 * Der best-effort-Aufraeumversuch nach einem endgueltig gescheiterten Ersetzen (Schritt 6).
 *
 * SEIN FEHLER WIRD VERSCHLUCKT und aendert das gemeldete Ergebnis NICHT. Der urspruengliche
 * Fehler ist die Information, die der Nutzer braucht; ihn durch einen Aufraeumfehler zu ersetzen,
 * verdeckt die Ursache. Und eine liegengebliebene `.part` ist nach TK 9.6.3 ein hinnehmbarer
 * Ausgang ("hinterlaesst hoechstens eine `.part`-Leiche").
 *
 * WARUM UEBERHAUPT HIER: #186 raeumt seine eigene `.part` auf, wenn das KOPIEREN scheitert. #187
 * fasst sie bewusst nicht an - es darf am Ziel kein Zeitfenster ohne gueltige Datei geben. Nach
 * einem gescheiterten Rename ist also niemand sonst zustaendig; ohne diese Zeilen bliebe die
 * Arbeitsdatei bei JEDEM Rename-Fehlschlag liegen.
 */
async function raeumePartAuf(partPfad: string): Promise<void> {
  try {
    await unlink(partPfad)
  } catch (ursache) {
    protokolliere(`Die Arbeitsdatei ${partPfad} konnte nicht entfernt werden`, ursache)
  }
}

export async function exportiereAusgabe(
  auftrag: Extract<Auftrag, { art: 'export' }>,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<ExportFehlercode>> {
  // `kontext.meldeFortschritt` WIRD NICHT GERUFEN. Der Vertrag kennt einen Fortschrittskanal nur
  // fuer den Render (TK 9.2.7); fuer den Export gibt es keinen, und `fs.copyFile` liefert ohnehin
  // keinen Byte-Fortschritt. Ein Zwischenwert ("50 %, weil kopiert") waere eine erfundene Zahl.
  // `Auftrag.fortschritt` darf laut TK 9.3.1 `null` sein - "null wo unbestimmt".
  void kontext

  try {
    // ---- SCHRITT 0: SOFORT-FLUSH, VOR JEDEM ANDEREN BAUSTEIN --------------------------------
    const flushFehler = await flusheD1()
    if (flushFehler !== null) return flushFehler

    // ---- SCHRITT 1: NUTZLAST LESEN UND PRUEFEN ----------------------------------------------
    //
    // "Der Main validiert jede eingehende Nutzlast - er vertraut dem Renderer nicht." (TK 9.1.1)
    // Die Pruefung ist trotz des Typs `ExportRequest` noetig: Ein wiederholter Auftrag kommt aus
    // Q2, also aus einer JSON-DATEI, und dort steht nicht zwangslaeufig, was der Typ verspricht.
    //
    // Geprueft wird nur die FORM. Endung, Pfadtrenner und ".." pruefen #185/#49, Erreichbarkeit,
    // Dateisystem und Platz prueft #184 - beides wird hier NICHT nachgebaut. Zwei Stellen, die
    // dieselbe Regel kennen, driften auseinander.
    const nutzlast: unknown = auftrag.payload
    if (typeof nutzlast !== 'object' || nutzlast === null) {
      return fehlgeschlagen('ungueltige_eingabe', 'Der Export-Auftrag hat keine Nutzlast.')
    }
    // SAFETY: die Zeile davor hat nutzlast als nicht-null Objekt belegt; der Cast macht
    // die drei Felder als unknown sichtbar, und ihre Form wird darunter einzeln geprueft.
    const { projektId, dateiname, zielPfad } = nutzlast as {
      projektId?: unknown
      dateiname?: unknown
      zielPfad?: unknown
    }
    if (!istText(projektId)) {
      return fehlgeschlagen('ungueltige_eingabe', 'Der Export-Auftrag nennt kein Projekt.')
    }
    if (!istText(dateiname)) {
      return fehlgeschlagen('ungueltige_eingabe', 'Der Export-Auftrag nennt keine Ausgabedatei.')
    }
    if (!istText(zielPfad)) {
      return fehlgeschlagen('ungueltige_eingabe', 'Der Export-Auftrag nennt keinen Zielordner.')
    }

    // ---- SCHRITT 2: QUELLE AUFLOESEN (#185) -------------------------------------------------
    const quelle = await loeseExportQuelle(projektId, dateiname)
    if (!quelle.ok) return durchreichen(quelle.fehler)
    const { quellPfad, dateigroesse } = quelle.wert

    // ---- SCHRITT 3: ZIELPFADE BILDEN --------------------------------------------------------
    const { zielDateiPfad, partPfad } = bildePfade(zielPfad, dateiname)

    // ---- SCHRITT 4: ZIEL VORAB PRUEFEN (#184) -----------------------------------------------
    //
    // #184 bekommt den DATEINAMEN NICHT - es prueft den ORDNER (erreichbar, Dateisystem, Platz)
    // gegen eine Byte-Zahl. Weitergereicht wird die QUELLGROESSE aus #185, unveraendert: Die
    // `.part` wird genau so gross wie die Quelle, und #186 verifiziert danach gegen dieselbe Zahl.
    const zielOk = await pruefeExportZiel(zielPfad, dateigroesse)
    if (!zielOk.ok) return durchreichen(zielOk.fehler)

    // ---- SCHRITT 5: KOPIEREN, VERIFIZIEREN, FSYNC (#186) ------------------------------------
    const kopiert = await kopiereNachPart(quellPfad, partPfad, dateigroesse)
    if (!kopiert.ok) return durchreichen(kopiert.fehler)

    // ---- SCHRITT 6: ATOMAR ERSETZEN (#187) --------------------------------------------------
    //
    // Gemessen am 14.08.2026 an echten Wechseldatentraegern (exFAT 117 GB, zweimal FAT32 3,7 GB):
    // `rename` von <Temp> auf einen Stick scheitert auf BEIDEN Dateisystemen mit EXDEV; `rename`
    // INNERHALB desselben Datentraegers gelingt, auch ueber eine vorhandene Zieldatei hinweg.
    // Genau deshalb liegt die `.part` NEBEN dem Ziel und nicht in <Temp> (TK v2.8 E-3, jetzt
    // empirisch belegt). Die einzige Retry-Schleife des Exports sitzt in #187; hier wird NICHT
    // wiederholt - ein blinder zweiter Versuch kopierte 2,5 GB erneut, waehrend die Warteschlange
    // steht, und ein voller Stick bessert sich dadurch nicht (TK 9.6.5, FA-17: der Fehlschlag
    // landet in Q2).
    const ersetzt = await ersetzeAtomar(partPfad, zielDateiPfad)
    if (!ersetzt.ok) {
      await raeumePartAuf(partPfad)
      return durchreichen(ersetzt.fehler)
    }

    // ---- SCHRITT 7: ZIEL MERKEN (#28) -------------------------------------------------------
    //
    // Mit dem ORDNER, nicht mit dem Dateipfad: Gemerkt wird die Vorbelegung des naechsten
    // Zieldialogs (#183), und der waehlt einen Ordner.
    //
    // EIN FEHLSCHLAG HIER LAESST DEN EXPORT ERFOLGREICH. Die Datei liegt zu diesem Zeitpunkt
    // vollstaendig, verifiziert und gesynct auf dem Stick - der Vorgang IST gelungen. Wuerde der
    // Auftrag deswegen als `fehlgeschlagen` gemeldet, landete er in Q2 und der Nutzer wiederholte
    // einen 2,5-GB-Kopiervorgang, weil eine BEQUEMLICHKEITS-EINSTELLUNG nicht gespeichert werden
    // konnte.
    //
    // DER EIGENE `try` IST ABSICHT und nicht doppelt gemoppelt: Ohne ihn faenge der aeussere
    // `catch` einen Wurf aus `setzeExportZiel` und machte aus dem gelungenen Export einen
    // `unbekannter_fehler` - dieselbe falsche Folge wie oben, nur ueber einen anderen Weg.
    // Ab hier darf NICHTS mehr das Ergebnis kippen.
    try {
      const gemerkt = await setzeExportZiel(zielPfad)
      if (!gemerkt.ok) {
        protokolliere(
          `Das Export-Ziel "${zielPfad}" konnte nicht gemerkt werden (${gemerkt.fehler.code})`,
          gemerkt.fehler.meldung,
        )
      }
    } catch (ursache) {
      protokolliere(`Das Export-Ziel "${zielPfad}" konnte nicht gemerkt werden`, ursache)
    }

    // ---- SCHRITT 8: ERFOLG ------------------------------------------------------------------
    //
    // ACHTUNG, DIE WAHRSCHEINLICHSTE VERWECHSLUNG DIESER DATEI: `zielPfad` heisst im EINGANG der
    // ORDNER und im AUSGANG der VOLLSTAENDIGE PFAD DER GESCHRIEBENEN DATEI. TK 9.6.1: "`zielPfad`
    // ist hier der vollstaendige Pfad der geschriebenen Zieldatei (Zielordner + `dateiname`),
    // nicht der Ordner allein - aus ihm wird `ProtokollEintrag.ausgabe.pfad` (9.3)."
    return { status: 'erfolg', ergebnis: { zielPfad: zielDateiPfad, dateigroesse } }
  } catch (ursache) {
    // DER EINE FANG, DER DIE WARTESCHLANGE AM LEBEN HAELT. Alle Bausteine sagen zu, ihre Fehler in
    // der Huelle zu melden und nicht zu werfen; bricht einer diese Zusage, darf der Wurf diesen
    // Handler trotzdem nicht verlassen - sonst bleibt der Auftrag auf `laeuft` stehen und mit ihm
    // die ganze Sitzung.
    //
    // `unbekannter_fehler` ist hier richtig und nicht `speicher_fehler` oder `schreib_fehler`:
    // TK 9.1.1 Punkt 8 reserviert ihn fuer UNERWARTETE AUSNAHMEN, und mehr weiss diese Stelle
    // nicht. Die rohe Ursache geht ins Protokoll des Hauptprozesses, NICHT in die Meldung: "Eine
    // rohe Exception-Meldung wird nie zum Code." (TK 9.1.1) - und ein Stacktrace stuende sonst
    // dauerhaft in Q3.
    protokolliere(`Unerwartete Ausnahme im Export-Handler (Auftrag ${auftrag.auftragId})`, ursache)
    return fehlgeschlagen(
      'unbekannter_fehler',
      'Der Export ist unerwartet abgebrochen. Einzelheiten stehen im Protokoll der Anwendung.',
    )
  }
}
// Erfolg:  { status: 'erfolg', ergebnis: { zielPfad, dateigroesse } }
//          zielPfad = VOLLSTÄNDIGER Pfad der geschriebenen ZIELDATEI (Zielordner + dateiname)
// Fehler:  { status: 'fehlgeschlagen', fehler: { code, meldung } }
// Diese Funktion liefert NIE { status: 'abgebrochen' } – ein Export ist nicht abbrechbar (FA-18)
// Sie wirft NIE.
