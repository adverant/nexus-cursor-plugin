// src/parsers/tree-sitter-service.ts
import Parser from 'tree-sitter';
import type { SupportedLanguage, ParsedFile, ASTNode, ImportNode } from '../types.js';
import { LANGUAGE_CONFIGS, detectLanguage } from './language-configs.js';
import pino from 'pino';
import { readFile } from 'fs/promises';
import { createHash } from 'crypto';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class TreeSitterService {
  private parsers: Map<SupportedLanguage, Parser> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    for (const [lang, config] of Object.entries(LANGUAGE_CONFIGS)) {
      try {
        const parser = new Parser();
        const langModule = await import(config.parserModule);
        parser.setLanguage(langModule.default || langModule);
        this.parsers.set(lang as SupportedLanguage, parser);
        logger.debug({ lang }, 'Loaded parser');
      } catch (error) {
        logger.warn({ lang, error }, 'Failed to load parser');
      }
    }

    this.initialized = true;
    logger.info({ languages: Array.from(this.parsers.keys()) }, 'Tree-sitter initialized');
  }

  async parseFile(filePath: string): Promise<ParsedFile | null> {
    const language = detectLanguage(filePath);
    if (!language) {
      logger.debug({ filePath }, 'Unsupported file type');
      return null;
    }

    const parser = this.parsers.get(language);
    if (!parser) {
      logger.warn({ language }, 'Parser not available');
      return null;
    }

    const content = await readFile(filePath, 'utf-8');
    const tree = parser.parse(content);
    const config = LANGUAGE_CONFIGS[language];

    const nodes: ASTNode[] = [];
    const imports: ImportNode[] = [];

    this.walkTree(tree.rootNode, config, nodes, imports, content);

    return {
      path: filePath,
      language,
      nodes,
      imports,
      exports: [],
    };
  }

  private walkTree(
    node: Parser.SyntaxNode,
    config: typeof LANGUAGE_CONFIGS[SupportedLanguage],
    nodes: ASTNode[],
    imports: ImportNode[],
    content: string
  ): void {
    // Check for class definitions
    if (config.nodeTypes.class.includes(node.type)) {
      const nameNode = node.childForFieldName('name');
      if (nameNode) {
        nodes.push({
          id: this.generateNodeId(node, content),
          type: 'class',
          name: nameNode.text,
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          children: [],
        });
      }
    }

    // Check for function definitions
    if (config.nodeTypes.function.includes(node.type)) {
      const nameNode = node.childForFieldName('name');
      if (nameNode) {
        nodes.push({
          id: this.generateNodeId(node, content),
          type: 'function',
          name: nameNode.text,
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          children: [],
        });
      }
    }

    // Check for imports
    if (config.nodeTypes.import.includes(node.type)) {
      imports.push({
        source: this.extractImportSource(node),
        specifiers: this.extractImportSpecifiers(node),
        isDefault: node.text.includes('default'),
        line: node.startPosition.row + 1,
      });
    }

    // Recurse into children
    for (const child of node.children) {
      this.walkTree(child, config, nodes, imports, content);
    }
  }

  private generateNodeId(node: Parser.SyntaxNode, content: string): string {
    const hash = createHash('sha256');
    hash.update(`${node.startIndex}:${node.endIndex}:${content.substring(node.startIndex, node.endIndex)}`);
    return hash.digest('hex').substring(0, 16);
  }

  private extractImportSource(node: Parser.SyntaxNode): string {
    const sourceNode = node.descendantsOfType('string')[0];
    return sourceNode?.text.replace(/['"]/g, '') || '';
  }

  private extractImportSpecifiers(node: Parser.SyntaxNode): string[] {
    const specifiers: string[] = [];
    const identifiers = node.descendantsOfType('identifier');
    for (const id of identifiers) {
      if (id.text && id.text !== 'from' && id.text !== 'import') {
        specifiers.push(id.text);
      }
    }
    return specifiers;
  }
}
