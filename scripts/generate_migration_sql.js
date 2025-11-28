const fs = require('fs');
const path = require('path');

const TABLES = [
    'cat_name_options',
    'cat_app_users',
    'cat_name_ratings',
    'tournament_selections',
    'site_settings'
];

function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'number') return val;
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    return `'${val.replace(/'/g, "''")}'`;
}

function generateSql(table, data) {
    if (data.length === 0) return '';

    const columns = Object.keys(data[0]);
    const chunks = [];
    const chunkSize = 1000;

    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const values = chunk.map(row => {
            return `(${columns.map(col => escapeSql(row[col])).join(', ')})`;
        });

        chunks.push(`
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES 
      ${values.join(',\n')}
      ON CONFLICT DO NOTHING;
    `);
    }

    return chunks.join('\n');
}

function main() {
    let fullSql = '';

    for (const table of TABLES) {
        const filePath = path.join(__dirname, 'data', `${table}.json`);
        if (fs.existsSync(filePath)) {
            console.log(`Generating SQL for ${table}...`);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            fullSql += generateSql(table, data);
        }
    }

    fs.writeFileSync(path.join(__dirname, 'import_data.sql'), fullSql);
    console.log('SQL generation complete: scripts/import_data.sql');
}

main();
