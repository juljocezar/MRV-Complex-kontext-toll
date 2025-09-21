import { MRV_AGENTS } from '../constants';
import type { AgentProfile, AgentCapability } from '../types';


/**
 * Selects the best agent for a given task based on its capabilities.
 * This function iterates through the available agents and returns the first one
 * that lists the required capability. If no specific agent is found, it returns
 * a default generalist agent.
 * @param {AgentCapability} task - The capability required for the task.
 * @returns {AgentProfile} The profile of the most suitable agent.
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
