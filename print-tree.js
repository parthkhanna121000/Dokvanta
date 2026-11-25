const fs = require('fs');
const path = require('path');

const IGNORE = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  '__pycache__',
  'venv',
  '.venv',
  'dist',
  'build',
  '.DS_Store',
  'coverage'
]);

function printTree(dir, prefix = '') {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => !IGNORE.has(e.name))
      .sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name));

    entries.forEach((entry, index) => {
      const isLast = index === entries.length - 1;
      const marker = isLast ? '└── ' : '├── ';
      console.log(`${prefix}${marker}${entry.name}${entry.isDirectory() ? '/' : ''}`);
      if (entry.isDirectory()) {
        printTree(path.join(dir, entry.name), `${prefix}${isLast ? '    ' : '│   '}`);
      }
    });
  } catch (err) {
    // Skip unreadable directories
  }
}

console.log('📁 Dokvanta Project Structure:');
printTree(process.cwd());