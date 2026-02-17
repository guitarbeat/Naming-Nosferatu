import type { NextFunction, Request, Response } from "express";

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
	const adminKey = process.env.ADMIN_API_KEY;
	const requestKey = req.headers["x-admin-key"];

	if (!adminKey) {
		console.error("ADMIN_API_KEY is not set in environment variables.");
		return res.status(500).json({ error: "Server configuration error" });
	}

	if (requestKey && requestKey === adminKey) {
		return next();
	}

	return res.status(401).json({ error: "Unauthorized" });
};
