
export interface HumanRightsCaseResult {
  documents: {
    document_id: string;
    title: string;
    summary_of_violations?: string;
  }[];

  violations_table: {
    violation_type: string;
    date?: string;
    location?: string;
    persons_or_groups?: string;
    source: string;
    details: string;
  }[];

  // Optional arrays matching the schema structure exactly
  events?: Array<{
    "101_event_record_number": string;
    "102_title"?: string;
    "108_confidentiality"?: string;
    "111_geo_term"?: string;
    "112_local_geo_area"?: string;
    "113_start_date"?: string;
    "114_end_date"?: string;
    "115_description"?: string;
    "116_consequences"?: string;
    "150_notes"?: string;
  }>;

  acts?: Array<{
    "2101_act_record_number": string;
    "2102_victim_name"?: string;
    "2103_event_title"?: string;
    "2109_act_type"?: string;
    "2111_first_date"?: string;
    "2112_exact_location"?: string;
    "2113_stated_reason"?: string;
    "2114_method_of_force"?: string;
    "2115_attribution"?: string;
    "2116_physical_consequences"?: string;
    "2117_psychological_consequences"?: string;
  }>;

  involvements?: Array<{
    "2401_involvement_record_number": string;
    "2402_perpetrator_name"?: string;
    "2403_event_title"?: string;
    "2409_degree_of_involvement"?: string;
    "2412_perpetrator_type"?: string;
  }>;
  
  // Placeholder for other schema arrays if needed later (biographies, etc.)
  informations?: any[];
  interventions?: any[];
  biographies?: any[];
  event_chains?: any[];
}
