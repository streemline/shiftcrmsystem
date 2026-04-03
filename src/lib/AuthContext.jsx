import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const loadingAuthId = useRef(null);

  useEffect(function () {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      function (event, session) {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session) {
          loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          base44.auth.clearCache();
          setUser(null);
          setIsLoadingAuth(false);
        } else if (event === 'PASSWORD_RECOVERY') {
          setIsLoadingAuth(false);
        } else if (event === 'INITIAL_SESSION' && !session) {
          setIsLoadingAuth(false);
        }
      }
    );

    window.addEventListener('auth:require-login', handleRequireLogin);

    return function () {
      subscription.unsubscribe();
      window.removeEventListener('auth:require-login', handleRequireLogin);
    };
  }, []);

  async function loadProfile(authId) {
    if (loadingAuthId.current === authId) return;
    loadingAuthId.current = authId;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error || !profile) {
        console.error("Profile load error:", error);
        setUser(null);

        if (error?.code === '42P17') {
          toast.error('Ошибка БД (RLS): Бесконечная рекурсия. Проверьте политики RLS таблицы profiles в Supabase!', { duration: 10000 });
        } else if (error?.code === 'PGRST116') {
          toast.error('Профиль не найден в БД. Возможно, триггер регистрации не сработал.', { duration: 10000 });
        } else {
          toast.error('Ошибка загрузки профиля: ' + (error?.message || 'Неизвестная ошибка'));
        }

        await supabase.auth.signOut();
      } else {
        setUser(profile);
      }
    } catch (e) {
      console.error(e);
      setUser(null);
      toast.error('Непредвиденная ошибка при входе');
      await supabase.auth.signOut();
    } finally {
      loadingAuthId.current = null;
      setIsLoadingAuth(false);
    }
  }

  function handleRequireLogin() {
    base44.auth.clearCache();
    setUser(null);
  }

  async function logout() {
    base44.auth.clearCache();
    await supabase.auth.signOut();
  }

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      logout,
      navigateToLogin: handleRequireLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
