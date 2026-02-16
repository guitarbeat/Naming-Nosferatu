import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { router } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
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
