import { describe, expect, it } from "vitest";
import { isRpcSignatureError } from "./errors";

describe("isRpcSignatureError", () => {
	it("returns true for errors containing 'function' and 'does not exist'", () => {
		expect(isRpcSignatureError("function get_user does not exist")).toBe(true);
		expect(isRpcSignatureError("The function does not exist")).toBe(true);
	});

	it("returns true for errors containing 'function' and 'no function matches'", () => {
		expect(isRpcSignatureError("no function matches the given signature")).toBe(true);
	});

	it("returns true for errors containing 'function' and 'could not find'", () => {
		expect(isRpcSignatureError("could not find function in schema")).toBe(true);
	});

	it("is case-insensitive", () => {
		expect(isRpcSignatureError("FUNCTION does not EXIST")).toBe(true);
		expect(isRpcSignatureError("NO FUNCTION MATCHES")).toBe(true);
		expect(isRpcSignatureError("COULD NOT FIND FUNCTION")).toBe(true);
	});

	it("returns false if 'function' is missing", () => {
		expect(isRpcSignatureError("table does not exist")).toBe(false);
		expect(isRpcSignatureError("could not find the file")).toBe(false);
	});

	it("returns false if the specific error condition is missing", () => {
		expect(isRpcSignatureError("function executed successfully")).toBe(false);
		expect(isRpcSignatureError("error in function")).toBe(false);
	});

	it("returns false for empty strings", () => {
		expect(isRpcSignatureError("")).toBe(false);
	});
});
