/** Legacy + new phone fields on PoliceStation documents. */
export type StationPhoneFields = {
    governmentNumber?: string | null;
    personalNumber?: string | null;
    /** @deprecated Migrated to governmentNumber */
    contactNumber?: string | null;
};

export function getGovernmentNumber(station: StationPhoneFields): string {
    return String(station.governmentNumber || station.contactNumber || '').trim();
}

export function getPersonalNumber(station: StationPhoneFields): string {
    return String(station.personalNumber || '').trim();
}

/** WhatsApp alerts: prefer government number, then personal. */
export function getAlertWhatsAppNumber(station: StationPhoneFields): string {
    return getGovernmentNumber(station) || getPersonalNumber(station);
}

/** One-line summary for disclaimer station list. */
export function formatDisclaimerStationPhones(
    station: StationPhoneFields,
    language: 'english' | 'hindi'
): string {
    const gov = getGovernmentNumber(station);
    const per = getPersonalNumber(station);
    if (language === 'english') {
        const parts: string[] = [];
        if (gov) parts.push(`Govt: ${gov}`);
        if (per) parts.push(`Personal: ${per}`);
        return parts.length ? parts.join(' | ') : '—';
    }
    const parts: string[] = [];
    if (gov) parts.push(`सरकारी: ${gov}`);
    if (per) parts.push(`व्यक्तिगत: ${per}`);
    return parts.length ? parts.join(' | ') : '—';
}

/** Multi-line block for GPS nearest-station replies. */
export function formatGpsStationPhoneLines(
    station: StationPhoneFields,
    language: 'english' | 'hindi'
): string {
    const gov = getGovernmentNumber(station);
    const per = getPersonalNumber(station);
    const lines: string[] = [];
    if (language === 'english') {
        if (gov) lines.push(`   📞 Govt: ${gov}`);
        if (per) lines.push(`   📞 Personal: ${per}`);
    } else {
        if (gov) lines.push(`   📞 सरकारी: ${gov}`);
        if (per) lines.push(`   📞 व्यक्तिगत: ${per}`);
    }
    return lines.length ? `${lines.join('\n')}\n` : '';
}
