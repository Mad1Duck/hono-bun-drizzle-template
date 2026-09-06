import { describe, it, expect, vi } from "vitest";

vi.mock("../service/image.service", () => ({
  toWebp: async () => ({
    convertedBuffer: new ArrayBuffer(0),
    mime: "image/webp",
    ext: "webp",
  }),
}));

vi.mock("@/utils/uploadthing", () => ({
  utapi: {
    uploadFiles: async () => ({ success: true, fileUrl: "https://example.com/file.webp" }),
  },
}));

const { default: app } = await import("../route/storage.route");

describe("storage routes", () => {
  it("POST /remote with a file returns success", async () => {
    const file = new File([new ArrayBuffer(8)], "test.png", { type: "image/png" });
    const formData = new FormData();
    formData.append("file", file);

    const res = await app.request("/remote", {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
    expect(body.data.success).toBe(true);
  });

  it("POST /remote without file returns 415", async () => {
    const res = await app.request("/remote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(415);
    const body = await res.json();
    expect(body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });
});
