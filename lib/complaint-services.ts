/** Chatbot service groups — maps to complaintType / flowStep keys in MongoDB */

export type ServiceGroup = {
    id: string;
    label: string;
    color: string;
    types: string[];
};

export const COMPLAINT_TYPE_LABELS: Record<string, string> = {
    passport_delay: 'Passport - Delay',
    passport_other: 'Passport - Other',
    character_delay: 'Character Verification - Delay',
    character_other: 'Character Verification - Other',
    petition_not_visited: 'Petition - Police Not Visited',
    petition_not_satisfied: 'Petition - Not Satisfied',
    petition_other: 'Petition - Other',
    lost_mobile: 'Lost Mobile Phone',
    lost_mobile_not_satisfied: 'Lost Mobile - Not Satisfied',
    traffic_jam: 'Traffic - Jam',
    traffic_challan: 'Traffic - Challan',
    traffic_other: 'Traffic - Other',
    missing_person: 'Missing Person',
    cyber: 'Cyber Crime',
    cyber_other: 'Cyber Crime - Other',
    info_extortion: 'Information - Extortion',
    info_adebazi: 'Information - Adebazi',
    info_misbehavior: 'Information - Harassment',
    info_drugs: 'Information - Drugs',
    info_absconders: 'Information - Absconders',
    info_illegal: 'Information - Illegal Liquor',
    info_other: 'Information - Other',
    location_find_station: 'Location - Find my Police Station',
    suggestion: 'Suggestion',
};

export const SERVICE_GROUPS: ServiceGroup[] = [
    { id: 'passport', label: 'Passport Issues', color: 'indigo', types: ['passport_delay', 'passport_other'] },
    { id: 'character', label: 'Character Verification', color: 'violet', types: ['character_delay', 'character_other'] },
    { id: 'petition', label: 'Petition', color: 'rose', types: ['petition_not_visited', 'petition_not_satisfied', 'petition_other'] },
    { id: 'location', label: 'Location Services', color: 'teal', types: ['location_find_station'] },
    { id: 'lost_mobile', label: 'Lost Mobile Phone', color: 'orange', types: ['lost_mobile', 'lost_mobile_not_satisfied'] },
    { id: 'traffic', label: 'Traffic Issues', color: 'yellow', types: ['traffic_jam', 'traffic_challan', 'traffic_other'] },
    { id: 'missing_person', label: 'Missing Person', color: 'red', types: ['missing_person'] },
    { id: 'information', label: 'Information', color: 'cyan', types: ['info_extortion', 'info_adebazi', 'info_misbehavior', 'info_drugs', 'info_absconders', 'info_illegal', 'info_other'] },
    { id: 'cyber', label: 'Cyber Crime', color: 'purple', types: ['cyber', 'cyber_other'] },
    { id: 'suggestion', label: 'Suggestions & Reviews', color: 'green', types: ['suggestion'] },
];

export const ALL_COMPLAINT_TYPES: string[] = SERVICE_GROUPS.flatMap(g => g.types);

export const GROUPS = SERVICE_GROUPS;
export const complaintTypeLabels = COMPLAINT_TYPE_LABELS;

export function flowStepToComplaintTypeKey(flowStep: string): string {
    if (flowStep === 'suggestion_form') return 'suggestion';
    return flowStep.replace(/^sub_/, '');
}

export function complaintTypeToFlowSteps(type: string): string[] {
    if (type === 'suggestion') return ['suggestion_form'];
    return [`sub_${type}`];
}

export function flowStepsForComplaintTypes(types: string[]): string[] {
    return types.flatMap(complaintTypeToFlowSteps);
}

export function parseAllowedComplaintTypesFromForm(formData: FormData): string[] {
    const raw = formData.get('allowedComplaintTypes') as string;
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((t): t is string => typeof t === 'string' && ALL_COMPLAINT_TYPES.includes(t));
    } catch {
        return [];
    }
}

export function serviceGroupLabelForType(type: string): string {
    const group = SERVICE_GROUPS.find(g => g.types.includes(type));
    return group?.label || COMPLAINT_TYPE_LABELS[type] || type;
}
