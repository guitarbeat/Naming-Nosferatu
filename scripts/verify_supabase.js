import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manual .env parser to avoid dotenv dependency if not installed
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const env = {};
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...value] = trimmed.split("=");
        if (key && value) {
          env[key.trim()] = value.join("=").trim();
        }
      }
    });
    return env;
  } catch (e) {
    console.error("Could not read .env file:", e);
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log("Testing connection to:", supabaseUrl);
// Don't log the full key for security, just the start
console.log(
  "Using Key (first 10 chars):",
  supabaseKey ? supabaseKey.substring(0, 10) + "..." : "MISSING",
);

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing URL or Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log("Attempting to fetch from 'cat_name_options'...");
    // Try a simple select. Even if empty, it should succeed if connected.
    const { data, error } = await supabase
      .from("cat_name_options")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.error("Connection Failed:", error);
      // Check for common error codes
      if (error.code === "PGRST301")
        console.error("Hint: Client may be blocked or table does not exist.");
    } else {
      console.log("Connection Successful!");
      console.log("Data/Count received:", data);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

testConnection();
