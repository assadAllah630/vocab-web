---
description: Create Learning Path builder UI and student progress view
---

# Learning Path Frontend

## Prerequisites
- `/learning-path-models` ✅

## API Endpoints (implement in parallel)

```python
# ViewSet for CRUD
router.register(r'paths', LearningPathViewSet)

# Additional endpoints
GET  /paths/{id}/nodes/              # List nodes
POST /paths/{id}/nodes/              # Add node
PUT  /paths/{id}/nodes/reorder/      # Reorder nodes
GET  /paths/{id}/enroll/             # Student enrolls
GET  /paths/{id}/progress/           # My progress
POST /paths/{id}/nodes/{nid}/start/  # Start node
POST /paths/{id}/nodes/{nid}/complete/  # Complete node
```

## Teacher UI: Path Builder

### `MobileLearningPathBuilder.jsx`
**Flow:** Create Path → Add Nodes → Reorder → Publish

```
┌────────────────────────────────────┐
│  📚 German B1 Complete Course      │
│  ─────────────────────────────────  │
│  1. [📖] Introduction to B1        │
│  2. [📝] Konjunktiv II Lesson      │
│  3. [🎯] Practice: Modal Verbs     │
│  4. [📊] Quiz: Week 1              │
│  5. [+] Add Node...                │
│  ─────────────────────────────────  │
│  [Preview]  [Save Draft]  [Publish] │
└────────────────────────────────────┘
```

**Features:**
- Drag-drop reorder (react-beautiful-dnd)
- Node type picker modal
- Content browser (search existing content)
- Inline edit title/description
- Preview mode

### `AddNodeModal.jsx`
1. Select type: Lesson, Exercise, Exam, Checkpoint
2. Search/select existing content OR create new
3. Set duration, pass threshold
4. Add to path

## Student UI: Path Player

### `MobileLearningPathView.jsx`
**Visual progress through the path**

```
┌────────────────────────────────────┐
│  German B1 Complete Course         │
│  Progress: 40% ████████░░░░░░░░░░  │
│  ─────────────────────────────────  │
│  ✅ 1. Introduction          5min  │
│  ✅ 2. Konjunktiv II        15min  │
│  🔵 3. Practice (Current)   10min  │
│  🔒 4. Quiz: Week 1         20min  │
│  🔒 5. Advanced Topics      30min  │
│  ─────────────────────────────────  │
│  [Continue: Practice Modal Verbs]   │
└────────────────────────────────────┘
```

**States:**
- ✅ Completed (green checkmark)
- 🔵 Current/Available (blue, clickable)
- 🔒 Locked (gray, shows unlock requirements)

### Node Content Loader
Based on `node.content_type`, render appropriate component:
- `lesson` → MarkdownViewer / StoryReader
- `exercise` → FlashcardGame / GrammarExercise
- `exam` → ExamPlayer
- `checkpoint` → ProgressSummary

## Routes
```jsx
<Route path="/m/paths" element={<MobileLearningPaths />} />
<Route path="/m/path/:id" element={<MobileLearningPathView />} />
<Route path="/m/path/:id/build" element={<MobileLearningPathBuilder />} />
<Route path="/m/path/:pathId/node/:nodeId" element={<MobilePathNodePlayer />} />
```

## Next → `/live-session-models`
