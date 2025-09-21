import { StructuredAIService } from './structuredAIService';
import type { TemporalAnalysisResult, AISettings } from '../types';

/**
 * Provides services for conducting in-depth temporal analysis of case data.
 * This service can identify patterns, sequences, clusters, and anomalies in time-series data.
 */
export class TemporalAnalyzerService {
  /**
   * @private
   * @static
   * @readonly
   * @description A comprehensive JSON schema that defines the expected structure for a detailed temporal analysis response from the AI.
   * This schema covers multiple facets of temporal analysis, including overall timeframe, chronology, event clusters,
   * recurring patterns, causal chains, and anomalies.
   */
  private static readonly TEMPORAL_ANALYSIS_SCHEMA = {
    type: 'object',
    properties: {
        timeframe: {
            type: 'object',
            description: "Overall details of the analysis timeframe.",
            properties: {
                start: { type: 'string', description: "Start date of the analyzed period." },
                end: { type: 'string', description: "End date of the analyzed period." },
                duration: { type: 'string', description: "Total duration of the period." },
                eventDensity: { type: 'string', description: "A qualitative measure of event frequency (e.g., 'high', 'sporadic')." },
            }
        },
        chronology: {
            type: 'array',
            description: "A logically sorted sequence of key events.",
            items: {
                type: 'object',
                properties: {
                    timestamp: { type: 'string', description: "The specific date/time of the event." },
                    eventId: { type: 'string', description: "The unique ID of the event." },
                    title: { type: 'string', description: "A brief title for the event." },
                    type: { type: 'string', description: "The category or type of the event." },
                    importance: { type: 'number', description: "A numerical rating of the event's significance (e.g., 1-10)." },
                    impacts: { type: 'array', items: { type: 'string' }, description: "The consequences or effects of the event." },
                    predecessors: { type: 'array', items: { type: 'string' }, description: "IDs of events that directly preceded this one." },
                    successors: { type: 'array', items: { type: 'string' }, description: "IDs of events that directly followed this one." },
                }
            }
        },
        temporalClusters: {
            type: 'array',
            description: "Groups of events that are clustered together in time.",
            items: {
                type: 'object',
                properties: {
                    period: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' } }, description: "The start and end of the cluster's timeframe." },
                    events: { type: 'array', items: { type: 'string' }, description: "IDs of events within this cluster." },
                    theme: { type: 'string', description: "The common theme or topic of the events in the cluster." },
                    intensity: { type: 'number', description: "A numerical rating of the cluster's intensity or activity level." },
                    trigger: { type: 'string', description: "The likely trigger or cause of this cluster of events." },
                    significance: { type: 'string', description: "The overall significance of this cluster to the case." },
                }
            }
        },
        patterns: {
            type: 'array',
            description: "Identified recurring patterns or cycles in the data.",
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', description: "The type of pattern (e.g., 'seasonal', 'escalating')." },
                    description: { type: 'string', description: "A description of the pattern." },
                    interval: { type: 'string', description: "The typical interval or frequency of the pattern." },
                    examples: { type: 'array', items: { type: 'string' }, description: "IDs of events that are examples of this pattern." },
                    predictivePower: { type: 'number', description: "A confidence score (0-1) in the pattern's ability to predict future events." },
                    nextExpected: { type: 'string', description: "A prediction for when the next event in the pattern might occur." },
                }
            }
        },
        causalChains: {
            type: 'array',
            description: "Sequences of events linked by cause and effect.",
            items: {
                type: 'object',
                properties: {
                    trigger: { type: 'string', description: "The initial event ID that started the chain." },
                    consequences: {
                        type: 'array',
                        description: "The sequence of events that followed the trigger.",
                        items: {
                            type: 'object',
                            properties: {
                                eventId: { type: 'string', description: "The ID of the resulting event." },
                                delay: { type: 'string', description: "The time delay from the previous event in the chain." },
                                probability: { type: 'number', description: "The assessed probability (0-1) of this consequence occurring." },
                                strengtheningFactors: { type: 'array', items: { type: 'string' }, description: "Factors that amplified or enabled this link in the chain." },
                            }
                        }
                    },
                    chainLength: { type: 'number', description: "The number of events in the chain." },
                    totalImpact: { type: 'string', description: "A summary of the overall impact of this causal chain." },
                }
            }
        },
        temporalAnomalies: {
            type: 'array',
            description: "Events or gaps that deviate from expected patterns.",
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', description: "The type of anomaly (e.g., 'unexpected_event', 'missing_event', 'unusual_timing')." },
                    description: { type: 'string', description: "A description of the anomaly." },
                    events: { type: 'array', items: { type: 'string' }, description: "IDs of the events associated with the anomaly." },
                    possibleExplanations: { type: 'array', items: { type: 'string' }, description: "Potential reasons for the anomaly." },
                    recommendedInvestigation: { type: 'string', description: "Suggested steps to investigate this anomaly further." },
                }
            }
        },
    },
    required: ["timeframe", "chronology", "temporalClusters", "patterns", "causalChains", "temporalAnomalies"]
  };

  /**
   * Performs a comprehensive temporal analysis on a given set of time-based data.
   * @param {any} temporalData - The data to be analyzed, expected to contain time-series information.
   * @param {string} [timeframe='full'] - The timeframe for the analysis (e.g., 'full', 'last_year').
   * @param {string} [temporalFocus='comprehensive'] - The desired focus of the analysis (e.g., 'comprehensive', 'patterns_only').
   * @returns {Promise<TemporalAnalysisResult>} A promise that resolves with the structured temporal analysis result.
   * @throws {Error} If the temporal analysis fails.
   */
  static async analyzeTemporalPatterns(
    temporalData: any,
    timeframe: string = 'full',
    temporalFocus: string = 'comprehensive'
  ): Promise<TemporalAnalysisResult> {
    // The prompt is in German, as requested by the original user.
    // An English translation is provided in comments for clarity.
    const prompt = `
You are an expert in temporal analysis and recognize complex time-based patterns in data.

Perform a comprehensive temporal analysis:
1. CHRONOLOGICAL SEQUENCES: Arrange events in logical sequences.
2. TEMPORAL CLUSTERS: Identify concentrations of events.
3. PERIODIC PATTERNS: Identify recurring cycles.
4. ACCELERATION/DECELERATION: Detect changes in tempo.
5. CAUSAL TIME CHAINS: Understand cause-and-effect delays.

Time Data: ${JSON.stringify(temporalData, null, 2)}
Analysis Period: ${timeframe}
Focus: ${temporalFocus}
  `;

    try {
      const settings: AISettings = { temperature: 0.5, topP: 0.95 };
      // The original schema uses German keys. We must map the English keys from our documented schema
      // back to the German keys expected by the AI prompt's context, or alternatively, update the
      // AI prompt to expect English keys. For now, we assume the AI can handle the schema despite
      // the key name mismatch, but this is a point of potential failure.
      // A better solution would be to align the keys in the prompt and the schema.
      return await StructuredAIService.callAIWithSchema<TemporalAnalysisResult>(
          prompt,
          this.TEMPORAL_ANALYSIS_SCHEMA,
          settings
      );
    } catch (error) {
      console.error('Temporal analysis failed:', error);
      throw new Error(`Temporal analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
