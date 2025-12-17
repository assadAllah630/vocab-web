const fs = require('fs');
const path = require('path');

const csvPath = 'e:\\vocab_web\\migration_plan\\MIGRATION_COMPONENTS_DEEP.csv';
const outputCsvPath = 'e:\\vocab_web\\migration_plan\\REACT_PAGE_INTERACTIVITY.csv';
const baseDir = 'e:\\vocab_web';

// Keywords to detect API usage in the whole file (context)
const apiKeywords = ['api.get', 'api.post', 'api.put', 'api.delete', 'axios', 'fetch', 'useMutation', 'useQuery', 'unified_ai', 'generate_ai'];

function parseReactFile(relPath) {
    const fullPath = path.join(baseDir, relPath);
    if (!fs.existsSync(fullPath)) return [];

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    const interactions = [];

    // Naive state to find buttons and handlers
    // We scan likely interactive elements

    // 1. Find all `onClick={...}` or `onSubmit={...}`
    // Regex: /(onClick|onSubmit)\s*=\s*{?([^}]+)}?/g

    // We'll iterate lines to get context (label)

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        const eventMatch = line.match(/(onClick|onSubmit|onPress)\s*=\s*{(.+?)}/);
        if (eventMatch) {
            const eventType = eventMatch[1];
            const handler = eventMatch[2];

            // Look for label (text content or aria-label or title)
            let label = 'Unknown';

            // Check same line for text
            const textMatch = line.match(/>([^<]+)</);
            if (textMatch) label = textMatch[1];

            // Check previous line for label/icon
            if (label === 'Unknown' && i > 0) {
                const prev = lines[i - 1].trim();
                if (prev.match(/>([^<]+)</)) label = prev.match(/>([^<]+)</)[1];
                if (prev.includes('Icon')) label = 'Icon';
            }

            // Check next line for label
            if (label === 'Unknown' && i < lines.length - 1) {
                const next = lines[i + 1].trim();
                if (next.match(/^([^<]+)</)) label = next.match(/^([^<]+)</)[1]; // Text start of line
                if (next.includes('Icon')) label = 'Icon';
            }

            // Guess API usage for this handler
            // If handler is a name "handleClick", find that function def
            let potentialApi = 'None';

            // If handler is inline "() => api.post(...)"
            if (handler.includes('api.') || handler.includes('fetch') || handler.includes('dispatch')) {
                potentialApi = 'Direct Call';
            } else if (handler.match(/^[a-zA-Z0-9_]+$/)) {
                // It's a function name, search for its definition
                // const handlerName = ...
                // function handlerName...
                const cleanHandler = handler.replace('() => ', '').replace('()=>', '').trim();
                const funcDefRegex = new RegExp(`(const|function)\\s+${cleanHandler}\\s*[=(]`);

                // Scan file for this function
                // This is expensive/hacky in simple JS loop but usable
                const fileContent = lines.join('\n');
                const defIndex = fileContent.search(funcDefRegex);
                if (defIndex !== -1) {
                    // Grab a chunk of 500 chars after definition to look for API calls
                    const chunk = fileContent.substring(defIndex, defIndex + 800);
                    for (const kw of apiKeywords) {
                        if (chunk.includes(kw)) {
                            potentialApi = kw;
                            break;
                        }
                    }
                }
            }

            interactions.push({
                element: findElementType(line),
                label: label.trim(),
                event: eventType,
                handler: handler,
                api: potentialApi
            });
        }
    }

    return interactions;
}

function findElementType(line) {
    if (line.includes('<button')) return 'button';
    if (line.includes('<motion.button')) return 'motion.button';
    if (line.includes('<div')) return 'div (clickable)';
    if (line.includes('<span')) return 'span (clickable)';
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

    let output = 'Component,React File,Element,Label,Event,Handler,Inferred API\n';

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const parts = line.split(',');
        const name = parts[0];
        const type = parts[1];
        const pathStr = parts[8]; // Column 9 is Path

        if (pathStr && (pathStr.startsWith('pages/mobile') || pathStr.startsWith('components/mobile') || pathStr.includes('Mobile'))) {
            // Process ONLY mobile/relevant files as requested (or all?)
            // User said "BASE ON THE PAGE IN THE CSV... ALL BUTTON... IN MOBILE REACT"
            // So we focus on items that have a path.

            const interactions = parseReactFile(pathStr);
            if (interactions.length > 0) {
                interactions.forEach(item => {
                    // Sanitize
                    const safeHandler = `"${item.handler.replace(/"/g, "'")}"`;
                    const safeLabel = `"${item.label.replace(/"/g, "'")}"`;
                    output += `${name},${pathStr},${item.element},${safeLabel},${item.event},${safeHandler},${item.api}\n`;
                });
            } else {
                output += `${name},${pathStr},No Click Handlers Found,-,-,-,-\n`;
            }
        }
    }

    fs.writeFileSync(outputCsvPath, output, 'utf8');
    console.log(`Generated ${outputCsvPath}`);
}

generateReport();
