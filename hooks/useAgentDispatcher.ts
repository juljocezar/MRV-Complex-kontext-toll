import { useState, useCallback } from 'react';
import { AppState, AgentActivity } from '../types';
import { selectAgentForTask } from '../utils/agentSelection';
import { GeminiService } from '../services/geminiService';

/**
 * @typedef {'summarization' | 'risk_assessment' | 'strategy_development' | 'report_generation'} TaskType
 * @description The type of task to be dispatched to an AI agent.
 */
type TaskType = 'summarization' | 'risk_assessment' | 'strategy_development' | 'report_generation';

/**
 * @hook useAgentDispatcher
 * @description A custom hook to manage dispatching tasks to different AI agents based on the task type.
 * It handles agent selection, prompt generation, API calls, and state management (loading, error, result).
 * @param {AppState} appState - The current state of the application, used for accessing settings.
 * @param {(activity: Omit<AgentActivity, 'id' | 'timestamp'>) => string} addAgentActivity - Callback to log the agent's activity.
 * @returns {{
 *   dispatch: (task: TaskType, context: string, promptOverride?: string) => Promise<void>;
 *   isLoading: boolean;
 *   error: string | null;
 *   result: string | null;
 * }} An object containing the dispatch function and the current state of the operation.
 */
export const useAgentDispatcher = (appState: AppState, addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => string) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);

    const dispatch = useCallback(async (task: TaskType, context: string, promptOverride?: string) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        const agent = selectAgentForTask(task);

        const prompt = promptOverride || `
            ${agent.systemPrompt}

            **Task:** ${task.replace(/_/g, ' ')}

            **Context:**
            ${context}

            **Output:**
            Provide a clear and concise response to the task based on the context.
        `;
        
        try {
            const response = await GeminiService.callAI(prompt, null, appState.settings.ai);
            setResult(response);
            addAgentActivity({
                agentName: agent.name,
                action: `Executed task: ${task}`,
                result: 'erfolg',
                details: `Prompt length: ${prompt.length}, Response length: ${response.length}`
            });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            addAgentActivity({
                agentName: agent.name,
                action: `Failed task: ${task}`,
                result: 'fehler',
                details: errorMessage
            });
        } finally {
            setIsLoading(false);
        }
    }, [appState.settings.ai, addAgentActivity]);

    return { dispatch, isLoading, error, result };
};