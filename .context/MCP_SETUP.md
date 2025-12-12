# MCP Setup Guide for VocabMaster

## How to Add MCPs in Antigravity

### Step 1: Open MCP Configuration
1. Click the **"..."** menu at the top of the Agent panel
2. Select **"MCP Servers"**
3. Click **"Manage MCP Servers"**
4. Select **"View raw config"**
5. This opens `mcp_config.json`

### Step 2: Add MCP Configurations

Copy and paste the configurations below into your `mcp_config.json`:

---

## Recommended MCP Configurations

### Complete mcp_config.json Example

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://localhost:5432/vocabmaster"
      ]
    },
    "fetch": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch"
      ]
    },
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "E:/vocab_web"
      ]
    },
    "brave-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "YOUR_BRAVE_API_KEY"
      }
    }
  }
}
```

---

## Individual MCP Configurations

### 1. PostgreSQL MCP
Direct database access for queries and schema inspection.

```json
"postgres": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-postgres",
    "postgresql://username:password@localhost:5432/vocabmaster"
  ]
}
```

**Usage:**
```
@mcp:postgres: Show all tables in the database
@mcp:postgres: Query the UserProfile table
```

---

### 2. Fetch MCP
Make HTTP requests to test APIs.

```json
"fetch": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-fetch"
  ]
}
```

**Usage:**
```
@mcp:fetch: GET http://localhost:8000/api/health/
@mcp:fetch: POST http://localhost:8000/api/words/ with {"word": "test"}
```

---

### 3. Memory MCP
Persistent memory across sessions (helps with empty Knowledge panel!).

```json
"memory": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-memory"
  ]
}
```

**Usage:**
```
@mcp:memory: Remember that VocabMaster uses unified_ai for all AI calls
@mcp:memory: What do you remember about this project?
```

---

### 4. Filesystem MCP
Enhanced file operations.

```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "E:/vocab_web"
  ]
}
```

---

### 5. Brave Search MCP (Optional)
Web search from within IDE.

```json
"brave-search": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-brave-search"
  ],
  "env": {
    "BRAVE_API_KEY": "YOUR_API_KEY"
  }
}
```

**Get API key:** https://brave.com/search/api/

---

## After Adding MCPs

1. **Save** the `mcp_config.json` file
2. **Restart** Antigravity
3. MCPs will appear in the MCP Servers list
4. Use with `@mcp:name:` prefix in chat

---

## Verify MCPs are Working

After restart, type in chat:
```
@mcp:fetch: GET https://httpbin.org/get
```

If it returns JSON response, MCPs are working!

---

## Requirements

- **Node.js** must be installed (for npx command)
- **npm** must be available in PATH

To check:
```bash
node --version
npm --version
```
