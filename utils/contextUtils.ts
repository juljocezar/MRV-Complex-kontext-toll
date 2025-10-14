import { AppState, CaseSummary, Risks } from '../types';

export const buildCaseContext = (appState: AppState): string => {
    const { caseContext, documents, caseEntities, knowledgeItems, timelineEvents, risks, kpis, caseSummary } = appState;
    const { caseDescription } = caseContext;

    let context = `**Fallbeschreibung:**\n${caseDescription || 'Keine Beschreibung verfügbar.'}\n\n`;

    if (documents.length > 0) {
        const caseSpecificDocs = documents.filter(d => d.contentType === 'case-specific' && d.summary);
        const contextualDocs = documents.filter(d => d.contentType === 'contextual-report');
        const otherDocs = documents.filter(d => !d.contentType || (d.contentType !== 'case-specific' && d.contentType !== 'contextual-report'));

        if (caseSpecificDocs.length > 0) {
            context += `**Zentrale fallbezogene Dokumente (Beweismittel):**\n`;
            caseSpecificDocs.slice(0, 5).forEach(doc => {
                context += `- ${doc.name}: ${doc.summary}\n`;
            });
            context += '\n';
        }
        
        if (contextualDocs.length > 0) {
            context += `**Kontext-Dokumente (Berichte, Studien):**\n`;
            context += `- ${contextualDocs.map(d => d.name).slice(0, 10).join(', ')}\n\n`;
        }

        if (otherDocs.length > 0 && (caseSpecificDocs.length + contextualDocs.length) < 5) {
             context += `**Weitere Dokumente:**\n`;
             otherDocs.slice(0, 3).forEach(doc => {
                context += `- ${doc.name} (Typ: ${doc.workCategory || doc.mimeType})\n`;
            });
             context += '\n';
        }
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