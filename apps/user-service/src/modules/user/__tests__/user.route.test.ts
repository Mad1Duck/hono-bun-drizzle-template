import { describe, it, expect, vi } from "vitest";

const mockUser = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  email: "user@example.com",
  firstName: "User",
  lastName: "One",
  phone: "628123456789",
  username: "user1",
  isPlatformOwner: false,
  createdAt: new Date().toISOString(),
};

vi.mock("../service/user.service", () => ({
  getUserById: async () => mockUser,
  updateUser: async () => ({ ...mockUser, firstName: "Updated" }),
}));

const { default: app } = await import("../route/user.route");

describe("user routes", () => {
  it("GET /:id returns a user", async () => {
    const res = await app.request("/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(mockUser.id);
  });

  it("PATCH /:id updates a user", async () => {
    const res = await app.request("/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName: "Updated" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.firstName).toBe("Updated");
  });

  it("PATCH /:id rejects invalid body", async () => {
    const res = await app.request("/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}), // empty
    });
    expect(res.status).toBe(400);
  });
});
