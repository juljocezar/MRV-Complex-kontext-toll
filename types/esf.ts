
/**
 * HURIDOCS Events Standard Formats (ESF) Implementation.
 * Basierend auf den HURIDOCS Micro-thesauri & ESF Guidelines.
 */

/** Basis für alle ESF-Datensätze (verwaltende Felder etc.) */
export interface EsfBaseRecord {
  id?: string;                // Added: Generic ID for internal DB compatibility
  sourceDocId?: string;       // Interne Referenz auf das Quelldokument
  
  // Verwaltungsdaten / Management (z.B. 160–172)
  receivedDate?: string;      // 160
  entryDate?: string;         // 161
  enteredBy?: string;         // 162
  projectTitle?: string;      // 163
  comments?: string;          // 165
  supportingDocuments?: string[]; // 166 (z.B. Dateinamen/IDs)
  files?: string[];           // 167
  recordGrouping?: string;    // 168
  updatedDate?: string;       // 170
  updatedBy?: string;         // 171
  monitoringStatus?: string;  // 172
}

/**
 * EVENT FORMAT (HURIDOCS ESF)
 * Feld-Tags 101–172
 */
export interface EsfEventRecord extends EsfBaseRecord {
  // Identifikatoren
  eventRecordNumber: string;  // 101 (Primärschlüssel)
  eventTitle?: string;        // 102
  confidentiality?: string;   // 108

  // Faktische / beschreibende Daten
  geoTerm?: string;           // 111 Geografischer Begriff
  localGeoArea?: string;      // 112 Lokales geografisches Gebiet
  startDate?: string;         // 113 Erstes Datum (ISO)
  endDate?: string;           // 114 Endgültiges Datum (ISO)
  description?: string;       // 115 Ereignisbeschreibung
  consequences?: string;      // 116 Auswirkungen des Ereignisses

  // Analytische Felder
  notes?: string;             // 150 Bemerkungen
  violationStatus?: string;   // 151 Status des Verstoßes
  violationIndex?: string;    // 152 Index der Verstöße
  affectedRights?: string[];  // 153 Betroffene Rechte
  huridocsIndex?: string;     // 154 HURIDOCS-Index
  localIndex?: string;        // 155 Lokaler Index
  otherThesaurus?: string;    // 156 Anderer Thesaurus
}

/**
 * PERSON FORMAT (HURIDOCS ESF)
 */
export type EsfPersonRole =
  | 'victim'
  | 'perpetrator'
  | 'information_source'
  | 'intervening_party'
  | 'other';

export interface EsfPersonRecord extends EsfBaseRecord {
  personRecordNumber: string; // 901 (Primärschlüssel)

  // Identifikationsdaten
  fullNameOrGroupName: string; // 902 Name
  
  // Erweiterte ESF Felder
  sex?: string;                // 907
  dateOfBirth?: string;        // 908
  occupation?: string;         // 913

  roles?: EsfPersonRole[];     // Rolle im Kontext
}

/**
 * GENERISCHE LINK-BASIS (für Act, Involvement, Chain of Events)
 */
export interface EsfLinkBase extends EsfBaseRecord {
  id: string;             // Interner Schlüssel (Required for Links)
  fromRecordId: string;   // Referenz 1 (z.B. Event / Person)
  toRecordId: string;     // Referenz 2 (z.B. Person / Act)
  linkType?: string;      // 09 – Art der Verbindung
}

/** Beispiel: Act-Link (Tat gegen Opfer) */
export interface EsfActLink extends EsfLinkBase {
  eventId?: string;           // Optional link to specific Event (if not via direct link logic)
  actDescription?: string;    // faktische/beschreibende Daten 10–49
  actClassification?: string; // analytisches Feld (z.B. Art der Tat - Tag 2101)
  actMethod?: string;         // Tag 2102: Methode
}

/** Beispiel: Involvement-Link (Beteiligung eines Täters an Tat) */
export interface EsfInvolvementLink extends EsfLinkBase {
  involvementRole?: string;   // Rolle des Täters in der konkreten Tat
}

// Container für Analyse-Ergebnisse
export interface EsfAnalysisResult {
    events: EsfEventRecord[];
    persons: EsfPersonRecord[];
    actLinks: EsfActLink[];
    involvementLinks: EsfInvolvementLink[];
}
