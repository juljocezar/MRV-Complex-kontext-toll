
/**
 * Defines the structure for an AI-generated risk assessment for a Human Rights Defender (HRD).
 */
export interface HRDRiskAssessment {
  /** The overall assessed risk level. */
  overallRiskLevel: "Low" | "Medium" | "High" | "Critical";
  /** A list of specific risks identified and their corresponding mitigation strategies. */
  identifiedRisks: {
    /** A description of the identified risk. */
    risk: string;
    /** A suggested strategy to mitigate the risk. */
    mitigation: string;
  }[];
  /** General recommendations for the HRD's safety. */
  recommendations: string;
}

/**
 * Defines the structure for an AI-generated secure communication plan.
 */
export interface SecureCommunicationPlan {
  /** A list of recommended secure applications for various purposes. */
  recommendedApps: {
    /** The name of the application. */
    name: string;
    /** The purpose of the application (e.g., "Secure Messaging", "Email"). */
    for: string;
  }[];
  /** A list of key best practices for secure communication. */
  bestPractices: string[];
}

/**
 * Defines the structure for an external resource for HRDs.
 */
export interface HRDResource {
  /** The name of the resource or organization. */
  name: string;
  /** A brief description of what the resource offers. */
  description: string;
  /** The URL to access the resource. */
  url: string;
  /** The category of support the resource provides. */
  category: "Emergency Support" | "Digital Security" | "Legal Aid" | "Well-being";
}
