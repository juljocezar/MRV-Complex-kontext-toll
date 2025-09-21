// Defines templates and checklists related to UN Special Procedures submissions.

export const UN_SUBMISSION_TEMPLATES = [
  {
    id: 'urgent_appeal',
    name: 'Urgent Appeal (Dringlichkeitsappell)',
    description: 'Für Fälle, in denen eine unmittelbare Gefahr für Leben, körperliche Unversechtheit oder andere schwere Menschenrechtsverletzungen besteht.',
    content: `
# URGENT APPEAL TO UN SPECIAL PROCEDURES

**DATE:** {{current_date}}
**TO:** [Name of relevant Special Procedure Mandate Holder(s)]
**VIA:** urgent-action@ohchr.org

**SUBJECT: URGENT APPEAL concerning the imminent risk of human rights violations against {{victim_name}}**

**1. VICTIM(S) IDENTITY:**
   - **Full Name:** {{victim_name}}
   - **Date of Birth:**
   - **Details:** [Provide all relevant personal details]

**2. NATURE OF THE IMMINENT RISK:**
   - [Describe the immediate threat to life, physical integrity, or other grave violation.]
   - [Explain why the risk is imminent and requires urgent attention.]

**3. INCIDENT DESCRIPTION:**
   - [Provide a concise, chronological account of the events leading to the imminent risk.]

**4. ALLEGED PERPETRATOR(S):**
   - [Provide any known information about the individuals or groups responsible for the threat.]

**5. CONSENT & CONFIDENTIALITY:**
   - Informed consent has been obtained.
   - [State whether the victim's name can be disclosed.]

**6. ACTION REQUESTED:**
   - We urgently request your intervention to call upon the authorities of [Country] to take immediate measures to protect the victim.
`
  },
  {
    id: 'allegation_letter',
    name: 'Allegation Letter (Anschuldigungsschreiben)',
    description: 'Für bereits stattgefundene Menschenrechtsverletzungen, um die Regierung zu informieren und um eine Stellungnahme zu bitten.',
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
];

export const UN_SUBMISSION_CHECKLIST = [
    { id: 'c1', text: 'Identität des Opfers (vollständiger Name, Geburtsdatum etc.) klar dargelegt?', checked: false },
    { id: 'c2', text: 'Informierte Zustimmung (Consent) des Opfers/der Familie liegt vor und ist dokumentiert?', checked: false },
    { id: 'c3', text: 'Wurde geklärt, ob der Name des Opfers veröffentlicht werden darf?', checked: false },
    { id: 'c4', text: 'Identität der mutmaßlichen Täter (Namen, Einheit, etc.) so genau wie möglich beschrieben?', checked: false },
    { id: 'c5', text: 'Datum, Ort und eine detaillierte, chronologische Beschreibung des Vorfalls sind enthalten?', checked: false },
    { id: 'c6', text: 'Nationale Rechtsmittel wurden nachweislich ausgeschöpft oder ihre Ineffektivität/Nichtverfügbarkeit wurde begründet?', checked: false },
    { id: 'c7', text: 'Die verletzten Artikel internationaler Menschenrechtsnormen (z.B. AEMR, Zivilpakt) sind benannt?', checked: false },
    { id: 'c8', text: 'Alle relevanten Beweisdokumente sind referenziert und als Anhänge vorbereitet?', checked: false },
];
