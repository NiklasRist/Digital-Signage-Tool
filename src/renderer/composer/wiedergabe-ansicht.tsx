import { useEffect, useRef, useState, type JSX } from "react";

import type { Project } from "../../shared/contracts/project";
import { holeSicht, aufSichtGeaendert, type Projektsicht } from "./projektzustand";
import { entferneElementAusListe } from "./element-entfernen";
import { registriereTastaturHandler } from "../app-shell/tastatur";
import { AssetGalerie } from "./asset-galerie";
import { Statistik } from "./statistik";
import { Zeitleiste } from "./zeitleiste";
import { baueAktionsEintraege } from "./bibliothek-ansicht";
import { FehlerMarkierung, ordneFehlerZu } from "./fehler-markierung";
import { KontextMenue, type MenueAdresse } from "./kontext-menu";

const FEHLERFARBE = '#e5634d'

/** Der Projektstand als React-Zustand: erst holen (`holeSicht`), dann abonnieren. */
export function nutzeProjektsicht(): Projektsicht {
  const [sicht, setzeSicht] = useState<Projektsicht>(() => holeSicht());

  useEffect(() => aufSichtGeaendert(setzeSicht), []);

  return sicht;
}

export function WiedergabeZusammen(): JSX.Element {
  const sicht = nutzeProjektsicht();
  const projekt: Project | null = sicht.projekt;

  // Die Auswahl ist EINE Menge von Listen-Indizes. Plain-Klick = EIN Eintrag,
  // Strg/Super-Klick = Einzelauswahl umschalten, Shift-Klick = Bereich vom Anker.
  const [auswahl, setzeAuswahl] = useState<ReadonlySet<number>>(() => new Set<number>());
  const [menueAdresse, setzeMenueAdresse] = useState<MenueAdresse | null>(null);
  const ankerRef = useRef<number>(0);

  const waehle = (index: number, shift: boolean, strg: boolean): void => {
    setzeAuswahl((bisher) => {
      if (shift) {
        const start = Math.min(ankerRef.current, index);
        const bereich = new Set<number>();
        for (let stelle = start; stelle <= Math.max(ankerRef.current, index); stelle += 1) {
          bereich.add(stelle);
        }
        return bereich;
      }
      if (strg) {
        const neu = new Set(bisher);
        if (neu.has(index)) neu.delete(index);
        else neu.add(index);
        return neu;
      }
      ankerRef.current = index;
      return new Set<number>([index]);
    });
    if (!shift && !strg) ankerRef.current = index;
  };

  const markiereAnker = (index: number): void => {
    ankerRef.current = index;
  };

  useEffect(() => {
    return registriereTastaturHandler({
      abspielenOderPausiere: () => {
        window.dispatchEvent(new Event('buehne-umschalten'));
      },
      entferneMarkiert: () => {
        if (projekt === null) return;
        // Die Gruppe wird KLEIN nach GROSS entfernt - die Indizes im Array verschieben
        // sich beim Entfernen nicht (die Freigabe läuft über die IDs), aber sauberer
        // ist es, das entfernte Element je Kennung anzufassen.
        for (const stelle of [...auswahl].sort((a, b) => b - a)) {
          const element = projekt.liste[stelle];
          if (element === undefined) continue;
          void entferneElementAusListe(element.id);
        }
      },
      rueckgaengig: () => {},
      wiederherstellen: () => {},
      links: () => {
        setzeAuswahl(() => {
          const letzte = Math.max(-1, ...[...auswahl]);
          const ziel = letzte <= 0 ? 0 : letzte - 1;
          markiereAnker(ziel);
          return new Set<number>([ziel]);
        });
      },
      rechts: () => {
        if (projekt === null) return;
        setzeAuswahl(() => {
          const letzte = auswahl.size === 0 ? -1 : Math.max(...auswahl);
          const ziel = Math.min(projekt.liste.length - 1, letzte + 1);
          if (ziel < 0) return new Set<number>();
          markiereAnker(ziel);
          return new Set<number>([ziel]);
        });
      },
      runter: () => {
        if (projekt === null) return;
        setzeAuswahl(() => {
          const letzte = auswahl.size === 0 ? -1 : Math.max(...auswahl);
          const ziel = Math.min(projekt.liste.length - 1, letzte + 1);
          if (ziel < 0) return new Set<number>();
          markiereAnker(ziel);
          return new Set<number>([ziel]);
        });
      },
      hoch: () => {
        setzeAuswahl(() => {
          const letzte = Math.max(-1, ...[...auswahl]);
          const ziel = letzte <= 0 ? 0 : letzte - 1;
          markiereAnker(ziel);
          return new Set<number>([ziel]);
        });
      },
    });
  }, [auswahl, projekt, menueAdresse]);

  if (
    projekt === null ||
    (projekt.liste.length === 0 && auswahl.size > 0)
  ) {
    if (auswahl.size > 0) setzeAuswahl(new Set<number>());
  }

  const fehler = projekt !== null ? ordneFehlerZu(projekt) : null;

  return (
    <div
      data-testid="wiedergabe-zusammen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        padding: 8,
        gap: 8,
      }}
    >
      <div style={{ flex: '0 0 auto' }}>
        {sicht.ladefehler !== null && (
          <div data-testid="wiedergabe-ladefehler" style={{ color: FEHLERFARBE, fontSize: 12 }}>
            {sicht.ladefehler.meldung}
          </div>
        )}
        {sicht.projekt === null && (
          <div data-testid="wiedergabe-kein-projekt" style={{ color: '#8f8f8f', fontSize: 12 }}>
            Kein Projekt geladen – im Reiter Projekte öffnen.
          </div>
        )}
        {projekt !== null && <FehlerMarkierung projekt={projekt} />}
        <Statistik liste={projekt?.liste ?? []} />
      </div>

      <div style={{ flex: '0 0 auto' }}>
        <AssetGalerie projekt={projekt} />
      </div>

      <Zeitleiste projekt={projekt} />

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {projekt === null ? null : (
          <ul data-testid="wiedergabe-liste" style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 12 }}>
            {projekt.liste.map((element, index) => (
              <li
                key={element.id}
                data-testid={`wiedergabe-zeile-${index}`}
                onClick={(ereignis) => {
                  waehle(index, ereignis.shiftKey, ereignis.ctrlKey || ereignis.metaKey);
                  markiereAnker(index);
                }}
                onContextMenu={(ereignis) => {
                  ereignis.preventDefault();
                  if (!auswahl.has(index)) {
                    setzeAuswahl(new Set<number>([index]));
                    markiereAnker(index);
                  }
                  setzeMenueAdresse({ elementId: element.id, x: ereignis.clientX, y: ereignis.clientY });
                }}
                style={{
                  padding: '2px 0',
                  cursor: 'pointer',
                  background: auswahl.has(index) ? 'rgba(255,255,255,0.08)' : undefined,
                  color: fehler !== null && fehler.has(element.id) ? FEHLERFARBE : undefined,
                }}
              >
                {element.art === 'video' ? 'Video' : 'Segment'} · Element {index + 1}
                {fehler !== null && fehler.has(element.id) && (
                  <span title="Kaputte Stelle – siehe Reparatur" style={{ marginLeft: 6 }}>
                    ⚠
                  </span>
                )}
              </li>
            ))}
            {projekt.liste.length === 0 && (
              <li style={{ color: '#8f8f8f' }}>Leere Wiedergabeliste</li>
            )}
          </ul>
        )}
        {projekt !== null && (
          <AktionenProjekt projekt={projekt} />
        )}
      </div>

      {projekt !== null && menueAdresse !== null && (
        <KontextMenue projekt={projekt} adresse={menueAdresse} schliesse={() => setzeMenueAdresse(null)} />
      )}
    </div>
  );
}

function AktionenProjekt({ projekt }: { projekt: Project }): JSX.Element | null {
  const eintraege = baueAktionsEintraege(projekt);
  return (
    <ul data-testid="wiedergabe-aktionen" style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 12 }}>
      {eintraege.map((eintrag) => (
        <li key={eintrag.aktion.id} style={{ padding: '2px 0', color: eintrag.kaputt ? FEHLERFARBE : undefined }}>
          Aktion · {eintrag.bezeichnung}
        </li>
      ))}
    </ul>
  );
}
