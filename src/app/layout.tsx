import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FincoTech Staff Portal',
  description: 'Staff dashboard for managing applications and operations',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
