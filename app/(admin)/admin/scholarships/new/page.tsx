'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { createScholarship } from '@/lib/firebase/firestore/scholarships';
import { validateScholarshipForm } from '@/lib/utils/validators';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Sparkles, ArrowRight, Award, CheckCircle, FileText, BookmarkPlus, Plus, Trash2 } from 'lucide-react';
import { ScholarshipCustomField } from '@/types';
import toast from 'react-hot-toast';

export default function NewScholarshipPage() {
  const { user } = useAuthContext();
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    description: '',
    purpose: '',
    eligibilityCriteria: '',
    sponsorName: '',
    sponsorDetails: '',
    amount: '',
    academicYear: '2025–26',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [customFields, setCustomFields] = useState<ScholarshipCustomField[]>([]);

  const handleAddCustomField = () => {
    const newField: ScholarshipCustomField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label: '',
      value: '',
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const handleUpdateCustomField = (fieldId: string, key: 'label' | 'value', text: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, [key]: text } : f))
    );
  };

  const handleRemoveCustomField = (fieldId: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== fieldId));
    toast.success('Field removed');
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Pre-fill with the official SMVITM Merit-Cum-Means Scholarship details
  const handleAutoFillSMVITM = () => {
    setForm({
      title: 'SMVITM Merit-Cum-Means Scholarship for Needy Students',
      description:
        'To recognize, reward and promote academic excellence of needy and deserving regular students of SMVITM. Conferred annually during College Day celebrations with a cash prize of ₹10,000/- per student.',
      purpose:
        'To recognize, reward and promote academic excellence of needy students of SMVITM by mitigating financial hardships and encouraging consistent scholastic achievement.',
      eligibilityCriteria: `ELIGIBILITY CRITERIA:
1. Should be a regular student of B.E / MBA.
2. Should have cleared all subjects of previous semester B.E or PUC in first attempt only and should have a minimum of 75% aggregate marks.
3. The student should have good code of conduct and involvement in college activities.
4. Should have good academic record in SSLC/10th and PUC/12th Standard final examinations.
5. Total family income must be less than Rs. 4,00,000/- (4 Lakhs) per annum.

SELECTION CRITERIA & WEIGHTAGES (OUT OF 100):
• Previous Semester B.E. marks: 60%
• PUC / 12th Standard aggregate marks: 20%
• SSLC / 10th Standard marks: 10%
• Participation in college activities: 10%

SCREENING COMMITTEE:
Comprising Principal, Dean(A), IQAC, HODs, SWO and Management Representative.
Award conferral: Cash prize of Rs. 10,000/- per student during College Day.
Decision of the committee is final.`,
      sponsorName: 'SMVITM College Day Endowment Fund / SSVMET Trust',
      sponsorDetails:
        'Shri Sode Vadiraja Mutt Education Trust (SSVMET), Bantakal, Udupi. Ratified by College Academic & Governing Council.',
      amount: '10000',
      academicYear: '2025–26',
    });
    setErrors({});
    toast.success('Auto-filled with SMVITM Merit-Cum-Means criteria!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateScholarshipForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setSubmitting(true);
    try {
      const cleanCustomFields = customFields.filter(
        (f) => f.label.trim() || f.value.trim()
      );
      const id = await createScholarship({
        title: form.title.trim(),
        description: form.description.trim(),
        purpose: form.purpose.trim(),
        eligibilityCriteria: form.eligibilityCriteria.trim(),
        sponsorName: form.sponsorName.trim(),
        sponsorDetails: form.sponsorDetails.trim(),
        amount: parseFloat(form.amount),
        academicYear: form.academicYear.trim(),
        status: 'draft', // Kept in draft as requested
        swbMemberIds: [],
        createdBy: user?.uid ?? '',
        winnerId: null,
        winnerName: null,
        customFields: cleanCustomFields,
      });
      toast.success('Scholarship saved as Draft! Now assign student nominees.');
      router.push(`/admin/scholarships/${id}/nominees`);
    } catch (err) {
      toast.error('Failed to create scholarship. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-fade-in">
      
      {/* ─── Header Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#7B1436] via-[#63102B] to-[#122147] text-white shadow-xl border border-[#C59048]/40">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-[#F3DE98] text-[11px] font-mono mb-2 border border-[#C59048]/30">
            <Sparkles size={12} className="text-[#C59048]" />
            <span>SHREYARTH · NEW SCHEME DRAFT</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Create Scholarship Scheme
          </h1>
          <p className="text-white/70 text-xs sm:text-sm mt-1">
            Define scheme objectives, weightages, and grant purse. Stored as <strong>Draft</strong> for nominee assignment.
          </p>
        </div>

        {/* 1-Click Pre-fill Button */}
        <button
          type="button"
          onClick={handleAutoFillSMVITM}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C59048] to-[#E5B568] hover:from-[#B58038] hover:to-[#D5A558] text-[#122147] font-heading font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex-shrink-0"
        >
          <Sparkles size={15} />
          <span>Auto-Fill SMVITM Scheme</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Core Details */}
        <Card accent>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="text-[#7B1436]" size={18} />
              <h2 className="font-heading font-bold text-[#7B1436] text-base">
                1. Scholarship Objectives &amp; Description
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Scholarship Title"
              placeholder="e.g. SMVITM Merit-Cum-Means Scholarship for Needy Students"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={errors.title}
              required
            />
            <Textarea
              label="Brief Overview / Description"
              placeholder="Brief description of the scholarship and award occasion..."
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              error={errors.description}
              required
              rows={3}
            />
            <Textarea
              label="Core Objective / Purpose"
              placeholder="To recognize, reward and promote academic excellence of needy students..."
              value={form.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              error={errors.purpose}
              required
              rows={2}
            />
          </CardBody>
        </Card>

        {/* Section 2: Eligibility & Selection Weightages */}
        <Card accent>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-[#C59048]" size={18} />
              <h2 className="font-heading font-bold text-[#7B1436] text-base">
                2. Eligibility Criteria &amp; Selection Weightages
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Textarea
              label="Eligibility Rules & Screening Weightages"
              placeholder="1. Regular B.E/MBA student...
2. Minimum 75% marks in first attempt...
3. Family income < Rs. 4 Lakhs...

Weightages:
Previous Sem: 60%, PUC: 20%, SSLC: 10%, Activities: 10%"
              value={form.eligibilityCriteria}
              onChange={(e) => handleChange('eligibilityCriteria', e.target.value)}
              error={errors.eligibilityCriteria}
              required
              rows={8}
            />
            <p className="text-2xs text-[#8A7E82] leading-relaxed">
              Tip: Include minimum marks (e.g. 75%), annual family income ceiling (e.g. ₹4,00,000), and weightage formula (60% previous sem + 20% PUC + 10% SSLC + 10% college activities).
            </p>
          </CardBody>
        </Card>

        {/* Section 3: Financial Purse & Sponsor */}
        <Card accent>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="text-[#122147]" size={18} />
              <h2 className="font-heading font-bold text-[#7B1436] text-base">
                3. Financial Grant &amp; Sponsor Details
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Scholarship Cash Award (₹ per student)"
                type="number"
                placeholder="e.g. 10000"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                error={errors.amount}
                required
                min="1"
              />
              <Input
                label="Academic Year"
                placeholder="e.g. 2025–26"
                value={form.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
                error={errors.academicYear}
                required
              />
            </div>

            <Input
              label="Sponsoring Body / Donor Name"
              placeholder="e.g. SMVITM College Day Endowment Fund / SSVMET Trust"
              value={form.sponsorName}
              onChange={(e) => handleChange('sponsorName', e.target.value)}
              error={errors.sponsorName}
              required
            />

            <Textarea
              label="Endowment Background / Governance"
              placeholder="e.g. Shri Sode Vadiraja Mutt Education Trust (SSVMET). Decision of committee is final."
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
                  4. Custom Fields &amp; Extra Criteria (Add / Remove)
                </h2>
                <p className="text-2xs text-[#8A7E82]">
                  Add or remove custom fields (e.g. Attendance Requirement, Document Checklist, Category Quota)
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
              <Plus size={14} /> Add Custom Field
            </Button>
          </CardHeader>

          <CardBody className="space-y-4">
            {customFields.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF8F5] rounded-xl border border-dashed border-[#C59048]/40 space-y-2">
                <Sparkles size={24} className="text-[#C59048] mx-auto opacity-70" />
                <p className="text-xs font-semibold text-smvitm-text">No Custom Fields Added Yet</p>
                <p className="text-2xs text-smvitm-textSecondary max-w-sm mx-auto">
                  Click <strong>&quot;Add Custom Field&quot;</strong> above to create custom criteria like minimum attendance, specific document requirements, or special quota guidelines.
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
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF8F5] border-t border-[#E2D9CE]">
            <div className="flex items-center gap-2 text-xs text-[#7B1436]">
              <BookmarkPlus size={15} className="text-[#C59048]" />
              <span>Will be saved in <strong>Draft Status</strong> so you can assign student nominees.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="secondary" type="button" onClick={() => router.back()} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting} className="flex-1 sm:flex-none bg-[#7B1436] hover:bg-[#63102B] text-white">
                Save Draft &amp; Assign Nominees →
              </Button>
            </div>
          </CardFooter>
        </Card>

      </form>
    </div>
  );
}
