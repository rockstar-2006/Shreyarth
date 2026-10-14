export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-smvitm-maroon via-smvitm-maroonDark to-smvitm-maroon flex items-center justify-center p-4">
      {children}
    </main>
  );
}
