const fs = require('fs');

const filename = process.argv[2];
const startLine = parseInt(process.argv[3], 10);
const endLine = parseInt(process.argv[4], 10);

if (!filename || isNaN(startLine) || isNaN(endLine)) {
  console.error('Usage: node get_file_content.js <filename> <startLine> <endLine>');
  process.exit(1);
}

try {
  const fileContent = fs.readFileSync(filename, 'utf-8');
  const lines = fileContent.split('\n');
  const targetLines = lines.slice(Math.max(0, startLine - 1), endLine);

  targetLines.forEach((line, index) => {
    console.log(`${startLine + index}: ${line}`);
  });
} catch (error) {
  console.error(`Error reading file: ${error.message}`);
  process.exit(1);
}
