import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/auth.store';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
