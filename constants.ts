import type { AgentCapability } from './types';

/**
 * @interface AgentProfile
 * @decription Represents the profile of an AI agent.
 * @description Stellt das Profil eines KI-Agenten dar.
 * @property {string} name - The name of the agent. / Der Name des Agenten.
 * @property {string} role - The role of the agent. / Die Rolle des Agenten.
 * @property {string} description - A description of the agent's purpose. / Eine Beschreibung des Zwecks des Agenten.
 * @property {AgentCapability[]} capabilities - A list of capabilities the agent has. / Eine Liste der Fähigkeiten des Agenten.
 * @property {string} icon - An emoji representing the agent. / Ein Emoji, das den Agenten repräsentiert.
 * @property {string} systemPrompt - The system prompt that defines the agent's behavior. / Der System-Prompt, der das Verhalten des Agenten definiert.
 */
export interface AgentProfile {
    name: string;
    role: string;
    description: string;
    capabilities: AgentCapability[];
    icon: string; // emoji
    systemPrompt: string;
}

/**
 * @constant MRV_AGENTS
 * @description A dictionary of all available AI agents.
 * @description Ein Wörterbuch aller verfügbaren KI-Agenten.
 */
export const MRV_AGENTS: { [key: string]: AgentProfile } = {
    workloadAnalyst: {
        name: 'Workload Analyst',
        role: 'Der Ökonom & Projektmanager',
        description: 'Bewertet den quantitativen Aufwand eines Falles, schätzt Arbeitsaufwand und Kosten.',
        capabilities: ['workload_calculation', 'cost_analysis'],
        icon: '🗂️',
        systemPrompt: "Ich bin ein Experte für die Analyse von Arbeitsaufwand und Kosten im menschenrechtlichen Kontext, basierend auf deutschen Standards (RVG/JVEG)."
    },
    documentAnalyst: {
        name: 'Document Analyst',
        role: 'Der akribische Archivar & Ermittler',
        description: 'Extrahiert und systematisiert unstrukturierte Informationen aus Dokumenten in nutzbares Wissen.',
        capabilities: ['document_analysis', 'information_extraction', 'document_linking', 'un_submission_assistance'],
        icon: '📄',
        systemPrompt: "Ich bin ein Spezialist für die detaillierte Analyse von Dokumenten zur Extraktion von Fakten, Entitäten, Ereignissen und Beweismitteln."
    },
    legalExpert: {
        name: 'Legal Expert',
        role: 'Der KI-Jurist',
        description: 'Prüft Inhalte auf ihre rechtliche Relevanz, Kohärenz und identifiziert Widersprüche.',
        capabilities: ['legal_analysis', 'contradiction_detection', 'compliance_check'],
        icon: '⚖️',
        systemPrompt: "Ich bin ein KI-Jurist, spezialisiert auf Menschenrechte. Ich analysiere Dokumente auf rechtliche Relevanz und Widersprüche."
    },
    riskAnalyst: {
        name: 'Risk Analyst',
        role: 'Der Sicherheitsbeauftragte',
        description: 'Erkennt proaktiv Gefahren für alle Beteiligten und schlägt Strategien zu deren Abwehr vor.',
        capabilities: ['risk_assessment'],
        icon: '🛡️',
        systemPrompt: "Ich bin ein Sicherheitsexperte, der Risiken für Menschenrechtsverteidiger analysiert und Minderungsstrategien vorschlägt."
    },
    researchSpecialist: {
        name: 'Research Specialist',
        role: 'Der Synthese-Experte & Berichterstatter',
        description: 'Führt Informationen aus vielen verschiedenen Quellen zu einem kohärenten Ganzen zusammen.',
        capabilities: ['research', 'report_generation', 'case_analysis', 'kpi_suggestion'],
        icon: '🔬',
        systemPrompt: "Ich bin ein Recherche-Spezialist, der Informationen aus verschiedenen Quellen zusammenführt, um umfassende Berichte und Analysen zu erstellen."
    },
     ethicsAdvisor: {
        name: 'Ethics Advisor',
        role: 'Das moralische Gewissen',
        description: 'Analysiert Fälle auf übergeordnete ethische Muster und systemische Probleme.',
        capabilities: ['attrition_analysis'],
        icon: '🧐',
        systemPrompt: "Ich bin ein Ethikberater, der Fälle auf Zermürbungsstrategien, Machtmissbrauch und strukturelle Probleme analysiert."
    },
    contentCreator: {
        name: 'Content Creator',
        role: 'Der professionelle Autor',
        description: 'Verwandelt Fallkontext-Informationen in präzise, gut formulierte Schriftstücke.',
        capabilities: ['content_creation', 'official_documents', 'un_submission_finalization'],
        icon: '✍️',
        systemPrompt: "Ich bin ein Experte für die Erstellung präziser und wirkungsvoller Schriftstücke, von offiziellen Briefen bis zu UN-Einreichungen."
    },
    communicationExpert: {
        name: 'Communication Expert',
        role: 'Der Kommunikationsexperte',
        description: 'Erstellt Inhalte für die externe Kommunikation (Medien, Öffentlichkeit, Spender).',
        capabilities: ['public_communication'],
        icon: ' megaphone',
        systemPrompt: 'Ich bin ein Experter für strategische Kommunikation im Menschenrechtsbereich. Ich formuliere komplexe Sachverhalte zielgruppengerecht für Medien, Öffentlichkeit und Spender.'
    },
    strategyConsultant: {
        name: 'Strategy Consultant',
        role: 'Der strategische Vordenker',
        description: 'Entwickelt proaktiv nächste Schritte und langfristige Pläne über die reine Analyse hinaus.',
        capabilities: ['strategy_development'],
        icon: '♟️',
        systemPrompt: "Ich bin ein strategischer Berater, der basierend auf der Fallanalyse die nächsten Schritte und langfristige Strategien entwickelt."
    },
    processOptimizer: {
        name: 'Process Optimizer',
        role: 'Der Effizienz-Coach',
        description: 'Analysiert den aktuellen Stand der Fallbearbeitung und schlägt Optimierungen vor.',
        capabilities: ['task_suggestion'],
        icon: '🚀',
        systemPrompt: "Ich analysiere den aktuellen Fallstatus und schlage die nächsten logischen Schritte vor, um die Effizienz zu maximieren."
    }
};

/**
 * @constant DOCUMENT_TEMPLATES
 * @description A dictionary of document templates, categorized by their use case.
 * @description Ein Wörterbuch von Dokumentvorlagen, kategorisiert nach ihrem Anwendungsfall.
 */
export const DOCUMENT_TEMPLATES = {
    'HURIDOCS-Formate': [
        {
            title: 'Ereignis-Dokumentation (HURIDOCS)',
            description: 'Strukturierte Erfassung eines Vorfalls nach internationalen HURIDOCS-Standards.',
            content: `
# Ereignis-Dokumentation (HURIDOCS-Standard)

Fülle die folgende Tabelle basierend auf den Informationen aus dem Fallkontext aus.

| Feld-ID | Feld-Name | Information |
|---|---|---|
| 10 | Titel des Ereignisses | |
| 20 | Datum des Ereignisses | |
| 30 | Ort des Ereignisses | |
| 40 | Beschreibung des Ereignisses | |
| 50 | Beteiligte Opfer (Namen) | |
| 60 | Beteiligte Täter (Namen/Gruppen) | |
| 70 | Verletzte Menschenrechtsartikel | |
| 80 | Beweismittel (Dokumente, Zeugen) | |
`,
        },
    ],
    'Nationale Verfahren': [
        {
            title: 'Dienstaufsichtsbeschwerde',
            description: 'Formale Beschwerde gegen das Verhalten eines Amtsträgers.',
            content: `
# Dienstaufsichtsbeschwerde

**Absender:**
[Dein Name/Organisation]
[Deine Adresse]

**Empfänger:**
[Name der/des Dienstvorgesetzten]
[Behörde]
[Adresse der Behörde]

**Datum:** ${new Date().toLocaleDateString('de-DE')}

**Betreff: Dienstaufsichtsbeschwerde gegen [Name des/der Beamten/Beamtin], [Dienststelle]**

Sehr geehrte/r [Name der/des Dienstvorgesetzten],

hiermit erhebe ich Dienstaufsichtsbeschwerde gegen [Name des/der Beamten/Beamtin] wegen des folgenden Sachverhalts.

**1. Sachverhalt**
[Anweisung an die KI: Beschreibe hier präzise und chronologisch den Vorfall, der zur Beschwerde führt. Beziehe dich auf konkrete Daten, Orte und beteiligte Personen aus dem Fallkontext.]

**2. Rechtliche Würdigung**
[Anweisung an die KI: Lege dar, welche konkreten Dienstpflichtverletzungen (z.B. Untätigkeit, Willkür, Verstoß gegen Vorschriften) aus deiner Sicht vorliegen. Beziehe dich, wenn möglich, auf relevante Gesetze oder Verordnungen.]

**3. Antrag**
Ich beantrage:
1.  Die Prüfung des geschilderten Sachverhalts.
2.  Die Einleitung entsprechender dienstrechtlicher Maßnahmen.
3.  Eine schriftliche Mitteilung über das Ergebnis Ihrer Prüfung.

Mit freundlichen Grüßen,

[Dein Name/Organisation]
`,
        },
    ],
    'UN-Verfahren': [
        {
            title: 'UN Einreichung (Sonderverfahren)',
            description: 'Standardisierte Einreichung eines Falles an einen UN-Sonderberichterstatter.',
            content: `
# Einreichung an UN-Sonderverfahren

**AN:** [Name des zuständigen UN-Sonderberichterstatters]
**VON:** [Name deiner Organisation/dein Name]
**DATUM:** ${new Date().toLocaleDateString('de-DE')}
**BETREFF:** Individuelle Beschwerde betreffend [Name des Opfers/der Gruppe]

**I. INFORMATIONEN ZUM OPFER/ZU DEN OPFERN**
*   Name:
*   Geburtsdatum:
*   Nationalität:
*   Kontaktinformationen (falls Zustimmung vorliegt):

**II. INFORMATIONEN ZUM VORFALL**
*   Datum und Uhrzeit des Vorfalls:
*   Ort des Vorfalls:
*   Detaillierte Beschreibung des Vorfalls:
    [Anweisung an KI: Beschreibe den Vorfall detailliert basierend auf den Quelldokumenten.]

**III. INFORMATIONEN ZU DEN MUTMASSLICHEN TÄTERN**
*   Name/Einheit:
*   Staatliche oder nicht-staatliche Akteure:
*   Beschreibung ihrer Beteiligung:

**IV. ERSCHÖPFUNG NATIONALER RECHTSMITTEL**
*   Welche Schritte wurden unternommen? (Anzeigen, Gerichtsverfahren etc.):
*   Was war das Ergebnis dieser Schritte?:
*   Warum sind nationale Rechtsmittel nicht verfügbar, effektiv oder erschöpft?:

**V. ZUSTIMMUNG (CONSENT)**
*   Liegt die informierte Zustimmung des Opfers zur Einreichung dieses Falles vor? (Ja/Nein)
*   Stimmt das Opfer der Veröffentlichung seines Namens zu? (Ja/Nein)

**VI. GEWÜNSCHTE MASSNAHMEN**
[Anweisung an KI: Formuliere konkrete Forderungen an den Sonderberichterstatter, z.B. eine dringende Intervention (Urgent Appeal), eine offizielle Anfrage an die Regierung (Communication), eine Empfehlung in seinem nächsten Bericht.]
`,
        },
    ],
     'Interne Analyse & Berichte': [
        {
            title: 'Falldossier (Zusammenfassung)',
            description: 'Eine umfassende interne Zusammenfassung des gesamten Falles.',
            content: `
# Falldossier: [FALLNAME]

**Datum der Erstellung:** ${new Date().toLocaleDateString('de-DE')}

## 1. Fallzusammenfassung
[Anweisung an KI: Erstelle eine prägnante Zusammenfassung des gesamten Falles basierend auf der Fallbeschreibung und den wichtigsten Erkenntnissen.]

## 2. Hauptakteure
| Name | Rolle im Fall | Typ |
|---|---|---|
| [Name] | [Opfer, Täter, Zeuge...] | [Person, Organisation] |

## 3. Chronologie der Schlüsselereignisse
| Datum | Ereignis |
|---|---|
| [Datum] | [Beschreibung des Ereignisses] |

## 4. Aktueller Status & Nächste Schritte
[Anweisung an KI: Beschreibe den aktuellen Stand der Bearbeitung und liste die 3-5 wichtigsten nächsten Schritte auf.]
`
        },
    ],
    'Öffentlichkeitsarbeit': [
        {
            title: 'Pressemitteilung',
            description: 'Ein Entwurf für eine Pressemitteilung, um öffentliche Aufmerksamkeit zu erregen.',
            content: `
# PRESSEMITTEILUNG

**[TITEL DER PRESSEMITTEILUNG]**

**[STADT], ${new Date().toLocaleDateString('de-DE')}** – [Anweisung an KI: Beginne mit dem wichtigsten Satz, der den Kern der Nachricht zusammenfasst (Lead-Satz).]

[Anweisung an KI: Führe im zweiten Absatz die wichtigsten Details aus: Wer ist betroffen? Was ist passiert? Wo und wann fand es statt? Warum ist es eine Menschenrechtsverletzung?]

[Anweisung an KI: Füge ein Zitat von einem Sprecher deiner Organisation oder einem Betroffenen ein.]

[Anweisung an KI: Gib im letzten Absatz Hintergrundinformationen zu deiner Organisation und dem größeren Kontext des Falles.]

**Kontakt:**
[Name]
[Position]
[E-Mail]
[Telefon]
`,
        }
    ]
};