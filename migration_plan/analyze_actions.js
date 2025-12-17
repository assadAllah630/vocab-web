const fs = require('fs');
const path = require('path');

const csvPath = 'e:\\vocab_web\\migration_plan\\MIGRATION_COMPONENTS_DEEP.csv';
const flutterBase = 'e:\\vocab_web\\flutter_app\\lib\\features';
const outputCsvPath = 'e:\\vocab_web\\migration_plan\\PAGE_INTERACTIVITY_MAP.csv';

// Map React Name to Flutter File Path (Relative to features)
const mapping = {
    'MobileHome': 'home/screens/home_screen.dart',
    'MobileReader': 'reader/screens/reader_screen.dart',
    'MobilePodcastStudio': 'podcast/screens/podcast_screen.dart',
    'MobileNotifications': 'notifications/screens/notifications_screen.dart',
    'MobileProfile': 'profile/screens/profile_screen.dart',
    'MobileEditProfile': 'profile/screens/edit_profile_screen.dart',
    'MobileSettings': 'profile/screens/settings_screen.dart', // Helper
    'MobileLanguageSettings': 'profile/screens/language_settings_screen.dart',
    'MobileAPISettings': 'profile/screens/api_settings_screen.dart',
    'MobileLogin': 'auth/widgets/login_screen.dart',
    'MobileAIGateway': 'ai/screens/ai_gateway_screen.dart',
    'MobileAIGenerator': 'ai/screens/ai_generator_screen.dart',
    'MobileGenStory': 'ai/screens/gen_story_screen.dart',
    'MobileGenDialogue': 'ai/screens/gen_dialogue_screen.dart',
    'MobileGenArticle': 'ai/screens/gen_article_screen.dart',
    'MobileContentLibrary': 'library/screens/library_screen.dart', // Mapping Library
    'MobileExam': 'exams/screens/exam_dashboard_screen.dart',
    'MobileExamCreate': 'exams/screens/exam_create_screen.dart',
    'MobileExamPlay': 'exams/screens/exam_play_screen.dart',
    'MobileGames': 'vocab/screens/vocab_dashboard_screen.dart', // Base for games
    'MobileFlashcard': 'vocab/screens/flashcards_screen.dart',
    'MobileWordBuilder': 'vocab/screens/word_builder_screen.dart',
    'MobileMemoryMatch': 'vocab/screens/memory_match_screen.dart',
    'MobileTimeChallenge': 'vocab/screens/time_challenge_screen.dart',
    'MobileAddWord': 'vocab/screens/add_word_screen.dart',
    'MobileGrammarGenerate': 'reader/screens/grammar_generator_screen.dart',
    'MobileAbout': 'settings/screens/about_screen.dart',
    'MobileHelp': 'settings/screens/help_screen.dart',
    'PricingSection': 'profile/screens/subscription_screen.dart',
    'HeroSection': 'auth/screens/onboarding_screen.dart'
};

function parseFlutterFile(relPath) {
    const fullPath = path.join(flutterBase, relPath);
    if (!fs.existsSync(fullPath)) return [];

    const content = fs.readFileSync(fullPath, 'utf8');
    const actions = [];

    // Regex for basic button patterns
    // 1. ElevatedButton(..., child: Text('Label'), onPressed: () { code })
    // Simple regex isn't parser-safe, but we try specific patterns given our code style

    // Button Pattern: Name...(child/icon..., onPressed/onTap: () ... )
    // We will look for "onPressed:" or "onTap:" lines and look backwards for the widget Name
    // And look forward for the simple action call.

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('onPressed:') || line.includes('onTap:')) {
            // Check if it's a callback '() => ...' or '() { ... }'
            let actionCode = '';

            if (line.includes('=>')) {
                actionCode = line.split('=>')[1].trim();
                if (actionCode.endsWith(',')) actionCode = actionCode.slice(0, -1);
            } else if (line.includes('() {')) {
                // Peek next few lines to get the essence
                // Very naive: grab next 2 lines
                if (i + 1 < lines.length) actionCode += lines[i + 1].trim() + ' ';
                if (i + 2 < lines.length) actionCode += lines[i + 2].trim();
            }

            // Look backward for "child:" or "icon:" or Widget name
            let label = 'Unknown Button';
            let widgetType = 'Gesture';

            // Search backwards 10 lines
            for (let j = 1; j <= 10; j++) {
                if (i - j < 0) break;
                const prev = lines[i - j].trim();

                if (prev.includes("const Text('") || prev.includes("Text('")) {
                    const match = prev.match(/Text\('([^']+)'\)/);
                    if (match) label = match[1];
                    break;
                }
                if (prev.includes('icon: const Icon(LucideIcons.')) {
                    const match = prev.match(/LucideIcons\.(\w+)/);
                    if (match) label = 'Icon: ' + match[1];
                    break; // Continue searching? Often icon is good enough
                }
                if (prev.includes('icon: Icon(LucideIcons.')) {
                    const match = prev.match(/LucideIcons\.(\w+)/);
                    if (match) label = 'Icon: ' + match[1];
                    break;
                }
                if (prev.includes('label: const Text(')) {
                    const match = prev.match(/Text\('([^']+)'\)/);
                    if (match) label = match[1];
                    break;
                }
            }

            // Infer Widget Type
            // Check surrounding lines for common widget names
            for (let j = 0; j <= 5; j++) { // Check lines around it
                if (i - j < 0) break;
                const l = lines[i - j];
                if (l.includes('ElevatedButton')) { widgetType = 'ElevatedButton'; break; }
                if (l.includes('TextButton')) { widgetType = 'TextButton'; break; }
                if (l.includes('IconButton')) { widgetType = 'IconButton'; break; }
                if (l.includes('FloatingActionButton')) { widgetType = 'FAB'; break; }
                if (l.includes('InkWell')) { widgetType = 'ListTile/InkWell'; break; }
                if (l.includes('ListTile')) { widgetType = 'ListTile'; break; }
            }

            // Simplify Action Code
            if (actionCode.includes('context.push')) actionCode = 'Navigate -> ' + actionCode.match(/push\('([^']+)'\)/)?.[1] || 'Navigate';
            if (actionCode.includes('context.go')) actionCode = 'Navigate -> ' + actionCode.match(/go\('([^']+)'\)/)?.[1] || 'Navigate';
            if (actionCode.includes('context.pop')) actionCode = 'Back';

            // Guess API
            let api = 'None';
            if (actionCode.includes('ref.read')) api = 'State/API Call';
            if (actionCode.includes('Provider')) api = 'State/API Call';
            if (actionCode.includes('generate')) api = 'AI Generation';
            if (actionCode.includes('save')) api = 'Save Data';

            actions.push({ button: label, type: widgetType, action: actionCode, api });
        }
    }

    return actions;
}

function generateReport() {
    if (!fs.existsSync(csvPath)) {
        console.error("Source CSV not found");
        return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');

    let output = 'Component Name,Flutter File,Button/Interaction,Type,Action,Potential API\n';

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // Simple name extraction (comma sep)
        const parts = line.split(',');
        const name = parts[0];

        const flutterFile = mapping[name];

        if (flutterFile) {
            const actions = parseFlutterFile(flutterFile);
            if (actions.length > 0) {
                actions.forEach(a => {
                    // Escape commas
                    const safeAction = `"${a.action.replace(/"/g, '""')}"`;
                    output += `${name},${flutterFile},"${a.button}",${a.type},${safeAction},${a.api}\n`;
                });
            } else {
                output += `${name},${flutterFile},No Interactions Found,-,-,-\n`;
            }
        } else {
            // Not mapped or skipped (Desktop items)
            // output += `${name},Not Mapped,-,-,-,-\n`; 
            // Only output if we have info to keep it clean? 
            // User said "BASE ON THE PAGE... WRITE CSV", implied for ALL items?
            // "ALL BUTTON AND ACTION INSIED EACH PAGE"
            // If page is not existing in Flutter, we can't extract buttons.
            // So skipping is correct for 'FALSE' desktop items.
        }
    }

    fs.writeFileSync(outputCsvPath, output, 'utf8');
    console.log(`Generated ${outputCsvPath}`);
}

generateReport();
