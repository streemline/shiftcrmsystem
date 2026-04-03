import React, { useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function clearState() {
    setError(null);
    setSuccess(null);
  }

  async function handleLogin(e) {
    e.preventDefault();
    clearState();
    if (!email.trim() || !password) {
      setError('Заполните email и пароль');
      return;
    }
    setIsLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);
    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        setError('Неверный email или пароль');
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Подтвердите email перед входом');
      } else {
        setError(authError.message);
      }
    }
    // При успехе onAuthStateChange в AuthContext обработает автоматически
  }

  async function handleRegister(e) {
    e.preventDefault();
    clearState();
    if (!email.trim() || !password || !fullName.trim()) {
      setError('Заполните все поля');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }
    setIsLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), role: 'employee' },
      },
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    } else {
      // Если сессия не вернулась сразу, но мы знаем что email confirmation выключен:
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError && signInError.message.includes('Email not confirmed')) {
          setSuccess('Регистрация успешна! Проверьте email для подтверждения.');
          setMode('login');
          setIsLoading(false);
          return;
        }
      }
      // Если signIn прошел успешно или session уже есть, AuthContext перехватит.
      setIsLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    clearState();
    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    setIsLoading(true);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: window.location.origin + '/reset-password' }
    );

    setIsLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSuccess('Ссылка для сброса пароля отправлена на ' + email.trim());
    }
  }

  const inputClass =
    'w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#D32F2F] transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0A0A0A' }}>
      <div className="w-full max-w-sm">
        {/* Лого */}
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-[#D32F2F] rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">WorkTime</h1>
          <p className="text-sm text-[#9E9E9E] mt-1">
            {mode === 'login' && 'Войдите в систему'}
            {mode === 'register' && 'Создайте аккаунт'}
            {mode === 'forgot' && 'Восстановление пароля'}
          </p>
        </div>

        {/* Сообщение об успехе */}
        {success && (
          <div className="mb-4 p-3 bg-[#388E3C]/20 border border-[#388E3C]/40 rounded-lg text-sm text-[#66BB6A]">
            {success}
          </div>
        )}

        {/* Сообщение об ошибке */}
        {error && (
          <div className="mb-4 p-3 bg-[#D32F2F]/20 border border-[#D32F2F]/40 rounded-lg text-sm text-[#EF5350]">
            {error}
          </div>
        )}

        {/* Форма входа */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-[#9E9E9E] block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={function(e) { setEmail(e.target.value); clearState(); }}
                placeholder="user@example.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-[#9E9E9E] block mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={function(e) { setPassword(e.target.value); clearState(); }}
                placeholder="••••••••"
                autoComplete="current-password"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] disabled:opacity-50 text-white font-semibold text-sm rounded-lg py-3 transition-colors"
            >
              {isLoading ? 'Входим...' : 'Войти'}
            </button>

            <div className="flex justify-between text-xs text-[#9E9E9E] pt-1">
              <button
                type="button"
                onClick={function() { setMode('forgot'); clearState(); }}
                className="hover:text-white transition-colors"
              >
                Забыли пароль?
              </button>
              <button
                type="button"
                onClick={function() { setMode('register'); clearState(); }}
                className="hover:text-white transition-colors"
              >
                Регистрация →
              </button>
            </div>
          </form>
        )}

        {/* Форма регистрации */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs text-[#9E9E9E] block mb-1.5">Полное имя</label>
              <input
                type="text"
                value={fullName}
                onChange={function(e) { setFullName(e.target.value); clearState(); }}
                placeholder="Иван Иванов"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-[#9E9E9E] block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={function(e) { setEmail(e.target.value); clearState(); }}
                placeholder="user@example.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-[#9E9E9E] block mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={function(e) { setPassword(e.target.value); clearState(); }}
                placeholder="Минимум 6 символов"
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] disabled:opacity-50 text-white font-semibold text-sm rounded-lg py-3 transition-colors"
            >
              {isLoading ? 'Регистрируем...' : 'Зарегистрироваться'}
            </button>

            <div className="text-center text-xs text-[#9E9E9E] pt-1">
              <button
                type="button"
                onClick={function() { setMode('login'); clearState(); }}
                className="hover:text-white transition-colors"
              >
                ← Уже есть аккаунт? Войти
              </button>
            </div>
          </form>
        )}

        {/* Форма восстановления пароля */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-[#9E9E9E]">
              Введите email — мы отправим ссылку для сброса пароля.
            </p>
            <div>
              <label className="text-xs text-[#9E9E9E] block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={function(e) { setEmail(e.target.value); clearState(); }}
                placeholder="user@example.com"
                autoComplete="email"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] disabled:opacity-50 text-white font-semibold text-sm rounded-lg py-3 transition-colors"
            >
              {isLoading ? 'Отправляем...' : 'Отправить ссылку'}
            </button>

            <div className="text-center text-xs text-[#9E9E9E] pt-1">
              <button
                type="button"
                onClick={function() { setMode('login'); clearState(); }}
                className="hover:text-white transition-colors"
              >
                ← Назад ко входу
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
