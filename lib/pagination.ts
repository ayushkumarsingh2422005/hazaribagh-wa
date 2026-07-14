export const LIST_PAGE_SIZE = 50;

export function parsePageParam(raw: string | undefined): number {
    const n = parseInt(raw || '1', 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
}

export function getPaginationMeta(total: number, page: number, pageSize = LIST_PAGE_SIZE) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * pageSize;
    return { totalPages, safePage, skip, pageSize };
}

export function buildPageHref(basePath: string, page: number, query?: Record<string, string | undefined>): string {
    const url = new URL(basePath, 'http://local');
    url.searchParams.set('page', String(page));
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value) url.searchParams.set(key, value);
        }
    }
    return `${url.pathname}${url.search}`;
}
