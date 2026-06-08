import connectDB from './db';
import PoliceOffice from '@/models/PoliceOffice';
import { POLICE_OFFICE_SEED_DATA } from './seed-police-offices-data';

export async function seedPoliceOffices(): Promise<{ upserted: number; total: number }> {
    await connectDB();

    let upserted = 0;
    for (const entry of POLICE_OFFICE_SEED_DATA) {
        await PoliceOffice.findOneAndUpdate(
            { officeKey: entry.officeKey },
            {
                officeKey: entry.officeKey,
                category: entry.category,
                name: entry.name,
                nameHindi: entry.nameHindi,
                address: entry.address,
                addressHindi: entry.addressHindi,
                location: {
                    type: 'Point',
                    coordinates: [entry.longitude, entry.latitude],
                },
                phone: entry.phone || '',
                displayOrder: entry.displayOrder,
                isActive: true,
            },
            { upsert: true, new: true }
        );
        upserted += 1;
    }

    const total = await PoliceOffice.countDocuments();
    return { upserted, total };
}
