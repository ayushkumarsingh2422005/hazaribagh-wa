/** Shared complaint type labels for chatbot and dashboard. */
export const complaintTypeLabelsEn: Record<string, string> = {
    passport_delay: 'Passport - Delay',
    passport_other: 'Passport - Other',
    character_delay: 'Character - Delay',
    character_other: 'Character - Other',
    petition_not_visited: 'Petition - Police not visited',
    petition_not_satisfied: 'Petition - Not satisfied',
    petition_other: 'Petition - Other',
    lost_mobile: 'Lost mobile',
    lost_mobile_not_satisfied: 'Lost mobile - Follow-up',
    traffic_jam: 'Traffic jam',
    traffic_challan: 'Traffic challan',
    traffic_other: 'Traffic - Other',
    missing_person: 'Missing person',
    cyber: 'Cyber crime',
    cyber_other: 'Cyber crime - Other',
    info_extortion: 'Information - Extortion',
    info_misbehavior: 'Information - Harassment',
    info_drugs: 'Information - Drugs',
    info_absconders: 'Information - Absconders',
    info_illegal: 'Information - Illegal liquor',
    info_other: 'Information - Other',
    location_find_station: 'Find police station',
    suggestion: 'Suggestion',
};

export const complaintTypeLabelsHi: Record<string, string> = {
    passport_delay: 'पासपोर्ट - देरी',
    passport_other: 'पासपोर्ट - अन्य',
    character_delay: 'चरित्र सत्यापन - देरी',
    character_other: 'चरित्र सत्यापन - अन्य',
    petition_not_visited: 'याचिका - पुलिस नहीं आई',
    petition_not_satisfied: 'याचिका - असंतुष्ट',
    petition_other: 'याचिका - अन्य',
    lost_mobile: 'खोया मोबाइल',
    lost_mobile_not_satisfied: 'खोया मोबाइल - फॉलो-अप',
    traffic_jam: 'ट्रैफ़िक जाम',
    traffic_challan: 'ट्रैफ़िक चालान',
    traffic_other: 'यातायात - अन्य',
    missing_person: 'लापता व्यक्ति',
    cyber: 'साइबर अपराध',
    cyber_other: 'साइबर - अन्य',
    info_extortion: 'सूचना - अड्डेबाजी',
    info_misbehavior: 'सूचना - छेड़खानी',
    info_drugs: 'सूचना - नशाखोरी',
    info_absconders: 'सूचना - फरार अपराधी',
    info_illegal: 'सूचना - अवैध शराब',
    info_other: 'सूचना - अन्य',
    location_find_station: 'थाना खोजें',
    suggestion: 'सुझाव',
};

export function getComplaintTypeLabel(type: string, language: 'english' | 'hindi'): string {
    const map = language === 'english' ? complaintTypeLabelsEn : complaintTypeLabelsHi;
    return map[type] || type.replace(/_/g, ' ');
}

export function getComplaintStatusLabel(
    status: string,
    language: 'english' | 'hindi'
): string {
    if (language === 'english') {
        if (status === 'resolved') return 'Resolved';
        if (status === 'in_progress') return 'In progress';
        return 'Pending';
    }
    if (status === 'resolved') return 'निराकृत';
    if (status === 'in_progress') return 'प्रगति में';
    return 'लंबित';
}

export function getReviewStatusLabel(status: string, language: 'english' | 'hindi'): string {
    if (language === 'english') {
        if (status === 'approved') return 'Approved';
        if (status === 'rejected') return 'Rejected';
        return 'Under review';
    }
    if (status === 'approved') return 'स्वीकृत';
    if (status === 'rejected') return 'अस्वीकृत';
    return 'समीक्षाधीन';
}
