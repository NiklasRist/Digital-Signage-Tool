// GENERIERT aus dem Signaturblock von Issue #290.
// [marken-store] Lese-Protokoll marken:// für den Ordner marken-assets/
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
// GERUEST-PRUEFSUMME: 09bb15c90c84491a
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

import { protocol } from "electron";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

import { FORMAT_WHITELIST } from "../../shared/contracts/asset";

import { loeseMarkenDateiPfad, markenOrdner } from "./pfade";

import type { CustomScheme } from "electron";

/** Das Schema aus #290. Steht hier nur als Pruefwert, nicht als Registrierung. */
const SCHEMA = "marken";

/**
 * Die Schema-Beschreibung als DATEN, nicht als Aufruf. Der Bootstrap (#309) sammelt sie zusammen
 * mit MEDIA_SCHEMA (#9) und ruft protocol.registerSchemesAsPrivileged GENAU EINMAL auf.
 *
 * WARUM KEINE registriere...()-FUNKTION: registerSchemesAsPrivileged nimmt ein Array und darf laut
 * electron.d.ts "can be called only once" nur EINMAL gerufen werden. Zwei Registrierer - einer fuer
 * 'media', einer fuer 'marken' - haetten still entweder 'marken' unprivilegiert gelassen ODER
 * 'media' ausser Kraft gesetzt; dann fehlten in der Vorschau alle Projektmedien, ohne dass etwas
 * auf die Marken zeigt. Diese Datei ruft die Electron-API deshalb NICHT selbst auf.
 */
export const MARKEN_SCHEMA: CustomScheme = {
  scheme: "marken",
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    stream: true,
  },
};
// scheme: 'marken'
// privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
//   - dieselben VIER wie beim gebauten 'media'-Schema (#9, src/main/media-protokoll.ts).
//     TK 9.15.3: "Gleiche Bauart und gleiche Schutzregeln wie `media://` (9.5.7)".
//   - `standard`  : laesst marken://<markeId>/<dateiname> nach den ueblichen URL-Regeln in Host
//                   und Pfad zerlegen - sonst gibt es kein verlaessliches Trennen von markeId
//                   und Dateiname, und genau die beiden braucht loeseMarkenDateiPfad (#288).
//   - `secure`    : das Schema gilt als sicherer Kontext; ohne das behandelt Chromium die Inhalte
//                   wie unsicheres Fremdmaterial und blockiert sie in der geladenen Seite.
//   - `supportFetchAPI`: der Renderer laedt Logo-Bytes und Schriften VOR dem Zeichnen (TK 9.10.3).
//   - `stream`    : fuer Logos und Schriften ohne praktische Wirkung (Teilbereichs-Anfragen
//                   braucht nur <video>); MITGEFUEHRT, damit beide Schemata zeichengleich
//                   beschrieben sind und niemand je Schema neu abwaegen muss.
// UEBER EINE MOEGLICHE FUENFTE EIGENSCHAFT s. STOPP - dort und NUR dort.

/**
 * Registriert den eigentlichen Anfrage-Handler. Wird NACH app.whenReady(), vor dem Laden des
 * Hauptfensters aufgerufen – dieselbe Reihenfolge wie beim bestehenden 'media'-Handler.
 */
export function registriereMarkenProtokollHandler(): void {
  protocol.handle(SCHEMA, behandleMarkenAssetAnfrage);
}

/**
 * Electron protocol.handle-Signatur (Fetch-API-Typen). Löst NIE selbst Pfade auf – jede Auflösung
 * läuft über loeseMarkenDateiPfad() aus #288 (src/main/marken-store/pfade.ts). Liest NUR die Datei;
 * schreibt, löscht oder verändert nichts.
 */
export async function behandleMarkenAssetAnfrage(request: Request): Promise<Response> {
  // "nur `GET` – jede andere Methode wird abgelehnt, ohne die Auflösung zu versuchen"
  // (Issue, Eingangstabelle) - erzwingt "nur lesend".
  if (request.method !== "GET") {
    return fehlerAntwort(STATUS.falscheMethode, "Nur GET.");
  }

  const anfrage = zerlegeAdresse(request.url);
  if (anfrage === null) {
    return fehlerAntwort(STATUS.ungueltigeAdresse, "Ungueltige marken://-Adresse.");
  }

  const aufgeloest = loeseMarkenDateiPfad(anfrage.markeId, anfrage.dateiname);
  if (!aufgeloest.ok) {
    // Die `meldung` aus dem Ergebnis wird BEWUSST nicht in die Response uebernommen:
    // "keine Pfad-Details leaken" (Issue, Fehlerpfade).
    return fehlerAntwort(STATUS.abgewiesen, "Adresse abgewiesen.");
  }

  // SCHRITT - die Gegenprobe, die #288 nicht leisten KANN.
  //
  // Sein Vertrag verbietet jeden fs-Aufruf ("kein `fs.*`-Aufruf, keine Existenzpruefung",
  // pfade.ts), eine Verknuepfung erkennt man aber nur, indem man die Platte fragt. Ohne
  // diesen Block waere `marken-assets/<markeId>/logo.png` als Junction auf einen fremden
  // Ordner eine gueltige Adresse mit gueltigem Namen - und der Renderer koennte jede
  // Datei des Rechners lesen, fuer die der Prozess Rechte hat. TK 9.5.7 verlangt "keine
  // Symlink-Flucht" (als Invariante woertlich in diesem Issue); pfade.ts verweist
  // ausdruecklich hierher. Beide Seiten laufen durch realpath, damit sie gleich
  // normalisiert sind (Windows liefert dort die Schreibweise, die tatsaechlich auf der
  // Platte steht - ein Vergleich mit dem ungeprueften String waere auf einem Dateisystem
  // mit Gross-/Kleinschreibung nicht verlaesslich).
  let echterOrdner: string;
  let echterPfad: string;
  try {
    echterOrdner = await realpath(markenOrdner(anfrage.markeId));
    echterPfad = await realpath(aufgeloest.wert);
  } catch {
    // ENOENT (Datei entfernt - `entferneMarkenDatei` lief zwischenzeitlich) und ein
    // Rechteproblem fallen hier zusammen. Das ist gewollt: Beides heisst fuer den
    // Renderer "gibt es fuer dich nicht", und eine feinere Auskunft waere eine Auskunft
    // ueber die Platte.
    return fehlerAntwort(STATUS.nichtGefunden, "Marken-Datei nicht gefunden.");
  }

  if (!liegtInnerhalb(echterOrdner, echterPfad)) {
    return fehlerAntwort(STATUS.abgewiesen, "Adresse abgewiesen.");
  }

  try {
    // Gelesen wird der DURCHGERECHNETE Pfad, nicht der aufgeloeste: Er ist frei von
    // Verknuepfungen, also kann das Oeffnen keiner Kette mehr folgen, die zwischen
    // Pruefung und Lesen entstanden waere.
    const puffer = await readFile(echterPfad);
    return new Response(puffer, {
      status: 200,
      headers: {
        "content-type": inhaltstyp(anfrage.dateiname),
        // Ohne diesen Riegel darf Chromium den Inhalt erraten. Eine Datei, die als
        // Marken-Asset ausgeliefert wird, aber wie HTML aussieht, waere in einem
        // privilegierten Schema (`MARKEN_SCHEMA` meldet `marken` als `secure` an) sonst
        // ein Weg, fremdes Markup auszufuehren.
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    // Windows-Sperre (EBUSY/EPERM), Rechteproblem, EISDIR. Der Handler wirft NICHT:
    // Ein abgelehntes Promise aus einem protocol.handle-Rumpf ist eine unbehandelte
    // Ablehnung im Main-Prozess - fuer eine fehlende Vorschau eine zu teuer bezahlte
    // Instabilitaet (Fehlerpfade des Issues).
    return fehlerAntwort(STATUS.lesefehler, "Marken-Datei nicht lesbar.");
  }
}

// ---------------------------------------------------------------------------
// Intern. Bewusst nicht exportiert: Wer eines dieser Teilstuecke braucht, braucht in
// Wahrheit den ganzen Handler - sonst entsteht ein zweiter Weg an die Bytes vorbei an
// den Pruefungen oben.
// ---------------------------------------------------------------------------

/**
 * Die Statuscodes. Der STOPP-Block des Issues laesst die genaue Wahl offen ("wie bei
 * media:// (M1-38) nicht selbst festlegen, wenn die UI sie ohnehin nicht differenziert"),
 * verlangt aber je Fehlerfall "eine Response mit einem Fehlerstatus".
 *
 * Gewaehlt sind die NAHELIEGENDEN HTTP-Bedeutungen - dieselben wie im gebauten
 * 'media'-Handler (#50, src/main/project-store/media-protokoll.ts), denn ein
 * <img>/<video>/FontFace kennt ohnehin nur "geladen" oder "Fehler"; der Unterschied
 * nuetzt allein beim Suchen im Entwicklerwerkzeug. KEIN Fall antwortet mit 200: Eine
 * leere Antwort mit Erfolgsstatus saehe fuer den Renderer wie ein geglueckter
 * Ladevorgang aus, und der Platzhalter-Pfad des template-canvas (TK 9.10.7) haengt genau
 * an dieser Unterscheidung.
 */
const STATUS = {
  ungueltigeAdresse: 400,
  abgewiesen: 403,
  nichtGefunden: 404,
  falscheMethode: 405,
  lesefehler: 500,
} as const;

type ErlaubteEndung =
  | (typeof FORMAT_WHITELIST)["bild"][number]
  | "woff2";

/**
 * Endung -> Inhaltstyp. Die Bild-Whitelist (9.4.2) plus `.woff2` - "Format-Whitelist:
 * `.woff2` fuer Schriften, die Bild-Whitelist (9.4.2) fuer Logos" (TK 9.15.3).
 *
 * DAS IST EINE ANNAHME, nicht der Vertrag (STOPP-Punkt des Issues: "allein aus der
 * Dateiendung geraten oder zusaetzlicher Kontext noetig? Nicht entschieden."). Sie
 * traegt aus demselben Grund wie im 'media'-Handler (#50): Der Import vergibt den
 * Dateinamen selbst und laesst nur Endungen aus der Whitelist zu - Endung und
 * tatsaechlicher Typ koennen hier also nicht auseinanderlaufen. Der Record-Typ ist die
 * Absicherung: Kommt der Whitelist eines Tages ein Format hinzu, meldet der Typechecker
 * die fehlende Zeile hier.
 */
const INHALTSTYPEN: Record<ErlaubteEndung, string> = {
  woff2: "font/woff2",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * `marken://<markeId>/<dateiname>` in genau zwei Namen zerlegen - oder gar nicht.
 *
 * `null` heisst: Die Adresse entspricht dem Schema nicht. Es gibt keine Reparatur und
 * kein Zurechtbiegen; alles, was nicht exakt Host + EIN Pfadsegment ist, wird
 * abgewiesen, bevor irgendetwas aufgeloest wird (Issue, Eingangstabelle).
 *
 * Query, Fragment, Anmeldedaten und Port sind ausgeschlossen, weil sie in diesem Schema
 * keine Bedeutung haben - und was keine Bedeutung hat, aber angenommen wird, ist eine
 * Stelle, an der spaeter jemand eine Bedeutung hineinliest.
 */
function zerlegeAdresse(roh: string): { markeId: string; dateiname: string } | null {
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
  // leer. Genau zwei Stuecke heisst: genau EINE Pfadebene. "/a/b.woff2" hat drei und
  // faellt damit durch.
  const stuecke = adresse.pathname.split("/");
  if (stuecke.length !== 2) {
    return null;
  }

  const markeId = dekodiereEinmal(adresse.hostname);
  const dateiname = dekodiereEinmal(stuecke[1] ?? "");
  if (markeId === null || dateiname === null) {
    return null;
  }
  if (markeId === "" || dateiname === "") {
    return null;
  }
  return { markeId, dateiname };
}

/**
 * GENAU EINMAL dekodieren - der sicherheitskritische Schritt dieser Datei.
 *
 * Einmal, weil `%252e` fuer "%2e" steht und nicht fuer ".": Ein zweiter Durchgang
 * erzeugte aus einem harmlosen Namen erst den Ausbruchsversuch, den anschliessend
 * niemand mehr sieht. Und ueberhaupt, weil Chromium den Dateinamen prozent-kodiert
 * durchreicht - ohne diesen Schritt suchte loeseMarkenDateiPfad nach "%C3%A4" statt "ä".
 *
 * Dekodiert wird VOR der Aufloesung, nicht danach: pfade.ts dekodiert nichts und sagt
 * das ausdruecklich - "%2e%2e%2f ist hier ein ganz gewoehnlicher Name" (Vermerk am Ende
 * von pfade.ts). Wer erst aufloest und danach dekodiert, prueft eine Zeichenkette und
 * oeffnet eine andere; die Traversal-Pruefung von #288 waere damit vollstaendig umgangen.
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
 * haelt "<ordner>-alt/x" faelschlich fuer einen Treffer von "<ordner>".
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
 * Inhaltstyp aus der Endung. Unbekannte Endung: "application/octet-stream". NICHT
 * abgewiesen, weil die Fehlertabelle des Issues vollstaendig ist und diesen Fall nicht
 * kennt - zusammen mit "nosniff" wird eine solche Datei ausgeliefert, aber von Chromium
 * nicht als etwas anderes gedeutet.
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
 * "Ein Protokoll-Handler ist kein IPC-Kanal; er beantwortet eine Fetch-artige `Request`
 * mit einer `Response`. Wer hier `Ergebnis<T>` einbaut, baut etwas, das der Renderer als
 * `<link rel="preload">`/`FontFace`/`<img src="marken://…">` gar nicht auswerten kann."
 * (Issue, Klarstellung zu TK 9.1.1)
 *
 * Der Text ist fest verdrahtet und enthaelt NIE einen Wert aus der Anfrage: Ein
 * zurueckgespiegelter Pfad verriete Ordnernamen, und ein zurueckgespiegelter
 * Anfragewert waere in einer Seite, die ihn anzeigt, der klassische Reflexionsfehler.
 */
function fehlerAntwort(status: number, text: string): Response {
  return new Response(text, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

// NICHT HIER, UND DEM ISSUE GEMELDET (STOPP-Block):
//
// 1. KEIN `corsEnabled`. Die fuenfte Eigenschaft ist ein EXPERIMENT (STOPP-Block des
//    Issues): Ob `FontFace` eine importierte Schrift ohne `corsEnabled: true` ueberhaupt
//    laedt, ist erst zu MESSEN. DoD: "`corsEnabled` ist nicht gesetzt, solange die im
//    STOPP-Block benannte Probe nicht gelaufen und ihr Ergebnis nicht abgenommen ist."
//    Diese Datei laesst die Eigenschaft weg; wer die Probe positiv abschliesst, traegt
//    sie an der EINEN Stelle ein (#309, Bootstrap).
//
// 2. KEINE PRUEFUNG, OB DIE MARKE EXISTIERT (STOPP-Punkt des Issues, unbeantwortet):
//    "Gilt die Anfrage fuer jede markeId, oder nur fuer Marken, die tatsaechlich
//    existieren?" Analog zur offenen Frage bei media:// bedient dieser Handler JEDE
//    markeId, zu der ein Ordner mit der angefragten Datei existiert - er fragt nicht,
//    ob die Marke im Bestand des marken-store gefuehrt wird. Bewusst NICHT selbst
//    entschieden; eine Bestandspruefung braeuchte `leseMarke` (ein Baustein, der erst
//    mit einem spaeteren M8-Issue kommt).
//
// 3. KEINE GENAUEN STATUSCODES VORGEGEBEN (STOPP-Punkt des Issues). Die Wahl oben
//    (400/403/404/405/500) ist die naheliegende HTTP-Lesart, uebernommen aus dem
//    gebauten 'media'-Handler (#50) - nicht als Vertrag gemeint, sondern als pragmatisch
//    eindeutige Antwort, solange die UI die Codes nicht differenziert.
//
// 4. KEIN SCHUTZ GEGEN EINEN TAUSCH ZWISCHEN PRUEFUNG UND LESEN. Zwischen realpath und
//    readFile liegt ein Zeitfenster; wer in diesem Fenster die Datei durch eine
//    Verknuepfung ersetzen kann, hat Schreibrecht im Marken-Ordner - und damit ohnehin
//    schon Zugriff auf den Datenort. Dicht bekaeme man das nur mit einem offenen
//    Dateihandle (O_NOFOLLOW), was Node plattformuebergreifend nicht hergibt (derselbe
//    Vorbehalt wie im 'media'-Handler, #50).
