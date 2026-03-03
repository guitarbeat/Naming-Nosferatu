with open("server/validation.test.ts", "r") as f:
    content = f.read()

content = content.replace(
    'userId: "00000000-0000-0000-0000-000000000000",',
    'userId: "mocked-jwt-token",'
)

with open("server/validation.test.ts", "w") as f:
    f.write(content)


with open("server/routes.db.test.ts", "r") as f:
    content = f.read()

if 'import jwt from "jsonwebtoken";' not in content:
    content = 'import jwt from "jsonwebtoken";\n' + content

content = content.replace(
    'userId: "00000000-0000-0000-0000-000000000000",',
    'userId: jwt.sign({ userId: "00000000-0000-0000-0000-000000000000" }, process.env.JWT_SECRET || "default-dev-secret"),'
)

with open("server/routes.db.test.ts", "w") as f:
    f.write(content)
