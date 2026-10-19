// [project-store] setzeUnterbrechungen implementieren (#426, TK v3.26 / 9.5.2)
//
// Die Unterbrechungen eines Video-Elements sind das SEQUENZIELLE Gegenstueck zum parallelen
// Werbeband (`setzeEinblendung`, #120). Das Video bleibt EIN Listenelement; der Render
// zerlegt es frame-genau (render-service, 9.2.9). Diese Datei prueft und schreibt NUR das
// Modell - kein Render, keine Geometrie, keine Frame-Arithmetik (das TK verbietet beides
// in 9.5, s. die Meldebloecke am Dateiende).

import { holeAktivesProjekt } from './aktives-projekt'   // #192
import { planeAutoSpeicherung } from './auto-speichern'  // #47
import { mitD1Lock } from './d1-lock'                    // #32

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'   // #72
import type { Listenelement, Unterbrechung } from '../../shared/contracts/project'

export async function setzeUnterbrechungen(
  elementId: string,
  unterbrechungen: Unterbrechung[],
): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> {
  // Das Lock liegt UM ALLES (Lesen -> Pruefen -> Schreiben): Zwischen dem Nachschlagen der
  // Aktionen und dem Schreiben koennte `loescheAktion` (#39) genau eine der geprueften
  // Aktionen entfernen - im Modell stuenden danach Einschuebe, deren `aktionRef` ins Leere
  // zeigt (dieselbe Begruendung wie in setze-einblendung.ts).
  return mitD1Lock(async (): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> => {
    const projekt = holeAktivesProjekt()
    if (projekt === null) {
      return fehler('kein_projekt', 'Es ist kein Projekt geoeffnet; es wurde nichts geaendert.')
    }

    const element = projekt.liste.find((eintrag) => eintrag.id === elementId)
    if (element === undefined) {
      return fehler('nicht_gefunden', 'Zu dieser Kennung gibt es kein Element in der Wiedergabeliste.')
    }

    if (element.art !== 'video') {
      // "Ein Werbeband gibt es nur bei Video-Elementen" gilt sinngemaess auch fuer die
      // Unterbrechung: nur ein laufendes Video kann pausiert werden (TK 9.11.3: nur video).
      return fehler(
        'ungueltige_eingabe',
        `Unterbrechungen gibt es nur bei Video-Elementen; dieses Element ist ein ${element.art}-Element.`,
      )
    }

    // Die gespielte Videodauer OHNE Frame-Arithmetik: der rohe Ausschnitt. `zeitstelle` ist
    // eine Zeit AB 0 der getrimmten Sicht (TK 9.11.3), also ist `trimEnde - trimStart` die
    // Obergrenze. Die Frame-Rundung liegt im render-service (9.2.6) - zwei rundende Stellen
    // waeren zwei Regeln (dieselbe Linie wie setze-trim.ts/#44).
    const start = element.trimStart
    const ende = element.trimEnde
    if (typeof start !== 'number' || !Number.isFinite(start) || typeof ende !== 'number' || !Number.isFinite(ende) || ende <= start) {
      return fehler(
        'ungueltige_eingabe',
        'Das Video hat keinen brauchbaren Ausschnitt; ohne ihn laesst sich keine Zeitstelle pruefen.',
      )
    }
    const videoDauer = ende - start

    // PRUEFEN VOR JEDER WIRKUNG: `pruefe` baut die Liste NEU auf (kein Teiluebernehmen).
    const geprueft = pruefe(unterbrechungen, videoDauer, (aktionId) =>
      projekt.aktionen.some((aktion) => aktion.id === aktionId),
    )
    if (!geprueft.ok) {
      return geprueft
    }

    // AB HIER WIRKT ES. Zugewiesen wird das in `pruefe` neu gebaute Array, NICHT das
    // hereingereichte - ein Fremdfeld am Eintrag faellt dabei weg (TK 9.11.3: nur
    // `zeitstelle`/`aktionRef`/`dauer`).
    element.unterbrechungen = geprueft.wert

    // Entprellt, KEIN sofortFlush (Instant-Operation, TK 9.5.4).
    planeAutoSpeicherung(projekt)

    return { ok: true, wert: element }
  })
}

/**
 * Prueft die Liste vollstaendig und baut sie neu auf (TK 9.5.2):
 * jede `zeitstelle` in `(0, videoDauer)`, `dauer > 0`, JEDER `aktionRef` existiert,
 * aufsteigend nach `zeitstelle` - zwei Einschuebe an derselben Stelle sind nicht darstellbar.
 *
 * Ein leeres Array ist GUELTIG (alle Unterbrechungen entfernt) - es bleibt `[]`, das
 * Videoelement bleibt (TK 9.5.3).
 */
function pruefe(
  unterbrechungen: Unterbrechung[],
  videoDauer: number,
  istBekannteAktion: (aktionId: string) => boolean,
): Ergebnis<Unterbrechung[], ProjectStoreFehlercode> {
  if (!Array.isArray(unterbrechungen)) {
    return fehler('ungueltige_eingabe', 'Die Unterbrechungen muessen als Liste uebergeben werden.')
  }

  const gebaut: Unterbrechung[] = []
  let vorherige = 0

  for (const eintrag of unterbrechungen as unknown[]) {
    if (typeof eintrag !== 'object' || eintrag === null || Array.isArray(eintrag)) {
      return fehler('ungueltige_eingabe', 'Jede Unterbrechung muss ein Objekt mit Zeitstelle, Aktion und Dauer sein.')
    }
    const { zeitstelle, aktionRef, dauer } = eintrag as {
      zeitstelle?: unknown
      aktionRef?: unknown
      dauer?: unknown
    }

    // `Number.isFinite` vor JEDEM Vergleich: jeder Vergleich mit NaN ist falsch (setze-trim.ts).
    if (!Number.isFinite(zeitstelle)) {
      return fehler('ungueltige_eingabe', 'Die Zeitstelle einer Unterbrechung muss eine Zahl in Sekunden sein.')
    }
    const z = zeitstelle as number
    if (!(z > 0) || !(z < videoDauer)) {
      return fehler(
        'ungueltige_eingabe',
        `Die Zeitstelle ${z} s liegt nicht innerhalb des Videos (0 s bis ${videoDauer} s).`,
      )
    }
    if (!(z > vorherige)) {
      return fehler(
        'ungueltige_eingabe',
        'Die Unterbrechungen muessen nach ihrer Zeitstelle aufsteigend und ohne doppelte Stelle sein.',
      )
    }

    if (typeof aktionRef !== 'string' || aktionRef.trim() === '') {
      return fehler('ungueltige_eingabe', 'Zu einer Unterbrechung fehlt die Angabe der Aktion.')
    }

    if (!Number.isFinite(dauer) || (dauer as number) <= 0) {
      return fehler('ungueltige_eingabe', 'Die Dauer einer Unterbrechung muss groesser als null Sekunden sein.')
    }

    if (!istBekannteAktion(aktionRef)) {
      // `nicht_gefunden`, NICHT `ungueltige_eingabe`: Es geht um einen Verweis auf ein
      // Fachobjekt (wie beim Band-Abschnitt, setze-einblendung.ts).
      return {
        ok: false,
        fehler: {
          code: 'nicht_gefunden',
          meldung: 'Eine Unterbrechung verweist auf eine Aktion, die es in diesem Projekt nicht gibt.',
        },
      }
    }

    // Neu gebaut, Feld fuer Feld - kein Weiterreichen des hereingereichten Objekts.
    gebaut.push({ zeitstelle: z, aktionRef, dauer: dauer as number })
    vorherige = z
  }

  return { ok: true, wert: gebaut }
}

function fehler<T>(
  code: 'kein_projekt' | 'nicht_gefunden' | 'ungueltige_eingabe' | ProjectStoreFehlercode,
  meldung: string,
): Ergebnis<T, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// ---------------------------------------------------------------------------
// WAS HIER BEWUSST NICHT STEHT - UND GEMELDET IST
//
// 1. KEINE FRAME-ARITHMETIK: kein RENDER_PROFILE, keine Bildrate, keine Rundung auf das
//    Ausgaberaster. Gespeichert werden rohe Sekunden; die Frame-Rundung liegt im
//    render-service (9.2.6/9.2.9) - dieselbe Linie wie setze-trim.ts (#44).
// 2. KEINE OBERGRENZE FUER `unterbrechungen[].dauer` AUSSER `> 0`. Ob eine Obergrenze gilt
//    (wie DAUER_BEREICH 10-45 s fuer Listenelemente), ist nicht hier festgelegt; das Band
//    handhabt es genauso (setze-einblendung.ts, Meldeblock 4).
// 3. KEIN ANFASSEN VON `trimStart`/`trimEnde`/`dauer`/`einblendung` - nur `unterbrechungen`.
// 4. KEIN UNDO-SCHNAPPSCHUSS - den legt die Huelle um die Projekt-Sicht (#243, 9.13.2).
// 5. KEIN IPC-KANAL hier - Verdrahtung im ipc-gateway (project-store-nachtrag.ts, Eintrag 5).
