import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import gif from "../assets/moveo10.gif";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // State for loading indicator

  const navigate = useNavigate(); // Hook for navigation
  const { login } = useAuth(); // Get login function from AuthContext

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Basic frontend validation (backend also validates)
    if (!username || username.trim() === "" || !password) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true); // Start loading

    try {
      // Backend API call for login
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"; // Get backend URL
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle backend errors (e.g., invalid credentials)
        throw new Error(data.message || `Error: ${response.status}`);
      }

      // Handle successful login
      console.log("Login successful:", data);

      // Log the user in using AuthContext
      // Ensure the structure of data.user matches the User interface in AuthContext
      login(data.user, data.token);

      // Redirect user based on their role
      if (data.user.isAdmin) {
        navigate("/admin/main"); // Redirect admin to admin main page
      } else {
        navigate("/player/main"); // Redirect regular user to player main page
      }
    } catch (err: unknown) {
      // Use unknown for caught error
      console.error("Login error:", err);

      if (err instanceof Error) {
        setError(err.message || "An unexpected error occurred.");
      } else if (typeof err === "string") {
        setError(err || "An unexpected error occurred.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        color: "#333",
        fontFamily: `'Poppins', sans-serif`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={gif}
        alt="Moveo animation"
        style={{
          width: "200px",
          height: "auto",
          marginBottom: "1rem",
          borderRadius: "12px",
        }}
      />
      <h2 style={{ fontSize: "3rem", color: "#933939", marginBottom: "1rem" }}>
        Login 🎶
      </h2>
      <form
        onSubmit={handleLogin}
        style={{
          backgroundColor: "#fff",
          color: "#333",
          padding: "2rem",
          borderRadius: "20px",
          boxShadow: "0 0 10px #444",
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <label style={{ fontWeight: "bold" }}>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            style={inputStyle}
          />
        </label>
        <label style={{ fontWeight: "bold" }}>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={inputStyle}
          />
        </label>
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Logging In..." : "Login"}
        </button>
        {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
        <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Don't have an account?{" "}
          <a
            href="/signup"
            style={{ color: "#66ccff", textDecoration: "underline" }}
          >
            Sign up here
          </a>
        </p>
      </form>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "6px",
  border: "1px solid #ccc",
  marginTop: "0.25rem",
  backgroundColor: "#f9f9f9",
  color: "#333",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#933939",
  color: "#fff",
  padding: "0.75rem",
  borderRadius: "8px",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background 0.3s",
};

export default Login;
