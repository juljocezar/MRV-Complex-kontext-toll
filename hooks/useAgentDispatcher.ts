import { useState, useCallback } from 'react';
import { AppState, AgentActivity, AgentProfile, AISettings } from '../types';
import { GeminiService } from '../services/geminiService';
import { bossOrchestrator, MRV_AGENTS } from '../constants';

// Define the structure of the JSON response from the orchestrator
interface OrchestratorResponse {
    chosenAgentIds: string[];
}

// Schema for the orchestrator's JSON response
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

export const useAgentDispatcher = (
    appState: AppState,
    addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => Promise<void>
) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const buildCaseContext = useCallback(() => {
        // Simplified context for now
        let context = `Case Description: ${appState.caseDetails.description}\n\n`;
        context += `Documents in Case:\n`;
        appState.documents.forEach(doc => {
            context += `- ${doc.name} (Type: ${doc.type || 'N/A'})\n`;
        });
        return context;
    }, [appState.caseDetails.description, appState.documents]);

    const dispatchAgentTask = useCallback(async (userPrompt: string, capability: string, jsonSchema: object | null = null) => {
        setIsLoading(true);
        setError(null);

        const apiKey = appState.settings.ai.apiKey;
        if (!apiKey) {
            const err = "Gemini API key is not set in Settings.";
            setError(err);
            setIsLoading(false);
            throw new Error(err);
        }

        try {
            const agentsWithCapability = Object.entries(MRV_AGENTS)
                .filter(([_, agent]) => agent.capabilities.includes(capability))
                .map(([id, agent]) => ({ id, name: agent.name, description: agent.description }));

            if (agentsWithCapability.length === 0) throw new Error(`No agent found with capability: ${capability}`);

            const orchestratorPrompt = `User Prompt: "${userPrompt}"\nAvailable Agents for capability "${capability}":\n${JSON.stringify(agentsWithCapability, null, 2)}`;
            const orchestratorResponse = await GeminiService.callAI<OrchestratorResponse>(apiKey, [bossOrchestrator.systemPrompt, orchestratorPrompt], ORCHESTRATOR_SCHEMA, appState.settings.ai);

            const chosenAgentId = orchestratorResponse.chosenAgentIds?.[0];
            if (!chosenAgentId || !MRV_AGENTS[chosenAgentId]) throw new Error('Orchestrator failed to select a valid agent.');

            const specialistAgent = MRV_AGENTS[chosenAgentId];
            await addAgentActivity({ agentName: 'Boss Orchestrator', action: `Delegated task to ${specialistAgent.name}`, result: 'erfolg', details: `Prompt: ${userPrompt.substring(0, 50)}...` });

            const caseContext = buildCaseContext();
            const specialistPrompt = `${specialistAgent.systemPrompt}\n\n**Case Context:**\n${caseContext}\n\n**User's Request:**\n${userPrompt}`;

            const specialistResponse = await GeminiService.callAI(apiKey, specialistPrompt, jsonSchema, appState.settings.ai);

            await addAgentActivity({ agentName: specialistAgent.name, action: `Executed task: ${userPrompt.substring(0, 50)}...`, result: 'erfolg', details: `Response received.` });

            setIsLoading(false);
            return specialistResponse;

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            await addAgentActivity({ agentName: 'System', action: 'Agent dispatch failed', result: 'fehler', details: errorMessage });
            setIsLoading(false);
            throw e;
        }
    }, [appState, addAgentActivity, buildCaseContext]);

    return { dispatchAgentTask, isLoading, error, result };
};
