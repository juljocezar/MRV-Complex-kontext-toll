
import { AppState, ProactiveSuggestion } from "../types";

/**
 * @class ProactiveSuggestionService
 * @description A service that generates contextual, proactive suggestions for the user based on the current application state.
 */
export class ProactiveSuggestionService {

    /**
     * @static
     * @function getSuggestions
     * @description Analyzes the application state to generate a list of relevant, actionable suggestions for the user.
     * The suggestions are designed to guide the user towards meaningful next steps in their case analysis.
     * @param {AppState} appState - The current state of the application.
     * @returns {ProactiveSuggestion[]} An array of suggestion objects. The array is sliced to return a limited number of suggestions at a time.
     */
    static getSuggestions(appState: AppState): ProactiveSuggestion[] {
        const suggestions: ProactiveSuggestion[] = [];

        if (appState.isLoading) return []; // Don't show suggestions while loading

        // Suggestion 1: Analyze unclassified documents
        if (appState.documents.some(d => d.classificationStatus === 'unclassified')) {
            suggestions.push({
                id: 'analyze-docs',
                text: 'Es gibt unanalysierte Dokumente. Jetzt überprüfen?',
                action: { type: 'navigate', payload: 'documents' }
            });
        }
        
        // Suggestion 2: Review new contradictions
        if (appState.contradictions.length > 0) {
             suggestions.push({
                id: 'review-contradictions',
                text: `Es wurden ${appState.contradictions.length} Widersprüche gefunden. Möchten Sie sie überprüfen?`,
                action: { type: 'navigate', payload: 'contradictions' }
            });
        }

        // Suggestion 3: Generate mitigation strategies if risks are selected but no strategies exist
        const hasActiveRisks = Object.values(appState.risks).some(isActive => isActive);
        if (hasActiveRisks && !appState.mitigationStrategies) {
            suggestions.push({
                id: 'generate-strategies',
                text: 'Risiken wurden identifiziert. Sollen Minderungsstrategien generiert werden?',
                action: { type: 'navigate', payload: 'strategy' }
            });
        }

        // Suggestion 4: Analyze entity relationships if none exist
        const needsRelationshipAnalysis = appState.caseEntities.length > 1 && appState.caseEntities.every(e => !e.relationships || e.relationships.length === 0);
        if (needsRelationshipAnalysis) {
             suggestions.push({
                id: 'analyze-relationships',
                text: 'Das Beziehungsgeflecht der Entitäten wurde noch nicht analysiert. Jetzt starten?',
                action: { type: 'navigate', payload: 'entities' }
            });
        }
        
        // Suggestion 5: Generate an overall analysis if it hasn't been done
        if (!appState.caseSummary && appState.documents.length > 0) {
             suggestions.push({
                id: 'perform-overall-analysis',
                text: 'Eine KI-Gesamtanalyse des Falles wurde noch nicht durchgeführt. Jetzt starten?',
                action: { type: 'navigate', payload: 'dashboard' }
            });
        }

        // Return a limited number of unique suggestions, filtering out ones the user has already seen/dismissed in this session.
        // For simplicity here, we just return the first two found.
        return suggestions.slice(0, 2);
    }
}
