import re

with open("server/routes.ts", "r") as f:
    content = f.read()

# Import jwt
if 'import jwt from "jsonwebtoken";' not in content:
    content = 'import jwt from "jsonwebtoken";\n' + content

# Add JWT_SECRET
if 'const JWT_SECRET =' not in content:
    content = re.sub(
        r'(import .*? from ".*?";\n)(?!import)',
        r'\1\nconst JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret";\n',
        content,
        count=1
    )

# Update POST /api/users
content = content.replace(
    'userId: "mock-uuid",',
    'userId: jwt.sign({ userId: "mock-uuid" }, JWT_SECRET),'
)
content = content.replace(
    'res.json({ success: true, data: inserted });',
    'res.json({ success: true, data: { ...inserted, userId: jwt.sign({ userId: inserted.userId }, JWT_SECRET) } });'
)

# Replace GET /api/users/:userId/roles function body
get_roles_old = """router.get("/api/users/:userId/roles", async (req, res) => {
	try {
		if (!db) {
			return res.json([]);
		}
		const roles = await db.select().from(userRoles).where(eq(userRoles.userId, req.params.userId));
		res.json(roles);
	} catch (error) {
		console.error("Error fetching user roles:", error);
		res.status(500).json({ error: "Failed to fetch user roles" });
	}
});"""

get_roles_new = """router.get("/api/users/:userId/roles", async (req, res) => {
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
});"""

content = content.replace(get_roles_old, get_roles_new)

# Replace POST /api/ratings logic
post_ratings_old = """router.post("/api/ratings", async (req, res) => {
	try {
		const { userId, ratings } = saveRatingsSchema.parse(req.body);

		if (!db) {
			return res.json({ success: true, count: ratings.length });
		}

		// biome-ignore lint/suspicious/noExplicitAny: simple object type
		const records = ratings.map((r: any) => ({
			userId,
			nameId: r.nameId,
			rating: r.rating || 1500,
			wins: r.wins || 0,
			losses: r.losses || 0,
		}));"""

post_ratings_new = """router.post("/api/ratings", async (req, res) => {
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
		}));"""

content = content.replace(post_ratings_old, post_ratings_new)

with open("server/routes.ts", "w") as f:
    f.write(content)
