---
description: Create a new React component with TailwindCSS and Framer Motion
---

## Step 1: Determine Component Type
| Type | Location |
|------|----------|
| Page | `client/src/pages/` |
| Mobile Page | `client/src/pages/mobile/` |
| Shared Component | `client/src/components/` |

## Step 2: Create Component File

```jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

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

## Step 3: Add TailwindCSS Styling
- Container: `max-w-4xl mx-auto p-4`
- Card: `bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6`
- Button: `bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg`

## Step 4: Connect to API
Use `api.js` for all API calls.

## Step 5: Add to Router (if page)
File: `client/src/App.jsx`

## Hard Rules
- ❌ NEVER use class components
- ❌ NEVER use inline styles
- ⚠️ Always handle loading and error states
- ⚠️ Mobile pages go in `pages/mobile/`
