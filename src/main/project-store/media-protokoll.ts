// GENERIERT aus dem Signaturblock von Issue #50.
// [project-store] media://-Auflösung: den Protokoll-Stub aus #9 füllen
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
// GERUEST-PRUEFSUMME: 808d159786025952
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

import { open, realpath, stat } from "node:fs/promises";
import path from "node:path";

import { FORMAT_WHITELIST } from "../../shared/contracts/asset";

import { holeAktivesProjekt } from "./aktives-projekt";   // #192
import { loeseAssetPfad, medienOrdner } from "./pfade";

// DIE EINZIGE STELLE, AN DER RENDERER-EINGABE ZU EINEM DATEIZUGRIFF WIRD.
//
// "Der Renderer sieht nur relative Referenzen (`dateiname`), nie absolute Pfade. Der
// Resolver stellt sicher, dass das Ziel innerhalb des `media/`-Ordners des Projekts
// bleibt (kein `..`-Ausbruch, keine Symlink-Flucht); Zugriff strikt read-only."
// (TK 9.5.7)
//
// IPC transportiert laut TK 9.1.1 nur Segment-PNGs; an die Bytes einer Mediendatei
// kommt der Renderer ausschliesslich hier. Was hier durchrutscht, faengt keine weitere
// Schicht mehr ab. Deshalb steht die Reihenfolge der Pruefungen fest und ist nicht
// Geschmack:
//
//   1. Methode (kein Dateisystem-Anfassen bei allem ausser GET)
//   2. Form der Adresse + EINMALIGE Prozent-Dekodierung
//   3. loeseAssetPfad (#49) - die einzige erlaubte Aufloesung
//   4. realpath-Gegenprobe gegen medienOrdner (#49) - Verknuepfungen
//   5. erst jetzt lesen
//
// ZUR DEKODIERUNG (Schritt 2 VOR Schritt 3, nicht danach): pfade.ts dekodiert nichts
// und sagt das ausdruecklich - "%2e%2e%2f ist hier ein ganz gewoehnlicher Name" (Vermerk
// am Ende von pfade.ts). Wer erst aufloest und danach dekodiert, prueft eine Zeichenkette
// und oeffnet eine andere; die Traversal-Pruefung von #49 waere damit vollstaendig
// umgangen.
//
// HIER ENTSTEHT KEINE ZWEITE PFAD-AUTORITAET: Diese Datei baut keinen Pfad. Sie reicht
// zwei Namen an loeseAssetPfad und rechnet dessen Ergebnis anschliessend gegen
// medienOrdner nach - beide aus #49.

/** Das Schema aus #9. Steht hier nur als Pruefwert, nicht als Registrierung. */
const SCHEMA = "media";

/**
 * Die Statuscodes. Das Issue laesst die genaue Wahl offen (STOPP-Punkt 2), verlangt
 * aber je Fehlerfall "eine Response mit einem Fehlerstatus".
 *
 * Gewaehlt sind die naheliegenden HTTP-Bedeutungen, weil ein <img>/<video> ohnehin nur
 * "geladen" oder "Fehler" kennt - der Unterschied nuetzt allein beim Suchen im
 * Entwicklerwerkzeug. KEIN Fall antwortet mit 200: Eine leere Antwort mit Erfolgsstatus
 * saehe fuer den Renderer wie ein geglueckter Ladevorgang aus, und der Platzhalter-Pfad
 * des template-canvas (TK 9.10.7) haengt genau an dieser Unterscheidung (Begruendung
 * des Stubs in #9).
 */
const STATUS = {
  ungueltigeAdresse: 400,
  abgewiesen: 403,
  nichtGefunden: 404,
  falscheMethode: 405,
  bereichUnerfuellbar: 416,
  lesefehler: 500,
} as const;

type ErlaubteEndung =
  | (typeof FORMAT_WHITELIST)["video"][number]
  | (typeof FORMAT_WHITELIST)["bild"][number];

/**
 * Endung -> Inhaltstyp, geschluesselt auf die Format-Whitelist aus #13.
 *
 * Der Record-Typ ist die Absicherung: Kommt der Whitelist eines Tages ein Format hinzu,
 * meldet der Typechecker die fehlende Zeile hier - statt dass ein Medium spaeter
 * klaglos mit falschem Inhaltstyp ausgeliefert wird und der Player nichts anzeigt.
 */
const INHALTSTYPEN: Record<ErlaubteEndung, string> = {
  mp4: "video/mp4",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function behandleMediaAnfrage(request: Request): Promise<Response> {
  // "nur GET erlaubt - jede andere Methode wird abgelehnt, ohne die Aufloesung
  // ueberhaupt zu versuchen (erzwingt 'nur lesend')." (Issue, Eingangstabelle)
  if (request.method !== "GET") {
    return fehlerAntwort(STATUS.falscheMethode, "Nur GET.");
  }

  const anfrage = zerlegeAdresse(request.url);
  if (anfrage === null) {
    return fehlerAntwort(STATUS.ungueltigeAdresse, "Ungueltige media://-Adresse.");
  }

  // C1 (entschieden 12.08.2026): NUR das offene Projekt. Der Vergleich steht bewusst VOR
  // jeder Pfadaufloesung und jedem Dateizugriff - eine abgewiesene Anfrage soll die Platte
  // nicht einmal beruehren. Vorher bediente der Handler jede projektId, und wer eine fremde
  // UUID kannte, kam an deren Medien. Enger fassen ging bis heute nicht: Es gab keinen Halter
  // fuer "welches Projekt ist offen" (#192, seit dem 12.08.2026 gebaut).
  const offen = holeAktivesProjekt();
  if (offen === null || offen.id !== anfrage.projektId) {
    return fehlerAntwort(STATUS.abgewiesen, "Adresse abgewiesen.");
  }

  const aufgeloest = loeseAssetPfad(anfrage.projektId, anfrage.dateiname);
  if (!aufgeloest.ok) {
    // Die `meldung` aus dem Ergebnis wird BEWUSST nicht uebernommen: Sie benennt zwar
    // keinen Pfad, aber die Antwort geht an den Renderer, und der soll ueber das
    // Datei-Layout nichts erfahren, was er nicht ohnehin schickt.
    return fehlerAntwort(STATUS.abgewiesen, "Adresse abgewiesen.");
  }

  // SCHRITT 4 - die Gegenprobe, die #49 nicht leisten KANN.
  //
  // Sein Vertrag verbietet jeden fs-Aufruf ("kein `fs.*`-Aufruf, keine Existenzpruefung",
  // fuenfmal in pfade.ts), eine Verknuepfung erkennt man aber nur, indem man die Platte
  // fragt. Ohne diesen Block waere `media/motiv.png` als Junction auf `C:\Users\...`
  // eine gueltige Adresse mit gueltigem Namen - und der Renderer koennte jede Datei des
  // Rechners lesen, fuer die der Prozess Rechte hat. Beide Seiten laufen durch realpath,
  // damit sie gleich normalisiert sind (Windows liefert dort die Schreibweise, die
  // tatsaechlich auf der Platte steht - ein Vergleich mit dem ungeprueften String waere
  // auf einem Dateisystem mit Gross-/Kleinschreibung nicht verlaesslich).
  let echterPfad: string;
  let echterOrdner: string;
  try {
    echterOrdner = await realpath(medienOrdner(anfrage.projektId));
    echterPfad = await realpath(aufgeloest.wert);
  } catch {
    // ENOENT (Datei fehlt - `Asset.zustand === "fehlt"`, TK 9.4.7) und ein Rechteproblem
    // fallen hier zusammen. Das ist gewollt: Beides heisst fuer den Renderer "gibt es
    // fuer dich nicht", und eine feinere Auskunft waere eine Auskunft ueber die Platte.
    return fehlerAntwort(STATUS.nichtGefunden, "Medium nicht gefunden.");
  }

  if (!liegtInnerhalb(echterOrdner, echterPfad)) {
    return fehlerAntwort(STATUS.abgewiesen, "Adresse abgewiesen.");
  }

  try {
    // Gelesen wird der DURCHGERECHNETE Pfad, nicht der aufgeloeste: Er ist frei von
    // Verknuepfungen, also kann das Oeffnen keiner Kette mehr folgen, die zwischen
    // Pruefung und Lesen entstanden waere.
    const groesse = (await stat(echterPfad)).size;
    const bereich = leseBereich(request.headers.get("range"), groesse);

    if (bereich === "unerfuellbar") {
      // RFC 9110: 416 traegt content-range mit der Gesamtgroesse, damit der Player weiss,
      // worauf er seinen Bereich haette beziehen muessen.
      return new Response(null, {
        status: STATUS.bereichUnerfuellbar,
        headers: { "content-range": `bytes */${groesse}`, "x-content-type-options": "nosniff" },
      });
    }

    const kopf: Record<string, string> = {
      "content-type": inhaltstyp(anfrage.dateiname),
      // Ohne diesen Riegel darf Chromium den Inhalt erraten. Eine Datei, die als Medium
      // ausgeliefert wird, aber wie HTML aussieht, waere in einem privilegierten Schema
      // (#9 meldet `media` als `secure` an) sonst ein Weg, fremdes Markup auszufuehren.
      "x-content-type-options": "nosniff",
      // Ohne diesen Kopf fragt <video> gar nicht erst nach Ausschnitten und spult nicht.
      "accept-ranges": "bytes",
    };

    const von = bereich === null ? 0 : bereich.von;
    const bis = bereich === null ? groesse - 1 : bereich.bis;
    const laenge = groesse === 0 ? 0 : bis - von + 1;
    if (bereich !== null) {
      kopf["content-range"] = `bytes ${von}-${bis}/${groesse}`;
    }

    // NUR den angeforderten Ausschnitt lesen, nicht die ganze Datei. Vorher stand hier
    // readFile: Bei einem zehnminuetigen Reel lagen damit rund 900 MB im Speicher des
    // Main-Prozesses, und zwar bei JEDER Vorschau.
    const griff = await open(echterPfad, "r");
    try {
      const puffer = new Uint8Array(laenge);
      if (laenge > 0) {
        await griff.read(puffer, 0, laenge, von);
      }
      kopf["content-length"] = String(laenge);
      return new Response(puffer, { status: bereich === null ? 200 : 206, headers: kopf });
    } finally {
      await griff.close();
    }
  } catch {
    // Windows-Sperre (EBUSY/EPERM), Rechteproblem, EISDIR. Der Handler wirft NICHT:
    // Ein abgelehntes Promise aus einem protocol.handle-Rumpf ist eine unbehandelte
    // Ablehnung im Main-Prozess - fuer ein fehlendes Vorschaubild ein zu hoher Preis.
    return fehlerAntwort(STATUS.lesefehler, "Medium nicht lesbar.");
  }
}
// Electron protocol.handle-Signatur (Fetch-API-Typen). Löst NIE selbst Pfade auf — jede Auflösung
// läuft über loeseAssetPfad() aus #49 (src/main/project-store/pfade.ts). Liest NUR die Datei;
// schreibt, löscht oder verändert nichts.

// ---------------------------------------------------------------------------
// Intern. Bewusst nicht exportiert: Wer eines dieser Teilstuecke braucht, braucht in
// Wahrheit den ganzen Handler - sonst entsteht ein zweiter Weg an die Bytes vorbei an
// den Pruefungen oben.
// ---------------------------------------------------------------------------

/**
 * `media://<projektId>/<dateiname>` in genau zwei Namen zerlegen - oder gar nicht.
 *
 * `null` heisst: Die Adresse entspricht dem Schema nicht. Es gibt keine Reparatur und
 * kein Zurechtbiegen; alles, was nicht exakt Host + EIN Pfadsegment ist, wird
 * abgewiesen, bevor irgendetwas aufgeloest wird.
 *
 * Query, Fragment, Anmeldedaten und Port sind ausgeschlossen, weil sie in diesem Schema
 * keine Bedeutung haben - und was keine Bedeutung hat, aber angenommen wird, ist eine
 * Stelle, an der spaeter jemand eine Bedeutung hineinliest.
 */
function zerlegeAdresse(roh: string): { projektId: string; dateiname: string } | null {
  let adresse: URL;
  try {
    adresse = new URL(roh);
  } catch {
    return null;
  }

  if (adresse.protocol !== `${SCHEMA}:`) {
    return null;
  }
  if (
    adresse.search !== "" ||
    adresse.hash !== "" ||
    adresse.username !== "" ||
    adresse.password !== "" ||
    adresse.port !== ""
  ) {
    return null;
  }

  // pathname beginnt bei einer Adresse mit Host immer mit "/", das erste Stueck ist also
  // leer. Genau zwei Stuecke heisst: genau EINE Pfadebene. "/a/b.mp4" hat drei und faellt
  // damit durch - das Issue nennt "zusaetzliche Pfadebenen" ausdruecklich als ungueltig.
  const stuecke = adresse.pathname.split("/");
  if (stuecke.length !== 2) {
    return null;
  }

  const projektId = dekodiereEinmal(adresse.hostname);
  const dateiname = dekodiereEinmal(stuecke[1] ?? "");
  if (projektId === null || dateiname === null) {
    return null;
  }
  if (projektId === "" || dateiname === "") {
    return null;
  }
  return { projektId, dateiname };
}

/**
 * GENAU EINMAL dekodieren - der sicherheitskritische Schritt dieser Datei.
 *
 * Einmal, weil `%252e` fuer "%2e" steht und nicht fuer ".": Ein zweiter Durchgang
 * erzeugte aus einem harmlosen Namen erst den Ausbruchsversuch, den anschliessend
 * niemand mehr sieht. Und ueberhaupt, weil Chromium den Dateinamen prozent-kodiert
 * durchreicht - ohne diesen Schritt suchte loeseAssetPfad nach "%C3%A4" statt "ä".
 *
 * Eine kaputte Kodierung (`%zz`, einzelnes `%`) laesst decodeURIComponent werfen; das
 * ist hier kein Fehler, sondern eine ungueltige Adresse.
 */
function dekodiereEinmal(wert: string): string | null {
  try {
    return decodeURIComponent(wert);
  } catch {
    return null;
  }
}

/**
 * Liegt `kandidat` unterhalb von `ordner`? Beide Werte sind bereits durch realpath
 * gegangen.
 *
 * Die gleichnamige Pruefung in pfade.ts ist dort nicht exportiert (und dieses Issue darf
 * jene Datei nicht anfassen). Das ist KEINE zweite Pfad-Autoritaet: Hier wird kein Pfad
 * zusammengesetzt, hier wird ein fertiger nachgerechnet.
 *
 * `path.relative` statt `startsWith`, aus demselben Grund wie dort: Ein Praefix-Vergleich
 * haelt ".../media-alt/x" faelschlich fuer einen Treffer von ".../media".
 */
function liegtInnerhalb(ordner: string, kandidat: string): boolean {
  const rel = path.relative(ordner, kandidat);
  return (
    rel.length > 0 &&
    rel !== ".." &&
    !rel.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(rel)
  );
}

/**
 * Inhaltstyp aus der Endung.
 *
 * DAS IST EINE ANNAHME, nicht der Vertrag (STOPP-Punkt 3 des Issues): Der Handler
 * bekommt nur den `dateiname`, keinen `Asset`-Datensatz mit `typ`. Sie traegt, weil der
 * Import den Dateinamen selbst vergibt ("<uuid>.<ext_kleingeschrieben>", TK 9.4.8) und
 * dabei nur Endungen aus der Whitelist zulaesst - Endung und tatsaechlicher Typ koennen
 * hier also nicht auseinanderlaufen.
 *
 * Unbekannte Endung: "application/octet-stream". NICHT abgewiesen, weil die
 * Fehlertabelle des Issues vollstaendig ist und diesen Fall nicht kennt - zusammen mit
 * "nosniff" wird eine solche Datei ausgeliefert, aber von Chromium nicht als etwas
 * anderes gedeutet.
 */
function inhaltstyp(dateiname: string): string {
  const endung = path.extname(dateiname).slice(1).toLowerCase();
  return istErlaubteEndung(endung) ? INHALTSTYPEN[endung] : "application/octet-stream";
}

function istErlaubteEndung(wert: string): wert is ErlaubteEndung {
  return Object.prototype.hasOwnProperty.call(INHALTSTYPEN, wert);
}

/**
 * Fehler reisen als Status, NIE als `Ergebnis<T>`.
 *
 * "Dieser Handler gibt deshalb niemals `Ergebnis<T>` zurueck - Fehler werden ueber den
 * HTTP-artigen Response-Status ausgedrueckt [...], nicht ueber `Fehlercode`. Wer hier
 * `Ergebnis<T>` einbaut, baut etwas, das der Renderer als `<img src="media://…">` gar
 * nicht auswerten kann." (Issue, Klarstellung zu TK 9.1.1)
 *
 * Der Text ist fest verdrahtet und enthaelt NIE einen Wert aus der Anfrage: Ein
 * zurueckgespiegelter Pfad verriete Ordnernamen, und ein zurueckgespiegelter
 * Anfragewert waere in einer Seite, die ihn anzeigt, der klassische Reflexionsfehler.
 */
/**
 * Liest den `Range`-Kopf. `null` = keiner da oder unbrauchbar (dann volle Datei; RFC 9110
 * verlangt ausdruecklich, einen kaputten Range-Kopf zu IGNORIEREN statt zu scheitern).
 * `"unerfuellbar"` = syntaktisch gueltig, aber der Anfang liegt jenseits der Datei.
 *
 * Bewusst nur die Form `bytes=<a>-<b>` mit offenem Ende. Mehrfachbereiche
 * (`bytes=0-99,200-299`) verlangten eine multipart-Antwort; kein Player fordert sie fuer Video
 * an, und ein halb gebauter Mehrfachbereich waere schlechter als keiner. Die Suffix-Form
 * (`bytes=-500`) ebenfalls nicht - dieselbe Ueberlegung.
 */
function leseBereich(
  roh: string | null,
  groesse: number,
): { von: number; bis: number } | null | "unerfuellbar" {
  if (roh === null) return null;
  const treffer = /^bytes=(\d+)-(\d*)$/.exec(roh.trim());
  if (treffer === null) return null;

  const von = Number(treffer[1]);
  if (!Number.isSafeInteger(von)) return null;
  if (von >= groesse) return "unerfuellbar";

  const bisRoh = treffer[2];
  if (bisRoh === undefined || bisRoh === "") {
    return { von, bis: groesse - 1 };
  }
  const bis = Number(bisRoh);
  if (!Number.isSafeInteger(bis) || bis < von) return null;
  // Ein Ende jenseits der Datei wird gekappt, nicht abgewiesen - so sieht es RFC 9110 vor,
  // und Player fordern regelmaessig mehr an, als noch da ist.
  return { von, bis: Math.min(bis, groesse - 1) };
}

function fehlerAntwort(status: number, text: string): Response {
  return new Response(text, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

// NICHT HIER, UND DEM ISSUE GEMELDET:
//
// 1. KEINE PRUEFUNG AUF DAS AKTIVE PROJEKT (STOPP-Punkt 1 des Issues, unbeantwortet).
//    Dieser Handler bedient JEDE projektId, zu der ein Medienordner existiert - er
//    fragt nicht, ob es das gerade geladene Projekt ist (TK 9.5.1: "Nur ein Projekt ist
//    gleichzeitig geladen"). Bewusst NICHT selbst entschieden; die engere Variante
//    braeuchte ausserdem Zugriff auf das geladene Projekt und damit einen Baustein, den
//    dieses Issue nicht hat.
//
// 2. KEINE TEILBEREICHS-ANFRAGEN (Range). Die Antwort ist immer die vollstaendige Datei
//    mit Status 200; ein `Range`-Kopf wird nicht gelesen. #9 meldet das Schema mit
//    `stream: true` an, "damit der Player spulen kann" - diese Zusage loest der Handler
//    heute NICHT ein, und ein Video wird vor dem Abspielen vollstaendig in den Speicher
//    gelesen. Das Issue verbietet ausdruecklich, das hier als Optimierung vorwegzunehmen
//    (STOPP-Punkt 4).
//
// 3. KEIN SCHUTZ GEGEN EINEN TAUSCH ZWISCHEN PRUEFUNG UND LESEN. Zwischen realpath und
//    readFile liegt ein Zeitfenster; wer in diesem Fenster die Datei durch eine
//    Verknuepfung ersetzen kann, hat Schreibrecht im Medienordner - und damit ohnehin
//    schon Zugriff auf den Datenort. Dicht bekaeme man das nur mit einem offenen
//    Dateihandle (O_NOFOLLOW), was Node plattformuebergreifend nicht hergibt.
