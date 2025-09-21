// Defines templates and checklists related to UN Special Procedures submissions.

/**
 * A collection of predefined templates for UN Special Procedures submissions.
 */
export const UN_SUBMISSION_TEMPLATES = [
  {
    id: 'urgent_appeal',
    name: 'Urgent Appeal',
    description: 'For cases involving an imminent risk to life, physical integrity, or other serious human rights violations.',
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
    name: 'Allegation Letter',
    description: 'For past human rights violations, to inform the government and request a response.',
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

/**
 * A standard checklist to be completed before dispatching a UN submission.
 */
export const UN_SUBMISSION_CHECKLIST = [
    { id: 'c1', text: 'Is the identity of the victim (full name, date of birth, etc.) clearly stated?', checked: false },
    { id: 'c2', text: 'Is informed consent from the victim/family available and documented?', checked: false },
    { id: 'c3', text: 'Has it been clarified whether the victim\'s name may be published?', checked: false },
    { id: 'c4', text: 'Is the identity of the alleged perpetrators (names, unit, etc.) described as accurately as possible?', checked: false },
    { id: 'c5', text: 'Are the date, location, and a detailed, chronological description of the incident included?', checked: false },
    { id: 'c6', text: 'Have domestic remedies been demonstrably exhausted, or has their ineffectiveness/unavailability been justified?', checked: false },
    { id: 'c7', text: 'Are the violated articles of international human rights norms (e.g., UDHR, ICCPR) named?', checked: false },
    { id: 'c8', text: 'Are all relevant evidentiary documents referenced and prepared as attachments?', checked: false },
];
