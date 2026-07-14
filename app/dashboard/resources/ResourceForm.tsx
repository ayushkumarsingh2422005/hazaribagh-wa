'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { LABEL_CLASS, FIELD_CLASS, TEXTAREA_CLASS, FORM_GRID_CLASS } from '@/components/ui/field-styles';

interface ResourceFormProps {
    initialData?: {
        _id?: string;
        type: string;
        title: string;
        titleHindi: string;
        content: string;
        contentHindi: string;
        url?: string;
        order: number;
        isActive: boolean;
    };
}

export default function ResourceForm({ initialData }: ResourceFormProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        type: initialData?.type || 'disclaimer',
        title: initialData?.title || '',
        titleHindi: initialData?.titleHindi || '',
        content: initialData?.content || '',
        contentHindi: initialData?.contentHindi || '',
        url: initialData?.url || '',
        order: initialData?.order || 0,
        isActive: initialData?.isActive !== false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = initialData?._id
                ? `/api/resources/${initialData._id}`
                : '/api/resources';

            const response = await fetch(url, {
                method: initialData?._id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(initialData?._id ? 'Resource updated' : 'Resource created');
                router.push('/dashboard/resources');
                router.refresh();
            } else {
                setError(data.error || 'Failed to save');
            }
        } catch {
            setError('Error saving resource');
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
                        Type *
                    </label>
                    <select
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className={FIELD_CLASS}
                    >
                        <option value="disclaimer">Disclaimer</option>
                        <option value="important_link">Important Link</option>
                        <option value="cyber_info">Cyber Information</option>
                        <option value="traffic_info">Traffic Information</option>
                        <option value="general_info">General Information</option>
                    </select>
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Order
                    </label>
                    <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Title (English) *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Title (Hindi) *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.titleHindi}
                        onChange={(e) => setFormData({ ...formData, titleHindi: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Content (English) *
                    </label>
                    <textarea
                        required
                        rows={5}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Content (Hindi) *
                    </label>
                    <textarea
                        required
                        rows={5}
                        value={formData.contentHindi}
                        onChange={(e) => setFormData({ ...formData, contentHindi: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className={LABEL_CLASS}>
                        URL (Optional)
                    </label>
                    <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className={FIELD_CLASS}
                        placeholder="https://example.com"
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
                    {initialData?._id ? 'Update Resource' : 'Create Resource'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
