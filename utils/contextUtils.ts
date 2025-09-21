import { AppState, CaseSummary, Risks } from '../types';

/**
 * Assembles a comprehensive text-based context string from the application's state.
 * This context is used to provide the AI with a snapshot of the entire case for analysis.
 * It includes the case description, key documents, entities, knowledge items, recent events,
 * active risks, and the latest AI summary.
 * @param {AppState} appState - The global state of the application.
 * @returns {string} A single string containing the formatted case context.
 */
export const buildCaseContext = (appState: AppState): string => {
    const { caseDetails, documents, caseEntities, knowledgeItems, timelineEvents, risks, kpis, caseSummary } = appState;
    const { description: caseDescription } = caseDetails;

    let context = `**Case Description:**\n${caseDescription || 'No description available.'}\n\n`;

    if (documents.length > 0) {
        context += `**Key Documents (${documents.length}):**\n`;
        documents.slice(0, 5).forEach(doc => {
            context += `- ${doc.name} (Type: ${doc.workCategory || doc.mimeType}, Status: ${doc.classificationStatus})\n`;
        });
        context += '\n';
    }
    
    if (caseEntities.length > 0) {
        context += `**Known Entities (${caseEntities.length}):**\n`;
        caseEntities.slice(0, 10).forEach(entity => {
            context += `- ${entity.name} (${entity.type}): ${entity.description}\n`;
        });
        context += '\n';
    }

    if (knowledgeItems.length > 0) {
        context += `**Top 5 Knowledge Items:**\n`;
        knowledgeItems.slice(0, 5).forEach(item => {
            context += `- ${item.title}: ${item.summary}\n`;
        });
        context += '\n';
    }
    
    if (timelineEvents.length > 0) {
        context += `**Last 5 Chronology Events:**\n`;
        timelineEvents.slice(-5).reverse().forEach(event => {
            context += `- ${event.date}: ${event.title}\n`;
        });
        context += '\n';
    }

    const activeRisks = Object.entries(risks)
        .filter(([, isActive]) => isActive)
        .map(([risk]) => risk)
        .join(', ');
    
    if (activeRisks) {
        context += `**Active Risks:** ${activeRisks}\n\n`;
    }

    if (caseSummary) {
        context += `**AI Summary:** ${caseSummary.summary}\n\n`;
    }

    return context;
};
