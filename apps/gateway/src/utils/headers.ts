const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
]);

// Hilangkan header hop-by-hop yang tidak boleh diteruskan apa adanya lewat reverse proxy
export const filterHeaders = (headers: Headers): Headers => {
  const filtered = new Headers();

  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      filtered.set(key, value);
    }
  });

  return filtered;
};
