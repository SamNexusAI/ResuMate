import React, { useState } from 'react';
import { OptimizationResult, PlanLevel } from '../types';
import { Button } from './Button';

interface ResumeResultProps {
    result: OptimizationResult;
    onCopy: () => void;
    onReset: () => void;
    userPlan: PlanLevel;
    onUpgrade: () => void;
    onError: (message: string) => void;
}

export const ResumeResult: React.FC<ResumeResultProps> = ({
    result,
    onCopy,
    onReset,
    userPlan,
    onUpgrade,
    onError
}) => {
    const [activeTab, setActiveTab] = useState<'resume' | 'coverLetter' | 'analysis'>('resume');

    const handleCopy = async () => {
        try {
            const content = activeTab === 'resume' ? result.optimizedContent : result.coverLetter || '';
            if (!content) return;
            await navigator.clipboard.writeText(content);
            onCopy();
        } catch (err) {
            onError("Failed to copy to clipboard");
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={onReset} className="text-slate-500">
                        ← Back
                    </Button>
                    <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('resume')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'resume'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Resume
                        </button>
                        {result.coverLetter && (
                            <button
                                onClick={() => setActiveTab('coverLetter')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'coverLetter'
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Cover Letter
                            </button>
                        )}
                        {result.atsScore && (
                            <button
                                onClick={() => setActiveTab('analysis')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'analysis'
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Analysis
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {userPlan === 'free' && (
                        <Button variant="ghost" size="sm" onClick={onUpgrade} className="text-blue-600 hidden md:inline-flex">
                            Unlock Full Features
                        </Button>
                    )}
                    <Button variant="primary" size="sm" onClick={handleCopy}>
                        Copy to Clipboard
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-auto p-6 md:p-10 bg-dot-pattern">
                <div className="max-w-4xl mx-auto bg-white min-h-[800px] shadow-2xl p-12 mb-10 text-slate-900 text-sm leading-relaxed" id="resume-preview">
                    {activeTab === 'analysis' ? (
                        <div className="space-y-6">
                            <div className="text-center py-10">
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-green-500 text-3xl font-bold text-green-600 mb-4">
                                    {result.atsScore}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">ATS Match Score</h3>
                                <p className="text-slate-500 mt-2">Your resume is highly optimized for applicant tracking systems.</p>
                            </div>
                        </div>
                    ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm">{
                            activeTab === 'resume' ? result.optimizedContent : result.coverLetter
                        }</pre>
                    )}
                </div>

                {userPlan === 'free' && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom fade-in duration-500">
                        <span className="text-sm font-medium">This is a free preview. Download disabled.</span>
                        <Button variant="primary" size="xs" onClick={onUpgrade}>Upgrade Now</Button>
                    </div>
                )}
            </div>
        </div>
    );
};
