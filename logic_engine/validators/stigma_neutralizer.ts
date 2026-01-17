
import { StigmaResult } from '../../types';

/**
 * Liste von Begriffen, die in behördlichen oder gerichtlichen Dokumenten häufig 
 * zur Delegitimierung von Rechtsmittelführern verwendet werden ("Gaslighting").
 */
const STIGMA_PATTERNS = [
    { term: "querulant", category: "pathologizing" },
    { term: "querulatorisch", category: "pathologizing" },
    { term: "wahnhaft", category: "pathologizing" },
    { term: "einsichtsunfähig", category: "pathologizing" },
    { term: "rechtsmissbräuchlich", category: "legal_exclusion" },
    { term: "reichsbürger", category: "political_stigma" },
    { term: "selbstverwalter", category: "political_stigma" },
    { term: "staatsleugner", category: "political_stigma" },
    { term: "verschwörungstheoret", category: "discrediting" },
    { term: "psychisch auffällig", category: "pathologizing" },
    { term: "renitent", category: "character_assassination" },
    { term: "beratungsresistent", category: "character_assassination" }
];

/**
 * Modul 4: Anti-Stigma-Protokoll (Stigma Neutralizer)
 * 
 * Analysiert Texte auf Sprache, die darauf abzielt, den Antragsteller zu pathologisieren 
 * oder als irrational darzustellen, um die Beweislast umzukehren oder Rechte zu verwehren.
 * 
 * @param fullText Der zu analysierende Text.
 * @returns Analyseergebnis mit gefundenen Begriffen und Bewertung.
 */
export function analyzeStigma(fullText: string): StigmaResult {
    const lowerText = fullText.toLowerCase();
    const foundTerms: string[] = [];
    let stigmaScore = 0;

    STIGMA_PATTERNS.forEach(pattern => {
        if (lowerText.includes(pattern.term)) {
            foundTerms.push(pattern.term);
            stigmaScore++;
        }
    });

    const gaslightingIndicators = stigmaScore > 0;
    
    // Heuristik: Wenn pathologisierende Begriffe genutzt werden, wird oft implizit 
    // die Glaubwürdigkeit und damit die Beweisführungslast angegriffen.
    const burdenOfProofShift = foundTerms.some(t => 
        STIGMA_PATTERNS.find(p => p.term === t)?.category === "pathologizing"
    );

    let notes = "Keine offensichtlichen Stigmatisierungs-Marker gefunden.";
    if (gaslightingIndicators) {
        notes = `KRITISCH: Text enthält ${foundTerms.length} stigmatisierende Begriffe (${foundTerms.join(', ')}). Dies deutet auf 'Labeling' hin, um den sachlichen Vortrag zu delegitimieren (Gaslighting-Indikator).`;
    }

    return {
        foundTerms,
        gaslightingIndicators,
        burdenOfProofShift,
        notes
    };
}
