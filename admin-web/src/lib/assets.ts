const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://127.0.0.1:3000/api/v1');

function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return window.location.origin;
  }
}

export function resolveAssetUrl(url: string | null | undefined) {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const origin = getApiOrigin();
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
}

export function resolvePetAssetVariantUrl(url: string | null | undefined, size: 400 | 1024) {
  if (!url) return '';
  if (size === 400 || /^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return resolveAssetUrl(url);
  }
  return resolveAssetUrl(url.replace('/assets/pets/400/', '/assets/pets/1024/'));
}
