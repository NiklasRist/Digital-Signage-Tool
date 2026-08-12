// GENERIERT aus dem Signaturblock von Issue #29.
// [config-store] leseMarke implementieren
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
// GERUEST-PRUEFSUMME: 1472e46a1bc56eaa

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { SICHERHEITSABSTAND_PX } from '../../shared/contracts/konstanten'   // #21
import type { Marke } from '../../shared/contracts/marke'

// WOHER DIE MARKENDATEN KOMMEN - der STOPP-Punkt des Issues, hier beantwortet und
// zu bestaetigen (s. Bericht):
//
// Das Issue laesst offen, ob die gebuendelte Marke als JSON im Bundle liegt oder als
// TypeScript-Konstante. Sie liegt als KONSTANTE hier. Drei Gruende:
//
// 1. VOLLSTAENDIGKEIT WIRD ERZWUNGEN. `Marke.farben` ist `Record<FarbRolle, string>`,
//    `schriften` ist `Record<SchriftRolle, Schrift>` - eine fehlende Rolle uebersetzt
//    nicht. Aus JSON kaeme `unknown`; die Vollstaendigkeit muesste eine handgeschriebene
//    Pruefung ueber dreizehn Farb- und vier Schrift-Rollen sichern, und faellt dort eine
//    Rolle durch, zeichnet das Canvas spaeter mit `undefined` als Farbe. Dieser Fehlgriff
//    ist still: Er faellt weder im Typecheck noch im Test auf, sondern erst im fertigen
//    Video. Genau davor schuetzt der Record - aber nur, solange die Werte im TypeScript
//    stehen.
// 2. EINE JSON-DATEI ERZEUGTE DEN VERPACKUNGSFEHLER, DEN SIE VERHINDERN SOLL. Der Main
//    wird von esbuild zu einer einzigen `dist/main/index.js` gebuendelt (#2); eine
//    Datendatei daneben braucht einen eigenen Eintrag in der Verpackung (#7/#8), den es
//    heute nicht gibt. Die Konstante reist im Bundle mit und kann nicht fehlen.
// 3. NIEMAND SCHREIBT DIESE DATEN. In diesem Vertragsstand ist die Marke gebuendelt und
//    read-only - eine Datei brauchte man erst, wenn ein Editor sie aendert (das kommt mit
//    dem `marken-store`, s. Vermerk unten).
//
// FOLGE FUER DIE FEHLERTABELLE DES ISSUES: Der dort genannte Pfad "gebuendelte Markendatei
// fehlt/beschaedigt -> unbekannter_fehler" kann mit einer Konstante nicht mehr eintreten.
// Er wird ABSICHTLICH NICHT als toter Zweig nachgebaut: Eine Pruefung, die nie anschlagen
// kann, sieht wie eine Absicherung aus und ist keine. Die Ergebnis-Huelle bleibt trotzdem
// - sie ist der Vertrag der Instant-Operation (TK 9.1.1), nicht die Ankuendigung eines
// Fehlers.

/**
 * Die Werte stammen woertlich aus TK 9.11.2 ("Farb-Rollen (v1, fest)" /
 * "Schrift-Rollen (v1, fest)") und decken sich mit Anforderungsdokument 4.2.
 *
 * ZWEI FELDER SIND PLATZHALTER und nicht durch TK/AD gedeckt - `logo` und `slogan`
 * (Begruendung an den Feldern). Sie sind gefuellt, weil der Typ sie verlangt, und
 * MUESSEN vor der ersten echten Ausgabe geklaert werden.
 */
const MARKE: Marke = friereTief<Marke>({
  farben: {
    akzent: '#FF4040',              // Primaerfarbe - Badges, Preis, CTA
    akzentKraeftig: '#DF3131',
    akzentTief: '#971316',
    flaecheDunkel: '#2F2E2E',       // Segment- und Band-Hintergrund; auch die Split-Restflaechen
    flaecheSehrDunkel: '#4B090B',
    flaecheHell: '#FFFFFF',
    flaecheAkzentZart: '#F5AEAF',
    textAufDunkel: '#FFFFFF',
    textAufHell: '#202020',
    textSekundaer: '#8F8F8F',
    linie: '#CCCCCC',
    scrimStart: '#00000000',        // 8-stellig = mit Alpha: der Verlauf beginnt durchsichtig
    scrimEnde: '#000000B3',
  },
  // `datei` nennt den Dateinamen im Renderer-Bundle. Die vier Dateien liegen dort
  // tatsaechlich (src/renderer/assets/fonts/, angelegt mit #2/#8) - der Test haelt das
  // fest, damit ein Umbenennen nicht lautlos ins Leere zeigt.
  schriften: {
    headlineElegant: { familie: 'Playfair Display', gewicht: 700, datei: 'PlayfairDisplay-Bold.woff2' },
    headlinePlakativ: { familie: 'Archivo Black', gewicht: 900, datei: 'ArchivoBlack-Regular.woff2' },
    fliesstext: { familie: 'Arimo', gewicht: 400, datei: 'Arimo-Regular.woff2' },
    fliesstextFett: { familie: 'Arimo', gewicht: 700, datei: 'Arimo-Bold.woff2' },
  },
  // PLATZHALTER, ungeklaert: Es gibt im Repository KEINE gebuendelte Logo-Datei.
  // `tools/assets/logo.png` gehoert der Word-Erzeugung der Planungsdokumente und ist
  // nicht dasselbe Asset. Der Typ laesst hier kein `null` zu (spaetere Vertragsstaende
  // tun das), also steht ein Name da, den es nicht gibt - mit Absicht der ungefaehrliche
  // Fall: `bereiteLogoVor` (#119) wirft NUR bei LEEREM `datei` und legt ein nicht
  // ladbares Logo sonst als { zustand: 'fehlt' } ab. Ein leerer String haette also einen
  // Absturz ausgeloest, dieser Name loest den vorgesehenen Fehlt-Pfad aus.
  // Das Seitenverhaeltnis ist aus der Logo-Zone der eingebauten Vorlagen abgeleitet
  // (420x120 px -> 3,5, TK 9.11.1 "Seitenverhaeltnis des Assets ~ 3,5 : 1"), gilt aber
  // erst, sobald das echte Asset vorliegt: Passt es nicht, wird das Logo sichtbar
  // gestaucht, ohne dass ein Typecheck etwas meldet.
  logo: { datei: 'logo-fitnessworld24.png', seitenverhaeltnis: 3.5 },
  // Die Konstante selbst, nicht ihre Zahlen (12.08.2026): Seit #52 lautet der Typ
  // `typeof SICHERHEITSABSTAND_PX`, ein abweichendes Literal faellt also schon im
  // Typecheck durch. Der direkte Verweis macht daraus Gleichheit statt Uebereinstimmung.
  sicherheit: SICHERHEITSABSTAND_PX,
  radien: { pille: 40, karte: 10, klein: 2 },
  schatten: { versatzY: 4, weichzeichnen: 8, farbe: '#0000001A' },
  // PLATZHALTER, ungeklaert: TK 9.11.2 gibt nur die FORM vor, keinen Text; der Satz im
  // Anforderungsdokument 4.1 steht dort ausdruecklich als Beispiel. `aktiv: false` ist
  // deshalb die sichere Belegung - ein abgeschalteter Slogan zeigt nichts an, solange
  // niemand einen verbindlichen Text hinterlegt hat. Ein geratener Text stuende sonst
  // auf dem Fernseher im Studio.
  slogan: { text: '', aktiv: false },
})

export async function leseMarke(): Promise<Ergebnis<Marke>> {
  // Bewusst DASSELBE Objekt bei jedem Aufruf, keine frische Kopie: Es ist eingefroren,
  // also kann es niemand verstellen, und ein Aufrufer darf zwei Marken vergleichen, ohne
  // dass ihm die Gleichheit unter der Hand zerfaellt. Ueber die IPC-Grenze wird ohnehin
  // kopiert (strukturiertes Klonen) - die Sperre wirkt fuer die Main-seitigen Leser
  // (render-service, ffmpeg-adapter), und die sind die kritischen.
  return { ok: true, wert: MARKE }
}

/**
 * Friert `wert` und alles darin ein und gibt ihn unveraendert zurueck.
 *
 * WARUM UEBERHAUPT: "read-only" ist im Typ nicht ausgedrueckt - `Marke.farben` ist ein
 * schreibbarer Record. Ein Main-Modul koennte also `marke.farben.akzent` setzen, und ab
 * da saehe JEDER spaetere Leser die verstellte Farbe, ohne dass irgendwo ein Schreibpfad
 * sichtbar waere. Eingefroren scheitert dieser Zugriff laut und sofort (ES-Module laufen
 * im strikten Modus, die Zuweisung wirft), statt still das Erscheinungsbild aller
 * folgenden Renders zu aendern.
 *
 * `Object.freeze` allein reichte nicht: Es wirkt nur eine Ebene tief, und genau die
 * interessanten Werte liegen eine Ebene tiefer (`farben`, `schriften`).
 */
function friereTief<T>(wert: T): T {
  if (typeof wert === 'object' && wert !== null) {
    for (const feld of Object.values(wert as Record<string, unknown>)) {
      friereTief(feld)
    }
    Object.freeze(wert)
  }
  return wert
}

// VERMERK ZUM VERTRAGSSTAND (nicht selbst behoben - Signatur ist verbindlich):
// Das Issue haelt selbst fest, dass diese Operation seit TK v3.4 nicht mehr dem
// config-store gehoert: Die Marke ist ein app-weiter Bestand des `marken-store` (TK
// 9.15.1), `leseMarke` traegt dort eine `markeId`, liefert eine AUFGELOESTE Marke samt
// `herkunftJeFeld`, und `Marke` hat dort `id`, `name`, `parent`, `eingebaut` und ein
// `logo: ... | null`. Der HEUTE gebaute Typ (#52, src/shared/contracts/marke.ts) kennt
// nichts davon. Gebaut ist deshalb genau das, was der aktuelle Vertrag hergibt: die eine
// gebuendelte Marke, ohne Argument. Wer M8 umsetzt, ersetzt diese Datei - er ergaenzt sie
// nicht.
