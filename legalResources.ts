
import { LegalSourceCard } from "./types";

export const LEGAL_SOURCE_CARDS: LegalSourceCard[] = [
    {
        id: "sherloc",
        title: "SHERLOC (UNODC)",
        description: "UNODC-Portal zu Gesetzgebung, Rechtsprechung und Behörden zu organisierter Kriminalität und Terrorismus.",
        mechanism: "UN_ORGANISED_CRIME",
        region: "GLOBAL",
        topics: ["organized_crime", "corruption", "terrorism", "trafficking"],
        baseUrl: "https://www.unodc.org/cld/st/home.html"
    },
    {
        id: "uhri",
        title: "UHRI (Universal Human Rights Index)",
        description: "Datenbank mit allen Empfehlungen von Vertragsorganen, Sonderverfahren und UPR; filterbar nach Land, Recht, Thema.",
        mechanism: "UN_TREATY_BODY", // Covers multiple, but this is primary
        region: "GLOBAL",
        topics: ["all", "recommendations", "observations"],
        baseUrl: "http://uhri.ohchr.org"
    },
    {
        id: "ohchr_search",
        title: "OHCHR Search Library",
        description: "Zentraler Suchzugang zu allen öffentlichen OHCHR-Dokumenten, Berichten, Resolutionen und Stellungnahmen.",
        mechanism: "UN_POLICY_LIBRARY",
        region: "GLOBAL",
        topics: ["jurisprudence", "guidance", "reports"],
        baseUrl: "https://searchlibrary.ohchr.org/?ln=en"
    },
    {
        id: "juris_db",
        title: "OHCHR Jurisprudence Database",
        description: "Zugang zur Rechtsprechung der UN-Vertragsorgane bei Individualbeschwerden.",
        mechanism: "UN_TREATY_BODY",
        region: "GLOBAL",
        topics: ["individual_complaints", "jurisprudence"],
        baseUrl: "http://juris.ohchr.org"
    },
    {
        id: "icrc_ihl_treaty",
        title: "ICRC IHL Treaties Database",
        description: "Umfassende Datenbank zu Verträgen des humanitären Völkerrechts (IHL) mit Ratifizierungsstatus.",
        mechanism: "IHL_TREATY",
        region: "GLOBAL",
        topics: ["armed_conflict", "geneva_conventions", "ihl"],
        baseUrl: "https://ihl-databases.icrc.org/en/ihl-treaties"
    },
    {
        id: "icrc_customary",
        title: "Customary IHL Database",
        description: "Datenbank zum gewohnheitsrechtlichen humanitären Völkerrecht mit Analyse staatlicher Praxis.",
        mechanism: "IHL_CUSTOMARY",
        region: "GLOBAL",
        topics: ["customary_law", "armed_conflict"],
        baseUrl: "https://ihl-databases.icrc.org/en/customary-ihl"
    },
    {
        id: "sphere_handbook",
        title: "Sphere Handbook",
        description: "Humanitäre Charta und Mindeststandards in der humanitären Hilfe.",
        mechanism: "HUMANITARIAN_STANDARD",
        region: "GLOBAL",
        topics: ["humanitarian_response", "displacement", "minimum_standards"],
        baseUrl: "https://spherestandards.org/handbook/"
    },
    {
        id: "huridocs_tools",
        title: "HURIDOCS Resources",
        description: "Leitfäden und Tools zur Dokumentation von Menschenrechtsverletzungen und Datenbankmanagement.",
        mechanism: "NGO_GUIDANCE",
        region: "GLOBAL",
        topics: ["documentation", "databases", "esf", "methodology"],
        baseUrl: "https://huridocs.org/resource-library/"
    },
    {
        id: "sp_comms_search",
        title: "SP Communications Search",
        description: "Datenbank der Mitteilungen der UN-Sonderverfahren an Regierungen und andere Akteure.",
        mechanism: "UN_SPECIAL_PROCEDURE",
        region: "GLOBAL",
        topics: ["communications", "allegation_letters", "urgent_appeals"],
        baseUrl: "https://spcommreports.ohchr.org"
    },
    {
        id: "african_commission",
        title: "ACHPR (African Commission)",
        description: "Afrikanische Kommission für Menschenrechte und Rechte der Völker.",
        mechanism: "REGIONAL_MECHANISM",
        region: "AFRICA",
        topics: ["regional_law", "human_rights", "peoples_rights"],
        baseUrl: "https://www.achpr.org/"
    },
    {
        id: "echr_hudoc",
        title: "HUDOC (EGMR)",
        description: "Rechtsprechungsdatenbank des Europäischen Gerichtshofs für Menschenrechte.",
        mechanism: "REGIONAL_MECHANISM",
        region: "EUROPE",
        topics: ["echr", "case_law"],
        baseUrl: "https://hudoc.echr.coe.int/"
    },
    {
        id: "iachr_cases",
        title: "IACHR (Inter-American Commission)",
        description: "Interamerikanische Menschenrechtskommission - Fälle und Petitionen.",
        mechanism: "REGIONAL_MECHANISM",
        region: "AMERICAS",
        topics: ["oas", "petitions", "precautionary_measures"],
        baseUrl: "https://www.oas.org/en/iachr/"
    }
];

// Legacy Export for contextUtils compatibility (simplified representation)
export const legalResources = {
    complaintMechanisms: {
        title: "Beschwerdemechanismen (Referenz)",
        description: "Siehe LegalBasisTab für detaillierte Quellen.",
        unMechanisms: { title: "UN-Mechanismen", options: [] },
        regionalMechanisms: { title: "Regionale Mechanismen", options: [] }
    },
    reportingGuides: {
        title: "Anleitungen (Referenz)",
        description: "Siehe LegalBasisTab.",
        shadowReportSteps: { title: "Schritte", steps: [] },
        factFindingChecklist: { title: "Checkliste", sources: [] }
    },
    unSpecialProcedures: {
        title: 'UN Sonderverfahren (Legacy)',
        description: 'Siehe HRDSupportTab für Submission Portal.',
        submissionInfo: [],
        submissionChannels: [],
        helpfulLinks: []
    }
};
