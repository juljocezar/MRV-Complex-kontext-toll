
export interface UNSubmission {
  id: string;
  caseId: string;
  status: "draft" | "submitted" | "acknowledged" | "rejected" | "response_received";
  createdAt: string;
  updatedAt: string;
  content: {
    [key: string]: any;
  };
  submissionHistory?: {
    date: string;
    action: string;
    notes?: string;
  }[];
}

export interface SubmissionTemplate {
  name: string;
  requiredFields: string[];
  optionalFields: string[];
}
