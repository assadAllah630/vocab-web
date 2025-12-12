# Component Workflow

> Workflow for creating a new React component in VocabMaster.

## Context to Load
```
@context: .context/modules/frontend/<area>.context.md
@context: .context/conventions.md
```

---

## Step 1: Determine Component Type

| Type | Location | Example |
|------|----------|---------|
| Page | `client/src/pages/` | Dashboard.jsx |
| Mobile Page | `client/src/pages/mobile/` | MobileHome.jsx |
| Shared Component | `client/src/components/` | LoadingSpinner.jsx |

---

## Step 2: Create Component File

File: `client/src/components/MyComponent.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data or initialize
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      {/* Component content */}
    </motion.div>
  );
};

export default MyComponent;
```

---

## Step 3: Add TailwindCSS Styling

Use these patterns:
- **Container**: `max-w-4xl mx-auto p-4`
- **Card**: `bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6`
- **Button Primary**: `bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg`
- **Button Secondary**: `bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg`
- **Input**: `border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500`

---

## Step 4: Add Framer Motion Animations

```jsx
// Fade in
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}

// Slide up
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}

// Stagger children
<motion.div variants={container} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={item}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

---

## Step 5: Connect to API

```jsx
import api from '../api';

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/my-endpoint/');
      setState(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

---

## Step 6: Add to Router (if page)

File: `client/src/App.jsx`

```jsx
import MyPage from './pages/MyPage';

<Route path="/my-page" element={<MyPage />} />
```

---

## Hard Rules

- ❌ NEVER use class components
- ❌ NEVER use inline styles (use TailwindCSS)
- ⚠️ Always handle loading and error states
- ⚠️ Always use `api.js` for API calls
- ⚠️ Mobile pages go in `pages/mobile/`
