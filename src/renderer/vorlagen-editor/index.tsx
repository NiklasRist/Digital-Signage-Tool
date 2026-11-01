// Die Modul-Wurzel des Vorlagen-Editors (#251 / M7-60).
//
// Anordnung (TK 9.14.1 / 9.12.2): Ansicht 'uebersicht' (nutzbare Vorlagen,
// verwaiste Arbeitskopien, Neu anlegen, Bearbeiten/Fortsetzen/Löschen) und
// 'editor' (Zonen-Canvas links; rechts Live-Vorschau, Zonen-Liste, Inspektor,
// Befunde; Kopfzeile Arbeitskopie + die drei Speicherwege samt Nutzungs-Hinweis
// aus #254).
//
// Die ENTSCHEIDENEN Regeln (verbindlich; Details in vorlagen-montage.ts):
//  - Ansicht ABGELEITET von p.sitzung.holeSitzung(); kein zweiter Halter, kein
//    eigener Schnappschuss-Stapel (Zurückspielen ist #236).
//  - EINE Geste = EIN Schnappschuss: während Ziehen/Bemassen läuft der Stand
//    lokal; uebernimmAenderung und sichereStand laufen GENAU EINMAL beim
//    Loslassen. Reihenfolge: uebernimmAenderung -> sichereStand ->
//    uebernimmSpeicherstand (keine zweite Entprellung, kein setTimeout).
//  - Öffnen über #155 ist KEINE Bearbeitung: nur uebernimmSpeicherstand.
//  - Sperren (`istSpeicherbar === false`) deaktivieren überarbeiten/als-neu,
//    NIEMALS verwerfen. Warnungen blockieren nie.
//  - 'als neue Vorlage' mit Pflicht-Eingabe; eine leere Eingabe ruft NICHTS
//    (offene Frage aus dem Issue: keine Vorbelegung, keine Namensregeln).
//  - Vorschau NUR über zeichneVorschau (#150), erst nach der Vorbereitung.
//    #393 (01.11.2026): Gezeichnet wird mit einer ECHTEN Aktion aus `projekt.aktionen`
//    (Auswahlfeld „Vorschau mit Aktion"); BEISPIEL_AKTION ist nur noch der Rueckfall,
//    wenn das Projekt keine Aktion hat. Damit ist die alte Luecke "echte Aktion ohne
//    Projektzugang" geschlossen - der Editor bekommt dafuer einen LESENDEN Projektzugang.
//    Die Motive der gewaehlten Aktion laedt bereiteVorschauVor (#150); ohne sie zeigte
//    eine Aktion mit Bild eine leere Bildzone.
//  - p.zeichnen wird NICHT benutzt (ENTSCHIEDEN 10; gemeldet).
//  - Nutzung: gefragt wird nach der parentId, GENAU EINMAL je Sitzung
//    (giltFuer spart die zweite Abfrage); der Hinweis blockiert NICHTS.
//  - KEIN IPC, kein KANAELE, kein Timer, kein zeichneSegment, kein
//    sitzungshalter()-Aufruf (der Halter kommt als Eigenschaft).

import { useEffect, useState, type JSX } from 'react'
import type { Vorlage, Zone } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import type { VorlagenZugang, ZeichenZugang, MarkenZugang, ProjektZugang } from '../app-shell/sichten'
import type { Sitzungshalter } from '../app-shell/undo-aufzeichnung-vorlage'
import { stelleMarkeBereit, holeBereiteMarke } from '../gemeinsam/marken-bereitstellung'
import { zonenText } from '../gemeinsam/zonen-texte'
import { stelleSchriftenBereit } from '../template-canvas/schriften'

import { GRUND_PARENT_EINGEBAUT, sichereStand, type EditorSitzung } from './arbeitskopie'
import {
  bemasseZone,
  flaecheDerVorlage,
  sammleEinrastlinien,
  sicherheitsBox,
  verschiebeZone,
  type Griff,
} from './zonen-canvas'
import { baueZonenListe, ordneZonenNeu } from './zonen-liste'
import { setzeRahmenWert } from './inspektor'
import { fuegeZoneHinzu, type ZonenWunsch } from './zone-hinzufuegen'
import { istSpeicherbar, pruefeVorlage, type Befund } from './pruefungen'
import { alsNeueVorlage, ueberarbeiteVorlage, verwerfeBearbeitung } from './speichern'
import {
  BEISPIEL_AKTION,
  bereiteVorschauVor,
  waehleVorschauAktion,
  zeichneVorschau,
  type VorschauFeld,
} from './editor-vorschau'
import {
  ANLEGBARE_FLAECHEN,
  bearbeiteVorlage,
  beendeLoeschbestaetigung,
  entferneVorlage,
  holeLoeschNutzung,
  legeVorlageAn,
  setzeBearbeitungFort,
  starteLoeschbestaetigung,
} from './vorlagen-uebersicht'
import {
  ansichtFuer,
  beendeGeste,
  beginneGeste,
  fuehreGesteFort,
  KEINE_GESTE,
  mitArbeitskopie,
  mitZone,
  mitZonen,
  schalteVorschauFeld,
  sichtbarerStand,
  type Geste,
} from './vorlagen-montage'
import {
  baueNutzungsAnzeige,
  beginneLaden,
  giltFuer,
  holeNutzung,
  LEERER_NUTZUNGSSTAND,
  uebernimmFehler,
  uebernimmNutzung,
  type Nutzungsstand,
} from './nutzung-anzeigen'
import { NutzungAnzeige } from './nutzung-anzeigen.tsx'

/** ZEICHENGLEICH aus #244 übernommen (FASSUNG mit dem Nachzug 08.10.2026: `marken`). */
export interface VorlagenEditorWurzelProps {
  sichtbar: boolean
  vorlagen: VorlagenZugang
  zeichnen: ZeichenZugang
  /** Die AUSWAHLLISTE „Vorschau gegen Marke" (Variante (b), User-Entscheidung NACHTRAG 08.10.
   *  in #313): Liste NUR fuer die Wahl – gezeichnet wird ueber stelleMarkeBereit/holeBereiteMarke
   *  (#312). Default: die Marke mit `eingebaut: true`. */
  marken: MarkenZugang
  /**
   * #393 (01.11.2026): der LESENDE Projektzugang - die Live-Vorschau zeichnet mit einer
   * Aktion aus `projekt.aktionen`, nicht mehr mit der festen BEISPIEL_AKTION.
   * ABLOESUNG, offen benannt: die fruehere Festlegung „KEIN Projektzugang" gilt nicht
   * mehr; der Auftraggeber hat am 01.11.2026 die Aktionen-Auswahl entschieden.
   * Hier wird NICHTS geschrieben (kein `setzeProjekt`, kein `setzeListe`).
   */
  projekt: ProjektZugang
  /** Der Sitzungshalter der Shell (#245) – er haelt die Arbeitskopie ueber den Reiterwechsel. */
  sitzung: Sitzungshalter
}

export function VorlagenEditorWurzel(p: VorlagenEditorWurzelProps): JSX.Element {
  if (!p.sichtbar) {
    // Abbau verboten (TK 9.14.2): unsichtbar, aber gemountet.
    return <div data-testid="vorlagen-inaktiv" style={{ display: 'none' }} />
  }
  return <VorlagenInterna {...p} />
}

function VorlagenInterna(p: VorlagenEditorWurzelProps): JSX.Element {
  const [, setzeTakt] = useState(0)

  useEffect(() => {
    if (p.vorlagen.hole() === null) {
      void p.vorlagen.lade()
    }
    const abmeldenVor = p.vorlagen.aufGeaendert(() => setzeTakt((t) => t + 1))
    const abmeldeSitzung = p.sitzung.aufSitzungGeaendert(() => setzeTakt((t) => t + 1))
    // #393: Die Aktionen-Auswahl haengt am PROJEKT - aendert es sich (Import, Anlegen,
    // Bearbeiten in einem anderen Reiter), muss die Liste hier nachziehen.
    const abmeldeProjekt = p.projekt.aufGeaendert(() => setzeTakt((t) => t + 1))
    return () => {
      abmeldenVor()
      abmeldeSitzung()
      abmeldeProjekt()
    }
  }, [])

  if (ansichtFuer(p.sitzung.holeSitzung()) === 'uebersicht') {
    return <VorlagenUebersicht p={p} />
  }
  return <VorlagenEditor p={p} />
}

// ============================================================
// die Übersicht
// ============================================================

function VorlagenUebersicht({ p }: { p: VorlagenEditorWurzelProps }): JSX.Element {
  const ue = p.vorlagen.hole()
  const [anlegenFlaecheIndex, setzeAnlegenFlaecheIndex] = useState<number | null>(null)
  const [anlegeName, setzeAnlegeName] = useState('')
  const [bestaetigerId, setzeBestaetigerId] = useState<string | null>(null)
  const [loeschStand, setzeLoeschStand] = useState<Nutzungsstand>(LEERER_NUTZUNGSSTAND)

  return (
    <div data-testid="vorlagen-uebersicht" style={{ gap: 8, padding: 8, display: 'flex', flexDirection: 'column' }}>
      <h2>Vorlagen</h2>
      {ue === null && <div>Noch nicht geladen …</div>}
      {(ue?.nutzbare ?? []).map((eintrag) => (
        <div key={eintrag.vorlage.id} data-testid={`vorlage-${eintrag.vorlage.id}`} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ flex: 1 }}>
            {eintrag.vorlage.name}
            {eintrag.eingebaut ? ' (eingebaut)' : ''}
            {eintrag.arbeitskopieId !== null ? ' – Arbeitskopie läuft' : ''}
          </span>
          <button
            type="button"
            data-testid={`vorlage-bearbeiten-${eintrag.vorlage.id}`}
            onClick={() => {
              void bearbeiteVorlage(eintrag.vorlage.id).then((antwort) => {
                if (antwort.ok) p.sitzung.uebernimmSpeicherstand(antwort.wert)
                else console.warn('[vorlagen-editor] bearbeiteVorlage lehnt ab:', antwort.fehler.code)
              })
            }}
          >
            Bearbeiten
          </button>
          {eintrag.arbeitskopieId !== null && (
            <button
              type="button"
              data-testid={`vorlage-fortsetzen-${eintrag.vorlage.id}`}
              onClick={() => {
                // setzeBearbeitungFort liest nur `parent` (#155); der Parameter verlangt
                // genau dieses Feld - kein Cast, kein vorgetaeuschter Datensatz.
                void setzeBearbeitungFort({ parent: eintrag.vorlage.id }).then((antwort) => {
                  if (antwort.ok) p.sitzung.uebernimmSpeicherstand(antwort.wert)
                  else console.warn('[vorlagen-editor] setzeBearbeitungFort lehnt ab:', antwort.fehler.code)
                })
              }}
            >
              Fortsetzen
            </button>
          )}
          {eintrag.loeschbar && (
            <button
              type="button"
              data-testid={`vorlage-loeschen-${eintrag.vorlage.id}`}
              onClick={() => {
                void starteLoeschbestaetigung(eintrag.vorlage.id).then(() => {
                  setzeBestaetigerId(eintrag.vorlage.id)
                  setzeLoeschStand(holeLoeschNutzung())
                })
              }}
            >
              Löschen
            </button>
          )}
        </div>
      ))}

      {bestaetigerId !== null && (
        <div data-testid="dialog-vorlage-loeschen" style={{ border: '1px solid #444', padding: 6 }}>
          <NutzungAnzeige
            stand={loeschStand}
            anzeige={loeschStand.zustand === 'geladen' && loeschStand.nutzung !== null ? baueNutzungsAnzeige(loeschStand.nutzung) : null}
            aufgeklappt={false}
            aufUmschalten={() => undefined}
            aufErneutLaden={() => {
              void starteLoeschbestaetigung(bestaetigerId).then(() => {
                setzeLoeschStand(holeLoeschNutzung())
              })
            }}
          />
          {/* Der Nutzungs-Hinweis blockiert NICHTS (ENTSCHIEDEN 9a) - der
              Confirmationsknopf baut auf entferneVorlage, nicht auf dem Stand. */}
          <button
            type="button"
            data-testid="loesch-bestaetigen"
            onClick={() => {
              void entferneVorlage(bestaetigerId).then((antwort) => {
                beendeLoeschbestaetigung()
                setzeBestaetigerId(null)
                if (!antwort.ok) {
                  console.warn('[vorlagen-editor] entferneVorlage lehnt ab:', antwort.fehler.code)
                }
                void p.vorlagen.lade()
              })
            }}
          >
            Endgültig löschen
          </button>
          <button
            type="button"
            data-testid="loesch-abbrechen"
            onClick={() => {
              beendeLoeschbestaetigung()
              setzeBestaetigerId(null)
            }}
          >
            Abbrechen
          </button>
        </div>
      )}

      {(ue?.verwaisteArbeitskopien ?? []).length > 0 && (
        <div data-testid="vorlagen-verwaist">
          <h3>Verwaiste Arbeitskopien</h3>
          <ul>
            {(ue?.verwaisteArbeitskopien ?? []).map((v) => (
              <li key={v.id}>{v.name}</li>
            ))}
          </ul>
        </div>
      )}

      <hr />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {ANLEGBARE_FLAECHEN.map((flaeche, index) => (
          <button
            type="button"
            key={index}
            data-testid={`vorlagen-neu-${flaeche.höhe === null ? 'ganzbild' : 'band'}`}
            onClick={() => setzeAnlegenFlaecheIndex(index)}
          >
            Neu: {flaeche.bezeichnung}
          </button>
        ))}
      </div>
      {anlegenFlaecheIndex !== null && ANLEGBARE_FLAECHEN[anlegenFlaecheIndex] !== undefined && (
        <div data-testid="dialog-vorlage-anlegen">
          <label>
            Name{' '}
            <input
              type="text"
              value={anlegeName}
              data-testid="vorlage-name"
              onChange={(e) => setzeAnlegeName(e.target.value)}
            />
          </label>
          <button
            type="button"
            data-testid="vorlage-anlegen-bestaetigen"
            onClick={() => {
              const flaeche = ANLEGBARE_FLAECHEN[anlegenFlaecheIndex]
              if (flaeche === undefined || anlegeName.trim().length === 0) {
                return
              }
              void legeVorlageAn(flaeche.höhe, anlegeName).then((antwort) => {
                if (antwort.ok) {
                  p.sitzung.uebernimmSpeicherstand(antwort.wert)
                  setzeAnlegenFlaecheIndex(null)
                  setzeAnlegeName('')
                } else {
                  console.warn('[vorlagen-editor] legeVorlageAn lehnt ab:', antwort.fehler.code)
                }
              })
            }}
          >
            Anlegen
          </button>
          <button type="button" onClick={() => setzeAnlegenFlaecheIndex(null)}>
            Abbrechen
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================
// der Editor
// ============================================================

const VORSCHAU_FELDER: readonly { feld: VorschauFeld; beschriftung: string }[] = [
  { feld: 'titel', beschriftung: 'Titel leer' },
  { feld: 'beschreibung', beschriftung: 'Beschreibung leer' },
  { feld: 'preis', beschriftung: 'Preis leer' },
  { feld: 'cta', beschriftung: 'CTA leer' },
  { feld: 'bild', beschriftung: 'Bild leer' },
]

function VorlagenEditor({ p }: { p: VorlagenEditorWurzelProps }): JSX.Element {
  const sitzung = p.sitzung.holeSitzung()

  // ALLE Hooks VOR jedem Rueckgehweg: Die Hook-Anzahl darf nicht davon abhaengen,
  // ob gerade eine Sitzung offen ist (Hook-Ordnungs-Verstoß, s. Issue #409).

  const [geste, setzeGeste] = useState<Geste>(KEINE_GESTE)
  const [gewaehlt, setzeGewaehlt] = useState<string | null>(null)
  const [geleert, setzeGeleert] = useState<ReadonlySet<VorschauFeld>>(new Set())
  const [vorbereitet, setzeVorbereitet] = useState(false)
  const [nutzungsStand, setzeNutzungsStand] = useState<Nutzungsstand>(LEERER_NUTZUNGSSTAND)
  const [aufgeklappt, setzeAufgeklappt] = useState(false)
  const [neuerName, setzeNeuerName] = useState('')
  // Die „Vorschau gegen Marke"-Auswahl (Variante (b), Nachtrag 08.10. in #313): die
  // Liste kommt aus dem Marken-Zugang (#305); gemerkt wird NUR die Kennung - die
  // aufgeloeste Marke wohnt EXCLUSIV im Bestand von #312 (kein Zwischenspeicher hier).
  const [vorschauMarkeId, setzeVorschauMarkeId] = useState<string | null>(null)
  // #393: die Aktion, MIT der gezeichnet wird. Gemerkt wird nur die Kennung - die
  // Aufloesung macht `waehleVorschauAktion` (gewaehlt -> erste -> BEISPIEL_AKTION).
  const [vorschauAktionId, setzeVorschauAktionId] = useState<string | null>(null)
  const markenListe = p.marken.hole()?.marken ?? []
  const vorschauProjekt = p.projekt.hole().projekt
  const vorschauAktion = waehleVorschauAktion(vorschauProjekt?.aktionen ?? [], vorschauAktionId)
  const [, setzeTakt] = useState(0)

  // #409: Der Nutzungs-Hinweis laedt GENAU EINMAL je Sitzung - als Effect, der
  // auf die PARENT-ID gehoert (nicht auf die arbeitsId - Referenzen zeigen auf
  // die nutzbare Vorlage).

  const parentId = sitzung?.parentId ?? null
  useEffect(() => {
    // Der alte Rendersatz (`beginneLaden(...)` je Durchlauf im BODY) konvergierte nie:
    // beginneLaden liefert zustand 'laedt', giltFuer verlangt 'geladen' - jede
    // Renderphase setzte erneut (React #301, ganzer Baum weg). Der Effect-Griff
    // behaelt die einmalige Frage: giltFuer auf dem BESTAND verhindert die zweite.
    if (parentId === null) return
    let abgebrochen = false
    setzeNutzungsStand((bisher) =>
      giltFuer(bisher, parentId) ? bisher : beginneLaden(bisher, parentId),
    )
    void holeNutzung(parentId).then((antwort) => {
      if (abgebrochen) return
      setzeNutzungsStand((bisher) =>
        antwort.ok
          ? uebernimmNutzung(bisher, parentId, antwort.wert)
          : uebernimmFehler(bisher, parentId, antwort.fehler.code, antwort.fehler.meldung),
      )
    })
    return () => {
      abgebrochen = true
    }
  }, [parentId])

  // Die Vorbereitung der Vorschau - jetzt JE STAND, nicht nur einmal je Auftritt:
  // #393 hat zwei Eingaenge beweglich gemacht (Marke, Aktion). Vorher hing der Effekt
  // allein an `arbeitsId`; die Wahl einer anderen Marke setzte `vorbereitet` auf false
  // und die Vorschau blieb fuer immer leer (Fehler, der nur am Fenster sichtbar war).
  // Die Marke: die gewählte der Auswahl, Default die EINGEBAUTE (Variante (b)).
  // Reihenfolge (TK 9.10.3): die VIER gebündelten Schriften (#110), DANN die Marke
  // samt importierter Schriften + Logo über #312, DANN die Motive der Aktion (#150).
  // Erst wenn alles ok ist, wird gezeichnet.
  useEffect(() => {
    let abgebrochen = false
    const gewaehlteId =
      vorschauMarkeId ??
      (markenListe.find((m) => m.eingebaut) ?? markenListe[0])?.id ??
      null
    if (gewaehlteId === null) return
    void (async () => {
      try {
        await stelleSchriftenBereit()
      } catch {
        return
      }
      const antwort = await stelleMarkeBereit(gewaehlteId)
      if (abgebrochen || !antwort.ok) return
      const marke = holeBereiteMarke(gewaehlteId)
      if (marke === null) return
      try {
        // #393: die Motive der GEWAEHLTEN Aktion. Ohne Projekt entfallen sie -
        // `media://` loest nur innerhalb eines Projekt-Medienordners auf.
        await bereiteVorschauVor(
          vorschauProjekt?.id ?? null,
          [vorschauAktion],
          vorschauProjekt?.assets ?? [],
          marke,
        )
      } catch {
        return
      }
      if (abgebrochen) return
      setzeVorschauMarkeId(gewaehlteId)
      setzeVorbereitet(true)
      setzeTakt((t) => t + 1)
    })()
    return () => {
      abgebrochen = true
    }
  }, [sitzung?.arbeitsId ?? null, vorschauMarkeId, vorschauAktion, vorschauProjekt])

  // Der Rueckweg NACH allen Hooks - nur noch Anzeige, keine Zustands-Arbeit.
  if (sitzung === null) {
    return <div data-testid="vorlagen-editor-lade" />
  }

  const stand = sichtbarerStand(sitzung, geste)
  // Ohne Stand gibt es nichts zu zeigen - dieselbe Ladeflaeche wie ohne Sitzung.
  if (stand === null) {
    return <div data-testid="vorlagen-editor-lade" />
  }
  const vorlage = stand
  const befinde: readonly Befund[] = pruefeVorlage(vorlage, sitzung.festeZonenSoll)
  const speicherbar = istSpeicherbar(befinde)
  const flaeche = flaecheDerVorlage(vorlage)
  const box = sicherheitsBox(vorlage)
  const liste = baueZonenListe(vorlage)

  // ---- der verbindliche Ablauf einer Zonen-Änderung (ENTSCHIEDEN 4 / 17) ----
  async function uebernehme(neueArbeitskopie: Vorlage): Promise<void> {
    // SAFETY: Der Rueckweg `if (sitzung === null) return` steht VOR dieser Funktion im
    // selben Rumpf - TS verliert die Verengung im Funktionsrumpf, zur Laufzeit ist
    // `sitzung` hier nie null.
    const neu = mitArbeitskopie(sitzung as EditorSitzung, neueArbeitskopie)
    // 1) Schnappschuss + Übernahme
    p.sitzung.uebernimmAenderung(neu)
    // 2) Auto-Speichern (entprellt im Main; hier keine zweite Entprellung)
    const antwort = await sichereStand(neu, neueArbeitskopie)
    // 3) Der Nachhall NUR bei ok; scheitert es, bleibt die Sitzung auf dem
    //    Stand aus uebernimmAenderung (keine Arbeitsverlust).
    if (antwort.ok) p.sitzung.uebernimmSpeicherstand(antwort.wert)
    else console.warn('[vorlagen-editor] sichereStand lehnt ab:', antwort.fehler.code)
    return undefined
  }

  function gestoeneZone(griff: Griff | null, dx: number, dy: number): void {
    const zonenId = gewaehlt
    if (zonenId === null || vorlage === null) {
      return
    }
    const bezogene = vorlage.zonen.find((z) => z.id === zonenId)
    if (bezogene === undefined || bezogene.rolle !== 'frei') {
      // Kante: feste Zonen sind sichtbar, aber gesperrt (ENTSCHIEDEN 15).
      return
    }
    // Die Geste beginnt/fortsetzt LOKAL; übernommen wird genau beim Loslassen.
    if (geste.laeuft === false && griff === null) {
      setzeGeste(beginneGeste(vorlage))
      return
    }
    const linien = sammleEinrastlinien(vorlage, zonenId)
    const bearbeitet =
      griff === null
        ? verschiebeZone(bezogene, dx, dy, flaeche, linien)
        : bemasseZone(bezogene, griff, dx, dy, flaeche, linien)
    setzeGeste(fuehreGesteFort(geste, mitZone(vorlage, bearbeitet)))
  }

  function loeseGesteLos(): void {
    if (!geste.laeuft) {
      return
    }
    const gesichert = geste.stand
    setzeGeste(beendeGeste(geste))
    if (gesichert !== null) {
      void uebernehme(gesichert)
    }
  }

  return (
    <div data-testid="verwaltung" style={{ gap: 8, padding: 8, display: 'flex', flexDirection: 'column' }}>
      {/* Kopfzeile: Arbeitskopie + drei Speicherwege + Nutzungs-Hinweis */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} data-testid="vorlagen-editor-kopf">
        <span data-testid="arbeitskopie-kopf">
          Arbeitskopie von {sitzung.parentName}
        </span>
        <button
          type="button"
          data-testid="vorlage-uebernehmen"
          disabled={speicherbar === false || sitzung.ueberarbeitenErlaubt === false}
          onClick={() => {
            void ueberarbeiteVorlage(sitzung, vorlage, p.vorlagen.lade).then((antwort) => {
              if (antwort.ok) p.sitzung.beendeSitzung()
              else console.warn('[vorlagen-editor] ueberarbeiteVorlage lehnt ab:', antwort.fehler.code)
            })
          }}
        >
          Vorlage überarbeiten
        </button>
        {sitzung.ueberarbeitenErlaubt === false && (
          <span style={{ color: '#d9a441', fontSize: 11 }} data-testid="ueberarbeiten-grund">
            {sitzung.ueberarbeitenGrund ?? GRUND_PARENT_EINGEBAUT}
          </span>
        )}
        <input
          type="text"
          placeholder="Name der neuen Vorlage"
          value={neuerName}
          data-testid="als-neu-name"
          onChange={(e) => setzeNeuerName(e.target.value)}
        />
        <button
          type="button"
          data-testid="vorlage-als-neu"
          disabled={speicherbar === false || neuerName.trim().length === 0}
          onClick={() => {
            void alsNeueVorlage(sitzung, vorlage, neuerName, p.vorlagen.lade).then((antwort) => {
              if (antwort.ok) p.sitzung.beendeSitzung()
              else console.warn('[vorlagen-editor] alsNeueVorlage lehnt ab:', antwort.fehler.code)
            })
          }}
        >
          Als neue Vorlage
        </button>
        <button
          type="button"
          data-testid="vorlage-verwerfen"
          onClick={() => {
            void verwerfeBearbeitung(sitzung, p.vorlagen.lade).then((antwort) => {
              if (antwort.ok) p.sitzung.beendeSitzung()
              else console.warn('[vorlagen-editor] verwerfeBearbeitung lehnt ab:', antwort.fehler.code)
            })
          }}
        >
          Verwerfen
        </button>
      </div>
      <NutzungAnzeige
        stand={nutzungsStand}
        anzeige={nutzungsStand.zustand === 'geladen' && nutzungsStand.nutzung !== null ? baueNutzungsAnzeige(nutzungsStand.nutzung) : null}
        aufgeklappt={aufgeklappt}
        aufUmschalten={() => setzeAufgeklappt(!aufgeklappt)}
        aufErneutLaden={() => {
          setzeNutzungsStand(beginneLaden(nutzungsStand, sitzung.parentId))
          void holeNutzung(sitzung.parentId).then((antwort) => {
            setzeNutzungsStand((bisher) => {
              if (antwort.ok) return uebernimmNutzung(bisher, sitzung.parentId, antwort.wert)
              return uebernimmFehler(bisher, sitzung.parentId, antwort.fehler.code, antwort.fehler.meldung)
            })
          })
        }}
      />

      {/* Befunde: Sperren blockieren Speichern, Warnungen nur zeigen */}
      {befinde.length > 0 && (
        <ul data-testid="befunde">
          {befinde.map((befund, i) => (
            <li key={i} style={{ color: befund.schwere === 'sperre' ? '#e5634d' : '#d9a441' }}>
              {befund.schwere === 'sperre' ? 'Sperre' : 'Warnung'}: {befund.meldung}
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', gap: 12, minHeight: 0 }}>
        {/* Der Zonen-Canvas: NICHT die Vorlageninhalte (der Vorschauber des Segmentes),
            sondern Rechtecke, Griffe, Hilfslinien. */}
        <div
          data-testid="zonen-canvas"
          style={{
            width: flaeche.breite / 2,
            height: flaeche.höhe / 2,
            position: 'relative',
            background: box === null ? undefined : '#1a1a1a',
            border: '1px solid #444',
            overflow: 'hidden',
          }}
        >
          {vorlage === null
            ? null
            : vorlage.zonen.map((z) => (
                <div
                  key={z.id}
                  data-testid={`zone-${z.id}`}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (z.rolle === 'frei') {
                      setzeGewaehlt(z.id)
                      gestoeneZone(null, 0, 0)
                    }
                  }}
                  onMouseMove={(e) => {
                    if (geste.laeuft === false) {
                      return
                    }
                    if (e.buttons !== 1) {
                      return
                    }
                    // Jede Bewegung laeuft NUR lokal - kein uebernimm, kein sichere.
                    gestoeneZone(null, e.movementX * 2, e.movementY * 2)
                  }}
                  onMouseUp={() => {
                    if (geste.laeuft === false) {
                      return
                    }
                    // GENAU EIN uebernimmAenderung + sichereStand beim Loslassen.
                    loeseGesteLos()
                  }}
                  onClick={() => {
                    if (z.rolle === 'frei') setzeGewaehlt(z.id)
                  }}
                  style={{
                    position: 'absolute',
                    left: z.rahmen.x / 2,
                    top: z.rahmen.y / 2,
                    width: z.rahmen.breite / 2,
                    height: z.rahmen.höhe / 2,
                    border: gewaehlt === z.id ? '2px solid #d9a441' : '1px solid #666',
                    opacity: z.rolle === 'fest' ? 0.6 : 1,
                  }}
                />
              ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
          {/* Die Live-Vorschau: EIN Zeichenaufruf je Stand; erst nach Vorbereitung. */}
          <div data-testid="vorschau-flaeche" style={{ minHeight: 180, border: '1px solid #444', overflow: 'hidden' }}>
            {vorbereitet === false ? null : (
              <VorschauCanvas
                aktion={vorschauAktion}
                vorlage={vorlage}
                marke={vorschauMarkeId !== null ? holeBereiteMarke(vorschauMarkeId) : null}
                geleert={geleert}
              />
            )}
          </div>
          {/* #393: Die AUSWAHL der Aktion. Ohne Projekt (oder ohne Aktion darin) steht
              die Beispiel-Aktion - dann sagt die Zeile das auch. WAEHLEN, nie zeichnen:
              die Vorschau zeichnet im Effekt darueber mit `vorschauAktion`. */}
          <label data-testid="vorschau-aktion-wahl">
            Vorschau mit Aktion{' '}
            <select
              value={vorschauAktion.id}
              onChange={(e) => {
                setzeVorschauAktionId(e.target.value)
                setzeVorbereitet(false)
              }}
            >
              {vorschauProjekt?.aktionen.length === 0 || vorschauProjekt === null ? (
                <option value={BEISPIEL_AKTION.id}>
                  {BEISPIEL_AKTION.titel} (keine Aktion im Projekt)
                </option>
              ) : (
                vorschauProjekt.aktionen.map((aktion) => (
                  <option key={aktion.id} value={aktion.id}>
                    {aktion.titel}
                  </option>
                ))
              )}
            </select>
          </label>
          {/* Die AUSWAHL „Vorschau gegen Marke" (Variante (b)): Liste aus dem
              Zugan (#311) - WAEHLEN, nie zeichnen; die Zeichen-Marke kommt je Wahl
              ueber stelleMarkeBereit/holeBereiteMarke (#312). */}
          <label data-testid="vorschau-marke-wahl">
            Vorschau gegen Marke{' '}
            <select
              value={vorschauMarkeId ?? ''}
              onChange={(e) => {
                setzeVorschauMarkeId(e.target.value)
                setzeVorbereitet(false)
              }}
            >
              {markenListe.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.eingebaut ? ' (eingebaut)' : ''}
                </option>
              ))}
            </select>
          </label>
          <div data-testid="vorschau-schalter">
            {VORSCHAU_FELDER.map((eintrag) => (
              <button
                type="button"
                key={eintrag.feld}
                data-testid={`vorschau-schalter-${eintrag.feld}`}
                aria-pressed={geleert.has(eintrag.feld)}
                onClick={() => setzeGeleert(schalteVorschauFeld(geleert, eintrag.feld))}
              >
                {eintrag.beschriftung}
              </button>
            ))}
          </div>

          {/* Zonen-Liste = Zeichenreihenfolge (kein z-index, keine Sortierung).
              Beschriftung aus der EINEN Quelle (#454): Name und ein Satz je Kennung. */}
          <ul data-testid="zonen-liste" style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12, overflow: 'auto' }}>
            {liste.map((zeile) => {
              const text = zonenText(zeile.zone.id)
              return (
                <li key={zeile.zone.id} data-testid={`zonen-liste-${zeile.index}`}>
                  {zeile.ebene}. {text.name} — {text.zweck}
                  {zeile.beweglich ? '' : ' (fest)'}
                  {zeile.beweglich && geste.laeuft === false && (
                    <span>
                      {' '}
                      <button
                        type="button"
                        onClick={() => {
                          const nach = Math.max(0, zeile.index - 1)
                          const neu = ordneZonenNeu(vorlage.zonen, zeile.index, nach)
                          if (neu.ok) {
                            void uebernehme(mitZonen(vorlage, neu.wert))
                          }
                        }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nach = Math.min(liste.length - 1, zeile.index + 1)
                          const neu = ordneZonenNeu(vorlage.zonen, zeile.index, nach)
                          if (neu.ok) {
                            void uebernehme(mitZonen(vorlage, neu.wert))
                          }
                        }}
                      >
                        ▼
                      </button>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Die GESTE lebt HIER: Beginnt beim Festhalten auf einer FREIEN Zone,
          laeuft lokal FErigeraea und schliesst beim Loslassen mit GENAU EINMAL
          uebernimmAenderung + sichereStand (ENTSCHIEDEN 3). */}
      {/* Zone hinzufuegen: 3 Sorten; liefert bereits eine Vorlage (#147). */}
          <div data-testid="zone-hinzufuegen">
            <button
              type="button"
              onClick={() => {
                // GEMESSEN am 22.10.2026 im Treiber 4n: Hier stand
                // `{ sorte: 'text-formatiert' } as never` - eine Sorte, die
                // `fuegeZoneHinzu` nicht kennt. Der Knopf tat damit NICHTS (nur
                // console.warn), waehrend die reine Funktion und ihre Tests gruen
                // waren. Der Knopf bestellt die Bindung `titel`; die Beschriftung
                // nennt seit #454 ihren Anzeigenamen aus der geteilten Quelle.
                const wunsch: ZonenWunsch = { sorte: 'text', bindung: 'titel' }
                const neu = fuegeZoneHinzu(vorlage, wunsch)
                if (neu.ok) {
                  void uebernehme(neu.wert)
                } else {
                  console.warn('[vorlagen-editor] fuegeZoneHinzu lehnt ab:', neu.fehler.code)
                }
              }}
            >
              + Textzone ({zonenText('titel').name})
            </button>
          </div>

          {/* Zahlen-Inspektor der gewählten Zone: beide Wege Pflicht. */}
          {gewaehlt !== null && vorlage !== null && (
            <InspektorFelder
              zone={vorlage.zonen.find((z) => z.id === gewaehlt) ?? null}
              flaeche={flaeche}
              fest={false}
              onWert={(feld, text) => {
                const bezogene = vorlage.zonen.find((z) => z.id === gewaehlt)
                if (bezogene === undefined) {
                  return
                }
                const neu = setzeRahmenWert(bezogene, feld, text, flaeche)
                if (neu.ok) {
                  // KEINE Geste: ein einzelner Schritt, sofort übernommen.
                  void uebernehme(mitZone(vorlage, neu.wert))
                } else {
                  console.warn('[vorlagen-editor] setzeRahmenWert lehnt ab:', neu.fehler.code)
                }
              }}
            />
          )}
        </div>
      </div>
      {geste.laeuft && <div data-testid="geste-laeuft" hidden />}
    </div>
  )
}



// Die Vorschau-Zeichnung: EIN Zeichenaufruf je Stand; wirft niemals nach außen
// (der Vorgang wird sichtbar gemacht, die Wurzel bleibt bedienbar).
function VorschauCanvas({
  aktion,
  vorlage,
  marke,
  geleert,
}: {
  aktion: import('../../shared/contracts/aktion').Aktion
  vorlage: Vorlage | null
  marke: Marke | null
  geleert: ReadonlySet<VorschauFeld>
}): JSX.Element | null {
  const [bild, setzeBild] = useState<{ breite: number; höhe: number; adresse: string } | null>(null)
  const [fehler, setzeFehler] = useState<string | null>(null)

  useEffect(() => {
    if (vorlage === null || marke === null) {
      // Ohne bereitstehende Marke wird NICHT gezeichnet (kein Ersatz, #313).
      setzeBild(null)
      return
    }
    try {
      const result = zeichneVorschau(aktion, vorlage, marke, geleert)
      setzeBild({
        breite: result.breite,
        höhe: result.höhe,
        adresse: result.canvas.toDataURL(),
      })
      setzeFehler(null)
    } catch (ausnahme) {
      // Bewusst gefangen: Canvas, Zonen-Liste und Inspektor bleiben bedienbar;
      // das Vorgang wird sichtbar (console).
      console.warn('[vorlagen-editor] zeichneVorschau wirft:', ausnahme)
      setzeFehler(ausnahme instanceof Error ? ausnahme.message : 'Zeichenfehler')
    }
    // #393: `aktion` als OBJEKT, nicht `aktion.id` - seit die Aktion waehlbar ist und
    // aus dem Projekt kommt, muss auch eine geaenderte Aktion (Titel, Preis, Bild)
    // neu zeichnen; die Kennung allein bliebe gleich.
  }, [aktion, vorlage, marke, geleert])

  if (fehler !== null) {
    return <div data-testid="vorschau-feller" style={{ color: '#d9a441', fontSize: 11 }}>{fehler}</div>
  }
  if (bild === null) {
    return null
  }
  return (
    <img
      data-testid="vorschau-bild"
      src={bild.adresse}
      alt="Vorschau"
      style={{ width: '100%', objectFit: 'contain', display: 'block' }}
    />
  )
}

// Die Inspektor-Zeile: für beide Wege... ), schreibgeschützt bei festen Zonen.
function InspektorFelder({
  zone,
  flaeche,
  fest,
  onWert,
}: {
  zone: Zone | null
  flaeche: { breite: number; höhe: number }
  fest: boolean
  onWert: (
    feld: 'x' | 'y' | 'breite' | 'höhe',
    text: string,
  ) => void
}): JSX.Element {
  if (zone === null) {
    return <div data-testid="inspektor-leer" />
  }
  const felder: readonly { feld: 'x' | 'y' | 'breite' | 'höhe'; beschriftung: string }[] = [
    { feld: 'x', beschriftung: 'x' },
    { feld: 'y', beschriftung: 'y' },
    { feld: 'breite', beschriftung: 'Breite' },
    { feld: 'höhe', beschriftung: 'Höhe' },
  ]
  return (
    <div data-testid="inspektor" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {felder.map((eintrag) => (
        <label key={eintrag.feld} style={{ fontSize: 11 }}>
          {eintrag.beschriftung}{' '}
          <input
            type="number"
            disabled={fest}
            value={zone.rahmen[eintrag.feld] ?? 0}
            data-testid={`inspektor-${eintrag.feld}`}
            onBlur={(e) => onWert(eintrag.feld, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onWert(eintrag.feld, e.currentTarget.value)
            }}
            style={{ width: 70 }}
          />
        </label>
      ))}
      <span style={{ opacity: 0.7 }}>
        ({flaeche.breite} x {flaeche.höhe})
      </span>
      <button type="button" hidden onClick={() => onWert('höhe', String(flaeche.höhe))}>
        —
      </button>
    </div>
  )
}
