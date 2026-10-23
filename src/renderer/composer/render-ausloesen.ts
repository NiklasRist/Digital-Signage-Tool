// [composer] Render und Export auslösen
//
// DREI TEURE STILLE FEHLER, gegen die der Ablauf verdrahtet ist:
//  1. kein DIREKTER Aufruf des Renders: Der Weg fuehrt über reiheEin (TK 9.3.4) -
//     sonst umgeht ein zweiter Weg die serielle Freigabe des Torwächters (NFA-09),
//     und ein Löschauftrag koennte mitten im Render dieselbe Datei anfassen (EBUSY).
//  2. Kaputte Stellen SPERREN: Ein Render mit Platzhaltern wäre erst später
//     an mangelhafter  zu erkennen, gebaut und abgebrochen; die Führung
//     aus TK 9.7.4 lebte an der andern Stelle.
//  3. Der Ausgabename ist NUTZEREINGABE (TK 9.2.6) und wird VORGEPRÜFT;
//     '../' blende nicht examiner aus (kein Apsprung aus dem Projektordner).
//
// Der Ablauf (abgehandelt im Issue):
//   1. Sperre   : Kaputt-Erkennung (#131) - mit daten{stellen} abgelehnt.
//   2. Namens-VP: Nur die VORPRUEFUNG als Rückmeldung (der Main maßgeblich);
//   3. Items    : über projekt.liste in Array-Reihenfolge; daurogen optional im
//                 Bestand, aber NICHT im RenderItem (Typ #17 verlangt number):
//                 fehlender Trim heisst "ganzes Video" (0 / Asset.dauer); fehlen
//                 BEIDE, ist das Element unbrauchbar -> ungueltige_eingabe.
//   4. Segmente : alsPng(zeichneSegment(aktion, vorlage, marke)) - der EINZIGE
//                 Zeichenpfad (TK 9.10.1); bei ok:false abbrechen ohne einreichen.
//   5. Band-Items: art + Höhe aus der SELBEN Band-Vorlage, die die PNGs gemalt hat
//                 (TK 9.2.8); volle Höhe fehlt / vollflaechige Vorlage ->
//                 ungueltiges_element-Wulst? nein — vorb beseitignd ungueltige_eingabe.
//   6. Einreihen: rufeAuf(queue:reiheEin, { art: 'render', payload: request });
//                 renderId HIER erzeugt (9.2.7); Profile regelt RENDER_PROFILE;
//                 Pfad KEIN Teil der Anfrage (nur der Name).
//   7. Der Export ist KEIN Sonderfall des Renders: dicover eigene Nutzlast und
//                 läuft über denselben Torwächter; die Datei nennt weder Dialog noe Pfad.

// Der Wurf von zeichneSegment wird NICHT gefangen (Issue, E-7): Ein mit
// Systemschrift gemaltes Segment sieht gültig aus, misst aber andere Breiten;
// das Rufen läuft an der Vorbereitung vorbei (die Hülle fängt hier nur als
// PNG-Export-Fehler, am Erste, falls der UIT-Umhüllter angreifern ist).

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import { erzeugeId } from '../../shared/contracts/id'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { findeKaputteStellen } from './kaputt-erkennung'
import { pruefeAusgabeName } from './render-dialog'
import { zeichneSegment } from '../template-canvas/zeichne-segment'
import { alsPng } from '../template-canvas/als-png'
import { stelleMarkeBereit } from '../gemeinsam/marken-bereitstellung'

import type { Project, Listenelement } from '../../shared/contracts/project'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { RenderRequest, RenderItem, RenderItemVideo } from '../../shared/contracts/render-request'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { zerlegeVideo, rotiereBand } from './unterbrechungs-zerlegung'

export type AusloeseFehlercode = 'kaputte_elemente' | 'png_export_fehler' | 'marke_nicht_ladbar'

export async function loeseRenderAus(
  projekt: Project,
  ausgabeName: string,
  marke: Marke,
  vorlagen: readonly Vorlage[],
): Promise<Ergebnis<{ auftragId: string }, AusloeseFehlercode>> {
  // SCHRITT 1 - Sperre. Kein PNG, kein Einreihen: EIN Platzhalter im Endvideo wäre
  //ipiential, und die Führung (9.7.5) muss absehen.
  const stellen = findeKaputteStellen(projekt)
  if (stellen.length > 0) {
    return {
      ok: false,
      fehler: {
        code: 'kaputte_elemente',
        meldung: `${stellen.length} kaputte Stelle(n) in der Wiedergabeliste. Der Render wird nicht gestartet.`,
        daten: { stellen },
      },
    }
  }

  // SCHRITT 2 - die VORPRUEFUNG des Namens (Nutzereingabe, TK 9.2.6). Die
  // maßgebliche Validierung bleibt im Main; die `projects/<id>/output/`-Prüfung
  // kann der Renderer nicht leisten (keine absoluten Pfade, TK 9.5.7).
  if (pruefeAusgabeName(ausgabeName) !== 'ok') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: `Der Ausgabename "${ausgabeName}" ist nicht zugelassen (TK 9.2.6).`,
        daten: undefined,
      },
    }
  }

  // #310 - die Rahmen-Marke EINMAL je Aufruf, NUR wenn ein Band gezeichnet wird.
  // Der Renderer hat sie mit den Band-PNGs benutzt; der Render-Service bekommt sie
  // nicht mehr zur Laufzeit (TK 9.2.2/9.15.4, #316).
  const brauchtStandardMarke = projekt.liste.some(
    (element) => element.art === 'video' && element.einblendung !== null,
  )
  let standardMarke: Marke | null = null
  if (brauchtStandardMarke) {
    try {
      const bereit = await stelleMarkeBereit(projekt.standardMarkeId)
      if (!bereit.ok) {
        return {
          ok: false,
          fehler: { code: 'marke_nicht_ladbar', meldung: bereit.fehler.meldung, daten: undefined },
        }
      }
      standardMarke = bereit.wert
    } catch (ursache) {
      return {
        ok: false,
        fehler: {
          code: 'marke_nicht_ladbar',
          meldung: ursache instanceof Error ? ursache.message : String(ursache),
          daten: undefined,
        },
      }
    }
  }

  // SCHRITT 4 - die RenderItems über die Liste, in ARRAY-Reihenfolge (die
  // Zeichenreihenfolge ist die gespeicherte; nichts wird sortiert oder gefiltert).
  const elemente: RenderItem[] = []
  for (const element of projekt.liste) {
    if (element.art === 'segment') {
      // Der EINZIGE Zeichenaufruf im Auslöse-Weg; die Vorlage holt die Aktion.
      const aktion = projekt.aktionen.find((a) => a.id === element.ref)
      if (aktion === undefined) {
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe' as const, meldung: `Listenelement "${element.id}" zeigt auf eine unbekannte Aktion.`, daten: undefined },
        }
      }
      const zeichenvorlage = vorlagen.find((v) => v.id === aktion.vorlagenId)
      if (zeichenvorlage === undefined) {
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe' as const, meldung: `Aktion "${aktion.titel}" verwendet eine unbekannte Vorlage.`, daten: undefined },
        }
      }
      // Der Wurf von zeichneSegment wird NICHT gefangen (E-7 des Issues).
      // rahmenMarke === marke (TK v3.18 / M8-21).
      const bild = zeichneSegment(aktion, zeichenvorlage, marke, marke)
      const png = await alsPng(bild)
      if (!png.ok) {
        // Ein halb bestücktes elemente-Array MUSS NICHT in die Queue.
        return { ok: false, fehler: { code: 'png_export_fehler', meldung: png.fehler.meldung, daten: undefined } }
      }
      if (element.dauer === null) {
        // Der geforderte Typ #17 verlangt number; es wird NICHTS geraten oder
        // ersetzt - ein erfundener Wert lief falsch lange aus dem Video (TK 9.1.1).
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe', meldung: `Listenelement "${element.id}" ist unbrauchbar, Dauer fehlt; als Art 'segment' aber verlangt.`, daten: undefined },
        }
      }
      elemente.push({ id: element.id, art: 'segment', png: png.wert, dauer: element.dauer })
    } else {
      // art 'video': Der Quelldatei-Auflösung über die Asset-ID
      const asset = projekt.assets.find((b) => b.id === element.ref)
      if (asset === undefined) {
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe' as const, meldung: `Listenelement "${element.id}" zeigt auf ein unbekanntes Medium.`, daten: undefined },
        }
      }
      // medienRef ist der RELATIVE Dateiname (TK 9.4.8, TK 9.5.7).
      const trimStart = element.trimStart ?? 0
      const trimEnde = element.trimEnde ?? asset.dauer
      if (trimEnde === null) {
        // Beide null (trimEnde UND Asset.dauer): Unbrauchbar, kein gerarteter Wert.
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe', meldung: `Listenelement "${element.id}" (Video) hat weder trimEnde noch eine Asset-Dauer.`, daten: undefined },
        }
      }

      // Das Werbeband EINMAL bauen (falls vorhanden) - es wird auf JEDEN Video-Teil gelegt.
      const band = await baueBand(element, projekt, vorlagen, marke, standardMarke)
      if (!band.ok) return band

      // OHNE Unterbrechungen: EIN Video-Item, wie bisher.
      const unterbrechungen = element.unterbrechungen ?? []
      if (unterbrechungen.length === 0) {
        elemente.push({ id: element.id, art: 'video', medienRef: asset.dateiname, trimStart, trimEnde, einblendung: band.wert })
        continue
      }

      // #435: das Video an den Zeitstellen zerlegen (rein, `unterbrechungs-zerlegung.ts`).
      // Jeder Video-Teil traegt das Band in der richtigen Phase (`rotiereBand`); die
      // Einschuebe werden eigene Segment-Items. Die `id` bleibt die des Elements, damit der
      // Reparatur-Modus (9.7.5) das Element ueber `RenderResult.fehlerhaftesElementId` findet.
      for (const stueck of zerlegeVideo(trimStart, trimEnde, unterbrechungen)) {
        if (stueck.art === 'video') {
          elemente.push({
            id: element.id,
            art: 'video',
            medienRef: asset.dateiname,
            trimStart: stueck.trimStart,
            trimEnde: stueck.trimEnde,
            einblendung:
              band.wert === null
                ? null
                : { ...band.wert, abschnitte: rotiereBand(band.wert.abschnitte, stueck.bandVersatzSekunden) },
          })
          continue
        }
        const aktion = projekt.aktionen.find((a) => a.id === stueck.aktionRef)
        if (aktion === undefined) {
          return {
            ok: false,
            fehler: { code: 'ungueltige_eingabe' as const, meldung: `Unterbrechung von "${element.id}" zeigt auf eine unbekannte Aktion.`, daten: undefined },
          }
        }
        const zeichenvorlage = vorlagen.find((v) => v.id === aktion.vorlagenId)
        if (zeichenvorlage === undefined) {
          return {
            ok: false,
            fehler: { code: 'ungueltige_eingabe' as const, meldung: `Aktion "${aktion.titel}" verwendet eine unbekannte Vorlage.`, daten: undefined },
          }
        }
        // Der Wurf von zeichneSegment wird NICHT gefangen (E-7). rahmenMarke === marke.
        const png = await alsPng(zeichneSegment(aktion, zeichenvorlage, marke, marke))
        if (!png.ok) {
          return { ok: false, fehler: { code: 'png_export_fehler', meldung: png.fehler.meldung, daten: undefined } }
        }
        elemente.push({ id: element.id, art: 'segment', png: png.wert, dauer: stueck.dauer })
      }
    }
  }

  // SCHRITT 5 - der Request: renderId HIER erzeugt (9.2.7); profil UNVERÄNDERT aus
  // #18; der AusgabePFAD ist NICHT Teil der Anfrage (FA-22).
  const request: RenderRequest = {
    renderId: erzeugeId(),
    projektId: projekt.id,
    elemente,
    profil: RENDER_PROFILE,
    ausgabeName,
  }
  return rufeAuf<{ auftragId: string }>(KANAELE.queue.reiheEin, { art: 'render', payload: request })
}

/**
 * Baut das Werbeband EINES Video-Elements (oder null). art + Höhe kommen aus DERSELBEN
 * Band-Vorlage wie die PNGs (TK 9.2.8); die Abschnitts-PNGs entstehen ueber DENSELBEN
 * Zeichenpfad wie ein Segment (`zeichneSegment`/`alsPng`).
 *
 * AUSGELAGERT (statt inline in `loeseRenderAus`), weil ein unterbrochenes Video MEHRERE
 * Video-Teile hat, die sich DASSELBE Band teilen - je Teil in anderer Phase (`rotiereBand`,
 * #435). So wird das Band EINMAL gezeichnet, nicht je Teil.
 */
async function baueBand(
  element: Listenelement,
  projekt: Project,
  vorlagen: readonly Vorlage[],
  marke: Marke,
  standardMarke: Marke | null,
): Promise<Ergebnis<RenderItemVideo['einblendung'], AusloeseFehlercode>> {
  if (element.einblendung === null) return { ok: true, wert: null }
  if (standardMarke === null) {
    // Unerreichbar, wenn `brauchtStandardMarke` oben korrekt geprueft hat - aber
    // TypScript braucht die Verengung, und ein stiller Fallback waere schlimmer.
    return {
      ok: false,
      fehler: {
        code: 'marke_nicht_ladbar',
        meldung: `Die Projekt-Standardmarke "${projekt.standardMarkeId}" wurde nicht bereitgestellt.`,
        daten: undefined,
      },
    }
  }
  const eigenesBand = element.einblendung
  const bandVorlage = vorlagen.find((v) => v.id === eigenesBand.bandVorlageId)
  if (bandVorlage === undefined) {
    return {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: `Listenelement "${element.id}" verweist auf eine unbekannte Band-Vorlage.`, daten: undefined },
    }
  }
  if (bandVorlage.art === 'vollflaeche' || bandVorlage.höhe === null) {
    return {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: `Listenelement "${element.id}" verweist auf eine Vorlage ohne Bandhöhe.`, daten: undefined },
    }
  }
  const abschnitte: Array<{ png: Uint8Array; dauer: number }> = []
  for (const abschnitt of eigenesBand.abschnitte) {
    const absAktion = projekt.aktionen.find((a) => a.id === abschnitt.aktionRef)
    if (absAktion === undefined) {
      return {
        ok: false,
        fehler: { code: 'png_export_fehler', meldung: `Band-Abschnitt von "${element.id}" zeigt auf eine unbekannte Aktion.`, daten: undefined },
      }
    }
    // Der Wurf von zeichneSegment wird NICHT gefangen (E-7). Drittes Argument =
    // Inhaltsmarke, viertes = aufgeloeste Projekt-Standardmarke (#310).
    const bandPng = await alsPng(zeichneSegment(absAktion, bandVorlage, marke, standardMarke))
    if (!bandPng.ok) {
      return { ok: false, fehler: { code: 'png_export_fehler', meldung: bandPng.fehler.meldung, daten: undefined } }
    }
    abschnitte.push({ png: bandPng.wert, dauer: abschnitt.dauer })
  }
  return {
    ok: true,
    wert: {
      // KH (E5, #174): art und Höhe entsprechend den PNGs, im selben Pass
      art: bandVorlage.art === 'split' ? 'split' : 'einblendung',
      höhe: bandVorlage.höhe,
      bandVorlageId: eigenesBand.bandVorlageId,
      abschnitte,
    },
  }
}

export async function loeseExportAus(
  projektId: string,
  dateiname: string,
  zielPfad: string,
): Promise<Ergebnis<{ auftragId: string }>> {
  // Der Export ist KEIN Sonderfall des Renders: eigener Auftrag, eigener
  // Fehlercode (TK 9.6.4), seriell NACH dem Render; der Zielname bleibt bei
  // quelcontext (FA-22), der ZIELPFAD ist Instant und aus der Oberfläche voll Anw-
  // geholt (diese Datei öffnet keinen Dialog).
  return rufeAuf<{ auftragId: string }>(KANAELE.queue.reiheEin, {
    art: 'export',
    payload: { projektId, dateiname, zielPfad },
  })
}
