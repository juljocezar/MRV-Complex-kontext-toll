// This service provides AI-driven support functions for Human Rights Defenders (HRDs).

import { AppState } from '../types';
import { HRDRiskAssessment, SecureCommunicationPlan } from '../types/hrdResources';
import { buildCaseContext } from '../utils/contextUtils';
import { GeminiService } from './geminiService';
import { selectAgentForTask } from '../utils/agentSelection';

/**
 * @class HRDSupportService
 * @description Provides AI-driven support functions specifically for Human Rights Defenders (HRDs).
 * This includes risk assessment and secure communication planning based on the case context.
 */
export class HRDSupportService {

  /**
   * @static
   * @async
   * @function performRiskAssessment
   * @description Performs a risk assessment for an HRD based on the case context.
   * @param {AppState} appState - The current application state, used for context and AI settings.
   * @returns {Promise<HRDRiskAssessment>} A promise that resolves to a structured risk assessment object.
   * @throws {Error} If the AI call for risk assessment fails.
   */
  static async performRiskAssessment(appState: AppState): Promise<HRDRiskAssessment> {
    const caseContext = buildCaseContext(appState);
    const agent = selectAgentForTask('risk_assessment');

    const schema = {
      type: 'object',
      properties: {
        overallRiskLevel: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
        identifiedRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              mitigation: { type: 'string' },
            },
            required: ['risk', 'mitigation'],
          },
        },
        recommendations: { type: 'string' },
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
      return await GeminiService.callAIWithSchema<HRDRiskAssessment>(
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
   * @static
   * @async
   * @function generateSecureCommunicationPlan
   * @description Generates a secure communication plan tailored to the case context.
   * @param {AppState} appState - The current application state.
   * @returns {Promise<SecureCommunicationPlan>} A promise that resolves to a structured communication plan.
   * @throws {Error} If the AI call for the communication plan fails.
   */
  static async generateSecureCommunicationPlan(appState: AppState): Promise<SecureCommunicationPlan> {
    const caseContext = buildCaseContext(appState);
    const agent = selectAgentForTask('strategy_development');

    const schema = {
        type: 'object',
        properties: {
            recommendedApps: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        for: { type: 'string', description: 'e.g., Secure Messaging, Email, File Storage' }
                    },
                    required: ['name', 'for']
                }
            },
            bestPractices: {
                type: 'array',
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
      return await GeminiService.callAIWithSchema<SecureCommunicationPlan>(
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