import { mergeOpenApiSpecs } from '@repo/shared';
import { services } from '../config/services';

interface ServiceDocUrl {
  name: string;
  url: string;
}

const serviceDocUrls: ServiceDocUrl[] = [
  { name: 'auth', url: `${services.AUTH_SERVICE}/v1/docs` },
  { name: 'user', url: `${services.USER_SERVICE}/v1/docs` },
  { name: 'rbac', url: `${services.RBAC_SERVICE}/v1/docs` },
  { name: 'notification', url: `${services.NOTIFICATION_SERVICE}/v1/docs` },
  { name: 'storage', url: `${services.STORAGE_SERVICE}/v1/docs` },
];

const fetchJsonWithTimeout = async (url: string, timeoutMs = 2000): Promise<any | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

let cachedSpec: any = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

export const getMergedSpec = async (): Promise<any> => {
  const now = Date.now();
  if (cachedSpec && now - cachedAt < CACHE_TTL_MS) {
    return cachedSpec;
  }

  const specs = await Promise.all(
    serviceDocUrls.map((s) => fetchJsonWithTimeout(s.url))
  );

  const validSpecs = specs.filter((s): s is any => s !== null);
  const merged = mergeOpenApiSpecs(validSpecs, 'API Gateway');

  cachedSpec = merged;
  cachedAt = now;
  return merged;
};

export const invalidateSpecCache = (): void => {
  cachedSpec = null;
  cachedAt = 0;
};
