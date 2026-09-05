import { describe, it, expect, beforeEach } from "bun:test";
import { getServiceUrl, getServiceUrls, resetServiceDiscovery } from "../discovery";

describe("discovery", () => {
  beforeEach(() => {
    resetServiceDiscovery();
    delete process.env.AUTH_SERVICE_URL;
    delete process.env.AUTH_SERVICE_PORT;
  });

  it("returns default URL when no env is set", () => {
    const url = getServiceUrl("auth-service", 3001);
    expect(url).toBe("http://auth-service:3001");
  });

  it("uses suffix for default URL", () => {
    const url = getServiceUrl("auth-service", 3001, "-svc");
    expect(url).toBe("http://auth-service-svc:3001");
  });

  it("respects *_SERVICE_PORT env", () => {
    process.env.AUTH_SERVICE_PORT = "9001";
    try {
      const url = getServiceUrl("auth-service", 3001);
      expect(url).toBe("http://auth-service:9001");
    } finally {
      delete process.env.AUTH_SERVICE_PORT;
    }
  });

  it("parses comma-separated *_SERVICE_URL env", () => {
    process.env.AUTH_SERVICE_URL = "http://auth-1:3001, http://auth-2:3001";
    try {
      const urls = getServiceUrls("auth-service", 3001);
      expect(urls).toEqual(["http://auth-1:3001", "http://auth-2:3001"]);
    } finally {
      delete process.env.AUTH_SERVICE_URL;
    }
  });

  it("round-robins across multiple URLs", () => {
    process.env.AUTH_SERVICE_URL = "http://auth-1:3001,http://auth-2:3001";
    try {
      const first = getServiceUrl("auth-service", 3001);
      const second = getServiceUrl("auth-service", 3001);
      const third = getServiceUrl("auth-service", 3001);
      expect([first, second]).toEqual(["http://auth-1:3001", "http://auth-2:3001"]);
      expect(third).toBe("http://auth-1:3001");
    } finally {
      delete process.env.AUTH_SERVICE_URL;
    }
  });
});
