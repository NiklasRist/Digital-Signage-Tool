// Die Modul-Wurzel des Aktions-Editors (#250 / M7-57).
//
// UMBAU 04.11.2026 (Niklas: „der aktionseditor muss stark überarbeitet werden"):
//
//   VORHER: drei Spalten - Bibliothek 260 px (Textzeilen), Vorschau, Formular 320 px mit
//   acht Bloecken untereinander. Geschrieben wurde je Feld beim Verlassen (Modus
//   „bestehend") bzw. nur ueber „Anlegen" (Modus „neu") - zwei Modelle in einem Fenster.
//
//   JETZT: eine Kopfleiste (Zurueck, Titel, Abschluss), ein Bildstreifen 96 px, die
//   Buehne und ein Inspector 340 px mit fuenf Schritten in der Reihenfolge der Arbeit
//   (dasselbe Muster wie der Marken-Editor, #455 - eine Editor-Grammatik in der App).
//
//   EIN Speichermodell: `entwurf` ist die EINZIGE Wahrheit. Jedes Feld schreibt in den
//   Entwurf (kein IPC), die Vorschau zeichnet den Entwurf. Geschrieben wird beim
//   Abschluss („Fertig"/„Anlegen"), beim Wechsel auf eine andere Aktion und beim
//   Verlassen der Ansicht - je EIN Schreibvorgang, also EIN Undo-Schritt (TK 9.13.1).
//
// ENTSCHEIDENDE REGELN (verbindlich; Details in aktions-montage.ts):
//  - Der neue Stand geht nach JEDER erfolgreichen Mutation ueber
//    projekt.setzeProjekt(mitAktion(projekt, aktion)) in die gemeinsame Sicht - ueber den
//    UMHUELLTEN Zugang (#243/#244), damit der Undo-Schnappschuss von selbst entsteht.
//  - Die Lage = WERT (EditorLage aus aktions-montage); die Hervorhebung aus der
//    Reparatur-Fuehrung (#201) wird in einem Effekt AUF AENDERUNG ausgewertet.
//  - Loeschvorschau VOR dem Absenden (#142) mit ZAHLEN, nicht Kennungen; nach dem
//    erfolgreichen loescheAktion geht der ZURUECKGEGEBENE stand ueber setzeProjekt in die
//    Sicht (ENTSCHIEDEN 6).
//  - Vorbereitung: bereiteVorschauVor (#140) beim Aufbau mit offenem Projekt und erneut,
//    wenn sich aktionen/assets aendern; gezeichnet wird aus zeichnen.hole()?.vorlagen.
//    Ohne Vorbereitung KEIN zeichneVorschau (wirft sonst).
//  - KEIN IPC ausser ueber die M-Funktionen, kein Undo-Stapel (der umhuellte Zugang macht
//    das), kein Abonnieren von queue:geaendert (#199 ist der einzige Auswerter).

import { useEffect, useRef, useState, type JSX } from 'react'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { ProduktfotoKandidat } from '../../shared/contracts/produktabruf'
import { normalisiereProduktUrl } from '../../shared/produkt-url'
import { motivSchluessel } from '../../shared/aufbereitung'
import type { ZeichenZugang, VorlagenZugang, ProjektZugang, MarkenZugang } from '../app-shell/sichten'
import { holeBereiteMarke } from '../gemeinsam/marken-bereitstellung'
import { holeMotiv } from '../gemeinsam/aktions-motiv'
import { schliesseAktionenAnsicht, setzeSchliessenWaechter } from '../gemeinsam/aktionen-ansicht'
import { merkeLetzteVorlage, vorlageFuerNeueAktion } from '../gemeinsam/vorlage-vorbelegung'
import { STANDARD_ANZEIGEDAUER_SEKUNDEN } from '../../shared/contracts/konstanten'

import { baueBibliothek, type BibliothekEintrag, zaehleKaputte } from './bibliothek'
import {
  leererEntwurf,
  legeAktionAn,
  pruefeEntwurf,
  speichereAktion,
  type AktionsEntwurf,
  type EntwurfBefund,
} from './aktion-bearbeiten'
import { istNeuerEntwurfLeer, unterschiede } from './aktions-entwurf'
import { BefundAnzeige } from './befund-texte'
import { findeZugewiesene, ladeWaehlbareVorlagen } from './vorlage-waehlen'
import { VorlagenWahl } from './vorlagen-wahl'
import { ZonenGestaltung } from './zonen-gestaltung'
import { FarbWahl, markenPalette } from './farb-wahl'
import { BildAusschnittRegler } from './bild-ausschnitt'
import { AufbereitungRegler } from './aufbereitung-regler'
import { feldBedarf } from './feld-bedarf'
import { BEISPIEL_INHALT, erstesBild, mitBeispielinhalt } from './beispiel-inhalt'
import { ladeLetzteFarben, mitFarbe, speichereLetzteFarben } from './letzte-farben'
import { pruefeBildWahl, starteBildImport, waehlbareBilder } from './bild-zuweisen'
import {
  starteProduktfotoAbruf,
  verwirfProduktfoto,
  waehleProduktfoto,
} from './produktfoto-abruf'
import {
  abonniereProduktfoto,
  holeProduktfotoMeldung,
  verbraucheProduktfoto,
} from './produktfoto-meldung'
import {
  bereiteMotivVorFuer,
  bereiteVorschauVor,
  haengeVorschauEin,
  zeichneVorschau,
} from './live-vorschau'
import { effektZustand } from '../../shared/effekte'
import { EffektGruppe } from './effekt-gruppe'
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

/** Breite des Bildstreifens und des Inspectors. Zwei Zahlen, die zusammen mit der Buehne
 *  das Fenster fuellen: bei 1440 px bleiben der Vorschau rund 950 px statt 820.
 *  Der Streifen ist 108 breit, nicht 96: bei 96 blieben der Kachel nach Rahmen und
 *  Innenabstand zu wenige Pixel, und der Titel brach mitten im Wort (am Bild gesehen). */
const STREIFEN_BREITE = 108
const INSPECTOR_BREITE = 340
/** Hoehe der Motivbilder im Streifen (dieselbe Verkleinerung wie in der Bibliothek). */
const STREIFEN_BILD_HOEHE = 54

export interface ActionEditorWurzelProps {
  sichtbar: boolean
  /** UMHUELLTER Projektzugang (#243). */
  projekt: ProjektZugang
  zeichnen: ZeichenZugang
  vorlagen: VorlagenZugang
  /** NUR DIE AUSWAHLLISTE (FA-23, Wahlweg #319): welche Marken gibt es. GEZEICHNET wird
   *  nie aus ihr - die Marke zum Zeichnen kommt je Aktion über holeBereiteMarke (#312). */
  marken: MarkenZugang
  /** Die hervorzuhebende Aktion aus der Reparatur-Führung (#201); null = keine. */
  hervorgehobeneAktionId: string | null
  /** 03.11.2026 (Entscheidung 29.4): true = der Editor oeffnet im Modus „neu" - der
   *  Einstieg „+ Neue Aktion" im Composer. Ausgewertet wird das EINMAL je Montage
   *  (danach fuehrt der Editor seine eigene Lage); die Vorbelegung wartet, bis die
   *  waehlbaren Vorlagen geladen sind. Fehlt das Feld, aendert sich nichts. */
  starteNeu?: boolean
  /** 04.11.2026: Der Rueckweg der ANSICHT. Gesetzt, wenn der Editor ueber der Reiterflaeche
   *  liegt; im Reiter [Aktionen] fehlt er - dort gibt es nichts zu schliessen.
   *  Der Knopf steht in der Kopfleiste des Editors, nicht in einer zweiten Leiste
   *  darueber: der Abschluss gehoert neben den Titel, den er speichert. */
  aufSchliessen?: () => void
}

/** LIEFERT die Schnittstelle aus #244: die Wurzel des Reiters Aktionen. */
export function ActionEditorWurzel(p: ActionEditorWurzelProps): JSX.Element {
  if (!p.sichtbar) {
    // Abbau verboten (TK 9.14.2): unsichtbar, aber gemountet.
    return <div data-testid="aktionen-inaktiv" style={{ display: 'none' }} />
  }
  return <AktionenInterna {...p} />
}

function AktionenInterna(p: ActionEditorWurzelProps): JSX.Element | null {
  const stand = p.projekt.hole()
  const projekt: Project | null = stand.projekt
  const [, setzeTakt] = useState(0)
  const [lage, setzeLage] = useState<EditorLage>(LEERE_EDITOR_LAGE)
  /** DER Entwurf - die einzige Wahrheit des Editors (s. Kopf). */
  const [entwurf, setzeEntwurf] = useState<AktionsEntwurf | null>(null)
  // 03.11.2026: Der Formularblock wird bei jedem NEUEN Entwurf neu montiert. Ohne
  // diesen Zaehler behielten die unkontrollierten Felder (defaultValue) die Werte des
  // ZULETZT geoeffneten Entwurfs - „Neue Aktion" haette die Vorbelegung zwar im
  // Entwurf, aber nicht auf dem Bildschirm.
  const [entwurfZaehler, setzeEntwurfZaehler] = useState(0)
  // 05.11.2026: „– kein Bild –" ist eine ENTSCHEIDUNG, nicht „noch nichts gewaehlt".
  // Nur so darf das Beispielbild der Vorschau nach einer bewussten Leerung nicht
  // zurueckkommen.
  const [keinBeispielBild, setzeKeinBeispielBild] = useState(false)
  const [waehlbare, setzeWaehlbare] = useState<Vorlage[] | null>(null)
  // Befunde und Meldung gehoeren zum ABSCHLUSS, nicht zum Formular: der Abschluss steht
  // in der Kopfleiste, seine Begruendung muss dort lesbar sein (FA-03-Nachlauf).
  const [befunde, setzeBefunde] = useState<EntwurfBefund[]>([])
  const [meldung, setzeMeldung] = useState<string | null>(null)
  const [schreibt, setzeSchreibt] = useState(false)
  // Zaehler: steigt, sobald Schriften/Logo/Motive bereit sind (loest EINEN Zeichenlauf aus).
  const [vorbereitet, setzeVorbereitet] = useState(0)
  // Die zwei hiesigen Zustaende (ENTSCHIEDEN 4): Lage und Entwurf – sie MUESSEN
  // den Reiterwechsel nicht ueberleben (#195 baut besuchte Reiter nicht ab).

  // Reaktionskette: Bereitstellung fuer die Vorschau; erneut nach jeder Bestandsaenderung
  // (ENTSCHIEDEN 11: bereiteVorschauVor - NICHT zeichnen.bereiteVor).
  //
  // Seit 05.11.2026 haengt der Effekt am PROJEKT-OBJEKT, nicht am Zugang: Ein Import
  // erzeugt ein neues Projekt und muss die neuen Bilder auch fuer die Vorschau laden.
  // Dazu wird das Beispielbild (erstes nutzbares Bild) vorbereitet - es steht in der
  // Vorschau, bevor der Nutzer eines gewaehlt hat.
  useEffect(() => {
    if (projekt === null) return
    void (async () => {
      // Die Marke fuer die Logo-Vorbereitung: die STABILE Rahmen-Marke (TK 9.15.4).
      const markeFuerVorbereitung = holeBereiteMarke(projekt.standardMarkeId)
      if (markeFuerVorbereitung === null) {
        // Nicht bereitgestellt heisst: nicht vorbereiten, nicht zeichnen - kein Ersatz
        // und kein Nachladen im Zeichenpfad (TK 9.10.3).
        return
      }
      await bereiteVorschauVor(projekt.id, [...projekt.aktionen], [...projekt.assets], markeFuerVorbereitung)
      const beispielBild = erstesBild(projekt.assets)
      if (beispielBild !== null) {
        await bereiteMotivVorFuer(projekt.id, beispielBild.id, projekt.assets)
      }
      // Ohne diesen Zaehler bliebe es beim EINEN Zeichenlauf von vor der Vorbereitung:
      // die Motive im Streifen und die grosse Vorschau stuenden als Rahmen ohne Inhalt.
      setzeVorbereitet((zaehler) => zaehler + 1)
    })()
  }, [projekt])

  // 13.11.2026 (FA-28 / TK 9.21.4): Die Vorschau zeichnet den ENTWURF, das Motiv liegt
  // aber im Bestand unter einem Schluessel, der die Aufbereitung traegt. Aendert sich ein
  // Regler, muss das Motiv EINMAL neu gerechnet werden - sonst stuende die Vorschau still,
  // obwohl der Entwurf schon anders ist.
  //
  // Der Effekt haengt am SCHLUESSEL, nicht am ganzen Entwurf: sonst rechnete jeder
  // Tastendruck im Titel das Bild neu.
  const motivKennung = motivSchluessel(entwurf?.bildRef ?? '', entwurf?.bildAufbereitung)
  useEffect(() => {
    if (projekt === null || entwurf === null || entwurf.bildRef === null) return
    void (async () => {
      await bereiteMotivVorFuer(
        projekt.id,
        entwurf.bildRef,
        projekt.assets,
        entwurf.bildAufbereitung,
      )
      setzeVorbereitet((zaehler) => zaehler + 1)
    })()
  }, [projekt, motivKennung])

  // 05.11.2026: Der Editor folgt dem PROJEKTBESTAND - wie der Vorlagen-Editor
  // (`vorlagen-editor/index.tsx`). Ohne dieses Abo blieb die Bildliste nach einem
  // Import stehen: am Fenster gemessen 4 -> 5 Assets in `project.json`, aber weiter
  // 4 Eintraege im offenen Editor. „Bild importieren" sah damit aus, als taete es
  // nichts. Der Zaehler erzwingt das Neu-Rendern; gelesen wird der Stand ohnehin
  // bei jedem Rendern frisch aus `p.projekt.hole()`.
  useEffect(() => {
    return p.projekt.aufGeaendert(() => {
      setzeTakt((takt) => takt + 1)
    })
  }, [p.projekt])

  // Das Neuladen der Vorlagen-Auswahl (ENTSCHIEDEN 10): je Aenderung der Sicht.
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

  // Die Hervorhebung aus der Reparatur-Fuehrung (#201): auf AENDERUNG ausgewertet,
  // nie fuer jeden Render (ENTSCHIEDEN 5). 03.11.2026: Sie setzt AUCH den Entwurf -
  // wer im Composer „Bearbeiten" klickt, soll direkt in der Aktion stehen.
  useEffect(() => {
    const aktionen = p.projekt.hole().projekt?.aktionen ?? []
    setzeLage((bisher) => uebernimmHervorhebung(bisher, p.hervorgehobeneAktionId, aktionen))
    const treffer = aktionen.find((aktion) => aktion.id === p.hervorgehobeneAktionId)
    if (treffer !== undefined) {
      setzeEntwurf({ ...treffer })
      setzeKeinBeispielBild(false)
      setzeBefunde([])
      setzeMeldung(null)
    }
  }, [p.hervorgehobeneAktionId])

  // 03.11.2026 (Entscheidung 29.4): „+ Neue Aktion" im Composer oeffnet den Editor im
  // Modus „neu". EINMAL je Montage (`startAusgewertet`): Die Vorbelegung braucht die
  // waehlbaren Vorlagen, die erst nach dem Aufbau eintreffen.
  const startAusgewertet = useRef(false)
  useEffect(() => {
    if (p.starteNeu !== true || startAusgewertet.current) return
    if (waehlbare === null) return
    startAusgewertet.current = true
    beginneNeuenEntwurf()
  }, [p.starteNeu, waehlbare])

  // Bestands-Faechern: die Lage faellt zurueck, wenn die gewaehlte Aktion verschwindet.
  useEffect(() => {
    const aktionen = p.projekt.hole().projekt?.aktionen ?? []
    setzeLage((bisher) => gleicheLageAb(bisher, aktionen))
  }, [stand])

  const gewaehlt = projekt === null ? null : findeGewaehlte(lage, projekt.aktionen)

  // ---------------------------------------------------------------------------
  // Der EINE Schreibweg (s. Kopf). `ok: false` heisst: der Entwurf ist ungueltig oder
  // der Speicher hat abgelehnt; die Meldung steht am Editor. `aktionId` ist die Aktion,
  // die danach im Bestand steht - `null`, wenn es nichts zu schreiben gab (ein leerer
  // neuer Entwurf, eine Aktion, die es nicht mehr gibt).
  // ---------------------------------------------------------------------------
  async function schreibe(): Promise<{ ok: boolean; aktionId: string | null }> {
    const jetzt = p.projekt.hole().projekt
    const laufenderEntwurf = entwurf
    if (jetzt === null || laufenderEntwurf === null) {
      return { ok: true, aktionId: null }
    }

    const befundeJetzt = pruefeEntwurf(laufenderEntwurf)
    if (befundeJetzt.length > 0) {
      setzeBefunde(befundeJetzt)
      return { ok: false, aktionId: null }
    }

    if (lage.modus === 'neu') {
      // Titel ist Pflicht (TK 9.8.4): ohne Titel gibt es nichts anzulegen. Wer nichts
      // getippt hat, verliert nichts - der leere Entwurf verschwindet still.
      if (istNeuerEntwurfLeer(laufenderEntwurf)) return { ok: true, aktionId: null }
      setzeSchreibt(true)
      const antwort = await legeAktionAn(laufenderEntwurf)
      setzeSchreibt(false)
      if (!antwort.ok) {
        setzeMeldung(`Nicht angelegt: ${antwort.fehler.meldung}`)
        return { ok: false, aktionId: null }
      }
      einspeisen(antwort)
      setzeLage(nachAnlegen(antwort.wert))
      setzeEntwurf({ ...antwort.wert })
      setzeBefunde([])
      setzeMeldung(null)
      merkeLetzteVorlage(antwort.wert.vorlagenId)
      return { ok: true, aktionId: antwort.wert.id }
    }

    if (lage.modus === 'bestehend') {
      const gespeichert = jetzt.aktionen.find((aktion) => aktion.id === lage.aktionId)
      // Die Aktion ist im aktuellen Stand nicht mehr vorhanden: es gibt nichts zu
      // schreiben. Frueher war das ein stilles `return` - jetzt sagt es der Editor.
      if (gespeichert === undefined) {
        setzeMeldung(
          'Die Aktion ist im aktuellen Projektstand nicht mehr vorhanden - die Änderung wurde NICHT gespeichert.',
        )
        return { ok: true, aktionId: null }
      }
      const aenderungen = unterschiede(laufenderEntwurf, gespeichert)
      // Kein Schreibvorgang ohne Aenderung: ein Aufruf waere ein Undo-Schritt fuer nichts.
      if (Object.keys(aenderungen).length === 0) return { ok: true, aktionId: gespeichert.id }
      setzeSchreibt(true)
      const antwort = await speichereAktion(gespeichert.id, aenderungen)
      setzeSchreibt(false)
      if (!antwort.ok) {
        setzeMeldung(`Nicht gespeichert: ${antwort.fehler.meldung}`)
        return { ok: false, aktionId: null }
      }
      einspeisen(antwort)
      setzeEntwurf({ ...antwort.wert })
      setzeBefunde([])
      setzeMeldung(null)
      merkeLetzteVorlage(antwort.wert.vorlagenId)
      return { ok: true, aktionId: antwort.wert.id }
    }

    return { ok: true, aktionId: null }
  }

  // Der Abschluss steht in der Kopfleiste. Er schreibt und - wenn der Editor ueber der
  // Reiterflaeche liegt - schliesst er die Ansicht. Im Reiter [Aktionen] bleibt er offen.
  //
  // 05.11.2026: „Fertig & ins Video" ist ENTFALLEN (Niklas: „macht keinen sinn so, weil
  // man das dann nicht selber rein draggen muss"). Der Editor legt nur an; platziert wird
  // im Composer per Drag oder „Ins Video" - die Platzierung ist eine raeumliche
  // Entscheidung und gehoert nicht in ein Formular.
  async function fertig(): Promise<void> {
    const ergebnis = await schreibe()
    if (!ergebnis.ok) return
    if (p.aufSchliessen === undefined) return
    // Der Waechter (s. u.) wuerde sonst ein zweites Mal schreiben wollen - hier ist
    // bereits geschrieben, er darf durchlassen.
    schliessenErlaubt.current = true
    p.aufSchliessen()
    schliessenErlaubt.current = false
  }

  // Ein Wechsel auf eine andere Aktion schreibt zuerst (derselbe Weg, kein zweiter).
  // Schlaegt das fehl, bleibt der Entwurf stehen - der Wechsel findet nicht statt.
  async function waehleAndere(aktionId: string): Promise<void> {
    if (!(await schreibe())) return
    const aktion = p.projekt.hole().projekt?.aktionen.find((eintrag) => eintrag.id === aktionId)
    setzeLage(waehleAktion(aktionId))
    if (aktion !== undefined) {
      setzeEntwurf({ ...aktion })
      // „zuletzt benutzt" heisst auch: zuletzt GEOEFFNET (03.11.2026).
      merkeLetzteVorlage(aktion.vorlagenId)
    }
    setzeKeinBeispielBild(false)
    setzeBefunde([])
    setzeMeldung(null)
  }

  async function neueAktion(): Promise<void> {
    if (!(await schreibe())) return
    beginneNeuenEntwurf()
  }

  /** Legt einen NEUEN Entwurf an - der Knopf im Streifen und der Einstieg aus dem Composer. */
  function beginneNeuenEntwurf(): void {
    setzeLage(beginneNeu())
    setzeEntwurfZaehler((zaehler) => zaehler + 1)
    // Die Vorbelegung: zuletzt BENUTZTE Vorlage, sonst die erste waehlbare
    // (`gemeinsam/vorlage-vorbelegung`), Projekt-Standardmarke, Projekt-Standarddauer.
    const standDerSicht = p.projekt.hole().projekt
    setzeEntwurf(
      leererEntwurf(
        vorlageFuerNeueAktion(waehlbare ?? []),
        standDerSicht?.standardMarkeId ?? '',
        null,
        standDerSicht?.standardSegmentdauer ?? STANDARD_ANZEIGEDAUER_SEKUNDEN,
      ),
    )
    setzeKeinBeispielBild(false)
    setzeBefunde([])
    setzeMeldung(null)
  }

  // ---------------------------------------------------------------------------
  // Der Rueckweg von AUSSEN (Reiterklick, Oeffnen einer anderen Ansicht). Er darf keinen
  // Entwurf verschlucken: der Waechter schreibt erst und laesst dann schliessen. Nur in
  // der Ansicht registriert - im Reiter gibt es keinen Rueckweg.
  // ---------------------------------------------------------------------------
  const schreibeRef = useRef<() => Promise<{ ok: boolean; aktionId: string | null }>>(async () => ({
    ok: true,
    aktionId: null,
  }))
  useEffect(() => {
    schreibeRef.current = schreibe
  })
  const schliessenErlaubt = useRef(false)
  useEffect(() => {
    if (p.aufSchliessen === undefined) return
    setzeSchliessenWaechter(() => {
      if (schliessenErlaubt.current) return true
      void (async () => {
        if (!(await schreibeRef.current()).ok) return
        schliessenErlaubt.current = true
        schliesseAktionenAnsicht()
        schliessenErlaubt.current = false
      })()
      return false
    })
    return () => {
      setzeSchliessenWaechter(null)
    }
  }, [p.aufSchliessen])

  if (projekt === null) {
    // Den Leerzustand des Reiters liefert #198, nicht diese Wurzel.
    return null
  }

  const bibliothek = baueBibliothek(projekt.aktionen, projekt.assets)
  const kaputt = zaehleKaputte(bibliothek)
  const zeichenvorlagen = p.zeichnen.hole()?.vorlagen ?? []

  // 05.11.2026: Die Vorschau zeigt bei leeren Feldern ein BEISPIEL. Das Beispielbild
  // ist das erste nutzbare Bild des Projekts - aber NUR im Modus „neu" und nur, solange
  // der Nutzer nicht bewusst „– kein Bild –" gewaehlt hat.
  const beispielBildId =
    lage.modus === 'neu' && !keinBeispielBild ? (erstesBild(projekt.assets)?.id ?? null) : null
  const beispiel = entwurf === null ? null : mitBeispielinhalt(entwurf, beispielBildId)

  // Die Write-nach der Sicht - DER Weg des ganzen Moduls (ENTSCHIEDEN 1).
  function einspeisen(antwort: Ergebnis<Aktion> | { ok: true; wert: { aktion: Aktion } }): void {
    if (!antwort.ok) {
      return
    }
    const aktion = 'aktion' in antwort.wert ? antwort.wert.aktion : antwort.wert
    // SAFETY: Der Rueckweg `if (projekt === null) return ...` steht VOR dieser Funktion;
    // TS verliert die Verengung im Funktionsrumpf, zur Laufzeit ist `projekt` hier belegt.
    p.projekt.setzeProjekt(mitAktion(projekt as Project, aktion))
    setzeTakt((t) => t + 1)
  }

  /** Ein Feld des Entwurfs aendern - KEIN IPC (s. Kopf). Die Pruefung laeuft sofort,
   *  damit ein leerer Titel nicht erst beim Abschluss auffaellt.
   *
   *  SEIT 05.11.2026 generisch: `zonenGestaltung` ist ein Record und `bildAusschnitt`
   *  ein Objekt - die alte Signatur `string | number | null` haette beide nicht
   *  angenommen und jeden Aufruf zu einem Cast gezwungen. */
  function aendere<K extends keyof AktionsEntwurf>(feld: K, wert: AktionsEntwurf[K]): void {
    if (entwurf === null) return
    // SAFETY: `feld` ist ein Schluessel von `AktionsEntwurf`, `wert` der Wert dieses
    // Feldes (der Parameter ist `keyof`-typisiert); `pruefeEntwurf` prueft den Wert
    // unmittelbar danach und meldet ihn, bevor irgendetwas geschrieben wird.
    const aenderung = { [feld]: wert } as Partial<AktionsEntwurf>
    setzeBefunde(pruefeEntwurf(aenderung))
    setzeMeldung(null)
    setzeEntwurf({ ...entwurf, ...aenderung })
  }

  /** Die Bildwahl geht in den Entwurf - aber erst, wenn das Motiv geladen ist: sonst
   *  zeichnete die Vorschau einen Platzhalter fuer ein gerade gewaehltes Foto. */
  async function waehleBild(bildRef: string | null): Promise<void> {
    const jetzt = p.projekt.hole().projekt
    if (jetzt === null) return
    if (bildRef !== null) {
      const fehler = pruefeBildWahl(bildRef, jetzt.assets)
      if (fehler !== null) {
        setzeMeldung(fehler)
        return
      }
      await bereiteMotivVorFuer(jetzt.id, bildRef, jetzt.assets, entwurf?.bildAufbereitung)
    }
    // 05.11.2026: „– kein Bild –" ist eine Entscheidung; das Beispielbild darf danach
    // nicht wieder in der Vorschau auftauchen.
    setzeKeinBeispielBild(bildRef === null)
    aendere('bildRef', bildRef)
  }

  /** FA-27 (#470): Das gewaehlte Produktfoto liegt im Main bereits im Projekt - die
   *  Sicht ist veraltet. Erst frisch laden, dann durch DENSELBEN Bildweg wie eine Wahl
   *  aus der Liste (`pruefeBildWahl` + Motiv vorbereiten); kein zweiter Weg. */
  async function uebernimmGewaehltesBild(assetId: string): Promise<void> {
    const jetzt = p.projekt.hole().projekt
    if (jetzt !== null) {
      const geladen = await p.projekt.lade(jetzt.id)
      if (!geladen.ok) {
        setzeMeldung(`Das Foto ist übernommen, aber noch nicht in der Ansicht: ${geladen.fehler.meldung}`)
        return
      }
    }
    await waehleBild(assetId)
  }

  return (
    <div
      data-testid="aktion-editor-root"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
    >
      {/* = die KOPFLEISTE: Rueckweg und Abschluss. Der TITEL steht seit 05.11.2026 bei
          den Inhaltsfeldern - dort, wo er den Text der Aktion ausmacht. */}
      <div
        data-testid="aktion-editor-kopf"
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderBottom: '1px solid #2c2c34',
        }}
      >
        {p.aufSchliessen !== undefined && (
          <button
            type="button"
            data-testid="aktionen-zurueck"
            onClick={() => {
              void fertig()
            }}
          >
            ← Zurück zum Projekt
          </button>
        )}
        <span style={{ color: '#9aa4b2', fontSize: 12 }}>
          {entwurf === null
            ? 'Keine Aktion gewählt'
            : lage.modus === 'neu'
              ? 'Neue Aktion'
              : 'Aktion bearbeiten'}
        </span>
        <span style={{ flex: '1 1 auto' }} />
        {entwurf !== null && (
          <button
            type="button"
            data-testid="aktion-anlegen-bestaetigen"
            className="knopf-primaer"
            disabled={schreibt}
            onClick={() => {
              void fertig()
            }}
          >
            {schreibt ? 'Speichert…' : lage.modus === 'neu' ? 'Anlegen' : 'Fertig'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, padding: 8, minHeight: 0, flex: '1 1 auto' }}>
        {/* = links: der BILDSTREIFEN. Die Aktionen stehen im Composer als Liste; hier
            braucht es kein zweites Verzeichnis, sondern das schnelle Umschalten. */}
        <Bildstreifen
          bibliothek={bibliothek}
          kaputt={kaputt}
          lage={lage}
          vorlagen={zeichenvorlagen}
          vorbereitet={vorbereitet}
          aufWahl={(aktionId) => {
            void waehleAndere(aktionId)
          }}
          aufNeu={() => {
            void neueAktion()
          }}
        />

        {/* = Mitte: die BUENNE. Zeichnet den Entwurf - leere Felder mit BEISPIELINHALT,
            damit man schon beim Anlegen sieht, was moeglich ist (05.11.2026). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 auto', minWidth: 0 }}>
          {gewaehlt !== null && (
            <KaputtAnzeige aktionId={gewaehlt.id} projekt={projekt} onEinspeisen={einspeisen} />
          )}
          <div
            data-testid="aktion-vorschau"
            // Das Feld ist SELBST ein Flex-Container: `height: 100%` am Kind greift in
            // einer Spalte mit `flex: 1` nicht zuverlaessig (am Bild gesehen: die
            // Vorschau hing oben, darunter blieben 220 px leer).
            style={{
              flex: '1 1 auto',
              minHeight: 240,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {beispiel !== null && beispiel.istBeispiel && (
              <p
                data-testid="aktion-beispiel-hinweis"
                style={{ margin: 0, color: '#9aa4b2', fontSize: 12 }}
              >
                Beispiel – leere Felder sind mit Beispielinhalt gefüllt.
              </p>
            )}
            <div
              style={{
                flex: '1 1 auto',
                minHeight: 0,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VorschauFlaeche
                p={p}
                inhalt={beispiel?.inhalt ?? entwurf}
                vorbereitet={vorbereitet}
              />
            </div>
          </div>
        </div>

        {/* = rechts: der INSPECTOR. Fuenf Schritte in der Reihenfolge der Arbeit. */}
        <div
          data-testid="aktion-formular"
          style={{
            width: INSPECTOR_BREITE,
            flex: '0 0 auto',
            // `overflowX: 'hidden'` ist die Sperre gegen den waagerechten Scrollbalken:
            // Ein einzelnes breites Kind (Schieberegler, langer Dateiname) erzeugte sonst
            // eine zweite Scrollrichtung, die niemand braucht. Was nicht passt, wird
            // umgebrochen oder gekuerzt - gescrollt wird hier nur SENKRECHT.
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {entwurf === null ? (
            <p data-testid="aktion-formular-leer" style={{ color: '#9aa4b2' }}>
              Aktion wählen oder neu anlegen.
            </p>
          ) : (
            <Inspector
              key={
                lage.modus === 'neu'
                  ? `neu-${String(entwurfZaehler)}`
                  : lage.modus === 'bestehend'
                    ? lage.aktionId
                    : 'keine'
              }
              projekt={projekt}
              entwurf={entwurf}
              beispiel={beispiel?.inhalt ?? entwurf}
              waehlbare={waehlbare}
              befunde={befunde}
              meldung={meldung}
              aufAenderung={aendere}
              aufBild={(bildRef) => {
                void waehleBild(bildRef)
              }}
              aktionId={lage.modus === 'bestehend' ? lage.aktionId : ''}
              aufAssetGewaehlt={uebernimmGewaehltesBild}
              neuModus={lage.modus === 'neu'}
            />
          )}
          {lage.modus === 'bestehend' && (
            <LoeschBlock
              projekt={projekt}
              aktionId={lage.aktionId}
              onLoesche={() => {
                void loescheAktion(lage.aktionId).then((antwort) => {
                  if (antwort.ok) {
                    // Der ZURUECKGEGEBENE Stand geht in die Sicht (ENTSCHIEDEN 6);
                    // die Kaskade aus den Kennungen wird NICHT nachgebaut.
                    p.projekt.setzeProjekt({
                      ...projekt,
                      aktionen: antwort.wert.stand.aktionen,
                      liste: antwort.wert.stand.liste,
                    })
                    setzeLage({ modus: 'keine' })
                    setzeEntwurf(null)
                    setzeTakt((t) => t + 1)
                  } else {
                    setzeMeldung(`Nicht gelöscht: ${antwort.fehler.meldung}`)
                  }
                })
              }}
              onAbbrechen={() => undefined}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/** Der Bildstreifen links: eine Kachel je Aktion, „+ Neue Aktion" oben. */
function Bildstreifen({
  bibliothek,
  kaputt,
  lage,
  vorlagen,
  vorbereitet,
  aufWahl,
  aufNeu,
}: {
  bibliothek: readonly BibliothekEintrag[]
  kaputt: number
  lage: EditorLage
  vorlagen: readonly Vorlage[]
  vorbereitet: number
  aufWahl: (aktionId: string) => void
  aufNeu: () => void
}): JSX.Element {
  return (
    <div
      data-testid="aktion-bibliothek"
      title={kaputt > 0 ? `${String(kaputt)} Aktion(en) kaputt` : 'Aktionen'}
      style={{
        width: STREIFEN_BREITE,
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        overflowY: 'auto',
        minHeight: 0,
      }}
    >
      <button
        type="button"
        data-testid="aktion-neu"
        title="Neue Aktion"
        onClick={aufNeu}
        style={{ height: 30, fontSize: 16 }}
      >
        +
      </button>
      {bibliothek.map((eintrag) => (
        <StreifenKachel
          key={eintrag.aktion.id}
          eintrag={eintrag}
          vorlagen={vorlagen}
          gewaehlt={lage.modus === 'bestehend' && lage.aktionId === eintrag.aktion.id}
          vorbereitet={vorbereitet}
          aufWahl={aufWahl}
        />
      ))}
    </div>
  )
}

function StreifenKachel({
  eintrag,
  vorlagen,
  gewaehlt,
  vorbereitet,
  aufWahl,
}: {
  eintrag: BibliothekEintrag
  vorlagen: readonly Vorlage[]
  gewaehlt: boolean
  vorbereitet: number
  aufWahl: (aktionId: string) => void
}): JSX.Element {
  const flaeche = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    const ziel = flaeche.current
    if (ziel === null) return
    ziel.replaceChildren()
    const vorlage = findeZeichenVorlage(eintrag.aktion, vorlagen)
    const marke = holeBereiteMarke(eintrag.aktion.markeId)
    // Ohne Vorlage oder Marke bleibt die Flaeche leer - kein Ersatzbild, das eine
    // Zeichnung behauptet (dieselbe Haltung wie in der Composer-Bibliothek).
    if (vorlage === null || marke === null) return
    const bild = holeMotiv(eintrag.aktion, vorlage, marke, STREIFEN_BILD_HOEHE)
    if (bild !== null) {
      // Das Motiv ist auf ZEILENHOEHE verkleinert; die Breite gibt der Streifen vor.
      // `object-fit: cover` ist fuer BAND-Vorlagen entscheidend: 1920 x 162 waeren bei
      // 108 px Breite ein 9-px-Streifen - als Kachel unbrauchbar (am Bild gesehen).
      // Beschnitten wird, nicht verzerrt; zu sehen ist der linke Teil mit dem Logo.
      bild.style.width = '100%'
      bild.style.height = `${String(STREIFEN_BILD_HOEHE)}px`
      bild.style.objectFit = 'cover'
      bild.style.display = 'block'
      ziel.append(bild)
    }
  }, [eintrag, vorlagen, vorbereitet])

  return (
    <button
      type="button"
      data-testid={`aktion-strip-${eintrag.aktion.id}`}
      title={eintrag.aktion.titel}
      aria-label={eintrag.aktion.titel}
      onClick={() => {
        aufWahl(eintrag.aktion.id)
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 2,
        padding: 2,
        // Ein Knopf zentriert seinen Text von sich aus - hier steht er LINKS, damit
        // alle Kacheln an derselben Kante beginnen (am Bild gesehen).
        textAlign: 'left',
        border: gewaehlt ? '2px solid #6ea8fe' : eintrag.kaputt ? '2px solid #e5634d' : '2px solid transparent',
        background: '#17171b',
      }}
    >
      <span
        ref={flaeche}
        style={{ display: 'block', minHeight: 18, background: '#101014', lineHeight: 0 }}
      />
      <span
        style={{
          display: 'block',
          fontSize: 10,
          color: eintrag.kaputt ? '#e5634d' : '#9aa4b2',
          // NACHARBEIT 05.11.2026: Ein Titel wird UMBROCHEN, nicht abgeschnitten
          // („text der abgeschnitten wird … muss anders gehandelt werden"). Der Streifen
          // ist schmal; zwei Zeilen lesen sich besser als „Sommerak…".
          overflowWrap: 'anywhere',
          lineHeight: 1.25,
        }}
      >
        {eintrag.aktion.titel === '' ? '(ohne Titel)' : eintrag.aktion.titel}
      </span>
    </button>
  )
}

/** Die Vorschauflaeche: zeichnet mit zeichneVorschau (#140) - dem EINZIGEN Zeichenweg. */
function VorschauFlaeche({
  p,
  inhalt,
  vorbereitet,
}: {
  p: ActionEditorWurzelProps
  /** Was GEZEICHNET wird: der Entwurf, bei leeren Feldern mit Beispielinhalt gefuellt.
   *  Gespeichert wird nur der Entwurf - das Beispiel ist reine Vorschau. */
  inhalt: AktionsEntwurf | null
  /** Steigt, sobald Motive/Schriften bereit sind - dann wird neu gezeichnet. */
  vorbereitet: number
}): JSX.Element {
  const containerBezug = useState<HTMLDivElement | null>(null)
  const [, setzeContainer] = containerBezug
  const [, setzeFehlertext] = useState<string | null>(null)

  useEffect(() => {
    const ziel = containerBezug[0]
    if (ziel === null || inhalt === null) return
    const zeichenv = p.zeichnen.hole()?.vorlagen ?? []
    const vorlage = findeZeichenVorlage(inhalt, zeichenv)
    if (vorlage === null) return
    // Die Marke des ENTWURFS (#313, ENTSCHIEDEN 5). null heisst: nicht zeichnen -
    // keine Ersatzmarke, kein Nachladen im Zeichenpfad (TK 9.10.3).
    const marke = holeBereiteMarke(inhalt.markeId)
    if (marke === null) return

    // Effekte (09.11.2026, TK 9.16.6): Die Vorschau spielt das Segment in einer
    // requestAnimationFrame-Schleife und zeichnet je Bild mit DEMSELBEN Zustand, den
    // auch der Render bekommt. Ohne Effekt bleibt es beim einen Standbild.
    const bilderGesamt = Math.max(1, Math.round((inhalt.standardDauer ?? 10) * 30))
    const satz = inhalt.effekte ?? null
    const hatEffekt =
      satz !== null && Object.values(satz).some((e) => e !== undefined && e.staerke > 0)

    const zeichne = (bildIndex: number): void => {
      try {
        const zustand = hatEffekt ? effektZustand(satz, bildIndex, bilderGesamt) : undefined
        const bild = zeichneVorschau(inhalt, vorlage, marke, zustand)
        haengeVorschauEin(ziel, bild)
        setzeFehlertext(null)
      } catch (ausnahme) {
        console.warn('[aktion-editor] zeichneVorschau wirft:', ausnahme)
        setzeFehlertext(ausnahme instanceof Error ? ausnahme.message : 'Zeichenfehler')
      }
    }

    if (!hatEffekt) {
      zeichne(0)
      return
    }

    let raf = 0
    const start = performance.now()
    const schleife = (): void => {
      const bildIndex = Math.floor((performance.now() - start) / (1000 / 30)) % bilderGesamt
      zeichne(bildIndex)
      raf = requestAnimationFrame(schleife)
    }
    raf = requestAnimationFrame(schleife)
    return () => cancelAnimationFrame(raf)
  }, [inhalt, p, vorbereitet])

  return <div ref={(el) => setzeContainer(el)} data-testid="aktion-vorschau-flaeche" style={{ border: '1px solid #444', minHeight: 200, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
}

/** Der Inspector: fuenf Schritte in der Reihenfolge der Arbeit. */
function Inspector({
  projekt,
  entwurf,
  beispiel,
  waehlbare,
  befunde,
  meldung,
  aufAenderung,
  aufBild,
  aktionId,
  aufAssetGewaehlt,
  neuModus,
}: {
  projekt: Project
  entwurf: AktionsEntwurf
  /** Derselbe Entwurf, aber leere Felder mit Beispielinhalt - NUR fuer die Vorlagenbilder. */
  beispiel: AktionsEntwurf
  waehlbare: Vorlage[] | null
  befunde: EntwurfBefund[]
  meldung: string | null
  aufAenderung: <K extends keyof AktionsEntwurf>(feld: K, wert: AktionsEntwurf[K]) => void
  aufBild: (bildRef: string | null) => void
  /** Die Aktion aus dem Bestand; leer im Modus „neu" (der Abruf legt sie nicht an). */
  aktionId: string
  /** Uebernimmt ein bereits angelegtes Asset in den Entwurf (FA-27, #470). */
  aufAssetGewaehlt: (assetId: string) => Promise<void>
  /** „neu" heisst: hier wird die Vorlage GEWAEHLT - dann steht die Galerie offen.
   *  Beim Bearbeiten einer bestehenden Aktion ist sie zu (s. Schritt „Vorlage"). */
  neuModus: boolean
}): JSX.Element {
  const assets: Asset[] = projekt.assets
  // 05.11.2026: Der Import ist ein AUFTRAG (TK 9.3.4) - er kann nicht sofort fertig
  // sein. Ohne sichtbare Meldung sah der Klick aus, als taete er nichts. Der Hinweis
  // steht bis zur naechsten Aktion; die Liste aktualisiert sich ueber das Projekt-Abo
  // der Wurzel, sobald der Auftrag durchgelaufen ist.
  const [importHinweis, setzeImportHinweis] = useState<string | null>(null)
  const [importLaeuft, setzeImportLaeuft] = useState(false)
  // SEIT 12.11.2026 (FA-27 / TK 9.19.8): Produkt-URL und Kandidaten.
  const [abrufUrl, setzeAbrufUrl] = useState<string>(entwurf.produktUrl ?? '')
  const [abruf, setzeAbruf] = useState<{ abrufId: string; kandidaten: ProduktfotoKandidat[] } | null>(
    null,
  )
  const [abrufLaeuft, setzeAbrufLaeuft] = useState(false)
  const [abrufHinweis, setzeAbrufHinweis] = useState<string | null>(null)
  const [kandidatLaeuft, setzeKandidatLaeuft] = useState<number | null>(null)
  // Die `auftragId` ordnet die Meldung des Nachlaufs DIESEM Editor zu - zwei montierte
  // Editoren (Reiter und Ansicht) duerfen sich nicht gegenseitig bedienen.
  const abrufAuftragRef = useRef<string | null>(null)

  // Der Feldwert folgt dem Entwurf (Wechsel der Aktion, Uebernahme aus dem Bestand).
  // Waehrend des Tippens aendert sich `entwurf.produktUrl` nicht - kein Zuruckspringen.
  useEffect(() => {
    setzeAbrufUrl(entwurf.produktUrl ?? '')
  }, [entwurf.produktUrl])

  /** Eine Meldung des Nachlaufs verarbeiten - nur die zu UNSEREM Auftrag. */
  function verarbeiteMeldung(meldung: NonNullable<ReturnType<typeof holeProduktfotoMeldung>>): void {
    if (abrufAuftragRef.current === null || meldung.auftragId !== abrufAuftragRef.current) return
    verbraucheProduktfoto()
    abrufAuftragRef.current = null
    setzeAbrufLaeuft(false)
    if (meldung.status === 'erfolg') {
      setzeAbruf({ abrufId: meldung.abrufId, kandidaten: meldung.kandidaten })
      setzeAbrufHinweis(null)
      return
    }
    setzeAbrufHinweis('Der Abruf ist fehlgeschlagen – der Grund steht oben in der Meldung.')
  }

  useEffect(() => {
    return abonniereProduktfoto(() => {
      const meldung = holeProduktfotoMeldung()
      if (meldung !== null) verarbeiteMeldung(meldung)
    })
    // Die Verarbeitung liest nur Refs und Setter - ein Abo je Montage genuegt.
  }, [])

  async function starteAbruf(): Promise<void> {
    const adresse = normalisiereProduktUrl(abrufUrl)
    if (adresse === null) {
      setzeAbrufHinweis('Bitte eine gültige http(s)-Adresse eintragen.')
      return
    }
    if (adresse !== (entwurf.produktUrl ?? null)) aufAenderung('produktUrl', adresse)
    setzeAbrufHinweis(null)
    setzeAbruf(null)
    setzeAbrufLaeuft(true)
    const antwort = await starteProduktfotoAbruf(projekt.id, aktionId, adresse)
    if (!antwort.ok) {
      setzeAbrufLaeuft(false)
      setzeAbrufHinweis(`Abruf nicht gestartet: ${antwort.fehler.meldung}`)
      return
    }
    abrufAuftragRef.current = antwort.wert.auftragId
    // Ein sehr schneller Fehlschlag kann VOR dieser Zeile gemeldet worden sein.
    const schonDa = holeProduktfotoMeldung()
    if (schonDa !== null) verarbeiteMeldung(schonDa)
  }

  async function uebernimmKandidat(kandidat: number): Promise<void> {
    if (abruf === null) return
    setzeKandidatLaeuft(kandidat)
    const antwort = await waehleProduktfoto(abruf.abrufId, kandidat)
    if (!antwort.ok) {
      setzeKandidatLaeuft(null)
      setzeAbrufHinweis(`Nicht übernommen: ${antwort.fehler.meldung}`)
      return
    }
    await aufAssetGewaehlt(antwort.wert.bildRef)
    setzeKandidatLaeuft(null)
    setzeAbruf(null)
    setzeAbrufHinweis('Das Foto ist als Bild im Projekt übernommen.')
  }

  function verwirfAbruf(): void {
    if (abruf === null) return
    void verwirfProduktfoto(abruf.abrufId)
    setzeAbruf(null)
    setzeAbrufHinweis('Abruf verworfen – es wurde kein Bild übernommen.')
  }
  // 05.11.2026: Die letzten 20 Farben - app-weit in `config.json` (`uiVoreinstellungen`).
  // Der Ref haelt den Stand fuer schnelle Klicks; der State zeichnet die Swatches.
  const [letzteFarben, setzeLetzteFarben] = useState<string[]>([])
  const letzteFarbenRef = useRef<string[]>([])
  useEffect(() => {
    void ladeLetzteFarben().then((farben) => {
      letzteFarbenRef.current = farben
      setzeLetzteFarben(farben)
    })
  }, [])
  // Welche Felder die GEWAEHLTE Vorlage ueberhaupt benutzt (03.11.2026): Bei
  // „Band-Standard" gibt es bewusst keine Beschreibungs-Zone (TK 9.11.1).
  const gewaehlteVorlage = waehlbare?.find((vorlage) => vorlage.id === entwurf.vorlagenId) ?? null
  const bedarf = feldBedarf(gewaehlteVorlage)
  const markeDesEntwurfs = holeBereiteMarke(entwurf.markeId)
  // Die Markenpalette fuer JEDEN Farbwaehler: alle Rollen, wie sie die bereite Marke
  // traegt (doppelte Hex-Werte als EIN Swatch, 8-stellige Scrim-Werte fallen heraus).
  // Die Regel steht in `farb-wahl.tsx` - hier wird sie nur EINMAL geholt und an alle
  // Waehler derselben Sitzung weitergereicht, damit acht Zonen nicht achtmal dasselbe
  // rechnen.
  const markenFarben = markenPalette(markeDesEntwurfs?.farben)
  // Die Kopfzeile der Gruppe sagt, ob es eigene Werte gibt - sonst muesste man
  // aufklappen, um zu sehen, ob man schon etwas eingestellt hat.
  const angepassteObjekte = Object.values(entwurf.zonenGestaltung ?? {}).filter(
    (gestaltung) => Object.keys(gestaltung).length > 0,
  ).length
  const gestaltungsZusammenfassung =
    angepassteObjekte === 0 ? '' : `${String(angepassteObjekte)} Objekt(e) geändert`

  /** Eine Farbe in die app-weite Historie heben. Der Entwurf schreibt NICHT mit -
   *  das macht der Aufrufer ueber `aufAenderung`. */
  function merkeFarbe(farbe: string): void {
    const neu = mitFarbe(letzteFarbenRef.current, farbe)
    letzteFarbenRef.current = neu
    setzeLetzteFarben(neu)
    void speichereLetzteFarben(neu)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {meldung !== null && (
        <p data-testid="aktion-speicher-meldung" style={{ color: '#e5634d', fontSize: 12, margin: 0 }}>
          {meldung}
        </p>
      )}
      {befunde.map((befund, stelle) => (
        <BefundAnzeige key={stelle} befund={befund} />
      ))}

      {/* Die Vorlagen-Galerie ist beim ANLEGEN offen (da wird der Look gewaehlt) und beim
          BEARBEITEN zu: Mit acht Kacheln ist sie hoeher als der ganze restliche Inspector
          und schob „Inhalt", „Bild" und „Gestaltung" aus dem Bild (Niklas, 05.11.2026:
          „die anordnung in der seitenleiste ist scheiße"). Der Name der gewaehlten Vorlage
          steht in der Kopfzeile - man sieht ohne Aufklappen, womit man arbeitet. */}
      <Schritt
        titel="Vorlage"
        zusammenfassung={gewaehlteVorlage?.name ?? 'unbekannt'}
        aufgeklappt={neuModus}
      >
        <div data-testid="aktion-vorlage">
          {waehlbare === null ? null : (
            <VorlagenWahl
              waehlbare={waehlbare}
              aktuell={entwurf.vorlagenId}
              entwurf={beispiel}
              aufWahl={(vorlagenId) => {
                aufAenderung('vorlagenId', vorlagenId)
              }}
            />
          )}
          {waehlbare !== null && findeZugewiesene(entwurf.vorlagenId, waehlbare) === null && (
            <p data-testid="aktion-vorlage-unbekannt" style={{ color: '#d9a441' }}>
              Unbekannte Vorlage - bitte neu wählen.
            </p>
          )}
        </div>
      </Schritt>

      <Schritt titel="Inhalt">
        {/* 05.11.2026: Der TITEL steht bei den Inhaltsfeldern, nicht mehr in der
            Kopfleiste. Er ist der Text, den die Aktion zeigt - dort gehoert er hin. */}
        <label style={{ display: 'block' }}>Titel (Pflicht){' '}
          <input
            type="text"
            data-testid="aktion-titel"
            aria-label="Titel"
            placeholder={`z. B. ${BEISPIEL_INHALT.titel}`}
            defaultValue={entwurf.titel}
            style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
            onBlur={(ereignis) => {
              aufAenderung('titel', ereignis.target.value)
            }}
          />
        </label>
        {bedarf.beschreibung && (
          <label style={{ display: 'block' }}>Beschreibung{' '}
            <input
              type="text"
              defaultValue={entwurf.beschreibung ?? ''}
              placeholder={BEISPIEL_INHALT.beschreibung}
              data-testid="aktion-beschreibung"
              style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
              onBlur={(ereignis) => {
                aufAenderung('beschreibung', ereignis.target.value || null)
              }}
            />
          </label>
        )}
        {bedarf.preis && (
          <label style={{ display: 'block' }}>Preis{' '}
            <input
              type="text"
              defaultValue={entwurf.preis ?? ''}
              placeholder={BEISPIEL_INHALT.preis}
              data-testid="aktion-preis"
              style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
              onBlur={(ereignis) => {
                aufAenderung('preis', ereignis.target.value || null)
              }}
            />
          </label>
        )}
        {bedarf.cta && (
          <label style={{ display: 'block' }}>Knopf{' '}
            <input
              type="text"
              defaultValue={entwurf.cta ?? ''}
              placeholder={BEISPIEL_INHALT.cta}
              data-testid="aktion-cta"
              style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
              onBlur={(ereignis) => {
                aufAenderung('cta', ereignis.target.value || null)
              }}
            />
          </label>
        )}
      </Schritt>

      {bedarf.bild && (
        <Schritt titel="Bild">
          <div data-testid="aktion-bild" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <select
              data-testid="aktion-bild-wahl"
              // KONTROLLIERT seit 12.11.2026 (FA-27): Ein per Kandidaten-Klick
              // uebernommenes Foto setzt `bildRef` von AUSSEN - mit `defaultValue`
              // zeigte die Liste weiter den alten Eintrag, obwohl der Entwurf schon
              // das neue Bild trug. `onChange` schreibt ohnehin in den Entwurf.
              value={entwurf.bildRef ?? ''}
              onChange={(ereignis) => {
                aufBild(ereignis.target.value === '' ? null : ereignis.target.value)
              }}
            >
              <option value="">– kein Bild –</option>
              {waehlbareBilder(assets).map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.originalname}</option>
              ))}
            </select>
            {waehlbareBilder(assets).length === 0 && (
              <p style={{ color: '#9aa4b2', fontSize: 11, margin: 0 }}>
                Noch kein Bild im Projekt – „Bild importieren" legt eines an.
              </p>
            )}
            {entwurf.bildRef === null && beispiel.bildRef !== null && (
              <p data-testid="aktion-bild-beispiel" style={{ color: '#9aa4b2', fontSize: 11, margin: 0 }}>
                Die Vorschau zeigt als Beispiel „
                {assets.find((asset) => asset.id === beispiel.bildRef)?.originalname ?? 'ein Projektbild'}
                " – wähle eines, um es zu übernehmen.
              </p>
            )}
            <button
              type="button"
              data-testid="aktion-bild-import"
              disabled={importLaeuft}
              onClick={() => {
                void (async () => {
                  setzeImportHinweis(null)
                  setzeImportLaeuft(true)
                  const antwort = await starteBildImport(projekt.id)
                  setzeImportLaeuft(false)
                  if (!antwort.ok) {
                    setzeImportHinweis(`Import nicht gestartet: ${antwort.fehler.meldung}`)
                    return
                  }
                  const anzahl = antwort.wert.auftragIds.length
                  if (anzahl === 0) {
                    setzeImportHinweis('Kein Bild gewählt - es wurde nichts importiert.')
                    return
                  }
                  const abbruch = antwort.wert.abbruchGrund
                  setzeImportHinweis(
                    `${String(anzahl)} ${anzahl === 1 ? 'Bild wird' : 'Bilder werden'} importiert` +
                      `${abbruch === null ? '' : `; abgebrochen wegen ${abbruch}`} – ` +
                      'erscheint gleich in dieser Liste.',
                  )
                })()
              }}
            >
              {importLaeuft ? 'Import läuft …' : 'Bild importieren'}
            </button>
            {importHinweis !== null && (
              <p
                data-testid="aktion-bild-hinweis"
                style={{ color: '#9aa4b2', fontSize: 11, margin: 0 }}
              >
                {importHinweis}
              </p>
            )}
            {/* SEIT 12.11.2026 (FA-27 / TK 9.19.8): Produkt-URL und „Foto abrufen".
                Der Abruf ist ein AUFTRAG (Warteschlange zeigt ihn mit Fortschritt);
                die Kandidaten erscheinen erst, wenn der Nachlauf sie meldet. Ohne Klick
                auf einen Kandidaten wird kein Bild uebernommen. */}
            <div
              data-testid="produkt-abruf"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                borderTop: '1px solid #333',
                paddingTop: 6,
              }}
            >
              <label style={{ display: 'block' }}>Produkt-URL{' '}
                <input
                  type="url"
                  value={abrufUrl}
                  placeholder="https://shop.example/produkt"
                  data-testid="produkt-url"
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
                  onChange={(ereignis) => {
                    setzeAbrufUrl(ereignis.target.value)
                  }}
                  onBlur={() => {
                    const adresse = normalisiereProduktUrl(abrufUrl)
                    setzeAbrufUrl(adresse ?? '')
                    if (adresse !== (entwurf.produktUrl ?? null)) aufAenderung('produktUrl', adresse)
                  }}
                />
              </label>
              <button
                type="button"
                data-testid="produkt-foto-abrufen"
                disabled={abrufLaeuft}
                onClick={() => {
                  void starteAbruf()
                }}
              >
                {abrufLaeuft ? 'Foto wird abgerufen …' : 'Foto abrufen'}
              </button>
              {abrufHinweis !== null && (
                <p
                  data-testid="produkt-abruf-hinweis"
                  style={{ color: '#9aa4b2', fontSize: 11, margin: 0 }}
                >
                  {abrufHinweis}
                </p>
              )}
              {abruf !== null && (
                <div
                  data-testid="produkt-kandidaten"
                  style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                >
                  <p data-testid="produkt-herkunft" style={{ color: '#9aa4b2', fontSize: 11, margin: 0 }}>
                    {hostVon(abrufUrl) === null
                      ? 'Quelle: Produktseite'
                      : `Quelle: ${hostVon(abrufUrl) ?? ''}`}
                    {' '}– die Adresse wird am Bild gespeichert.
                  </p>
                  {abruf.kandidaten.map((kandidat) => (
                    <button
                      key={kandidat.index}
                      type="button"
                      data-testid={`produkt-kandidat-${String(kandidat.index)}`}
                      disabled={kandidatLaeuft !== null}
                      onClick={() => {
                        void uebernimmKandidat(kandidat.index)
                      }}
                    >
                      {String(kandidat.index + 1)}. {kurzName(kandidat.url)} ·{' '}
                      {String(Math.max(1, Math.round(kandidat.groesse / 1024)))} KB
                    </button>
                  ))}
                  <button type="button" data-testid="produkt-verwerfen" onClick={verwirfAbruf}>
                    Verwerfen
                  </button>
                </div>
              )}
            </div>
            {/* SEIT 05.11.2026 (TK 9.8.8): Zoom und Position des Motivs. Sie bewegen den
                BILDINHALT innerhalb der Zone, nicht die Zone selbst - deshalb steht der
                Regler hier beim Bild und nicht bei der Vorlage. */}
            <BildAusschnittRegler
              ausschnitt={entwurf.bildAusschnitt}
              aufAendern={(ausschnitt) => {
                aufAenderung('bildAusschnitt', ausschnitt)
              }}
            />
            {/* SEIT 13.11.2026 (FA-28 / TK 9.21.6): Helligkeit, Kontrast, Schaerfe.
                Nicht destruktiv - die Werte stehen an der Aktion, gerechnet wird beim
                Vorbereiten des Motivs. */}
            <AufbereitungRegler
              aufbereitung={entwurf.bildAufbereitung}
              aufAendern={(aufbereitung) => {
                aufAenderung('bildAufbereitung', aufbereitung)
              }}
            />
          </div>
        </Schritt>
      )}

      {/* SEIT 05.11.2026 (Nacharbeit): EINE Gruppe „Gestaltung" für ALLES, was Farbe und
          Schrift angeht. Vorher lagen die Akzentfarbe und die Zonen-Farben in zwei
          getrennten Schritten - genau die Gruppierung, die Niklas kritisiert hat
          („was zusammen gehört muss zusammen gruppiert werden"). Ganz oben steht die
          Vorgabe für ALLE Objekte, darunter jedes Objekt mit seinen eigenen Werten. */}
      <Schritt titel="Gestaltung" zusammenfassung={gestaltungsZusammenfassung}>
        {bedarf.akzent && (
          <div data-testid="aktion-akzent" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong style={{ fontSize: 12 }}>Alle Objekte</strong>
            {markeDesEntwurfs === null ? (
              <span data-testid="aktion-akzent-unbekannt" style={{ color: '#9aa4b2', fontSize: 11 }}>
                Marke wird geladen …
              </span>
            ) : (
              <FarbWahl
                testid="aktion-akzent"
                beschriftung="Akzent"
                wert={entwurf.akzentfarbe}
                markenWert={markeDesEntwurfs.farben.akzent}
                palette={markenFarben}
                letzteFarben={letzteFarben}
                aufWahl={(farbe) => {
                  aufAenderung('akzentfarbe', farbe)
                }}
                aufFarbeMerken={merkeFarbe}
              />
            )}
            <p style={{ color: '#9aa4b2', fontSize: 11, margin: 0 }}>
              Färbt die Akzentflächen der Vorlage – zum Beispiel Preis-Pille und Knopf.
            </p>
          </div>
        )}

        <ZonenGestaltung
          vorlage={gewaehlteVorlage}
          entwurf={entwurf}
          marke={markeDesEntwurfs}
          palette={markenFarben}
          letzteFarben={letzteFarben}
          aufAendern={(gestaltung) => {
            aufAenderung('zonenGestaltung', gestaltung)
          }}
          aufFarbeMerken={merkeFarbe}
        />
      </Schritt>

      {gewaehlteVorlage !== null && gewaehlteVorlage.höhe === null && (
        <Schritt titel="Effekte">
          <EffektGruppe
            entwurf={entwurf}
            dauer={entwurf.standardDauer ?? 10}
            aufAendern={(effekte) => {
              aufAenderung('effekte', effekte)
            }}
          />
        </Schritt>
      )}

      <Schritt titel="Dauer">
        <label>Standarddauer{' '}
          <input
            type="number"
            defaultValue={String(entwurf.standardDauer ?? '')}
            data-testid="aktion-dauer"
            onBlur={(ereignis) => {
              aufAenderung('standardDauer', ereignis.target.value === '' ? null : Number(ereignis.target.value))
            }}
          />
        </label>
        <p style={{ color: '#9aa4b2', fontSize: 11, margin: '2px 0 0' }}>
          Nur die Vorgabe beim Einsetzen; die Dauer am Listenelement zählt.
        </p>
      </Schritt>
    </div>
  )
}

/** Ein Abschnitt des Inspectors - Ueberschrift plus Inhalt. Die Nummern sind
 *  seit 05.11.2026 weg: Sie liessen die Flaeche wie ein Formular aussehen; die
 *  Reihenfolge ergibt sich aus dem Aufbau (Vorlage -> Inhalt -> Bild -> Farbe -> Dauer). */
function Schritt({
  titel,
  zusammenfassung,
  aufgeklappt = true,
  children,
}: {
  titel: string
  /** Steht neben dem Titel, auch wenn der Schritt zugeklappt ist - z. B. der Vorlagenname. */
  zusammenfassung?: string
  /** false = zugeklappt STARTEN. Der Nutzer kann jederzeit oeffnen; der Zustand wird
   *  nicht zurueckgesetzt, weil React den unveraenderten `open`-Wert nicht neu schreibt.
   *  Gebraucht wird das fuer die Vorlagen-Galerie: Sie ist mit acht Kacheln hoeher als
   *  der ganze restliche Inspector und schiebt alles andere aus dem Bild. */
  aufgeklappt?: boolean
  children: JSX.Element | (JSX.Element | null | false)[]
}): JSX.Element {
  if (zusammenfassung === undefined) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: 12, color: '#9aa4b2', letterSpacing: 0.4 }}>
          {titel}
        </h3>
        {children}
      </section>
    )
  }

  return (
    <details open={aufgeklappt} style={{ minWidth: 0 }}>
      <summary
        style={{ fontSize: 12, color: '#9aa4b2', letterSpacing: 0.4, cursor: 'pointer' }}
      >
        {titel}
        {zusammenfassung !== '' && (
          <span style={{ color: '#e6e6e6', letterSpacing: 0 }}> · {zusammenfassung}</span>
        )}
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6, minWidth: 0 }}>
        {children}
      </div>
    </details>
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
    <div data-testid="aktion-kaputt" style={{ fontSize: 12, color: '#9aa4b2', display: 'flex', gap: 8, alignItems: 'center' }}>
      <span>
        {anzahlStellen(stellen)} Stelle(n) verwenden diese Aktion: {stellen.segmentElementIds.length} Segment(e),
        {' '}{stellen.bandAbschnitte.length} Band-Abschnitt(e).
      </span>
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

// Die Loesch-Kaskade aus den Kennungen wird bewusst NICHT nachgebaut (ENTSCHIEDEN 6):
// der zurueckgegebene stand ist die einzige Quelle des neuen Listen-Standes.

// Die Loesch-Vorschau (#142): ZAHLEN vor dem Klick (ENTSCHIEDEN 12) -
// Kennungen sind fuer den Nutzer bedeutungslos.
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
        style={{ marginTop: 16 }}
      >
        Aktion löschen
      </button>
    )
  }
  return (
    <div data-testid="aktion-loesch-vorschau" style={{ marginTop: 16, fontSize: 12 }}>
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

/** Der Dateiname einer Kandidaten-Adresse fuer die Auswahl - nur Anzeige, nie ein Pfad. */
function kurzName(url: string): string {
  try {
    const adresse = new URL(url)
    const name = adresse.pathname.split('/').pop() ?? ''
    return name.length > 0 ? name : adresse.host
  } catch {
    return url
  }
}

/** Der Host einer Produktadresse; `null`, wenn das Feld (noch) keine gueltige Adresse traegt. */
function hostVon(text: string): string | null {
  try {
    return new URL(text).host
  } catch {
    return null
  }
}
