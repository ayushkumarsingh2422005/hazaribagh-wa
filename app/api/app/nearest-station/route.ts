import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import PoliceStation from '@/models/PoliceStation';
import { handleOptions, jsonWithCors } from '@/lib/app-cors';
import { formatGpsStationPhoneLines } from '@/lib/police-station-phones';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function OPTIONS(request: NextRequest) {
    return handleOptions(request);
}

export async function POST(request: NextRequest) {
    try {
        const { latitude, longitude, language = 'english' } = await request.json();
        if (latitude == null || longitude == null) {
            return jsonWithCors(request, { success: false, error: 'latitude and longitude required' }, 400);
        }

        await connectDB();
        const stations = await PoliceStation.find({ isActive: true }).lean();
        if (!stations.length) {
            return jsonWithCors(request, { success: false, error: 'No stations available' }, 404);
        }

        const lang = language === 'hindi' ? 'hindi' : 'english';
        const nearest = stations
            .map(station => ({
                station,
                distance: calculateDistance(
                    latitude,
                    longitude,
                    station.location.coordinates[1],
                    station.location.coordinates[0]
                ),
            }))
            .sort((a, b) => a.distance - b.distance)[0];

        const s = nearest.station;
        const mapLink = `https://www.google.com/maps?q=${s.location.coordinates[1]},${s.location.coordinates[0]}`;

        return jsonWithCors(request, {
            success: true,
            station: {
                name: lang === 'hindi' ? s.nameHindi : s.name,
                phones: formatGpsStationPhoneLines(s, lang),
                distanceKm: Number(nearest.distance.toFixed(2)),
                mapLink,
                incharge: lang === 'hindi' ? s.inchargeNameHindi : s.inchargeName,
            },
        });
    } catch (error) {
        console.error('nearest-station error:', error);
        return jsonWithCors(request, { success: false, error: 'Internal server error' }, 500);
    }
}
