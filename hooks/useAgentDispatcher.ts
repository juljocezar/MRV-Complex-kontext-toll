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
    const [result, setResult] = useState<string | null>(null);

    // 1. Implement buildCaseContext
    const buildCaseContext = useCallback(() => {
        let context = `Case Description: ${appState.caseDetails.description}\n\n`;
        context += `Documents in Case:\n`;
        appState.documents.forEach(doc => {
            context += `- ${doc.title} (Type: ${doc.type}, Status: ${doc.classificationStatus})\n`;
        });
        // This can be expanded to include entities, timeline events, etc. as per the docs
        return context;
    }, [appState.caseDetails.description, appState.documents]);

    // 2. Implement the main dispatch function
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
                result: 'erfolg',
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
                result: 'erfolg',
                details: `Response length: ${specialistResponse.length}`
            });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            await addAgentActivity({
                agentName: 'System',
                action: 'Agent dispatch failed',
                result: 'fehler',
                details: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    }, [appState, addAgentActivity, buildCaseContext]);

    return { dispatchAgentTask, isLoading, error, result };
};
