import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { LogIn, LogOut, User as UserIcon, Shield } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserState(data.user);
      setIsAdmin(data.user?.app_metadata?.role === 'admin');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserState(session?.user ?? null);
      setIsAdmin(session?.user?.app_metadata?.role === 'admin');
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, isAdmin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Грешка приликом пријаве');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
          {isAdmin ? <Shield size={12} className="text-amber-600" /> : <UserIcon size={12} className="text-emerald-600" />}
          <span className="max-w-[120px] truncate">{user.email}</span>
          {isAdmin && (
            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">АДМИН</span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
        >
          <LogOut size={12} />
          Одјава
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          const el = document.getElementById('auth-dropdown');
          if (el) el.classList.toggle('hidden');
        }}
        className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        <LogIn size={13} />
        Пријава
      </button>

      <div
        id="auth-dropdown"
        className="hidden absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-[2000]"
      >
        <h3 className="text-sm font-bold text-gray-800 mb-3">
          {isLogin ? 'Пријава' : 'Регистрација'}
        </h3>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg mb-3">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <input
            type="email"
            placeholder="Имејл"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="Лозинка"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all font-medium"
          >
            {loading ? '...' : isLogin ? 'Пријави се' : 'Региструј се'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="w-full text-xs text-emerald-600 hover:text-emerald-800 mt-3 transition-colors"
        >
          {isLogin ? 'Немате налог? Региструјте се' : 'Већ имате налог? Пријавите се'}
        </button>
      </div>
    </div>
  );
}
