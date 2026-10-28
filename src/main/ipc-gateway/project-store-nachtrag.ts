// [ipc-gateway] Die nachgetragenen project-store-Kanaele verdrahten (fuenf Eintraege)

import { KANAELE } from '../../shared/contracts/kanaele'                     // #25
import { setzeEinblendung } from '../project-store/setze-einblendung'        // #120
import { setzeElementReferenz } from '../project-store/setze-element-referenz' // #152
import { setzeBearbeitungsstand } from '../project-store/bearbeitungsstand'  // #240
import { öffneProjektordner } from '../project-store/oeffne-projektordner'   // #240
import { leseMarke } from '../marken-store/lese-marke'                       // #283
import { setzeStandardMarke } from '../project-store/setze-standard-marke'   // #323
import { setzeStandardSegmentdauer } from '../project-store/setze-standard-segmentdauer' // #334
import { setzeUnterbrechungen } from '../project-store/setze-unterbrechungen' // #426
// Die vier Nutzlast-Pruefer liegen seit #332 an EINEM Ort - importiert, NICHT kopiert.
// Genau die vierfache Kopie war der Anlass fuer #332; eine fuenfte waere der Rueckfall.
import { abgelehnt, istGefuellterText, istObjekt } from './nutzlast-pruefer'  // #332
// Die lokale Kopie ist mit #337 entfallen - EINE `meldeAn` (#333).
import { meldeAn } from './melde-an'                                          // #337

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Bearbeitungsstand, Einblendung, Project, Unterbrechung } from '../../shared/contracts/project'

// Signaturen weichen an ZWEI Stellen vom Issue-Text ab (Vermerk 1 am Dateiende):
// `Ergebnis<Listenelement>` im Issue, gebaut mit `ProjectStoreFehlercode`. Fuer diese Datei
// folgenlos - sie reicht die Huelle durch und leitet `F` aus dem Rueckruf ab.

export function verdrahteProjectStoreNachtragIPC(): void {
  // Beide Namen kommen aus der Registry (#25); in dieser Datei steht kein einziger
  // Kanalname als Zeichenkette - auch nicht in einer Fehlermeldung.
  //
  // KEIN Schutz gegen einen zweiten Aufruf dieser Funktion (kein "schon registriert"-Merker):
  // #3 ruft genau einmal, und `ipcMain.handle` wirft bei doppelter Anmeldung von sich aus.
  // Der Wurf faellt beim Start des Hauptprozesses an und SOLL auffallen - er ist gerade die
  // Probe darauf, dass sich die Namensraeume von #76 und dieser Datei nicht ueberschneiden.
  //
  // KEIN Ereignis, keine Fensterreferenz, kein Zustand, kein eigenes try/catch (das gehoert
  // dem Wrapper #23), kein Lock, kein Dateizugriff.

  meldeAn(
    KANAELE.project.setzeEinblendung,
    // Der ausgeschriebene Rueckgabetyp steht ABSICHTLICH da: Er legt `W` der Huelle fest,
    // bevor der zweite Rueckruf getippt wird.
    (
      nutzlast: unknown,
    ): Ergebnis<{ elementId: string; einblendung: Einblendung | null }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('setzeEinblendung erwartet ein Objekt { elementId, einblendung }.')
      }
      // Erst in eine Konstante, dann pruefen: An einer Konstanten greift die Verengung durch
      // die Waechterfunktionen verlaesslich, an einem Feld eines Record-Typs nicht ueberall.
      const elementId = nutzlast.elementId
      if (!istGefuellterText(elementId)) {
        return abgelehnt('setzeEinblendung braucht eine nicht leere elementId.')
      }

      const einblendung = nutzlast.einblendung
      // DAS FEHLENDE FELD IST EIN FEHLER, KEIN `null`. `null` heisst "Band entfernen"
      // (#120) - eine loeschende Handlung. Wuerde ein fehlendes Feld als `null` gelesen,
      // vernichtete ein Fluechtigkeitsfehler in der Oberflaeche stillschweigend die Arbeit
      // des Nutzers. Bewusst ANDERS als `höhe` in #109, wo `null` der harmlose Normalfall
      // ist. Die Pruefung auf `undefined` deckt beide Formen ab - Feld gar nicht gesetzt und
      // Feld ausdruecklich `undefined` -, und das ist noetig, weil die Strukturklonung an
      // der IPC-Grenze ein `undefined`-Feld ohnehin nicht von einem fehlenden unterscheidet.
      //
      // GEMESSEN, nicht behauptet: Diese Wache allein zu entfernen aendert das Verhalten
      // NICHT - die Formpruefung darunter weist `undefined` ebenfalls ab. Sie steht trotzdem
      // hier, weil sie den ENTSCHEIDENDEN Fall benennt und ihn mit eigener Meldung abweist;
      // was wirklich beisst, ist die Vorbelegung (`nutzlast.einblendung ?? null`), und genau
      // die verbietet dieser Absatz. Beides ist als Gegenprobe belegt.
      if (einblendung === undefined) {
        return abgelehnt('setzeEinblendung braucht das Feld einblendung (Objekt oder null).')
      }
      // NUR die FORM wird geprueft. Die Felder des Bandes - `bandVorlageId`, `abschnitte`,
      // deren `dauer > 0`, die Existenz der Aktionen und die gerade Bandhoehe - prueft #120;
      // eine zweite, leicht abweichende Fachpruefung an dieser Stelle waere schlimmer als
      // keine. `istObjekt` weist dabei Arrays, Strings und Zahlen zurueck.
      if (einblendung !== null && !istObjekt(einblendung)) {
        return abgelehnt('setzeEinblendung erwartet fuer einblendung ein Objekt oder null.')
      }

      // Die Behauptung `as Einblendung | null` ist NICHT geprueft und soll es hier auch
      // nicht sein: Geprueft ist "Objekt oder null", und die feldweise Pruefung liegt in
      // #120. Sie steht an genau dieser einen Stelle, damit sie nachlesbar bleibt.
      // SAFETY: istObjekt/istNull hat die Objekt-oder-null-Form belegt; die feldweise
      // Fachpruefung uebernimmt #120 (Ergebnis-Huelle statt Wurf).
      //
      // NUR die zwei erwarteten Felder reisen weiter; ein Fremdfeld landete ueber die
      // Operation in project.json und bliebe dort. Das Band selbst wird dabei als DIESELBE
      // Objektreferenz durchgereicht - nicht kopiert, nicht ergaenzt, nicht getrimmt.
      return { ok: true, wert: { elementId, einblendung: einblendung as Einblendung | null } }
    },
    ({ elementId, einblendung }) => setzeEinblendung(elementId, einblendung),
  )

  meldeAn(
    KANAELE.project.setzeElementReferenz,
    (nutzlast: unknown): Ergebnis<{ elementId: string; referenz: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('setzeElementReferenz erwartet ein Objekt { elementId, referenz }.')
      }
      const elementId = nutzlast.elementId
      if (!istGefuellterText(elementId)) {
        return abgelehnt('setzeElementReferenz braucht eine nicht leere elementId.')
      }
      const referenz = nutzlast.referenz
      if (!istGefuellterText(referenz)) {
        return abgelehnt('setzeElementReferenz braucht eine nicht leere referenz.')
      }
      // KEINE UUID-Formpruefung, und das ist eine Festlegung: #76 hat die schaerfere Pruefung
      // (UUID-Form, kein Pfadtrenner, kein '..') ausdruecklich NUR fuer `listeAusgaben`
      // eingefuehrt, weil dessen `projektId` am Ende der Kette zu einem PFADSEGMENT wird.
      // `elementId` und `referenz` werden nie zu einem Pfad - sie werden ausschliesslich mit
      // IDs im bereits geladenen Projekt verglichen (#152). Ob die Referenz im richtigen
      // Bestand liegt (assets vs. aktionen, passender typ), entscheidet ebenfalls #152.
      return { ok: true, wert: { elementId, referenz } }
    },
    ({ elementId, referenz }) => setzeElementReferenz(elementId, referenz),
  )
}

// ---------------------------------------------------------------------------------------
// Die vier weiteren project-store-Nachtraege (#240, #323, #334, #426)
//
// WARUM SIE HIER STEHEN UND NICHT MEHR IN EIGENEN DATEIEN (Q3, 19.10.2026): Die Aufteilung
// entstand aus der Sorge, eine Stammdatei duerfe ihre Eintragszahl nicht ueberschreiten.
// Diese Grenze ist NIRGENDS geprueft; sie stand nur in Kommentaren. Die fuenf EINTRAEGE
// bleiben getrennt, weil die Positionen 1-14 in `main/index.ts` Vertrag aus #3 sind - die
// Zerlegung in fuenf DATEIEN hatte dagegen keinen Traeger mehr.

export function verdrahteProjectStoreNachtrag2IPC(): void {
  meldeAn(KANAELE.project.setzeBearbeitungsstand, (nutzlast: unknown): Ergebnis<Bearbeitungsstand, 'ungueltige_eingabe'> => {
    if (!istObjekt(nutzlast)) return abgelehnt('setzeBearbeitungsstand erwartet ein Objekt { stand }.')
    const stand = nutzlast.stand
    if (typeof stand !== 'object' || stand === null) {
      return abgelehnt('setzeBearbeitungsstand braucht einen Stand als Objekt.')
    }
    const roh = stand as { aktionen?: unknown; liste?: unknown }
    if (!Array.isArray(roh.aktionen) || !Array.isArray(roh.liste)) {
      return abgelehnt('Der Stand braucht aktionen und liste als Arrays.')
    }
    return { ok: true, wert: stand as Bearbeitungsstand }
  }, (stand) => setzeBearbeitungsstand(stand))

  meldeAn(
    KANAELE.project.öffneProjektordner,
    (nutzlast: unknown): Ergebnis<{ projektId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('oeffneProjektordner erwartet ein Objekt { projektId }.')
      const projektId = nutzlast.projektId
      if (!istGefuellterText(projektId)) {
        return abgelehnt('oeffneProjektordner braucht eine nicht leere projektId.')
      }
      return { ok: true, wert: { projektId } }
    },
    ({ projektId }) => öffneProjektordner(projektId),
  )
}

interface StandardMarkenNutzlast {
  projektId: string
  markeId: string
}

function pruefeStandardMarke(nutzlast: unknown): Ergebnis<StandardMarkenNutzlast, 'ungueltige_eingabe'> {
  if (!istObjekt(nutzlast)) {
    return abgelehnt('setzeStandardMarke erwartet ein Objekt { projektId, markeId }.')
  }
  if (!istGefuellterText(nutzlast.projektId)) {
    return abgelehnt('setzeStandardMarke braucht eine nicht leere projektId.')
  }
  if (!istGefuellterText(nutzlast.markeId)) {
    return abgelehnt('setzeStandardMarke braucht eine nicht leere markeId.')
  }
  // SAFETY: Form belegt (zwei gefuellte Texte). Ob die markeId existiert, prueft
  // der Handler hier unten; ob das Projekt existiert, prueft die Operation selbst
  return { ok: true, wert: { projektId: nutzlast.projektId, markeId: nutzlast.markeId } }
}

export function verdrahteProjectStoreNachtrag3IPC(): void {
  // GENAU EIN Kanal; KEIN Schutz gegen zweiten Aufruf (wie #334), kein Fenster,
  // kein Zustand, kein zweites Lock um die Operation.
  meldeAn<StandardMarkenNutzlast, Project, string>(
    KANAELE.project.setzeStandardMarke,
    pruefeStandardMarke,
    async ({ projektId, markeId }) => {
      // Die Existenz prueft der Handler, NICHT der Store (TK 9.5.2). Ein Fehler
      // der Pruefung reist UNVERAENDERT; ohne Pruefergebnis laeuft der Store NICHT.
      const marke = await leseMarke(markeId)
      if (!marke.ok) return marke
      return setzeStandardMarke(projektId, markeId)
    },
  )
}

export function verdrahteProjectStoreNachtrag4IPC(): void {
  // KEIN Schutz gegen einen zweiten Aufruf: #3 ruft genau einmal, und `ipcMain.handle`
  // wirft bei doppelter Anmeldung von sich aus - das SOLL auffallen. Kein Ereignis,
  // keine Fensterreferenz, kein Zustand, kein eigenes try/catch (das gehoert dem
  // Wrapper #23), kein Lock (die Operation nimmt das D1-Lock selbst).
  meldeAn(
    KANAELE.project.setzeStandardSegmentdauer,
    // Der ausgeschriebene Rueckgabetyp legt `W` fest, bevor der zweite Rueckruf getippt wird.
    (
      nutzlast: unknown,
    ): Ergebnis<{ dauer: number; festzuschreibendeAktionen: string[] }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt(
          'setzeStandardSegmentdauer erwartet ein Objekt { dauer, festzuschreibendeAktionen }.',
        )
      }
      // NUR die FORM wird geprueft: endliche Zahl und Feld vorhanden. Den Bereich
      // 10-45 s prueft ausschliesslich die Operation selbst (#334, gegen DAUER_BEREICH) -
      // eine zweite Fachpruefung an dieser Stelle waere schlimmer als keine.
      const dauer = nutzlast.dauer
      if (typeof dauer !== 'number' || !Number.isFinite(dauer)) {
        return abgelehnt('setzeStandardSegmentdauer braucht eine endliche Zahl dauer.')
      }

      const aktionen = nutzlast.festzuschreibendeAktionen
      if (!Array.isArray(aktionen)) {
        return abgelehnt(
          'setzeStandardSegmentdauer braucht ein Array festzuschreibendeAktionen.',
        )
      }
      for (const id of aktionen) {
        if (!istGefuellterText(id)) {
          return abgelehnt(
            'setzeStandardSegmentdauer braucht in festzuschreibendeAktionen nur nicht leere Aktions-IDs.',
          )
        }
      }

      // SAFETY: Form ist belegt (Zahl, String-Array); die Existenz der IDs im geladenen
      // Projekt und der Dauer-Bereich sind Fachpruefung der Operation (#334).
      return {
        ok: true,
        wert: { dauer, festzuschreibendeAktionen: aktionen as string[] },
      }
    },
    ({ dauer, festzuschreibendeAktionen }) =>
      setzeStandardSegmentdauer(dauer, festzuschreibendeAktionen),
  )
}

export function verdrahteProjectStoreNachtrag5IPC(): void {
  // KEIN Schutz gegen einen zweiten Aufruf: #3 ruft genau einmal, und `ipcMain.handle`
  // wirft bei doppelter Anmeldung von sich aus. Kein Ereignis, keine Fensterreferenz, kein
  // Zustand, kein eigenes try/catch (das gehoert dem Wrapper #23), kein Lock (nimmt die
  // Operation selbst).
  meldeAn(
    KANAELE.project.setzeUnterbrechungen,
    // Der ausgeschriebene Rueckgabetyp legt `W` fest, bevor der zweite Rueckruf getippt wird.
    (
      nutzlast: unknown,
    ): Ergebnis<{ elementId: string; unterbrechungen: Unterbrechung[] }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('setzeUnterbrechungen erwartet ein Objekt { elementId, unterbrechungen }.')
      }
      const elementId = nutzlast.elementId
      if (!istGefuellterText(elementId)) {
        return abgelehnt('setzeUnterbrechungen braucht eine nicht leere elementId.')
      }
      // NUR die FORM wird geprueft: es muss eine Liste sein. Die Eintraege (Zeitstelle,
      // Aktion, Dauer, Reihenfolge) prueft ausschliesslich die Operation (#426) - eine
      // zweite, leicht abweichende Fachpruefung hier waere schlimmer als keine.
      const unterbrechungen = nutzlast.unterbrechungen
      if (!Array.isArray(unterbrechungen)) {
        return abgelehnt('setzeUnterbrechungen braucht ein Array unterbrechungen.')
      }
      // SAFETY: Form ist belegt (Array); die feldweise Pruefung liegt in #426.
      return {
        ok: true,
        wert: { elementId, unterbrechungen: unterbrechungen as Unterbrechung[] },
      }
    },
    ({ elementId, unterbrechungen }) => setzeUnterbrechungen(elementId, unterbrechungen),
  )
}

// ---------------------------------------------------------------------------------------
// VERMERKE (Befunde aus dem Bau, KEINE Arbeitsauftraege an diese Datei)
//
// 1. SIGNATUR-ABWEICHUNG ZUM ISSUE-TEXT, offen benannt: #153 schreibt beide Operationen als
//    `Promise<Ergebnis<Listenelement>>` aus. GEBAUT sind sie als
//    `Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>>`
//    ('speicher_fehler' | 'projekt_beschaeftigt' | 'kein_projekt'). Der gebaute Code gewinnt;
//    diese Datei schreibt den Rueckgabetyp nirgends aus, sondern leitet `F` aus dem Rueckruf
//    ab - die zusaetzlichen Codes reisen dadurch unbeschnitten zum Renderer. Dieselbe
//    Abweichung ist bereits fuer elf Operationen in #76 vermerkt.
//
// 2. ERLEDIGT mit #337 (Q3/A, 19.10.2026): Es gibt genau EINE `meldeAn`
//    (`ipc-gateway/melde-an.ts`); die Kopien in den fuenf Nachträgen und im
//    vorlagen-store sind entfallen.
//
// 3. WEITERHIN OFFEN, hier nur gemeldet: `project:autoSpeichernStatus` (#47) hat im Main
//    KEINEN Sender. Die Empfangsseite im Renderer gibt es (#151, `abonniere`), #76 verbietet
//    sich den Sender ausdruecklich, und dieses Issue tut es ebenso. Solange die Luecke
//    besteht, kann `app-shell` den Hinweis "nicht gespeichert" (NFA-02, TK 9.5.4) nicht
//    zeigen. Zustaendig ist #238.
//
// 4. ERLEDIGT: `verdrahteProjectStoreNachtragIPC()` (und die vier weiteren Nachträge)
//    stehen in `src/main/index.ts` in Schritt 5 an ihren Positionen; die Kanäle sind im
//    laufenden Programm angemeldet.
