import { NextRequest } from 'next/server';
import { handleOptions, jsonWithCors } from '@/lib/app-cors';
import { sendAppOtp } from '@/lib/app-auth';

export async function OPTIONS(request: NextRequest) {
    return handleOptions(request);
}

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();
        if (!phone) {
            return jsonWithCors(request, { success: false, error: 'Phone number is required.' }, 400);
        }

        const result = await sendAppOtp(String(phone));
        if (!result.success) {
            return jsonWithCors(request, { success: false, error: result.error }, 400);
        }

        return jsonWithCors(request, {
            success: true,
            message: 'OTP sent to your WhatsApp number.',
        });
    } catch (error) {
        console.error('send-otp error:', error);
        return jsonWithCors(request, { success: false, error: 'Internal server error' }, 500);
    }
}
