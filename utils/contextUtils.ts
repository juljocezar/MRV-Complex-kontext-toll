
import { AppState, CaseSummary, Risks } from '../types';

export const buildCaseContext = (appState: AppState): string => {
    const { caseContext, documents, caseEntities, knowledgeItems, timelineEvents, risks, kpis, caseSummary } = appState;
    const { caseDescription } = caseContext;

    let context = `**Fallbeschreibung:**\n${caseDescription || 'Keine Beschreibung verfügbar.'}\n\n`;

    if (documents.length > 0) {
        context += `**Zentrale Dokumente (${documents.length}):**\n`;
        documents.slice(0, 5).forEach(doc => {
            context += `- ${doc.name} (Typ: ${doc.workCategory || doc.mimeType}, Status: ${doc.classificationStatus})\n`;
        });
        context += '\n';
    }
    
    if (caseEntities.length > 0) {
        context += `**Bekannte Entitäten (${caseEntities.length}):**\n`;
        caseEntities.slice(0, 10).forEach(entity => {
            context += `- ${entity.name} (${entity.type}): ${entity.description}\n`;
        });
        context += '\n';
    }

    if (knowledgeItems.length > 0) {
        context += `**Top 5 Wissenseinträge:**\n`;
        knowledgeItems.slice(0, 5).forEach(item => {
            context += `- ${item.title}: ${item.summary}\n`;
        });
        context += '\n';
    }
    
    if (timelineEvents.length > 0) {
        context += `**Letzte 5 Chronologie-Ereignisse:**\n`;
        timelineEvents.slice(-5).reverse().forEach(event => {
            context += `- ${event.date}: ${event.title}\n`;
        });
        context += '\n';
    }

    const activeRisks = Object.entries(risks)
        .filter(([, isActive]) => isActive)
        .map(([risk]) => risk)
        .join(', ');
    
    if (activeRisks) {
        context += `**Aktive Risiken:** ${activeRisks}\n\n`;
    }

    if (caseSummary) {
        context += `**KI-Zusammenfassung:** ${caseSummary.summary}\n\n`;
    }

    return context;
};

/**
 * Erstellt einen spezialisierten Prompt für die HURIDOCS ESF Analyse mehrerer Dokumente.
 */
export function buildHumanRightsEsfPrompt(docs: Array<{
  id: string;
  title: string;
  text: string;
}>): string {
  const docBlocks = docs.map(d => `
[DOCUMENT]
ID: ${d.id}
TITLE: ${d.title}
TEXT:
${d.text}
`).join('\n\n');

  return `
Du bist ein forensischer Menschenrechts-Dokumentationsassistent.
Du arbeitest strikt nach den HURIDOCS Events Standard Formats (ESF) und der unten beschriebenen Standardvorlage.

AUFGABE:
1. Lies alle bereitgestellten Dokumente sorgfältig.
2. Identifiziere alle potentiellen Menschenrechtsverletzungen (z.B. Folter, willkürliche Inhaftierung, Diskriminierung, Verbrechen gegen die Menschlichkeit, Kriegsverbrechen, Zersetzung, Repressalien, Täuschung im Rechtsverkehr, Korruption, organisierte Kriminalität).
3. Erzeuge:
   a) Eine dokumentweise Übersicht der Hinweise auf Menschenrechtsverletzungen.
   b) Eine tabellarische Übersicht aller Verletzungen (Art der Verletzung, Datum, Ort, betroffene Personen/Gruppen, Quelle, Details).
   c) ESF-kompatible Strukturen für:
      - Ereignisse (Event-Format, Felder 101–116, 150)
      - Handlungen (Act-Format, relevante 2100er Felder)
      - Beteiligungen (Involvement-Format, relevante 2400er Felder)
      - Informationen (Informations-Format, relevante 2500er Felder)
      - Interventionen (Interventions-Format, relevante 2600er Felder)
      - Biografische Angaben (2300er Felder)
      - Ereignisketten (2200er Felder)

WICHTIGE REGELN:
- Verwende nur Informationen, die in den Dokumenttexten enthalten oder klar impliziert sind.
- Erfinde keine neuen Tatsachen, Daten, Orte oder Personen.
- Wenn ein Feld nicht belegt werden kann, lass es einfach weg oder setze eine kurze erklärende Bemerkung (z.B. "nicht im Text angegeben").
- Verwende neutrale, sachliche Sprache; keine Bewertungen über den Text hinaus.
- Gruppiere mehrere Handlungen im selben Ereignis sinnvoll (Events = "Was/Wo/Wann", Acts = konkrete Handlungen gegen konkrete Opfer).

GIB DAS ERGEBNIS AUSSCHLIESSLICH ALS JSON GEMÄSS DEM VORGEGEBENEN SCHEMA AUS.

DOKUMENTE:
${docBlocks}
`;
}
