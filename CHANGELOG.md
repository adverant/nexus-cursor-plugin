# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial public release preparation
- Comprehensive test suite (143 tests)
- Open source documentation (README, CONTRIBUTING, CODE_OF_CONDUCT)

## [0.1.0] - 2024-12-02

### Added
- **Core MCP Server Implementation**
  - Full Model Context Protocol (MCP) server for Cursor IDE integration
  - stdio transport for communication with Cursor
  - Tool registration and handler framework
  - Authentication with Nexus backend services

- **Code Intelligence Tools**
  - `nexus_health` - Health check and connection verification
  - `nexus_index_repository` - Repository indexing for code intelligence
  - `nexus_query` - Natural language codebase queries
  - `nexus_explain_code` - Code explanation with historical context
  - `nexus_impact_analysis` - Change impact analysis
  - `nexus_file_history` - File evolution timeline

- **Tree-sitter Integration**
  - Multi-language AST parsing (TypeScript, JavaScript, Python, Go, Rust, Java)
  - Function and class extraction
  - Import relationship tracking
  - Language-specific node type handling

- **Git Integration**
  - Commit history analysis
  - File blame information
  - Branch and commit metadata extraction
  - Git author and timestamp tracking

- **GraphRAG Client**
  - Connection to Adverant Nexus GraphRAG backend
  - Entity and relationship creation
  - Semantic search integration
  - Knowledge graph traversal

- **Repository Indexer**
  - File discovery with configurable ignore patterns
  - Progress tracking with phase reporting
  - Entity hierarchy creation (repository → file → class/function)
  - Import relationship resolution

- **Testing Infrastructure**
  - Unit tests for all core components
  - Integration tests with mocked dependencies
  - Vitest test framework configuration
  - Dependency injection for testability

### Technical Details
- TypeScript with strict mode
- Node.js 20+ runtime requirement
- MCP SDK integration
- Tree-sitter native parsers
- Pino structured logging

### Dependencies
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `tree-sitter` - AST parsing
- `tree-sitter-*` - Language-specific parsers
- `simple-git` - Git operations
- `pino` - Structured logging
- `zod` - Schema validation

## [0.0.1] - 2024-11-15

### Added
- Initial project scaffolding
- Basic project structure
- Development environment setup

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2024-12-02 | Initial public release with core features |
| 0.0.1 | 2024-11-15 | Project initialization |

## Upgrade Guide

### From 0.0.x to 0.1.0

This is the first feature release. To upgrade:

1. Update your `.cursor/mcp.json` configuration
2. Ensure you have a valid Nexus API key
3. Restart Cursor IDE

## Release Process

1. Update version in `package.json`
2. Update this CHANGELOG
3. Create git tag: `git tag v0.1.0`
4. Push tag: `git push origin v0.1.0`
5. GitHub Actions will handle npm publish

## Links

- [GitHub Releases](https://github.com/adverant/nexus-cursor-plugin/releases)
- [npm Package](https://www.npmjs.com/package/@adverant/nexus-cursor-plugin)
- [Documentation](https://adverant.ai/docs/cursor-plugin)
