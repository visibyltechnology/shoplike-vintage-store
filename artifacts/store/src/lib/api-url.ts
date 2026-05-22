export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

  export function resolveUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('/')) return `${API_BASE}${url}`;
    return url;
  }
  