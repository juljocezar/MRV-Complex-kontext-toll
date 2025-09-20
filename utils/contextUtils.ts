
// Fix: Removed unused and now incorrect async DB calls.
import { AppState } from '../types';

// Fix: Rewrote function to be synchronous and accept appState, making it more efficient and fixing call-site errors.
export const buildCaseContext = (appState: AppState): string => {
    const { caseDescription, documents, caseEntities } = appState;

    let context = `**Fallbeschreibung:**\n${caseDescription || 'No description available.'}\n\n`;

    if (documents.length > 0) {
        context += `**Vorhandene Dokumente (${documents.length}):**\n`;
        // Use a limited number of docs for context to avoid being too verbose
        documents.slice(0, 5).forEach(doc => {
            context += `- ${doc.name} (Typ: ${doc.type}, Status: ${doc.classificationStatus})\n`;
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

    // Since caseSummary is transient (not in DB per spec), we can't add it here reliably.
    // The core context is based on persisted data.

    return context;
};