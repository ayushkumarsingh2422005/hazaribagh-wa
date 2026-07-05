import { NextRequest } from 'next/server';
import { handleOptions, jsonWithCors } from '@/lib/app-cors';
import { verifyAppOtp } from '@/lib/app-auth';

export async function OPTIONS(request: NextRequest) {
    return handleOptions(request);
}

export async function POST(request: NextRequest) {
    try {
        const { phone, otp } = await request.json();
        if (!phone || !otp) {
            return jsonWithCors(request, { success: false, error: 'Phone and OTP are required.' }, 400);
        }

        const result = await verifyAppOtp(String(phone), String(otp));
        if (!result.success) {
            return jsonWithCors(request, { success: false, error: result.error }, 401);
        }

        return jsonWithCors(request, {
            success: true,
            token: result.token,
            phoneNumber: result.phoneNumber,
        });
    } catch (error) {
        console.error('verify-otp error:', error);
        return jsonWithCors(request, { success: false, error: 'Internal server error' }, 500);
    }
}
