import { Timestamp } from 'firebase/firestore';
import { UserRole, ScholarshipStatus } from '@/types';

export function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts) return '—';
  const date = ts.toDate();
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRole(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Administrator',
    swb_member: 'SWB Member',
    student: 'Student',
  };
  return labels[role];
}

export function formatStatus(status: ScholarshipStatus): string {
  const labels: Record<ScholarshipStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    voting_open: 'Voting Open',
    closed: 'Closed',
  };
  return labels[status];
}

export function formatDateTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '—';
  const date = ts.toDate();
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
