import { describe, it, expect, mock } from "bun:test";

mock.module("ioredis", () => ({
  Redis: class MockRedis {
    incr() { return Promise.resolve(1); }
    expire() { return Promise.resolve(1); }
    del() { return Promise.resolve(1); }
    on() { return this; }
    quit() { return Promise.resolve(undefined); }
  },
  default: class MockRedis {
    incr() { return Promise.resolve(1); }
    expire() { return Promise.resolve(1); }
    del() { return Promise.resolve(1); }
    on() { return this; }
    quit() { return Promise.resolve(undefined); }
  },
}));

mock.module("../service/access.service", () => ({
  listRoles: async () => [{ id: 1, name: "USER" }],
  createRole: async (data: any) => ({ id: 1, ...data }),
  updateRole: async (id: number, data: any) => ({ id, ...data }),
  deleteRole: async () => ({ id: 1, name: "USER" }),
  listPermissions: async () => [{ id: "perm-1", name: "read", code: "read" }],
  createPermission: async (data: any) => ({ id: "perm-1", ...data }),
  deletePermission: async () => ({ id: "perm-1", name: "read" }),
  getRolePermissions: async () => [{ permissionId: "perm-1", name: "read", code: "read" }],
  attachPermissionToRole: async () => ({ roleId: 1, permissionId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
  detachPermissionFromRole: async () => ({ roleId: 1, permissionId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }),
  changeUserRole: async () => ({ id: "user-1", roleId: 1 }),
}));

mock.module("@/middleware/auth.middleware", () => ({
  authentication: async (c: any, next: any) => {
    c.set("jwtPayload", { id: "admin-1", roles: "Admin" });
    await next();
  },
  authenticationAdministrator: async (_c: any, next: any) => await next(),
}));

const { rolesRoute, permissionsRoute } = await import("../route/access.route");

describe("access routes", () => {
  it("GET /roles returns roles", async () => {
    const res = await rolesRoute.request("/", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
    expect(body.data).toEqual([{ id: 1, name: "USER" }]);
  });

  it("POST /roles creates a role", async () => {
    const res = await rolesRoute.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Admin" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });

  it("PATCH /roles/:id updates a role", async () => {
    const res = await rolesRoute.request("/1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Admin" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });

  it("DELETE /roles/:id deletes a role", async () => {
    const res = await rolesRoute.request("/1", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });

  it("GET /roles/:roleId/permissions returns permissions", async () => {
    const res = await rolesRoute.request("/1/permissions", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });

  it("POST /roles/:roleId/permissions attaches a permission", async () => {
    const permissionId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const res = await rolesRoute.request("/1/permissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ permissionId }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });

  it("DELETE /roles/:roleId/permissions/:permissionId detaches a permission", async () => {
    const res = await rolesRoute.request("/1/permissions/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });

  it("PATCH /roles/:roleId/users/:userId updates user role", async () => {
    const res = await rolesRoute.request("/1/users/user-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "promotion" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });

  it("GET /permissions returns permissions", async () => {
    const res = await permissionsRoute.request("/", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });

  it("POST /permissions creates a permission", async () => {
    const res = await permissionsRoute.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "write", code: "write" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });

  it("DELETE /permissions/:id deletes a permission", async () => {
    const res = await permissionsRoute.request("/perm-1", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.status).toBe("SUCCESS");
  });
});
