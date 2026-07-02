const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'Request failed');
  }

  return data as T;
}

export interface UserProfile {
  id: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
}

export const api = {
  signup(username: string, password: string) {
    return request<{ user: UserProfile }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  login(username: string, password: string) {
    return request<{ user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout() {
    return request<{ message: string }>('/auth/logout', { method: 'POST' });
  },

  me() {
    return request<{ user: UserProfile }>('/auth/me');
  },
};
