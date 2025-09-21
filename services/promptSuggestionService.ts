// This service is intended to provide context-aware prompt suggestions to the user.
// For example, based on the current tab and selected documents, it could suggest
// relevant questions or analysis tasks.

import { AppState } from "../types";

interface PromptSuggestion {
    id: string;
    text: string;
    capability: string; // The agent capability this prompt would trigger
}

export class PromptSuggestionService {

    /**
     * Generates a list of suggested prompts based on the current application state.
     * @param appState The current state of the application.
     * @returns An array of suggested prompts.
     */
    static getSuggestions(appState: AppState): PromptSuggestion[] {
        // This is a placeholder implementation.
        // A real implementation would analyze the appState to generate meaningful suggestions.

        const suggestions: PromptSuggestion[] = [];

        if (appState.activeTab === 'documents' && appState.documents.length > 0) {
            suggestions.push({
                id: 'suggest-summary',
                text: `Fasse das Dokument ${appState.documents[0].name} zusammen.`,
                capability: 'document_analysis'
            });
        }
        
        if (appState.caseEntities.length > 1) {
             suggestions.push({
                id: 'suggest-relations',
                text: 'Analysiere die Beziehungen zwischen den bekannten Entitäten.',
                capability: 'case_analysis'
            });
        }

        return suggestions;
    }
}
