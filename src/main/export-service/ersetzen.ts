// GENERIERT aus dem Signaturblock von Issue #187.
// [export-service] Atomar ersetzen: Rename-mit-Ersetzen mit Retry und Backoff
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
// GERUEST-PRUEFSUMME: fb89acfd921e5f68
//
// ERLEDIGT: Die Abschaltzeile fuer no-unused-vars ist mit dem Fuellen des Rumpfes
// entfernt - alle Importe werden jetzt benutzt.
//
// ============================================================================
// DER MOMENT, IN DEM DIE ALTE DATEI DURCH DIE NEUE ERSETZT WIRD
// ============================================================================
// Ueberschreiben ist hier der REGELFALL: Der vorbelegte Ausgabename ist der zuletzt
// verwendete (FA-22), das Studio rendert dieselbe Schleife immer wieder unter
// demselben Namen, und auf dem Stick liegt sie unter genau diesem Namen. Was hier
// ersetzt wird, ist also im Normalfall die einzige lauffaehige Werbeschleife des
// Studios.
//
//   "**Die vorhandene Zieldatei ist geschuetzt:** Eine Datei gleichen Namens auf dem
//   Ziel wird **nie** geloescht oder ueberschrieben, bevor die neue **vollstaendig
//   kopiert und groessen-verifiziert** ist. Deshalb `.part` + Rename-mit-Ersetzen zum
//   Schluss. Ein Abbruch (Stick abgezogen, Absturz) hinterlaesst hoechstens eine
//   `.part`-Leiche, nie eine **halbe** MP4, die der TV abspielen wuerde." (TK 9.6.3)
//
//   "**Atomar ersetzen:** `.part` -> `<dateiname>` per Rename-mit-Ersetzen. Auf
//   Windows bei `EBUSY`/`EPERM` **Retry+Backoff**." (TK 9.6.2, Schritt 5)
//
// Daraus folgt die harte Form dieser Datei: EIN `rename` je Versuch, nichts davor und
// nichts danach. Kein `unlink` auf den Zielpfad, kein `copyFile`+`unlink`, kein
// Umbenennen der alten Datei auf einen Sicherungsnamen - auch nicht als
// "Rueckfallloesung, falls `rename` scheitert". Jede dieser Varianten erzeugt ein
// Zeitfenster, in dem am Ziel keine gueltige Datei liegt, und genau dieses Fenster
// ist der Grund, warum es das `.part`-Verfahren ueberhaupt gibt.
//
// KEIN ZWEITER SYNC UND KEIN VERZEICHNIS-`fsync`: Die Daten sind bereits gesynct
// (#186, TK 9.6.3). Ein zusaetzlicher Sync hier waere eine zweite Zustaendigkeit fuer
// dieselbe Zusage - und unter Windows gibt es einen Verzeichnis-`fsync` ohnehin nicht.
//
// HIER WIRD NICHTS AUFGERAEUMT. Bleibt die `.part` nach einem endgueltigen Fehlschlag
// liegen, ist das der von TK 9.6.3 ausdruecklich vorgesehene Ausgang. Das Aufraeumen
// erledigt der Aufrufer (#188), der beide Pfade gebildet hat.
//
// ============================================================================
// AN ECHTEN WECHSELDATENTRAEGERN GEMESSEN (Windows 11, Node 22) - NICHT ANGENOMMEN
// ============================================================================
// Drei angeschlossene Datentraeger: exFAT (117 GB), zweimal FAT32 (3,7 GB).
//
//   Probe                                        | exFAT  | FAT32
//   ---------------------------------------------+--------+--------
//   `rename` von <Temp> auf den Stick            | EXDEV  | EXDEV
//   `rename` innerhalb desselben Datentraegers   | geht   | geht
//   `rename` ueber eine VORHANDENE Zieldatei     | ersetzt| ersetzt
//
// Zwei Schluesse, die diese Datei tragen:
//  1. Das atomare Ersetzen traegt auf BEIDEN Stick-Dateisystemen - Node setzt unter
//     Windows `MOVEFILE_REPLACE_EXISTING`, eine vorhandene Zieldatei wird also
//     ersetzt statt zu blockieren. Es gibt keinen Zeitpunkt, in dem die Zieldatei
//     fehlt.
//  2. Es traegt aber NUR INNERHALB derselben Partition. Laege die `.part` im
//     Temp-Ordner, scheiterte JEDER Export an EXDEV - und im Entwicklungsbetrieb
//     fiele es nie auf, weil dort Temp und Ziel beide auf C: liegen. Genau deshalb
//     staget #186 die `.part` im PROJEKT-Ausgabeordner (TK v2.8, E-3). Ein EXDEV, das
//     hier trotzdem ankommt, ist ein Programmierfehler des Aufrufers - s. `EXDEV`
//     in `renameFehler`.
//
// Ebenfalls gemessen (uebernommen aus #186/#86, dort im Kopf belegt): Ein belegtes
// oder als Verzeichnis vorliegendes Ziel meldet unter Windows `EBUSY`/`EPERM`, nicht
// `EISDIR`.

import { rename, stat } from 'node:fs/promises';
import path from 'node:path';

import type { Ergebnis } from '../../shared/contracts/ergebnis';
import type { ExportFehlercode } from './fehlercodes';

/** Anzahl der Umbenennungs-Versuche insgesamt (erster Versuch eingeschlossen). */
export const ERSETZEN_VERSUCHE = 5
/** Wartezeiten in Millisekunden VOR dem 2., 3., 4. und 5. Versuch. */
export const ERSETZEN_BACKOFF_MS = [100, 200, 400, 800] as const

type ExportErgebnis = Ergebnis<void, ExportFehlercode>;

/**
 * Der Warteplan der Schleife: erst der sofortige Versuch (0 ms), dann je einer nach
 * jeder Wartezeit - gedeckelt auf die vertraglich zugesagte Zahl von Versuchen.
 *
 * WARUM ALS LISTE UND NICHT ALS ZAEHLER MIT FELDZUGRIFF: Ein `ERSETZEN_BACKOFF_MS[i]`
 * liefert wegen `noUncheckedIndexedAccess` `number | undefined` und lockte damit zum
 * verbotenen `!` (#193). Die Hausform aus `media-service/datei-entfernen.ts` (#86),
 * `project-store/schreibe-projekt.ts` (#46) und `config-store/schreibe-config.ts`
 * (#31) laeuft deshalb ueber die Wartezeiten selbst; im Ablauf unten steht kein
 * einziges Zahlenliteral.
 *
 * Das `slice` macht `ERSETZEN_VERSUCHE` bindend: Es werden nie mehr Versuche
 * unternommen als dort zugesagt. Beide Konstanten sind vom Vertrag eingefroren
 * (5 = 1 + 4) und duerfen hier nicht veraendert, parametrisiert oder aus einer
 * Konfiguration gelesen werden; der Test bindet sie aneinander, indem er die Zahl der
 * `rename`-Aufrufe gegen `ERSETZEN_VERSUCHE` und die Gesamtwartezeit gegen die Summe
 * von `ERSETZEN_BACKOFF_MS` prueft. Ein Auseinanderlaufen faellt dort auf, statt still
 * durchzugehen.
 */
const WARTEPLAN: readonly number[] = [0, ...ERSETZEN_BACKOFF_MS].slice(0, ERSETZEN_VERSUCHE);

/**
 * Die beiden Fehlercodes, bei denen wiederholt wird - genau die, die TK 9.6.2
 * Schritt 5 nennt.
 *
 * WARUM NUR DIESE ZWEI: Haelt ein anderer Prozess die Zieldatei geoeffnet - der
 * Datei-Explorer fuer die Vorschau, ein Virenscanner, der die eben geschriebene
 * `.part` prueft, oder ein Mediaplayer mit der alten Fassung -, scheitert das
 * Umbenennen unter Windows mit `EBUSY`/`EPERM`. Das ist ein Zustand von
 * Millisekunden bis wenigen Sekunden. `EACCES` (kein Recht), `EROFS` (Medium nur
 * lesbar), `ENOSPC` (voll) und `EIO` vergehen dagegen NICHT - dort waere Warten nur
 * eine Verzoegerung mit demselben Ausgang, und sie blockierte die streng serielle
 * Warteschlange (NFA-09).
 *
 * Auf macOS gelingt auch das Ersetzen eines geoeffneten Ziels still; der Retry-Pfad
 * wird dort im Normalfall nie betreten. Das ist der gewuenschte Zustand und kein
 * Hinweis darauf, dass die Wiederholung ueberfluessig waere.
 *
 * PREIS DIESER AUFLEGUNG, bewusst in Kauf genommen: Liegt unter `zielPfad` ein
 * VERZEICHNIS, meldet Windows ebenfalls `EPERM` (gemessen, s. Kopf). Dieser Fall
 * kostet damit einmalig die volle Staffel von rund 1,5 s, bevor `ziel_gesperrt`
 * gemeldet wird. Auseinanderhalten liesse er sich nur mit einem `stat` vorweg - und
 * das ist die verbotene eigene Pfadpruefung. Der belegte Mediaplayer ist der haeufige
 * Fall, das Verzeichnis unter dem Namen einer MP4 der seltene.
 */
const WIEDERHOLBAR = ['EBUSY', 'EPERM'] as const;

/**
 * Betriebssystem-Codes, die ein verschwundenes Ziel bedeuten (Stick waehrend des
 * Ersetzens gezogen). `ENOENT` gehoert NICHT hierher - es ist zweideutig und wird
 * gesondert aufgeloest (s. `renameFehler`). Gleiche Liste und gleiche Begruendung wie
 * in `kopieren.ts` (#186).
 */
const ZIEL_VERSCHWUNDEN = ['ENODEV', 'ENXIO'] as const;

export async function ersetzeAtomar(
  partPfad: string,   // absolut, die fertig kopierte und gesyncte Arbeitsdatei (#186)
  zielPfad: string,   // absolut, der endgültige Name: <zielOrdner>/<dateiname>
): Promise<Ergebnis<void, ExportFehlercode>> {
  // SCHRITT 1 - Formpruefung, VOR jedem Dateisystemzugriff.
  //
  // `typeof` trotz `string` in der Signatur: Der Aufrufer ist ein Auftrags-Handler,
  // dessen Eingaben aus JSON stammen koennen (Q2-Wiederholung, TK 9.3). Fehlende
  // Angaben sind ein Programmierfehler im Main, kein Fehler des Ziels - deshalb
  // `ungueltige_eingabe` und KEIN `fs`-Aufruf.
  //
  // Identische Pfade sind gesondert abgewiesen: `rename(x, x)` gelingt auf beiden
  // Plattformen klaglos und meldete damit einen Export als gelungen, bei dem die
  // Arbeitsdatei unter ihrem `.part`-Namen liegen bliebe und am Ziel nie etwas
  // ankaeme.
  //
  // KEINE eigene Pfadpruefung: kein `..`-Test, keine Normalisierung, keine
  // Existenzpruefung, kein `path.isAbsolute`. Beide Pfade kommen fertig von #188 und
  // werden UNVERAENDERT benutzt - #186 hat unter genau demselben `partPfad`-String
  // geschrieben, und eine zweite Pruefung mit abweichenden Regeln waere eine zweite
  // Wahrheit.
  if (!istGefuellterPfad(partPfad) || !istGefuellterPfad(zielPfad) || partPfad === zielPfad) {
    return fehler(
      'ungueltige_eingabe',
      'Das Ersetzen wurde ohne zwei verschiedene, gefuellte Pfade aufgerufen. Es ' +
        'wurde nichts veraendert.',
    );
  }

  // Zielordner und Dateinamen im Klartext fuer die Meldungen: Der Zielordner ist eine
  // Nutzereingabe AUSSERHALB des Projektdatenbestands (im Dialog selbst gewaehlt,
  // #183) und muss wiedererkennbar sein. `dirname`/`basename` sind Textzerlegung,
  // keine Pfadpruefung. Ein Stacktrace steht NIE in einer Meldung.
  const ordner = path.dirname(zielPfad);
  const zielName = path.basename(zielPfad);
  const partName = path.basename(partPfad);
  let letzterCode = '';

  try {
    // SCHRITT 2 - die Versuchsschleife. Hoechstens `ERSETZEN_VERSUCHE` Durchlaeufe,
    // in jedem GENAU EIN `rename` - mehr nicht.
    for (const warteMs of WARTEPLAN) {
      if (warteMs > 0) {
        // Ein echtes `await` auf einen Timer, KEINE Beschaeftigungsschleife und kein
        // `Atomics.wait`: Eine `while`-Schleife auf die Uhr blockierte den
        // Main-Prozess und damit die gesamte Oberflaeche.
        await new Promise<void>((weiter) => setTimeout(weiter, warteMs));
      }

      try {
        // DER EINE AUFRUF. Auf POSIX ersetzt `rename` eine vorhandene Zieldatei
        // unteilbar, unter Windows setzt Node `MOVEFILE_REPLACE_EXISTING` und
        // ersetzt ebenfalls (an exFAT und FAT32 gemessen, s. Kopf). Es gibt damit
        // keinen Zeitpunkt, in dem die Zieldatei fehlt.
        await rename(partPfad, zielPfad);
        // KEINE Nachkontrolle (`stat`, Groessenvergleich, erneuter Sync): Die Groesse
        // ist in #186 bereits verifiziert, die Bytes sind dort gesynct. Der gelungene
        // `rename` IST der Erfolg.
        return { ok: true, wert: undefined };
      } catch (ursache) {
        const code = systemCode(ursache);
        // SAFETY: gecastet wird nur die Listen-Form fuer includes; code ist die zu
        // pruefende Zeichenkette, WIEDERHOLBAR der konstante Pruefbestand dieser Datei.
        if (!(WIEDERHOLBAR as readonly string[]).includes(code)) {
          // Alles ausser EBUSY/EPERM: SOFORT, ohne jede Wartezeit. Die vorhandene
          // Zieldatei ist dabei unveraendert - `rename` ist entweder ganz gelungen
          // oder gar nicht.
          return await renameFehler(ursache, ordner, zielName, partName, zielPfad);
        }
        letzterCode = code;
      }
    }

    // SCHRITT 3 - alle Versuche mit `EBUSY`/`EPERM` verbraucht.
    //
    // Die Meldung sagt ausdruecklich, dass ein anderes Programm die Datei geoeffnet
    // haelt und geschlossen werden muss: Das ist die Handlungsanweisung, die den
    // Wiederholversuch (FA-17) erfolgreich macht. Ohne sie wiederholt der Nutzer
    // blind und scheitert erneut.
    //
    // KEIN `chmod`, kein Entfernen von Schreibschutz-Attributen, kein `takeown`, kein
    // Beenden fremder Prozesse: Eine gesperrte Datei ist eine Nutzer-Information,
    // kein Hindernis, das die App eigenmaechtig aus dem Weg raeumt.
    return fehler(
      'ziel_gesperrt',
      `${zielName} in ${ordner} liess sich auch nach ${String(ERSETZEN_VERSUCHE)} ` +
        `Versuchen nicht ersetzen (${letzterCode}): Die Datei ist von einem anderen ` +
        `Programm geoeffnet. Bitte das Programm schliessen - etwa einen Mediaplayer ` +
        `oder ein Vorschaufenster - und den Export erneut starten. Die vorhandene ` +
        `Datei ist unveraendert; die Arbeitsdatei ${partName} bleibt vorerst liegen.`,
    );
  } catch (ursache) {
    // Niemals `throw`: Der Aufrufer ist der Export-Handler eines Auftrags; eine
    // Ausnahme liesse den Auftrag auf `laeuft` stehen und braechte die streng
    // serielle Warteschlange fuer den Rest der Sitzung zum Stillstand (TK 9.3.5).
    return fehler(
      'unbekannter_fehler',
      `Beim Ersetzen von ${zielName} in ${ordner} ist ein unerwarteter Fehler ` +
        `aufgetreten (${beschreibung(ursache)}).`,
    );
  }
}
// - EIN Aufruf von fs.promises.rename(partPfad, zielPfad) je Versuch – mehr nicht
// - die vorhandene Zieldatei wird NIE vorher gelöscht, geleert oder umbenannt
// - nur EBUSY/EPERM lösen eine Wiederholung aus; nach dem letzten Versuch: 'ziel_gesperrt'

/**
 * Ordnet einen nicht wiederholbaren Fehler aus `rename` einem der drei fachlichen
 * Codes zu. Wird nur im Fehlerpfad betreten und meldet immer sofort.
 *
 * ZUR ENOENT-ZUORDNUNG - der einzige Punkt, an dem diese Datei etwas tut, das im
 * Issue nicht buchstaeblich vorgeschrieben ist. Die Fehlertabelle verlangt zwei
 * verschiedene Ausgaenge fuer denselben Betriebssystem-Code:
 *   - `ENOENT` und der ZIELORDNER ist nicht mehr erreichbar (Stick gezogen)
 *     -> `ziel_nicht_verfügbar`
 *   - `ENOENT` und der Zielordner IST erreichbar, also fehlt `partPfad`
 *     -> `schreib_fehler`, und die Meldung soll die verschwundene Arbeitsdatei
 *        ausdruecklich benennen
 * Aus dem Fehlerobjekt allein ist das NICHT zu unterscheiden; `rename` nennt beide
 * Pfade, unabhaengig davon, welcher die Ursache war (fuer `copyFile` in #186
 * gemessen, hier gilt dasselbe).
 *
 * Aufgeloest mit EINEM `stat` auf den ZIELORDNER - nur im Fehlerpfad, nur bei
 * `ENOENT`. Ausdruecklich NICHT auf die Zieldatei: Die bleibt unberuehrt, auch
 * lesend. Ein Metadatenzugriff auf ein Verzeichnis von wenigen Mikrosekunden, kein
 * Lesen von Dateiinhalten.
 *
 * Im Zweifel gewinnt `ziel_nicht_verfügbar` (Spiegelbild der Regel in #186): Ist der
 * Ordner nicht mehr erreichbar, war das Ziel die Ursache. Fuer den Nutzer ist das der
 * handlungsleitende Fall ("Stick wieder einstecken"), und der Export ist danach per
 * Q2 wiederholbar (FA-17).
 */
async function renameFehler(
  ursache: unknown,
  ordner: string,
  zielName: string,
  partName: string,
  zielPfad: string,
): Promise<ExportErgebnis> {
  const code = systemCode(ursache);

  // ENODEV/ENXIO bedeuten das verschwundene Geraet bereits eindeutig - hier wird
  // nicht noch nachgesehen, ob der Ordner erreichbar ist. Gleiche Auflegung wie in
  // #186.
  // SAFETY: gecastet wird nur die Listen-Form fuer includes; code ist die zu pruefende
  // Zeichenkette, ZIEL_VERSCHWUNDEN der konstante Pruefbestand dieser Datei.
  if ((ZIEL_VERSCHWUNDEN as readonly string[]).includes(code)) {
    return zielWeg(ordner, zielName, code);
  }

  if (code === 'ENOENT') {
    if (await ordnerFehlt(ordner, zielPfad)) {
      return zielWeg(ordner, zielName, code);
    }
    return fehler(
      'schreib_fehler',
      `Die Arbeitsdatei ${partName} in ${ordner} ist verschwunden, bevor sie zu ` +
        `${zielName} werden konnte. Die vorhandene Datei ist unveraendert; der ` +
        `Export muss wiederholt werden.`,
    );
  }

  if (code === 'EXDEV') {
    // PROGRAMMIERFEHLER DES AUFRUFERS, kein Nutzerfehler: #188 bildet beide Pfade aus
    // demselben Zielordner, ein Rename ist nur innerhalb einer Partition unteilbar
    // (an exFAT und FAT32 gemessen, s. Kopf). Hier wird deshalb NICHT auf
    // "kopieren und loeschen" ausgewichen - das hoebe Akzeptanzkriterium 9 auf.
    return fehler(
      'schreib_fehler',
      `${zielName} liess sich in ${ordner} nicht ersetzen, weil die Arbeitsdatei ` +
        `${partName} auf einem anderen Datentraeger liegt (EXDEV). Arbeitsdatei und ` +
        `Ziel muessen auf demselben Datentraeger liegen. Die vorhandene Datei ist ` +
        `unveraendert.`,
    );
  }

  if (code === '') {
    // Etwas, das gar kein Systemfehler ist. "Eine rohe Exception-Meldung wird nie zum
    // Code" (TK 9.1.1, Punkt 3) - also der generische Ausgang.
    return fehler(
      'unbekannter_fehler',
      `Das Ersetzen von ${zielName} in ${ordner} ist unerwartet fehlgeschlagen ` +
        `(${beschreibung(ursache)}).`,
    );
  }

  // EACCES, EROFS, EIO, EISDIR und alles Uebrige: "sonstiger I/O-Fehler" (TK 9.6.4).
  // Der Code des Betriebssystems steht in der `meldung`, NIE im `code`.
  return fehler(
    'schreib_fehler',
    `${zielName} liess sich in ${ordner} nicht ersetzen (${code}). Die vorhandene ` +
      `Datei ist unveraendert.`,
  );
}

/** Die eine Meldung fuer das verschwundene Ziel - an zwei Stellen gebraucht. */
function zielWeg(ordner: string, zielName: string, code: string): ExportErgebnis {
  return fehler(
    'ziel_nicht_verfügbar',
    `${ordner} war beim Ersetzen von ${zielName} nicht mehr erreichbar (${code}). ` +
      `Bitte den Speicher wieder anschliessen und den Export erneut starten.`,
  );
}

/**
 * `true`, wenn der Zielordner nachweislich nicht mehr erreichbar ist.
 *
 * Im Zweifel `true`: Meldet `stat` irgendeinen anderen Fehler (etwa `EIO` auf einem
 * halb abgemeldeten Wechselmedium), ist der Ordner ebenfalls nicht brauchbar.
 * Gelingt `stat`, steht der Ordner - dann lag es an `partPfad`.
 *
 * Der Sonderfall `ordner === zielPfad` faengt einen Pfad ohne Verzeichnisanteil ab:
 * `path.dirname` liefert dann `.`, und ein `stat` darauf traefe das
 * Arbeitsverzeichnis des Prozesses statt des Ziels. Diese Aussage waere wertlos, also
 * wird sie nicht getroffen - der Fall gilt als "Ordner steht", und der Ausgang ist
 * `schreib_fehler`.
 */
async function ordnerFehlt(ordner: string, zielPfad: string): Promise<boolean> {
  if (ordner === zielPfad || ordner === '.') {
    return false;
  }
  try {
    await stat(ordner);
    return false;
  } catch {
    return true;
  }
}

/**
 * Liest den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den er
 * nicht hat. Leerer String = kein verwertbarer Code (etwa bei einer unerwarteten
 * Ausnahme, die gar kein Systemfehler ist).
 */
function systemCode(ursache: unknown): string {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return '';
  }
  // SAFETY: die Zeile davor hat code in ursache belegt; der Cast macht das Feld
  // sichtbar, und der typeof-Check darunter prueft es zur Laufzeit.
  const code = (ursache as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

/**
 * Betriebssystem-Code, sonst der Meldungstext - fuer die Klartext-Ergaenzung. NIE ein
 * Stacktrace: `Error.stack` wird hier nirgends gelesen.
 */
function beschreibung(ursache: unknown): string {
  const code = systemCode(ursache);
  if (code !== '') {
    return code;
  }
  return ursache instanceof Error ? ursache.message : String(ursache);
}

/** Nicht leerer String - mehr wird an einem Pfad hier nicht geprueft. */
function istGefuellterPfad(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.length > 0;
}

/**
 * Baut das Fehler-Ergebnis. Niemals `throw`: Der Aufrufer ist ein Auftrags-Handler,
 * dessen Ergebnis ueber die IPC-Grenze reist, und dort ueberlebt eine Ausnahme nur als
 * Text - Fehlerklasse und `code` gingen verloren (TK 9.1.1).
 */
function fehler(
  code: ExportFehlercode | 'ungueltige_eingabe' | 'unbekannter_fehler',
  meldung: string,
): ExportErgebnis {
  return { ok: false, fehler: { code, meldung } };
}
