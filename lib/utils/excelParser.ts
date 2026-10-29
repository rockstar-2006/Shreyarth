import { StudentRecord } from '@/types';

/**
 * Dynamically loads the SheetJS library from a trusted CDN if not already present on window
 */
export async function loadSheetJS(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).XLSX) {
    return (window as any).XLSX;
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('sheetjs-cdn');
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).XLSX));
      return;
    }

    const script = document.createElement('script');
    script.id = 'sheetjs-cdn';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX);
      } else {
        reject(new Error('SheetJS loaded but XLSX object not found on window.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load SheetJS from CDN.'));
    document.head.appendChild(script);
  });
}

/**
 * Normalizes column header keys to handle slight spelling variations or spacing
 */
function normalizeHeader(key: string): string {
  const clean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('slno') || clean.includes('sno') || clean === 'sl') return 'slNo';
  if (clean.includes('student') || clean.includes('name')) return 'studentName';
  if (clean.includes('usn') || clean.includes('roll') || clean.includes('regno')) return 'usn';
  if (clean.includes('mobile') || clean.includes('phone') || clean.includes('contact')) return 'mobileNo';
  if (clean.includes('caste') || clean.includes('category')) return 'caste';
  if (clean.includes('income')) return 'income';
  if (
    clean.includes('scholarship') || 
    clean.includes('previous') || 
    clean.includes('lastyear') || 
    clean.includes('received')
  ) {
    return 'scholarshipsReceived';
  }
  if (clean.includes('remark') || clean.includes('note') || clean.includes('comment')) return 'remarks';
  return key;
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV file into typed StudentRecord objects
 */
export async function parseStudentExcelFile(file: File): Promise<Omit<StudentRecord, 'id' | 'createdAt'>[]> {
  const XLSX = await loadSheetJS();
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  // Get the first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with raw header rows
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const parsedStudents: Omit<StudentRecord, 'id' | 'createdAt'>[] = [];

  rawRows.forEach((row, index) => {
    // Map normalized fields
    const mapped: Record<string, any> = {};
    Object.keys(row).forEach((header) => {
      const normalizedKey = normalizeHeader(header);
      mapped[normalizedKey] = String(row[header] ?? '').trim();
    });

    const studentName = mapped.studentName || '';
    const usn = mapped.usn || '';

    // Ignore completely empty rows
    if (!studentName && !usn) return;

    // Parse income
    const rawIncome = String(mapped.income || '0').replace(/[^0-9.]/g, '');
    const numIncome = parseFloat(rawIncome) || 0;

    // Parse previous scholarship field:
    // User requested: "if it is empty they didn't receive okay"
    const rawPrevScholarship = mapped.scholarshipsReceived || '';
    const isNone = 
      !rawPrevScholarship || 
      rawPrevScholarship.toLowerCase() === 'nil' || 
      rawPrevScholarship.toLowerCase() === 'no' || 
      rawPrevScholarship.toLowerCase() === 'none' ||
      rawPrevScholarship.toLowerCase() === 'na' ||
      rawPrevScholarship.toLowerCase() === 'n/a' ||
      rawPrevScholarship === '-' ||
      rawPrevScholarship === '—';

    const scholarshipsReceivedPreviousYear = isNone ? 'None (Not Received)' : rawPrevScholarship;
    const hasReceivedPreviousYear = !isNone;

    parsedStudents.push({
      slNo: mapped.slNo || index + 1,
      studentName: studentName || 'Unnamed Student',
      usn: usn.toUpperCase() || `SMV${String(index + 1).padStart(3, '0')}`,
      mobileNo: mapped.mobileNo || '—',
      caste: mapped.caste || 'General',
      income: numIncome,
      incomeRaw: mapped.income || String(numIncome),
      scholarshipsReceivedPreviousYear,
      hasReceivedPreviousYear,
      remarks: mapped.remarks || '—',
    });
  });

  return parsedStudents;
}

/**
 * Downloads a sample pre-formatted Excel template matching the user's exact columns
 */
export async function downloadSampleTemplate(): Promise<void> {
  const XLSX = await loadSheetJS();
  
  const sampleData = [
    {
      'Sl.No.': 1,
      'Name of the Student': 'Rahul S. Hegde',
      'USN': '4MW21CS045',
      'Mobile No.': '9845123456',
      'Caste': 'General (Brahmin)',
      'Income': 180000,
      'Scholarships Received last previous year': '', // Empty means didn't receive
      'Remarks': 'Merit applicant with 9.2 CGPA',
    },
    {
      'Sl.No.': 2,
      'Name of the Student': 'Ananya Rao',
      'USN': '4MW21EC012',
      'Mobile No.': '9741098765',
      'Caste': 'OBC (Cat-2A)',
      'Income': 120000,
      'Scholarships Received last previous year': 'SSP Post-Matric (₹15,000)',
      'Remarks': 'Annual renewal candidate',
    },
    {
      'Sl.No.': 3,
      'Name of the Student': 'Karthik Poojary',
      'USN': '4MW22IS034',
      'Mobile No.': '9900112233',
      'Caste': 'OBC (Billava)',
      'Income': 95000,
      'Scholarships Received last previous year': '', // Empty
      'Remarks': 'Economically weaker applicant',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  XLSX.writeFile(workbook, 'SMVITM_Student_Database_Template.xlsx');
}

/**
 * Exports current database records to an Excel file
 */
export async function exportStudentsToExcel(records: StudentRecord[]): Promise<void> {
  const XLSX = await loadSheetJS();

  const formattedRows = records.map((r, i) => ({
    'Sl.No.': r.slNo || i + 1,
    'Name of the Student': r.studentName,
    'USN': r.usn,
    'Mobile No.': r.mobileNo,
    'Caste': r.caste,
    'Income': r.income,
    'Scholarships Received last previous year': r.hasReceivedPreviousYear ? r.scholarshipsReceivedPreviousYear : 'None',
    'Remarks': r.remarks || '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Registry');
  
  XLSX.writeFile(workbook, `SMVITM_Student_Registry_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Normalizes committee column headers
 */
function normalizeCommitteeHeader(key: string): string {
  const clean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('slno') || clean.includes('sno') || clean === 'sl') return 'slNo';
  if (clean.includes('name')) return 'name';
  if (clean.includes('designation') || clean.includes('dept') || clean.includes('department')) return 'designationDepartment';
  if (clean.includes('mail') || clean.includes('email')) return 'email';
  if (clean.includes('contact') || clean.includes('phone') || clean.includes('mobile')) return 'contactNumber';
  return key;
}

export interface ParsedCommitteeMember {
  slNo: number | string;
  name: string;
  designation: string;
  department: string;
  email: string;
  contactNumber: string;
}

/**
 * Parses a Committee Members Excel/CSV file with columns:
 * Sl No | Name | Designation/Department | Mail Id | Contact Number
 */
export async function parseCommitteeExcelFile(file: File): Promise<ParsedCommitteeMember[]> {
  const XLSX = await loadSheetJS();
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const parsedMembers: ParsedCommitteeMember[] = [];

  rawRows.forEach((row, index) => {
    const mapped: Record<string, any> = {};
    Object.keys(row).forEach((header) => {
      const normalizedKey = normalizeCommitteeHeader(header);
      mapped[normalizedKey] = String(row[header] ?? '').trim();
    });

    const name = mapped.name || '';
    const email = mapped.email || '';

    // Ignore completely empty rows
    if (!name && !email) return;

    // Split Designation and Department if combined (e.g. "Dean (Academic) / ECE")
    const rawDesigDept = mapped.designationDepartment || 'Committee Member';
    let designation = rawDesigDept;
    let department = 'General / Administration';

    if (rawDesigDept.includes('/') || rawDesigDept.includes(',')) {
      const parts = rawDesigDept.split(/[\/,]/).map((p: string) => p.trim());
      designation = parts[0] || rawDesigDept;
      department = parts[1] || 'SMVITM';
    }

    parsedMembers.push({
      slNo: mapped.slNo || index + 1,
      name,
      designation,
      department,
      email: email.toLowerCase(),
      contactNumber: mapped.contactNumber || '—',
    });
  });

  return parsedMembers;
}

/**
 * Downloads a sample Excel template for Committee Members with the exact columns requested:
 * Sl No | Name | Designation/Department | Mail Id | Contact Number
 */
export async function downloadCommitteeSampleTemplate(): Promise<void> {
  const XLSX = await loadSheetJS();

  const sampleCommittee = [
    {
      'Sl No': 1,
      'Name': 'Dr. Thirumaleshwara Bhat',
      'Designation/Department': 'Principal / Administration',
      'Mail Id': 'principal@smvitm.ac.in',
      'Contact Number': '9845123450',
    },
    {
      'Sl No': 2,
      'Name': 'Dr. Sudarshan Rao K.',
      'Designation/Department': 'Dean (Academic) / Mechanical',
      'Mail Id': 'dean.academic@smvitm.ac.in',
      'Contact Number': '9845123451',
    },
    {
      'Sl No': 3,
      'Name': 'Dr. Ravindra H. J.',
      'Designation/Department': 'IQAC Coordinator / Physics',
      'Mail Id': 'iqac@smvitm.ac.in',
      'Contact Number': '9845123452',
    },
    {
      'Sl No': 4,
      'Name': 'Dr. Vasudeva',
      'Designation/Department': 'HOD / Computer Science & Engg',
      'Mail Id': 'hod.cs@smvitm.ac.in',
      'Contact Number': '9845123453',
    },
    {
      'Sl No': 5,
      'Name': 'Mr. Rajesh Poojary',
      'Designation/Department': 'Student Welfare Officer (SWO) / ECE',
      'Mail Id': 'swo@smvitm.ac.in',
      'Contact Number': '9845123454',
    },
    {
      'Sl No': 6,
      'Name': 'Sri Rathnakumar',
      'Designation/Department': 'Management Representative / SSVMET',
      'Mail Id': 'trustee@sode-edu.in',
      'Contact Number': '9845123455',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleCommittee);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Committee Members');

  XLSX.writeFile(workbook, 'SMVITM_Committee_Members_Template.xlsx');
}

