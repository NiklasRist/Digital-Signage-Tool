// GENERIERT aus dem Signaturblock von Issue #48.
// [project-store] schemaVersion-Migration für project.json
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
// GERUEST-PRUEFSUMME: 55e15c6bca7063d6

import { AKTUELLE_SCHEMA_VERSION } from '../../shared/contracts/konstanten'

// Fremde Aufrufe/Werte - vollstaendig genannt, damit hier nichts geraten wird:
//   #21: const AKTUELLE_SCHEMA_VERSION = 1
//        // "Aktuelle `schemaVersion` | 1 | wird von `öffneProjekt`, `schreibeProjekt` und der
//        // Migration gelesen (9.5.5) - eine Stelle, sonst laufen drei Kopien auseinander"
//        // (TK 9.11.4, woertlich). Deshalb steht die Zahl hier NICHT noch einmal.
//   #46: schreibeProjekt(projekt: Project): Promise<Ergebnis<void, ProjectStoreFehlercode>>
//        // WIRD HIER NICHT GERUFEN. Diese Funktion schreibt NICHTS auf die Platte (s.
//        // "KEIN SCHREIBEN" unten). #46 setzt die schemaVersion beim Schreiben ZULETZT
//        // (`{ ...projekt, schemaVersion: AKTUELLE_SCHEMA_VERSION }`) - genau deshalb darf das
//        // hier zurueckgelieferte, migrierte Objekt seine neue Version behalten, ohne dass ein
//        // spaeteres Speichern sie wieder auf die alte zurueckdreht.
//   #34: öffneProjekt(id: string): Promise<Ergebnis<Project>>
//        // DER EINZIGE Aufrufer. Es entscheidet BEIDE Faelle aus TK 9.5.5 - hoehere Version =>
//        // Fehler, aeltere => Migration - und ruft diese Funktion nur im zweiten Fall. Die
//        // Pruefung "ist die Version zu hoch" wird hier deshalb NICHT wiederholt (s. unten).

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'
export type MigrationsSchritt = (
  alt: Record<string, unknown>,
) => Record<string, unknown>
// alt: das Objekt VOR diesem Schritt (Schlüssel in MIGRATIONS_KETTE = seine schemaVersion).
// Rückgabe: das Objekt NACH diesem Schritt – schemaVersion darin um GENAU 1 höher als in `alt`.
// Verbindlich für jede künftige Implementierung eines Schritts: alle aus `alt` unbekannten Felder
// werden per Spread unverändert in die Rückgabe übernommen (nie stillschweigend weglassen);
// bekannte, in der alten Fassung fehlende Felder werden auf einen dokumentierten Vorgabewert
// gesetzt (nie einfach `undefined` lassen).

export const MIGRATIONS_KETTE: ReadonlyMap<number, MigrationsSchritt> = new Map([
  // Aktuell LEER: es gibt bislang nur EINE schemaVersion. Der erste Eintrag (Schlüssel = alte
  // Version, Wert = Schritt auf Version+1) entsteht erst mit der nächsten tatsächlichen
  // Formatänderung. Die Konstante für „die aktuelle Version" ist AKTUELLE_SCHEMA_VERSION aus
  // src/shared/contracts/konstanten.ts (#21) – hier NICHT lokal neu definieren.
])

export function migriereProjekt(
  rohdaten: Record<string, unknown> & { schemaVersion: number },
  kette: ReadonlyMap<number, MigrationsSchritt> = MIGRATIONS_KETTE,
): Ergebnis<Project> {
  // KEIN SCHREIBEN: Diese Funktion ist eine reine Umformung IM SPEICHER. Sie fasst weder
  // project.json noch das .bak an; ob und wann das Ergebnis zurueckgeschrieben wird, entscheidet
  // #34 bzw. dessen Aufrufkontext (sofort nach dem Oeffnen oder erst beim naechsten
  // Auto-Speichern, TK 9.5.4). Daraus folgt die wichtigste Sicherheitszusage dieser Datei: Egal
  // wie falsch die Eingabe ist - eine vorhandene project.json kann hier nicht beschaedigt werden.
  //
  // KEIN throw: Der Aufrufer bedient eine IPC-Operation; Fehler reisen ausschliesslich in der
  // Ergebnis-Huelle (TK 9.1.1). Auch ein fehlerhafter Migrationsschritt darf deshalb nicht als
  // Ausnahme nach draussen - er wird unten in einen Fehlerpfad umgesetzt.

  // Die Typangabe des Parameters ist zur Laufzeit keine Zusage: `rohdaten` kommt aus JSON.parse
  // einer Datei, die jemand von Hand bearbeitet haben kann. Ohne diese zwei Pruefungen liefe die
  // Schleife unten mit `undefined`/`NaN` als Version und meldete am Ende "kein Migrationsschritt
  // vorhanden" - eine Meldung, die auf die falsche Ursache zeigt.
  if (typeof rohdaten !== 'object' || rohdaten === null) {
    return fehler(
      'ungueltige_eingabe',
      'migriereProjekt wurde ohne Objekt aus project.json aufgerufen.',
    )
  }
  const startVersion: unknown = rohdaten.schemaVersion
  if (typeof startVersion !== 'number' || !Number.isInteger(startVersion)) {
    return fehler(
      'ungueltige_eingabe',
      `Die schemaVersion in project.json ist keine ganze Zahl (${String(startVersion)}); ` +
        'das Projektformat ist damit nicht bestimmbar.',
    )
  }

  // EINE flache Kopie am Eingang - danach arbeitet die Schleife nur noch auf ihr. Damit kann ein
  // Schritt, der sein `alt` entgegen dem Vertrag an Ort und Stelle veraendert, das Objekt des
  // Aufrufers nicht mehr treffen: "kein Teilergebnis wird zurueckgegeben, `rohdaten` bleibt beim
  // Aufrufer unveraendert im Spiel" (Fehlerpfad-Tabelle des Issues).
  // BEWUSST FLACH, nicht tief: Verschachtelte Felder (assets, aktionen, liste) bleiben dieselben
  // Arrays wie beim Aufrufer. Ein Schritt, der in eines davon hineinschreibt, veraendert dessen
  // Daten trotzdem. Ein tiefes Klonen bei jedem Oeffnen waere Aufwand gegen einen Fehler, den der
  // MigrationsSchritt-Vertrag ohnehin verbietet (Spread, nichts weglassen) - s. Bericht.
  let aktuell: Record<string, unknown> = { ...rohdaten }
  let version = startVersion

  // Abbruchbedingung ist die GLEICHHEIT mit der Zielversion, nicht "kleiner als".
  //
  // Das ist der gefaehrliche Fall und deshalb ausgeschrieben: Stuende hier `version <
  // AKTUELLE_SCHEMA_VERSION`, liefe eine ZU NEUE Datei (Version 5, App kennt 1) ohne einen
  // einzigen Schritt durch und kaeme als `ok` beim Aufrufer an - "hoehere (unbekannte) Version ->
  // Fehler (nicht raten)" (TK 9.5.5) waere damit an dieser Stelle stillschweigend aufgehoben.
  // Mit `!==` endet derselbe Fall im ersten Schleifendurchlauf im Fehlerpfad, weil es fuer
  // Version 5 keinen Schritt gibt. Das ist KEINE zweite Fassung der Entscheidung aus #34 (dort
  // wird "zu hoch" erkannt und mit eigener Meldung beantwortet, bevor diese Funktion ueberhaupt
  // gerufen wird), sondern nur die Weigerung, im Irrtumsfall etwas durchzuwinken.
  //
  // TERMINIERT IMMER, ohne Zaehler: Jeder angenommene Schritt erhoeht die Version um genau 1
  // (unten geprueft), also wird kein Schluessel der Kette zweimal benutzt. Spaetestens nach
  // `kette.size` Durchlaeufen ist entweder das Ziel erreicht oder kein Schritt mehr vorhanden.
  while (version !== AKTUELLE_SCHEMA_VERSION) {
    const schritt = kette.get(version)
    if (schritt === undefined) {
      return fehler(
        'unbekannter_fehler',
        `Für schemaVersion ${version} gibt es keinen Migrationsschritt auf ` +
          `${AKTUELLE_SCHEMA_VERSION}; das Projekt wurde nicht geladen.`,
      )
    }

    // Ein Schritt ist gewoehnlicher Code und kann werfen (z. B. beim Zugriff auf ein Feld, das
    // die alte Fassung nicht hatte). Der Wurf wird hier eingefangen, damit er nicht ueber die
    // IPC-Grenze entkommt, wo Fehlerklasse und Code verlorengingen (ergebnis.ts).
    let naechste: Record<string, unknown>
    try {
      naechste = schritt(aktuell)
    } catch (ursache) {
      return fehler(
        'unbekannter_fehler',
        `Der Migrationsschritt von schemaVersion ${version} ist gescheitert: ${text(ursache)}`,
      )
    }

    if (typeof naechste !== 'object' || naechste === null) {
      return fehler(
        'unbekannter_fehler',
        `Der Migrationsschritt von schemaVersion ${version} hat kein Objekt geliefert.`,
      )
    }

    // Konsistenz-Schutz gegen einen fehlerhaften kuenftigen Schritt. Er greift auch dann, wenn
    // der Sprung zufaellig auf der Zielversion landet (1 -> 3 bei Ziel 3): Ein Schritt, der zwei
    // Versionen auf einmal nimmt, hat die Zwischenstufe nicht durchlaufen - welche Felder dabei
    // fehlen, weiss niemand. Genau das ist der lautlose Datenverlust, gegen den dieses Issue
    // existiert. Abbruch ist deshalb richtiger als ein plausibel aussehendes Ergebnis.
    const neueVersion: unknown = naechste.schemaVersion
    if (typeof neueVersion !== 'number' || neueVersion !== version + 1) {
      return fehler(
        'unbekannter_fehler',
        `Der Migrationsschritt von schemaVersion ${version} hat ${String(neueVersion)} ` +
          `geliefert statt ${version + 1}; die Migrationskette ist inkonsistent.`,
      )
    }

    aktuell = naechste
    version = neueVersion
  }

  // MINDEST-LAUFZEITPRUEFUNG (s. Bericht/STOPP - bestaetigen, nicht erben).
  // TypeScript prueft zur Laufzeit nichts; `MigrationsSchritt` gibt `Record<string, unknown>`
  // zurueck, der Rueckgabetyp dieser Funktion verspricht aber ein vollstaendiges `Project`, das
  // anschliessend als aktives Projekt IM SPEICHER lebt (TK 9.5.1). Ein Schritt, der ein
  // Pflichtfeld vergisst, rutschte ohne diese Pruefung durch - und faellt dann erst Wochen
  // spaeter auf, wenn eine Aktion oder ein Werbeband im Render fehlt.
  // BEWUSST FLACH: geprueft werden Vorhandensein und grobe Art der neun Felder aus TK 9.11.3,
  // NICHT der Inhalt der Arrays. Eine tiefe Validierung waere eine zweite, konkurrierende
  // Definition der Projektform neben `contracts/project.ts`.
  if (!istProjektForm(aktuell)) {
    const fehlend = fehlendeProjektFelder(aktuell)
    return fehler(
      'unbekannter_fehler',
      `Nach der Migration fehlen oder passen nicht: ${fehlend.join(', ')}; ` +
        'das Projekt wurde nicht geladen.',
    )
  }

  // Die Form ist zur Laufzeit belegt, nicht behauptet: `istProjektForm` IST die Pruefung.
  return { ok: true, wert: aktuell }
}
// wendet, beginnend bei rohdaten.schemaVersion, Schritte aus `kette` an, bis das Ergebnis die
// aktuelle schemaVersion erreicht (Kettenprinzip: 1→2, 2→3, … – nie ein Sprung in einem Schritt).
// `kette` hat einen Vorgabewert (MIGRATIONS_KETTE) und wird von öffneProjekt (#34) NIE explizit
// mitgegeben; der zweite Parameter existiert ausschließlich, damit Tests eine eigene, kleine Kette
// mit Test-Schritten einspeisen können, ohne eine fachlich noch nicht existierende Migration in
// MIGRATIONS_KETTE selbst erfinden zu müssen.

/** Die neun Pflichtfelder aus TK 9.11.3 samt grober Art - dieselbe Reihenfolge wie dort. */
const PROJEKT_FELDER: ReadonlyArray<readonly [string, (wert: unknown) => boolean]> = [
  ['id', istText],
  ['name', istText],
  ['erstelltAm', istText],
  ['geaendertAm', istText],
  ['schemaVersion', (wert) => typeof wert === 'number'],
  ['assets', Array.isArray],
  ['aktionen', Array.isArray],
  ['liste', Array.isArray],
  // FA-22: null = noch nie gerendert. Ein fehlendes Feld ist etwas anderes als ein gesetztes
  // null - deshalb genuegt "ist nicht undefined" hier nicht.
  ['letzterAusgabeName', (wert) => wert === null || istText(wert)],
]

/** Namen der Felder, die nach der Migration fehlen oder offensichtlich die falsche Art haben. */
function fehlendeProjektFelder(objekt: Record<string, unknown>): string[] {
  const fehlend: string[] = []
  for (const [name, passt] of PROJEKT_FELDER) {
    if (!passt(objekt[name])) {
      fehlend.push(name)
    }
  }
  return fehlend
}

function istProjektForm(objekt: unknown): objekt is Project {
  if (typeof objekt !== 'object' || objekt === null || Array.isArray(objekt)) return false
  // SAFETY: die Zeile davor hat objekt als nicht-null, nicht-Array Objekt belegt; der
  // Cast macht die Index-Form sichtbar, und fehlendeProjektFelder prueft die Felder.
  return fehlendeProjektFelder(objekt as Record<string, unknown>).length === 0
}

function istText(wert: unknown): boolean {
  return typeof wert === 'string'
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/** Die Fehlerseite der Huelle. `Ergebnis<Project>` traegt genau die generischen Codes (#12). */
function fehler(
  code: 'ungueltige_eingabe' | 'unbekannter_fehler',
  meldung: string,
): { ok: false; fehler: { code: 'ungueltige_eingabe' | 'unbekannter_fehler'; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEINE PRUEFUNG "ist die Version ueberhaupt aelter". Das ist vollstaendig #34 (Abgrenzung im
//    Issue). Eine zweite Pruefung hier traefe dieselbe Fehlerentscheidung ein zweites Mal.
// 2. KEIN EIGENER FEHLERCODE fuer die lueckenhafte Kette - der STOPP-Block verlangt, das
//    gemeinsam mit der offenen Frage aus #34 zu klaeren. Bis dahin `unbekannter_fehler` mit
//    einer Meldung, die den Grund benennt.
// 3. KEIN ZURUECKSCHREIBEN und kein Anfassen des Dateisystems (Begruendung oben im Rumpf).
