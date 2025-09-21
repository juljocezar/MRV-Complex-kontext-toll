import { GeminiService } from './geminiService';
import { WorkloadAnalysis, CostAnalysis, DocumentAnalysisResult, AISettings } from '../types';
import { HOURLY_RATES_EUR } from '../constants/legalBillingRates';

export class WorkloadAnalyzerService {
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

  static async analyzeWorkload(documentContent: string, settings: AISettings): Promise<DocumentAnalysisResult> {
    const workload = await this.estimateWorkload(documentContent, settings);
    const cost = this.calculateCosts(workload);
    return { docId: '', workloadEstimate: workload, costEstimate: cost };
  }

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
