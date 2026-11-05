import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SHREYARTH — SMVITM Scholarship Application Form',
  description: 'Apply for institutional financial assistance, merit-cum-means aid, and endowed trust scholarships at Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM), Bantakal.',
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
