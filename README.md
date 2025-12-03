<div align="center">
  <img src="docs/images/adverant-logo-final.svg" alt="Adverant Logo" width="240"/>

  # Nexus Cursor Plugin

  **GraphRAG-Powered Code Intelligence for Cursor IDE**

  [![npm version](https://img.shields.io/npm/v/@adverant/nexus-cursor-plugin)](https://www.npmjs.com/package/@adverant/nexus-cursor-plugin)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
  [![Tests](https://img.shields.io/badge/Tests-143%20passing-brightgreen)](.)
  [![MCP](https://img.shields.io/badge/MCP-1.0-purple)](https://modelcontextprotocol.io/)

  **Version:** 1.1.0 | **Last Updated:** December 3, 2025

  [Why Nexus?](#why-nexus) • [Features](#features) • [Quick Start](#quick-start) • [Knowledge Circles](#knowledge-circles) • [Pricing](#pricing)
</div>

---

## Why Nexus?

Most tools tell you **who** changed code. Nexus tells you **why**.

| Traditional Tools | Nexus Cursor Plugin |
|-------------------|---------------------|
| Shows git blame (who, when) | Connects changes to **intent** via knowledge graph |
| File history as a timeline | **Episodic memory** — understands evolution patterns |
| Search by filename/text | **Semantic search** — understands what code *does* |
| No prediction | **Impact analysis** — see ripple effects *before* you change |

### The Knowledge Gap Problem

Every codebase has tribal knowledge trapped in developers' heads:
- *"Don't touch that file, it breaks everything"*
- *"We tried that approach in 2022, here's why it failed"*
- *"This workaround exists because of X edge case"*

**Nexus captures this.** Every query, every explanation, every impact analysis builds your codebase's institutional memory. New team members get context that would take months to acquire.

---

## Open Source — Free Forever

The full Nexus platform, MIT licensed, self-hosted. No artificial limits.

### Included Free

| Feature | Description |
|---------|-------------|
| **GraphRAG Search** | Semantic code search — understands *what* code does, not just text matching |
| **Impact Analysis** | See every file, function, and test affected before you make changes |
| **Episodic Memory** | Git history + AI context — understand *why* code evolved |
| **File History** | Complete evolution timeline with commit correlation |
| **Local Memory** | Your learnings persist locally across sessions |
| **6-Language AST** | Deep parsing for TypeScript, JavaScript, Python, Go, Rust, Java |

### Why Free?

We believe every developer deserves intelligent code assistance. The Open Source tier isn't a demo — it's production-ready tooling that makes you faster today.

---

## Features

### 🧠 Episodic Memory
Understand *why* code was written by analyzing git commit history and connecting changes to their original intent. Not just blame — **context**.

### 🔍 Impact Analysis
See ripple effects before making changes. Know exactly which files, functions, and tests will be affected — with **severity scoring**.

```
@nexus analyze impact of changing UserService
```

Returns: Critical (2 files), High (5 files), Medium (12 files) — with exact locations.

### 💬 Natural Language Queries
Ask questions about your codebase in plain English and get accurate, context-aware answers.

```
@nexus where is authentication handled?
@nexus why was the cache invalidation changed last month?
@nexus find all API endpoints that modify user data
```

### 🧪 AI Test Generation

Generate comprehensive test suites with a single command.

```
@nexus generate tests for UserService
```

- **6 Frameworks**: Jest, Vitest, pytest, Go testing, Rust, JUnit
- **Context-Aware**: Analyzes your existing test patterns
- **Smart Coverage**: Detects edge cases, generates mocks, estimates coverage

### 🛡️ Security Scanning

Real-time vulnerability detection across your dependency tree.

```
@nexus scan for vulnerabilities
```

- **8 Ecosystems**: npm, PyPI, Go, Cargo, Maven, Composer, RubyGems, NuGet
- **CVE Tracking**: Severity levels, CVSS scores, fix recommendations
- **OSV.dev Powered**: Industry-standard vulnerability database

### 🤖 Multi-Agent AI (30+ Models)

Not just one AI — an orchestra of specialized models.

| Mode | What It Does |
|------|--------------|
| **Orchestration** | Routes your query to the optimal model automatically |
| **Competition** | Multiple models solve the same problem, best answer wins |
| **Collaboration** | Specialized agents (research, coding, review) work together |

### 📊 Multi-Language Support
Full AST parsing for TypeScript, JavaScript, Python, Go, Rust, and Java via tree-sitter.

---

## Knowledge Circles

> *Available on Shared Access ($9/mo) and higher*

Knowledge Circles transform individual learning into **team intelligence**.

### How It Works

```
Developer A solves a tricky auth bug
        ↓
Nexus captures the context, solution, and reasoning
        ↓
Developer B asks "why does auth fail on refresh?"
        ↓
Nexus recalls Developer A's solution — instantly
```

### Three Pillars

| Pillar | What It Does |
|--------|--------------|
| **Shared GraphRAG** | Your team's code knowledge automatically indexed and searchable across all members |
| **Collective Learning** | Bug fixes, refactoring decisions, and architectural choices become team knowledge |
| **Private & Secure** | Encrypted, isolated to your organization — your code intelligence never leaves your circle |

### The ROI

- **Onboarding**: New hires get months of context in days
- **Consistency**: Same question = same answer, regardless of who asks
- **Retention**: Knowledge stays when people leave
- **Velocity**: Stop re-solving solved problems

---

## Pricing

| Tier | Price | What You Get |
|------|-------|--------------|
| **Open Source** | $0/mo | Full platform, self-hosted. GraphRAG, Impact Analysis, Episodic Memory, Local Storage. MIT licensed. |
| **Shared Access** | $9/mo | + Knowledge Circles, Cloud Sync, BYOK for 30+ LLMs, Plugin Marketplace access |
| **Teams** | $199/mo | + SSO/SAML, Admin Controls, Unlimited Knowledge Circles, Priority Support, 99.95% SLA |
| **Dedicated VPS** | $499/mo | + Dedicated Infrastructure, Unlimited Queries, Custom Integrations, 24/7 Support |

[View full pricing details →](https://adverant.ai/pricing)

---

## Quick Start

### 1. Get Your API Key

1. Sign up at [adverant.ai/pricing](https://adverant.ai/pricing)
2. Choose your plan (Free tier available!)
3. Go to Settings → API Keys
4. Create a new API key for "Cursor IDE"

### 2. Install & Configure

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

### 3. Start Using

In Cursor chat, use `@nexus` to access tools:

```
@nexus explain this code
@nexus what calls this function?
@nexus find authentication code
@nexus why was this changed?
@nexus analyze impact of changing UserService
@nexus generate tests for PaymentService
@nexus scan for vulnerabilities
```

---

## Available Tools

| Tool | Description |
|------|-------------|
| `nexus_health` | Check connection to Nexus backend services |
| `nexus_index_repository` | Index the current repository for code intelligence |
| `nexus_query` | Natural language codebase queries |
| `nexus_explain_code` | Explain code with historical context |
| `nexus_impact_analysis` | Analyze change ripple effects with severity scoring |
| `nexus_file_history` | Get file evolution timeline |
| `nexus_security_scan` | Scan dependencies for vulnerabilities |
| `nexus_generate_tests` | AI-powered test generation |

---

## Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `NEXUS_API_KEY` | Your Adverant API key | Required |
| `NEXUS_ENDPOINT` | API endpoint | `https://api.adverant.ai` |
| `LOG_LEVEL` | Logging level | `info` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Cursor IDE                              │
└─────────────────────────┬───────────────────────────────────┘
                          │ MCP Protocol (stdio)
┌─────────────────────────▼───────────────────────────────────┐
│              Nexus Cursor Plugin (MCP Server)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Tree-sitter  │  │    Git       │  │   GraphRAG   │       │
│  │   Parsers    │  │   Service    │  │    Client    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS + WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                 Adverant Nexus Platform                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ GraphRAG │  │MageAgent │  │  Neo4j   │  │  Qdrant  │    │
│  │ Service  │  │ (30+ LLMs)│  │  Graph   │  │ Vectors  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## BYOK (Bring Your Own Keys)

Configure your own API keys for maximum flexibility. Available on Shared Access and higher.

**Configure at**: [adverant.ai/settings/external-keys](https://adverant.ai/settings/external-keys)

| Provider | What You Get |
|----------|--------------|
| **OpenRouter** | Access to 30+ LLM models for multi-agent orchestration |
| **Anthropic** | Direct Claude access (Claude 3.5 Sonnet, Opus) |
| **OpenAI** | Direct GPT access (GPT-4o, o1) |

---

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/adverant/nexus-cursor-plugin.git
cd nexus-cursor-plugin

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

### Project Structure

```
nexus-cursor-plugin/
├── src/
│   ├── server.ts              # MCP server implementation
│   ├── types.ts               # TypeScript type definitions
│   ├── clients/               # GraphRAG & MageAgent clients
│   ├── handlers/              # Query, Impact, Episodic Memory
│   ├── tools/                 # Security Scanner, Test Generator
│   ├── parsers/               # Tree-sitter AST parsing
│   ├── git/                   # Git integration
│   └── __tests__/             # Test suites
├── docs/                      # Documentation
└── README.md
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/__tests__/unit/server.test.ts
```

---

## Documentation

- [API Reference](https://docs.adverant.ai/cursor-plugin/api)
- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Run linter and tests (`npm run lint && npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## Support

- **Documentation**: [docs.adverant.ai](https://docs.adverant.ai)
- **Issues**: [GitHub Issues](https://github.com/adverant/nexus-cursor-plugin/issues)
- **Email**: support@adverant.ai
- **Discord**: [Join our community](https://discord.gg/adverant)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <strong>Built with ❤️ by <a href="https://adverant.ai">Adverant</a></strong>

  <br/><br/>

  <a href="https://adverant.ai">Website</a> •
  <a href="https://docs.adverant.ai">Docs</a> •
  <a href="https://twitter.com/adverant">Twitter</a> •
  <a href="https://discord.gg/adverant">Discord</a>
</div>
