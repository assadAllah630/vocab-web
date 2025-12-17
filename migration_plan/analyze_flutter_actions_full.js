const fs = require('fs');
const path = require('path');

const outputCsvPath = 'e:\\vocab_web\\migration_plan\\FLUTTER_FULL_INTERACTIVITY.csv';
const baseSearchDirs = [
    'e:\\vocab_web\\flutter_app\\lib\\features'
];

function getAllFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles || [];
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
        } else {
            if (file.endsWith('.dart')) {
                arrayOfFiles.push(path.join(dirPath, file));
            }
        }
    });
    return arrayOfFiles;
}

function parseFlutterFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const results = [];
    const fileName = path.basename(filePath);
    const relPath = filePath.replace('e:\\vocab_web\\flutter_app\\lib\\features\\', '');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Match onPressed: or onTap:
        if (line.match(/(onPressed|onTap):\s*/)) {
            const event = line.includes('onPressed') ? 'onPressed' : 'onTap';

            // Extract handler snippet
            let handler = '';
            if (line.includes('=>')) {
                handler = line.split('=>')[1].trim();
            } else if (line.includes('() {')) {
                // Grab next line as snippet
                if (lines[i + 1]) handler = lines[i + 1].trim();
            } else {
                // Named function?
                const parts = line.split(':');
                if (parts[1]) handler = parts[1].trim().replace(',', '');
            }

            // Extract Label (Look backwards)
            let label = 'Unknown';
            for (let j = 1; j <= 10; j++) {
                if (i - j < 0) break;
                const prev = lines[i - j].trim();

                // Text('Label')
                const textMatch = prev.match(/Text\(['"]([^'"]+)['"]\)/);
                if (textMatch) {
                    label = textMatch[1];
                    break;
                }
                // Icon(Icons.name)
                const iconMatch = prev.match(/Icon\(([^)]+)\)/);
                if (iconMatch) {
                    label = 'Icon: ' + iconMatch[1];
                    break;
                }
                // label: Text(...)
                if (prev.includes('label:') && prev.includes('Text')) {
                    const lMatch = prev.match(/Text\(['"]([^'"]+)['"]\)/);
                    if (lMatch) {
                        label = lMatch[1];
                        break;
                    }
                }
                // tooltip: '...'
                if (prev.includes('tooltip:')) {
                    const tMatch = prev.match(/tooltip:\s*['"]([^'"]+)['"]/);
                    if (tMatch) {
                        label = tMatch[1];
                        break;
                    }
                }
            }

            // Infer Widget Type
            let elType = 'GestureDetector';
            for (let j = 0; j <= 5; j++) {
                if (i - j < 0) break;
                const prev = lines[i - j];
                if (prev.includes('ElevatedButton')) { elType = 'ElevatedButton'; break; }
                if (prev.includes('TextButton')) { elType = 'TextButton'; break; }
                if (prev.includes('IconButton')) { elType = 'IconButton'; break; }
                if (prev.includes('FloatingActionButton')) { elType = 'FAB'; break; }
                if (prev.includes('InkWell')) { elType = 'InkWell'; break; }
                if (prev.includes('ListTile')) { elType = 'ListTile'; break; }
            }

            // Infer Logic
            let api = '-';
            if (handler.includes('context.push') || handler.includes('context.go')) api = 'Navigation';
            if (handler.includes('ref.read')) api = 'State/API';
            if (handler.includes('http') || handler.includes('dio')) api = 'Direct API';
            if (handler.includes('print')) api = 'Debug Print';

            results.push({
                file: relPath,
                component: fileName, // Dart file is basically the component
                element: elType,
                label: label.substring(0, 50),
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

    let csv = 'Component,File,Element,Label,Event,Handler,Inferred Logic\n';
    let count = 0;

    allFiles.forEach(f => {
        const items = parseFlutterFile(f);
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
