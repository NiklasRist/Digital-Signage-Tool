// GENERIERT aus dem Signaturblock von Issue #246.
// [renderer-gemeinsam] Video-Handles vor dem Löschen freigeben
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
// GERUEST-PRUEFSUMME: 753d7c7c71518ccb
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

/**
 * Das Wenige, was diese Datei von einem Medienelement braucht. Bewusst KEIN
 * `HTMLVideoElement` – so ist die Datei ohne Browser pruefbar, und es ist unmoeglich, hier
 * versehentlich mehr am Element anzufassen als die zwei Dinge, die TK 9.4.6 nennt.
 */
export interface Medienhandle {
  /** Wird auf '' gesetzt. */
  src: string

  /** Wird danach gerufen. */
  load: () => void
}

/**
 * Register: je `assetId` die angemeldeten Handles in Anmeldereihenfolge.
 * Ein `Set` vergleicht auf Identitaet und fuehrt dasselbe Element nur einmal
 * (ENTSCHIEDEN 4 des Issues). Zusammengehalten wird ausschliesslich der Verweis
 * aufs Element – ein Element kann fuer mehrere Attributionen angemeldet sein.
 */
const angemeldeteHandles = new Map<string, Set<Medienhandle>>()

/**
 * Meldet ein `<video>` an, das auf dieses Asset zeigt.
 * Rueckgabewert ist die Abmelde-Funktion; sie ist idempotent und wirft nie.
 * Dasselbe Element zweimal anzumelden ergibt EINEN Eintrag (s. ENTSCHIEDEN 4).
 */
export function meldeVideoHandleAn(assetId: string, handle: Medienhandle): () => void {
  let eintraege = angemeldeteHandles.get(assetId)
  if (eintraege === undefined) {
    eintraege = new Set()
    angemeldeteHandles.set(assetId, eintraege)
  }
  eintraege.add(handle)

  return () => {
    angemeldeteHandles.get(assetId)?.delete(handle)
  }
}

/**
 * Gibt JEDEN angemeldeten Handle auf dieses Asset frei: `src = ''`, danach `load()`.
 * Jeder freigegebene Handle wird dabei abgemeldet.
 * PFLICHT vor dem Einreihen eines `loeschen`-Auftrags (TK 9.4.6).
 * Diese Signatur ist von #229 vorgegeben: `(assetId: string) => void`.
 */
export function gibVideoHandlesFrei(assetId: string): void {
  const eintraege = angemeldeteHandles.get(assetId)
  if (eintraege === undefined || eintraege.size === 0) {
    return
  }
  // Die Liste KOPIEREN und den Eintrag SOFORT leeren, bevor die Schleife laeuft:
  // `load()` kann synchron einen Abbau ausloesen, in dem ein Abmelder laeuft; eine
  // Schleife ueber die lebende Liste wuerde dabei Eintraege ueberspringen (der
  // Ablauf von gibVideoHandlesFrei, woertlich aus dem Issue).
  const kopie = [...eintraege]
  angemeldeteHandles.delete(assetId)
  for (const handle of kopie) {
    handle.src = ''
    handle.load()
  }
}

/** Wie viele Handles fuer dieses Asset angemeldet sind. NUR fuer Tests und Fehlersuche. */
export function zaehleVideoHandles(assetId: string): number {
  return angemeldeteHandles.get(assetId)?.size ?? 0
}

/** NUR fuer Tests: entfernt alle Anmeldungen, OHNE etwas freizugeben. */
export function setzeVideoHandlesZurueck(): void {
  angemeldeteHandles.clear()
}