import type { Metadata } from 'next';
import Link from 'next/link';
import DataDeletionForm from './DataDeletionForm';

export const metadata: Metadata = {
    title: 'User Data Deletion | Hazaribagh Police — WhatsApp & Saathi App',
    description:
        'Request deletion of personal data collected by Hazaribagh Police WhatsApp Assistant and Hazaribagh Saathi mobile app.',
};

export default function DataDeletionPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="bg-red-700 text-white py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
                            🗑️
                        </span>
                        <span className="text-red-200 text-sm font-semibold uppercase tracking-widest">
                            Legal · Your Rights
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">User Data Deletion</h1>
                    <p className="text-red-200 text-base">
                        Request deletion of data from WhatsApp Assistant or Hazaribagh Saathi app.
                    </p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-8 space-y-6">

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">What Data We Hold</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            When you use the <strong>Hazaribagh Police WhatsApp Assistant</strong> or the <strong>Hazaribagh Saathi</strong> mobile app (<code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm">com.digicraft.HazariBaghsaathi</code>), we may store:
                        </p>
                        <ul className="mt-3 list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                            <li>Your mobile / WhatsApp phone number</li>
                            <li>OTP / login session records for the Saathi app</li>
                            <li>Chat history and conversation logs (WhatsApp)</li>
                            <li>Complaints and forms submitted via WhatsApp or Saathi</li>
                            <li>Optional location used for nearest police station</li>
                            <li>Optional photos attached to reports</li>
                            <li>Reviews and feedback</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Your Right to Deletion</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Under applicable data protection laws, you may request that we delete your personal data. Upon a valid request, we will typically:
                        </p>
                        <ul className="mt-3 list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                            <li>Delete chat history and conversation records linked to your number.</li>
                            <li>Remove or anonymise your phone number and Saathi app profile / session data.</li>
                            <li>Delete reviews or feedback linked to your account where possible.</li>
                        </ul>
                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                            <p className="text-amber-800 dark:text-amber-200 text-sm">
                                <strong>⚠ Please note:</strong> Complaints formally registered with Hazaribagh Police may need to be retained for legal and administrative purposes. We will inform you if any data must be retained.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">How to Request Deletion</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                            Submit your deletion request using the form below. Provide the same mobile number used for WhatsApp or Saathi login (international format, e.g.{' '}
                            <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm">+919876543210</code>
                            ). We aim to process requests within <strong>30 days</strong>.
                        </p>
                        <DataDeletionForm />
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Alternative: Email Request</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            You may also email:
                        </p>
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 space-y-1">
                            <p><strong>Hazaribagh Police Data Officer</strong></p>
                            <p>Email: <a href="mailto:sp-hazaribagh@jhpolice.gov.in" className="text-red-600 dark:text-red-400 underline">sp-hazaribagh@jhpolice.gov.in</a></p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                Subject line: <em>Data Deletion Request – [Your Phone Number] – Saathi / WhatsApp</em>
                            </p>
                        </div>
                    </section>
                </div>

                <div className="flex flex-wrap gap-4 justify-center text-sm text-slate-500 dark:text-slate-400">
                    <Link href="/privacy-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <Link href="/terms-of-service" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Dashboard</Link>
                </div>
                <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-600">
                    Powered by{' '}
                    <a href="https://digicraft.one" target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 dark:hover:text-slate-500 transition-colors">
                        DigiCraft Innovation Pvt. Ltd.
                    </a>
                </p>
            </main>
        </div>
    );
}
