
import { ResponsibleActor } from '../types';

/**
 * Input structure derived from document metadata extraction.
 */
export interface ActorIdentificationInput {
    signerName?: string;
    machineNote?: string; // e.g. "Dieses Schreiben wurde maschinell erstellt..."
}

/**
 * Modul 3: Piercing the Veil
 * Identifiziert den verantwortlichen Akteur hinter einem Verwaltungsakt und ermittelt
 * potenzielle Haftungsgrundlagen (Persönliche Haftung vs. Amtshaftung/Organisationsverschulden).
 * 
 * @param input Metadata regarding the signer or generation method.
 * @returns A ResponsibleActor object with forensic liability assessment.
 */
export function identifyResponsibleActor(input: ActorIdentificationInput): ResponsibleActor {
    const { signerName, machineNote } = input;

    // 1. Check for Machine Generation (Algorithmische Herrschaft)
    // Indicated by specific phrases or lack of signature combined with a note.
    const isMachine = machineNote && (
        machineNote.toLowerCase().includes('maschinell erstellt') || 
        machineNote.toLowerCase().includes('ohne unterschrift gültig') ||
        machineNote.toLowerCase().includes('automatisch')
    );

    if (isMachine) {
        return {
            name: "Algorithmisches System / Unbekannter Operator",
            role: "system_operator",
            machineGenerated: true,
            potentialPersonalLiability: [
                "Amtshaftung (§ 839 BGB)",
                "Organisationsverschulden (Behördenleitung)",
                "Verstoß gegen Art. 22 DSGVO (Automatisierte Entscheidung)"
            ]
        };
    }

    // 2. Check for Human Signer (Persönliche Verantwortung)
    if (signerName && signerName.trim().length > 0) {
        return {
            name: signerName.trim(),
            role: "signing_official",
            machineGenerated: false,
            potentialPersonalLiability: [
                "§ 839 BGB i.V.m. Art. 34 GG (Amtspflichtverletzung)",
                "§ 823 BGB (Unerlaubte Handlung bei Ultra Vires)",
                "§ 826 BGB (Sittenwidrige Schädigung)",
                "Verletzung der Remonstrationspflicht (§ 63 BBG / § 36 BeamtStG)"
            ]
        };
    }

    // 3. Fallback: Phantom / Unknown (Strukturelles Versagen)
    return {
        name: "Unbekannt (Phantom)",
        role: "unknown",
        machineGenerated: false,
        potentialPersonalLiability: [
            "Strukturelles Staatsversagen",
            "Verstoß gegen Bestimmtheitsgebot und Transparenzpflichten",
            "Verletzung des Rechts auf den gesetzlichen Richter (Art. 101 GG)"
        ]
    };
}
