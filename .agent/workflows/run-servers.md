---
description: Run all VocabMaster development servers (backend, frontend, admin)
---

## Quick Start (All Servers)

Open 3 terminals and run:

### Terminal 1: Backend (Django)
```bash
cd E:\vocab_web\server
python manage.py runserver
```
// turbo

### Terminal 2: Frontend (React)
```bash
cd E:\vocab_web\client
npm run dev
```
// turbo

### Terminal 3: Admin Panel
```bash
cd E:\vocab_web\admin-client
npm run dev
```
// turbo

---

## URLs After Starting

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| Frontend | http://localhost:5173 |
| Admin Panel | http://localhost:5174 |

---

## Common Issues

### Python not found
```bash
# Use full path
py manage.py runserver
# Or
python3 manage.py runserver
```

### Port already in use
```bash
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Missing dependencies
```bash
# Backend
pip install -r requirements.txt

# Frontend/Admin
npm install
```

---

## Check If Running

```bash
curl http://localhost:8000/api/health/
```
