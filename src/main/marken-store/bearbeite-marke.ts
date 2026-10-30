// [marken-store] bearbeiteMarke(markeId, teilwerte) – Werte setzen oder an den Parent zurückgeben

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke, FarbRolle, SchriftRolle, Schrift, Herkunft } from '../../shared/contracts/marke'
import type { MarkenFehlercode } from './fehlercodes'
import { SICHERHEITSABSTAND_BEREICH } from '../../shared/contracts/konstanten'
import { aendereBestand } from './schreibe-marken'
import { loeseMarkeAuf } from './vererbung'

// Die Grenzen des Sicherheitsabstands stehen NUR in `SICHERHEITSABSTAND_BEREICH` (#21) -
// dieselbe Konstante prueft der marken-editor (#308); hier keine Literale.

/**
 * Sentinel für „diesen Wert an den Parent zurückgeben". Nur zulässig, wenn die bearbeitete Marke
 * `parent !== null` hat; bei einer eigenständigen oder eingebauten Marke gibt es nichts, an das
 * zurückgegeben werden könnte.
 */
export interface MarkenWertGeerbt { geerbt: true }

/** Ein Feld ist entweder EIGEN GESETZT (der Wert), GEERBT (Sentinel) oder – als fehlender Schlüssel
 *  im umgebenden Objekt – UNVERÄNDERT. Diese drei Zustände sind mit einem gewöhnlichen
 *  `Partial<Marke>` NICHT ausdrückbar (der hat nur zwei: vorhanden/fehlend). */
export type MarkenFeld<T> = T | MarkenWertGeerbt

export interface MarkenTeilwerte {
  name?:       string                                          // NIE geerbt (TK 9.11.2: name bleibt eigen)
  farben?:     Partial<Record<FarbRolle, MarkenFeld<string>>>
  schriften?:  Partial<Record<SchriftRolle, MarkenFeld<Schrift>>>
  logo?:       MarkenFeld<{ datei: string; herkunft: Herkunft; seitenverhaeltnis: number } | null>
  sicherheit?: MarkenFeld<{ horizontal: number; vertikal: number }>
  radien?:     MarkenFeld<{ pille: number; karte: number; klein: number }>
  schatten?:   MarkenFeld<{ versatzY: number; weichzeichnen: number; farbe: string }>
  slogan?:     MarkenFeld<{ text: string; aktiv: boolean }>
}

export async function bearbeiteMarke(
  markeId: string,
  teilwerte: MarkenTeilwerte,
): Promise<Ergebnis<Marke, MarkenFehlercode>> {
  // SCHRITT 1: Validieren, BEVOR irgendetwas passiert (TK 9.1.1 Punkt 6) - ohne jede
  // Wirkung auf die Daten. Diese Validierung prueft nur die NUTZLAST; der Entstehungs-
  // ort ist der Main, nicht der Renderer.

  if (typeof markeId !== 'string' || markeId.length === 0) {
    return abweis('ungueltige_eingabe', 'bearbeiteMarke: Die markeId ist leer oder kein Text.')
  }
  if (typeof teilwerte !== 'object' || teilwerte === null || Array.isArray(teilwerte)) {
    return abweis('ungueltige_eingabe', 'bearbeiteMarke: Die Teilwerte sind kein Objekt.')
  }

  // name: IMMER eigen, kein Sentinel, getrimmt, max. 80 Zeichen (Fehlerpfade).
  let neuerName: string | null = null
  if ('name' in teilwerte && teilwerte.name !== undefined) {
    if (typeof teilwerte.name !== 'string') {
      return abweis('ungueltige_eingabe', 'bearbeiteMarke: Der Name ist kein Text.')
    }
    const getrimmt = teilwerte.name.trim()
    if (getrimmt.length === 0 || getrimmt.length > 80) {
      return abweis(
        'ungueltige_eingabe',
        'bearbeiteMarke: Der Name ist nach dem Trimmen leer oder laenger als 80 Zeichen.',
      )
    }
    neuerName = getrimmt
  }

  // Kein Cast auf `Object.keys`: Die Pruefung steht IN der Schleife, und erst der Guard
  // macht aus dem Text eine bekannte Rolle - so bleibt der Typ bis hierher ehrlich.
  const schluesselVonFarben: FarbRolle[] = []
  for (const rolle of Object.keys(teilwerte.farben ?? {})) {
    // KEIN Hex-Format hier (User-Entscheid 06.10.2026, Muster #339): Der Fachwert ist
    // ein freier String; ein Format-Maßstab wuerde eine zweite Formatquelle neben der
    // Zeichenschicht erzeugen. Nur die Sentinel-Form ist strukturiert und geprueft.
    if (!istFarbRolle(rolle)) {
      return abweis(
        'ungueltige_eingabe',
        `bearbeiteMarke: '${String(rolle)}' ist keine bekannte Farb-Rolle.`,
      )
    }
    schluesselVonFarben.push(rolle)
  }
  const schluesselVonSchriften: SchriftRolle[] = []
  for (const rolle of Object.keys(teilwerte.schriften ?? {})) {
    if (!istSchriftRolle(rolle)) {
      return abweis(
        'ungueltige_eingabe',
        `bearbeiteMarke: '${String(rolle)}' ist keine bekannte Schrift-Rolle.`,
      )
    }
    schluesselVonSchriften.push(rolle)
    const wert = teilwerte.schriften?.[rolle]
    if (!istSentinel(wert) && !istFachwertSchrift(wert)) {
      return abweis(
        'ungueltige_eingabe',
        `bearbeiteMarke: Der Wert der Schrift-Rolle '${String(rolle)}' hat nicht die Fachform (familie/gewicht/datei/herkunft).`,
      )
    }
  }

  // sicherheit als FACHWERT: beide Achsen als GANZES Feld, ganzzahlig, im Bereich
  // (ENTSCHEIDEN 10.08.). KEINE erfundenen Grenzen fuer andere Felder.
  if ('sicherheit' in teilwerte && teilwerte.sicherheit !== undefined) {
    if (!istSentinel(teilwerte.sicherheit)) {
      const achsen = teilwerte.sicherheit
      if (
        typeof achsen !== 'object' || achsen === null ||
        !('horizontal' in achsen) || !('vertikal' in achsen)
      ) {
        return abweis(
          'ungueltige_eingabe',
          'bearbeiteMarke: Sicherheit ist als Ganzes zu setzen; eine fehlende Achse waere ein Datenverlust.',
        )
      }
      if (!istGanzzahl(achsen.horizontal) || !istGanzzahl(achsen.vertikal)) {
        return abweis(
          'ungueltige_eingabe',
          'bearbeiteMarke: Beide Sicherheits-Achsen muessen endliche Ganzzahlen sein - NICHT gerundet.',
        )
      }
      // `istGanzzahl` ist ein Type-Guard - nach der Pruefung sind beide Achsen `number`.
      const horizontal = achsen.horizontal
      const vertikal = achsen.vertikal
      if (
        horizontal < SICHERHEITSABSTAND_BEREICH.horizontal.min ||
        horizontal > SICHERHEITSABSTAND_BEREICH.horizontal.max ||
        vertikal < SICHERHEITSABSTAND_BEREICH.vertikal.min ||
        vertikal > SICHERHEITSABSTAND_BEREICH.vertikal.max
      ) {
        return abweis(
          'ungueltige_eingabe',
          `bearbeiteMarke: Der Sicherheitsabstand liegt ausserhalb des Bereichs (horizontal ${String(SICHERHEITSABSTAND_BEREICH.horizontal.min)}-${String(SICHERHEITSABSTAND_BEREICH.horizontal.max)}, vertikal ${String(SICHERHEITSABSTAND_BEREICH.vertikal.min)}-${String(SICHERHEITSABSTAND_BEREICH.vertikal.max)}) - keine Abschraegung auf die Grenze.`,
        )
      }
    }
  }

  // logo/radien/schatten/slogan: nur die Objekt-Foermen, ein Sentinel nur bei Ableitung.
  for (const feld of ['logo', 'radien', 'schatten', 'slogan'] as const) {
    const wert = teilwerte[feld]
    if (wert === undefined) continue
    if (istSentinel(wert)) continue
    // logo: null ist ein LEGITIMER Fachwert ("kein eigenes Logo", Ersatz-Logo greift,
    // TK 9.10.10); `null` ist also nicht mit dem Sentinel zu verwechseln und nicht
    // mit 'Struktur fehlt'. Nur fuer logo gilt diese Ausnahme.
    if (feld === 'logo' && wert === null) continue
    if (typeof wert !== 'object' || wert === null) {
      return abweis('ungueltige_eingabe', `bearbeiteMarke: '${feld}' hat nicht die Fachform (Objekt).`)
    }
    if (feld === 'logo') {
      // SAFETY: `wert` ist an dieser Stelle ein Objekt (zwei Zeilen darueber geprueft) und
      // `feld === 'logo'`; der Cast macht die drei Felder als unknown LESBAR - geprueft
      // werden sie unmittelbar danach, keiner der Werte wird ungeprueft benutzt.
      const logoAngaben = wert as { datei?: unknown; herkunft?: unknown; seitenverhaeltnis?: unknown }
      if (
        typeof logoAngaben.datei !== 'string' ||
        (logoAngaben.herkunft !== 'gebuendelt' && logoAngaben.herkunft !== 'importiert') ||
        typeof logoAngaben.seitenverhaeltnis !== 'number'
      ) {
        return abweis('ungueltige_eingabe', "bearbeiteMarke: 'logo' hat nicht die Fachform (datei/herkunft/seitenverhaeltnis).")
      }
    }
  }

  // SCHRITT 2: die Aenderung ENTRELLT anwenden - Erfolg ist im SPEICHER (TK 9.5.4,
  // Instant-Op getrennt vom Platten schreiben). Die spateren Schreibfehler laufen ueber
  // marken:autoSpeichernStatus (#278; dieselbe Antwort wie M4-04/M4-08).
  const ergebnis = await aendereBestand((bestand) => {
    const eintrag = bestand.find((kandidat) => kandidat.id === markeId)
    if (eintrag === undefined) {
      return abweis('marke_nicht_gefunden', `bearbeiteMarke: Es steht keine Marke mit der Kennung '${markeId}' im Bestand.`)
    }

    // 2b. Ein Sentinel NUR bei Ableitung: eine eigenstaendige Marke gibt nichts
    // mehr zum Parent zurueck.
    if (eintrag.parent === null) {
      for (const feld of ['farben', 'schriften', 'logo', 'sicherheit', 'radien', 'schatten', 'slogan'] as const) {
        const wert = teilwerte[feld]
        const rolausdrueck = feld === 'farben' || feld === 'schriften'
          ? Object.values(typeof wert === 'object' && wert !== null ? wert : {})
          : [wert]
        if (rolausdrueck.some((v) => istSentinel(v))) {
          return abweis(
            'ungueltige_eingabe',
            `bearbeiteMarke: '${feld}' kann auf einer eigenstaendigen Marke nicht zurueckgegeben werden - sie hat keinen Parent.`,
          )
        }
      }
    }

    // name: eigen, getrimmt (kovarianter Spezialfall - kein geerbt-Zustand).
    if (neuerName !== null) {
      eintrag.name = neuerName
    }

    // farben: der EIGENE Wert gilt fuer die Rolle; ein Sentinel ENTfernt den Schluessel
    // (delete, KEIN undefined-Wert - denn ein Schluessel mit dem Wert 'undefined' saehe
    // fuer #279 anders aus als ein FEHLENDER, falls dessen Pruefung 'in' statt eines
    // Truthy-Checks nutzt - so verlangt es Ablaufpunkt 2b.
    if (teilwerte.farben !== undefined) {
      for (const [schluessel, wert] of Object.entries(teilwerte.farben)) {
        // Die Pruefung oben hat jeden Schluessel abgewiesen, der keine Farb-Rolle ist;
        // der Guard verengt ihn hier ein zweites Mal, damit kein Cast noetig ist.
        if (!istFarbRolle(schluessel)) continue
        if (istSentinel(wert)) {
          delete eintrag.farben[schluessel]
        } else {
          // SAFETY: `istSentinel` hat den Sentinel-Wert ausgeschlossen; damit ist der Wert
          // die Fachform der Rolle - `MarkenFeld<string>` bleibt fuer den Typcheck aber eine
          // Union, weil der Guard nur den Sentinel-Zweig ausschliesst.
          eintrag.farben[schluessel] = wert as string
        }
      }
    }
    if (teilwerte.schriften !== undefined) {
      for (const [schluessel, wert] of Object.entries(teilwerte.schriften)) {
        if (!istSchriftRolle(schluessel)) continue
        if (istSentinel(wert)) {
          delete eintrag.schriften[schluessel]
        } else {
          // SAFETY: wie bei den Farben - `istSentinel` hat den Sentinel ausgeschlossen,
          // der Rest ist die Fachform (oben mit istFachwertSchrift geprueft).
          eintrag.schriften[schluessel] = wert as Schrift
        }
      }
    }
    for (const feld of ['logo', 'sicherheit', 'radien', 'schatten', 'slogan'] as const) {
      const wert = teilwerte[feld]
      if (wert === undefined) continue
      if (istSentinel(wert)) {
        delete eintrag[feld]
      } else {
        // SAFETY: `feld` ist genau die Union der fuenf Felder, `wert` kommt aus demselben
        // Feld; der Doppelcast ist noetig, weil TS einen dynamischen Schreibzugriff auf
        // `Marke` sonst als Zuweisung an die Vereinigung ALLER Feldtypen prueft.
        const alsFeld = eintrag as unknown as Record<string, unknown>
        alsFeld[feld] = structuredClone(wert)
      }
    }

    // SCHRITT 3 in derselben Einheit: die aufgeloeste Marke zurueckgeben (#279; der
    // Stempel entsteellt IM SELBE Schritt wie die Wertwahl).
    const aufgeloest = loeseMarkeAuf(eintrag, bestand)
    if (!aufgeloest.ok) {
      return { ok: false, fehler: aufgeloest.fehler }
    }
    return { ok: true, wert: { bestand, wert: aufgeloest.wert } }
  }, 'entprellt')

  return ergebnis
}

// ---------------------------------------------------------------------------
// Bausteine: Rollen-Listen (Wortlaut wie im Vertrag marke.ts), Sentinel-Pruefung,
// Fachform-Pruefung, Ganzzahl-Pruefung, Fehler-Huelle.
// ---------------------------------------------------------------------------

const ALLE_FARBROLLEN: readonly FarbRolle[] = [
  'akzent', 'akzentKraeftig', 'akzentTief',
  'flaecheDunkel', 'flaecheSehrDunkel', 'flaecheHell', 'flaecheAkzentZart',
  'textAufDunkel', 'textAufHell', 'textSekundaer',
  'linie', 'scrimStart', 'scrimEnde',
] as const

const ALLE_SCHRIFTROLLEN: readonly SchriftRolle[] = [
  'headlineElegant', 'headlinePlakativ', 'fliesstext', 'fliesstextFett',
] as const

/** Der Sentinel - деко sein einziger als Hinweis. */
function istSentinel(wert: unknown): wert is MarkenWertGeerbt {
  if (typeof wert !== 'object' || wert === null || Array.isArray(wert)) return false
  // SAFETY: Die drei Zeilen davor haben `wert` als nicht-null Objekt (kein Array) belegt;
  // der Cast macht das Feld `geerbt` als unknown LESBAR - verglichen wird nur auf `=== true`.
  const alsObjekt = wert as { geerbt?: unknown }
  return 'geerbt' in wert && alsObjekt.geerbt === true && Object.keys(wert).length === 1
}

/** Die Fachform einer Schrift-Rollen-Wertes (familie/gewicht/datei/herkunft). */
function istFachwertSchrift(wert: unknown): boolean {
  if (typeof wert !== 'object' || wert === null || Array.isArray(wert)) return false
  // SAFETY: Die Zeile davor hat `wert` als nicht-null Objekt (kein Array) belegt; der Cast
  // macht die vier Felder als unknown LESBAR - jedes wird direkt danach einzeln geprueft.
  const schrift = wert as { familie?: unknown; gewicht?: unknown; datei?: unknown; herkunft?: unknown }
  return (
    typeof schrift.familie === 'string' &&
    typeof schrift.gewicht === 'number' &&
    typeof schrift.datei === 'string' &&
    (schrift.herkunft === 'gebuendelt' || schrift.herkunft === 'importiert')
  )
}

/** Wahre endliche Ganzzahl - kein Zurechtbiegen (kein Runden). */
/** Ist dieser Text eine der bekannten Farb-Rollen? Der Guard verengt den Schluessel. */
function istFarbRolle(wert: string): wert is FarbRolle {
  return ALLE_FARBROLLEN.some((rolle) => rolle === wert)
}

/** Ist dieser Text eine der bekannten Schrift-Rollen? Der Guard verengt den Schluessel. */
function istSchriftRolle(wert: string): wert is SchriftRolle {
  return ALLE_SCHRIFTROLLEN.some((rolle) => rolle === wert)
}

function istGanzzahl(wert: unknown): wert is number {
  return typeof wert === 'number' && Number.isFinite(wert) && Number.isInteger(wert)
}

/** Die Fehlerseite der Huelle (Kurzform). */
function abweis(
  code: 'ungueltige_eingabe' | MarkenFehlercode,
  meldung: string,
): { ok: false; fehler: { code: MarkenFehlercode | 'ungueltige_eingabe'; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}
