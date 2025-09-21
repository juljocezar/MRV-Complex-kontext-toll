import { useState, useCallback } from 'react';
import { AppState, AgentActivity } from '../types';
import { selectAgentForTask } from '../utils/agentSelection';
import { GeminiService } from '../services/geminiService';

type TaskType = 'summarization' | 'risk_assessment' | 'strategy_development' | 'report_generation';

export const useAgentDispatcher = (appState: AppState, addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => Promise<void>) => {
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
            await addAgentActivity({
                agentName: agent.name,
                action: `Executed task: ${task}`,
                result: 'erfolg',
                details: `Prompt length: ${prompt.length}, Response length: ${response.length}`
            });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            await addAgentActivity({
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
