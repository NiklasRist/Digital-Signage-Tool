/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #326.
// [marken-editor] Dateidialog auslösen und den gewählten Pfad importieren
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
// GERUEST-PRUEFSUMME: db4b71c428b5c348
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke, SchriftRolle } from '../../shared/contracts/marke'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { importiereSchrift } from './schriften-bearbeiten'   // #297
import { importiereLogo } from './logo-bearbeiten'           // #298

/**
 * Öffnet den Dateidialog mit dem .woff2-Filter, nimmt den ERSTEN gewählten Pfad und importiert ihn
 * über importiereSchrift (#297) als Schrift der Rolle `rolle` in die Marke `markeId`.
 *
 * ERFOLG MIT `wert: null` BEDEUTET ABBRUCH: Der Nutzer hat den Dialog geschlossen, ohne zu wählen.
 * Dann ist NICHTS geschehen – keine Marke geändert, kein Import versucht, KEIN Fehler.
 * ERFOLG MIT `wert: Marke` bedeutet: Der Import ist durch, und die gemeinsame Sicht (#295) trägt
 * den neuen Stand bereits – das erledigt importiereSchrift, NICHT diese Datei.
 */
// Modul-interner Helfer - NICHT exportiert, damit es keinen zweiten Weg zum Dialog gibt.
async function dialogPfade(
  art: 'logo' | 'schrift',
): Promise<Ergebnis<{ pfade: string[] }, string>> {
  return rufeAuf<{ pfade: string[] }, string>(KANAELE.marken.öffneMarkenDateiDialog, { art })
}

// Der ERSTE Pfad (ENTSCHIEDEN 4): Destrukturierung, ohne ! und ohne as. Der
// undefined-Zweig faellt bewusst auf denselben Ausgang wie der Abbruch.
function ersterOderAbbruch(
  pfade: readonly string[],
): { abbruch: true } | { abbruch: false; pfad: string } {
  const [ersterPfad] = pfade
  if (ersterPfad === undefined || ersterPfad === '') {
    return { abbruch: true }
  }
  return { abbruch: false, pfad: ersterPfad }
}

export async function waehleUndImportiereSchrift(
  markeId: string,
  rolle: SchriftRolle,
): Promise<Ergebnis<Marke | null, string>> {
  // SCHRITT 1 (ENTSCHIEDEN 3): markeId VOR dem Dialog - kein Dialog, der an einer
  // leeren markeId nachtraeglich scheitert. rolle wird NICHT geprueft (Typ deckt ab).
  if (typeof markeId !== 'string' || markeId.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'waehleUndImportiereSchrift braucht eine nicht leere markeId.',
      },
    }
  }
  // SCHRITTE 2-5: Dialog, Fehler unverändert, leere Liste = Abbruch (KEIN Fehlercode),
  // erster Pfad ohne Normalisierung.
  const dialog = await dialogPfade('schrift')
  if (!dialog.ok) return dialog
  const schritt = ersterOderAbbruch(dialog.wert.pfade)
  if (schritt.abbruch) return { ok: true, wert: null }
  // SCHRITT 6-7: den Import macht importiereSchrift (#297) - und zwar samt Übernahme
  // in die gemeinsame Sicht; NICHTS davon geschieht hier noch einmal (ENTSCHIEDEN 7).
  return importiereSchrift(markeId, rolle, schritt.pfad)
}

/**
 * Öffnet den Dateidialog mit dem Bild-Filter, nimmt den ERSTEN gewählten Pfad und importiert ihn
 * über importiereLogo (#298) als Logo der Marke `markeId`.
 * Rückgabe-Bedeutung wie oben: `wert: null` = Abbruch, kein Fehler.
 */
export async function waehleUndImportiereLogo(
  markeId: string,
): Promise<Ergebnis<Marke | null, string>> {
  if (typeof markeId !== 'string' || markeId.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'waehleUndImportiereLogo braucht eine nicht leere markeId.',
      },
    }
  }
  const dialog = await dialogPfade('logo')
  if (!dialog.ok) return dialog
  const schritt = ersterOderAbbruch(dialog.wert.pfade)
  if (schritt.abbruch) return { ok: true, wert: null }
  return importiereLogo(markeId, schritt.pfad)
}
