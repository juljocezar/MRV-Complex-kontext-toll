
export interface HRDRiskAssessment {
  overallRiskLevel: "Low" | "Medium" | "High" | "Critical";
  identifiedRisks: {
    risk: string;
    mitigation: string;
  }[];
  recommendations: string;
}

export interface SecureCommunicationPlan {
  recommendedApps: {
    name: string;
    for: string;
  }[];
  bestPractices: string[];
}

export interface HRDResource {
  name: string;
  description: string;
  url: string;
  category: "Emergency Support" | "Digital Security" | "Legal Aid" | "Well-being";
}
