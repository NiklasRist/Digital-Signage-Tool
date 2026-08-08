// Einstiegspunkt des Main-Prozesses (#3).
//
// Diese Datei ist die EINE Stelle, an der sich beim Programmstart alles anmeldet und
// an der beim Beenden abgeschlossen wird, was noch aussteht. Die Reihenfolge unten
// ist Teil des Vertrags aus #3, nicht Geschmackssache - die Begruendung steht jeweils
// am Aufrufpunkt.
//
// STAND HEUTE: Von den dreizehn Anmeldungen, den beiden Beenden-Funktionen und den
// zwei Protokoll-Registrierungen (#9) existiert KEINE EINZIGE - sie entstehen erst in
// M1 bis M7. Sie stehen deshalb als benannte Luecken (Funktionsname + Issue-Nummer)
// an ihrem Platz. Ausdruecklich KEINE Attrappen: Eine leere Ersatzfunktion wuerde
// einen Kanal registrieren, der zu funktionieren scheint, und die echte Verdrahtung
// spaeter an der doppelten Registrierung scheitern lassen - oder, schlimmer, sie tut
// es nicht und der Renderer redet fuer immer mit der Attrappe (#3).

import path from "node:path";

import { app, BrowserWindow, session } from "electron";

/**
 * Im Entwicklungslauf setzt scripts/dev.mjs diese Variable auf die URL des
 * Vite-Devservers. Fehlt sie, laeuft die App aus dem gebauten Bestand.
 *
 * Warum eine Umgebungsvariable und keine fest hineingeschriebene URL: Der Port des
 * Devservers gehoert dem Dev-Skript (#2), nicht dem Main. Ein hart eingetragenes
 * "http://localhost:5173" waere ein stiller Integrationsfehler - er faellt erst beim
 * ersten `npm run dev` auf und wandert bei jeder Portaenderung mit.
 */
function devServerUrl(): string | undefined {
  return process.env["VITE_DEV_SERVER_URL"];
}

/**
 * Content-Security-Policy.
 *
 * Warum ueberhaupt: Die drei Sicherheitsflags (contextIsolation, sandbox,
 * nodeIntegration: false) verhindern, dass Renderer-Code an Node herankommt. Sie
 * verhindern NICHT, dass fremder Code ueberhaupt erst in die Seite gelangt. Die CSP
 * ist die zweite Haelfte der Absicherung: Sie legt fest, WOHER Skripte, Stile, Bilder,
 * Schriften und Verbindungen kommen duerfen.
 *
 * Warum zwei Fassungen: Im Entwicklungslauf laedt die Seite vom Vite-Devserver und
 * haelt eine WebSocket-Verbindung fuer den Modul-Austausch (HMR) offen. Die
 * ausgelieferte App braucht diese Verbindung nicht - dort waere die Erlaubnis reine
 * Angriffsflaeche. Die beiden Fassungen unterscheiden sich deshalb in GENAU EINER
 * Richtlinie (connect-src); jede weitere Abweichung wuerde bedeuten, dass der
 * Entwicklungslauf etwas anderes prueft als das, was ausgeliefert wird.
 *
 * Zu den einzelnen Eintraegen:
 * - `media:` in img-src/media-src ist Pflicht: Vorschau und Thumbnails laden Medien
 *   ausschliesslich ueber `media://<projektId>/<dateiname>` (TK 9.5.7, #9). Ohne den
 *   Eintrag blockiert die CSP genau den Weg, den die Architektur vorschreibt.
 * - `blob:` in img-src/media-src: das template-canvas erzeugt Segment-Bilder im
 *   Speicher (TK 9.10); solche Bilder werden ueblicherweise als blob:-URL angezeigt.
 * - `'unsafe-inline'` in style-src: Vite und React fuegen Stile zur Laufzeit ein.
 *   Das ist die einzige Lockerung in dieser Richtlinie und betrifft nur STILE, nicht
 *   Skripte - ein eingeschleuster Stil kann kein Programm ausfuehren.
 * - `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`: Diese drei Wege
 *   braucht die App nicht (keine Plugins, keine Formular-Abgaben, keine Umleitung
 *   relativer Pfade). Was nicht gebraucht wird, wird zugemacht.
 */
const CSP_GEMEINSAM = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: media:",
  "media-src 'self' blob: media:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
];

const CSP_DEV = [...CSP_GEMEINSAM, "connect-src 'self' ws:"].join("; ");
const CSP_PROD = [...CSP_GEMEINSAM, "connect-src 'self'"].join("; ");

/**
 * Haengt die CSP als Antwort-Header an jede geladene Ressource.
 *
 * Der Header-Weg ist dem `<meta http-equiv>`-Weg vorzuziehen, weil er ausserhalb des
 * Dokuments liegt: Wer spaeter die index.html anfasst, kann die Richtlinie nicht
 * versehentlich mitloeschen.
 */
function setzeCspHeader(): void {
  const richtlinie = devServerUrl() ? CSP_DEV : CSP_PROD;
  session.defaultSession.webRequest.onHeadersReceived((details, weiter) => {
    weiter({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [richtlinie],
      },
    });
  });
}

/**
 * Erzeugt das eine Fenster der App (TK 9.1.1 Punkt 10: es gibt genau eines).
 *
 * Die vier webPreferences-Flags sind nicht verhandelbar, auch nicht befristet zum
 * Debuggen: Sie sind die einzige technische Durchsetzung der Grenze "Renderer redet
 * nur ueber IPC mit dem Main". Mit `nodeIntegration: true` oder
 * `contextIsolation: false` koennte Renderer-Code direkt `require('fs')` aufrufen und
 * die project.json am D1-Schreib-Lock vorbei veraendern (TK 9.5) oder die
 * Pfad-Autoritaet (TK 9.5.7) umgehen - die Invarianten, auf denen Datenkonsistenz und
 * Reparatur-Modus aufbauen, waeren dann nur noch Konvention statt Garantie.
 */
function erstelleHauptfenster(): BrowserWindow {
  const fenster = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      // Der Preload wird von esbuild nach dist/preload/index.js gebaut (#2); sein
      // Inhalt kommt aus #4. Der Pfad ist relativ zu dist/main/, wo diese Datei
      // gebuendelt landet.
      preload: path.join(__dirname, "../preload/index.js"),
    },
  });

  const devUrl = devServerUrl();
  if (devUrl) {
    void fenster.loadURL(devUrl);
  } else {
    // ANNAHME (Layout des gepackten Bestands): dist/main/index.js liegt neben
    // dist/renderer/. Das endgueltige Layout legt erst #7 (electron-builder) fest;
    // faellt es dort anders aus, ist dies die Zeile, die nachzuziehen ist.
    void fenster.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  return fenster;
}

// ---------------------------------------------------------------------------
// Startablauf - die Reihenfolge ist Teil des Vertrags (#3)
// ---------------------------------------------------------------------------

// SCHRITT 1: registriereMediaProtokollSchema() - #9, src/main/media-protokoll.ts
// LUECKE. Muss VOR app.whenReady() laufen: Ein privilegiertes Custom-Schema, das zu
// spaet registriert wird, greift im Renderer nicht zuverlaessig. #9 darf laut eigener
// Definition of Done keine Datei ausserhalb von media-protokoll.ts aendern - wer diese
// Luecke schliesst, ist deshalb noch offen (gemeldet).

// SCHRITT 2: erzwingeEinzelInstanz(datenOrt, beiZweitemStart) - #51,
//            src/main/project-store/einzel-instanz.ts
// LUECKE. Signatur (fremder Vertrag, #51):
//   export function erzwingeEinzelInstanz(
//     datenOrt: string,
//     beiZweitemStart: () => void,
//   ): boolean
// Muss VOR dem Erzeugen des Fensters laufen, damit ein Zweitstart gar nicht erst
// anmeldet. Rueckgabe false = eine andere Instanz haelt die Sperre fuer DIESEN
// Datenort: dann sofort app.quit() und KEIN Fenster erzeugen. `beiZweitemStart` ist
// der Rueckruf, der das bestehende Fenster fokussiert - er wird von HIER uebergeben,
// weil diese Datei das Fenster besitzt. `datenOrt` kommt aus ermittleDatenOrt() (#5),
// das es ebenfalls noch nicht gibt; eine zweite, eigene Berechnung des Datenorts ist
// ausdruecklich verboten.
// Warum hier keine eigene Sperre gebaut wird: Zwei Instanzen haetten zwei unabhaengige
// Schreib-Locks auf derselben project.json - Lost Update und damit Datenkorruption
// (TK 9.5.4). Eine hier improvisierte zweite Sperre waere schlimmer als keine.

void app.whenReady().then(() => {
  // SCHRITT 3 ist erreicht (app.whenReady()).

  // SCHRITT 4: registriereMediaProtokollHandlerStub() - #9
  // LUECKE. Muss nach app.whenReady() und VOR dem Laden des Fensters stehen.

  setzeCspHeader();

  // SCHRITT 5: die ZEHN Anmeldungen OHNE Fenster, in genau dieser Reihenfolge.
  // Sie stehen vor erstelleHauptfenster(), weil keine von ihnen ein Fenster braucht.
  // Alle zehn sind heute LUECKEN - kein Ersatzaufruf, keine von Hand gebaute
  // ipcMain.handle-Registrierung, kein eigener Kanalname.
  //
  //  1. verdrahteProjectStoreIPC()            - M1
  //  2. verdrahteProjectStoreNachtragIPC()    - #153 (project:setzeEinblendung,
  //                                             project:setzeElementReferenz).
  //                                             Unmittelbar nach 1., weil beide
  //                                             denselben Kanal-Namensraum `project:`
  //                                             bedienen und eine doppelte
  //                                             Registrierung so sofort auffaellt.
  //  3. verdrahteProjectStoreNachtrag2IPC()   - #240 (project:setzeBearbeitungsstand,
  //                                             project:oeffneProjektordner),
  //                                             src/main/ipc-gateway/project-store-nachtrag-2.ts.
  //                                             Unmittelbar nach 2., aus demselben Grund.
  //  4. verdrahteConfigStoreIPC()             - M1
  //  5. verdrahteMedienIPC()                  - M3
  //  6. registriereMedienHandler()            - M3
  //  7. verdrahteVorlagenIPC()                - #109
  //  8. verdrahteVorlagenNachtragIPC()        - #255 (vorlagen:pruefeReferenzen),
  //                                             src/main/ipc-gateway/vorlagen-nachtrag.ts.
  //                                             Unmittelbar nach 7., Namensraum `vorlagen:`.
  //  9. meldeRenderHandlerAn()                - #189. Ohne sie wird ein Render-Auftrag
  //                                             eingereiht und findet keinen Handler.
  // 10. meldeExportHandlerAn()                - #190. Dasselbe fuer art: "export".

  // SCHRITT 6: Fenster erzeugen und Inhalt laden.
  const fenster = erstelleHauptfenster();

  // SCHRITT 7: die DREI Anmeldungen MIT Fenster, in genau dieser Reihenfolge. Jede
  // bekommt DASSELBE BrowserWindow als Parameter - keine sucht sich eines selbst
  // (TK 9.1.1 Punkt 10). Alle drei sind heute LUECKEN.
  //
  // 1. verdrahteQueueIPC(fenster)                  - #71, die vier Warteschlangen-
  //                                                  Kanaele und der Sender von
  //                                                  `queue:geaendert`
  // 2. verdrahteExportUndFortschrittIPC(fenster)   - #191, Kanal
  //                                                  `export:waehleExportZiel` und der
  //                                                  Sender von `render:fortschritt`
  // 3. verdrahteSpeicherstatusIPC(fenster)         - #238, die Sender von
  //                                                  `project:autoSpeichernStatus` und
  //                                                  `vorlagen:autoSpeichernStatus`,
  //                                                  src/main/ipc-gateway/speicherstatus-verdrahtung.ts.
  //                                                  Ohne sie bleibt ein gescheitertes
  //                                                  Auto-Speichern unsichtbar (NFA-02).
  //
  // Warum diese drei NACH dem Fenster stehen und das fuer ihre Aufruf-Kanaele
  // unkritisch ist: Schritt 6 STOESST das Laden nur an; der Renderer-Code laeuft erst,
  // wenn das Dokument geladen ist - die Registrierung liegt davor. Ereignisse, die
  // vorher anfallen, verfallen dagegen ausdruecklich still: "Ereignisse vor dem Aufbau
  // des Fensters verfallen still - es wird NICHT gepuffert (bindend)." (TK 9.1.1
  // Punkt 10). Deshalb wird hier nichts gepuffert und NICHT auf did-finish-load
  // gewartet.
  void fenster;

  // SCHRITT 8: raeumeVerwaisteArbeitsbereiche() - #172
  // LUECKE. Entfernt reel-*-Ordner, die ein frueherer Absturz im Temp-Bereich
  // hinterlassen hat. Wird NICHT abgewartet (kein await), und ein Fehlschlag bricht
  // den Start nicht ab: Aufraeumen ist Hygiene, kein Startkriterium - ein gesperrter
  // Ordner darf die App nicht am Starten hindern.
});

// ---------------------------------------------------------------------------
// Beenden-Ablauf
// ---------------------------------------------------------------------------

/**
 * Merkflagge fuer den zweiten Durchlauf von `before-quit`.
 *
 * Ohne sie dreht sich das Beenden im Kreis: Der erneute app.quit() am Ende von
 * schliesseAusstehendesAb() loest `before-quit` wieder aus, der Handler ruft wieder
 * preventDefault(), und das von vorn.
 *
 * GEMESSEN (Gegenprobe zu #3, Flagge entfernt, Electron 43 / Windows): `before-quit`
 * feuerte 513 Mal, danach starb der Prozess von selbst nach rund sechs Sekunden. Es
 * ist also KEINE Endlosschleife im strengen Sinn - aber ein Beenden, bei dem der
 * Beenden-Ablauf 513 Mal anlaeuft und der Prozess am Ende unkontrolliert wegbricht.
 * Sobald an dieser Stelle die echten Flushs stehen (#47, #98), hiesse das 513
 * Schreibversuche auf project.json.
 *
 * MIT Flagge feuert `before-quit` dreimal: einmal aufgehalten (der Rumpf laeuft
 * genau EINMAL), danach zweimal mit fruehem Ausstieg, weil Electron das Ereignis
 * beim tatsaechlichen Herunterfahren erneut schickt. Das ist der Normalfall und
 * kein Anlass, hier etwas zu aendern.
 */
let beendenAbgeschlossen = false;

/**
 * `before-quit` statt `close` des Fensters: Das ist der einzige Punkt, den JEDER
 * Beenden-Weg durchlaeuft (Fenster schliessen, Menue, Cmd+Q), und er liegt VOR dem
 * Schliessen der Fenster. Am `close` des Fensters aufgehaengt waere das Beenden ueber
 * das Menue nicht abgedeckt.
 */
app.on("before-quit", (ereignis) => {
  if (beendenAbgeschlossen) return;
  ereignis.preventDefault();
  void schliesseAusstehendesAb();
});

/**
 * Schliesst beim Beenden ab, was noch aussteht (Sofort-Flush, Fall 3 aus TK 9.5.4),
 * und stoesst das Beenden danach genau einmal erneut an.
 *
 * Warum das ueberhaupt sein muss: Das Auto-Speichern ist um 3-5 s entprellt (TK
 * 9.5.4). Ohne diesen Ablauf ist der Entprellungstimer genau das Loch, durch das die
 * LETZTE Aenderung verschwindet - jemand schiebt ein Element an seinen Platz,
 * schliesst das Fenster, und der Timer feuert nie mehr. Das ist kein Randfall, sondern
 * der Normalfall am Ende jeder Sitzung.
 *
 * Nur Fall 3 gehoert hierher. Die Faelle 1, 2 und 4 loesen andere Stellen aus (der
 * Auftrags-Handler beim Start eines Auftrags, oeffneProjekt, die D1-aendernden
 * Auftraege) - der Bootstrap baut sie NICHT nach.
 */
async function schliesseAusstehendesAb(): Promise<void> {
  // LUECKE 1: sofortFlush(projekt) - #47
  // Signatur (fremder Vertrag, #47):
  //   export async function sofortFlush(projekt: Project): Promise<Ergebnis<void>>
  // Schreibt einen noch ausstehenden entprellten Stand von project.json sofort und
  // bricht den Entprellungstimer ab. OFFEN und nicht hier zu erraten: Woher dieser
  // Ablauf den `projekt`-Stand nimmt. #47 verlangt vom Aufrufer das AKTUELLE Project
  // als Argument UND die Ausfuehrung innerhalb von mitD1Lock (#32) - der Bootstrap
  // haelt weder das eine noch das andere. Ein hier zusammengesuchter oder veralteter
  // Stand schriebe genau den falschen Inhalt auf die Platte, und zwar als Letztes vor
  // dem Beenden.

  // LUECKE 2: flushBestand() - #98
  // Signatur (fremder Vertrag, #98):
  //   export async function flushBestand(): Promise<Ergebnis<void, VorlagenFehlercode>>
  // Dasselbe fuer den Vorlagenbestand vorlagen.json; steht dort nichts aus, ist das
  // ein erfolgreicher Leerlauf, kein Fehler.

  // Beide Aufrufe werden EINZELN ABGEWARTET, bevor das Fenster geschlossen und der
  // Prozess beendet wird: "Beim Beenden blockiert die App, bis der Schreibvorgang
  // abgeschlossen ist (kein Schliessen mit ausstehendem Schreiben)." (TK 9.5.4)

  // OFFENER WIDERSPRUCH - hier bewusst NICHT aufgeloest:
  // Die Definition of Done von #3 verlangt, das Beenden nach den Flushs "genau einmal
  // erneut" anzustossen. TK 9.5.4 legt inzwischen aber bindend fest:
  //   "Scheitert der Sofort-Flush beim BEENDEN, schliesst die App NICHT (bindend)."
  // Dort folgen vier Schritte: Beenden abbrechen, Fehler mit zugeschnittener
  // Handlungsempfehlung zeigen, Knopf "Erneut versuchen", und als benannter Ausweg
  // "Trotzdem schliessen und Aenderungen verwerfen". Im Fehlerfall darf das Beenden
  // also gerade NICHT erneut angestossen werden, und der noetige Dialog liegt im
  // Renderer, also ausserhalb dieser Datei. Solange #47 und #98 nicht existieren, ist
  // der Fall nicht eintretbar; die Aufloesung gehoert zu #47/#98 und dem zugehoerigen
  // Oberflaechen-Issue und ist gemeldet.

  beendenAbgeschlossen = true;
  app.quit();
}

/**
 * Ohne diesen Handler bleibt der Main-Prozess unter Windows und Linux nach dem
 * Schliessen des Fensters am Leben - die App liesse sich nur ueber den Task-Manager
 * beenden, und der Entwicklungslauf haengt.
 *
 * Bewusste Abweichung von der macOS-Konvention (dort bleibt eine App ueblicherweise
 * ohne Fenster im Dock): Diese App fuehrt genau EIN Fenster (TK 9.1.1 Punkt 10) und
 * hat keinen Weg, es wieder zu oeffnen. Eine App im Dock ohne Fenster und ohne
 * Rueckweg waere schlechter als ein sauberes Beenden.
 */
app.on("window-all-closed", () => {
  app.quit();
});
