// Fix: Corrected import path.
import { GeminiService } from './geminiService';
// Fix: Corrected import path.
import type { TemporalAnalysisResult, AISettings } from '../types';

/**
 * @class TemporalAnalyzerService
 * @description A service for performing deep temporal analysis on case data to identify patterns, clusters, and causal relationships.
 */
export class TemporalAnalyzerService {
  /**
   * @private
   * @static
   * @readonly
   * @description A comprehensive JSON schema for guiding the AI to perform a detailed temporal analysis.
   * It structures the output into categories like chronological sequence, clusters, patterns, causal chains, and anomalies.
   */
  private static readonly TEMPORAL_ANALYSIS_SCHEMA = {
    type: 'object',
    properties: {
        zeitlicher_rahmen: {
            type: 'object',
            properties: {
                start: { type: 'string' },
                ende: { type: 'string' },
                dauer: { type: 'string' },
                ereignis_dichte: { type: 'string' },
            }
        },
        chronologie: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    zeitpunkt: { type: 'string' },
                    ereignis_id: { type: 'string' },
                    titel: { type: 'string' },
                    typ: { type: 'string' },
                    wichtigkeit: { type: 'number' },
                    auswirkungen: { type: 'array', items: { type: 'string' } },
                    vorgänger: { type: 'array', items: { type: 'string' } },
                    nachfolger: { type: 'array', items: { type: 'string' } },
                }
            }
        },
        zeitliche_cluster: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    zeitraum: { type: 'object', properties: { start: { type: 'string' }, ende: { type: 'string' } } },
                    ereignisse: { type: 'array', items: { type: 'string' } },
                    thema: { type: 'string' },
                    intensität: { type: 'number' },
                    auslöser: { type: 'string' },
                    bedeutung: { type: 'string' },
                }
            }
        },
        muster: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    typ: { type: 'string' },
                    beschreibung: { type: 'string' },
                    intervall: { type: 'string' },
                    beispiele: { type: 'array', items: { type: 'string' } },
                    vorhersagekraft: { type: 'number' },
                    nächste_erwartung: { type: 'string' },
                }
            }
        },
        kausale_ketten: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    auslöser: { type: 'string' },
                    folgen: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                ereignis_id: { type: 'string' },
                                verzögerung: { type: 'string' },
                                wahrscheinlichkeit: { type: 'number' },
                                verstärkende_faktoren: { type: 'array', items: { type: 'string' } },
                            }
                        }
                    },
                    ketten_länge: { type: 'number' },
                    gesamtauswirkung: { type: 'string' },
                }
            }
        },
        zeitliche_anomalien: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    typ: { type: 'string' },
                    beschreibung: { type: 'string' },
                    ereignisse: { type: 'array', items: { type: 'string' } },
                    mögliche_erklärungen: { type: 'array', items: { type: 'string' } },
                    empfohlene_untersuchung: { type: 'string' },
                }
            }
        },
    },
    required: ["zeitlicher_rahmen", "chronologie", "zeitliche_cluster", "muster", "kausale_ketten", "zeitliche_anomalien"]
  };

  /**
   * @static
   * @async
   * @function analyzeTemporalPatterns
   * @description Initiates a temporal analysis AI call with the provided data.
   * @param {any} temporalData - The data to be analyzed, typically a collection of events or timeline data.
   * @param {string} [timeframe='full'] - The timeframe for the analysis.
   * @param {string} [temporalFocus='comprehensive'] - The focus of the analysis (e.g., comprehensive, patterns).
   * @returns {Promise<TemporalAnalysisResult>} A promise that resolves to the structured temporal analysis result.
   * @throws {Error} If the AI call fails.
   */
  static async analyzeTemporalPatterns(
    temporalData: any,
    timeframe: string = 'full',
    temporalFocus: string = 'comprehensive'
  ): Promise<TemporalAnalysisResult> {
    const prompt = `
Du bist ein Experte für zeitliche Analyse und erkennst komplexe zeitbasierte Muster in Daten.

Führe eine umfassende zeitliche Analyse durch:
1. CHRONOLOGISCHE SEQUENZEN: Ordne Ereignisse in logische Abfolgen
2. ZEITLICHE CLUSTER: Erkenne Häufungen von Ereignissen
3. PERIODISCHE MUSTER: Identifiziere wiederkehrende Zyklen
4. BESCHLEUNIGUNG/VERLANGSAMUNG: Erkenne Änderungen im Tempo
5. KAUSALE ZEITKETTEN: Verstehe Ursache-Wirkung-Verzögerungen

Zeitdaten: ${JSON.stringify(temporalData, null, 2)}
Analysezeitraum: ${timeframe}
Fokus: ${temporalFocus}
  `;

    try {
// Fix: Added missing 'topP' property to match the AISettings type.
      const settings: AISettings = { temperature: 0.5, topP: 0.95 };
      return await GeminiService.callAIWithSchema<TemporalAnalysisResult>(
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