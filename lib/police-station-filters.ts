/**
 * PoliceStation.displayOrder classification (Hazaribagh directory):
 * - 1 = Police Station (P.S.)
 * - 2 = Out Post (O.P.)
 * - 0, 3, 4 = Offices (DSP / control room / etc.) — directory only, not nearest GPS
 */
export const PS_DISPLAY_ORDER = 1;
export const OP_DISPLAY_ORDER = 2;
export const OFFICE_DISPLAY_ORDERS = [0, 3, 4] as const;

/** Eligible for nearest-location GPS (PS + OP only). */
export const NEAREST_LOCATION_DISPLAY_ORDERS = [PS_DISPLAY_ORDER, OP_DISPLAY_ORDER] as const;

export function nearestLocationStationQuery(): {
    isActive: boolean;
    displayOrder: { $in: number[] };
} {
    return {
        isActive: true,
        displayOrder: { $in: [...NEAREST_LOCATION_DISPLAY_ORDERS] },
    };
}
