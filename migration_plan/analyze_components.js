
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve('e:/vocab_web/client/src');
const PAGES_DIR = path.join(ROOT_DIR, 'pages/mobile');
const COMP_DIR = path.join(ROOT_DIR, 'components');

const allFiles = [];
const componentMap = {}; // { id: { cleanName, type, fullPath, imports: [], usedBy: [] } }

// Helper to crawl directories
function crawl(dir, type) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            crawl(fullPath, type);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            const id = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');
            componentMap[id] = {
                id,
                cleanName: path.basename(file, path.extname(file)),
                type: type,
                fullPath,
                imports: [],
                usedBy: 0
            };
            allFiles.push(id);
        }
    });
}

// 1. Index all files
console.log('Indexing files...');
crawl(PAGES_DIR, 'Page');
crawl(COMP_DIR, 'Component');

// 2. Parse imports
console.log('Parsing imports...');
Object.values(componentMap).forEach(comp => {
    const content = fs.readFileSync(comp.fullPath, 'utf8');
    const importRegex = /import\s+(?:(\w+)|\{([^}]+)\})\s+from\s+['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[3];
        // Resolve path
        if (importPath.startsWith('.')) {
            const dir = path.dirname(comp.fullPath);
            const resolvedAbs = path.resolve(dir, importPath);

            // Try extensions
            let foundId = null;
            ['.jsx', '.js', '/index.jsx', '/index.js', ''].forEach(ext => {
                if (foundId) return;
                const testPath = resolvedAbs + ext;
                if (fs.existsSync(testPath) && !fs.statSync(testPath).isDirectory()) {
                    const rel = path.relative(ROOT_DIR, testPath).replace(/\\/g, '/');
                    if (componentMap[rel]) foundId = rel;
                }
            });

            if (foundId) {
                comp.imports.push(foundId);
                componentMap[foundId].usedBy++;
            }
        }
    }
});

// 3. Generate CSV
console.log('Generating CSV...');
const csvRows = [
    'Component Name,Type,Path,Used By Count,Linked To (Dependencies),Is Migrated,Is Tested'
];

// Sort: Pages first, then by usage types
const sortedIds = Object.keys(componentMap).sort((a, b) => {
    const typeA = componentMap[a].type;
    const typeB = componentMap[b].type;
    if (typeA === 'Page' && typeB !== 'Page') return -1;
    if (typeA !== 'Page' && typeB === 'Page') return 1;
    return 0;
});

sortedIds.forEach(id => {
    const comp = componentMap[id];
    // Clean dependencies list for CSV (just names to keep it readable, or IDs)
    const deps = comp.imports.map(impId => componentMap[impId]?.cleanName || impId).join('; ');

    csvRows.push(`${comp.cleanName},${comp.type},${comp.id},${comp.usedBy},"${deps}",[ ],[ ]`);
});

const outputPath = path.resolve('e:/vocab_web/migration_plan/MIGRATION_COMPONENTS.csv');
fs.writeFileSync(outputPath, csvRows.join('\n'));
console.log(`CSV written to ${outputPath}`);
