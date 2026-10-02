import { useState, type JSX } from "react";

import type { Project } from "../../shared/contracts/project";
import { baueMedienEintraege, zaehleFehlende } from "./bibliothek-ansicht";

const GALERIE_HÖHE_PX = 140
const GALERIE_BREITE_PX = 180

const TYPEN = ['alle', 'Video', 'Bild'] as const
type TypFilter = typeof TYPEN[number]

/** Der Filter ist EIN Textmuster × EIN Typ – keine zweite Sortierregel (Array-Reihenfolge). */
export function filtereGalerie(
  eintraege: ReturnType<typeof baueMedienEintraege>,
  suchtext: string,
  typFilter: TypFilter,
): ReturnType<typeof baueMedienEintraege> {
  const muster = suchtext.trim().toLowerCase()
  return eintraege.filter((eintrag) => {
    if (typFilter !== 'alle' && eintrag.typLabel !== typFilter) return false
    if (muster === '') return true
    return eintrag.bezeichnung.toLowerCase().includes(muster)
  })
}

export function AssetGalerie({ projekt }: { projekt: Project | null }): JSX.Element {
  const [suchtext, setzeSuchtext] = useState('')
  const [typFilter, setzeTypFilter] = useState<TypFilter>('alle')

  if (projekt === null) {
    return <div data-testid="galerie-kein-projekt" />
  }

  const alle = baueMedienEintraege(projekt)
  const fehlend = zaehleFehlende(alle)
  const sichtbare = filtereGalerie(alle, suchtext, typFilter)

  return (
    <div
      data-testid="asset-galerie"
      style={{ display: 'flex', flexDirection: 'column', minHeight: 0, padding: 8, gap: 8 }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="search"
          value={suchtext}
          placeholder="Suche …"
          data-testid="galerie-suche"
          onChange={(ereignis) => setzeSuchtext(ereignis.target.value)}
          style={{ flex: '0 0 160px', fontSize: 12 }}
        />
        {TYPEN.map((typ) => (
          <button
            key={typ}
            type="button"
            aria-pressed={typ === typFilter}
            data-testid={`galerie-filter-${typ}`}
            onClick={() => setzeTypFilter(typ)}
          >
            {typ === 'alle' ? 'Alle' : `${typ}en`}
          </button>
        ))}
        {fehlend > 0 && (
          <span data-testid="galerie-fehlend" style={{ color: '#e5634d', fontSize: 12 }}>
            {fehlend === 1 ? '1 Medium fehlt' : `${fehlend} Medien fehlen`}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, overflow: 'auto', minHeight: 0 }}>
        {sichtbare.map((eintrag) => (
          <div
            key={eintrag.asset.id}
            data-testid={`galerie-eintrag-${eintrag.asset.id}`}
            style={{
              width: GALERIE_BREITE_PX,
              height: GALERIE_HÖHE_PX,
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #444',
              borderRadius: 4,
              overflow: 'hidden',
              fontSize: 10,
              opacity: eintrag.zustand === 'fehlt' ? 0.5 : 1,
            }}
          >
            {eintrag.vorschauUrl !== null ? (
              <img
                src={eintrag.vorschauUrl}
                alt={eintrag.bezeichnung}
                draggable={false}
                style={{ flex: 1, objectFit: 'cover', minWidth: 0 }}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#222',
                  color: '#8f8f8f',
                }}
              >
                {eintrag.zustand === 'fehlt' ? 'fehlt' : eintrag.typLabel}
              </div>
            )}
            <div
              style={{ padding: '2px 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={eintrag.bezeichnung}
            >
              {eintrag.bezeichnung}
            </div>
          </div>
        ))}
        {sichtbare.length === 0 && (
          <div data-testid="galerie-leer" style={{ color: '#8f8f8f', fontSize: 12 }}>
            Keine Medien gefunden.
          </div>
        )}
      </div>
    </div>
  );
}
