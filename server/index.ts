import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { router } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
	.split(",")
	.map((origin) => origin.trim())
	.filter((origin) => origin.length > 0);

if (process.env.NODE_ENV !== "production") {
	allowedOrigins.push(
		"http://localhost:5000",
		"http://localhost:5173",
		"http://localhost:3000",
		"http://localhost:3001",
	);
}

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
	}),
);

app.use(express.json({ limit: "10mb" }));

app.use(router);

const distPath = path.resolve(__dirname, "../dist");

app.use(express.static(distPath));

app.get("/{*path}", (_req, res) => {
	res.sendFile(path.join(distPath, "index.html"));
});

const PORT = parseInt(process.env.PORT || "3001", 10);

app.listen(PORT, "0.0.0.0", () => {
	console.log(`API server running on port ${PORT}`);
});
