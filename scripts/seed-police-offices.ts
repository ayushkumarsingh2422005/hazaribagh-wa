/**
 * Seed DSP / SDPO / CI offices for WhatsApp Office Directory.
 * Usage: npx tsx scripts/seed-police-offices.ts
 */
import { seedPoliceOffices } from '../lib/seed-police-offices';

async function main() {
    const result = await seedPoliceOffices();
    console.log(`✅ Seeded ${result.upserted} offices (${result.total} total in database).`);
    process.exit(0);
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
