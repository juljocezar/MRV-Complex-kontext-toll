/**
 * @file Defines constants for legal billing rates and workload estimations,
 * loosely based on German standards (RVG/JVEG).
 * @note These are simplified examples and should be adjusted for real-world use.
 */

/**
 * Defines categories of legal work.
 */
export const RVG_CATEGORIES = {
    CONSULTATION: 'Consultation',
    DOCUMENT_REVIEW: 'Document Review',
    LEGAL_RESEARCH: 'Legal Research',
    DRAFTING: 'Drafting',
    COURT_APPEARANCE: 'Court Appearance',
    EXPERT_OPINION: 'Expert Opinion',
};

/**
 * Example hourly rates in EUR.
 * @note JVEG (German law on compensation for experts/translators) often defines specific rates.
 * RVG (German law on lawyer's remuneration) often uses fee schedules, but hourly rates can be agreed upon.
 */
export const HOURLY_RATES_EUR = {
    JUNIOR_LAWYER: 120,
    SENIOR_LAWYER: 250,
    PARTNER: 400,
    PARALEGAL: 80,
    EXPERT_WITNESS_JVEG_BASE: 100, // Example base rate from JVEG fee group
};

/**
 * A mapping of document work categories to estimated base hours and complexity factors.
 * Used for preliminary workload estimations.
 */
export const DOCUMENT_WORKLOAD_ESTIMATES: { [key: string]: { baseHours: number; complexityFactor: number } } = {
    'Victim Report': { baseHours: 2, complexityFactor: 1.5 },
    'Witness Testimony': { baseHours: 1.5, complexityFactor: 1.2 },
    'Police Report': { baseHours: 1, complexityFactor: 1.0 },
    'Court Decision': { baseHours: 4, complexityFactor: 2.0 },
    'Medical Report': { baseHours: 1.5, complexityFactor: 1.8 },
    'Correspondence': { baseHours: 0.5, complexityFactor: 0.8 },
    'Press Report': { baseHours: 0.5, complexityFactor: 0.5 },
    'Official Communication': { baseHours: 1, complexityFactor: 1.1 },
    'Legal Opinion': { baseHours: 10, complexityFactor: 2.5 },
    'Minutes/Protocol': { baseHours: 1, complexityFactor: 1.0 },
    'Case File/Dossier': { baseHours: 8, complexityFactor: 2.2 },
    'Research Report': { baseHours: 5, complexityFactor: 1.7 },
    'Unclassified': { baseHours: 1, complexityFactor: 1.0 },
    'Other': { baseHours: 1, complexityFactor: 1.0 },
};
