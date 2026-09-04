import { describe, it, expect, mock } from "bun:test";

mock.module("../service/notification.service", () => ({
  createNotification: async (data: any) => ({
    id: "notif-1",
    senderId: data.senderId ?? null,
    title: data.title,
    message: data.message,
    createdAt: new Date().toISOString(),
  }),
  getNotificationsForUser: async (_userId: string) => [
    {
      id: "notif-1",
      senderId: null,
      title: "Hello",
      message: "World",
      createdAt: new Date().toISOString(),
      isRead: false,
      readAt: null,
    },
  ],
  markNotificationAsRead: async () => ({
    notificationId: "notif-1",
    recipientId: "user-1",
    isRead: true,
    readAt: new Date().toISOString(),
  }),
}));

const { default: app } = await import("../route/notification.route");

describe("notification routes", () => {
  it("POST / creates a notification", async () => {
    const res = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Hello",
        message: "World",
        recipientIds: ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
    expect(body.data.title).toBe("Hello");
  });

  it("POST / rejects invalid body", async () => {
    const res = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /:userId returns notifications", async () => {
    const res = await app.request("/user-1", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("PATCH /:notificationId/read marks notification as read", async () => {
    const res = await app.request("/notif-1/read", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ recipientId: "user-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
    expect(body.data.isRead).toBe(true);
  });

  it("PATCH /:notificationId/read rejects missing recipientId", async () => {
    const res = await app.request("/notif-1/read", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
