import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.store';

function Home(): React.JSX.Element {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(): Promise<void> {
    await logout();
    navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center px-4">
        <div className="text-8xl select-none">♟</div>

        <h1 className="text-5xl font-bold tracking-tight">CHESS ONLINE</h1>

        <p className="text-xl text-gray-400 max-w-md">
          Real-time multiplayer chess. Play against opponents from around the world.
        </p>

        {user ? (
          <div className="flex flex-col items-center gap-4 mt-4">
            <p className="text-gray-300">
              Welcome back, <span className="text-white font-semibold">{user.username}</span>
            </p>
            <div className="flex gap-4">
              <button
                id="btn-play"
                className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
              >
                Play
              </button>
              <button
                id="btn-logout"
                onClick={handleLogout}
                className="px-6 py-3 rounded-lg border border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 mt-4">
            <Link
              id="btn-login"
              to="/login"
              className="px-6 py-3 rounded-lg bg-white text-gray-950 font-semibold hover:bg-gray-100 transition-colors"
            >
              Log In
            </Link>
            <Link
              id="btn-signup"
              to="/signup"
              className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
