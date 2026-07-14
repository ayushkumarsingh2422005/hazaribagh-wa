'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
    id: number;
    type: ToastType;
    message: string;
};

type ToastContextValue = {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback(
        (message: string, type: ToastType = 'info') => {
            const id = ++toastId;
            setToasts(prev => [...prev, { id, type, message }]);
            setTimeout(() => dismiss(id), 4500);
        },
        [dismiss]
    );

    const value: ToastContextValue = {
        toast: addToast,
        success: (m) => addToast(m, 'success'),
        error: (m) => addToast(m, 'error'),
        info: (m) => addToast(m, 'info'),
    };

    const styles: Record<ToastType, string> = {
        success: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
        error: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        info: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200',
    };

    const icons: Record<ToastType, typeof CheckCircle2> = {
        success: CheckCircle2,
        error: XCircle,
        info: Info,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
                aria-live="polite"
            >
                {toasts.map(t => {
                    const Icon = icons[t.type];
                    return (
                        <div
                            key={t.id}
                            className={`pointer-events-auto flex items-start gap-3 p-4 border shadow-lg rounded-lg text-sm ${styles[t.type]}`}
                            role="status"
                        >
                            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="flex-1">{t.message}</p>
                            <button
                                type="button"
                                onClick={() => dismiss(t.id)}
                                className="shrink-0 opacity-60 hover:opacity-100"
                                aria-label="Dismiss"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return ctx;
}
