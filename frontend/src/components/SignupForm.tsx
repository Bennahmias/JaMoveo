import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import moveoGif from "../assets/moveo10.gif";

interface SignupFormProps {
  isAdmin?: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ isAdmin = false }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [instrument, setInstrument] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username || username.trim() === "" || !password || !instrument) {
      setError("Please fill in all fields.");
      return;
    }

    if (
      password.length < 6 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError(
        "Password must be at least 6 characters long and contain at least uppercase and lowercase letter, and a number."
      );
      return;
    }

    setLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/auth/${isAdmin ? "register-admin" : "register"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, instrument }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || `Error: ${response.status}`);

      login(data.user, data.token);
      navigate(isAdmin ? "/admin/main" : "/player/main");
      
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const instrumentOptions = [
    "vocals",
    "drums",
    "guitar",
    "bass",
    "saxophone",
    "keyboard",
    "trumpet",
    "violin",
    "percussion",
    "other",
  ];

  return (
    <div
      style={{
        backgroundColor: "#fff",
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        color: "#333",
        fontFamily: `'Poppins', sans-serif`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: "1rem",
      }}
    >
      <img
        src={moveoGif}
        alt="Moveo logo"
        style={{
          width: "180px",
          height: "auto",
          marginBottom: "1rem",
          borderRadius: "12px",
          maxWidth: "90%",
        }}
      />

      <h3
        style={{
          fontSize: "1.5rem",
          color: "#933939",
          fontWeight: 700,
          margin: "0 0 0.5rem 0",
          lineHeight: "1.2",
          textAlign: "center",
        }}
      >
        🎵 Find your rhythm and 🎵
      </h3>
      <h2 style={{ fontSize: "3.0rem", color: "#933939", marginBottom: "1.5rem", textAlign: "center" }}>
        Signup To JaMoveo {isAdmin ? "(Admin)" : ""}
      </h2>
      <form
        onSubmit={handleSignup}
        style={{
          backgroundColor: "#fff",
          color: "#333",
          padding: "2rem",
          borderRadius: "20px",
          boxShadow: "0 0 10px #444",
          width: "95%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxSizing: "border-box",
        }}
      >
        <label style={{ fontWeight: "bold", textAlign: "left" }}>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            style={inputStyle}
          />
        </label>
        <label style={{ fontWeight: "bold", textAlign: "left" }}>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={inputStyle}
          />
        </label>
        <label style={{ fontWeight: "bold", textAlign: "left" }}>
          Instrument:
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            disabled={loading}
            style={inputStyle}
          >
            <option value="">Select Instrument</option>
            {instrumentOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#933939",
            color: "#fff",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background 0.3s",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {loading ? "Signing Up..." : "Signup"}
        </button>
        {error && <p style={{ color: "red", marginTop: "0.5rem", textAlign: "center" }}>{error}</p>}
        {success && (
          <p style={{ color: "green", marginTop: "0.5rem", textAlign: "center" }}>{success}</p>
        )}
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", textAlign: "center" }}>
          Already have an account?{" "}
          <a
            href="/login"
            style={{ color: "#66ccff", textDecoration: "underline" }}
          >
            Login here
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
  boxSizing: "border-box",
};

export default SignupForm;
