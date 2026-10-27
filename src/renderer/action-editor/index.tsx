// Die Modul-Wurzel des Aktions-Editors (#250 / M7-57).
//
// Anordnung (TK 9.14.1): links die Aktions-Bibliothek (#135) mit Kaputt-Zähler
// und den Knöpfen Neue Aktion / Löschen; rechts oben die GROSSE Live-Vorschau
// (#140, über template-canvas - NICHT der preview-player); rechts unten die
// Bearbeitungsfelder (#136/#137/#138/#139).
//
// ENTSCHEIDENE Regeln (verbindlich; Details in aktions-montage.ts):
//  - Der neue Stand geht nach JEDER erfolgreichen Mutation über
//    projekt.setzeProjekt(mitAktion(projekt, aktion)) in die gemeinsame Sicht
//    - über den UMHÜLLTEN Zugang (#243/#244), damit der Undo-Schnappschuss
//    von selbst entsteht. SECHS WEGE, sechs compute-Nachweise: legeAktionAn /
//    speichereAktion (#136), weiseBildZu / entferneBild (#138),
//    setzeAkzentfarbe (#139) und behebeAktionsBild (#141; dessen aktion steckt
//    in wert.aktion - sonst hängt mitAktion ein Objekt ohne id ANS ENDE und
//    die Bibliothek trägt die Aktion doppelt).
//  - Die Lage = WERT (EditorLage aus aktions-montage); die Hervorhebung aus
//    der Reparatur-Führung (#201) wird in einem Effekt AUF ÄNDERUNG
//    ausgewertet - nicht bei jedem Rendering (sonst fände der Nutzer nie
//    mehr selbst gestaltete Auswahl weg).
//  - Loeschvorschau VOR dem Absenden (#142) mit ZAHLEN, nicht Kennungen;
//    nach dem erfolgreichen loescheAktion geht der ZURÜCKGEGEBENE stand
//    über setzeProjekt in die Sicht (#243/Sicht führen - keine Kaskade
//    aus entfernteElementIds nachgebaut, ENTSCHIEDEN 6).
//  - Vorbereitung: bereiteVorschauVor (#140) beim Aufbau mit offenem
//    Projekt und erneut, wenn sich aktionen/assets ändern; zeichnen aus
//    zeichnen.hole()?.vorlagen (das Feld, mit dem später gerendert wird),
//    Marke aus p.marke. Ohne Vorbereitung KEIN zeichneVorschau (wirft sonst).
//  - Die Auswahlliste der Vorlagen kommt über ladeWaehlbareVorlagen (#137),
//    das Neuladen über vorlagen.aufGeaendert (ENTSCHIEDEN 10).
//  - KEIN IPC, kein Zeichnen über zeichneSegment (#140 reichte durch), kein
//    Undo-Stapel (der umhüllte Zugang macht das), kein Abonnieren von
//    queue:geaendert (#199 ist der einzige Auswerter).
//  - Feld-Absenden beim Verlassen (Offene Frage aus dem Issue: gemeldet;
//    keine Entprellung mit selbst gewählter Wartezeit).

import { useEffect, useState, type JSX } from 'react'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { ZeichenZugang, VorlagenZugang, ProjektZugang, MarkenZugang } from '../app-shell/sichten'
import { holeBereiteMarke } from '../gemeinsam/marken-bereitstellung'

import { baueBibliothek, zaehleKaputte } from './bibliothek'
import {
  leererEntwurf,
  legeAktionAn,
  pruefeEntwurf,
  speichereAktion,
  type AktionsEntwurf,
  type EntwurfBefund,
} from './aktion-bearbeiten'
import { BefundAnzeige } from './befund-texte'
import { findeZugewiesene, ladeWaehlbareVorlagen } from './vorlage-waehlen'
import { entferneBild, starteBildImport, waehlbareBilder, weiseBildZu } from './bild-zuweisen'
import { setzeAkzentfarbe } from './akzentfarbe'
import {
  bereiteVorschauVor,
  haengeVorschauEin,
  zeichneVorschau,
} from './live-vorschau'
import {
  anzahlStellen,
  behebeAktionsBild,
  betroffeneStellen,
  type BildFix,
} from './kaputt-handling'
import { berechneLoeschVorschau, loescheAktion } from './aktion-loeschen'
import {
  beginneNeu,
  findeGewaehlte,
  findeZeichenVorlage,
  gleicheLageAb,
  LEERE_EDITOR_LAGE,
  mitAktion,
  nachAnlegen,
  uebernimmHervorhebung,
  waehleAktion,
  type EditorLage,
} from './aktions-montage'

export interface ActionEditorWurzelProps {
  sichtbar: boolean
  /** UMHÜLLTER Projektzugang (#243). */
  projekt: ProjektZugang
  zeichnen: ZeichenZugang
  vorlagen: VorlagenZugang
  /** NUR DIE AUSWAHLLISTE (FA-23, Wahlweg #319): welche Marken gibt es. GEZEICHNET wird
   *  nie aus ihr - die Marke zum Zeichnen kommt je Aktion über holeBereiteMarke (#312). */
  marken: MarkenZugang
  /** Die hervorzuhebende Aktion aus der Reparatur-Führung (#201); null = keine. */
  hervorgehobeneAktionId: string | null
}

/** LIEFERT die Schnittstelle aus #244: die Wurzel des Reiters Aktionen. */
export function ActionEditorWurzel(p: ActionEditorWurzelProps): JSX.Element {
  if (!p.sichtbar) {
    // Abbau verboten (TK 9.14.2): unsichtbar, aber gemountet.
    return <div data-testid="aktionen-inaktiv" style={{ display: 'none' }} />
  }
  return <AktionenInterna {...p} />
}

function AktionenInterna(p: ActionEditorWurzelProps): JSX.Element {
  const stand = p.projekt.hole()
  const projekt: Project | null = stand.projekt
  const [, setzeTakt] = useState(0)
  const [lage, setzeLage] = useState<EditorLage>(LEERE_EDITOR_LAGE)
  const [formular, setzeFormular] = useState<AktionsEntwurf | null>(null)
  // Die zwei hiesigen Zustände (ENTSCHIEDEN 4): Lage und Entwurf – sie MÜSSEN
  // den Reiterwechsel nicht überleben (#195 baut besuchte Reiter nicht ab).

  // Die Vorlagen-Auswahl: nur lädt Sie NICHT initial - sie wird per vorlagen.-Abgabge,
  // ja je bedient ladeWaehlbareVorlagen() lädt (das Neuladen so). VorlagenZugang
  // liefert NUR den Anlass, nicht den Inhalt (ENTSCHIEDEN 10).
  const [waehlbare, setzeWaehlbare] = useState<Vorlage[] | null>(null)

  // Reaktionskette: Bereit تنظش für die Bibliothek; erneut nach jeder
  // Bestandsändenung (ENTSCHIEDEN 11: bereiteVorschauVor - NICHT zeichnen.bereiteVor).
  useEffect(() => {
    void (async () => {
      const eintrag = p.projekt.hole().projekt
      if (eintrag === null) {
        return
      }
      // Die Marke fuer die Logo-Vorbereitung: die STABILE Rahmen-Marke (TK 9.15.4) -
      // sie wird von bereiteZeichnenVor (#313) IMMER bereitgestellt. Die Marken zum
      // Zeichnen kommen je Aktion ueber holeBereiteMarke; der #140-Aufruf behaelt
      // seine vierte Stellung (die Datei ist NICHT Teil dieses Issues).
      const markeFuerVorbereitung = holeBereiteMarke(eintrag.standardMarkeId)
      if (markeFuerVorbereitung === null) {
        // Nicht bereitgestellt heisst: nicht vorbereiten, nicht zeichnen - kein
        // Ersatz und kein Nachladen im Zeichenpfad (TK 9.10.3).
        return
      }
      await bereiteVorschauVor(eintrag.id, [...eintrag.aktionen], [...eintrag.assets], markeFuerVorbereitung)
      setzeZeichenvoraussetzungenFrisch()
    })()
  }, [p, p.projekt])

  // Das Neuladen der Vorlagen-Auswahl (ENTSCHIEDEN 10): je Änderung der Sicht.
  useEffect(() => {
    void ladeWaehlbareVorlagen().then((antwort) => {
      if (antwort.ok) setzeWaehlbare(antwort.wert)
      else setzeWaehlbare([])
    })
    const abmelden = p.vorlagen.aufGeaendert(() => {
      void ladeWaehlbareVorlagen().then((antwort) => {
        if (antwort.ok) setzeWaehlbare(antwort.wert)
      })
    })
    return () => {
      abmelden()
    }
  }, [])

  // Die Hervorhebung aus der Reparatur-Führung (#201): auf ÄNDERung ausgewertet,
  // nie für jeden Render (ENTSCHIEDEN 5).
  useEffect(() => {
    const aktionen = p.projekt.hole().projekt?.aktionen ?? []
    setzeLage((bisher) => uebernimmHervorhebung(bisher, p.hervorgehobeneAktionId, aktionen))
  }, [p.hervorgehobeneAktionId])

  // Bestands-Fächern: die Lage fällt zurück, wenn die gewählte Aktion verschwindet.
  useEffect(() => {
    const aktionen = p.projekt.hole().projekt?.aktionen ?? []
    setzeLage((bisher) => gleicheLageAb(bisher, aktionen))
  }, [stand])

  if (projekt === null) {
    // Den Leerzustand des Reiters liefert #198, nicht diese Wurzel.
    return null as unknown as JSX.Element
  }

  const bibliothek = baueBibliothek(projekt.aktionen, projekt.assets)
  const kaputt = zaehleKaputte(bibliothek)
  const gewaehlt = findeGewaehlte(lage, projekt.aktionen)

  // Die Write-nach der Sicht - DER Weg des ganzen Moduls (ENTSCHIEDEN 1).
  function einspeisen(antwort: Ergebnis<Aktion> | { ok: true; wert: { aktion: Aktion } }): void {
    // Der Fehlerfall wird NICHT mehr still verschluckt: `FormularFelder` meldet ihn am
    // Feld. Hier bleibt nur der Erfolgsweg - die Sicht schreibt die neue Aktion.
    if (!antwort.ok) {
      return
    }
    const aktion = 'aktion' in antwort.wert ? antwort.wert.aktion : antwort.wert
    p.projekt.setzeProjekt(mitAktion(projekt as Project, aktion))
    setzeTakt((t) => t + 1)
  }

  return (
    <div data-testid="aktion-editor-root" style={{ display: 'flex', gap: 12, padding: 8, minHeight: 0 }}>
      {/* = links: die BIBLIOTHEK = */}
      <div data-testid="aktion-bibliothek" style={{ width: 260, overflow: 'auto' }}>
        <h2>Aktionen {kaputt > 0 ? (<span style={{ color: '#e5634d' }}>({kaputt} kaputt)</span>) : null}</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {bibliothek.map((eintrag) => (
            <li key={eintrag.aktion.id}>
              <button
                type="button"
                onClick={() => {
                  setzeLage(waehleAktion(eintrag.aktion.id))
                  setzeFormular({ ...eintrag.aktion })
                }}
              >
                {eintrag.aktion.titel}{eintrag.kaputt ? ' (kaputt)' : ''}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          data-testid="aktion-neu"
          onClick={() => {
            setzeLage(beginneNeu())
            // Die Vorbelegung des ANLEGE-FORMULARS (#136): erste Vorlage als Basis
            // ist Sache des Users ÜBER die Wahl; die Akzentfarbe bleibt null.
            // markeId (#320/TK 9.8.2): vorbelegt mit Project.standardMarkeId -
            // #319 (Markenwahl im Formular) macht sie später waehlbar.
            const standDerSicht = p.projekt.hole().projekt
            const ersteVorlage = waehlbare?.[0]?.id ?? 'vollbild'
            setzeFormular(
              leererEntwurf(
                ersteVorlage,
                standDerSicht?.standardMarkeId ?? '',
                null,
              ),
            )
          }}
        >
          Neue Aktion
        </button>
      </div>

      {/* = rechts oben: die GROSSE Live-Vorschau = */}
      <div data-testid="aktion-vorschau" style={{ flex: 1, minHeight: 240 }}>
        <VorschauFlaeche p={p} gewaehlt={gewaehlt} />
      </div>

      {/* = rechts unten: die BEARBEITUNGSFELDER = */}
      <div data-testid="aktion-formular" style={{ width: 320, overflow: 'auto' }}>
        {lage.modus === 'neu' && formular !== null && (
          <button
            type="button"
            data-testid="aktion-anlegen-bestaetigen"
            onClick={() => {
              // Anlegen: die PRUEFUNG läuft hier NICHT selbst - legeAktionAn prüft
              // die Vollständigkeit #136- Does. Der entwurf ist geworden..
              void legeAktionAn(formular as AktionsEntwurf).then((antwort) => {
                if (antwort.ok) {
                  einspeisen(antwort)
                  // Der Editor steht danach auf der SOEBEN entstandenen Aktion
                  // (nachAnlegen, aktiv-mit-Definition der Lage).
                  setzeLage(nachAnlegen(antwort.wert))
                  setzeFormular({ ...antwort.wert })
                  setzeTakt((t) => t + 1)
                } else {
                  console.warn('[aktion-editor] legeAktionAn lehnt ab:', antwort.fehler.code)
                }
              })
            }}
          >
            Anlegen
          </button>
        )}
        {formular === null && lage.modus === 'keine' ? (
          <p data-testid="aktion-formular-leer">Nichts gewählt.</p>
        ) : (
          <FormularFelder
            p={p}
            formular={formular as AktionsEntwurf}
            waehlbare={waehlbare}
            gewaehlt={gewaehlt}
            onEinspeisen={einspeisen}
            onSetzeFormular={setzeFormular}
          />
        )}
        {lage.modus === 'bestehend' && (
          <LoeschBlock
            projekt={projekt as Project}
            aktionId={lage.aktionId as string}
            onLoesche={() => {
              void loescheAktion(lage.aktionId as string).then((antwort) => {
                if (antwort.ok) {
                  // Der ZURÜCKGEGEBENE Stand geht in die Sicht (ENTSCHIEDEN 6);
                  // die Kaskade aus den Kennungen wird NICHT nachgebaut.
                  const alte = projekt as Project
                  p.projekt.setzeProjekt({
                    ...alte,
                    aktionen: antwort.wert.stand.aktionen,
                    liste: antwort.wert.stand.liste,
                  })
                  setzeLage({ modus: 'keine' })
                  setzeFormular(null)
                  setzeTakt((t) => t + 1)
                } else {
                  console.warn('[aktion-editor] loescheAktion lehnt ab:', antwort.fehler.code, antwort.fehler.meldung)
                }
              })
            }}
            onAbbrechen={() => undefined}
          />
        )}
      </div>
    </div>
  )
}

// Merker der Vorbereitung; die Vorschaufläche prüft ihn je Render.
let zeichenvoraussetzungenFrisch = false
function setzeZeichenvoraussetzungenFrisch(): void {
  zeichenvoraussetzungenFrisch = true
}

/** Die Vorschaufläche: zeichnet mit zeichneVorschau (#140) - dem EINZIGEN Zeichenweg. */
function VorschauFlaeche({
  p,
  gewaehlt,
}: {
  p: ActionEditorWurzelProps
  gewaehlt: Aktion | null
}): JSX.Element {
  const containerBezug = useState<HTMLDivElement | null>(null)
  const [, setzeContainer] = containerBezug
  const [, setzeFehlertext] = useState<string | null>(null)

  useEffect(() => {
    const ziel = containerBezug[0]
    if (ziel !== null && gewaehlt !== null) {
      const zeichenv = p.zeichnen.hole()?.vorlagen ?? []
      const vorlage = findeZeichenVorlage(gewaehlt, zeichenv)
      if (vorlage === null) return
      // Die Marke der GEWAEHLTEN Aktion (#313, ENTSCHIEDEN 5). null heisst: nicht
      // zeichnen - keine Ersatzmarke, kein Nachladen im Zeichenpfad (TK 9.10.3).
      const marke = holeBereiteMarke(gewaehlt.markeId)
      if (marke === null) return
      try {
        const bild = zeichneVorschau(gewaehlt, vorlage, marke)
        haengeVorschauEin(ziel, bild)
        setzeFehlertext(null)
      } catch (ausnähm) {
        console.warn('[aktion-editor] zeichneVorschau wirft:', ausnähm)
        setzeFehlertext(ausnähm instanceof Error ? ausnähm.message : 'Zeichenfehler')
      }
    }
  }, [gewaehlt, p, zeichenvoraussetzungenFrisch])

  return <div ref={(el) => setzeContainer(el)} data-testid="aktion-vorschau-flaeche" style={{ border: '1px solid #444', minHeight: 200 }} />
}

/** Die Felder je Aktion: Titel/Beschr./Preis/CTA/Dauer/Vorlage/Bild/Akzent - je der
 *  schreibweg liefert eine neue Aktion; sie geht über einspeisen in die Sicht. */
function FormularFelder({
  p,
  formular,
  waehlbare,
  gewaehlt,
  onEinspeisen,
  onSetzeFormular,
}: {
  p: ActionEditorWurzelProps
  formular: AktionsEntwurf
  waehlbare: Vorlage[] | null
  gewaehlt: Aktion | null
  /** Der Fehlerfall traegt seine Meldung mit - `{ ok: false }` allein machte ein
   *  gescheitertes Speichern unsichtbar (FA-03-Nachlauf). */
  onEinspeisen: (antwort: Ergebnis<Aktion> | { ok: true; wert: { aktion: Aktion } }) => void
  onSetzeFormular: (entwurf: AktionsEntwurf | null) => void
}): JSX.Element {
  const [befunde, setzeBefunde] = useState<EntwurfBefund[]>([])
  // FA-03-Nachlauf: Ein verlorener Edit war bisher UNSICHTBAR - es gab keinen Weg,
  // auf dem der Nutzer von einem gescheiterten Speichern erfaehrt. Diese Zeile ist
  // dieser Weg (die Wurzel-Meldung steht dem action-editor nicht zur Verfuegung).
  const [speicherMeldung, setzeSpeicherMeldung] = useState<string | null>(null)
  const projekt = p.projekt.hole().projekt
  const assets: Asset[] = projekt?.assets ?? []

  // Feld verlassen -> speichereAktion (ENTSCHEIDEN-FRAG: gemeldet).
  async function feldVerlassen(feld: keyof AktionsEntwurf, wert: string | null): Promise<void> {
    if (gewaehlt === null) {
      // Modus "neu": `formular` ist der Entwurf, `gewaehlt` gibt es noch nicht. Der
      // stille Rueckweg bleibt hier - offener Folge-Befund "Neue Aktion: getippte Werte
      // erreichen das Formular nie" (nicht in diesem Fix behoben).
      return
    }
    const entwurf = p.projekt.hole().projekt?.aktionen.find((e) => e.id === gewaehlt.id)
    if (entwurf === undefined) {
      // Die Auswahl zeigt auf eine Aktion, die im aktuellen Stand nicht mehr existiert.
      // Frueher: stilles `return` - der getippte Wert war weg, ohne jede Spur.
      setzeSpeicherMeldung(
        'Die Aktion ist im aktuellen Projektstand nicht mehr vorhanden - die Änderung wurde NICHT gespeichert.',
      )
      return
    }
    const geaenderteFelder: Partial<AktionsEntwurf> = { [feld]: wert } as Partial<AktionsEntwurf>
    const befundeArray = pruefeEntwurf(geaenderteFelder)
    if (befundeArray.length > 0) {
      setzeBefunde(befundeArray)
      return
    }
    setzeBefunde([])
    const antwort = await speichereAktion(gewaehlt.id, geaenderteFelder)
    onEinspeisen(antwort)
    if (antwort.ok) {
      setzeSpeicherMeldung(null)
      onSetzeFormular({ ...antwort.wert })
    } else {
      // Der Grund kommt aus `speichereAktion` (Validierung oder Main-Antwort) und ist
      // ein Bediener-Satz - er wird woertlich gezeigt, nicht neu formuliert.
      setzeSpeicherMeldung(`Nicht gespeichert: ${antwort.fehler.meldung}`)
    }
  }

  return (
    <div>
      <label>Titel{' '}
        <input
          type="text"
          data-testid="aktion-titel"
          defaultValue={String(formular.titel)}
          onBlur={(e) => void feldVerlassen('titel', e.target.value)}
        />
      </label>
      <label>Beschreibung{' '}
        <input
          type="text"
          defaultValue={formular.beschreibung ?? ''}
          data-testid="aktion-beschreibung"
          onBlur={(e) => void feldVerlassen('beschreibung', e.target.value || null)}
        />
      </label>
      <label>Preis{' '}
        <input
          type="text"
          defaultValue={formular.preis ?? ''}
          data-testid="aktion-preis"
          onBlur={(e) => void feldVerlassen('preis', e.target.value || null)}
        />
      </label>
      <label>CTA{' '}
        <input
          type="text"
          defaultValue={formular.cta ?? ''}
          data-testid="aktion-cta"
          onBlur={(e) => void feldVerlassen('cta', e.target.value || null)}
        />
      </label>
      <label>Standarddauer{' '}
        <input
          type="number"
          defaultValue={String(formular.standardDauer ?? '')}
          data-testid="aktion-dauer"
          onBlur={(e) => void feldVerlassen('standardDauer', e.target.value === '' ? null : Number(e.target.value) as unknown as string | null)}
        />
      </label>
      {speicherMeldung !== null && (
        <p data-testid="aktion-speicher-meldung" style={{ color: '#e5634d', fontSize: 12 }}>
          {speicherMeldung}
        </p>
      )}
      {befunde.map((befund, i) => (
        <BefundAnzeige key={i} befund={befund} />
      ))}
      {/* die Vorlage: die Auswahl per speichereAktion (verhindert nur der WYSIWYG-Wahl) */}
      {waehlbare === null ? null : (
        <select
          data-testid="aktion-vorlage"
          defaultValue={gewaehlt?.vorlagenId ?? ''}
          onBlur={(e) => void feldVerlassen('vorlagenId', e.target.value)}
        >
          {waehlbare.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      )}
      {gewaehlt !== null && waehlbare !== null && findeZugewiesene(gewaehlt.vorlagenId, waehlbare) === null && (
        <p data-testid="aktion-vorlage-unbekannt" style={{ color: '#d9a441' }}>
          Unbekannte Vorlage - bitte neu wählen.
        </p>
      )}
      {/* das Bild: über weiseBildZu / entferneBild / starteBildImport */}
      <div data-testid="aktion-bild">
        <select
          data-testid="aktion-bild-wahl"
          defaultValue={gewaehlt?.bildRef ?? ''}
          onChange={(e) => {
            void (async () => {
              const projekt = p.projekt.hole().projekt
              if (projekt === null || gewaehlt === null) return
              if (e.target.value === '') {
                const antwort = await entferneBild(gewaehlt.id)
                onEinspeisen(antwort)
                return
              }
              const antwort = await weiseBildZu(gewaehlt.id, e.target.value, projekt.assets)
              onEinspeisen(antwort)
            })()
          }}
        >
          <option value="">– kein Bild –</option>
          {waehlbareBilder(assets).map((asset) => (
            <option key={asset.id} value={asset.id}>{asset.originalname}</option>
          ))}
        </select>
        <button
          type="button"
          data-testid="aktion-bild-import"
          onClick={() => {
            void (async () => {
              const projekt = p.projekt.hole().projekt
              if (projekt === null) return
              const antwort = await starteBildImport(projekt.id)
              if (antwort.ok && antwort.wert.auftragIds.length > 0) {
                console.info(
                  antwort.wert.abbruchGrund === null
                    ? `${antwort.wert.auftragIds.length} Import(e) gestartet.`
                    : `${antwort.wert.auftragIds.length} gestartet; abgebrochen wegen ${antwort.wert.abbruchGrund}.`,
                )
              }
            })()
          }}
        >
          Bild importieren
        </button>
      </div>
      {/* die Akzentfarbe: freie Hex-Eintrag (#318, FA-24). Die PALETTEN-Optionen
          („Akzentfarbe aus der Markenpalette", #250) sind seit #318 bzw. #313
          UEBERHOLT und entfallen - der freie Farbwähler ist der Nachzug #325,
          hier NICHT vorweggenommen. */}
      <div data-testid="aktion-akzent">
        <select
          data-testid="aktion-akzent-vorschlag"
          defaultValue={gewaehlt?.akzentfarbe ?? ''}
          onChange={(e) => {
            void (async () => {
              if (gewaehlt === null) return
              const antwort = await setzeAkzentfarbe(gewaehlt.id, e.target.value === '' ? null : e.target.value)
              onEinspeisen(antwort)
            })()
          }}
        >
          <option value="">Markenwert</option>
        </select>
      </div>
      {/* Die Kaputt-Verweisung (~#141): stellen und der Fix-Weg 'entfernen'. */}
      {gewaehlt !== null && projekt !== null && (
        <KaputtAnzeige aktionId={gewaehlt.id} projekt={projekt} onEinspeisen={onEinspeisen} />
      )}
    </div>
  )
}

/** Die Nennung der betroffenen Stellen und die Fix-Optionen (#141). */
function KaputtAnzeige({
  aktionId,
  projekt,
  onEinspeisen,
}: {
  aktionId: string
  projekt: Project
  /** Der Fehlerfall traegt seine Meldung mit - `{ ok: false }` allein machte ein
   *  gescheitertes Speichern unsichtbar (FA-03-Nachlauf). */
  onEinspeisen: (antwort: Ergebnis<Aktion> | { ok: true; wert: { aktion: Aktion } }) => void
}): JSX.Element {
  const stellen = betroffeneStellen(aktionId, projekt.liste)
  if (anzahlStellen(stellen) === 0) {
    return <></>
  }
  return (
    <div data-testid="aktion-kaputt">
      <p>
        {anzahlStellen(stellen)} Stelle(n) verwenden diese Aktion: {stellen.segmentElementIds.length} Segment(e),
        {stellen.bandAbschnitte.length} Band-Abschnitt(e).
      </p>
      <button
        type="button"
        data-testid="kaputt-beheben"
        onClick={() => {
          const fix: BildFix = { art: 'entfernen' }
          void behebeAktionsBild(aktionId, fix, projekt.liste, projekt.assets).then((antwort) => {
            if (antwort.ok) {
              // Die aktion steckt in wert.aktion (nicht wert) - ansonsten würde
              // mitAktion sie als unbekannt ANS ENDE hängen (ENTSCHIEDEN 1).
              const aufrufEinspeisbar = { ok: true as const, wert: antwort.wert.aktion }
              onEinspeisen(aufrufEinspeisbar)
            } else {
              console.warn('[aktion-editor] behebeAktionsBild lehnt ab:', antwort.fehler.code)
            }
          })
        }}
      >
        Bild dieser Aktion entfernen (behebt alle Stellen)
      </button>
    </div>
  )
}

// Die Lösch-Kaskade aus den Kennungen wird bewusst NICHT nachgebaut (ENTSCHIEDEN 6):
// der zurückgegebene stand ist die einzige Quelle des neuen Listen-Standes.

// Die Lösch-Vorschau (#142): ZAHLEN vor dem Klick (ENTSCHIEDEN 12) -
// Kennungen sind für den Nutzer bedeutungslos.
function LoeschBlock({
  projekt,
  aktionId,
  onLoesche,
  onAbbrechen,
}: {
  projekt: Project
  aktionId: string
  onLoesche: () => void
  onAbbrechen: () => void
}): JSX.Element {
  const [offen, setzeOffen] = useState(false)
  const vorschau = berechneLoeschVorschau(aktionId, projekt.liste)
  if (!offen) {
    return (
      <button
        type="button"
        data-testid="aktion-loeschen"
        onClick={() => setzeOffen(true)}
      >
        Aktion löschen
      </button>
    )
  }
  return (
    <div data-testid="aktion-loesch-vorschau">
      <p>
        Es verschwinden {vorschau.entfernteElementIds.length} Listenelement(e) ganz;
        {vorschau.gekuerzteElementIds.length} Video-Element(e) werden gekürzt;
        bei {vorschau.baenderWerdenLeer.length} entfällt das ganz Band.
      </p>
      <button type="button" data-testid="aktion-loeschen-bestaetigen" onClick={onLoesche}>
        Endgültig löschen
      </button>
      <button
        type="button"
        onClick={() => {
          setzeOffen(false)
          onAbbrechen()
        }}
      >
        Abbrechen
      </button>
    </div>
  )
}
