import { describe, expect, it } from "vitest";
import { isRpcSignatureError } from "./errors";

describe("isRpcSignatureError", () => {
	it('should return true when message contains "function" and "does not exist"', () => {
		expect(isRpcSignatureError("function my_rpc does not exist")).toBe(true);
	});

	it('should return true when message contains "function" and "no function matches"', () => {
		expect(isRpcSignatureError("No function matches the given name and argument types.")).toBe(
			true,
		);
	});

	it('should return true when message contains "function" and "could not find"', () => {
		expect(isRpcSignatureError("Could not find function 'get_data'")).toBe(true);
	});

	it("should be case-insensitive", () => {
		expect(isRpcSignatureError("FUNCTION XYZ DOES NOT EXIST")).toBe(true);
		expect(isRpcSignatureError("NO FUNCTION MATCHES")).toBe(true);
		expect(isRpcSignatureError("COULD NOT FIND FUNCTION")).toBe(true);
	});

	it('should return false when message contains "function" but no matching reason', () => {
		expect(isRpcSignatureError("function failed to execute")).toBe(false);
		expect(isRpcSignatureError("error in function logic")).toBe(false);
	});

	it('should return false when message contains a reason but not "function"', () => {
		expect(isRpcSignatureError("table does not exist")).toBe(false);
		expect(isRpcSignatureError("no matching record")).toBe(false);
		expect(isRpcSignatureError("could not find user")).toBe(false);
	});

	it("should return false for unrelated errors", () => {
		expect(isRpcSignatureError("Network error")).toBe(false);
		expect(isRpcSignatureError("timeout exceeded")).toBe(false);
		expect(isRpcSignatureError("SyntaxError: Unexpected token")).toBe(false);
	});

	it("should return false for empty strings", () => {
		expect(isRpcSignatureError("")).toBe(false);
	});
});
