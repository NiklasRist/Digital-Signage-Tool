// Das media://-Protokoll (#9) - hier NUR die Registrierung, ausdruecklich ohne
// Pfadaufloesung.
//
// Wozu es da ist: Vorschau (P5) und Thumbnails (composer, action-editor) muessen
// Medien ANZEIGEN, der Renderer darf das Dateisystem aber nicht beruehren. Deshalb
// stellt der Main ein eigenes Protokoll bereit: Der Renderer schreibt
// `media://<projektId>/<dateiname>` in ein <img> oder <video>, der Main loest auf und
// liefert die Bytes - nur lesend (TK 9.5.7).
//
// WARUM HIER NICHTS AUFGELOEST WIRD: "`project-store` ist die eine Pfad-Autoritaet.
// [...] Jeder Main-Dienst, der eine Mediendatei anfassen muss, resolved den Pfad ueber
// den `project-store`, statt das Layout selbst zu kennen." (TK 9.5.7) Wer die
// Aufloesung hier hineinschriebe - und sei es "nur testweise" -, erzeugte eine ZWEITE
// Pfad-Autoritaet. Dann kennen zwei Stellen das Ordner-Layout, und eine
// Layout-Aenderung wirkt nur an einer davon. Genau deshalb enthaelt diese Datei kein
// `path.join` und keinen Zugriff auf ein Projektverzeichnis.

import { protocol } from "electron";
import type { CustomScheme } from "electron";

// #340: Der ECHTE Aufloeser (project-store, die Pfad-Autoritaet) - diese Datei baut
// keinen Pfad, sie MELDET nur den Handler an.
import { behandleMediaAnfrage } from "./project-store/media-protokoll";

/** Das Schema, unter dem der Renderer Medien laedt. */
const SCHEMA = "media";

/**
 * Die Schema-Beschreibung als DATEN, nicht als Aufruf. Der Bootstrap (#309, src/main/index.ts)
 * sammelt sie zusammen mit MARKEN_SCHEMA (#290) und ruft
 * protocol.registerSchemesAsPrivileged GENAU EINMAL auf - Electron laesst nur einen Aufruf zu,
 * und er muss VOR app.whenReady() stehen (#3, Schritt 1). Eine spaetere oder zweite Anmeldung
 * wird schlicht nicht mehr beruecksichtigt, und zwar ohne Fehlermeldung - die URLs verhielten
 * sich dann im Renderer unzuverlaessig, ohne dass irgendwo etwas protokolliert wuerde.
 *
 * Zu den fuenf Privilegien:
 * - `standard`: laesst `media://projektId/dateiname` nach den ueblichen URL-Regeln
 *   zerlegen (Host + Pfad). Ohne das gaebe es kein verlaessliches Trennen von
 *   Projektkennung und Dateiname.
 * - `secure`: das Schema gilt als sicherer Kontext. Ohne das behandelt Chromium die
 *   Inhalte wie unsicheres Fremdmaterial und blockiert sie in einer Seite, die selbst
 *   sicher geladen wurde.
 * - `stream`: Voraussetzung fuer <video>. Ohne das kann der Player nicht spulen, weil
 *   Teilbereichs-Anfragen (Range) nicht unterstuetzt werden - bei Videos in
 *   Studio-Laenge der Unterschied zwischen benutzbar und unbenutzbar.
 * - `supportFetchAPI`: erlaubt `fetch()` auf solche URLs. Das template-canvas laedt
 *   Motive vor dem Zeichnen (TK 9.10.3).
 * - `corsEnabled` (#364): macht den `fetch` aus der Seite ueberhaupt erst moeglich -
 *   ohne es blockiert Chromium jedes `fetch('media://…')` als Fremdursprung, bevor der
 *   Handler erreicht wird (gemessen an `marken://`, #315/Nachtrag II).
 */
export const MEDIA_SCHEMA: CustomScheme = {
  scheme: SCHEMA,
  privileges: {
    secure: true,
    supportFetchAPI: true,
    stream: true,
    standard: true,
    // #364: `supportFetchAPI` allein genuegt NICHT. Chromium wertet ein eigenes Schema
    // als fremden Ursprung und blockiert `fetch('media://…')` VOR dem Handler
    // ("Cross origin requests are only supported for protocol schemes: …").
    // GEMESSEN beim Bau von #315/Nachtrag II fuer `marken://` (B15, 22.10.2026) und
    // hier uebernommen; ohne diese Zeile liefert der Blob-Weg still eine leere
    // Zeichenkette, und der Filmstreifen bliebe ohne Bilder.
    corsEnabled: true,
  },
};

/**
 * Meldet den ECHTEN Protokoll-Handler an (#340).
 *
 * MUSS nach `app.whenReady()` und vor dem Laden des Fensters laufen (#3, Schritt 4).
 *
 * Die Aufloesung lebt in `project-store/media-protokoll.ts` (#49/#50,
 * `behandleMediaAnfrage`) - nur lesend, Aufloesung ausschliesslich ueber die Pfad-
 * Autoritaet, mit den Sicherheits-Invarianten aus TK 9.5.7 (kein `..`-Ausbruch,
 * keine Symlink-Flucht). Diese Datei importiert sie nur, ohne selbst Pfade zu
 * bauen - dieselbe Teilung wie bis dato: Registrierung hier, Aufloesung im
 * project-store.
 *
 * BISHER STATT DESSEN: ein Stub, der JEDE Anfrage mit 404 beantwortete (das war die
 * Luecke E01/#340: fertige Funktion ohne Anmelder - kein Bild und kein Video kann
 * im Renderer laden). Die Entscheidung, mit der der Stub gebaut wurde (Status 404
 * statt leerem 200), lebt im echten Handler weiter.
 */
export function registriereMediaProtokollHandler(): void {
  protocol.handle(SCHEMA, (anfrage) => behandleMediaAnfrage(anfrage));
}
