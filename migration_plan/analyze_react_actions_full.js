const fs = require('fs');
const path = require('path');

const outputCsvPath = 'e:\\vocab_web\\migration_plan\\REACT_FULL_INTERACTIVITY.csv';

// CORRECT PATHS for standard CREATE-REACT-APP structure seen in file list
const baseSearchDirs = [
    'e:\\vocab_web\\client\\src\\pages\\mobile',
    'e:\\vocab_web\\client\\src\\components\\mobile'
];

// Enhanced API patterns
const apiPatterns = [
    { type: 'POST', regex: /api\.post\s*\(\s*['"`]([^'"`]+)['"`]/ },
    { type: 'GET', regex: /api\.get\s*\(\s*['"`]([^'"`]+)['"`]/ },
    { type: 'PUT', regex: /api\.put\s*\(\s*['"`]([^'"`]+)['"`]/ },
    { type: 'DELETE', regex: /api\.delete\s*\(\s*['"`]([^'"`]+)['"`]/ },
    { type: 'AXIOS', regex: /axios\.(get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/ },
    { type: 'Nav', regex: /navigate\s*\(\s*['"`]([^'"`]+)['"`]/ },
    { type: 'Dispatch', regex: /dispatch\s*\(\s*([a-zA-Z0-9_]+)\(/ },
    { type: 'Mutation', regex: /useMutation\s*\(\s*([^)]+)\)/ },
    { type: 'Query', regex: /useQuery\s*\(\s*\[?['"`]([^'"`]+)['"`]/ }
];

function getAllFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) {
        console.warn(`Directory not found: ${dirPath}`);
        return arrayOfFiles || [];
    }
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx')) {
                arrayOfFiles.push(path.join(dirPath, file));
            }
        }
    });
    return arrayOfFiles;
}

function extractFunctionBody(fileContent, funcName) {
    if (!funcName) return null;
    const cleanName = funcName.replace(/\(.*\)/, '').trim();
    const regex = new RegExp(`(const|function)\\s+${cleanName}\\s*[=(]`);
    const match = fileContent.match(regex);
    if (!match) return null;

    let startIndex = match.index;
    let openBraceIndex = fileContent.indexOf('{', startIndex);
    if (openBraceIndex === -1) return null;

    let braceCount = 1;
    let currentIndex = openBraceIndex + 1;
    while (braceCount > 0 && currentIndex < fileContent.length) {
        if (fileContent[currentIndex] === '{') braceCount++;
        else if (fileContent[currentIndex] === '}') braceCount--;
        currentIndex++;
    }
    return fileContent.substring(startIndex, currentIndex);
}

function analyzeCode(code) {
    let apis = [];
    apiPatterns.forEach(p => {
        const match = code.match(p.regex);
        if (match) {
            apis.push(`${p.type}: ${match[1]}`);
        }
    });

    if (code.includes('api.') && apis.length === 0) apis.push('Generic API Call');
    if (code.includes('fetch(') && apis.length === 0) apis.push('Fetch Call');

    return apis.join(' | ');
}

function parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const results = [];
    const fileName = path.basename(filePath);
    const relPath = filePath.replace('e:\\vocab_web\\client\\src\\', ''); // Relative to scr

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const eventMatch = line.match(/(onClick|onSubmit|onPress|onChange)\s*=\s*{(.+?)}/);

        if (eventMatch) {
            const event = eventMatch[1];
            let handler = eventMatch[2];
            let api = '-';

            let label = 'Unknown';
            if (line.match(/>([^<]+)</)) label = line.match(/>([^<]+)</)[1];
            else {
                for (let j = 1; j <= 3; j++) {
                    if (i - j >= 0 && lines[i - j].match(/>([^<]+)</)) {
                        label = lines[i - j].match(/>([^<]+)</)[1];
                        break;
                    }
                }
            }

            if (handler.includes('=>')) {
                api = analyzeCode(handler);
                handler = 'Inline Function';
            } else {
                const body = extractFunctionBody(content, handler);
                if (body) {
                    api = analyzeCode(body);
                } else {
                    api = 'Ref (Unknown Body)';
                }
            }

            let elType = 'Element';
            if (line.includes('<button')) elType = 'Button';
            if (line.includes('<motion.button')) elType = 'MotionButton';
            if (line.includes('<div')) elType = 'Div';
            if (line.includes('<input')) elType = 'Input';
            if (line.includes('<form')) elType = 'Form';

            // Capture ANY interaction, even if label is unknown or API is none, to hit the "300" count
            results.push({
                file: relPath,
                component: fileName.replace('.jsx', ''),
                element: elType,
                label: label.trim().substring(0, 50),
                event: event,
                handler: handler.substring(0, 50),
                api: api
            });
        }
    }
    return results;
}

function run() {
    let allFiles = [];
    baseSearchDirs.forEach(d => {
        allFiles = allFiles.concat(getAllFiles(d));
    });

    console.log(`Scanning ${allFiles.length} files...`);

    let csv = 'Component,File,Element,Label,Event,Handler,Inferred API\n';
    let count = 0;

    allFiles.forEach(f => {
        const items = parseFile(f);
        items.forEach(item => {
            csv += `${item.component},${item.file},${item.element},"${item.label.replace(/"/g, "'")}","${item.event}","${item.handler.replace(/"/g, "'")}","${item.api}"\n`;
            count++;
        });
    });

    fs.writeFileSync(outputCsvPath, csv, 'utf8');
    console.log(`Found ${count} interactions.`);
    console.log(`Saved to ${outputCsvPath}`);
}

run();
