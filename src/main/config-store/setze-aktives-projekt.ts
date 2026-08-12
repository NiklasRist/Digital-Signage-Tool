// GENERIERT aus dem Signaturblock von Issue #27.
// [config-store] setzeAktivesProjekt implementieren
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
// GERUEST-PRUEFSUMME: eed82ffafbfa4f79
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
import type { GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import { aendereKonfig, type ConfigFehlercode } from './schreibe-config'   // #31

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #31: aendereKonfig<T>(
//          aenderung: (konfig: AppKonfig) => Ergebnis<{ konfig: AppKonfig; wert: T }, ConfigFehlercode>,
//        ): Promise<Ergebnis<T, ConfigFehlercode>>
//        // Lesen - Aendern - Schreiben als EINE ununterbrechbare Einheit; `aenderung` ist
//        // SYNCHRON, und genau das ist die Zusage: ohne `await` im Rueckruf kann zwischen
//        // Lesen und Schreiben nichts anderes laufen.
//   #31: type ConfigFehlercode = 'speicher_fehler'
//   #265: interface AppKonfig { aktivesProjektId: string | null
//                               letztesExportZiel: string | null
//                               uiVoreinstellungen: Record<string, unknown> }

/**
 * Merkt sich das zuletzt geoeffnete Projekt (TK 9.5.6, FA-15).
 *
 * WARUM `aendereKonfig` UND NICHT `leseKonfig` + `schreibeConfig`: Die beiden Aufrufe
 * nacheinander sind ein klassisches Lost Update. Setzt der Nutzer im selben Moment ein
 * Exportziel (#28), lesen beide Operationen denselben Stand, beide schreiben ihr eigenes Feld -
 * und das zuerst geschriebene ist weg, ohne dass irgendetwas bricht. `aendereKonfig` klammert
 * Lesen und Schreiben zu einer Einheit; der Aenderungs-Rueckruf unten ist deshalb SYNCHRON und
 * darf es nie werden.
 *
 * WARUM DAS SCHREIBEN HIER ABGEWARTET WIRD (der STOPP-Punkt des Issues, "synchron oder
 * entprellt?"): Fuer den `config-store` gibt es KEINE entprellte Auto-Speicherung und - anders
 * als beim `project-store` - auch kein Ereignis, auf dem ein spaeterer Schreibfehler noch
 * gemeldet werden koennte (`project:autoSpeichernStatus`, TK 9.5.4, gehoert D1). Wer hier nicht
 * abwartet, hat fuer einen Fehlschlag also keinen zweiten Weg mehr - der Verlust faellt erst beim
 * naechsten Start auf und sieht dann nach Datenverlust aus. Genau davor warnt dieses Issue.
 * Dazu passt der Vertrag: TK 9.5.6 uebernimmt aus 9.5.4 ausdruecklich nur die SCHREIB-Invarianten
 * ("atomar, schemaVersion"), nicht die Entprellung. Sie waere hier auch zwecklos - entprellt wird
 * gegen Platten-Haemmern beim Slider-Ziehen; ein Projektwechsel passiert einmal, nicht 50-mal
 * pro Sekunde.
 *
 * Die Zusage der Instant-Operation bleibt davon unberuehrt: `ok` heisst "gueltig uebernommen".
 * Dass hier zusaetzlich schon geschrieben WURDE, ist mehr als zugesagt, nicht weniger.
 *
 * NICHT GEPRUEFT wird, ob es das Projekt gibt - das ist laut Issue Sache des Aufrufers
 * (i. d. R. direkt nach erfolgreichem `oeffneProjekt`, #34).
 */
export async function setzeAktivesProjekt(projektId: string): Promise<Ergebnis<void>> {
  // Validieren VOR jeder Wirkung. Die Typangabe allein genuegt nicht: Der Wert kommt ueber die
  // IPC-Grenze und ist dort zur Laufzeit alles Moegliche. Ein leerer String waere besonders
  // heimtueckisch - er landete klaglos in config.json und der naechste Start suchte ein Projekt
  // ohne Namen.
  //
  // `trim` dient allein dem Erkennen von "leer"; gespeichert wird der Wert UNVERAENDERT. Der
  // config-store ist nicht die ID-Autoritaet (#20) und darf eine fremde Kennung nicht umschreiben.
  if (typeof projektId !== 'string' || projektId.trim() === '') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'setzeAktivesProjekt braucht eine nicht leere projektId.',
      },
    }
  }

  const ergebnis = await aendereKonfig<void>((konfig) => ({
    ok: true,
    // Der Spread uebernimmt den GANZEN gelesenen Stand; nur `aktivesProjektId` wird ersetzt.
    // Ein aus Einzelfeldern zusammengebautes Objekt wuerde ein spaeter hinzukommendes
    // AppKonfig-Feld lautlos wegwerfen - und der Fehler faellt erst auf, wenn das Feld gebraucht
    // wird.
    wert: { konfig: { ...konfig, aktivesProjektId: projektId }, wert: undefined },
  }))

  if (ergebnis.ok) {
    return { ok: true, wert: undefined }
  }
  return {
    ok: false,
    fehler: {
      code: alsGenerisch(ergebnis.fehler.code),
      meldung:
        ergebnis.fehler.code === 'speicher_fehler'
          ? `[speicher_fehler] ${ergebnis.fehler.meldung}`
          : ergebnis.fehler.meldung,
    },
  }
}

/**
 * NOTBEHELF, KEIN ENTWURF - hier geht Information verloren, und das ist gemeldet.
 *
 * Die verbindliche Signatur lautet `Ergebnis<void>`, also OHNE zweiten Typparameter; ihre
 * Fehlerseite traegt allein die drei generischen Codes. `aendereKonfig` kann aber
 * `speicher_fehler` liefern (volle Platte, Datenort abgezogen), und dieser Code ist dort nicht
 * zuweisbar. Er wird deshalb auf `unbekannter_fehler` abgebildet und steht nur noch im
 * Meldungstext - worauf kein Aufrufer verzweigen kann. Dieselbe Stelle hat #31 bereits getroffen
 * und wurde dort per Nachtrag geloest (`Ergebnis<void, ConfigFehlercode>`); fuer #27 steht der
 * Nachtrag aus. Bis dahin NICHT selbst die Signatur aendern - das ist ein Vertrag, kein Detail.
 *
 * Die Fallunterscheidung ist bewusst am Literal aufgehaengt und nicht als `default`-Zweig
 * geschrieben: Waechst `ConfigFehlercode` um einen zweiten Code, faellt der `false`-Zweig hier im
 * Typecheck durch - der Verlust wird also gemeldet, statt sich still auszuweiten.
 */
function alsGenerisch(code: ConfigFehlercode | GenerischerFehlercode): GenerischerFehlercode {
  return code === 'speicher_fehler' ? 'unbekannter_fehler' : code
}
