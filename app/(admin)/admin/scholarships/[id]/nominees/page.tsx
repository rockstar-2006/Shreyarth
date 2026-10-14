'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNominees } from '@/lib/hooks/useNominees';
import { addNominee, removeNominee } from '@/lib/firebase/firestore/nominees';
import { publishScholarship } from '@/lib/firebase/firestore/scholarships';
import { NomineeList } from '@/components/scholarship/NomineeList';
import { Card, CardBody, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NomineesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { nominees, loading } = useNominees(id);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newNominee, setNewNominee] = useState({
    studentName: '',
    rollNumber: '',
    department: '',
    semester: '',
    cgpa: '',
    studentId: '',
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  const handleAdd = async () => {
    const errs: Record<string, string> = {};
    if (!newNominee.studentName.trim()) errs.studentName = 'Name is required';
    if (!newNominee.rollNumber.trim()) errs.rollNumber = 'Roll number is required';
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
      });
      toast.success('Nominee added!');
      setShowAddModal(false);
      setNewNominee({ studentName: '', rollNumber: '', department: '', semester: '', cgpa: '', studentId: '' });
      setAddErrors({});
    } catch {
      toast.error('Failed to add nominee.');
    } finally {
      setAddLoading(false);
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/scholarships/${id}`}>
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <h1 className="font-heading text-2xl font-bold text-smvitm-maroon flex-1">Manage Nominees</h1>
        <Button onClick={() => setShowAddModal(true)}>+ Add Nominee</Button>
      </div>

      <Card accent>
        <CardHeader>
          <h2 className="font-semibold text-smvitm-maroon">Nominated Students ({nominees.length})</h2>
        </CardHeader>
        <CardBody>
          <NomineeList
            nominees={nominees}
            loading={loading}
            canRemove
            onRemove={handleRemove}
          />
        </CardBody>
        <CardFooter className="flex justify-end gap-3">
          <Button
            variant="gold"
            onClick={handlePublish}
            disabled={nominees.length === 0}
            aria-label="Publish scholarship and open for SWB voting"
          >
            Publish Scholarship
          </Button>
        </CardFooter>
      </Card>

      {/* Add Nominee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Nominee"
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
            placeholder="Full name"
            value={newNominee.studentName}
            onChange={(e) => handleFieldChange('studentName', e.target.value)}
            error={addErrors.studentName}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Roll Number"
              placeholder="e.g. 4SB21CS001"
              value={newNominee.rollNumber}
              onChange={(e) => handleFieldChange('rollNumber', e.target.value)}
              error={addErrors.rollNumber}
              required
            />
            <Input
              label="Department"
              placeholder="e.g. CSE, ECE"
              value={newNominee.department}
              onChange={(e) => handleFieldChange('department', e.target.value)}
              error={addErrors.department}
              required
            />
            <Input
              label="Semester"
              placeholder="e.g. 6"
              value={newNominee.semester}
              onChange={(e) => handleFieldChange('semester', e.target.value)}
              error={addErrors.semester}
              required
            />
            <Input
              label="CGPA"
              type="number"
              placeholder="e.g. 8.5"
              value={newNominee.cgpa}
              onChange={(e) => handleFieldChange('cgpa', e.target.value)}
              error={addErrors.cgpa}
              min="0"
              max="10"
              step="0.01"
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
