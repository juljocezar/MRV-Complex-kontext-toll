
/**
 * Represents a single submission to a UN Special Procedure.
 */
export interface UNSubmission {
  /** A unique identifier for the submission. */
  id: string;
  /** The ID of the case this submission belongs to. */
  caseId: string;
  /** The current status of the submission in the workflow. */
  status: "draft" | "submitted" | "acknowledged" | "rejected" | "response_received";
  /** An ISO 8601 timestamp of when the submission was created. */
  createdAt: string;
  /** An ISO 8601 timestamp of when the submission was last updated. */
  updatedAt: string;
  /** The content of the submission, as a flexible key-value object. */
  content: {
    [key: string]: any;
  };
  /** An optional log of actions taken regarding this submission. */
  submissionHistory?: {
    /** The date of the action. */
    date: string;
    /** A description of the action taken (e.g., "Submitted to OHCHR"). */
    action: string;
    /** Any relevant notes about the action. */
    notes?: string;
  }[];
}

/**
 * Defines the structure for a UN submission template.
 * @deprecated This interface appears to be unused. The structure in `constants/unProcedures.ts` is used instead.
 */
export interface SubmissionTemplate {
  /** The name of the template. */
  name: string;
  /** A list of fields required by the template. */
  requiredFields: string[];
  /** A list of optional fields for the template. */
  optionalFields: string[];
}
