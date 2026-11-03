'use client';

import { useState, useEffect, useRef } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { createUserProfile, listUsers, saveCommitteeMembersBulk } from '@/lib/firebase/firestore/users';
import { 
  parseCommitteeExcelFile, 
  downloadCommitteeSampleTemplate, 
  ParsedCommitteeMember 
} from '@/lib/utils/excelParser';
import { UserProfile, UserRole } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { validateEmail } from '@/lib/utils/validators';
import toast from 'react-hot-toast';
import { 
  UserPlus, 
  Upload, 
  Download, 
  Phone, 
  Mail, 
  CheckCircle, 
  FileSpreadsheet, 
  X, 
  Users, 
  Sparkles,
  ShieldCheck 
} from 'lucide-react';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'swb_member', label: 'SWB Committee Member' },
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Excel Committee Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewMembers, setPreviewMembers] = useState<ParsedCommitteeMember[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSavingExcel, setIsSavingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'swb_member' as UserRole,
    department: '',
    designation: '',
    contactNumber: '',
    rollNumber: '',
    employeeId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadUsers(); 
  }, []);

  // Handle Committee Excel File Selection
  const handleExcelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setIsParsing(true);
    try {
      const parsed = await parseCommitteeExcelFile(file);
      if (parsed.length === 0) {
        toast.error('No valid committee members found in the uploaded file.');
        setUploadFile(null);
        setPreviewMembers([]);
      } else {
        setPreviewMembers(parsed);
        toast.success(`Detected ${parsed.length} committee members from ${file.name}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse Excel file. Please ensure columns match: Sl No | Name | Designation/Department | Mail Id | Contact Number');
      setUploadFile(null);
      setPreviewMembers([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Commit Committee Excel Members to Database
  const handleSaveCommitteeExcel = async () => {
    if (previewMembers.length === 0) return;
    setIsSavingExcel(true);
    try {
      const res = await saveCommitteeMembersBulk(previewMembers);
      toast.success(`Successfully added ${res.savedCount} Committee Members to Database!`);
      setShowExcelModal(false);
      setUploadFile(null);
      setPreviewMembers([]);
      await loadUsers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save committee members.');
    } finally {
      setIsSavingExcel(false);
    }
  };

  // Manual User Creation
  const handleCreate = async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!validateEmail(form.email)) errs.email = 'Valid email is required';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!form.department.trim()) errs.department = 'Department is required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setCreating(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await createUserProfile({
        uid: credential.user.uid,
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        department: form.department.trim(),
        designation: form.designation.trim() || undefined,
        contactNumber: form.contactNumber.trim() || undefined,
        rollNumber: form.rollNumber.trim() || undefined,
        employeeId: form.employeeId.trim() || undefined,
      });
      toast.success(`User ${form.name} created successfully!`);
      setShowModal(false);
      setForm({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'swb_member', 
        department: '', 
        designation: '', 
        contactNumber: '', 
        rollNumber: '', 
        employeeId: '' 
      });
      setErrors({});
      await loadUsers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const grouped = {
    swb_member: users
      .filter((u) => u.role === 'swb_member')
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    admin: users
      .filter((u) => u.role === 'admin')
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    student: users
      .filter((u) => u.role === 'student')
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in">
      
      {/* ─── Header Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#7B1436] via-[#63102B] to-[#122147] text-white shadow-xl border border-[#C59048]/40">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-[#F3DE98] text-[11px] font-mono mb-2 border border-[#C59048]/30">
            <Sparkles size={12} className="text-[#C59048]" />
            <span>SHREYARTH · COMMITTEE &amp; USERS</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Committee &amp; User Registry
          </h1>
          <p className="text-white/70 text-xs sm:text-sm mt-1">
            Manage Student Welfare Board (SWB) evaluation committee, administrators, and staff credentials.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowExcelModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C59048] to-[#E5B568] hover:from-[#B58038] hover:to-[#D5A558] text-[#122147] font-heading font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 group"
          >
            <Upload size={16} className="group-hover:-translate-y-0.5 transition-transform" />
            <span>Upload Committee Excel</span>
          </button>

          <Button 
            onClick={() => setShowModal(true)} 
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm"
          >
            <UserPlus size={16} className="mr-1.5" /> Add User
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E2D9CE] p-4 shadow-card">
          <TableSkeleton rows={5} cols={5} />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ─── 1. SWB Committee Members (Screening Council) ─── */}
          <Card accent>
            <CardHeader className="bg-[#FAF8F5] border-b border-[#E2D9CE] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="text-[#7B1436]" size={18} />
                <h2 className="font-heading font-bold text-base text-[#7B1436]">
                  Screening Committee &amp; SWB Members
                </h2>
                <Badge variant="gold">{grouped.swb_member.length} Members</Badge>
              </div>

              <button
                onClick={downloadCommitteeSampleTemplate}
                className="text-xs text-[#7B1436] hover:underline font-semibold flex items-center gap-1"
              >
                <Download size={13} /> Sample Template
              </button>
            </CardHeader>

            <CardBody className="p-0">
              {grouped.swb_member.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <FileSpreadsheet size={32} className="text-[#C59048] mx-auto" />
                  <p className="text-sm font-semibold text-smvitm-text">No Committee Members Added Yet</p>
                  <p className="text-xs text-smvitm-textSecondary max-w-sm mx-auto">
                    Upload your committee spreadsheet with columns: <strong>Sl No, Name, Designation/Department, Mail Id, Contact Number</strong>.
                  </p>
                  <Button size="sm" onClick={() => setShowExcelModal(true)}>
                    <Upload size={14} className="mr-1" /> Upload Committee Excel
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-[#FAF8F5] border-b border-[#E2D9CE] text-[#8A7E82] uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-3 px-4 w-12 text-center">Sl No</th>
                        <th className="py-3 px-4 min-w-[180px]">Name</th>
                        <th className="py-3 px-4 min-w-[200px]">Designation / Department</th>
                        <th className="py-3 px-4 min-w-[180px]">Mail Id</th>
                        <th className="py-3 px-4 min-w-[130px]">Contact Number</th>
                        <th className="py-3 px-4 text-center w-20">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D9]">
                      {grouped.swb_member.map((m, idx) => (
                        <tr key={m.uid} className="hover:bg-[#FFFDF9] transition-colors">
                          <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-smvitm-text text-sm block">
                              {m.name}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <span className="font-medium text-[#7B1436] block">
                                {m.designation || 'Committee Member'}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {m.department}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <a
                              href={`mailto:${m.email}`}
                              className="inline-flex items-center gap-1 font-mono text-[#7B1436] hover:underline"
                            >
                              <Mail size={12} className="text-[#C59048]" />
                              <span>{m.email}</span>
                            </a>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {m.contactNumber && m.contactNumber !== '—' ? (
                              <a
                                href={`tel:${m.contactNumber}`}
                                className="inline-flex items-center gap-1 text-slate-700 hover:text-[#7B1436]"
                              >
                                <Phone size={11} className="text-[#C59048]" />
                                <span>{m.contactNumber}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-[#FDF6E7] text-[#C59048] border border-[#C59048]/40 font-semibold text-[10px]">
                              SWB
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* ─── 2. Administrators ─── */}
          <Card accent>
            <CardHeader className="bg-[#FAF8F5] border-b border-[#E2D9CE] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-base text-[#7B1436]">Administrators</h2>
                <Badge variant="default">{grouped.admin.length}</Badge>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#E2D9CE] text-[#8A7E82] uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Mail Id</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-center">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D9]">
                    {grouped.admin.map((u) => (
                      <tr key={u.uid} className="hover:bg-[#FFFDF9] transition-colors">
                        <td className="py-3 px-4 font-semibold text-smvitm-text">{u.name}</td>
                        <td className="py-3 px-4 font-mono text-[#7B1436]">{u.email}</td>
                        <td className="py-3 px-4 text-slate-600">{u.department}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-[#FAF0F3] text-[#7B1436] font-semibold text-[10px] border border-[#7B1436]/20">
                            Admin
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

        </div>
      )}

      {/* ─── MODAL 1: Upload Committee Excel Sheet ─── */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#C59048]/40 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            
            <div className="px-6 py-4 bg-gradient-to-r from-[#7B1436] to-[#5C0F28] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet size={20} className="text-[#F3DE98]" />
                <div>
                  <h3 className="font-heading font-bold text-base leading-tight">
                    Upload Committee Members Excel
                  </h3>
                  <p className="text-white/70 text-xs">
                    Import screening committee list from .xlsx, .xls, or .csv
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowExcelModal(false);
                  setUploadFile(null);
                  setPreviewMembers([]);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Expected Format Box */}
              <div className="p-4 rounded-xl bg-[#FDF6E7] border border-[#C59048]/40 text-xs text-[#7B1436] space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-[#C59048]" />
                  Exact Expected Excel Columns:
                </p>
                <div className="font-mono text-[11px] bg-white/70 p-2.5 rounded border border-[#C59048]/20 overflow-x-auto text-slate-800">
                  Sl No | Name | Designation/Department | Mail Id | Contact Number
                </div>
                <p className="text-2xs text-[#7B1436]/80">
                  Each member will be registered with <strong>SWB Member</strong> role for reviewing and voting on scholarships.
                </p>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-[11px] text-emerald-900 flex items-start gap-1.5 mt-2">
                  <ShieldCheck size={14} className="text-emerald-700 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Google Sign-In Enabled:</strong> Faculty members uploaded here can directly sign in using <strong>&quot;Sign in with Google&quot;</strong> on the login page using the exact email address from the <em>Mail Id</em> column.
                  </span>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#C59048]/60 hover:border-[#7B1436] rounded-xl p-8 text-center cursor-pointer transition-colors bg-[#FAF8F5] hover:bg-[#F5F0E6] space-y-2 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-[#FDF6E7] border border-[#C59048]/30 flex items-center justify-center text-[#C59048] mx-auto group-hover:scale-105 transition-transform">
                  <Upload size={22} />
                </div>
                <p className="font-heading font-bold text-sm text-smvitm-text">
                  {uploadFile ? uploadFile.name : 'Click to select or drag and drop Committee Excel file'}
                </p>
                <p className="text-2xs text-smvitm-textMuted">
                  Supports .xlsx, .xls, and .csv files
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-smvitm-textSecondary">Download pre-formatted spreadsheet:</span>
                <button
                  type="button"
                  onClick={downloadCommitteeSampleTemplate}
                  className="text-[#7B1436] hover:underline font-semibold flex items-center gap-1"
                >
                  <Download size={13} /> Download Committee Template
                </button>
              </div>

              {isParsing && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-[#7B1436] font-semibold">
                  <Spinner />
                  <span>Reading committee spreadsheet...</span>
                </div>
              )}

              {/* Preview Table */}
              {previewMembers.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-smvitm-text">
                    Detected: <strong className="text-emerald-700">{previewMembers.length} Committee Members</strong>
                  </span>
                  <div className="max-h-48 overflow-y-auto border border-[#E2D9CE] rounded-lg">
                    <table className="w-full text-left text-2xs">
                      <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Designation</th>
                          <th className="p-2">Mail Id</th>
                          <th className="p-2">Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewMembers.map((m, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-medium">{m.name}</td>
                            <td className="p-2">{m.designation}</td>
                            <td className="p-2 font-mono text-[#7B1436]">{m.email}</td>
                            <td className="p-2 font-mono">{m.contactNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-[#E2D9CE] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowExcelModal(false);
                  setUploadFile(null);
                  setPreviewMembers([]);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={previewMembers.length === 0 || isSavingExcel}
                onClick={handleSaveCommitteeExcel}
                className="px-5 py-2.5 rounded-lg bg-[#7B1436] hover:bg-[#63102B] disabled:opacity-50 text-white font-semibold text-xs shadow-sm flex items-center gap-2"
              >
                {isSavingExcel ? (
                  <>
                    <Spinner />
                    <span>Saving Members...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={15} />
                    <span>Save {previewMembers.length} Members to Database</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 2: Create User Manually ─── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Single User / Member"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={creating}>Create User</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Thirumaleshwara Bhat"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={errors.name}
            required
          />
          <Input
            label="Mail Id (Email)"
            type="email"
            placeholder="email@smvitm.ac.in"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            error={errors.email}
            required
          />
          <Input
            label="Temporary Password"
            type="password"
            placeholder="Min 8 characters"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            error={errors.password}
            required
          />
          <Select
            label="Role"
            options={roleOptions}
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Designation"
              placeholder="e.g. Principal / HOD"
              value={form.designation}
              onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
            />
            <Input
              label="Department"
              placeholder="e.g. CSE / Administration"
              value={form.department}
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              error={errors.department}
              required
            />
          </div>
          <Input
            label="Contact Number"
            placeholder="e.g. 9845123450"
            value={form.contactNumber}
            onChange={(e) => setForm((p) => ({ ...p, contactNumber: e.target.value }))}
          />
        </div>
      </Modal>

    </div>
  );
}
