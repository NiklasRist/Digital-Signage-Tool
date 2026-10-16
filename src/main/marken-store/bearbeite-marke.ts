// [marken-store] bearbeiteMarke(markeId, teilwerte) – Werte setzen oder an den Parent zurückgeben

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke, FarbRolle, SchriftRolle, Schrift, Herkunft } from '../../shared/contracts/marke'
import type { MarkenFehlercode } from './fehlercodes'
import { SICHERHEITSABSTAND_BEREICH } from '../../shared/contracts/konstanten'
import { aendereBestand } from './schreibe-marken'
import { loeseMarkeAuf } from './vererbung'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #21 (M1-09, in M8 ergaenzt): src/shared/contracts/konstanten.ts – DEFINIERENDE QUELLE der
//        Grenzen des Sicherheitsabstands. DIESELBE Konstante prueft der marken-editor (#308);
//        hier NICHT lokal neu definieren und die Zahlen nicht als Literal hinschreiben.
//          export const SICHERHEITSABSTAND_BEREICH = {
//            horizontal: { min: 0, max: 480 },
//            vertikal:   { min: 0, max: 270 },
//          } as const
//        Ebenfalls in dieser Datei, hier aber NICHT verwendet: SICHERHEITSABSTAND_PX
//        = { horizontal: 96, vertikal: 54 } – die Vorbelegung der eingebauten Marke (TK 9.11.4).
//   #277: interface MarkenEintrag { id: string; name: string; parent: string | null
//                                    eingebaut: boolean; farben: Partial<Record<FarbRolle, string>>
//                                    schriften: Partial<Record<SchriftRolle, Schrift>>
//                                    logo?: {...} | null; sicherheit?: {...}; radien?: {...}
//                                    schatten?: {...}; slogan?: {...} }
//          aendereBestand<T>(
//            aenderung: (bestand: MarkenEintrag[]) =>
//              Ergebnis<{ bestand: MarkenEintrag[]; wert: T }, MarkenFehlercode>,
//            schreibart: 'sofort' | 'entprellt',
//          ): Promise<Ergebnis<T, MarkenFehlercode>>
//   #279: loeseMarkeAuf(eintrag: MarkenEintrag, bestand: MarkenEintrag[]): Ergebnis<Marke, MarkenFehlercode>
//   #276: type MarkenFehlercode =
//            'marke_referenziert' | 'marke_eingebaut' | 'marke_nicht_gefunden'
//            | 'marken_datei_fehlt' | 'speicher_fehler'

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

  const schluesselVonFarben = Object.keys(teilwerte.farben ?? {}) as FarbRolle[]
  for (const rolle of schluesselVonFarben) {
    // KEIN Hex-Format hier (User-Entscheid 06.10.2026, Muster #339): Der Fachwert ist
    // ein freier String; ein Format-Maßstab wuerde eine zweite Formatquelle neben der
    // Zeichenschicht erzeugen. Nur die Sentinel-Form ist strukturiert und geprueft.
    if (!ALLE_FARBROLLEN.includes(rolle)) {
      return abweis(
        'ungueltige_eingabe',
        `bearbeiteMarke: '${String(rolle)}' ist keine bekannte Farb-Rolle.`,
      )
    }
  }
  const schluesselVonSchriften = Object.keys(teilwerte.schriften ?? {}) as SchriftRolle[]
  for (const rolle of schluesselVonSchriften) {
    if (!ALLE_SCHRIFTROLLEN.includes(rolle)) {
      return abweis(
        'ungueltige_eingabe',
        `bearbeiteMarke: '${String(rolle)}' ist keine bekannte Schrift-Rolle.`,
      )
    }
    const wert = (teilwerte.schriften as Record<string, unknown>)[rolle]
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
      const achsen = teilwerte.sicherheit as { horizontal?: unknown; vertikal?: unknown }
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
      // SAFETY: istGanzzahl hat beide Achsen davor geprueft; die Casts machen die
      // Zahlen dem Typcheck sichtbar. KEINE System-Verunglimpfung.
      const horizontal = achsen.horizontal as number
      const vertikal = achsen.vertikal as number
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
        const wert = (teilwerte as Record<string, unknown>)[feld]
        const rolausdrueck = feld === 'farben' || feld === 'schriften'
          ? Object.values((wert as Record<string, unknown> | undefined) ?? {})
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
        if (istSentinel(wert)) {
          delete eintrag.farben[schluessel as FarbRolle]
        } else {
          eintrag.farben[schluessel as FarbRolle] = wert as string
        }
      }
    }
    if (teilwerte.schriften !== undefined) {
      for (const [schluessel, wert] of Object.entries(teilwerte.schriften)) {
        if (istSentinel(wert)) {
          delete eintrag.schriften[schluessel as SchriftRolle]
        } else {
          eintrag.schriften[schluessel as SchriftRolle] = wert as Schrift
        }
      }
    }
    for (const feld of ['logo', 'sicherheit', 'radien', 'schatten', 'slogan'] as const) {
      const wert = teilwerte[feld]
      if (wert === undefined) continue
      if (istSentinel(wert)) {
        delete eintrag[feld]
      } else {
        ;(eintrag as unknown as Record<string, unknown>)[feld] = structuredClone(wert)
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
function istSentinel(wert: unknown): boolean {
  return (
    typeof wert === 'object' && wert !== null && !Array.isArray(wert) && 'geerbt' in wert &&
    (wert as { geerbt?: unknown }).geerbt === true &&
    Object.keys(wert).length === 1
  )
}

/** Die Fachform einer Schrift-Rollen-Wertes (familie/gewicht/datei/herkunft). */
function istFachwertSchrift(wert: unknown): boolean {
  if (typeof wert !== 'object' || wert === null || Array.isArray(wert)) return false
  const schrift = wert as { familie?: unknown; gewicht?: unknown; datei?: unknown; herkunft?: unknown }
  return (
    typeof schrift.familie === 'string' &&
    typeof schrift.gewicht === 'number' &&
    typeof schrift.datei === 'string' &&
    (schrift.herkunft === 'gebuendelt' || schrift.herkunft === 'importiert')
  )
}

/** Wahre endliche Ganzzahl - kein Zurechtbiegen (kein Runden). */
function istGanzzahl(wert: unknown): boolean {
  return typeof wert === 'number' && Number.isFinite(wert) && Number.isInteger(wert)
}

/** Die Fehlerseite der Huelle (Kurzform). */
function abweis(
  code: 'ungueltige_eingabe' | MarkenFehlercode,
  meldung: string,
): { ok: false; fehler: { code: MarkenFehlercode | 'ungueltige_eingabe'; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}
