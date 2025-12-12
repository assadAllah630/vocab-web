---
description: Handle database migrations safely
---

## Step 1: Plan the Change
```
MODEL: <ModelName>
CHANGE: Add/Remove/Modify field
FIELD: <field_name>
DEFAULT: <default_value>
```

## Step 2: Impact Analysis
- [ ] Does this break existing data?
- [ ] Does this require data migration?
- [ ] Does this affect serializers?
- [ ] Does this affect frontend?

## Step 3: Modify Model
File: `server/api/models.py`

```python
# Adding nullable field (safer)
new_field = models.CharField(max_length=100, null=True, blank=True)
```

## Step 4: Create Migration
```bash
python manage.py makemigrations
python manage.py sqlmigrate api XXXX  # Preview
```

## Step 5: Test Locally
```bash
python manage.py migrate
python manage.py shell
>>> from api.models import MyModel
>>> MyModel.objects.first().new_field
```

## Step 6: Update Serializers
Add new field to serializer's `fields` list.

## Step 7: Deploy
Push to GitHub → Render auto-runs migrations.

## Rollback
```bash
python manage.py migrate api XXXX  # Previous migration
```

## Hard Rules
- ❌ NEVER modify models.py without creating migration
- ❌ NEVER delete deployed migrations
- ⚠️ Always add `null=True` for new fields on existing tables
- ⚠️ Always test migrations locally first
