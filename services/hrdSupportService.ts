// This service provides AI-driven support functions for Human Rights Defenders (HRDs).

import { AppState } from '../types';
import { HRDRiskAssessment, SecureCommunicationPlan } from '../types/hrdResources';
import { buildCaseContext } from '../utils/contextUtils';
import { StructuredAIService } from './structuredAIService';
import { selectAgentForTask } from '../utils/agentSelection';

/**
 * Provides AI-driven support functions specifically for Human Rights Defenders (HRDs).
 * This service leverages specialized AI agents to perform risk assessments and generate
 * secure communication plans based on the overall case context.
 */
export class HRDSupportService {

  /**
   * Performs a comprehensive risk assessment for a Human Rights Defender (HRD)
   * based on the current case context. It uses a specialized 'risk_assessment' agent
   * to identify physical, digital, legal, and psychological risks and suggests mitigations.
   * @param {AppState} appState - The current state of the application.
   * @returns {Promise<HRDRiskAssessment>} A promise that resolves with a structured risk assessment.
   * @throws {Error} If the risk assessment process fails.
   */
  static async performRiskAssessment(appState: AppState): Promise<HRDRiskAssessment> {
    const caseContext = buildCaseContext(appState);
    const agent = selectAgentForTask('risk_assessment');

    const schema = {
      type: 'object',
      properties: {
        overallRiskLevel: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'], description: "The overall assessed risk level for the HRD." },
        identifiedRisks: {
          type: 'array',
          description: "A list of specific risks identified.",
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string', description: "A description of the specific risk." },
              mitigation: { type: 'string', description: "A suggested strategy to mitigate this risk." },
            },
            required: ['risk', 'mitigation'],
          },
        },
        recommendations: { type: 'string', description: "Overall recommendations for the HRD's safety and security." },
      },
      required: ['overallRiskLevel', 'identifiedRisks', 'recommendations'],
    };

    const prompt = `
${agent.systemPrompt}

**Task:** Analyze the following case context from the perspective of a Human Rights Defender's security. Identify potential risks (physical, digital, legal, psychological) and suggest concrete mitigation strategies. Assess the overall risk level.

**Case Context:**
${caseContext}

**Output:**
Provide the analysis in the specified JSON format.
    `;

    try {
      return await StructuredAIService.callAIWithSchema<HRDRiskAssessment>(
        prompt,
        schema,
        appState.settings.ai
      );
    } catch (error) {
      console.error('Failed to perform HRD risk assessment:', error);
      throw new Error('Risk assessment failed.');
    }
  }

  /**
   * Generates a secure communication plan tailored to the case context.
   * It uses a 'strategy_development' agent to recommend secure applications and
   * outline best practices for communication.
   * @param {AppState} appState - The current state of the application.
   * @returns {Promise<SecureCommunicationPlan>} A promise that resolves with a structured secure communication plan.
   * @throws {Error} If the plan generation fails.
   */
  static async generateSecureCommunicationPlan(appState: AppState): Promise<SecureCommunicationPlan> {
    const caseContext = buildCaseContext(appState);
    const agent = selectAgentForTask('strategy_development');

    const schema = {
        type: 'object',
        properties: {
            recommendedApps: {
                type: 'array',
                description: "A list of recommended secure applications.",
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: "The name of the application." },
                        for: { type: 'string', description: 'The purpose of the application (e.g., Secure Messaging, Email, File Storage).' }
                    },
                    required: ['name', 'for']
                }
            },
            bestPractices: {
                type: 'array',
                description: "A list of critical security best practices.",
                items: { type: 'string' }
            }
        },
        required: ['recommendedApps', 'bestPractices']
    };

    const prompt = `
${agent.systemPrompt}

**Task:** Based on the case context, create a simple and actionable secure communication plan for a Human Rights Defender. Recommend specific, widely-used, and audited end-to-end encrypted applications for different purposes (messaging, email, etc.). Also, list the top 5 most critical best practices they should follow.

**Case Context:**
${caseContext}

**Output:**
Provide the plan in the specified JSON format.
    `;

     try {
      return await StructuredAIService.callAIWithSchema<SecureCommunicationPlan>(
        prompt,
        schema,
        appState.settings.ai
      );
    } catch (error) {
      console.error('Failed to generate secure communication plan:', error);
      throw new Error('Plan generation failed.');
    }
  }
}
