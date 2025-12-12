# VocabMaster Context Usage Guide

## How to Work Effectively with AI Agents (Antigravity)

This guide teaches you how to write prompts that help AI agents work efficiently.

---

## 🔧 Antigravity Annotations

### `@context:` - Load Context Files
```
@context: .context/modules/backend/vocabulary.context.md

Fix the bug in VocabList...
```

### `@rules:` - Set Behavior Rules
Use in `.agent/rules.md` or inline:
```
@rules: Do NOT modify any API endpoints
@rules: Keep all changes in the frontend only
@rules: Use TypeScript types for all new code
```

### `@mcp:` - Use MCP Servers
```
@mcp:github: Create a PR for these changes
@mcp:sequential-thinking: Think step by step about this architecture
```

---

## 🌐 MCP Servers - When to Use

| MCP Server | Use Case | Example |
|------------|----------|---------|
| `@mcp:github:` | PRs, issues, branches | Create PR, review code |
| `@mcp:sequential-thinking:` | Complex problems | Architecture decisions |

### GitHub MCP (`@mcp:github:`)
```
@mcp:github: Create a branch called "feat/anki-export"
@mcp:github: Create a PR with title "Add Anki Export Feature"
@mcp:github: List open issues in this repo
```

### Sequential Thinking (`@mcp:sequential-thinking:`)
```
@mcp:sequential-thinking: 
Analyze the AI Gateway architecture and suggest improvements.
Consider: performance, reliability, cost optimization.
```

---

## 📋 Setting Up `.agent/rules.md`

Create `.agent/rules.md` for project-wide rules:

```markdown
# VocabMaster Agent Rules

## Code Standards
- Use Python 3.10+ features
- Follow Django REST Framework patterns
- React components use functional style with hooks

## Restrictions
- NEVER modify models.py without migration
- NEVER commit API keys
- NEVER change unified_ai.py public interface

## Preferences
- Prefer unified_ai over direct Gemini calls
- Use TailwindCSS for styling
- Use Framer Motion for animations
```

---

## 🔑 The Golden Rule

**Always tell the agent WHICH context files to load first!**

```
@context: .context/modules/backend/vocabulary.context.md
@context: .context/modules/mobile/vocabulary.context.md

Fix the bug in MobileWords.jsx where...
```

---

## 📋 Quick Reference Table

| Task | Context Files to Load |
|------|----------------------|
| Backend bug | `backend/<module>.context.md` |
| Frontend bug | `frontend/<area>.context.md` |
| Mobile bug | `mobile/<area>.context.md` |
| Admin bug | `admin/<area>.context.md` |
| New feature | `architecture.md` + relevant module |
| UI improvement | `frontend/` or `mobile/` module |
| Refactor | module context + `conventions.md` |
| Cross-cutting | `architecture.md` first |

---

## 1️⃣ Fix Bug

### Backend Bug
```
@context: .context/modules/backend/exams.context.md

BUG: Generate Exam returns 500 error when Gemini quota exceeded.
The endpoint is /api/generate-exam/.
Error: "429 Quota Exceeded" not handled properly.

Please fix the failover to OpenRouter.
```

### Frontend/Mobile Bug
```
@context: .context/modules/mobile/vocabulary.context.md

BUG: MobileWords.jsx crashes when synonyms is null.
Error: "word.synonyms.map is not a function"
Line: ~line 245

Please add null check.
```

---

## 2️⃣ Upgrade Feature

```
@context: .context/modules/backend/reader.context.md
@context: .context/modules/mobile/reader.context.md

UPGRADE: Add PDF page selection to MobileReader.
Currently extracts all pages - I want to select specific pages.

Backend: text_extraction_service.py
Frontend: MobileReader.jsx
```

---

## 3️⃣ Add New Feature

### Small Feature (Single Module)
```
@context: .context/modules/backend/vocabulary.context.md

ADD: Export vocabulary to Anki format (.apkg).
Should create downloadable Anki deck from user's words.
```

### Large Feature (Cross-Cutting)
```
@context: .context/architecture.md
@context: .context/modules/backend/ai_gateway.context.md

ADD: New AI provider - Claude API.
Need to add adapter similar to existing Gemini adapter.
Should integrate with KeySelector and CircuitBreaker.
```

---

## 4️⃣ Refactor Code

```
@context: .context/modules/backend/content.context.md
@context: .context/conventions.md

REFACTOR: Split advanced_text_agent.py into smaller modules.
It's 21KB - too large. Extract:
- story_agent.py
- article_agent.py
- dialogue_agent.py

Keep same API, just reorganize.
```

---

## 5️⃣ Improve UI

```
@context: .context/modules/frontend/core.context.md

UI: Redesign Dashboard.jsx
- Make it more modern
- Add glassmorphism effects
- Improve mobile responsiveness
- Keep same functionality
```

---

## 6️⃣ Improve UX

```
@context: .context/modules/mobile/reader.context.md

UX: MobileReader word extraction is confusing.
Problems:
1. Users don't know they can tap words
2. Add to vocab button is hidden
3. No feedback after adding word

Please improve the flow.
```

---

## 7️⃣ Debug

```
@context: .context/modules/backend/ai_gateway.context.md

DEBUG: AI Gateway choosing wrong provider.
Expected: Gemini (health 100)
Actual: OpenRouter (health 50)

Please add logging to key_selector.py to understand why.
```

---

## 8️⃣ Test

```
@context: .context/modules/backend/exams.context.md

TEST: Add tests for exam generation.
Cover:
1. Successful generation
2. Quota exceeded (should failover)
3. Invalid topic
4. Empty vocabulary list

Put in server/api/tests/test_exams.py
```

---

## 9️⃣ Deploy

```
@context: .context/architecture.md

DEPLOY: Push changes to production.
Services:
- Backend: Render
- Frontend: Vercel
- Admin: Vercel

Check for:
- Environment variables
- Database migrations
- Breaking changes
```

---

## 🔟 Upgrade Architecture

```
@context: .context/architecture.md
@context: .context/rules.md

ARCHITECTURE: Add Redis caching layer for AI responses.

Affected:
- unified_ai.py
- ai_gateway/services/cache_manager.py

Need:
- Cache key strategy
- TTL configuration
- Cache invalidation
```

---

## ⚠️ Common Mistakes

### ❌ BAD: Vague request
```
Fix the vocabulary page
```

### ✅ GOOD: Specific with context
```
@context: .context/modules/frontend/vocabulary.context.md

BUG: VocabList.jsx - CSV export missing headers.
Expected: word,translation,type,example
Actual: No header row
```

---

### ❌ BAD: No context, agent must re-scan
```
Add image generation to stories
```

### ✅ GOOD: Point to exact files
```
@context: .context/modules/backend/content.context.md
@context: .context/modules/backend/ai_gateway.context.md

ADD: Generate images for stories.
Use: unified_ai.generate_ai_image()
Trigger: After story generation completes
Store: image_base64 in GeneratedContent model
```

---

## 📁 Finding the Right Context

1. **Start with INDEX.md**: `.context/INDEX.md`
2. **Backend work?** → `modules/backend/`
3. **Desktop page?** → `modules/frontend/`
4. **Mobile page?** → `modules/mobile/`
5. **Admin panel?** → `modules/admin/`
6. **Cross-cutting?** → `architecture.md`

---

## 🚀 Pro Tips

### Tip 1: Be Specific About Files
```
File: server/api/unified_ai.py
Function: generate_ai_content()
Line: ~150
```

### Tip 2: Include Error Messages
```
Error: "TypeError: Cannot read property 'map' of undefined"
Stack trace: VocabList.jsx:245
```

### Tip 3: State Expected vs Actual
```
Expected: Fallback to OpenRouter
Actual: Returns 500 error
```

### Tip 4: Mention Related Features
```
Related to: AI Gateway circuit breaker (agent_exam.py calls unified_ai)
```

### Tip 5: Limit Scope
```
ONLY change the VocabList component.
Do NOT modify the API or serializers.
```

---

## 📌 Antigravity-Specific Features

### Rules (Custom Instructions)

Antigravity rules are configured via the **Customizations panel**, not through `.agent/rules.md` files:

1. **Open Customizations**: Press `⌘+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. **Search**: Type "Open Customizations" and select it
3. **Add Rules**: Write your project-specific instructions

Example rules to add in Customizations:
```
For VocabMaster:
- Always use unified_ai.py for AI calls, never direct Gemini
- Follow Django REST Framework patterns
- Use TailwindCSS for styling
- Never modify models.py without migration
- Load .context/ files before making changes
```

> **Note**: The `.agent/rules.md` file created in this project is for **documentation and reference** - copy its contents into the Customizations panel for Antigravity to apply them.

### Knowledge Panel

The **Knowledge panel auto-populates** from your sessions:
- It extracts and remembers codebase context from conversations
- If empty, simply continue working - it will fill automatically
- No manual configuration needed

### Troubleshooting Empty Knowledge Panel

If Knowledge panel remains empty:
1. Ensure you're logged into Antigravity
2. Try restarting the IDE
3. Have a few code-related conversations
4. Knowledge gets populated as you work

---

*This guide helps you get 10x better results from AI agents!*
