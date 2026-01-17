
import { MedicalNeutralityResult } from '../../types';

// Begriffe, die auf einen medizinischen Kontext hindeuten
const MEDICAL_CONTEXT_TERMS = [
    "klinik", "krankenhaus", "arzt", "ärztin", "psychiatr", "begutachtung", 
    "diagnose", "behandlung", "medikation", "sanitäter", "gutachten"
];

// Begriffe, die Zwang oder Gewalt im medizinischen Kontext andeuten
const COERCIVE_TERMS = [
    "zwangsmedikation", "zwangsbehandlung", "fixierung", "fesselung", 
    "unterbringung", "geschlossene abteilung", "gegen den willen", 
    "unmittelbarer zwang", "sedierung", "isolierung", "beschluss", "polizeiliche vorführung"
];

/**
 * Modul: Medical Neutrality Validator
 * 
 * Prüft, ob medizinische Maßnahmen als Repressionsmittel eingesetzt werden 
 * oder ob medizinische Ethik (z.B. Istanbul-Protokoll) durch Zwang verletzt wird.
 * 
 * @param fullText Der zu analysierende Text.
 * @returns Ergebnis der Neutralitätsprüfung.
 */
export function checkMedicalNeutrality(fullText: string): MedicalNeutralityResult {
    const lowerText = fullText.toLowerCase();
    
    // 1. Kontext-Check: Geht es überhaupt um Medizin?
    const medicalContextDetected = MEDICAL_CONTEXT_TERMS.some(term => lowerText.includes(term));

    if (!medicalContextDetected) {
        return {
            medicalContextDetected: false,
            coerciveElements: [],
            neutralityViolation: false,
            notes: "Kein medizinischer Kontext erkannt."
        };
    }

    // 2. Zwangselemente-Check
    const coerciveElements = COERCIVE_TERMS.filter(term => lowerText.includes(term));
    const neutralityViolation = coerciveElements.length > 0;

    let notes = "Medizinischer Kontext erkannt, aber keine expliziten Hinweise auf Zwang.";
    
    if (neutralityViolation) {
        notes = `WARNUNG: Medizinischer Kontext mit Zwangselementen (${coerciveElements.join(', ')}). Dies könnte eine Verletzung der medizinischen Neutralität oder einen Verstoß gegen das Verbot von Folter/unmenschlicher Behandlung darstellen (vgl. Istanbul-Protokoll).`;
    }

    return {
        medicalContextDetected,
        coerciveElements,
        neutralityViolation,
        notes
    };
}
