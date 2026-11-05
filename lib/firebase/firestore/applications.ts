import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config';
import { 
  ScholarshipApplication, 
  ApplicationFormConfig, 
  FormCustomField,
  FormFieldConfig
} from '@/types';
import { StudentRecord } from '@/types/studentRecord';

const CONFIG_DOC_PATH = ['system_settings', 'application_form_config'] as const;
const APPLICATIONS_COLLECTION = 'scholarship_applications';
const STUDENT_RECORDS_COLLECTION = 'student_records';

export const DEFAULT_CASTES: string[] = [
  'Brahmin',
  'Bunt / Nadava',
  'Billava / Poojary',
  'Devadiga',
  'Mogaveera',
  'Kulala / Kumbara',
  'GSB (Gowda Saraswatha Brahmin)',
  'Vishwakarma / Acharya',
  'Ganiga',
  'Madivala',
  'Maratha',
  'Vokkaliga',
  'Lingayat / Veerashaiva',
  'SC (Scheduled Caste)',
  'ST (Scheduled Tribe)',
  'Category-1',
  'Category-2A',
  'Category-2B',
  'Category-3A',
  'Category-3B',
  'General / GM',
  'Muslim',
  'Christian',
  'Jain',
];

export const DEFAULT_FORM_FIELDS: FormFieldConfig[] = [
  // ── 1. Academic & Student Identification ──
  {
    id: 'studentName',
    label: 'Full Name of the Student',
    section: 'academic',
    sectionTitle: '1. Student Identification & Academic Record',
    type: 'text',
    required: true,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. Bhushan Poojary',
    helpText: 'Official name as registered in VTU records',
    order: 1,
  },
  {
    id: 'usn',
    label: 'University Seat Number (USN)',
    section: 'academic',
    sectionTitle: '1. Student Identification & Academic Record',
    type: 'text',
    required: true,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. 4MW23AD026',
    helpText: 'VTU Seat number (auto uppercase)',
    order: 2,
  },
  {
    id: 'department',
    label: 'Branch / Department',
    section: 'academic',
    sectionTitle: '1. Student Identification & Academic Record',
    type: 'select',
    required: true,
    enabled: true,
    canDelete: false,
    options: [
      'Artificial Intelligence & Data Science (AI & DS)',
      'Computer Science & Engineering (CSE)',
      'Computer Science & Design (CSD)',
      'Electronics & Communication Engineering (ECE)',
      'Mechanical Engineering (ME)',
      'Civil Engineering (CV)',
      'Master of Business Administration (MBA)',
      'Master of Computer Applications (MCA)',
      'Basic Sciences / First Year',
    ],
    order: 3,
  },
  {
    id: 'semester',
    label: 'Current Semester',
    section: 'academic',
    sectionTitle: '1. Student Identification & Academic Record',
    type: 'select',
    required: true,
    enabled: true,
    canDelete: false,
    options: ['1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'],
    order: 4,
  },
  {
    id: 'cgpa',
    label: 'Current Engineering CGPA',
    section: 'academic',
    sectionTitle: '1. Student Identification & Academic Record',
    type: 'number',
    required: false,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. 8.45',
    helpText: 'Cumulative Grade Point Average up to latest declared results',
    order: 5,
  },
  {
    id: 'backlogStatus',
    label: 'Backlog History Status',
    section: 'academic',
    sectionTitle: '1. Student Identification & Academic Record',
    type: 'select',
    required: true,
    enabled: true,
    canDelete: false,
    options: [
      'All Cleared in 1st Attempt (No backlogs ever)',
      'Past Backlogs Cleared (Currently 0 active backlogs)',
      '1 to 2 Active Backlogs',
      '3 or More Active Backlogs',
    ],
    order: 6,
  },
  {
    id: 'sslcPercentage',
    label: '10th (SSLC) Percentage (%)',
    section: 'academic',
    sectionTitle: '1. Student Identification & Academic Record',
    type: 'number',
    required: false,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. 92.4',
    order: 7,
  },
  {
    id: 'pucPercentage',
    label: '12th (PUC / Diploma) Percentage (%)',
    section: 'academic',
    sectionTitle: '1. Student Identification & Academic Record',
    type: 'number',
    required: false,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. 88.0',
    order: 8,
  },

  // ── 2. Community & Family Care Structure ──
  {
    id: 'caste',
    label: 'Caste / Community Category',
    section: 'family',
    sectionTitle: '2. Community Category & Family Support Structure',
    type: 'select',
    required: true,
    enabled: true,
    canDelete: false,
    helpText: 'Used for endowment trust & community specific scholarships. Includes Other option.',
    order: 9,
  },
  {
    id: 'parentStatus',
    label: 'Family Living & Care Structure',
    section: 'family',
    sectionTitle: '2. Community Category & Family Support Structure',
    type: 'select',
    required: true,
    enabled: true,
    canDelete: false,
    options: [
      'Both Parents',
      'Single Parent (Mother)',
      'Single Parent (Father)',
      'Guardian / Relative Care',
    ],
    helpText: 'Controls dynamic occupation fields below',
    order: 10,
  },
  {
    id: 'fatherOccupation',
    label: "Father's Occupation",
    section: 'family',
    sectionTitle: '2. Community Category & Family Support Structure',
    type: 'text',
    required: true,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. Agriculture / Daily Wage / Transport / Self-employed / Service',
    helpText: 'Shown for Both Parents and Single Parent (Father)',
    order: 11,
  },
  {
    id: 'motherOccupation',
    label: "Mother's Occupation",
    section: 'family',
    sectionTitle: '2. Community Category & Family Support Structure',
    type: 'text',
    required: true,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. Homemaker / Self-employed / Agriculture / Daily Wage / Service',
    helpText: 'Shown for Both Parents and Single Parent (Mother)',
    order: 12,
  },
  {
    id: 'annualIncome',
    label: 'Annual Family Income (₹)',
    section: 'family',
    sectionTitle: '2. Community Category & Family Support Structure',
    type: 'number',
    required: true,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. 60000',
    helpText: 'Total gross annual household income in Indian Rupees',
    order: 13,
  },
  {
    id: 'siblingsTotal',
    label: 'Total Siblings (Brothers / Sisters)',
    section: 'family',
    sectionTitle: '2. Community Category & Family Support Structure',
    type: 'number',
    required: false,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. 1',
    order: 14,
  },
  {
    id: 'siblingsStudying',
    label: 'Siblings Currently Studying',
    section: 'family',
    sectionTitle: '2. Community Category & Family Support Structure',
    type: 'number',
    required: false,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. 1',
    order: 15,
  },

  // ── 3. Prior Financial Aid & Personal Statement ──
  {
    id: 'prevScholarship',
    label: 'Received Previous Scholarship?',
    section: 'aid',
    sectionTitle: '3. Prior Financial Aid & Personal Statement',
    type: 'boolean',
    required: true,
    enabled: true,
    canDelete: false,
    helpText: 'Disclose if student received SSP, Vidyasiri, Jindal, or other scholarship last year',
    order: 16,
  },
  {
    id: 'statementOfNeed',
    label: 'Personal Statement & Financial Need',
    section: 'aid',
    sectionTitle: '3. Prior Financial Aid & Personal Statement',
    type: 'textarea',
    required: true,
    enabled: true,
    canDelete: false,
    placeholder: 'Share your background, educational goals, and the financial assistance needed to support your studies...',
    helpText: 'Student statement explaining family circumstances and educational goals',
    order: 17,
  },

  // ── 4. Contact & Residential Details ──
  {
    id: 'studentPhone',
    label: 'Student Mobile Number (WhatsApp)',
    section: 'contact',
    sectionTitle: '4. Contact & Residential Details',
    type: 'text',
    required: true,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. 9845012345',
    order: 18,
  },
  {
    id: 'parentPhone',
    label: 'Parent / Guardian Mobile Number',
    section: 'contact',
    sectionTitle: '4. Contact & Residential Details',
    type: 'text',
    required: false,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. 9448012345',
    order: 19,
  },
  {
    id: 'email',
    label: 'Email Address',
    section: 'contact',
    sectionTitle: '4. Contact & Residential Details',
    type: 'text',
    required: true,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. student.cs@smvitm.ac.in',
    order: 20,
  },
  {
    id: 'talukDistrict',
    label: 'Taluk & District of Residence',
    section: 'contact',
    sectionTitle: '4. Contact & Residential Details',
    type: 'text',
    required: false,
    enabled: true,
    canDelete: false,
    placeholder: 'e.g. Karkala, Udupi',
    order: 21,
  },
  {
    id: 'address',
    label: 'Full Residential Address',
    section: 'contact',
    sectionTitle: '4. Contact & Residential Details',
    type: 'text',
    required: false,
    enabled: true,
    canDelete: false,
    placeholder: 'Door No, Street, Village/Town, Post, Pincode',
    order: 22,
  },

  // ── 5. Supporting Documents ──
  {
    id: 'documentsDriveLink',
    label: 'Supporting Documents Google Drive Folder Link',
    section: 'documents',
    sectionTitle: '5. Supporting Documents Soft Copies (Google Drive Folder Link)',
    type: 'url',
    required: true,
    enabled: true,
    canDelete: false,
    placeholder: 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID',
    helpText: 'Drive link containing soft copies of original marks cards, income/caste certificate, and ID',
    order: 23,
  },
];

const DEFAULT_CONFIG: ApplicationFormConfig = {
  isOpen: true,
  academicYear: '2026-27',
  title: 'SMVITM Institutional Scholarship Registration',
  description: 'Apply for institutional aid, SWB financial assistance, and endowed trust scholarships for the academic year 2026-27. No student login required.',
  closedMessage: 'Scholarship applications for the current cycle are now closed. For further assistance or urgent inquiries, please contact the Student Welfare Board (SWB) office.',
  allowedCastes: DEFAULT_CASTES,
  fields: DEFAULT_FORM_FIELDS,
  customFields: [],
};

// ── Form Configuration ────────────────────────────────────────────────────────

export async function getFormConfig(): Promise<ApplicationFormConfig> {
  try {
    const ref = doc(db, CONFIG_DOC_PATH[0], CONFIG_DOC_PATH[1]);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return DEFAULT_CONFIG;
    }
    const data = snap.data() as Partial<ApplicationFormConfig>;
    
    // Ensure all default castes exist even if config was partially saved
    const mergedCastes = Array.from(new Set([
      ...DEFAULT_CASTES,
      ...(data.allowedCastes || []),
    ]));

    // If saved fields exist, use them while ensuring any missing default fields are preserved
    let mergedFields = DEFAULT_FORM_FIELDS;
    if (data.fields && Array.isArray(data.fields) && data.fields.length > 0) {
      const savedMap = new Map(data.fields.map((f) => [f.id, f]));
      // Keep saved settings, and include any saved custom questions
      mergedFields = data.fields;

      // Ensure any core default fields not in saved config are appended
      DEFAULT_FORM_FIELDS.forEach((def) => {
        if (!savedMap.has(def.id)) {
          mergedFields.push(def);
        }
      });
    }

    return {
      isOpen: data.isOpen ?? true,
      academicYear: data.academicYear || DEFAULT_CONFIG.academicYear,
      title: data.title || DEFAULT_CONFIG.title,
      description: data.description || DEFAULT_CONFIG.description,
      closedMessage: data.closedMessage || DEFAULT_CONFIG.closedMessage,
      allowedCastes: mergedCastes,
      fields: mergedFields,
      customFields: data.customFields || [],
    };
  } catch (err) {
    console.error('Error getting form config:', err);
    return DEFAULT_CONFIG;
  }
}

export async function updateFormConfig(updates: Partial<ApplicationFormConfig>): Promise<void> {
  const ref = doc(db, CONFIG_DOC_PATH[0], CONFIG_DOC_PATH[1]);
  await setDoc(
    ref,
    {
      ...updates,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function addCustomCaste(newCaste: string): Promise<void> {
  const trimmed = newCaste.trim();
  if (!trimmed) return;
  const ref = doc(db, CONFIG_DOC_PATH[0], CONFIG_DOC_PATH[1]);
  await setDoc(
    ref,
    {
      allowedCastes: arrayUnion(trimmed),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ── Submissions ──────────────────────────────────────────────────────────────

export async function submitApplication(
  data: Omit<ScholarshipApplication, 'id' | 'applicationNumber' | 'status' | 'submittedAt'>
): Promise<{ id: string; applicationNumber: string }> {
  // If user selected "Other" and typed a custom caste, add it to the global list
  if (data.isCustomCaste && data.caste) {
    try {
      await addCustomCaste(data.caste);
    } catch (e) {
      console.warn('Could not save new custom caste to global config:', e);
    }
  }

  // Generate friendly application number: SMV-YYYY-XXXXX
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const applicationNumber = `SMV-${new Date().getFullYear()}-${randomSuffix}`;

  const colRef = collection(db, APPLICATIONS_COLLECTION);
  const docRef = doc(colRef);

  const payload: ScholarshipApplication = {
    ...data,
    id: docRef.id,
    applicationNumber,
    status: 'pending',
    submittedAt: Timestamp.now(),
  };

  await setDoc(docRef, payload);

  return { id: docRef.id, applicationNumber };
}

export async function listApplications(): Promise<ScholarshipApplication[]> {
  try {
    const colRef = collection(db, APPLICATIONS_COLLECTION);
    const q = query(colRef, orderBy('submittedAt', 'desc'));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data() as ScholarshipApplication;
      return {
        ...data,
        id: d.id,
      };
    });
  } catch (err) {
    console.error('Error listing applications:', err);
    // Fallback without orderBy in case index isn't built yet
    const colRef = collection(db, APPLICATIONS_COLLECTION);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({
      ...(d.data() as ScholarshipApplication),
      id: d.id,
    })).sort((a, b) => (b.submittedAt?.toMillis?.() ?? 0) - (a.submittedAt?.toMillis?.() ?? 0));
  }
}

export async function getApplication(id: string): Promise<ScholarshipApplication | null> {
  const ref = doc(db, APPLICATIONS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { ...(snap.data() as ScholarshipApplication), id: snap.id };
}

export async function updateApplicationStatus(
  id: string,
  status: ScholarshipApplication['status'],
  adminNotes?: string
): Promise<void> {
  const ref = doc(db, APPLICATIONS_COLLECTION, id);
  const updates: Record<string, any> = {
    status,
    verifiedAt: serverTimestamp(),
  };
  if (adminNotes !== undefined) {
    updates.adminNotes = adminNotes;
  }
  await updateDoc(ref, updates);
}

export async function deleteApplication(id: string): Promise<void> {
  const ref = doc(db, APPLICATIONS_COLLECTION, id);
  await deleteDoc(ref);
}

/**
 * 1-Click Import an approved applicant directly into the official Student Database (student_records).
 * This makes them immediately searchable and eligible to be nominated for any scholarship docket.
 */
export async function importApplicationToStudentDatabase(app: ScholarshipApplication): Promise<string> {
  const studentColRef = collection(db, STUDENT_RECORDS_COLLECTION);
  const newStudentDocRef = doc(studentColRef);

  const parentStatusLabel = 
    app.parentStatus === 'single_mother' ? 'Raised by Mother (Single Parent)' :
    app.parentStatus === 'single_father' ? 'Raised by Father (Single Parent)' :
    app.parentStatus === 'orphan' ? 'Under Guardian Care' : 'Both Parents';

  const remarks = [
    `Self-registered via Portal (${app.applicationNumber})`,
    `Family: ${parentStatusLabel} (Father: ${app.fatherOccupation || '—'}, Mother: ${app.motherOccupation || '—'})`,
    `Dept: ${app.department}, Sem: ${app.semester}, CGPA: ${app.cgpa}`,
    `SSLC: ${app.sslcPercentage}%, PUC: ${app.pucPercentage}%`,
    `Siblings: ${app.siblingsTotal} (${app.siblingsStudying} studying)`,
    app.documentsDriveLink ? `Drive: ${app.documentsDriveLink}` : '',
    app.statementOfNeed ? `Note: "${app.statementOfNeed.slice(0, 100)}..."` : '',
  ].filter(Boolean).join(' | ');

  const studentRecord: Omit<StudentRecord, 'id'> = {
    studentName: app.studentName.trim(),
    usn: app.usn.trim().toUpperCase(),
    mobileNo: app.studentPhone.trim(),
    caste: app.caste.trim(),
    income: Number(app.annualIncome) || 0,
    incomeRaw: `₹${Number(app.annualIncome).toLocaleString('en-IN')}`,
    scholarshipsReceivedPreviousYear: app.prevScholarshipReceived 
      ? (app.prevScholarshipDetails || 'Yes') 
      : 'None',
    hasReceivedPreviousYear: !!app.prevScholarshipReceived,
    remarks,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(newStudentDocRef, studentRecord);

  // Update application record
  const appRef = doc(db, APPLICATIONS_COLLECTION, app.id!);
  await updateDoc(appRef, {
    status: 'imported',
    importedToStudentDb: true,
    importedStudentRecordId: newStudentDocRef.id,
    adminNotes: `Imported to Student Database as record ${newStudentDocRef.id} on ${new Date().toLocaleDateString()}`,
  });

  return newStudentDocRef.id;
}
