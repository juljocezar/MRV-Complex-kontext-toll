// Fix: Import AgentCapability from '../types' as it's not exported from '../constants'.
import { AgentProfile, MRV_AGENTS } from '../constants';
import { AgentCapability } from '../types';

/**
 * @function selectAgentForTask
 * @description Selects the most suitable agent for a specific task deterministically. This replaces the AI-based orchestrator model to reduce latency and costs.
 * @description Wählt den am besten geeigneten Agenten für eine bestimmte Aufgabe deterministisch aus. Dies ersetzt das KI-basierte Orchestrator-Modell, um Latenz und Kosten zu reduzieren.
 * @param {AgentCapability} capability - The capability to be executed (e.g., 'workload_calculation'). / Die auszuführende Fähigkeit (z.B. 'workload_calculation').
 * @returns {AgentProfile} The selected agent. / Der ausgewählte Agent.
 */
export const selectAgentForTask = (capability: AgentCapability): AgentProfile => {
    switch (capability) {
        // Analyse & Recherche
        case 'workload_calculation':
        case 'cost_analysis':
            return MRV_AGENTS.workloadAnalyst;
        case 'document_analysis':
        case 'information_extraction':
        case 'document_linking':
        case 'un_submission_assistance':
            return MRV_AGENTS.documentAnalyst;
        case 'legal_analysis':
        case 'contradiction_detection':
        case 'compliance_check':
            return MRV_AGENTS.legalExpert;
        case 'risk_assessment':
            return MRV_AGENTS.riskAnalyst;
        case 'case_analysis': // Für Insights und Berichte
        case 'report_generation':
        case 'research':
            return MRV_AGENTS.researchSpecialist;
        case 'attrition_analysis': // Ethik-Analyse
            return MRV_AGENTS.ethicsAdvisor;

        // Erstellung & Strategie
        case 'content_creation':
        case 'official_documents':
        case 'un_submission_finalization':
            return MRV_AGENTS.contentCreator;
        case 'strategy_development':
            return MRV_AGENTS.strategyConsultant;
        case 'kpi_suggestion':
            return MRV_AGENTS.researchSpecialist;
        
        // Prozess & Optimierung
        case 'task_suggestion':
            return MRV_AGENTS.processOptimizer;

        // Kommunikation
        case 'public_communication':
            return MRV_AGENTS.communicationExpert;

        default:
            // Fallback auf einen fähigen Allrounder
            console.warn(`Kein spezifischer Agent für Fähigkeit '${capability}' gefunden. Fallback auf DocumentAnalyst.`);
            return MRV_AGENTS.documentAnalyst;
    }
};