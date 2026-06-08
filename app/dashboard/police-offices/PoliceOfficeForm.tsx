'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    const [loading, setLoading] = useState(false);
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
                router.push('/dashboard/police-offices');
                router.refresh();
            } else {
                alert('Error: ' + (data.error || 'Failed to save'));
            }
        } catch (error) {
            alert('Error saving police office');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!initialData?._id && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Office Key *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.officeKey}
                            onChange={(e) => setFormData({ ...formData, officeKey: e.target.value })}
                            placeholder="e.g. sdpo_sadar"
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Unique ID for WhatsApp (office_key). Cannot be changed after create.
                        </p>
                    </div>
                )}

                {initialData?._id && initialData.officeKey && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Office Key
                        </label>
                        <p className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-sm">
                            {initialData.officeKey}
                        </p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Category *
                    </label>
                    <select
                        value={formData.category}
                        onChange={(e) =>
                            setFormData({ ...formData, category: e.target.value as 'dsp' | 'ci' })
                        }
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                        <option value="dsp">DSP / SDPO</option>
                        <option value="ci">CI (Circle Inspector)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Name (English) *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Name (Hindi) *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.nameHindi}
                        onChange={(e) => setFormData({ ...formData, nameHindi: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Address (English)
                    </label>
                    <textarea
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Address (Hindi)
                    </label>
                    <textarea
                        rows={3}
                        value={formData.addressHindi}
                        onChange={(e) => setFormData({ ...formData, addressHindi: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Phone
                    </label>
                    <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Display Order
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={formData.displayOrder}
                        onChange={(e) =>
                            setFormData({ ...formData, displayOrder: Number(e.target.value) || 0 })
                        }
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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

            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : initialData?._id ? 'Update Office' : 'Create Office'}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
