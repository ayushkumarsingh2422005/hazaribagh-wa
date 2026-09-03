import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Terms of Service | Hazaribagh Police — WhatsApp & Saathi App',
    description:
        'Terms of Service for Hazaribagh Police WhatsApp Assistant and Hazaribagh Saathi mobile app.',
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="bg-slate-800 text-white py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
                            📋
                        </span>
                        <span className="text-slate-300 text-sm font-semibold uppercase tracking-widest">
                            Legal
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
                    <p className="text-slate-300 text-base">
                        Last updated: September 3, 2026
                    </p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-12">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-8 space-y-8">

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            By accessing or using the <strong>Hazaribagh Police WhatsApp Assistant</strong> or the <strong>Hazaribagh Saathi</strong> mobile app (Android package <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm">com.digicraft.HazariBaghsaathi</code>) (together, &ldquo;the Services&rdquo;), you agree to these Terms of Service. If you do not agree, discontinue use immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Description of Service</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            The Services are citizen channels operated for Hazaribagh Police that allow you to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 mt-3">
                            <li>File complaints and inquiries with Hazaribagh Police (via WhatsApp or the Saathi app).</li>
                            <li>Access information about police stations, emergency contacts, and traffic regulations.</li>
                            <li>Use GPS to find the nearest police station (Saathi app).</li>
                            <li>Attach optional photos to certain reports (Saathi app).</li>
                            <li>Track submission status in &ldquo;My Activities&rdquo; (Saathi app).</li>
                            <li>Receive OTP login via WhatsApp for the Saathi app.</li>
                            <li>Submit feedback and suggestions.</li>
                        </ul>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
                            The Services supplement, not replace, direct contact with law enforcement. For emergencies, always call <strong>112</strong> (National Emergency) or your local control room.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Eligibility</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            You must be at least 18 years old to use the Services, or use them under the supervision of a parent or legal guardian.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Account &amp; Login (Saathi App)</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            The Saathi app requires login with a mobile number. A one-time password (OTP) is sent via WhatsApp. You are responsible for keeping your device secure and not sharing OTPs. We may suspend access if we detect misuse or fraud.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Acceptable Use</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                            You agree <strong>not</strong> to use the Services to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                            <li>Submit false, misleading, or fraudulent complaints or information.</li>
                            <li>Harass, threaten, or abuse police personnel or other individuals.</li>
                            <li>Attempt to disrupt, overload, or hack the Services.</li>
                            <li>Use unauthorised automated bots or scripts.</li>
                            <li>Violate any applicable law or regulation.</li>
                            <li>Impersonate any person or entity, including law enforcement officials.</li>
                        </ul>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
                            Misuse may result in your number being blocked and, where applicable, legal action.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Accuracy of Information</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            The Services are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. Hazaribagh Police does not warrant completeness, accuracy, reliability, or timeliness of all information. Always verify critical information through official channels.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. Intellectual Property</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Content, design, and technology of the Services are the property of Hazaribagh Police or its licensors (including technology partners such as DigiCraft Innovation Pvt. Ltd.) and are protected by applicable law. You may not reproduce or create derivative works without written permission.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">8. Privacy</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            Your use is also governed by our{' '}
                            <Link href="/privacy-policy" className="text-indigo-600 dark:text-indigo-400 underline hover:no-underline">
                                Privacy Policy
                            </Link>
                            , including how location, photos, and OTP login are handled in the Saathi app.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">9. Limitation of Liability</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            To the fullest extent permitted by law, Hazaribagh Police and its officers, employees, and agents shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the Services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">10. Modifications</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            We may modify, suspend, or discontinue the Services (or any part) at any time without notice. Continued use after Terms updates constitutes acceptance of the new Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">11. Governing Law</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            These Terms are governed by the laws of <strong>India</strong>, including the Information Technology Act, 2000. Disputes are subject to the exclusive jurisdiction of the courts of Hazaribagh, Jharkhand.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">12. Contact Us</h2>
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 space-y-1">
                            <p><strong>Hazaribagh Police</strong></p>
                            <p>Hazaribagh, Jharkhand, India</p>
                            <p>Email: <a href="mailto:sp-hazaribagh@jhpolice.gov.in" className="text-indigo-600 dark:text-indigo-400 underline">sp-hazaribagh@jhpolice.gov.in</a></p>
                        </div>
                    </section>
                </div>

                <div className="flex flex-wrap gap-4 justify-center mt-8 text-sm text-slate-500 dark:text-slate-400">
                    <Link href="/privacy-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <Link href="/data-deletion" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">User Data Deletion</Link>
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
