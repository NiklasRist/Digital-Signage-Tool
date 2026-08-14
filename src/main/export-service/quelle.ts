// GENERIERT aus dem Signaturblock von Issue #185.
// [export-service] Exportquelle über die Pfad-Autorität auflösen und prüfen
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
// GERUEST-PRUEFSUMME: ae79c30455b38fe8

import { stat } from "node:fs/promises";

import { loeseAusgabePfad } from "../project-store/pfade";

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ExportFehlercode } from './fehlercodes'

// KEIN `node:path` IN DIESER DATEI - und das ist keine Sparsamkeit, sondern die
// Kernaussage des Issues.
//
// "project-store ist die eine Pfad-Autoritaet. (...) Jeder Main-Dienst, der eine
// Mediendatei anfassen muss, resolved den Pfad ueber den project-store, statt das
// Layout selbst zu kennen (...) export-service (Quelle: die gewaehlte Datei aus
// projects/<id>/output/)." (TK 9.5.7)
//
// Hier wird ein NUTZER-GEWAEHLTER Name zum ersten Mal zu einem absoluten Pfad. Wer
// `path.join(ausgabeOrdner(projektId), dateiname)` schriebe, umginge damit genau die
// Traversal-Schranke, die loeseAusgabePfad (#49) dafuer bereithaelt: Ein `dateiname`
// wie `..\..\project.json` waere dann eine beliebige Datei des Datenorts, kopierbar
// auf einen USB-Stick. Auch `ausgabeOrdner` allein ist deshalb tabu - es ist laut #49
// eine reine String-Operation OHNE jede Pruefung.

/** Die Endung, die eine Ausgabedatei tragen muss (TK 9.2.6 / Ausgabe-Profil). */
const AUSGABE_ENDUNG = ".mp4";

export interface ExportQuelle {
  quellPfad: string       // absoluter Pfad der Datei in projects/<id>/output/
  dateigroesse: number    // Bytes – Grundlage für Platzprüfung (#184) und Verifikation (#186)
}

export async function loeseExportQuelle(
  projektId: string,
  dateiname: string,      // MIT Endung, wie aus listeAusgaben (#75), z. B. "sommeraktion.mp4"
): Promise<Ergebnis<ExportQuelle, ExportFehlercode>> {
  try {
    // 1. FORMPRUEFUNG - vor jedem Dateisystemzugriff.
    //
    // "Der Main validiert jede eingehende Nutzlast - er vertraut dem Renderer nicht.
    // Ungueltige Eingabe -> ungueltige_eingabe, ohne jede Wirkung auf die Daten."
    // (TK 9.1.1). Die typeof-Pruefungen sind trotz `string` in der Signatur nicht
    // ueberfluessig: Der Wert stammt aus ExportRequest, also ueber die IPC-Grenze, und
    // dort sagt der Typ nichts ueber das, was tatsaechlich ankommt.
    if (typeof projektId !== "string" || projektId.length === 0) {
      return scheitert("ungueltige_eingabe", "Es wurde kein Projekt angegeben.");
    }
    if (typeof dateiname !== "string" || dateiname.length === 0) {
      return scheitert("ungueltige_eingabe", "Es wurde keine Ausgabedatei angegeben.");
    }

    // 2. ENDUNG PRUEFEN - EXAKT klein geschrieben, kein toLowerCase().
    //
    // ENTSCHIEDEN am 14.08.2026 vom User. Hier stand zuvor ein toLowerCase(), weil die
    // Abnahme von #185 "FERIEN.MP4 wird akzeptiert" verlangte. Diese Forderung stuetzte
    // sich darauf, listeAusgaben (#75) nehme `.MP4` in die Liste auf - die GEBAUTE
    // Fassung (src/main/project-store/ausgaben.ts, istFertigeAusgabe) tut das seit dem
    // 12.08.2026 ausdruecklich NICHT MEHR, und zwar mit genau dem Argument, um das es
    // hier geht. Der Bau-Agent hat den Widerspruch gemeldet statt die Abnahme
    // umzuschreiben; aufgeloest wurde er zugunsten von #75, und die DoD von #185 ist
    // entsprechend geaendert.
    //
    // Die Begruendung, wortgleich mit der von #75: loeseAusgabePfad (#49) haengt immer
    // ein KLEIN geschriebenes `.mp4` an. Eine als `FERIEN.MP4` gefuehrte Datei ist auf
    // macOS damit nicht aufloesbar. Auf Windows faellt das nicht auf, weil das
    // Dateisystem die Schreibweise ignoriert - deshalb muss die Enge hier stehen und
    // nicht erst am Dateisystem. Der Render erzeugt ohnehin nur klein geschriebene
    // Namen; ein grosser Buchstabe kann nur von Hand in den Ordner gelangt sein.
    //
    // Die Pruefung faengt zugleich `.part` ab: eine halb geschriebene Datei auf den
    // Stick zu kopieren ergaebe am Fernseher ein Video, das mitten im Abspielen
    // abbricht.
    if (!dateiname.endsWith(AUSGABE_ENDUNG)) {
      return scheitert(
        "ungueltige_eingabe",
        `Nur Ausgabedateien mit der Endung "${AUSGABE_ENDUNG}" können exportiert werden.`,
      );
    }
    if (dateiname.length === AUSGABE_ENDUNG.length) {
      return scheitert(
        "ungueltige_eingabe",
        "Der Name der Ausgabedatei besteht nur aus der Endung.",
      );
    }

    // 3. ENDUNG ABSCHNEIDEN - die letzten VIER Zeichen, nicht "alles ab dem letzten
    // Punkt".
    //
    // Hier stossen zwei Vertraege aneinander: ExportRequest.dateiname kommt MIT Endung
    // (aus listeAusgaben, #75), loeseAusgabePfad (#49) erwartet den Namen OHNE Endung
    // und haengt `.mp4` selbst an. Wer das uebersieht, loest `sommeraktion.mp4` zu
    // `.../output/sommeraktion.mp4.mp4` auf - eine Datei, die es nie gibt, und JEDER
    // Export scheiterte mit `keine_ausgabe`, ohne dass sonst irgendetwas falsch waere.
    //
    // Und wer stattdessen ab dem ERSTEN oder LETZTEN Punkt kuerzte, machte aus
    // `sommer.aktion.mp4` ein `sommer` bzw. traefe zufaellig dasselbe - der erste Fall
    // greift auf eine fremde Datei zu.
    const ausgabeName = dateiname.slice(0, -AUSGABE_ENDUNG.length);

    // 4. PFAD AUFLOESEN - ausschliesslich ueber die Pfad-Autoritaet.
    //
    // Sie leistet die Namensvalidierung aus TK 9.2.6 (keine Pfadtrenner, kein `..`,
    // keine unzulaessigen Zeichen, keine reservierten Windows-Namen) und rechnet nach,
    // dass das Ergebnis im Ausgabeordner liegt. Diese Datei baut davon NICHTS nach:
    // Zwei unterschiedlich strenge Pruefungen waeren zwei Wahrheiten, und niemand
    // wuesste, welche gilt.
    const aufgeloest = loeseAusgabePfad(projektId, ausgabeName);
    if (!aufgeloest.ok) {
      // Der Code (`ungueltige_eingabe`) reist UNVERAENDERT weiter. Ihn hier in
      // `keine_ausgabe` umzudeuten, wuerde zwei verschiedene Sachverhalte vermengen:
      // ein unzulaessiger Name ist etwas anderes als eine fehlende Datei und braucht
      // einen anderen Hinweis.
      return aufgeloest;
    }
    const quellPfad = aufgeloest.wert;

    // 5. EXISTENZ UND GROESSE LESEN. Nur lesend - kein Anlegen, kein Umbenennen, kein
    // Oeffnen zum Schreiben (ein offen gehaltenes Handle ist auf Windows die Ursache
    // fuer EBUSY beim spaeteren Aufraeumen).
    try {
      const angaben = await stat(quellPfad);

      // Ein Verzeichnis (oder ein Geraet, eine Pipe, ...) ist keine Ausgabedatei. Ohne
      // diese Pruefung liefe der Export mit dateigroesse 0 los und schriebe am Ende
      // eine leere Datei auf den Stick - ein Fehler, der erst am Fernseher auffiele.
      // Ein Symlink ins Leere braucht keinen eigenen Zweig: stat folgt ihm und meldet
      // ENOENT.
      if (!angaben.isFile()) {
        return fehlt(dateiname);
      }
      return { ok: true, wert: { quellPfad, dateigroesse: angaben.size } };
    } catch (ursache) {
      const code = systemcode(ursache);
      if (code === "ENOENT") {
        return fehlt(dateiname);
      }
      // "Jeder Zugriffsfehler auf die Quelldatei ist keine_ausgabe, nicht
      // schreib_fehler": TK 9.6.4 beschreibt schreib_fehler als "sonstiger I/O-Fehler
      // beim Kopieren" - hier wird nichts kopiert. Einen Code fuer "vorhanden, aber
      // unlesbar" gibt es im geschlossenen Satz nicht, und er wird nicht erfunden. Die
      // Ursache steht in der Meldung, nie im Code (TK 9.1.1, Punkt 3).
      return scheitert(
        "keine_ausgabe",
        `Die Ausgabedatei „${dateiname}“ ist nicht lesbar${code === null ? "" : ` (${code})`}. ` +
          "Bitte rendern Sie sie neu oder wählen Sie eine andere Datei.",
      );
    }
  } catch (ursache) {
    // "Niemals throw": Aufrufer ist der Export-Handler eines Auftrags; eine Ausnahme
    // liesse den Auftrag auf `laeuft` stehen und braechte die streng serielle
    // Warteschlange fuer den Rest der Sitzung zum Stillstand (TK 9.3.5). Deshalb faengt
    // dieser Block auch das, was oben eigentlich nicht werfen kann.
    return scheitert(
      "unbekannter_fehler",
      `Die Ausgabedatei konnte nicht geprüft werden. Grund: ${meldungVon(ursache)}`,
    );
  }
}
// - baut den Pfad AUSSCHLIESSLICH über loeseAusgabePfad (#49); KEIN eigenes path.join
// - fehlt die Datei → 'keine_ausgabe'

// ---------------------------------------------------------------------------
// Hilfen. Bewusst nicht exportiert - sie tragen keine eigene Aussage.
// ---------------------------------------------------------------------------

function scheitert(
  code: ExportFehlercode | "ungueltige_eingabe" | "unbekannter_fehler",
  meldung: string,
): Ergebnis<ExportQuelle, ExportFehlercode> {
  return { ok: false, fehler: { code, meldung } };
}

/**
 * Die fehlende Datei - der einzige fachliche Code, den diese Datei vergibt.
 *
 * "Quelle pruefen: existiert projects/<id>/output/<dateiname>? Sonst keine_ausgabe
 * (erst rendern bzw. andere Datei waehlen)." (TK 9.6.2, Schritt 1)
 *
 * In der Meldung steht der DATEINAME, nie der absolute Pfad: Sie reist ueber IPC bis in
 * die Oberflaeche, und ein zurueckgespiegelter Pfad verraet dem Renderer den Datenort,
 * den er laut TK 9.6.1 gar nicht kennen soll ("der Renderer liest den Ausgabeordner nie
 * selbst und kennt keine absoluten Pfade"). Zum Beheben genuegt der Name - er ist genau
 * der, den die Oberflaeche in ihrer Liste anzeigt.
 */
function fehlt(dateiname: string): Ergebnis<ExportQuelle, ExportFehlercode> {
  return scheitert(
    "keine_ausgabe",
    `Die Ausgabedatei „${dateiname}“ ist nicht vorhanden. ` +
      "Bitte rendern Sie sie neu oder wählen Sie eine andere Datei.",
  );
}

/** Der Betriebssystem-Code eines fs-Fehlers (`ENOENT`, `EACCES`, ...), wenn es einen gibt. */
function systemcode(ursache: unknown): string | null {
  if (typeof ursache === "object" && ursache !== null && "code" in ursache) {
    const code: unknown = (ursache as { code: unknown }).code;
    if (typeof code === "string") {
      return code;
    }
  }
  return null;
}

/** Nur die Meldung, nie der Stacktrace (Fehlerpfad-Tabelle des Issues). */
function meldungVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache);
}
