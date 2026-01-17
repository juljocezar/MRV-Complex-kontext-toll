
// Defines a curated list of resources for Human Rights Defenders (HRDs).

import { HrdResourceCard } from "../types";

export const HRD_RESOURCES: HrdResourceCard[] = [
  {
    id: "fld_emergency",
    title: "Front Line Defenders",
    description: "Bietet schnelle und praktische Unterstützung für HRDs in Gefahr, einschließlich Nothilfen, Schulungen und Lobbyarbeit.",
    baseUrl: "https://www.frontlinedefenders.org/",
    type: "SECURITY",
    targetGroup: ["HRD", "NGO"],
    topics: ["emergency_support", "protection_grants", "relocation"]
  },
  {
    id: "protectdefenders",
    title: "ProtectDefenders.eu",
    description: "Der Menschenrechtsverteidiger-Mechanismus der Europäischen Union. Bietet Nothilfe, temporäre Umsiedlung und materielle Unterstützung.",
    baseUrl: "https://www.protectdefenders.eu/",
    type: "SECURITY",
    targetGroup: ["HRD", "NGO"],
    topics: ["eu_mechanism", "relocation", "grants"]
  },
  {
    id: "accessnow_helpline",
    title: "Access Now Digital Security Helpline",
    description: "Bietet rund um die Uhr technische Hilfe und Ratschläge für Aktivisten, Journalisten und HRDs, die digitalen Angriffen ausgesetzt sind.",
    baseUrl: "https://www.accessnow.org/help/",
    type: "SECURITY",
    targetGroup: ["HRD", "JOURNALIST", "NGO"],
    topics: ["digital_security", "cyber_attack", "incident_response"]
  },
  {
    id: "security_in_a_box",
    title: "Security in-a-box (Tactical Tech)",
    description: "Eine Anleitung zu digitalen Sicherheitswerkzeugen und -taktiken für Aktivisten und Menschenrechtsverteidiger.",
    baseUrl: "https://securityinabox.org/",
    type: "GUIDE",
    targetGroup: ["HRD", "NGO", "JOURNALIST"],
    topics: ["digital_security", "tools", "privacy"]
  },
  {
    id: "rsf_assistance",
    title: "Reporters Without Borders (RSF)",
    description: "Bietet rechtliche und finanzielle Unterstützung für Journalisten und Medienaktivisten, die aufgrund ihrer Arbeit verfolgt werden.",
    baseUrl: "https://rsf.org/",
    type: "SECURITY",
    targetGroup: ["JOURNALIST"],
    topics: ["legal_aid", "financial_support", "media_freedom"]
  },
  {
    id: "martin_ennals",
    title: "Martin Ennals Award Foundation",
    description: "Unterstützt HRDs durch Nothilfe und Schutzmaßnahmen. Der Martin Ennals Award ehrt HRDs, die sich in großer Gefahr befinden.",
    baseUrl: "https://www.martinennalsaward.org/",
    type: "ADVOCACY_TOOL",
    targetGroup: ["HRD"],
    topics: ["awards", "protection", "advocacy"]
  },
  {
    id: "ishr_academy",
    title: "ISHR Academy – Learning Modules",
    description: "Online-Kurse zu UN-Menschenrechtssystem, HRC, Sonderverfahren, Vertragsorganen und UPR – speziell für HRDs.",
    baseUrl: "https://academy.ishr.ch/learn",
    type: "LEARNING_MODULE",
    targetGroup: ["HRD", "LAWYER", "NGO"],
    topics: ["un_system", "treaty_bodies", "upr", "hrc"]
  },
  {
    id: "sp_submission_portal",
    title: "SP Submission Portal (OHCHR)",
    description: "Offizielles Portal für Einreichungen an UN-Sonderverfahren (Sonderberichterstatter:innen).",
    baseUrl: "https://spsubmission.ohchr.org/",
    type: "SUBMISSION_PORTAL",
    targetGroup: ["HRD", "LAWYER", "NGO"],
    topics: ["special_procedures", "individual_cases", "urgent_appeals"]
  },
  {
    id: "sr_defenders",
    title: "UN Special Rapporteur on HRDs",
    description: "Mandatsträger:in für Menschenrechtsverteidiger:innen, Leitfäden und Kontaktmöglichkeiten bei Repression.",
    baseUrl: "https://srdefenders.org/",
    type: "ADVOCACY_TOOL",
    targetGroup: ["HRD"],
    topics: ["hrds", "reprisals", "mandate"]
  },
  {
    id: "icrc_media",
    title: "ICRC Media Resources (IHL)",
    description: "Ressourcen für Journalisten zur Berichterstattung über bewaffnete Konflikte und humanitäres Völkerrecht.",
    baseUrl: "https://www.icrc.org/en/media-centre",
    type: "GUIDE",
    targetGroup: ["JOURNALIST"],
    topics: ["ihl", "armed_conflict", "media"]
  }
];
