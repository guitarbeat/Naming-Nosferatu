import { expect, test } from "vitest";
import { escapeCSVField, sanitizeCSVField } from "./basic";

test("sanitizeCSVField escapes formula characters", () => {
	expect(sanitizeCSVField("=SUM(1,2)")).toBe("'=SUM(1,2)");
	expect(sanitizeCSVField("+123")).toBe("'+123");
	expect(sanitizeCSVField("-123")).toBe("'-123");
	expect(sanitizeCSVField("@foo")).toBe("'@foo");
	expect(sanitizeCSVField("Normal")).toBe("Normal");
});

test("escapeCSVField handles quotes and delimiters", () => {
	expect(escapeCSVField("foo,bar")).toBe("\"foo,bar\"");
	expect(escapeCSVField("foo\"bar")).toBe("\"foo\"\"bar\"");
	expect(escapeCSVField("foo\nbar")).toBe("\"foo\nbar\"");
	expect(escapeCSVField("=1+1")).toBe("'=1+1");
	expect(escapeCSVField("=1,2")).toBe("\"'=1,2\""); // Formula escaped first, then wrapped due to comma
});
