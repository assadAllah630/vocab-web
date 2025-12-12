---
trigger: always_on
---

# VocabMaster Agent Rules

> **📌 How to Apply These Rules in Antigravity:**
> 1. Press `Ctrl+Shift+P` (Windows) or `⌘+Shift+P` (Mac)
> 2. Type "Open Customizations" and select it
> 3. Copy the key rules below into the Customizations panel
>
> This file serves as **documentation and reference** for project rules.

## Code Standards

### Python/Django
- Use Python 3.10+ features
- Follow Django REST Framework patterns
- Use type hints for function signatures
- Business logic in services, not views

### React/JavaScript
- Functional components with hooks only
- Use TailwindCSS for styling
- Use Framer Motion for animations
- API calls via `api.js` client

---

## Restrictions

### Critical - NEVER Do These
- ❌ NEVER modify `models.py` without creating a migration
- ❌ NEVER commit API keys or secrets
- ❌ NEVER change `unified_ai.py` public interface without updating all callers
- ❌ NEVER make direct API calls to AI providers - use `unified_ai`
- ❌ NEVER delete context files without approval

### Careful - Ask First
- ⚠️ Changes to `architecture.md` require review
- ⚠️ New AI providers need cost/fallback analysis
- ⚠️ Database migrations need rollback plan

---

## Preferences

### AI Integration
- Prefer `unified_ai.generate_ai_content()` over direct calls
- Use `unified_ai.generate_ai_image()` for images (Pollinations first)
- Check AI Gateway status before large operations

### Frontend
- Mobile components in `pages/mobile/` folder
- Desktop components in `pages/` folder
- Shared components in `components/`

### Testing
- Test files in `tests/` folder
- Name: `test_<feature>.py`
- Include success + failure cases

---

## Context Loading Rules

### For Agent Tasks
- Load max 2 context files per task
- Backend work → `modules/backend/<module>.context.md`
- Frontend work → `modules/frontend/<area>.context.md`
- Mobile work → `modules/mobile/<area>.context.md`
- Cross-cutting → `architecture.md` first

### Start Here
- `.context/INDEX.md` - Find the right file
- `.context/DEVELOPER_GUIDE.md` - Usage examples

---

## MCP Usage

### GitHub MCP
```
@mcp:github: Create PR, create branch, list issues
```

### Sequential Thinking
```
@mcp:sequential-thinking: Complex architecture decisions
```

---

## Deployment

### Render (Backend)
- Auto-deploys from `main` branch
- Check `requirements.txt` before push
- Run migrations after deploy

### Vercel (Frontend + Admin)
- Auto-deploys from `main` branch
- Check environment variables
- Test build locally first
