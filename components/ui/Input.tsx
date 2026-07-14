'use client';

import React, { useId } from 'react';
import { FIELD_CLASS } from './field-styles';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    hint?: string;
    fieldSize?: 'default' | 'compact';
}

const sizeClasses = {
    default: 'px-4 py-3 rounded-xl',
    compact: 'px-3 py-2 text-sm rounded-lg',
};

export function Input({ label, error, hint, className = '', id, fieldSize = 'compact', ...props }: InputProps) {
    const autoId = useId();
    const fieldId = id || autoId;

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && (
                <label htmlFor={fieldId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                </label>
            )}
            <input
                id={fieldId}
                className={`border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors ${sizeClasses[fieldSize]} ${
                    error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''
                } ${className}`}
                {...props}
            />
            {hint && !error && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

export { FIELD_CLASS };
