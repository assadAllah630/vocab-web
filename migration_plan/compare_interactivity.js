const fs = require('fs');

const reactCsvPath = 'e:\\vocab_web\\migration_plan\\REACT_FULL_INTERACTIVITY.csv';
const flutterCsvPath = 'e:\\vocab_web\\migration_plan\\FLUTTER_FULL_INTERACTIVITY.csv';
const outputReportPath = 'e:\\vocab_web\\migration_plan\\INTERACTIVITY_GAP_REPORT.csv';

function parseCsv(path) {
    if (!fs.existsSync(path)) return [];
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        // Simple CSV parse (handling quotes roughly)
        // RegEx split by comma NOT in quotes
        const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        const parts = lines[i].split(regex);

        const item = {};
        headers.forEach((h, idx) => {
            let val = parts[idx] ? parts[idx].trim() : '';
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            item[h.trim()] = val;
        });
        data.push(item);
    }
    return data;
}

function run() {
    const reactActions = parseCsv(reactCsvPath);
    const flutterActions = parseCsv(flutterCsvPath);

    console.log(`Comparing ${reactActions.length} React actions vs ${flutterActions.length} Flutter actions.`);

    let report = 'Status,React Component,React Label,React Event,React API,Flutter Match (If Any)\n';

    let missingCount = 0;

    reactActions.forEach(r => {
        // Try to find match in Flutter
        // Match Criteria: 
        // 1. Component Name (Fuzzy) - e.g. MobileHome vs home_screen
        // 2. Label (Fuzzy) - e.g. "Generate" vs "Generate Story"

        let bestMatch = null;
        let bestScore = 0;

        flutterActions.forEach(f => {
            let score = 0;

            // Name Match
            const rName = r['Component'].toLowerCase().replace('mobile', '').replace('.jsx', '');
            const fName = f['Component'].toLowerCase().replace('_screen.dart', '').replace('.dart', '').replace('_', '');

            if (fName.includes(rName) || rName.includes(fName)) score += 3;

            // Label Match
            const rLabel = r['Label'].toLowerCase();
            const fLabel = f['Label'].toLowerCase();

            if (rLabel === fLabel) score += 5;
            else if (rLabel.includes(fLabel) || fLabel.includes(rLabel)) score += 2;

            if (score > 4 && score > bestScore) {
                bestScore = score;
                bestMatch = f;
            }
        });

        if (bestMatch) {
            report += `MATCH,${r['Component']},"${r['Label']}","${r['Event']}","${r['Inferred API']}","${bestMatch['Label']} (${bestMatch['Component']})"\n`;
        } else {
            report += `MISSING,${r['Component']},"${r['Label']}","${r['Event']}","${r['Inferred API']}",-\n`;
            missingCount++;
        }
    });

    fs.writeFileSync(outputReportPath, report, 'utf8');
    console.log(`Gap Analysis Complete. Found ${missingCount} potentially missing actions.`);
    console.log(`Report saved to ${outputReportPath}`);
}

run();
