import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Activity, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { getWhatsAppHealth } from '@/lib/whatsapp-health';

export default async function SettingsPage() {
    const health = getWhatsAppHealth();

    return (
        <DashboardLayout section="settings">
            <PageHeader title="Settings" />

            <div className="space-y-4">
                <Card className="p-4">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                        WhatsApp Configuration
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{health.message}</p>

                    <div className="space-y-2">
                        <StatusRow
                            label="API credentials"
                            description="WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID"
                            ok={health.configured}
                        />
                        <StatusRow
                            label="OTP template (Sathi App)"
                            description="WHATSAPP_OTP_TEMPLATE_NAME for new user login"
                            ok={health.otpTemplateSet}
                            warnWhenOff
                        />
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Link
                            href="/dashboard/test-whatsapp"
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                            Test WhatsApp connection →
                        </Link>
                    </div>
                </Card>

                {!health.configured && (
                    <AlertBanner variant="warning">
                        WhatsApp is not fully configured. Incoming messages and outbound replies will not work until
                        environment variables are set on the server.
                    </AlertBanner>
                )}

                <Card className="p-4">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Additional Settings</h2>
                    <div className="text-center py-6">
                        <Settings className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-900 dark:text-white">More settings coming soon</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                            Environment-based configuration is managed on the deployment platform (e.g. Vercel).
                        </p>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}

function StatusRow({
    label,
    description,
    ok,
    warnWhenOff,
}: {
    label: string;
    description: string;
    ok: boolean;
    warnWhenOff?: boolean;
}) {
    const showOk = ok || !warnWhenOff;
    const isWarn = !ok && warnWhenOff;

    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
                <Activity
                    className={`w-4 h-4 shrink-0 ${
                        showOk && ok
                            ? 'text-green-600 dark:text-green-400'
                            : isWarn
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                    }`}
                />
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
                </div>
            </div>
            <div
                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded shrink-0 ${
                    ok
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : isWarn
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
            >
                {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {ok ? 'Set' : isWarn ? 'Optional' : 'Missing'}
            </div>
        </div>
    );
}
