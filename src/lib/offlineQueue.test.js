import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enqueueOperation, syncQueue, clearQueue, getQueueSize, OP_TYPE } from './offlineQueue';
import { base44 } from '@/api/base44Client';

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      WorkRecord: {
        create: vi.fn().mockResolvedValue({ id: '123' }),
        update: vi.fn().mockResolvedValue({ id: '123' }),
        delete: vi.fn().mockResolvedValue({ id: '123' }),
      }
    }
  }
}));

describe('offlineQueue', () => {
  beforeEach(() => {
    clearQueue();
    vi.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
      writable: true,
    });
  });

  it('should not enqueue if online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true });
    enqueueOperation('WorkRecord', OP_TYPE.CREATE, { note: 'test' });
    expect(getQueueSize()).toBe(0);
  });

  it('should enqueue if offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    enqueueOperation('WorkRecord', OP_TYPE.CREATE, { note: 'test' });
    expect(getQueueSize()).toBe(1);
  });

  it('should sync queue when online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    enqueueOperation('WorkRecord', OP_TYPE.CREATE, { note: 'test1' });
    enqueueOperation('WorkRecord', OP_TYPE.CREATE, { note: 'test2' });
    
    expect(getQueueSize()).toBe(2);

    Object.defineProperty(navigator, 'onLine', { value: true });
    const count = await syncQueue();
    
    expect(count).toBe(2);
    expect(getQueueSize()).toBe(0);
    expect(base44.entities.WorkRecord.create).toHaveBeenCalledTimes(2);
  });
});
