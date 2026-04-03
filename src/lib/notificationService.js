/**
 * Сервис уведомлений — Supabase Realtime + Web Notifications API.
 * Использовать: notificationService.create(...), notificationService.notifyRole(...)
 */

import { supabase } from '@/lib/supabase-client';

// ── Типы уведомлений ──────────────────────────────────────────────────────────

export const NOTIF_TYPES = {
  NEW_TASK:        'new_task',
  STATUS_CHANGE:   'status_change',
  NEW_COMMENT:     'new_comment',
  FURNITURE_TAKE:  'furniture_take',
  FURNITURE_RETURN:'furniture_return',
  GPS_REMINDER:    'gps_reminder',
  TIME_EXCEEDED:   'time_exceeded',
  MATERIAL_ADDED:  'material_added',
  SYSTEM:          'system',
};

export const NOTIF_LABELS = {
  new_task:         'Новая задача',
  status_change:    'Смена статуса',
  new_comment:      'Комментарий',
  furniture_take:   'Мебель взята',
  furniture_return: 'Мебель возвращена',
  gps_reminder:     'GPS напоминание',
  time_exceeded:    'Превышение лимита',
  material_added:   'Материалы',
  system:           'Система',
};

export const NOTIF_ICONS = {
  new_task:         '📋',
  status_change:    '🔄',
  new_comment:      '💬',
  furniture_take:   '🛋️',
  furniture_return: '↩️',
  gps_reminder:     '📍',
  time_exceeded:    '⏰',
  material_added:   '📦',
  system:           '🔔',
};

// ── Browser Notifications API ─────────────────────────────────────────────────

export async function requestBrowserPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showBrowserNotification(title, body, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const notif = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: options.tag || 'worktime',
    ...options,
  });
  notif.onclick = function() {
    window.focus();
    if (options.url) window.location.href = options.url;
    notif.close();
  };
  return notif;
}

// ── Создание уведомлений в Supabase ──────────────────────────────────────────

/**
 * Создаёт одно уведомление для конкретного email.
 */
export async function createNotification({ recipientEmail, type, title, message, taskId }) {
  if (!recipientEmail) return;
  const { error } = await supabase.from('app_notifications').insert({
    recipient_email: recipientEmail,
    type:            type || 'system',
    title:           title || '',
    message:         message || '',
    task_id:         taskId || null,
    is_read:         false,
  });
  if (error) console.error('[Notifications] Insert error:', error);
}

/**
 * Создаёт уведомления для всех пользователей с заданными ролями.
 * @param {string[]} roles - ['manager','admin'] и т.д.
 */
export async function notifyByRoles(roles, { type, title, message, taskId }) {
  if (!roles || roles.length === 0) return;
  const { data: users, error } = await supabase
    .from('profiles')
    .select('email')
    .in('role', roles)
    .eq('is_active', true);

  if (error || !users) return;

  const inserts = users.map(function(u) {
    return {
      recipient_email: u.email,
      type:            type || 'system',
      title:           title || '',
      message:         message || '',
      task_id:         taskId || null,
      is_read:         false,
    };
  });

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from('app_notifications').insert(inserts);
    if (insertError) console.error('[Notifications] Batch insert error:', insertError);
  }
}

// ── Подписка на Realtime ──────────────────────────────────────────────────────

/**
 * Подписывается на новые уведомления для конкретного email.
 * Возвращает функцию отписки.
 * @param {string} email
 * @param {function} onNew - callback(notification)
 */
export function subscribeToNotifications(email, onNew) {
  const channel = supabase
    .channel(`notif_${email.replace(/[@.]/g, '_')}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'app_notifications',
        filter: `recipient_email=eq.${email}`,
      },
      function(payload) {
        if (payload.new) {
          onNew(payload.new);
          // Показываем браузерное уведомление если вкладка не в фокусе
          if (document.hidden) {
            const icon = NOTIF_ICONS[payload.new.type] || '🔔';
            showBrowserNotification(
              `${icon} ${payload.new.title}`,
              payload.new.message || '',
              { tag: payload.new.id }
            );
          }
        }
      }
    )
    .subscribe();

  return function unsubscribe() {
    supabase.removeChannel(channel);
  };
}

/**
 * Отмечает уведомление как прочитанное.
 */
export async function markAsRead(notificationId) {
  await supabase
    .from('app_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

/**
 * Отмечает все уведомления пользователя как прочитанные.
 */
export async function markAllAsRead(email) {
  await supabase
    .from('app_notifications')
    .update({ is_read: true })
    .eq('recipient_email', email)
    .eq('is_read', false);
}

/**
 * Загружает уведомления из Supabase.
 */
export async function loadNotifications(email, limit = 50) {
  const { data, error } = await supabase
    .from('app_notifications')
    .select('*')
    .eq('recipient_email', email)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}
