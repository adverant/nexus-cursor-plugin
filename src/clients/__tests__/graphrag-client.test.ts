// src/clients/__tests__/graphrag-client.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GraphRAGClient, StoreEntityRequest, SearchResult } from '../graphrag-client.js';
import axios from 'axios';

// Mock axios module
vi.mock('axios');

describe('GraphRAGClient', () => {
  let client: GraphRAGClient;
  const mockEndpoint = 'http://localhost:8080';
  const mockApiKey = 'test-api-key-12345';

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup axios.create mock
    const mockAxiosInstance = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);

    client = new GraphRAGClient(mockEndpoint, mockApiKey);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: mockEndpoint,
        headers: {
          'Authorization': `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    });
  });

  describe('storeEntity', () => {
    it('should make POST request with correct payload', async () => {
      const request: StoreEntityRequest = {
        domain: 'code',
        entityType: 'function',
        textContent: 'export function add(a: number, b: number) { return a + b; }',
        tags: ['typescript', 'math'],
        metadata: { complexity: 'low' },
      };

      const mockResponse = {
        data: { entity_id: 'entity-123' },
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      const result = await client.storeEntity(request);

      expect(mockPost).toHaveBeenCalledWith('/api/entities', {
        domain: 'code',
        entity_type: 'function',
        text_content: 'export function add(a: number, b: number) { return a + b; }',
        tags: ['typescript', 'math'],
        metadata: { complexity: 'low' },
        parent_id: undefined,
      });

      expect(result).toEqual({ entityId: 'entity-123' });
    });

    it('should handle entity with parent ID', async () => {
      const request: StoreEntityRequest = {
        domain: 'code',
        entityType: 'method',
        textContent: 'public void calculate() {}',
        parentId: 'class-456',
      };

      const mockResponse = {
        data: { entity_id: 'entity-789' },
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      await client.storeEntity(request);

      expect(mockPost).toHaveBeenCalledWith('/api/entities', {
        domain: 'code',
        entity_type: 'method',
        text_content: 'public void calculate() {}',
        tags: [],
        metadata: {},
        parent_id: 'class-456',
      });
    });

    it('should use empty arrays/objects for optional fields', async () => {
      const request: StoreEntityRequest = {
        domain: 'code',
        entityType: 'function',
        textContent: 'function test() {}',
      };

      const mockResponse = {
        data: { entity_id: 'entity-000' },
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      await client.storeEntity(request);

      expect(mockPost).toHaveBeenCalledWith('/api/entities', {
        domain: 'code',
        entity_type: 'function',
        text_content: 'function test() {}',
        tags: [],
        metadata: {},
        parent_id: undefined,
      });
    });

    it('should handle API errors', async () => {
      const request: StoreEntityRequest = {
        domain: 'code',
        entityType: 'function',
        textContent: 'test',
      };

      const mockPost = vi.fn().mockRejectedValue(new Error('Network error'));
      (client as any).client.post = mockPost;

      await expect(client.storeEntity(request)).rejects.toThrow('Network error');
    });
  });

  describe('search', () => {
    it('should make POST request with query and default options', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'result-1',
          content: 'Function that adds two numbers',
          score: 0.95,
          metadata: { type: 'function' },
        },
        {
          id: 'result-2',
          content: 'Class for mathematical operations',
          score: 0.87,
          metadata: { type: 'class' },
        },
      ];

      const mockResponse = {
        data: { results: mockResults },
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      const results = await client.search('math functions');

      expect(mockPost).toHaveBeenCalledWith('/api/search', {
        query: 'math functions',
        limit: 10,
        filters: undefined,
      });

      expect(results).toEqual(mockResults);
      expect(results.length).toBe(2);
      expect(results[0].score).toBe(0.95);
    });

    it('should respect custom limit option', async () => {
      const mockResponse = {
        data: { results: [] },
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      await client.search('test query', { limit: 5 });

      expect(mockPost).toHaveBeenCalledWith('/api/search', {
        query: 'test query',
        limit: 5,
        filters: undefined,
      });
    });

    it('should include domain filter when provided', async () => {
      const mockResponse = {
        data: { results: [] },
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      await client.search('test query', { domain: 'code' });

      expect(mockPost).toHaveBeenCalledWith('/api/search', {
        query: 'test query',
        limit: 10,
        filters: { domain: 'code' },
      });
    });

    it('should handle API errors', async () => {
      const mockPost = vi.fn().mockRejectedValue(new Error('Search failed'));
      (client as any).client.post = mockPost;

      await expect(client.search('test')).rejects.toThrow('Search failed');
    });
  });

  describe('retrieve', () => {
    it('should make POST request with default strategy', async () => {
      const mockResponse = {
        data: {
          content: 'Retrieved context about math functions',
          sources: [
            { id: 's1', content: 'Source 1', score: 0.9, metadata: {} },
          ],
        },
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      const result = await client.retrieve('explain math functions');

      expect(mockPost).toHaveBeenCalledWith('/api/retrieve', {
        query: 'explain math functions',
        strategy: 'hybrid',
        max_tokens: 4000,
      });

      expect(result.content).toBe('Retrieved context about math functions');
      expect(result.sources.length).toBe(1);
    });

    it('should accept custom strategy', async () => {
      const mockResponse = {
        data: { content: 'test', sources: [] },
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      await client.retrieve('test query', 'semantic_chunks');

      expect(mockPost).toHaveBeenCalledWith('/api/retrieve', {
        query: 'test query',
        strategy: 'semantic_chunks',
        max_tokens: 4000,
      });
    });
  });

  describe('getEntity', () => {
    it('should make GET request and return entity data', async () => {
      const mockEntity = {
        id: 'entity-123',
        domain: 'code',
        entityType: 'function',
        textContent: 'function test() {}',
      };

      const mockResponse = {
        data: mockEntity,
      };

      const mockGet = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.get = mockGet;

      const result = await client.getEntity('entity-123');

      expect(mockGet).toHaveBeenCalledWith('/api/entities/entity-123');
      expect(result).toEqual(mockEntity);
    });

    it('should return null on error', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('Not found'));
      (client as any).client.get = mockGet;

      const result = await client.getEntity('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createRelationship', () => {
    it('should make POST request with correct payload', async () => {
      const mockResponse = { data: { success: true } };
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      const result = await client.createRelationship(
        'entity-1',
        'entity-2',
        'CALLS',
        0.8
      );

      expect(mockPost).toHaveBeenCalledWith('/api/relationships', {
        source_entity_id: 'entity-1',
        target_entity_id: 'entity-2',
        relationship_type: 'CALLS',
        weight: 0.8,
      });

      expect(result).toBe(true);
    });

    it('should use default weight of 1.0 if not provided', async () => {
      const mockResponse = { data: { success: true } };
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      await client.createRelationship('entity-1', 'entity-2', 'DEPENDS_ON');

      expect(mockPost).toHaveBeenCalledWith('/api/relationships', {
        source_entity_id: 'entity-1',
        target_entity_id: 'entity-2',
        relationship_type: 'DEPENDS_ON',
        weight: 1.0,
      });
    });

    it('should return false on error', async () => {
      const mockPost = vi.fn().mockRejectedValue(new Error('Relationship failed'));
      (client as any).client.post = mockPost;

      const result = await client.createRelationship('e1', 'e2', 'RELATED_TO');

      expect(result).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return true when health endpoint returns 200', async () => {
      const mockResponse = { status: 200, data: { status: 'healthy' } };
      const mockGet = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.get = mockGet;

      const result = await client.healthCheck();

      expect(mockGet).toHaveBeenCalledWith('/health');
      expect(result).toBe(true);
    });

    it('should return false when health endpoint fails', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('Service unavailable'));
      (client as any).client.get = mockGet;

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false when status is not 200', async () => {
      const mockResponse = { status: 503, data: { status: 'unhealthy' } };
      const mockGet = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.get = mockGet;

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ECONNABORTED';

      const mockPost = vi.fn().mockRejectedValue(timeoutError);
      (client as any).client.post = mockPost;

      await expect(client.search('test')).rejects.toThrow('Timeout');
    });

    it('should handle 401 unauthorized errors', async () => {
      const unauthorizedError: any = new Error('Unauthorized');
      unauthorizedError.response = { status: 401 };

      const mockPost = vi.fn().mockRejectedValue(unauthorizedError);
      (client as any).client.post = mockPost;

      await expect(client.search('test')).rejects.toThrow('Unauthorized');
    });

    it('should handle 500 server errors', async () => {
      const serverError: any = new Error('Internal Server Error');
      serverError.response = { status: 500 };

      const mockPost = vi.fn().mockRejectedValue(serverError);
      (client as any).client.post = mockPost;

      await expect(client.storeEntity({
        domain: 'code',
        entityType: 'function',
        textContent: 'test',
      })).rejects.toThrow('Internal Server Error');
    });
  });

  describe('request transformation', () => {
    it('should convert camelCase to snake_case for API requests', async () => {
      const request: StoreEntityRequest = {
        domain: 'code',
        entityType: 'function',
        textContent: 'content',
        parentId: 'parent-123',
      };

      const mockResponse = { data: { entity_id: 'new-entity' } };
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      await client.storeEntity(request);

      const callArgs = mockPost.mock.calls[0][1];
      expect(callArgs).toHaveProperty('entity_type');
      expect(callArgs).toHaveProperty('text_content');
      expect(callArgs).toHaveProperty('parent_id');
      expect(callArgs).not.toHaveProperty('entityType');
      expect(callArgs).not.toHaveProperty('textContent');
      expect(callArgs).not.toHaveProperty('parentId');
    });

    it('should convert snake_case to camelCase for API responses', async () => {
      const mockResponse = {
        data: { entity_id: 'entity-123' },
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      (client as any).client.post = mockPost;

      const result = await client.storeEntity({
        domain: 'code',
        entityType: 'function',
        textContent: 'test',
      });

      expect(result).toHaveProperty('entityId');
      expect(result.entityId).toBe('entity-123');
    });
  });
});
