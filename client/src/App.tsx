import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/auth.store';
import { GameProvider } from './store/game.store';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Queue from './pages/Queue';
import Game from './pages/Game';

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/game/:gameId" element={<Game />} />
          </Routes>
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
