const fs = require('fs');

const csvPath = 'e:\\vocab_web\\migration_plan\\MIGRATION_COMPONENTS_DEEP.csv';

if (!fs.existsSync(csvPath)) {
    console.error("CSV not found at " + csvPath);
    process.exit(1);
}

const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n');

if (lines.length < 2) {
    console.log("Empty or invalid CSV");
    process.exit(1);
}

const headers = lines[0].split(',').map(h => h.trim());
console.log("Headers:", headers);

const nameIdx = headers.indexOf('Component Name');
const typeIdx = headers.indexOf('Type');
const pathIdx = headers.indexOf('Path');
const migratedIdx = headers.indexOf('Is Migrated');
const testedIdx = headers.indexOf('Is Tested');

const unmigrated = [];
const untested = [];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Quick and dirty CSV parse (assuming no commas in fields for now, as verified by file view)
    // Actually the file view shows "react; framer-motion" so there represent commas in quotes. 
    // Let's use a smarter regex split or the previous logic but cleaner.

    const parts = [];
    let inQuote = false;
    let current = '';
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current);

    // clean quotes
    const cleanParts = parts.map(p => p ? p.trim().replace(/^"|"$/g, '') : '');

    const name = cleanParts[nameIdx];
    const type = cleanParts[typeIdx];
    const path = cleanParts[pathIdx];
    const isMigrated = cleanParts[migratedIdx] && cleanParts[migratedIdx].toUpperCase() === 'TRUE';
    const isTested = cleanParts[testedIdx] && cleanParts[testedIdx].toUpperCase() === 'TRUE';

    if (!name) continue;

    if (!isMigrated) {
        unmigrated.push({ name, type, path });
    } else if (!isTested) {
        untested.push({ name, type, path });
    }
}

console.log(`\n\n=== VERIFICATION REPORT ===`);
console.log(`Total Unmigrated Apps: ${unmigrated.length}`);
console.log(`Total Untested Apps: ${untested.length}`);

if (unmigrated.length > 0) {
    console.log(`\n--- UNMIGRATED COMPONENTS ---`);
    unmigrated.forEach(item => {
        console.log(`[ ] ${item.name} (${item.type}) - ${item.path}`);
    });
}

if (untested.length > 0) {
    console.log(`\n--- MIGRATED BUT UNTESTED ---`);
    untested.forEach(item => {
        console.log(`[?] ${item.name} (${item.type}) - ${item.path}`);
    });
}
