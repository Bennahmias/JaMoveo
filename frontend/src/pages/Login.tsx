import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext'; 

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // State for loading indicator

  const navigate = useNavigate(); // Hook for navigation
  const { login } = useAuth(); // Get login function from AuthContext

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Basic frontend validation (backend also validates)
    if (!username || username.trim() === '' || !password) {
      setError('Please enter username and password.');
      return;
    }

    setLoading(true); // Start loading

    try {
      // Backend API call for login
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'; // Get backend URL
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle backend errors (e.g., invalid credentials)
        throw new Error(data.message || `Error: ${response.status}`);
      }

      // Handle successful login
      console.log('Login successful:', data);

      // Log the user in using AuthContext
      // Ensure the structure of data.user matches the User interface in AuthContext
      login(data.user, data.token);

      // Redirect user based on their role
      if (data.user.isAdmin) {
        navigate('/admin/main'); // Redirect admin to admin main page
      } else {
        navigate('/player/main'); // Redirect regular user to player main page
      }

    } catch (err: unknown) { // Use unknown for caught error
      console.error('Login error:', err);

      if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred.');
      } else if (typeof err === 'string') {
        setError(err || 'An unexpected error occurred.');
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false); // End loading
    }
  };


  return (
    <div>
      <h2>Login Page</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading} // Disable during loading
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading} // Disable during loading
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging In...' : 'Login'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>Don't have an account? <a href="/signup">Sign up here</a></p>
    </div>
  );
};

export default Login;