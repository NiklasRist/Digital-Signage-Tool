// GENERIERT aus dem Signaturblock von Issue #38.
// [project-store] erstelleAktion implementieren
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
// GERUEST-PRUEFSUMME: f4bdc77b8c8d7dd7
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

import { erzeugeId } from '../../shared/contracts/id'

import { holeAktivesProjekt } from './aktives-projekt'
import { planeAutoSpeicherung } from './auto-speichern'
import { mitD1Lock } from './d1-lock'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #20:  erzeugeId(): string
//         // UUID v4, "die EINE Stelle, an der IDs entstehen" (TK 9.11.4). Kann nicht
//         // regulaer fehlschlagen; hier wird nichts nachgebaut und nichts abgefangen.
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre).
//         // Der kritische Abschnitt "darf selbst nicht erneut mitD1Lock aufrufen
//         // (Deadlock-Gefahr)" - deshalb steht unten kein zweiter, geschachtelter Aufruf.
//   #47:  planeAutoSpeicherung(projekt: Project): void
//         // merkt projekt als zu speichernde, aktuelle Version vor und (re-)startet den
//         // Entprellungstimer. SYNCHRON, KEIN Rueckgabewert - "reine Terminplanung kann
//         // nicht fehlschlagen". Nimmt das Lock NICHT; der Timer nimmt es selbst, wenn er
//         // spaeter laeuft.
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die
//         // die Instant-Operationen mutieren), kein Projekt offen -> null. SYNCHRON, NIMMT
//         // KEIN LOCK, WIRFT NIE.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
export async function erstelleAktion(
  aktionsdaten: Omit<Aktion, 'id'>,
): Promise<Ergebnis<Aktion>> {
  // DIE FORMPRUEFUNG LAEUFT VOR DEM LOCK. Eine abgewiesene Eingabe beruehrt D1 nicht
  // ("keine Wirkung", Fehlerpfad-Tabelle) - sie erst hinter der Warteschlange abzuweisen
  // hiesse, einen laufenden Schreibvorgang abzuwarten, nur um nichts zu tun. Die Pruefung
  // auf das aktive Projekt kann das NICHT: Sie liest gemeinsamen Zustand und gehoert
  // deshalb in den kritischen Abschnitt (Begruendung dort).
  //
  // `typeof` trotz getyptem Parameter: Der Wert kommt ueber IPC aus dem Renderer, und ueber
  // die Prozessgrenze reist ein `unknown` als `Omit<Aktion, 'id'>` getarnt (TK 9.1.1
  // Punkt 6). Ohne die Pruefung wuerde `null.titel` werfen - und ein Wurf reist nie ueber
  // die Grenze, dort kaeme nur noch Text an (ergebnis.ts).
  if (typeof aktionsdaten !== 'object' || aktionsdaten === null) {
    return ungueltig('erstelleAktion wurde ohne Aktionsdaten aufgerufen.')
  }

  // "Titel ist Pflicht: eine Aktion ohne Titel ist nicht speicherbar." (TK 9.8.4)
  //
  // GUELTIG IST: ein String, der nach dem Abschneiden der Randleerzeichen noch Zeichen hat.
  // Ein Titel aus lauter Leerzeichen ist KEIN Titel - er erzeugt genau den leeren Eintrag,
  // gegen den diese Pruefung laut Issue existiert, und im gerenderten Segment-PNG ist er
  // von "gar kein Titel" nicht zu unterscheiden.
  //
  // KEINE Laengen-Obergrenze und keine Zeichenpruefung: Der Titel wird nie zu einem Pfad,
  // und die Ueberlauf-Kaskade (umbrechen -> verkleinern -> "…") liegt im template-canvas
  // (TK 9.10). Eine zweite, fruehere Grenze hier waere eine Regel, die niemand aufgestellt
  // hat, und sie wuerde einen langen Titel abweisen, den die Zeichenroutine sauber setzt.
  const titel = typeof aktionsdaten.titel === 'string' ? aktionsdaten.titel.trim() : ''
  if (titel.length === 0) {
    return ungueltig('Eine Aktion ohne Titel ist nicht speicherbar (TK 9.8.4).')
  }

  // GESPEICHERT WIRD DER GETRIMMTE TITEL - dieselbe Abwaegung wie beim Projektnamen (#33):
  // Wer "   " als leer abweist, aber "  Sommer  " unveraendert ablegt, misst mit zweierlei
  // Mass. Hier kommt hinzu, dass der Titel GEZEICHNET wird: Ein fuehrendes Leerzeichen
  // verschiebt den Text im Segment-PNG sichtbar, ohne dass irgendwo etwas falsch aussieht -
  // ein Fehler, den niemand im Code sucht.

  // `vorlagenId` MUSS gesetzt sein, "kein Default-Raetselraten" (Issue, Eingang -> Ausgang).
  // Eine Aktion ohne Vorlage ist nicht zeichenbar: Die Vorlage bestimmt die Zonen, das
  // template-canvas haette keine Anweisung, was wohin gehoert.
  const vorlagenId = aktionsdaten.vorlagenId
  if (typeof vorlagenId !== 'string' || vorlagenId.trim().length === 0) {
    return ungueltig('Eine Aktion braucht eine Vorlage (vorlagenId).')
  }

  // GEPRUEFT WIRD NUR "gesetzt und ein nicht leerer String", NICHT ob es die Vorlage gibt.
  // Der STOPP-Block des Issues legt genau diese Vermutung nahe und verlangt ihre
  // Bestaetigung; gebaut ist sie so, weil die Alternative die Abhaengigkeitsrichtung
  // umdrehte: `project-store` (M1) muesste den `vorlagen-store` (M4) fragen. Das TK haelt
  // die Richtung an anderer Stelle ausdruecklich fest ("`marken-store` -> `project-store`,
  // nie umgekehrt", TK 9.5.2) - dieselbe Begruendung gilt hier, denn `pruefeVorlagenNutzung`
  // liest bereits durch die project.json aller Projekte. S. Bericht/STOPP.
  //
  // Die Zeichenkette wird UNVERAENDERT uebernommen, nicht getrimmt. Sie ist ein SCHLUESSEL,
  // kein Anzeigetext: Ein stilles Zurechtbiegen machte aus einer Kennung, die nirgends
  // trifft, eine, die zufaellig trifft - und verdeckte damit einen Fehler des Aufrufers,
  // statt ihn sichtbar zu lassen. Beim Titel ist es umgekehrt, weil dort die Zeichenkette
  // selbst das Ergebnis ist.

  // Ab hier wird D1 angefasst - und zwar ALLES in EINEM kritischen Abschnitt: Lesen des
  // Halters, Anhaengen, Vormerken zum Speichern. Zwei getrennte Abschnitte hiessen, dass
  // zwischen "Projekt geholt" und "Aktion angehaengt" ein loescheProjekt (#37) laufen darf;
  // die Aktion landete dann in einem Projekt, das es nicht mehr gibt.
  //
  // FUER AUFRUFER: Diese Funktion nimmt das Lock SELBST. Sie darf NICHT noch einmal in
  // mitD1Lock eingewickelt werden - der innere Aufruf wartete auf den aeusseren, der auf
  // ihn wartet (#32, "Deadlock-Gefahr").
  //
  // Der Rueckgabetyp des Abschnitts steht ausgeschrieben da, statt sich ableiten zu lassen:
  // Ohne ihn wuerde `ok: false` in einem Objektliteral zu `boolean` verbreitert, und die
  // Ergebnis-Huelle waere nicht mehr diskriminierbar.
  return mitD1Lock(async (): Promise<Ergebnis<Aktion>> => {
    const projekt = holeAktivesProjekt()
    if (projekt === null) {
      // `nicht_gefunden` - und das ist KEINE eigene Festlegung. Der STOPP-Block dieses
      // Issues verbietet ausdruecklich, den Code hier zu waehlen, weil er "fuer alle
      // project-store-Mutationen konsistent getroffen werden muss". Genau das ist
      // inzwischen geschehen: Die Fehlerpfad-Tabellen von #72 (fuegeAssetHinzu) und #74
      // fuehren "kein aktives Projekt geladen" mit `nicht_gefunden` - dieselbe Lage, dieselbe
      // Modulgrenze. Diese Datei folgt dem Bestand, statt einen zweiten Code danebenzustellen.
      // Gemeldet bleibt es trotzdem, s. Bericht/STOPP.
      return {
        ok: false,
        fehler: {
          code: 'nicht_gefunden',
          meldung: 'Es ist kein Projekt geoeffnet, das die Aktion aufnehmen koennte.',
        },
      }
    }

    // DAS OBJEKT WIRD FELD FUER FELD AUFGEBAUT, NICHT AUS `aktionsdaten` GESPREIZT.
    //
    // 1. `aktionsdaten` kommt aus dem Renderer. Ein Spread uebernaehme jedes zusaetzliche
    //    Feld, das dort mitgeschickt wird, und #46 serialisiert das GANZE Projekt - der
    //    Fremdkoerper stuende ab dann dauerhaft in project.json und ueberlebte jeden Neustart.
    // 2. Der Preis eines Spreads waere sonst der Schutz gegen VERGESSENE Felder. Den
    //    uebernimmt hier der Typechecker: Das Literal ist als `Aktion` deklariert, kommt ein
    //    Pflichtfeld zum Typ hinzu (M8 sieht `markeId` vor, s. unten), bricht DIESE Datei
    //    sofort - laut und an der richtigen Stelle, statt das Feld lautlos wegzuwerfen.
    const aktion: Aktion = {
      id: erzeugeId(),
      titel,

      // VORBELEGT MIT `null`, NICHT MIT LEEREM STRING: Die sechs Felder sind laut #14
      // `X | null` und NICHT optional - "null heisst: kein Wert gewaehlt". Ein leerer String
      // waere ein zweiter Weg, dasselbe zu sagen, und die Zeichenroutine muesste beide
      // pruefen (TK 9.10.7 unterscheidet "Zone leer" von "Zone hat Text").
      //
      // WARUM DIE UMSETZUNG VON `undefined` UEBERHAUPT NOETIG IST: Ueber IPC reist ein
      // Objekt, dem ein Feld schlicht FEHLT - der Typ sagt "nicht optional", die Laufzeit
      // liefert `undefined`. Bliebe das stehen, wuerde JSON.stringify den Schluessel beim
      // Speichern WEGLASSEN; nach dem naechsten Laden fehlte das Feld, und jede Pruefung auf
      // `=== null` liefe daran vorbei. Der Unterschied waere erst nach einem Neustart
      // sichtbar - die teuerste Art, ihn zu finden.
      beschreibung: oderNull(aktionsdaten.beschreibung),
      preis: oderNull(aktionsdaten.preis),

      // "Bild = Referenz, nie Kopie: die Aktion haelt nur eine Asset-ID" (TK 9.8.4). Hier
      // wird die Kennung uebernommen und sonst nichts - kein Nachschlagen in `Project.assets`,
      // keine Existenzpruefung: Ein `bildRef`, das auf ein fehlendes Asset zeigt, ist ein
      // VORGESEHENER Zustand (TK 9.8.5, "kaputt" + Platzhalter in der Vorschau), kein
      // Ablehnungsgrund. Wer ihn hier abwiese, machte die Reparatur nach FA-19 unmoeglich:
      // Die Aktion muss erst einmal existieren, damit man sie reparieren kann.
      bildRef: oderNull(aktionsdaten.bildRef),
      cta: oderNull(aktionsdaten.cta),

      // "`standardDauer` ist nur ein Default" (TK 9.8.4) - massgeblich fuer den Render ist
      // die Listenelement-Dauer. Deshalb wird hier WEDER die Spanne 10-45 s geprueft (das
      // tut #44 an der Dauer, die wirklich zaehlt, und der Editor meldet sie dem Nutzer
      // vorab als `standardDauer: 'ausserhalb_bereich'`, #136) NOCH ein Ersatzwert
      // erfunden: `null`
      // heisst "keine Vorgabe", und das Platzieren nimmt dann seinen eigenen Standard.
      standardDauer: dauerOderNull(aktionsdaten.standardDauer),
      vorlagenId,

      // `null` = "keine eigene Farbe, es gilt der Markenwert" (#14). Der Wert selbst wird
      // NICHT geprueft - und zwar bewusst NICHT, weil ueber seine Form gerade Uneinigkeit
      // herrscht: #14 nennt ihn "Rollen-Verweis in die Markenpalette, kein Hex", TK 9.8.4
      // sagt seit v3.4 das Gegenteil ("Akzentfarbe ist ein freier Farbwert", FA-24), und der
      // action-editor (#136) prueft heute auf eine ROLLE (`AkzentRolle`). Eine Pruefung hier
      // muesste sich fuer eine der beiden Welten entscheiden und wuerde die andere abweisen.
      // Die Gegenmassnahme gegen schlechte Farbwahl ist ohnehin "die Kontrast-Warnung
      // (9.15.2), nicht die Sperre" (TK 9.8.4). Widerspruch gemeldet, s. Bericht/STOPP.
      akzentfarbe: oderNull(aktionsdaten.akzentfarbe),
    }

    // ANS ENDE DER BIBLIOTHEK. Die Reihenfolge des Arrays ist auch hier die Reihenfolge
    // (TK 9.11.3, "KEIN position-Feld"); ein `unshift` waere die stille Behauptung "neueste
    // zuerst", die kein Vertrag aufstellt - und die Oberflaeche koennte sie nicht mehr
    // zuruecknehmen, weil die Einfuegereihenfolge dann verloren waere. Sortieren nach Titel
    // oder Datum ist Sache der Anzeige, nicht des Speichers.
    //
    // Mutiert wird der LEBENDE Stand: #192 gibt "dieselbe Objektreferenz" heraus, "keine
    // Kopie" - genau so ist es gemeint, und es geschieht INNERHALB des Locks.
    projekt.aktionen.push(aktion)

    // DAS SPEICHERN WIRD NUR ANGESTOSSEN, NICHT ABGEWARTET.
    //
    // "Eine Instant-Operation (9.5.2) validiert und wendet im Speicher an, *bevor* sie 'ok'
    // meldet - ihr Erfolg bedeutet 'gueltig uebernommen', nicht 'schon auf Platte'. Die
    // Platten-Schreibung ist die entprellte Auto-Speicherung." (TK 9.5.4)
    //
    // DESHALB HIER `planeAutoSpeicherung` UND NICHT `sofortFlush`: Der Sofort-Flush gehoert
    // den vier in #47 aufgezaehlten Faellen (Render-/Export-Handler, Projektwechsel,
    // App-Ende, Abschluss eines D1-aendernden Auftrags). Das Anlegen einer Aktion ist keiner
    // davon - es ist eine Instant-Operation, und ein Plattenzugriff je Bearbeitungsschritt
    // waere genau das, wogegen die Entprellung existiert.
    //
    // Und deshalb gibt es hier auch KEINEN Ruecknahme-Pfad wie in #72: Dort ist der Import
    // ein AUFTRAG, der sofort flusht und dessen Fehlschlag zurueckgenommen wird. Hier kann
    // an dieser Stelle nichts fehlschlagen (die Funktion ist synchron und ohne Rueckgabe);
    // scheitert das spaetere Schreiben, "bleiben die Aenderungen im Speicher (kein Rollback,
    // kein Arbeitsverlust)" (TK 9.5.4), und der Nutzer erfaehrt es ueber
    // `project:autoSpeichernStatus` - nicht ueber diesen Rueckgabewert.
    planeAutoSpeicherung(projekt)

    // Zurueck kommt DASSELBE Objekt, das in `projekt.aktionen` steht - wie bei #33, das
    // ebenfalls die eingehaengte Referenz herausgibt. Fuer den Renderer ist es ohnehin eine
    // Kopie (IPC serialisiert); ein main-interner Aufrufer bekaeme mit einer Kopie dagegen
    // einen Stand, der sich vom gespeicherten fortentwickeln kann - die zweite Wahrheit,
    // die #192 fuer das Projekt ausschliesst.
    return { ok: true, wert: aktion }
  })
}
// Ausgang bei Erfolg: die neu angelegte Aktion mit vergebener id (#20), angehaengt an
// Project.aktionen des aktiven Projekts; auf der Platte steht sie erst nach der entprellten
// Auto-Speicherung (#47).

/** Ein abgelehnter Aufruf - immer ohne jede Wirkung auf D1. */
function ungueltig(meldung: string): Ergebnis<Aktion> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/**
 * `undefined` -> `null`, alles andere unveraendert.
 *
 * `??` und nicht `||`: Der leere String ist ein gueltiger Wert dieser Felder (eine
 * ausdruecklich geleerte Beschreibung), und `||` machte daraus lautlos `null`.
 */
function oderNull<T>(wert: T | null | undefined): T | null {
  return wert ?? null
}

/**
 * Wie `oderNull`, aber es faengt zusaetzlich `NaN` und `Infinity` ab.
 *
 * WARUM DAS HIER STEHT UND NICHT ALS DRITTER ABLEHNUNGSGRUND: Die Fehlerpfad-Tabelle des
 * Issues ist als "(vollstaendig)" ueberschrieben und kennt genau zwei Gruende (leerer Titel,
 * fehlende vorlagenId). Einen dritten zu erfinden waere eine Vertragsaenderung.
 *
 * WARUM DER WERT TROTZDEM NICHT STEHEN BLEIBEN DARF: `JSON.stringify` schreibt fuer `NaN`
 * und `Infinity` `null` in die Datei. Ohne diese Zeile stuende im Speicher `NaN`, auf der
 * Platte `null` - Speicher und Datei sagten Verschiedenes, und beim naechsten Laden waere
 * die Aktion eine andere. `null` heisst hier ohnehin "keine Vorgabe", also genau das, was
 * eine unbrauchbare Zahl bedeutet. S. Bericht/STOPP.
 */
function dauerOderNull(wert: number | null | undefined): number | null {
  return typeof wert === 'number' && Number.isFinite(wert) ? wert : null
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEINE MARKEN-KENNUNG. TK 9.8.2 fuehrt in `Aktion` ein Pflichtfeld `markeId: string`
//    ("GENAU EINE Marke (FA-23, 9.15.1). Pflicht; vorbelegt mit Project.standardMarkeId").
//    Der gebaute Typ (#14) hat es NICHT, `Project` (#15) hat auch kein `standardMarkeId`,
//    aus dem es vorzubelegen waere. Der Widerspruch ist hier nicht aufloesbar - er waere
//    eine Vertragsaenderung an zwei geteilten Typen. Dieselbe Meldung steht bereits in #33.
//    Kommt das Feld, bricht das Objektliteral oben und zeigt genau die Stelle.
//
// 2. KEINE PRUEFUNG AUF DOPPELTE TITEL. Aktionen sind "referenzierbare Datensaetze" (TK 5,
//    Punkt 2) und werden ueber ihre ID angesprochen, nie ueber den Titel; zwei Aktionen
//    duerfen gleich heissen. Weder Issue noch TK verlangen Eindeutigkeit.
//
// 3. KEIN `geaendertAm` AM PROJEKT. Diese Datei setzt `Project.geaendertAm` NICHT - und
//    keine andere gebaute Datei tut es nach dem Anlegen ebenfalls: #46 schreibt
//    ausdruecklich nur die `schemaVersion` neu ("ALLES ANDERE BLEIBT UNANGETASTET -
//    insbesondere geaendertAm"), #47 fasst das Projekt gar nicht an. Die Folge ist sichtbar:
//    Die Projektliste (#35, ProjektMeta.geaendertAm) zeigte dauerhaft den Erstellzeitpunkt.
//    Es hier einseitig zu setzen waere der schlechteste Ausweg - dann traegt EINE von rund
//    zwanzig Instant-Operationen einen Zeitstempel nach und die uebrigen nicht. Der Ort
//    dafuer waere genau eine Stelle, durch die jede Aenderung laeuft. Gemeldet, nicht gebaut.
//
// 4. KEIN SCHNAPPSCHUSS FUER UNDO. TK 9.13.2 verlangt ihn vor jeder Instant-Operation, und
//    9.13.1 fuehrt "Aktionen: anlegen" ausdruecklich als undo-faehig. Er entsteht aber nicht
//    hier, sondern an der EINEN Stelle im Renderer, die jede Aenderung passiert (#243, die
//    Huelle um die gemeinsame Projekt-Sicht) - genau damit es keine dreissig Aufrufer gibt,
//    die ihn einzeln halten muessten.
//
// 5. KEIN IPC-KANAL. Diese Datei meldet sich nirgends an; die Verdrahtung von
//    `project:erstelleAktion` liegt beim ipc-gateway (#76). Ohne sie bliebe die Funktion
//    eine Main-Funktion ohne Aufrufer.
