// src/clients/graphrag-client.ts
import axios, { AxiosInstance } from 'axios';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface StoreEntityRequest {
  domain: string;
  entityType: string;
  textContent: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  parentId?: string;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export class GraphRAGClient {
  private client: AxiosInstance;

  constructor(endpoint: string, apiKey: string) {
    this.client = axios.create({
      baseURL: endpoint,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async storeEntity(request: StoreEntityRequest): Promise<{ entityId: string }> {
    const response = await this.client.post('/api/entities', {
      domain: request.domain,
      entity_type: request.entityType,
      text_content: request.textContent,
      tags: request.tags || [],
      metadata: request.metadata || {},
      parent_id: request.parentId,
    });
    return { entityId: response.data.entity_id };
  }

  async search(query: string, options?: { limit?: number; domain?: string }): Promise<SearchResult[]> {
    const response = await this.client.post('/api/search', {
      query,
      limit: options?.limit || 10,
      filters: options?.domain ? { domain: options.domain } : undefined,
    });
    return response.data.results;
  }

  async retrieve(query: string, strategy = 'hybrid'): Promise<{ content: string; sources: SearchResult[] }> {
    const response = await this.client.post('/api/retrieve', {
      query,
      strategy,
      max_tokens: 4000,
    });
    return response.data;
  }

  async getEntity(entityId: string): Promise<Record<string, unknown> | null> {
    try {
      const response = await this.client.get(`/api/entities/${entityId}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async createRelationship(
    sourceId: string,
    targetId: string,
    relationshipType: string,
    weight?: number
  ): Promise<boolean> {
    try {
      await this.client.post('/api/relationships', {
        source_entity_id: sourceId,
        target_entity_id: targetId,
        relationship_type: relationshipType,
        weight: weight || 1.0,
      });
      return true;
    } catch (error) {
      logger.warn({ error, sourceId, targetId, relationshipType }, 'Failed to create relationship');
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
