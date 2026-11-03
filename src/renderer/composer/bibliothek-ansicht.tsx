// Handgeschrieben zu Issue #227 - der zweite Baustein des Issues (die Ableitung steht
// in `bibliothek-ansicht.ts`, das Geruest-Werkzeug fasst je Issue nur die ERSTE
// Zieldatei an). DÜNN: Die Ansicht haelt keinen Zustand, sortiert nichts und schreibt
// NICHTS ins Projekt - sie zeigt und reicht Rueckrufe weiter.
//
// 02.11.2026: „Zur Liste hinzufuegen" ist ENTFALLEN (Niklas: „Aktion als eigener Block
// zur Liste hinzufuegen ist Muell von frueher, der muss weg"). Eine Aktion gehoert ins
// VIDEO - als Band-Abschnitt oder als Unterbrechung; beides legt „Ins Video" an. Damit
// sind auch `aufFehler` und `sichtSchreiber` hier ohne Verbraucher und mit entfallen.

import { useEffect, useRef, useState, type JSX } from 'react'
import type { Project } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import type { Aktion } from '../../shared/contracts/aktion'
import type { MedienEintrag, AktionsEintrag } from './bibliothek-ansicht'
import { baueMedienEintraege, baueAktionsEintraege, zaehleFehlende } from './bibliothek-ansicht'
import { baueVerwendungen, verwendungsText, type Verwendung } from './verwendungen'
import { baueMotivEintraege, holeMotiv } from './aktions-vorschau'
import { bereiteMotiveVor } from '../template-canvas/bild-laden'
// #413: Die Karten/Zeilen werden als Drag-QUELLEN zur Zeitleiste (#412) - der Klick-Weg
// bleibt UNVERAENDERT (zweiter Weg, nicht der einzige). Ein DndContext holt sie erst,
// wenn #414 die Flaeche montiert; bis dahin laufen die Bestands-Specs unveraendert.
import { useDraggable } from '@dnd-kit/core'

export interface BibliothekEigenschaften {
  projekt: Project
  aufImportieren: () => void
  aufMediumLoeschen: (assetId: string) => void
  /** #418: das hervorgehobene Medium (nach dem Import standardmaessig das neue Video). */
  ausgewaehltesId?: string | null
  /** #418: Klick auf eine Medienzeile macht sie zur Auswahl. */
  aufWaehlen?: (assetId: string) => void
  /** Die nutzbaren Vorlagen - fuer das Motiv der Aktionszeile. */
  vorlagen?: readonly Vorlage[]
  /** 03.11.2026 (Entscheidung 29.4): „+ Neue Aktion" oeffnet den Aktions-Editor im
   *  Modus „neu". Die Ansicht legt NICHTS selbst an - sie oeffnet nur den Weg.
   *  Fehlt der Rueckruf, gibt es keinen Knopf (die Ansicht erfindet keinen Weg). */
  aufNeueAktion?: () => void
  /** #430: loescht eine Aktion (Kaskade im Main). FEHLT sie, gibt es KEINEN Loeschen-Knopf
   *  (dieselbe Haltung wie bei `aufNeueAktion`: die Ansicht erfindet keinen Weg). */
  aufAktionLoeschen?: (aktionId: string) => void
  /** 01.11.2026: oeffnet den Aktions-Editor als Ansicht UEBER der Reiterflaeche - ohne
   *  Reiterwechsel (offene Frage der Notiz vom 21.10.). Fehlt der Rueckruf, gibt es
   *  KEINEN Bearbeiten-Knopf (die Ansicht erfindet keinen Weg). */
  aufAktionBearbeiten?: (aktionId: string) => void
  /** 02.11.2026 (Sidepanel): welcher BEREICH gezeigt wird. Die beiden Bereiche waren
   *  bisher immer zusammen sichtbar; mit der Leiste wechselt man zwischen ihnen.
   *  Vorgabe `alle` haelt die bestehenden Aufrufer und Tests unveraendert. */
  bereich?: 'alle' | 'video' | 'aktionen'
  /** 02.11.2026: die Marke einer Aktion (fuer das Motiv in der Zeile). Fehlt sie,
   *  gibt es kein Bild - aber keine Falle: die Zeile zeigt dann nur Text. */
  holeMarke?: (markeId: string) => Marke | null
  /** 02.11.2026 („Ins Video"): legt die Aktion per KLICK ins Video - Band-Aktion als
   *  Abschnitt ans Werbeband, Ganzbild als Unterbrechung an die Abspielmarke
   *  (`ins-video.ts`). Fehlt der Rueckruf, gibt es KEINEN Knopf: die Ansicht erfindet
   *  keinen Weg und keine Regel. */
  aufInsVideo?: (aktionId: string) => void
}

/**
 * Die Medien-Bibliothek des composers (TK 9.7.1/9.7.2). Zwei getrennte Bereiche:
 * Medien und Aktionen (ENTSCHIEDEN 7) - beides mündet in dieselbe `referenz` von
 * `fuegeElementHinzu`, diese Datei unterscheidet dabei NICHT (eine Operation fuer
 * beide Faelle, TK 9.5.2).
 *
 * ENTSCHIEDEN 2: NICHTS wird herausgefiltert - ein fehlendes Medium und eine kaputte
 * Aktion bleiben sichtbar UND hinzufügbar (gekennzeichnet ja, gesperrt nein).
 * ENTSCHIEDEN 3: Kein <video> in dieser Ansicht - kein Frame-Weg neben #128.
 */
export function Bibliotheksansicht(p: BibliothekEigenschaften): JSX.Element {
  // #422: Ein Projekt hat genau EIN Video. Der Medien-Bereich heisst "Video" und zeigt
  // NUR Video-Assets; Bilder sind Motiv einer Aktion (action-editor) und erscheinen hier
  // nicht mehr. Das Video ist automatisch Listeneintrag - es gibt fuer es KEIN
  // "Zur Liste hinzufuegen" mehr (das bleibt fuer AKTIONEN).
  const videos = baueMedienEintraege(p.projekt).filter((eintrag) => eintrag.typLabel === 'Video')
  const aktionen = baueAktionsEintraege(p.projekt)
  const fehlende = zaehleFehlende(videos)
  // EINE Rechnung fuer die ganze Liste - nicht je Zeile.
  const verwendungen = baueVerwendungen(p.projekt.liste)
  // 02.11.2026: Bevor ein Motiv gezeichnet werden kann, muessen die BILDER der Aktionen
  // geladen sein (sonst ist das Motiv ein Rahmen ohne Inhalt). Der Zaehler loest nach dem
  // Laden EINEN neuen Zeichenlauf aus - kein Zeitgeber, kein zweiter Zustand.
  const [motivBereit, setzeMotivBereit] = useState(0)
  useEffect(() => {
    if (p.holeMarke === undefined) return
    const eintraege = baueMotivEintraege(p.projekt)
    if (eintraege.length === 0) return
    let abgemeldet = false
    bereiteMotiveVor(p.projekt.id, eintraege)
      .then(() => {
        if (!abgemeldet) setzeMotivBereit((stand) => stand + 1)
      })
      .catch(() => {
        // Kein Bild ist ein sichtbarer Zustand; ein Wurf waere ein Absturz der Liste.
      })
    return () => {
      abgemeldet = true
    }
  }, [p.projekt.id, p.projekt.aktionen, p.projekt.assets, p.holeMarke])
  // 02.11.2026 (Sidepanel): Die Leiste schaltet zwischen den beiden Bereichen um.
  // Ohne `bereich` bleibt alles wie bisher - beide Bereiche untereinander.
  const bereich = p.bereich ?? 'alle'
  const zeigeVideo = bereich !== 'aktionen'
  const zeigeAktionen = bereich !== 'video'
  // „Ins Video" ohne Video waere ein Knopf, der nur scheitern kann. Der Zielort steht
  // dann als Hinweis im Videobereich ("Noch kein Video - importieren Sie eines.").
  const hatVideo = p.projekt.liste.some((element) => element.art === 'video')

  return (
    <div data-testid="bibliothek">
      {zeigeVideo && (
        <>
        {fehlende > 0 && (
          <div data-ton="hervorgehoben" data-testid="bibliothek-hinweis">
            {fehlende} Medium{fehlende === 1 ? '' : 'e'} fehlt{fehlende === 1 ? '' : 'en'}
          </div>
        )}

        {/* Abschnittskopf mit Trennlinie: ein 11-px-Etikett allein ging in der Rail unter
            (am Bild gesehen). Die Linie macht die Gliederung ohne Farbe lesbar. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 6px' }}>
          <h2 style={{ margin: 0 }}>Video</h2>
          <span aria-hidden="true" style={{ flex: '1 1 auto', height: 1, background: '#2c2c34' }} />
        </div>
        <button
          type="button"
          onClick={p.aufImportieren}
          data-testid="composer-medien-import"
          className={videos.length === 0 ? 'knopf-primaer' : undefined}
          style={{ width: '100%' }}
        >
          Video importieren
        </button>
        {videos.length === 0 ? (
          <p data-testid="video-leer">Noch kein Video - importieren Sie eines.</p>
        ) : (
          <ul data-testid="video-liste" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {videos.map((eintrag) => (
              <Videozeile
                key={eintrag.asset.id}
                eintrag={eintrag}
                aufMediumLoeschen={p.aufMediumLoeschen}
                ausgewaehlt={eintrag.asset.id === (p.ausgewaehltesId ?? null)}
                aufWaehlen={p.aufWaehlen}
              />
            ))}
          </ul>
        )}
        </>
      )}

      {zeigeAktionen && (
        <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 6px' }}>
          <h2 style={{ margin: 0 }}>Aktionen</h2>
          <span aria-hidden="true" style={{ flex: '1 1 auto', height: 1, background: '#2c2c34' }} />
        </div>
        {/* 03.11.2026 (Entscheidung 29.4): Der Knopf oeffnet den Aktions-Editor im Modus
            „neu" - der Editor ist der EINZIGE Anlege-Weg (Vorschau, Bild, Vorlagen-Kacheln,
            Felder nach Vorlage, „Anlegen"). Das Inline-Formular ist entfallen. */}
        {p.aufNeueAktion !== undefined && (
          <button
            type="button"
            data-testid="aktion-anlegen-oeffnen"
            onClick={p.aufNeueAktion}
            style={{ width: '100%' }}
          >
            + Neue Aktion
          </button>
        )}
        {aktionen.length === 0 ? (
          <p data-testid="aktionen-leer">Noch keine Aktionen – „+ Neue Aktion" legt die erste an.</p>
        ) : (
          <ul data-testid="aktionen-liste" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {aktionen.map((eintrag) => (
              <Aktionszeile
                key={eintrag.aktion.id}
                eintrag={eintrag}
                aufLoeschen={p.aufAktionLoeschen}
                aufBearbeiten={p.aufAktionBearbeiten}
                verwendung={verwendungen.get(eintrag.aktion.id)}
                /* 02.11.2026: Vorlage und Marke fuer das Motiv; ohne Marke zeigt die
                   Zeile nur Text (kein Ersatzbild, keine Ausnahme). */
                vorlage={(p.vorlagen ?? []).find((k) => k.id === eintrag.aktion.vorlagenId)}
                marke={p.holeMarke?.(eintrag.aktion.markeId) ?? null}
                motivBereit={motivBereit}
                aufInsVideo={p.aufInsVideo}
                hatVideo={hatVideo}
              />
            ))}
          </ul>
        )}
        </>
      )}
    </div>
  )
}

interface VideozeileEigenschaften {
  eintrag: MedienEintrag
  aufMediumLoeschen: (assetId: string) => void
  /** #418: hervorgehoben? */
  ausgewaehlt: boolean
  aufWaehlen?: (assetId: string) => void
}

function Videozeile(p: VideozeileEigenschaften): JSX.Element {
  const fehlt = p.eintrag.zustand === 'fehlt'
  // #422 (User-Weisung 15.10.2026): Ein Projekt hat EIN Video. Es ist automatisch in
  // der Wiedergabeliste - deshalb gibt es hier KEIN "Zur Liste hinzufuegen" (dieses
  // bleibt allein den Aktions-Zeilen). Import/Loeschen stehen im Bereichskopf bzw. hier.
  return (
    <li
      data-testid={`medium-${p.eintrag.asset.id}`}
      data-ausgewaehlt={p.ausgewaehlt ? 'true' : 'false'}
      onClick={p.aufWaehlen === undefined ? undefined : () => p.aufWaehlen?.(p.eintrag.asset.id)}
      style={p.ausgewaehlt ? { outline: '2px solid #e5634d', outlineOffset: -2 } : undefined}
    >
      <div
        data-ton={fehlt ? 'hervorgehoben' : 'ruhig'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 6px',
          borderRadius: 4,
          background: p.ausgewaehlt ? '#2c2c35' : 'transparent',
        }}
      >
        {/* Videos tragen in dieser Ansicht KEIN Vorschaubild (ENTSCHIEDEN 3/#128) -
            der Zweig bleibt fuer den Fall, dass ein Eintrag doch eine URL traegt. */}
        {p.eintrag.vorschauUrl ? (
          <img
            src={p.eintrag.vorschauUrl}
            alt={p.eintrag.bezeichnung}
            style={{ width: '64px', height: '36px', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ flex: '0 0 auto', fontSize: 11, color: '#74747e' }}>{p.eintrag.typLabel}</span>
        )}
        <span
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={p.eintrag.bezeichnung}
        >
          {p.eintrag.bezeichnung}
        </span>
        {fehlt && <span style={{ flex: '0 0 auto', color: '#e5634d', fontSize: 11 }}>fehlt</span>}
        <button
          type="button"
          onClick={() => p.aufMediumLoeschen(p.eintrag.asset.id)}
          style={{ flex: '0 0 auto', minHeight: 20, padding: '0 8px', fontSize: 11 }}
        >
          Löschen
        </button>
      </div>
    </li>
  )
}

interface AktionszeileEigenschaften {
  eintrag: AktionsEintrag
  /** #430: loescht die Aktion (ohne Rueckfrage, EIN Undo-Schritt). Fehlt sie, kein Knopf. */
  aufLoeschen?: (aktionId: string) => void
  /** 01.11.2026: oeffnet den Aktions-Editor ueber der Reiterflaeche. Fehlt er, kein Knopf. */
  aufBearbeiten?: (aktionId: string) => void
  /** 02.11.2026: wo die Aktion laeuft (Rueckverweis aus `verwendungen.ts`). */
  verwendung?: Verwendung
  /** 02.11.2026: Vorlage und Marke fuer das Motiv in der Zeile. */
  vorlage?: Vorlage
  marke?: Marke | null
  /** Zaehler: steigt, sobald die Motive geladen sind (loest EINEN Zeichenlauf aus). */
  motivBereit?: number
  /** 02.11.2026 („Ins Video"): der Klick-Weg. Fehlt er, gibt es keinen Knopf. */
  aufInsVideo?: (aktionId: string) => void
  /** Steht ueberhaupt ein Video, in das die Aktion gelegt werden koennte? */
  hatVideo: boolean
}

/**
 * Das Motiv einer Aktion als kleines Bild (02.11.2026).
 *
 * WARUM EIN EIGENES BAUTEIL: Das Zeichnen ist ein DOM-Vorgang und gehoert in einen Effekt,
 * nicht in den Rumpf einer Zeile - sonst zeichnete jeder Render neu. Das Bild selbst kommt
 * aus `aktions-vorschau.ts` (Speicher + Verkleinerung); hier wird es nur eingesetzt.
 */
function Aktionsbild(p: {
  aktion: Aktion
  vorlage?: Vorlage
  marke: Marke | null
  bereit: number
  /** `voll` = eigene Zeile in voller Breite (Band), eine Zahl = neben dem Titel. */
  breite: number | 'voll'
}): JSX.Element {
  const flaeche = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const ziel = flaeche.current
    if (ziel === null || p.vorlage === undefined || p.marke === null) return
    const klein = holeMotiv(p.aktion, p.vorlage, p.marke)
    if (klein === null) return
    // Nur die ECHTE Bildgroesse setzen - die Anzeige regelt das CSS ueber `width` und
    // `height: auto`. Fuer ein Canvas als ersetztes Element bleibt damit das
    // Seitenverhaeltnis erhalten: ein Band (11,85:1) wird flach, nicht gequetscht.
    ziel.width = klein.width
    ziel.height = klein.height
    ziel.getContext('2d')?.drawImage(klein, 0, 0)
  }, [p.aktion, p.vorlage, p.marke, p.bereit])

  return (
    <canvas
      ref={flaeche}
      data-testid={`aktion-bild-${p.aktion.id}`}
      // Ohne gezeichnetes Bild bleibt eine dunkle Flaeche - kein Ersatzbild, das eine
      // Vorschau behauptet, die es nicht gibt.
      style={{
        display: 'block',
        flex: '0 0 auto',
        width: p.breite === 'voll' ? '100%' : p.breite,
        height: 'auto',
        borderRadius: 3,
        background: '#0d0d10',
        border: '1px solid #34343c',
      }}
    />
  )
}

function Aktionszeile(p: AktionszeileEigenschaften): JSX.Element {
  // #413/#417: Die AKTIONS-Zeile ist die (einzige) Drag-QUELLE der Kernachse - die
  // User-Weisung 15.10.2026 stellt klar: der Drag in die Zeitleiste ist fuer AKTIONEN
  // gedacht, nicht fuer Bilder/Videos. `referenz` ist die aktionId (#123/#411).
  // Die Form der Vorlage entscheidet das Layout: null = Ganzbild, Zahl = Band.
  const istBand = p.vorlage !== undefined && p.vorlage.höhe !== null
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `quelle-aktion-${p.eintrag.aktion.id}`,
    data: { referenz: p.eintrag.aktion.id },
  })
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-testid={`aktion-${p.eintrag.aktion.id}`}
      // userSelect: die Aktions-Zeile ist Text - ohne das startet ein Ziehen mit
      // Textauswahl statt als Drag (Gegenprobe am echten Fenster, #417).
      style={{ cursor: 'grab', opacity: isDragging ? 0.6 : 1, userSelect: 'none' }}
    >
      <div
        data-ton={p.eintrag.kaputt ? 'hervorgehoben' : 'ruhig'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: 6,
          marginBottom: 4,
          border: '1px solid #34343c',
          borderRadius: 6,
          background: '#1c1c21',
        }}
      >
        {/* 02.11.2026: ZWEI FORMEN, ZWEI LAYOUTS. Ein Band ist 11,85:1 - neben dem Titel
            waere es 8 px hoch und unlesbar. Es bekommt deshalb eine EIGENE Zeile in voller
            Breite (dort sind Logo, Ueberschrift und Preis als Flecken erkennbar). Ein
            Ganzbild (16:9) steht neben dem Titel, da ist der Titel lesbar. */}
        {istBand && (
          <Aktionsbild
            aktion={p.eintrag.aktion}
            vorlage={p.vorlage}
            marke={p.marke ?? null}
            bereit={p.motivBereit ?? 0}
            breite="voll"
          />
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {!istBand && (
            <Aktionsbild
              aktion={p.eintrag.aktion}
              vorlage={p.vorlage}
              marke={p.marke ?? null}
              bereit={p.motivBereit ?? 0}
              breite={71}
            />
          )}
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: '1 1 auto' }}>
            <span
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={p.eintrag.bezeichnung}
            >
              {p.eintrag.bezeichnung}
            </span>
            {p.eintrag.kaputt && <span style={{ color: '#e5634d', fontSize: 11 }}>defekt</span>}
          </span>
        </span>
        {/* 02.11.2026 (Messlatte): WO laeuft diese Aktion? Ohne diesen Rueckverweis musste
            man die Zeitleiste absuchen - genau die Arbeit, die das Werkzeug abnehmen soll.
            Der Text kommt aus `verwendungen.ts`; hier wird NICHTS nachgerechnet. */}
        <span
          data-testid={`aktion-verwendung-${p.eintrag.aktion.id}`}
          style={{
            color: p.verwendung === undefined || p.verwendung.band === null && p.verwendung.unterbrechungen.length === 0
              ? '#6f6f7a'
              : '#9aa4b2',
            fontSize: 11,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {verwendungsText(p.verwendung)}
        </span>
        <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {/* 02.11.2026 (Messlatte): der KLICK statt des Drags. Bei 800 px ist das
              Einfuegeziel wenige Pixel breit - hier braucht es keine Zielscheibe. Was
              angelegt wird, entscheidet die Form (Band oder Unterbrechung) und steht im
              Tooltip; die Regel selbst liegt NICHT hier, sondern in `ins-video.ts`. */}
          {p.aufInsVideo !== undefined && p.hatVideo && (
            <button
              type="button"
              data-testid={`aktion-ins-video-${p.eintrag.aktion.id}`}
              style={{ flex: '1 1 100%', minHeight: 20, padding: '0 8px', fontSize: 11 }}
              title={istBand
                ? 'Haengt die Aktion als Abschnitt ans Werbeband - laeuft ab 0:00 und wiederholt sich.'
                : 'Setzt die Aktion als Unterbrechung an die Abspielmarke.'}
              onClick={() => p.aufInsVideo?.(p.eintrag.aktion.id)}
            >
              Ins Video
            </button>
          )}
          {/* 01.11.2026: „gute Aktion erstellen" direkt am Einfuegeweg (Notiz 21.10.) -
              der Editor geht als Ansicht ueber der Reiterflaeche auf, der Reiter bleibt. */}
          {p.aufBearbeiten !== undefined && (
            <button
              type="button"
              data-testid={`aktion-bearbeiten-${p.eintrag.aktion.id}`}
              style={{ flex: '0 0 auto', minHeight: 20, padding: '0 8px', fontSize: 11 }}
              onClick={() => p.aufBearbeiten?.(p.eintrag.aktion.id)}
            >
              Bearbeiten
            </button>
          )}
          {/* #430: Aktion loeschen - OHNE Rueckfrage (User-Entscheidung 16.10.2026); der
              Schritt ist in EINEM Zug rueckgaengig zu machen (TK 9.13.1). */}
          {p.aufLoeschen !== undefined && (
            <button
              type="button"
              data-testid={`aktion-loeschen-${p.eintrag.aktion.id}`}
              style={{ flex: '0 0 auto', minHeight: 20, padding: '0 8px', fontSize: 11 }}
              onClick={() => p.aufLoeschen?.(p.eintrag.aktion.id)}
            >
              Löschen
            </button>
          )}
        </span>
      </div>
    </li>
  )
}
