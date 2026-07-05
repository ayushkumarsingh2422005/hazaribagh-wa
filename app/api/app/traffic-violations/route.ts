import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import TrafficViolation from '@/models/TrafficViolation';
import { handleOptions, jsonWithCors } from '@/lib/app-cors';

export async function OPTIONS(request: NextRequest) {
    return handleOptions(request);
}

export async function GET(request: NextRequest) {
    await connectDB();
    const language = new URL(request.url).searchParams.get('language') === 'hindi' ? 'hindi' : 'english';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

    const violations = await TrafficViolation.find({ isActive: true }).sort({ section: 1 }).lean();

    const commonEn = [
        { section: '194D', crime: 'Without Helmet', penalty: 1000 },
        { section: '194B', crime: 'Without Seat Belt', penalty: 1000 },
        { section: '181', crime: 'Without License', penalty: 5000 },
        { section: '196', crime: 'Without Insurance', penalty: 2000 },
        { section: '183', crime: 'Over-speeding', penalty: '1000-2000' },
        { section: '185', crime: 'Drunk Driving', penalty: 10000 },
    ];

    const commonHi = [
        { section: '194D', crime: 'बिना हेलमेट', penalty: 1000 },
        { section: '194B', crime: 'बिना सीट बेल्ट', penalty: 1000 },
        { section: '181', crime: 'बिना लाइसेंस', penalty: 5000 },
        { section: '196', crime: 'बिना बीमा', penalty: 2000 },
        { section: '183', crime: 'ओवर-स्पीडिंग', penalty: '1000-2000' },
        { section: '185', crime: 'शराब पीकर गाड़ी', penalty: 10000 },
    ];

    return jsonWithCors(request, {
        success: true,
        common: language === 'hindi' ? commonHi : commonEn,
        violations: violations.map(v => ({
            section: v.section,
            crime: language === 'hindi' ? v.crimeHindi : v.crime,
            penalty: v.penalty,
        })),
        trafficPolicePhone: '9939257628',
        trafficPoliceMap: 'https://www.google.com/maps?q=23.998764,85.365657',
        echallanUrl: 'https://echallan.parivahan.gov.in',
        pdfLinks: [
            { title: language === 'hindi' ? 'मोटर वाहन अधिनियम 1988' : 'Motor Vehicle Act 1988', url: `${baseUrl}/Moter%20Vehical/CENTRAL%20MOTOR%20VEHICLE%20ACT%201988.pdf` },
            { title: language === 'hindi' ? 'झारखंड MV नियम 2021' : 'Jharkhand MV Rules 2021', url: `${baseUrl}/Moter%20Vehical/Jharkhand_Motor_Vehicle_(amendment)Rule%2C2021.pdf` },
        ],
    });
}
