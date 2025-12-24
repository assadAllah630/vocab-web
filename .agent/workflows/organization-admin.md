---
description: Create Organization model, admin dashboard, and multi-teacher management
---

# Organization Admin

## Prerequisites
- `/classroom-teacher-role` ✅

## Concept
**Organizations** = Language schools, companies, or institutions that manage multiple teachers and students under one umbrella.

## Models

```python
class Organization(models.Model):
    """Language school, company, or institution."""
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    
    # Branding
    logo_url = models.URLField(blank=True)
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    
    # Settings
    ORG_TYPES = [('school','Language School'),('corporate','Corporate'),
                 ('university','University'),('other','Other')]
    org_type = models.CharField(max_length=20, choices=ORG_TYPES)
    
    # Subscription
    max_teachers = models.IntegerField(default=5)
    max_students = models.IntegerField(default=100)
    
    # Contact
    admin_email = models.EmailField()
    website = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)


class OrganizationMembership(models.Model):
    """User's role within an organization."""
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    ROLES = [('admin','Admin'),('teacher','Teacher'),('student','Student')]
    role = models.CharField(max_length=20, choices=ROLES)
    
    joined_at = models.DateTimeField(auto_now_add=True)
    invited_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='+')
    
    class Meta:
        unique_together = ['organization', 'user']
```

## Admin API Endpoints

```python
# Organization CRUD (platform admin)
router.register(r'organizations', OrganizationViewSet)

# Org Admin endpoints
GET  /org/{slug}/dashboard/       # Org overview stats
GET  /org/{slug}/members/         # List all members
POST /org/{slug}/invite/          # Invite teacher/student
PUT  /org/{slug}/members/{id}/    # Update role
DELETE /org/{slug}/members/{id}/  # Remove member
GET  /org/{slug}/classrooms/      # All org classrooms
GET  /org/{slug}/analytics/       # Org-wide analytics
POST /org/{slug}/bulk-import/     # CSV import students
```

## Admin Dashboard Features

### 1. `OrgDashboard.jsx`
```
┌────────────────────────────────────────┐
│ 🏢 Berlin Language Academy             │
│ ──────────────────────────────────────│
│ Teachers: 8/10    Students: 156/200   │
│ Active Classes: 12   This Month: +23  │
│ ──────────────────────────────────────│
│ [👥 Members] [📚 Classes] [📊 Reports]│
└────────────────────────────────────────┘
```

### 2. Member Management
- Invite via email (bulk or single)
- Role assignment (admin, teacher, student)
- View activity per member
- Suspend/remove members

### 3. Bulk Import
```csv
email,role,classroom_codes
anna@school.de,student,GER-B1,GER-B2
max@school.de,teacher,
```

### 4. Analytics
- Total learning hours
- Average completion rates
- Teacher performance comparison
- Student retention metrics

## Permissions Matrix

| Action | Org Admin | Teacher | Student |
|--------|-----------|---------|---------|
| View dashboard | ✅ | ❌ | ❌ |
| Manage members | ✅ | ❌ | ❌ |
| Create classrooms | ✅ | ✅ | ❌ |
| View all classrooms | ✅ | Own only | Enrolled |
| View analytics | ✅ | Own classes | ❌ |

## Routes
```jsx
<Route path="/org/:slug" element={<OrgDashboard />} />
<Route path="/org/:slug/members" element={<OrgMembers />} />
<Route path="/org/:slug/analytics" element={<OrgAnalytics />} />
```

## Next → `/classroom-notifications`
