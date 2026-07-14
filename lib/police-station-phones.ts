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

/** Single contact number for display: government first, then personal. */
export function getDisplayPhoneNumber(station: StationPhoneFields): string {
    return getAlertWhatsAppNumber(station);
}

/** One-line phone for disclaimer station list. */
export function formatDisclaimerStationPhones(
    station: StationPhoneFields,
    _language: 'english' | 'hindi'
): string {
    const phone = getDisplayPhoneNumber(station);
    return phone || '—';
}

/** Phone line for GPS nearest-station replies. */
export function formatGpsStationPhoneLines(
    station: StationPhoneFields,
    _language: 'english' | 'hindi'
): string {
    const phone = getDisplayPhoneNumber(station);
    return phone ? `   📞 ${phone}\n` : '';
}
