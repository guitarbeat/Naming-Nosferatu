import fs from 'fs';
const file = 'src/shared/services/supabase/api.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace any with Record<string, unknown> or similar safely
content = content.replace(/let query: any = client\.from/g, 'let query = client.from');
content = content.replace(/const client = \(await resolveSupabaseClient\(\)\) as any;/g, 'const client = (await resolveSupabaseClient());');
content = content.replace(/const mapFields = <T extends Record<string, any>>/g, 'const mapFields = <T extends Record<string, unknown>>');
content = content.replace(/const mapSnakeToCamel = <T extends Record<string, any>>/g, 'const mapSnakeToCamel = <T extends Record<string, unknown>>');
content = content.replace(/const _mapCamelToSnake = <T extends Record<string, any>>/g, 'const _mapCamelToSnake = <T extends Record<string, unknown>>');
content = content.replace(/Record<string, any>/g, 'Record<string, unknown>');
content = content.replace(/item: any/g, 'item: { name: string; [key: string]: unknown }');

fs.writeFileSync(file, content);
