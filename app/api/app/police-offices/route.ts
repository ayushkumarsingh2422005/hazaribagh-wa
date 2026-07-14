import { NextRequest } from 'next/server';
import { handleOptions, jsonWithCors } from '@/lib/app-cors';

/** DISABLED: Police Offices API — not needed for now. Restore handlers from git history. */

export async function OPTIONS(request: NextRequest) {
    return handleOptions(request);
}

export async function GET(request: NextRequest) {
    return jsonWithCors(request, { success: false, error: 'Police offices feature is disabled' }, 410);
}

/*
import {
    getActivePoliceOfficesForChatbot,
    getPoliceOfficeByKey,
    type PoliceOfficeCategory,
} from '@/lib/police-offices';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as PoliceOfficeCategory | null;
    const officeKey = searchParams.get('officeKey');
    const language = searchParams.get('language') === 'hindi' ? 'hindi' : 'english';
    ...
}
*/
