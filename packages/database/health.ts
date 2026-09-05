import { getPool } from './client';

export const checkDbHealth = async (timeoutMs = 2000): Promise<boolean> => {
  try {
    const pool = getPool();
    const query = pool.query('SELECT 1');
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB health check timeout')), timeoutMs),
    );
    await Promise.race([query, timeout]);
    return true;
  } catch {
    return false;
  }
};
