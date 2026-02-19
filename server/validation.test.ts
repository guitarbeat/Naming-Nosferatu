import { describe, expect, it } from "vitest";
import { createNameSchema } from "./validation";

describe("createNameSchema", () => {
  it("should validate a valid name", () => {
    const input = { name: "Test Cat" };
    const result = createNameSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Test Cat");
    }
  });

  it("should validate a valid name with description", () => {
    const input = { name: "Test Cat", description: "A test cat" };
    const result = createNameSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("A test cat");
    }
  });

  it("should validate a valid name with description and status", () => {
    const input = { name: "Test Cat", description: "A test cat", status: "candidate" };
    const result = createNameSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("candidate");
    }
  });

  it("should validate a name with max length (100)", () => {
    const input = { name: "a".repeat(100) };
    const result = createNameSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name.length).toBe(100);
    }
  });

  it("should validate a description with max length (500)", () => {
    const input = { name: "Test Cat", description: "a".repeat(500) };
    const result = createNameSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description?.length).toBe(500);
    }
  });

  it("should fail validation for empty name", () => {
    const input = { name: "" };
    const result = createNameSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe("too_small");
    }
  });

  it("should fail validation for missing name", () => {
    const input = { description: "Missing name" };
    const result = createNameSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
        expect(result.error.issues[0].code).toBe("invalid_type");
        expect(result.error.issues[0].path[0]).toBe("name");
    }
  });

  it("should fail validation for name too long (>100)", () => {
    const input = { name: "a".repeat(101) };
    const result = createNameSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe("too_big");
    }
  });

  it("should fail validation for description too long (>500)", () => {
    const input = { name: "Test Cat", description: "a".repeat(501) };
    const result = createNameSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe("too_big");
    }
  });

  it("should fail validation for invalid types", () => {
    const input = { name: 123 };
    const result = createNameSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe("invalid_type");
    }
  });

  it("should validate provenance data", () => {
    const input = { name: "Test Cat", provenance: { source: "manual", timestamp: "2023-01-01" } };
    const result = createNameSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.provenance).toEqual({ source: "manual", timestamp: "2023-01-01" });
    }
  });
});
