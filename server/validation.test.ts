import { describe, expect, it } from "vitest";
import { createNameSchema } from "./validation";

describe("Validation Schemas", () => {
	it("createNameSchema should strip status and provenance", () => {
		const input = {
			name: "Test Cat",
			description: "A secure cat",
			status: "approved",
			provenance: { source: "hacker" },
		};

		const result = createNameSchema.parse(input);

		expect(result).toHaveProperty("name", "Test Cat");
		expect(result).not.toHaveProperty("status");
		expect(result).not.toHaveProperty("provenance");
	});

    it("createNameSchema should allow valid inputs", () => {
        const input = {
            name: "Valid Cat",
            description: "Just a cat",
        };
        const result = createNameSchema.parse(input);
        expect(result.name).toBe("Valid Cat");
        expect(result.description).toBe("Just a cat");
    });
});
