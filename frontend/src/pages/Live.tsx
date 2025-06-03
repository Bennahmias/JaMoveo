import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";
import { formatSongLinesForDisplay } from "../utils/songParser";
import type { Song } from "../utils/songParser";

const Live: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user, token } = useAuth();
  const { state } = location;
  const sessionId =
    state?.sessionId || new URLSearchParams(location.search).get("sessionId");
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const scrollIntervalRef = useRef<number | null>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      console.error("No sessionId found in Live page state or query params.");
      navigate(user?.isAdmin ? "/admin/main" : "/player/main");
      return;
    }

    if (socket) {
      console.log(`Live page joining socket session room: ${sessionId}`);
      socket.emit("joinSession", sessionId);

      const handleSessionEnded = () => {
        console.log("Received sessionEnded event. Navigating to main page.");

        if (user?.isAdmin) {
          navigate("/admin/main");
        } else {
          navigate("/player/main");
        }
      };

      socket.on("sessionEnded", handleSessionEnded);

      return () => {
        console.log(
          `Live page cleaning up socket session listener for ${sessionId}`,
        );
        socket.off("sessionEnded", handleSessionEnded);
        if (scrollIntervalRef.current !== null) {
          window.clearInterval(scrollIntervalRef.current);
        }
      };
    }
  }, [sessionId, socket, navigate, user?.isAdmin]);

  useEffect(() => {
    const checkScrollable = () => {
      setCanScroll(document.body.scrollHeight > window.innerHeight);
    };

    checkScrollable();
    window.addEventListener("resize", checkScrollable);
    return () => window.removeEventListener("resize", checkScrollable);
  }, [state?.song]);

  useEffect(() => {
    if (!isAutoScrolling) return;

    const handleScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 10;
      if (nearBottom) {
        setIsAutoScrolling(false);
        if (scrollIntervalRef.current !== null) {
          window.clearInterval(scrollIntervalRef.current);
          scrollIntervalRef.current = null;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAutoScrolling]);

  const toggleAutoScroll = () => {
    if (!canScroll) {
      console.log("Content is not scrollable.");
      setIsAutoScrolling(false);
      if (scrollIntervalRef.current !== null) {
        window.clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }

    if (isAutoScrolling) {
      if (scrollIntervalRef.current !== null) {
        window.clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    } else {
      scrollIntervalRef.current = window.setInterval(() => {
        window.scrollBy({ top: 2 });
      }, 70);
    }
    setIsAutoScrolling(!isAutoScrolling);
  };

  const handleQuit = async () => {
    console.log(
      `Admin ${user?.username} is quitting session ${sessionId}. Attempting to end via API.`,
    );
    if (sessionId && token) {
      try {
        const backendUrl =
          import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const response = await fetch(
          `${backendUrl}/api/rehearsal/sessions/${sessionId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Error ending session: ${response.status}`,
          );
        }

        console.log(`Session ${sessionId} ended successfully via API.`);
      } catch (err) {
        console.error("Failed to end session via API:", err);
        navigate("/admin/main");
      }
    } else {
      console.warn("Cannot end session: SessionId or token missing.");
      navigate("/admin/main");
    }
  };

  const currentSong = state?.song as Song | undefined;

  if (!currentSong) {
    return <div>Loading...</div>;
  }

  const formattedLines = formatSongLinesForDisplay(currentSong);

  function detectDirection(line: {
    segments: { lyrics: string }[];
  }): "rtl" | "ltr" {
    const text = line.segments.map((seg) => seg.lyrics).join(" ");
    const rtlChar = /[\u0590-\u05FF]/;
    return rtlChar.test(text) ? "rtl" : "ltr";
  }

  return (
    <div
      style={{
        backgroundColor: "#121212",
        color: "#fff",
        minHeight: "100vh",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "#1f1f1f",
          padding: "1rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {currentSong.pictureUrl && (
            <img
              src={currentSong.pictureUrl}
              alt={`${currentSong.title} album art`}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "8px",
                objectFit: "cover",
                marginRight: "1rem",
              }}
            />
          )}
          <div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0 }}>
              {currentSong.title}
            </h2>
            <p style={{ fontSize: "1.2rem", color: "#bbb", margin: 0 }}>
              {currentSong.artist}
            </p>
          </div>
        </div>
        {user?.isAdmin && (
          <button
            onClick={handleQuit}
            style={{
              backgroundColor: "#933939",
              color: "#fff",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#aa5050")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#933939")
            }
          >
            Quit Session
          </button>
        )}
      </div>

      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
        {formattedLines.map((line, lineIndex) => {
          const direction = detectDirection(line);
          return (
            <div
              key={lineIndex}
              style={{
                marginBottom: "1.5rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                direction,
                textAlign: direction === "rtl" ? "right" : "left",
                justifyContent: direction === "rtl" ? "flex-end" : "flex-start",
                width: "100%",
              }}
            >
              {line.segments.map((segment, segmentIndex) => (
                <div
                  key={segmentIndex}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: "1ch",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "monospace",
                      color: "#66ccff",
                      fontSize: "1.1rem",
                      lineHeight: "1rem",
                      height: "1rem",
                    }}
                  >
                    {user?.instrument !== "vocals" && segment.chords
                      ? segment.chords
                      : "\u00A0"}
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>
                    {segment.lyrics || "\u00A0"}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {canScroll && (
        <button
          onClick={toggleAutoScroll}
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            width: "64px",
            height: "64px",
            backgroundColor: "#2563eb",
            color: "#fff",
            borderRadius: "50%",
            fontSize: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            cursor: "pointer",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#1e40af")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#2563eb")
          }
        >
          {isAutoScrolling ? "⏸" : "▶"}
        </button>
      )}
    </div>
  );
};

export default Live;
