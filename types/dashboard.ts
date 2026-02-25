
import { EsfEventRecord } from './esf';

export interface DashboardMetrics {
  // Ebene 1: Head-Up / KPIs
  hrdThreatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  avgPhantomIndex: number; // 0-100
  criticalOpenEvents: number;
  evidenceCompleteness: number; // 0-100%
  totalVictims: number;

  // Ebene 2: Charts & Analyse
  violationsOverTime: Array<{
    date: string; // ISO Date (YYYY-MM oder YYYY-WW)
    count: number;
    severityScore: number; // Summe der Violation Indices oder heuristischer Wert
  }>;
  
  radbruchDimensions: {
    d1: number; // Avg Explainability
    d2: number; // Avg Responsibility
    d3: number; // Avg Data Status
    d4: number; // Avg Right to Truth
  };

  topViolatedRights: Array<{
    rightName: string; // from ESF 153
    count: number;
  }>;

  geoHotspots: Array<{
    location: string; // GeoTerm
    lat?: number;     // Optional if geo-resolution service exists
    lng?: number;
    count: number;
    intensity: number; // Weighted by severity
  }>;
  
  // Ebene 3: Operativ
  recentEvents: EsfEventRecord[];
  
  dossierStatus: {
    draft: number;
    review: number;
    final: number;
  };
  
  openTasksCount: number;
}
