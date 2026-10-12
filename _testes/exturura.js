// tree.js
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const IGNORE_DIRS = new Set(['node_modules', '.git', '.idea', '.vscode', 'dist', 'coverage']);
const IGNORE_EXT = ['.obj', '.png', '.jpg'];

function shouldIgnore(entry) {
  if (entry.isDirectory()) return IGNORE_DIRS.has(entry.name);
  const name = entry.name.toLowerCase();
  return IGNORE_EXT.some((ext) => name.endsWith(ext));
}

function printTree(dir, prefix = '') {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !shouldIgnore(e))
    .sort((a, b) => {
      // pastas primeiro, depois arquivos, ambos em ordem alfabética
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const label = entry.isDirectory() ? `${entry.name}/` : entry.name;
    console.log(prefix + connector + label);

    if (entry.isDirectory()) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      printTree(path.join(dir, entry.name), nextPrefix);
    }
  });
}

console.log(path.basename(root) + '/');
printTree(root);