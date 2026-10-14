'use client';

import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { createUserProfile, listUsers } from '@/lib/firebase/firestore/users';
import { UserProfile, UserRole } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatRole } from '@/lib/utils/formatters';
import { validateEmail } from '@/lib/utils/validators';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'swb_member', label: 'SWB Member' },
  { value: 'admin', label: 'Admin' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as UserRole,
    department: '',
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

  useEffect(() => { loadUsers(); }, []);

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
        rollNumber: form.rollNumber.trim() || undefined,
        employeeId: form.employeeId.trim() || undefined,
      });
      toast.success(`User ${form.name} created successfully!`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'student', department: '', rollNumber: '', employeeId: '' });
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
    admin: users.filter((u) => u.role === 'admin'),
    swb_member: users.filter((u) => u.role === 'swb_member'),
    student: users.filter((u) => u.role === 'student'),
  };

  const badgeVariant = (role: UserRole) => {
    if (role === 'admin') return 'default' as const;
    if (role === 'swb_member') return 'gold' as const;
    return 'secondary' as const;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-smvitm-maroon">User Management</h1>
        <Button onClick={() => setShowModal(true)} aria-label="Create new user">
          <UserPlus size={16} className="mr-2" /> New User
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          {(['admin', 'swb_member', 'student'] as UserRole[]).map((role) => (
            <Card key={role} accent>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-smvitm-maroon">{formatRole(role)}s</h2>
                  <Badge variant={badgeVariant(role)}>{grouped[role].length}</Badge>
                </div>
              </CardHeader>
              <CardBody>
                {grouped[role].length === 0 ? (
                  <p className="text-smvitm-textSecondary text-sm">No {formatRole(role).toLowerCase()}s yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" role="table" aria-label={`${formatRole(role)} users`}>
                      <thead>
                        <tr className="border-b border-smvitm-border">
                          <th scope="col" className="text-left py-2 px-3 text-smvitm-textSecondary font-semibold">Name</th>
                          <th scope="col" className="text-left py-2 px-3 text-smvitm-textSecondary font-semibold">Email</th>
                          <th scope="col" className="text-left py-2 px-3 text-smvitm-textSecondary font-semibold">Department</th>
                          {role === 'student' && <th scope="col" className="text-left py-2 px-3 text-smvitm-textSecondary font-semibold">Roll No.</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {grouped[role].map((u) => (
                          <tr key={u.uid} className="border-b border-smvitm-border/50 hover:bg-smvitm-bg/50">
                            <td className="py-2 px-3 font-medium text-smvitm-text">{u.name}</td>
                            <td className="py-2 px-3 text-smvitm-textSecondary">{u.email}</td>
                            <td className="py-2 px-3 text-smvitm-textSecondary">{u.department}</td>
                            {role === 'student' && <td className="py-2 px-3 text-smvitm-textSecondary">{u.rollNumber ?? '—'}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New User"
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
            placeholder="Student or Member name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            error={errors.name}
            required
          />
          <Input
            label="Email"
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
          <Input
            label="Department"
            placeholder="e.g. CSE, ECE, ME"
            value={form.department}
            onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
            error={errors.department}
            required
          />
          {form.role === 'student' && (
            <Input
              label="Roll Number"
              placeholder="e.g. 4SB21CS001"
              value={form.rollNumber}
              onChange={(e) => setForm((p) => ({ ...p, rollNumber: e.target.value }))}
            />
          )}
          {(form.role === 'swb_member' || form.role === 'admin') && (
            <Input
              label="Employee ID"
              placeholder="Optional"
              value={form.employeeId}
              onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
