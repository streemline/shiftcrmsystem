import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import {
  loadNotifications,
  markAllAsRead,
  markAsRead,
  subscribeToNotifications,
  requestBrowserPermission,
  NOTIF_ICONS,
  NOTIF_LABELS,
  NOTIF_TYPES,
} from '@/lib/notificationService';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabase-client';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const TYPE_FILTERS = [
  { value: 'all',                      label: 'Все' },
  { value: NOTIF_TYPES.NEW_TASK,       label: 'Задачи' },
  { value: NOTIF_TYPES.STATUS_CHANGE,  label: 'Статусы' },
  { value: NOTIF_TYPES.NEW_COMMENT,    label: 'Комментарии' },
  { value: NOTIF_TYPES.FURNITURE_TAKE, label: 'Мебель' },
  { value: NOTIF_TYPES.GPS_REMINDER,   label: 'GPS' },
  { value: NOTIF_TYPES.TIME_EXCEEDED,  label: 'Лимиты' },
  { value: NOTIF_TYPES.SYSTEM,         label: 'Система' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = now - date;
  const min  = Math.floor(diff / 60000);

  if (min < 1)   return 'только что';
  if (min < 60)  return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `${h} ч назад`;
  const days = Math.floor(h / 24);
  if (days < 7)  return `${days} дн назад`;
  return date.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_COLORS = {
  new_task:         'bg-blue-500/10 text-blue-400 border-blue-500/20',
  status_change:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  new_comment:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  furniture_take:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  furniture_return: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  gps_reminder:     'bg-pink-500/10 text-pink-400 border-pink-500/20',
  time_exceeded:    'bg-red-500/10 text-red-400 border-red-500/20',
  material_added:   'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  system:           'bg-[#2A2A2A] text-[#9E9E9E] border-[#3A3A3A]',
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [email,         setEmail]         = useState(null);
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [readFilter,    setReadFilter]    = useState('all'); // 'all' | 'unread' | 'read'

  useEffect(function() {
    base44.auth.me().then(function(me) {
      setEmail(me.email);
      fetchAll(me.email);
      requestBrowserPermission();

      const unsub = subscribeToNotifications(me.email, function(newNotif) {
        setNotifications(function(prev) {
          const exists = prev.some(function(n) { return n.id === newNotif.id; });
          if (exists) return prev;
          return [newNotif, ...prev];
        });
      });
      return unsub;
    }).catch(function() { setIsLoading(false); });
  }, []);

  async function fetchAll(userEmail) {
    setIsLoading(true);
    const items = await loadNotifications(userEmail, 100);
    setNotifications(items);
    setIsLoading(false);
  }

  async function handleMarkAllRead() {
    if (!email) return;
    await markAllAsRead(email);
    setNotifications(function(prev) {
      return prev.map(function(n) { return Object.assign({}, n, { is_read: true }); });
    });
  }

  async function handleMarkOne(id) {
    await markAsRead(id);
    setNotifications(function(prev) {
      return prev.map(function(n) {
        return n.id === id ? Object.assign({}, n, { is_read: true }) : n;
      });
    });
  }

  async function handleDelete(id) {
    await supabase.from('app_notifications').delete().eq('id', id);
    setNotifications(function(prev) { return prev.filter(function(n) { return n.id !== id; }); });
  }

  async function handleDeleteAllRead() {
    if (!email) return;
    await supabase
      .from('app_notifications')
      .delete()
      .eq('recipient_email', email)
      .eq('is_read', true);
    setNotifications(function(prev) { return prev.filter(function(n) { return !n.is_read; }); });
  }

  // Фильтрация
  const filtered = notifications.filter(function(n) {
    const typeOk = typeFilter === 'all' || n.type === typeFilter;
    const readOk = readFilter === 'all'
      || (readFilter === 'unread' && !n.is_read)
      || (readFilter === 'read'   && n.is_read);
    return typeOk && readOk;
  });

  const unreadCount = notifications.filter(function(n) { return !n.is_read; }).length;
  const readCount   = notifications.filter(function(n) { return n.is_read; }).length;

  const chipBase    = 'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap';
  const chipActive  = 'bg-[#D32F2F] text-white border-[#D32F2F]';
  const chipInactive= 'bg-[#1A1A1A] text-[#9E9E9E] border-[#2A2A2A] hover:border-[#D32F2F] hover:text-white';

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-3xl mx-auto">

      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D32F2F]/10 border border-[#D32F2F]/20 flex items-center justify-center">
            <Bell size={20} className="text-[#D32F2F]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Центр уведомлений</h1>
            <p className="text-xs text-[#555]">
              {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Всё прочитано'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#388E3C]/20 hover:bg-[#388E3C]/30 text-[#66BB6A] text-xs font-medium rounded-lg border border-[#388E3C]/20 transition-colors"
            >
              <CheckCheck size={14} />
              Прочитать все
            </button>
          )}
          {readCount > 0 && (
            <button
              onClick={handleDeleteAllRead}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1A1A1A] hover:bg-[#D32F2F]/10 text-[#555] hover:text-[#D32F2F] text-xs font-medium rounded-lg border border-[#2A2A2A] transition-colors"
            >
              <Trash2 size={14} />
              Удалить прочитанные
            </button>
          )}
        </div>
      </div>

      {/* Фильтр по типу */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {TYPE_FILTERS.map(function(f) {
          const count = f.value === 'all'
            ? notifications.length
            : notifications.filter(n => n.type === f.value).length;
          if (count === 0 && f.value !== 'all') return null;
          return (
            <button
              key={f.value}
              onClick={function() { setTypeFilter(f.value); }}
              className={`${chipBase} ${typeFilter === f.value ? chipActive : chipInactive}`}
            >
              {f.label}
              {count > 0 && (
                <span className={`ml-1.5 ${typeFilter === f.value ? 'text-white/70' : 'text-[#555]'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Фильтр прочитано/нет */}
      <div className="flex gap-2 mb-5">
        {[
          { value: 'all',    label: 'Все' },
          { value: 'unread', label: 'Непрочитанные' },
          { value: 'read',   label: 'Прочитанные' },
        ].map(function(f) {
          return (
            <button
              key={f.value}
              onClick={function() { setReadFilter(f.value); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                readFilter === f.value
                  ? 'bg-[#2A2A2A] text-white border-[#3A3A3A]'
                  : 'bg-transparent text-[#555] border-transparent hover:text-[#9E9E9E]'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Список уведомлений */}
      {isLoading ? (
        <LoadingSpinner text="Загрузка уведомлений..." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell size={40} className="text-[#2A2A2A] mb-3" />
          <p className="text-[#555] text-sm">Нет уведомлений</p>
          {(typeFilter !== 'all' || readFilter !== 'all') && (
            <button
              onClick={function() { setTypeFilter('all'); setReadFilter('all'); }}
              className="mt-3 text-xs text-[#D32F2F] hover:underline"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(function(n) {
            const typeColor = TYPE_COLORS[n.type] || TYPE_COLORS.system;
            return (
              <div
                key={n.id}
                className={`relative bg-[#1A1A1A] border rounded-xl px-4 py-3.5 transition-all ${
                  n.is_read ? 'border-[#2A2A2A] opacity-70' : 'border-[#D32F2F]/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Иконка */}
                  <div className="text-xl flex-shrink-0 mt-0.5">
                    {NOTIF_ICONS[n.type] || '🔔'}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${typeColor}`}>
                        {NOTIF_LABELS[n.type] || n.type}
                      </span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#D32F2F] mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                    {n.message && (
                      <p className="text-sm text-[#9E9E9E] mt-1">{n.message}</p>
                    )}
                    <p className="text-xs text-[#555] mt-1.5">
                      {formatDate(n.created_at || n.created_date)}
                    </p>
                  </div>

                  {/* Действия */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.is_read && (
                      <button
                        onClick={function() { handleMarkOne(n.id); }}
                        title="Отметить как прочитанное"
                        className="p-1.5 text-[#555] hover:text-[#388E3C] hover:bg-[#388E3C]/10 rounded-lg transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={function() { handleDelete(n.id); }}
                      title="Удалить"
                      className="p-1.5 text-[#555] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
