'use client';

import React, { useId } from 'react';
import { TEXTAREA_CLASS } from './field-styles';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
    fieldSize?: 'default' | 'compact';
}

const sizeClasses = {
    default: 'px-4 py-3 rounded-xl min-h-[80px]',
    compact: 'px-3 py-2 text-sm rounded-lg min-h-[72px]',
};

export function Textarea({ label, error, hint, className = '', id, fieldSize = 'compact', ...props }: TextareaProps) {
    const autoId = useId();
    const fieldId = id || autoId;

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && (
                <label htmlFor={fieldId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                </label>
            )}
            <textarea
                id={fieldId}
                className={`border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors resize-y ${sizeClasses[fieldSize]} ${
                    error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''
                } ${className}`}
                {...props}
            />
            {hint && !error && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

export { TEXTAREA_CLASS };
