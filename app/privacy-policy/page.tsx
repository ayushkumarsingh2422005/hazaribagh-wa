import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Privacy Policy | Hazaribagh Police — WhatsApp & Saathi App',
    description:
        'Privacy Policy for Hazaribagh Police WhatsApp Assistant and Hazaribagh Saathi mobile app — how we collect, use, and protect your information.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="bg-indigo-700 text-white py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
                            🔒
                        </span>
                        <span className="text-indigo-200 text-sm font-semibold uppercase tracking-widest">
                            Legal
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
                    <p className="text-indigo-200 text-base">
                        Last updated: September 3, 2026
                    </p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-12">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-8 space-y-8">

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Introduction</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            This Privacy Policy explains how <strong>Hazaribagh Police</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) collects, uses, discloses, and safeguards your information when you use:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 mt-3">
                            <li>The <strong>Hazaribagh Police WhatsApp Assistant</strong> (WhatsApp Business chatbot).</li>
                            <li>The <strong>Hazaribagh Saathi</strong> mobile application for Android (package: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm">com.digicraft.HazariBaghsaathi</code>), available on Google Play.</li>
                        </ul>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-3">
                            Together these are referred to as the &ldquo;Services&rdquo;. By using either Service, you agree to this Policy. If you do not agree, please discontinue use.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Information We Collect</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                            Depending on how you use the Services, we may collect:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                            <li><strong>Phone Number:</strong> Required for WhatsApp chat and for Saathi app login (OTP verification).</li>
                            <li><strong>OTP / authentication data:</strong> Temporary one-time passwords sent via WhatsApp to verify your identity in the Saathi app.</li>
                            <li><strong>Message &amp; form content:</strong> Complaints, inquiries, suggestions, and other text you submit via WhatsApp or the Saathi app.</li>
                            <li><strong>Complaint details:</strong> Information you voluntarily provide (e.g. description, police station, dates, contact details).</li>
                            <li><strong>Location data:</strong> Approximate or precise location when you use &ldquo;Nearest Police Station&rdquo; in the Saathi app (only with your permission).</li>
                            <li><strong>Photos / images:</strong> Optional images you attach (e.g. missing person or harassment reports) in the Saathi app.</li>
                            <li><strong>Chat history:</strong> Conversation logs with the WhatsApp assistant for context-aware responses.</li>
                            <li><strong>App activity:</strong> Complaint IDs and status so you can track submissions in &ldquo;My Activities&rdquo;.</li>
                            <li><strong>Reviews &amp; feedback:</strong> Ratings or feedback you submit regarding police services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. How We Use Your Information</h2>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                            <li>Provide and operate the WhatsApp Assistant and Hazaribagh Saathi app.</li>
                            <li>Authenticate users (OTP via WhatsApp for Saathi login).</li>
                            <li>Process and respond to complaints and inquiries.</li>
                            <li>Show nearest police station based on location you share.</li>
                            <li>Share relevant information (traffic rules, emergency contacts, station locations).</li>
                            <li>Maintain records for administrative and law-enforcement purposes as permitted by law.</li>
                            <li>Monitor service quality and improve the Services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Sharing of Information</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            We do <strong>not</strong> sell or rent your personal information. We may share information with:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 mt-3">
                            <li><strong>Hazaribagh Police officers</strong> to process complaints and inquiries.</li>
                            <li><strong>WhatsApp / Meta:</strong> Required to deliver chatbot messages and OTP via WhatsApp Business API.</li>
                            <li><strong>Hosting / infrastructure providers</strong> (e.g. cloud hosting) that process data solely to run the Services.</li>
                            <li><strong>Legal authorities:</strong> When required by law, court order, or regulation.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Permissions (Saathi Mobile App)</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                            The Hazaribagh Saathi Android app may request:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                            <li><strong>Internet:</strong> Required for API calls, OTP, and form submission.</li>
                            <li><strong>Location:</strong> Only when you use nearest police station features.</li>
                            <li><strong>Photos / media:</strong> Only when you choose to attach an image to a report.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Data Retention</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            We retain personal information for as long as necessary to fulfil the purposes in this policy, or as required by law. Chat histories and complaint records are generally retained for up to <strong>2 years</strong> after your last interaction, unless longer retention is required for legal or administrative reasons.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. Data Security</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            We use appropriate technical and organisational measures to protect your information. Data in transit is protected using HTTPS. Access to systems is restricted to authorised personnel. No method of transmission or storage is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">8. Your Rights</h2>
                        <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                            <li>Access the personal data we hold about you.</li>
                            <li>Request correction of inaccurate data.</li>
                            <li>Request deletion of your personal data (see our <Link href="/data-deletion" className="text-indigo-600 dark:text-indigo-400 underline hover:no-underline">User Data Deletion</Link> page).</li>
                            <li>Object to or restrict certain processing where applicable law allows.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">9. Third-Party Services</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            OTP delivery and the WhatsApp chatbot use the <strong>WhatsApp Business API</strong> (Meta Platforms, Inc.). Your use of WhatsApp is also subject to{' '}
                            <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline hover:no-underline">
                                WhatsApp&apos;s Privacy Policy
                            </a>
                            . The Saathi app is distributed via Google Play and subject to Google&apos;s terms where applicable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">10. Children</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            The Services are intended for users aged <strong>18 and over</strong> (or under parental/guardian supervision). We do not knowingly target children under 13.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">11. Changes to This Policy</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">12. Contact Us</h2>
                        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg text-slate-700 dark:text-slate-300 space-y-1">
                            <p><strong>Hazaribagh Police</strong></p>
                            <p>Hazaribagh, Jharkhand, India</p>
                            <p>Email: <a href="mailto:sp-hazaribagh@jhpolice.gov.in" className="text-indigo-600 dark:text-indigo-400 underline">sp-hazaribagh@jhpolice.gov.in</a></p>
                        </div>
                    </section>
                </div>

                <div className="flex flex-wrap gap-4 justify-center mt-8 text-sm text-slate-500 dark:text-slate-400">
                    <Link href="/terms-of-service" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link>
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
