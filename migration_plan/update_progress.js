const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const componentsToMark = [
    // Shared Layouts
    'MobileLayout',
    'MobileNav',
    'MobileAIWizardLayout',
    // Auth
    'Login', // Assuming Login.jsx isn't in parsing list but if it was
    // Home
    'MobileHome',
    'MobileHeroDashboardPreview',
    // UI Components
    'PrimaryButton',
    'AppInput',
    'MobileMarkdownRenderer', // We ported this
    'MobileStoryDisplay', // We ported this to StoryDisplay
    // AI Gateway
    'MobileAIGateway',
    'MobileAIGenerator',
    'MobileGenStory',
    'MobileGenDialogue',
    'MobileGenArticle'
];
const csvPath = 'e:\\vocab_web\\migration_plan\\MIGRATION_COMPONENTS_DEEP.csv';

try {
    // Read file
    const input = fs.readFileSync(csvPath, 'utf8');

    // Parse CSV
    const records = csv.parse(input, {
        columns: true,
        skip_empty_lines: true
    });

    // Update records
    let updatedCount = 0;
    for (const record of records) {
        // Add columns if missing (csv-parse treats them as keys)
        if (!record['Is Migrated']) record['Is Migrated'] = 'FALSE';
        if (!record['Is Tested']) record['Is Tested'] = 'FALSE';

        if (componentsToMark.includes(record['Component Name'])) {
            record['Is Migrated'] = 'TRUE';
            record['Is Tested'] = 'TRUE';
            updatedCount++;
            console.log(`Marked ${record['Component Name']} as Migrated & Tested`);
        }
    }

    // Write back
    const output = stringify(records, {
        header: true
    });

    fs.writeFileSync(csvPath, output);
    console.log(`Updated ${updatedCount} components.`);

} catch (err) {
    console.error('Error:', err);
}
