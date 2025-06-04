import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import gif from "../assets/moveo10.gif";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); 

    
    if (!username || username.trim() === "" || !password) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true); 

    try {
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`);
      }

      
      console.log("Login successful:", data);

      
      login(data.user, data.token);

      
      if (data.user.isAdmin) {
        navigate("/admin/main"); 
      } else {
        navigate("/player/main"); 
      }
    } catch (err: unknown) {
      console.error("Login error:", err);

      if (err instanceof Error) {
        setError(err.message || "An unexpected error occurred.");
      } else if (typeof err === "string") {
        setError(err || "An unexpected error occurred.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        minHeight: "100vh",
        width: "100%",
        margin: 0,
        color: "#333",
        fontFamily: `'Poppins', sans-serif`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: "min(1rem, 3vw)",
      }}
    >
      <img
        src={gif}
        alt="Moveo animation"
        style={{
          width: "min(200px, 50vw)",
          height: "auto",
          marginBottom: "min(1rem, 3vw)",
          borderRadius: "12px",
          maxWidth: "90%",
        }}
      />
      <h2 style={{ 
        fontSize: "min(3rem, 8vw)",
        color: "#933939", 
        marginBottom: "min(1rem, 3vw)", 
        textAlign: "center" 
      }}>
        Login 🎶
      </h2>
      <form
        onSubmit={handleLogin}
        style={{
          backgroundColor: "#fff",
          color: "#333",
          padding: "min(2rem, 5vw)",
          borderRadius: "20px",
          boxShadow: "0 0 10px #444",
          width: "95%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "min(1rem, 3vw)",
          boxSizing: "border-box",
        }}
      >
        <label style={{ 
          fontWeight: "bold", 
          textAlign: "left",
          fontSize: "min(1rem, 4vw)",
        }}>
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
        <label style={{ 
          fontWeight: "bold", 
          textAlign: "left",
          fontSize: "min(1rem, 4vw)",
        }}>
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
        {error && (
          <p style={{ 
            color: "red", 
            marginTop: "min(0.5rem, 2vw)", 
            textAlign: "center",
            fontSize: "min(1rem, 4vw)",
          }}>
            {error}
          </p>
        )}
        <p style={{ 
          marginTop: "min(1rem, 3vw)", 
          fontSize: "min(0.9rem, 3.5vw)", 
          textAlign: "center" 
        }}>
          Don't have an account?{" "}
          <a
            href="/signup"
            style={{ 
              color: "#66ccff", 
              textDecoration: "underline",
              fontSize: "min(0.9rem, 3.5vw)",
            }}
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
  padding: "min(0.5rem, 2vw)",
  borderRadius: "6px",
  border: "1px solid #ccc",
  marginTop: "min(0.25rem, 1vw)",
  backgroundColor: "#f9f9f9",
  color: "#333",
  boxSizing: "border-box",
  fontSize: "min(1rem, 4vw)",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#933939",
  color: "#fff",
  padding: "min(0.75rem, 3vw)",
  borderRadius: "8px",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background 0.3s",
  width: "100%",
  boxSizing: "border-box",
  fontSize: "min(1rem, 4vw)",
};

export default Login;
