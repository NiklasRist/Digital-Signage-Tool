// GENERIERT aus dem Signaturblock von Issue #289.
// [marken-store] importiereMarkenDatei / entferneMarkenDatei
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
// GERUEST-PRUEFSUMME: f2f023a74faa7959

import fs from 'node:fs/promises'
import path from 'node:path'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke, SchriftRolle, Schrift } from '../../shared/contracts/marke'
import type { MarkenFehlercode } from './fehlercodes'
import { FORMAT_WHITELIST } from '../../shared/contracts/asset'
import { ladeBestand } from './schreibe-marken'
import type { MarkenTeilwerte } from './bearbeite-marke'
import { bearbeiteMarke } from './bearbeite-marke'
import { markenOrdner, loeseMarkenDateiPfad } from './pfade'
import { eingebauteMarke } from './anfangsbestand'
import { loeseMarkeAuf } from './vererbung'
import { leseRohMetadaten } from '../media-service/ffprobe'
import { werteMetadatenAus } from '../media-service/metadaten'
import { istCode, text } from '../gemeinsam/systemfehler'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #13:   export const FORMAT_WHITELIST = {
//            video: ['mp4'] as const,
//            bild: ['jpg', 'jpeg', 'png', 'webp'] as const,
//          } as const                                    // src/shared/contracts/asset.ts
//   #277: ladeBestand(): Promise<Ergebnis<MarkenEintrag[], MarkenFehlercode>>
//   #285: bearbeiteMarke(markeId: string, teilwerte: MarkenTeilwerte): Promise<Ergebnis<Marke, MarkenFehlercode>>
//          // MarkenTeilwerte.logo: MarkenFeld<{datei,herkunft,seitenverhaeltnis} | null>
//          // MarkenTeilwerte.schriften: Partial<Record<SchriftRolle, MarkenFeld<Schrift>>>
//          // MarkenFeld<T> = T | { geerbt: true }
//   #288: markenOrdner(markeId: string): string
//          loeseMarkenDateiPfad(markeId: string, dateiname: string): Ergebnis<string, MarkenFehlercode>
//   #280: eingebauteMarke(): MarkenEintrag   // liefert die GEBÜNDELTEN Standardwerte (vier
//          // OFL-Schriften, Fitnessworld24-Logo), aus denen der gebündelte Rückfall entnommen wird
//   #276: type MarkenFehlercode =
//            'marke_referenziert' | 'marke_eingebaut' | 'marke_nicht_gefunden'
//            | 'marken_datei_fehlt' | 'speicher_fehler'

/** Nur .woff2 – "ein Ladepfad statt zwei" (TK 9.15.3). Modul-lokal: KEINE Bild-/Video-Endung, also
 *  keine Erweiterung von FORMAT_WHITELIST (#13), die ausschließlich Projekt-Assets beschreibt. */
export const MARKEN_SCHRIFT_ENDUNG = 'woff2'

export async function importiereMarkenDatei(
  markeId: string,
  art: 'logo' | 'schrift',
  schriftRolle: SchriftRolle | null,
  quellPfad: string,
): Promise<Ergebnis<Marke, MarkenFehlercode>> {
  // SCHRITT 1 (TK 9.1.1 Punkt 6): Form und Parameterbeziehung - ohne jede Wirkung.
  const form = await pruefeForm(markeId, art, schriftRolle)
  if (form !== null) {
    return form
  }
  // form is null only when described; TS narrowing done below.

  // SCHRITT 2: Whitelist der ART (Ablauf; erzwungene Formate aus FORMAT_WHITELIST bzw.
  // der woff2-Regel - keine zweite Liste).
  const erlaubteEndungen: readonly string[] =
    art === 'logo' ? FORMAT_WHITELIST.bild : [MARKEN_SCHRIFT_ENDUNG]
  const endung = endungVon(quellPfad)
  if (!erlaubteEndungen.includes(endung)) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: `importiereMarkenDatei: Die Endung '.${endung}' ist nicht erlaubt (erlaubt: ${erlaubteEndungen.map((e) => `.${e}`).join(', ')}). Nichts wurde kopiert.`,
      },
    }
  }

  // SCHRITT 3: Zielmarke mu im Bestand stehen (BEVOR der Kopiervorgang laeuft).
  const bestand = await ladeBestand()
  if (!bestand.ok) {
    return bestand
  }
  const eintrag = bestand.wert.find((kandidat) => kandidat.id === markeId)
  if (eintrag === undefined) {
    return {
      ok: false,
      fehler: {
        code: 'marke_nicht_gefunden',
        meldung: `importiereMarkenDatei: Es steht keine Marke mit der Kennung '${markeId}' im Bestand. Nichts wurde kopiert.`,
      },
    }
  }

  // SCHRITT 4: die Quelldatei IST möglich zu lesen (fehlt oder Rechte -> speicher_fehler,
  // kein Änderungsversuch).
  try {
    await fs.readFile(quellPfad)
  } catch (ursache) {
    return {
      ok: false,
      fehler: {
        code: 'speicher_fehler',
        meldung: `importiereMarkenDatei: Die Quelldatei ist nicht lesbar (${text(ursache)}).`,
      },
    }
  }

  // SCHRITT 5: ZIELNAME rollenbasiert (User-Entscheid 06.10.2026, Variante 1)
  // - deterministisch: "<rolle>.woff2" fuer die Rolle, "logo.<endung>" fuer das Logo.
  // Erneuter Import fuer dieselbe Rolle ERSETZT; vorher wird die ALTE Fassung
  // (auch eine ANDERE Bild-Endung) entfernt - Waisen sind dann unmöglich.
  const zielname =
    art === 'logo' ? `logo.${endung}` : `${String(schriftRolle)}.${MARKEN_SCHRIFT_ENDUNG}`
  const aufloesung = loeseMarkenDateiPfad(markeId, zielname)
  if (!aufloesung.ok) {
    return aufloesung
  }
  const zielPfad = aufloesung.wert
  try {
    await fs.mkdir(markenOrdner(markeId), { recursive: true })
  } catch (ursache) {
    return {
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: `importiereMarkenDatei: Der Marken-Ordner ist nicht anlegbar: ${text(ursache)}` },
    }
  }
  if (art === 'logo') {
    for (const altersendung of FORMAT_WHITELIST.bild) {
      if (altersendung === endung) continue
      await fs.unlink(path.join(markenOrdner(markeId), `logo.${altersendung}`)).catch(() => undefined)
    }
  }
  try {
    await fs.copyFile(quellPfad, zielPfad)
  } catch (ursache) {
    return {
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: `importiereMarkenDatei: Das Kopieren scheiterte - die Quelldatei bleibt unberuehrt (${text(ursache)}).` },
    }
  }

  // SCHRITT 6 (nur Logo): seitenverhaeltnis via ffprobe AUF DIE KOPIERTE DATEI
  // (User-Entscheid 06.10.2026; derselbe Weg wie der media-service, TK 9.4.5).
  let seitenverhaeltnis: number | null = null
  if (art === 'logo') {
    const roh = await leseRohMetadaten(zielPfad)
    if (!roh.ok) {
      // Die kopierte Datei ist nicht auswertbar: best effort Rueckbau (beliebig),
      // marken.json bleibt UNBERUEHRT.
      await fs.unlink(zielPfad).catch(() => undefined)
      return {
        ok: false,
        fehler: { code: 'speicher_fehler', meldung: `importiereMarkenDatei: Das kopierte Logo ist nicht auswertbar - es wurde zurueckgebaut.` },
      }
    }
    const metadaten = werteMetadatenAus(roh.wert, 'bild')
    if (!metadaten.ok) {
      await fs.unlink(zielPfad).catch(() => undefined)
      return {
        ok: false,
        fehler: { code: 'speicher_fehler', meldung: `importiereMarkenDatei: Das kopierte Logo liefert keine BildMasze - es wurde zurueckgebaut.` },
      }
    }
        const massen = metadaten.wert["maße"] as { breite: number; "höhe": number }
    const hohe = massen["höhe"]
    seitenverhaeltnis = hohe === 0 ? 1 : massen["breite"] / hohe
  }

  // SCHRITT 7 die Marke über bearbeiteMarke anpassen. Bei einem SCHEITERN NACH dem
  // Kopieren: die kopierte Datei best effort entfernen (Rest-Risiko bei einem Absturz
  // GENAU DAZWISCHEN bleibt - verboten ist nur der Rollback bei Absturz, Text).
  // SCHRIFT: familie = Originalname ohne Endung, gewicht 400 (lokal festgelegt,
  // dokumentiert im Nachtrag); LOGO: die Datei-REFERENZ mit 'importiert'.
  const teilzeile: MarkenTeilwerte =
    art === 'logo'
      ? ({
          logo: { datei: zielname.split(path.sep).pop() ?? zielname, herkunft: 'importiert', seitenverhaeltnis: seitenverhaeltnis ?? 1 },
        } as unknown as MarkenTeilwerte)
      : ({
          schriften: {
            [schriftRolle as SchriftRolle]: {
              familie: basenameOhneEndung(quellPfad),
              gewicht: 400,
              datei: zielname.split(path.sep).pop() ?? zielname,
              herkunft: 'importiert',
            } satisfies Schrift,
          },
        } as unknown as MarkenTeilwerte)

  const geaendert = await bearbeiteMarke(markeId, teilzeile)
  if (!geaendert.ok) {
    await fs.unlink(zielPfad).catch(() => undefined)
    return geaendert
  }
  return geaendert
}
// - art === 'schrift'  => schriftRolle ist PFLICHT (eine der 4 SchriftRolle-Werte)
// - art === 'logo'     => schriftRolle MUSS null sein
// - kopiert quellPfad in einen NEUEN, mit dieser Version noch NICHT entschiedenen Zieldateinamen
//   innerhalb von markenOrdner(markeId) (s. STOPP-Block) und aktualisiert die Marke über
//   bearbeiteMarke mit herkunft: 'importiert'

export async function entferneMarkenDatei(
  markeId: string,
  art: 'logo' | 'schrift',
  schriftRolle: SchriftRolle | null,
): Promise<Ergebnis<Marke, MarkenFehlercode>> {
  // SCHRITT 1: Form (wie beim Import).
  const form = await pruefeForm(markeId, art, schriftRolle)
  if (form !== null) {
    return form
  }

  // SCHRITT 2: die Marke leseN - muss im Bestand stehen.
  const bestand = await ladeBestand()
  if (!bestand.ok) {
    return bestand
  }
  const eintrag = bestand.wert.find((kandidat) => kandidat.id === markeId)
  if (eintrag === undefined) {
    return {
      ok: false,
      fehler: {
        code: 'marke_nicht_gefunden',
        meldung: `entferneMarkenDatei: Es steht keine Marke mit der Kennung '${markeId}' im Bestand.`,
      },
    }
  }

  // SCHRITT 3: ist ueberhaupt eine IMPORTIERTE Datei gesetzt? Wenn nicht, ist das
  // Entfernen von "nichts" KEIN Fehler - die Marke bleibt, wie sie ist.
  if (art === 'schrift') {
    if (eintrag.schriften[schriftRolle as SchriftRolle] === undefined) {
      return loeseMarkeAuf(eintrag, bestand.wert)   // unveraenderte, aufgeloeste Marke
    }
  } else if (eintrag.logo === undefined) {
    return loeseMarkeAuf(eintrag, bestand.wert)   // unveraenderte, aufgeloeste Marke
  }

  // SCHRITT 4: die PHYSISCHE Datei entfernen (falls vorhanden; fehlt sie bereits, wird
  // das Feld TROTZDEM zurückgesetzt - Reparatur, kein Blockieren).
  const zielDateien =
    art === 'logo'
      ? FORMAT_WHITELIST.bild.map((e) => `logo.${e}`)
      : [`${String(schriftRolle)}.${MARKEN_SCHRIFT_ENDUNG}`]
  for (const zielDatei of zielDateien) {
    const pfad = path.join(markenOrdner(markeId), zielDatei)
    try {
      await fs.unlink(pfad)
    } catch (ursache) {
      if (istCode(ursache, 'EPERM', 'EBUSY')) {
        // Dichter Ausfall unter Windows entfernt das Datei-Handle: marken.json wird
        // NICHT geaendern (beide Werte werte wuessten sonst um iets Gescheh).
        return {
          ok: false,
          fehler: { code: 'speicher_fehler', meldung: `entferneMarkenDatei: Die Datei laesst sich nicht entfernen (${text(ursache)}) - nothing geaendert.` },
        }
      }
      // ENOENT: die Datei fehlt schon - still weitergehen, das Feld wird trotzdem zurückgesetzt.
    }
  }

  // SCHRITT 5: das Feld wird zurueck - SENTINEL bei parent != null, sonst return
  // GEBUENDELT aus eingebauteMarke() (Werte der eingebauten Marke).
  let teilzeile: MarkenTeilwerte
  if (eintrag.parent !== null) {
    teilzeile =
      art === 'logo'
        ? ({ logo: { geerbt: true } } as unknown as MarkenTeilwerte)
        : ({ schriften: { [schriftRolle as SchriftRolle]: { geerbt: true } } } as unknown as MarkenTeilwerte)
  } else {
    const quelle = eingebauteMarke()
    teilzeile =
      art === 'logo'
        ? ({ logo: quelle.logo } as unknown as MarkenTeilwerte)
        : ({
            schriften: { [schriftRolle as SchriftRolle]: quelle.schriften[schriftRolle as SchriftRolle] },
          } as unknown as MarkenTeilwerte)
  }
  const geaendert = await bearbeiteMarke(markeId, teilzeile)
  return geaendert
}
// - loescht die zuvor importierte Datei aus markenOrdner(markeId) (falls physisch vorhanden)
// - setzt das Feld ueber bearbeiteMarke zurueck: bei parent !== null auf { geerbt: true },
//   sonst (eigenstaendig ODER eingebaut) auf den GEBUENDELTEN Wert aus eingebauteMarke()

// ---------------------------------------------------------------------------
// Intern: Form-Pruefung, Endung, Uebersetzung der Fehler-Huelle.
// ---------------------------------------------------------------------------

const ALLE_SCHRIFTROLLEN: readonly SchriftRolle[] = [
  'headlineElegant', 'headlinePlakativ', 'fliesstext', 'fliesstextFett',
] as const

/**
 * Form- und Parameterbeziehung (TK 9.15.1): art genau einer der einzig zwei Werte;
 * schriftRolle ist bei 'schrift' PFLICHT (eine der vier Rollen) und MUSS bei 'logo'
 * null übergeben werden (ausdrücklich, nicht vergessen) - ein Vergessenes Argument ist nicht betroffen
 * (Pflichtparameter mit | null, wie bei erstelleVorlage-Muster M4-06).
 */
async function pruefeForm(
  markeId: string,
  art: 'logo' | 'schrift',
  schriftRolle: SchriftRolle | null,
): Promise<Ergebnis<Marke, MarkenFehlercode> | null> {
  if (typeof markeId !== 'string' || markeId.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Die markeId ist leer oder kein Text.',
      },
    }
  }
  if (art !== 'logo' && art !== 'schrift') {
    return {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: "'art' ist weder 'logo' noch 'schrift'." },
    }
  }
  if (art === 'logo' && schriftRolle !== null) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: "Bei art: 'logo' muss schriftRolle ausdruecklich null sein (nicht vergessen).",
      },
    }
  }
  if (
    art === 'schrift' &&
    (schriftRolle === null ||
      typeof schriftRolle !== 'string' ||
      !(ALLE_SCHRIFTROLLEN as readonly string[]).includes(schriftRolle))
  ) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: `Bei art: 'schrift' muss schriftRolle eine der bekannten Rollen sein (${ALLE_SCHRIFTROLLEN.join(', ')}).`,
      },
    }
  }
  return null
}

/** Endung relativ zur letzten '.', klein geschrieben. */
function endungVon(pfad: string): string {
  const teile = pfad.split('.')
  return teile.length < 2 ? '' : (teile[teile.length - 1] ?? '').toLowerCase()
}

/** Dateiname ohne letzten Punkt, ohne Endung - herkunft fuersImporter. */
function basenameOhneEndung(pfad: string): string {
  const basis = pfad.split(/[\\/]/).pop() ?? pfad
  const teile = basis.split('.')
  return teile.length < 2 ? basis : (teile.slice(0, -1).join('.') ?? basis)
}
