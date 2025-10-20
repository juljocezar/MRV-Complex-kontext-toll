

import { AppState, ProactiveSuggestion } from "../types";

export class ProactiveSuggestionService {

    /**
     * Generates a list of suggested prompts based on the current application state.
     * @param appState The current state of the application.
     * @returns An array of suggested prompts.
     */
    static getSuggestions(appState: AppState): ProactiveSuggestion[] {
        const suggestions: ProactiveSuggestion[] = [];

        if (appState.isLoading) return []; // Don't show suggestions while loading

        // --- New, more intelligent suggestions ---

        // 1. Pattern: Deep contextual research
        // Look at the last 5 document analyses
        const analysisActivities = appState.agentActivity
            .filter(a => a.action.startsWith('Analysiere:'))
            .slice(0, 5);

        if (analysisActivities.length >= 3) {
            const contextualDocsAnalyzed = analysisActivities.filter(activity => {
                const docName = activity.action.replace('Analysiere: ', '');
                const doc = appState.documents.find(d => d.name === docName);
                return doc?.contentType === 'contextual-report';
            }).length;

            if (contextualDocsAnalyzed >= 3 && appState.activeTab !== 'legal-basis') {
                 suggestions.push({
                    id: 'suggest-deeper-research',
                    text: 'Sie konzentrieren sich auf Hintergrundrecherchen. Sollen die externen Rechtsdatenbanken konsultiert werden?',
                    action: { type: 'navigate', payload: 'legal-basis' }
                });
            }
        }

        // 2. Correlation: Risks to HRD Tools
        if (appState.risks.digital && appState.activeTab !== 'hrd-support') {
             suggestions.push({
                id: 'suggest-comms-plan',
                text: 'Digitales Risiko erkannt. Jetzt einen sicheren Kommunikationsplan erstellen?',
                action: { type: 'navigate', payload: 'hrd-support' }
            });
        }
        if ((appState.risks.physical || appState.risks.intimidation) && appState.activeTab !== 'hrd-support') {
            suggestions.push({
                id: 'suggest-hrd-emergency-resources',
                text: 'Physische Risiken erkannt. Sollen Notfall-Ressourcen für HRDs geprüft werden?',
                action: { type: 'navigate', payload: 'hrd-support' }
            });
        }

        // --- Existing suggestions (will be appended) ---

        // Suggestion: Analyze unclassified documents
        if (appState.documents.some(d => d.classificationStatus === 'unclassified')) {
            suggestions.push({
                id: 'analyze-docs',
                text: 'Es gibt unanalysierte Dokumente. Jetzt überprüfen?',
                action: { type: 'navigate', payload: 'documents' }
            });
        }
        
        // Suggestion: Review new contradictions
        if (appState.contradictions.length > 0) {
             suggestions.push({
                id: 'review-contradictions',
                text: `Es wurden ${appState.contradictions.length} Widersprüche gefunden. Möchten Sie sie überprüfen?`,
                action: { type: 'navigate', payload: 'contradictions' }
            });
        }

        // Suggestion: Generate mitigation strategies if risks are selected but no strategies exist
        const hasActiveRisks = Object.values(appState.risks).some(isActive => isActive);
        if (hasActiveRisks && !appState.mitigationStrategies) {
            suggestions.push({
                id: 'generate-strategies',
                text: 'Risiken wurden identifiziert. Sollen Minderungsstrategien generiert werden?',
                action: { type: 'navigate', payload: 'strategy' }
            });
        }

        // Suggestion: Analyze entity relationships if none exist
        const needsRelationshipAnalysis = appState.caseEntities.length > 1 && appState.caseEntities.every(e => !e.relationships || e.relationships.length === 0);
        if (needsRelationshipAnalysis) {
             suggestions.push({
                id: 'analyze-relationships',
                text: 'Das Beziehungsgeflecht der Entitäten wurde noch nicht analysiert. Jetzt starten?',
                action: { type: 'navigate', payload: 'entities' }
            });
        }
        
        // Suggestion: Generate an overall analysis if it hasn't been done
        if (!appState.caseSummary && appState.documents.length > 0) {
             suggestions.push({
                id: 'perform-overall-analysis',
                text: 'Eine KI-Gesamtanalyse des Falles wurde noch nicht durchgeführt. Jetzt starten?',
                action: { type: 'navigate', payload: 'dashboard' }
            });
        }
        
        // --- Finalization ---
        // Return a limited number of unique suggestions
        const uniqueSuggestions = suggestions.filter((v,i,a) => a.findIndex(t => (t.id === v.id)) === i);
        return uniqueSuggestions.slice(0, 2);
    }
}