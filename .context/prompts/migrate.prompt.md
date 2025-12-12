# Migration Workflow

> Workflow for database migrations in VocabMaster.

## Context to Load
```
@context: .context/architecture.md
```

---

## Step 1: Plan the Change

### Document Schema Change
```
MODEL: <ModelName>
CHANGE: Add/Remove/Modify field
FIELD: <field_name>
TYPE: <field_type>
DEFAULT: <default_value if adding>
```

### Impact Analysis
- [ ] Does this break existing data?
- [ ] Does this require data migration?
- [ ] Does this affect the API serializers?
- [ ] Does this affect the frontend?

---

## Step 2: Modify Model

File: `server/api/models.py`

```python
# Adding a field
new_field = models.CharField(max_length=100, blank=True, default='')

# Adding nullable field (safer)
new_field = models.CharField(max_length=100, null=True, blank=True)

# Adding with choices
STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('published', 'Published'),
]
status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
```

---

## Step 3: Create Migration

```bash
# Generate migration
python manage.py makemigrations

# Review migration file
# Check: server/api/migrations/XXXX_<name>.py

# Preview SQL (optional)
python manage.py sqlmigrate api XXXX
```

---

## Step 4: Test Migration Locally

```bash
# Apply migration
python manage.py migrate

# Verify in Django shell
python manage.py shell
>>> from api.models import MyModel
>>> MyModel.objects.first().new_field
```

---

## Step 5: Update Serializers (if needed)

File: `server/api/serializers.py`

```python
class MyModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyModel
        fields = ['id', 'existing_field', 'new_field']  # Add new field
```

---

## Step 6: Update Frontend (if needed)

```javascript
// Update API response handling
const data = response.data;
console.log(data.new_field);  // Now available
```

---

## Step 7: Deploy

1. Push code to GitHub
2. Render will auto-deploy
3. **IMPORTANT**: Render runs migrations automatically via `render.yaml`
4. Verify in production

---

## Data Migration (if needed)

For complex changes requiring data transformation:

```python
# Create data migration
python manage.py makemigrations api --empty --name populate_new_field

# Edit the migration file
def populate_new_field(apps, schema_editor):
    MyModel = apps.get_model('api', 'MyModel')
    for obj in MyModel.objects.all():
        obj.new_field = compute_value(obj)
        obj.save()

class Migration(migrations.Migration):
    dependencies = [...]
    operations = [
        migrations.RunPython(populate_new_field),
    ]
```

---

## Rollback Plan

```bash
# Rollback to previous migration
python manage.py migrate api XXXX  # Previous migration number

# Or on Render - rollback deploy first, then:
# SSH into service and run rollback migration
```

---

## Hard Rules

- ❌ NEVER modify models.py without creating migration
- ❌ NEVER delete migrations that are deployed
- ❌ NEVER make breaking changes without data migration
- ⚠️ Always test migrations locally first
- ⚠️ Always have a rollback plan
- ⚠️ Add `null=True` for new fields on existing tables (safer)
