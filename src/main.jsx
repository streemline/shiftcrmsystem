import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initOfflineSync } from '@/lib/offlineQueue'
import { toast } from 'sonner'

// Инициализируем логику офлайна и синхронизации
initOfflineSync(function(count) {
  toast.success(`Синхронизировано ${count} офлайн-записей`, { duration: 4000 })
});

window.addEventListener('offline', () => {
  toast.error('Нет подключения к сети. Вы работаете в офлайн-режиме.', { duration: 5000 });
});

window.addEventListener('online', () => {
  toast.success('Подключение восстановлено. Синхронизация данных...', { duration: 3000 });
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
