import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useNavigate } from 'react-router-dom';
import { AUTH_INPUT_CLASS } from '@/lib/authStyles';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  // 'checking' | 'valid' | 'invalid'
  const [sessionState, setSessionState] = useState('checking');
  const resolved = useRef(false);
  const timerRef = useRef(null);

  useEffect(function () {
    function markValid() {
      if (resolved.current) return;
      resolved.current = true;
      setSessionState('valid');
    }

    function markInvalid() {
      if (resolved.current) return;
      resolved.current = true;
      setSessionState('invalid');
      setError('Ссылка для сброса пароля недействительна или истекла.');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      function (event) {
        if (event === 'PASSWORD_RECOVERY') {
          markValid();
        }
      }
    );

    supabase.auth.getSession().then(function ({ data: { session } }) {
      if (session) {
        markValid();
      } else {
        markInvalid();
      }
    });

    return function () {
      subscription.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError('Заполните оба поля');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      timerRef.current = setTimeout(function () {
        navigate('/');
      }, 2000);
    }
  }

  if (sessionState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#D32F2F] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0A0A0A' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-[#D32F2F] rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Новый пароль</h1>
          <p className="text-sm text-[#9E9E9E] mt-1">Придумайте новый пароль для вашего аккаунта</p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-[#388E3C]/20 border border-[#388E3C]/40 rounded-lg text-sm text-[#66BB6A] text-center">
            Пароль успешно изменён! Перенаправляем...
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-[#D32F2F]/20 border border-[#D32F2F]/40 rounded-lg text-sm text-[#EF5350]">
            {error}
          </div>
        )}

        {sessionState === 'valid' && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#9E9E9E] block mb-1.5">Новый пароль</label>
              <input
                type="password"
                value={password}
                onChange={function (e) { setPassword(e.target.value); setError(null); }}
                placeholder="Минимум 6 символов"
                autoComplete="new-password"
                className={AUTH_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="text-xs text-[#9E9E9E] block mb-1.5">Подтвердите пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={function (e) { setConfirmPassword(e.target.value); setError(null); }}
                placeholder="Повторите пароль"
                autoComplete="new-password"
                className={AUTH_INPUT_CLASS}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] disabled:opacity-50 text-white font-semibold text-sm rounded-lg py-3 transition-colors"
            >
              {isLoading ? 'Сохраняем...' : 'Сохранить пароль'}
            </button>
          </form>
        )}

        {sessionState === 'invalid' && !success && (
          <div className="text-center">
            <button
              onClick={function () { navigate('/'); }}
              className="text-sm text-[#D32F2F] hover:text-[#EF5350] transition-colors"
            >
              Вернуться ко входу
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
