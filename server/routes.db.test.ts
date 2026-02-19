// @vitest-environment node
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoist mocks to be available in vi.mock
const { insertMock, valuesMock } = vi.hoisted(() => {
	const valuesMock = vi.fn().mockResolvedValue([]);
	const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
	return { insertMock, valuesMock };
});

vi.mock("./db", () => ({
	db: {
		insert: insertMock,
	},
}));

// Import router AFTER mocking
import { router } from "./routes";

const app = express();
app.use(express.json());
app.use(router);

describe("POST /api/ratings with DB", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should insert ratings in a single batch (optimization verified)", async () => {
		const ratings = [
			{ name: "id1", rating: 1500, wins: 1 },
			{ name: "id2", rating: 1600, wins: 0 },
		];

		const res = await request(app).post("/api/ratings").send({
			userName: "testuser",
			ratings,
		});

		expect(res.status).toBe(200);

		// Optimization: insert should be called exactly once
		expect(insertMock).toHaveBeenCalledTimes(1);

		// Bug fix: nameId should be correctly mapped from input
		const firstCallArg = valuesMock.mock.calls[0][0];
		expect(Array.isArray(firstCallArg)).toBe(true);
		expect(firstCallArg.length).toBe(ratings.length);
		expect(firstCallArg[0].nameId).toBe("id1");
		expect(firstCallArg[1].nameId).toBe("id2");
	});
});
