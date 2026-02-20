// @vitest-environment node
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { limitMock } = vi.hoisted(() => {
	const limitMock = vi.fn().mockResolvedValue([]);
	return { limitMock };
});

vi.mock("./db", () => {
	const queryBuilder = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockReturnThis(),
		limit: limitMock,
	};
	return {
		db: queryBuilder,
	};
});

import { router } from "./routes";

const app = express();
app.use(express.json());
app.use(router);

describe("Analytics Limit Protection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should clamp unlimited limit to 100", async () => {
		const largeLimit = 1000000;
		await request(app).get(`/api/analytics/leaderboard?limit=${largeLimit}`);

		expect(limitMock).toHaveBeenCalledWith(100);
	});

	it("should clamp unlimited limit for popularity to 100", async () => {
		const largeLimit = 1000000;
		await request(app).get(`/api/analytics/popularity?limit=${largeLimit}`);

		expect(limitMock).toHaveBeenCalledWith(100);
	});
});
