// Einstiegspunkt des Main-Prozesses (#3).
//
// Diese Datei ist die EINE Stelle, an der sich beim Programmstart alles anmeldet und
// an der beim Beenden abgeschlossen wird, was noch aussteht. Die Reihenfolge unten
// ist Teil des Vertrags aus #3, nicht Geschmackssache - die Begruendung steht jeweils
// am Aufrufpunkt.
//
// STAND HEUTE (07.10.2026, nach #309): Verdrahtet ist alles, dessen Funktion einen
// echten Rumpf hat - nachgeschlagen in der jeweils definierenden Datei, nicht im Issue:
//   - der EINE Protokoll-Registrierungs-Aufruf mit [MEDIA_SCHEMA (#9/#321), MARKEN_SCHEMA (#290)],
//     Schritt 1; plus die beiden Protokoll-Handler (#9, #290, Schritt 4 und 4b)
//   - Schritt 5, die Positionen 1 (#76), 2 (#153), 3 (#240, mit #274), 4 (#77),
//     5 (#93), 6 (#92), 7 (#109), 8 (#255, mit #274), 9 (#189), 10 (#190), 11 (#334)
//     und 12 (#304) sowie die dreizehnte Anmeldung 13 (#323, Nachzug 07.10.) -
//     REGISTRIERUNGEN INSGESAMT: SIEBZEHN (dreizehn ohne Fenster + vier mit Fenster)
//   - Schritt 7, Positionen 1 (#71), 2 (#191), 3 (#238, mit #274) und 4 (#304)
//   - Schritt 8 (#172)
//   - alle drei Beenden-Flushs (#47, #98, #277)
// AUSSERHALB dieser Liste steht Schritt 2 (Einzel-Instanz, #51) als Sonderfall
// unveraendert: erzwingeEinzelInstanz liefert `StartBefund` statt des in #3 zitierten
// `boolean` - eine Vertragsabweichung, die erst zu klaeren ist. Die Markierung bei
// SCHRITT 2 bleibt deshalb stehen.
// Die M8-Eintraege aus #309 stehen seit heute drin; der Nachzug #323 (dreizehnte
// Anmeldung) kommt spaeter. Die Lueckenlosigkeit von src/main/index.ts stellt #331 fest.
// Ausdruecklich KEINE Attrappen: Eine leere Ersatzfunktion wuerde
// einen Kanal registrieren, der zu funktionieren scheint, und die echte Verdrahtung
// spaeter an der doppelten Registrierung scheitern lassen - oder, schlimmer, sie tut
// es nicht und der Renderer redet fuer immer mit der Attrappe (#3).

import path from "node:path";

import { app, BrowserWindow, dialog, Menu, protocol, session } from "electron";

import { verdrahteQueueIPC } from "./auftrags-manager/ipc-verdrahtung";
import { meldeExportHandlerAn } from "./export-service/handler-anmeldung";
import {
  ermittleFfmpegPfad,
  ermittleFfprobePfad,
  pruefeFfmpegVerfuegbar,
  pruefeFfprobeVerfuegbar,
} from "./ffmpeg-pfad";
import { verdrahteConfigStoreIPC } from "./ipc-gateway/config-store-verdrahtung";
import { verdrahteExportUndFortschrittIPC } from "./ipc-gateway/export-verdrahtung";
import { verdrahteProjectStoreNachtragIPC } from "./ipc-gateway/project-store-nachtrag";
import { verdrahteProjectStoreNachtrag2IPC } from "./ipc-gateway/project-store-nachtrag-2";
import { verdrahteProjectStoreNachtrag3IPC } from "./ipc-gateway/project-store-nachtrag-3"; // #323
import { verdrahteProjectStoreNachtrag4IPC } from "./ipc-gateway/project-store-nachtrag-4";
import { verdrahteProjectStoreNachtrag5IPC } from "./ipc-gateway/project-store-nachtrag-5"; // #426
import { verdrahteProjectStoreIPC } from "./ipc-gateway/project-store-verdrahtung";
import { verdrahteSpeicherstatusIPC } from "./ipc-gateway/speicherstatus-verdrahtung";
import { verdrahteMarkenSpeicherstatusIPC } from "./ipc-gateway/marken-speicherstatus-verdrahtung"; // #304
import { verdrahteMarkenIPC } from "./ipc-gateway/marken-verdrahtung"; // #304
import {
  MEDIA_SCHEMA,
  registriereMediaProtokollHandler,
} from "./media-protokoll";
import { registriereMedienHandler } from "./media-service/handler-registrierung";
import { verdrahteMedienIPC } from "./media-service/ipc-verdrahtung";
import { MARKEN_SCHEMA, registriereMarkenProtokollHandler } from "./marken-store/marken-protokoll"; // #290
import { flushBestand as flushMarkenBestand } from "./marken-store/schreibe-marken"; // #277, ALIAS-PFLICHT
import { pruefeBeendenUndFlush, flushesBeimBeendenOhneDialogAus } from "./beenden-ablauf"; // #336, #427
import { menueVorlage } from "./anwendungs-menue"; // #431
import { erzwingeEinzelInstanz } from "./project-store/einzel-instanz"; // #51, SCHRITT 2
import { ermittleDatenOrt } from "./datenort"; // #5, Pfad-Autoritaet
import { flushBeimBeenden } from "./project-store/auto-speichern";
import { raeumeVerwaisteArbeitsbereiche } from "./render-service/arbeitsbereich";
import { meldeRenderHandlerAn } from "./render-service/handler-anmeldung";
import { flushBestand } from "./vorlagen-store/schreibe-vorlagen";
import { verdrahteVorlagenIPC } from "./vorlagen-store/ipc-verdrahtung";
import { verdrahteVorlagenNachtragIPC } from "./ipc-gateway/vorlagen-nachtrag";

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

// `media:` steht ABSICHTLICH NICHT in connect-src, obwohl #9 das Schema mit dem
// Privileg `supportFetchAPI: true` anmeldet.
//
// Gemessen beim Bauen von #9: `fetch('media://...')` scheitert auch dann, wenn
// connect-src es erlaubt - und der Protokoll-Handler wird dabei NICHT EINMAL ERREICHT
// (nachgewiesen mit einer Protokollzeile im Handler selbst). Die Ursache liegt also
// nicht in der CSP, sondern davor: `media://` ist gegenueber der Seite ein fremder
// Ursprung, und Electron kennt dafuer ein eigenes Schema-Privileg (`corsEnabled`), das
// in der verbindlichen Signatur von #9 nicht steht.
//
// Ein `media:` in connect-src waere daher heute eine Erlaubnis, die nichts
// freischaltet. Wird `corsEnabled` spaeter ergaenzt, gehoert dieser Eintrag im selben
// Zug dazu - vorher nicht. Der Ladeweg ueber <img>/<video> ist davon nicht betroffen:
// er faellt unter img-src/media-src, erreicht den Handler und funktioniert (in beiden
// Modi geprueft).
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
// Die eine Modulebene-Fensterreferenz fuer den Beenden-Ablauf (#336):
// `pruefeBeendenUndFlush(fenster)` braucht dieselbe Referenz wie Schritt 7.
let hauptfenster: BrowserWindow | null = null;

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
      preload: path.join(__dirname, "../preload/index.cjs"),
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

  hauptfenster = fenster;
  return fenster;
}

/**
 * Prueft die beiden mitgelieferten Binaries (#6) und bricht bei einem Fehlschlag den
 * Start ab.
 *
 * @returns true, wenn beide benutzbar sind und der Start weitergehen darf.
 *
 * Die Meldung nennt den GEPRUEFTEN PFAD. Ohne ihn steht der Nutzer vor "ffmpeg fehlt"
 * und hat keinen Anhaltspunkt, wo die App gesucht hat - beim portablen Betrieb ist
 * genau das die entscheidende Angabe.
 */
async function pruefeBinariesOderBrichAb(): Promise<boolean> {
  const ffmpegPfad = ermittleFfmpegPfad();
  const ffprobePfad = ermittleFfprobePfad();

  const [ffmpegOk, ffprobeOk] = await Promise.all([
    pruefeFfmpegVerfuegbar(ffmpegPfad),
    pruefeFfprobeVerfuegbar(ffprobePfad),
  ]);

  if (ffmpegOk && ffprobeOk) {
    return true;
  }

  // Beide Zeilen werden gezeigt, nicht nur die erste fehlgeschlagene: Fehlen beide,
  // ist ein Bericht ueber eines davon irrefuehrend.
  const zeilen = [
    "Die Anwendung kann nicht starten, weil ein mitgeliefertes Programm fehlt oder",
    "nicht ausfuehrbar ist. Das ist ein Fehler der Auslieferung, kein Bedienfehler.",
    "",
    `ffmpeg  (Video-Ausgabe): ${ffmpegOk ? "in Ordnung" : "NICHT BENUTZBAR"}`,
    `   ${ffmpegPfad || "(kein Pfad ermittelt)"}`,
    `ffprobe (Medien-Import): ${ffprobeOk ? "in Ordnung" : "NICHT BENUTZBAR"}`,
    `   ${ffprobePfad || "(kein Pfad ermittelt)"}`,
  ];
  dialog.showErrorBox("Digital-Signage-Tool: Start nicht moeglich", zeilen.join("\n"));

  // `exit` statt `quit`: `quit` durchliefe den Beenden-Ablauf mit den Sofort-Flushs -
  // dabei ist hier noch nichts geladen, was gespeichert werden koennte.
  app.exit(1);
  return false;
}

// ---------------------------------------------------------------------------
// Startablauf - die Reihenfolge ist Teil des Vertrags (#3)
// ---------------------------------------------------------------------------

// SCHRITT 1: Muss VOR app.whenReady() laufen. Ein privilegiertes Custom-Schema, das
// zu spaet angemeldet wird, greift im Renderer nicht zuverlaessig - und zwar ohne
// Fehlermeldung.
//
// Der EINMAL-ZWANG (Electron 43.2.0, electron.d.ts): "This method can only be used
// before the ready event of the app module gets emitted and can be called only once."
// Zwei Registrier-Funktionen waeren zwei Aufrufe - und haetten BEIDE Ausgaenge still
// gemacht. Deshalb liefern die besitzenden Module ihre Schema-Beschreibung als DATEN
// (MEDIA_SCHEMA #9/#321, MARKEN_SCHEMA #290) und DIESE Stelle ruft GENAU EINMAL mit
// dem Array auf. MEDIA_SCHEMA zuerst: media ist das aeltere Protokoll und stand schon
// da; jedes kuenftige Protokoll reiht sich hinten ein.
//
// Die Konstanten werden UNVERAENDERT durchgereicht - kein Feld ergaenzt, keins
// ueberschrieben (corsEnabled bleibt bewusst ungesetzt, Experiment in #290).
protocol.registerSchemesAsPrivileged([MEDIA_SCHEMA, MARKEN_SCHEMA]);

// SCHRITT 2: erzwingeEinzelInstanz(datenOrt, beiZweitemStart) - #51,
//            src/main/project-store/einzel-instanz.ts
// (#331, Abschlussglied der Kette):
const startBefund = erzwingeEinzelInstanz(ermittleDatenOrt(), () => {
  // `beiZweitemStart` - HIER uebergeben, weil diese Datei das Fenster besitzt (#51):
  if (hauptfenster !== null && !hauptfenster.isDestroyed()) hauptfenster.focus();
});
if (startBefund === 'belegt') {
  // Eine andere Instanz haelt die Sperre: sofort beenden, KEIN Fenster erzeugen (#51).
  app.quit();
} else if (startBefund === 'datenort_nicht_beschreibbar') {
  // TK 9.5.4 (v3.20): generischer Startdialog "Erneut versuchen" / "Beenden".
  for (;;) {
    const wahl = dialog.showMessageBoxSync({
      type: "warning",
      title: "Digital-Signage-Tool: Start nicht moeglich",
      message: "Der Datenort ist nicht beschreibbar. Waehle einen anderen Speicherort.",
      buttons: ["Erneut versuchen", "Beenden"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });
    if (wahl !== 0) break;
    const neuerVersuch = erzwingeEinzelInstanz(ermittleDatenOrt(), () => {
      // Dieselbe Aufgabe wie oben: das bestehende Fenster fokussieren.
      if (hauptfenster !== null && !hauptfenster.isDestroyed()) hauptfenster.focus();
    });
    if (neuerVersuch !== 'datenort_nicht_beschreibbar') break;
  }
}
// 'frei': diese Instanz haelt die Sperre - der Start laeuft gewoehnlich weiter.
// Warum hier keine eigene Sperre gebaut wird: Zwei Instanzen haetten zwei unabhaengige
// Schreib-Locks auf derselben project.json - Lost Update und damit Datenkorruption
// (TK 9.5.4). Eine hier improvisierte zweite Sperre waere schlimmer als keine.

void app.whenReady().then(async () => {
  // SCHRITT 3 ist erreicht (app.whenReady()).

  // SCHRITT 3a - SELBSTTEST DER BEIDEN BINARIES (#6).
  //
  // Steht NICHT in der urspruenglichen Reihenfolge von #3; #6 verlangt den Aufruf
  // "beim App-Start (#3-Bootstrap)", ohne die Stelle zu nennen. Er steht hier ganz
  // vorn, weil ein Abbruch alles Weitere ueberfluessig macht: Es waere sinnlos,
  // Kanaele anzumelden und ein Fenster zu bauen, um dann doch abzubrechen.
  //
  // ENTSCHIEDEN (Produktentscheidung, 08.08.2026): Faellt EINER der beiden Tests
  // durch, startet die App NICHT. Beide Binaries werden mitgeliefert - fehlt eines,
  // ist die Auslieferung defekt, und das kann das Studio-Personal nicht beheben. Eine
  // halb laufende App erzeugt spaeter Fehler, die niemand mehr auf diese Ursache
  // zurueckfuehrt: ohne ffmpeg scheitert jeder Render, ohne ffprobe jeder Import - und
  // zwar weit entfernt von hier.
  if (!(await pruefeBinariesOderBrichAb())) {
    return;
  }

  // #431: das EIGENE Anwendungsmenue. Ohne diesen Aufruf legt Electron auf macOS ein
  // Standardmenue mit `Edit -> Undo/Redo (Cmd+Z / Shift+Cmd+Z)` an; diese Acceleratoren
  // schlucken Cmd+Z, bevor der Renderer (#350) es sieht. Die Vorlage laesst Undo/Redo in
  // der Edit-Gruppe weg (Begruendung: anwendungs-menue.ts), damit Cmd+Z die Seite erreicht.
  // NUR auf macOS: dort gibt es das Standardmenue; Windows/Linux bekommen kein Menue.
  if (process.platform === "darwin") {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menueVorlage()));
  } else {
    Menu.setApplicationMenu(null);
  }

  // SCHRITT 4: Muss nach app.whenReady() und VOR dem Laden des Fensters stehen.
  // #340: der ECHTE media://-Handler (#49/#50) - Aufloesung statt Stub; die Aufloesung
  // liegt im project-store (Pfad-Autoritaet, TK 9.5.7). Der bisherige Stub
  // (registriereMediaProtokollHandlerStub) beantwortete JEDE Anfrage mit 404 - das
  // war die Luecke E01: Kein Bild und kein Video lies sich in Bibliothek oder
  // Vorschau laden.
  registriereMediaProtokollHandler();

  // SCHRITT 4b: der EIGENE marken://-Handler (#290) - unmittelbar nach dem media-Stub,
  // dieselbe Reihenfolge-Regel ("NACH app.whenReady(), vor dem Laden des Hauptfensters",
  // Signatur-Kommentar #290). Synchron, kein await, kein try/catch (wie alle
  // Anmeldungen hier).
  registriereMarkenProtokollHandler();

  setzeCspHeader();

  // SCHRITT 5: die DREIZEHN Anmeldungen OHNE Fenster, in genau dieser Reihenfolge.
  // Sie stehen vor erstelleHauptfenster(), weil keine von ihnen ein Fenster braucht.
  // Alle Positionen 1 bis 13 sind verdrahtet; kein Ersatzaufruf, keine von Hand
  // gebaute ipcMain.handle-Registrierung, kein eigener Kanalname.
  //
  // Die Nummerierung bleibt unveraendert, auch wo noch Luecken dazwischenstehen: Sie
  // ist Vertrag aus #3 und wird nicht "aufgeraeumt".
  //
  // KEIN try/catch um diese Aufrufe - aus demselben Grund, der weiter unten bei
  // verdrahteQueueIPC ausgeschrieben steht: Ein aufgefangener Fehler machte daraus eine
  // App, die startet und bei der jeder Import und jeder Render lautlos ins Leere laeuft.

  //  1. verdrahteProjectStoreIPC() - #76,
  //     src/main/ipc-gateway/project-store-verdrahtung.ts. Meldet die vierzehn
  //     project-Kanaele an; ohne sie erreicht die Oberflaeche den project-store nicht.
  verdrahteProjectStoreIPC();

  //  2. verdrahteProjectStoreNachtragIPC() - #153,
  //     src/main/ipc-gateway/project-store-nachtrag.ts. Meldet die beiden nachgetragenen
  //     project-Kanaele an (project:setzeEinblendung, project:setzeElementReferenz).
  //     Unmittelbar nach 1., weil beide denselben Kanal-Namensraum `project:` bedienen
  //     und eine doppelte Registrierung so sofort auffaellt. Argumentlos - sie braucht
  //     kein Fenster und haelt keinen Zustand.
  verdrahteProjectStoreNachtragIPC();

  //  3. verdrahteProjectStoreNachtrag2IPC() - #240 (project:setzeBearbeitungsstand,
  //     project:oeffneProjektordner), src/main/ipc-gateway/project-store-nachtrag-2.ts.
  //     Meldet die beiden nachgetragenen project-Kanaele an (mit #274 verdrahtet).
  //     Unmittelbar nach 2., aus demselben Grund: derselbe Namensraum `project:` -
  //     eine doppelte Registrierung faellt so sofort auf. Argumentlos, kein Fenster.
  verdrahteProjectStoreNachtrag2IPC();


  //  4. verdrahteConfigStoreIPC() - #77,
  //     src/main/ipc-gateway/config-store-verdrahtung.ts. Meldet die fuenf
  //     config-Kanaele an (D3, TK 9.5).
  verdrahteConfigStoreIPC();

  //  5. verdrahteMedienIPC() - #93, src/main/media-service/ipc-verdrahtung.ts. Meldet
  //     GENAU EINEN Kanal an (media:öffneMedienDialog, den Datei-Auswahldialog des
  //     Imports). Kanaele fuer den Import und das Loeschen selbst entstehen dort
  //     bewusst nicht - die laufen ueber die Warteschlange (TK 9.3.4).
  verdrahteMedienIPC();

  //  6. registriereMedienHandler() - #92, src/main/media-service/handler-registrierung.ts.
  //     Traegt beim Auftrags-Dispatcher die Handler fuer art: "import" und
  //     art: "loeschen" ein. Unmittelbar nach 5.: erst der Dialog, mit dem eine Auswahl
  //     zustande kommt, dann die Stelle, die den daraus entstehenden Auftrag ausfuehrt.
  //     Ohne sie wird ein Import eingereiht und findet keinen Handler - derselbe
  //     Fehlerfall, den 9. und 10. fuer Render und Export beschreiben.
  registriereMedienHandler();

  //  7. verdrahteVorlagenIPC() - #109, src/main/vorlagen-store/ipc-verdrahtung.ts.
  //     Meldet die neun vorlagen-Kanaele an (TK 9.12.1). Ohne sie erreicht der
  //     vorlagen-editor die Vorlagen-Bibliothek nicht. Argumentlos, kein Fenster.
  verdrahteVorlagenIPC();

  //  8. verdrahteVorlagenNachtragIPC() - #255 (vorlagen:pruefeReferenzen),
  //     src/main/ipc-gateway/vorlagen-nachtrag.ts. Meldet den Kanal an (mit #274
  //     verdrahtet). Unmittelbar nach 7., Namensraum `vorlagen:`; argumentlos, kein Fenster.
  verdrahteVorlagenNachtragIPC();


  //  9. meldeRenderHandlerAn() - #189, src/main/render-service/handler-anmeldung.ts.
  //     Traegt beim Auftrags-Dispatcher den Handler fuer art: "render" ein (mitsamt
  //     Abbrecher). Ohne sie wird ein Render-Auftrag eingereiht und findet beim Start
  //     keinen Handler. Kein IPC-Kanal, deshalb kein Fenster noetig.
  meldeRenderHandlerAn();

  // 10. meldeExportHandlerAn() - #190, src/main/export-service/handler-anmeldung.ts.
  //     Traegt beim Auftrags-Dispatcher den Handler fuer art: "export" ein - dasselbe,
  //     was 9. fuer art: "render" taete. Bewusst OHNE Abbrecher (TK 9.6.3): ein
  //     laufender Kopiervorgang auf ein Wechselmedium wird nicht mittendrin
  //     abgebrochen. Kein IPC-Kanal, deshalb kein Fenster noetig.
  meldeExportHandlerAn();

  // 11. verdrahteProjectStoreNachtrag4IPC() - #334,
  //     src/main/ipc-gateway/project-store-nachtrag-4.ts. Meldet GENAU EINEN Kanal an
  //     (project:setzeStandardSegmentdauer). Derselbe Namensraum `project:` wie die
  //     Positionen 1 bis 3 - doppelte Registrierung faellt sofort auf.
  verdrahteProjectStoreNachtrag4IPC();

  // 12. verdrahteMarkenIPC() - #304, src/main/ipc-gateway/marken-verdrahtung.ts.
  //     Meldet die NEUN marken-Instant-Kanaele an. `marken:` ist ein neuer Kanal-
  //     Namensraum ohne Vorgaenger - deshalb ans ENDE hinter meldeExportHandlerAn()
  //     bzw. Position 11 (#334) statt in der Mitte; die Positionen 1 bis 11 bleiben
  //     unveraendert. Argumentlos - kein Fenster, kein Zustand.
  verdrahteMarkenIPC();

  // 13. verdrahteProjectStoreNachtrag3IPC() - #323,
  //     src/main/ipc-gateway/project-store-nachtrag-3.ts (gebautes, 07.10.). Meldet
  //     GENAU EINEN Kanal an (project:setzeStandardMarke). Derselbe Namensraum
  //     `project:` wie die Positionen 1 bis 3; das Issue gewuenschte die Position
  //     direkt nach Nachtrag2, das GEBaute Muster (#334, #304) haengt neue Eintraege
  //     aber HINTEN an, damit die Positionen 1 bis 12 unveraendert bleiben
  //     (Vertrag #3). Argumentlos - kein Fenster, kein Zustand.
  verdrahteProjectStoreNachtrag3IPC();

  // 14. verdrahteProjectStoreNachtrag5IPC() - #426,
  //     src/main/ipc-gateway/project-store-nachtrag-5.ts. Meldet GENAU EINEN Kanal an
  //     (project:setzeUnterbrechungen). Derselbe Namensraum `project:` wie die
  //     Positionen 1 bis 3 und 11/13; doppelte Registrierung faellt sofort auf.
  //     Argumentlos - kein Fenster, kein Zustand.
  verdrahteProjectStoreNachtrag5IPC();

  // SCHRITT 6: Fenster erzeugen und Inhalt laden.
  const fenster = erstelleHauptfenster();

  // SCHRITT 7: die VIER Anmeldungen MIT Fenster, in genau dieser Reihenfolge. Jede
  // bekommt DASSELBE BrowserWindow als Parameter - keine sucht sich eines selbst
  // (TK 9.1.1 Punkt 10). Alle vier Positionen sind verdrahtet.
  //
  // Warum diese drei NACH dem Fenster stehen und das fuer ihre Aufruf-Kanaele
  // unkritisch ist: Schritt 6 STOESST das Laden nur an; der Renderer-Code laeuft erst,
  // wenn das Dokument geladen ist - die Registrierung liegt davor. Ereignisse, die
  // vorher anfallen, verfallen dagegen ausdruecklich still: "Ereignisse vor dem Aufbau
  // des Fensters verfallen still - es wird NICHT gepuffert (bindend)." (TK 9.1.1
  // Punkt 10). Deshalb wird hier nichts gepuffert und NICHT auf did-finish-load
  // gewartet.

  // 1. verdrahteQueueIPC(fenster) - #71,
  //    src/main/auftrags-manager/ipc-verdrahtung.ts. Meldet die vier Warteschlangen-
  //    Kanaele an und ist der Sender der Ereignisse `queue:geaendert` und
  //    `queue:stoerung`. Sie meldet ihre beiden Hoerer selbst wieder ab, wenn das
  //    Fenster geschlossen ist - hier ist dafuer nichts nachzuhalten.
  //
  // KEIN try/catch darum: Wirft diese Zeile, ist die Warteschlange nicht bedienbar,
  // und ein aufgefangener Fehler machte daraus eine App, die startet und bei der
  // jeder Import und jeder Render lautlos ins Leere laeuft. Weder #3 noch #71 sehen
  // hier eine Behandlung vor; auch die uebrigen Startschritte dieser Datei stehen
  // ungeschuetzt.
  verdrahteQueueIPC(fenster);

  // 2. verdrahteExportUndFortschrittIPC(fenster) - #191,
  //    src/main/ipc-gateway/export-verdrahtung.ts. Meldet den Kanal
  //    `export:wähleExportZiel` an und ist der Sender des Ereignisses
  //    `render:fortschritt`. Sie bekommt DASSELBE Fenster wie 1. - sie sucht sich
  //    keines (TK 9.1.1 Punkt 10). Auch hier KEIN try/catch: ohne sie gibt es keinen
  //    Fortschritt und kein Exportziel, und beides lautlos zu verlieren ist schlimmer
  //    als ein Start, der abbricht.
  verdrahteExportUndFortschrittIPC(fenster);

  // 3. verdrahteSpeicherstatusIPC(fenster) - #238, die SENDER der beiden
  //    Auto-Speichern-Ereignisse `project:autoSpeichernStatus` und
  //    `vorlagen:autoSpeichernStatus`, src/main/ipc-gateway/speicherstatus-verdrahtung.ts.
  //    Mit #274 verdrahtet. Ohne sie bleibt ein gescheitertes Auto-Speichern
  //    unsichtbar (NFA-02, TK 9.5.4 / 9.12.1). Sie bekommt DASSELBE Fenster wie
  //    1. und 2. (TK 9.1.1 Punkt 10). Kein try/catch: lautlos zu
  //    verlieren ist schlimmer als ein Start, der abbricht - wie in den Positionen darüber.
  verdrahteSpeicherstatusIPC(fenster);

  // 4. verdrahteMarkenSpeicherstatusIPC(fenster) - #304,
  //    src/main/ipc-gateway/marken-speicherstatus-verdrahtung.ts. Der Sender des
  //    Ereignisses `marken:autoSpeichernStatus` (#278). UNMITTELBAR nach 3.: beide
  //    behandeln Auto-Speichern-Ereignisse - direkt nacheinander stehend faellt eine
  //    vergessen dritte Zeile sofort auf. Sie braucht EIN BrowserWindow und bekommt
  //    DASSELBE wie 1. bis 3. (TK 9.1.1 Punkt 10). Ohne sie bleibt ein gescheitertes
  //    Speichern der marken.json vollstaendig unsichtbar (NFA-02, TK 9.15.1). Kein
  //    try/catch: lautlos zu verlieren ist schlimmer als ein Start, der abbricht.
  verdrahteMarkenSpeicherstatusIPC(fenster);

  // SCHRITT 8: raeumeVerwaisteArbeitsbereiche() - #172,
  // src/main/render-service/arbeitsbereich.ts. Entfernt reel-*-Ordner, die ein
  // frueherer Absturz im Temp-Bereich hinterlassen hat.
  //
  // Wird NICHT abgewartet (kein await), und ein Fehlschlag bricht den Start nicht ab:
  // Aufraeumen ist Hygiene, kein Startkriterium - ein gesperrter Ordner darf die App
  // nicht am Starten hindern. Deshalb steht hier `void` und kein `await`.
  //
  // KEIN .catch() daneben: Die Funktion faengt jeden Fehlschlag selbst ab und liefert
  // im schlechtesten Fall 0 ("Wirft nie", nachgelesen in ihrer Datei, nicht im Issue).
  // Ein zweiter Auffangnetz-Aufruf hier gaukelte eine Gefahr vor, die es nicht gibt.
  void raeumeVerwaisteArbeitsbereiche();
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
  // #427: Beim Schliessen ueber das rote Kreuz ist das Fenster beim `before-quit`
  // bereits zerstoert (window-all-closed -> app.quit). Ohne Fenster gibt es keinen
  // Renderer fuer den Fehler-Dialog aus #336 - die drei Sofort-Flushs laufen trotzdem
  // (flushesBeimBeendenOhneDialogAus), ein Fehlschlag wird verworfen, dann wird beendet.
  // OHNE diesen Zweig blieb der Prozess als Waise stehen (der alte Ablauf stieg bei
  // zerstoertem Fenster aus, ohne app.quit() - die Einzelinstanz-Sperre blockierte den
  // Neustart). `before-quit` bleibt der EINZIGE Beenden-Weg (#336).
  if (hauptfenster === null || hauptfenster.isDestroyed()) {
    ereignis.preventDefault();
    void flushesBeimBeendenOhneDialogAus().finally(() => {
      beendenAbgeschlossen = true;
      app.quit();
    });
    return;
  }
  ereignis.preventDefault();
  void fuehreBeendenAblaufAus();
});

// #336: Der dialog des Beenden-Falls wird im RENDERER gezeigt (beenden:status
// EREIGNIS + beenden:entscheidung RUECKKANAL); die Main-Fassung (showMessageBoxSync)
// ist durch EINEN Renderer-Dialog ersetzt. Der Flush selbst blieb unveraendert.
async function fuehreBeendenAblaufAus(): Promise<void> {
  if (hauptfenster === null || hauptfenster.isDestroyed()) {
    return;
  }
  const erlaubt = await pruefeBeendenUndFlush(hauptfenster);
  if (!erlaubt) return;
  beendenAbgeschlossen = true;
  app.quit();
}

/**
 * Schliesst beim Beenden ab, was noch aussteht (Sofort-Flush, Fall 3 aus TK 9.5.4).
 *
  * ZWEI ZWEIGE, nicht einer (#3, entschieden am 10.08.2026):
  *   - alle drei Flushs gelungen -> Merkflagge setzen, Beenden GENAU EINMAL erneut anstossen
  *   - mindestens einer gescheitert -> Beenden NICHT erneut anstossen, sondern Dialog mit
  *     "Erneut versuchen" und dem benannten Ausweg "Trotzdem schliessen und Aenderungen
  *     verwerfen" (nie vorausgewaehlt). TK 9.5.4: "Scheitert der Sofort-Flush beim BEENDEN,
  *     schliesst die App NICHT (bindend)." Vom User am 12.08.2026 bestaetigt. Fuer
  *     marken.json gilt dieselbe Regelung (TK 9.15.1, v3.11).
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
/* #336: ERSETZT durch beenden-ablauf.ts (pruefeBeendenUndFlush). Die alte Funktion bleibt
 * als Dokumentation stehen - ihr Inhalt wurde byte-genau NICHT veraendert (DoD).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function schliesseAusstehendesAb(): Promise<void> {
  // FRUEHER STAND HIER EIN "OFFENER WIDERSPRUCH" zwischen der DoD von #3 ("Beenden
  // danach genau einmal erneut anstossen") und TK 9.5.4 ("schliesst die App NICHT").
  // ERLEDIGT: #3 wurde am 10.08.2026 auf ZWEI Zweige geschaerft und zitiert TK 9.5.4
  // woertlich; das "genau einmal erneut anstossen" gilt allein fuer den ERFOLGSFALL.
  // Es gab also nie zwei sich widersprechende Vertraege - nur ein Kommentar, der dem
  // Issue hinterherhinkte. Vom User am 12.08.2026 bestaetigt: Die App bleibt offen.
  //
  // EBENFALLS UEBERHOLT (15.08.2026): Hier stand, der Fehlerzweig sei nicht baubar,
  // weil "der noetige Dialog im Renderer liegt". Das war falsch - #3 verlangt ihn
  // ausdruecklich im Main (dialog.showMessageBoxSync). Er steht jetzt unten.
  for (;;) {
    const fehlgeschlagen = await fuehreBeendenFlushsAus();

    if (fehlgeschlagen.length === 0) {
      // ERFOLGSFALL: Merkflagge setzen und das Beenden GENAU EINMAL erneut anstossen.
      break;
    }

    // FEHLERFALL: "Scheitert der Sofort-Flush beim BEENDEN, schliesst die App NICHT
    // (bindend)." (TK 9.5.4) Also wird hier NICHT erneut angestossen, sondern gefragt.
    if (!willErneutVersuchen(fehlgeschlagen)) {
      // "Trotzdem schliessen und Aenderungen verwerfen" - eine ausdrueckliche
      // Entscheidung des Nutzers, kein stilles Wegwerfen. KEIN Rollback: Die
      // Aenderungen bleiben bis zum Prozessende im Speicher gueltig (TK 9.5.4).
      break;
    }
    // "Erneut versuchen" - dieselben Flushs noch einmal, in derselben Reihenfolge.
    // Deshalb eine Schleife und keine einmalige Wiederholung: Wer die Platte aufraeumt
    // und noch einmal scheitert, bekommt den Dialog wieder, statt die Arbeit zu
    // verlieren.
  }

  beendenAbgeschlossen = true;
  app.quit();
}

/**
 * Fuehrt die drei Sofort-Flushs aus und liefert je eine Zeile fuer die, die
 * gescheitert sind (leer = alles geschrieben).
 *
 * Alle drei Aufrufe werden EINZELN ABGEWARTET, bevor das Fenster geschlossen und der
 * Prozess beendet wird: "Beim Beenden blockiert die App, bis der Schreibvorgang
 * abgeschlossen ist (kein Schliessen mit ausstehendem Schreiben)." (TK 9.5.4) Kein
 * Promise.all: Es liefe schneller, mache aus drei Fehlschlaegen aber einen einzigen
 * abgelehnten Promise und verdecke, WELCHER Bestand nicht gesichert werden konnte -
 * ausgerechnet bei der Meldung, die dem Nutzer sagen soll, was er verliert.
 *
 * Der ZWEITE und der DRITTE Flush laufen auch dann, wenn einer davor gescheitert ist.
 * Die Bestaenge haengen nicht voneinander ab; ein Abbruch nach dem ersten Fehlschlag
 * verloere den Vorlagen- bzw. den Markenbestand zusaetzlich, ohne irgendetwas zu retten.
 */
async function fuehreBeendenFlushsAus(): Promise<string[]> {
  const offen: string[] = [];

  // #47, src/main/project-store/auto-speichern.ts. NICHT sofortFlush(projekt) - jene
  // Funktion verlangt vom Aufrufer das aktuelle Project UND die Ausfuehrung innerhalb
  // von mitD1Lock (#32); der Bootstrap hat beides nicht und soll es nicht bekommen.
  // flushBeimBeenden ist argumentlos, nimmt das Lock selbst und holt den aktiven Stand
  // ueber holeAktivesProjekt (#192) INNERHALB des Locks. Kein offenes Projekt ist dort
  // { ok: true }, kein Fehler.
  const projekt = await flushBeimBeenden();
  if (!projekt.ok) {
    offen.push(`project.json (${projekt.fehler.code}): ${projekt.fehler.meldung}`);
  }

  // #98, src/main/vorlagen-store/schreibe-vorlagen.ts. Dasselbe fuer den
  // Vorlagenbestand; steht dort nichts aus, ist das ein erfolgreicher Leerlauf.
  const vorlagen = await flushBestand();
  if (!vorlagen.ok) {
    offen.push(`vorlagen.json (${vorlagen.fehler.code}): ${vorlagen.fehler.meldung}`);
  }

  // #277, src/main/marken-store/schreibe-marken.ts. Dasselbe fuer den app-weiten
  // Markenbestand marken.json; steht dort nichts aus, ist das ein erfolgreicher
  // Leerlauf, kein Fehler - deshalb KEINE vorgeschaltete Pruefung ("gibt es ueberhaupt
  // Marken?"), das waere Fachlogik im Bootstrap. Und deshalb UNTER ALIAS importiert:
  // flushBestand heisst auch die Vorlagen-Funktion (#98), und beide laufen in DEMSELBEN
  // Rumpf - ohne Alias gaebe es einen Namenskollision oder, schlimmer, einen Import,
  // der still den FALSCHEN Bestand sichert. Rueckgabe wird hier nicht ausgewertet und
  // nicht umgeformt (verdrahteMarkenSpeicherstatusIPC (#304) laeuft ungefaehrdet
  // daneben; die Ereignis-Schicht ist Sache des marken-store).
  const marken = await flushMarkenBestand();
  if (!marken.ok) {
    offen.push(`marken.json (${marken.fehler.code}): ${marken.fehler.meldung}`);
  }

  return offen;
}

/**
 * Zeigt den Fehler-Dialog des Beenden-Ablaufs und meldet, ob erneut versucht werden
 * soll.
 *
 * Der Dialog gehoert in den MAIN-Prozess (#3): Beim Beenden ist das Fenster unter
 * Umstaenden schon nicht mehr ansprechbar, und ein Weg ueber den Renderer haenge an
 * einem IPC-Kanal, den es dafuer nicht gibt. Diese Datei zeigt bereits so einen Dialog
 * - den Selbsttest-Fehler aus #6.
 *
 * `showMessageBoxSync` und nicht die asynchrone Fassung: Der Aufrufer haelt gerade das
 * Beenden auf; ein zweiter Schwebezustand daneben bringt nichts.
 */
function willErneutVersuchen(fehlgeschlagen: string[]): boolean {
  const wahl = dialog.showMessageBoxSync({
    type: "warning",
    title: "Digital-Signage-Tool: Aenderungen nicht gespeichert",
    message: "Die letzten Aenderungen konnten nicht gespeichert werden.",
    detail: [
      empfehlungZurUrsache(fehlgeschlagen),
      "",
      "Im Einzelnen:",
      ...fehlgeschlagen.map((zeile) => `  - ${zeile}`),
    ].join("\n"),
    buttons: [
      "Erneut versuchen",
      "Trotzdem schliessen und Aenderungen verwerfen",
    ],
    // Der Verwerfen-Knopf ist NIE vorausgewaehlt (#3) und ist auch nicht der
    // Abbruch-Knopf: Wer den Dialog mit Escape wegdrueckt, verliert nichts, sondern
    // landet bei "Erneut versuchen".
    defaultId: 0,
    cancelId: 0,
    noLink: true,
  });

  return wahl === 0;
}

/**
 * Waehlt die Empfehlung, die zur Ursache passt.
 *
 * WORAUF DAS BERUHT: Beide Fehlercode-Unionen kennen fuer diesen Fall nur
 * `speicher_fehler` (nachgelesen in project-store/assets.ts und
 * vorlagen-store/fehlercodes.ts) - der Code allein unterscheidet "Platte voll" nicht
 * von "Datenort weg". Die Unterscheidung kann daher nur aus dem Meldungstext kommen,
 * in den die schreibenden Stellen die Systemursache hineinreichen. Das ist eine
 * Heuristik und wird auch so behandelt: Trifft sie nicht, steht der generische Text
 * da, und die Ursachenzeilen selbst zeigt der Dialog ohnehin ungekuerzt.
 */
function empfehlungZurUrsache(fehlgeschlagen: string[]): string {
  const alles = fehlgeschlagen.join(" ");

  if (alles.includes("ENOSPC")) {
    return (
      "Auf dem Datentraeger ist kein Platz mehr. Geben Sie Speicher frei und waehlen " +
      "Sie dann „Erneut versuchen“."
    );
  }
  if (
    alles.includes("ENOENT") ||
    alles.includes("EACCES") ||
    alles.includes("EPERM")
  ) {
    return (
      "Der Datenort ist nicht erreichbar oder schreibgeschuetzt. Stecken Sie einen " +
      "entfernten USB-Stick wieder ein bzw. pruefen Sie die Schreibrechte und waehlen " +
      "Sie dann „Erneut versuchen“."
    );
  }
  return (
    "Der Grund steht unten. Beheben Sie ihn nach Moeglichkeit und waehlen Sie dann " +
    "„Erneut versuchen“."
  );
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
