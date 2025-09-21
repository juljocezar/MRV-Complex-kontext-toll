import { GeminiService } from './geminiService';
import { WorkloadAnalysis, CostAnalysis, DocumentAnalysisResult, AISettings } from '../types';
import { HOURLY_RATES_EUR } from '../constants/legalBillingRates';

/**
 * A service to analyze document content to estimate the required workload
 * and associated costs for legal processing.
 */
export class WorkloadAnalyzerService {
  /**
   * @private
   * @static
   * @readonly
   * @description The JSON schema for the AI's workload estimation response.
   */
  private static readonly WORKLOAD_SCHEMA = {
    type: 'object',
    properties: {
      totalHours: { type: 'number', description: 'The estimated total number of hours for processing.' },
      complexity: { type: 'string', enum: ['low', 'medium', 'high'], description: 'The estimated complexity of the task.' },
      breakdown: {
        type: 'array',
        description: 'A breakdown of hours by specific sub-task.',
        items: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'A specific task (e.g., review, research, summary).' },
            hours: { type: 'number', description: 'The estimated hours for this task.' }
          },
          required: ['task', 'hours']
        }
      }
    },
    required: ['totalHours', 'complexity', 'breakdown']
  };

  /**
   * @private
   * @static
   * @readonly
   * @description The JSON schema for the cost analysis structure. Note: This is for internal structure and not used for an AI call.
   */
  private static readonly COST_SCHEMA = {
     type: 'object',
    properties: {
      recommended: { type: 'number', description: 'The recommended total amount in EUR.' },
      min: { type: 'number', description: 'The minimum estimated amount in EUR.' },
      max: { type: 'number', description: 'The maximum estimated amount in EUR.' },
      details: {
        type: 'array',
        description: 'A detailed breakdown of the costs.',
        items: {
          type: 'object',
          properties: {
            item: { type: 'string', description: 'Cost item (e.g., lawyer hours, expert fees).' },
            cost: { type: 'number', description: 'The estimated cost for this item in EUR.' }
          },
          required: ['item', 'cost']
        }
      }
    },
    required: ['recommended', 'min', 'max', 'details']
  };

  /**
   * Analyzes a document's content to produce a full workload and cost analysis.
   * @param {string} documentContent - The content of the document to analyze.
   * @param {AISettings} settings - The AI settings for the analysis.
   * @returns {Promise<DocumentAnalysisResult>} A promise resolving to a document analysis result
   * containing the workload and cost estimates.
   */
  static async analyzeWorkload(documentContent: string, settings: AISettings): Promise<DocumentAnalysisResult> {
    const workload = await this.estimateWorkload(documentContent, settings);
    const cost = this.calculateCosts(workload);
    // Returns a partial DocumentAnalysisResult, assuming it will be merged elsewhere.
    return { docId: '', workloadEstimate: workload, costEstimate: cost };
  }

  /**
   * Uses the AI to estimate the time and complexity of processing a document.
   * @private
   * @param {string} documentContent - The content of the document.
   * @param {AISettings} settings - The AI settings for the analysis.
   * @returns {Promise<WorkloadAnalysis>} A promise resolving to the structured workload analysis.
   * @throws {Error} If the AI estimation fails.
   */
  private static async estimateWorkload(documentContent: string, settings: AISettings): Promise<WorkloadAnalysis> {
    // The prompt is in German, as requested by the original user.
    // An English translation is provided in comments for clarity.
    const prompt = `
You are an expert in workload assessment according to German standards (RVG/JVEG).
Analyze the following document and estimate the time required for a complete legal review.

Consider the following:
- Length and density of the text
- Complexity of the facts
- Necessary research
- Creation of a summary

Document content (first 10,000 characters):
${documentContent.substring(0, 10000)}

Return the result in the required JSON format.
    `;
    try {
      return await GeminiService.callAIWithSchema<WorkloadAnalysis>(
        prompt,
        this.WORKLOAD_SCHEMA,
        settings
      );
    } catch (error) {
      console.error('Workload estimation failed:', error);
      throw new Error(`Workload estimation failed.`);
    }
  }
  
  /**
   * Calculates the estimated costs based on a workload analysis.
   * @private
   * @param {WorkloadAnalysis} workload - The workload analysis object from the AI.
   * @returns {CostAnalysis} The calculated cost analysis.
   */
  private static calculateCosts(workload: WorkloadAnalysis): CostAnalysis {
    const baseCost = workload.totalHours * HOURLY_RATES_EUR.SENIOR_LAWYER;
    const minCost = baseCost * 0.8;
    const maxCost = baseCost * 1.2;

    const details = workload.breakdown.map(task => ({
        item: `Lawyer hours: ${task.task}`,
        cost: task.hours * HOURLY_RATES_EUR.SENIOR_LAWYER
    }));

    if (workload.complexity === 'high') {
        details.push({ item: 'Lump sum for high complexity', cost: 500 });
    }

    const recommended = details.reduce((sum, item) => sum + item.cost, 0);

    return {
        recommended: parseFloat(recommended.toFixed(2)),
        min: parseFloat(minCost.toFixed(2)),
        max: parseFloat(maxCost.toFixed(2)),
        details,
    };
  }
}
