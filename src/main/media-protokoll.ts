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

/** Das Schema, unter dem der Renderer Medien laedt. */
const SCHEMA = "media";

/**
 * Meldet `media` als privilegiertes Schema an.
 *
 * MUSS vor `app.whenReady()` laufen (#3, Schritt 1). Electron wertet diese Liste beim
 * Hochfahren der Netzwerk-Schicht EINMAL aus; eine spaetere Anmeldung wird schlicht
 * nicht mehr beruecksichtigt, und zwar ohne Fehlermeldung - die URLs verhielten sich
 * dann im Renderer unzuverlaessig, ohne dass irgendwo etwas protokolliert wuerde.
 *
 * Zu den vier Privilegien:
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
 */
export function registriereMediaProtokollSchema(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEMA,
      privileges: {
        secure: true,
        supportFetchAPI: true,
        stream: true,
        standard: true,
      },
    },
  ]);
}

/**
 * Meldet den Protokoll-Handler an - vorerst als STUB.
 *
 * MUSS nach `app.whenReady()` und vor dem Laden des Fensters laufen (#3, Schritt 4).
 *
 * Der Stub beantwortet JEDE Anfrage mit 404. Das ist eine Entscheidung, keine
 * Verlegenheit: Eine leere Antwort mit Status 200 saehe fuer den Renderer wie ein
 * GEGLUECKTER Ladevorgang aus - ein <img> feuerte `load` statt `error`, und ein
 * fehlendes Motiv waere von einem leeren Motiv nicht zu unterscheiden. Genau diese
 * Unterscheidung braucht spaeter der Platzhalter-Pfad des template-canvas (TK 9.10.7:
 * ein fehlendes Motiv wird als Platzhalter gezeichnet und darf nie in den finalen
 * Render). Ausserdem muss der echte Handler fuer nicht vorhandene Dateien ohnehin 404
 * liefern - der Stub verhaelt sich also schon jetzt wie der Endzustand, nur eben fuer
 * alles.
 *
 * ERSETZT WIRD DIESER STUB vom M1-Issue "project-store: media://-Handler". Dort kommt
 * die Aufloesung ueber die Pfad-Autoritaet dazu, einschliesslich der
 * Sicherheits-Invarianten aus TK 9.5.7 (kein `..`-Ausbruch, keine Symlink-Flucht,
 * strikt nur lesend).
 */
export function registriereMediaProtokollHandlerStub(): void {
  protocol.handle(SCHEMA, (anfrage) => {
    // Die URL wird NICHT zerlegt und NICHT auf einen Pfad abgebildet - sie geht nur in
    // die Meldung, damit beim Entwickeln sichtbar ist, dass der Handler erreicht wurde.
    return new Response(`media:// ist noch nicht angebunden (#9): ${anfrage.url}`, {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  });
}
