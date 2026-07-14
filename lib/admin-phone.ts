/** Normalize optional admin mobile to 10 digits, or empty string if blank. */
export function normalizeAdminPhone(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';

    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits;
}

export function validateAdminPhone(raw: string): { ok: true; phone: string } | { ok: false; error: string } {
    const phone = normalizeAdminPhone(raw);
    if (!phone) return { ok: true, phone: '' };
    if (phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
        return { ok: false, error: 'Enter a valid 10-digit Indian mobile number, or leave blank.' };
    }
    return { ok: true, phone };
}
