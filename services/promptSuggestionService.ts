// This service is intended to provide context-aware prompt suggestions to the user.
// For example, based on the current tab and selected documents, it could suggest
// relevant questions or analysis tasks.

import { AppState } from "../types";

/**
 * @interface PromptSuggestion
 * @description Represents a single suggested prompt for the user.
 * @property {string} id - A unique identifier for the suggestion.
 * @property {string} text - The text of the suggested prompt.
 * @property {string} capability - The AI agent capability this prompt would likely trigger.
 */
interface PromptSuggestion {
    id: string;
    text: string;
    capability: string; // The agent capability this prompt would trigger
}

/**
 * @class PromptSuggestionService
 * @description A placeholder service for generating context-aware prompt suggestions to guide the user.
 */
export class PromptSuggestionService {

    /**
     * @static
     * @function getSuggestions
     * @description Generates a list of suggested prompts based on the current application state.
     * This is a placeholder and should be replaced with a more intelligent implementation.
     * @param {AppState} appState - The current state of the application.
     * @returns {PromptSuggestion[]} An array of suggested prompts.
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
