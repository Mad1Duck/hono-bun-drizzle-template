import { fetchWithTimeout } from './fetch';

export const isServiceHealthy = async (baseUrl: string): Promise<boolean> => {
  try {
    const res = await fetchWithTimeout(`${baseUrl}/health`, {}, 2000);
    return res.ok;
  } catch {
    return false;
  }
};
