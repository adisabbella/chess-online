import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api, UserProfile } from '../services/api';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; user: UserProfile }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; loading: boolean };

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, loading: false };
    case 'CLEAR_USER':
      return { ...state, user: null, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(authReducer, { user: null, loading: true });

  useEffect(() => {
    api
      .me()
      .then(({ user }) => dispatch({ type: 'SET_USER', user }))
      .catch(() => dispatch({ type: 'CLEAR_USER' }));
  }, []);

  async function login(username: string, password: string): Promise<void> {
    const { user } = await api.login(username, password);
    dispatch({ type: 'SET_USER', user });
  }

  async function logout(): Promise<void> {
    await api.logout();
    dispatch({ type: 'CLEAR_USER' });
  }

  async function signup(username: string, password: string): Promise<void> {
    await api.signup(username, password);
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
