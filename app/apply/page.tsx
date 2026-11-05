'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  getFormConfig, 
  submitApplication, 
  DEFAULT_CASTES 
} from '@/lib/firebase/firestore/applications';
import { 
  ApplicationFormConfig, 
  ParentStatus, 
  BacklogStatus,
} from '@/types';
import { 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  User, 
  HeartHandshake, 
  Coins, 
  Phone, 
  Mail, 
  HelpCircle, 
  Lock, 
  Copy, 
  Printer, 
  RefreshCw, 
  Send, 
  ShieldCheck,
  FolderOpen,
  ExternalLink,
  FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEPARTMENTS = [
  'Artificial Intelligence & Data Science (AI & DS)',
  'Computer Science & Engineering (CSE)',
  'Computer Science & Design (CSD)',
  'Electronics & Communication Engineering (ECE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CV)',
  'Master of Business Administration (MBA)',
  'Master of Computer Applications (MCA)',
  'Basic Sciences / First Year',
];

const SEMESTERS = ['1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'];

const PARENT_STATUS_OPTIONS: { value: ParentStatus; label: string; desc: string }[] = [
  { 
    value: 'both_alive', 
    label: 'Both Parents', 
    desc: 'Supported and cared for by both parents' 
  },
  { 
    value: 'single_mother', 
    label: 'Single Parent (Mother)', 
    desc: 'Mother-headed family' 
  },
  { 
    value: 'single_father', 
    label: 'Single Parent (Father)', 
    desc: 'Father-headed family' 
  },
  { 
    value: 'orphan', 
    label: 'Guardian / Relative Care', 
    desc: 'Supported by grandparents, relatives, or legal guardian' 
  },
];

const BACKLOG_OPTIONS: { value: BacklogStatus; label: string }[] = [
  { value: 'all_cleared_first_attempt', label: 'All Cleared in 1st Attempt (No backlogs ever)' },
  { value: 'past_cleared', label: 'Past Backlogs Cleared (Currently 0 active backlogs)' },
  { value: 'active_1_2', label: '1 to 2 Active Backlogs' },
  { value: 'active_3_plus', label: '3 or More Active Backlogs' },
];

export default function StudentApplicationPage() {
  const [config, setConfig] = useState<ApplicationFormConfig | null>(null);
  const [castes, setCastes] = useState<string[]>(DEFAULT_CASTES);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form Fields
  const [studentName, setStudentName] = useState('');
  const [usn, setUsn] = useState('');
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [cgpa, setCgpa] = useState('');
  const [sslcPercentage, setSslcPercentage] = useState('');
  const [pucPercentage, setPucPercentage] = useState('');
  const [backlogStatus, setBacklogStatus] = useState<BacklogStatus>('all_cleared_first_attempt');
  const [backlogDetails, setBacklogDetails] = useState('');

  // Caste Selection
  const [selectedCaste, setSelectedCaste] = useState('');
  const [customCasteInput, setCustomCasteInput] = useState('');

  // Family Background
  const [parentStatus, setParentStatus] = useState<ParentStatus>('both_alive');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [siblingsTotal, setSiblingsTotal] = useState('0');
  const [siblingsStudying, setSiblingsStudying] = useState('0');

  // Financial Aid & Needs
  const [prevScholarshipReceived, setPrevScholarshipReceived] = useState(false);
  const [prevScholarshipDetails, setPrevScholarshipDetails] = useState('');
  const [prevScholarshipAmount, setPrevScholarshipAmount] = useState('');

  // Contact
  const [studentPhone, setStudentPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [email, setEmail] = useState('');
  const [talukDistrict, setTalukDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [statementOfNeed, setStatementOfNeed] = useState('');

  // Supporting Documents Google Drive Link
  const [documentsDriveLink, setDocumentsDriveLink] = useState('');

  // Dynamic Custom Fields
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({});

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<{ id: string; applicationNumber: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const cfg = await getFormConfig();
        setConfig(cfg);
        if (cfg.allowedCastes && cfg.allowedCastes.length > 0) {
          setCastes(cfg.allowedCastes);
        }
      } catch (err) {
        console.error('Failed to load application configuration', err);
      } finally {
        setLoadingConfig(false);
      }
    }
    load();
  }, []);

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const isFieldEnabled = (fieldId: string) => {
    if (!config?.fields || config.fields.length === 0) return true;
    const f = config.fields.find((item) => item.id === fieldId);
    if (!f) return false;
    return f.enabled;
  };

  const isFieldRequired = (fieldId: string) => {
    if (!config?.fields) return true;
    const f = config.fields.find((item) => item.id === fieldId);
    return f ? f.required : false;
  };

  // Additional dynamic questions added by admin in Google Forms editor
  const dynamicCustomQuestions = useMemo(() => {
    const list: any[] = [];
    if (config?.fields) {
      config.fields.forEach((f) => {
        if (f.canDelete && f.enabled) {
          list.push(f);
        }
      });
    }
    if (config?.customFields) {
      config.customFields.forEach((cf) => {
        if (!list.some((l) => l.id === cf.id)) {
          list.push({
            id: cf.id,
            label: cf.label,
            section: 'custom',
            sectionTitle: 'Additional Institutional Questions',
            type: cf.type,
            required: cf.required,
            enabled: true,
            canDelete: true,
            options: cf.options,
            placeholder: cf.placeholder,
            helpText: cf.description,
            order: cf.order,
          });
        }
      });
    }
    return list;
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!studentName.trim()) {
      toast.error('Please enter the Student Full Name');
      return;
    }
    if (!usn.trim()) {
      toast.error('Please enter your USN');
      return;
    }
    const finalCaste = selectedCaste === '__OTHER__' ? customCasteInput.trim() : selectedCaste;
    if (!finalCaste) {
      toast.error('Please select or specify your Caste / Category');
      return;
    }
    if (!annualIncome || Number(annualIncome) < 0) {
      toast.error('Please enter a valid Annual Family Income in ₹');
      return;
    }
    if (!studentPhone.trim() || studentPhone.trim().length < 10) {
      toast.error('Please provide a valid 10-digit mobile number for WhatsApp');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (isFieldEnabled('statementOfNeed') && (!statementOfNeed.trim() || statementOfNeed.trim().length < 15)) {
      toast.error('Please write a brief statement describing your financial circumstances & need');
      return;
    }
    if (isFieldEnabled('documentsDriveLink') && !documentsDriveLink.trim()) {
      toast.error('Please provide the Google Drive link containing soft copies of your original documents');
      return;
    }
    if (isFieldEnabled('documentsDriveLink') && !documentsDriveLink.toLowerCase().startsWith('http')) {
      toast.error('Google Drive link must be a valid URL starting with https://');
      return;
    }

    // Dynamic field validation
    for (const field of dynamicCustomQuestions) {
      if (field.required && !customResponses[field.id]) {
        toast.error(`Please answer required question: "${field.label}"`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Respectful defaults for conditional parent status
      let finalFatherOccupation = fatherOccupation.trim();
      let finalMotherOccupation = motherOccupation.trim();

      if (parentStatus === 'single_mother') {
        finalFatherOccupation = '— (Raised by Mother)';
      } else if (parentStatus === 'single_father') {
        finalMotherOccupation = '— (Raised by Father)';
      } else if (parentStatus === 'orphan') {
        finalMotherOccupation = '— (Guardian Care)';
        if (!finalFatherOccupation) finalFatherOccupation = 'Guardian Caregiver';
      }

      const res = await submitApplication({
        studentName: studentName.trim(),
        usn: usn.trim().toUpperCase(),
        semester,
        department,
        cgpa: parseFloat(cgpa) || 0,
        sslcPercentage: parseFloat(sslcPercentage) || 0,
        pucPercentage: parseFloat(pucPercentage) || 0,
        backlogStatus,
        backlogDetails: backlogDetails.trim(),
        caste: finalCaste,
        isCustomCaste: selectedCaste === '__OTHER__',
        parentStatus,
        fatherOccupation: finalFatherOccupation || '—',
        motherOccupation: finalMotherOccupation || '—',
        annualIncome: Number(annualIncome) || 0,
        siblingsTotal: parseInt(siblingsTotal, 10) || 0,
        siblingsStudying: parseInt(siblingsStudying, 10) || 0,
        prevScholarshipReceived,
        prevScholarshipDetails: prevScholarshipReceived ? prevScholarshipDetails.trim() : 'None',
        prevScholarshipAmount: prevScholarshipReceived ? Number(prevScholarshipAmount) || 0 : 0,
        studentPhone: studentPhone.trim(),
        parentPhone: parentPhone.trim() || studentPhone.trim(),
        email: email.trim(),
        talukDistrict: talukDistrict.trim(),
        address: address.trim(),
        documentsDriveLink: documentsDriveLink.trim(),
        statementOfNeed: statementOfNeed.trim(),
        customFields: customResponses,
      });

      setSubmittedRef(res);
      toast.success('Application submitted successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit application. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRefToClipboard = () => {
    if (submittedRef?.applicationNumber) {
      navigator.clipboard.writeText(submittedRef.applicationNumber);
      toast.success('Application Reference Number copied!');
    }
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-14 h-14 border-4 border-[#7B1436] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-heading font-semibold text-[#7B1436] text-lg">
            Loading scholarship-smv — SMVITM Scholarship Application Form...
          </p>
        </div>
      </div>
    );
  }

  // If Admin closed the form
  if (config && !config.isOpen && !submittedRef) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-[#E2D9CE] shadow-xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#7B1436]/10 text-[#7B1436] flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl text-[#7B1436]">
              Applications Closed
            </h1>
            <p className="text-sm text-[#C59048] font-medium mt-1">
              Academic Year {config.academicYear}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CE] text-slate-700 text-sm leading-relaxed text-left">
            {config.closedMessage}
          </div>
          <div className="pt-4 border-t border-[#E2D9CE] flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#7B1436] hover:bg-[#63102B] text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Institutional Staff Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success Confirmation Screen
  if (submittedRef) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] py-6 sm:py-12 px-3 sm:px-4 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl sm:rounded-3xl border border-[#E2D9CE] shadow-xl p-5 sm:p-8 md:p-12 space-y-6 sm:space-y-8 animate-fade-in relative overflow-hidden">
          {/* Top Decorative Header Accent */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#7B1436] via-[#C59048] to-[#122147]" />

          <div className="text-center space-y-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl md:text-3xl text-[#7B1436] leading-snug">
              scholarship-smv — Application Submitted Successfully!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Your scholarship application has been registered with the scholarship-smv portal for SMVITM Student Welfare Board (SWB).
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-[#F5F0E6] border-2 border-[#C59048]/40 shadow-sm text-center space-y-2 sm:space-y-3">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7B1436]">
              Your Official Application Reference ID
            </span>
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <span className="font-mono font-black text-xl sm:text-2xl md:text-3xl text-slate-900 tracking-wider break-all">
                {submittedRef.applicationNumber}
              </span>
              <button
                type="button"
                onClick={copyRefToClipboard}
                title="Copy Reference Number"
                className="p-2 rounded-xl bg-white border border-[#C59048]/40 text-[#7B1436] hover:bg-[#FDF6E7] transition-colors shadow-2xs"
              >
                <Copy size={16} />
              </button>
            </div>
            <p className="text-[11px] sm:text-2xs text-slate-500">
              Please take a screenshot or note down this reference number for all future inquiries.
            </p>
          </div>

          {/* Summary Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[#7B1436]" />
              Submission Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-xs">
              <div><strong className="text-slate-900">Student Name:</strong> {studentName}</div>
              <div><strong className="text-slate-900">USN:</strong> {usn.toUpperCase()}</div>
              <div><strong className="text-slate-900">Branch &amp; Sem:</strong> {department} ({semester})</div>
              <div><strong className="text-slate-900">Caste / Category:</strong> {selectedCaste === '__OTHER__' ? customCasteInput : selectedCaste}</div>
              <div><strong className="text-slate-900">Family Income:</strong> ₹{Number(annualIncome).toLocaleString('en-IN')}/yr</div>
              <div><strong className="text-slate-900">Contact:</strong> {studentPhone}</div>
              <div className="sm:col-span-2 overflow-hidden text-ellipsis">
                <strong className="text-slate-900 block sm:inline mr-1">Document Drive:</strong>
                <a
                  href={documentsDriveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all inline-flex items-center gap-1"
                >
                  <FolderOpen size={12} className="flex-shrink-0" />
                  <span className="break-all">{documentsDriveLink}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E2D9CE]">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Printer size={15} />
              <span>Print Application Slip</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmittedRef(null);
                setStudentName('');
                setUsn('');
                setCgpa('');
                setSelectedCaste('');
                setCustomCasteInput('');
                setAnnualIncome('');
                setStatementOfNeed('');
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#7B1436] hover:bg-[#63102B] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <RefreshCw size={14} />
              <span>Submit Another Application</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE] py-4 sm:py-8 md:py-10 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">

        {/* ── Top Institution Header Banner ── */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2D9CE] shadow-sm sm:shadow-md overflow-hidden">
          <div className="h-2.5 sm:h-3 bg-gradient-to-r from-[#7B1436] via-[#C59048] to-[#122147]" />
          <div className="p-4 sm:p-6 md:p-8 space-y-3.5 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#EAE3D9] pb-3.5 sm:pb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#7B1436] text-white flex items-center justify-center font-heading font-black text-xs sm:text-sm shadow-md flex-shrink-0">
                  SMV
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-heading font-black text-sm sm:text-base text-[#7B1436] tracking-wider uppercase">
                      scholarship-smv
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">•</span>
                    <span className="font-heading font-bold text-xs text-slate-700 uppercase tracking-wide">
                      SMVITM
                    </span>
                  </div>
                  <h2 className="font-heading font-bold text-[10px] sm:text-xs text-slate-700 uppercase tracking-wider mt-0.5 line-clamp-2 sm:line-clamp-none">
                    Shri Madhwa Vadiraja Institute of Technology & Management
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                    Vishwothama Nagar, Bantakal, Udupi — 574 115
                  </p>
                </div>
              </div>
              <div className="self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#FDF6E7] border border-[#C59048]/40 text-[#7B1436] text-[10px] sm:text-[11px] font-bold whitespace-nowrap">
                  <Sparkles size={12} className="text-[#C59048]" />
                  scholarship-smv • SMVITM SWB 2026–27
                </span>
              </div>
            </div>

            <div>
              <h1 className="font-heading font-extrabold text-lg sm:text-2xl md:text-3xl text-slate-900 tracking-tight leading-snug">
                {config?.title || 'scholarship-smv — SMVITM Scholarship Application Form'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 sm:mt-2 leading-relaxed">
                {config?.description || 'Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM) — Student Welfare Board (SWB). Apply for institutional financial assistance, merit-cum-means aid, and endowed trust scholarships for the academic year 2026-27.'}
              </p>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E2D9CE] rounded-xl p-2.5 sm:p-3 text-[11px] sm:text-2xs text-[#7B1436] flex items-start sm:items-center gap-2">
              <AlertCircle size={15} className="text-[#C59048] flex-shrink-0 mt-0.5 sm:mt-0" />
              <span className="leading-tight sm:leading-normal">
                <strong>No Login Required:</strong> Provide accurate information as per college and government records. All details are subject to verification by the Student Welfare Board (SWB).
              </span>
            </div>
          </div>
        </div>

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ════ SECTION 1: Personal & Academic Identification ════ */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2D9CE] shadow-xs sm:shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2.5 pb-2.5 sm:pb-3 border-b border-[#EAE3D9]">
              <div className="w-8 h-8 rounded-xl bg-[#FAF0F3] text-[#7B1436] flex items-center justify-center flex-shrink-0">
                <User size={18} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-[#7B1436] leading-snug">
                  1. Student Identification & Academic Record
                </h3>
                <p className="text-[11px] sm:text-2xs text-slate-500">Provide official details as registered in college</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name of the Student <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhushan Poojary"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] focus:border-transparent min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  University Seat Number (USN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4MW23AD026"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  className="w-full text-sm sm:text-xs font-mono uppercase px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] focus:border-transparent min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Branch / Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] focus:border-transparent bg-white min-h-[42px] sm:min-h-[38px] transition-colors"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Semester <span className="text-red-500">*</span>
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] focus:border-transparent bg-white min-h-[42px] sm:min-h-[38px] transition-colors"
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {isFieldEnabled('cgpa') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Engineering CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 8.45"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] focus:border-transparent min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                  />
                </div>
              )}

              {isFieldEnabled('backlogStatus') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Backlog Status History <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={backlogStatus}
                    onChange={(e) => setBacklogStatus(e.target.value as BacklogStatus)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] focus:border-transparent bg-white min-h-[42px] sm:min-h-[38px] transition-colors"
                  >
                    {BACKLOG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {isFieldEnabled('sslcPercentage') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    10th (SSLC) Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 92.4"
                    value={sslcPercentage}
                    onChange={(e) => setSslcPercentage(e.target.value)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] focus:border-transparent min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                  />
                </div>
              )}

              {isFieldEnabled('pucPercentage') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    12th (PUC / Diploma) Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 88.0"
                    value={pucPercentage}
                    onChange={(e) => setPucPercentage(e.target.value)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] focus:border-transparent min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ════ SECTION 2: Community Category & Family Support Structure ════ */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2D9CE] shadow-xs sm:shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2.5 pb-2.5 sm:pb-3 border-b border-[#EAE3D9]">
              <div className="w-8 h-8 rounded-xl bg-[#FDF6E7] text-[#C59048] flex items-center justify-center flex-shrink-0">
                <HeartHandshake size={18} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-[#7B1436] leading-snug">
                  2. Community Category &amp; Family Support Structure
                </h3>
                <p className="text-[11px] sm:text-2xs text-slate-500">Confidential information used solely for institutional scholarship eligibility &amp; student welfare</p>
              </div>
            </div>

            {/* Caste Selection with Dynamic "Other" */}
            <div className="space-y-2.5 sm:space-y-3 bg-[#FAF8F5] p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E2D9CE]">
              <label className="block text-xs font-bold text-slate-800 leading-snug">
                Select Your Caste / Community Category (for Endowment &amp; Trust Scholarships) <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedCaste}
                onChange={(e) => setSelectedCaste(e.target.value)}
                className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] bg-white font-medium min-h-[42px] transition-colors"
              >
                <option value="">-- Choose Caste / Community from List --</option>
                {castes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__OTHER__">✦ Other (Type your caste if not in list)...</option>
              </select>

              {/* Conditional Input if "Other" is chosen */}
              {selectedCaste === '__OTHER__' && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-white border-2 border-[#C59048] shadow-sm space-y-1.5 animate-slide-up">
                  <label className="block text-[11px] sm:text-2xs font-bold text-[#7B1436] uppercase tracking-wider">
                    Please Enter Your Caste / Community Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sali, Devanga, Padmashali, Arya Vysya, etc."
                    value={customCasteInput}
                    onChange={(e) => setCustomCasteInput(e.target.value)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px]"
                  />
                  <p className="text-[11px] sm:text-2xs text-slate-500">
                    ℹ️ This caste will be recorded on your application and automatically added to the portal list.
                  </p>
                </div>
              )}
            </div>

            {/* Family Living & Care Structure */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 leading-snug">
                Family Living &amp; Care Structure <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {PARENT_STATUS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all ${
                      parentStatus === opt.value
                        ? 'border-[#7B1436] bg-[#FAF0F3] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="parentStatus"
                      value={opt.value}
                      checked={parentStatus === opt.value}
                      onChange={() => setParentStatus(opt.value)}
                      className="mt-0.5 w-4 h-4 text-[#7B1436] focus:ring-[#7B1436] flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800 leading-snug">{opt.label}</span>
                      <span className="block text-[11px] sm:text-2xs text-slate-500 mt-0.5 leading-snug">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Dynamic Conditional Occupations based on Family Care Structure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 animate-fade-in">
              {/* Show Father's Occupation only if Both Parents or Single Parent (Father) */}
              {(parentStatus === 'both_alive' || parentStatus === 'single_father') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Father&apos;s Occupation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Agriculture / Daily Wage / Transport / Self-employed / Service"
                    value={fatherOccupation}
                    onChange={(e) => setFatherOccupation(e.target.value)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                  />
                </div>
              )}

              {/* Show Mother's Occupation only if Both Parents or Single Parent (Mother) */}
              {(parentStatus === 'both_alive' || parentStatus === 'single_mother') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mother&apos;s Occupation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Homemaker / Self-employed / Agriculture / Daily Wage / Service"
                    value={motherOccupation}
                    onChange={(e) => setMotherOccupation(e.target.value)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                  />
                </div>
              )}

              {/* Show Guardian's Occupation if Guardian / Relative Care */}
              {parentStatus === 'orphan' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Guardian&apos;s / Primary Caregiver&apos;s Occupation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grandparent / Agriculture / Private / Relative Caregiver"
                    value={fatherOccupation}
                    onChange={(e) => setFatherOccupation(e.target.value)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Family Income & Siblings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Annual Family Income (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  placeholder="e.g. 60000"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                />
                {annualIncome && Number(annualIncome) > 0 && (
                  <span className="text-[11px] sm:text-2xs font-semibold text-[#7B1436] mt-1 block">
                    ₹{Number(annualIncome).toLocaleString('en-IN')} / year
                  </span>
                )}
              </div>

              {isFieldEnabled('siblingsTotal') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Siblings (Brothers/Sisters)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={siblingsTotal}
                    onChange={(e) => setSiblingsTotal(e.target.value)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                  />
                </div>
              )}

              {isFieldEnabled('siblingsStudying') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Siblings Currently Studying
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={siblingsStudying}
                    onChange={(e) => setSiblingsStudying(e.target.value)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ════ SECTION 3: Prior Scholarships & Statement of Need ════ */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2D9CE] shadow-xs sm:shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2.5 pb-2.5 sm:pb-3 border-b border-[#EAE3D9]">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Coins size={18} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-[#7B1436] leading-snug">
                  3. Prior Financial Aid &amp; Statement of Hardship
                </h3>
                <p className="text-[11px] sm:text-2xs text-slate-500">Provide details of other financial aid received</p>
              </div>
            </div>

            {/* Prior Scholarship Toggle */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF8F5] border border-[#E2D9CE] space-y-3">
              <label className="block text-xs font-bold text-slate-800 leading-snug">
                Did you receive any scholarship during the previous academic year? <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-6">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="prevSch"
                    checked={!prevScholarshipReceived}
                    onChange={() => setPrevScholarshipReceived(false)}
                    className="w-4 h-4 text-[#7B1436] focus:ring-[#7B1436] flex-shrink-0"
                  />
                  <span>No (First time applicant / No prior scholarship)</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="prevSch"
                    checked={prevScholarshipReceived}
                    onChange={() => setPrevScholarshipReceived(true)}
                    className="w-4 h-4 text-[#7B1436] focus:ring-[#7B1436] flex-shrink-0"
                  />
                  <span>Yes (Received prior assistance)</span>
                </label>
              </div>

              {prevScholarshipReceived && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] sm:text-2xs font-bold text-slate-700 mb-1">
                      Scholarship Name(s) received (e.g. SSP, Vidyasiri, Jindal, SWB)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. State Scholarship Portal (SSP)"
                      value={prevScholarshipDetails}
                      onChange={(e) => setPrevScholarshipDetails(e.target.value)}
                      className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] bg-white min-h-[42px] sm:min-h-[38px] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-2xs font-bold text-slate-700 mb-1">
                      Total Amount Received (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 18000"
                      value={prevScholarshipAmount}
                      onChange={(e) => setPrevScholarshipAmount(e.target.value)}
                      className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] bg-white min-h-[42px] sm:min-h-[38px] transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Statement of Financial Need & Educational Aspiration */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 leading-snug">
                Personal Statement &amp; Financial Need <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] sm:text-2xs text-slate-500 mb-2 leading-relaxed">
                Please share your family situation, educational aspirations, and how receiving this institutional scholarship will assist your engineering journey at SMVITM.
              </p>
              <textarea
                required
                rows={4}
                value={statementOfNeed}
                onChange={(e) => setStatementOfNeed(e.target.value)}
                placeholder="Share your background, educational goals, and the financial assistance needed to support your studies..."
                className="w-full text-sm sm:text-xs p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] transition-colors"
              />
            </div>
          </div>

          {/* ════ SECTION 4: Contact & Residential Details ════ */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2D9CE] shadow-xs sm:shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2.5 pb-2.5 sm:pb-3 border-b border-[#EAE3D9]">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-[#7B1436] leading-snug">
                  4. Contact &amp; Residential Details
                </h3>
                <p className="text-[11px] sm:text-2xs text-slate-500">For scholarship committee communication and interview intimation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Mobile Number (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9845012345"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full text-sm sm:text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                />
              </div>

              {isFieldEnabled('parentPhone') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parent / Guardian Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9448012345"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full text-sm sm:text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. student.cs@smvitm.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                />
              </div>

              {isFieldEnabled('talukDistrict') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Taluk &amp; District of Residence
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Karkala, Udupi / Kundapura / Belthangady"
                    value={talukDistrict}
                    onChange={(e) => setTalukDistrict(e.target.value)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                  />
                </div>
              )}

              {isFieldEnabled('address') && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Residential Address
                  </label>
                  <input
                    type="text"
                    placeholder="Door No, Street, Village/Town, Post, Pincode"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ════ SECTION 5: Original Supporting Documents (Google Drive Soft Copies) ════ */}
          {isFieldEnabled('documentsDriveLink') && (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2D9CE] shadow-xs sm:shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
              <div className="flex items-center gap-2.5 pb-2.5 sm:pb-3 border-b border-[#EAE3D9]">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <FolderOpen size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-[#7B1436] leading-snug">
                    5. Supporting Documents Soft Copies (Google Drive Folder Link)
                  </h3>
                  <p className="text-[11px] sm:text-2xs text-slate-500">
                    Upload clear scanned copies or clear photos of original certificates for committee verification
                  </p>
                </div>
              </div>

              {/* Instruction Checklist Box */}
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-[#F5F0E6] border border-[#C59048]/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7B1436]">
                  <FileCheck size={16} className="text-[#C59048] flex-shrink-0" />
                  <span>Original Documents to Include in Your Google Drive Folder:</span>
                </div>
                <ul className="text-[11px] sm:text-2xs text-slate-700 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li><strong>Academic Records:</strong> SSLC (10th) &amp; PUC (12th) / Diploma Marks Cards, plus all previous Engineering Semester Grade Cards.</li>
                  <li><strong>Income &amp; Caste Verification:</strong> Valid Income Certificate &amp; Caste Certificate issued by Govt of Karnataka (Tahasildar / Revenue Dept / Nadakacheri).</li>
                  <li><strong>College Documents:</strong> SMVITM Student ID Card &amp; latest College Fee Receipt.</li>
                  <li><strong>Special Category (if applicable):</strong> Supporting document for single parent or guardian care.</li>
                </ul>

                {/* Crucial Sharing Notice */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-[11px] sm:text-2xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-amber-700 flex-shrink-0" />
                    <span>Important Link Sharing Setting:</span>
                  </div>
                  <p className="leading-relaxed">
                    In Google Drive, click <strong>Share ➔ General access</strong> and change from <strong>&quot;Restricted&quot;</strong> to <strong>&quot;Anyone with the link can view&quot;</strong>. This allows the scholarship screening committee to verify your uploaded soft copies without permission errors.
                  </p>
                </div>
              </div>

              {/* Input Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 leading-snug">
                  Google Drive Folder / Document Link <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/drive/folders/YOUR_FOLDER_ID"
                    value={documentsDriveLink}
                    onChange={(e) => setDocumentsDriveLink(e.target.value)}
                    className="flex-1 w-full text-sm sm:text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7B1436] min-h-[42px] transition-colors"
                  />
                  {documentsDriveLink && documentsDriveLink.startsWith('http') && (
                    <a
                      href={documentsDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CE] hover:bg-[#FDF6E7] text-xs font-semibold text-[#7B1436] flex items-center justify-center gap-1.5 transition-colors shadow-2xs flex-shrink-0 min-h-[42px]"
                    >
                      <ExternalLink size={14} />
                      <span>Test Link</span>
                    </a>
                  )}
                </div>
                <p className="text-[11px] sm:text-2xs text-slate-500">
                  Paste the shareable link of your Google Drive folder containing all original scanned certificates.
                </p>
              </div>
            </div>
          )}

          {/* ════ SECTION 6: Dynamic Custom Questions Added by Admin ════ */}
          {dynamicCustomQuestions.length > 0 && (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2D9CE] shadow-xs sm:shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
              <div className="flex items-center gap-2.5 pb-2.5 sm:pb-3 border-b border-[#EAE3D9]">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-[#7B1436] leading-snug">
                    6. Additional Institutional Questions
                  </h3>
                  <p className="text-[11px] sm:text-2xs text-slate-500">Specific questions requested by the SWB administration</p>
                </div>
              </div>

              <div className="space-y-3.5 sm:space-y-4">
                {dynamicCustomQuestions.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 leading-snug">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.helpText && (
                      <p className="text-[11px] sm:text-2xs text-slate-500">{field.helpText}</p>
                    )}

                    {field.type === 'text' && (
                      <input
                        type="text"
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={customResponses[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={customResponses[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                        value={customResponses[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full text-sm sm:text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436] bg-white transition-colors"
                      />
                    )}

                    {field.type === 'select' && (
                      <select
                        required={field.required}
                        value={customResponses[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] transition-colors"
                      >
                        <option value="">-- Choose Option --</option>
                        {field.options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.type === 'boolean' && (
                      <div className="flex items-center gap-6 pt-1">
                        <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <input
                            type="radio"
                            name={`dyn_${field.id}`}
                            checked={customResponses[field.id] === true}
                            onChange={() => handleCustomFieldChange(field.id, true)}
                            className="w-4 h-4 text-[#7B1436] focus:ring-[#7B1436]"
                          />
                          <span>Yes</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <input
                            type="radio"
                            name={`dyn_${field.id}`}
                            checked={customResponses[field.id] === false}
                            onChange={() => handleCustomFieldChange(field.id, false)}
                            className="w-4 h-4 text-[#7B1436] focus:ring-[#7B1436]"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    )}

                    {field.type === 'url' && (
                      <input
                        type="url"
                        required={field.required}
                        placeholder={field.placeholder || 'https://...'}
                        value={customResponses[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full text-sm sm:text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#7B1436] min-h-[42px] sm:min-h-[38px] bg-white transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ Declaration & Submit Button ════ */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2D9CE] shadow-xs sm:shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5">
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF8F5] border border-[#E2D9CE] text-xs text-slate-700 space-y-2">
              <span className="font-bold text-slate-900 block text-xs sm:text-sm">Student Undertaking / Declaration:</span>
              <p className="text-[11px] sm:text-2xs leading-relaxed text-slate-600">
                I hereby declare that all information furnished above regarding my academic performance, caste, annual family income, and circumstances is true to the best of my knowledge and belief. I understand that any false statement will result in immediate disqualification and disciplinary action.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-2">
              <span className="text-[11px] sm:text-2xs text-slate-500 text-center sm:text-left">
                By clicking Submit, your application will be securely forwarded to the SWB Committee.
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl sm:rounded-2xl bg-[#7B1436] hover:bg-[#63102B] disabled:opacity-50 text-white font-heading font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 flex-shrink-0 min-h-[48px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="text-center py-6 text-2xs text-slate-500 space-y-1">
          <p>© {new Date().getFullYear()} Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM)</p>
          <p>Student Welfare Board (SWB) • Bantakal, Udupi</p>
        </div>

      </div>
    </div>
  );
}
