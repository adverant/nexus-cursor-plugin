// src/clients/mageagent-client.ts
import axios, { AxiosInstance } from 'axios';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Request types
export interface OrchestrateRequest {
  task: string;
  maxAgents?: number;
  timeout?: number;
  context?: Record<string, unknown>;
}

export interface CompeteRequest {
  challenge: string;
  competitorCount?: number;
  evaluationCriteria?: string[];
  timeout?: number;
}

export interface CollaborateRequest {
  objective: string;
  agents?: Array<{
    role: 'research' | 'coding' | 'review' | 'synthesis' | 'specialist';
    focus?: string;
  }>;
  iterations?: number;
}

// Response types
export interface JobResponse {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  streamUrl?: string;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  currentAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface JobResult {
  jobId: string;
  status: 'completed' | 'failed';
  result?: unknown;
  error?: string;
  executionTime?: number;
  agentsUsed?: string[];
}

export interface CompetitionResult extends JobResult {
  winner?: string;
  rankings?: Array<{
    model: string;
    score: number;
    response: string;
  }>;
}

export interface CollaborationResult extends JobResult {
  iterations?: number;
  agentContributions?: Array<{
    agent: string;
    role: string;
    contribution: string;
  }>;
  synthesis?: string;
}

/**
 * MageAgentClient - Multi-model AI orchestration client
 *
 * Supports three execution modes:
 * 1. Orchestration: Smart task routing to best model
 * 2. Competition: Multiple models compete on same task
 * 3. Collaboration: Multiple models work together on complex tasks
 *
 * All operations follow async job pattern: submit → poll status → get result
 */
export class MageAgentClient {
  private client: AxiosInstance;

  constructor(endpoint: string, apiKey: string) {
    this.client = axios.create({
      baseURL: endpoint,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // MageAgent operations can be longer
    });

    logger.info({ endpoint }, 'MageAgentClient initialized');
  }

  /**
   * Submit orchestration task for smart model routing
   *
   * @param task - Task description
   * @param options - Optional configuration (maxAgents, timeout, context)
   * @returns Job submission response with jobId for polling
   */
  async orchestrate(task: string, options?: Omit<OrchestrateRequest, 'task'>): Promise<JobResponse> {
    try {
      logger.debug({ task, options }, 'Submitting orchestration task');

      const response = await this.client.post<JobResponse>('/api/orchestrate', {
        task,
        maxAgents: options?.maxAgents || 3,
        timeout: options?.timeout || 180000,
        context: options?.context,
      });

      logger.info({ jobId: response.data.jobId }, 'Orchestration task submitted');
      return response.data;
    } catch (error) {
      logger.error({ error, task }, 'Failed to submit orchestration task');
      throw new Error(`Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit competition task - multiple models compete on same challenge
   *
   * @param challenge - Challenge description
   * @param options - Optional configuration (competitorCount, evaluationCriteria, timeout)
   * @returns Job submission response with jobId for polling
   */
  async compete(challenge: string, options?: Omit<CompeteRequest, 'challenge'>): Promise<JobResponse> {
    try {
      logger.debug({ challenge, options }, 'Submitting competition task');

      const response = await this.client.post<JobResponse>('/api/compete', {
        challenge,
        competitorCount: options?.competitorCount || 3,
        evaluationCriteria: options?.evaluationCriteria,
        timeout: options?.timeout || 90000,
      });

      logger.info({ jobId: response.data.jobId }, 'Competition task submitted');
      return response.data;
    } catch (error) {
      logger.error({ error, challenge }, 'Failed to submit competition task');
      throw new Error(`Competition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit collaboration task - multiple agents work together
   *
   * @param objective - Collaboration objective
   * @param agents - Optional agent configuration (auto-selected if not provided)
   * @param options - Optional configuration (iterations)
   * @returns Job submission response with jobId for polling
   */
  async collaborate(
    objective: string,
    agents?: Array<{ role: 'research' | 'coding' | 'review' | 'synthesis' | 'specialist'; focus?: string }>,
    options?: { iterations?: number }
  ): Promise<JobResponse> {
    try {
      logger.debug({ objective, agents, options }, 'Submitting collaboration task');

      const response = await this.client.post<JobResponse>('/api/collaborate', {
        objective,
        agents,
        iterations: options?.iterations || 2,
      });

      logger.info({ jobId: response.data.jobId }, 'Collaboration task submitted');
      return response.data;
    } catch (error) {
      logger.error({ error, objective }, 'Failed to submit collaboration task');
      throw new Error(`Collaboration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Poll job status
   *
   * @param jobId - Job ID from submit operation
   * @returns Current job status and progress
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    try {
      const response = await this.client.get<JobStatus>(`/api/jobs/${jobId}/status`);
      return response.data;
    } catch (error) {
      logger.error({ error, jobId }, 'Failed to get job status');
      throw new Error(`Failed to get job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get completed job result
   *
   * @param jobId - Job ID from submit operation
   * @returns Job result (throws if job not completed)
   */
  async getJobResult(jobId: string): Promise<JobResult> {
    try {
      const response = await this.client.get<JobResult>(`/api/jobs/${jobId}/result`);

      if (response.data.status === 'failed') {
        throw new Error(response.data.error || 'Job failed');
      }

      return response.data;
    } catch (error) {
      logger.error({ error, jobId }, 'Failed to get job result');
      throw new Error(`Failed to get job result: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get competition result with rankings
   *
   * @param jobId - Competition job ID
   * @returns Competition result with winner and rankings
   */
  async getCompetitionResult(jobId: string): Promise<CompetitionResult> {
    const result = await this.getJobResult(jobId) as CompetitionResult;

    if (!result.winner || !result.rankings) {
      throw new Error('Invalid competition result format');
    }

    return result;
  }

  /**
   * Get collaboration result with agent contributions
   *
   * @param jobId - Collaboration job ID
   * @returns Collaboration result with agent contributions and synthesis
   */
  async getCollaborationResult(jobId: string): Promise<CollaborationResult> {
    const result = await this.getJobResult(jobId) as CollaborationResult;

    if (!result.agentContributions || !result.synthesis) {
      throw new Error('Invalid collaboration result format');
    }

    return result;
  }

  /**
   * Wait for job completion with polling
   *
   * @param jobId - Job ID to wait for
   * @param pollInterval - Polling interval in milliseconds (default: 2000)
   * @param maxWait - Maximum wait time in milliseconds (default: 300000 / 5 minutes)
   * @returns Job result when completed
   */
  async waitForCompletion(
    jobId: string,
    pollInterval = 2000,
    maxWait = 300000
  ): Promise<JobResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const status = await this.getJobStatus(jobId);

      if (status.status === 'completed') {
        return await this.getJobResult(jobId);
      }

      if (status.status === 'failed') {
        throw new Error(`Job ${jobId} failed`);
      }

      // Log progress if available
      if (status.progress !== undefined) {
        logger.debug({ jobId, progress: status.progress, currentAgent: status.currentAgent }, 'Job progress');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Job ${jobId} timed out after ${maxWait}ms`);
  }

  /**
   * Health check - verify MageAgent service availability
   *
   * @returns True if service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.warn({ error }, 'MageAgent health check failed');
      return false;
    }
  }

  /**
   * Cancel a running job
   *
   * @param jobId - Job ID to cancel
   * @returns True if cancellation successful
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      await this.client.post(`/api/jobs/${jobId}/cancel`);
      logger.info({ jobId }, 'Job cancelled');
      return true;
    } catch (error) {
      logger.error({ error, jobId }, 'Failed to cancel job');
      return false;
    }
  }
}
