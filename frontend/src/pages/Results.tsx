import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SongList from "../components/SongList";
import type { Song } from "../utils/songParser";
import { useAuth } from "../context/AuthContext";

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    // Get the search results and sessionId from the navigation state
    if (location.state && location.state.searchResults) {
      setSearchResults(location.state.searchResults as Song[]);
    } else {
      // If no results in state (e.g., page refreshed directly), redirect back to admin main
      navigate("/admin/main");
    }
  }, [location.state, navigate]);

  const handleSongSelect = async (selectedSong: Song) => {
    try {
      const sessionId = location.state?.sessionId;
      if (!sessionId) {
        console.error("No session ID available");
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/rehearsal/sessions/${sessionId}/songs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ songTitle: selectedSong.title }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to select song");
      }

      // Navigate to the shared live page
      navigate("/live", {
        state: {
          sessionId,
          song: selectedSong,
        },
      });
    } catch (error) {
      console.error("Error selecting song:", error);
    }
  };

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
      <h2
        style={{ fontSize: "2.5rem", color: "#933939", marginBottom: "1rem", textAlign: "center" }}
      >
        Search Results 🎼
      </h2>
      <div
        style={{
          backgroundColor: "#fff",
          color: "#333",
          padding: "2rem",
          borderRadius: "20px",
          boxShadow: "0 0 10px #444",
          width: "95%",
          maxWidth: "600px",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <SongList songs={searchResults} onSongSelect={handleSongSelect} />
      </div>
    </div>
  );
};

export default Results;
