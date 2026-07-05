import { NextRequest } from 'next/server';
import { handleOptions, jsonWithCors } from '@/lib/app-cors';
import {
    getActivePoliceOfficesForChatbot,
    getPoliceOfficeByKey,
    type PoliceOfficeCategory,
} from '@/lib/police-offices';

export async function OPTIONS(request: NextRequest) {
    return handleOptions(request);
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as PoliceOfficeCategory | null;
    const officeKey = searchParams.get('officeKey');
    const language = searchParams.get('language') === 'hindi' ? 'hindi' : 'english';

    if (officeKey) {
        const office = await getPoliceOfficeByKey(officeKey);
        if (!office) {
            return jsonWithCors(request, { success: false, error: 'Office not found' }, 404);
        }
        return jsonWithCors(request, {
            success: true,
            office: {
                ...office,
                label: language === 'hindi' ? office.nameHindi : office.name,
                mapLink: `https://www.google.com/maps?q=${office.lat},${office.lng}`,
            },
        });
    }

    const offices = await getActivePoliceOfficesForChatbot(category || undefined);
    return jsonWithCors(request, {
        success: true,
        offices: offices.map(o => ({
            officeKey: o.officeKey,
            category: o.category,
            label: language === 'hindi' ? o.nameHindi : o.name,
            lat: o.lat,
            lng: o.lng,
            phone: o.phone,
            address: language === 'hindi' ? o.addressHindi || o.address : o.address,
            mapLink: `https://www.google.com/maps?q=${o.lat},${o.lng}`,
        })),
    });
}
