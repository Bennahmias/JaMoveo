import React, { useState, useEffect, useRef } from "react";
import AdminSearch from "../components/AdminSearch";
import type { Song } from "../utils/songParser";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import logo from "../assets/moveo_group_logo.jpg";

const AdminMain: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null); // State to store session ID
  const [loadingSession, setLoadingSession] = useState(true); // Loading starts immediately
  const [sessionError, setSessionError] = useState<string | null>(null); // State for session errors
  const navigate = useNavigate(); // Hook for navigation
  const { user, token, isAdmin } = useAuth(); // Get user, token, and isAdmin from AuthContext
  //const { socket } = useSocket(); // Get the socket instance

  // Get the socket instance (will be null until connected)
  const { socket } = useSocket(); // Assuming useSocket is implemented

  // Use a ref to track if the session creation logic has run
  const sessionAttemptedRef = useRef(false);

  useEffect(() => {
    // This effect runs when the AdminMain component mounts and dependencies change.

    // Only proceed if the user is an admin and we haven't already attempted session logic
    if (!isAdmin || sessionAttemptedRef.current) {
      if (!isAdmin) {
        // Should not happen if AdminRoute is used, but good safeguard
        navigate("/player/main");
      }
      return; // Exit if not admin or logic already attempted
    }

    // Mark that session logic has been attempted
    sessionAttemptedRef.current = true;

    // Function to create a session (or potentially join existing in a real app)
    const handleSessionLogic = async () => {
      setLoadingSession(true);
      setSessionError(null);
      try {
        const backendUrl =
          import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        // For this simplified version, always create a new session on page load for admin.
        const response = await fetch(`${backendUrl}/api/rehearsal/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Send the admin's token
          },
          body: JSON.stringify({ instrument: user?.instrument }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || `Error creating session: ${response.status}`,
          );
        }

        console.log("Admin session created successfully:", data);
        setSessionId(data.sessionId); // Store the new session ID

        // Join the socket room for this session ID
        if (socket) {
          socket.emit("joinSession", data.sessionId); // Emit join event to backend
          console.log(
            `Admin user emitted 'joinSession' for ${data.sessionId}. Other players can join.`,
          );
        } else {
          // If socket not connected yet, wait for it to connect and then join
          console.warn(
            "Socket not connected when session created. Will attempt to join when socket connects.",
          );
          // We'll add logic below in another useEffect to join when socket becomes available
        }
      } catch (err: unknown) {
        console.error("Failed to handle admin session:", err);
        if (err instanceof Error) {
          setSessionError(
            err.message || "An error occurred loading/creating session.",
          );
        } else {
          setSessionError(
            "An unknown error occurred loading/creating session.",
          );
        }
        setSessionId(null); // Clear session ID on error
      } finally {
        setLoadingSession(false);
      }
    };

    // If admin, initiate session logic
    if (isAdmin) {
      // Check isAdmin here
      handleSessionLogic();
    }
  }, [isAdmin, token, user?.instrument, navigate, socket]); // Dependencies: trigger when auth status or user data changes. Removed sessionId.

  // New useEffect to join socket room once socket is connected AND sessionId is available
  useEffect(() => {
    if (socket && sessionId) {
      console.log(
        `Socket is connected and SessionId ${sessionId} is available. Attempting to join socket room.`,
      );
      socket.emit("joinSession", sessionId); // Emit join event to backend
      console.log(
        `Admin user emitted 'joinSession' for ${sessionId} from secondary effect.`,
      );
    } else {
      console.log("Waiting for socket connection or SessionId to join room.");
    }
  }, [socket, sessionId]); // Dependencies: trigger when socket or sessionId changes

  const handleSearchResults = (results: Song[]) => {
    console.log(
      "Received search results in AdminMain, preparing to navigate to Results page:",
      results,
    );
    // Navigate to the Results page, passing results AND the current sessionId
    if (results.length > 0 && sessionId) {
      // Ensure we have a sessionId
      navigate("/admin/results", {
        state: { searchResults: results, sessionId: sessionId },
      }); // Pass results AND sessionId
    } else if (results.length === 0) {
      console.log("No search results found.");
    } else if (!sessionId) {
      console.error(
        "Cannot navigate to Results page: Session ID is not available.",
      );
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
        src={logo}
        alt="Moveo logo"
        style={{
          width: "180px",
          height: "auto",
          marginBottom: "1rem",
          borderRadius: "12px",
        }}
      />
      <h2
        style={{ fontSize: "2.5rem", color: "#933939", marginBottom: "1rem" }}
      >
        Search any song...🎶
      </h2>

      <div
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
          textAlign: "center",
        }}
      >
        {loadingSession && <p>Loading or creating rehearsal session...</p>}
        {sessionError && <p style={{ color: "red" }}>Error: {sessionError}</p>}

        {!loadingSession && !sessionError && (
          <AdminSearch onSearchResults={handleSearchResults} />
        )}
      </div>
    </div>
  );
};

export default AdminMain;
