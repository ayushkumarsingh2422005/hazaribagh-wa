import PoliceOffice, { type PoliceOfficeCategory } from '@/models/PoliceOffice';

export type { PoliceOfficeCategory };
import connectDB from './db';

export type ChatbotPoliceOffice = {
    id: string;
    officeKey: string;
    category: PoliceOfficeCategory;
    name: string;
    nameHindi: string;
    lat: number;
    lng: number;
    phone?: string;
    address?: string;
    addressHindi?: string;
};

export function toOfficeInteractiveId(officeKey: string): string {
    return `office_${officeKey}`;
}

export function parseOfficeInteractiveId(interactiveId: string): string | null {
    if (!interactiveId.startsWith('office_')) return null;
    return interactiveId.slice('office_'.length);
}

export async function getActivePoliceOfficesForChatbot(
    category?: PoliceOfficeCategory
): Promise<ChatbotPoliceOffice[]> {
    await connectDB();
    const query: { isActive: boolean; category?: PoliceOfficeCategory } = { isActive: true };
    if (category) query.category = category;

    const offices = await PoliceOffice.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .lean();

    return offices.map((office) => ({
        id: toOfficeInteractiveId(office.officeKey),
        officeKey: office.officeKey,
        category: office.category,
        name: office.name,
        nameHindi: office.nameHindi,
        lat: office.location.coordinates[1],
        lng: office.location.coordinates[0],
        phone: office.phone || undefined,
        address: office.address || undefined,
        addressHindi: office.addressHindi || undefined,
    }));
}

export async function getPoliceOfficeByKey(officeKey: string): Promise<ChatbotPoliceOffice | null> {
    await connectDB();
    const office = await PoliceOffice.findOne({ officeKey, isActive: true }).lean();
    if (!office) return null;

    return {
        id: toOfficeInteractiveId(office.officeKey),
        officeKey: office.officeKey,
        category: office.category,
        name: office.name,
        nameHindi: office.nameHindi,
        lat: office.location.coordinates[1],
        lng: office.location.coordinates[0],
        phone: office.phone || undefined,
        address: office.address || undefined,
        addressHindi: office.addressHindi || undefined,
    };
}
