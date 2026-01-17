
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';
import { StructuredEvent, StructuredAct, StructuredParticipant } from '../types';

// Initialize wink-nlp
const nlp = winkNLP(model);
const its = nlp.its;
const as = nlp.as;

/**
 * Interface representing the HURIDOCS ESF (Events Standard Formats) Micro-Format.
 */
interface HURIDOCSEvent {
    date?: string;
    location?: string;
    violationType?: string;
    perpetrator?: string;
    victim?: string;
    sourceReliability?: 'High' | 'Medium' | 'Low';
}

/**
 * Result of the EU AI Act Risk Assessment.
 */
interface AIActRiskAssessment {
    isHighRisk: boolean;
    riskCategory: string | null;
    relevantArticles: string[];
    notes: string;
}

/**
 * Processing Engine that combines Rule-Based NLP (Wink) with specialized Human Rights logic.
 */
export class HURIDOCSProcessor {

    /**
     * Patterns for German HURIDOCS vocabulary mapping.
     * Since the model is English-lite, we rely heavily on custom patterns for German terms.
     */
    private static readonly PATTERNS = [
        { name: 'act_violation', patterns: ['Folter', 'Misshandlung', 'Schlag', 'Festnahme', 'Verhaftung', 'Inhaftierung', 'Durchsuchung', 'Beschlagnahmung', 'Zwang', 'Nötigung'] },
        { name: 'actor_state', patterns: ['Polizei', 'Beamter', 'Behörde', 'Amt', 'Gericht', 'Staatsanwaltschaft', 'Jobcenter', 'Ausländerbehörde'] },
        { name: 'actor_victim', patterns: ['Opfer', 'Betroffener', 'Kläger', 'Antragsteller', 'Flüchtling', 'Asylbewerber'] },
        { name: 'location_indicator', patterns: ['in', 'bei', 'vor', 'auf'] } // Simplified preposition check
    ];

    constructor() {
        nlp.learnCustomEntities(HURIDOCSProcessor.PATTERNS);
    }

    /**
     * Extracts structured entities mapping to HURIDOCS Events Standard Formats.
     * This acts as a fast, deterministic "First Pass" before LLM analysis.
     * 
     * @param text The raw text of the document.
     */
    public processToESF(text: string): { events: StructuredEvent[], acts: StructuredAct[], participants: StructuredParticipant[] } {
        const doc = nlp.readDoc(text);
        
        const events: StructuredEvent[] = [];
        const acts: StructuredAct[] = [];
        const participants: StructuredParticipant[] = [];

        // 1. Extract Dates (Temporal Anchors)
        const dates = doc.entities().filter((e) => e.type() === 'DATE').out(its.value);
        // Note: wink-lite English model might miss German date formats like '12.05.2023'. 
        // We'd ideally add a regex custom entity for DD.MM.YYYY here, but for now we rely on what wink finds + simple regex fallback.
        const dateRegex = /\d{2}\.\d{2}\.\d{4}/g;
        const regexDates = text.match(dateRegex) || [];
        const allDates = Array.from(new Set([...dates, ...regexDates]));

        // 2. Extract Locations (Spatial Anchors)
        // Using simple heuristics as English model might not recognize German cities perfectly without context.
        // We look for capitalized words following 'in' or 'bei'.
        const sentences = doc.sentences().out();
        const locations: string[] = [];
        // Simple regex heuristic for "in [City]"
        const locRegex = /(?:in|aus|bei)\s+([A-ZÄÖÜ][a-zäöüß]+)/g;
        let match;
        while ((match = locRegex.exec(text)) !== null) {
            if (!['der', 'dem', 'den', 'einem', 'einer'].includes(match[1].toLowerCase())) {
                locations.push(match[1]);
            }
        }

        // 3. Extract Custom Entities (Acts & Actors)
        const customEntities = doc.customEntities().out(its.detail);
        
        // Map Custom Entities to Structured Objects
        customEntities.forEach((entity: any) => {
            if (entity.type === 'act_violation') {
                acts.push({
                    victimName: 'Unbekannt (aus Textkontext)', // NLP limitation: Hard to link SVO without dependency parsing
                    actType: entity.value,
                    method: 'Physisch/Psychisch',
                    consequences: 'Zu ermitteln'
                });
            }
            if (entity.type === 'actor_state') {
                participants.push({
                    name: entity.value,
                    type: 'Organisation',
                    role: 'Täter', // In HR context, state actors are often the alleged perpetrators
                    description: 'Staatlicher Akteur identifiziert durch Keyword-Matching'
                });
            }
            if (entity.type === 'actor_victim') {
                participants.push({
                    name: entity.value,
                    type: 'Person',
                    role: 'Opfer',
                    description: 'Potenziell betroffene Person'
                });
            }
        });

        // 4. Construct a heuristic Event if we have dates and acts
        if (acts.length > 0 && allDates.length > 0) {
            events.push({
                title: `Vorfall am ${allDates[0]}`,
                startDate: allDates[0],
                location: locations.length > 0 ? locations[0] : 'Unbekannt',
                description: `Automatisch extrahierter Vorfall basierend auf den Begriffen: ${acts.map(a => a.actType).join(', ')}`
            });
        }

        return {
            events,
            acts,
            participants
        };
    }

    /**
     * Checks if the document context implies a High-Risk AI System under the EU AI Act.
     * This is crucial for "Forensic Dossiers" targeting algorithmic discrimination.
     * 
     * @param text The full document text.
     */
    public assessAIActCompliance(text: string): AIActRiskAssessment {
        const lowerText = text.toLowerCase();
        
        // Annex III EU AI Act Categories (High Risk)
        const riskCategories = [
            { id: 'biometrics', keywords: ['biometrisch', 'gesichtserkennung', 'identifizierung', 'fingerabdruck'] },
            { id: 'critical_infrastructure', keywords: ['wasser', 'gas', 'strom', 'verkehr', 'infrastruktur', 'digital'] },
            { id: 'education', keywords: ['zulassung', 'prüfung', 'schule', 'universität', 'ausbildung', 'bewertung'] },
            { id: 'employment', keywords: ['bewerbung', 'einstellung', 'kündigung', 'überwachung', 'arbeitsleistung', 'task management'] },
            { id: 'public_services', keywords: ['sozialleistung', 'bürgergeld', 'wohngeld', 'kreditwürdigkeit', 'feuerwehr', 'notruf'] },
            { id: 'law_enforcement', keywords: ['polizei', 'straftat', 'rückfall', 'profiling', 'lügendetektor', 'beweismittel', 'prognose'] },
            { id: 'migration', keywords: ['asyl', 'visum', 'grenze', 'einreise', 'abschiebung', 'status', 'ausländerbehörde'] },
            { id: 'justice', keywords: ['gericht', 'urteil', 'rechtsprechung', 'klage', 'entscheidungshilfe'] }
        ];

        let detectedCategory = null;
        const foundKeywords: string[] = [];

        for (const cat of riskCategories) {
            const hits = cat.keywords.filter(k => lowerText.includes(k));
            if (hits.length > 0) {
                detectedCategory = cat.id;
                foundKeywords.push(...hits);
                // We stop at the first strong match for the primary category, but in reality, multiple could apply.
                break;
            }
        }

        if (detectedCategory) {
            return {
                isHighRisk: true,
                riskCategory: detectedCategory,
                relevantArticles: ['Art. 6 (Hochrisiko-Klassifizierung)', 'Art. 13 (Transparenz)', 'Art. 14 (Menschliche Aufsicht)'],
                notes: `ACHTUNG: Der Kontext deutet auf ein Hochrisiko-KI-System gemäß EU AI Act Anhang III hin (Kategorie: ${detectedCategory}). Stichworte: ${foundKeywords.join(', ')}.`
            };
        }

        return {
            isHighRisk: false,
            riskCategory: null,
            relevantArticles: [],
            notes: "Keine unmittelbaren Hinweise auf Hochrisiko-KI-Anwendung nach EU AI Act Anhang III gefunden."
        };
    }
}
