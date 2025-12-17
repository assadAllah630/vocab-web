const fs = require('fs');
const path = require('path');

const REACT_DIR = 'e:\\vocab_web\\client\\src';
const FLUTTER_DIR = 'e:\\vocab_web\\flutter_app\\lib';
const OUTPUT_FILE = 'e:\\vocab_web\\migration_plan\\API_GAP_REPORT.csv';

// Regex patterns to capture API endpoints
const REACT_PATTERNS = [
    /(?:api|axios|http)\.(get|post|put|delete|patch)\s*\(\s*['"`](.*?)['"`]/gi,
    /url:\s*['"`](.*?)['"`]/gi,
    /fetch\s*\(\s*['"`](.*?)['"`]/gi
];

const FLUTTER_PATTERNS = [
    /(?:dio|http|apiClient)\.(get|post|put|delete|patch)\s*\(\s*['"`](.*?)['"`]/gi,
    /Uri\.parse\s*\(\s*['"`](.*?)['"`]/gi
];

function getAllFiles(dir, ext) {
    let files = [];
    if (!fs.existsSync(dir)) return files;

    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(getAllFiles(fullPath, ext));
        } else if (fullPath.endsWith(ext)) {
            files.push(fullPath);
        }
    });
    return files;
}

function extractApis(files, patterns, isFlutter = false) {
    const apis = new Set();

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        patterns.forEach(regex => {
            let match;
            // Reset regex state
            regex.lastIndex = 0;
            while ((match = regex.exec(content)) !== null) {
                let endpoint = match[match.length - 1]; // Last capture group is usually the URL

                // Normalization
                endpoint = endpoint.trim();

                // Ignore empty or obviously non-API strings
                if (!endpoint || endpoint.length < 2) return;

                // Filter out assets or internal routes if possible (heuristic)
                if (endpoint.startsWith('/assets') || endpoint.startsWith('assets/')) return;

                // For React, if it contains ${}, try to generalize
                if (endpoint.includes('${')) {
                    endpoint = endpoint.replace(/\$\{.*?\}/g, '{param}');
                }

                // For Flutter, if it contains $, try to generalize ($id or ${id})
                if (isFlutter) {
                    endpoint = endpoint.replace(/\$+[a-zA-Z0-9_]+/g, '{param}');
                    endpoint = endpoint.replace(/\$\{.*?\}/g, '{param}');
                }

                // If endpoint doesn't start with / or http, it might be a variable or relative.
                // We'll keep it but mark it.
                if (!endpoint.startsWith('/') && !endpoint.startsWith('http')) {
                    // check if it looks like an api path e.g. "auth/login"
                    if (!endpoint.match(/^[a-z0-9_-]+\//i)) return;
                }

                apis.add(endpoint);
            }
        });
    });
    return Array.from(apis).sort();
}

console.log('Scanning React APIs...');
const reactFiles = getAllFiles(REACT_DIR, '.jsx').concat(getAllFiles(REACT_DIR, '.js'));
const reactApis = extractApis(reactFiles, REACT_PATTERNS);

console.log('Scanning Flutter APIs...');
const flutterFiles = getAllFiles(FLUTTER_DIR, '.dart');
const flutterApis = extractApis(flutterFiles, FLUTTER_PATTERNS, true);

console.log(`Found ${reactApis.length} unique React APIs.`);
console.log(`Found ${flutterApis.length} unique Flutter APIs.`);

// Find Missing
const missingApis = reactApis.filter(api => {
    // Exact match
    if (flutterApis.includes(api)) return false;

    // Fuzzy match (ignore leading slash variation)
    const normalized = api.startsWith('/') ? api.substring(1) : api;
    const flutterNormalized = flutterApis.map(a => a.startsWith('/') ? a.substring(1) : a);

    if (flutterNormalized.includes(normalized)) return false;

    return true;
});

console.log(`Identified ${missingApis.length} potential missing APIs.`);

// Generate CSV
const csvContent = [
    'STATUS,API_ENDPOINT,DETECTED_IN_FLUTTER',
    ...missingApis.map(api => `MISSING,"${api}",NO`),
    ...flutterApis.map(api => `PRESENT,"${api}",YES`) // Optional: include what IS there for context? User asked for "unused in flutter"
    // User asked "create csv comtain all the api used in thr mobile react front, and not used in the flutter"
    // So usually just the missing ones.
].filter(line => line.startsWith('STATUS') || line.startsWith('MISSING')).join('\n');

fs.writeFileSync(OUTPUT_FILE, csvContent);
console.log(`CSV written to: ${OUTPUT_FILE}`);
