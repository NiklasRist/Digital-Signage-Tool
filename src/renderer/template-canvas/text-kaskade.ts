// GENERIERT aus dem Signaturblock von Issue #113.
// [template-canvas] Text-Überlauf-Kaskade umbrechen, verkleinern, kürzen
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
// GERUEST-PRUEFSUMME: 348169bfc796085a

// DIESE DATEI ZEICHNET NICHT UND MISST NICHT SELBST.
//
// Sie ist der rechnende Teil der einzigen Pixelquelle (TK 9.10.1): Anzeige und
// PNG-Export stammen aus DEMSELBEN Aufruf, also muss auch die Entscheidung
// "wie viele Zeilen, welche Groesse, gekuerzt oder nicht" genau einmal fallen.
// Gemessen wird ausschliesslich ueber den uebergebenen `messeBreite` - auf
// demselben Kontext, auf dem #114 anschliessend zeichnet. Ein hier selbst
// erzeugtes Hilfs-Canvas waere ein zweiter Messkontext mit eigener Schrift-
// einstellung: Der Umbruch passte dann rechnerisch, aber nicht zum gezeichneten
// Text - und zwar lautlos, weil Vorschau und Render denselben Fehler zeigen.
//
// DETERMINISMUS (TK 9.10.3, Punkt 5) ist der zweite Grund fuer den Zuschnitt:
// Es gibt in dieser Datei keine Zeit, keinen Zufall, keinen Zwischenspeicher und
// keine gebietsabhaengige Funktion (kein `Intl`, kein `toLocaleUpperCase`, keine
// `localeCompare`). Alles, was das Ergebnis bestimmt, kommt aus `eingang` und aus
// den Rueckgabewerten von `messeBreite`. Ein Cache waere hier besonders teuer: Er
// lieferte nach einem Schriftwechsel alte Breiten, und die paar Messungen je
// Aufruf sind billig (Festlegung 9 des Issues).

export const ZEILENHOEHE_FAKTOR = 1.2
// Zeilenhöhe = Schriftgröße × ZEILENHOEHE_FAKTOR. Diese Konstante ist die EINZIGE Wahrheit über den
// Zeilenabstand: #114 muss sie importieren und für den Zeilenvorschub beim Zeichnen benutzen.
// Rechnet die Kaskade mit 1.2 und das Zeichnen mit einem anderen Wert, ragt der Text aus der Zone.

export interface KaskadenEingang {
  text: string
  breite: number      // Zonenbreite in px   – zone.rahmen.breite
  höhe: number        // Zonenhöhe in px     – zone.rahmen.höhe
  größeMax: number    // zone.text.größeMax
  größeMin: number    // zone.text.größeMin
  maxZeilen: number   // zone.text.maxZeilen
}

export interface KaskadenErgebnis {
  zeilen: string[]    // fertige Zeilen, in Zeichenreihenfolge; keine führenden/folgenden Leerzeichen
  größe: number       // gewählte Schriftgröße in px, ganzzahlig, immer in [größeMin, größeMax]
  gekürzt: boolean    // true, wenn Stufe 3 („…") gegriffen hat
}

// U+2026, EIN Zeichen (Festlegung 6 des Issues). Als Escape geschrieben und nicht
// als sichtbares Zeichen, damit unmissverstaendlich ist, WELCHER Codepoint hier
// steht: Drei einzelne Punkte messen anders und sehen in den Marken-Schriften
// anders aus. Gemessen wird unten mit genau dieser Konstante und gezeichnet wird
// von #114 genau dieser String - der lautlose Unterschied "mit Punkten gemessen,
// mit Auslassungszeichen gezeichnet" kann so nicht entstehen.
const KUERZUNGSZEICHEN = "\u2026";

// Trenner fuer Schritt 1 des Ablaufs. `\s+` fasst eine FOLGE von Leerraum zu EINEM
// Trenner zusammen; ohne das `+` entstuenden aus doppelten Leerzeichen leere
// "Woerter" und daraus Zeilen mit fuehrendem Leerzeichen, was `KaskadenErgebnis`
// ausschliesst.
//
// `\s` ist weiter als die drei im Ablauf genannten Zeichen (Leerzeichen, Tabulator,
// Zeilenumbruch): Es umfasst auch das geschuetzte Leerzeichen U+00A0. Das ist
// bewusst so gewaehlt - die engere Fassung `[ \t\n\r]` liesse ein fuehrendes
// U+00A0 am ersten Wort kleben, und die Zusage "keine fuehrenden/folgenden
// Leerzeichen" waere gebrochen. Der Preis ist, dass ein geschuetztes Leerzeichen
// seine bindende Wirkung verliert; das ist im Bericht vermerkt.
const LEERRAUM = /\s+/;

export function passeTextEin(
  eingang: KaskadenEingang,
  messeBreite: (text: string, größe: number) => number,
): KaskadenErgebnis {
  const { text, breite, höhe, größeMax, größeMin, maxZeilen } = eingang;

  // ZUERST DIE ZONENPARAMETER, ERST DANN DER TEXT. Ein leerer Text in einer
  // kaputten Zone ist kein harmloser Fall, sondern eine kaputte Zone - er darf
  // nicht das Ergebnis `{ zeilen: [] }` liefern und den Mangel damit zudecken.
  //
  // Geworfen wird und KEINE `Ergebnis<T>`-Huelle gebaut (Festlegung 8): TK 9.1.1
  // regelt die Renderer-Main-Grenze, die diese Funktion nicht ueberschreitet, und
  // `zeichneSegment` (TK 9.10.1) liefert ein `SegmentBild` ohne Huelle - ein
  // `Ergebnis` kaeme nirgends an. Unzulaessige Werte sind hier ausserdem kein
  // Nutzerfehler, sondern kaputte Vorlagendaten.
  pruefeMass("breite", breite);
  pruefeMass("höhe", höhe);
  pruefeGanzzahl("größeMax", größeMax, 1);
  pruefeGanzzahl("größeMin", größeMin, 1);
  if (größeMax < größeMin) {
    // KEIN stilles Vertauschen. Zwei Stellen, die kaputte Werte unterschiedlich
    // zurechtbiegen, liefern verschiedene Bilder fuer dieselben Vorlagendaten -
    // und die Pixelgleichheit von Vorschau und Render haengt daran.
    throw new Error(
      `text-kaskade: größeMax (${größeMax}) ist kleiner als größeMin (${größeMin}).`,
    );
  }
  pruefeGanzzahl("maxZeilen", maxZeilen, 1);

  // `messeBreite` WIRD NICHT GEPRUEFT: Die Fehlerpfad-Tabelle des Issues ist als
  // vollstaendig bezeichnet und nennt den Messer nicht. Fehlt er, wirft der erste
  // Aufruf ohnehin - ein zusaetzlicher, im Vertrag nicht vorgesehener Wurf waere
  // ein Fehlerpfad, den kein Aufrufer kennt.

  // Schritt 1: Woerter. `filter` faengt den Rest ab, den `split` an den Raendern
  // erzeugt (fuehrender/folgender Leerraum ergibt je einen leeren Eintrag).
  const woerter = text.split(LEERRAUM).filter((wort) => wort.length > 0);
  if (woerter.length === 0) {
    // Leer oder nur Leerraum ist GUELTIG. Ob die Zone dann leer bleibt oder ganz
    // entfaellt, entscheidet `wennLeer` beim Aufrufer (TK 9.11.1) - hier waere
    // jede Vorwegnahme eine zweite Stelle, die ueber Sichtbarkeit befindet.
    // `größeMax` als Groesse, weil nichts die Kaskade ausgeloest hat.
    return { zeilen: [], größe: größeMax, gekürzt: false };
  }

  // STUFE 1 UND 2 IN EINER SCHLEIFE - und die Reihenfolge ist der Kern des ganzen
  // Issues: Fuer JEDE Groesse wird zuerst vollstaendig umgebrochen und dann
  // geprueft. Wer stattdessen zuerst verkleinerte und erst danach umbraeche,
  // setzte Text kleiner, wo eine zweite Zeile gereicht haette - auf einem
  // Fernseher aus mehreren Metern Entfernung der Unterschied zwischen lesbar und
  // unlesbar (TK 9.10.6).
  //
  // 1-px-Schritte (Festlegung 2): groebere Stufen springen zwischen zwei Aktionen
  // mit aehnlich langen Titeln sichtbar, feinere kosten Messungen ohne Gewinn.
  // Weil `größeMax` und `größeMin` als ganze Zahlen geprueft sind, ist jede so
  // erreichte Groesse ganzzahlig und liegt in [größeMin, größeMax] - genau das,
  // was `KaskadenErgebnis.größe` zusagt.
  for (let größe = größeMax; größe >= größeMin; größe -= 1) {
    const zeilen = brichUm(woerter, breite, größe, messeBreite);

    const passtInZeilenzahl = zeilen.length <= maxZeilen;
    // DER VERTIKALE TEST IST PFLICHT (Festlegung 4). Ohne ihn passt ein Text
    // horizontal und laeuft trotzdem unten aus der Zone - TK 9.10.6 verspricht
    // aber "nie ein zerstoertes Layout". Gerechnet wird mit derselben Konstante,
    // die #114 fuer den Zeilenvorschub benutzt; zwei Werte hier und dort waeren
    // ein Text, der ueber den Rand ragt, obwohl beide Seiten "richtig" rechnen.
    const passtInHoehe = zeilen.length * größe * ZEILENHOEHE_FAKTOR <= höhe;
    // Der Umbruch garantiert die Breite nur fuer Zeilen aus MEHREREN Woertern; ein
    // einzelnes Wort, das allein zu breit ist, steht trotzdem in seiner Zeile
    // (getrennt wird nicht, Festlegung 1). Genau dieser Fall wird hier gefunden
    // und schickt die Kaskade eine Stufe weiter.
    const passtInBreite = zeilen.every((zeile) => messeBreite(zeile, größe) <= breite);

    if (passtInZeilenzahl && passtInHoehe && passtInBreite) {
      return { zeilen, größe, gekürzt: false };
    }
  }

  // STUFE 3, nur erreichbar, wenn KEINE Groesse gepasst hat - und ausschliesslich
  // bei `größeMin`. Damit ist die Zusage der DoD ("gekuerzt wird ausschliesslich
  // bei größeMin") eine Eigenschaft des Kontrollflusses und nicht eine, an die man
  // sich erinnern muss.
  const zeilen = brichUm(woerter, breite, größeMin, messeBreite);

  const maxZeilenEffektiv = Math.min(
    maxZeilen,
    Math.floor(höhe / (größeMin * ZEILENHOEHE_FAKTOR)),
  );
  if (maxZeilenEffektiv < 1) {
    // Die Zone ist selbst fuer EINE Zeile zu niedrig. Dann wird nichts gezeichnet,
    // statt ueber den Rand hinaus zu schreiben: Ein Rest, der in die Nachbarzone
    // ragt, faellt in der Vorschau kaum auf und steht anschliessend im Endvideo.
    return { zeilen: [], größe: größeMin, gekürzt: true };
  }

  const behalten = zeilen.slice(0, maxZeilenEffektiv);
  const letzterIndex = behalten.length - 1;
  const letzteZeile = behalten[letzterIndex];
  if (letzteZeile === undefined) {
    // Unerreichbar: `woerter` ist hier nicht leer, `brichUm` liefert also
    // mindestens eine Zeile, und `maxZeilenEffektiv` ist mindestens 1. Der Zweig
    // steht, weil `noUncheckedIndexedAccess` den Index-Zugriff als moeglicherweise
    // `undefined` fuehrt - und die Fluchttuer `behalten[i]!` ist projektweit
    // verboten (eslint: no-non-null-assertion), weil sie Code geprueft aussehen
    // laesst, der es nicht ist.
    return { zeilen: [], größe: größeMin, gekürzt: true };
  }

  // GEKUERZT WIRD UEBER CODEPOINTS (Festlegung 7). `Array.from` zerlegt in
  // Codepoints; ein Index-Zugriff auf den String zerschnitte Surrogatpaare (Emoji)
  // und erzeugte ein Ersatzzeichen-Kaestchen - im Endvideo, nicht im Test.
  //
  // (Grapheme-Cluster bleiben davon unberuehrt: Eine Emoji-Familie mit
  // Zero-Width-Joinern besteht aus mehreren Codepoints und kann zwischen ihnen
  // getrennt werden. Das Issue legt Codepoints ausdruecklich fest; eine
  // Cluster-Zerlegung ginge nur ueber `Intl.Segmenter` und waere damit
  // gebietsabhaengig - also nicht mehr deterministisch.)
  const rest = Array.from(letzteZeile);
  while (
    rest.length > 0 &&
    messeBreite(rest.join("") + KUERZUNGSZEICHEN, größeMin) > breite
  ) {
    rest.pop();
  }

  // Bleibt nichts uebrig, lautet die Zeile genau das Kuerzungszeichen - der Fall
  // "selbst das Auslassungszeichen passt nicht in die Breite" aus Ablauf 3d faellt
  // damit von selbst richtig heraus, ohne eigene Verzweigung.
  //
  // Ein am Ende stehen gebliebenes Leerzeichen wird NICHT abgeschnitten: Der
  // Ablauf beschreibt genau "entfernen, bis es passt, dann anhaengen". Ein
  // zusaetzliches Trimmen waere schmaler als gemessen und damit ungefaehrlich,
  // aber es waere eine Regel, die nur an dieser einen Stelle existiert.
  behalten[letzterIndex] = rest.join("") + KUERZUNGSZEICHEN;

  return { zeilen: behalten, größe: größeMin, gekürzt: true };
}
// Reine Funktion: kein Canvas, kein DOM, keine Nebenwirkung. Gemessen wird ausschließlich über den
// übergebenen Messer.

/**
 * Greedy-Umbruch bei EINER Groesse (Ablauf 2a): Woerter der Reihe nach an die
 * aktuelle Zeile haengen, solange die Zeile mit dem naechsten Wort in die Breite
 * passt; sonst eine neue Zeile beginnen.
 *
 * Greedy und nicht "optimal ausgeglichen" (Knuth-Plass): Ein ausgleichendes
 * Verfahren braucht Gewichte, deren Wahl niemand im Projekt begruendet festlegen
 * koennte, und liefert bei minimal anderen Messwerten sprunghaft andere
 * Zeilenaufteilungen. Greedy ist bei gleicher Eingabe immer dasselbe.
 *
 * Das erste Wort einer Zeile wird IMMER aufgenommen, auch wenn es allein zu breit
 * ist - getrennt wird nicht (Festlegung 1: korrekte deutsche Silbentrennung
 * braucht ein Woerterbuch, und ein falsch getrenntes Wort auf einem Werbebildschirm
 * ist schlimmer als ein kleiner gesetztes). Der Aufrufer erkennt den Fall an der
 * Breitenpruefung und geht eine Stufe weiter.
 */
function brichUm(
  woerter: string[],
  breite: number,
  größe: number,
  messeBreite: (text: string, größe: number) => number,
): string[] {
  const zeilen: string[] = [];
  let aktuell: string | null = null;

  for (const wort of woerter) {
    if (aktuell === null) {
      aktuell = wort;
      continue;
    }
    // Verbunden wird mit genau EINEM Leerzeichen - gemessen wird also derselbe
    // String, den #114 spaeter zeichnet.
    // Die Annotation ist noetig, nicht Zierrat: `aktuell` wird unten aus `versuch`
    // belegt, `versuch` aus `aktuell` gebildet - ohne sie meldet tsc TS7022
    // (Zirkelschluss bei der Typherleitung) und der Wert waere `any`.
    const versuch: string = aktuell + " " + wort;
    if (messeBreite(versuch, größe) <= breite) {
      aktuell = versuch;
    } else {
      zeilen.push(aktuell);
      aktuell = wort;
    }
  }

  if (aktuell !== null) {
    zeilen.push(aktuell);
  }
  return zeilen;
}

/**
 * `breite` und `höhe`: endlich und groesser als 0. Die Meldung nennt Feld und
 * Wert, weil der Fehler aus einer Vorlage stammt und der Leser wissen muss,
 * WELCHE Zahl dort kaputt ist - "ungueltiger Parameter" schickt ihn suchen.
 */
function pruefeMass(feld: string, wert: number): void {
  if (!Number.isFinite(wert) || wert <= 0) {
    throw new Error(
      `text-kaskade: ${feld} muss eine endliche Zahl groesser als 0 sein, bekommen: ${wert}.`,
    );
  }
}

/**
 * `größeMax`, `größeMin` und `maxZeilen`: ganzzahlig und mindestens `minimum`.
 *
 * KEIN stilles Runden. Die Kaskade laeuft in ganzen Pixeln; wer hier rundete,
 * legte eine zweite Rundungsregel neben die des Zeichnens - und zwei Stellen, die
 * unterschiedlich runden, brechen die Pixelgleichheit von Vorschau und Render.
 */
function pruefeGanzzahl(feld: string, wert: number, minimum: number): void {
  if (!Number.isInteger(wert) || wert < minimum) {
    throw new Error(
      `text-kaskade: ${feld} muss eine ganze Zahl >= ${minimum} sein, bekommen: ${wert}.`,
    );
  }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEINE AUSWERTUNG VON `gekürzt` (Festlegung 10). Ob die Oberflaeche daraus
//    eine Warnung macht, entscheiden die aufrufenden Module; diese Funktion meldet
//    nur die Tatsache.
//
// 2. KEINE SONDERBEHANDLUNG HARTER ZEILENUMBRUECHE. `\n` gilt hier wie jeder
//    andere Leerraum (Ablauf 1). Ob der action-editor (M5) mehrzeilige Eingaben
//    zulaesst und ein vom Nutzer gesetzter Umbruch dann ERZWUNGEN werden soll, ist
//    nirgends festgelegt - eine erzwungene Zeile liefe gegen `maxZeilen` und
//    braechte die Kaskade in einen Zustand, den TK 9.10.6 nicht beschreibt.
//
// 3. NUR DIE LETZTE VERBLEIBENDE ZEILE WIRD GEKUERZT (Ablauf 3c, woertlich). Steht
//    ein allein zu breites Wort NICHT in der letzten Zeile, ragt seine Zeile
//    weiterhin ueber die Zonenbreite hinaus. Das ist keine Nachlaessigkeit,
//    sondern der beschriebene Ablauf; die Abhilfe (jede zu breite Zeile kuerzen)
//    waere eine Aenderung des verbindlichen Ablaufs und gehoert ins Issue. S.
//    Bericht/STOPP.
