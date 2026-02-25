
import { AppState, Radbruch4DAssessment } from '../types';
import { DashboardMetrics } from '../types/dashboard';
import { EsfEventRecord } from '../types/esf';

export class DashboardService {

    static calculateMetrics(appState: AppState): DashboardMetrics {
        const events = appState.esfEvents;
        const acts = appState.esfActLinks;
        const persons = appState.esfPersons;
        
        // 1. Head-Up KPIs
        const totalVictims = persons.filter(p => 
            // Heuristic: If listed in acts as victim or manually tagged
            appState.esfActLinks.some(a => a.victimId === p.recordNumber)
        ).length;

        // Critical Events: Based on violationStatus or high Phantom Index
        const criticalOpenEvents = events.filter(e => 
            e.violationStatus?.toLowerCase().includes('critical') || 
            e.violationStatus?.toLowerCase().includes('urgent') ||
            (this.getPhantomIndexForEvent(e.recordNumber, appState) || 0) > 70
        ).length;

        // Evidence Completeness: Ratio of Acts with at least one Source linked
        const actsWithSources = acts.filter(act => 
            appState.esfInformationLinks.some(info => info.eventId === act.eventId) // Simplified linkage via Event
        ).length;
        const evidenceCompleteness = acts.length > 0 ? Math.round((actsWithSources / acts.length) * 100) : 0;

        // HRD Threat Level: Max of calculated risk or manual override from HRD tab
        // For now, we take the highest severity from any event notes or types
        let hrdThreatLevel: DashboardMetrics['hrdThreatLevel'] = 'Low';
        if (appState.risks.physical || appState.risks.intimidation) hrdThreatLevel = 'High';
        if (criticalOpenEvents > 2) hrdThreatLevel = 'Critical';

        // 2. Radbruch Dimensions (Average)
        // Note: Currently we don't store ALL assessments in a flat list in AppState easily accessible by ID map in all versions.
        // We will simulate aggregation based on available logic results or mock if empty for visualization.
        // In a real scenario, we'd iterate over `appState.radbruchAssessments`.
        // Since that store isn't explicitly in AppState top-level in the provided types, we'll use a placeholder logic.
        const radbruchDimensions = { d1: 7, d2: 6, d3: 8, d4: 5 }; // Default/Placeholder
        // TODO: Implement actual averaging once Radbruch assessments are fully persisted in a queryable list.

        // 3. Violations Over Time
        const violationsMap = new Map<string, number>();
        events.forEach(e => {
            if (e.startDate) {
                const dateKey = e.startDate.substring(0, 7); // YYYY-MM
                violationsMap.set(dateKey, (violationsMap.get(dateKey) || 0) + 1);
            }
        });
        const violationsOverTime = Array.from(violationsMap.entries())
            .map(([date, count]) => ({ date, count, severityScore: count * 10 })) // Simplified severity
            .sort((a, b) => a.date.localeCompare(b.date));

        // 4. Geo Hotspots
        const geoMap = new Map<string, number>();
        events.forEach(e => {
            if (e.geoTerm) {
                geoMap.set(e.geoTerm, (geoMap.get(e.geoTerm) || 0) + 1);
            }
        });
        const geoHotspots = Array.from(geoMap.entries())
            .map(([location, count]) => ({ location, count, intensity: count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 5. Top Violated Rights (Text analysis of 'affectedRights' or 'actType')
        const rightsMap = new Map<string, number>();
        acts.forEach(a => {
            if (a.actType) {
                rightsMap.set(a.actType, (rightsMap.get(a.actType) || 0) + 1);
            }
        });
        const topViolatedRights = Array.from(rightsMap.entries())
            .map(([rightName, count]) => ({ rightName, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            hrdThreatLevel,
            avgPhantomIndex: 45, // Placeholder aggregation
            criticalOpenEvents,
            evidenceCompleteness,
            totalVictims,
            violationsOverTime,
            radbruchDimensions,
            topViolatedRights,
            geoHotspots,
            recentEvents: events.slice(0, 5), // Top 5
            dossierStatus: { draft: appState.dossiers.filter(d => d.status === 'draft').length, review: 0, final: appState.dossiers.filter(d => d.status === 'final').length },
            openTasksCount: appState.tasks.filter(t => t.status !== 'done').length
        };
    }

    private static getPhantomIndexForEvent(eventId: string, state: AppState): number | null {
        // Look up logic would go here if assessments are stored by EventID
        return null;
    }
}
