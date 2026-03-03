import re

with open("server/routes.db.test.ts", "r") as f:
    content = f.read()

# Fix the test assertion for insertedCat since the res.body.data now contains userId too.
content = content.replace(
    'expect(res.body.data).toEqual(insertedCat);',
    'expect(res.body.data).toEqual(expect.objectContaining(insertedCat));\n\t\t\texpect(res.body.data).toHaveProperty("userId");'
)

with open("server/routes.db.test.ts", "w") as f:
    f.write(content)
