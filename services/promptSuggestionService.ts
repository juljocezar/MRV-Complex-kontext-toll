import { AppState } from "../types";

/**
 * Represents a suggested prompt for the user.
 */
interface PromptSuggestion {
    /** A unique identifier for the suggestion. */
    id: string;
    /** The text of the prompt suggestion to be displayed to the user. */
    text: string;
    /** The agent capability this prompt would trigger. */
    capability: string;
}

/**
 * A service to provide context-aware prompt suggestions to the user.
 * Based on the current tab and selected data, it suggests relevant
 * questions or analysis tasks.
 */
export class PromptSuggestionService {

    /**
     * Generates a list of suggested prompts based on the current application state.
     * @param {AppState} appState - The current state of the application.
     * @returns {PromptSuggestion[]} An array of suggested prompts.
     * @todo This is a placeholder implementation. A real implementation should analyze
     * the appState more deeply to generate more meaningful and dynamic suggestions.
     */
    static getSuggestions(appState: AppState): PromptSuggestion[] {
        const suggestions: PromptSuggestion[] = [];

        // Suggestion text is in German and would need to be localized in a real application.
        if (appState.activeTab === 'documents' && appState.documents.length > 0) {
            suggestions.push({
                id: 'suggest-summary',
                text: `Summarize the document ${appState.documents[0].name}.`,
                capability: 'document_analysis'
            });
        }
        
        if (appState.caseEntities.length > 1) {
             suggestions.push({
                id: 'suggest-relations',
                text: 'Analyze the relationships between the known entities.',
                capability: 'case_analysis'
            });
        }

        return suggestions;
    }
}
