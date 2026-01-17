
import { RadbruchEvent, NormHierarchyResult } from '../types';

/**
 * Modul 1: Normen-Hierarchie-Validator (Art. 25 GG Engine)
 * 
 * Prüft die Konformität einer Maßnahme mit übergeordnetem Recht.
 * Hierarchie:
 * 1. Ius Cogens / Art. 1 GG (Menschenwürde) -> Verstoß führt zur Nichtigkeit (Void).
 * 2. Art. 25 GG (Völkergewohnheitsrecht) -> Geht Gesetzen vor.
 * 3. Ordre Public (Wesentliche Verfahrensgrundsätze) -> Darf nicht verletzt werden.
 * 
 * @param event Das zu prüfende Ereignis.
 * @returns Das Ergebnis der hierarchischen Prüfung.
 */
export function validateNormHierarchy(event: RadbruchEvent): NormHierarchyResult {
    let severity: "none" | "ordre_public" | "ius_cogens" = "none";
    const violatedLevels: Array<1 | 2 | 3> = [];
    let voidSuggested = false; // Radbruchsche "Unerträglichkeits"-Schwelle
    const notes: string[] = [];

    const summaryLower = event.summary.toLowerCase();
    const rightsLower = event.allegedRightsViolated.map(r => r.toLowerCase());
    
    // --- LEVEL 1: Ius Cogens & Art. 1 GG (Menschenwürde) ---
    // Absolute rote Linie. Kein Abwägungsmaterial.
    const dignityTerms = [
        "würde", "dignity", "art. 1 gg", 
        "folter", "torture", "unmenschlich", "degrading",
        "vernichtung", "existenzminimum", "aushungerung",
        "versklavung", "völkermord", "willkürherrschaft"
    ];

    const hasDignityViolation = 
        dignityTerms.some(t => summaryLower.includes(t)) ||
        rightsLower.some(r => dignityTerms.some(t => r.includes(t)));

    if (hasDignityViolation) {
        severity = "ius_cogens";
        violatedLevels.push(1);
        voidSuggested = true;
        notes.push("KRITISCH: Indizien für Verletzung des Ius Cogens / der Menschenwürde (Art. 1 GG). Nach Radbruchscher Formel ist der Akt als 'unerträgliches Unrecht' potenziell nichtig (ex tunc).");
    }

    // --- LEVEL 2: Art. 25 GG (Völkergewohnheitsrecht) ---
    // "Die allgemeinen Regeln des Völkerrechtes sind Bestandteil des Bundesrechtes. Sie gehen den Gesetzen vor."
    // Prüft, ob einfaches Recht (z.B. ZPO/StPO/VwVfG) gegen Völkerrecht ausgespielt wird.
    const customaryLawTerms = [
        "völkergewohnheitsrecht", "customary law", "allgemeine regeln", 
        "art. 25 gg", "völkerrecht", "international law",
        "fair trial", "faires verfahren" // Kernbestandteil des VGR
    ];

    const hasArt25Violation = 
        rightsLower.some(r => customaryLawTerms.some(t => r.includes(t))) ||
        (summaryLower.includes("völkerrecht") && summaryLower.includes("ignoriert"));

    if (hasArt25Violation) {
        violatedLevels.push(2);
        if (severity !== "ius_cogens") severity = "ius_cogens"; // Behandeln wir als hochkritisch
        notes.push("WARNUNG: Kollision mit Art. 25 GG. Völkergewohnheitsrecht wurde missachtet oder einfachem Gesetz untergeordnet.");
    }

    // --- LEVEL 3: Ordre Public (Wesentliche Verfahrensgrundsätze) ---
    // Verstöße gegen den "Kerngehalt" des Rechtsstaats, die das Ergebnis unanerkennbar machen.
    // Indikator: "Gehörsverweigerung" oder "Black Box".
    const isProcedurallyGross = 
        event.decisionOpacityLevel === 'black_box' || 
        event.decisionOpacityLevel === 'paper_only_no_hearing';

    if (isProcedurallyGross) {
        violatedLevels.push(3);
        if (severity === "none") severity = "ordre_public";
        
        if (event.decisionOpacityLevel === 'black_box') {
            notes.push("Verstoß gegen Ordre Public: 'Black Box'-Entscheidung ohne Begründung verletzt das Bestimmtheitsgebot.");
        } else {
            notes.push("Verstoß gegen Ordre Public: Entscheidung nur nach Aktenlage ohne rechtliches Gehör (Art. 103 GG).");
        }
    }

    // Fallback
    if (violatedLevels.length === 0) {
        notes.push("Keine offensichtlichen Verletzungen der Normenhierarchie (Art. 1/25 GG) erkannt.");
    }

    return {
        severity,
        violatedLevels,
        notes: notes.join(" "),
        voidSuggested
    };
}
