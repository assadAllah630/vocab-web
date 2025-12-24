# AI Gateway Feature Index

## Overview
All context files related to AI providers, model selection, and the unified AI interface.

---

## Backend
| Context | Purpose |
|---------|---------|
| [ai_gateway.context.md](file:///e:/vocab_web/.context/modules/backend/ai_gateway.context.md) | Adapters, providers, model selection |
| [agents.context.md](file:///e:/vocab_web/.context/modules/backend/agents.context.md) | LangGraph agents |
| [infrastructure.context.md](file:///e:/vocab_web/.context/modules/backend/infrastructure.context.md) | unified_ai.py details |

## Frontend Desktop
| Page | Purpose |
|------|---------|
| `AIGateway.jsx` | Admin dashboard (35KB) |

## Mobile React
| Page | Purpose |
|------|---------|
| `MobileAIGateway.jsx` | Provider status |
| `MobileAPISettings.jsx` | API key config |

## Flutter
| Screen | Purpose |
|--------|---------|
| `ai_gateway_screen.dart` | Status view |
| `ai_generator_screen.dart` | General gen |

## Admin
| Context | Purpose |
|---------|---------|
| [analytics.context.md](file:///e:/vocab_web/.context/modules/admin/analytics.context.md) | AIAnalytics page |
| [monitoring.context.md](file:///e:/vocab_web/.context/modules/admin/monitoring.context.md) | AIGateway monitoring |

---

## Key Files
- `unified_ai.py` - Central AI interface
- `adapters/` - 6 text + 4 image providers
- `services/model_selector.py` - Smart routing

---

*Feature Index v1.0*
