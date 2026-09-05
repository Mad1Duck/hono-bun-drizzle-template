export const getServiceUrl = (
  name: string,
  port: number,
  suffix = '',
): string => {
  const envKey = `${name.toUpperCase().replace(/-/g, '_')}_SERVICE_URL`;
  const envUrl = process.env[envKey];

  if (envUrl) {
    return envUrl;
  }

  const portEnvKey = `${name.toUpperCase().replace(/-/g, '_')}_SERVICE_PORT`;
  const envPort = process.env[portEnvKey];
  const resolvedPort = envPort ? Number(envPort) : port;

  return `http://${name}${suffix}:${resolvedPort}`;
};
