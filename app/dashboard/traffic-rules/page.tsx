import DashboardLayout from '@/components/dashboard/DashboardLayout';
import TrafficViolation from '@/models/TrafficViolation';
import connectDB from '@/lib/db';
import { BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card, CardHeader, DataTableHead, TH_CLASS, TD_CLASS } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

async function getViolations() {
    await connectDB();
    const violations = await TrafficViolation.find({}).sort({ section: 1 }).lean();
    return violations.map(v => ({
        ...v,
        _id: v._id.toString(),
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
    }));
}

export default async function TrafficRulesPage() {
    const violations = await getViolations();

    return (
        <DashboardLayout section="traffic_rules">
            <PageHeader
                title="Traffic Rules & Violations"
                actions={<ButtonLink href="/dashboard/traffic-rules/new">Add Rule</ButtonLink>}
            />

            <Card>
                <CardHeader title="All Rules" count={violations.length} />
                {violations.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        title="No traffic rules yet"
                        action={<ButtonLink href="/dashboard/traffic-rules/new">Add Rule</ButtonLink>}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-slate-600 dark:text-slate-400">
                            <DataTableHead>
                                <tr>
                                    <th className={TH_CLASS}>Section</th>
                                    <th className={TH_CLASS}>Crime (English)</th>
                                    <th className={TH_CLASS}>Crime (Hindi)</th>
                                    <th className={TH_CLASS}>Penalty (₹)</th>
                                    <th className={TH_CLASS}>Status</th>
                                    <th className={TH_CLASS}>Actions</th>
                                </tr>
                            </DataTableHead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {violations.map(violation => (
                                    <tr key={violation._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className={`${TD_CLASS} font-medium text-slate-900 dark:text-white`}>
                                            {violation.section}
                                        </td>
                                        <td className={TD_CLASS}>{violation.crime}</td>
                                        <td className={TD_CLASS}>{violation.crimeHindi}</td>
                                        <td className={`${TD_CLASS} font-semibold text-slate-900 dark:text-white`}>
                                            ₹{violation.penalty.toLocaleString()}
                                        </td>
                                        <td className={TD_CLASS}>
                                            <span
                                                className={`px-1.5 py-0.5 text-xs font-medium ${
                                                    violation.isActive
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}
                                            >
                                                {violation.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className={TD_CLASS}>
                                            <ButtonLink
                                                href={`/dashboard/traffic-rules/edit/${violation._id}`}
                                                variant="secondary"
                                                size="sm"
                                            >
                                                Edit
                                            </ButtonLink>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </DashboardLayout>
    );
}
