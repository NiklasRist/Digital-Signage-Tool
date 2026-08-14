// GENERIERT aus dem Signaturblock von Issue #151.
// [ipc-client] Ereignisse des Main-Prozesses abonnieren
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
// GERUEST-PRUEFSUMME: 19ac38a3a491fe92

// Der Ausschnitt der Preload-Bruecke (#4), den DIESE Datei benutzt - nur `on`.
//
// WARUM HIER EIN LOKALER TYP UND KEIN `declare global { interface Window ... }`:
// dieselbe Begruendung wie in der Nachbardatei desselben Moduls (#24). Eine globale Erweiterung
// gaelte im ganzen Renderer-Programm und machte `window.api` ueberall verfuegbar -
// genau die Umgehung, die der Vertrag ausschliesst ("Kein Modul im Renderer
// importiert `window.api` direkt", #24; gemeint ist: kein Modul AUSSERHALB von
// `ipc-client`). Zwei gleichlautende globale Erweiterungen in einem Ordner waeren
// ausserdem ein Konflikt, zwei lokale Sichten auf dieselbe Bruecke sind keiner.
//
// `Partial`, damit das Fehlen von `on` ein Fall ist, den der Typ zulaesst statt ihn
// wegzudefinieren: Die Definition of Done von #4 prueft ausschliesslich `invoke`.
// Der Typ wird NICHT exportiert - was diese Datei nicht anbietet, kann auch niemand
// als Abkuerzung an ihr vorbei benutzen.
interface PreloadBruecke {
  on(ereignis: string, handler: (daten: unknown) => void): () => void;
}

// KEINE PRUEFUNG DES KANALNAMENS GEGEN DIE REGISTRY (#25) und kein einziger
// Kanalname in dieser Datei - beides wie in der Nachbardatei (#24). Die Auflage "kanal MUSS
// aus der Kanal-Namens-Registry stammen" trifft den AUFRUFER; sie steht deshalb in
// der Signatur, nicht als Laufzeit-Vergleich hier. Ein Import der Registry drehte
// zudem die Abhaengigkeitsrichtung um.
/**
 * Abonniert ein Ereignis des Main-Prozesses.
 * Rückgabewert ist die Abmelde-Funktion (Muster wie die main-interne Registrierung in #47/#65).
 */
export function abonniere<T>(
  kanal: string,
  hoerer: (nutzlast: T) => void,
): () => void {
  const bruecke = (window as Window & { api?: Partial<PreloadBruecke> }).api;

  // Fehlende Bruecke: DIESELBE ANTWORT WIE IN #24, nicht eine hier neu gewaehlte.
  // Der STOPP-Block dieses Issues laesst die Frage offen und verweist ausdruecklich
  // auf die gleichlautende offene Frage in #24 - die ist inzwischen GEBAUT und wirft
  // (dortiger Rumpf: "IPC-Bruecke nicht verfuegbar"). Damit ist hier nichts zu
  // entscheiden, sondern nachzuziehen.
  //
  // Warum die stille Alternative schlechter waere: Eine wirkungslose Abmelde-Funktion
  // zurueckzugeben ergaebe eine Oberflaeche, die FUER IMMER schweigt, ohne dass es
  // jemand bemerkt - die Warteschlangen-Leiste bliebe leer, der "nicht
  // gespeichert"-Hinweis erschiene nie. Das Fehlen der Bruecke ist ein
  // Verdrahtungsfehler in #3/#4 und muss beim Aufbau des Renderer-Moduls auffallen.
  //
  // Auch `on` selbst wird geprueft, nicht nur `api`: In #4 steht `on` zwar im Block
  // "Signatur (verbindlich)", die dortige Definition of Done nimmt aber allein
  // `invoke` ab. Ein Bruch faellt sonst erst als "es kommt nie etwas an" auf.
  if (bruecke?.on === undefined) {
    throw new Error(
      `IPC-Bruecke nicht verfuegbar: window.api.on fehlt beim Abonnieren von "${kanal}". ` +
        "Ursache liegt in der Verdrahtung von Preload/Fenster (#3/#4).",
    );
  }

  // Der einzige Zustand dieser Datei (Festlegung 1 des Issues): ob DIESES Abo bereits
  // beendet wurde. Keine eigene Kanal-Hoerer-Verwaltung - jeder Aufruf registriert
  // genau einmal bei der Bruecke und gibt deren Abmeldung weiter. Eine eigene
  // Verteilliste waere eine zweite Wahrheit darueber, wer gerade zuhoert.
  let beendet = false;

  const abmeldenBeiDerBruecke = bruecke.on(kanal, (daten: unknown): void => {
    // Zusage "nach der Abmeldung kommt nichts mehr an" - abgesichert auf DIESER
    // Seite, statt sie allein der Gegenseite zu glauben: Wer waehrend einer laufenden
    // Zustellrunde abmeldet, steht in deren Momentaufnahme unter Umstaenden noch drin
    // (der Verteiler in #65 prueft main-seitig aus genau diesem Grund vor jedem
    // einzelnen Aufruf nach). Die Zeile ist billig und macht die Zusage unabhaengig
    // von der Zustell-Mechanik.
    if (beendet) {
      return;
    }

    try {
      // DER GANZE VERTRAG IN EINER ZEILE: durchreichen und typisieren. `daten as T`
      // ist ein reiner Compile-Zeit-Cast, keine Laufzeit-Transformation - es wird
      // nichts ausgepackt (kein `ok`, kein `wert`, kein `fehler`), nichts umbenannt,
      // nichts ergaenzt und kein Ersatzwert fuer `undefined`/`null` eingesetzt.
      // Ereignisse tragen keine Huelle und keinen Endzustand (TK 9.1.1, Punkte 2
      // und 5); wer hier auspackte, baute einen zweiten, konkurrierenden Weg fuer
      // Ergebnisse neben Aufruf-Ergebnis und Auftrags-Zustand.
      //
      // Ebenfalls NICHT hier: Drosseln, Entprellen, Zusammenfassen, Puffern,
      // Vergleichen mit einem vorherigen Stand. Wer drosseln will, tut es beim
      // Sender oder im anzeigenden Modul; fuer das Warteschlangen-Ereignis (#65) ist
      // am 13.08.2026 ausdruecklich entschieden worden, dass NICHT gedrosselt wird.
      hoerer(daten as T);
    } catch (ursache) {
      // Festlegung 4 des Issues, und main-seitig dieselbe Regel (#65): Ein Hoerer,
      // der wirft, reisst niemanden mit. Hier wiegt sie schwerer als dort - ein
      // durchgereichter Wurf landete im Ereignis-Verteiler der Plattform und koennte
      // die Zustellung an WEITERE Hoerer desselben Kanals beenden. Die
      // Warteschlangen-Leiste bliebe dann stehen, weil an ganz anderer Stelle ein
      // Anzeigefehler auftrat.
      //
      // Einen Meldeweg fuer die Ausnahme gibt es nicht (Ereignisse haben keinen
      // Fehlerkanal), deshalb diese Zeile - in derselben Form, die der Main-Prozess
      // bereits verwendet. Ohne sie waere ein dauerhaft kaputter Empfaenger von
      // aussen nicht von "es gibt nichts Neues" zu unterscheiden.
      console.error(
        `[ipc-client] abonniere: Ein Hoerer hat beim Zustellen von "${kanal}" geworfen:`,
        ursache,
      );
    }
  });

  return () => {
    // Idempotent (Festlegung 3): Aufraeumfunktionen von React-Effekten laufen in der
    // Entwicklung doppelt (Strict-Mode-Doppelmontage). Der zweite und jeder weitere
    // Aufruf tut nichts und wirft nicht; die Abmeldung der Bruecke wird hoechstens
    // EINMAL ausgeloest - sie entfernt genau diese Registrierung, ein zweiter Aufruf
    // duerfte also auch nie das Abo eines anderen treffen.
    if (beendet) {
      return;
    }
    beendet = true;
    abmeldenBeiDerBruecke();
  };
}
// - `kanal` MUSS aus der Kanal-Namens-Registry (#25) stammen; in DIESER Datei steht kein
//   Kanalname und kein Kanal-String
// - delegiert an window.api.on(kanal, handler) aus der Preload-Bridge (#4) und castet NUR den
//   Typ (keine Laufzeit-Transformation): die Nutzlast erreicht den Hörer genau so, wie der Main
//   sie gesendet hat
// - packt NICHTS aus: Ereignisse tragen keine Ergebnis-Hülle und keinen Endzustand
//   (TK 9.1.1, Punkte 2 und 5). Es gibt daher auch keinen Fehlerkanal und kein Ergebnis<T>
// - bei der ZUSTELLUNG einer Meldung wird nie geworfen (ein werfender Hörer wird abgefangen);
//   der Sonderfall „Bridge nicht verfügbar" beim Anmelden ist NICHT hier entschieden – s. STOPP
// - Aufruf der zurückgegebenen Funktion beendet das Abo; weitere Aufrufe sind wirkungslos
