---
description: Create Teacher, Classroom, and ClassMembership database models with migrations
---

# Classroom Models Workflow

Create the core database models for the Teacher & Classroom system.

## Prerequisites
- None (this is the first workflow)

## Dependencies
- `server/api/models.py` (existing)
- `server/api/serializers.py` (existing)

---

## Step 1: Create Teacher Model

Add to `server/api/models.py`:

```python
class Teacher(models.Model):
    """Teacher profile extending User."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    organization_name = models.CharField(max_length=200, blank=True)  # School/company name
    subjects = models.JSONField(default=list)  # ["German", "English"]
    bio = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    max_classrooms = models.IntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Teacher: {self.user.username}"
```

---

## Step 2: Create Classroom Model

Add to `server/api/models.py`:

```python
class Classroom(models.Model):
    """Virtual classroom managed by a teacher."""
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='classrooms')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Settings
    LEVEL_CHOICES = [
        ('A1', 'A1 - Beginner'),
        ('A2', 'A2 - Elementary'),
        ('B1', 'B1 - Intermediate'),
        ('B2', 'B2 - Upper Intermediate'),
        ('C1', 'C1 - Advanced'),
        ('C2', 'C2 - Mastery'),
        ('mixed', 'Mixed Levels'),
    ]
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='B1')
    language = models.CharField(max_length=2, default='de')
    max_students = models.IntegerField(default=30)
    
    # Access
    invite_code = models.CharField(max_length=8, unique=True)
    is_active = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.teacher.user.username})"
    
    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = self._generate_invite_code()
        super().save(*args, **kwargs)
    
    def _generate_invite_code(self):
        import secrets
        import string
        chars = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(secrets.choice(chars) for _ in range(8))
            if not Classroom.objects.filter(invite_code=code).exists():
                return code
```

---

## Step 3: Create ClassMembership Model

Add to `server/api/models.py`:

```python
class ClassMembership(models.Model):
    """Student enrollment in a classroom."""
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='memberships')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='class_memberships')
    
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('removed', 'Removed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['classroom', 'student']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.student.username} in {self.classroom.name}"
```

---

## Step 4: Create Migration

```bash
// turbo
py manage.py makemigrations api --name classroom_models
```

---

## Step 5: Apply Migration

```bash
// turbo
py manage.py migrate
```

---

## Step 6: Create Serializers

Add to `server/api/serializers.py`:

```python
class TeacherSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Teacher
        fields = ['id', 'username', 'email', 'organization_name', 'subjects', 
                  'bio', 'is_verified', 'max_classrooms', 'created_at']
        read_only_fields = ['id', 'is_verified', 'created_at']


class ClassroomSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.user.username', read_only=True)
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Classroom
        fields = ['id', 'name', 'description', 'level', 'language', 'max_students',
                  'invite_code', 'is_active', 'requires_approval', 'teacher_name',
                  'student_count', 'created_at']
        read_only_fields = ['id', 'invite_code', 'created_at']
    
    def get_student_count(self, obj):
        return obj.memberships.filter(status='active').count()


class ClassMembershipSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    
    class Meta:
        model = ClassMembership
        fields = ['id', 'classroom', 'student', 'student_username', 'student_email',
                  'classroom_name', 'status', 'joined_at']
        read_only_fields = ['id', 'joined_at']
```

---

## Verification

1. Check models exist: `py manage.py shell -c "from api.models import Teacher, Classroom, ClassMembership; print('Models OK')"`
2. Check migration applied: `py manage.py showmigrations api | grep classroom`
3. Test create in shell:
   ```python
   from django.contrib.auth.models import User
   from api.models import Teacher, Classroom
   user = User.objects.first()
   teacher = Teacher.objects.create(user=user, organization_name='Test School')
   classroom = Classroom.objects.create(teacher=teacher, name='German B1')
   print(f"Created: {classroom.invite_code}")
   ```

---

## Output
- New models: `Teacher`, `Classroom`, `ClassMembership`
- New serializers: `TeacherSerializer`, `ClassroomSerializer`, `ClassMembershipSerializer`
- New migration file

## Next Workflow
→ `/classroom-teacher-role`
