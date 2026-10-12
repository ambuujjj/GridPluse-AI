import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

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
      <body className="bg-[#070B14] text-[#F8FAFC] antialiased min-h-screen">
        <Sidebar />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="ml-64 p-8 flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
