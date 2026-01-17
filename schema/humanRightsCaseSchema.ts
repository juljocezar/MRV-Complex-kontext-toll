
// schema/humanRightsCaseSchema.ts
export const HUMAN_RIGHTS_CASE_SCHEMA = {
  type: "object",
  properties: {
    documents: {
      type: "array",
      description: "Dokumentweise Hinweise auf Menschenrechtsverletzungen",
      items: {
        type: "object",
        properties: {
          document_id: { type: "string" },
          title: { type: "string" },
          summary_of_violations: { type: "string" },
        },
        required: ["document_id", "title"],
      },
    },

    violations_table: {
      type: "array",
      description: "Tabellarische Übersicht aller extrahierten Verletzungen",
      items: {
        type: "object",
        properties: {
          violation_type: { type: "string" },          // z.B. Folter, willkürliche Inhaftierung
          date: { type: "string" },                    // ISO 8601 oder Freitext, wenn unklar
          location: { type: "string" },
          persons_or_groups: { type: "string" },
          source: { type: "string" },                  // Dokumenttitel oder Aktenzeichen
          details: { type: "string" },
        },
        required: ["violation_type", "details", "source"],
      },
    },

    // 1:1 an ESF angelehnt
    events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          "101_event_record_number": { type: "string" },
          "102_title": { type: "string" },
          "108_confidentiality": { type: "string" },
          "111_geo_term": { type: "string" },
          "112_local_geo_area": { type: "string" },
          "113_start_date": { type: "string" },
          "114_end_date": { type: "string" },
          "115_description": { type: "string" },
          "116_consequences": { type: "string" },
          "150_notes": { type: "string" },
        },
        required: ["101_event_record_number", "102_title"],
      },
    },

    acts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          "2101_act_record_number": { type: "string" },
          "2102_victim_name": { type: "string" },
          "2103_event_title": { type: "string" },
          "2108_confidentiality": { type: "string" },
          "2109_act_type": { type: "string" },
          "2111_first_date": { type: "string" },
          "2112_exact_location": { type: "string" },
          "2113_stated_reason": { type: "string" },
          "2114_method_of_force": { type: "string" },
          "2115_attribution": { type: "string" },
          "2116_physical_consequences": { type: "string" },
          "2117_psychological_consequences": { type: "string" },
          "2118_age_at_victimization": { type: "string" },
          "2121_last_date": { type: "string" },
          "2150_notes": { type: "string" },
        },
        required: ["2101_act_record_number", "2102_victim_name", "2109_act_type"],
      },
    },

    involvements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          "2401_involvement_record_number": { type: "string" },
          "2402_perpetrator_name": { type: "string" },
          "2403_event_title": { type: "string" },
          "2404_act_record_number": { type: "string" },
          "2408_confidentiality": { type: "string" },
          "2409_degree_of_involvement": { type: "string" },
          "2412_perpetrator_type": { type: "string" },
          "2422_last_status_as_perpetrator": { type: "string" },
          "2450_notes": { type: "string" },
        },
        required: ["2401_involvement_record_number", "2402_perpetrator_name"],
      },
    },

    informations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          "2501_information_record_number": { type: "string" },
          "2502_source_name": { type: "string" },
          "2503_event_title": { type: "string" },
          "2504_person_referred_to": { type: "string" },
          "2508_confidentiality": { type: "string" },
          "2509_source_relationship": { type: "string" },
          "2510_source_language": { type: "string" },
          "2511_source_date": { type: "string" },
          "2512_source_type": { type: "string" },
          "2550_notes": { type: "string" },
          "2553_information_reliability": { type: "string" },
        },
        required: ["2501_information_record_number", "2502_source_name"],
      },
    },

    interventions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          "2601_intervention_record_number": { type: "string" },
          "2602_intervening_party_name": { type: "string" },
          "2603_event_title": { type: "string" },
          "2604_victim_name": { type: "string" },
          "2608_confidentiality": { type: "string" },
          "2609_intervention_type": { type: "string" },
          "2611_intervention_date": { type: "string" },
          "2612_requested_parties": { type: "string" },
          "2613_response": { type: "string" },
          "2614_effect_on_situation": { type: "string" },
          "2650_notes": { type: "string" },
          "2651_intervention_status": { type: "string" },
          "2652_priority": { type: "string" },
        },
        required: ["2601_intervention_record_number", "2602_intervening_party_name"],
      },
    },

    biographies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          "2301_bio_record_number": { type: "string" },
          "2302_person_name": { type: "string" },
          "2303_related_person_name": { type: "string" },
          "2308_confidentiality": { type: "string" },
          "2309_relationship_type": { type: "string" },
          "2310_first_date": { type: "string" },
          "2311_last_date": { type: "string" },
          "2320_education": { type: "string" },
          "2322_employment": { type: "string" },
          "2323_affiliation": { type: "string" },
          "2327_position_in_org": { type: "string" },
          "2328_rank": { type: "string" },
          "2350_notes": { type: "string" },
        },
        required: ["2301_bio_record_number", "2302_person_name"],
      },
    },

    event_chains: {
      type: "array",
      items: {
        type: "object",
        properties: {
          "2201_chain_record_number": { type: "string" },
          "2202_main_event_title": { type: "string" },
          "2203_related_event_title": { type: "string" },
          "2209_chain_type": { type: "string" },
          "2250_notes": { type: "string" },
          "2261_entry_date": { type: "string" },
          "2262_entered_by": { type: "string" },
          "2265_comments": { type: "string" },
          "2270_updated_date": { type: "string" },
          "2271_updated_by": { type: "string" },
        },
        required: ["2201_chain_record_number", "2202_main_event_title"],
      },
    },
  },
  required: ["documents", "violations_table"],
};
