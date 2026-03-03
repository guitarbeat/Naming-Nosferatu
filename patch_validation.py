with open("server/validation.ts", "r") as f:
    content = f.read()

content = content.replace(
    'userId: z.string().uuid(),',
    'userId: z.string(),'
)

with open("server/validation.ts", "w") as f:
    f.write(content)
