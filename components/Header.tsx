'use client';

import { RefreshCw, Clock, TrendingUp, Download } from 'lucide-react';
import { useState } from 'react';

interface Props {
    onRefresh: () => void;
    lastUpdated: Date | null;
}

export default function Header({ onRefresh, lastUpdated }: Props) {
    const [spinning, setSpinning] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const handleRefresh = () => {
        setSpinning(true);
        onRefresh();
        setTimeout(() => setSpinning(false), 1500);
    };

    const handleDownloadPdf = async () => {
        try {
            setDownloading(true);
            const targetElement = document.getElementById('dashboard-main');
            if (!targetElement) {
                console.error('Target element not found');
                return;
            }

            // html-to-image handles SVG filters, Tailwind color mix, and modern CSS much better
            const { toPng } = await import('html-to-image');
            const { jsPDF } = await import('jspdf');

            const width = targetElement.scrollWidth;
            const height = targetElement.scrollHeight;

            // Generate an image with 2x pixel ratio for high-res crisp text
            const dataUrl = await toPng(targetElement, {
                width: width,
                height: height,
                backgroundColor: '#080b14',
                pixelRatio: 2, // High resolution
                style: {
                    margin: '0',
                    padding: '0'
                }
            });

            // Calculate PDF dimensions based on the element
            const pdf = new jsPDF({
                orientation: width > height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [width, height] 
            });

            const now = new Date();
            const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            
            // Add image scaled back to 1x dimensions within the PDF
            pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
            pdf.save(`market-regime-${dateStr}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            window.print();
        } finally {
            setDownloading(false);
        }
    };

    const now = new Date();
    const istTime = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    const istDate = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <header className="mb-8">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                            <TrendingUp size={16} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Market Regime</h1>
                        <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Detector</span>
                    </div>
                    <p className="text-slate-400 text-sm ml-10">Daily pre-market analysis • 10–15 min morning ritual for Indian traders</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={downloading}
                            className={`flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl text-sm text-slate-300 transition-all duration-200 ${downloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Download size={14} className={downloading ? 'animate-bounce' : ''} />
                            {downloading ? 'PDF...' : 'Download PDF'}
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl text-sm text-slate-300 transition-all duration-200"
                        >
                            <RefreshCw size={14} className={spinning ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={10} />
                        <span>{istTime} IST • {istDate}</span>
                    </div>
                    {lastUpdated && (
                        <p className="text-xs text-slate-600">
                            Updated: {lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    )}
                </div>
            </div>
        </header>
    );
}
