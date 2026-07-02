import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.store';

function Login(): React.JSX.Element {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 select-none">♟</div>
          <h1 className="text-3xl font-bold">Log In</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p id="login-error" className="text-red-400 text-sm text-center bg-red-950/30 border border-red-800 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="login-username" className="text-sm text-gray-400">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="your_username"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="login-password" className="text-sm text-gray-400">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            className="mt-2 px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
