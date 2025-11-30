# VocabMaster - Complete Documentation

## Application Overview

**VocabMaster** is a comprehensive vocabulary learning platform with AI-powered features, spaced repetition learning, and a full-featured admin panel for system management.

### Core Components
1. **Client Application** (`/client`) - User-facing vocabulary learning app
2. **Admin Panel** (`/admin-client`) - Administrative dashboard for system management
3. **Backend API** (`/server`) - Django REST Framework backend with AI integrations

---

## 1. Main Application (Client)

### Purpose
Help users learn vocabulary through AI-enhanced flashcards, spaced repetition, and grammar lessons.

### Key Features

#### Vocabulary Management
- **Create & Organize**: Users can create vocabulary cards with word, definition, example, and pronunciation
- **AI Enhancement**: Automatic generation of:
  - Example sentences
  - Pronunciation guides
  - Related words
  - AI-generated images for visual learning
- **Categories**: Organize vocabulary by custom categories

#### Learning System
- **Spaced Repetition**: Half-Life Regression (HLR) algorithm for optimal review timing
- **Quiz Modes**: 
  - Standard flashcard review
  - HLR-optimized practice sessions
- **Progress Tracking**: Monitor learning progress and retention rates

#### AI-Powered Features
- **Grammar Lessons**: AI-generated comprehensive grammar topics with:
  - Structured explanations
  - Examples
  - Visual diagrams (Mermaid charts)
  - Practice exercises
- **Image Generation**: Visual aids for vocabulary using Stable Horde and Hugging Face APIs
- **Content Generation**: AI-powered example sentences and contextual usage

#### Authentication
- **Email/Password**: Traditional authentication
- **Google OAuth**: Social login integration
- **Token-based**: Secure API authentication

---

## 2. Admin Panel - Detailed Documentation

### Overview
The Admin Panel is a **separate React application** (`/admin-client`) providing comprehensive system management, analytics, and monitoring capabilities.

### Architecture

#### Frontend Stack
- **Framework**: React 19 + Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 with custom theme
- **UI Components**: 
  - Heroicons for icons
  - TanStack Table for data grids
  - ECharts for analytics visualizations
- **HTTP Client**: Axios

#### Backend Integration
- **Base URL**: `http://localhost:8000/api/admin/`
- **Authentication**: Token-based (separate from user auth)
- **Real-time**: WebSocket connection for system health monitoring

---

### Admin Panel Features

## 2.1 Authentication & Authorization

### Admin Login
- **Endpoint**: `POST /api/admin/auth/login/`
- **Credentials Storage**: 
  - Token: `localStorage.adminToken`
  - User data: `localStorage.adminUser`
- **Design**: Premium glassmorphism UI with dark gradient background

### Role-Based Access Control (RBAC)
**Model**: `AdminRole`
```python
- user: ForeignKey to User
- role: CharField (choices: 'super_admin', 'moderator', 'analyst')
- permissions: JSONField (custom permissions array)
- created_at, updated_at
```

**Roles**:
- **Super Admin**: Full system access
- **Moderator**: Content management and user moderation
- **Analyst**: Read-only access to analytics

### Security Features
- **IP Whitelist**: `IPWhitelistMiddleware` restricts admin access by IP
- **Audit Logging**: All admin actions logged in `AdminAuditLog`
- **Session Management**: Token expiration and refresh

---

## 2.2 Dashboard & Analytics

### Executive Dashboard
**Route**: `/dashboard`
**Endpoint**: `GET /api/admin/dashboard/stats/`

**KPIs Displayed**:
- Total Users
- Active Users (last 30 days)
- Total Vocabulary Items
- Total AI Requests
- System Health Status

**Charts**:
- User growth over time (line chart)
- Vocabulary creation trends
- AI usage patterns

### User Analytics
**Route**: `/analytics/users`
**Endpoint**: `GET /api/admin/analytics/users/`

**Metrics**:
- User registration trends
- Active vs inactive users
- User engagement levels
- Retention rates
- Geographic distribution (if available)

**Visualizations**:
- User growth line chart
- Activity heatmap
- Engagement funnel

### AI Analytics
**Route**: `/analytics/ai`
**Endpoint**: `GET /api/admin/analytics/ai/`

**Tracked Data**:
- AI API calls by provider (OpenAI, Hugging Face, Stable Horde)
- Cost estimation per provider
- Success/failure rates
- Response times
- Token usage

**Model**: `APIUsageLog`
```python
- endpoint: CharField
- provider: CharField
- tokens_used: IntegerField
- cost_estimate: DecimalField
- response_time: FloatField
- status: CharField
- timestamp: DateTimeField
```

### Content Analytics
**Route**: `/analytics/content`
**Endpoint**: `GET /api/admin/analytics/content/`

**Metrics**:
- Vocabulary items created over time
- Grammar topics generated
- AI-generated content stats
- Category distribution
- User-generated vs AI-generated ratio

---

## 2.3 User Management

### User List
**Route**: `/users`
**Endpoint**: `GET /api/admin/users/`

**Features**:
- Searchable table (username, email)
- Filters: active/inactive, date joined
- Sortable columns
- Pagination (50 per page)
- Export to CSV

**Displayed Data**:
- Username
- Email
- Date Joined
- Last Login
- Is Active
- Vocabulary Count
- Actions (View, Suspend, Reset Password)

### User Detail
**Route**: `/users/:id`
**Endpoint**: `GET /api/admin/users/{id}/`

**Information Shown**:
- User profile details
- Account status
- Activity timeline
- Vocabulary statistics
- Learning progress
- Recent actions

**Admin Actions**:
- **Suspend/Unsuspend**: `POST /api/admin/users/{id}/action/` with `action: 'suspend'`
- **Reset Password**: `POST /api/admin/users/{id}/action/` with `action: 'reset_password'`
- **Impersonate**: `POST /api/admin/users/{id}/action/` with `action: 'impersonate'`

---

## 2.4 Content Moderation

### Vocabulary Moderation
**Route**: `/content/vocabulary`
**Endpoint**: `GET /api/admin/content/vocabulary/`

**Features**:
- Review user-submitted vocabulary
- Flag inappropriate content
- Bulk approve/reject
- Edit vocabulary items
- Delete with audit trail

**Filters**:
- By user
- By category
- By date created
- Flagged items only

### Generated Content Review
**Route**: `/content/generated`
**Endpoint**: `GET /api/admin/content/generated/`

**Model**: `GeneratedContent`
```python
- user: ForeignKey
- content_type: CharField (example, grammar, image)
- prompt: TextField
- generated_text: TextField
- provider: CharField
- status: CharField (pending, approved, rejected)
- created_at: DateTimeField
```

**Actions**:
- Approve AI-generated content
- Reject and flag
- Regenerate content
- View generation metadata

### Grammar Topics Management
**Route**: `/content/grammar`
**Endpoint**: `GET /api/admin/content/grammar/`

**Features**:
- View all grammar topics
- Edit topic content
- Manage Mermaid diagrams
- Approve/reject topics
- Delete topics

---

## 2.5 System Monitoring

### Real-time System Health
**Route**: `/monitoring/health`
**WebSocket**: `ws://localhost:8000/ws/system-health/`

**Metrics Monitored**:
- CPU Usage (%)
- Memory Usage (%)
- Database Connections
- Active Users
- Request Rate (req/min)
- Error Rate

**Consumer**: `SystemHealthConsumer` (Django Channels)
- Broadcasts metrics every 5 seconds
- Auto-reconnects on disconnect

**Visualizations**:
- Real-time line charts
- Gauge charts for resource usage
- Alert indicators for thresholds

### Error Logs
**Route**: `/monitoring/errors`
**Endpoint**: `GET /api/admin/monitoring/errors/`

**Model**: `ErrorLog`
```python
- error_type: CharField
- message: TextField
- stack_trace: TextField
- endpoint: CharField
- user: ForeignKey (nullable)
- timestamp: DateTimeField
- resolved: BooleanField
```

**Features**:
- Filter by error type
- Search error messages
- Mark as resolved
- View stack traces
- Export logs

### Audit Logs
**Route**: `/monitoring/audit`
**Endpoint**: `GET /api/admin/audit-logs/`

**Model**: `AdminAuditLog`
```python
- admin_user: ForeignKey
- action: CharField
- target_model: CharField
- target_id: IntegerField
- changes: JSONField
- ip_address: GenericIPAddressField
- timestamp: DateTimeField
```

**Tracked Actions**:
- User suspensions
- Content deletions
- Settings changes
- Admin role modifications
- Password resets

---

## 2.6 System Configuration

### General Settings
**Route**: `/settings/general`
**Endpoint**: `GET/PUT /api/admin/settings/system/`

**Model**: `SystemConfiguration` (Singleton)
```python
- maintenance_mode: BooleanField
- allow_signups: BooleanField
- admin_ip_whitelist: TextField (comma-separated IPs)
- updated_at: DateTimeField
- updated_by: ForeignKey to User
```

**Configurable Options**:
- **Maintenance Mode**: Disable user access for maintenance
- **Signup Control**: Enable/disable new user registrations
- **IP Whitelist**: Restrict admin panel access to specific IPs
- **API Rate Limits**: Configure rate limiting (future)
- **AI Provider Settings**: API keys and preferences

### Admin User Management
**Route**: `/settings/admins`
**Endpoint**: `GET/POST /api/admin/users/manage/`

**Features**:
- Create new admin accounts
- Assign roles (Super Admin, Moderator, Analyst)
- Set custom permissions
- Revoke admin access
- View admin activity

---

## 2.7 Data Export & Reporting

### Export Capabilities
All data tables support CSV export:
- User lists
- Vocabulary items
- Analytics data
- Error logs
- Audit trails

**Implementation**: Client-side CSV generation using JavaScript

---

## 3. Backend API Architecture

### Django Apps Structure
```
server/
├── api/
│   ├── models.py              # Core models (User, Vocabulary, etc.)
│   ├── admin_models.py        # Admin-specific models
│   ├── advanced_text_models.py # AI content models
│   ├── views.py               # User API views
│   ├── admin_views.py         # Admin API views
│   ├── serializers.py         # DRF serializers
│   ├── urls.py                # User API routes
│   ├── admin_urls.py          # Admin API routes
│   ├── middleware.py          # API usage tracking
│   ├── security_middleware.py # IP whitelist
│   ├── consumers.py           # WebSocket consumers
│   └── routing.py             # WebSocket routing
└── vocab_server/
    ├── settings.py
    ├── urls.py
    └── asgi.py                # ASGI config for WebSockets
```

### Key Models

#### User & Vocabulary
```python
User (Django default + extensions)
Vocabulary: word, definition, example, pronunciation, category, user, ai_generated
Category: name, user
Progress: user, vocabulary, ease_factor, interval, next_review
```

#### AI & Content
```python
GeneratedContent: user, content_type, prompt, generated_text, provider, status
GrammarTopic: title, content, mermaid_diagram, difficulty, user
ImageGeneration: vocabulary, prompt, image_url, provider, status
```

#### Admin & Monitoring
```python
AdminRole: user, role, permissions
AdminAuditLog: admin_user, action, target_model, changes, ip_address
SystemMetrics: cpu_usage, memory_usage, active_users, timestamp
APIUsageLog: endpoint, provider, tokens_used, cost_estimate
ErrorLog: error_type, message, stack_trace, endpoint, user
SystemConfiguration: maintenance_mode, allow_signups, admin_ip_whitelist
```

### Middleware

#### APIUsageMiddleware
- Tracks all API calls
- Logs provider, tokens, cost estimates
- Records response times
- Stores in `APIUsageLog`

#### IPWhitelistMiddleware
- Checks incoming requests to `/api/admin/`
- Validates IP against `SystemConfiguration.admin_ip_whitelist`
- Returns 403 if IP not whitelisted

### Authentication
- **User Auth**: Token-based (DRF TokenAuthentication)
- **Admin Auth**: Separate token system with RBAC
- **Google OAuth**: Social authentication for users

---

## 4. AI Integrations

### Providers
1. **OpenAI GPT**: Grammar generation, examples, definitions
2. **Hugging Face**: Image generation (fallback)
3. **Stable Horde**: Primary image generation

### AI Features
- **Grammar Generation**: Full topic explanations with examples
- **Example Sentences**: Contextual usage examples
- **Image Generation**: Visual vocabulary aids
- **Pronunciation**: Phonetic guides

### Cost Tracking
- Token usage logged per request
- Cost estimates calculated
- Provider comparison analytics
- Budget monitoring (future)

---

## 5. Database Schema Summary

### Core Tables
- `auth_user` - Django users
- `api_vocabulary` - Vocabulary items
- `api_category` - Vocabulary categories
- `api_progress` - Learning progress (HLR)
- `api_generatedcontent` - AI-generated content
- `api_grammartopic` - Grammar lessons
- `api_imagegeneration` - Image generation requests

### Admin Tables
- `api_adminrole` - Admin roles & permissions
- `api_adminauditlog` - Admin action audit trail
- `api_systemconfiguration` - Global settings (singleton)
- `api_systemmetrics` - System health metrics
- `api_apiusagelog` - API usage tracking
- `api_errorlog` - Application error logs
- `api_useractivitylog` - User activity tracking

---

## 6. Deployment & Configuration

### Environment Variables
```bash
# Django
DJANGO_SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com

# Database
DATABASE_URL=postgresql://user:pass@localhost/vocabmaster

# AI APIs
OPENAI_API_KEY=sk-...
HUGGINGFACE_API_KEY=hf_...
STABLE_HORDE_API_KEY=...

# Admin Security
ADMIN_IP_WHITELIST=127.0.0.1,192.168.1.0/24
```

### Running the Application

#### Backend
```bash
cd server
python manage.py migrate
python manage.py createsuperuser  # Username: admin, Password: admin123
python manage.py runserver
```

#### User Client
```bash
cd client
npm install
npm run dev  # http://localhost:5174
```

#### Admin Panel
```bash
cd admin-client
npm install
npm run dev  # http://localhost:5173
```

---

## 7. Admin Panel UI/UX

### Design System
- **Color Palette**: Blue primary (#0284c7) with purple accents
- **Typography**: Inter font family
- **Theme**: Dark mode login, light mode dashboard
- **Components**: Glassmorphism cards, smooth transitions

### Navigation Structure
```
Admin Panel
├── Dashboard (/)
├── Users (/users)
│   └── User Detail (/users/:id)
├── Content
│   ├── Vocabulary (/content/vocabulary)
│   ├── AI Generated (/content/generated)
│   └── Grammar (/content/grammar)
├── Analytics
│   ├── User Analytics (/analytics/users)
│   ├── AI Analytics (/analytics/ai)
│   └── Content Analytics (/analytics/content)
├── Monitoring
│   ├── System Health (/monitoring/health)
│   ├── Error Logs (/monitoring/errors)
│   └── Audit Logs (/monitoring/audit)
└── Settings
    ├── General (/settings/general)
    └── Admin Users (/settings/admins)
```

---

## 8. API Endpoints Reference

### Admin Authentication
- `POST /api/admin/auth/login/` - Admin login
- `POST /api/admin/auth/logout/` - Admin logout
- `GET /api/admin/auth/me/` - Current admin user

### Dashboard & Analytics
- `GET /api/admin/dashboard/stats/` - Executive dashboard KPIs
- `GET /api/admin/analytics/users/` - User analytics
- `GET /api/admin/analytics/ai/` - AI usage analytics
- `GET /api/admin/analytics/content/` - Content analytics

### User Management
- `GET /api/admin/users/` - List users (paginated, filterable)
- `GET /api/admin/users/{id}/` - User details
- `POST /api/admin/users/{id}/action/` - User actions (suspend, reset, impersonate)

### Content Moderation
- `GET /api/admin/content/vocabulary/` - Vocabulary list
- `GET /api/admin/content/vocabulary/{id}/` - Vocabulary detail
- `GET /api/admin/content/generated/` - Generated content list
- `GET /api/admin/content/generated/{id}/` - Generated content detail
- `GET /api/admin/content/grammar/` - Grammar topics list

### Monitoring
- `GET /api/admin/monitoring/errors/` - Error logs
- `GET /api/admin/audit-logs/` - Audit logs
- `WS /ws/system-health/` - Real-time system metrics

### Configuration
- `GET /api/admin/settings/system/` - Get system config
- `PUT /api/admin/settings/system/` - Update system config
- `GET /api/admin/users/manage/` - List admin users
- `POST /api/admin/users/manage/` - Create admin user

---

## 9. Security Best Practices

### Implemented
✅ IP whitelisting for admin access
✅ Token-based authentication
✅ RBAC with granular permissions
✅ Audit logging for all admin actions
✅ CORS configuration
✅ SQL injection protection (Django ORM)
✅ XSS protection (React escaping)

### Recommended for Production
- Enable HTTPS only
- Implement rate limiting
- Add 2FA for admin accounts
- Regular security audits
- Encrypted database backups
- API key rotation policy

---

## 10. Future Enhancements

### Planned Features
- [ ] Advanced reporting (PDF exports)
- [ ] Email notifications for critical events
- [ ] Automated backups with restore functionality
- [ ] Multi-language support
- [ ] Mobile admin app
- [ ] Advanced AI cost optimization
- [ ] User behavior analytics (heatmaps, session recordings)
- [ ] A/B testing framework
- [ ] Custom dashboard widgets

---

## Support & Maintenance

### Monitoring Checklist
- Daily: Check error logs, system health
- Weekly: Review audit logs, user growth
- Monthly: Analyze AI costs, optimize queries
- Quarterly: Security audit, dependency updates

### Backup Strategy
- Database: Daily automated backups
- User uploads: Real-time S3 sync
- Configuration: Version controlled

---

**Last Updated**: November 27, 2025
**Version**: 1.0.0
**Admin Panel Version**: 1.0.0
