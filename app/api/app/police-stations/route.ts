import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import PoliceStation from '@/models/PoliceStation';
import { handleOptions, jsonWithCors } from '@/lib/app-cors';
import { formatDisclaimerStationPhones } from '@/lib/police-station-phones';

export async function OPTIONS(request: NextRequest) {
    return handleOptions(request);
}

export async function GET(request: NextRequest) {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') === 'hindi' ? 'hindi' : 'english';
    const forList = searchParams.get('forList') === 'true';

    const query: Record<string, unknown> = { isActive: true };
    if (forList) {
        query.$nor = [{ showInAssociatedPsList: false }];
    }

    const stations = await PoliceStation.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .select('name nameHindi location phone phone2 inchargeName inchargeNameHindi')
        .lean();

    return jsonWithCors(request, {
        success: true,
        stations: stations.map(s => ({
            name: s.name,
            nameHindi: s.nameHindi,
            label: language === 'hindi' ? s.nameHindi : s.name,
            lat: s.location?.coordinates?.[1],
            lng: s.location?.coordinates?.[0],
            phones: formatDisclaimerStationPhones(s, language),
            incharge: language === 'hindi' ? s.inchargeNameHindi : s.inchargeName,
        })),
    });
}
