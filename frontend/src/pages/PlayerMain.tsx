import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import logo from "../assets/moveo_group_logo.jpg";

const PlayerMain: React.FC = () => {
  const [sessions, setSessions] = useState<Array<{ id: string; participants: number, adminName: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { socket } = useSocket();

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/rehearsal/sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch sessions");
      setSessions(data.sessions);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSessions();
    } else {
      setError("Authentication token missing. Please log in.");
      setIsLoading(false);
      setSessions([]);
    }
  }, [token, fetchSessions]);

  useEffect(() => {
    if (!socket || !selectedSessionId) return;
    const handleSongSelected = (data: unknown) => {
      navigate("/live", {
        state: {
          sessionId: selectedSessionId,
          song: data,
        },
      });
    };
    socket.on("songSelected", handleSongSelected);
    return () => {
      socket.off("songSelected", handleSongSelected);
    };
  }, [socket, selectedSessionId, navigate]);

  useEffect(() => {
    if (!socket || !selectedSessionId) return;
    const handleSessionEnded = () => navigate("/player/main");
    socket.on("sessionEnded", handleSessionEnded);
    return () => {
      socket.off("sessionEnded", handleSessionEnded);
    };
  }, [socket, selectedSessionId, navigate]);


  const handleJoinSession = async (sessionId: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/rehearsal/sessions/${sessionId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ instrument: user?.instrument }),
        },
      );

      if (response.status === 404) {
        const errorData = await response.json();
        setError(errorData.message || "Session not found.");
        setSelectedSessionId(null);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to join session with status: ${response.status}`,
        );
      }

      const data = await response.json();
      setSelectedSessionId(sessionId);
      if (socket) socket.emit("joinSession", sessionId);
      if (data.currentSong) {
        navigate("/live", {
          state: { sessionId, song: data.currentSong },
        });
      }
    } catch (err) {
      console.error("Failed to join session:", err);
      setError(err instanceof Error ? err.message : "Failed to join session");
      setSelectedSessionId(null);
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          minHeight: "100vh",
          width: "100%",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Poppins, sans-serif",
          color: "#333",
          boxSizing: "border-box",
          padding: "1rem",
        }}
      >
        <img
          src={logo}
          alt="Moveo logo"
          style={{ 
            width: "min(180px, 40vw)", 
            marginBottom: "1rem", 
            borderRadius: "12px" 
          }}
        />
        <div
          style={{
            backgroundColor: "#fff",
            padding: "min(2rem, 5vw)",
            borderRadius: "20px",
            boxShadow: "0 0 10px #444",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#933939",
              fontSize: "min(2rem, 6vw)",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            Error
          </h2>
          <p style={{ marginBottom: "1rem", fontSize: "min(1rem, 4vw)" }}>{error}</p>
          <button
            onClick={fetchSessions}
            style={{
              backgroundColor: "#933939",
              color: "#fff",
              padding: "min(0.75rem, 3vw) min(1.5rem, 6vw)",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "background 0.3s",
              fontSize: "min(1rem, 4vw)",
              width: "100%",
              maxWidth: "300px",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#aa5050")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#933939")
            }
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  if (selectedSessionId) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Poppins, sans-serif",
          color: "#333",
          padding: "1rem",
          boxSizing: "border-box",
        }}
      >
        <img
          src={logo}
          alt="Moveo logo"
          style={{ 
            width: "min(180px, 40vw)", 
            marginBottom: "1rem", 
            borderRadius: "12px" 
          }}
        />
        <div
          style={{
            backgroundColor: "#fff",
            padding: "min(2rem, 5vw)",
            borderRadius: "20px",
            boxShadow: "0 0 10px #444",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#933939",
              fontSize: "min(2rem, 6vw)",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            Waiting for next song...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#fff",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Poppins, sans-serif",
        color: "#333",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <img
        src={logo}
        alt="Moveo logo"
        style={{ 
          width: "min(180px, 40vw)", 
          marginBottom: "1rem", 
          borderRadius: "12px" 
        }}
      />
      <h2
        style={{ 
          color: "#933939", 
          fontSize: "min(2.5rem, 8vw)", 
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        Available Sessions 🎶
      </h2>
      <div
        style={{
          backgroundColor: "#fff",
          padding: "min(2rem, 5vw)",
          borderRadius: "20px",
          boxShadow: "0 0 10px #444",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {isLoading && <p style={{ fontSize: "min(1rem, 4vw)" }}>Loading available sessions...</p>}
        {!isLoading && sessions.length === 0 ? (
          <div>
            <p style={{ marginBottom: "1rem", fontSize: "min(1rem, 4vw)" }}>No active sessions available</p>
            <button
              onClick={fetchSessions}
              style={{
                backgroundColor: "#933939",
                color: "#fff",
                padding: "min(0.75rem, 3vw) min(1.5rem, 6vw)",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "background 0.3s",
                fontSize: "min(1rem, 4vw)",
                width: "100%",
                maxWidth: "300px",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#aa5050")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#933939")
              }
            >
              Refresh 🔄
            </button>
          </div>
        ) : (
          <div
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "min(0.75rem, 3vw)",
              width: "100%",
            }}
          >
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleJoinSession(session.id)}
                style={{
                  backgroundColor: "#933939",
                  color: "#fff",
                  padding: "min(0.75rem, 3vw)",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background 0.3s",
                  fontSize: "min(1rem, 4vw)",
                  width: "100%",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#aa5050")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#933939")
                }
              >
                Session by {session.adminName} - {session.participants} participants
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerMain;
