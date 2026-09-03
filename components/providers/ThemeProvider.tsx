'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'hazaribagh-theme';

type ThemeContextValue = {
    theme: ThemeMode;
    resolved: 'light' | 'dark';
    setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemDark(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyDomTheme(mode: ThemeMode) {
    const root = document.documentElement;
    const dark = mode === 'dark' || (mode === 'system' && getSystemDark());
    root.classList.toggle('dark', dark);
    root.dataset.theme = dark ? 'dark' : 'light';
    root.style.colorScheme = dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('system');
    const [resolved, setResolved] = useState<'light' | 'dark'>('light');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        const initial: ThemeMode =
            stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
        setThemeState(initial);
        applyDomTheme(initial);
        setResolved(initial === 'dark' || (initial === 'system' && getSystemDark()) ? 'dark' : 'light');
        setReady(true);
    }, []);

    useEffect(() => {
        if (!ready) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => {
            if (theme === 'system') {
                applyDomTheme('system');
                setResolved(getSystemDark() ? 'dark' : 'light');
            }
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [theme, ready]);

    const setTheme = useCallback((mode: ThemeMode) => {
        setThemeState(mode);
        localStorage.setItem(STORAGE_KEY, mode);
        applyDomTheme(mode);
        setResolved(mode === 'dark' || (mode === 'system' && getSystemDark()) ? 'dark' : 'light');
    }, []);

    const value = useMemo(
        () => ({ theme, resolved, setTheme }),
        [theme, resolved, setTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return ctx;
}
