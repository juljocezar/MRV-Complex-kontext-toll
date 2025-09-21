import { useState, useCallback } from 'react';
import { AppState, AgentActivity, AgentProfile, AISettings } from '../types';
import { GeminiService } from '../services/geminiService';
import { bossOrchestrator, MRV_AGENTS } from '../constants';

/**
 * Defines the structure of the JSON response from the orchestrator agent.
 */
interface OrchestratorResponse {
    /** An array of agent IDs chosen by the orchestrator, typically just one. */
    chosenAgentIds: string[];
}

/**
 * The JSON schema used to ensure the orchestrator agent returns a response in the expected format.
 */
const ORCHESTRATOR_SCHEMA = {
    type: "OBJECT",
    properties: {
        chosenAgentIds: {
            type: "ARRAY",
            items: {
                type: "STRING",
            },
        },
    },
    required: ["chosenAgentIds"],
};

/**
 * A custom hook to manage the dispatching of tasks to different AI agents.
 * It encapsulates a two-stage process:
 * 1.  **Orchestration**: An orchestrator agent selects the best specialist agent for the task.
 * 2.  **Execution**: The chosen specialist agent executes the task with the relevant context.
 * The hook handles the loading, error, and result states of this entire workflow.
 *
 * @param {AppState} appState - The current global state of the application.
 * @param {(activity: Omit<AgentActivity, 'id' | 'timestamp'>) => Promise<void>} addAgentActivity - Callback to log agent activities.
 * @returns {{
 *   dispatchAgentTask: (userPrompt: string, capability: keyof AgentProfile['capabilities']) => Promise<void>,
 *   isLoading: boolean,
 *   error: string | null,
 *   result: string | null
 * }} An object containing the dispatch function and the current state of the process.
 */
export const useAgentDispatcher = (
    appState: AppState,
    addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => Promise<void>
) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);

    const buildCaseContext = useCallback(() => {
        let context = `Case Description: ${appState.caseDetails.description}\n\n`;
        context += `Documents in Case:\n`;
        appState.documents.forEach(doc => {
            context += `- ${doc.name} (Type: ${doc.type}, Status: ${doc.classificationStatus})\n`;
        });
        // This can be expanded to include entities, timeline events, etc.
        return context;
    }, [appState.caseDetails.description, appState.documents]);

    /**
     * The main function to dispatch a task. It orchestrates and then executes the task.
     * @param {string} userPrompt - The user's instruction or question.
     * @param {keyof AgentProfile['capabilities']} capability - The required capability for the task.
     */
    const dispatchAgentTask = useCallback(async (userPrompt: string, capability: keyof AgentProfile['capabilities']) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        const aiSettings = appState.settings.ai;

        try {
            // --- STAGE 1: ORCHESTRATION ---
            const agentsWithCapability = Object.entries(MRV_AGENTS)
                .filter(([_, agent]) => agent.capabilities.includes(capability as any))
                .map(([id, agent]) => ({ id, name: agent.name, description: agent.description, capabilities: agent.capabilities }));

            if (agentsWithCapability.length === 0) {
                throw new Error(`No agent found with capability: ${capability}`);
            }

            const orchestratorPrompt = `
                User Prompt: "${userPrompt}"
                Available Agents for capability "${capability}":
                ${JSON.stringify(agentsWithCapability, null, 2)}
            `;

            const orchestratorResponse = await GeminiService.callAIWithSchema<OrchestratorResponse>(
                [bossOrchestrator.systemPrompt, orchestratorPrompt],
                ORCHESTRATOR_SCHEMA,
                aiSettings
            );

            const chosenAgentId = orchestratorResponse.chosenAgentIds?.[0];
            if (!chosenAgentId || !MRV_AGENTS[chosenAgentId]) {
                throw new Error('Orchestrator failed to select a valid agent.');
            }

            const specialistAgent = MRV_AGENTS[chosenAgentId];

            await addAgentActivity({
                agentName: 'Boss Orchestrator',
                action: `Delegated task to ${specialistAgent.name}`,
                result: 'success',
                details: `User prompt: ${userPrompt.substring(0, 100)}...`,
            });

            // --- STAGE 2: EXECUTION ---
            const caseContext = buildCaseContext();
            const specialistPrompt = `
                ${specialistAgent.systemPrompt}

                **Case Context:**
                ${caseContext}

                **User's Request:**
                ${userPrompt}
            `;

            const specialistResponse = await GeminiService.callAI(
                specialistPrompt,
                null,
                aiSettings
            );

            setResult(specialistResponse);
            await addAgentActivity({
                agentName: specialistAgent.name,
                action: `Executed task: ${userPrompt.substring(0, 100)}...`,
                result: 'success',
                details: `Response length: ${specialistResponse.length}`
            });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            await addAgentActivity({
                agentName: 'System',
                action: 'Agent dispatch failed',
                result: 'error',
                details: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    }, [appState, addAgentActivity, buildCaseContext]);

    return { dispatchAgentTask, isLoading, error, result };
};
