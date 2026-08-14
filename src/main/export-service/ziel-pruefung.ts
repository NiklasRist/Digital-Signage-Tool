// GENERIERT aus dem Signaturblock von Issue #184.
// [export-service] Exportziel vorab prüfen: Erreichbarkeit, Dateisystem, freier Platz
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
// GERUEST-PRUEFSUMME: ab037df0f0a21993
//
// ERLEDIGT (14.08.2026): Abschaltzeile fuer no-unused-vars entfernt, der Rumpf ist
// gefuellt - alle Parameter und Importe werden benutzt.
//
// WAS DIESE DATEI IST: der Waechter VOR dem Kopieren. "Ziel vorab pruefen (vor dem
// Kopieren, damit kein 20-Minuten-Kopiervorgang am Ende scheitert)" (TK 9.6.2,
// Schritt 2). Sie MISST nur - kein Ordner wird angelegt, keine Testdatei
// geschrieben, kein `.part`-Rest geloescht, nichts umbenannt.
//
// WARUM DER PLATZBEDARF NICHT UM EINE VORHANDENE ZIELDATEI GEMINDERT WIRD:
// "Die vorhandene Zieldatei ist geschuetzt: Eine Datei gleichen Namens auf dem Ziel
// wird nie geloescht oder ueberschrieben, bevor die neue vollstaendig kopiert und
// groessen-verifiziert ist. Deshalb `.part` + Rename-mit-Ersetzen zum Schluss."
// (TK 9.6.3) Waehrend des Kopierens liegen also BEIDE Dateien gleichzeitig auf dem
// Stick. Wer die alte abzieht, laesst einen Export starten, der zwangslaeufig mit
// "kein Platz" endet.
//
// KEIN LOCK, KEIN D1-ZUGRIFF, KEINE PFAD-AUTORITAET: "Nur der Main beruehrt das
// Dateisystem. Kein zweites Lock - die Serialisierung liefert die Queue (`export`
// ist ein Auftrag)." (TK 9.6.3) Der Zielordner ist ein FREMDER Ort ausserhalb des
// Projektdatenbestands; `loeseAusgabePfad`/`medienOrdner` (#49) haben hier deshalb
// nichts zu suchen - sie pruefen den falschen Pfad gegen die falsche Schranke.
//
// DIESE FUNKTION WIRFT NIE. Ihr Aufrufer ist der Export-Handler eines Auftrags;
// eine Ausnahme liesse den Auftrag auf `laeuft` stehen und braechte die streng
// serielle Warteschlange fuer den Rest der Sitzung zum Stillstand (TK 9.3.5).

import { execFile } from 'node:child_process'
import { constants } from 'node:fs'
import { access, stat, statfs } from 'node:fs/promises'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ExportFehlercode } from './fehlercodes'

/**
 * Groesste Datei, die eine FAT32-Partition aufnehmen kann: 4 GiB minus ein Byte.
 *
 * Die Zahl ist keine Faustregel, sondern die technische Obergrenze: Das
 * Groessenfeld im FAT32-Verzeichniseintrag ist 32 Bit breit, mehr als
 * 2^32 - 1 = 4294967295 Bytes sind darin nicht darstellbar.
 *
 * Verglichen wird deshalb mit `>` und NICHT mit `>=`: Eine Datei von exakt
 * 4294967295 Bytes passt noch. Und gerechnet wird in GiB, nicht in
 * "4 GB = 4000000000": Eine Datei von 4100000000 Bytes passt ebenfalls noch - wer
 * hier grosszuegig abrundet, verbietet einen funktionierenden Export.
 */
export const FAT32_MAX_DATEIGROESSE = 4294967295

/**
 * Zeitgrenze fuer die Dateisystem-Erkennung.
 *
 * WARUM HIER EINE ZEITGRENZE STEHT, WO #158 FUER ffmpeg AUSDRUECKLICH KEINE WOLLTE:
 * Ein Renderlauf darf legitim Minuten dauern (NFA-05) - eine Grenze wuerde dort
 * gueltige Arbeit abschneiden. Eine Dateisystem-Abfrage dagegen ist in rund 370 ms
 * fertig (gemessen ueber vier Dateisysteme); braucht sie Sekunden, ist etwas kaputt,
 * etwa ein Wechseldatentraeger, der nicht mehr antwortet. Und der Abbruch ist hier
 * FOLGENLOS: Er faellt in die Rueckfallregel, die Pruefung gilt als bestanden, der
 * Export laeuft weiter. Ohne Grenze haenge dagegen die ganze Oberflaeche an einem
 * Prozess, der nie zurueckkommt.
 *
 * 5 Sekunden sind rund das Dreizehnfache der Messung - weit genug weg, um einen
 * langsamen Rechner nicht zu treffen, eng genug, um kein Haenger zu sein.
 */
const ERKENNUNG_ZEITGRENZE_MS = 5000

/**
 * Was die Dateisystem-Erkennung ueber den Zielort sagen kann.
 *
 * `null` heisst ausdruecklich "nicht ermittelbar" und ist ein regulaeres,
 * eingeplantes Ergebnis - kein Fehler. Siehe Rueckfallregel unten.
 */
export type ErkanntesDateisystem = 'fat32' | 'anderes' | null

/**
 * DIE OFFENE STELLE DIESES ISSUES - HIER STEHT ABSICHTLICH KEIN VERFAHREN.
 *
 * "Wie erkennt man auf Windows und macOS zuverlaessig, dass das Ziel FAT32 ist?"
 * ist im Issue #184 als EXPERIMENT gefuehrt: "Das ist ein Experiment, keine
 * Entscheidung. [...] Baue bis zur Antwort KEIN Erkennungsverfahren ein, auch kein
 * 'vorlaeufiges'." Deshalb liefert die Voreinstellung auf JEDER Plattform `null`
 * und fasst weder ein Hilfsprogramm noch eine Plattform-API an.
 *
 * WAS AM 14.08.2026 AUF DEM ENTWICKLUNGSRECHNER GEMESSEN WURDE (Windows 11 Home
 * 10.0.26200, Node 22.12.0) - Teilergebnis, weil weder ein FAT32- noch ein
 * exFAT-Datentraeger vorhanden war und ohne Administratorrechte auch keiner
 * herstellbar ist:
 *
 * 1. `fs.promises.statfs()` SCHEIDET AUF WINDOWS AUS - das ist gemessen UND an der
 *    Quelle belegt, ganz ohne Stick. Gemessen: `type` ist 0 fuer C:\ (NTFS), fuer
 *    einen tief liegenden Ordner, fuer <Temp> und sogar fuer den Netzpfad
 *    \\localhost\C$ - also fuer eine lokale NTFS-Partition und eine SMB-Freigabe
 *    denselben Wert. Belegt: libuv setzt in `fs__statfs` (src/win/fs.c) woertlich
 *    `stat_fs->f_type = 0;` - das Feld wird auf Windows gar nicht erst befuellt.
 *    Ein Wert, der konstant 0 ist, kann FAT32 von nichts unterscheiden.
 * 2. Der im Issue vorgeschlagene Weg `Get-Volume` FUNKTIONIERT, IST ABER ZU TEUER.
 *    In einem frisch gestarteten `powershell.exe` (so wuerde die App ihn rufen):
 *    `Get-Volume -FilePath <Ordner>` 6899 / 11173 / 6647 ms,
 *    `Get-Volume -DriveLetter C` 4689 / 2032 / 1776 ms. Das Storage-Modul kostet
 *    diese Sekunden bei jedem Aufruf neu. Zum Vergleich, gleiche Messreihe:
 *    `[System.IO.DriveInfo]::new(<Pfad>).DriveFormat` 289 / 225 / 194 ms und
 *    `wmic logicaldisk ...` 106 / 103 / 102 ms.
 * 3. `fsutil fsinfo volumeinfo` SCHEIDET AUS: unerhoehnt "Fehler 5: Zugriff
 *    verweigert" (fuer `C:` und fuer den Volume-GUID-Pfad). Die App laeuft
 *    ausdruecklich ohne Administratorrechte.
 *
 * WAS DAMIT NOCH OFFEN IST: ob irgendeiner dieser Wege fuer einen ECHTEN
 * FAT32-Stick den Klartext `FAT32` und fuer exFAT `exFAT` liefert. Das ist auf
 * diesem Rechner nicht messbar (kein Wechseldatentraeger, keine Adminrechte, also
 * auch kein formatierbarer virtueller Datentraeger). Ebenso ungemessen: das
 * Verhalten auf macOS (`diskutil`) und der Fall eines Sticks, der ohne
 * Laufwerksbuchstaben in einen NTFS-Ordner eingehaengt ist - fuer den wuerde
 * `DriveInfo` das TRAGENDE Laufwerk melden und damit die falsche Antwort geben.
 * (Gemessen wurde immerhin: `DriveInfo` wirft bei einem UNC-Pfad, und `Get-Volume`
 * liefert dafuer wortlos gar nichts.)
 *
 * WER DIE ANTWORT HAT, AENDERT GENAU DIESE EINE STELLE - nichts sonst in dieser
 * Datei muss dafuer angefasst werden; der Vergleich gegen
 * {@link FAT32_MAX_DATEIGROESSE} steht schon und ist getestet.
 *
 * Warum ein veraenderbares Objekt und keine blosse Funktion: So ist die noch
 * fehlende Messung im Test einsetzbar, und der FAT32-Zweig laesst sich beweisen,
 * statt nur behauptet zu werden.
 *
 * ------------------------------------------------------------------------------
 * NACHTRAG 14.08.2026 - DAS EXPERIMENT IST BEANTWORTET, DAS VERFAHREN STEHT UNTEN.
 *
 * Der User hat drei echte Wechseldatentraeger angeschlossen; damit war messbar, was
 * oben als offen stand. Gemessen aus Node heraus, also INKLUSIVE Prozessstart, je
 * drei Laeufe:
 *
 *   C:\  NTFS  (fest)     -> DriveFormat "NTFS"    378/366/374 ms   statfs().type 0
 *   D:\  exFAT (Wechsel)  -> DriveFormat "exFAT"   365/383/362 ms   statfs().type 0
 *   E:\  FAT32 (Wechsel)  -> DriveFormat "FAT32"   382/379/352 ms   statfs().type 0
 *   F:\  FAT32 (Wechsel)  -> DriveFormat "FAT32"   389/382/363 ms   statfs().type 0
 *
 * ERGEBNIS 1: `statfs().type` ist ueber VIER Dateisysteme hinweg konstant 0 (zuvor
 * zusaetzlich ueber eine SMB-Freigabe). Endgueltig ausgeschieden, s. Punkt 1 oben.
 * ERGEBNIS 2: `DriveFormat` liefert den Klartext und unterscheidet alle vier Faelle
 * korrekt, in rund 370 ms. Genau die Frage, die oben als "noch offen" stand.
 *
 * WARUM DER PROZESSSTART HIER VERTRETBAR IST: Die Pruefung laeuft EINMAL JE EXPORT,
 * nicht je Datei und schon gar nicht je Bild. 370 ms gegen einen Kopiervorgang von
 * mehreren Sekunden bis Minuten - und der Gegenwert ist, dass ein aussichtsloser
 * Export gar nicht erst beginnt.
 *
 * WAS WEITERHIN UNGEMESSEN BLEIBT und deshalb ueber die Rueckfallregel laeuft:
 * - macOS. Dort gibt es weder `DriveInfo` noch PowerShell; der Weg waere
 *   `diskutil info -plist <pfad>`. Kein Mac vorhanden. Wir liefern dort `null`
 *   statt ungepruefte Zeilen - ein Zweig, der nie ausgefuehrt wurde, ist keine
 *   Zusage, sondern eine Behauptung.
 * - Ein Stick, der OHNE Laufwerksbuchstaben in einen NTFS-Ordner eingehaengt ist.
 *   `DriveInfo` meldete dort das TRAGENDE Laufwerk, also "NTFS" statt "FAT32" -
 *   die Pruefung liefe durch und der Fehler faellt erst beim Kopieren auf. Das ist
 *   die sichere Richtung (#186 faengt es), aber es ist eine bekannte Luecke.
 */
export const dateisystemErkennung: {
  erkenne(zielOrdner: string): Promise<ErkanntesDateisystem>
} = {
  erkenne: async (zielOrdner: string): Promise<ErkanntesDateisystem> => {
    // Nur Windows. Auf macOS ist das Verfahren ungemessen (s. Nachtrag oben), und
    // eine ungemessene Erkennung ist schlechter als gar keine: Sie koennte einen
    // gueltigen Export mit einer erfundenen Begruendung abweisen.
    if (process.platform !== 'win32') return null

    // DER PFAD GEHT ALS UMGEBUNGSVARIABLE HINEIN, NICHT IN DEN BEFEHLSTEXT.
    // Ein Zielordner ist eine Nutzereingabe (er kommt aus einem Ordner-Dialog, kann
    // aber auch aus der Konfiguration stammen). In eine PowerShell-Befehlszeile
    // eingesetzt, koennte ein Anfuehrungszeichen darin den Befehl verlassen. Ueber
    // die Umgebung gibt es diese Naht nicht - der Wert wird nie geparst.
    const ausgabe = await new Promise<string | null>((fertig) => {
      const kind = execFile(
        'powershell',
        ['-NoProfile', '-NonInteractive', '-Command', '[IO.DriveInfo]::new($env:DST_ZIEL).DriveFormat'],
        { env: { ...process.env, DST_ZIEL: zielOrdner }, timeout: ERKENNUNG_ZEITGRENZE_MS },
        (fehler, stdout) => fertig(fehler ? null : stdout),
      )
      // Ein Kind ohne PID ist gar nicht erst gestartet; dann kommt auch kein Rueckruf.
      if (kind.pid === undefined) fertig(null)
    })

    if (ausgabe === null) return null
    // `DriveFormat` liefert den Klartext des Dateisystems. Gross-/Kleinschreibung ist
    // nicht zugesichert, deshalb der Vergleich in Kleinbuchstaben.
    const klartext = ausgabe.trim().toLowerCase()
    if (klartext === '') return null
    // NUR fat32 wird benannt. Alles andere ist "anderes" - nicht etwa "kein Problem":
    // Der Aufrufer prueft ausschliesslich auf 'fat32', und eine feinere Unterscheidung
    // braeuchte einen Grund. FAT16 ("fat") hat eine noch KLEINERE Grenze (2 GiB), ist
    // aber auf Sticks dieser Groessenordnung nicht mehr anzutreffen und wurde nicht
    // gemessen - deshalb wird es hier NICHT stillschweigend mitbehandelt.
    return klartext === 'fat32' ? 'fat32' : 'anderes'
  },
}

/** Baut die Fehlerhuelle. Nie ein Stacktrace, nie eine rohe Exception-Meldung. */
function zielFehler(
  code: ExportFehlercode | 'ungueltige_eingabe' | 'unbekannter_fehler',
  meldung: string,
): Ergebnis<void, ExportFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

/** Bytes fuer den Nutzer lesbar - mit der Rohzahl, damit nichts durch Runden verschwindet. */
function lesbar(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(2)} GiB (${bytes} Bytes)`
}

export async function pruefeExportZiel(
  zielOrdner: string,
  benoetigteBytes: number,
): Promise<Ergebnis<void, ExportFehlercode>> {
  // SCHRITT 1 - FORMPRUEFUNG, VOR JEDEM DATEISYSTEMZUGRIFF.
  // `typeof` trotz der Typen in der Signatur: Der Aufrufer ist ein Auftrags-Handler,
  // dessen Auftrag aus JSON stammen kann (Q2-Wiederholung, also aus einer Datei) -
  // dort steht nicht zwangslaeufig das, was der Typ verspricht.
  if (typeof zielOrdner !== 'string' || zielOrdner.length === 0) {
    return zielFehler('ungueltige_eingabe', 'Es wurde kein Zielordner fuer den Export uebergeben.')
  }
  if (typeof benoetigteBytes !== 'number' || !Number.isFinite(benoetigteBytes) || benoetigteBytes < 0) {
    return zielFehler(
      'ungueltige_eingabe',
      'Die benoetigte Dateigroesse ist keine gueltige Zahl - der Platzbedarf laesst sich damit nicht pruefen.',
    )
  }

  try {
    // SCHRITT 2 - ERREICHBARKEIT.
    // Jeder Fehlschlag von `stat` ist hier `ziel_nicht_verfügbar` und ausdruecklich
    // NICHT `nicht_gefunden`: Der Nutzer hat den Ordner selbst gewaehlt, die Ursache
    // ist praktisch immer der gezogene Stick, und die Oberflaeche muss darauf mit
    // "Speicher wieder anschliessen" reagieren.
    let eintrag
    try {
      eintrag = await stat(zielOrdner)
    } catch {
      return zielFehler(
        'ziel_nicht_verfügbar',
        `Der Zielordner "${zielOrdner}" ist nicht erreichbar. Bitte den Speicher wieder anschliessen und es erneut versuchen.`,
      )
    }
    if (!eintrag.isDirectory()) {
      return zielFehler(
        'ziel_nicht_verfügbar',
        `"${zielOrdner}" ist kein Ordner. Bitte den Ordner auf dem Speicher waehlen, in den exportiert werden soll.`,
      )
    }

    // SCHRITT 3 - SCHREIBBARKEIT. Geprueft wird mit `access`, NICHT mit einer
    // Testdatei: Eine Testdatei waere genau die Sorte Hinterlassenschaft, die auf
    // einem Stick beim Kunden landet - und sie zu schreiben verletzt die Zusage
    // dieser Funktion, am Ziel nichts zu veraendern.
    try {
      await access(zielOrdner, constants.W_OK)
    } catch {
      return zielFehler(
        'ziel_nicht_verfügbar',
        `Der Zielordner "${zielOrdner}" ist nicht beschreibbar (Schreibschutz oder fehlende Berechtigung).`,
      )
    }

    // SCHRITT 4 - DATEISYSTEM.
    // RUECKFALLREGEL: Liefert die Erkennung nichts oder wirft sie, gilt der Schritt
    // als BESTANDEN. Die Vorabpruefung ist eine Verbesserung der Fehlermeldung, nicht
    // die eigentliche Absicherung - der echte Waechter ist das Kopieren selbst (#186).
    // Wuerde hier bei jeder nicht durchfuehrbaren Messung `ziel_nicht_verfügbar`
    // gemeldet, waere der Export auf jedem Laufwerkstyp unmoeglich, fuer den unser
    // Verfahren keine Antwort hat - FA-09 fiele komplett aus, statt nur eine
    // Fehlermeldung zu verschlechtern.
    let dateisystem: ErkanntesDateisystem = null
    try {
      dateisystem = await dateisystemErkennung.erkenne(zielOrdner)
    } catch {
      dateisystem = null
    }
    if (dateisystem === 'fat32' && benoetigteBytes > FAT32_MAX_DATEIGROESSE) {
      return zielFehler(
        'datei_zu_gross_fat32',
        `Die Datei ist ${lesbar(benoetigteBytes)} gross. Der Zielordner "${zielOrdner}" liegt auf einem ` +
          'FAT32-Dateisystem, das keine Datei ueber 4 GiB aufnehmen kann. Der Speicher muss dafuer in exFAT ' +
          'formatiert sein (Achtung: Formatieren loescht den gesamten Inhalt des Speichers).',
      )
    }

    // SCHRITT 5 - FREIER PLATZ. Verglichen wird blank: verfuegbar >= benoetigt.
    // KEIN Sicherheitszuschlag, KEINE Rundung auf Blockgrenzen, KEIN Abzug einer
    // vorhandenen Zieldatei gleichen Namens (Begruendung im Kopf dieser Datei).
    // Auch hier die Rueckfallregel: `statfs` gibt es nicht auf jeder Plattform und
    // fuer jeden Laufwerkstyp - wirft es, gilt der Schritt als bestanden.
    let verfuegbareBytes: number | null = null
    try {
      const raum = await statfs(zielOrdner)
      const gerechnet = Number(raum.bavail) * Number(raum.bsize)
      verfuegbareBytes = Number.isFinite(gerechnet) ? gerechnet : null
    } catch {
      verfuegbareBytes = null
    }
    if (verfuegbareBytes !== null && verfuegbareBytes < benoetigteBytes) {
      return zielFehler(
        'kein_platz',
        `Auf "${zielOrdner}" sind nur ${lesbar(verfuegbareBytes)} frei, benoetigt werden ${lesbar(benoetigteBytes)}. ` +
          'Bitte Platz schaffen oder einen anderen Speicher waehlen.',
      )
    }

    return { ok: true, wert: undefined }
  } catch {
    // Auffangnetz. Erreichbar nur ueber etwas, das oben nicht vorgesehen ist - die
    // Meldung bleibt trotzdem ohne Stacktrace und ohne rohe Exception-Meldung:
    // "Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1)
    return zielFehler(
      'unbekannter_fehler',
      `Der Zielordner "${zielOrdner}" konnte nicht geprueft werden.`,
    )
  }
}
