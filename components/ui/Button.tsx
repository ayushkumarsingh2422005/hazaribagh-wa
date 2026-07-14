import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl',
};

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    className = '',
    ...props
}: ButtonProps) {
    const baseStyles =
        'relative inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary:
            size === 'lg'
                ? 'text-white bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:ring-indigo-500 shadow-lg shadow-indigo-500/30'
                : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
        secondary:
            size === 'lg'
                ? 'text-indigo-600 bg-white border-2 border-indigo-50 hover:bg-slate-50 focus:ring-indigo-500'
                : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-indigo-500',
        danger:
            size === 'lg'
                ? 'text-white bg-linear-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 focus:ring-red-500 shadow-lg shadow-red-500/30'
                : 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
    };

    return (
        <button
            className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : null}
            <span className="relative">{children}</span>
        </button>
    );
}
