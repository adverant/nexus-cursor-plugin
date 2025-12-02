// src/indexer/repository-indexer.ts
import { readdir, stat } from 'fs/promises';
import { join, relative, dirname, basename } from 'path';
import pino from 'pino';
import { GraphRAGClient } from '../clients/graphrag-client.js';
import { TreeSitterService } from '../parsers/tree-sitter-service.js';
import { LANGUAGE_CONFIGS } from '../parsers/language-configs.js';
import type { ParsedFile } from '../types.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface IndexingStats {
  filesProcessed: number;
  filesSkipped: number;
  entitiesCreated: number;
  relationshipsCreated: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export interface IndexingProgress {
  phase: 'scanning' | 'parsing' | 'storing' | 'relating' | 'complete';
  current: number;
  total: number;
  currentFile?: string;
  message: string;
}

export type ProgressCallback = (progress: IndexingProgress) => void;

export interface RepositoryIndexerOptions {
  ignorePatterns?: string[];
  maxFileSize?: number;
  progressCallback?: ProgressCallback;
}

const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  'out',
  'target',
  '__pycache__',
  '.venv',
  'venv',
  '.pytest_cache',
  '.mypy_cache',
];

export class RepositoryIndexer {
  private graphrag: GraphRAGClient;
  private treeSitter: TreeSitterService;
  private ignorePatterns: string[];
  private maxFileSize: number;
  private progressCallback?: ProgressCallback;
  private stats: IndexingStats;

  constructor(
    graphrag: GraphRAGClient,
    treeSitter: TreeSitterService,
    options: RepositoryIndexerOptions = {}
  ) {
    this.graphrag = graphrag;
    this.treeSitter = treeSitter;
    this.ignorePatterns = [...DEFAULT_IGNORE_PATTERNS, ...(options.ignorePatterns || [])];
    this.maxFileSize = options.maxFileSize || 1024 * 1024; // 1MB default
    this.progressCallback = options.progressCallback;
    this.stats = {
      filesProcessed: 0,
      filesSkipped: 0,
      entitiesCreated: 0,
      relationshipsCreated: 0,
      errors: 0,
      startTime: new Date(),
    };
  }

  async indexRepository(workspaceRoot: string): Promise<IndexingStats> {
    logger.info({ workspaceRoot }, 'Starting repository indexing');
    this.stats.startTime = new Date();

    try {
      // Ensure Tree-sitter is initialized
      await this.treeSitter.initialize();

      // Phase 1: Scan directory tree and collect files
      this.reportProgress({
        phase: 'scanning',
        current: 0,
        total: 0,
        message: 'Scanning workspace for supported files...',
      });

      const files = await this.scanDirectory(workspaceRoot);
      logger.info({ fileCount: files.length }, 'Files discovered');

      // Phase 2: Create repository entity
      const repoName = basename(workspaceRoot);
      const repoEntityId = await this.createRepositoryEntity(workspaceRoot, repoName);

      // Phase 3: Parse files and create entities
      this.reportProgress({
        phase: 'parsing',
        current: 0,
        total: files.length,
        message: 'Parsing files and extracting code entities...',
      });

      const parsedFiles: Array<{ file: string; parsed: ParsedFile; entityIds: Map<string, string> }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          this.reportProgress({
            phase: 'parsing',
            current: i + 1,
            total: files.length,
            currentFile: relative(workspaceRoot, file),
            message: `Parsing ${basename(file)}...`,
          });

          const parsed = await this.treeSitter.parseFile(file);
          if (!parsed) {
            this.stats.filesSkipped++;
            continue;
          }

          const entityIds = await this.storeFileEntities(
            file,
            workspaceRoot,
            repoEntityId,
            parsed
          );

          parsedFiles.push({ file, parsed, entityIds });
          this.stats.filesProcessed++;
        } catch (error) {
          logger.error({ file, error }, 'Error parsing file');
          this.stats.errors++;
        }
      }

      // Phase 4: Create relationships
      this.reportProgress({
        phase: 'relating',
        current: 0,
        total: parsedFiles.length,
        message: 'Creating relationships between entities...',
      });

      for (let i = 0; i < parsedFiles.length; i++) {
        const { file, parsed, entityIds } = parsedFiles[i];
        try {
          this.reportProgress({
            phase: 'relating',
            current: i + 1,
            total: parsedFiles.length,
            currentFile: relative(workspaceRoot, file),
            message: `Creating relationships for ${basename(file)}...`,
          });

          await this.createRelationships(parsed, entityIds, parsedFiles);
        } catch (error) {
          logger.error({ file, error }, 'Error creating relationships');
          this.stats.errors++;
        }
      }

      // Complete
      this.stats.endTime = new Date();
      this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();

      this.reportProgress({
        phase: 'complete',
        current: files.length,
        total: files.length,
        message: 'Indexing complete',
      });

      logger.info({ stats: this.stats }, 'Repository indexing complete');
      return this.stats;
    } catch (error) {
      logger.error({ error }, 'Repository indexing failed');
      throw error;
    }
  }

  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];

    const scan = async (currentDir: string): Promise<void> => {
      try {
        const entries = await readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);

          // Check ignore patterns
          if (this.shouldIgnore(entry.name)) {
            continue;
          }

          if (entry.isDirectory()) {
            await scan(fullPath);
          } else if (entry.isFile()) {
            // Check if file is supported
            if (this.isSupportedFile(entry.name)) {
              // Check file size
              const stats = await stat(fullPath);
              if (stats.size <= this.maxFileSize) {
                files.push(fullPath);
              } else {
                logger.debug({ file: fullPath, size: stats.size }, 'File too large, skipping');
                this.stats.filesSkipped++;
              }
            }
          }
        }
      } catch (error) {
        logger.warn({ dir: currentDir, error }, 'Error scanning directory');
      }
    };

    await scan(dir);
    return files;
  }

  private shouldIgnore(name: string): boolean {
    return this.ignorePatterns.some(pattern => name === pattern || name.startsWith(pattern));
  }

  private isSupportedFile(filename: string): boolean {
    const ext = filename.substring(filename.lastIndexOf('.'));
    return Object.values(LANGUAGE_CONFIGS).some(config =>
      config.extensions.includes(ext)
    );
  }

  private async createRepositoryEntity(path: string, name: string): Promise<string> {
    const { entityId } = await this.graphrag.storeEntity({
      domain: 'code',
      entityType: 'repository',
      textContent: `Repository: ${name}\nPath: ${path}`,
      tags: ['repository', 'workspace'],
      metadata: {
        path,
        name,
        indexedAt: new Date().toISOString(),
      },
    });

    this.stats.entitiesCreated++;
    logger.debug({ entityId, name }, 'Created repository entity');
    return entityId;
  }

  private async storeFileEntities(
    filePath: string,
    workspaceRoot: string,
    repoEntityId: string,
    parsed: ParsedFile
  ): Promise<Map<string, string>> {
    const entityIds = new Map<string, string>();
    const relativePath = relative(workspaceRoot, filePath);
    const dirPath = dirname(relativePath);

    // Create directory entity if needed
    let parentId = repoEntityId;
    if (dirPath !== '.') {
      const { entityId: dirEntityId } = await this.graphrag.storeEntity({
        domain: 'code',
        entityType: 'directory',
        textContent: `Directory: ${dirPath}`,
        tags: ['directory'],
        metadata: {
          path: dirPath,
          relativePath: dirPath,
        },
        parentId: repoEntityId,
      });
      parentId = dirEntityId;
      this.stats.entitiesCreated++;
      this.stats.relationshipsCreated++; // CONTAINS relationship
    }

    // Create file entity
    const { entityId: fileEntityId } = await this.graphrag.storeEntity({
      domain: 'code',
      entityType: 'file',
      textContent: `File: ${relativePath}\nLanguage: ${parsed.language}\nFunctions: ${parsed.nodes.filter(n => n.type === 'function').length}\nClasses: ${parsed.nodes.filter(n => n.type === 'class').length}`,
      tags: ['file', parsed.language],
      metadata: {
        path: filePath,
        relativePath,
        language: parsed.language,
        nodeCount: parsed.nodes.length,
        importCount: parsed.imports.length,
      },
      parentId,
    });

    entityIds.set('__file__', fileEntityId);
    this.stats.entitiesCreated++;
    this.stats.relationshipsCreated++; // CONTAINS relationship

    // Create entities for classes and functions
    for (const node of parsed.nodes) {
      try {
        const { entityId } = await this.graphrag.storeEntity({
          domain: 'code',
          entityType: node.type,
          textContent: `${node.type}: ${node.name}\nFile: ${relativePath}\nLines: ${node.startLine}-${node.endLine}`,
          tags: [node.type, parsed.language],
          metadata: {
            name: node.name,
            type: node.type,
            file: relativePath,
            startLine: node.startLine,
            endLine: node.endLine,
            nodeId: node.id,
          },
          parentId: fileEntityId,
        });

        entityIds.set(node.id, entityId);
        this.stats.entitiesCreated++;
        this.stats.relationshipsCreated++; // CONTAINS relationship
      } catch (error) {
        logger.error({ node, error }, 'Error creating node entity');
        this.stats.errors++;
      }
    }

    return entityIds;
  }

  private async createRelationships(
    parsed: ParsedFile,
    entityIds: Map<string, string>,
    allParsedFiles: Array<{ file: string; parsed: ParsedFile; entityIds: Map<string, string> }>,
  ): Promise<void> {
    const fileEntityId = entityIds.get('__file__');
    if (!fileEntityId) return;

    // Create IMPORTS relationships
    for (const importNode of parsed.imports) {
      try {
        // Find the imported file
        const importedFile = this.resolveImport(parsed.path, importNode.source);
        if (!importedFile) continue;

        // Find the matching parsed file
        const targetParsed = allParsedFiles.find(pf => pf.file === importedFile);
        if (!targetParsed) continue;

        const targetFileEntityId = targetParsed.entityIds.get('__file__');
        if (!targetFileEntityId) continue;

        // Create relationship from this file to imported file
        const created = await this.graphrag.createRelationship(
          fileEntityId,
          targetFileEntityId,
          'IMPORTS'
        );

        if (created) {
          logger.debug(
            { source: fileEntityId, target: targetFileEntityId, type: 'IMPORTS' },
            'Created IMPORTS relationship'
          );
          this.stats.relationshipsCreated++;
        }
      } catch (error) {
        logger.debug({ importNode, error }, 'Error creating import relationship');
      }
    }
  }

  private resolveImport(fromFile: string, importSource: string): string | null {
    // Simplified import resolution - in production, this would be more sophisticated
    if (importSource.startsWith('.')) {
      // Relative import
      const fromDir = dirname(fromFile);
      let resolved = join(fromDir, importSource);

      // Try common extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];
      for (const ext of extensions) {
        if (resolved.endsWith(ext)) {
          return resolved;
        }
      }

      // Try adding extensions
      for (const ext of extensions) {
        const withExt = resolved + ext;
        // In production, you'd check if file exists
        // For now, we return the first attempt
        return withExt;
      }
    }

    return null;
  }

  private reportProgress(progress: IndexingProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
    logger.debug({ progress }, 'Indexing progress');
  }

  getStats(): IndexingStats {
    return { ...this.stats };
  }
}
