import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]                   = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(function() {
    // Проверяем текущую сессию при монтировании
    supabase.auth.getSession().then(function({ data: { session } }) {
      if (session) {
        loadProfile(session.user.id);
      } else {
        setIsLoadingAuth(false);
      }
    });

    // Слушаем изменения состояния аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      function(event, session) {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          base44.auth.clearCache();
          setUser(null);
          setIsAuthenticated(false);
          setIsLoadingAuth(false);
        } else if (event === 'PASSWORD_RECOVERY') {
          // Обработка восстановления пароля
          setIsLoadingAuth(false);
        }
      }
    );

    window.addEventListener('auth:require-login', handleRequireLogin);

    return function() {
      subscription.unsubscribe();
      window.removeEventListener('auth:require-login', handleRequireLogin);
    };
  }, []);

  async function loadProfile(authId) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error || !profile) {
        console.error("Profile load error:", error);
        setIsAuthenticated(false);
        setUser(null);
        
        if (error?.code === '42P17') {
           toast.error('Ошибка БД (RLS): Бесконечная рекурсия. Проверьте политики RLS таблицы profiles в Supabase!', { duration: 10000 });
        } else if (error?.code === 'PGRST116') {
           toast.error('Профиль не найден в БД. Возможно, триггер регистрации не сработал.', { duration: 10000 });
        } else {
           toast.error('Ошибка загрузки профиля: ' + (error?.message || 'Неизвестная ошибка'));
        }
        
        // Logout to prevent bad state
        await supabase.auth.signOut();
      } else {
        setUser(profile);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error(e);
      setIsAuthenticated(false);
      toast.error('Непредвиденная ошибка при входе');
      await supabase.auth.signOut();
    } finally {
      setIsLoadingAuth(false);
    }
  }

  function handleRequireLogin() {
    base44.auth.clearCache();
    setUser(null);
    setIsAuthenticated(false);
  }

  function handleLogin(userData) {
    setUser(userData);
    setIsAuthenticated(true);
  }

  async function logout() {
    base44.auth.clearCache();
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      logout,
      navigateToLogin: handleRequireLogin,
      checkAppState: function() {},
      onLogin: handleLogin,
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
