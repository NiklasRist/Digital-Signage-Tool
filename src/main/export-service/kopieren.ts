// GENERIERT aus dem Signaturblock von Issue #186.
// [export-service] Nach .part kopieren, Größe verifizieren, fsync vor der Erfolgsmeldung
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
// GERUEST-PRUEFSUMME: 0b1787c5b69187e1
//
// ERLEDIGT: Die Abschaltzeile fuer no-unused-vars ist mit dem Fuellen des Rumpfes
// entfernt - alle Importe werden jetzt benutzt.
//
// ============================================================================
// DIE STELLE, AN DER "FERTIG" WAHR WIRD
// ============================================================================
// Diese Funktion schreibt auf ein Wechselmedium, das der Nutzer abzieht, sobald die
// App "fertig" meldet. Zwei Zusagen des Vertrags haengen daran:
//
//   "**`fsync` vor Erfolg:** Erst wenn die Bytes physisch auf dem Stick sind, gilt
//   der Export als fertig - ein sofort abgezogener Stick verliert so keine
//   gepufferten Daten." (TK 9.6.3)
//
//   "**Die vorhandene Zieldatei ist geschuetzt:** Eine Datei gleichen Namens auf dem
//   Ziel wird **nie** geloescht oder ueberschrieben, bevor die neue **vollstaendig
//   kopiert und groessen-verifiziert** ist. Deshalb `.part` + Rename-mit-Ersetzen zum
//   Schluss. Ein Abbruch (Stick abgezogen, Absturz) hinterlaesst hoechstens eine
//   `.part`-Leiche, nie eine **halbe** MP4, die der TV abspielen wuerde." (TK 9.6.3)
//
// Der Zielname kommt hier deshalb gar nicht vor: Die Funktion kennt nur `partPfad`.
// Es gibt in dieser Datei keinen Schreibvorgang, der die eigentliche Zieldatei
// beruehren koennte - auch keinen lesenden.
//
// REIHENFOLGE (TK 9.6.2, Schritte 3 und 4): kopieren -> Groesse vergleichen ->
// fsync -> ERST DANN Erfolg. Jede Umstellung hebt eine der beiden Zusagen auf.
//
// KEINE WIEDERHOLUNG IN DIESER DATEI. Die Hausleiter [100, 200, 400, 800] steht in
// fuenf gebauten Dateien (u. a. `media-service/datei-entfernen.ts`) und gehoert im
// Export-Pfad allein zu `ersetzen.ts` (#187, `ERSETZEN_BACKOFF_MS`) - dort, wo
// Warten gegen ein fremdes Handle tatsaechlich hilft. Ein voller Stick oder ein
// abgezogener Stick bessert sich durch Warten nicht; ein blind wiederholter
// 2,5-GB-Kopiervorgang blockierte nur die streng serielle Warteschlange (NFA-09).
// Der Wiederholfall des Exports ist eine Auftragsfunktion: Ein Fehlschlag "landet in
// **Q2** und ist per 'erneut einreihen' wiederholbar" (TK 9.6.5).
//
// ============================================================================
// GEMESSEN AUF DIESER MASCHINE (Node 22, Windows 11) - NICHT ANGENOMMEN
// ============================================================================
// 1. `fsync` auf einem NUR LESEND geoeffneten Handle scheitert mit EPERM:
//        open(datei, 'r')  -> handle.sync() -> EPERM: operation not permitted, fsync
//        open(datei, 'r+') -> handle.sync() -> ok
//    Deshalb steht in Schritt 5 zwingend 'r+'. Mit 'r' waere die eine Zusage, fuer
//    die es diese Funktion gibt, auf Windows in JEDEM Lauf gescheitert.
//
// 2. Ein Fehler aus `copyFile` traegt IMMER BEIDE Pfade - `path` (Quelle) und `dest`
//    (Ziel) -, unabhaengig davon, welcher von beiden die Ursache war:
//        Quelle fehlt      -> ENOENT, path=<quelle>, dest=<ziel>
//        Zielordner fehlt  -> ENOENT, path=<quelle>, dest=<ziel>
//    Aus dem Fehler allein ist ENOENT also NICHT zuzuordnen. Wie das aufgeloest ist,
//    steht bei `kopierFehler`.
//
// 3. `copyFile` auf ein Verzeichnis meldet EPERM (nicht EISDIR), `unlink` auf ein
//    Verzeichnis ebenso. Beide landen damit in `schreib_fehler` - richtig, denn ein
//    Verzeichnis unter dem `.part`-Namen ist ein Schreibhindernis am Ziel.

import { copyFile, open, stat, unlink } from 'node:fs/promises';
import path from 'node:path';

import type { FileHandle } from 'node:fs/promises';

import type { Ergebnis } from '../../shared/contracts/ergebnis';
import type { ExportFehlercode } from './fehlercodes';

type ExportErgebnis = Ergebnis<void, ExportFehlercode>;

/**
 * Betriebssystem-Codes, die ein verschwundenes Ziel bedeuten (Stick waehrend des
 * Kopierens gezogen). ENOENT gehoert NICHT hierher - es ist zweideutig und wird
 * gesondert aufgeloest (s. `kopierFehler`).
 */
const ZIEL_VERSCHWUNDEN = ['ENODEV', 'ENXIO'] as const;

export async function kopiereNachPart(
  quellPfad: string,      // absolut, aus loeseExportQuelle (#185) – bereits geprüft
  partPfad: string,       // absolut, `<zielOrdner>/<dateiname>.part` – vom Aufrufer gebildet
  quellGroesse: number,   // Bytes, aus loeseExportQuelle (#185) – die Sollgröße
): Promise<Ergebnis<void, ExportFehlercode>> {
  // SCHRITT 1 - Formpruefung, VOR jedem Dateisystemzugriff.
  //
  // `typeof` trotz `string` in der Signatur: Der Aufrufer ist ein Auftrags-Handler,
  // dessen Eingaben aus JSON stammen koennen (Q2-Wiederholung, TK 9.3). Fehlende
  // Angaben sind ein Programmier- oder Datenfehler, kein Fehler des Ziels - deshalb
  // `ungueltige_eingabe` und KEIN `fs`-Aufruf.
  //
  // KEINE eigene Pfadpruefung: kein `..`-Test, keine Normalisierung, keine
  // Existenzpruefung. `quellPfad` kommt fertig von der Pfad-Autoritaet (#49 ueber
  // #185), `partPfad` von #188. Eine zweite Pruefung mit abweichenden Regeln waere
  // eine zweite Wahrheit - und #187 muss spaeter GENAU denselben String bekommen.
  if (!istGefuellterPfad(quellPfad) || !istGefuellterPfad(partPfad) || !istSollgroesse(quellGroesse)) {
    return fehler(
      'ungueltige_eingabe',
      'Der Export wurde ohne vollstaendige Angaben zu Quelle, Arbeitsdatei und ' +
        'Groesse aufgerufen. Es wurde nichts geschrieben.',
    );
  }

  // Zielordner und Dateiname im Klartext fuer die Meldungen: Der Zielordner ist eine
  // Nutzereingabe AUSSERHALB des Projektdatenbestands (im Dialog selbst gewaehlt,
  // #183) und muss wiedererkennbar sein. Der QUELLPFAD wird dagegen nie
  // ausgeschrieben - dort gilt "Der Renderer sieht **nur relative** Referenzen
  // (`dateiname`), **nie** absolute Pfade" (TK 9.5.7). `dirname`/`basename` sind
  // Textzerlegung, keine Pfadpruefung.
  const ordner = path.dirname(partPfad);
  const name = path.basename(partPfad);

  try {
    // SCHRITT 2 - alten `.part`-Rest entfernen.
    //
    // Warum ueberhaupt, wo `copyFile` doch ueberschreibt: Ein Rest unbekannter
    // Groesse macht jede spaetere Aussage ueber "vollstaendig kopiert" wackelig, und
    // auf manchen Dateisystemen bleibt bei einem kuerzeren Schreibvorgang ein
    // laengerer Rest stehen. `ENOENT` ist hier ERFOLG - es gibt nichts zu tun.
    try {
      await unlink(partPfad);
    } catch (ursache) {
      if (systemCode(ursache) !== 'ENOENT') {
        // KEIN Kopieren. Und ausdruecklich KEIN Aufraeumversuch danach: Was hier
        // liegt, gehoert einem frueheren Lauf und liess sich gerade nicht entfernen.
        return fehler(
          'schreib_fehler',
          `In ${ordner} liess sich der Rest eines frueheren Exports (${name}) nicht ` +
            `entfernen (${beschreibung(ursache)}). Es wurde nichts kopiert.`,
        );
      }
    }

    // SCHRITT 3 - kopieren.
    //
    // `copyFile` und KEIN selbstgebautes Stream-Kopieren: schnellste Systemroutine
    // auf beiden Zielplattformen, weniger Fehlerquellen, meldet ENOSPC sauber. Preis
    // ist der fehlende Byte-Fortschritt - bewusst in Kauf genommen, der Vertrag kennt
    // einen Fortschrittskanal NUR fuer den Render (TK 9.2.7).
    //
    // KEIN `COPYFILE_EXCL`: `partPfad` wurde in Schritt 2 gerade entfernt, und `EXCL`
    // erzeugte bei einem gescheiterten Entfernen eine zweite, verwirrende Ursache.
    try {
      await copyFile(quellPfad, partPfad);
    } catch (ursache) {
      return await raeumeAufUndMelde(
        partPfad,
        await kopierFehler(ursache, quellPfad, ordner, name, quellGroesse),
      );
    }

    // SCHRITT 4 - verifizieren: "Groesse von `.part` == Quellgroesse" (TK 9.6.2).
    //
    // Der Vergleich ist `===`. KEINE Toleranz, KEINE Rundung auf Blockgrenzen, KEIN
    // "mindestens 99 %": Eine Toleranz liesse genau den abgeschnittenen
    // Kopiervorgang durch, den die Pruefung erkennen soll. Und KEINE Pruefsumme - die
    // laese 2,5 GB ein zweites Mal vom Stick und verdoppelte bei USB 2.0 die
    // Exportdauer; der realistische Fehler ist der abgeschnittene, nicht der
    // verfaelschte Kopiervorgang.
    let istGroesse: number;
    try {
      istGroesse = (await stat(partPfad)).size;
    } catch (ursache) {
      return await raeumeAufUndMelde(
        partPfad,
        fehler(
          'schreib_fehler',
          `Die Groesse von ${name} in ${ordner} liess sich nach dem Kopieren nicht ` +
            `feststellen (${beschreibung(ursache)}).`,
        ),
      );
    }

    if (istGroesse !== quellGroesse) {
      return await raeumeAufUndMelde(
        partPfad,
        fehler(
          'schreib_fehler',
          `${name} in ${ordner} ist unvollstaendig: erwartet wurden ${quellGroesse} ` +
            `Bytes, angekommen sind ${istGroesse}. Die Datei wurde entfernt.`,
        ),
      );
    }

    // SCHRITT 5 - fsync. Ohne ihn bestaetigt der Kernel den Schreibvorgang, sobald
    // die Bytes im Cache liegen; auf den Stick gelangen sie erst Sekunden spaeter.
    // Wer dann abzieht, hat eine halbe MP4 auf dem Stick.
    const syncUrsache = await syncePart(partPfad);
    if (syncUrsache !== null) {
      return await raeumeAufUndMelde(
        partPfad,
        fehler(
          'schreib_fehler',
          `${name} in ${ordner} konnte nicht endgueltig auf den Zielspeicher ` +
            `geschrieben werden (${beschreibung(syncUrsache.ursache)}). Die ` +
            `unvollstaendige Arbeitsdatei wurde entfernt.`,
        ),
      );
    }

    // SCHRITT 6 - Erfolg. Erst hier, nach gelungenem `sync()` UND gelungenem
    // `close()`. Die eigentliche Zieldatei ist zu diesem Zeitpunkt unveraendert und
    // weiterhin gueltig; sie zu ersetzen ist Sache von #187.
    return { ok: true, wert: undefined };
  } catch (ursache) {
    // Niemals `throw`: Der Aufrufer ist der Export-Handler eines Auftrags; eine
    // Ausnahme liesse den Auftrag auf `laeuft` stehen und braechte die streng
    // serielle Warteschlange fuer den Rest der Sitzung zum Stillstand (TK 9.3.5).
    return await raeumeAufUndMelde(
      partPfad,
      fehler(
        'unbekannter_fehler',
        `Beim Kopieren von ${name} nach ${ordner} ist ein unerwarteter Fehler ` +
          `aufgetreten (${beschreibung(ursache)}).`,
      ),
    );
  }
}
// Reihenfolge verbindlich: kopieren -> Größe vergleichen -> fsync -> ERST DANN Erfolg melden.
// Bei jedem Fehlschlag wird die angefangene .part-Datei best-effort entfernt (s. Ablauf).
// Diese Funktion fasst die eigentliche Zieldatei NICHT an – weder lesend noch schreibend.

/**
 * Ordnet einen Fehler aus `copyFile` einem der drei fachlichen Codes zu.
 *
 * ZUR ENOENT-ZUORDNUNG - der einzige Punkt, an dem diese Datei etwas tut, das im
 * Issue nicht buchstaeblich vorgeschrieben ist. Die Fehlertabelle verlangt zwei
 * verschiedene Ausgaenge fuer denselben Code:
 *   - ENOENT auf den ZIELPFAD (Stick gezogen) -> `ziel_nicht_verfügbar`
 *   - ENOENT auf den QUELLPFAD (Datei geloescht) -> `schreib_fehler`, und die
 *     Meldung soll ausdruecklich sagen, dass die Quelldatei verschwunden ist.
 * GEMESSEN (s. Kopf, Punkt 2): Der Fehler traegt in beiden Faellen dieselben Felder;
 * eine Unterscheidung aus dem Fehlerobjekt allein ist NICHT moeglich.
 *
 * Aufgeloest mit EINEM `stat` auf die QUELLE - nur im Fehlerpfad, nur bei ENOENT,
 * und ausdruecklich nicht auf das Ziel (die Zieldatei bleibt unberuehrt, auch
 * lesend). Es ist kein zweites Lesen der Nutzdaten (das waere die verbotene
 * Pruefsumme), sondern ein Metadatenzugriff von wenigen Mikrosekunden.
 *
 * Im Zweifel gewinnt `ziel_nicht_verfügbar`: Wenn die Quelle noch da ist, war das
 * Ziel die Ursache. Fuer den Nutzer ist das der handlungsleitende Fall ("Stick
 * wieder einstecken"), und der Export ist danach per Q2 wiederholbar.
 */
async function kopierFehler(
  ursache: unknown,
  quellPfad: string,
  ordner: string,
  name: string,
  quellGroesse: number,
): Promise<ExportErgebnis> {
  const code = systemCode(ursache);

  if (code === 'ENOSPC') {
    return fehler(
      'kein_platz',
      `In ${ordner} ist kein Platz mehr fuer ${name}; benoetigt werden ` +
        `${quellGroesse} Bytes.`,
    );
  }

  if ((ZIEL_VERSCHWUNDEN as readonly string[]).includes(code)) {
    return fehler(
      'ziel_nicht_verfügbar',
      `${ordner} war waehrend des Kopierens nicht mehr erreichbar (${code}). ` +
        `${name} ist unvollstaendig geblieben.`,
    );
  }

  if (code === 'ENOENT') {
    if (await quelleFehlt(quellPfad)) {
      return fehler(
        'schreib_fehler',
        `Die Quelldatei des Exports ist verschwunden, waehrend nach ${name} kopiert ` +
          `wurde. Sie muss neu gerendert werden.`,
      );
    }
    return fehler(
      'ziel_nicht_verfügbar',
      `${ordner} war waehrend des Kopierens nicht mehr erreichbar (${code}). ` +
        `${name} ist unvollstaendig geblieben.`,
    );
  }

  if (code === '') {
    // Etwas, das gar kein Systemfehler ist. Eine rohe Ausnahme-Meldung wird NIE zum
    // Code (TK 9.1.1, Punkt 3), also der generische Ausgang.
    return fehler(
      'unbekannter_fehler',
      `Das Kopieren von ${name} nach ${ordner} ist unerwartet fehlgeschlagen ` +
        `(${beschreibung(ursache)}).`,
    );
  }

  // EACCES, EROFS, EIO, EPERM und alles Uebrige: "sonstiger I/O-Fehler beim
  // Kopieren" (TK 9.6.4). Der Betriebssystem-Code steht in der `meldung`, NIE im
  // `code`.
  return fehler(
    'schreib_fehler',
    `${name} liess sich nicht nach ${ordner} kopieren (${code}).`,
  );
}

/** `true`, wenn die Quelldatei nachweislich nicht mehr existiert. */
async function quelleFehlt(quellPfad: string): Promise<boolean> {
  try {
    await stat(quellPfad);
    return false;
  } catch (ursache) {
    return systemCode(ursache) === 'ENOENT';
  }
}

/**
 * Oeffnet die `.part`-Datei SCHREIBBAR ('r+', s. Kopf Punkt 1), erzwingt die Bytes
 * auf das Medium und schliesst den Handle in JEDEM Pfad.
 *
 * Rueckgabe `null` heisst: gesynct UND geschlossen. Jeder andere Ausgang traegt die
 * Ursache - auch ein gescheitertes `close()`, denn ein nicht sauber geschlossener
 * Handle laesst offen, ob wirklich alles auf dem Medium liegt. Der ERSTE Fehler
 * gewinnt: Er ist die Ursache, ein Folgefehler beim Schliessen verdeckte sie nur.
 *
 * KEIN Verzeichnis-`fsync`: Unter Windows gibt es ihn nicht, und er gehoerte - wenn
 * ueberhaupt - zum Rename und damit in #187. Zwei Dateien duerfen nicht dieselbe
 * Zustaendigkeit beanspruchen.
 */
async function syncePart(partPfad: string): Promise<{ ursache: unknown } | null> {
  let handle: FileHandle;
  try {
    handle = await open(partPfad, 'r+');
  } catch (ursache) {
    return { ursache };
  }

  let ergebnis: { ursache: unknown } | null = null;
  try {
    await handle.sync();
  } catch (ursache) {
    ergebnis = { ursache };
  } finally {
    try {
      await handle.close();
    } catch (ursache) {
      if (ergebnis === null) {
        ergebnis = { ursache };
      }
    }
  }
  return ergebnis;
}

/**
 * Entfernt die angefangene `.part`-Datei best-effort und gibt das UNVERAENDERTE
 * Ergebnis zurueck.
 *
 * Jeder Fehler wird verschluckt - auch `ENOENT`, auch ein nicht mehr erreichbares
 * Ziel. Begruendung: Der urspruengliche Fehler ist die Information, die der Nutzer
 * braucht; ihn durch einen Aufraeumfehler zu ersetzen, verdeckt die Ursache. Und
 * eine liegengebliebene `.part` ist laut TK 9.6.3 ein hinnehmbarer Ausgang
 * ("hinterlaesst hoechstens eine `.part`-Leiche") - im Gegensatz zu einer halben MP4
 * unter dem Zielnamen.
 */
async function raeumeAufUndMelde(
  partPfad: string,
  ergebnis: ExportErgebnis,
): Promise<ExportErgebnis> {
  try {
    await unlink(partPfad);
  } catch {
    // bewusst verschluckt - s. oben
  }
  return ergebnis;
}

/** Nicht leerer String - mehr wird an einem Pfad hier nicht geprueft. */
function istGefuellterPfad(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.length > 0;
}

/**
 * Endliche, nicht negative Zahl.
 *
 * BEWUSST NICHT geprueft wird auf Ganzzahligkeit: Die Fehlertabelle des Issues ist
 * ein geschlossener Satz und nennt "negativ, NaN, Infinity oder keine Zahl". Eine
 * gebrochene Groesse kann `stat.size` ohnehin nie erreichen und faellt in Schritt 4
 * als `schreib_fehler` auf - ein Ausgang, der die Zieldatei genauso schuetzt.
 */
function istSollgroesse(wert: unknown): wert is number {
  return typeof wert === 'number' && Number.isFinite(wert) && wert >= 0;
}

/**
 * Liest den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den
 * er nicht hat. Leerer String = kein verwertbarer Code. Hausform aus #86.
 */
function systemCode(ursache: unknown): string {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return '';
  }
  const code = (ursache as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

/**
 * Betriebssystem-Code, sonst der Meldungstext - fuer die Klartext-Ergaenzung. Ein
 * Stacktrace gehoert NIE in die Meldung.
 */
function beschreibung(ursache: unknown): string {
  const code = systemCode(ursache);
  if (code !== '') {
    return code;
  }
  return ursache instanceof Error ? ursache.message : String(ursache);
}

/**
 * Baut das Fehler-Ergebnis. Die Nutzlast ist `void`: "Wo eine Operation **nichts** zu
 * melden hat, lautet die Nutzlast `void`: **`Ergebnis<void>`** - das gelungene `ok`
 * **ist** die Information." (TK 9.1.1)
 */
function fehler(
  code: ExportFehlercode | 'ungueltige_eingabe' | 'unbekannter_fehler',
  meldung: string,
): ExportErgebnis {
  return { ok: false, fehler: { code, meldung } };
}
