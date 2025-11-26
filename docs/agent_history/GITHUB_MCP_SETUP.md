# How to Connect GitHub MCP Server

To connect the GitHub Model Context Protocol (MCP) server, you need to generate a Personal Access Token (PAT) and configure your MCP client.

## Step 1: Generate a GitHub Personal Access Token (PAT)

1.  Log in to your GitHub account.
2.  Go to **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
    *   Direct Link: [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new)
3.  Click **Generate new token (classic)**.
4.  **Note**: Give it a name like "MCP Agent".
5.  **Expiration**: Set to "No expiration" or your preferred duration.
6.  **Select Scopes**: You must select the following permissions:
    *   `repo` (Full control of private repositories)
    *   `user` (Update all user data)
    *   `read:org` (Read org and team membership) - *Optional but recommended*
7.  Click **Generate token**.
8.  **COPY THE TOKEN IMMEDIATELY**. You won't be able to see it again.

## Step 2: Configure Your MCP Client

You need to add the GitHub server to your MCP configuration file.

### Configuration JSON

Add the following entry to your `mcpServers` configuration:

```json
"github": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-github"
  ],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_GITHUB_PAT>"
  }
}
```

Replace `"YOUR_TOKEN_HERE"` with the token you copied in Step 1.

## Step 3: Where is the Configuration File?

Depending on the tool you are using, the configuration file is located at:

### For VS Code (Cline / Roo-Cline):

**Full Path:**
```
C:\Users\زهراء\AppData\Roaming\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json
```

**How to Open:**
1.  Press `Win + R` on your keyboard
2.  Type: `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings`
3.  Press Enter
4.  Open the file `cline_mcp_settings.json` with Notepad or VS Code

### For Claude Desktop:

**Full Path:**
```
C:\Users\زهراء\AppData\Roaming\Claude\claude_desktop_config.json
```

**How to Open:**
1.  Press `Win + R` on your keyboard
2.  Type: `%APPDATA%\Claude`
3.  Press Enter
4.  Open the file `claude_desktop_config.json` with Notepad

### Editing the File:

1.  Open the file in a text editor.
2.  Find the `"mcpServers": { ... }` section (or create it if it doesn't exist).
3.  Paste the `"github": { ... }` block inside the `"mcpServers"` object.
4.  Save the file.

## Step 4: Restart

Restart your AI agent or MCP client to apply the changes. The agent should now have access to your GitHub repositories!
