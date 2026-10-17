import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Copilot from '@/components/Copilot';
import CommandPalette from '@/components/CommandPalette';

export const metadata: Metadata = {
  title: 'GridPulse AI — Short-Term Load Forecasting',
  description: 'AI-Based Short-Term Load Forecasting for Renewable Integrated Power System (Next.js 15 + FastAPI + TensorFlow)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070B14] text-[#F8FAFC] antialiased">
        <Sidebar />
        <div className="app-frame flex min-h-screen flex-col">
          <Navbar />
          <main className="app-main ml-0 flex-1 p-4 sm:p-6 md:ml-64 lg:p-8">
            {children}
          </main>
        </div>
        <Copilot />
        <CommandPalette />
      </body>
    </html>
  );
}
