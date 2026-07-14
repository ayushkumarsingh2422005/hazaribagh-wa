'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { LABEL_CLASS, FIELD_CLASS, TEXTAREA_CLASS, FORM_GRID_CLASS } from '@/components/ui/field-styles';

interface TrafficViolationFormProps {
    initialData?: {
        _id?: string;
        crime: string;
        crimeHindi: string;
        section: string;
        penalty: number;
        description?: string;
        descriptionHindi?: string;
        isActive: boolean;
    };
}

export default function TrafficViolationForm({ initialData }: TrafficViolationFormProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        crime: initialData?.crime || '',
        crimeHindi: initialData?.crimeHindi || '',
        section: initialData?.section || '',
        penalty: initialData?.penalty || 0,
        description: initialData?.description || '',
        descriptionHindi: initialData?.descriptionHindi || '',
        isActive: initialData?.isActive !== false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = initialData?._id
                ? `/api/traffic-violations/${initialData._id}`
                : '/api/traffic-violations';

            const response = await fetch(url, {
                method: initialData?._id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(initialData?._id ? 'Rule updated' : 'Rule created');
                router.push('/dashboard/traffic-rules');
                router.refresh();
            } else {
                setError(data.error || 'Failed to save');
            }
        } catch {
            setError('Error saving traffic rule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <AlertBanner variant="error">{error}</AlertBanner>}
            <div className={FORM_GRID_CLASS}>
                <div>
                    <label className={LABEL_CLASS}>
                        Crime (English) *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.crime}
                        onChange={(e) => setFormData({ ...formData, crime: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Crime (Hindi) *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.crimeHindi}
                        onChange={(e) => setFormData({ ...formData, crimeHindi: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Section *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        className={FIELD_CLASS}
                        placeholder="e.g., 179, 184(IV)(c)"
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Penalty (₹) *
                    </label>
                    <input
                        type="number"
                        required
                        value={formData.penalty}
                        onChange={(e) => setFormData({ ...formData, penalty: parseInt(e.target.value) })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Description (English)
                    </label>
                    <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Description (Hindi)
                    </label>
                    <textarea
                        rows={3}
                        value={formData.descriptionHindi}
                        onChange={(e) => setFormData({ ...formData, descriptionHindi: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Active
                    </label>
                </div>
            </div>

            <div className="flex flex-wrap gap-4">
                <Button type="submit" disabled={loading} isLoading={loading}>
                    {initialData?._id ? 'Update Rule' : 'Create Rule'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
