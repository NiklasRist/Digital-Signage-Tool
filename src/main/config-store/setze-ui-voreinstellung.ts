// GENERIERT aus dem Signaturblock von Issue #30.
// [config-store] setzeUIVoreinstellung implementieren
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
// GERUEST-PRUEFSUMME: 3e751f3399c2d947
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
import { aendereKonfig } from './schreibe-config'                    // #31

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #31: aendereKonfig<T>(
//          aenderung: (konfig: AppKonfig) => Ergebnis<{ konfig: AppKonfig; wert: T }, ConfigFehlercode>,
//        ): Promise<Ergebnis<T, ConfigFehlercode>>
//        // Lesen - Aendern - Schreiben als EINE ununterbrechbare Einheit; der Rueckruf ist
//        // SYNCHRON und darf nicht awaiten. type ConfigFehlercode = 'speicher_fehler'
//   #265: interface AppKonfig { aktivesProjektId: string | null
//                               letztesExportZiel: string | null
//                               uiVoreinstellungen: Record<string, unknown> }

/**
 * Speichert EINEN Oberflaechen-Schluessel in `config.json` (TK 9.5.6, FA-15).
 *
 * WARUM `aendereKonfig` UND NICHT `leseKonfig` + `schreibeConfig`: Diese Operation aendert einen
 * einzigen Schluessel in `uiVoreinstellungen` und muss dabei alle uebrigen Felder mitnehmen. Zwischen
 * einem eigenen `leseKonfig()` und einem eigenen `schreibeConfig()` kann eine zweite Setz-Operation
 * dazwischenkommen; beide saehen denselben Ausgangsstand, beide schrieben ihren eigenen Schluessel,
 * und der zuerst geschriebene waere weg. `aendereKonfig` klammert Lesen und Schreiben zu einer
 * ununterbrechbaren Einheit - deshalb ist der Rueckruf unten synchron und enthaelt KEIN `await`.
 *
 * REIHENFOLGE: Beide Pruefungen laufen VOR dem ersten Zugriff auf die Datei (DoD 1). Ein
 * abgelehnter Aufruf darf `config.json` nicht anfassen - auch nicht die `.bak`-Sicherung, die
 * `schreibeConfig` bei jedem Durchlauf neu zoege.
 */
export async function setzeUIVoreinstellung(schlüssel: string, wert: unknown): Promise<Ergebnis<void>> {
  // Laufzeit-Pruefung trotz `string` im Vertrag: Der Aufrufer sitzt im Renderer, und ueber die
  // IPC-Grenze kommt an, was der andere Prozess schickt - der Typ ist dort eine Zusage, keine
  // Schranke. Ein leerer Schluessel legte in `uiVoreinstellungen` einen Eintrag "" an, den nie
  // wieder jemand liest.
  if (typeof schlüssel !== 'string' || schlüssel.trim().length === 0) {
    return fehler('ungueltige_eingabe', 'Der Schluessel einer UI-Voreinstellung darf nicht leer sein.')
  }

  // Der Schluessel wird NICHT getrimmt, nur geprueft. Wer ' reiter ' setzt und spaeter unter
  // 'reiter' liest, soll nichts finden - stilles Umschreiben des Schluessels waere schlimmer als
  // ein leerer Treffer, weil dann Setzen und Lesen dauerhaft aneinander vorbeilaufen.

  // Serialisierbarkeit VORAB pruefen, statt sie `schreibeConfig` finden zu lassen. Dort faellt ein
  // unbrauchbarer Wert zwar auch auf - aber erst NACHDEM die Sicherung schon gezogen ist, und der
  // Fehler traegt dann die ganze Konfiguration im Text statt diesen einen Wert.
  let serialisiert: string | undefined
  try {
    serialisiert = JSON.stringify(wert)
  } catch (ursache) {
    // Zirkelbezug oder BigInt - JSON.stringify wirft. Der Wurf darf nicht nach draussen: Fehler
    // reisen in der Ergebnis-Huelle, nie als Ausnahme (ergebnis.ts).
    return fehler(
      'ungueltige_eingabe',
      `Der Wert zu "${schlüssel}" ist nicht JSON-serialisierbar: ${text(ursache)}`,
    )
  }
  if (serialisiert === undefined) {
    // JSON.stringify WIRFT bei einer Funktion nicht, es liefert `undefined` - dasselbe gilt fuer
    // `undefined` selbst und fuer Symbole. Ohne diese zweite Pruefung waere die im Issue verlangte
    // Ablehnung von `() => {}` nicht zu haben.
    //
    // `undefined` wird bewusst MITABGELEHNT und nicht als "Schluessel entfernen" gedeutet: Ein
    // Wert, den JSON nicht tragen kann, verschwindet beim Schreiben spurlos - der Aufrufer setzte
    // etwas und faende beim naechsten Lesen nichts. Eine Loesch-Bedeutung stuende in keinem
    // Vertrag; sie hier zu erfinden, hiesse eine zweite Operation hinter demselben Namen zu
    // verstecken. Wird Loeschen gebraucht, gehoert es als eigene Operation ins Issue.
    return fehler(
      'ungueltige_eingabe',
      `Der Wert zu "${schlüssel}" ist nicht JSON-serialisierbar (Funktion, Symbol oder undefined).`,
    )
  }

  // ANMERKUNG zur Reichweite dieser Pruefung: Sie erfasst den Wert als GANZES. Steckt eine Funktion
  // TIEF in einem sonst gueltigen Objekt, laesst JSON.stringify sie einfach weg, statt zu melden -
  // das Objekt kommt dann ohne dieses Feld in der Datei an. Genauso werden NaN und Infinity zu
  // `null`. Beides ist das dokumentierte Verhalten von JSON, kein Mangel dieser Funktion; ein
  // Aufspueren im Tiefgang muesste jeden Wert rekursiv ablaufen und wuerde legitime Faelle
  // (Date, toJSON) mit ablehnen.

  const geschrieben = await aendereKonfig<void>((konfig) => ({
    ok: true,
    wert: {
      konfig: {
        ...konfig,
        // NEUES Objekt statt Zuweisung in das vorhandene: `aendereKonfig` reicht den frisch
        // gelesenen Stand herein, aber der Rueckruf darf sich nicht darauf verlassen, dass ihn
        // sonst niemand haelt. Der Spread ueber `konfig` nimmt zugleich alle Felder mit, die
        // spaeter zu AppKonfig hinzukommen - eine Aufzaehlung wuerde sie lautlos wegwerfen.
        uiVoreinstellungen: { ...konfig.uiVoreinstellungen, [schlüssel]: wert },
      },
      wert: undefined,
    },
  }))

  if (!geschrieben.ok) {
    // MELDUNG AN DAS ISSUE (nicht hier beheben): Die verbindliche Signatur ist `Ergebnis<void>` -
    // ohne zweiten Typparameter traegt die Huelle nur die drei generischen Codes. `aendereKonfig`
    // liefert aber `speicher_fehler`, den fachlichen Code des Moduls (#31). Er wird deshalb auf
    // `unbekannter_fehler` abgebildet und nur noch im Meldungstext genannt - worauf kein Aufrufer
    // verzweigen kann. Genau diese Luecke hatte #31 selbst, bis das Issue per Nachtrag auf
    // `Ergebnis<void, ConfigFehlercode>` umgestellt wurde; #30 braucht denselben Nachtrag. Der
    // STOPP-Block des Issues fragt danach ("dann gehoert `speicher_fehler` in die
    // Fehlerpfad-Tabelle dieses Issues") und verbietet ausdruecklich, es selbst festzulegen.
    const code = geschrieben.fehler.code === 'speicher_fehler' ? 'unbekannter_fehler' : geschrieben.fehler.code
    return fehler(code, `UI-Voreinstellung "${schlüssel}" nicht gespeichert (${geschrieben.fehler.code}): ${geschrieben.fehler.meldung}`)
  }

  return { ok: true, wert: undefined }
}

/**
 * Die Fehlerseite der Huelle. Der Code-Typ wird aus `ergebnis.ts` bezogen und NICHT hier erneut
 * aufgezaehlt - zwei Aufzaehlungen derselben drei Literale laufen irgendwann auseinander.
 */
function fehler(code: GenerischerFehlercode, meldung: string): Ergebnis<void> {
  return { ok: false, fehler: { code, meldung } }
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}
