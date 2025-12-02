// src/git/git-service.ts
import simpleGit, { SimpleGit, LogResult, DefaultLogFields } from 'simple-git';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface CommitInfo {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  files: string[];
}

export interface FileBlame {
  line: number;
  commit: string;
  author: string;
  date: Date;
}

export class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  async getFileHistory(filePath: string, limit = 10): Promise<CommitInfo[]> {
    try {
      const log = await this.git.log({
        file: filePath,
        maxCount: limit,
      });

      return log.all.map((entry) => ({
        hash: entry.hash,
        author: entry.author_name,
        email: entry.author_email,
        date: new Date(entry.date),
        message: entry.message,
        files: [],
      }));
    } catch (error) {
      logger.error({ error, filePath }, 'Failed to get file history');
      return [];
    }
  }

  async getCommitDetails(hash: string): Promise<CommitInfo | null> {
    try {
      const log = await this.git.log({
        from: hash,
        to: hash,
        maxCount: 1,
      });

      if (log.all.length === 0) return null;

      const entry = log.all[0];
      const diff = await this.git.diff([`${hash}^`, hash, '--name-only']);
      const files = diff.split('\n').filter(Boolean);

      return {
        hash: entry.hash,
        author: entry.author_name,
        email: entry.author_email,
        date: new Date(entry.date),
        message: entry.message,
        files,
      };
    } catch (error) {
      logger.error({ error, hash }, 'Failed to get commit details');
      return null;
    }
  }

  async getRecentCommits(limit = 50): Promise<CommitInfo[]> {
    try {
      const log = await this.git.log({ maxCount: limit });
      return log.all.map((entry) => ({
        hash: entry.hash,
        author: entry.author_name,
        email: entry.author_email,
        date: new Date(entry.date),
        message: entry.message,
        files: [],
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to get recent commits');
      return [];
    }
  }

  async getFileDiff(filePath: string, commit1: string, commit2 = 'HEAD'): Promise<string> {
    try {
      return await this.git.diff([commit1, commit2, '--', filePath]);
    } catch (error) {
      logger.error({ error, filePath }, 'Failed to get file diff');
      return '';
    }
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  async getRemoteUrl(): Promise<string | null> {
    try {
      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin');
      return origin?.refs.fetch || null;
    } catch {
      return null;
    }
  }

  /**
   * Execute raw git command safely
   */
  async raw(args: string[]): Promise<string> {
    try {
      return await this.git.raw(args);
    } catch (error) {
      logger.error({ error, args }, 'Failed to execute raw git command');
      return '';
    }
  }
}
