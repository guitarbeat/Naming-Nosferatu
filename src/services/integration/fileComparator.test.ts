// @ts-nocheck
// @ts-nocheck
import { describe, expect, it } from "vitest";
// @ts-ignore
import { compareFiles } from "./fileComparator";

describe("fileComparator", () => {
    it("should exist", () => {
        expect(compareFiles).toBeDefined();
    });
});
