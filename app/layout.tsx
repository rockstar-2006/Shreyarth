import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from 'react-hot-toast';

const sans = localFont({
  src: './fonts/GeistVF.woff',
  weight: '100 900',
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'scholarship-smv — SMVITM Scholarship Portal',
  description: 'scholarship-smv — Official scholarship portal of Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM), Bantakal. Empowering student merit with financial resources.',
  keywords: ['scholarship-smv', 'SMVITM', 'scholarship', 'Bantakal', 'Udupi', 'SSVMET'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="bg-smvitm-bg text-smvitm-text font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#1A1A1A',
                border: '1px solid #E8E0D5',
                borderRadius: '10px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#2D7A4F', secondary: '#FFFFFF' } },
              error: { iconTheme: { primary: '#C0392B', secondary: '#FFFFFF' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
