'use client';

import { useState, useMemo, useRef } from 'react';
import { useStudentRecords } from '@/lib/hooks/useStudentRecords';
import { 
  saveStudentRecordsBulk, 
  addStudentRecord, 
  updateStudentRecord, 
  deleteStudentRecord, 
  clearAllStudentRecords 
} from '@/lib/firebase/firestore/students';
import { 
  parseStudentExcelFile, 
  downloadSampleTemplate, 
  exportStudentsToExcel 
} from '@/lib/utils/excelParser';
import { Spinner } from '@/components/ui/Spinner';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { 
  Upload, 
  Plus, 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  X, 
  FileSpreadsheet, 
  AlertCircle, 
  Phone, 
  Copy, 
  Check, 
  Sparkles,
  ArrowUpDown,
  GraduationCap,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { StudentRecord } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';

export default function StudentDatabasePage() {
  const { students, loading } = useStudentRecords();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [prevScholarshipFilter, setPrevScholarshipFilter] = useState<'all' | 'received' | 'none'>('all');
  const [casteFilter, setCasteFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'slNo' | 'name' | 'incomeAsc' | 'incomeDesc'>('slNo');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Upload processing state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<Omit<StudentRecord, 'id' | 'createdAt'>[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add Form State
  const [formSlNo, setFormSlNo] = useState('');
  const [formName, setFormName] = useState('');
  const [formUsn, setFormUsn] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formCaste, setFormCaste] = useState('');
  const [formIncome, setFormIncome] = useState('');
  const [formPrevReceived, setFormPrevReceived] = useState(false);
  const [formPrevDetails, setFormPrevDetails] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Copy USN feedback state
  const [copiedUsn, setCopiedUsn] = useState<string | null>(null);

  const handleCopyUsn = (usn: string) => {
    navigator.clipboard.writeText(usn);
    setCopiedUsn(usn);
    setTimeout(() => setCopiedUsn(null), 2000);
    toast.success(`Copied ${usn}`);
  };

  // Distinct castes from existing data
  const distinctCastes = useMemo(() => {
    const set = new Set(students.map((s) => s.caste).filter(Boolean));
    return Array.from(set);
  }, [students]);

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const receivedPrev = students.filter((s) => s.hasReceivedPreviousYear).length;
    const notReceived = total - receivedPrev;
    const lowIncome = students.filter((s) => s.income > 0 && s.income <= 250000).length;
    return { total, receivedPrev, notReceived, lowIncome };
  }, [students]);

  // Filtered & Sorted Student list
  const filteredStudents = useMemo(() => {
    let result = students.filter((s) => {
      // Previous scholarship filter
      if (prevScholarshipFilter === 'received' && !s.hasReceivedPreviousYear) return false;
      if (prevScholarshipFilter === 'none' && s.hasReceivedPreviousYear) return false;

      // Caste filter
      if (casteFilter !== 'all' && s.caste !== casteFilter) return false;

      // Search query (matches Name, USN, Caste, Mobile, or Remarks)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.studentName.toLowerCase().includes(q);
        const matchesUsn = s.usn.toLowerCase().includes(q);
        const matchesMobile = s.mobileNo.toLowerCase().includes(q);
        const matchesCaste = s.caste.toLowerCase().includes(q);
        const matchesRemarks = s.remarks?.toLowerCase().includes(q);
        const matchesPrev = s.scholarshipsReceivedPreviousYear?.toLowerCase().includes(q);
        if (!matchesName && !matchesUsn && !matchesMobile && !matchesCaste && !matchesRemarks && !matchesPrev) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name') return a.studentName.localeCompare(b.studentName);
      if (sortBy === 'incomeAsc') return a.income - b.income;
      if (sortBy === 'incomeDesc') return b.income - a.income;
      return (Number(a.slNo) || 0) - (Number(b.slNo) || 0);
    });

    return result;
  }, [students, prevScholarshipFilter, casteFilter, searchQuery, sortBy]);

  // Handle File Selection for Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setIsParsing(true);
    try {
      const parsed = await parseStudentExcelFile(file);
      if (parsed.length === 0) {
        toast.error('No valid student rows found in the uploaded file.');
        setUploadFile(null);
        setPreviewRows([]);
      } else {
        setPreviewRows(parsed);
        toast.success(`Detected ${parsed.length} student records from ${file.name}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to parse Excel file. Please ensure it has the correct columns.');
      setUploadFile(null);
      setPreviewRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Commit Previewed Excel Data to Firestore
  const handleSaveExcelToFirestore = async () => {
    if (previewRows.length === 0) return;
    setIsSaving(true);
    try {
      const result = await saveStudentRecordsBulk(previewRows);
      toast.success(`Successfully saved ${result.savedCount} student records to database!`);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setPreviewRows([]);
    } catch (err: any) {
      console.error(err);
      toast.error('Error saving records to database. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Manual Student Form Submit
  const handleManualFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsn.trim()) {
      toast.error('Student Name and USN are required.');
      return;
    }

    setIsFormSubmitting(true);
    try {
      const cleanIncome = parseFloat(formIncome.replace(/[^0-9.]/g, '')) || 0;
      const prevScholarshipText = formPrevReceived 
        ? (formPrevDetails.trim() || 'Received (Details not specified)') 
        : 'None (Not Received)';

      if (editingStudent) {
        // Update
        await updateStudentRecord(editingStudent.id, {
          slNo: formSlNo || editingStudent.slNo,
          studentName: formName.trim(),
          usn: formUsn.trim().toUpperCase(),
          mobileNo: formMobile.trim() || '—',
          caste: formCaste.trim() || 'General',
          income: cleanIncome,
          incomeRaw: formIncome,
          scholarshipsReceivedPreviousYear: prevScholarshipText,
          hasReceivedPreviousYear: formPrevReceived,
          remarks: formRemarks.trim() || '—',
        });
        toast.success('Student record updated successfully!');
      } else {
        // Add new
        await addStudentRecord({
          slNo: formSlNo || students.length + 1,
          studentName: formName.trim(),
          usn: formUsn.trim().toUpperCase(),
          mobileNo: formMobile.trim() || '—',
          caste: formCaste.trim() || 'General',
          income: cleanIncome,
          incomeRaw: formIncome,
          scholarshipsReceivedPreviousYear: prevScholarshipText,
          hasReceivedPreviousYear: formPrevReceived,
          remarks: formRemarks.trim() || '—',
        });
        toast.success('Student added to database!');
      }

      closeFormModal();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save student record.');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Open Edit Form
  const openEditModal = (student: StudentRecord) => {
    setEditingStudent(student);
    setFormSlNo(String(student.slNo || ''));
    setFormName(student.studentName);
    setFormUsn(student.usn);
    setFormMobile(student.mobileNo === '—' ? '' : student.mobileNo);
    setFormCaste(student.caste);
    setFormIncome(String(student.income || ''));
    setFormPrevReceived(student.hasReceivedPreviousYear);
    setFormPrevDetails(student.hasReceivedPreviousYear ? student.scholarshipsReceivedPreviousYear : '');
    setFormRemarks(student.remarks === '—' ? '' : student.remarks);
    setIsAddModalOpen(true);
  };

  // Reset & Close Manual Form
  const closeFormModal = () => {
    setIsAddModalOpen(false);
    setEditingStudent(null);
    setFormSlNo('');
    setFormName('');
    setFormUsn('');
    setFormMobile('');
    setFormCaste('');
    setFormIncome('');
    setFormPrevReceived(false);
    setFormPrevDetails('');
    setFormRemarks('');
  };

  // Delete Single Student
  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    try {
      await deleteStudentRecord(deletingStudent.id);
      toast.success(`Deleted record for ${deletingStudent.studentName}`);
      setDeletingStudent(null);
    } catch (err) {
      toast.error('Failed to delete student.');
    }
  };

  // Clear All Students
  const handleClearAllConfirm = async () => {
    try {
      await clearAllStudentRecords(students);
      toast.success('All student records cleared from database.');
      setIsClearAllModalOpen(false);
    } catch (err) {
      toast.error('Failed to clear database.');
    }
  };

  // Seed sample college records
  const handleSeedDemoRecords = async () => {
    const sampleRecords: Omit<StudentRecord, 'id' | 'createdAt'>[] = [
      {
        slNo: 1,
        studentName: 'Rahul S. Hegde',
        usn: '4MW21CS045',
        mobileNo: '9845123456',
        caste: 'General (Brahmin)',
        income: 180000,
        incomeRaw: '1,80,000',
        scholarshipsReceivedPreviousYear: 'None (Not Received)',
        hasReceivedPreviousYear: false,
        remarks: 'Merit candidate with 9.2 CGPA',
      },
      {
        slNo: 2,
        studentName: 'Ananya Rao',
        usn: '4MW21EC012',
        mobileNo: '9741098765',
        caste: 'OBC (Cat-2A)',
        income: 120000,
        incomeRaw: '1,20,000',
        scholarshipsReceivedPreviousYear: 'SSP Post-Matric (₹15,000)',
        hasReceivedPreviousYear: true,
        remarks: 'Annual renewal applicant',
      },
      {
        slNo: 3,
        studentName: 'Karthik Poojary',
        usn: '4MW22IS034',
        mobileNo: '9900112233',
        caste: 'OBC (Billava)',
        income: 95000,
        incomeRaw: '95,000',
        scholarshipsReceivedPreviousYear: 'None (Not Received)',
        hasReceivedPreviousYear: false,
        remarks: 'Economically weaker applicant',
      },
      {
        slNo: 4,
        studentName: 'Sneha Nayak',
        usn: '4MW21ME028',
        mobileNo: '9880123478',
        caste: 'General (GSB)',
        income: 240000,
        incomeRaw: '2,40,000',
        scholarshipsReceivedPreviousYear: 'Trust Endowed Merit (₹20,000)',
        hasReceivedPreviousYear: true,
        remarks: 'Consistent academic rank holder',
      },
      {
        slNo: 5,
        studentName: 'Prajwal Acharya',
        usn: '4MW22CS089',
        mobileNo: '9123456780',
        caste: 'OBC (Vishwakarma)',
        income: 110000,
        incomeRaw: '1,10,000',
        scholarshipsReceivedPreviousYear: 'None (Not Received)',
        hasReceivedPreviousYear: false,
        remarks: 'First-generation engineering student',
      },
    ];

    try {
      await saveStudentRecordsBulk(sampleRecords);
      toast.success('Loaded 5 sample student records!');
    } catch (err) {
      toast.error('Failed to load sample records.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* ─── Header Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7B1436] via-[#63102B] to-[#122147] text-white p-6 md:p-8 border border-[#C59048]/40 shadow-xl">
        <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-[#C59048]/15 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-[#C59048]/40 text-[#F3DE98] text-xs font-serif tracking-wider">
              <Sparkles size={13} className="text-[#C59048]" />
              <span>॥ ಶ್ರೀ ವಾದಿರಾಜ ಪ್ರಸನ್ನ ॥ ಶ್ರೇಯಾರ್ಥ • श्रेयार्थ ॥</span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Shreyarth Student Database & Scholarship Registry
            </h1>
            <p className="text-white/70 text-sm max-w-2xl leading-relaxed">
              Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM), Bantakal.
              Upload and manage student records, income classifications, caste categories, and previous scholarship history.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-2xs text-[#F3DE98]">
              <span className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-md border border-white/10">
                <GraduationCap size={13} className="text-[#C59048]" />
                Enrolled Students: <strong className="text-white">{stats.total}</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-md border border-white/10">
                <CheckCircle size={13} className="text-[#C59048]" />
                Previous Recipients: <strong className="text-white">{stats.receivedPrev}</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-md border border-white/10">
                <AlertCircle size={13} className="text-[#C59048]" />
                First-Time Applicants: <strong className="text-white">{stats.notReceived}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C59048] to-[#E5B568] hover:from-[#B58038] hover:to-[#D5A558] text-[#122147] font-heading font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 group"
            >
              <Upload size={16} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>Upload Excel Sheet</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-heading font-semibold text-xs sm:text-sm border border-white/20 transition-all active:scale-95"
            >
              <Plus size={16} />
              <span>Add Student</span>
            </button>

            {students.length > 0 && (
              <button
                onClick={() => exportStudentsToExcel(filteredStudents)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-black/30 hover:bg-black/50 text-[#F3DE98] text-xs font-semibold border border-white/10 transition-all"
                title="Export Table to Excel"
              >
                <Download size={15} />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Enrolled */}
        <div className="bg-white rounded-xl border border-[#E2D9CE] p-5 shadow-card relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-smvitm-textSecondary uppercase tracking-wider">
                Total Enrolled
              </p>
              <p className="font-heading text-3xl font-bold text-[#7B1436]">
                {stats.total}
              </p>
              <p className="text-2xs text-smvitm-textMuted">
                Verified college student records
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#FAF0F3] border border-[#7B1436]/20 flex items-center justify-center text-[#7B1436]">
              <GraduationCap size={22} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E2D9CE]/60 flex items-center justify-between text-2xs text-smvitm-textSecondary">
            <span>Database Status</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Sync
            </span>
          </div>
        </div>

        {/* Card 2: Received Previous Year */}
        <div className="bg-white rounded-xl border border-[#E2D9CE] p-5 shadow-card relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-smvitm-textSecondary uppercase tracking-wider">
                Previous Recipients
              </p>
              <p className="font-heading text-3xl font-bold text-[#C59048]">
                {stats.receivedPrev}
              </p>
              <p className="text-2xs text-smvitm-textMuted">
                {stats.total > 0 ? Math.round((stats.receivedPrev / stats.total) * 100) : 0}% of registered applicants
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#FDF6E7] border border-[#C59048]/30 flex items-center justify-center text-[#C59048]">
              <CheckCircle size={22} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E2D9CE]/60 flex items-center justify-between text-2xs text-smvitm-textSecondary">
            <span>Renewal Scrutiny</span>
            <span className="text-[#C59048] font-semibold">Priority Verification</span>
          </div>
        </div>

        {/* Card 3: No Previous Scholarship (First Time) */}
        <div className="bg-white rounded-xl border border-[#E2D9CE] p-5 shadow-card relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-smvitm-textSecondary uppercase tracking-wider">
                First-Time Applicants
              </p>
              <p className="font-heading text-3xl font-bold text-[#122147]">
                {stats.notReceived}
              </p>
              <p className="text-2xs text-smvitm-textMuted">
                Did not receive scholarship last year
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#122147]">
              <Sparkles size={22} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E2D9CE]/60 flex items-center justify-between text-2xs text-smvitm-textSecondary">
            <span>Fresh Consideration</span>
            <span className="text-[#122147] font-semibold">Eligible for Endowment</span>
          </div>
        </div>

        {/* Card 4: Economically Weaker Section */}
        <div className="bg-white rounded-xl border border-[#E2D9CE] p-5 shadow-card relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-smvitm-textSecondary uppercase tracking-wider">
                Income ≤ ₹2.5 Lakhs
              </p>
              <p className="font-heading text-3xl font-bold text-emerald-700">
                {stats.lowIncome}
              </p>
              <p className="text-2xs text-smvitm-textMuted">
                Qualify for merit-cum-means quota
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Award size={22} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E2D9CE]/60 flex items-center justify-between text-2xs text-smvitm-textSecondary">
            <span>Income Criteria</span>
            <span className="text-emerald-700 font-semibold">Means Verified</span>
          </div>
        </div>

      </div>

      {/* ─── Search, Filters & Bulk Actions Toolbar ─── */}
      <div className="bg-white rounded-xl border border-[#E2D9CE] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        
        {/* Live Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-smvitm-textMuted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, USN, mobile number, caste, or remarks..."
            className="w-full pl-10 pr-4 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-sm text-smvitm-text placeholder:text-smvitm-textMuted focus:outline-none focus:ring-2 focus:ring-[#7B1436] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-smvitm-textMuted hover:text-smvitm-text"
            >
              Clear ✕
            </button>
          )}
        </div>

        {/* Filter by Previous Scholarship */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter size={15} className="text-smvitm-textMuted" />
          <select
            value={prevScholarshipFilter}
            onChange={(e) => setPrevScholarshipFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-xs font-medium text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
          >
            <option value="all">All Previous Status</option>
            <option value="received">Received Last Year</option>
            <option value="none">Not Received (None)</option>
          </select>

          {/* Filter by Caste */}
          {distinctCastes.length > 0 && (
            <select
              value={casteFilter}
              onChange={(e) => setCasteFilter(e.target.value)}
              className="px-3 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-xs font-medium text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
            >
              <option value="all">All Castes</option>
              {distinctCastes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-xs font-medium text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
          >
            <option value="slNo">Sort: Sl. No.</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="incomeAsc">Income: Low to High</option>
            <option value="incomeDesc">Income: High to Low</option>
          </select>
        </div>

      </div>

      {/* ─── The Main Student Database Table ─── */}
      <div className="bg-white rounded-xl border border-[#D5CBBE] shadow-card overflow-hidden">
        
        {/* Table Top Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#FAF8F5] to-[#F5F3EF] border-b border-[#D5CBBE] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-sm text-[#7B1436]">
              Verified Student Registry
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#7B1436]/10 text-[#7B1436] font-mono text-xs font-bold">
              {filteredStudents.length} {filteredStudents.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {students.length === 0 && (
              <button
                onClick={handleSeedDemoRecords}
                className="text-xs text-[#7B1436] hover:text-[#C59048] font-semibold underline flex items-center gap-1"
              >
                <Sparkles size={13} /> Load 5 Sample Records
              </button>
            )}

            {students.length > 0 && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                className="text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-1"
              >
                <Trash2 size={13} /> Clear Table
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={7} cols={8} />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FDF6E7] border border-[#C59048]/40 flex items-center justify-center text-[#C59048] mx-auto shadow-sm">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-smvitm-text">
                {students.length === 0 ? 'No Student Records in Database Yet' : 'No Students Match Current Filter'}
              </h3>
              <p className="text-smvitm-textSecondary text-xs max-w-md mx-auto mt-1">
                {students.length === 0 
                  ? 'Upload your Excel spreadsheet or add records manually to populate the college scholarship database.'
                  : 'Try clearing your search query or setting the filter to "All Previous Status".'}
              </p>
            </div>
            {students.length === 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2.5 rounded-lg bg-[#7B1436] hover:bg-[#63102B] text-white text-xs font-semibold shadow-xs flex items-center gap-2"
                >
                  <Upload size={14} /> Upload Excel Sheet
                </button>
                <button
                  onClick={downloadSampleTemplate}
                  className="px-4 py-2.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F0EBE1] text-[#7B1436] border border-[#C59048]/40 text-xs font-semibold flex items-center gap-2"
                >
                  <Download size={14} /> Download Sample Template
                </button>
                <button
                  onClick={handleSeedDemoRecords}
                  className="px-4 py-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-2"
                >
                  <Sparkles size={14} /> Quick Demo Data
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPrevScholarshipFilter('all');
                  setCasteFilter('all');
                }}
                className="text-xs text-[#7B1436] font-semibold underline"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] text-smvitm-textSecondary font-semibold border-b border-[#D5CBBE] tracking-wide text-[11px] uppercase">
                  <th className="py-3.5 px-4 font-mono w-16 text-center">Sl.No.</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Name of the Student</th>
                  <th className="py-3.5 px-4 min-w-[130px]">USN</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Mobile No.</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Caste</th>
                  <th className="py-3.5 px-4 min-w-[120px] text-right">Income</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Scholarships Received last previous year</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Remarks</th>
                  <th className="py-3.5 px-4 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D9]">
                {filteredStudents.map((student, idx) => {
                  const isReceived = student.hasReceivedPreviousYear;

                  return (
                    <tr 
                      key={student.id} 
                      className="hover:bg-[#FFFDF9] transition-colors group"
                    >
                      {/* Sl.No. */}
                      <td className="py-3.5 px-4 font-mono text-center text-smvitm-textSecondary font-semibold">
                        {student.slNo || idx + 1}
                      </td>

                      {/* Name of the Student */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-[#7B1436]/10 text-[#7B1436] font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {student.studentName.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-semibold text-smvitm-text group-hover:text-[#7B1436] transition-colors">
                            {student.studentName}
                          </span>
                        </div>
                      </td>

                      {/* USN */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/05 border border-black/10 font-mono text-xs font-bold text-smvitm-text">
                          <span>{student.usn}</span>
                          <button
                            onClick={() => handleCopyUsn(student.usn)}
                            className="text-smvitm-textMuted hover:text-[#7B1436] transition-colors"
                            title="Copy USN"
                          >
                            {copiedUsn === student.usn ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Mobile No. */}
                      <td className="py-3.5 px-4">
                        {student.mobileNo && student.mobileNo !== '—' ? (
                          <a
                            href={`tel:${student.mobileNo}`}
                            className="inline-flex items-center gap-1 font-mono text-smvitm-textSecondary hover:text-[#7B1436] transition-colors"
                          >
                            <Phone size={11} className="text-[#C59048]" />
                            <span>{student.mobileNo}</span>
                          </a>
                        ) : (
                          <span className="text-smvitm-textMuted">—</span>
                        )}
                      </td>

                      {/* Caste */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#FAF0F3] text-[#7B1436] border border-[#7B1436]/20 font-medium text-[11px]">
                          {student.caste || 'General'}
                        </span>
                      </td>

                      {/* Income */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-smvitm-text block">
                            {formatCurrency(student.income)}
                          </span>
                          {student.income > 0 && student.income <= 250000 && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                              EWS / Low Income
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Scholarships Received last previous year */}
                      {/* User requirement: "make it sure if it is empty they didn't receive okay" */}
                      <td className="py-3.5 px-4">
                        {isReceived ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FDF6E7] border border-[#C59048]/50 text-[#C59048] font-medium text-[11px] shadow-xs">
                            <CheckCircle size={13} className="text-[#C59048] flex-shrink-0" />
                            <span className="font-semibold">{student.scholarshipsReceivedPreviousYear}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>None (Not Received)</span>
                          </div>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="py-3.5 px-4 text-smvitm-textSecondary text-[11px] leading-relaxed max-w-[200px]">
                        {student.remarks || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-smvitm-textSecondary hover:text-[#7B1436] transition-colors"
                            title="Edit Student Record"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingStudent(student)}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-smvitm-textSecondary hover:text-rose-700 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Summary */}
        {filteredStudents.length > 0 && (
          <div className="px-5 py-3 bg-[#FAF8F5] border-t border-[#D5CBBE] flex flex-wrap items-center justify-between text-xs text-smvitm-textSecondary">
            <span>
              Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> total registered students
            </span>
            <div className="flex items-center gap-4">
              <span>Previous Recipients: <strong className="text-[#C59048]">{stats.receivedPrev}</strong></span>
              <span>First-Time: <strong className="text-[#122147]">{stats.notReceived}</strong></span>
            </div>
          </div>
        )}

      </div>

      {/* ─── MODAL 1: Upload Excel File ─── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#C59048]/40 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#7B1436] to-[#5C0F28] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet size={20} className="text-[#F3DE98]" />
                <div>
                  <h3 className="font-heading font-bold text-base leading-tight">
                    Upload Student Excel Spreadsheet
                  </h3>
                  <p className="text-white/70 text-xs">
                    Import records from .xlsx, .xls, or .csv file into database
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                  setPreviewRows([]);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Columns Instruction Box */}
              <div className="p-4 rounded-xl bg-[#FDF6E7] border border-[#C59048]/40 text-xs text-[#7B1436] space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-[#C59048]" />
                  Expected Excel Columns:
                </p>
                <div className="font-mono text-[11px] bg-white/70 p-2.5 rounded border border-[#C59048]/20 overflow-x-auto text-slate-800">
                  Sl.No. | Name of the Student | USN | Mobile No. | Caste | Income | Scholarships Received last previous year | Remarks
                </div>
                <p className="text-2xs text-[#7B1436]/80 leading-relaxed">
                  • <em>Scholarships Received last previous year:</em> If blank or empty, system will automatically classify as <strong>"None (Not Received)"</strong>.
                  <br />• <em>USN:</em> Acts as the unique student identifier to avoid duplicates.
                </p>
              </div>

              {/* Drag and Drop Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#C59048]/60 hover:border-[#7B1436] rounded-xl p-8 text-center cursor-pointer transition-colors bg-[#FAF8F5] hover:bg-[#F5F0E6] space-y-2 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-[#FDF6E7] border border-[#C59048]/30 flex items-center justify-center text-[#C59048] mx-auto group-hover:scale-105 transition-transform">
                  <Upload size={22} />
                </div>
                <p className="font-heading font-bold text-sm text-smvitm-text">
                  {uploadFile ? uploadFile.name : 'Click to select or drag and drop your Excel file'}
                </p>
                <p className="text-2xs text-smvitm-textMuted">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files
                </p>
              </div>

              {/* Template Download Prompt */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-smvitm-textSecondary">Need the exact Excel format?</span>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="text-[#7B1436] hover:underline font-semibold flex items-center gap-1"
                >
                  <Download size={13} /> Download Sample Excel Template
                </button>
              </div>

              {/* Parsing Progress */}
              {isParsing && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-[#7B1436] font-semibold">
                  <Spinner />
                  <span>Reading and verifying Excel columns...</span>
                </div>
              )}

              {/* Live Preview of Rows */}
              {previewRows.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-smvitm-text">
                      Parsed Preview: <strong className="text-emerald-700">{previewRows.length} rows ready</strong>
                    </span>
                    <span className="text-2xs text-smvitm-textMuted">Showing first 4 rows</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-[#E2D9CE] rounded-lg">
                    <table className="w-full text-left text-2xs">
                      <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">USN</th>
                          <th className="p-2">Caste</th>
                          <th className="p-2 text-right">Income</th>
                          <th className="p-2">Prev. Scholarship</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewRows.slice(0, 4).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-medium truncate max-w-[140px]">{r.studentName}</td>
                            <td className="p-2 font-mono font-bold">{r.usn}</td>
                            <td className="p-2">{r.caste}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(r.income)}</td>
                            <td className="p-2 truncate max-w-[160px]">
                              {r.hasReceivedPreviousYear ? (
                                <span className="text-[#C59048] font-semibold">✓ {r.scholarshipsReceivedPreviousYear}</span>
                              ) : (
                                <span className="text-slate-400">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-[#E2D9CE] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                  setPreviewRows([]);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={previewRows.length === 0 || isSaving}
                onClick={handleSaveExcelToFirestore}
                className="px-5 py-2.5 rounded-lg bg-[#7B1436] hover:bg-[#63102B] disabled:opacity-50 text-white font-semibold text-xs shadow-sm flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Spinner />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} />
                    <span>Save {previewRows.length} Students to Database</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 2: Add or Edit Student Form ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#C59048]/40 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            
            <div className="px-6 py-4 bg-gradient-to-r from-[#7B1436] to-[#5C0F28] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap size={20} className="text-[#F3DE98]" />
                <h3 className="font-heading font-bold text-base">
                  {editingStudent ? 'Edit Student Record' : 'Add Student to Database'}
                </h3>
              </div>
              <button onClick={closeFormModal} className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              <div className="grid grid-cols-2 gap-3">
                {/* Sl.No. */}
                <div>
                  <label className="block text-xs font-semibold text-smvitm-textSecondary mb-1">
                    Sl.No.
                  </label>
                  <input
                    type="number"
                    value={formSlNo}
                    onChange={(e) => setFormSlNo(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-xs text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                  />
                </div>

                {/* USN */}
                <div>
                  <label className="block text-xs font-semibold text-smvitm-textSecondary mb-1">
                    USN <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsn}
                    onChange={(e) => setFormUsn(e.target.value)}
                    placeholder="e.g. 4MW21CS045"
                    className="w-full px-3 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-xs font-mono font-bold text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-smvitm-textSecondary mb-1">
                  Name of the Student <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rahul S. Hegde"
                  className="w-full px-3 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-xs text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Mobile No. */}
                <div>
                  <label className="block text-xs font-semibold text-smvitm-textSecondary mb-1">
                    Mobile No.
                  </label>
                  <input
                    type="text"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    placeholder="e.g. 9845123456"
                    className="w-full px-3 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-xs text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                  />
                </div>

                {/* Caste */}
                <div>
                  <label className="block text-xs font-semibold text-smvitm-textSecondary mb-1">
                    Caste / Category
                  </label>
                  <input
                    type="text"
                    value={formCaste}
                    onChange={(e) => setFormCaste(e.target.value)}
                    placeholder="e.g. General / OBC / SC / ST"
                    className="w-full px-3 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-xs text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                  />
                </div>
              </div>

              {/* Income */}
              <div>
                <label className="block text-xs font-semibold text-smvitm-textSecondary mb-1">
                  Annual Family Income (₹)
                </label>
                <input
                  type="number"
                  value={formIncome}
                  onChange={(e) => setFormIncome(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full px-3 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-xs font-mono text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                />
              </div>

              {/* Scholarships Received last previous year */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CE] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPrevReceived}
                    onChange={(e) => setFormPrevReceived(e.target.checked)}
                    className="w-4 h-4 text-[#7B1436] rounded border-gray-300 focus:ring-[#7B1436]"
                  />
                  <span className="text-xs font-bold text-smvitm-text">
                    Did the student receive any scholarship last previous year?
                  </span>
                </label>

                {formPrevReceived ? (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={formPrevDetails}
                      onChange={(e) => setFormPrevDetails(e.target.value)}
                      placeholder="e.g. SSP Post-Matric (₹15,000) or Sode Mutt Trust"
                      className="w-full px-3 py-2 bg-white border border-[#C59048]/50 rounded-lg text-xs text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                    />
                  </div>
                ) : (
                  <p className="text-2xs text-smvitm-textMuted pl-6">
                    Will be stored as <strong>"None (Not Received)"</strong> in the database.
                  </p>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-smvitm-textSecondary mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="e.g. 8.9 CGPA, first generation college student"
                  className="w-full px-3 py-2 bg-[#F9F7F4] border border-[#E2D9CE] rounded-lg text-xs text-smvitm-text focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFormSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-[#7B1436] hover:bg-[#63102B] text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                >
                  {isFormSubmitting ? <Spinner /> : <CheckCircle size={14} />}
                  <span>{editingStudent ? 'Update Record' : 'Save to Database'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ─── MODAL 3: Delete Confirmation ─── */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-rose-200 p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slide-up">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Delete Student Record?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong>{deletingStudent.studentName}</strong> ({deletingStudent.usn}) from the database?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: Clear All Confirmation ─── */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-rose-200 p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slide-up">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Clear All Student Records?
              </h3>
              <p className="text-xs text-slate-500">
                This will delete all <strong>{students.length}</strong> student records from the database. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllConfirm}
                className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex-1"
              >
                Clear Database
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
