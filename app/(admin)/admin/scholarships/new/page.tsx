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
    academicYear: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
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
      const id = await createScholarship({
        title: form.title.trim(),
        description: form.description.trim(),
        purpose: form.purpose.trim(),
        eligibilityCriteria: form.eligibilityCriteria.trim(),
        sponsorName: form.sponsorName.trim(),
        sponsorDetails: form.sponsorDetails.trim(),
        amount: parseFloat(form.amount),
        academicYear: form.academicYear.trim(),
        status: 'draft',
        swbMemberIds: [],
        createdBy: user?.uid ?? '',
        winnerId: null,
        winnerName: null,
      });
      toast.success('Scholarship created! Now add nominees.');
      router.push(`/admin/scholarships/${id}/nominees`);
    } catch (err) {
      toast.error('Failed to create scholarship. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-2xl font-bold text-smvitm-maroon mb-6">
        Create New Scholarship
      </h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-smvitm-maroon">Scholarship Details</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Scholarship Title"
              placeholder="e.g. Academic Excellence Award 2024–25"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={errors.title}
              required
            />
            <Textarea
              label="Description"
              placeholder="Brief description of the scholarship"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              error={errors.description}
              required
              rows={3}
            />
            <Textarea
              label="Purpose"
              placeholder="What is the purpose of this scholarship?"
              value={form.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              error={errors.purpose}
              required
              rows={3}
            />
            <Textarea
              label="Eligibility Criteria"
              placeholder="Who is eligible? Min CGPA, department, year, etc."
              value={form.eligibilityCriteria}
              onChange={(e) => handleChange('eligibilityCriteria', e.target.value)}
              error={errors.eligibilityCriteria}
              required
              rows={4}
            />
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <h2 className="font-semibold text-smvitm-maroon">Sponsor &amp; Amount</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Sponsor Name"
              placeholder="Name of the well-wisher / sponsor"
              value={form.sponsorName}
              onChange={(e) => handleChange('sponsorName', e.target.value)}
              error={errors.sponsorName}
              required
            />
            <Textarea
              label="Sponsor Details"
              placeholder="Additional details about the sponsor (optional)"
              value={form.sponsorDetails}
              onChange={(e) => handleChange('sponsorDetails', e.target.value)}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Scholarship Amount (₹)"
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
                placeholder="e.g. 2024–25"
                value={form.academicYear}
                onChange={(e) => handleChange('academicYear', e.target.value)}
                error={errors.academicYear}
                required
              />
            </div>
          </CardBody>
          <CardFooter className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create &amp; Add Nominees →
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
