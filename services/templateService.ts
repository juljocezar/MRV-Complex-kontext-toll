// This service provides predefined templates for document generation.

export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    content: string; // The template content, can include placeholders like {{victim_name}}
}

export class TemplateService {
    private static templates: DocumentTemplate[] = [
        {
            id: 'international_criminal_complaint_v1',
            name: 'Internationale Strafanzeige (Vorlage)',
            description: 'Eine Vorlage für eine Strafanzeige bei internationalen Instanzen (z.B. IStGH-Anklagebehörde) gemäß Rom-Statut.',
            content: `
# ANZEIGE GEMÄSS ARTIKEL 15 DES RÖMISCHEN STATUTS

**AN:**
Die Anklagebehörde des Internationalen Strafgerichtshofs
Postfach 19519
2500 CM Den Haag
Niederlande

**DATUM:** {{current_date}}

**BETREFF: ANZEIGE VON VERBRECHEN IM ZUSTÄNDIGKEITSBEREICH DES GERICHTSHOFS**

---

## I. IDENTITÄT DES/DER ANZEIGESTELLERS/IN

- **Name:** [Ihr Name/Name Ihrer Organisation]
- **Kontakt:** [Ihre Kontaktdaten]
- **Beziehung zum Fall:** [z.B. Rechtsvertretung, NGO]

## II. IDENTITÄT DER OPFER

- **Name(n):** {{victim_name}}
- **Status:** [z.B. Zivilist, geschützte Person]
- **Demografische Daten:** [Alter, Geschlecht, Nationalität etc.]

## III. IDENTITÄT DER MUTMASSLICHEN TÄTER

- **Name(n):** {{perpetrator_name}}
- **Position/Rang:**
- **Organisation/Einheit:** [z.B. Militäreinheit, Regierungsorgan]
- **Befehlskette (falls bekannt):**

## IV. BESCHREIBUNG DER MUTMASSLICHEN VERBRECHEN

### A. Zeitlicher und örtlicher Rahmen
- **Zeitraum:** [Start- und Enddatum der Verbrechen]
- **Ort(e):** [Genaue Ortsangaben der Tatorte]

### B. Sachverhalt
[Beschreiben Sie hier detailliert, chronologisch und faktenbasiert die Ereignisse. Führen Sie alle bekannten Handlungen auf, die die Verbrechen darstellen.]

### C. Juristische Einordnung der Verbrechen
[Ordnen Sie die beschriebenen Taten den Verbrechen des Römischen Statuts zu.]

- **Völkermord (Artikel 6):** [Begründung, falls zutreffend]
- **Verbrechen gegen die Menschlichkeit (Artikel 7):** [Begründung, z.B. Mord, Folter, Verfolgung im Rahmen eines ausgedehnten oder systematischen Angriffs gegen eine Zivilbevölkerung]
- **Kriegsverbrechen (Artikel 8):** [Begründung, falls zutreffend]

## V. ZUSTÄNDIGKEIT DES GERICHTSHOFS (Jurisdiktion)

- **Territoriale Zuständigkeit:** [Die Taten fanden auf dem Gebiet des Vertragsstaates [Staat] statt.]
- **Personale Zuständigkeit:** [Die mutmaßlichen Täter sind Staatsangehörige des Vertragsstaates [Staat].]
- **Zeitliche Zuständigkeit:** [Die Taten fanden nach dem Inkrafttreten des Römischen Statuts für den betreffenden Staat statt.]

## VI. BEWEISMITTEL
[Listen Sie alle verfügbaren Beweismittel auf und referenzieren Sie diese.]
- Zeugenaussagen
- Dokumente (z.B. {{source_document_names}})
- Fotos/Videos
- Berichte

## VII. ABSCHLIESSENDE BEMERKUNGEN
[Fassen Sie kurz zusammen und bekräftigen Sie die Bitte um Einleitung einer Vorprüfung.]

Mit freundlichen Grüßen,

[Ihr Name/Name Ihrer Organisation]
`
        },
        {
            id: 'un_allegation_letter_v1',
            name: 'UN Allegation Letter (Vorlage)',
            description: 'Eine Standardvorlage für ein Anschuldigungsschreiben an UN-Sonderverfahren.',
            content: `
# ALLEGATION LETTER TO UN SPECIAL PROCEDURES

**DATE:** {{current_date}}

**TO:** [Name of relevant Special Procedure Mandate Holder(s)]
**VIA:** submissions@ohchr.org

**SUBJECT:** Allegation of human rights violations concerning {{victim_name}}

**1. INFORMATION ABOUT THE VICTIM(S):**
   - **Full Name:** {{victim_name}}
   - **Date of Birth:**
   - **Nationality:**
   - **Profession:**
   - **Place of Residence:**

**2. INFORMATION ABOUT THE ALLEGED PERPETRATOR(S):**
   - **Name/Unit:**
   - **State Affiliation:**
   - **Any identifying information:**

**3. DETAILED DESCRIPTION OF THE INCIDENT:**
   - **Date and Time:**
   - **Location:**
   - **Chronological account of events:**
     (Provide a clear, factual, and detailed description of the violation)

**4. EXHAUSTION OF DOMESTIC REMEDIES:**
   - **Steps taken:** (e.g., police reports, court filings)
   - **Outcome or status:**
   - **Reason if no steps were taken:** (e.g., ineffective, unavailable, dangerous)

**5. CONSENT:**
   - (State clearly that informed consent has been obtained from the victim or their family)
   - (Specify whether the victim's identity can be disclosed in public reports)

**6. SUBMITTED BY:**
   - **Name of Individual/Organization:**
   - **Contact Information:**

`
        },
        {
            id: 'case_summary_report_v1',
            name: 'Case Summary Report (Vorlage)',
            description: 'Eine Vorlage für einen internen zusammenfassenden Fallbericht.',
            content: `
# CASE SUMMARY REPORT

**CASE ID:** {{case_id}}
**DATE:** {{current_date}}

## 1. Executive Summary
(A brief overview of the case, key violations, and current status)

## 2. Key Actors
- **Victim(s):**
- **Perpetrator(s):**
- **Witnesses:**
- **Legal Representation:**

## 3. Chronology of Key Events
(A timeline of the most important events with dates)

## 4. Legal Analysis
- **Violated Rights:** (List specific articles from international treaties)
- **Applicable Laws:** (National and international)
- **Legal Status:** (e.g., investigation, trial, appeal)

## 5. Risk Assessment
- **Risks to Victim:**
- **Risks to Team/Organization:**
- **Evidence Integrity Risks:**

## 6. Recommended Next Steps
(List of concrete actions to be taken)
`
        },
        {
            id: 'formal_letter_de_v1',
            name: 'Formeller Brief (DE)',
            description: 'Eine Standardvorlage für formelle deutsche Korrespondenz.',
            content: `
[Ihr Vor- und Nachname]
[Ihre Straße und Hausnummer]
[Ihre PLZ und Ort]
[Ihre Telefonnummer]
[Ihre E-Mail-Adresse]

<br>
<br>

[Name des Empfängers/der Firma]
[ggf. Abteilung/Ansprechpartner]
[Straße und Hausnummer des Empfängers]
[PLZ und Ort des Empfängers]

<br>
<br>

<p align="right">[Ort], den {{current_date}}</p>

<br>
<br>

**Betreff: {{subject}}**

<br>
<br>

Sehr geehrte/r [Anrede],

[Hier den Brieftext einfügen. Gliedern Sie den Text in sinnvolle Absätze.]

[Absatz 1: Einleitung, Grund des Schreibens]

[Absatz 2: Hauptteil, detaillierte Ausführungen, Argumentation]

[Absatz 3: Schluss, Zusammenfassung, Bitte um Reaktion, etc.]

Mit freundlichen Grüßen

<br>
<br>
<br>

(Handschriftliche Unterschrift)

<br>

[Ihr Name in Druckbuchstaben]
`
        },
        {
            id: 'cedaw_communication_v1',
            name: 'CEDAW Communication (Vorlage)',
            description: 'Vorlage für eine individuelle Beschwerde beim Ausschuss zur Beseitigung der Diskriminierung der Frau (CEDAW).',
            content: `
# COMMUNICATION TO THE COMMITTEE ON THE ELIMINATION OF DISCRIMINATION AGAINST WOMEN (CEDAW)

**I. AUTHOR OF THE COMMUNICATION**
1. [Name of the lawyer or other person representing the victim]

**II. THE VICTIM(S)**
1. [Name or initials of the victim]
(And others if applicable)

**III. THE STATE PARTY CONCERNED**
[Name of the State]

**IV. VIOLATIONS OF THE CEDAW CONVENTION**

**A) THE FACTS**
[Provide a detailed, chronological account of all relevant facts.]
[Include facts relevant to the exhaustion of domestic remedies.]

**B) THE COMPLAINT**
[Summarize all violations of CEDAW in 1-2 paragraphs and the role of the State party in these violations.]

**a. Violation of Article [Article Number]**
[Quote relevant text of the article]
[Summarize in 1-10 paragraphs how the State party has violated this article.]

(Repeat for each violated article)

**C) THE REQUEST FOR RELIEF**
- **Regarding the victim:**
  The author(s) request the State to:
  [List the specific remedies sought for the victim.]

- **Regarding [victims in a similar situation] in the State party:**
  The author(s) request the State to take appropriate measures to:
  [List broader remedies sought on behalf of similarly situated victims.]

**V. EXHAUSTION OF DOMESTIC REMEDIES**
The author submits on behalf of [the victim(s)] that all relevant domestic remedies have been exhausted.
(Or explain why they were not effective, available, or have been unduly prolonged).

**VI. OTHER INTERNATIONAL PROCEDURES**
This matter has not been, and is not being, examined under another procedure of international investigation or settlement.

**VII. ANNEXES**
[List all documents attached in support of the communication.]

**VIII. DATE AND SIGNATURE**
`
        },
        {
            id: 'african_commission_shadow_report_v1',
            name: 'Schattenbericht Afrikanische Kommission (Vorlage)',
            description: 'Vorlage für einen Schattenbericht an die Afrikanische Kommission für Menschenrechte und die Rechte der Völker.',
            content: `
# SHADOW REPORT TO THE AFRICAN COMMISSION ON HUMAN AND PEOPLES' RIGHTS
## In Response to the [Number] Periodic Report of the Government of [Country]

**Submitted by:**
[Name of Organization]
[Description of Organization]

**Date of Submission:** {{current_date}}

## EXECUTIVE SUMMARY
[Summarize the human rights violations your report addresses and your key recommendations for the government.]

## II. The Government of [Country] has failed its human rights obligations related to [Theme]

### A. Theme 1: [Name of Theme 1]
1.  **Summary of Violations:** [Summarize the human rights violations related to Theme 1.]
2.  **Relevant Treaty Provisions:** [Describe the relevant treaty language and its relation to Theme 1.]
3.  **Procedural History:** [Summarize the procedural history for Theme 1. What has the government said on this issue during past reviews?]
4.  **Government's Current Position:** [Describe the government's current position on this issue as stated in its most recent state report.]
5.  **The Reality on the Ground:** [Describe the reality and explain why the government's position is inaccurate, incomplete, misleading or false. Include first-hand accounts and other documentation of the human rights situation on the ground.]

**Suggested Questions for the Delegation of the Government of [Country]:**
*   ...
*   ...

**Suggested Recommendations for the Government of [Country]:**
*   ...
*   ...

### B. Theme 2: [Name of Theme 2]
(Repeat structure from Theme 1)

## III. Conclusion
[Reiterate your main points and your most important recommendations.]
`
        },
        {
            id: 'internal_doc_analysis_v1',
            name: 'Interne Dokumenten-Analyse (Vorlage)',
            description: 'Standardvorlage zur internen Analyse von Dokumenten auf potenzielle Menschenrechtsverletzungen nach HURIDOC-Standards.',
            content: `
# Standard Format for the Analysis of Documents for Potential Human Rights Violations

**Objective:** Identification and documentation of human rights violations in the provided documents.

## 1. Document Review
*   **Document 1: [Title of Document]**
    *   **Indications of Human Rights Violations:**
    *   [Brief summary of the findings]

(Repeat for each document)

## 2. Extraction of all relevant information
| Type of Human Rights Violation | Date of Incident | Location of Incident | Affected Persons/Groups | Source of Information | Additional Details |
|----------------------------------|------------------|----------------------|-------------------------|-----------------------|--------------------|
|                                  |                  |                      |                         |                       |                    |
|                                  |                  |                      |                         |                       |                    |

## 3. Categorization according to HURIDOC Standards
*   **Categorized Information:**
    *   **Type of Human Rights Violation:** [e.g., Torture, Arbitrary Detention, Discrimination]
    *   **Summary of Categories:** [Analysis of the most frequent types of violations]

## 4. Findings and Concluding Report
*   **Identified Human Rights Violations:** [Summary of the most important findings]
*   **Recommendations for further steps:** [Recommendations for further investigation, documentation, or action]
`
        }
    ];

    static getAllTemplates(): DocumentTemplate[] {
        return this.templates;
    }

    static getTemplateById(id: string): DocumentTemplate | undefined {
        return this.templates.find(t => t.id === id);
    }
}
