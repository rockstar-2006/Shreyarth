import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SMVITM Scholarship Portal',
  description: 'Scholarship management portal for Shri Madhwa Vadiraja Institute of Technology & Management, Bantakal',
  keywords: ['SMVITM', 'scholarship', 'Bantakal', 'Udupi'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
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
