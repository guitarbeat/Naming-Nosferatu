import re

with open("server/routes.ts", "r") as f:
    content = f.read()

# Add imports
if 'import jwt from "jsonwebtoken";' not in content:
    content = 'import jwt from "jsonwebtoken";\n' + content

# Add JWT_SECRET
if 'const JWT_SECRET =' not in content:
    import_match = re.search(r'import\s+.*?\s+from\s+["\'].*?["\'];\n+', content, flags=re.MULTILINE)
    if import_match:
        idx = import_match.end()
        # insert after the first chunk of imports. Let's just insert after imports.
        # Find last import
        imports = list(re.finditer(r'^import\s+.*?\s+from\s+["\'].*?["\'];', content, flags=re.MULTILINE))
        if imports:
            last_import = imports[-1]
            idx = last_import.end() + 1
            content = content[:idx] + '\nconst JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret";\n' + content[idx:]

# Update POST /api/users mock fallback
content = re.sub(
    r'userId:\s*"mock-uuid",',
    r'userId: jwt.sign({ userId: "mock-uuid" }, JWT_SECRET),',
    content
)

# Update POST /api/users real response
content = re.sub(
    r'res\.json\(\{\s*success:\s*true,\s*data:\s*inserted\s*\}\);',
    r'res.json({ success: true, data: { ...inserted, userId: jwt.sign({ userId: inserted.userId }, JWT_SECRET) } });',
    content
)

# Update GET /api/users/:userId/roles
roles_replacement = """
router.get("/api/users/:userId/roles", async (req, res) => {
	try {
		if (!db) {
			return res.json([]);
		}
		try {
			const decoded = jwt.verify(req.params.userId, JWT_SECRET) as { userId: string };
			const roles = await db.select().from(userRoles).where(eq(userRoles.userId, decoded.userId));
			res.json(roles);
		} catch (verifyError) {
			console.error("JWT verification failed:", verifyError);
			res.json([]);
		}
	} catch (error) {
		console.error("Error fetching user roles:", error);
		res.status(500).json({ error: "Failed to fetch user roles" });
	}
});
"""

# Replace GET /api/users/:userId/roles block
# We know the block starts with `router.get("/api/users/:userId/roles", async (req, res) => {` and ends with `});` before `// Save ratings`
content = re.sub(
    r'router\.get\("/api/users/:userId/roles", async \(req, res\) => \{.*?\}\);\n',
    roles_replacement.strip() + '\n',
    content,
    flags=re.DOTALL
)

# Update POST /api/ratings
ratings_replacement = """
// Save ratings
router.post("/api/ratings", async (req, res) => {
	try {
		const { userId, ratings } = saveRatingsSchema.parse(req.body);

		let realUserId: string;
		try {
			const decoded = jwt.verify(userId, JWT_SECRET) as { userId: string };
			realUserId = decoded.userId;
		} catch (verifyError) {
			console.error("JWT verification failed for ratings:", verifyError);
			return res.status(401).json({ error: "Unauthorized" });
		}

		if (!db) {
			return res.json({ success: true, count: ratings.length });
		}

		// biome-ignore lint/suspicious/noExplicitAny: simple object type
		const records = ratings.map((r: any) => ({
			userId: realUserId,
			nameId: r.nameId,
			rating: r.rating || 1500,
			wins: r.wins || 0,
			losses: r.losses || 0,
		}));
"""

# Find the start of POST /api/ratings up to the records map
content = re.sub(
    r'// Save ratings\nrouter\.post\("/api/ratings", async \(req, res\) => \{\n\s*try \{\n\s*const \{ userId, ratings \} = saveRatingsSchema\.parse\(req\.body\);\n\n\s*if \(!db\) \{\n\s*return res\.json\(\{ success: true, count: ratings\.length \}\);\n\s*\}\n\n\s*// biome-ignore lint/suspicious/noExplicitAny: simple object type\n\s*const records = ratings\.map\(\(r: any\) => \(\{\n\s*userId,\n\s*nameId: r\.nameId,\n\s*rating: r\.rating \|\| 1500,\n\s*wins: r\.wins \|\| 0,\n\s*losses: r\.losses \|\| 0,\n\s*\}\)\);',
    ratings_replacement.strip(),
    content,
    flags=re.DOTALL
)

with open("server/routes.ts", "w") as f:
    f.write(content)
