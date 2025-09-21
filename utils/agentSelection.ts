import { MRV_AGENTS } from '../constants';
import type { AgentProfile, AgentCapability } from '../types';


/**
 * Selects the best agent for a given task based on its capabilities.
 * @param task The type of task to be performed.
 * @returns The most suitable AgentProfile.
 */
export const selectAgentForTask = (task: AgentCapability): AgentProfile => {
    for (const agentKey in MRV_AGENTS) {
        const agent = MRV_AGENTS[agentKey];
        if (agent.capabilities.includes(task)) {
            return agent;
        }
    }

    // Fallback to the generalist document analyst if no specific agent is found
    return MRV_AGENTS.documentAnalyst;
};
