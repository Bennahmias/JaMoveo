import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../context/AuthContext'; // Import useAuth

const Signup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [instrument, setInstrument] = useState(''); // State for selected instrument
  const [error, setError] = useState<string | null>(null); // State to display errors
  const [success, setSuccess] = useState<string | null>(null); // State for success message
  const [loading, setLoading] = useState(false); // State for loading indicator

  const navigate = useNavigate(); // Hook for navigation
  const { login } = useAuth(); // Get login function from AuthContext

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setSuccess(null); // Clear previous success messages

    // Basic frontend validation (backend also validates)
    if (!username || username.trim() === '' || !password || !instrument) {
      setError('Please fill in all fields.');
      return;
    }

    // Password complexity check (basic frontend check matching backend)
    if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 6 characters long and contain at least uppercase and lowercase letter, and a number.');
      return;
    }

    setLoading(true); // Start loading

    try {
      // Backend API call for registration
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/register-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, instrument }), 
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific backend errors (e.g., username exists, validation errors)
        throw new Error(data.message || `Error: ${response.status}`);
      }

      // Handle successful signup
      console.log('Signup successful:', data);
      setSuccess('Signup successful!'); // Optional: show success message briefly

      // Log the user in immediately after successful registration and navigate to admin main page
      login(data.user, data.token);
      navigate('/admin/main');

  

    } catch (err: unknown) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false); // End loading
    }
  };

  // Define instrument options based on backend enum
  const instrumentOptions = [
    'vocals',
    'drums',
    'guitar',
    'bass',
    'saxophone',
    'keyboard',
    'trumpet',
    'violin',
    'percussion',
    'other'
  ];

  return (
    <div>
      <h2>Admin Signup To Jamoveo</h2>
      <h3>And find your rythem!</h3>
      <form onSubmit={handleSignup}>
        <div>
          <label htmlFor="username">Username: </label>
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
          <label htmlFor="password">Password: </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading} // Disable during loading
          />
        </div>
        <div>
          <label htmlFor="instrument">Instrument:  </label>
          <select
            id="instrument"
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            required
            disabled={loading} // Disable during loading
          >
            <option value="">Select Instrument</option>
            {instrumentOptions.map(option => (
              <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing Up...' : 'Signup'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <p>Already have an account? <a href="/login">Login here</a></p>
    </div>
  );
};

export default Signup;
