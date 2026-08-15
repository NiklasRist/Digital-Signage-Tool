// GENERIERT aus dem Signaturblock von Issue #25.
// [ipc] Kanal-Namens-Registry anlegen
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
// GERUEST-PRUEFSUMME: 8746a21b1aca094d

// Wird von JEDEM M2–M7-Issue ergänzt, das einen neuen Kanal/ein neues Ereignis einführt.
// Muster: '<modul>:<operation>' für Aufrufe, '<modul>:<ereignis>' für Ereignisse.
// Struktur ENTSCHIEDEN: verschachtelt (KANAELE.<modul>.<operation>), nicht flach – liest sich
// näher am aufrufenden Modul.
export const KANAELE = {
  // Beispiel-Eintrag, tatsächliche Liste wächst mit M2-M7:
  // media: { importMedium: 'media:importMedium', ... },

  // auftrags-manager (#71). Vier Operations-Kanäle und zwei Ereignisse; das Präfix ist
  // `queue:`, weil TK 9.1.1 Punkt 4 `queue:geaendert` wörtlich als Beispiel führt.
  //
  // ERSETZT am 13.08.2026 den Platzhalter-Kommentar, der hier als zweites Beispiel eine
  // Gruppe namens `auftrag` mit ebendiesem Präfix zeigte — FALSCH, und zwar genau an der
  // Stelle, an der #71 nachschaut. Ein Beispiel mit falschem Präfix ist gefährlicher als
  // gar keins: Es ist die wahrscheinlichste Quelle dafür, dass ein späteres Modul (M3–M7)
  // den falschen Namensraum abschreibt.
  //
  // KEINE weiteren Kanäle in dieser Gruppe: kein Lesezugang zu Q3 (protokoll.json, in v1
  // nicht vorgesehen) und keiner für pendingDeletions (main-intern, TK 9.4.7).
  queue: {
    reiheEin: 'queue:reiheEin',
    entferne: 'queue:entferne',
    wiederhole: 'queue:wiederhole',
    holeStand: 'queue:holeStand',
    geaendert: 'queue:geaendert', // Ereignis Main → Renderer, Nutzlast Auftrag[], ohne Hülle
    stoerung: 'queue:stoerung', // Ereignis Main → Renderer, Nutzlast Klartext (#65)
  },

  // project-store (#76). Die vierzehn Namen ENTSTEHEN hier und nirgends sonst; die
  // Verdrahtung (src/main/ipc-gateway/project-store-verdrahtung.ts) und die Renderer-Seite
  // lesen sie beide von hier. Präfix `project:` nach dem Muster `<modul>:<operation>` –
  // TK 9.1.1 Punkt 4 führt `project:setzeTrim` wörtlich als Beispiel.
  //
  // SCHLÜSSEL UND STRING TRAGEN BEIDE DEN UMLAUT, wo die Operation ihn trägt
  // (`öffneProjekt`, `löscheProjekt`, `löscheAktion`, `fügeElementHinzu`). Das ist keine
  // Nachlässigkeit, sondern der Vertragstest von #25: Er verlangt
  // `kanal === `${modul}:${operation}``, Schlüssel und Endung des Strings müssen also
  // zeichengleich sein. Dieselbe Auflösung wie bei `media.öffneMedienDialog`; TK 9.1.1
  // Punkt 4 führt mit `vorlagen:löscheVorlage` selbst einen umlauthaltigen Kanal.
  //
  // NUR INSTANT-OPERATIONEN: Kein Kanal für die Pfad-Funktionen (#49 – sie liefern absolute
  // Pfade, "der Renderer sieht nur relative Referenzen", TK 9.5.7), keiner für das D1-Lock
  // (#32), `schreibeProjekt` (#46), `planeAutoSpeicherung`/`sofortFlush` (#47), die Migration
  // (#48) oder die Einzel-Instanz-Sperre (#51), und keiner für die Asset-Operationen – die
  // gehören dem media-service und laufen als Auftrag (TK 9.1.1 Punkt 2).
  //
  // KEIN Ereignis in dieser Gruppe: `project:autoSpeichernStatus` (#47) gehört zu #238 und
  // wird DORT eingetragen, nicht hier. Zwei weitere Operations-Kanäle meldet #153 an
  // (`setzeEinblendung`, `setzeElementReferenz`), ein weiterer #240
  // (`setzeBearbeitungsstand`) – die Gruppe darf also wachsen; diese vierzehn sind die
  // von #76.
  project: {
    erstelleProjekt: 'project:erstelleProjekt',
    öffneProjekt: 'project:öffneProjekt',
    listeProjekte: 'project:listeProjekte',
    dupliziereProjekt: 'project:dupliziereProjekt',
    löscheProjekt: 'project:löscheProjekt',
    erstelleAktion: 'project:erstelleAktion',
    bearbeiteAktion: 'project:bearbeiteAktion',
    löscheAktion: 'project:löscheAktion',
    fügeElementHinzu: 'project:fügeElementHinzu',
    entferneElement: 'project:entferneElement',
    ordneNeu: 'project:ordneNeu',
    setzeTrim: 'project:setzeTrim',
    setzeDauer: 'project:setzeDauer',
    listeAusgaben: 'project:listeAusgaben',

    // ERGAENZT am 15.08.2026 durch #153 - die beiden nach #76 hinzugekommenen Operationen
    // `setzeEinblendung` (#120) und `setzeElementReferenz` (#152). Angemeldet werden sie in
    // einer EIGENEN Datei (src/main/ipc-gateway/project-store-nachtrag.ts), weil #76 seiner
    // Datei ausdruecklich verbietet, ueber die vierzehn hinauszugehen; der Kommentar oben
    // sieht das Wachstum dieser Gruppe vor ("die Gruppe darf also wachsen").
    //
    // Beides sind Instant-Mutationen des project-store (TK 9.5.2 seit v2.7), gehoeren also
    // in genau diesen Namensraum. Der Schluessel ist zeichengleich zum Operationsnamen -
    // der Vertragstest von #25 verlangt `kanal === `${modul}:${operation}``.
    setzeEinblendung: 'project:setzeEinblendung',
    setzeElementReferenz: 'project:setzeElementReferenz',
  },

  // config-store (#77). Die fünf Namen ENTSTEHEN hier und nirgends sonst; die
  // Verdrahtung (src/main/ipc-gateway/config-store-verdrahtung.ts) und die
  // Renderer-Seite lesen sie beide von hier. Präfix `config:` nach dem Muster
  // `<modul>:<operation>`, Modulname `config-store` → `config`.
  // KEIN Schreibkanal für die Marke: `leseMarke` ist nur lesend (TK 9.5.6).
  config: {
    leseKonfig: 'config:leseKonfig',
    setzeAktivesProjekt: 'config:setzeAktivesProjekt',
    setzeExportZiel: 'config:setzeExportZiel',
    leseMarke: 'config:leseMarke',
    setzeUIVoreinstellung: 'config:setzeUIVoreinstellung',
  },

  // media-service (#93). GENAU EIN Kanal, und das ist eine Festlegung, keine Lücke:
  // `importMedium` und `löscheMedium` bekommen ausdrücklich KEINEN Kanal – sie laufen
  // über `reiheEin` der Auftragsverwaltung („`import`, `loeschen`, `render` und `export`
  // werden damit **nicht** als direkte Request/Response-Operationen aufgerufen, sondern
  // über `reiheEin` eingereiht", TK 9.3.4). Ein direkter Kanal wäre ein zweiter Weg an
  // der seriellen Ordnung vorbei. `reconcile` (#91) und die `pendingDeletions` sind
  // main-intern (TK 9.4.7) und tauchen hier ebenfalls nicht auf. Kein Ereignis: Der
  // Stand der Import-/Löschaufträge kommt über `queue:geaendert`.
  //
  // KANAL-STRING UND SCHLÜSSEL TRAGEN BEIDE DEN UMLAUT. Der String folgt der Kanalbenennung
  // `<modul>:<operation>` mit der Operation, wie sie im Vertrag heißt (TK 9.4.3:
  // `öffneMedienDialog`); der Vertrag führt umlauthaltige Kanäle selbst als Beispiel
  // (`vorlagen:löscheVorlage`, TK 9.1.1 Punkt 4).
  //
  // KORRIGIERT am 13.08.2026: Hier stand „Der SCHLÜSSEL bleibt ASCII, weil er im Quelltext
  // beider Prozesse getippt und importiert wird". Das klingt vernünftig und war trotzdem
  // falsch — es bricht den Vertragstest von #25, s. die Begründung am Eintrag selbst. Der
  // Bau-Agent von #93 hat den Bruch gemeldet und die Entscheidung richtig NICHT selbst
  // getroffen: Der Test gehört zu #25 und lag ausserhalb seines Dateibereichs.
  media: {
    // SCHLÜSSEL MIT UMLAUT, und das ist eine Entscheidung vom 13.08.2026, keine Nachlässigkeit.
    //
    // #93 schreibt den Kanal verbindlich als `media:öffneMedienDialog` vor, setzt in seinem
    // eigenen Signaturblock aber `oeffneMedienDialog` als Schlüssel — und verletzt damit den
    // Vertragstest von #25 („kanal === `${modul}:${operation}`") PER KONSTRUKTION. Der
    // Widerspruch steht also im Issue, nicht im Bau; er fiel beim Bau von #93 sofort auf, weil
    // der Test rot wurde.
    //
    // Aufgelöst zugunsten des Umlauts: Der Kanalname ist im Issue verbindlich, der Schlüssel
    // nicht. Umlaute in Bezeichnern sind im Projekt ohnehin üblich (`löscheMedium`,
    // `löscheProjekt`, `öffneProjekt`), und TK 9.1.1 Punkt 4 führt `vorlagen:löscheVorlage` selbst
    // als Beispiel. Die Gegenrichtung — den Test lockern — wurde verworfen: Er ist die einzige
    // Stelle, an der ein vertippter Kanalname auffällt, bevor er im Betrieb ins Leere läuft.
    öffneMedienDialog: 'media:öffneMedienDialog',
  },

  // export-service (#191). GENAU EIN Kanal, und das ist eine Festlegung, keine Lücke:
  // Der EXPORT selbst bekommt KEINEN Kanal – er ist ein Auftrag und läuft über `reiheEin`
  // („`import`, `loeschen`, `render` und `export` werden damit **nicht** als direkte
  // Request/Response-Operationen aufgerufen, sondern über `reiheEin` eingereiht",
  // TK 9.3.4). Ein direkter Kanal wäre ein zweiter Weg an der einzigen Serialisierung
  // des Systems vorbei. `listeAusgaben` ist ein `project-store`-Kanal und steht oben.
  //
  // `wähleExportZiel` dagegen ist eine Instant-Operation („Datei-Dialog öffnen",
  // TK 9.3.2) und braucht den Kanal: Der Renderer kennt keine absoluten Pfade
  // (TK 9.5.7), `ExportRequest.zielPfad` wäre ohne ihn nicht füllbar.
  //
  // KANAL-STRING UND SCHLÜSSEL TRAGEN BEIDE DEN UMLAUT – dieselbe Auflösung wie bei
  // `media.öffneMedienDialog`. Der Vertragstest von #25 verlangt
  // `kanal === `${modul}:${operation}``; eine „bereinigte" Schreibweise wäre die zweite
  // Schreibweise für dieselbe Sache und bräche die Zuordnung zwischen Kanalname,
  // Vertrag (TK 9.6.1: `wähleExportZiel`) und Funktion.
  export: {
    wähleExportZiel: 'export:wähleExportZiel',
  },

  // render-service (#191). NUR EIN EREIGNIS, kein einziger Aufrufkanal: `renderReel` und
  // `cancelRender` laufen über die Warteschlange (`reiheEin` bzw. `entferne`, TK 9.3.4);
  // ein eigener Kanal wäre dort ein zweiter Weg an der Serialisierung, hier ein zweiter
  // Abbruchweg.
  //
  // `render:fortschritt` steht WÖRTLICH so im TK (9.1.1 Punkt 4 und 9.2.7: „Der Kanal
  // `render:fortschritt` wird gebaut, nicht nur erwähnt.") und ist zeichengleich
  // übernommen. Sender ist die Verdrahtung in
  // src/main/ipc-gateway/export-verdrahtung.ts (#191), die sich dafür über
  // `aufRenderFortschritt` (#178) anmeldet; der `render-service` selbst kennt weder
  // Fenster noch Kanalnamen.
  render: {
    // Ereignis Main → Renderer, Nutzlast RenderProgress, OHNE Hülle und OHNE Endzustand
    // (TK 9.1.1 Punkt 5). Erfolg, Fehler und Abbruch kommen ausschliesslich über das
    // RenderResult (TK 9.2.7).
    fortschritt: 'render:fortschritt',
  },
} as const
