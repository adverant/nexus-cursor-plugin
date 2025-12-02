# Nexus Cursor Plugin - Implementation Plan

> Full detailed plan: `/Adverant-Nexus/docs/plans/2025-12-02-nexus-cursor-plugin.md`

## Overview

Build an MCP server that provides GraphRAG-powered code intelligence to Cursor IDE.

## Phases

### Phase 1: Core MCP Server (3 days)
- [ ] Task 1.1: Initialize project structure
- [ ] Task 1.2: Create MCP server skeleton with auth
- [ ] Task 1.3: Create Dockerfile
- [ ] Task 1.4: Add Cursor configuration example

### Phase 2: Tree-sitter & Graph (4 days)
- [ ] Task 2.1: Add Tree-sitter parser service
- [ ] Task 2.2: Add Git history service
- [ ] Task 2.3: Add GraphRAG client

### Phase 3: GraphRAG Integration (3 days)
- [ ] Task 3.1: Implement repository indexer
- [ ] Task 3.2: Implement episodic memory handler
- [ ] Task 3.3: Implement impact analysis handler
- [ ] Task 3.4: Implement query handler

### Phase 4: MageAgent Integration (2 days)
- [ ] Task 4.1: Add MageAgent client
- [ ] Task 4.2: Add security scanning tool
- [ ] Task 4.3: Add code generation tool

### Phase 5: Dashboard UI (2 days)
- [ ] Task 5.1: External keys UI page
- [ ] Task 5.2: Plugin configuration page

### Phase 6: Testing & Docs (2 days)
- [ ] Task 6.1: Unit tests
- [ ] Task 6.2: Integration tests
- [ ] Task 6.3: Documentation

## Tools

| Tool | Description |
|------|-------------|
| `nexus_health` | Check connection status |
| `nexus_index_repository` | Index codebase |
| `nexus_query` | Natural language queries |
| `nexus_explain_code` | Explain with history |
| `nexus_impact_analysis` | Change ripple effects |
| `nexus_file_history` | File evolution |
| `nexus_security_scan` | Vulnerability detection |

## Success Criteria

- [ ] User can authenticate with Adverant API key
- [ ] Repository indexing < 60s for 100k LOC
- [ ] Queries return results in < 2s
- [ ] Impact analysis shows all callers
- [ ] Security scan detects vulnerabilities
