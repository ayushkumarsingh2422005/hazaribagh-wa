import { Suspense } from 'react';
import { hasUsers } from '../actions/auth';
import LoginForm from './LoginForm';

export default async function LoginPage() {
    const isSetupRequired = !(await hasUsers());

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'var(--canvas)' }}
        >
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-blue-500/15 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/15 blur-[120px]" />
                <div
                    className="absolute inset-y-0 left-0 w-1/3 opacity-90 hidden lg:block"
                    style={{ background: 'linear-gradient(180deg, var(--sidebar-bg) 0%, var(--sidebar-bg-deep) 100%)' }}
                />
            </div>

            <div className="relative z-10 w-full flex justify-center">
                <Suspense fallback={null}>
                    <LoginForm isSetupRequired={isSetupRequired} />
                </Suspense>
            </div>
        </div>
    );
}
