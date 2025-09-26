import { AppState, CaseSummary, Risks } from '../types';

/**
 * @function buildCaseContext
 * @description Compiles a comprehensive string representation of the current case state.
 * This function intelligently assembles the most relevant data from across the application
 * (e.g., case description, key documents, entities, recent events) to provide rich context for AI models.
 * @param {AppState} appState - The entire current state of the application.
 * @returns {string} A single string containing the formatted case context.
 */
export const buildCaseContext = (appState: AppState): string => {
    // FIX: `caseDescription` is nested inside `caseContext`. Adjusted destructuring.
    const { caseContext, documents, caseEntities, knowledgeItems, timelineEvents, risks, kpis, caseSummary } = appState;
    const { caseDescription } = caseContext;

    let context = `**Fallbeschreibung:**\n${caseDescription || 'Keine Beschreibung verfügbar.'}\n\n`;

    if (documents.length > 0) {
        context += `**Zentrale Dokumente (${documents.length}):**\n`;
        documents.slice(0, 5).forEach(doc => {
            // FIX: Property 'type' does not exist on type 'Document'. Changed to 'mimeType'.
            context += `- ${doc.name} (Typ: ${doc.workCategory || doc.mimeType}, Status: ${doc.classificationStatus})\n`;
        });
        context += '\n';
    }
    
    if (caseEntities.length > 0) {
        context += `**Bekannte Entitäten (${caseEntities.length}):**\n`;
        caseEntities.slice(0, 10).forEach(entity => {
            context += `- ${entity.name} (${entity.type}): ${entity.description}\n`;
        });
        context += '\n';
    }

    if (knowledgeItems.length > 0) {
        context += `**Top 5 Wissenseinträge:**\n`;
        knowledgeItems.slice(0, 5).forEach(item => {
            context += `- ${item.title}: ${item.summary}\n`;
        });
        context += '\n';
    }
    
    if (timelineEvents.length > 0) {
        context += `**Letzte 5 Chronologie-Ereignisse:**\n`;
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
        context += `**Aktive Risiken:** ${activeRisks}\n\n`;
    }

    if (caseSummary) {
        context += `**KI-Zusammenfassung:** ${caseSummary.summary}\n\n`;
    }

    return context;
};
