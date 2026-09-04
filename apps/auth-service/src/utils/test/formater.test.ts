import { describe, it, expect } from "bun:test";
import { transformPhoneNumber } from "../formater";

describe("transformPhoneNumber", () => {
  it("does not transform valid email addresses", async () => {
    const email = "admin@example.com";
    const result = await transformPhoneNumber(email);
    expect(result).toBe(email);
  });

  it("does not transform an already 62-prefixed phone number", async () => {
    const phone = "628123456789";
    const result = await transformPhoneNumber(phone);
    expect(result).toBe(phone);
  });

  it("does not transform a 62-prefixed phone number with plus", async () => {
    const phone = "+628123456789";
    const result = await transformPhoneNumber(phone);
    expect(result).toBe("628123456789");
  });

  it("transforms a 0-prefixed Indonesian phone number to 62", async () => {
    const phone = "08123456789";
    const result = await transformPhoneNumber(phone);
    expect(result).toBe("628123456789");
  });
});
