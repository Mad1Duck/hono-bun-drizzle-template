export const getServiceUrls = (
  name: string,
  port: number,
  suffix = '',
): string[] => {
  const envKey = `${name.toUpperCase().replace(/-/g, '_')}_URL`;
  const envUrl = process.env[envKey];

  if (envUrl) {
    return envUrl
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
  }

  const portEnvKey = `${name.toUpperCase().replace(/-/g, '_')}_PORT`;
  const envPort = process.env[portEnvKey];
  const resolvedPort = envPort ? Number(envPort) : port;

  return [`http://${name}${suffix}:${resolvedPort}`];
};

const roundRobinCounters = new Map<string, number>();

export const getServiceUrl = (
  name: string,
  port: number,
  suffix = '',
): string => {
  const urls = getServiceUrls(name, port, suffix);
  const idx = roundRobinCounters.get(name) ?? 0;
  const url = urls[idx % urls.length];
  roundRobinCounters.set(name, (idx + 1) % urls.length);
  return url;
};

export const resetServiceDiscovery = (): void => {
  roundRobinCounters.clear();
};
