// This file defines constants for legal billing rates based on German standards (RVG/JVEG).
// These are simplified examples and should be adjusted for real-world use.

export const RVG_CATEGORIES = {
    CONSULTATION: 'Beratung',
    DOCUMENT_REVIEW: 'Dokumentenprüfung',
    LEGAL_RESEARCH: 'Rechtsrecherche',
    DRAFTING: 'Schriftsatzerstellung',
    COURT_APPEARANCE: 'Gerichtstermin',
    EXPERT_OPINION: 'Gutachtenerstellung',
};

// Example hourly rates in EUR. JVEG defines rates for experts/translators.
// RVG often uses fee schedules, but hourly rates can be agreed upon.
export const HOURLY_RATES_EUR = {
    JUNIOR_LAWYER: 120,
    SENIOR_LAWYER: 250,
    PARTNER: 400,
    PARALEGAL: 80,
    EXPERT_WITNESS_JVEG_BASE: 100, // Example base rate from JVEG Honorargruppe
};

// Mapping document work categories to estimated complexity and time.
export const DOCUMENT_WORKLOAD_ESTIMATES: { [key: string]: { baseHours: number; complexityFactor: number } } = {
    'Opferbericht': { baseHours: 2, complexityFactor: 1.5 },
    'Zeugenaussage': { baseHours: 1.5, complexityFactor: 1.2 },
    'Polizeibericht': { baseHours: 1, complexityFactor: 1.0 },
    'Gerichtsentscheidung': { baseHours: 4, complexityFactor: 2.0 },
    'Medizinischer Bericht': { baseHours: 1.5, complexityFactor: 1.8 },
    'Korrespondenz': { baseHours: 0.5, complexityFactor: 0.8 },
    'Pressebericht': { baseHours: 0.5, complexityFactor: 0.5 },
    'Behördenmitteilung': { baseHours: 1, complexityFactor: 1.1 },
    'Rechtsgutachten': { baseHours: 10, complexityFactor: 2.5 },
    'Protokoll': { baseHours: 1, complexityFactor: 1.0 },
    'Falldossier': { baseHours: 8, complexityFactor: 2.2 },
    'Recherchebericht': { baseHours: 5, complexityFactor: 1.7 },
    'Unklassifiziert': { baseHours: 1, complexityFactor: 1.0 },
    'Sonstiges': { baseHours: 1, complexityFactor: 1.0 },
};
