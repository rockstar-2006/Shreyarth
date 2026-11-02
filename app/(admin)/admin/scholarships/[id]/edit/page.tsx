'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getScholarship, updateScholarship } from '@/lib/firebase/firestore/scholarships';
import { Scholarship, ScholarshipCustomField, ScholarshipStatus } from '@/types';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { TableSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  Award, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle,
  Building2,
} from 'lucide-react';

export default function EditScholarshipPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    purpose: '',
    eligibilityCriteria: '',
    sponsorName: '',
    sponsorDetails: '',
    amount: '',
    academicYear: '',
    status: 'draft' as ScholarshipStatus,
  });

  // Dynamic Custom Fields
  const [customFields, setCustomFields] = useState<ScholarshipCustomField[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    getScholarship(id).then((s) => {
      if (s) {
        setScholarship(s);
        setForm({
          title: s.title || '',
          description: s.description || '',
          purpose: s.purpose || '',
          eligibilityCriteria: s.eligibilityCriteria || '',
          sponsorName: s.sponsorName || '',
          sponsorDetails: s.sponsorDetails || '',
          amount: String(s.amount || ''),
          academicYear: s.academicYear || '',
          status: s.status || 'draft',
        });
        setCustomFields(s.customFields || []);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      toast.error('Failed to load scholarship details');
      setLoading(false);
    });
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Add Dynamic Field
  const handleAddCustomField = () => {
    const newField: ScholarshipCustomField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label: '',
      value: '',
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  // Update Dynamic Field
  const handleUpdateCustomField = (fieldId: string, key: 'label' | 'value', text: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, [key]: text } : f))
    );
  };

  // Remove Dynamic Field
  const handleRemoveCustomField = (fieldId: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== fieldId));
    toast.success('Field removed');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errs.amount = 'Valid grant amount is required';
    }
    if (!form.academicYear.trim()) errs.academicYear = 'Academic year is required';
    if (!form.eligibilityCriteria.trim()) errs.eligibilityCriteria = 'Eligibility criteria is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Please resolve the highlighted form errors.');
      return;
    }

    setSaving(true);
    try {
      // Filter out empty custom fields
      const cleanCustomFields = customFields.filter(
        (f) => f.label.trim() || f.value.trim()
      );

      await updateScholarship(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        purpose: form.purpose.trim(),
        eligibilityCriteria: form.eligibilityCriteria.trim(),
        sponsorName: form.sponsorName.trim(),
        sponsorDetails: form.sponsorDetails.trim(),
        amount: parseFloat(form.amount),
        academicYear: form.academicYear.trim(),
        status: form.status,
        customFields: cleanCustomFields,
      });

      toast.success('Scholarship scheme updated successfully!');
      router.push(`/admin/scholarships/${id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update scholarship. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <TableSkeleton rows={8} cols={4} />
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 bg-white rounded-2xl border border-[#E2D9CE] p-8">
        <AlertCircle size={44} className="text-[#C59048] mx-auto mb-3" />
        <h2 className="font-heading text-xl font-bold text-smvitm-maroon mb-2">Scheme Not Found</h2>
        <Link href="/admin/scholarships">
          <Button variant="secondary" className="gap-2">
            <ArrowLeft size={16} /> Back to Schemes
          </Button>
        </Link>
      </div>
    );
  }

  const isDraft = scholarship.status === 'draft';
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in">
      
      {/* ─── Breadcrumb / Top Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2D9CE]">
        <Link href={`/admin/scholarships/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-[#7B1436] hover:bg-[#FAF0F3] border border-[#C59048]/30">
            <ArrowLeft size={16} /> Back to Scheme View
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
            Scheme #{id.slice(0, 8)}
          </span>
          <StatusChip status={form.status} />
        </div>
      </div>

      {/* ─── Header Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#7B1436] via-[#63102B] to-[#122147] text-white shadow-xl border border-[#C59048]/40">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-[#F3DE98] text-[11px] font-mono mb-2 border border-[#C59048]/30">
            <Sparkles size={12} className="text-[#C59048]" />
            <span>{isDraft ? 'DRAFT SCHEME EDITING' : 'SCHEME FIELD EDITOR'}</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {isDraft ? 'Edit Draft Scholarship' : 'Edit Scholarship & Fields'}
          </h1>
          <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-xl">
            {isDraft 
              ? 'Modify title, grant value, weightages, or add and remove custom criteria fields before publishing.' 
              : 'Add or remove dynamic fields and update scholarship criteria while scheme is active.'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-[#F3DE98]/30 rounded-xl px-4 py-3 text-center sm:text-right flex-shrink-0">
          <span className="text-[10px] text-[#F3DE98] font-bold uppercase tracking-wider block">
            Status
          </span>
          <span className="font-heading text-lg font-bold text-white capitalize">
            {form.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* ─── Scheme Status Notice ─── */}
      {isDraft ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-amber-700 flex-shrink-0" />
            <span>Currently in <strong>Draft Mode</strong>. You can switch to <strong>Published</strong> whenever ready.</span>
          </div>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, status: 'published' }))}
            className="text-xs font-bold text-[#7B1436] hover:underline flex-shrink-0"
          >
            Mark as Published →
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-700 flex-shrink-0" />
            <span>This scheme is <strong>Published / Active</strong>. All field edits take effect immediately.</span>
          </div>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, status: 'draft' }))}
            className="text-xs font-semibold text-amber-800 hover:underline flex-shrink-0"
          >
            Revert to Draft
          </button>
        </div>
      )}

      {/* ─── Main Edit Form ─── */}
      <form onSubmit={handleSave} className="space-y-6">

        {/* Section 1: Core Details */}
        <Card accent>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="text-[#7B1436]" size={18} />
              <h2 className="font-heading font-bold text-[#7B1436] text-base">
                1. Core Scholarship Information
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Scholarship Title"
              placeholder="e.g. SMVITM Merit-Cum-Means Scholarship"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={errors.title}
              required
            />
            <Textarea
              label="Brief Description / Summary"
              placeholder="Overview of the scholarship..."
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
            <Textarea
              label="Objective & Purpose"
              placeholder="Primary mission and target student group..."
              value={form.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              rows={2}
            />
          </CardBody>
        </Card>

        {/* Section 2: Eligibility Rules */}
        <Card accent>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-[#C59048]" size={18} />
              <h2 className="font-heading font-bold text-[#7B1436] text-base">
                2. Eligibility Rules &amp; Selection Criteria
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Textarea
              label="Full Eligibility & Weightage Criteria"
              value={form.eligibilityCriteria}
              onChange={(e) => handleChange('eligibilityCriteria', e.target.value)}
              error={errors.eligibilityCriteria}
              required
              rows={7}
            />
          </CardBody>
        </Card>

        {/* Section 3: Financial Purse & Donor */}
        <Card accent>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="text-[#122147]" size={18} />
              <h2 className="font-heading font-bold text-[#7B1436] text-base">
                3. Financial Grant &amp; Academic Period
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Grant Cash Amount (₹ per student)"
                type="number"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                error={errors.amount}
                required
                min="1"
              />
              <Input
                label="Academic Year"
                value={form.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
                error={errors.academicYear}
                required
              />
            </div>

            <Input
              label="Sponsoring Organization / Donor"
              value={form.sponsorName}
              onChange={(e) => handleChange('sponsorName', e.target.value)}
            />

            <Textarea
              label="Sponsor Background / Governance"
              value={form.sponsorDetails}
              onChange={(e) => handleChange('sponsorDetails', e.target.value)}
              rows={2}
            />
          </CardBody>
        </Card>

        {/* Section 4: Dynamic Custom Fields (Add / Remove) */}
        <Card accent>
          <CardHeader className="bg-[#FAF8F5] border-b border-[#E2D9CE] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="text-[#7B1436]" size={18} />
              <div>
                <h2 className="font-heading font-bold text-[#7B1436] text-base">
                  4. Custom Fields &amp; Extra Criteria
                </h2>
                <p className="text-2xs text-[#8A7E82]">
                  Add or remove custom fields (e.g. Income Limit, Attendance Requirement, Category Quota, Documents)
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddCustomField}
              className="gap-1.5 border-[#C59048] text-[#7B1436] hover:bg-[#FAF0F3] font-semibold text-xs"
            >
              <Plus size={14} /> Add New Field
            </Button>
          </CardHeader>

          <CardBody className="space-y-4">
            {customFields.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF8F5] rounded-xl border border-dashed border-[#C59048]/40 space-y-2">
                <Sparkles size={24} className="text-[#C59048] mx-auto opacity-70" />
                <p className="text-xs font-semibold text-smvitm-text">No Custom Fields Added Yet</p>
                <p className="text-2xs text-smvitm-textSecondary max-w-sm mx-auto">
                  Click <strong>&quot;Add New Field&quot;</strong> above to create custom criteria like minimum attendance, specific document requirements, or special quota guidelines.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddCustomField}
                  className="text-xs text-[#7B1436] font-semibold hover:bg-white"
                >
                  + Add First Field
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {customFields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E2D9CE] hover:border-[#C59048]/60 transition-all space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-mono font-bold uppercase tracking-wider text-[#C59048]">
                        Custom Field #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(field.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 flex items-center gap-1 text-xs"
                        title="Remove this field"
                      >
                        <Trash2 size={14} />
                        <span className="text-2xs font-medium">Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Field Name / Label
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Minimum Attendance"
                          value={field.label}
                          onChange={(e) => handleUpdateCustomField(field.id, 'label', e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B1436]/20 focus:border-[#7B1436]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Field Value / Criteria Detail
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 85% or above across all subjects in previous semester"
                          value={field.value}
                          onChange={(e) => handleUpdateCustomField(field.id, 'value', e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B1436]/20 focus:border-[#7B1436]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>

          {/* Footer Actions */}
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF8F5] border-t border-[#E2D9CE]">
            <Link href={`/admin/scholarships/${id}`}>
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="submit"
                isLoading={saving}
                className="w-full sm:w-auto bg-[#7B1436] hover:bg-[#63102B] text-white font-semibold gap-2 shadow-sm"
              >
                <Save size={16} /> Save Changes &amp; Fields
              </Button>
            </div>
          </CardFooter>
        </Card>

      </form>
    </div>
  );
}
