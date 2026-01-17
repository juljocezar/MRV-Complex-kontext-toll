
import { LegislativeGenealogyResult, GenealogyFinding } from '../../types';

/**
 * Liste von Gesetzen, die bekanntermaßen in der NS-Zeit entstanden sind 
 * und deren Anwendung oder Genese kritisch hinterfragt werden muss.
 * (Auszug für forensische Zwecke)
 */
const CRITICAL_ORIGIN_LAWS: Record<string, string> = {
    "heilpraktikergesetz": "Ursprung 1939. Entstanden im Kontext der NS-Gesundheitspolitik zur Ausgrenzung jüdischer Ärzte.",
    "namensänderungsgesetz": "Ursprung 1938. Diente ursprünglich der rassistischen Markierung jüdischer Bürger.",
    "rechtsberatungsgesetz": "Ursprung 1935 (RBebrG). Diente der Verdrängung jüdischer Juristen (heute RDG, aber historische Wurzel relevant).",
    "gaststättengesetz": "Ursprung 1930er Jahre. Teile der Zuverlässigkeitsprüfung historisch belastet.",
    "blutschutzgesetz": "Nürnberger Gesetze (1935). Zitation deutet auf extreme verfassungsfeindliche Argumentation hin.",
    "reichsbürgergesetz": "Nürnberger Gesetze (1935). Zitation ist starkes Indiz für 'Reichsbürger'-Ideologie.",
    "gewerbeordnung": "Teile in den 1930ern novelliert (Führerprinzip in der Wirtschaft).",
    "ehegesetz": "Ursprung Kontrollratsgesetz Nr. 16 (1946), aber basierend auf Reformen von 1938."
};

const IDEOLOGY_KEYWORDS = [
    "rasse", "erbgesundheit", "volksschädling", "artfremd", "unwertes leben", 
    "gesundes volksempfinden", "zersetzer", "blutschutz", "arisch"
];

/**
 * Modul: Legislative Genealogy Audit
 * Prüft Gesetzesreferenzen auf ihre historische und ideologische Genese.
 * Fokus: Identifikation von NS-Recht (1933-1945) oder ideologisch kontaminiertem Vokabular.
 * 
 * @param referencedLaws Liste der im Text zitierten Gesetze oder Paragraphen.
 * @returns Ergebnis der Prüfung mit Details zu jedem Fund.
 */
export function runLegislativeGenealogyAudit(referencedLaws: string[]): LegislativeGenealogyResult {
    const findings: GenealogyFinding[] = [];
    let suspicious = false;

    // Hilfsfunktion: Prüft, ob ein Jahr im NS-Zeitraum liegt
    const isNSEra = (text: string) => {
        const yearMatch = text.match(/(193[3-9]|194[0-5])/);
        return !!yearMatch;
    };

    for (const law of referencedLaws) {
        const lowerLaw = law.toLowerCase();
        let finding: GenealogyFinding | null = null;

        // Check 1: Ideologische Schlüsselbegriffe (Rote Flagge)
        const foundKeyword = IDEOLOGY_KEYWORDS.find(kw => lowerLaw.includes(kw));
        if (foundKeyword) {
            finding = {
                lawId: law,
                originPeriod: "NS_ERA",
                cleanedUpConstitutionally: false,
                notes: `KRITISCH: Enthält NS-Vokabular ('${foundKeyword}'). Starke Indikation für verfassungsfeindliche Argumentation.`
            };
        }

        // Check 2: Bekannte NS-Gesetze (Kontinuitäten)
        else {
            const knownLawKey = Object.keys(CRITICAL_ORIGIN_LAWS).find(key => lowerLaw.includes(key));
            if (knownLawKey) {
                finding = {
                    lawId: law,
                    originPeriod: "NS_ERA",
                    cleanedUpConstitutionally: true, // Meist formal bereinigt, aber Ursprung relevant
                    notes: `Historische Belastung: ${CRITICAL_ORIGIN_LAWS[knownLawKey]}. Prüfen, ob Auslegung im Geiste des GG erfolgt.`
                };
            }
        }

        // Check 3: Zeitliche Verortung (Jahreszahlen 1933-1945)
        if (!finding && isNSEra(law)) {
            finding = {
                lawId: law,
                originPeriod: "NS_ERA",
                cleanedUpConstitutionally: null, // Unklar ohne weitere Analyse
                notes: "Gesetz oder Verordnung datiert explizit in den Zeitraum 1933-1945."
            };
        }

        if (finding) {
            findings.push(finding);
            suspicious = true;
        }
    }

    return {
        suspicious,
        findings
    };
}
