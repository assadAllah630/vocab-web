
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve('e:/vocab_web/client/src');
const PAGES_DIR = path.join(ROOT_DIR, 'pages/mobile');
const COMP_DIR = path.join(ROOT_DIR, 'components');

const componentMap = {};

function crawl(dir, type) {
    if (!fs.existsSync(dir)) return;
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
                name: path.basename(file, path.extname(file)),
                type,
                fullPath,
                stats: {
                    loc: 0,
                    hooks: 0,
                    libraries: new Set(),
                    children: new Set(),
                    htmlTags: new Set(),
                    complexityScore: 0
                }
            };
        }
    });
}

console.log('Indexing...');
crawl(PAGES_DIR, 'Page');
crawl(COMP_DIR, 'Component');

const KNOWN_LIBRARIES = [
    'react', 'framer-motion', 'axios', 'firebase', 'lucide-react',
    'react-router-dom', 'swiper', 'chart.js', 'leaflet'
];

console.log('Deep analyzing...');
Object.values(componentMap).forEach(comp => {
    const content = fs.readFileSync(comp.fullPath, 'utf8');

    // 1. LOC
    comp.stats.loc = content.split('\n').length;

    // 2. Hooks Usage (Regex approximation)
    const hookMatches = content.match(/use[A-Z]\w+/g) || [];
    comp.stats.hooks = hookMatches.length;

    // 3. Libraries Used
    const importLines = content.match(/import\s+.*from\s+['"](.*)['"]/g) || [];
    importLines.forEach(line => {
        const match = line.match(/from\s+['"](.*)['"]/);
        if (match) {
            const lib = match[1];
            if (!lib.startsWith('.')) {
                // Check if it's a known major lib or just a utility
                if (KNOWN_LIBRARIES.some(k => lib.includes(k))) {
                    comp.stats.libraries.add(lib);
                } else if (!lib.startsWith('/')) {
                    comp.stats.libraries.add(lib);
                }
            }
        }
    });

    // 4. Rendered Children (Capitalized JSX tags)
    // Looking for <ComponentName ...
    const jsxMatches = content.match(/<([A-Z]\w+)/g) || [];
    jsxMatches.forEach(tag => {
        const name = tag.substring(1); // remove <
        if (name !== comp.name) { // ignore self-reference/recursion
            comp.stats.children.add(name);
        }
    });

    // 5. HTML Elements (Lowercase JSX tags)
    const htmlMatches = content.match(/<([a-z]\w+)/g) || [];
    htmlMatches.forEach(tag => {
        comp.stats.htmlTags.add(tag.substring(1));
    });

    // 6. Complexity Score definition
    // LOC * 0.1 + Hooks * 2 + Children * 1
    comp.stats.complexityScore = Math.round(
        (comp.stats.loc * 0.05) +
        (comp.stats.hooks * 2) +
        (comp.stats.children.size * 1)
    );
});

console.log('Generating Deep CSV...');
const csvRows = [
    'Component Name,Type,Complexity Score,LOC,Hooks Count,3rd Party Libs,Rendered Children (Deep),HTML Elements,Path'
];

// Sort by Complexity Descending
const sorted = Object.values(componentMap).sort((a, b) => b.stats.complexityScore - a.stats.complexityScore);

sorted.forEach(c => {
    const libs = Array.from(c.stats.libraries).join('; ');
    const kids = Array.from(c.stats.children).join('; ');
    const html = Array.from(c.stats.htmlTags).slice(0, 5).join('; ') + (c.stats.htmlTags.size > 5 ? '...' : '');

    csvRows.push(
        `${c.name},${c.type},${c.stats.complexityScore},${c.stats.loc},${c.stats.hooks},"${libs}","${kids}","${html}",${c.id}`
    );
});

const outputPath = path.resolve('e:/vocab_web/migration_plan/MIGRATION_COMPONENTS_DEEP.csv');
fs.writeFileSync(outputPath, csvRows.join('\n'));
console.log(`Deep CSV written to ${outputPath}`);
