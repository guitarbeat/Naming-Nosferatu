import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
	process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
	process.env.SUPABASE_ANON_KEY ||
	process.env.SUPABASE_PUBLISHABLE_KEY;

interface SubmitNameRequest {
	name: string;
	description?: string;
	userName?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed. Use POST." });
	}

	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
		return res.status(500).json({
			error: "Server configuration error. Supabase credentials not found.",
		});
	}

	const { name, description = "", userName }: SubmitNameRequest = req.body;

	if (!name || typeof name !== "string" || name.trim().length === 0) {
		return res.status(400).json({ error: "Name is required and must be a non-empty string." });
	}

	const trimmedName = name.trim();
	if (trimmedName.length < 1 || trimmedName.length > 100) {
		return res.status(400).json({
			error: "Name must be between 1 and 100 characters.",
		});
	}

	const trimmedDescription = description?.trim() || "";

	try {
		const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

		if (userName?.trim()) {
			try {
				await supabase.rpc("set_user_context", {
					user_name_param: userName.trim(),
				});
			} catch (rpcError) {
				console.warn("Failed to set user context for RLS:", rpcError);
			}
		}

		const { data, error } = await supabase
			.from("cat_name_options")
			.insert([{ name: trimmedName, description: trimmedDescription }])
			.select()
			.single();

		if (error) {
			console.error("Error adding name:", error);
			return res.status(400).json({
				error: error.message || "Failed to add name",
				details: error.code,
			});
		}

		return res.status(200).json({
			success: true,
			data,
			message: `Name "${trimmedName}" submitted successfully!`,
		});
	} catch (err) {
		console.error("Unexpected error:", err);
		return res.status(500).json({
			error: "Internal server error",
			message: err instanceof Error ? err.message : "Unknown error",
		});
	}
}
