// GENERIERT aus dem Signaturblock von Issue #84.
// [media-service] Quelldatei ins Staging kopieren und atomar umbenennen
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
// GERUEST-PRUEFSUMME: 905689c3bfcdc740
//
// ERLEDIGT (13.08.2026): Abschaltzeile fuer no-unused-vars entfernt, der Rumpf ist
// gefuellt - alle Parameter und Importe werden benutzt.
//
// DIE EINZIGE STELLE IM PROGRAMM, AN DER BYTES IN DEN MEDIENBESTAND GELANGEN.
// Alles danach - Vorschau, Thumbnail, Normalisieren zur Render-Zeit - setzt voraus,
// dass eine Datei im Medienordner FERTIG ist, sobald sie dort unter ihrem
// endgueltigen Namen auftaucht. Genau das stellt die Zweiteilung her: erst eine
// Arbeitsdatei mit `.part`-Endung im Unterordner, dann EIN unteilbarer Rename
// (Issue #84, risiko:datenverlust).
//
// WARUM DAS STAGING IN `media/` LIEGT UND NICHT IN <Temp>:
// "`fs.rename` `.part` -> `media/<uuid>.<ext>` - atomar, weil gleiche Partition
// (Staging liegt in `media/`; cross-volume-rename waere copy+delete und nicht
// atomar)." (TK 9.4.5, Schritt 3) Ein Temp-Ordner des Betriebssystems liegt
// regelmaessig auf einer anderen Partition; die App ist portabel, der Datenort kann
// auf einem USB-Stick liegen, <Temp> liegt auf C:. `fs.rename` faellt dort auf EXDEV
// zurueck bzw. wird von Hilfsbibliotheken still durch Kopieren-und-Loeschen ersetzt -
// und ist dann NICHT MEHR UNTEILBAR. Auf dem Entwicklungsrechner faellt das nicht
// auf, weil dort oft alles auf einem Laufwerk liegt. (Dieselbe Ueberlegung hat TK
// v2.8 / E-3 fuer die fertige Ausgabedatei getroffen.)
//
// KEIN LOCK, KEIN D1-ZUGRIFF, KEIN AUFRAEUMEN:
// - "Quelle -> `media/.staging/<uuid>.<ext>.part` kopieren (langsam, ausserhalb des
//   D1-Locks)." (TK 9.4.5, Schritt 1) Diese Datei fordert kein Lock an, haelt keins
//   und weiss von keinem; "Kein zweites Lock. [...] `media-service` fuehrt kein
//   eigenes Lock und keine OS-Dateisperren ein (Over-Engineering-Falle)."
//   (TK 9.4.8, Punkt 9)
// - "Crash vor 3 -> nur eine `.part`-Leiche; Crash nach 3 vor 4 -> eine fertige
//   Waise ohne D1-Eintrag. Beides raeumt der Reconcile (9.4.7) auf." (TK 9.4.5)
//   BEIDE ZUSTAENDE SIND EINGEPLANT UND ERLAUBT. Diese Datei versucht nicht, sie zu
//   verhindern oder nachtraeglich zu bereinigen - sie loescht in KEINEM Fehlerpfad
//   eine `.part`-Datei. Wer das "sauber" nachbessert, nimmt dem Aufrufer (#85) die
//   Datei unter den Haenden weg, denn ab dem Rueckgabewert raeumt ER auf.
// - "kein periodisches Aufraeumen im laufenden Betrieb." (TK 9.4.8, Punkt 8) Kein
//   Timer, keine Suche nach fremden `.part`-Resten.
//
// KEINE PFADE SELBST ZUSAMMENBAUEN. `zielOrdner` und `endPfad` kommen fertig von der
// Pfad-Autoritaet des `project-store` (#49, `medienOrdner` / `loeseAssetPfad`) und
// werden unveraendert benutzt: kein `ermittleDatenOrt()`, kein `projects/`-Literal,
// keine `projektId` in dieser Datei. Angehaengt wird ausschliesslich STAGING_ORDNER
// und `<dateiname><PART_ENDUNG>`.
//
// DIE QUELLE WIRD NUR GELESEN - kein Verschieben, kein Loeschen, keine Zeitstempel,
// keine Rechte: "Medien werden in das Projekt kopiert (nicht referenziert) - robust
// gegen verschobene/geloeschte Originale." (TK Abschnitt 5, Punkt 1) Und kopiert
// werden BYTES: "jede Normalisierung/Konvertierung der Quelldatei (die bleibt roh;
// das Normalisieren auf das Profil geschieht erst zur Render-Zeit, 9.2.4/9.2.6)"
// gehoert nicht zum media-service (TK 9.4.1).

import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, open, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import type { Ergebnis } from '../../shared/contracts/ergebnis';

/** Ordnername des Staging-Ordners INNERHALB des Medienordners. */
export const STAGING_ORDNER = '.staging';

/** Endung der Arbeitsdatei, solange sie noch nicht fertig ist. */
export const PART_ENDUNG = '.part';

/**
 * Zeichenfolgen, die in `dateiname` einen Verzeichnisanteil erzeugen wuerden.
 *
 * "`dateiname` = `<uuid>.<ext_kleingeschrieben>`, ohne Verzeichnisanteil. Aufloesung
 * immer per `path.join(projektMediaDir, dateiname)`. Nie der Originalname, nie ein
 * gespeicherter OS-Pfad mit `\`/`/` - sonst ist das Projekt nicht zwischen Windows
 * und macOS portabel." (TK 9.4.8, Punkt 1)
 *
 * BEIDE Trenner werden geprueft, auch auf macOS: Der Dateiname wandert in die
 * Projektdatei und wird auf der anderen Plattform wieder aufgeloest - ein dort
 * unschaedliches `\` waere unter Windows ein Verzeichniswechsel.
 */
const VERBOTENE_TEILE = ['/', '\\', '..'] as const;

export async function kopiereInsStaging(
  quellPfad: string,
  zielOrdner: string,
  dateiname: string,
  meldeFortschritt?: (anteil: number) => void,
): Promise<Ergebnis<{ partPfad: string }, 'datei_nicht_gefunden' | 'kopier_fehler'>> {
  // FORMPRUEFUNG VOR JEDEM DATEISYSTEMZUGRIFF. Ein falsch geformter Dateiname ist ein
  // Fehler des Aufrufers, kein Problem der Platte - deshalb `ungueltige_eingabe` und
  // NICHT `kopier_fehler`, den TK 9.4.9 als "Disk-Fehler, Platzmangel" fuehrt.
  // `typeof` trotz `string` in der Signatur: Der Aufrufer ist ein Auftrags-Handler,
  // dessen Auftrag aus JSON stammen kann (Q2-Wiederholung), also aus einer Datei -
  // dort steht nicht zwangslaeufig das, was der Typ verspricht.
  if (typeof quellPfad !== 'string' || quellPfad.length === 0) {
    return kopierFehler('ungueltige_eingabe', 'Es wurde keine Quelldatei zum Importieren uebergeben.');
  }
  if (typeof zielOrdner !== 'string' || zielOrdner.length === 0) {
    return kopierFehler('ungueltige_eingabe', 'Es wurde kein Medienordner zum Importieren uebergeben.');
  }
  if (typeof dateiname !== 'string' || dateiname.length === 0) {
    return kopierFehler('ungueltige_eingabe', 'Es wurde kein Dateiname fuer das Medium uebergeben.');
  }
  for (const teil of VERBOTENE_TEILE) {
    if (dateiname.includes(teil)) {
      return kopierFehler(
        'ungueltige_eingabe',
        `"${dateiname}" ist kein zulaessiger Dateiname: Pfadtrenner und ".." sind darin nicht erlaubt.`,
      );
    }
  }

  // Nur der Name, nie der ganze Pfad: Der Renderer sieht "nur relative Referenzen
  // (dateiname), nie absolute Pfade" (TK 9.5.7), und eine Fehlermeldung reist ueber
  // dieselbe Grenze.
  const quellName = path.basename(quellPfad);

  // VORAB-PRUEFUNG DER QUELLE - und zwar VOR dem Anlegen des Staging-Ordners: Eine
  // nicht vorhandene Quelle darf laut Fehlertabelle nichts hinterlassen ("nichts
  // kopiert, kein Ordner angelegt").
  // Die Quellgroesse wird ZWEIMAL gebraucht: fuer den Fortschritt und fuer die
  // Vollstaendigkeitspruefung nach dem Kopieren. Beide stuetzen sich auf DIESELBE
  // Abfrage - ein zweiter `stat` koennte einen anderen Wert liefern, und dann waere
  // unklar, gegen welchen von beiden geprueft wurde.
  let quellGroesse: number;
  try {
    const angaben = await stat(quellPfad);
    // GEMESSEN auf dieser Maschine (Node 22, Windows 11): das Kopieren auf ein
    // Verzeichnis meldet EPERM, nicht EISDIR. Die von der Fehlertabelle verlangte
    // Meldung "ein Ordner ist keine Mediendatei" liesse sich also allein aus dem
    // Fehlercode nicht zuverlaessig bilden - der `stat`, den es hier ohnehin gibt,
    // beantwortet die Frage plattformunabhaengig. Das ist KEINE TOCTOU-Attrappe: Der
    // Fall wird unten zusaetzlich abgefangen, die Pruefung ersetzt das Abfangen nicht.
    if (angaben.isDirectory()) {
      return kopierFehler('kopier_fehler', `${quellName} ist ein Ordner und keine Mediendatei.`);
    }
    quellGroesse = angaben.size;
  } catch (ursache) {
    if (systemCode(ursache) === 'ENOENT') {
      return kopierFehler('datei_nicht_gefunden', `${quellName} wurde nicht gefunden.`);
    }
    return kopierFehler('kopier_fehler', `${quellName} liess sich nicht lesen (${beschreibung(ursache)}).`);
  }

  const stagingOrdner = path.join(zielOrdner, STAGING_ORDNER);
  const partPfad = path.join(stagingOrdner, dateiname + PART_ENDUNG);

  try {
    // `recursive: true` macht den Aufruf idempotent - ein bereits vorhandener Ordner
    // ist KEIN Fehler. Ein frisch erstelltes Projekt hat noch keinen `.staging`-Ordner;
    // ein eigenes Einrichtungs-Issue dafuer waere eine Reihenfolge-Abhaengigkeit ohne
    // Nutzen.
    await mkdir(stagingOrdner, { recursive: true });
  } catch (ursache) {
    return kopierFehler(
      'kopier_fehler',
      `Der Zwischenordner fuer den Import liess sich nicht anlegen (${beschreibung(ursache)}).`,
    );
  }

  let geschrieben = 0;
  letzteStufe = -1;
  try {
    // STREAM-KOPIE STATT `copyFile` - am 13.08.2026 vom User entschieden, weil das
    // Kopieren SICHTBAR sein soll. Hier stand vorher die Begruendung fuer `copyFile`
    // (schnellste Systemaufrufe, Copy-on-Write auf APFS, kein halb geschriebener
    // Stream). Der erste Teil ist der bewusst gezahlte Preis; der zweite ist unten
    // durch den Byte-Vergleich ERSETZT und damit sogar pruefbar geworden -
    // `copyFile` liefert gar keine Bytezahl.
    //
    // GEPRUEFT UND VERWORFEN: `copyFile` behalten und den Zuwachs der Zieldatei
    // messen. Unter Windows meldet sie SOFORT die volle Groesse (gemessen: 400 MiB in
    // allen elf Proben ueber 1,3 s Kopierdauer, das Dateisystem legt sie vorab an).
    // Der Balken staende ab der ersten Zehntelsekunde auf 100 % - schlimmer als
    // keiner, weil er Fertigsein behauptet.
    //
    // `pipeline` und KEIN `.pipe()` von Hand: Nur `pipeline` reicht Fehler BEIDER
    // Seiten durch und raeumt die Stroeme auf. Mit `.pipe()` bliebe ein
    // Schreibfehler unbemerkt und der Lesestrom offen - unter Windows haelt der dann
    // ein Handle auf die Quelldatei, das jedes spaetere Loeschen blockiert.
    //
    // KEIN 'wx' beim Ziel und keine Vorab-Existenzpruefung: Der Zielname enthaelt
    // eine frisch erzeugte UUID, eine Kollision im `.staging`-Ordner ist praktisch
    // ausgeschlossen, und eine Existenzpruefung waere eine TOCTOU-Attrappe. Ein Rest
    // gleichen Namens wird ueberschrieben - genau das ist gewollt, denn er kann nur
    // von einem abgestuerzten Lauf desselben Imports stammen.
    const quelle = createReadStream(quellPfad);
    quelle.on('data', (block) => {
      geschrieben += block.length;
      meldeAnteil(geschrieben, quellGroesse, meldeFortschritt);
    });
    await pipeline(quelle, createWriteStream(partPfad));

    // DIE SCHRANKE, die `copyFile` bisher implizit gegeben hat. Ein Stream, der
    // vorzeitig endet, kann "fertig" melden, ohne dass ein Fehler entsteht - etwa
    // wenn die Quelle waehrend des Lesens abgeschnitten oder der Stick abgezogen
    // wird. Ohne diesen Vergleich wanderte ein halbes Video unter gueltigem Namen in
    // die Bibliothek, und auffallen wuerde es erst als mitten im Lauf abbrechender
    // Render.
    if (geschrieben !== quellGroesse) {
      return kopierFehler(
        'kopier_fehler',
        `${quellName} wurde nur unvollstaendig kopiert (${geschrieben} von ${quellGroesse} Bytes).`,
      );
    }

    // DIE LEERE DATEI hat kein einziges `data`-Ereignis ausgeloest, also ist oben auch
    // nie gemeldet worden. Ohne diese Zeile bliebe ein solcher Import stumm - und
    // stumm sieht fuer den Nutzer aus wie haengend, gerade weil er sonst einen
    // Fortschritt gewohnt ist. Eine leere Datei ist zulaessig; ob sie als Medium
    // taugt, entscheidet ffprobe (#82), nicht das Kopieren.
    if (quellGroesse === 0) {
      meldeAnteil(0, 0, meldeFortschritt);
    }
  } catch (ursache) {
    const code = systemCode(ursache);
    // TOCTOU: Die Vorab-Pruefung oben ERSETZT dieses Abfangen nicht, sie ergaenzt es.
    // Zwischen `stat` und `copyFile` kann der Nutzer die Datei verschoben, umbenannt
    // oder den Stick abgezogen haben - derselbe Code wie bei der Vorab-Pruefung.
    if (code === 'ENOENT') {
      return kopierFehler(
        'datei_nicht_gefunden',
        `${quellName} war waehrend des Kopierens nicht mehr auffindbar.`,
      );
    }
    if (code === 'EISDIR') {
      return kopierFehler('kopier_fehler', `${quellName} ist ein Ordner und keine Mediendatei.`);
    }
    if (code === 'ENOSPC') {
      return kopierFehler(
        'kopier_fehler',
        `${quellName} liess sich nicht kopieren: Auf dem Datentraeger ist kein Platz mehr frei.`,
      );
    }
    // Auch hier bleibt eine angefangene `.part`-Datei liegen - SIE WIRD NICHT
    // GELOESCHT. Der Aufrufer bekommt bei gescheiterter Kopie keinen `partPfad` und
    // koennte sie gar nicht entfernen; zustaendig ist der Reconcile (#88), der den
    // Staging-Ordner beim Projektstart vollstaendig leert.
    return kopierFehler('kopier_fehler', `${quellName} liess sich nicht kopieren (${beschreibung(ursache)}).`);
  }

  return { ok: true, wert: { partPfad } };
}

export async function macheEndgueltig(
  partPfad: string,
  endPfad: string,
): Promise<Ergebnis<void, 'kopier_fehler'>> {
  const name = path.basename(endPfad);

  try {
    // FSYNC VOR DEM RENAME - der einzige Weg, den einzigen STILLEN Schaden dieses
    // Ablaufs auszuschliessen: Ohne ihn kann ein Absturz kurz nach dem Rename eine
    // Datei hinterlassen, die EXISTIERT und einen D1-Eintrag hat, deren Inhalt aber
    // unvollstaendig ist. Diesen Zustand erkennt der Reconcile NICHT - Name und
    // Eintrag passen ja zusammen.
    //
    // 'r+' UND NICHT 'r'. GEMESSEN auf dieser Maschine (Node 22, Windows 11): auf
    // einem nur lesend geoeffneten Handle scheitern `sync()` UND `datasync()` mit
    // EPERM ("operation not permitted, fsync"), weil FlushFileBuffers Schreibrecht
    // verlangt. Mit 'r' waere JEDER Import mit `kopier_fehler` gescheitert - und zwar
    // erst beim Kunden, wenn ein Test nur den Erfolgsfall mit Attrappe prueft.
    // 'r+' oeffnet zum Lesen und Schreiben, ohne die Datei anzulegen oder zu kuerzen.
    const griff = await open(partPfad, 'r+');
    try {
      await griff.sync();
    } finally {
      // Scheitert das Schliessen nach gelungenem `sync`, gilt der Vorgang trotzdem
      // als fehlgeschlagen (die Ausnahme verlaesst diesen Block) - und der Rename
      // unterbleibt. Lieber eine `.part`-Datei zurueckgelassen als eine
      // unvollstaendige Datei unter gueltigem Namen.
      await griff.close();
    }
  } catch (ursache) {
    // KEIN Rename. Und die `.part`-Datei wird NICHT geloescht: Der Aufrufer (#85)
    // raeumt sie weg, er kennt den `partPfad`.
    return uebernahmeFehler(
      `${name} liess sich nicht sicher auf den Datentraeger schreiben ` +
        `(${beschreibung(ursache)}); die Datei wurde deshalb nicht uebernommen.`,
    );
  }

  try {
    // DER UNTEILBARE SCHRITT. Kein Retry darum herum: Ein gescheiterter Rename ist
    // folgenlos - es entsteht kein D1-Eintrag, die zurueckgebliebene `.part`-Datei
    // raeumt der Aufrufer weg, und der Nutzer kann den Import wiederholen.
    // Wiederholversuche gehoeren dorthin, wo ein Fehlschlag DAUERHAFTEN Schaden
    // hinterlaesst: ins Loeschen (#86), wo eine nicht geloeschte Datei sonst fuer
    // immer Platz belegt.
    //
    // GEMESSEN: `rename` ersetzt ein vorhandenes Ziel ohne Nachfrage (Windows:
    // MOVEFILE_REPLACE_EXISTING). Das ist hier unschaedlich und gewollt - der
    // Zielname traegt eine frisch erzeugte UUID, ein gleichnamiges Ziel kann nur die
    // Waise eines abgestuerzten Laufs sein.
    await rename(partPfad, endPfad);
  } catch (ursache) {
    if (systemCode(ursache) === 'EXDEV') {
      // KONSTRUKTIONSFEHLER, kein Nutzerfehler - deshalb sagt die Meldung genau das.
      // Er kann nur auftreten, wenn jemand den Staging-Ordner aus `media/` heraus
      // verlegt hat; genau dann ist der Rename nicht mehr unteilbar.
      return uebernahmeFehler(
        `${name} liess sich nicht uebernehmen: Zwischenordner und Medienordner liegen auf ` +
          `verschiedenen Partitionen (EXDEV). In dieser Lage waere die Uebernahme nicht mehr ` +
          `unteilbar; der Zwischenordner gehoert in den Medienordner.`,
      );
    }
    return uebernahmeFehler(`${name} liess sich nicht uebernehmen (${beschreibung(ursache)}).`);
  }

  return { ok: true, wert: undefined };
}

/**
 * Liest den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den er
 * nicht hat. Leerer String = kein verwertbarer Code (etwa bei einer unerwarteten
 * Ausnahme, die gar kein Systemfehler ist).
 */
/**
 * Meldet den Fortschritt - GEDROSSELT auf ganze Prozent.
 *
 * WARUM ES DIE DROSSELUNG BRAUCHT: Ein Lesestrom feuert je Block, bei 64-KiB-Bloecken
 * also rund 32 000 Mal fuer eine 2-GB-Datei. Jeder Aufruf reist beim Aufrufer (#85)
 * weiter Richtung Oberflaeche; ungedrosselt waere das eine Ereignisflut, die mehr
 * Rechenzeit kostet als das Kopieren selbst.
 *
 * WARUM AUF PROZENT UND NICHT AUF ZEIT: Ein Zeitfilter braeuchte eine Uhr, und damit
 * waere der Test von der Laufzeit der Maschine abhaengig - eine schnelle Platte
 * meldete einmal, eine langsame zwanzigmal, und beides waere "richtig". Mit der
 * Prozentstufe steht die Zahl der Aufrufe fest: hoechstens 101, unabhaengig von
 * Dateigroesse und Geschwindigkeit, und der Test kann sie abzaehlen.
 *
 * Die LEERE DATEI meldet einmal `1`: Ohne Sonderfall waere die Division 0/0, und ein
 * Import ohne jede Rueckmeldung saehe aus wie ein haengender.
 */
function meldeAnteil(
  geschrieben: number,
  gesamt: number,
  melde: ((anteil: number) => void) | undefined,
): void {
  if (melde === undefined) {
    return;
  }
  if (gesamt <= 0) {
    melde(1);
    return;
  }
  const stufe = Math.floor((geschrieben / gesamt) * 100);
  if (stufe === letzteStufe) {
    return;
  }
  letzteStufe = stufe;
  melde(geschrieben / gesamt);
}

/**
 * Die zuletzt gemeldete Prozentstufe.
 *
 * MODULWEIT UND NICHT JE AUFRUF - das ist Absicht und kein Versehen: Der ganze
 * `media-service` laeuft hinter dem Torwaechter (#59), der genau EINEN Auftrag
 * gleichzeitig zulaesst (TK 9.3). Zwei Kopien nebeneinander gibt es also nicht. Der
 * Wert wird zu Beginn jedes Kopiervorgangs zurueckgesetzt; ohne das Zuruecksetzen
 * bliebe die Stufe des vorigen Imports stehen, und der naechste meldete erst wieder,
 * wenn er sie ueberholt.
 */
let letzteStufe = -1;

function systemCode(ursache: unknown): string {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return '';
  }
  // SAFETY: die Zeile davor hat code in ursache belegt; der Cast macht das Feld
  // sichtbar, und der typeof-Check darunter prueft es zur Laufzeit.
  const code = (ursache as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

/** Betriebssystem-Code, sonst der Meldungstext - fuer die Klartext-Ergaenzung. */
function beschreibung(ursache: unknown): string {
  const code = systemCode(ursache);
  if (code !== '') {
    return code;
  }
  return ursache instanceof Error ? ursache.message : String(ursache);
}

/**
 * Fehler-Ergebnis von `kopiereInsStaging`. Niemals `throw`: Diese Datei laeuft
 * innerhalb eines Auftrags-Handlers, dessen Ergebnis ueber die IPC-Grenze reist, und
 * dort ueberlebt eine Ausnahme nur als Text - Fehlerklasse und `code` gingen verloren
 * (TK 9.1.1).
 */
function kopierFehler(
  code: 'datei_nicht_gefunden' | 'kopier_fehler' | 'ungueltige_eingabe',
  meldung: string,
): Ergebnis<{ partPfad: string }, 'datei_nicht_gefunden' | 'kopier_fehler'> {
  return { ok: false, fehler: { code, meldung } };
}

/**
 * Fehler-Ergebnis von `macheEndgueltig`. Es gibt nur EINEN Code: `kopier_fehler`.
 * `datei_nicht_gefunden` steht hier bewusst nicht zur Verfuegung - eine verschwundene
 * `.part`-Datei ist kein fehlendes Medium des Nutzers, sondern ein gescheiterter
 * Import, und der Aufrufer verzweigt darauf gleich.
 */
function uebernahmeFehler(meldung: string): Ergebnis<void, 'kopier_fehler'> {
  return { ok: false, fehler: { code: 'kopier_fehler', meldung } };
}
