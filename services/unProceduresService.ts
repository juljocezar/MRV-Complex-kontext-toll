// This service simulates interactions with UN Special Procedures, providing logic for drafting and managing submissions.

import { AppState } from '../types';
import { UN_SUBMISSION_TEMPLATES } from '../constants/unProcedures';
import { buildCaseContext } from '../utils/contextUtils';
import { StructuredAIService } from './structuredAIService';
import { selectAgentForTask } from '../utils/agentSelection';

export class UNProceduresService {

  /**
   * Drafts a UN submission by filling a template with case data using an AI agent.
   */
  static async draftSubmission(
    templateId: string,
    appState: AppState
  ): Promise<string> {
    const template = UN_SUBMISSION_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const caseContext = buildCaseContext(appState);
    const agent = selectAgentForTask('un_submission_assistance');

    const prompt = `
${agent.systemPrompt}

**Task:** Draft a UN submission based on the provided template and case context. Fill in all required fields with relevant information from the case. If information is missing, explicitly state "[Information not available]".

**Template:**
${JSON.stringify(template, null, 2)}

**Case Context:**
${caseContext}

**Output:**
Provide only the filled-out submission content as a structured text or markdown document.
    `;

    try {
      const response = await StructuredAIService.callAI(
        prompt, 
        null, 
        appState.settings.ai
      );
      return response;
    } catch (error) {
      console.error("Failed to draft UN submission:", error);
      return "Error: Could not generate the submission draft.";
    }
  }

  /**
   * Finalizes a submission draft, checking for completeness and adherence to guidelines.
   */
  static async finalizeSubmission(
    draftContent: string,
    appState: AppState
  ): Promise<string> {
     const agent = selectAgentForTask('un_submission_finalization');
     const prompt = `
${agent.systemPrompt}

**Task:** Review the following draft submission for a UN Special Procedure. Check for clarity, factual accuracy (based on the provided context), and adherence to UN submission guidelines. Correct any grammatical errors and improve the formal tone. Ensure all key elements (victim identity, incident, perpetrators, consent) are clearly stated.

**Case Context:**
${buildCaseContext(appState)}

**Draft Submission:**
${draftContent}

**Output:**
Provide the final, polished version of the submission.
     `;
     
    try {
      const response = await StructuredAIService.callAI(
        prompt, 
        null, 
        appState.settings.ai
      );
      return response;
    } catch (error) {
      console.error("Failed to finalize UN submission:", error);
      return "Error: Could not finalize the submission.";
    }
  }
}
