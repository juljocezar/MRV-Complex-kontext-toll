import { GeminiService } from './geminiService';
import type { Document, DocumentAnalysisResult, AISettings, SuggestedEntity, Tag, StructuredEvent, StructuredAct, StructuredParticipant } from '../types';
import { WorkloadAnalyzerService } from './workloadAnalyzer';

export class DocumentAnalystService {
    private static readonly ANALYSIS_SCHEMA = {
        type: 'object',
        properties: {
            summary: { type: 'string', description: "Eine prägnante Zusammenfassung des Dokuments in 3-5 Sätzen." },
            classification: { type: 'string', description: 'Klassifizierung des Dokuments nach HURIDOCS-Standards (z.B. Opferbericht, Zeugenaussage, Polizeibericht, Gerichtsentscheidung, Handbuch, juristischer Text).' },
            contentType: { 
                type: 'string', 
                enum: ['case-specific', 'contextual-report'], 
                description: "Klassifiziere den Inhaltstyp: 'case-specific' (direkt zum Fall, z.B. Zeugenaussage, Beweismittel) oder 'contextual-report' (allgemeiner Bericht, Studie, Analyse eines Phänomens). Eine Entscheidung MUSS getroffen werden."
            },
            suggestedTags: { 
                type: 'array', 
                description: "Eine Liste von 1-3 relevanten Tags für das Dokument basierend auf seinem Inhalt.", 
                items: { type: 'string' } 
            },
            structuredEvents: {
                type: 'array',
                description: "Eine Liste von spezifischen Vorfällen von Menschenrechtsverletzungen, die im Dokument beschrieben werden.",
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: "Ein kurzer, beschreibender Titel für das Ereignis." },
                        startDate: { type: 'string', description: "Startdatum des Ereignisses im Format YYYY-MM-DD." },
                        endDate: { type: 'string', description: "Enddatum des Ereignisses im Format YYYY-MM-DD (falls zutreffend)." },
                        location: { type: 'string', description: "Der geografische Ort des Ereignisses." },
                        description: { type: 'string', description: "Eine detaillierte Beschreibung des Ereignisses." }
                    },
                    required: ['title', 'startDate', 'location', 'description']
                }
            },
            structuredActs: {
                 type: 'array',
                 description: "Eine Liste spezifischer Handlungen (Verletzungen), die innerhalb der Ereignisse stattgefunden haben.",
                 items: {
                    type: 'object',
                    properties: {
                        victimName: { type: 'string', description: "Name des Opfers der Handlung." },
                        actType: { type: 'string', description: "Art der Handlung (z.B. Folter, willkürliche Inhaftierung, Diskriminierung)." },
                        method: { type: 'string', description: "Art der angewandten Gewalt oder Methode." },
                        consequences: { type: 'string', description: "Physische oder psychologische Konsequenzen für das Opfer." }
                    },
                    required: ['victimName', 'actType']
                }
            },
             structuredParticipants: {
                type: 'array',
                description: "Eine Liste aller beteiligten Akteure mit Typ, Rolle und Beschreibung.",
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: "Name der Person, Organisation oder des Standorts." },
                        type: { type: 'string', enum: ['Person', 'Organisation', 'Standort', 'Unbekannt'], description: "Der Typ der Entität." },
                        role: { type: 'string', enum: ['Opfer', 'Täter', 'Quelle', 'Intervenierende Partei', 'Andere'], description: "Die Rolle des Akteurs im Ereignis." },
                        description: { type: 'string', description: "Eine kurze, kontextbezogene Beschreibung des Akteurs." }
                    },
                    required: ['name', 'type', 'role', 'description']
                }
            }
        },
        required: ['summary', 'classification', 'contentType', 'suggestedTags', 'structuredEvents', 'structuredActs', 'structuredParticipants']
    };

    static async analyzeDocument(document: Document, existingTags: Tag[], settings: AISettings): Promise<DocumentAnalysisResult> {
        const content = document.textContent || document.content;
        const existingTagNames = existingTags.map(t => t.name).join(', ');

        const prompt = `
            Du bist ein Experte für die Dokumentation von Menschenrechtsverletzungen nach den HURIDOCS-Standardformaten. Analysiere das folgende Dokument akribisch.

            Dokumenteninhalt (Auszug):
            ---
            ${content.substring(0, 50000)}
            ---

            Deine Aufgaben:
            1.  **Zusammenfassung:** Erstelle eine prägnante Zusammenfassung des Dokuments.
            2.  **Klassifizierung:** Klassifiziere das Dokument nach HURIDOCS-Standards (z.B. Opferbericht, Zeugenaussage, Polizeibericht, Handbuch, juristischer Text).
            3.  **Inhaltstyp bestimmen (WICHTIG):** Du musst eine definitive Klassifizierung des Inhaltstyps vornehmen. Entscheide, ob das Dokument primär 'case-specific' (direkt zum Fall, z.B. eine spezifische Zeugenaussage, ein Beweismittel, eine E-Mail im Fall) oder 'contextual-report' (liefert allgemeinen Kontext, z.B. ein allgemeiner Menschenrechtsbericht, eine Studie, eine Analyse eines gesellschaftlichen Phänomens) ist. Wäge ab: Dient das Dokument als direkter Beweis für ein Ereignis im Fall oder erklärt es den Hintergrund, in dem der Fall stattfindet?
            4.  **Tags vorschlagen:** Schlage 1-3 passende Tags vor. Berücksichtige existierende Tags: ${existingTagNames || 'Keine'}.
            5.  **Strukturierte Daten extrahieren:**
                -   **WICHTIG:** Extrahiere nur Daten, wenn das Dokument tatsächliche Vorfälle oder Fallbeispiele beschreibt. Wenn es sich um ein Metadokument (z.B. ein Handbuch, ein Bericht über Methodik, ein juristischer Text) handelt, gib für die folgenden drei Punkte leere Arrays zurück und erwähne in der Zusammenfassung, dass es sich um ein Metadokument handelt.
                -   **Ereignisse (Events):** Extrahiere alle beschriebenen Vorfälle von Menschenrechtsverletzungen.
                -   **Handlungen (Acts):** Extrahiere für jedes Ereignis die spezifischen Handlungen/Verletzungen.
                -   **Beteiligte (Participants):** Identifiziere alle Akteure. Bestimme für jeden Akteur: Name, Typ (Person, Organisation, Standort), Rolle (Opfer, Täter, Quelle, etc.) und eine kurze, kontextbezogene Beschreibung.

            Sei dabei äußerst präzise und halte dich strikt an die Fakten aus dem Dokument.
            GIB NUR DAS GEFORDERTE JSON ZURÜCK, OHNE EINLEITUNG ODER ZUSÄTZLICHEN TEXT.
        `;

        try {
            // Step 1: Perform the main analysis for summary, entities, classification
            const mainResult = await GeminiService.callAIWithSchema<any>(prompt, this.ANALYSIS_SCHEMA, settings);
            
            // Step 2: Perform workload and cost analysis in parallel. This call is now more robust.
            const workloadResult = await WorkloadAnalyzerService.analyzeWorkload(content, settings);

            // Step 3: Combine all results into a single comprehensive object
            const combinedResult: DocumentAnalysisResult = {
                docId: document.id,
                summary: mainResult.summary,
                // Entities are now derived from participants for consistency
                entities: (mainResult.structuredParticipants || []).map((p: StructuredParticipant): SuggestedEntity => ({
                    id: crypto.randomUUID(), 
                    name: p.name,
                    type: p.type,
                    description: p.description,
                    sourceDocumentId: document.id, 
                    sourceDocumentName: document.name 
                })),
                classification: mainResult.classification,
                contentType: mainResult.contentType,
                suggestedTags: mainResult.suggestedTags,
                structuredEvents: mainResult.structuredEvents,
                structuredActs: mainResult.structuredActs,
                structuredParticipants: mainResult.structuredParticipants,
                workloadEstimate: workloadResult.workloadEstimate,
                costEstimate: workloadResult.costEstimate,
            };

            return combinedResult;

        } catch (error) {
            console.error(`Error analyzing document ${document.id}:`, error);
            throw new Error('Document analysis failed');
        }
    }
}