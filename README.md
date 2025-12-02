# Nexus Cursor Plugin

GraphRAG-powered code intelligence for Cursor IDE by [Adverant.ai](https://adverant.ai).

## Features

- **Episodic Memory**: Understand WHY code was written by analyzing git history
- **Impact Analysis**: See ripple effects before making changes
- **Natural Language Queries**: Ask questions about your codebase
- **Multi-Model AI**: Powered by MageAgent with 30+ LLM models
- **Security Scanning**: Real-time vulnerability detection

## Quick Start

### 1. Get Your API Key

1. Sign up at [adverant.ai](https://adverant.ai)
2. Go to Settings → API Keys
3. Create a new API key for "Cursor IDE"

### 2. Configure Cursor

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "nexus": {
      "command": "npx",
      "args": ["-y", "@adverant/nexus-cursor-plugin"],
      "env": {
        "NEXUS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 3. Use It

In Cursor chat, use `@nexus` to access tools:

- `@nexus explain this code` - Get historical context
- `@nexus what calls this function?` - Impact analysis
- `@nexus find authentication code` - Semantic search
- `@nexus why was this changed?` - Git history analysis

## Tools

| Tool | Description |
|------|-------------|
| `nexus_query` | Natural language codebase queries |
| `nexus_explain_code` | Explain code with commit history |
| `nexus_impact_analysis` | Analyze change ripple effects |
| `nexus_file_history` | Get file evolution timeline |
| `nexus_security_scan` | Scan for vulnerabilities |

## Configuration

| Env Variable | Description | Default |
|--------------|-------------|---------|
| `NEXUS_API_KEY` | Your Adverant API key | Required |
| `NEXUS_ENDPOINT` | API endpoint | `https://api.adverant.ai` |
| `LOG_LEVEL` | Logging level | `info` |

## BYOK (Bring Your Own Keys)

Configure external API keys at [adverant.ai/settings/external-keys](https://adverant.ai/settings/external-keys):

- **OpenRouter** - Required for MageAgent multi-model
- **Anthropic** - Optional, direct Claude access
- **OpenAI** - Optional, direct GPT access

## Development

```bash
# Clone
git clone git@github.com:adverant/nexus-cursor-plugin.git
cd nexus-cursor-plugin

# Install
npm install

# Build
npm run build

# Test locally
NEXUS_API_KEY=your_key npm start
```

## License

Proprietary - Adverant Inc.
