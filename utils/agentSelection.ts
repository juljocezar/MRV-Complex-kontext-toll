import { MRV_AGENTS } from '../constants';
import type { AgentProfile, AgentCapability } from '../types';


/**
 * @function selectAgentForTask
 * @description Selects the most suitable AI agent for a given task by matching the task to the agent's declared capabilities.
 * If no agent with the specific capability is found, it defaults to a generalist agent.
 * @param {AgentCapability} task - The capability required for the task (e.g., 'summarization', 'risk_assessment').
 * @returns {AgentProfile} The profile of the most suitable agent. Returns the generalist document analyst as a fallback.
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
