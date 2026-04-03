import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  loadNotifications,
  markAllAsRead,
  markAsRead,
  subscribeToNotifications,
  requestBrowserPermission,
  NOTIF_ICONS,
} from '@/lib/notificationService';
import { base44 } from '@/api/base44Client';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen]                   = useState(false);
  const [email, setEmail]                 = useState(null);
  const panelRef                          = useRef(null);
  const navigate                          = useNavigate();

  useEffect(function() {
    base44.auth.me().then(function(me) {
      setEmail(me.email);
      fetchNotifications(me.email);
      requestBrowserPermission();

      const unsubscribe = subscribeToNotifications(me.email, function(newNotif) {
        setNotifications(function(prev) {
          // Добавляем в начало, избегаем дублирования
          const exists = prev.some(function(n) { return n.id === newNotif.id; });
          if (exists) return prev;
          return [{ ...newNotif, created_date: newNotif.created_at }, ...prev];
        });
      });

      return unsubscribe;
    }).catch(function() {});
  }, []);

  // Закрываем по клику вне
  useEffect(function() {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return function() { document.removeEventListener('mousedown', handleClickOutside); };
  }, [open]);

  async function fetchNotifications(userEmail) {
    const items = await loadNotifications(userEmail, 30);
    setNotifications(items);
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
      return prev.map(function(n) { return n.id === id ? Object.assign({}, n, { is_read: true }) : n; });
    });
  }

  function handleOpenCenter() {
    setOpen(false);
    navigate('/NotificationCenter');
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const min  = Math.floor(diff / 60000);
    if (min < 1)  return 'только что';
    if (min < 60) return `${min} мин`;
    const h = Math.floor(min / 60);
    if (h < 24)   return `${h} ч`;
    return new Date(dateStr).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  }

  const unreadCount   = notifications.filter(function(n) { return !n.is_read; }).length;
  const preview       = notifications.slice(0, 5);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={function() { setOpen(!open); }}
        className="relative p-2 text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-all"
        aria-label="Уведомления"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#D32F2F] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Шапка */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Уведомления</span>
              {unreadCount > 0 && (
                <span className="w-5 h-5 bg-[#D32F2F] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#D32F2F] hover:text-white transition-colors"
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* Список */}
          <div className="max-h-72 overflow-y-auto">
            {preview.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={24} className="text-[#555] mx-auto mb-2" />
                <p className="text-sm text-[#555]">Нет уведомлений</p>
              </div>
            ) : (
              preview.map(function(n) {
                return (
                  <button
                    key={n.id}
                    onClick={function() { handleMarkOne(n.id); }}
                    className={`w-full text-left px-4 py-3 border-b border-[#2A2A2A] last:border-0 transition-colors hover:bg-[#111] ${!n.is_read ? 'bg-[#D32F2F]/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-base mt-0.5 flex-shrink-0">
                        {NOTIF_ICONS[n.type] || '🔔'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white truncate">{n.title}</p>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#D32F2F] mt-1.5 flex-shrink-0" />
                          )}
                        </div>
                        {n.message && (
                          <p className="text-xs text-[#9E9E9E] mt-0.5 line-clamp-2">{n.message}</p>
                        )}
                        <p className="text-xs text-[#555] mt-1">{formatTime(n.created_at || n.created_date)}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Ссылка на центр */}
          <button
            onClick={handleOpenCenter}
            className="w-full px-4 py-3 text-xs text-[#D32F2F] hover:text-white hover:bg-[#111] border-t border-[#2A2A2A] transition-colors font-medium"
          >
            Центр уведомлений →
          </button>
        </div>
      )}
    </div>
  );
}
