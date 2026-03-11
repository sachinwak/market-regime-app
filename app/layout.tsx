import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Market Regime Detector — Daily Pre-Market Analysis',
  description: 'Daily market regime detection system for Indian traders. Classify each day as Trend, Range, or Trap in 10–15 minutes before market open.',
  keywords: 'Indian stock market, Nifty, market regime, pre-market analysis, FII DII, India VIX, option chain, PCR',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
