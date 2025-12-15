import React from 'react';

interface ResumeInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    helperText?: string;
    onError?: (message: string) => void;
    disabled?: boolean;
}

export const ResumeInput: React.FC<ResumeInputProps> = ({
    label,
    value,
    onChange,
    placeholder,
    helperText,
    disabled
}) => {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {label}
                </label>
                {value.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono">
                        {value.length} chars
                    </span>
                )}
            </div>

            <div className="flex-grow relative">
                <textarea
                    className="w-full h-full p-4 resize-none outline-none text-sm text-slate-800 dark:text-slate-200 bg-transparent font-mono leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    spellCheck={false}
                />
            </div>

            {helperText && (
                <div className="bg-slate-50 dark:bg-slate-800/30 px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {helperText}
                    </p>
                </div>
            )}
        </div>
    );
};
