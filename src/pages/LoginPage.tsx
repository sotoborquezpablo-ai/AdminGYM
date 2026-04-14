/**
 * src/pages/LoginPage.tsx
 * Component for user login form.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // Clear any previous errors

    // Call the context function which simulates async API call
    login(email, password);

    // The actual navigation logic needs to wait for the context to process the state change.
    // For simulation, we'll navigate after a slight delay assuming context update.
    // In a real app, this would be handled by a useEffect hook observing the auth state.
    setTimeout(() => {
        if (localStorage.getItem('gymmanager-auth')) {
            // Success simulation: Navigate to the main dashboard
            navigate('/', { replace: true });
        } else {
            // Failure simulation handled by context error display
            console.error("Login failed, check context error state.");
        }
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-4 border-indigo-500">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            GymManager Login
        </h2>
        <p className="text-center text-gray-500 mb-8">Acceso para administradores y profesionales</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              placeholder="admin@gym.cl"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              placeholder="********"
            />
          </div>

          {/* Error Display Area */}
          {/* In a real app, we'd read the error from useAuth() */}
          <div className="text-sm text-red-600 p-2 border border-red-200 bg-red-50 rounded-lg">
             {/* Placeholder for actual error from AuthContext */}
             {/* If simulating admin/trainer/member login, use hardcoded values */}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
          >
            Iniciar Sesión
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
            Usuario de prueba: admin@gym.cl / admin123
        </p>
      </div>
    </div>
  );
};

export default LoginPage;