
import { 
    RadbruchEvent, 
    Radbruch4DAssessment, 
    SystemicIssueCode, 
    UncacAuditResult, 
    UncacAuditFlag,
    ProfilingCheckResult,
    ProfilingIssue,
    DimensionAssessment,
    RadbruchLabel,
    NormHierarchyResult,
    ResponsibleActor,
    StigmaResult,
    LegislativeGenealogyResult,
    MedicalNeutralityResult,
    SphereAuditResult,
    SignalCodeResult,
    GenealogyFinding
} from '../types';

/**
 * Logic Engine for Radbruch 4D Assessment and Systemic Validation.
 * Encapsulates the core "validators" described in the architecture.
 */
export class RadbruchLogicService {

    // --- Validator 1: Norm Hierarchy (Art. 25 GG Engine) ---
    static runNormHierarchyValidator(event: RadbruchEvent): NormHierarchyResult {
        let severity: "none" | "ordre_public" | "ius_cogens" = "none";
        const violatedLevels: Array<1 | 2 | 3> = [];
        let voidSuggested = false;
        const notes = [];

        // Check Ius Cogens / Level 1 (Art. 1 GG, Human Dignity)
        const dignityTerms = ["würde", "dignity", "art. 1 gg", "folter", "torture", "unmenschlich"];
        const rightsViolated = event.allegedRightsViolated.map(r => r.toLowerCase());
        const summaryLower = event.summary.toLowerCase();

        if (rightsViolated.some(r => dignityTerms.some(t => r.includes(t)))) {
            severity = "ius_cogens";
            violatedLevels.push(1);
            voidSuggested = true;
            notes.push("Potenzielle Verletzung des Ius Cogens / Menschenwürde.");
        }

        // Check Ordre Public / Level 3
        if (event.decisionOpacityLevel === 'black_box' || event.decisionOpacityLevel === 'paper_only_no_hearing') {
            violatedLevels.push(3);
            if (severity === "none") severity = "ordre_public";
            notes.push("Verstoß gegen elementare Verfahrensgrundsätze (Ordre Public).");
        }

        return { severity, violatedLevels, notes: notes.join(" "), voidSuggested };
    }

    // --- Validator 2: Stigma Neutralizer (Anti-Stigma Protocol) ---
    static runStigmaNeutralizer(fullText: string): StigmaResult {
        const STIGMA_TERMS = ["reichsbürger", "querulant", "psychisch auffällig", "wahn", "verschwörung", "staatsleugner", "delegitimierer"];
        const lower = fullText.toLowerCase();
        const foundTerms = STIGMA_TERMS.filter(t => lower.includes(t));
        const gaslightingIndicators = foundTerms.length > 0;
        
        return {
            foundTerms,
            gaslightingIndicators,
            burdenOfProofShift: gaslightingIndicators, // Heuristic: Stigma often implies shifting burden of proof
            notes: gaslightingIndicators 
                ? `Stigmatisierende Labels erkannt (${foundTerms.join(', ')}); Hinweis auf strategische Ausgrenzung.` 
                : "Keine offensichtliche Stigmatisierung."
        };
    }

    // --- Validator 3: Legislative Genealogy (NS Laws) ---
    static runLegislativeGenealogyAudit(referencedLaws: string[]): LegislativeGenealogyResult {
        // Simplified Blacklist/Heuristics
        const NS_LAW_INDICATORS = ["1933", "1934", "1935", "1936", "1937", "1938", "1939", "1940", "1941", "1942", "1943", "1944", "1945", "erbgesundheit", "rasse", "heimtücke"];
        const findings: GenealogyFinding[] = [];

        referencedLaws.forEach(law => {
            const lowerLaw = law.toLowerCase();
            if (NS_LAW_INDICATORS.some(ind => lowerLaw.includes(ind))) {
                findings.push({
                    lawId: law,
                    originPeriod: "NS_ERA",
                    cleanedUpConstitutionally: false, // Assume false for heuristic
                    notes: "Gesetz oder Bezugnahme deutet auf Ursprung 1933-1945 hin."
                });
            }
        });

        return {
            suspicious: findings.length > 0,
            findings
        };
    }

    // --- Validator 4: Medical Neutrality Check ---
    static runMedicalNeutralityCheck(fullText: string): MedicalNeutralityResult {
        const MEDICAL_FORCE_TERMS = ["zwangsbegutachtung", "unterbringung", "psychiatrische einweisung", "zwangsmedikation", "fixierung"];
        const lower = fullText.toLowerCase();
        const hits = MEDICAL_FORCE_TERMS.filter(t => lower.includes(t));
        const violation = hits.length > 0;

        return {
            medicalContextDetected: hits.length > 0,
            coerciveElements: hits,
            neutralityViolation: violation,
            notes: violation 
                ? "Mögliche Verletzung medizinischer Neutralität / Angriff auf Gesundheitsversorgung." 
                : "Kein medizinischer Zwangskontext erkannt."
        };
    }

    // --- Validator 5: Sphere Minimum Standard Audit ---
    static runSphereMinimumStandardAudit(event: RadbruchEvent): SphereAuditResult {
        const affectedSectors: string[] = [];
        if (event.sphereRisks.lossOfHousing) affectedSectors.push("Shelter/Housing");
        if (event.sphereRisks.lossOfIncome) affectedSectors.push("Food Security/Livelihoods");
        if (event.sphereRisks.healthRisk) affectedSectors.push("Health");

        return {
            humanitarianMinimumViolated: affectedSectors.length > 0,
            affectedSectors,
            notes: affectedSectors.length > 0 
                ? `Existenzminimum in Sektoren ${affectedSectors.join(", ")} gefährdet.` 
                : "Keine unmittelbare Verletzung humanitärer Mindeststandards (Sphere)."
        };
    }

    // --- Validator 6: Responsible Actor (Piercing the Veil) ---
    static identifyResponsibleActor(event: RadbruchEvent): ResponsibleActor {
        if (event.isMachineGenerated) {
            return {
                name: "Algorithmisches System / Unbekannter Operator",
                role: "system_operator",
                machineGenerated: true,
                potentialPersonalLiability: ["Amtshaftung (§ 839 BGB)", "Organisationsverschulden"]
            };
        }
        
        if (event.signerName) {
            return {
                name: event.signerName,
                role: "signing_official",
                machineGenerated: false,
                potentialPersonalLiability: ["§ 839 BGB i.V.m. Art. 34 GG (Amtspflichtverletzung)", "§ 823 BGB (Unerlaubte Handlung bei Ultra Vires)", "§ 826 BGB (Sittenwidrige Schädigung)"]
            };
        }

        return {
            name: "Unbekannt (Phantom)",
            role: "unknown",
            machineGenerated: false,
            potentialPersonalLiability: ["Strukturelles Staatsversagen"]
        };
    }

    // --- Validator 7: Signal Code Comparator ---
    static compareSignals(officialSignal: string, summary: string): SignalCodeResult {
        // Simple heuristic: dissonance if official says "help/protect" but summary says "harm/coerce"
        const officialLower = officialSignal.toLowerCase();
        const summaryLower = summary.toLowerCase();
        
        const positiveTerms = ["schutz", "hilfe", "sicherheit", "ordnung", "wohl"];
        const negativeTerms = ["zwang", "schaden", "verlust", "angst", "gewalt", "willkür"];

        const officialPositive = positiveTerms.some(t => officialLower.includes(t));
        const summaryNegative = negativeTerms.some(t => summaryLower.includes(t));

        const dissonance = (officialPositive && summaryNegative) ? 0.9 : 0.1;

        return {
            officialSignal,
            forensicSignal: "Forensische Analyse deutet auf Zwang/Schaden hin.",
            dissonanceScore: dissonance,
            notes: dissonance > 0.5 
                ? "Hohe Dissonanz: Offizielle Darstellung widerspricht den forensischen Fakten (Gaslighting-Indikator)." 
                : "Signale sind weitgehend konsistent oder neutral."
        };
    }

    // --- Existing Legacy Validators ---

    static runUncacAudit(event: RadbruchEvent): UncacAuditResult {
        const flags: UncacAuditFlag[] = [];
        const jurisdictionLower = event.jurisdictionUnitId.toLowerCase();
        const isPrivateEntityActingPublicly = 
            jurisdictionLower.includes('gmbh') || 
            jurisdictionLower.includes('ag ') || 
            jurisdictionLower.includes('consulting') ||
            jurisdictionLower.includes('service');

        if (isPrivateEntityActingPublicly) {
            flags.push({
                code: "ISSUE_UNCAC_108E_GAP",
                severity: "high",
                rationale: "Private entity exercising public authority implies UNCAC Art. 108e gap (Privatrechtsflucht)."
            });
        }

        if (event.location.region?.includes('Niedersachsen') || event.location.region?.includes('Lower Saxony')) {
            flags.push({
                code: "ISSUE_NDS_SOG_EXPANSIVE_POWERS",
                severity: "medium",
                rationale: "Jurisdiction is Lower Saxony: Nds. SOG expansive powers may apply."
            });
        }

        if (event.decisionOpacityLevel === 'black_box' || event.decisionOpacityLevel === 'paper_only_no_hearing') {
             flags.push({
                code: "ISSUE_LOCAL_CULTURE_OF_SILENCE",
                severity: "high",
                rationale: "High opacity level indicates potential culture of silence."
            });
        }

        return {
            applicable: flags.length > 0,
            flags,
            overallRisk: flags.some(f => f.severity === 'high') ? 'severe' : flags.length > 0 ? 'elevated' : 'none'
        };
    }

    static runProfilingCheck(event: RadbruchEvent): ProfilingCheckResult {
        const issues: ProfilingIssue[] = [];

        if (event.usesAlgorithmicDecision) {
            if (event.decisionOpacityLevel === 'black_box') {
                issues.push({
                    dimension: "opaque_scoring",
                    severity: "high",
                    rationale: "Algorithmic decision making with black box opacity."
                });
            }
            const sensitiveKeywords = ['race', 'religion', 'ethnicity', 'political', 'health', 'genetic', 'biometric', 'religion', 'rasse', 'herkunft', 'gesundheit'];
            if (sensitiveKeywords.some(kw => event.summary.toLowerCase().includes(kw))) {
                 issues.push({
                    dimension: "protected_characteristics",
                    severity: "high",
                    rationale: "Context implies processing of protected characteristics."
                });
            }
        }

        return {
            profilingDetected: issues.length > 0,
            issues
        };
    }

    private static assessDimension(baseScore: number, penalties: number, notes: string[]): DimensionAssessment {
        const score = Math.max(0, Math.min(10, baseScore - penalties));
        let label: RadbruchLabel = 'ok';
        if (score < 4) label = 'critical';
        else if (score < 7) label = 'problematic';
        
        return { score, label, notes: notes.join('; ') };
    }

    /**
     * Core Logic: Radbruch 4D Assessment
     * Incorporates all advanced validators into the D1-D4 scoring.
     */
    static computeRadbruch4D(event: RadbruchEvent): Radbruch4DAssessment {
        // Run all validators
        const uncacResult = this.runUncacAudit(event);
        const profilingResult = this.runProfilingCheck(event);
        const normHierarchy = this.runNormHierarchyValidator(event);
        const stigmaAnalysis = this.runStigmaNeutralizer(event.summary);
        const medicalNeutrality = this.runMedicalNeutralityCheck(event.summary);
        const sphereAudit = this.runSphereMinimumStandardAudit(event);
        const responsibleActor = this.identifyResponsibleActor(event);
        const genealogyAudit = this.runLegislativeGenealogyAudit(event.referencedLaws);
        const signalComparison = this.compareSignals(event.officialSignal, event.summary);

        // --- Dimension 1: Explainability (Verständlichkeit/Transparenz) ---
        let d1Penalties = 0;
        const d1Notes = [];
        if (event.decisionOpacityLevel === 'partially_explained') { d1Penalties += 4; d1Notes.push("Partially explained"); }
        if (event.decisionOpacityLevel === 'black_box') { d1Penalties += 8; d1Notes.push("Black box decision"); }
        if (event.decisionOpacityLevel === 'paper_only_no_hearing') { d1Penalties += 5; d1Notes.push("Paper only, no hearing"); }
        if (event.usesAlgorithmicDecision && event.decisionOpacityLevel !== 'transparent') { d1Penalties += 1; d1Notes.push("Algorithmic component"); }
        if (signalComparison.dissonanceScore > 0.7) { d1Penalties += 3; d1Notes.push("Starke Dissonanz (Gaslighting)"); }
        
        const d1 = this.assessDimension(10, d1Penalties, d1Notes);

        // --- Dimension 2: Responsibility (Zurechenbarkeit) ---
        let d2Penalties = 0;
        const d2Notes = [];
        if (uncacResult.flags.some(f => f.code === 'ISSUE_UNCAC_108E_GAP')) { d2Penalties += 5; d2Notes.push("Potential Privatrechtsflucht"); }
        if (responsibleActor.role === 'unknown') { d2Penalties += 4; d2Notes.push("Kein greifbarer Verantwortlicher"); }
        if (responsibleActor.machineGenerated) { d2Penalties += 2; d2Notes.push("Maschinell erstellt"); }
        const d2 = this.assessDimension(10, d2Penalties, d2Notes);

        // --- Dimension 3: Data Status (Datenqualität/Validität) ---
        let d3Penalties = 0;
        const d3Notes = [];
        if (profilingResult.issues.some(i => i.dimension === 'opaque_scoring')) { d3Penalties += 4; d3Notes.push("Opaque scoring used"); }
        if (stigmaAnalysis.gaslightingIndicators) { d3Penalties += 3; d3Notes.push("Stigmatisierung verzerrt Fakten"); }
        const d3 = this.assessDimension(10, d3Penalties, d3Notes);

        // --- Dimension 4: Right to Truth (Wahrheitsrecht) ---
        let d4Penalties = 0;
        const d4Notes = [];
        if (d1.score < 5) { d4Penalties += 2; d4Notes.push("Intransparenz behindert Wahrheit"); }
        if (medicalNeutrality.neutralityViolation) { d4Penalties += 5; d4Notes.push("Medizinischer Zwang / Neutralitätsbruch"); }
        if (genealogyAudit.suspicious) { d4Penalties += 3; d4Notes.push("Bezugnahme auf NS-kontaminiertes Recht"); }
        if (normHierarchy.voidSuggested) { d4Penalties = 10; d4Notes.push("Nichtigkeit wegen Normenhierarchie-Verstoß (Art. 1 GG / Ius Cogens)"); }
        if (sphereAudit.humanitarianMinimumViolated) { d4Penalties += 4; d4Notes.push("Verstoß gegen humanitäre Mindeststandards"); }
        
        const d4 = this.assessDimension(10, d4Penalties, d4Notes);
        
        // --- Phantom Index Calculation ---
        const avgScore = (d1.score + d2.score + d3.score + d4.score) / 4;
        const phantomIndex = Math.round((10 - avgScore) * 10); 

        // Aggregated Issues
        const identifiedIssues: SystemicIssueCode[] = [
            ...uncacResult.flags.map(f => f.code),
            ...profilingResult.issues.length > 0 ? ['ISSUE_PROFILING_RISK' as SystemicIssueCode] : [],
            ...medicalNeutrality.neutralityViolation ? ['ISSUE_MEDICAL_NEUTRALITY_VIOLATION' as SystemicIssueCode] : [],
            ...genealogyAudit.suspicious ? ['ISSUE_LEGISLATIVE_GENEALOGY_SUSPECT' as SystemicIssueCode] : []
        ];

        const suggestedLegalActions: string[] = [];
        if (phantomIndex > 70) suggestedLegalActions.push("Verfassungsbeschwerde wegen strukturellem Staatsversagen");
        if (uncacResult.applicable) suggestedLegalActions.push("Dienstaufsichtsbeschwerde / Korruptionsanzeige");
        if (d1.score < 4) suggestedLegalActions.push("Akteneinsicht erzwingen / IFG-Anfrage");
        if (responsibleActor.potentialPersonalLiability.length > 0) suggestedLegalActions.push(`Persönliche Haftung geltend machen: ${responsibleActor.potentialPersonalLiability.join(", ")}`);
        if (normHierarchy.voidSuggested) suggestedLegalActions.push("Feststellungsklage auf Nichtigkeit (gem. § 44 VwVfG / Normenkontrolle)");

        return {
            eventId: event.eventId,
            assessmentDate: new Date().toISOString(),
            assessor: "System (Astraea Zero)",
            d1Explainability: d1,
            d2Responsibility: d2,
            d3DataStatus: d3,
            d4TruthRight: d4,
            overallPhantomIndex: phantomIndex,
            suggestedLegalActions,
            identifiedIssues,
            
            // Return extended analysis details
            normHierarchy,
            responsibleActor,
            stigmaAnalysis,
            genealogyAudit,
            medicalNeutrality,
            sphereAudit,
            signalComparison
        };
    }
}
