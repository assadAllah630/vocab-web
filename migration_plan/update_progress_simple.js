const fs = require('fs');
const csvPath = 'e:\\vocab_web\\migration_plan\\MIGRATION_COMPONENTS_DEEP.csv';

const componentsToMark = [
    // Completed in this session
    'MobileAddWord',
    'MobileGrammarGenerate',
    'MobileAbout',
    'MobileHelp',
    'MobileNotifications',
    'NotificationsScreen',
    'PricingSection',
    'HeroSection',
    'OfflineIndicator',
    'ErrorFallback',
    // Final Batch - Integrated Components
    'MobilePractice',
    'MobileArticleDisplay',
    'MobileDialogueDisplay',
    'VocabularyMastery'
];

if (!fs.existsSync(csvPath)) {
    console.error("CSV not found");
    process.exit(1);
}

let content = fs.readFileSync(csvPath, 'utf8');
let updatedCount = 0;

componentsToMark.forEach(comp => {
    // Regex to find line starting with CompName
    // And ensure last two cols are FALSE or mixed

    // Pattern: 
    // Start of line (or \n), ComponentName, (any chars), FALSE, FALSE (end of line)
    // We replace the whole "FALSE,FALSE" part with "TRUE,TRUE"

    const regex = new RegExp(`^(${comp},.*?)FALSE,FALSE$`, 'gm');

    if (regex.test(content)) {
        content = content.replace(regex, `$1TRUE,TRUE`);
        console.log(`Updated ${comp}`);
        updatedCount++;
    } else {
        // Try with spaces around commas? The file seems to allow some variety but usually no spaces in CSV values
        // Let's try matching just the end of line relative to the name
        // Brute force: find the line, check if it contains FALSE, replace

        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith(comp + ',')) {
                if (lines[i].includes(',FALSE,FALSE')) {
                    lines[i] = lines[i].replace(',FALSE,FALSE', ',TRUE,TRUE');
                    console.log(`Updated ${comp} manually`);
                    updatedCount++;
                } else if (lines[i].includes(',FALSE,TRUE')) {
                    // Migrated but not tested?
                    lines[i] = lines[i].replace(',FALSE,TRUE', ',TRUE,TRUE');
                    console.log(`Updated ${comp} manually (tested)`);
                    updatedCount++;
                } else if (lines[i].includes(',TRUE,FALSE')) {
                    lines[i] = lines[i].replace(',TRUE,FALSE', ',TRUE,TRUE');
                    console.log(`Updated ${comp} manually (migrated)`);
                    updatedCount++;
                }
                break; // Found it
            }
        }
        content = lines.join('\n');
    }
});

fs.writeFileSync(csvPath, content, 'utf8');
console.log(`Total updated: ${updatedCount}`);
