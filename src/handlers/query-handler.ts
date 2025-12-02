// src/handlers/query-handler.ts
import { GraphRAGClient, SearchResult } from '../clients/graphrag-client.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface QueryOptions {
  limit?: number;
  language?: string;
  fileType?: string;
  directory?: string;
  includeSnippets?: boolean;
}

export interface QueryResultItem {
  id: string;
  filePath: string;
  lineNumber?: number;
  endLine?: number;
  code?: string;
  context: string;
  confidence: number;
  relevance: number;
  metadata: {
    language?: string;
    type?: string;
    symbols?: string[];
    tags?: string[];
  };
}

export interface QueryResponse {
  query: string;
  summary: string;
  results: QueryResultItem[];
  totalResults: number;
  maxConfidence: number;
  executionTime: number;
}

export interface SemanticSearchResult {
  term: string;
  results: QueryResultItem[];
  totalResults: number;
}

/**
 * QueryHandler provides natural language querying of the code knowledge graph
 */
export class QueryHandler {
  constructor(private graphRAGClient: GraphRAGClient) {}

  /**
   * Query the code knowledge graph with natural language
   * Uses hybrid retrieval strategy (semantic + graph traversal)
   */
  async query(
    question: string,
    options: QueryOptions = {}
  ): Promise<QueryResponse> {
    const startTime = Date.now();

    try {
      logger.info({ question, options }, 'Processing natural language query');

      // Validate and set defaults
      const limit = options.limit ?? 20;
      const includeSnippets = options.includeSnippets ?? true;

      // Build enhanced query with filters
      const enhancedQuery = this.buildEnhancedQuery(question, options);

      // Query GraphRAG with hybrid strategy
      const retrievalResult = await this.graphRAGClient.retrieve(
        enhancedQuery,
        'hybrid'
      );

      logger.debug(
        { sourceCount: retrievalResult.sources?.length },
        'Retrieved results from GraphRAG'
      );

      // Parse and format results
      const results = await this.formatResults(
        retrievalResult.sources || [],
        options,
        includeSnippets
      );

      // Apply additional filtering
      const filteredResults = this.applyFilters(results, options);

      // Sort by confidence and limit
      const rankedResults = filteredResults
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);

      // Calculate statistics
      const maxConfidence =
        rankedResults.length > 0
          ? Math.max(...rankedResults.map((r) => r.confidence))
          : 0;

      const executionTime = Date.now() - startTime;

      logger.info(
        { resultCount: rankedResults.length, executionTime },
        'Query completed successfully'
      );

      return {
        query: question,
        summary: retrievalResult.content || 'No summary available',
        results: rankedResults,
        totalResults: filteredResults.length,
        maxConfidence,
        executionTime,
      };
    } catch (error) {
      logger.error({ error, question }, 'Query failed');
      throw new Error(
        `Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Semantic search for code similar to a given term or concept
   */
  async semanticSearch(
    term: string,
    options: QueryOptions = {}
  ): Promise<SemanticSearchResult> {
    try {
      logger.info({ term, options }, 'Performing semantic search');

      const limit = options.limit ?? 15;

      // Build semantic query
      const semanticQuery = `Find code that is semantically similar to or implements: ${term}`;

      // Use GraphRAG search endpoint for semantic similarity
      const searchResults = await this.graphRAGClient.search(semanticQuery, {
        limit: limit * 2, // Request more to account for filtering
        domain: 'code',
      });

      logger.debug(
        { resultCount: searchResults.length },
        'Retrieved semantic search results'
      );

      // Format results
      const formattedResults = await this.formatResults(
        searchResults,
        options,
        true
      );

      // Apply filters and sort
      const filteredResults = this.applyFilters(formattedResults, options)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);

      logger.info(
        { resultCount: filteredResults.length },
        'Semantic search completed'
      );

      return {
        term,
        results: filteredResults,
        totalResults: filteredResults.length,
      };
    } catch (error) {
      logger.error({ error, term }, 'Semantic search failed');
      throw new Error(
        `Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build enhanced query with filter context
   */
  private buildEnhancedQuery(question: string, options: QueryOptions): string {
    const parts = [question];

    if (options.language) {
      parts.push(`Focus on ${options.language} code.`);
    }

    if (options.fileType) {
      parts.push(`Only include ${options.fileType} files.`);
    }

    if (options.directory) {
      parts.push(`Search within the ${options.directory} directory.`);
    }

    return parts.join(' ');
  }

  /**
   * Format SearchResults into QueryResultItems
   */
  private async formatResults(
    sources: SearchResult[],
    options: QueryOptions,
    includeSnippets: boolean
  ): Promise<QueryResultItem[]> {
    const results: QueryResultItem[] = [];

    for (const source of sources) {
      try {
        // Extract metadata
        const metadata = source.metadata || {};
        const filePath = this.extractFilePath(metadata);
        const lineNumber = this.extractLineNumber(metadata);
        const endLine = this.extractEndLine(metadata);

        // Skip if no file path found
        if (!filePath) {
          logger.debug({ sourceId: source.id }, 'Skipping source with no file path');
          continue;
        }

        // Calculate confidence from retrieval score (0-1)
        const confidence = this.calculateConfidence(source.score);

        // Calculate relevance (weighted score)
        const relevance = this.calculateRelevance(source.score, metadata);

        // Extract code snippet if requested
        const code = includeSnippets ? this.extractCodeSnippet(source.content) : undefined;

        // Build structured metadata
        const structuredMetadata = {
          language: metadata.language as string | undefined,
          type: metadata.type as string | undefined,
          symbols: this.extractSymbols(metadata),
          tags: this.extractTags(metadata),
        };

        results.push({
          id: source.id,
          filePath,
          lineNumber,
          endLine,
          code,
          context: source.content,
          confidence,
          relevance,
          metadata: structuredMetadata,
        });
      } catch (error) {
        logger.warn({ error, sourceId: source.id }, 'Failed to format result');
        // Continue processing other results
      }
    }

    return results;
  }

  /**
   * Apply filter criteria to results
   */
  private applyFilters(
    results: QueryResultItem[],
    options: QueryOptions
  ): QueryResultItem[] {
    let filtered = results;

    // Filter by language
    if (options.language) {
      const targetLang = options.language.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.metadata.language?.toLowerCase() === targetLang ||
          r.filePath.endsWith(`.${targetLang}`) ||
          this.getFileExtension(r.filePath) === targetLang
      );
    }

    // Filter by file type (extension)
    if (options.fileType) {
      const targetExt = options.fileType.startsWith('.')
        ? options.fileType
        : `.${options.fileType}`;
      filtered = filtered.filter((r) => r.filePath.endsWith(targetExt));
    }

    // Filter by directory
    if (options.directory) {
      const targetDir = options.directory.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes
      filtered = filtered.filter((r) =>
        r.filePath.includes(targetDir)
      );
    }

    return filtered;
  }

  /**
   * Extract file path from metadata
   */
  private extractFilePath(metadata: Record<string, unknown>): string | null {
    // Try common metadata fields
    const pathFields = ['filePath', 'file_path', 'path', 'file', 'source'];

    for (const field of pathFields) {
      const value = metadata[field];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    // Try nested metadata
    if (metadata.source && typeof metadata.source === 'object') {
      const nested = metadata.source as Record<string, unknown>;
      for (const field of pathFields) {
        const value = nested[field];
        if (typeof value === 'string' && value.length > 0) {
          return value;
        }
      }
    }

    return null;
  }

  /**
   * Extract line number from metadata
   */
  private extractLineNumber(metadata: Record<string, unknown>): number | undefined {
    const lineFields = ['lineNumber', 'line_number', 'startLine', 'start_line', 'line'];

    for (const field of lineFields) {
      const value = metadata[field];
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract end line number from metadata
   */
  private extractEndLine(metadata: Record<string, unknown>): number | undefined {
    const endFields = ['endLine', 'end_line', 'lineEnd'];

    for (const field of endFields) {
      const value = metadata[field];
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract symbols from metadata
   */
  private extractSymbols(metadata: Record<string, unknown>): string[] {
    const symbolFields = ['symbols', 'symbol', 'names', 'identifiers'];

    for (const field of symbolFields) {
      const value = metadata[field];
      if (Array.isArray(value)) {
        return value.filter((s) => typeof s === 'string') as string[];
      }
      if (typeof value === 'string') {
        return [value];
      }
    }

    return [];
  }

  /**
   * Extract tags from metadata
   */
  private extractTags(metadata: Record<string, unknown>): string[] {
    const tagFields = ['tags', 'labels', 'categories'];

    for (const field of tagFields) {
      const value = metadata[field];
      if (Array.isArray(value)) {
        return value.filter((t) => typeof t === 'string') as string[];
      }
    }

    return [];
  }

  /**
   * Extract code snippet from content
   */
  private extractCodeSnippet(content: string): string {
    // If content contains code blocks, extract them
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
    const match = content.match(codeBlockRegex);

    if (match) {
      return match[1].trim();
    }

    // Otherwise, return the content as-is (likely already code)
    return content.trim();
  }

  /**
   * Get file extension from path
   */
  private getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    if (lastDot === -1 || lastDot === filePath.length - 1) {
      return '';
    }
    return filePath.substring(lastDot + 1).toLowerCase();
  }

  /**
   * Calculate confidence score from retrieval score
   * Maps retrieval score (typically 0-1) to confidence percentage
   */
  private calculateConfidence(score: number): number {
    // Ensure score is in valid range
    const normalizedScore = Math.max(0, Math.min(1, score));

    // Apply sigmoid-like curve to emphasize high scores
    // Formula: 1 / (1 + e^(-10*(x-0.5)))
    const confidence = 1 / (1 + Math.exp(-10 * (normalizedScore - 0.5)));

    // Convert to percentage and round to 2 decimals
    return Math.round(confidence * 10000) / 100;
  }

  /**
   * Calculate relevance score with metadata weighting
   */
  private calculateRelevance(
    score: number,
    metadata: Record<string, unknown>
  ): number {
    let relevance = score;

    // Boost relevance for certain metadata indicators
    if (metadata.language) {
      relevance *= 1.1; // 10% boost for language metadata
    }

    if (metadata.type === 'function' || metadata.type === 'class') {
      relevance *= 1.15; // 15% boost for structured code elements
    }

    if (Array.isArray(metadata.tags) && metadata.tags.length > 0) {
      relevance *= 1.05; // 5% boost for tagged content
    }

    // Ensure relevance stays in valid range
    return Math.max(0, Math.min(1, relevance));
  }
}
