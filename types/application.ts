import { Timestamp } from 'firebase/firestore';

export type ParentStatus = 
  | 'both_alive' 
  | 'single_mother' 
  | 'single_father' 
  | 'orphan' 
  | 'other';

export type BacklogStatus = 
  | 'all_cleared_first_attempt' 
  | 'past_cleared' 
  | 'active_1_2' 
  | 'active_3_plus';

export type ApplicationStatus = 'pending' | 'verified' | 'imported' | 'rejected';

export interface ScholarshipApplication {
  id?: string;
  applicationNumber: string; // e.g. "APP-2026-0042"
  
  // Basic Academic Info
  studentName: string;
  usn: string;
  semester: string;
  department: string;
  cgpa: number;
  
  // Previous Academics
  sslcPercentage: number;
  pucPercentage: number;
  backlogStatus: BacklogStatus;
  backlogDetails?: string;

  // Social & Community
  caste: string;
  isCustomCaste?: boolean;

  // Family Vulnerability & Background
  parentStatus: ParentStatus;
  fatherOccupation: string;
  motherOccupation: string;
  guardianName?: string;
  guardianOccupation?: string;
  annualIncome: number;
  siblingsTotal: number;
  siblingsStudying: number;

  // Previous Financial Aid
  prevScholarshipReceived: boolean;
  prevScholarshipDetails?: string;
  prevScholarshipAmount?: number;

  // Contact Details
  studentPhone: string;
  parentPhone: string;
  email: string;
  address: string;
  talukDistrict: string;

  // Supporting Documents
  documentsDriveLink?: string;

  // Personal Statement
  statementOfNeed: string;

  // Dynamic Admin Custom Fields answers: fieldId -> string | number | boolean
  customFields?: Record<string, string | number | boolean>;

  // Metadata
  status: ApplicationStatus;
  submittedAt: Timestamp;
  verifiedAt?: Timestamp | null;
  importedToStudentDb?: boolean;
  importedStudentRecordId?: string;
  adminNotes?: string;
}

export type CustomFieldType = 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'url';

export type FieldSection = 
  | 'academic' 
  | 'family' 
  | 'aid' 
  | 'contact' 
  | 'documents' 
  | 'custom';

export interface FormCustomField {
  id: string;
  label: string;
  description?: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[]; // for 'select' type
  placeholder?: string;
  order: number;
  section?: FieldSection;
  enabled?: boolean;
}

export interface FormFieldConfig {
  id: string;
  label: string;
  section: FieldSection;
  sectionTitle: string;
  type: CustomFieldType;
  required: boolean;
  enabled: boolean;
  canDelete?: boolean; // true for custom fields
  options?: string[];
  placeholder?: string;
  helpText?: string;
  order: number;
}

export interface ApplicationFormConfig {
  isOpen: boolean;
  academicYear: string; // e.g. "2026-27"
  title: string;
  description: string;
  closedMessage: string;
  allowedCastes: string[];
  fields?: FormFieldConfig[];
  customFields?: FormCustomField[];
  updatedAt?: Timestamp;
}
