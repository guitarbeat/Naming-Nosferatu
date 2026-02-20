import { describe, expect, it } from "vitest";
import { createNameSchema } from "./validation";

describe("Validation Schemas", () => {
	it("createNameSchema should validate status and provenance", () => {
		const input = {
			name: "Test Cat",
			description: "A secure cat",
			status: "approved",
			provenance: [
				{
					action: "created",
					timestamp: "2023-01-01T00:00:00Z",
					userId: "user123",
					details: { source: "test" },
				},
			],
		};

		const result = createNameSchema.parse(input);

		expect(result).toHaveProperty("name", "Test Cat");
		expect(result).toHaveProperty("status", "approved");
		expect(result).toHaveProperty("provenance");
		expect(result.provenance).toHaveLength(1);
		expect(result.provenance?.[0].action).toBe("created");
	});

<<<<<<< HEAD
	it("createNameSchema should reject invalid provenance", () => {
		const input = {
			name: "Test Cat",
			provenance: { source: "hacker" }, // Invalid: not an array
		};

		expect(() => createNameSchema.parse(input)).toThrow();
	});

	it("createNameSchema should reject invalid provenance entries", () => {
		const input = {
			name: "Test Cat",
			provenance: [{ source: "hacker" }], // Invalid entry: missing action, timestamp
		};

		expect(() => createNameSchema.parse(input)).toThrow();
	});

	it("createNameSchema should allow valid inputs without optional fields", () => {
=======
	it("createNameSchema should allow valid inputs", () => {
>>>>>>> origin/improve-repo-deps-tests-docs-7817015276857999243
		const input = {
			name: "Valid Cat",
			description: "Just a cat",
		};
		const result = createNameSchema.parse(input);
		expect(result.name).toBe("Valid Cat");
		expect(result.description).toBe("Just a cat");
<<<<<<< HEAD
		expect(result.status).toBeUndefined();
		expect(result.provenance).toBeUndefined();
=======
>>>>>>> origin/improve-repo-deps-tests-docs-7817015276857999243
	});
});
