'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { LABEL_CLASS, FIELD_CLASS, TEXTAREA_CLASS, FORM_GRID_CLASS } from '@/components/ui/field-styles';

interface PoliceOfficeFormProps {
    initialData?: {
        _id?: string;
        officeKey?: string;
        category: 'dsp' | 'ci';
        name: string;
        nameHindi: string;
        address: string;
        addressHindi: string;
        phone?: string;
        displayOrder?: number;
        latitude: number;
        longitude: number;
        isActive: boolean;
    };
}

export default function PoliceOfficeForm({ initialData }: PoliceOfficeFormProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        officeKey: initialData?.officeKey || '',
        category: initialData?.category || ('dsp' as 'dsp' | 'ci'),
        name: initialData?.name || '',
        nameHindi: initialData?.nameHindi || '',
        address: initialData?.address || '',
        addressHindi: initialData?.addressHindi || '',
        phone: initialData?.phone || '',
        displayOrder: initialData?.displayOrder ?? 0,
        latitude: initialData?.latitude || 0,
        longitude: initialData?.longitude || 0,
        isActive: initialData?.isActive !== false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = initialData?._id
                ? `/api/police-offices/${initialData._id}`
                : '/api/police-offices';

            const response = await fetch(url, {
                method: initialData?._id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(initialData?._id ? 'Office updated' : 'Office created');
                router.push('/dashboard/police-offices');
                router.refresh();
            } else {
                setError(data.error || 'Failed to save');
            }
        } catch {
            setError('Error saving police office');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <AlertBanner variant="error">{error}</AlertBanner>}
            <div className={FORM_GRID_CLASS}>
                {!initialData?._id && (
                    <div>
                        <label className={LABEL_CLASS}>
                            Office Key *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.officeKey}
                            onChange={(e) => setFormData({ ...formData, officeKey: e.target.value })}
                            placeholder="e.g. sdpo_sadar"
                            className={FIELD_CLASS}
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Unique ID for WhatsApp (office_key). Cannot be changed after create.
                        </p>
                    </div>
                )}

                {initialData?._id && initialData.officeKey && (
                    <div>
                        <label className={LABEL_CLASS}>
                            Office Key
                        </label>
                        <p className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm">
                            {initialData.officeKey}
                        </p>
                    </div>
                )}

                <div>
                    <label className={LABEL_CLASS}>
                        Category *
                    </label>
                    <select
                        value={formData.category}
                        onChange={(e) =>
                            setFormData({ ...formData, category: e.target.value as 'dsp' | 'ci' })
                        }
                        className={FIELD_CLASS}
                    >
                        <option value="dsp">DSP / SDPO</option>
                        <option value="ci">CI (Circle Inspector)</option>
                    </select>
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Name (English) *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Name (Hindi) *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.nameHindi}
                        onChange={(e) => setFormData({ ...formData, nameHindi: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Address (English)
                    </label>
                    <textarea
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Address (Hindi)
                    </label>
                    <textarea
                        rows={3}
                        value={formData.addressHindi}
                        onChange={(e) => setFormData({ ...formData, addressHindi: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Phone
                    </label>
                    <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Display Order
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={formData.displayOrder}
                        onChange={(e) =>
                            setFormData({ ...formData, displayOrder: Number(e.target.value) || 0 })
                        }
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Latitude *
                    </label>
                    <input
                        type="number"
                        step="any"
                        required
                        value={formData.latitude}
                        onChange={(e) =>
                            setFormData({ ...formData, latitude: parseFloat(e.target.value) })
                        }
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Longitude *
                    </label>
                    <input
                        type="number"
                        step="any"
                        required
                        value={formData.longitude}
                        onChange={(e) =>
                            setFormData({ ...formData, longitude: parseFloat(e.target.value) })
                        }
                        className={FIELD_CLASS}
                    />
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Active (shown in WhatsApp Office Directory)
                    </label>
                </div>
            </div>

            <div className="flex flex-wrap gap-4">
                <Button type="submit" disabled={loading} isLoading={loading}>
                    {initialData?._id ? 'Update Office' : 'Create Office'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
