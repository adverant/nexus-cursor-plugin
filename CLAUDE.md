# Nexus Cursor Plugin - Project Instructions

This file contains instructions for AI assistants working on this codebase.

## Quick Reference

```bash
npm run build      # Compile TypeScript to dist/
npm run dev        # Watch mode development
npm test           # Run Vitest tests
npm run lint       # ESLint checks
npm run typecheck  # Type validation
```

---

## Project Context

**Nexus Cursor Plugin** is a GraphRAG-powered code intelligence MCP server for Cursor IDE.

### Core Technology Stack
- **Language**: TypeScript 5.3 (strict mode)
- **Runtime**: Node.js 20+
- **Package**: @adverant/nexus-cursor-plugin
- **Protocol**: Model Context Protocol (MCP)
- **Parsing**: Tree-sitter AST (6 languages)

---

## Architecture

```
src/
├── index.ts                    # CLI entry point
├── server.ts                   # MCP server implementation
├── types.ts                    # TypeScript type definitions
├── clients/                    # External service clients
│   ├── graphrag-client.ts      # GraphRAG knowledge graph API
│   ├── mageagent-client.ts     # Multi-model AI orchestration
│   └── index.ts
├── parsers/                    # Code parsing & analysis
│   ├── tree-sitter-service.ts  # AST parsing for 6 languages
│   └── language-configs.ts     # Language-specific configs
├── git/                        # Git integration
│   └── git-service.ts          # Git history & blame analysis
├── handlers/                   # MCP tool handlers
│   ├── query-handler.ts        # Natural language queries
│   ├── episodic-memory.ts      # Git history context
│   ├── impact-analysis.ts      # Change ripple effects
│   └── index.ts
├── indexer/                    # Repository indexing
│   ├── repository-indexer.ts   # Main indexing logic
│   └── index.ts
├── tools/                      # Additional tools
│   ├── security-scanner.ts     # Vulnerability detection
│   ├── test-generator.ts       # Test generation
│   └── index.ts
└── __tests__/                  # Test suites
    ├── unit/
    ├── integration/
    └── setup-mcp-mocks.ts
```

### Key Patterns
- All external API calls go through clients in `src/clients/`
- Tool handlers in `src/handlers/` follow MCP SDK patterns
- Tree-sitter configs per language in `src/parsers/language-configs.ts`
- Zod schemas for runtime validation

---

## Code Style & Standards

### TypeScript
- Strict mode enabled
- Prefer composition over inheritance
- Use proper async/await patterns
- Implement proper type guards
- Avoid `any` type unless absolutely necessary

### Linting & Formatting
- ESLint for code quality
- Zod for runtime validation
- Pino for structured logging

### Testing
Tests use Vitest with mocks in `src/__tests__/setup-mcp-mocks.ts`.

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --run src/__tests__/unit/specific.test.ts

# Run with coverage
npm test -- --coverage
```

---

## Core Engineering Directives

### 1. Root Cause Analysis is MANDATORY
Before writing ANY code:
1. **Identify the symptom** - What is observed vs. expected?
2. **Trace the causal chain** - Follow execution path to origin
3. **Document the root cause** - Not symptoms, but fundamental flaw
4. **Validate the solution** - Will this fix cause, not symptom?
5. **Consider side effects** - What else might this affect?

### 2. Refactor, Don't Patch
```typescript
// WRONG: Patching symptoms
if (data === undefined) {
  data = {}; // Band-aid fix
}

// RIGHT: Refactoring to address root cause
class DataService {
  constructor(private readonly validator: DataValidator) {}

  async getData(): Promise<ValidatedData> {
    const raw = await this.fetchData();
    return this.validator.validate(raw); // Never returns undefined
  }
}
```

### 3. Full Implementation Only
- **NO placeholders**: No `// TODO`, no `throw new Error('Not implemented')`
- **Complete error handling**: Every error path handled explicitly
- **All edge cases**: Handle null, undefined, empty, overflow, underflow
- **Production-ready**: Code that can go to production immediately

### 4. Robust Error Architecture
```typescript
class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: {
      operation: string;
      input?: unknown;
      timestamp: Date;
      stackTrace: string;
      suggestion: string;
    }
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### 5. Clean Code Standards
- **Single Responsibility**: Each function/class does ONE thing
- **DRY Principle**: Never duplicate logic
- **SOLID Principles**: Always apply all five
- **Dependency Injection**: Never hardcode dependencies
- **Pure Functions**: Prefer immutable, side-effect-free code

---

## Task Prioritization Rules

### Priority 1: Current Task Context
1. **Check `.claude/current-task.md`** - If this file exists, it takes **absolute precedence**
2. **User's Last Direct Instruction** - Complete the user's most recent explicit request first
3. **Understand the Immediate Goal** - Before fixing anything, confirm what the user wants

### Priority 2: When to Address Code Quality Issues
**ONLY** address code quality issues when:
- They **block the current task**
- User **explicitly asks** to fix them
- Current task is **100% complete** and user approves moving to next task

**DO NOT** start fixing unrelated code issues when:
- Session continues from previous context
- User has given a specific task
- Errors are **pre-existing** and don't block current work
- You see TypeScript warnings/errors in unrelated files

### Priority 3: Session Resumption Protocol
When a session resumes after context compaction:
1. **Read the continuation summary carefully** - What was the LAST thing the user asked for?
2. **Check git status** - What files are modified?
3. **ASK before switching tasks**
4. **Don't assume** - Just because you see problems doesn't mean you should fix them now

---

## Anti-Patterns to Avoid

1. **God objects/functions**
2. **Spaghetti code**
3. **Copy-paste programming**
4. **Premature optimization**
5. **Ignoring edge cases**
6. **Tight coupling**
7. **Missing error boundaries**
8. **Synchronous blocking operations**

---

## Automated Quality Checks

### Before Committing Code
Always run:
```bash
npm run lint
npm run typecheck
npm test
```

### Code Review Checklist
- [ ] No hardcoded values or magic numbers
- [ ] All error cases handled explicitly
- [ ] Code follows existing patterns
- [ ] No commented-out code or TODOs
- [ ] All functions have single responsibility
- [ ] Dependencies properly injected
- [ ] Proper abstraction layers maintained
- [ ] Security best practices followed

---

## Docker Build Policy

### Cross-Architecture Builds

When building Docker images for deployment:
- Use `--platform linux/amd64` for production deployments
- Use multi-stage builds for smaller images
- Always tag images with version numbers

**Example Build Process:**
```bash
# Build for production architecture
docker buildx build --platform linux/amd64 -t nexus-service:latest .

# Or use docker-compose
docker-compose -f docker-compose.prod.yml build
```

---

## Required Output Structure

For EVERY significant code change:

### 1. Root Cause Analysis
```markdown
## Root Cause Analysis

### Symptom
[What was observed]

### Expected Behavior
[What should happen]

### Root Cause
[The fundamental issue]

### Causal Chain
1. [First failure point]
2. [Propagation path]
3. [Final symptom manifestation]
```

### 2. Refactoring Strategy
```markdown
## Refactoring Strategy

### Design Pattern Applied
[Pattern name and why it fits]

### Architecture Changes
[Structural improvements]

### Testing Strategy
[How we verify it works]
```

---

## MCP Protocol Patterns

### Tool Registration
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'tool_name',
      description: 'Tool description',
      inputSchema: {
        type: 'object',
        properties: {
          param: { type: 'string', description: 'Parameter description' }
        },
        required: ['param']
      }
    }
  ]
}));
```

### Tool Handler
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'tool_name':
      return await handleToolName(args);
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }
});
```

---

**Remember**: This is production infrastructure. NEVER compromise on code quality or data safety. When in doubt, ask the user.
