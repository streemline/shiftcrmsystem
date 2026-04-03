/**
 * Supabase-based клиент данных — замена Base44 BaaS.
 * API идентичен оригинальному base44 SDK (list, filter, create, update, delete, subscribe).
 * Все страницы работают без изменений.
 */

import { supabase } from '@/lib/supabase-client';
import { enqueueOperation, OP_TYPE } from '@/lib/offlineQueue';

// Маппинг имён сущностей → имена таблиц Supabase
const TABLE_MAP = {
  Task:           'app_tasks',
  WorkRecord:     'work_records',
  WorkSite:       'work_sites',
  Material:       'materials',
  Furniture:      'furniture_items',
  FurnitureUsage: 'furniture_usage',
  CalendarEvent:  'calendar_events',
  TaskComment:    'app_task_comments',
  Notification:   'app_notifications',
  ObjectType:     'object_types',
  User:           'profiles',
};

// Маппинг полей: base44 → Supabase (для сортировки)
const SORT_FIELD_MAP = {
  created_date: 'created_at',
};

function mapSortField(field) {
  return SORT_FIELD_MAP[field] || field;
}

// Добавляем алиас created_date к каждой записи
function normalizeRecord(record) {
  if (!record) return record;
  return Object.assign({}, record, {
    created_date: record.created_at,
  });
}

function createEntity(entityName) {
  const table = TABLE_MAP[entityName];

  return {
    async list(sortField, limit) {
      if (!navigator.onLine) return []; // В офлайне list возвращает пустой массив или кэш (пока заглушка)

      let query = supabase.from(table).select('*');

      if (sortField) {
        const desc = sortField.startsWith('-');
        const field = mapSortField(desc ? sortField.slice(1) : sortField);
        query = query.order(field, { ascending: !desc });
      }

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) {
        if (error.message.includes('Failed to fetch')) return [];
        throw error;
      }
      return (data || []).map(normalizeRecord);
    },

    async filter(conditions, sortField, limit) {
      if (!navigator.onLine) return []; 

      let query = supabase.from(table).select('*');

      for (const [key, value] of Object.entries(conditions)) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }

      if (sortField) {
        const desc = sortField.startsWith('-');
        const field = mapSortField(desc ? sortField.slice(1) : sortField);
        query = query.order(field, { ascending: !desc });
      }

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) {
        if (error.message.includes('Failed to fetch')) return [];
        throw error;
      }
      return (data || []).map(normalizeRecord);
    },

    async create(data) {
      if (!navigator.onLine) {
        enqueueOperation(entityName, OP_TYPE.CREATE, data);
        return normalizeRecord(Object.assign({ id: `temp_${Date.now()}` }, data));
      }

      const { data: created, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
        
      if (error) {
        if (error.message === 'Failed to fetch') {
          enqueueOperation(entityName, OP_TYPE.CREATE, data);
          return normalizeRecord(Object.assign({ id: `temp_${Date.now()}` }, data));
        }
        throw error;
      }
      return normalizeRecord(created);
    },

    async update(id, data) {
      // Игнорируем обновление временных ID (созданных в офлайне) пока они не синхронизируются
      if (String(id).startsWith('temp_')) return normalizeRecord(Object.assign({ id }, data));

      if (!navigator.onLine) {
        enqueueOperation(entityName, OP_TYPE.UPDATE, data, id);
        return normalizeRecord(Object.assign({ id }, data));
      }

      const { data: updated, error } = await supabase
        .from(table)
        .update(Object.assign({}, data, { updated_at: new Date().toISOString() }))
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        if (error.message === 'Failed to fetch') {
          enqueueOperation(entityName, OP_TYPE.UPDATE, data, id);
          return normalizeRecord(Object.assign({ id }, data));
        }
        throw error;
      }
      return normalizeRecord(updated);
    },

    async delete(id) {
      if (String(id).startsWith('temp_')) return { id };

      if (!navigator.onLine) {
        enqueueOperation(entityName, OP_TYPE.DELETE, null, id);
        return { id };
      }

      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        if (error.message === 'Failed to fetch') {
          enqueueOperation(entityName, OP_TYPE.DELETE, null, id);
          return { id };
        }
        throw error;
      }
      return { id };
    },

    subscribe(callback) {
      const channelName = `${table}_${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
        .subscribe();

      return function unsubscribe() {
        supabase.removeChannel(channel);
      };
    },
  };
}

const entities = {};
for (const name of Object.keys(TABLE_MAP)) {
  entities[name] = createEntity(name);
}

// ============================================================
// Auth
// ============================================================

let _cachedProfile = null;

const auth = {
  async me() {
    // Сначала пробуем кэш (уменьшает кол-во запросов при рендерах)
    if (_cachedProfile) return _cachedProfile;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw { status: 401, message: 'Not authenticated' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      throw { status: 401, message: 'Profile not found' };
    }

    _cachedProfile = Object.assign({}, profile, { email: profile.email || user.email });
    return _cachedProfile;
  },

  clearCache() {
    _cachedProfile = null;
  },

  async logout() {
    _cachedProfile = null;
    await supabase.auth.signOut();
    window.location.reload();
  },

  redirectToLogin() {
    window.dispatchEvent(new CustomEvent('auth:require-login'));
  },
};

// ============================================================
// Integrations (file upload)
// ============================================================

const integrations = {
  Core: {
    async UploadFile({ file }) {
      const ext = file.name.split('.').pop();
      const path = `uploads/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;

      const { error } = await supabase.storage.from('app-files').upload(path, file);

      if (error) {
        // Fallback: base64 DataURL если storage bucket не настроен
        return new Promise(function(resolve, reject) {
          const reader = new FileReader();
          reader.onload = function(e) { resolve({ file_url: e.target.result }); };
          reader.onerror = function() { reject(new Error('Failed to read file')); };
          reader.readAsDataURL(file);
        });
      }

      const { data: { publicUrl } } = supabase.storage.from('app-files').getPublicUrl(path);
      return { file_url: publicUrl };
    },
  },
};

export const base44 = {
  auth,
  entities,
  integrations,
};
