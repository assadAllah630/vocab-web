const fs = require('fs');
const path = require('path');

const csvPath = 'e:\\vocab_web\\migration_plan\\MIGRATION_COMPONENTS_DEEP.csv';
const outputCsvPath = 'e:\\vocab_web\\migration_plan\\REACT_DEEP_INTERACTIVITY.csv';
const baseDir = 'e:\\vocab_web';

// API detection
const apiPatterns = [
    { type: 'POST', regex: /api\.post\s*\(\s*['"`]([^'"`]+)['"`]/ },
    { type: 'GET', regex: /api\.get\s*\(\s*['"`]([^'"`]+)['"`]/ },
    { type: 'PUT', regex: /api\.put\s*\(\s*['"`]([^'"`]+)['"`]/ },
    { type: 'DELETE', regex: /api\.delete\s*\(\s*['"`]([^'"`]+)['"`]/ },
    { type: 'AXIOS', regex: /axios\.(get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/ }
];

function extractFunctionBody(fileContent, funcName) {
    // Naive function extraction
    // 1. const funcName = (...) => { ... }
    // 2. function funcName(...) { ... }

    // Find start index
    const regex1 = new RegExp(`const\\s+${funcName}\\s*=\\s*`);
    const regex2 = new RegExp(`function\\s+${funcName}\\s*\\(`);

    let match = fileContent.match(regex1) || fileContent.match(regex2);
    if (!match) return null;

    let startIndex = match.index;
    let openBraceIndex = fileContent.indexOf('{', startIndex);
    if (openBraceIndex === -1) return null;

    // Count braces to find end
    let braceCount = 1;
    let currentIndex = openBraceIndex + 1;

    while (braceCount > 0 && currentIndex < fileContent.length) {
        if (fileContent[currentIndex] === '{') braceCount++;
        else if (fileContent[currentIndex] === '}') braceCount--;
        currentIndex++;
    }

    return fileContent.substring(startIndex, currentIndex);
}

function analyzeHandler(handlerCode, context = '') {
    // Analyze code snippet for API calls and Navigation
    let apis = [];
    let navigation = [];

    // Check API patterns
    apiPatterns.forEach(p => {
        const match = handlerCode.match(p.regex);
        if (match) {
            apis.push(`${p.type}: ${match[1]}`);
        }
    });

    // Fallback: check for generalized api usage if regex failed
    if (apis.length === 0 && (handlerCode.includes('api.') || handlerCode.includes('fetch'))) {
        // Try to grab the line
        const lines = handlerCode.split('\n');
        lines.forEach(l => {
            if (l.includes('api.') || l.includes('fetch')) apis.push('Generic API Call: ' + l.trim().substring(0, 30) + '...');
        });
    }

    // Check Navigation
    if (handlerCode.includes('navigate(') || handlerCode.includes('history.push')) {
        const match = handlerCode.match(/navigate\(['"`]([^'"`]+)['"`]\)/);
        if (match) navigation.push(`Go to ${match[1]}`);
        else navigation.push('Navigate');
    }

    return { apis: apis.join(' | '), navigation: navigation.join(' | ') };
}

function parseReactFileDeep(relPath) {
    const fullPath = path.join(baseDir, relPath);
    if (!fs.existsSync(fullPath)) return [];

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    const interactions = [];

    // 1. Scan for Elements with handlers
    // Improved Regex to capture multiline props? Hard in JS regex. 
    // We scan line by line but track "open tag".

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Find click/submit
        const eventMatch = line.match(/(onClick|onSubmit|onPress)\s*=\s*{(.+?)}/);

        if (eventMatch) {
            const eventType = eventMatch[1];
            let handlerName = eventMatch[2]; // e.g., "handleSubmit", "() => verify()"

            // Clean handler name
            if (handlerName.includes('=>')) {
                // If inline function, we treat the inline code AS the body
                // Or if it calls a function "() => handleX()", we resolve "handleX"
                if (handlerName.match(/\(\)\s*=>\s*([a-zA-Z0-9_]+)\(/)) {
                    // calls function
                    handlerName = handlerName.match(/\(\)\s*=>\s*([a-zA-Z0-9_]+)\(/)[1];
                } else {
                    // Inline logic
                    handlerName = 'INLINE_LOGIC: ' + handlerName;
                }
            }

            // Get Label
            let label = 'Unknown';
            if (line.match(/>([^<]+)</)) label = line.match(/>([^<]+)</)[1];
            else if (i > 0 && lines[i - 1].match(/>([^<]+)</)) label = lines[i - 1].match(/>([^<]+)</)[1];
            else if (i < lines.length - 1 && lines[i + 1].match(/^([^<]+)</)) label = lines[i + 1].match(/^([^<]+)</)[1];

            // Analyze Logic
            let apiInfo = '-';
            let navInfo = '-';

            if (handlerName.startsWith('INLINE_LOGIC')) {
                const logic = handlerName.replace('INLINE_LOGIC: ', '');
                const result = analyzeHandler(logic);
                apiInfo = result.apis || '-';
                navInfo = result.navigation || '-';
            } else {
                // Find function definition
                const body = extractFunctionBody(content, handlerName);
                if (body) {
                    const result = analyzeHandler(body);
                    apiInfo = result.apis || '-';
                    navInfo = result.navigation || '-';
                }
            }

            if (label !== 'Unknown' || apiInfo !== '-' || navInfo !== '-') {
                interactions.push({
                    element: findElementType(line),
                    label: label.trim(),
                    event: eventType,
                    handler: handlerName,
                    api: apiInfo,
                    nav: navInfo
                });
            }
        }
    }

    return interactions;
}

function findElementType(line) {
    if (line.includes('<button')) return 'button';
    if (line.includes('<motion.button')) return 'motion.button';
    if (line.includes('<div')) return 'div';
    if (line.includes('<span')) return 'span';
    if (line.includes('<form')) return 'form';
    return 'element';
}

function generateReport() {
    if (!fs.existsSync(csvPath)) {
        console.error("Source CSV not found");
        return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');

    let output = 'Component,React File,Element,Label,Event,Handler,API Calls,Navigation\n';

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const parts = line.split(',');
        const name = parts[0];
        const pathStr = parts[8];

        if (pathStr && (pathStr.startsWith('pages/mobile') || pathStr.startsWith('components/mobile') || pathStr.includes('Mobile'))) {
            const interactions = parseReactFileDeep(pathStr);
            if (interactions.length > 0) {
                interactions.forEach(item => {
                    const safeLabel = `"${item.label.replace(/"/g, "'")}"`;
                    const safeApi = `"${item.api.replace(/"/g, "'")}"`;
                    const safeNav = `"${item.nav.replace(/"/g, "'")}"`;
                    output += `${name},${pathStr},${item.element},${safeLabel},${item.event},${item.handler},${safeApi},${safeNav}\n`;
                });
            }
        }
    }

    fs.writeFileSync(outputCsvPath, output, 'utf8');
    console.log(`Generated ${outputCsvPath}`);
}

generateReport();
