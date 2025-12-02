// src/handlers/episodic-memory.ts
import { GitService, CommitInfo } from '../git/git-service.js';
import { GraphRAGClient } from '../clients/graphrag-client.js';
import { TreeSitterService } from '../parsers/tree-sitter-service.js';
import { ASTNode } from '../types.js';
import pino from 'pino';
import { readFile } from 'fs/promises';
import { join } from 'path';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface BlameInfo {
  line: number;
  commit: string;
  author: string;
  authorEmail: string;
  date: Date;
  message: string;
}

export interface CodeContext {
  filePath: string;
  startLine: number;
  endLine: number;
  code: string;
  nodes: ASTNode[];
  blame: BlameInfo[];
  commits: CommitInfo[];
  explanation: string;
}

export interface CodeEvolution {
  symbol: string;
  filePath: string;
  currentVersion: {
    code: string;
    startLine: number;
    endLine: number;
  };
  history: Array<{
    commit: string;
    author: string;
    date: Date;
    message: string;
    diff: string;
  }>;
  insights: string[];
}

export class EpisodicMemoryHandler {
  constructor(
    private gitService: GitService,
    private graphRAGClient: GraphRAGClient,
    private treeSitterService: TreeSitterService,
    private repoPath: string
  ) {}

  /**
   * Explain code with episodic context - WHY it was written this way
   */
  async explainCode(
    filePath: string,
    startLine: number,
    endLine: number
  ): Promise<CodeContext> {
    try {
      logger.info({ filePath, startLine, endLine }, 'Explaining code with episodic context');

      // 1. Read file content and extract code snippet
      const absolutePath = join(this.repoPath, filePath);
      const fileContent = await readFile(absolutePath, 'utf-8');
      const lines = fileContent.split('\n');
      const codeSnippet = lines.slice(startLine - 1, endLine).join('\n');

      // 2. Parse AST nodes in the range
      const parsedFile = await this.treeSitterService.parseFile(absolutePath);
      const nodesInRange = parsedFile?.nodes.filter(
        (node) => node.startLine >= startLine && node.endLine <= endLine
      ) || [];

      logger.debug({ nodeCount: nodesInRange.length }, 'Found AST nodes in range');

      // 3. Get git blame for line-level attribution
      const blame = await this.getBlameInfo(filePath, startLine, endLine);
      logger.debug({ blameEntries: blame.length }, 'Retrieved blame information');

      // 4. Get file history - commits that touched these lines
      const fileHistory = await this.gitService.getFileHistory(filePath, 20);

      // Filter commits that affected our line range
      const relevantCommits = await this.filterRelevantCommits(
        fileHistory,
        filePath,
        startLine,
        endLine
      );

      logger.debug({ commitCount: relevantCommits.length }, 'Found relevant commits');

      // 5. Build context for GraphRAG query
      const context = this.buildHistoricalContext(
        codeSnippet,
        nodesInRange,
        blame,
        relevantCommits
      );

      // 6. Query GraphRAG for enhanced explanation
      const explanation = await this.queryGraphRAGForExplanation(
        filePath,
        codeSnippet,
        context,
        nodesInRange
      );

      return {
        filePath,
        startLine,
        endLine,
        code: codeSnippet,
        nodes: nodesInRange,
        blame,
        commits: relevantCommits,
        explanation,
      };
    } catch (error) {
      logger.error({ error, filePath, startLine, endLine }, 'Failed to explain code');
      throw new Error(`Failed to explain code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the evolution history of a specific symbol (function/class)
   */
  async getCodeEvolution(filePath: string, symbol: string): Promise<CodeEvolution> {
    try {
      logger.info({ filePath, symbol }, 'Tracing code evolution');

      // 1. Parse current file to find the symbol
      const absolutePath = join(this.repoPath, filePath);
      const parsedFile = await this.treeSitterService.parseFile(absolutePath);

      const targetNode = parsedFile?.nodes.find((node) => node.name === symbol);
      if (!targetNode) {
        throw new Error(`Symbol '${symbol}' not found in ${filePath}`);
      }

      // 2. Get current version of the code
      const fileContent = await readFile(absolutePath, 'utf-8');
      const lines = fileContent.split('\n');
      const currentCode = lines.slice(targetNode.startLine - 1, targetNode.endLine).join('\n');

      // 3. Get full file history
      const fileHistory = await this.gitService.getFileHistory(filePath, 50);

      // 4. Build evolution timeline
      const evolution: CodeEvolution['history'] = [];

      for (const commit of fileHistory) {
        // Get the diff for this commit
        const diff = await this.gitService.getFileDiff(filePath, `${commit.hash}^`, commit.hash);

        // Check if this diff mentions our symbol (rough heuristic)
        if (diff.includes(symbol)) {
          evolution.push({
            commit: commit.hash,
            author: commit.author,
            date: commit.date,
            message: commit.message,
            diff: this.extractRelevantDiff(diff, symbol),
          });
        }
      }

      logger.debug({ evolutionSteps: evolution.length }, 'Built evolution timeline');

      // 5. Generate insights from the evolution
      const insights = await this.generateEvolutionInsights(
        symbol,
        currentCode,
        evolution
      );

      return {
        symbol,
        filePath,
        currentVersion: {
          code: currentCode,
          startLine: targetNode.startLine,
          endLine: targetNode.endLine,
        },
        history: evolution,
        insights,
      };
    } catch (error) {
      logger.error({ error, filePath, symbol }, 'Failed to trace code evolution');
      throw new Error(`Failed to trace evolution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get git blame information for a line range
   */
  private async getBlameInfo(
    filePath: string,
    startLine: number,
    endLine: number
  ): Promise<BlameInfo[]> {
    try {
      // Use simple-git's raw command for blame
      const blameOutput = await this.gitService['git'].raw([
        'blame',
        '-L',
        `${startLine},${endLine}`,
        '--line-porcelain',
        filePath,
      ]);

      return this.parseBlameOutput(blameOutput);
    } catch (error) {
      logger.warn({ error, filePath }, 'Failed to get blame info, returning empty');
      return [];
    }
  }

  /**
   * Parse git blame porcelain output
   */
  private parseBlameOutput(output: string): BlameInfo[] {
    const lines = output.split('\n');
    const blameInfo: BlameInfo[] = [];
    let currentBlame: Partial<BlameInfo> = {};
    let lineNumber = 0;

    for (const line of lines) {
      if (line.match(/^[0-9a-f]{40}/)) {
        // Commit hash line
        const [hash] = line.split(' ');
        currentBlame.commit = hash;
      } else if (line.startsWith('author ')) {
        currentBlame.author = line.substring(7);
      } else if (line.startsWith('author-mail ')) {
        currentBlame.authorEmail = line.substring(12).replace(/[<>]/g, '');
      } else if (line.startsWith('author-time ')) {
        const timestamp = parseInt(line.substring(12));
        currentBlame.date = new Date(timestamp * 1000);
      } else if (line.startsWith('summary ')) {
        currentBlame.message = line.substring(8);
      } else if (line.startsWith('\t')) {
        // Actual code line
        lineNumber++;
        if (currentBlame.commit) {
          blameInfo.push({
            line: lineNumber,
            commit: currentBlame.commit,
            author: currentBlame.author || 'Unknown',
            authorEmail: currentBlame.authorEmail || '',
            date: currentBlame.date || new Date(),
            message: currentBlame.message || '',
          });
          currentBlame = {};
        }
      }
    }

    return blameInfo;
  }

  /**
   * Filter commits that actually touched the specified line range
   */
  private async filterRelevantCommits(
    commits: CommitInfo[],
    filePath: string,
    startLine: number,
    endLine: number
  ): Promise<CommitInfo[]> {
    const relevant: CommitInfo[] = [];

    for (const commit of commits) {
      // Get the diff for this commit
      const diff = await this.gitService.getFileDiff(filePath, `${commit.hash}^`, commit.hash);

      // Parse diff to check if it touched our line range
      if (this.diffAffectsLineRange(diff, startLine, endLine)) {
        relevant.push(commit);
      }
    }

    return relevant;
  }

  /**
   * Check if a diff affects a specific line range
   */
  private diffAffectsLineRange(diff: string, startLine: number, endLine: number): boolean {
    const hunkRegex = /@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/g;
    let match;

    while ((match = hunkRegex.exec(diff)) !== null) {
      const hunkStart = parseInt(match[1]);
      const hunkLength = match[2] ? parseInt(match[2]) : 1;
      const hunkEnd = hunkStart + hunkLength;

      // Check if hunk overlaps with our line range
      if (hunkStart <= endLine && hunkEnd >= startLine) {
        return true;
      }
    }

    return false;
  }

  /**
   * Build historical context string from git data
   */
  private buildHistoricalContext(
    code: string,
    nodes: ASTNode[],
    blame: BlameInfo[],
    commits: CommitInfo[]
  ): string {
    const parts: string[] = [];

    // Add code structure context
    if (nodes.length > 0) {
      parts.push('Code Structure:');
      nodes.forEach((node) => {
        parts.push(`- ${node.type}: ${node.name} (lines ${node.startLine}-${node.endLine})`);
      });
      parts.push('');
    }

    // Add blame context
    if (blame.length > 0) {
      parts.push('Line Attribution:');
      const uniqueCommits = new Map<string, BlameInfo>();
      blame.forEach((b) => {
        if (!uniqueCommits.has(b.commit)) {
          uniqueCommits.set(b.commit, b);
        }
      });

      uniqueCommits.forEach((info) => {
        parts.push(`- ${info.author} (${info.date.toLocaleDateString()}): "${info.message}"`);
      });
      parts.push('');
    }

    // Add commit history context
    if (commits.length > 0) {
      parts.push('Recent Changes:');
      commits.slice(0, 5).forEach((commit) => {
        parts.push(`- [${commit.hash.substring(0, 7)}] ${commit.author}: ${commit.message}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Query GraphRAG for enhanced code explanation with historical context
   */
  private async queryGraphRAGForExplanation(
    filePath: string,
    code: string,
    historicalContext: string,
    nodes: ASTNode[]
  ): Promise<string> {
    try {
      // Build query for GraphRAG
      const query = `
Explain the following code from ${filePath} in the context of its development history:

\`\`\`
${code}
\`\`\`

Historical Context:
${historicalContext}

Please provide:
1. What this code does (technical explanation)
2. Why it was written this way (based on commit history)
3. How it has evolved over time
4. Any relevant architectural decisions or patterns
`;

      // Query GraphRAG with enhanced retrieval
      const result = await this.graphRAGClient.retrieve(query, 'hybrid');

      return result.content || 'Unable to generate explanation from GraphRAG.';
    } catch (error) {
      logger.warn({ error }, 'GraphRAG query failed, using fallback explanation');

      // Fallback: generate basic explanation from historical context
      return this.generateFallbackExplanation(code, historicalContext, nodes);
    }
  }

  /**
   * Generate fallback explanation without GraphRAG
   */
  private generateFallbackExplanation(
    code: string,
    historicalContext: string,
    nodes: ASTNode[]
  ): string {
    const parts: string[] = [];

    parts.push('## Code Explanation');
    parts.push('');
    parts.push('### Structure');
    if (nodes.length > 0) {
      parts.push(`This code contains ${nodes.length} main element(s):`);
      nodes.forEach((node) => {
        parts.push(`- **${node.type}**: \`${node.name}\``);
      });
    } else {
      parts.push('No structured elements detected.');
    }

    parts.push('');
    parts.push('### Historical Context');
    parts.push(historicalContext);

    parts.push('');
    parts.push('### Code Snippet');
    parts.push('```');
    parts.push(code);
    parts.push('```');

    return parts.join('\n');
  }

  /**
   * Extract relevant diff sections mentioning the symbol
   */
  private extractRelevantDiff(diff: string, symbol: string): string {
    const lines = diff.split('\n');
    const relevant: string[] = [];
    let inRelevantSection = false;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        inRelevantSection = false;
        relevant.push(line);
      } else if (line.includes(symbol)) {
        inRelevantSection = true;
        relevant.push(line);
      } else if (inRelevantSection && (line.startsWith('+') || line.startsWith('-'))) {
        relevant.push(line);
      } else if (line.startsWith('diff --git')) {
        inRelevantSection = false;
      }
    }

    return relevant.slice(0, 50).join('\n'); // Limit to 50 lines
  }

  /**
   * Generate insights from code evolution history
   */
  private async generateEvolutionInsights(
    symbol: string,
    currentCode: string,
    evolution: CodeEvolution['history']
  ): Promise<string[]> {
    const insights: string[] = [];

    // Analyze change frequency
    if (evolution.length === 0) {
      insights.push(`\`${symbol}\` appears to be stable with no significant changes in recent history.`);
    } else if (evolution.length > 10) {
      insights.push(`\`${symbol}\` is highly active with ${evolution.length} changes, suggesting ongoing development or maintenance.`);
    } else {
      insights.push(`\`${symbol}\` has ${evolution.length} change(s) in its history.`);
    }

    // Analyze authorship diversity
    const authors = new Set(evolution.map((e) => e.author));
    if (authors.size > 1) {
      insights.push(`${authors.size} different developers have contributed to this code.`);
    }

    // Analyze commit messages for patterns
    const messages = evolution.map((e) => e.message.toLowerCase());
    if (messages.some((m) => m.includes('fix') || m.includes('bug'))) {
      insights.push('This code has been modified to fix bugs or issues.');
    }
    if (messages.some((m) => m.includes('refactor'))) {
      insights.push('This code has been refactored, possibly for maintainability or performance.');
    }
    if (messages.some((m) => m.includes('feat') || m.includes('add'))) {
      insights.push('New features or capabilities have been added to this code.');
    }

    // Timeline insight
    if (evolution.length > 0) {
      const firstChange = evolution[evolution.length - 1];
      const lastChange = evolution[0];
      const daysBetween = Math.floor(
        (lastChange.date.getTime() - firstChange.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      insights.push(`Development span: ${daysBetween} days from first to most recent change.`);
    }

    return insights;
  }
}
