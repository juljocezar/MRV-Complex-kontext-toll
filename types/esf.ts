
/**
 * HURIDOCS Events Standard Formats (ESF) Definitions
 * Based on Chapter 8: Scope Notes & Micro-thesauri
 */

export interface EsfBaseRecord {
  id: string;                // Internal UUID
  recordNumber: string;      // HURIDOCS ID (e.g. 101, 2101)
  sourceDocId?: string;      // Reference to source document
  
  // Management Fields (Common across formats)
  confidentiality?: string;   // x08 (108, 908, 2108...)
  receivedDate?: string;      // x60
  entryDate?: string;         // x61
  enteredBy?: string;         // x62
  projectTitle?: string;      // x63
  comments?: string;          // x65
  supportingDocuments?: string; // x66
  files?: string;             // x67
  recordGrouping?: string;    // x68
  updatedDate?: string;       // x70
  updatedBy?: string;         // x71
}

/** 
 * EVENT FORMAT (100 Series) 
 * Describes the overall situation/event.
 */
export interface EsfEventRecord extends EsfBaseRecord {
  eventTitle: string;         // 102
  geoTerm?: string;           // 111 (Country/Region code)
  localGeoArea?: string;      // 112
  startDate?: string;         // 113
  endDate?: string;           // 114
  description?: string;       // 115
  consequences?: string;      // 116 (Number/Impact)
  notes?: string;             // 150
  violationStatus?: string;   // 151
  violationIndex?: string[];  // 152
  affectedRights?: string[];  // 153
  huridocsIndex?: string[];   // 154
  monitoringStatus?: string;  // 172
}

/**
 * ACT FORMAT (2100 Series)
 * Specific act (violation) against a specific victim.
 * Links Person (Victim) <-> Event
 */
export interface EsfActRecord extends EsfBaseRecord {
  eventId: string;            // Link to Event (2103)
  victimId: string;           // Link to Person (2102)
  
  actType?: string;           // 2109
  startDate?: string;         // 2111
  location?: string;          // 2112
  reason?: string;            // 2113
  method?: string;            // 2114
  attribution?: string;       // 2115
  physicalConsequences?: string; // 2116
  psychologicalConsequences?: string; // 2117
  ageAtIncident?: number;     // 2118
  endDate?: string;           // 2121
  locationEnd?: string;       // 2122
  statusEnd?: string;         // 2123
  notes?: string;             // 2150
  victimCharacteristics?: string[]; // 2152
  locationType?: string;      // 2153
  domesticLaw?: string;       // 2154
  internationalLaw?: string;  // 2155

  // Additional Details (Appendices)
  detentionDetails?: {
      custodyType?: string;   // 3112
      conditions?: string;    // 3113
      access?: string;        // 3114
      legalCounsel?: string;  // 3115
  };
  tortureDetails?: {
      signedStatement?: string; // 3311
      medicalCare?: string;     // 3312
      intent?: string;          // 3351
  };
}

/**
 * PERSON FORMAT (900 Series)
 * Can be Victim, Perpetrator, Source, or Intervenor.
 */
export interface EsfPersonRecord extends EsfBaseRecord {
  fullNameOrGroupName: string; // 903
  countingUnit?: string;       // 902 (Individual, Family, Group...)
  otherNames?: string;         // 904
  addressType?: string;        // 910
  dateOfBirth?: string;        // 911
  placeOfBirth?: string;       // 912
  sex?: string;                // 915
  sexualOrientation?: string;  // 916
  idDocuments?: string;        // 917
  civilStatus?: string;        // 918
  dependents?: string;         // 919
  education?: string;          // 920
  occupation?: string;         // 922 (ILO)
  health?: string;             // 924
  religion?: string;           // 940
  citizenship?: string;        // 941
  ethnicity?: string;          // 942
  language?: string;           // 945
  sourceReliability?: string;  // 953
}

/**
 * INVOLVEMENT FORMAT (2400 Series)
 * Links Person (Perpetrator) <-> Act
 */
export interface EsfInvolvementRecord extends EsfBaseRecord {
  perpetratorId: string;      // Link to Person (2402)
  actId: string;              // Link to Act (2404)
  eventId?: string;           // Indirect Link to Event (2403)
  
  involvementRole?: string;   // 2409 (Commanded, Executed, etc.)
  perpetratorType?: string;   // 2412 (Police, Military, etc.)
  lastStatus?: string;        // 2422 (Punished, Promoted...)
  notes?: string;             // 2450
}

/**
 * INFORMATION FORMAT (2500 Series)
 * Links Person (Source) <-> Event or Person
 */
export interface EsfInformationRecord extends EsfBaseRecord {
  sourceId: string;           // Link to Person (Source) (2502)
  eventId?: string;           // Link to Event (2503)
  relatedPersonId?: string;   // Link to Person (Subject) (2504)
  
  relationshipToInfo?: string; // 2509 (Eyewitness, Hearsay...)
  language?: string;          // 2510
  dateOfSource?: string;      // 2511
  sourceType?: string;        // 2512 (Affidavit, Interview...)
  reliability?: string;       // 2553
  notes?: string;             // 2550
}

/**
 * INTERVENTION FORMAT (2600 Series)
 * Links Person (Intervenor) <-> Event or Victim
 */
export interface EsfInterventionRecord extends EsfBaseRecord {
  intervenorId: string;       // Link to Person (Intervenor) (2602)
  eventId?: string;           // Link to Event (2603)
  victimId?: string;          // Link to Person (Victim) (2604)
  
  interventionType?: string;  // 2609 (Legal aid, Medical aid...)
  date?: string;              // 2611
  requestedParty?: string;    // 2612
  response?: string;          // 2613
  effect?: string;            // 2614
  status?: string;            // 2651
  priority?: string;          // 2652
  notes?: string;             // 2650
}

export interface EsfAnalysisResult {
    events: EsfEventRecord[];
    persons: EsfPersonRecord[];
    actLinks: EsfActRecord[];
    involvementLinks: EsfInvolvementRecord[];
    informationLinks: EsfInformationRecord[];
    interventionLinks: EsfInterventionRecord[];
}
