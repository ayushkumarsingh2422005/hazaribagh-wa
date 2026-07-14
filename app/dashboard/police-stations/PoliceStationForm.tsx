'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { LABEL_CLASS, FIELD_CLASS, TEXTAREA_CLASS, FORM_GRID_CLASS } from '@/components/ui/field-styles';

interface PoliceStationFormProps {
    initialData?: {
        _id?: string;
        name: string;
        nameHindi: string;
        address: string;
        addressHindi: string;
        district: string;
        governmentNumber: string;
        personalNumber?: string;
        inchargeName?: string;
        inchargeNameHindi?: string;
        displayOrder?: number;
        latitude: number;
        longitude: number;
        isActive: boolean;
        showInAssociatedPsList?: boolean;
    };
}

export default function PoliceStationForm({ initialData }: PoliceStationFormProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        nameHindi: initialData?.nameHindi || '',
        address: initialData?.address || '',
        addressHindi: initialData?.addressHindi || '',
        district: initialData?.district || 'Hazaribagh',
        governmentNumber: initialData?.governmentNumber || '',
        personalNumber: initialData?.personalNumber || '',
        inchargeName: initialData?.inchargeName || '',
        inchargeNameHindi: initialData?.inchargeNameHindi || '',
        displayOrder: initialData?.displayOrder ?? 0,
        latitude: initialData?.latitude || 0,
        longitude: initialData?.longitude || 0,
        isActive: initialData?.isActive !== false,
        showInAssociatedPsList: initialData?.showInAssociatedPsList !== false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = initialData?._id
                ? `/api/police-stations/${initialData._id}`
                : '/api/police-stations';

            const response = await fetch(url, {
                method: initialData?._id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(initialData?._id ? 'Station updated' : 'Station created');
                router.push('/dashboard/police-stations');
                router.refresh();
            } else {
                setError(data.error || 'Failed to save');
            }
        } catch {
            setError('Error saving police station');
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
                        Address (English) *
                    </label>
                    <textarea
                        required
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className={TEXTAREA_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Address (Hindi) *
                    </label>
                    <textarea
                        required
                        rows={3}
                        value={formData.addressHindi}
                        onChange={(e) => setFormData({ ...formData, addressHindi: e.target.value })}
                        className={TEXTAREA_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Government Number *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.governmentNumber}
                        onChange={(e) => setFormData({ ...formData, governmentNumber: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Personal Number
                    </label>
                    <input
                        type="text"
                        value={formData.personalNumber}
                        onChange={(e) => setFormData({ ...formData, personalNumber: e.target.value })}
                        className={FIELD_CLASS}
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Optional. WhatsApp alerts use the government number first.
                    </p>
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Display Order
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) || 0 })}
                        className={FIELD_CLASS}
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Lower number appears first in chatbot and station lists.
                    </p>
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        District
                    </label>
                    <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
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
                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Incharge Name (English)
                    </label>
                    <input
                        type="text"
                        value={formData.inchargeName}
                        onChange={(e) => setFormData({ ...formData, inchargeName: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div>
                    <label className={LABEL_CLASS}>
                        Incharge Name (Hindi)
                    </label>
                    <input
                        type="text"
                        value={formData.inchargeNameHindi}
                        onChange={(e) => setFormData({ ...formData, inchargeNameHindi: e.target.value })}
                        className={FIELD_CLASS}
                    />
                </div>

                <div className="flex flex-col gap-3 md:col-span-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="showInAssociatedPsList"
                            checked={formData.showInAssociatedPsList}
                            onChange={(e) =>
                                setFormData({ ...formData, showInAssociatedPsList: e.target.checked })
                            }
                            className="w-4 h-4"
                        />
                        <label htmlFor="showInAssociatedPsList" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Show in &quot;associated police station&quot; chatbot list
                        </label>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 pl-6 -mt-2">
                        Unchecked stations stay in the disclaimer contact list, GPS nearest search, and WhatsApp alerts;
                        they are only hidden from the end-of-flow station picker.
                    </p>
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
            </div>

            <div className="flex flex-wrap gap-4">
                <Button type="submit" disabled={loading} isLoading={loading}>
                    {initialData?._id ? 'Update Station' : 'Create Station'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
