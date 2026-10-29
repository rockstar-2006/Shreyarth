'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNominees } from '@/lib/hooks/useNominees';
import { useStudentRecords } from '@/lib/hooks/useStudentRecords';
import { addNominee, removeNominee, updateNominee } from '@/lib/firebase/firestore/nominees';
import { publishScholarship } from '@/lib/firebase/firestore/scholarships';
import { NomineeList } from '@/components/scholarship/NomineeList';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/utils/formatters';
import { Nominee } from '@/types';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  Users, 
  FileSpreadsheet, 
  Plus, 
  CheckCircle, 
  Search, 
  ArrowLeft, 
  Filter, 
  CheckSquare, 
  Square, 
  RotateCcw, 
  X,
  Sparkles,
  Check,
  Edit3,
  FileText
} from 'lucide-react';

export default function NomineesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { nominees, loading } = useNominees(id);
  const { students: databaseStudents, loading: loadingStudents } = useStudentRecords();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Database selection state
  const [selectedStudentUsns, setSelectedStudentUsns] = useState<string[]>([]);
  const [dbSearch, setDbSearch] = useState('');
  const [selectedCaste, setSelectedCaste] = useState('ALL');
  const [selectedPrevSch, setSelectedPrevSch] = useState<'ALL' | 'FIRST_TIME' | 'PREV_RECEIVER'>('ALL');
  const [selectedIncome, setSelectedIncome] = useState<string>('ALL');

  const [newNominee, setNewNominee] = useState({
    studentName: '',
    rollNumber: '',
    department: '',
    semester: 'B.E',
    cgpa: '8.0',
    studentId: '',
    description: '',
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  // Edit Profile / Extra Details State
  const [editingNominee, setEditingNominee] = useState<Nominee | null>(null);
  const [editForm, setEditForm] = useState({
    studentName: '',
    rollNumber: '',
    department: '',
    semester: '',
    cgpa: '',
    caste: '',
    income: '',
    prevScholarship: '',
    mobileNo: '',
    description: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const handleOpenEditModal = (nominee: Nominee) => {
    setEditingNominee(nominee);
    setEditForm({
      studentName: nominee.studentName || '',
      rollNumber: nominee.rollNumber || nominee.studentId || '',
      department: nominee.department || '',
      semester: nominee.semester || '',
      cgpa: String(nominee.cgpa ?? 8.5),
      caste: nominee.caste || '',
      income: String(nominee.income ?? 0),
      prevScholarship: nominee.prevScholarship || '',
      mobileNo: nominee.mobileNo || '',
      description: nominee.description || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingNominee) return;
    setEditSaving(true);
    try {
      const cgpaNum = parseFloat(editForm.cgpa);
      const incNum = parseFloat(editForm.income);
      await updateNominee(editingNominee.id, {
        department: editForm.department.trim(),
        semester: editForm.semester.trim(),
        cgpa: !isNaN(cgpaNum) ? cgpaNum : 8.5,
        caste: editForm.caste.trim(),
        income: !isNaN(incNum) ? incNum : 0,
        prevScholarship: editForm.prevScholarship.trim(),
        mobileNo: editForm.mobileNo.trim(),
        description: editForm.description.trim(),
      });
      toast.success(`Profile & extra details updated for ${editingNominee.studentName}!`);
      setEditingNominee(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update candidate details.');
    } finally {
      setEditSaving(false);
    }
  };

  // Unique list of castes in student database
  const uniqueCastes = useMemo(() => {
    const set = new Set<string>();
    databaseStudents.forEach((s) => {
      if (s.caste && s.caste.trim()) {
        set.add(s.caste.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [databaseStudents]);

  // Set of already nominated student identifiers (USNs or roll numbers)
  const nominatedUsns = useMemo(() => {
    return new Set(
      nominees
        .map((n) => (n.rollNumber || n.studentId || '').toLowerCase().trim())
        .filter(Boolean)
    );
  }, [nominees]);

  // Filtered student database
  const filteredDbStudents = useMemo(() => {
    return databaseStudents.filter((s) => {
      // 1. Keyword search (Name, USN, Caste, Remarks)
      if (dbSearch.trim()) {
        const q = dbSearch.toLowerCase().trim();
        const matchName = s.studentName?.toLowerCase().includes(q);
        const matchUsn = s.usn?.toLowerCase().includes(q);
        const matchCaste = s.caste?.toLowerCase().includes(q);
        const matchRemarks = s.remarks?.toLowerCase().includes(q);
        if (!matchName && !matchUsn && !matchCaste && !matchRemarks) return false;
      }

      // 2. Caste filter
      if (selectedCaste !== 'ALL') {
        if ((s.caste || '').trim().toLowerCase() !== selectedCaste.toLowerCase()) {
          return false;
        }
      }

      // 3. Previous scholarship filter
      if (selectedPrevSch === 'FIRST_TIME' && s.hasReceivedPreviousYear) {
        return false;
      }
      if (selectedPrevSch === 'PREV_RECEIVER' && !s.hasReceivedPreviousYear) {
        return false;
      }

      // 4. Income filter
      if (selectedIncome !== 'ALL') {
        const limit = Number(selectedIncome);
        const incomeVal = typeof s.income === 'number' ? s.income : (Number(s.income) || 0);
        if (incomeVal > limit) return false;
      }

      return true;
    });
  }, [databaseStudents, dbSearch, selectedCaste, selectedPrevSch, selectedIncome]);

  const handleAdd = async () => {
    const errs: Record<string, string> = {};
    if (!newNominee.studentName.trim()) errs.studentName = 'Name is required';
    if (!newNominee.rollNumber.trim()) errs.rollNumber = 'Roll number / USN is required';
    if (!newNominee.department.trim()) errs.department = 'Department is required';
    if (!newNominee.semester.trim()) errs.semester = 'Semester is required';
    const cgpa = parseFloat(newNominee.cgpa);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) errs.cgpa = 'CGPA must be between 0 and 10';
    if (Object.keys(errs).length > 0) { setAddErrors(errs); return; }

    setAddLoading(true);
    try {
      await addNominee({
        scholarshipId: id,
        studentId: newNominee.studentId || `manual_${Date.now()}`,
        studentName: newNominee.studentName.trim(),
        rollNumber: newNominee.rollNumber.trim(),
        department: newNominee.department.trim(),
        semester: newNominee.semester.trim(),
        cgpa,
        description: newNominee.description.trim(),
      });
      toast.success('Nominee added!');
      setShowAddModal(false);
      setNewNominee({ studentName: '', rollNumber: '', department: '', semester: 'B.E', cgpa: '8.0', studentId: '', description: '' });
      setAddErrors({});
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to add nominee.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleSelectStudent = (usn: string) => {
    setSelectedStudentUsns((prev) => 
      prev.includes(usn) ? prev.filter((u) => u !== usn) : [...prev, usn]
    );
  };

  const handleSelectAllFiltered = () => {
    // Select all currently visible filtered students that aren't already nominated
    const availableUsns = filteredDbStudents
      .filter((s) => !nominatedUsns.has(s.usn.toLowerCase().trim()))
      .map((s) => s.usn);
    
    setSelectedStudentUsns((prev) => Array.from(new Set([...prev, ...availableUsns])));
    toast.success(`Selected ${availableUsns.length} students`);
  };

  const handleDeselectFiltered = () => {
    const filteredSet = new Set(filteredDbStudents.map((s) => s.usn));
    setSelectedStudentUsns((prev) => prev.filter((usn) => !filteredSet.has(usn)));
  };

  const handleResetFilters = () => {
    setDbSearch('');
    setSelectedCaste('ALL');
    setSelectedPrevSch('ALL');
    setSelectedIncome('ALL');
  };

  const handleImportSelectedStudents = async () => {
    if (selectedStudentUsns.length === 0) return;
    setImporting(true);
    let count = 0;
    let skipped = 0;

    try {
      for (const usn of selectedStudentUsns) {
        const student = databaseStudents.find((s) => s.usn === usn);
        if (!student) continue;

        // Skip if already nominated
        if (nominatedUsns.has(student.usn.toLowerCase().trim())) {
          skipped++;
          continue;
        }

        const casteVal = student.caste || '';
        const incomeVal = typeof student.income === 'number' ? student.income : (Number(student.income) || 0);
        const prevSchVal = student.scholarshipsReceivedPreviousYear || (student as any).prevScholarship || '';
        const mobVal = student.mobileNo || '';

        // Detect branch department from student USN (e.g. AD -> AI & Data Science)
        const branchName = (() => {
          const upper = (student.usn || '').toUpperCase();
          if (upper.includes('AD') || upper.includes('AI')) return 'AI & Data Science (B.E)';
          if (upper.includes('CS')) return 'Computer Science & Engg (B.E)';
          if (upper.includes('CD')) return 'Computer Science & Design (B.E)';
          if (upper.includes('EC')) return 'Electronics & Comm. (B.E)';
          if (upper.includes('IS')) return 'Information Science (B.E)';
          if (upper.includes('CV')) return 'Civil Engineering (B.E)';
          if (upper.includes('ME')) return 'Mechanical Engineering (B.E)';
          if (upper.includes('MB') || upper.includes('BA')) return 'MBA';
          if (upper.includes('MC')) return 'MCA';
          return 'Regular B.E';
        })();

        await addNominee({
          scholarshipId: id,
          studentId: student.usn || `std_${Date.now()}_${count}`,
          studentName: student.studentName || 'Student',
          rollNumber: student.usn || '',
          department: branchName,
          semester: 'Regular B.E / MBA',
          cgpa: 8.5,
          caste: casteVal,
          income: incomeVal,
          prevScholarship: prevSchVal,
          mobileNo: mobVal,
          description: student.remarks && student.remarks !== '—' && student.remarks !== '-' 
            ? student.remarks 
            : `Income: ${formatCurrency(incomeVal)} | ${prevSchVal ? `Prev: ${prevSchVal}` : 'First-time applicant'}`,
        });
        count++;
      }

      if (count > 0) {
        toast.success(`Successfully assigned ${count} student${count > 1 ? 's' : ''} to this scholarship!`);
        setShowDatabaseModal(false);
        setSelectedStudentUsns([]);
      } else if (skipped > 0) {
        toast.error(`Selected student${skipped > 1 ? 's are' : ' is'} already nominated in this scholarship.`);
      } else {
        toast.error('No students were assigned.');
      }
    } catch (err: any) {
      console.error('Failed to import students:', err);
      toast.error(`Failed to import students: ${err?.message || 'Database error'}`);
    } finally {
      setImporting(false);
    }
  };

  const handleRemove = async (nomineeId: string) => {
    try {
      await removeNominee(nomineeId);
      toast.success('Nominee removed.');
    } catch {
      toast.error('Failed to remove nominee.');
    }
  };

  const handlePublish = async () => {
    if (nominees.length === 0) {
      toast.error('Add at least one nominee before publishing.');
      return;
    }
    try {
      await publishScholarship(id);
      toast.success('Scholarship published! SWB members can now vote.');
      router.push(`/admin/scholarships/${id}`);
    } catch {
      toast.error('Failed to publish scholarship.');
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setNewNominee((prev) => ({ ...prev, [field]: value }));
    if (addErrors[field]) setAddErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const isFiltersActive = dbSearch !== '' || selectedCaste !== 'ALL' || selectedPrevSch !== 'ALL' || selectedIncome !== 'ALL';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#7B1436] via-[#63102B] to-[#122147] text-white shadow-xl border border-[#C59048]/40">
        <div>
          <Link 
            href={`/admin/scholarships/${id}`}
            className="inline-flex items-center gap-1.5 text-xs text-[#F3DE98] hover:underline mb-2 font-medium"
          >
            <ArrowLeft size={13} /> Back to Scholarship Docket
          </Link>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Assign Student Nominees
          </h1>
          <p className="text-white/70 text-xs sm:text-sm mt-1">
            Assign deserving candidates from the college student database or add candidates manually.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowDatabaseModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C59048] to-[#E5B568] hover:from-[#B58038] hover:to-[#D5A558] text-[#122147] font-heading font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 group"
          >
            <FileSpreadsheet size={16} />
            <span>Select from Student Database ({databaseStudents.length})</span>
          </button>

          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm"
          >
            <Plus size={16} className="mr-1.5" /> Manual Nominee
          </Button>
        </div>
      </div>

      <Card accent>
        <CardHeader className="bg-[#FAF8F5] border-b border-[#E2D9CE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-[#7B1436]" size={18} />
            <h2 className="font-heading font-bold text-base text-[#7B1436]">
              Assigned Nominees ({nominees.length})
            </h2>
          </div>
          <span className="text-2xs text-slate-500 font-mono">
            Scheme ID: {id}
          </span>
        </CardHeader>
        <CardBody className="p-0">
          <NomineeList
            nominees={nominees}
            loading={loading}
            canRemove
            onRemove={handleRemove}
            onEdit={handleOpenEditModal}
          />
        </CardBody>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF8F5] border-t border-[#E2D9CE]">
          <div className="text-xs text-slate-600">
            {nominees.length === 0 ? (
              <span className="text-amber-700 font-semibold">
                ⚠️ Scheme remains in Draft until at least one candidate is assigned and published.
              </span>
            ) : (
              <span>
                <strong>{nominees.length}</strong> candidates ready for screening committee review.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/admin/scholarships/${id}`}>
              <Button variant="secondary">Keep in Draft</Button>
            </Link>
            <Button
              variant="gold"
              onClick={handlePublish}
              disabled={nominees.length === 0}
              aria-label="Publish scholarship and open for SWB voting"
            >
              Publish &amp; Open Committee Voting →
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* ─── MODAL 1: Enhanced Select From Student Database with Filters & 1-Click Select ─── */}
      {showDatabaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#C59048]/40 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#7B1436] via-[#63102B] to-[#122147] text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <FileSpreadsheet size={20} className="text-[#F3DE98]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
                    Select Students from Database
                    <span className="text-2xs bg-[#C59048]/30 text-[#F3DE98] px-2 py-0.5 rounded-full border border-[#C59048]/40 font-mono">
                      {databaseStudents.length} in registry
                    </span>
                  </h3>
                  <p className="text-white/70 text-xs">
                    Filter by caste, income, or previous scholarship status &bull; Click anywhere on a student card to select
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDatabaseModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="p-4 bg-[#FAF8F5] border-b border-[#E2D9CE] space-y-3 flex-shrink-0">
              
              {/* Row 1: Search and Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Search */}
                <div className="sm:col-span-5 relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={dbSearch}
                    onChange={(e) => setDbSearch(e.target.value)}
                    placeholder="Search by student name, USN, remarks..."
                    className="w-full pl-9 pr-8 py-2 bg-white border border-[#E2D9CE] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                  />
                  {dbSearch && (
                    <button
                      onClick={() => setDbSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Caste Dropdown */}
                <div className="sm:col-span-3">
                  <select
                    value={selectedCaste}
                    onChange={(e) => setSelectedCaste(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-[#E2D9CE] rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                  >
                    <option value="ALL">All Castes / Categories ({databaseStudents.length})</option>
                    {uniqueCastes.map((c) => {
                      const count = databaseStudents.filter((s) => s.caste?.trim().toLowerCase() === c.toLowerCase()).length;
                      return (
                        <option key={c} value={c}>
                          Category: {c} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Previous Scholarship Status */}
                <div className="sm:col-span-2">
                  <select
                    value={selectedPrevSch}
                    onChange={(e) => setSelectedPrevSch(e.target.value as any)}
                    className="w-full py-2 px-2.5 bg-white border border-[#E2D9CE] rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                  >
                    <option value="ALL">All Applicants</option>
                    <option value="FIRST_TIME">First-Time Only</option>
                    <option value="PREV_RECEIVER">Prev. Recipient</option>
                  </select>
                </div>

                {/* Income Filter */}
                <div className="sm:col-span-2">
                  <select
                    value={selectedIncome}
                    onChange={(e) => setSelectedIncome(e.target.value)}
                    className="w-full py-2 px-2.5 bg-white border border-[#E2D9CE] rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7B1436]"
                  >
                    <option value="ALL">All Incomes</option>
                    <option value="100000">&lt; ₹1,00,000</option>
                    <option value="250000">&lt; ₹2,50,000</option>
                    <option value="500000">&lt; ₹5,00,000</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Quick Caste Pills for Single-Click filtering */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-slate-400 font-semibold text-2xs uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Filter size={11} /> Quick Filter:
                </span>
                <button
                  onClick={() => setSelectedCaste('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-2xs font-semibold whitespace-nowrap transition-all ${
                    selectedCaste === 'ALL'
                      ? 'bg-[#7B1436] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-[#E2D9CE] hover:bg-slate-100'
                  }`}
                >
                  All ({databaseStudents.length})
                </button>
                {uniqueCastes.map((c) => {
                  const count = databaseStudents.filter((s) => s.caste?.trim().toLowerCase() === c.toLowerCase()).length;
                  const isActive = selectedCaste.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedCaste(isActive ? 'ALL' : c)}
                      className={`px-2.5 py-1 rounded-lg text-2xs font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-[#C59048] text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-[#E2D9CE] hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      {c} ({count})
                    </button>
                  );
                })}

                {isFiltersActive && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 text-2xs text-[#7B1436] hover:underline font-semibold ml-auto whitespace-nowrap pl-2"
                  >
                    <RotateCcw size={11} /> Reset Filters
                  </button>
                )}
              </div>

              {/* Row 3: Selection Stats & Quick Select All Buttons */}
              <div className="flex items-center justify-between pt-1 text-xs border-t border-[#E2D9CE]/70">
                <span className="text-slate-600">
                  Showing <strong>{filteredDbStudents.length}</strong> matching candidates
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllFiltered}
                    disabled={filteredDbStudents.length === 0}
                    className="inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-md bg-[#7B1436]/10 text-[#7B1436] hover:bg-[#7B1436]/20 transition-colors disabled:opacity-50"
                  >
                    <CheckSquare size={13} />
                    Select All ({filteredDbStudents.length})
                  </button>
                  {selectedStudentUsns.length > 0 && (
                    <button
                      onClick={handleDeselectFiltered}
                      className="inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                    >
                      <Square size={13} />
                      Deselect
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Students List with Single Click Card Selection */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#F8F9FA]">
              {loadingStudents ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Spinner />
                  <p className="text-xs text-slate-500">Loading student registry...</p>
                </div>
              ) : filteredDbStudents.length === 0 ? (
                <div className="text-center py-16 space-y-2 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm font-semibold">No candidates match your current filter</p>
                  <p className="text-xs text-slate-400">
                    Try adjusting your search keyword or clearing the caste / income filters.
                  </p>
                  {isFiltersActive && (
                    <button
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1.5 text-xs text-[#7B1436] font-bold hover:underline mt-2"
                    >
                      <RotateCcw size={13} /> Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredDbStudents.map((s) => {
                    const isSelected = selectedStudentUsns.includes(s.usn);
                    const isAlreadyNominated = nominatedUsns.has(s.usn.toLowerCase().trim());

                    return (
                      <div
                        key={s.id || s.usn}
                        onClick={() => {
                          if (isAlreadyNominated) return;
                          handleToggleSelectStudent(s.usn);
                        }}
                        className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border ${
                          isAlreadyNominated
                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-gradient-to-r from-[#FFF9EE] to-[#FFF3DF] border-[#C59048] shadow-sm ring-1 ring-[#C59048]/50'
                            : 'bg-white border-slate-200 hover:border-[#C59048]/60 hover:shadow-xs'
                        }`}
                      >
                        {/* Left: Checkbox & Student Details */}
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="mt-0.5 sm:mt-0 flex-shrink-0">
                            {isAlreadyNominated ? (
                              <div className="w-5 h-5 rounded-md bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                                <Check size={13} />
                              </div>
                            ) : (
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-[#7B1436] border-[#7B1436] text-white shadow-xs'
                                    : 'border-slate-300 bg-white group-hover:border-[#7B1436]'
                                }`}
                              >
                                {isSelected && <Check size={14} className="stroke-[3]" />}
                              </div>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-heading font-bold text-sm text-slate-900">
                                {s.studentName}
                              </span>
                              <span className="font-mono text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {s.usn}
                              </span>
                              {s.caste && (
                                <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                                  {s.caste}
                                </span>
                              )}
                              {isAlreadyNominated && (
                                <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle size={11} /> Already Nominated
                                </span>
                              )}
                            </div>

                            <p className="text-2xs text-slate-500 line-clamp-1">
                              {s.mobileNo ? `Phone: ${s.mobileNo}` : ''}
                              {s.mobileNo && s.remarks ? ' • ' : ''}
                              {s.remarks ? `Remarks: ${s.remarks}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Right: Income & Scholarship Status */}
                        <div className="mt-2 sm:mt-0 pl-8 sm:pl-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 text-right flex-shrink-0">
                          <span className="font-mono font-bold text-xs sm:text-sm text-[#7B1436]">
                            {formatCurrency(s.income)}
                            <span className="text-3xs text-slate-400 font-sans font-normal ml-1">/ year</span>
                          </span>

                          <div>
                            {s.hasReceivedPreviousYear ? (
                              <span className="inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded bg-amber-100/70 text-amber-900 border border-amber-200">
                                Prev: {s.scholarshipsReceivedPreviousYear || 'Yes'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Sparkles size={11} className="text-emerald-600" /> First-Time Applicant
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer with Confirmation and Assign Button */}
            <div className="px-6 py-4 bg-white border-t border-[#E2D9CE] flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C59048] animate-pulse"></span>
                <span>
                  <strong>{selectedStudentUsns.length}</strong> students selected for this scholarship scheme.
                </span>
                {selectedStudentUsns.length > 0 && (
                  <button
                    onClick={() => setSelectedStudentUsns([])}
                    className="text-2xs text-rose-600 hover:underline font-semibold ml-2"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowDatabaseModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  variant="gold"
                  onClick={handleImportSelectedStudents}
                  disabled={selectedStudentUsns.length === 0 || importing}
                  isLoading={importing}
                  className="font-bold text-xs"
                >
                  Assign {selectedStudentUsns.length} Nominees →
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 2: Add Nominee Manually ─── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Single Nominee Manually"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAdd} isLoading={addLoading}>Add Nominee</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Student Name"
            placeholder="Full name of student"
            value={newNominee.studentName}
            onChange={(e) => handleFieldChange('studentName', e.target.value)}
            error={addErrors.studentName}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="USN / Roll Number"
              placeholder="e.g. 4MW21CS045"
              value={newNominee.rollNumber}
              onChange={(e) => handleFieldChange('rollNumber', e.target.value)}
              error={addErrors.rollNumber}
              required
            />
            <Input
              label="Department"
              placeholder="e.g. CSE / ECE / MBA"
              value={newNominee.department}
              onChange={(e) => handleFieldChange('department', e.target.value)}
              error={addErrors.department}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Degree / Semester"
              placeholder="e.g. B.E / 4th Sem"
              value={newNominee.semester}
              onChange={(e) => handleFieldChange('semester', e.target.value)}
              error={addErrors.semester}
              required
            />
            <Input
              label="Previous Sem Aggregate (%)"
              placeholder="e.g. 78.5 or 8.2"
              value={newNominee.cgpa}
              onChange={(e) => handleFieldChange('cgpa', e.target.value)}
              error={addErrors.cgpa}
              required
            />
          </div>
          <Textarea
            label="Student Profile & Extra Details (Shared with Faculty Evaluators)"
            placeholder="Describe academic track record, accomplishments, reasons for nomination, financial hardship background, leadership or co-curricular record..."
            value={newNominee.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            rows={3}
          />
        </div>
      </Modal>

      {/* ─── MODAL 3: Edit Student Profile & Extra Details ─── */}
      {editingNominee && (
        <Modal
          isOpen={Boolean(editingNominee)}
          onClose={() => setEditingNominee(null)}
          title={`Edit Profile & Extra Details: ${editingNominee.studentName}`}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditingNominee(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} isLoading={editSaving} className="bg-[#7B1436] hover:bg-[#63102B] text-white">
                Save Details for Faculty Review
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
              <Sparkles size={17} className="text-[#C59048] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Shared Directly With Faculty Screening Committee:</strong>
                <span>
                  The extra profile description, achievements, CGPA, and personal background entered here are presented on the faculty voting panel so committee members can make an informed, comprehensive evaluation.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>Student Profile, Background &amp; Extra Details</span>
                <span className="text-3xs text-[#7B1436] font-semibold">Shared with Faculty on Voting Page</span>
              </label>
              <Textarea
                placeholder="Enter rich background details: academic consistency, family economic condition, co-curricular achievements, projects, reasons for nomination, specific hardships..."
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="text-xs font-medium"
              />
              <span className="text-3xs text-slate-500 mt-1 block">
                Visible to all SWB committee members during rating.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="CGPA / Academic Score (out of 10)"
                placeholder="e.g. 8.75"
                value={editForm.cgpa}
                onChange={(e) => setEditForm((prev) => ({ ...prev, cgpa: e.target.value }))}
              />
              <Input
                label="Department / Engineering Branch"
                placeholder="e.g. AI & Data Science (B.E)"
                value={editForm.department}
                onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Degree / Semester"
                placeholder="e.g. Regular B.E / 4th Sem"
                value={editForm.semester}
                onChange={(e) => setEditForm((prev) => ({ ...prev, semester: e.target.value }))}
              />
              <Input
                label="Caste / Category"
                placeholder="e.g. Brahmin, 2A, SC"
                value={editForm.caste}
                onChange={(e) => setEditForm((prev) => ({ ...prev, caste: e.target.value }))}
              />
              <Input
                label="Annual Family Income (₹)"
                placeholder="e.g. 260000"
                value={editForm.income}
                onChange={(e) => setEditForm((prev) => ({ ...prev, income: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Prior Scholarship (if any)"
                placeholder="e.g. None or SSP Merit"
                value={editForm.prevScholarship}
                onChange={(e) => setEditForm((prev) => ({ ...prev, prevScholarship: e.target.value }))}
              />
              <Input
                label="Contact Mobile Number"
                placeholder="e.g. 9876543210"
                value={editForm.mobileNo}
                onChange={(e) => setEditForm((prev) => ({ ...prev, mobileNo: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
