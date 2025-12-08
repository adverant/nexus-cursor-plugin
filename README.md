<div align="center">
  <img src="docs/images/adverant-logo-final.svg" alt="Adverant Logo" width="240"/>

  # Nexus Cursor Plugin

  **GraphRAG-Powered Code Intelligence for Cursor IDE**

  [![npm version](https://img.shields.io/npm/v/@adverant/nexus-cursor-plugin)](https://www.npmjs.com/package/@adverant/nexus-cursor-plugin)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
  [![Tests](https://img.shields.io/badge/Tests-185%20passing-brightgreen)](.)
  [![MCP](https://img.shields.io/badge/MCP-1.0-purple)](https://modelcontextprotocol.io/)

  **Version:** 0.2.0 | **Last Updated:** December 4, 2025

  [Why Nexus?](#why-nexus) • [NexusMind](#-nexusmind-visualization) • [Features](#features) • [Quick Start](#quick-start) • [Pricing](#pricing)
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
| Static diagrams | **NexusMind** — interactive, AI-powered code visualization |

### The Knowledge Gap Problem

Every codebase has tribal knowledge trapped in developers' heads:
- *"Don't touch that file, it breaks everything"*
- *"We tried that approach in 2022, here's why it failed"*
- *"This workaround exists because of X edge case"*

**Nexus captures this.** Every query, every explanation, every impact analysis builds your codebase's institutional memory. New team members get context that would take months to acquire.

---

## 🧠 NexusMind Visualization

> **NEW in v0.2.0** — Transform your codebase into an explorable knowledge graph

NexusMind is an interactive, AI-driven code visualization system that goes beyond traditional diagrams. It leverages GraphRAG infrastructure, multi-model AI orchestration, and temporal code analysis to create living, breathing visualizations.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Cursor IDE                                     │
├─────────────────────────────────────────────────────────────────────────┤
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│   │  NexusMind Panel │  │   Graph Viewer   │  │   Minimap Overlay    │  │
│   │  (Interactive)   │  │  (Force Layout)  │  │  (Navigation)        │  │
│   └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘  │
│            └─────────────────────┼───────────────────────┘              │
│                                  │                                      │
│                      ┌───────────▼───────────┐                          │
│                      │    MCP Tool Layer     │                          │
│                      │  (nexusmind_* tools)  │                          │
│                      └───────────┬───────────┘                          │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
┌─────────▼─────────┐  ┌───────────▼───────────┐  ┌────────▼────────┐
│   GraphRAG API    │  │    MageAgent API      │  │   Git Service   │
│  (Knowledge Graph)│  │  (Multi-Model AI)     │  │   (Temporal)    │
│                   │  │                       │  │                 │
│ • Entity Storage  │  │ • Orchestration       │  │ • File History  │
│ • Vector Search   │  │ • Competition Mode    │  │ • Blame Data    │
│ • Relationships   │  │ • Collaboration Mode  │  │ • Diff Analysis │
└───────────────────┘  └───────────────────────┘  └─────────────────┘
```

### NexusMind Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| `nexusmind_dependency_graph` | Interactive dependency visualization | Understand code structure |
| `nexusmind_evolution_timeline` | Code history over time | Track how code evolved |
| `nexusmind_impact_ripple` | Change propagation visualization | Pre-change risk assessment |
| `nexusmind_semantic_clusters` | AI-powered code grouping | Find related code |
| `nexusmind_architecture_analyze` | Code smell detection | Improve architecture |
| `nexusmind_nl_query` | Natural language graph queries | Explore visually |

---

### 📊 Dependency Graph

Build interactive dependency graphs with multiple layout algorithms.

```
@nexus nexusmind_dependency_graph rootFile="src/server.ts" depth=3
```

**Layout Options:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   FORCE-DIRECTED              HIERARCHICAL            RADIAL            │
│                                                                         │
│       ○───○                      ○                       ○              │
│      /│   │\                    /│\                    / │ \            │
│     ○ │   │ ○                  ○ ○ ○                  ○  ○  ○           │
│      \│   │/                  /│   │\                 │  │  │           │
│       ○───○                  ○ ○   ○ ○               ○  ○  ○            │
│                                                                         │
│   Best for:                Best for:             Best for:              │
│   Complex dependencies     Module hierarchy      Central modules        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Node Types**: Files, functions, classes, modules
- **Edge Types**: Imports, calls, extends, implements
- **Metrics per Node**: Complexity, change frequency, impact score
- **Filtering**: Include/exclude test files, external deps

**Example Output:**

```
┌──────────────────────────────────────────────────────────────┐
│                    server.ts                                  │
│                    [complexity: 15]                           │
│                         │                                     │
│          ┌──────────────┼──────────────┐                      │
│          │              │              │                      │
│          ▼              ▼              ▼                      │
│    ┌──────────┐  ┌──────────┐  ┌──────────────┐              │
│    │ graphrag │  │ mageagent│  │ visualization│              │
│    │ -client  │  │ -client  │  │   -handler   │              │
│    │ [12]     │  │ [8]      │  │ [22]         │              │
│    └────┬─────┘  └────┬─────┘  └───────┬──────┘              │
│         │             │                │                      │
│         ▼             ▼                ▼                      │
│    ┌─────────┐  ┌─────────┐  ┌─────────────────┐             │
│    │  axios  │  │  axios  │  │ dependency-graph│             │
│    │[external]│ │[external]│ │ evolution-timeline│            │
│    └─────────┘  └─────────┘  │ impact-ripple    │             │
│                              │ semantic-clusters│             │
│                              └─────────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

---

### 📈 Evolution Timeline

Visualize how code entities evolve over time with AI-generated insights.

```
@nexus nexusmind_evolution_timeline entity="src/server.ts" granularity="week"
```

**Timeline Visualization:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        server.ts Evolution                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Commits  ████░░██████░░░░████████░░░░░░██████████████████░░░░████      │
│           Oct       Nov       Dec       Jan       Feb       Mar         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Oct 15   ● Initial server implementation                               │
│           │ Author: alice@team.com                                      │
│           │ +245 lines, -0 lines                                        │
│           │                                                             │
│  Nov 3    ● Added authentication middleware                             │
│           │ Author: bob@team.com                                        │
│           │ +89 lines, -12 lines                                        │
│           │ Impact: HIGH - 8 dependent files                            │
│           │                                                             │
│  Dec 20   ● Refactored to use dependency injection                      │
│           │ Author: alice@team.com                                      │
│           │ +156 lines, -98 lines                                       │
│           │ AI Summary: "Major architectural change enabling            │
│           │              better testability and modularity"             │
│           │                                                             │
│  Feb 1    ● Added NexusMind visualization support                       │
│           │ Author: claude@anthropic.com                                │
│           │ +162 lines, -2 lines                                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  STATISTICS                                                             │
│  • Total Commits: 47          • Most Active: alice (28 commits)         │
│  • Lines Changed: +1,234 -567 • Churn Rate: 2.3 changes/week            │
│  • Contributors: 5            • Avg Complexity: Growing (+15%)          │
├─────────────────────────────────────────────────────────────────────────┤
│  AI INSIGHTS                                                            │
│  • "High change frequency suggests active development area"             │
│  • "Consider adding comprehensive tests before next refactor"           │
│  • "Authentication changes had broad impact - document API contract"    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🎯 Impact Ripple

Visualize how changes propagate through your codebase with severity-coded concentric rings.

```
@nexus nexusmind_impact_ripple entityId="UserService" maxDepth=3
```

**Ripple Visualization:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         Impact Ripple: UserService                      │
│                                                                         │
│                              ┌─────────┐                                │
│                              │  USER   │                                │
│                              │ SERVICE │  ← Selected Entity             │
│                              └────┬────┘                                │
│                                   │                                     │
│            ┌──────────────────────┼──────────────────────┐              │
│            │                      │                      │              │
│      ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐        │
│      │   AUTH    │          │  PROFILE  │          │   TEAM    │        │
│      │  SERVICE  │          │  SERVICE  │          │  SERVICE  │        │
│      │  ■■■■■■   │          │  ■■■■░░   │          │  ■■░░░░   │        │
│      │  CRITICAL │          │   HIGH    │          │  MEDIUM   │        │
│      └─────┬─────┘          └─────┬─────┘          └─────┬─────┘        │
│            │                      │                      │              │
│     ┌──────┼──────┐        ┌──────┼──────┐        ┌──────┼──────┐       │
│     │      │      │        │      │      │        │      │      │       │
│   ┌─▼─┐  ┌─▼─┐  ┌─▼─┐    ┌─▼─┐  ┌─▼─┐  ┌─▼─┐    ┌─▼─┐  ┌─▼─┐  ┌─▼─┐    │
│   │API│  │JWT│  │2FA│    │IMG│  │BIO│  │SET│    │INV│  │ROL│  │PRM│    │
│   │ ■ │  │ ■ │  │ ░ │    │ ░ │  │ ░ │  │ ░ │    │ ░ │  │ ░ │  │ ░ │    │
│   └───┘  └───┘  └───┘    └───┘  └───┘  └───┘    └───┘  └───┘  └───┘    │
│                                                                         │
│   LEGEND:  ■ = Critical   ■ = High   ░ = Medium   ░ = Low               │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  IMPACT SUMMARY                                                         │
│  • Critical Impact: 3 files (direct dependencies)                       │
│  • High Impact: 5 files (1 hop away)                                    │
│  • Medium Impact: 12 files (2 hops away)                                │
│  • Test Files Affected: 8                                               │
│  • Recommended: Review AuthService and ProfileService before changes    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🔮 Semantic Clusters

Group code by semantic similarity using AI-powered clustering algorithms.

```
@nexus nexusmind_semantic_clusters algorithm="kmeans" numClusters=5
```

**Clustering Visualization:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Semantic Code Clusters                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                                                                 │   │
│   │    ┌───────────────┐         ┌───────────────┐                  │   │
│   │    │  CLUSTER 1    │         │  CLUSTER 2    │                  │   │
│   │    │  "Auth &      │         │  "Data        │                  │   │
│   │    │   Security"   │         │   Access"     │                  │   │
│   │    │               │         │               │                  │   │
│   │    │ • auth.ts     │         │ • db-client   │                  │   │
│   │    │ • jwt.ts      │         │ • repository  │                  │   │
│   │    │ • crypto.ts   │         │ • orm-utils   │                  │   │
│   │    │ • session.ts  │         │ • migrations  │                  │   │
│   │    │               │         │               │                  │   │
│   │    │ Cohesion: 0.87│         │ Cohesion: 0.92│                  │   │
│   │    └───────────────┘         └───────────────┘                  │   │
│   │                                                                 │   │
│   │    ┌───────────────┐         ┌───────────────┐                  │   │
│   │    │  CLUSTER 3    │         │  CLUSTER 4    │                  │   │
│   │    │  "API         │         │  "Visualiza-  │                  │   │
│   │    │   Handlers"   │         │   tion"       │                  │   │
│   │    │               │         │               │                  │   │
│   │    │ • routes/     │         │ • graph-eng   │                  │   │
│   │    │ • controllers │         │ • layout-alg  │                  │   │
│   │    │ • middleware  │         │ • renderers   │                  │   │
│   │    │ • validators  │         │ • d3-bindings │                  │   │
│   │    │               │         │               │                  │   │
│   │    │ Cohesion: 0.84│         │ Cohesion: 0.91│                  │   │
│   │    └───────────────┘         └───────────────┘                  │   │
│   │                                                                 │   │
│   │              ┌───────────────┐                                  │   │
│   │              │  CLUSTER 5    │                                  │   │
│   │              │  "Testing     │                                  │   │
│   │              │   Utilities"  │                                  │   │
│   │              │               │                                  │   │
│   │              │ • mocks/      │                                  │   │
│   │              │ • fixtures/   │                                  │   │
│   │              │ • helpers/    │                                  │   │
│   │              │               │                                  │   │
│   │              │ Cohesion: 0.78│                                  │   │
│   │              └───────────────┘                                  │   │
│   │                                                                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   ALGORITHMS: kmeans | dbscan | hierarchical                            │
│   AI-GENERATED LABELS: Using MageAgent multi-model consensus            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🏗️ Architecture Analyzer

Detect code smells and get AI-powered refactoring suggestions.

```
@nexus nexusmind_architecture_analyze issueTypes=["circular-dependency","god-class"]
```

**Analysis Output:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Architecture Analysis Report                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⚠️  CIRCULAR DEPENDENCY DETECTED                     Confidence: 0.95  │
│  ────────────────────────────────────────────────────────────────────   │
│                                                                         │
│      ┌──────────┐                                                       │
│      │ UserSvc  │◄────────────────┐                                     │
│      └────┬─────┘                 │                                     │
│           │                       │                                     │
│           ▼                       │                                     │
│      ┌──────────┐           ┌─────┴────┐                                │
│      │ AuthSvc  │──────────►│ TeamSvc  │                                │
│      └──────────┘           └──────────┘                                │
│                                                                         │
│  Files Involved: user-service.ts, auth-service.ts, team-service.ts      │
│  Suggested Fix: Extract shared logic to new AuthContext module          │
│  Estimated Impact: 5 files affected, 2 test files need updates          │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⚠️  GOD CLASS DETECTED                               Confidence: 0.88  │
│  ────────────────────────────────────────────────────────────────────   │
│                                                                         │
│  File: src/services/DataProcessor.ts                                    │
│                                                                         │
│  Metrics:                                                               │
│  • Lines of Code: 1,247 (threshold: 500)                                │
│  • Methods: 34 (threshold: 20)                                          │
│  • Responsibilities: 7 distinct concerns identified                     │
│                                                                         │
│  Responsibilities Detected:                                             │
│  1. Data validation        5. Caching                                   │
│  2. Transformation         6. Logging                                   │
│  3. Persistence            7. Event emission                            │
│  4. API communication                                                   │
│                                                                         │
│  AI Refactoring Suggestion:                                             │
│  "Split into DataValidator, DataTransformer, DataRepository,            │
│   CacheManager, and EventEmitter classes. Use composition to            │
│   coordinate. This follows Single Responsibility Principle and          │
│   makes each component independently testable."                         │
│                                                                         │
│  Refactoring Steps:                                                     │
│  1. Extract DataValidator (validation methods)                          │
│  2. Extract DataTransformer (transformation logic)                      │
│  3. Extract DataRepository (persistence)                                │
│  4. Create DataProcessorFacade to coordinate                            │
│  5. Update 12 dependent files to use new interfaces                     │
│                                                                         │
│  Risk Level: MEDIUM (recommend feature branch + thorough testing)       │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ISSUE TYPES DETECTED                                                   │
│  • Circular Dependencies: 1                                             │
│  • God Classes: 1                                                       │
│  • Feature Envy: 0                                                      │
│  • Inappropriate Intimacy: 0                                            │
│  • Dead Code: 3 (minor)                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 💬 Natural Language Graph Queries

Ask questions about your codebase in plain English and get visual answers.

```
@nexus nexusmind_nl_query query="What depends on the authentication module?"
```

**Example Queries & Responses:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Query: "What depends on the authentication module?"                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Interpreted as: DEPENDENCY_GRAPH operation                             │
│  Root: src/auth/                                                        │
│  Direction: REVERSE (what depends ON this)                              │
│                                                                         │
│  Results: 23 files depend on authentication                             │
│                                                                         │
│  Critical Dependencies (will break if auth changes):                    │
│  • src/api/routes/user.ts                                               │
│  • src/api/routes/admin.ts                                              │
│  • src/middleware/protect.ts                                            │
│                                                                         │
│  Indirect Dependencies (may need updates):                              │
│  • src/services/UserService.ts                                          │
│  • src/services/TeamService.ts                                          │
│  • ... and 18 more                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Query: "Show me the most frequently changed files this month"          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Interpreted as: EVOLUTION_TIMELINE + FREQUENCY_ANALYSIS                │
│  Time Range: Last 30 days                                               │
│                                                                         │
│  Top Changed Files:                                                     │
│  ████████████████████░░░░  src/server.ts (18 changes)                   │
│  ██████████████░░░░░░░░░░  src/handlers/query.ts (12 changes)           │
│  ████████████░░░░░░░░░░░░  src/types.ts (10 changes)                    │
│  ██████████░░░░░░░░░░░░░░  src/clients/graphrag.ts (8 changes)          │
│  ████████░░░░░░░░░░░░░░░░  src/visualization/graph.ts (6 changes)       │
│                                                                         │
│  AI Insight: "server.ts has high churn - consider stabilizing API       │
│              contracts or adding integration tests to catch regressions"│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Query: "Find code similar to the retry logic in api-client.ts"         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Interpreted as: SEMANTIC_CLUSTER + SIMILARITY_SEARCH                   │
│  Reference: src/clients/api-client.ts:45-78 (retry pattern)             │
│                                                                         │
│  Similar Patterns Found:                                                │
│                                                                         │
│  1. src/clients/graphrag-client.ts:89-115                               │
│     Similarity: 0.94                                                    │
│     Pattern: Exponential backoff with jitter                            │
│                                                                         │
│  2. src/jobs/sync-job.ts:23-56                                          │
│     Similarity: 0.87                                                    │
│     Pattern: Retry with max attempts                                    │
│                                                                         │
│  3. src/utils/resilience.ts:12-45                                       │
│     Similarity: 0.82                                                    │
│     Pattern: Circuit breaker with retry                                 │
│                                                                         │
│  AI Suggestion: "Consider extracting common retry logic into a          │
│                 shared utility to ensure consistent behavior"           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Use Cases

### 🆕 Onboarding New Developers

**Challenge**: New team member needs to understand unfamiliar codebase quickly.

```bash
# Step 1: Get high-level architecture view
@nexus nexusmind_dependency_graph rootFile="src/index.ts" depth=2 layout="hierarchical"

# Step 2: Understand key module relationships
@nexus nexusmind_semantic_clusters algorithm="kmeans" numClusters=8

# Step 3: Ask natural language questions
@nexus nexusmind_nl_query query="What are the main entry points?"
@nexus nexusmind_nl_query query="How does data flow from API to database?"
```

**Result**: Hours of exploration compressed into minutes with visual context.

---

### 🔧 Pre-Refactoring Analysis

**Challenge**: Need to refactor a core module without breaking things.

```bash
# Step 1: Analyze impact before touching code
@nexus nexusmind_impact_ripple entityId="UserService" maxDepth=4

# Step 2: Check for architectural issues
@nexus nexusmind_architecture_analyze targetPath="src/services/" includeRefactoringSuggestions=true

# Step 3: Understand historical context
@nexus nexusmind_evolution_timeline entity="src/services/UserService.ts" granularity="month"
```

**Result**: Know exactly what will break and get AI-powered refactoring steps.

---

### 🐛 Debugging Production Issues

**Challenge**: Bug reported in production, need to find root cause fast.

```bash
# Step 1: Find all code related to the feature
@nexus nexusmind_nl_query query="Show me all payment processing code"

# Step 2: Trace dependencies
@nexus nexusmind_dependency_graph rootFile="src/payments/processor.ts" depth=3

# Step 3: Check recent changes
@nexus nexusmind_evolution_timeline entity="src/payments/" granularity="day"
```

**Result**: Quickly narrow down suspect code and recent changes.

---

### 📚 Documentation & Knowledge Transfer

**Challenge**: Need to document architecture for stakeholders.

```bash
# Step 1: Generate module overview
@nexus nexusmind_semantic_clusters algorithm="hierarchical"

# Step 2: Document dependencies
@nexus nexusmind_dependency_graph rootFile="src/index.ts" depth=4 layout="hierarchical"

# Step 3: Identify technical debt
@nexus nexusmind_architecture_analyze issueTypes=["circular-dependency","god-class","dead-code"]
```

**Result**: Auto-generated visualizations for technical documentation.

---

### 🔒 Security Review

**Challenge**: Audit codebase for security-sensitive code paths.

```bash
# Step 1: Find authentication-related code
@nexus nexusmind_nl_query query="Find all authentication and authorization code"

# Step 2: Trace data flow to auth
@nexus nexusmind_impact_ripple entityId="AuthService" maxDepth=3 includeTests=true

# Step 3: Check for vulnerability patterns
@nexus nexusmind_architecture_analyze issueTypes=["inappropriate-intimacy"]
```

**Result**: Visual map of security-critical code paths.

---

## Open Source — Free Forever

The full Nexus platform, MIT licensed, self-hosted. No artificial limits.

### Included Free

| Feature | Description |
|---------|-------------|
| **GraphRAG Search** | Semantic code search — understands *what* code does |
| **Impact Analysis** | See every file, function, and test affected |
| **Episodic Memory** | Git history + AI context — understand *why* code evolved |
| **NexusMind Visualization** | All 6 visualization tools, no restrictions |
| **File History** | Complete evolution timeline with commit correlation |
| **6-Language AST** | Deep parsing for TypeScript, JavaScript, Python, Go, Rust, Java |

---

## Features

### 🧠 Episodic Memory
Understand *why* code was written by analyzing git commit history and connecting changes to their original intent.

### 🔍 Impact Analysis
See ripple effects before making changes. Know exactly which files, functions, and tests will be affected.

```
@nexus analyze impact of changing UserService
```

### 💬 Natural Language Queries
Ask questions about your codebase in plain English.

```
@nexus where is authentication handled?
@nexus why was the cache invalidation changed last month?
```

### 🧪 AI Test Generation
Generate comprehensive test suites with a single command.

```
@nexus generate tests for UserService
```

### 🛡️ Security Scanning
Real-time vulnerability detection across your dependency tree.

```
@nexus scan for vulnerabilities
```

### 🤖 Multi-Agent AI (30+ Models)
Orchestration, Competition, and Collaboration modes for complex tasks.

---

## Quick Start

### 1. Get Your API Key

1. Sign up at [adverant.ai/pricing](https://adverant.ai/pricing)
2. Go to Settings → API Keys
3. Create a new API key for "Cursor IDE"

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

```
# Core Tools
@nexus explain this code
@nexus analyze impact of changing UserService
@nexus generate tests for PaymentService

# NexusMind Visualization
@nexus nexusmind_dependency_graph rootFile="src/index.ts"
@nexus nexusmind_evolution_timeline entity="src/server.ts"
@nexus nexusmind_impact_ripple entityId="AuthService"
@nexus nexusmind_semantic_clusters numClusters=5
@nexus nexusmind_architecture_analyze
@nexus nexusmind_nl_query query="What depends on the database module?"
```

---

## Available Tools

### Core Tools

| Tool | Description |
|------|-------------|
| `nexus_health` | Check connection to Nexus backend |
| `nexus_index_repository` | Index repository for code intelligence |
| `nexus_query` | Natural language codebase queries |
| `nexus_explain_code` | Explain code with historical context |
| `nexus_impact_analysis` | Analyze change ripple effects |
| `nexus_file_history` | Get file evolution timeline |

### NexusMind Visualization Tools

| Tool | Description |
|------|-------------|
| `nexusmind_dependency_graph` | Build interactive dependency graphs |
| `nexusmind_evolution_timeline` | Visualize code history over time |
| `nexusmind_impact_ripple` | Show change propagation ripple effects |
| `nexusmind_semantic_clusters` | AI-powered semantic code grouping |
| `nexusmind_architecture_analyze` | Detect code smells, suggest refactoring |
| `nexusmind_nl_query` | Natural language to graph operations |

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
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Tree-sitter  │  │    Git       │  │   GraphRAG   │       │
│  │   Parsers    │  │   Service    │  │    Client    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │           NexusMind Visualization Module          │       │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │       │
│  │  │ Graph      │  │ Layout     │  │ Semantic   │  │       │
│  │  │ Engine     │  │ Algorithms │  │ Clustering │  │       │
│  │  └────────────┘  └────────────┘  └────────────┘  │       │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │       │
│  │  │ Evolution  │  │ Impact     │  │ NL Query   │  │       │
│  │  │ Timeline   │  │ Ripple     │  │ Processor  │  │       │
│  │  └────────────┘  └────────────┘  └────────────┘  │       │
│  └──────────────────────────────────────────────────┘       │
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

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

```bash
git clone https://github.com/adverant/nexus-cursor-plugin.git
cd nexus-cursor-plugin
npm install
npm run build
npm test
```

### Project Structure

```
nexus-cursor-plugin/
├── src/
│   ├── server.ts              # MCP server implementation
│   ├── types.ts               # TypeScript type definitions
│   ├── clients/               # GraphRAG & MageAgent clients
│   ├── handlers/              # Query, Impact, Episodic Memory
│   ├── visualization/         # NexusMind module (NEW)
│   │   ├── graph-engine.ts    # Core graph data structures
│   │   ├── layout-algorithms.ts
│   │   ├── dependency-graph.ts
│   │   ├── evolution-timeline.ts
│   │   ├── impact-ripple.ts
│   │   ├── semantic-clusters.ts
│   │   ├── architecture-advisor.ts
│   │   └── nl-graph-query.ts
│   ├── tools/                 # Security Scanner, Test Generator
│   ├── parsers/               # Tree-sitter AST parsing
│   ├── git/                   # Git integration
│   └── __tests__/             # Test suites (185 tests)
├── docs/                      # Documentation
└── README.md
```

### Running Tests

```bash
npm test                    # Run all 185 tests
npm run test:coverage       # Run with coverage
npm test -- --grep "visualization"  # Run visualization tests only
```

---

## Pricing

| Tier | Price | What You Get |
|------|-------|--------------|
| **Open Source** | $0/mo | Full platform including NexusMind. MIT licensed. |
| **Shared Access** | $9/mo | + Knowledge Circles, Cloud Sync, BYOK for 30+ LLMs |
| **Teams** | $199/mo | + SSO/SAML, Admin Controls, Priority Support |
| **Dedicated VPS** | $499/mo | + Dedicated Infrastructure, Custom Integrations |

[View full pricing details →](https://adverant.ai/pricing)

---

## Support

- **Documentation**: [adverant.ai/docs](https://adverant.ai/docs)
- **Issues**: [GitHub Issues](https://github.com/adverant/nexus-cursor-plugin/issues)
- **Email**: support@adverant.ai
- **Discord**: [Join our community](https://discord.gg/adverant)

---

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <strong>Built with ❤️ by <a href="https://adverant.ai">Adverant</a></strong>

  <br/><br/>

  <a href="https://adverant.ai">Website</a> •
  <a href="https://adverant.ai/docs">Docs</a> •
  <a href="https://twitter.com/adverant">Twitter</a> •
  <a href="https://discord.gg/adverant">Discord</a>
</div>
