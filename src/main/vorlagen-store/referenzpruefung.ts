// GENERIERT aus dem Signaturblock von Issue #106.
// [vorlagen-store] Referenzprüfung einer Vorlage über ALLE Projekte
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
// GERUEST-PRUEFSUMME: 64a88be0ce6a2163

import fs from 'node:fs/promises'
import path from 'node:path'

import { listeProjekte } from '../project-store/liste-projekte'
import { PROJEKT_DATEI, projektOrdner } from '../project-store/pfade'

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { VorlagenFehlercode } from './fehlercodes'
import type { VorlagenReferenz, Vorlagennutzung } from '../../shared/contracts/vorlage'
// BEIDE Typen gehören #95 und werden hier NUR importiert, NIE neu deklariert: Sie reisen als
// fehler.daten über die IPC-Grenze (#107), und der Renderer darf nicht aus src/main/** importieren.
import type { ProjectStoreFehlercode } from '../project-store/assets'

// EIN FEHLSCHLAG DIESER FUNKTION IST KEINE LEERE TREFFERLISTE.
//
// "Löschen nur, wenn die Vorlage in *keinem* Projekt mehr benutzt wird." (TK 9.12.1) Der
// einzige main-interne Aufrufer (#107) liest ein leeres Ergebnis als "darfst du loeschen".
// Deshalb gilt hier durchgehend: Was nicht nachgesehen werden konnte, wird als FEHLER
// gemeldet, nie als "nichts gefunden". Jeder Lesefehler bricht die ganze Pruefung ab -
// ein Teilergebnis waere von einem vollstaendigen nicht zu unterscheiden.
//
// ZWEI Referenzarten, und die zweite ist die gefaehrliche: `aktion.vorlagenId` und
// `listenelement.einblendung.bandVorlageId`. "Eine Band-Vorlage wird ausschließlich über
// Weg 2 referenziert." (TK 9.12.1) Wer nur die Aktionen durchsucht, erklaert jede
// Band-Vorlage fuer unbenutzt.
//
// Gelesen wird OHNE Lock: "Schreiben nach Temp-Datei + Rename (gleiche Partition).
// `project.json` ist **nie** halb geschrieben." (TK 9.5.4) Ein Leser sieht immer den ganzen
// alten oder den ganzen neuen Stand. Ein zweiter Sperr-Mechanismus ist ausdruecklich
// verboten ("Kein zweites Lock.", TK 9.4.8).

export async function pruefeVorlagenReferenzen(
  vorlagenId: string,
): Promise<Ergebnis<Vorlagennutzung, VorlagenFehlercode>> {
  // Schritt 1: formal pruefen, BEVOR irgendetwas gelesen wird.
  //
  // Geprueft wird nur "nicht leerer String" - kein Format. Die eingebauten Vorlagen heissen
  // "vollbild", "split" und "band-standard" (#95); eine UUID-Pruefung erklaerte ausgerechnet
  // die drei wichtigsten Vorlagen fuer unbenutzt und damit fuer loeschbar.
  //
  // Die typeof-Pruefung ist trotz `vorlagenId: string` keine Zierde: Der Wert kommt ueber den
  // Kanal vorlagen:pruefeVorlagenReferenzen aus dem Renderer und ist zur Laufzeit alles, was
  // die Gegenseite geschickt hat.
  if (typeof vorlagenId !== 'string' || vorlagenId.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Es wurde keine Vorlagen-ID angegeben (leer oder kein Text).',
      },
    }
  }

  // Schritt 2: die Menge der Projekte kommt AUSSCHLIESSLICH von #35.
  //
  // Vorlagen sind app-weit, im Speicher liegt aber immer nur ein Projekt (TK 9.5.1) - also
  // muessen die uebrigen Dateien gelesen werden. Die Liste ist seit TK v3.0 vollstaendig:
  // "Ein beschädigtes Projekt wird MIT WARNHINWEIS gelistet, nicht weggelassen (bindend)."
  // (TK 9.5.2) Genau darauf stuetzt sich diese Pruefung; ein weggelassenes Projekt waere hier
  // unsichtbar und liefe stumm als "benutzt die Vorlage nicht" durch.
  const gemeldet = await listeProjekte()
  if (!gemeldet.ok) {
    // Durchgereicht, nicht uebersetzt: "listeProjekte liefert ok: false -> genau dieser Code".
    return { ok: false, fehler: { ...gemeldet.fehler, code: darstellbar(gemeldet.fehler.code) } }
  }

  const aktionen: VorlagenReferenz[] = []
  const listenelemente: VorlagenReferenz[] = []

  // Schritt 3: jedes gemeldete Projekt, in der gelieferten Reihenfolge. Sequenziell, damit
  // die Treffer reproduzierbar in Projekt-Reihenfolge stehen (Tests, Screenshots,
  // Fehlerberichte) und nicht mehrere vollstaendig geparste Projekte gleichzeitig im
  // Speicher liegen.
  for (const meta of gemeldet.wert) {
    // Ein Eintrag mit `beschaedigt: true` wird NICHT vorab aussortiert: In einem unlesbaren
    // Projekt kann sehr wohl eine Referenz stehen, und niemand kann das Gegenteil belegen.
    // Er laeuft in denselben Lesepfad - scheitert der, ist das Ergebnis speicher_fehler.

    // Der Ordner kommt aus der Pfad-Autoritaet (#49), nicht aus meta.ordner: Ob jenes Feld
    // absolut oder relativ ist, legt #35 fest und nicht diese Datei. Zwei Wege zum selben
    // Ordner waeren zwei Wege, sich zu irren. Der Dateiname ebenfalls von dort - er stand
    // frueher als Literal in vier Dateien und gehoert zum Layout, nicht zur Operation.
    const datei = path.join(projektOrdner(meta.id), PROJEKT_DATEI)

    let roh: string
    try {
      roh = await fs.readFile(datei, 'utf8')
    } catch (ursache) {
      // Auch ENOENT bricht ab. Ein Projektordner ohne Projektdatei ist ein beschaedigter
      // Bestand; "nicht lesbar" darf nicht zu "nicht benutzt" werden. KEIN Rueckfall auf die
      // Sicherungsdatei: Deren Deutung gehoert dem project-store (TK 9.5.4), und der
      // vorlagen-store legt darueber keine zweite.
      return speicherFehler(meta.id, datei, text(ursache))
    }

    let wurzel: unknown
    try {
      wurzel = JSON.parse(roh)
    } catch (ursache) {
      return speicherFehler(meta.id, datei, `ungültiges JSON (${text(ursache)})`)
    }
    if (!istObjekt(wurzel)) {
      return speicherFehler(meta.id, datei, 'der Wurzelwert ist kein Objekt')
    }

    // projektId ist der ORDNERNAME (= ProjektMeta.id), nicht das Feld `id` der Datei.
    // Begruendung: Nur der Ordnername adressiert das Projekt wieder - #107 und die
    // Nutzungsanzeige (TK 9.12.2) muessen den Treffer zurueckverfolgen koennen. Ein `id`-Feld,
    // das vom Ordner abweicht, kommt vor (eine Kopie traegt es mit) und zeigte dann auf ein
    // Projekt, das es so nicht gibt.
    const projektId = meta.id
    // projektName dagegen aus der Datei: Er ist reine Anzeige ("in 2 Projekten"). Fehlt er,
    // steht '' - ein Treffer wird NIE verworfen, weil ihm ein Anzeigefeld fehlt.
    const projektName = typeof wurzel['name'] === 'string' ? wurzel['name'] : ''

    const roheAktionen = feldArray(wurzel, 'aktionen')
    if (roheAktionen === null) {
      return speicherFehler(meta.id, datei, 'das Feld aktionen ist vorhanden, aber kein Array')
    }
    const roheListe = feldArray(wurzel, 'liste')
    if (roheListe === null) {
      return speicherFehler(meta.id, datei, 'das Feld liste ist vorhanden, aber kein Array')
    }

    // Referenzart 1: aktion.vorlagenId (vollflaechige Segmente).
    for (const eintrag of roheAktionen) {
      if (!istObjekt(eintrag)) {
        continue // kein Objekt - kann keine Referenz tragen
      }
      // Strikter Vergleich gegen einen nicht leeren String: Nur ein gleichlautender String
      // trifft zu; Zahlen, null oder Objekte koennen hier nie zufaellig passen.
      if (eintrag['vorlagenId'] !== vorlagenId) {
        continue
      }
      aktionen.push({ projektId, projektName, id: idVon(eintrag) })
    }

    // Referenzart 2: listenelement.einblendung.bandVorlageId (Band bei Split/Einblendung).
    // Verglichen wird NUR dieses eine Feld. `ref` ist eine Asset- oder Aktions-ID und
    // `abschnitte[].aktionRef` eine Aktions-ID - stumpf jedes Stringfeld zu vergleichen hiesse,
    // IDs aus verschiedenen Namensraeumen zu vergleichen, und bei den eingebauten Vorlagen
    // ("vollbild", "split", "band-standard") ist das nicht einmal unwahrscheinlich.
    for (const eintrag of roheListe) {
      if (!istObjekt(eintrag)) {
        continue
      }
      const einblendung = eintrag['einblendung']
      // null (Bild, Segment, Video ohne Band) faellt hier heraus - ein Zugriff auf
      // bandVorlageId waere an dieser Stelle die Absturzquelle.
      if (!istObjekt(einblendung)) {
        continue
      }
      // "Alle Abschnitte eines Elements nutzen dieselbe Band-Vorlage" (TK 9.2.8): hoechstens
      // eine Band-Referenz je Listenelement, also hoechstens ein Treffer.
      if (einblendung['bandVorlageId'] !== vorlagenId) {
        continue
      }
      listenelemente.push({ projektId, projektName, id: idVon(eintrag) })
    }
  }

  // Beide Listen leer ist ein GUELTIGES Ergebnis: "Eine leere Nutzung (beide Listen leer) ist
  // ein gültiges Ergebnis, kein Fehler: Sie bedeutet 'diese Vorlage ist frei'." (TK 9.12.1)
  // Nicht sortiert, nicht dedupliziert, nicht gemerkt - die Reihenfolge ist die der Projekte
  // und innerhalb eines Projekts die des Arrays.
  return { ok: true, wert: { aktionen, listenelemente } }
}
// - durchsucht ALLE von listeProjekte (#35) gemeldeten Projekte, nicht nur das geladene
// - erfasst BEIDE Referenzarten und liefert sie GETRENNT zurück
// - keine Treffer => beide Arrays leer (ok: true) – das ist KEIN Fehler
// - liest ausschliesslich; schreibt nichts, legt nichts an, repariert nichts

// ---------------------------------------------------------------------------
// Intern. Nicht exportiert: Wer eine dieser Regeln braucht, braucht in Wahrheit
// pruefeVorlagenReferenzen - "Es gibt einen Prüf-Mechanismus, den die Anzeige und die Sperre
// gemeinsam benutzen" (TK 9.12.1).
// ---------------------------------------------------------------------------

/** Abbruch mit dem einzigen fachlichen Code dieser Funktion; die Meldung nennt das Projekt. */
function speicherFehler(
  projektId: string,
  datei: string,
  grund: string,
): Ergebnis<Vorlagennutzung, VorlagenFehlercode> {
  return {
    ok: false,
    fehler: {
      code: 'speicher_fehler',
      meldung:
        `Die Vorlagen-Prüfung wurde abgebrochen: Projekt ${projektId} konnte nicht geprüft ` +
        `werden (${datei}: ${grund}). Solange das Projekt nicht lesbar ist, lässt sich nicht ` +
        `feststellen, ob es die Vorlage benutzt.`,
    },
  }
}

/**
 * Bringt einen Fehlercode von #35 in den Rueckgabetyp DIESER Funktion.
 *
 * GEMELDETE VERTRAGSABWEICHUNG: Das Issue schreibt listeProjekte als
 * `Promise<Ergebnis<ProjektMeta[]>>` aus; gebaut ist
 * `Promise<Ergebnis<ProjektMeta[], ProjectStoreFehlercode>>`. Zwei der drei fachlichen Codes
 * des project-store (projekt_beschaeftigt, kein_projekt) passen deshalb nicht in
 * `VorlagenFehlercode | GenerischerFehlercode` - die Signatur dieser Funktion ist verbindlich
 * und wird nicht geweitet.
 *
 * Praktisch tritt der Fall nicht ein: #35 hat GENAU EINEN Fehlerausgang, speicher_fehler
 * (nur dann, wenn das Projekt-Wurzelverzeichnis selbst nicht lesbar ist), und der ist
 * darstellbar. Der Rest ist Vorsorge, damit die Naht nicht stillschweigend bricht: Der
 * Original-Code steht in der Meldung, und der `switch` ist ueber die Union AUSGESCHOEPFT -
 * kommt beim project-store ein Code hinzu, faellt DIESE Datei beim Typecheck auf, statt ihn
 * lautlos zu verschlucken.
 */
function darstellbar(
  code: ProjectStoreFehlercode | GenerischerFehlercode,
): VorlagenFehlercode | GenerischerFehlercode {
  switch (code) {
    case 'speicher_fehler':
    case 'ungueltige_eingabe':
    case 'nicht_gefunden':
    case 'unbekannter_fehler':
      return code
    case 'projekt_beschaeftigt':
    case 'kein_projekt':
      return 'unbekannter_fehler'
    default: {
      const unerreichbar: never = code
      return unerreichbar
    }
  }
}

/** true nur fuer echte Objekte - Arrays und null sind hier KEINE. */
function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert)
}

/**
 * Liest `aktionen` bzw. `liste`.
 *
 * FEHLT das Feld ganz -> leer. Ein Projekt ohne Aktionen oder ohne Liste ist ein voellig
 * normaler Zustand, und ein spaeterer Schema-Stand (TK 9.5.5) darf daran nichts aendern.
 *
 * IST es vorhanden, aber kein Array -> null, und der Aufrufer bricht ab. Ueber eine
 * beschaedigte Liste hinwegzulesen hiesse wieder, "nicht geprüft" als "kein Treffer" zu
 * melden. `null` im JSON zaehlt dabei als vorhanden und beschaedigt: Es ist ein
 * ausgeschriebener Wert, der keine Liste ist - und der sichere Ausgang ist hier der strenge.
 */
function feldArray(wurzel: Record<string, unknown>, feld: 'aktionen' | 'liste'): unknown[] | null {
  const wert = wurzel[feld]
  if (wert === undefined) {
    return []
  }
  return Array.isArray(wert) ? wert : null
}

/**
 * Die ID eines Treffers - fehlt sie, bleibt sie leer, der Treffer wird trotzdem gemeldet.
 *
 * Ein Treffer ohne ID blockiert das Loeschen genauso wie einer mit ID; ihn wegzulassen waere
 * die teuerste Art von Sauberkeit.
 */
function idVon(eintrag: Record<string, unknown>): string {
  const wert = eintrag['id']
  return typeof wert === 'string' ? wert : ''
}

/** Fehlergrund als Text - `unknown` ist im catch alles, was geworfen wurde. */
function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}
