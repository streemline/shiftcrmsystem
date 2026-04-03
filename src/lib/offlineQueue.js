/**
 * Система очереди офлайн-операций.
 * Операции созданные без интернета сохраняются в localStorage
 * и синхронизируются с Supabase при восстановлении соединения.
 */

import { base44 } from '@/api/base44Client';

const QUEUE_KEY = 'offline_operations_queue';

export const OP_TYPE = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

export function isOnline() {
  return navigator.onLine;
}

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueOperation(entityName, opType, data, recordId) {
  if (isOnline()) return; // Онлайн — добавлять в очередь не нужно

  const queue = loadQueue();
  queue.push({
    id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    entityName,
    opType,
    data,
    recordId: recordId || null,
    createdAt: new Date().toISOString(),
  });
  saveQueue(queue);
  console.log(`[OfflineQueue] Queued ${opType} on ${entityName}, total: ${queue.length}`);
}

export async function syncQueue() {
  if (!isOnline()) return 0;

  const queue = loadQueue();
  if (queue.length === 0) return 0;

  console.log(`[OfflineQueue] Starting sync of ${queue.length} operations`);

  const failed = [];
  let syncedCount = 0;

  for (const op of queue) {
    const entity = base44.entities[op.entityName];
    if (!entity) {
      console.warn(`[OfflineQueue] Unknown entity: ${op.entityName}`);
      failed.push(op);
      continue;
    }

    try {
      if (op.opType === OP_TYPE.CREATE) {
        await entity.create(op.data);
        syncedCount++;
      } else if (op.opType === OP_TYPE.UPDATE && op.recordId) {
        await entity.update(op.recordId, op.data);
        syncedCount++;
      } else if (op.opType === OP_TYPE.DELETE && op.recordId) {
        await entity.delete(op.recordId);
        syncedCount++;
      } else {
        failed.push(op);
      }
    } catch (err) {
      console.error(`[OfflineQueue] Failed to sync op ${op.id}:`, err);
      failed.push(op);
    }
  }

  saveQueue(failed);
  console.log(`[OfflineQueue] Synced ${syncedCount} ops, ${failed.length} failed`);
  return syncedCount;
}

export function getQueueSize() {
  return loadQueue().length;
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function initOfflineSync(onSynced) {
  window.addEventListener('online', async function() {
    console.log('[OfflineQueue] Back online — syncing...');
    const count = await syncQueue();
    if (count > 0 && typeof onSynced === 'function') {
      onSynced(count);
    }
  });
}
