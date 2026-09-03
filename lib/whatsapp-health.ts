export type WhatsAppHealthStatus = {
    configured: boolean;
    tokenSet: boolean;
    phoneNumberIdSet: boolean;
    otpTemplateSet: boolean;
    message: string;
};

export function getWhatsAppHealth(): WhatsAppHealthStatus {
    const tokenSet = Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim());
    const phoneNumberIdSet = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
    const otpTemplateSet = Boolean(process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim());
    const configured = tokenSet && phoneNumberIdSet;

    let message = 'WhatsApp Cloud API credentials are configured.';
    if (!configured) {
        message = 'Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in environment.';
    } else if (!otpTemplateSet) {
        message = 'API configured. OTP template not set — Saathi app login may fail for new users.';
    }

    return { configured, tokenSet, phoneNumberIdSet, otpTemplateSet, message };
}
