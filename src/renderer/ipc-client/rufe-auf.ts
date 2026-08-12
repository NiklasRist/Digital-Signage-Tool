// GENERIERT aus dem Signaturblock von Issue #24.
// [ipc] ipc-client typisierten Invoke-Wrapper bauen
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
// GERUEST-PRUEFSUMME: 6a988563284ac630
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

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'

// Der Ausschnitt der Preload-Bruecke (#4), den DIESE Datei benutzt - nur `invoke`.
//
// WARUM HIER EIN LOKALER TYP UND KEIN `declare global { interface Window ... }`:
// Eine globale Erweiterung gilt im ganzen Renderer-Programm. Sie wuerde `window.api`
// ueberall sichtbar und damit bequem machen - genau das, was die DoD dieses Issues
// verbietet ("Kein Modul ausserhalb von src/renderer/ipc-client/ importiert
// window.api direkt"). Eine Zusage, die zugleich die Umgehung ausliefert, ist keine.
// Ausserdem braucht `abonniere` (#151) denselben Griff auf `window.api.on`; zwei
// gleichlautende globale Erweiterungen in einem Ordner sind ein Konflikt, zwei
// lokale Sichten auf dieselbe Bruecke sind keiner.
//
// Der Typ beschreibt bewusst nur `invoke` und wird NICHT exportiert: Was diese Datei
// nicht aufruft, soll sie auch nicht anbieten.
interface PreloadBruecke {
  invoke(kanal: string, nutzlast?: unknown): Promise<unknown>;
}

// KEINE PRUEFUNG DES KANALNAMENS GEGEN DIE REGISTRY (#25) - und das ist kein
// Versehen: #25 ist von diesem Issue BLOCKIERT, nicht umgekehrt. Ein Import der
// Registry drehte die Abhaengigkeit um. Die Auflage "kanal MUSS aus der
// Kanal-Namens-Registry stammen" trifft den AUFRUFER; sie steht deshalb in dessen
// Signatur, nicht als Laufzeit-Vergleich hier. In dieser Datei kommt konsequent kein
// einziger Kanalname vor.
export async function rufeAuf<T, F extends string = GenerischerFehlercode>(
  kanal: string,
  nutzlast?: unknown,
): Promise<Ergebnis<T, F>> {
  const bruecke = (window as Window & { api?: PreloadBruecke }).api;

  // Das Fehlen der Bruecke ist ein Verdrahtungsfehler in #3/#4, kein Fachfehler des
  // Aufrufers - und der STOPP-Block dieses Issues laesst ausdruecklich OFFEN, ob
  // daraus ein synthetisches `unbekannter_fehler`-Ergebnis werden soll. Hier wird
  // deshalb KEINE Huelle erfunden, sondern geworfen; das Promise lehnt genauso ab,
  // wie es ein Zugriff auf `undefined.invoke` taete, nur mit lesbarem Grund. Faellt
  // die Entscheidung spaeter auf "synthetisches Ergebnis", ist dies die eine Stelle,
  // an der sie einzubauen ist.
  if (bruecke === undefined) {
    throw new Error(
      `IPC-Bruecke nicht verfuegbar: window.api fehlt beim Aufruf von "${kanal}". ` +
        "Ursache liegt in der Verdrahtung von Preload/Fenster (#3/#4).",
    );
  }

  // Der ganze Rumpf in einer Zeile - das IST der Vertrag: durchreichen und typisieren.
  //
  // KEIN try/catch: Lehnt die Gegenseite ab (kein Handler auf dem Kanal, Main-Absturz),
  // lehnt dieses Promise mit demselben Grund ab. Ein Fangen und Umverpacken waere die
  // Laufzeit-Transformation, die die Signatur ausschliesst - und die Preload-Bruecke
  // haelt sich eine Ebene tiefer aus demselben Grund heraus.
  //
  // KEINE Pruefung der Antwortform: Ein `if (!("ok" in antwort))` sieht nach Sorgfalt
  // aus, verschoebe aber die Zustaendigkeit. Die Huelle baut das ipc-gateway (#23) -
  // hier zusaetzlich zu pruefen hiesse, dem Main zu misstrauen und zugleich einen
  // zweiten Ort zu schaffen, an dem entschieden wird, was eine gueltige Antwort ist.
  //
  // Die Zusicherung ist damit ehrlich das, was sie ist: eine BEHAUPTUNG ueber die
  // Gegenseite. Sie traegt genau so weit, wie Kanalname und `T`/`F` am Aufrufer zur
  // registrierten Operation passen - dafuer sorgen die Kanal-Registry (#25) und die
  // Operations-Signaturen aus TK Abschnitt 9, nicht dieser Cast.
  return (await bruecke.invoke(kanal, nutzlast)) as Ergebnis<T, F>;
}
// delegiert an window.api.invoke(kanal, nutzlast) und castet NUR den Typ (keine Laufzeit-
// Transformation) – die Struktur, die der Main zurückgibt, MUSS bereits Ergebnis<T,F> sein
