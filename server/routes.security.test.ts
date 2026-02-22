// @vitest-environment node
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock requireAdmin
vi.mock("./auth", () => ({
	requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

// Hoist mocks
const { dbMocks } = vi.hoisted(() => {
	// Chainable mocks for SELECT
	const limitMock = vi.fn().mockResolvedValue([]);
	const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
	const groupByMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
	const innerJoinMock = vi.fn().mockReturnValue({ groupBy: groupByMock });
	const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });
	const selectMock = vi.fn().mockReturnValue({ from: fromMock });

	return {
		dbMocks: {
			select: selectMock,
			from: fromMock,
			innerJoin: innerJoinMock,
			groupBy: groupByMock,
			orderBy: orderByMock,
			limit: limitMock,
		},
	};
});

vi.mock("./db", () => ({
	db: {
		select: dbMocks.select,
	},
}));

import { router } from "./routes";

const app = express();
app.use(express.json());
app.use(router);

describe("Security Vulnerabilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		dbMocks.limit.mockResolvedValue([]);
	});

	describe("GET /api/analytics/popularity", () => {
		it("should clamp the limit parameter to prevent DoS", async () => {
			const largeLimit = 1000000;
			const expectedMaxLimit = 100;

			await request(app).get(`/api/analytics/popularity?limit=${largeLimit}`);

			// Verify that limit was called with a value <= 100
			// Use expect.objectContaining or a custom matcher if needed, but standard matchers work with toHaveBeenCalledWith
			const calledWith = dbMocks.limit.mock.calls[0][0];
			expect(calledWith).toBeLessThanOrEqual(expectedMaxLimit);
		});
	});

	describe("GET /api/analytics/leaderboard", () => {
		it("should clamp the limit parameter to prevent DoS", async () => {
			const largeLimit = 1000000;
			const expectedMaxLimit = 100;

			await request(app).get(`/api/analytics/leaderboard?limit=${largeLimit}`);

			const calledWith = dbMocks.limit.mock.calls[0][0];
			expect(calledWith).toBeLessThanOrEqual(expectedMaxLimit);
		});
	});
});
