import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export interface SubmitNameRequest {
	name: string;
	description?: string;
	userName?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	// Add CORS headers for browser access
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	res.setHeader("X-API-Version", "1.0");

	// Handle preflight requests
	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	// GET endpoint: Show usage instructions or check if name exists
	if (req.method === "GET") {
		// If 'name' query param provided, check if it exists
		if (req.query.name) {
			const checkName = String(req.query.name || "").trim();
			if (checkName.length === 0) {
				return res.status(400).json({ error: "Name parameter cannot be empty" });
			}

			if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
				return res.status(500).json({
					error: "Server configuration error. Supabase credentials not found.",
				});
			}

			try {
				const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
				const { data: existingName, error: checkError } = await supabase
					.from("cat_name_options")
					.select("id, name, description, is_active, is_hidden")
					.ilike("name", checkName)
					.maybeSingle();

				if (checkError) {
					return res.status(500).json({
						error: "Error checking name",
						details: checkError.message,
					});
				}

				return res.status(200).json({
					exists: !!existingName,
					name: checkName,
					data: existingName || null,
				});
			} catch (err) {
				return res.status(500).json({
					error: "Internal server error",
					message: err instanceof Error ? err.message : "Unknown error",
				});
			}
		}

		// Otherwise show usage instructions
		return res.status(200).json({
			message: "Cat Name Submission API",
			description: "Submit cat names to the Name Nosferatu database",
			usage: {
				post: {
					url: "/api/submit-name",
					method: "POST",
					contentType: "application/json",
					body: {
						name: "rococo",
						description: "An ornate art style from 18th century France",
						userName: "optional",
					},
					example: {
						curl: 'curl -X POST https://name-nosferatu.vercel.app/api/submit-name -H "Content-Type: application/json" -d \'{"name": "rococo", "description": "An ornate art style"}\'',
						javascript: `fetch('/api/submit-name', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'rococo', description: 'An ornate art style' })
})`,
					},
				},
				queryParams: {
					url: "/api/submit-name?name=rococo&description=An+ornate+art+style",
					method: "POST",
					parameters: {
						name: "required - The cat name (1-100 characters)",
						description: "optional - Description of the name",
						userName: "optional - Username for attribution",
					},
					example: "POST /api/submit-name?name=rococo&description=An+ornate+art+style",
				},
			},
			validation: {
				name: "Required, 1-100 characters (case-insensitive duplicate checking)",
				description: "Optional, max 500 characters",
				userName: "Optional, for attribution",
			},
			endpoints: {
				check: "GET /api/submit-name?name=rococo - Check if a name exists",
				submit: "POST /api/submit-name - Submit a new name",
				docs: "GET /api/submit-name - View this documentation",
			},
			response: {
				success: {
					status: 200,
					body: {
						success: true,
						data: { id: "...", name: "...", description: "..." },
						message: "Name submitted successfully!",
					},
				},
				error: {
					status: 400,
					body: { error: "Error message", details: "error code" },
				},
			},
		});
	}

	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
		return res.status(500).json({
			error: "Server configuration error. Supabase credentials not found.",
		});
	}

	// Support both JSON body and query parameters for flexibility
	const bodyData = req.method === "POST" ? req.body : {};
	const queryData = req.query || {};

	// Merge query params and body (body takes precedence)
	// Query params come as strings, so convert if needed
	const name =
		bodyData.name ||
		(typeof queryData.name === "string" ? queryData.name : String(queryData.name || ""));
	const description =
		bodyData.description ||
		(typeof queryData.description === "string"
			? queryData.description
			: String(queryData.description || ""));
	const userName =
		bodyData.userName ||
		(typeof queryData.userName === "string"
			? queryData.userName
			: String(queryData.userName || ""));

	if (!name || typeof name !== "string" || name.trim().length === 0) {
		return res.status(400).json({
			error: "Name is required and must be a non-empty string.",
			example: {
				json: { name: "rococo", description: "An ornate art style" },
				query: "/api/submit-name?name=rococo&description=An+ornate+art+style",
			},
		});
	}

	const trimmedName = name.trim();
	if (trimmedName.length < 1 || trimmedName.length > 100) {
		return res.status(400).json({
			error: "Name must be between 1 and 100 characters.",
		});
	}

	const trimmedDescription = description?.trim() || "";

	// Validate description length (max 500 characters)
	if (trimmedDescription.length > 500) {
		return res.status(400).json({
			error: "Description must be 500 characters or less.",
			received: trimmedDescription.length,
			max: 500,
		});
	}

	try {
		const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

		// Check for case-insensitive duplicate before inserting
		const { data: existingName } = await supabase
			.from("cat_name_options")
			.select("id, name")
			.ilike("name", trimmedName)
			.maybeSingle();

		if (existingName) {
			return res.status(409).json({
				error: "A similar name already exists.",
				existing: existingName.name,
				submitted: trimmedName,
				hint: "Names are case-insensitive. This name may already be in the database.",
				existingId: existingName.id,
			});
		}

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
			const errorResponse: {
				error: string;
				details?: string;
				hint?: string;
			} = {
				error: error.message || "Failed to add name",
				details: error.code,
			};

			// Add helpful hints for common errors
			if (error.code === "23505") {
				errorResponse.hint =
					"This name already exists in the database. Try a different name or check if it's already there.";
			} else if (error.code === "23514") {
				errorResponse.hint =
					"The name doesn't meet validation requirements. Ensure it's 1-100 characters.";
			}

			return res.status(400).json(errorResponse);
		}

		return res.status(200).json({
			success: true,
			data,
			message: `Name "${trimmedName}" submitted successfully!`,
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		console.error("Unexpected error:", err);
		return res.status(500).json({
			error: "Internal server error",
			message: err instanceof Error ? err.message : "Unknown error",
		});
	}
}
