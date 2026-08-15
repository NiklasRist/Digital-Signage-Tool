// GENERIERT aus dem Signaturblock von Issue #133.
// [composer] Die Fix-Optionen je Fall
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
// GERUEST-PRUEFSUMME: 56d3443fff4377f5
//
// ---------------------------------------------------------------------------
// Diese Datei ordnet einer kaputten Stelle ihre Fix-Optionen zu und fuehrt genau
// die beiden aus, die keine weitere Eingabe brauchen. Alles andere ist eine
// UEBERGABE an die Oberflaeche: kein Dialog, kein Reiterwechsel, kein `reiheEin`.
// Genau deshalb ist die geführte Reparatur (FA-19) ohne Browser und ohne
// Main-Prozess vollstaendig pruefbar.
//
// Die tragende Unterscheidung ist die EBENE (TK 9.7.5):
//   Fall 1 `element_asset`  -> Listenelement-Ebene, Referenz per setzeElementReferenz
//   Fall 2 `element_aktion` -> AKTIONS-Ebene (ein Fix heilt alle Verwendungen) oder
//                              Referenz des Segments per setzeElementReferenz
//   Fall 3 `band_abschnitt` -> AKTIONS-Ebene oder das BAND per setzeEinblendung.
// Ein Band-Abschnitt ist KEIN Listenelement: Er hat keine eigene `id` in `liste`,
// und die `ref` des Videos zeigt weiter auf SEIN Asset. Wer hier
// setzeElementReferenz mit der elementId eines 'band_abschnitt' riefe, haengte das
// VIDEO um (und #152 setzt bei art 'video' zusaetzlich Trim zurueck), waehrend der
// kaputte Abschnitt stehenbliebe.

import type { Project, Einblendung, Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { entferneElementAusListe } from './element-entfernen'
import { gleicheElementAb } from './projektzustand'
import type { KaputteStelle } from './kaputt-erkennung'

export type FixOptionId =
  | 'medium_neu_verknuepfen'   // Fall 1: fehlende Datei neu importieren
  | 'medium_ersetzen'          // Fall 1: anderes vorhandenes Asset referenzieren
  | 'element_entfernen'        // Fall 1 + 2: das Listenelement aus der Liste nehmen
  | 'aktionsbild_reparieren'   // Fall 2 + 3: Bild der Aktion im action-editor in Ordnung bringen
  | 'aktion_ersetzen'          // Fall 2: dem Segment eine andere Aktion geben
  | 'abschnitt_ersetzen'       // Fall 3: dem Band-Abschnitt eine andere Aktion geben
  | 'abschnitt_entfernen'      // Fall 3: den Abschnitt aus dem Band nehmen

/** Die zulässigen Optionen dieser Stelle, in Anzeigereihenfolge. Rein, ohne Seiteneffekt. */
export function optionenFuer(stelle: KaputteStelle): FixOptionId[] {
  // Eine Tabelle, keine Heuristik. Jeder Aufruf liefert ein NEUES Array - eine
  // gemeinsam genutzte Konstante koennte eine Oberflaeche versehentlich sortieren
  // oder filtern und damit die Anzeigereihenfolge aller kuenftigen Stellen
  // mitaendern.
  switch (stelle.art) {
    case 'element_asset':
      return ['medium_neu_verknuepfen', 'medium_ersetzen', 'element_entfernen']

    // `aktionsbild_reparieren` steht bei beiden Aktions-Faellen VORNE: Es ist der
    // einzige Fix, der alle Verwendungen auf einmal behebt ("Der Fortschritt 'X von
    // N' kann dadurch um mehr als eins sinken", TK 9.7.5). Die Reihenfolge ist
    // Anzeigereihenfolge und damit Teil des gefuehrten Ablaufs.
    case 'element_aktion':
      return ['aktionsbild_reparieren', 'aktion_ersetzen', 'element_entfernen']

    // KEIN `element_entfernen`: Das Video ist einwandfrei. Es zu entfernen waere die
    // Reaktion auf den falschen Defekt - der Nutzer verloere sein Video aus der
    // Wiedergabeliste, weil eine von mehreren rotierenden Werbeaktionen kein Bild
    // mehr hat (dieselbe Unterscheidung wie die Loesch-Kaskade in TK 9.5.3).
    case 'band_abschnitt':
      return ['aktionsbild_reparieren', 'abschnitt_ersetzen', 'abschnitt_entfernen']

    default:
      // Der Vertrag wurde erweitert, diese Datei nicht. Eine leere Liste ist hier
      // die ehrliche Antwort: `fuehreFixAus` lehnt danach JEDE Option mit
      // `ungueltige_eingabe` ab, statt still etwas Falsches zu tun.
      return []
  }
}

export type Uebergabe =
  | { ziel: 'medien-import'; elementId: string }                 // öffneMedienDialog + reiheEin('import')
  | { ziel: 'action-editor'; aktionId: string }                  // Bild der Aktion reparieren
  | { ziel: 'asset-auswahl'; elementId: string }                 // anderes Asset für das Element
  | { ziel: 'aktions-auswahl'; elementId: string; abschnittIndex: number | null }

export type FixWirkung =
  | { art: 'erledigt' }              // eine Store-Operation ist gelaufen und hat bestätigt
  | { art: 'uebergabe'; an: Uebergabe }   // die Oberfläche muss weiterleiten

/** Kurzform fuer die beiden Fehlercodes, die diese Datei SELBST vergibt. */
function fehler(
  code: 'ungueltige_eingabe' | 'nicht_gefunden',
  meldung: string,
): Ergebnis<FixWirkung> {
  return { ok: false, fehler: { code, meldung } }
}

/** Eine nicht leere Kennung - dieselbe Grenze wie in #124 (`trim()`), damit an dieser
 *  Naht nicht zwei verschiedene Grenzen gelten. `typeof` trotz `string` in der
 *  Signatur: Die IDs kommen aus der Oberflaeche und koennen dort aus einer ungetypten
 *  Quelle stammen. */
function istKennung(wert: string): boolean {
  return typeof wert === 'string' && wert.trim() !== ''
}

/** Das Band eines Listenelements aus dem uebergebenen Projektstand holen - der
 *  gemeinsame Vorlauf von `abschnitt_entfernen` und `schliesseAbschnittsFixAb`.
 *  Beide brauchen dieselben drei Pruefungen mit demselben Code `nicht_gefunden`;
 *  zweimal geschrieben liefen sie irgendwann auseinander. */
function holeBand(
  projekt: Project,
  elementId: string,
  abschnittIndex: number,
): { ok: true; einblendung: Einblendung } | { ok: false; grund: string } {
  const element = projekt.liste.find((eintrag) => eintrag.id === elementId)
  if (element === undefined) {
    return { ok: false, grund: `Kein Listenelement mit der Kennung ${elementId}.` }
  }
  if (element.einblendung === null) {
    return { ok: false, grund: `Das Listenelement ${elementId} hat kein Band.` }
  }
  // Index ausserhalb -> die Erkennung ist veraltet, es wurde inzwischen etwas
  // anderes am Band geaendert. Keine Wirkung, kein IPC-Aufruf.
  if (abschnittIndex < 0 || abschnittIndex >= element.einblendung.abschnitte.length) {
    return {
      ok: false,
      grund: `Das Band von ${elementId} hat keinen Abschnitt an Position ${abschnittIndex}.`,
    }
  }
  return { ok: true, einblendung: element.einblendung }
}

/** Die gemeinsame Sende- und Abgleichroutine der drei schreibenden Wege.
 *
 *  Bei `ok` geht das zurueckgegebene `Listenelement` an `gleicheElementAb` (#121) -
 *  ohne diesen Schritt bliebe die Sicht auf dem alten Stand, `findeKaputteStellen`
 *  meldete die behobene Stelle weiter, und "X von N" spraenge nie weiter. Bei
 *  `ok: false` wird der Fehler UNVERAENDERT durchgereicht (Code, Meldung und
 *  `daten`) und die Sicht NICHT angefasst. */
async function sendeUndGleicheAb(
  kanal: string,
  nutzlast: unknown,
): Promise<Ergebnis<FixWirkung>> {
  const antwort = await rufeAuf<Listenelement>(kanal, nutzlast)
  if (!antwort.ok) return antwort
  gleicheElementAb(antwort.wert)
  return { ok: true, wert: { art: 'erledigt' } }
}

export async function fuehreFixAus(
  stelle: KaputteStelle,
  option: FixOptionId,
  projekt: Project,
): Promise<Ergebnis<FixWirkung>> {
  // Erst die Ebene, dann die Wirkung: Passt die Option nicht zur Stelle, geschieht
  // NICHTS - kein IPC-Aufruf, keine Uebergabe. Dieselbe Haltung, die der Main
  // gegenueber dem Renderer einnimmt (TK 9.1.1 Punkt 6), eine Ebene frueher. Das
  // deckt zugleich den unbekannten `stelle.art` ab, weil `optionenFuer` dafuer eine
  // leere Liste liefert.
  if (!optionenFuer(stelle).includes(option)) {
    return fehler(
      'ungueltige_eingabe',
      `Die Option ${option} ist fuer eine Stelle der Art ${stelle.art} nicht zulaessig.`,
    )
  }

  switch (option) {
    // --- Die fuenf Uebergaben. Hier wird NICHTS geschrieben, NICHTS gesendet und
    // NICHTS am Projekt geaendert; der Rueckgabewert ist eine Anweisung an die
    // Oberflaeche. Den Rueckweg loest sie spaeter als EIGENEN Aufruf aus - diese
    // Funktion wartet auf nichts.
    case 'medium_neu_verknuepfen':
      // Die `elementId` reist MIT. Ohne sie wuesste nach dem Import niemand, welches
      // Listenelement auf das neue Medium zeigen soll: Ein Import legt ein NEUES
      // Asset mit NEUER UUID an, das Element zeigt weiter auf die alte, fehlende ID
      // - und `schliesseMediumFixAb` haette keinen ersten Parameter.
      return { ok: true, wert: { art: 'uebergabe', an: { ziel: 'medien-import', elementId: stelle.elementId } } }

    case 'medium_ersetzen':
      return { ok: true, wert: { art: 'uebergabe', an: { ziel: 'asset-auswahl', elementId: stelle.elementId } } }

    case 'aktionsbild_reparieren': {
      // Nur die beiden Aktions-Faelle tragen eine `aktionId`; die Tabelle oben bietet
      // die Option nirgends sonst an. Die Pruefung steht trotzdem hier, weil erst sie
      // dem Typsystem die Verengung erlaubt.
      if (stelle.art !== 'element_aktion' && stelle.art !== 'band_abschnitt') {
        return fehler('ungueltige_eingabe', 'Diese Stelle haengt an keiner Aktion.')
      }
      return { ok: true, wert: { art: 'uebergabe', an: { ziel: 'action-editor', aktionId: stelle.aktionId } } }
    }

    case 'aktion_ersetzen':
      // `abschnittIndex: null` sagt der Auswahl-Oberflaeche, dass ein LISTENELEMENT
      // gemeint ist. Damit bedient sie beide Ersetzen-Faelle mit einer Umsetzung,
      // ohne dass hier die Ebene verlorengeht.
      return {
        ok: true,
        wert: { art: 'uebergabe', an: { ziel: 'aktions-auswahl', elementId: stelle.elementId, abschnittIndex: null } },
      }

    case 'abschnitt_ersetzen': {
      if (stelle.art !== 'band_abschnitt') {
        return fehler('ungueltige_eingabe', 'Nur ein Band-Abschnitt kann ersetzt werden.')
      }
      return {
        ok: true,
        wert: {
          art: 'uebergabe',
          an: { ziel: 'aktions-auswahl', elementId: stelle.elementId, abschnittIndex: stelle.abschnittIndex },
        },
      }
    }

    // --- Die beiden ausfuehrenden Optionen. Sie brauchen keine weitere Eingabe.
    case 'element_entfernen': {
      // AUSSCHLIESSLICH ueber #124 - ausdruecklich NICHT
      // `rufeAuf(KANAELE.project.entferneElement, ...)` von hier aus. Der Kanal haette
      // sonst zwei Aufrufer, und nur #124 zieht die Sicht nach. Bliebe das entfernte
      // Element in der Sicht stehen, zaehlte "X von N" die behobene Stelle weiter mit
      // und `istRenderFreigegeben` bliebe dauerhaft false.
      const antwort = await entferneElementAusListe(stelle.elementId)
      if (!antwort.ok) return antwort
      return { ok: true, wert: { art: 'erledigt' } }
    }

    case 'abschnitt_entfernen': {
      if (stelle.art !== 'band_abschnitt') {
        return fehler('ungueltige_eingabe', 'Nur ein Band-Abschnitt kann entfernt werden.')
      }

      const band = holeBand(projekt, stelle.elementId, stelle.abschnittIndex)
      if (!band.ok) return fehler('nicht_gefunden', band.grund)

      // Ein NEUES Array; das urspruengliche bleibt unberuehrt. Der uebergebene
      // Projektstand ist Lesegut - wer ihn hier veraenderte, verschoebe den Stand,
      // aus dem die Fuehrung (#132) gerade ihren Fortschritt rechnet.
      const abschnitte = band.einblendung.abschnitte.filter(
        (_, index) => index !== stelle.abschnittIndex,
      )

      // Der Randfall aus TK 9.5.3: Wird das Band leer, entfaellt die Einblendung GANZ
      // (`null`) - NICHT ein Objekt mit leerem Array. "Ein Band mit null Abschnitten
      // haette nichts zu zeigen, und der Render muesste eine Bandspur der Laenge 0
      // bauen." Das VIDEOELEMENT bleibt in jedem Fall stehen.
      //
      // `bandVorlageId` wird UEBERNOMMEN, nie neu gewaehlt: "Alle Abschnitte eines
      // Elements nutzen dieselbe Band-Vorlage (eine bandVorlageId pro Einblendung)"
      // (TK 9.2.8).
      const einblendung: Einblendung | null =
        abschnitte.length === 0
          ? null
          : { bandVorlageId: band.einblendung.bandVorlageId, abschnitte }

      // In IPC-Form, nicht als nackter Funktionsaufruf: Der Renderer darf `src/main`
      // nicht importieren, der einzige Weg ueber die Prozessgrenze ist `rufeAuf`
      // (#24), und Kanalnamen kommen aus `KANAELE` (#25), nie als String-Literal.
      return await sendeUndGleicheAb(KANAELE.project.setzeEinblendung, {
        elementId: stelle.elementId,
        einblendung,
      })
    }

    default:
      // Unerreichbar, solange `FixOptionId` und die Tabelle deckungsgleich sind -
      // und genau deshalb hier: Waechst die Union, faellt die neue Option hier auf,
      // statt still nichts zu tun.
      return fehler('ungueltige_eingabe', `Unbekannte Fix-Option: ${String(option)}.`)
  }
}

/** Der Gegenweg zu den beiden Medium-Übergaben: Nachdem der Nutzer im Import- oder Auswahl-Dialog
 *  ein Asset bestimmt hat, setzt DIESE Funktion die Referenz des Listenelements um. Ohne sie wäre
 *  jede der beiden Übergaben eine Sackgasse (s. Ablauf 5). */
export async function schliesseMediumFixAb(
  elementId: string,
  neueAssetId: string,
): Promise<Ergebnis<FixWirkung>> {
  if (!istKennung(elementId) || !istKennung(neueAssetId)) {
    return fehler(
      'ungueltige_eingabe',
      'schliesseMediumFixAb braucht eine nicht leere elementId und eine nicht leere neueAssetId.',
    )
  }

  // KEINE Vorpruefung der Element-Art und keine Existenzpruefung des Assets: Ob das
  // Ziel existiert und ob sein Typ zur `art` des Elements passt, prueft #152 im Main
  // (TK 9.1.1 Punkt 6). Eine Pruefung hier waere eine zweite Wahrheit ueber den
  // Medienbestand - und die beiden koennten auseinanderlaufen.
  return await sendeUndGleicheAb(KANAELE.project.setzeElementReferenz, {
    elementId,
    referenz: neueAssetId,
  })
}

/** Der Gegenweg zu `aktion_ersetzen`: Nachdem der Nutzer in der Aktions-Auswahl eine andere Aktion
 *  bestimmt hat, setzt DIESE Funktion die Referenz des SEGMENT-Listenelements um. Gleicher Kanal
 *  wie oben – die zweite ID ist hier aber eine AKTIONS-ID (s. Ablauf 5b). */
export async function schliesseAktionsFixAb(
  elementId: string,
  neueAktionId: string,
): Promise<Ergebnis<FixWirkung>> {
  if (!istKennung(elementId) || !istKennung(neueAktionId)) {
    return fehler(
      'ungueltige_eingabe',
      'schliesseAktionsFixAb braucht eine nicht leere elementId und eine nicht leere neueAktionId.',
    )
  }

  // Zwei Namen statt eines Parameters, der "mal das eine, mal das andere" meint: Eine
  // vertauschte ID fiele sonst erst im Main als `nicht_gefunden` auf - also erst,
  // nachdem der Nutzer den Fix bestaetigt hat.
  //
  // Die ALTE Aktion wird dabei nicht angefasst. Sie bleibt in der Bibliothek und
  // bleibt an ihren uebrigen Verwendungen kaputt; wer alle Verwendungen auf einmal
  // heilen will, nimmt `aktionsbild_reparieren` - das steht deshalb an erster Stelle.
  return await sendeUndGleicheAb(KANAELE.project.setzeElementReferenz, {
    elementId,
    referenz: neueAktionId,
  })
}

/** Der Gegenweg zu `abschnitt_ersetzen`: Nachdem der Nutzer in der Aktions-Auswahl eine andere
 *  Aktion bestimmt hat, tauscht DIESE Funktion die `aktionRef` GENAU EINES Band-Abschnitts aus.
 *  Sie laeuft ueber `setzeEinblendung` (#120) und NIEMALS ueber `setzeElementReferenz` (#152) –
 *  ein Abschnitt ist kein Listenelement (s. Ablauf 5c und STOPP). `projekt` wird gebraucht, weil
 *  `setzeEinblendung` die GANZE Einblendung ersetzt und das uebrige Band dafuer bekannt sein muss. */
export async function schliesseAbschnittsFixAb(
  elementId: string,
  abschnittIndex: number,
  neueAktionId: string,
  projekt: Project,
): Promise<Ergebnis<FixWirkung>> {
  if (
    !istKennung(elementId) ||
    !istKennung(neueAktionId) ||
    !Number.isInteger(abschnittIndex) ||
    abschnittIndex < 0
  ) {
    return fehler(
      'ungueltige_eingabe',
      'schliesseAbschnittsFixAb braucht nicht leere Kennungen und einen ganzzahligen abschnittIndex >= 0.',
    )
  }

  const band = holeBand(projekt, elementId, abschnittIndex)
  if (!band.ok) return fehler('nicht_gefunden', band.grund)

  // Ein NEUES Array gleicher LAENGE und gleicher REIHENFOLGE; nur der eine Eintrag
  // ist ersetzt. Die `dauer` wird UNVERAENDERT uebernommen und NICHT aus der neuen
  // Aktion gezogen: Der Nutzer hat das Motiv getauscht, nicht die Zeit - eine still
  // geaenderte Dauer verschoebe das ganze Band gegen das Video (TK 9.2.8).
  const abschnitte = band.einblendung.abschnitte.map((abschnitt, index) =>
    index === abschnittIndex ? { aktionRef: neueAktionId, dauer: abschnitt.dauer } : abschnitt,
  )

  // Der Leer-Fall aus TK 9.5.3 tritt hier NIE ein - ein Ersetzen entfernt nichts.
  // `einblendung` ist deshalb niemals `null`; wer das trotzdem einbaute, loeschte ein
  // Band, das der Nutzer nur korrigieren wollte.
  const einblendung: Einblendung = {
    bandVorlageId: band.einblendung.bandVorlageId,
    abschnitte,
  }

  // `setzeEinblendung`, NIEMALS `setzeElementReferenz`: `Listenelement.ref` wird hier
  // nicht angefasst - der `ref` des Videos zeigt weiterhin auf sein Asset.
  return await sendeUndGleicheAb(KANAELE.project.setzeEinblendung, { elementId, einblendung })
}
