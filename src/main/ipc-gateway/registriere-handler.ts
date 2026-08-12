// GENERIERT aus dem Signaturblock von Issue #23.
// [ipc] ipc-gateway Kanal-Wrapper mit Validierung und Ergebnis-Hülle bauen
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
// GERUEST-PRUEFSUMME: 7872b4d195da1ebe
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

import type { Ergebnis } from '../../shared/contracts/ergebnis'

import { ipcMain } from "electron";

/**
 * Die eine Fehler-Huelle fuer alles Unerwartete.
 *
 * KEIN STACKTRACE, KEINE ROHE MELDUNG: Weder `fehler.message` noch `fehler.stack`
 * gehen hier ein. TK 9.1.1 Punkt 3 sagt "Eine rohe Exception-Meldung wird nie zum
 * Code", Punkt 8 verlangt zusaetzlich, dass "kein Stacktrace ... in die Oberflaeche"
 * gelangt - und beides hat einen praktischen Grund ueber die Optik hinaus: Sobald
 * eine Exception-Meldung durchkaeme, faenge irgendein Aufrufer an, sie zu
 * VERGLEICHEN, statt den Code zu lesen. Genau davon soll die Huelle wegfuehren.
 *
 * Der Kanalname steht mit drin, und der ist unbedenklich: Er stammt aus der
 * Kanal-Registry (#25), also aus unserem eigenen Bestand, nie aus Nutzereingaben
 * oder aus dem Fehlerobjekt. Ohne ihn liest die Oberflaeche im Fehlerfall nur
 * "irgendwas ist schiefgelaufen" - und ein Fehlerbericht waere wertlos.
 *
 * Warum `unknown` statt `Ergebnis<T, F>` als Rueckgabetyp nicht taugt: Der Aufrufer
 * gibt das Ergebnis direkt als Antwort des Handlers zurueck, es muss also die
 * Huelle des Kanals haben. `unbekannter_fehler` ist Teil von `GenerischerFehlercode`
 * und damit in JEDER Auspraegung von `F` erlaubt.
 */
function unbekannterFehler<T, F extends string>(kanal: string): Ergebnis<T, F> {
  return {
    ok: false,
    fehler: {
      code: "unbekannter_fehler",
      meldung:
        `Die Operation "${kanal}" ist unerwartet fehlgeschlagen. ` +
        "Einzelheiten stehen im Protokoll des Hauptprozesses.",
    },
  };
}

/**
 * "intern protokolliert" (TK 9.1.1 Punkt 8) - VORLAEUFIG als `console.error`.
 *
 * Der STOPP-Block des Issues laesst offen, wie das Protokollieren spaeter aussieht.
 * Bewusst NICHT vorweggenommen wird eine Logging-Bibliothek: Sie brauchte eine
 * Entscheidung ueber Ablageort, Rotation und Format, und keine davon ist heute
 * faellig. Hier liegt die EINE Stelle, an der sie spaeter einzubauen ist - jede
 * Ausnahme dieses Gateways laeuft durch diese Funktion.
 *
 * Das ganze Fehlerobjekt wird geloggt, Stacktrace eingeschlossen. Das ist kein
 * Widerspruch zu Punkt 8: Verboten ist der Stacktrace im RUECKGABEWERT, also auf
 * dem Weg in die Oberflaeche. Im Protokoll des Hauptprozesses ist er genau das,
 * was einen solchen Fehler ueberhaupt auffindbar macht.
 */
function protokolliere(kanal: string, stelle: string, fehler: unknown): void {
  console.error(`[ipc-gateway] Ausnahme in ${stelle}() des Kanals "${kanal}":`, fehler);
}

export function registriereHandler<T, F extends string>(
  kanal: string,
  validiere: (nutzlast: unknown) => Ergebnis<unknown, 'ungueltige_eingabe'> | { ok: true; wert: unknown },
  ausfuehren: (validierteNutzlast: unknown) => Promise<Ergebnis<T, F>>,
): void {
  // KEINE Pruefung, ob `kanal` in der Registry (#25) steht, und KEIN Import von
  // KANAELE: #25 ist von diesem Issue BLOCKIERT, ein Import drehte die Abhaengigkeit
  // um. Die Auflage "kanal MUSS aus der Kanal-Namens-Registry stammen" trifft den
  // AUFRUFER (die Verdrahtungs-Issues #71, #76, #77, #93, ...); in dieser Datei kommt
  // konsequent kein einziger Kanalname vor.
  //
  // KEIN Schutz gegen doppelte Registrierung: `ipcMain.handle` wirft von sich aus,
  // wenn ein Kanal zweimal belegt wird. Dieser Wurf ist erwuenscht und wird hier NICHT
  // gefangen - er faellt beim Start des Hauptprozesses an, also in der Verdrahtung
  // (#3), lange bevor ein Renderer existiert. Er reist ueber keine Prozessgrenze und
  // ist damit nicht der Fall, den TK 9.1.1 Punkt 8 meint. Ihn zu schlucken hiesse, den
  // zweiten Handler still zu verlieren - eine Operation antwortete dann dauerhaft aus
  // der falschen Registrierung.
  ipcMain.handle(kanal, async (_ereignis, nutzlast: unknown): Promise<Ergebnis<T, F>> => {
    // SCHRITT 1 - validieren, VOR jeder Wirkung auf die Daten.
    //
    // Dass auch `validiere` in einem try/catch steht, geht ueber den Wortlaut des
    // Issues ("ausfuehren() in try/catch") hinaus, widerspricht ihm aber nicht: Eine
    // Pruefung, die selbst wirft - `nutzlast.id.trim()` auf `nutzlast: null` -, ist
    // genau die "unerwartete Ausnahme" aus TK 9.1.1 Punkt 8. Ungefangen liesse sie
    // das Promise von `ipcMain.handle` ablehnen, und der Renderer bekaeme wieder den
    // verpackten Text ohne Code - der Fall, gegen den diese ganze Datei existiert.
    // Zumal der Validierer die Nutzlast als ERSTER anfasst und daher die hoechste
    // Wahrscheinlichkeit hat, an fremdartigen Eingaben zu zerbrechen.
    let geprueft: ReturnType<typeof validiere>;
    try {
      geprueft = validiere(nutzlast);
    } catch (fehler) {
      protokolliere(kanal, "validiere", fehler);
      return unbekannterFehler<T, F>(kanal);
    }

    if (!geprueft.ok) {
      // `ausfuehren` wird NICHT gerufen - "ohne jede Wirkung auf die Daten"
      // (TK 9.1.1 Punkt 6). Das ist der ganze Zweck der Reihenfolge.
      //
      // Die Fehler-Huelle des Validierers wird unveraendert weitergereicht, nicht neu
      // gebaut: Sie traegt bereits `ungueltige_eingabe` und, was mehr wiegt, die
      // MELDUNG und die optionalen `daten` des Validierers. Wer hier ein eigenes
      // Objekt formte, ersetzte "Die Dauer muss zwischen 10 und 45 Sekunden liegen"
      // durch einen Einheitssatz - und die Oberflaeche koennte dem Nutzer nicht mehr
      // sagen, WAS an seiner Eingabe falsch war.
      return geprueft;
    }

    // SCHRITT 2 + 3 - ausfuehren, Ergebnis unveraendert zurueck.
    //
    // `geprueft.wert` geht hinein, nicht `nutzlast`: Der Parameter heisst
    // `validierteNutzlast`. Der Validierer ist damit die Stelle, die roh Empfangenes
    // in Geprueftes verwandelt (Zahlen begrenzen, Felder auswaehlen) - reichte man
    // die rohe Nutzlast durch, waere seine Arbeit fuer die Fachoperation verloren und
    // jede Fachfunktion muesste ein zweites Mal pruefen.
    try {
      // `await` ist hier tragend und kein Schoenheitsfehler: Ohne es liefe ein
      // `return ausfuehren(...)` am try/catch VORBEI - eine abgelehnte Promise wuerde
      // nicht gefangen, sondern durchgereicht, und der Ausnahmefang dieses Gateways
      // waere fuer den haeufigsten Fall (asynchron werfende Fachoperation) wirkungslos.
      // Genau diese Fehlerklasse faellt in keinem Typecheck auf.
      return await ausfuehren(geprueft.wert);
    } catch (fehler) {
      protokolliere(kanal, "ausfuehren", fehler);
      return unbekannterFehler<T, F>(kanal);
    }
  });
}
// registriert einen ipcMain.handle(kanal, ...)-Listener, der:
//   1. validiere() aufruft; bei ok:false → sofort Ergebnis<T,F> mit code 'ungueltige_eingabe' zurück,
//      OHNE ausfuehren() aufzurufen (keine Wirkung auf Daten)
//   2. ausfuehren() in try/catch aufruft; jede uncaught Exception → Ergebnis<T,F> mit
//      code 'unbekannter_fehler', Exception intern geloggt, KEIN Stacktrace im Rückgabewert
//   3. das Ergebnis von ausfuehren() unverändert zurückgibt
