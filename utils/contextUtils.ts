import { AppState, CaseSummary, Risks } from '../types';

/**
 * Erstellt einen zusammenfassenden Kontextstring des gesamten Falls aus dem aktuellen Anwendungszustand.
 * Dieser Kontext wird in vielen KI-Prompts verwendet, um der KI ein umfassendes "Verständnis"
 * des Falls zu geben, ohne den gesamten Datenbestand übermitteln zu müssen.
 * Die Funktion wählt sorgfältig die wichtigsten Informationen aus und formatiert sie
 * in einem für die KI lesbaren Markdown-Format.
 *
 * @param appState - Der aktuelle Gesamtzustand der Anwendung.
 * @returns Ein formatierter String, der den Fallkontext zusammenfasst.
 */
export const buildCaseContext = (appState: AppState): string => {
    // Entpackt die relevanten Teile aus dem AppState für einfacheren Zugriff.
    const { caseContext, documents, caseEntities, knowledgeItems, timelineEvents, risks, kpis, caseSummary } = appState;
    const { caseDescription } = caseContext;

    // Beginnt mit der allgemeinen Fallbeschreibung als Grundlage.
    let context = `**Fallbeschreibung:**\n${caseDescription || 'Keine Beschreibung verfügbar.'}\n\n`;

    // Fügt eine Übersicht der wichtigsten Dokumente hinzu.
    // Begrenzt auf die ersten 5, um den Kontext nicht zu überladen.
    if (documents.length > 0) {
        context += `**Zentrale Dokumente (${documents.length}):**\n`;
        documents.slice(0, 5).forEach(doc => {
            context += `- ${doc.name} (Typ: ${doc.workCategory || doc.mimeType}, Status: ${doc.classificationStatus})\n`;
        });
        context += '\n';
    }
    
    // Fügt die wichtigsten bekannten Entitäten (Personen, Organisationen etc.) hinzu.
    if (caseEntities.length > 0) {
        context += `**Bekannte Entitäten (${caseEntities.length}):**\n`;
        caseEntities.slice(0, 10).forEach(entity => {
            context += `- ${entity.name} (${entity.type}): ${entity.description}\n`;
        });
        context += '\n';
    }

    // Fügt die Top-Einträge aus der Wissensdatenbank hinzu, um wichtige Erkenntnisse hervorzuheben.
    if (knowledgeItems.length > 0) {
        context += `**Top 5 Wissenseinträge:**\n`;
        knowledgeItems.slice(0, 5).forEach(item => {
            context += `- ${item.title}: ${item.summary}\n`;
        });
        context += '\n';
    }
    
    // Fügt die neuesten Ereignisse aus der Chronologie hinzu, um aktuelle Entwicklungen zu berücksichtigen.
    if (timelineEvents.length > 0) {
        context += `**Letzte 5 Chronologie-Ereignisse:**\n`;
        timelineEvents.slice(-5).reverse().forEach(event => {
            context += `- ${event.date}: ${event.title}\n`;
        });
        context += '\n';
    }

    // Listet alle als aktiv markierten Risiken auf.
    const activeRisks = Object.entries(risks)
        .filter(([, isActive]) => isActive)
        .map(([risk]) => risk)
        .join(', ');
    
    if (activeRisks) {
        context += `**Aktive Risiken:** ${activeRisks}\n\n`;
    }

    // Fügt die von der KI erstellte Gesamtzusammenfassung des Falls hinzu, falls vorhanden.
    if (caseSummary) {
        context += `**KI-Zusammenfassung:** ${caseSummary.summary}\n\n`;
    }

    return context;
};
