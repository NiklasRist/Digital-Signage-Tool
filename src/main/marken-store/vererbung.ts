// [marken-store] Vererbung auflösen – die eine Stelle

import type { Marke, FarbRolle, SchriftRolle, Schrift } from '../../shared/contracts/marke'
import type { MarkenEintrag } from './schreibe-marken'
import type { MarkenFehlercode } from './fehlercodes'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
/**
 * Loest die Vererbung eines EINZELNEN Eintrags auf. `bestand` ist der VOLLSTAENDIGE, bereits
 * geladene Bestand (aus dem der Parent bei Bedarf gesucht wird) – NICHT nur der bereits gefundene
 * Parent, damit der Aufrufer keinen zweiten Suchschritt braucht und diese Funktion die einzige
 * Stelle bleibt, die je einen Parent nachschlaegt.
 *
 * Ist `eintrag.parent === null`, wird `eintrag` unveraendert (reshaped) als `Marke` zurueckgegeben –
 * die Systeminvariante, dass eine NICHT abgeleitete Marke IMMER vollstaendig befuellt ist, wird HIER
 * nicht erneut geprueft (sie ist durch #280/#284 strukturell erzwungen).
 *
 * SETZT AUSSERDEM `Marke.herkunftJeFeld` (TK 9.11.2, seit v3.5): je Feld "eigen" oder "geerbt",
 * beim `logo` zusaetzlich "keins" (wenn die aufgeloeste `logo` null ist). Die Angabe entsteht IM
 * SELBEN SCHRITT wie die Wertwahl - nicht durch einen nachtraeglichen Vergleich mit dem Parent,
 * der waere falsch (ein bewusst gleich gesetzter Wert gilt als "eigen") und ist verboten.
 * Bei `parent === null` ist der Stempel durchgehend "eigen", nie leer.
 *
 * Ist `eintrag.parent !== null`, wird der Parent in `bestand` gesucht:
 *   - fehlt er (verwaiste Ableitung) -> { ok: false, fehler: { code: 'marke_nicht_gefunden', ... } }
 *   - sonst: feldweise Vererbung, s. Ablauf unten. Es wird davon ausgegangen, dass der Parent selbst
 *     `parent === null` hat (Kettensperre, durchgesetzt von #284) – diese Funktion prueft die
 *     Kettentiefe NICHT erneut (s. "Nicht selbst entscheiden").
 */
export function loeseMarkeAuf(
  eintrag: MarkenEintrag,
  bestand: MarkenEintrag[],
): Ergebnis<Marke, MarkenFehlercode> {
  if (eintrag.parent === null) {
    // EIGENSTAENDIG: der Eintrag wird 1:1 in die Form Marke gebracht - ohne Werte zu
    // aendern oder zu ergaenzen (fremde Invariante: #280/#284 fuehren die Vollstaendigkeit;
    // der Stempel ist durchgehend 'eigen', bei logo 'keins', sobald die aufgeloeste
    // Form null traegt). Der LAUTE Loch-Check vom 06.10. gilt fuer den ABGELEITETEN
    // Pfad; dieser Pfad prueft NICHT (der Signaturkommentar halber).
    return { ok: true, wert: stempelEigenAlsMarke(eintrag) }
  }

  // ABGELEITET: der Parent wird in bestand gesucht.
  const parentEintrag = bestand.find((kandidat) => kandidat.id === eintrag.parent)
  if (parentEintrag === undefined) {
    // Verwaiste Ableitung: kein Rueckfall auf den unaufgeloesten Eintrag.
    return {
      ok: false,
      fehler: {
        code: 'marke_nicht_gefunden',
        meldung: `Die Marke '${eintrag.id}' leitet sich von '${eintrag.parent}' ab, aber diese Parent-Marke steht nicht im Bestand.`,
      },
    }
  }
  if (parentEintrag.parent !== null) {
    // USER-ENTSCHEIDUNG 06.10.2026: die Kettensperre
    // (TK 9.11.2, durchgesetzt von #284) ist verletzt - LAUT schief gehen, nicht still
    // eine zweite Stufe aufloesen. Der Code ist 'unbekannter_fehler' (kein eigener neuer
    // Code; die Tabelle TK 9.15.5 schliesst einen neuen aus und 'ungueltige_eingabe'
    // trifft nicht - die Nutzlast kommt aus dem Eigenen Bestand, nicht von aussen).
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Kettensperre verletzt: Der Parent '${parentEintrag.id}' der Marke '${eintrag.id}' hat selbst den Parent '${String(parentEintrag.parent)}' - Ketten duerfen nur EINE Stufe tief sein.`,
      },
    }
  }

  // FELDWEISE Vererbung. Die entscheidende Stelle ist die WAHL selbst und nicht ein
  // nachtraeglicher Vergleich der fertigen Marke mit dem Parent: Wer den eigenen Wert
  // nimmt, schreibt hier 'eigen' - auch wenn der Wert dem Parent gleich ist (verboten
  // ist nur der spaettere Wertvergleich, nicht die gleiche Zahl).
  const farben = {} as Record<FarbRolle, string>
  const farbenHerkunft = {} as Record<FarbRolle, 'eigen' | 'geerbt'>
  for (const rolle of ALLE_FARBROLLEN) {
    const eigen = eintrag.farben[rolle]
    if (eigen !== undefined) {
      farben[rolle] = eigen
      farbenHerkunft[rolle] = 'eigen'
      continue
    }
    farben[rolle] = parentEintrag.farben[rolle] as string
    farbenHerkunft[rolle] = 'geerbt'
  }

  const schriften = {} as Record<SchriftRolle, Schrift>
  const schriftenHerkunft = {} as Record<SchriftRolle, 'eigen' | 'geerbt'>
  for (const rolle of ALLE_SCHRIFTROLLEN) {
    const eigen = eintrag.schriften[rolle]
    if (eigen !== undefined) {
      schriften[rolle] = eigen
      schriftenHerkunft[rolle] = 'eigen'
      continue
    }
    schriften[rolle] = parentEintrag.schriften[rolle] as Schrift
    schriftenHerkunft[rolle] = 'geerbt'
  }

  // Fuenf feste Felder - FELD-genau (ENTSCHIEDEN; gleichlaufend mit #285):
  // ein Vergleich je TOP-LEVEL-Feld, kein Hinabsteigen in Unterkomponenten.
  const logo = eintrag.logo !== undefined ? eintrag.logo : parentEintrag.logo
  const sicherheit = eintrag.sicherheit !== undefined ? eintrag.sicherheit : parentEintrag.sicherheit
  const radien = eintrag.radien !== undefined ? eintrag.radien : parentEintrag.radien
  const schatten = eintrag.schatten !== undefined ? eintrag.schatten : parentEintrag.schatten
  const slogan = eintrag.slogan !== undefined ? eintrag.slogan : parentEintrag.slogan

  const marke: Marke = {
    id: eintrag.id,          // ausschliesslich vom eintrag - NIEMALS vom Parent
    name: eintrag.name,
    parent: eintrag.parent,
    eingebaut: eintrag.eingebaut,
    farben,
    schriften,
    logo: logo ?? null,
    // Die vier Felder gehen in den LaufPruefung und MUESSEN dann gefuellt sein
    // (findeLoch schlaegt andernfalls laut an); den Typecheck zufrieden zu stellen
    // geschieht hier bewusst NICHT mit Umschreiben der Kontrollflaeche, sondern mit
    // dem gesetzten Ergebnis des Ein-/Vererbungswegs. Der Cast sehr ist RAUM -
    // die Kontrolle liegt in findeLoch.
    sicherheit: sicherheit as NonNullable<typeof sicherheit>,
    radien: radien as NonNullable<typeof radien>,
    schatten: schatten as NonNullable<typeof schatten>,
    slogan: slogan as NonNullable<typeof slogan>,
    herkunftJeFeld: {
      farben: farbenHerkunft,
      schriften: schriftenHerkunft,
      // 'keins' traegt DAS AUFGELOESTE logo allein, wenn es null ist (Ersatz-Logo-Pfad
      // TK 9.10.10); sonst der Zweig, aus dem der Wert genommen wurde.
      logo: (logo ?? null) === null ? 'keins' : eintrag.logo !== undefined ? 'eigen' : 'geerbt',
      sicherheit: eintrag.sicherheit !== undefined ? 'eigen' : 'geerbt',
      radien: eintrag.radien !== undefined ? 'eigen' : 'geerbt',
      schatten: eintrag.schatten !== undefined ? 'eigen' : 'geerbt',
      slogan: eintrag.slogan !== undefined ? 'eigen' : 'geerbt',
    },
  }

  // USER-ENTSCHEIDUNG 06.10.2026 (Loch beim Parent): Ist nach der Vererbung ein Feld LEER
  // (weder Kind noch Parent tragen es), geht die Funktion LAUT schief - 'unbekannter_fehler'
  // mit Meldung, welche Rolle/welches Feld die Luecke traegt. Ein stiller Durchlauf
  // wuerde eine Marke mit undefined-Feld in einen Zeichenpfad geben.
  const loch = findeLoch(marke)
  if (loch !== null) {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: loch,
      },
    }
  }
  return { ok: true, wert: marke }
}

// ---------------------------------------------------------------------------
// Bausteine: Rollen-Listen, Form-Umsetzung mit Stempel, Loch-Pruefung.
// ---------------------------------------------------------------------------

/** Die dreizehn Farb-Rollen, Wortlaut wie in der Vertragsdatei (marke.ts, #52). */
const ALLE_FARBROLLEN: readonly FarbRolle[] = [
  'akzent', 'akzentKraeftig', 'akzentTief',
  'flaecheDunkel', 'flaecheSehrDunkel', 'flaecheHell', 'flaecheAkzentZart',
  'textAufDunkel', 'textAufHell', 'textSekundaer',
  'linie', 'scrimStart', 'scrimEnde',
] as const

/** Die vier Schrift-Rollen, Wortlaut wie in der Vertragsdatei. */
const ALLE_SCHRIFTROLLEN: readonly SchriftRolle[] = [
  'headlineElegant', 'headlinePlakativ', 'fliesstext', 'fliesstextFett',
] as const

/**
 * Bringt einen EIGENSTAENDIGEN Eintrag (parent === null) in die Form Marke und setzt
 * den Stempel. Werte werden NICHT geaendert und NICHT ergaenzt (`Partial` nach `Record`
 * durchgereicht) - die Vollstaendigkeit ist eine fremde Invariante (#280/#284) und wird
 * hier NICHT geprueft, so verlangt es der Signatur-Kommentar. Kein Aufrufer behandelt
 * einen Sonderfall: jeder Stempel-Einweis einer Methode bleibt 'eigen'.
 */
function stempelEigenAlsMarke(eintrag: MarkenEintrag): Marke {
  const farbenHerkunft = {} as Record<FarbRolle, 'eigen' | 'geerbt'>
  for (const rolle of ALLE_FARBROLLEN) {
    farbenHerkunft[rolle] = 'eigen'
  }
  const schriftenHerkunft = {} as Record<SchriftRolle, 'eigen' | 'geerbt'>
  for (const rolle of ALLE_SCHRIFTROLLEN) {
    schriftenHerkunft[rolle] = 'eigen'
  }
  return {
    id: eintrag.id,
    name: eintrag.name,
    parent: eintrag.parent,
    eingebaut: eintrag.eingebaut,
    farben: eintrag.farben as Record<FarbRolle, string>,
    schriften: eintrag.schriften as Record<SchriftRolle, Schrift>,
    logo: eintrag.logo ?? null,
    // SAFETY: Auf DIESEM Pfad wird die Vollstaendigkeit NICHT geprueft (verbindlicher
    // Signaturkommentar); ein leeres Feld wuerde programmatisch durchgehen - den lauten
    // Loch-Check tragt nur der abgeleitete Pfad (findeLoch). Der Cast erweitert die
    // Form des optionalen Feldes auf die Pflichtform von Marke.
    sicherheit: eintrag.sicherheit as NonNullable<MarkenEintrag['sicherheit']>,
    radien: eintrag.radien as NonNullable<MarkenEintrag['radien']>,
    schatten: eintrag.schatten as NonNullable<MarkenEintrag['schatten']>,
    slogan: eintrag.slogan as NonNullable<MarkenEintrag['slogan']>,
    herkunftJeFeld: {
      farben: farbenHerkunft,
      schriften: schriftenHerkunft,
      // 'keins' NUR am logo, und nur wenn die Form null traegt - Ersatz-Logo (TK 9.10.10).
      logo: (eintrag.logo ?? null) === null ? 'keins' : 'eigen',
      sicherheit: 'eigen',
      radien: 'eigen',
      schatten: 'eigen',
      slogan: 'eigen',
    },
  }
}

/**
 * Prueft das ERGEBNIS der Vererbung auf LEERE (Loecher) und liefert die Meldung des
 * ersten Funds - oder null. Ein Loch kann strukturell nur durch eine verletzte
 * Systeminvariante entstehen (#280/#284 fuehren die Vollstaendigkeit der eigenstaendigen
 * Marke; eine Migration, #281, die fuer den Parent weniger strokeLine, haette es hier
 * sichtbar zu machen). Lauter Fehler statt stiller Durchlauf - User-Entscheidung
 * vom 06.10.2026.
 */
function findeLoch(marke: Marke): string | null {
  for (const rolle of ALLE_FARBROLLEN) {
    if (marke.farben[rolle] === undefined) {
      return `Herleitung ergab ein Loch: Die Farb-Rolle '${String(rolle)}' ist in Marke '${marke.id}' nicht befuellt (weder eigen noch vom Parent geerbt).`
    }
  }
  for (const rolle of ALLE_SCHRIFTROLLEN) {
    if (marke.schriften[rolle] === undefined) {
      return `Herleitung ergab ein Loch: Die Schrift-Rolle '${String(rolle)}' ist in Marke '${marke.id}' nicht befuellt (weder eigen noch vom Parent geerbt).`
    }
  }
  // logo: null ist GUENSTIG (Ersatz-Logo-Pfad, TK 9.10.10) - nur `undefined` ist ein Loch.
  if (marke.logo === undefined) {
    return `Herleitung ergab ein Loch: 'logo' ist in Marke '${marke.id}' weder eigen noch geerbt gesetzt (undefined).`
  }
  // Die vier uebrigen festen Felder duerfen nach der Vererbung NICHT leer sein.
  if (marke.sicherheit === undefined || marke.radien === undefined ||
      marke.schatten === undefined || marke.slogan === undefined) {
    return `Herleitung ergab ein Loch: Eines der Felder sicherheit/radien/schatten/slogan ist in Marke '${marke.id}' weder eigen noch geerbt gesetzt (undefined).`
  }
  return null
}
