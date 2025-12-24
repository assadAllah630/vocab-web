# VocabMaster Context Rules

## Context Loading Rules

### Maximum Files Per Task
- **Load max 2 context files** per agent task
- Always load `architecture.md` for cross-cutting changes
- Load only the specific module context for targeted changes

### Folder Structure

```
.context/
├── INDEX.md           ← Start here!
├── architecture.md
├── conventions.md
├── glossary.md
├── rules.md
├── plans/             ← Implementation plans
├── modules/
│   ├── backend/       ← Backend modules (13 files)
│   ├── frontend/      ← Desktop pages (6 files)
│   ├── mobile/        ← Mobile pages (5 files)
│   └── admin/         ← Admin panel (4 files)
└── prompts/           ← Workflow guides (3 files)
```

### When to Load Architecture
- Adding new domains
- Changing request lifecycle
- Modifying AI subsystem
- Adding new providers
- Cross-domain features

### When to Load Module Context
- Modifying specific module
- Adding features to a domain
- Fixing bugs in a domain
- Refactoring module internals

---

## Size Rules

| Rule | Limit |
|------|-------|
| Max lines per context file | **300 lines** |
| Split if larger | `architecture.part1.md`, `architecture.part2.md` |
| Examples must be valid JSON | Always |

---

## Change Workflow

### Before Coding

1. ✅ Check if change impacts architecture
2. ✅ Load appropriate context files
3. ✅ Update `architecture.md` FIRST if cross-cutting
4. ✅ Plan implementation approach

### During Coding

1. Implement service logic first
2. Implement repository (data access)
3. Implement controller/routes
4. Write tests for each layer
5. Update module context if behavior changes

### After Coding

1. ✅ Update module context with decisions
2. ✅ Add migration + rollback script (if schema changed)
3. ✅ Commit with proper message format
4. ✅ Update `task.md` checklist

---

## Consistency Rules

### Paths
- All paths relative to `e:\vocab_web\`
- Use forward slashes in examples: `server/api/models.py`
- Link format: `[filename](file:///e:/vocab_web/path)`

### Examples
- Must be valid, runnable code
- JSON must parse correctly
- Include error handling

### Diagrams
- Use Mermaid format
- Store in context files (not separate)
- Keep diagrams under 30 lines

---

## File Reference Format

```markdown
## Key Files

- [models.py](file:///e:/vocab_web/server/api/models.py) - Data models
- [unified_ai.py](file:///e:/vocab_web/server/api/unified_ai.py) - AI gateway
```

---

## Decision Documentation

When making significant decisions, document in module context:

```markdown
## Key Decisions

### Decision: Use circuit breaker for AI providers
- **Why**: Prevent cascading failures when Gemini quota exceeded
- **Consequences**: Added complexity, better reliability
- **Owner**: AI Gateway team
- **Date**: 2025-12-08
```

---

## Hard Rules (Non-Negotiable)

1. ❌ No merge without tests
2. ❌ Schema changes MUST include migration + rollback
3. ❌ AI provider changes require cost/fallback analysis
4. ❌ No secrets in code - EVER
5. ❌ No cross-domain repository calls
7. ❌ **Update Context Rule**: whenever you find or update or do any think the context should alwas be match the ral system from the archetectuer to th detail functuin to frontto admin to all
8. ✅ **Auto-Update Contexts**: Follow [CONTEXT_RULES.md](file:///e:/vocab_web/.context/CONTEXT_RULES.md) after EVERY file change

---

## Operational Checklist

Before merging any PR:

- [ ] All tests passing
- [ ] Lint + formatting clean
- [ ] Module context updated
- [ ] Architecture updated (if cross-cutting)
- [ ] Migration + rollback ready (if schema change)
- [ ] PR includes risks + rollback strategy

---

*Version: 1.1 | Updated: 2025-12-24*
