// src/tools/test-generator.ts
import { promises as fs } from 'fs';
import path from 'path';
import pino from 'pino';
import { MageAgentClient } from '../clients/mageagent-client.js';
import { TreeSitterService } from '../parsers/tree-sitter-service.js';
import { detectLanguage, LANGUAGE_CONFIGS } from '../parsers/language-configs.js';
import type { SupportedLanguage, ASTNode } from '../types.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/**
 * Test framework configuration
 */
export type TestFramework = 'jest' | 'vitest' | 'pytest' | 'go-test' | 'rust-test' | 'junit';

export interface TestFrameworkConfig {
  language: SupportedLanguage;
  fileExtension: string;
  testSuffix: string;
  importTemplate: string;
  describeTemplate: string;
  testTemplate: string;
}

export const TEST_FRAMEWORKS: Record<TestFramework, TestFrameworkConfig> = {
  jest: {
    language: 'typescript',
    fileExtension: '.test.ts',
    testSuffix: '.test',
    importTemplate: "import { describe, it, expect } from '@jest/globals';",
    describeTemplate: "describe('{{name}}', () => {",
    testTemplate: "  it('should {{description}}', () => {",
  },
  vitest: {
    language: 'typescript',
    fileExtension: '.test.ts',
    testSuffix: '.test',
    importTemplate: "import { describe, it, expect } from 'vitest';",
    describeTemplate: "describe('{{name}}', () => {",
    testTemplate: "  it('should {{description}}', () => {",
  },
  pytest: {
    language: 'python',
    fileExtension: '_test.py',
    testSuffix: '_test',
    importTemplate: 'import pytest',
    describeTemplate: 'class Test{{name}}:',
    testTemplate: '    def test_{{description}}(self):',
  },
  'go-test': {
    language: 'go',
    fileExtension: '_test.go',
    testSuffix: '_test',
    importTemplate: 'import "testing"',
    describeTemplate: '',
    testTemplate: 'func Test{{name}}(t *testing.T) {',
  },
  'rust-test': {
    language: 'rust',
    fileExtension: '.rs',
    testSuffix: '',
    importTemplate: '',
    describeTemplate: '#[cfg(test)]\nmod tests {',
    testTemplate: '    #[test]\n    fn test_{{name}}() {',
  },
  junit: {
    language: 'java',
    fileExtension: 'Test.java',
    testSuffix: 'Test',
    importTemplate: 'import org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;',
    describeTemplate: 'public class {{name}}Test {',
    testTemplate: '    @Test\n    public void test{{description}}() {',
  },
};

export interface TestGenerationOptions {
  framework?: TestFramework;
  includeEdgeCases?: boolean;
  includeMocks?: boolean;
  coverageTarget?: number;
  existingTestsPath?: string;
}

export interface GeneratedTest {
  filePath: string;
  content: string;
  framework: TestFramework;
  testsGenerated: number;
  coverageEstimate: number;
  explanation: string;
}

export interface FunctionContext {
  name: string;
  code: string;
  signature: string;
  dependencies: string[];
  types: string[];
  relatedFunctions: string[];
  existingTests?: string;
}

/**
 * TestGenerator generates comprehensive tests using MageAgent and codebase context
 *
 * Features:
 * - Parses source files using Tree-sitter for accurate code understanding
 * - Extracts function signatures, types, and dependencies
 * - Analyzes existing test patterns for consistency
 * - Uses MageAgent orchestration for intelligent test generation
 * - Supports multiple test frameworks (Jest, Vitest, pytest, Go testing, etc.)
 */
export class TestGenerator {
  constructor(
    private mageAgent: MageAgentClient,
    private treeSitter: TreeSitterService
  ) {}

  /**
   * Generate tests for an entire file
   *
   * @param filePath - Path to source file
   * @param options - Test generation options
   * @returns Generated test file
   */
  async generateTests(
    filePath: string,
    options: TestGenerationOptions = {}
  ): Promise<GeneratedTest> {
    logger.info({ filePath, options }, 'Generating tests for file');

    try {
      // Detect language and validate file
      const language = detectLanguage(filePath);
      if (!language) {
        throw new Error(`Unsupported file type: ${filePath}`);
      }

      // Auto-detect framework based on language if not specified
      const framework = options.framework || this.detectFramework(language);
      logger.debug({ language, framework }, 'Detected test framework');

      // Parse source file
      const parsedFile = await this.treeSitter.parseFile(filePath);
      if (!parsedFile) {
        throw new Error(`Failed to parse file: ${filePath}`);
      }

      // Read source file content
      const sourceContent = await fs.readFile(filePath, 'utf-8');

      // Extract functions and classes to test
      const testableNodes = parsedFile.nodes.filter(
        (node) => node.type === 'function' || node.type === 'class'
      );

      logger.info(
        { testableNodes: testableNodes.length },
        'Extracted testable nodes'
      );

      if (testableNodes.length === 0) {
        throw new Error('No testable functions or classes found in file');
      }

      // Build context for each testable node
      const contexts = await Promise.all(
        testableNodes.map((node) =>
          this.buildFunctionContext(node, parsedFile, sourceContent, filePath, options)
        )
      );

      // Generate test file using MageAgent
      const testContent = await this.generateTestsWithMageAgent(
        contexts,
        framework,
        language,
        filePath,
        options
      );

      // Determine test file path
      const testFilePath = this.getTestFilePath(filePath, framework);

      const result: GeneratedTest = {
        filePath: testFilePath,
        content: testContent.content,
        framework,
        testsGenerated: testableNodes.length,
        coverageEstimate: this.estimateCoverage(testableNodes.length),
        explanation: testContent.explanation,
      };

      logger.info(
        {
          testFilePath,
          testsGenerated: result.testsGenerated,
          coverageEstimate: result.coverageEstimate,
        },
        'Test generation completed'
      );

      return result;
    } catch (error) {
      logger.error({ error, filePath }, 'Failed to generate tests');
      throw new Error(
        `Test generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate tests for a specific function
   *
   * @param filePath - Path to source file
   * @param functionName - Name of function to test
   * @param options - Test generation options
   * @returns Generated test code
   */
  async generateTestsForFunction(
    filePath: string,
    functionName: string,
    options: TestGenerationOptions = {}
  ): Promise<GeneratedTest> {
    logger.info({ filePath, functionName }, 'Generating tests for function');

    try {
      // Detect language and framework
      const language = detectLanguage(filePath);
      if (!language) {
        throw new Error(`Unsupported file type: ${filePath}`);
      }

      const framework = options.framework || this.detectFramework(language);

      // Parse source file
      const parsedFile = await this.treeSitter.parseFile(filePath);
      if (!parsedFile) {
        throw new Error(`Failed to parse file: ${filePath}`);
      }

      // Find target function
      const targetNode = parsedFile.nodes.find(
        (node) => node.name === functionName && node.type === 'function'
      );

      if (!targetNode) {
        throw new Error(`Function '${functionName}' not found in ${filePath}`);
      }

      // Read source content
      const sourceContent = await fs.readFile(filePath, 'utf-8');

      // Build context for target function
      const context = await this.buildFunctionContext(
        targetNode,
        parsedFile,
        sourceContent,
        filePath,
        options
      );

      // Generate tests using MageAgent
      const testContent = await this.generateTestsWithMageAgent(
        [context],
        framework,
        language,
        filePath,
        options
      );

      const testFilePath = this.getTestFilePath(filePath, framework);

      const result: GeneratedTest = {
        filePath: testFilePath,
        content: testContent.content,
        framework,
        testsGenerated: 1,
        coverageEstimate: this.estimateCoverage(1),
        explanation: testContent.explanation,
      };

      logger.info({ testFilePath, functionName }, 'Function test generation completed');

      return result;
    } catch (error) {
      logger.error({ error, filePath, functionName }, 'Failed to generate function tests');
      throw new Error(
        `Function test generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build context for a function/class to test
   */
  private async buildFunctionContext(
    node: ASTNode,
    parsedFile: any,
    sourceContent: string,
    filePath: string,
    options: TestGenerationOptions
  ): Promise<FunctionContext> {
    // Extract function code
    const lines = sourceContent.split('\n');
    const code = lines.slice(node.startLine - 1, node.endLine).join('\n');

    // Extract function signature (first line)
    const signature = lines[node.startLine - 1]?.trim() || '';

    // Extract dependencies from imports
    const dependencies = parsedFile.imports.map((imp: any) => imp.source);

    // Extract types from imports
    const types = parsedFile.imports
      .flatMap((imp: any) => imp.specifiers)
      .filter((spec: string) => spec.match(/^[A-Z]/)); // Likely type names

    // Find related functions (functions that call or are called by this one)
    const relatedFunctions = this.findRelatedFunctions(node, parsedFile.nodes, sourceContent);

    // Load existing tests if specified
    let existingTests: string | undefined;
    if (options.existingTestsPath) {
      try {
        existingTests = await fs.readFile(options.existingTestsPath, 'utf-8');
      } catch {
        logger.debug({ path: options.existingTestsPath }, 'No existing tests found');
      }
    }

    return {
      name: node.name,
      code,
      signature,
      dependencies,
      types,
      relatedFunctions,
      existingTests,
    };
  }

  /**
   * Find functions related to the target function
   */
  private findRelatedFunctions(
    targetNode: ASTNode,
    allNodes: ASTNode[],
    sourceContent: string
  ): string[] {
    const related: string[] = [];

    // Get target function code
    const lines = sourceContent.split('\n');
    const targetCode = lines.slice(targetNode.startLine - 1, targetNode.endLine).join('\n');

    // Find other functions mentioned in target function
    for (const node of allNodes) {
      if (node.id === targetNode.id) continue;
      if (node.type !== 'function') continue;

      // Check if target function calls this function
      const regex = new RegExp(`\\b${node.name}\\s*\\(`, 'g');
      if (regex.test(targetCode)) {
        related.push(node.name);
      }
    }

    return related;
  }

  /**
   * Generate tests using MageAgent orchestration
   */
  private async generateTestsWithMageAgent(
    contexts: FunctionContext[],
    framework: TestFramework,
    language: SupportedLanguage,
    filePath: string,
    options: TestGenerationOptions
  ): Promise<{ content: string; explanation: string }> {
    // Build comprehensive prompt for MageAgent
    const prompt = this.buildTestGenerationPrompt(
      contexts,
      framework,
      language,
      filePath,
      options
    );

    logger.debug({ promptLength: prompt.length }, 'Generated test generation prompt');

    // Submit orchestration task
    const job = await this.mageAgent.orchestrate(prompt, {
      maxAgents: 2, // Use coding + review agents
      timeout: 120000, // 2 minutes
      context: {
        language,
        framework,
        functionCount: contexts.length,
        filePath,
      },
    });

    logger.info({ jobId: job.jobId }, 'Test generation task submitted');

    // Wait for completion
    const result = await this.mageAgent.waitForCompletion(job.jobId, 2000, 120000);

    logger.info({ jobId: job.jobId, status: result.status }, 'Test generation completed');

    if (result.status === 'failed') {
      throw new Error(`MageAgent test generation failed: ${result.error || 'Unknown error'}`);
    }

    // Extract test content and explanation from result
    const response = result.result as any;

    return {
      content: response.testCode || response.result || '',
      explanation: response.explanation || response.summary || 'Tests generated successfully',
    };
  }

  /**
   * Build prompt for MageAgent test generation
   */
  private buildTestGenerationPrompt(
    contexts: FunctionContext[],
    framework: TestFramework,
    language: SupportedLanguage,
    filePath: string,
    options: TestGenerationOptions
  ): string {
    const frameworkConfig = TEST_FRAMEWORKS[framework];
    const lines: string[] = [];

    lines.push('# Test Generation Task');
    lines.push('');
    lines.push(
      `Generate comprehensive ${framework} tests for the following ${language} code from ${path.basename(filePath)}.`
    );
    lines.push('');

    lines.push('## Requirements:');
    lines.push(`- Use ${framework} testing framework`);
    lines.push('- Write clear, descriptive test names');
    lines.push('- Test happy path, edge cases, and error conditions');
    lines.push(`- Target coverage: ${options.coverageTarget || 80}%`);

    if (options.includeEdgeCases) {
      lines.push('- Include comprehensive edge case testing');
    }

    if (options.includeMocks) {
      lines.push('- Use mocks/stubs for external dependencies');
    }

    lines.push('');
    lines.push('## Framework Configuration:');
    lines.push(`Language: ${language}`);
    lines.push(`Test Framework: ${framework}`);
    lines.push(`File Extension: ${frameworkConfig.fileExtension}`);
    lines.push(`Import Template: ${frameworkConfig.importTemplate}`);
    lines.push('');

    // Add existing test patterns if available
    if (contexts[0]?.existingTests) {
      lines.push('## Existing Test Patterns:');
      lines.push('```');
      lines.push(contexts[0].existingTests.substring(0, 500)); // First 500 chars
      lines.push('```');
      lines.push('');
      lines.push('Please follow similar patterns and naming conventions.');
      lines.push('');
    }

    // Add context for each function
    lines.push('## Functions to Test:');
    lines.push('');

    for (let i = 0; i < contexts.length; i++) {
      const ctx = contexts[i];
      lines.push(`### ${i + 1}. ${ctx.name}`);
      lines.push('');

      lines.push('**Signature:**');
      lines.push('```' + language);
      lines.push(ctx.signature);
      lines.push('```');
      lines.push('');

      lines.push('**Full Code:**');
      lines.push('```' + language);
      lines.push(ctx.code);
      lines.push('```');
      lines.push('');

      if (ctx.dependencies.length > 0) {
        lines.push('**Dependencies:**');
        ctx.dependencies.forEach((dep) => lines.push(`- ${dep}`));
        lines.push('');
      }

      if (ctx.types.length > 0) {
        lines.push('**Types Used:**');
        ctx.types.forEach((type) => lines.push(`- ${type}`));
        lines.push('');
      }

      if (ctx.relatedFunctions.length > 0) {
        lines.push('**Related Functions:**');
        ctx.relatedFunctions.forEach((fn) => lines.push(`- ${fn}()`));
        lines.push('');
      }
    }

    lines.push('## Output Format:');
    lines.push('');
    lines.push('Provide the complete test file with:');
    lines.push('1. All necessary imports');
    lines.push('2. Test setup/teardown if needed');
    lines.push('3. Comprehensive test cases for each function');
    lines.push('4. Clear test descriptions');
    lines.push('5. Proper assertions');
    lines.push('');
    lines.push('Return the response as JSON:');
    lines.push('```json');
    lines.push('{');
    lines.push('  "testCode": "// Complete test file code here",');
    lines.push('  "explanation": "Brief explanation of testing strategy and coverage"');
    lines.push('}');
    lines.push('```');

    return lines.join('\n');
  }

  /**
   * Auto-detect appropriate test framework for language
   */
  private detectFramework(language: SupportedLanguage): TestFramework {
    const frameworkMap: Record<SupportedLanguage, TestFramework> = {
      typescript: 'jest',
      javascript: 'jest',
      python: 'pytest',
      go: 'go-test',
      rust: 'rust-test',
      java: 'junit',
    };

    return frameworkMap[language] || 'jest';
  }

  /**
   * Get test file path based on source file and framework
   */
  private getTestFilePath(sourceFilePath: string, framework: TestFramework): string {
    const config = TEST_FRAMEWORKS[framework];
    const dir = path.dirname(sourceFilePath);
    const ext = path.extname(sourceFilePath);
    const baseName = path.basename(sourceFilePath, ext);

    if (framework === 'pytest') {
      // Python: my_module.py -> my_module_test.py or test_my_module.py
      return path.join(dir, `${baseName}${config.fileExtension}`);
    } else if (framework === 'go-test') {
      // Go: handler.go -> handler_test.go
      return path.join(dir, `${baseName}${config.fileExtension}`);
    } else if (framework === 'junit') {
      // Java: Handler.java -> HandlerTest.java
      return path.join(dir, `${baseName}${config.fileExtension}`);
    } else if (framework === 'rust-test') {
      // Rust: tests are in same file or tests/ directory
      return path.join(dir, '..', 'tests', `${baseName}_tests.rs`);
    } else {
      // TypeScript/JavaScript: handler.ts -> handler.test.ts
      return path.join(dir, `${baseName}${config.fileExtension}`);
    }
  }

  /**
   * Estimate test coverage based on number of tests generated
   */
  private estimateCoverage(testCount: number): number {
    // Simple heuristic: each test provides ~15-20% coverage
    const coverage = Math.min(testCount * 15, 95);
    return Math.round(coverage);
  }

  /**
   * Format generated test result as human-readable text
   */
  static formatTestResult(result: GeneratedTest): string {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════');
    lines.push('         TEST GENERATION RESULT');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Framework: ${result.framework}`);
    lines.push(`Test File: ${result.filePath}`);
    lines.push(`Tests Generated: ${result.testsGenerated}`);
    lines.push(`Estimated Coverage: ${result.coverageEstimate}%`);
    lines.push('');
    lines.push('─────────────────────────────────────────────────────');
    lines.push('  EXPLANATION');
    lines.push('─────────────────────────────────────────────────────');
    lines.push(result.explanation);
    lines.push('');
    lines.push('─────────────────────────────────────────────────────');
    lines.push('  GENERATED TEST CODE');
    lines.push('─────────────────────────────────────────────────────');
    lines.push('');
    lines.push(result.content);
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}
