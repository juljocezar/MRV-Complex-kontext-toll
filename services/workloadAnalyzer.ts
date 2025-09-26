import { GeminiService } from './geminiService';
import { WorkloadAnalysis, CostAnalysis, DocumentAnalysisResult, AISettings } from '../types';
import { HOURLY_RATES_EUR } from '../constants/legalBillingRates';

/**
 * @class WorkloadAnalyzerService
 * @description A service dedicated to analyzing document content to estimate the workload and associated costs for legal processing.
 */
export class WorkloadAnalyzerService {
  /**
   * @private
   * @static
   * @readonly
   * @description The JSON schema for the AI's response when estimating workload.
   * It ensures a structured output containing total hours, complexity, and a task breakdown.
   */
  private static readonly WORKLOAD_SCHEMA = {
    type: 'object',
    properties: {
      totalHours: { type: 'number', description: 'Die geschätzte Gesamtzahl der Stunden für die Bearbeitung.' },
      complexity: { type: 'string', enum: ['niedrig', 'mittel', 'hoch'], description: 'Die eingeschätzte Komplexität der Aufgabe.' },
      breakdown: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'Eine spezifische Aufgabe (z.B. Prüfung, Recherche, Zusammenfassung).' },
            hours: { type: 'number', description: 'Die geschätzten Stunden für diese Aufgabe.' }
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
   * @description The JSON schema for the AI's response for cost analysis. **Note: This schema is defined but not currently used in the AI calls.**
   * It structures cost data into recommended, min, and max values with detailed line items.
   */
  private static readonly COST_SCHEMA = {
     type: 'object',
    properties: {
      recommended: { type: 'number', description: 'Der empfohlene Gesamtbetrag in EUR.' },
      min: { type: 'number', description: 'Der minimale geschätzte Betrag in EUR.' },
      max: { type: 'number', description: 'Der maximale geschätzte Betrag in EUR.' },
      details: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item: { type: 'string', description: 'Kostenpunkt (z.B. Anwaltsstunden, Gutachterkosten).' },
            cost: { type: 'number', description: 'Die geschätzten Kosten für diesen Punkt in EUR.' }
          },
          required: ['item', 'cost']
        }
      }
    },
    required: ['recommended', 'min', 'max', 'details']
  };

  /**
   * @static
   * @async
   * @function analyzeWorkload
   * @description The main public method to analyze a document's workload. It calls the AI to estimate hours and complexity,
   * then calculates the associated costs locally. It includes error handling to prevent crashes.
   * @param {string} documentContent - The text content of the document to be analyzed.
   * @param {AISettings} settings - The AI settings for the analysis.
   * @returns {Promise<Partial<DocumentAnalysisResult>>} A promise that resolves to an object containing the workload and cost estimates. Returns an object with undefined properties on failure.
   */
  static async analyzeWorkload(documentContent: string, settings: AISettings): Promise<Partial<DocumentAnalysisResult>> {
    try {
        const workload = await this.estimateWorkload(documentContent, settings);

        // Validate the response from the AI to prevent crashes
        if (!workload || typeof workload.totalHours !== 'number' || !Array.isArray(workload.breakdown)) {
            console.warn("Workload estimation from AI was malformed:", workload);
            // Return a result that indicates no workload could be estimated.
            return { workloadEstimate: undefined, costEstimate: undefined };
        }

        const cost = this.calculateCosts(workload);
        return { workloadEstimate: workload, costEstimate: cost };
    } catch(error) {
        console.error("Error during workload analysis:", error);
        // Return a result that indicates failure, so the main analysis doesn't crash.
        return { workloadEstimate: undefined, costEstimate: undefined };
    }
  }

  /**
   * @private
   * @static
   * @async
   * @function estimateWorkload
   * @description Calls the AI with a specific prompt and schema to get a structured workload estimation.
   * @param {string} documentContent - The text content of the document.
   * @param {AISettings} settings - The AI settings for the call.
   * @returns {Promise<WorkloadAnalysis>} A promise that resolves to the structured workload analysis from the AI.
   * @throws {Error} If the AI call fails.
   */
  private static async estimateWorkload(documentContent: string, settings: AISettings): Promise<WorkloadAnalysis> {
    const prompt = `
Du bist ein Experte für Arbeitsaufwand-Bewertung nach deutschen Standards (RVG/JVEG).
Analysiere das folgende Dokument und schätze den Zeitaufwand für eine vollständige juristische Bearbeitung.

Berücksichtige dabei:
- Länge und Dichte des Textes
- Komplexität des Sachverhalts
- Notwendige Recherche
- Erstellung einer Zusammenfassung

Dokumenteninhalt (erste 10000 Zeichen):
${documentContent.substring(0, 10000)}

Gib das Ergebnis im geforderten JSON-Format zurück.
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
   * @private
   * @static
   * @function calculateCosts
   * @description Calculates the estimated costs based on a given workload analysis.
   * It uses predefined hourly rates and adds a surcharge for high complexity.
   * @param {WorkloadAnalysis} workload - The workload analysis object containing hours and complexity.
   * @returns {CostAnalysis} The calculated cost analysis object.
   */
  private static calculateCosts(workload: WorkloadAnalysis): CostAnalysis {
    const baseCost = workload.totalHours * HOURLY_RATES_EUR.SENIOR_LAWYER;
    const minCost = baseCost * 0.8;
    const maxCost = baseCost * 1.2;

    const details = workload.breakdown.map(task => ({
        item: `Anwaltsstunden: ${task.task}`,
        cost: task.hours * HOURLY_RATES_EUR.SENIOR_LAWYER
    }));

    if (workload.complexity === 'hoch') {
        details.push({ item: 'Pauschale für hohe Komplexität', cost: 500 });
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