import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import { formatSongLinesForDisplay } from '../utils/songParser';
import type {Song} from '../utils/songParser';

const Live: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user, token } = useAuth();
  const { state } = location;
  const sessionId = state?.sessionId || new URLSearchParams(location.search).get('sessionId');
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const scrollIntervalRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  // Effect to join session room and set up socket listeners
  useEffect(() => {
    if (!sessionId) {
      console.error("No sessionId found in Live page state or query params.");
      navigate(user?.isAdmin ? '/admin/main' : '/player/main');
      return;
    }

    if (socket) {
      console.log(`Live page joining socket session room: ${sessionId}`);
      socket.emit('joinSession', sessionId);

      const handleSessionEnded = () => {
        console.log('Received sessionEnded event. Navigating to main page.');

        if (user?.isAdmin) {
          navigate('/admin/main');
        } else {
          navigate('/player/main');
        }
      };

      socket.on('sessionEnded', handleSessionEnded);

      return () => {
        console.log(`Live page cleaning up socket session listener for ${sessionId}`);
        socket.off('sessionEnded', handleSessionEnded);
        if (scrollIntervalRef.current !== null) {
          window.clearInterval(scrollIntervalRef.current);
        }
      };
    }
  }, [sessionId, socket, navigate, user?.isAdmin]);

  // Effect to check if content is scrollable and set canScroll state
  useEffect(() => {
    const checkScrollable = () => {
      if (contentRef.current) {
        setCanScroll(contentRef.current.scrollHeight > contentRef.current.clientHeight);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);

    return () => {
      window.removeEventListener('resize', checkScrollable);
    };
  }, [state?.song]);

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
        if (contentRef.current) {
          if (contentRef.current.scrollTop + contentRef.current.clientHeight >= contentRef.current.scrollHeight) {
            if (scrollIntervalRef.current !== null) {
              window.clearInterval(scrollIntervalRef.current);
              scrollIntervalRef.current = null;
            }
            setIsAutoScrolling(false);
          } else {
            contentRef.current.scrollTop += 2;
          }
        }
      }, 30);
    }
    setIsAutoScrolling(!isAutoScrolling);
  };

  const handleQuit = async () => {
    console.log(`Admin ${user?.username} is quitting session ${sessionId}. Attempting to end via API.`);
    if (sessionId && token) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/rehearsal/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error ending session: ${response.status}`);
        }

        console.log(`Session ${sessionId} ended successfully via API.`);
      } catch (err) {
        console.error('Failed to end session via API:', err);
        navigate('/admin/main');
      }
    } else {
      console.warn("Cannot end session: SessionId or token missing.");
      navigate('/admin/main');
    }
  };

  // Type assertion for state.song
  const currentSong = state?.song as Song | undefined;

  if (!currentSong) {
    return <div>Loading...</div>;
  }

  const formattedLines = formatSongLinesForDisplay(currentSong);

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-800 p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center">
          {currentSong.pictureUrl && (
            <img
              src={currentSong.pictureUrl}
              alt={`${currentSong.title} album art`}
              className="w-12 h-12 rounded-md mr-4 object-cover"
            />
          )}
          <div>
            <h2 className="text-3xl font-bold">{currentSong.title}</h2>
            <p className="text-xl text-gray-300">{currentSong.artist}</p>
          </div>
        </div>

        {user?.isAdmin && (
          <button
            onClick={handleQuit}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Quit Session
          </button>
        )}
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className={`p-8 max-w-4xl mx-auto space-y-6 overflow-y-auto ${isAutoScrolling ? 'scrolling-active' : ''}`}
        style={{ height: 'calc(100vh - 120px)', scrollBehavior: 'smooth' }}
      >
        {formattedLines.map((line, lineIndex) => (
          <div key={lineIndex} className="flex flex-col">
            {line.segments.map((segment, segmentIndex) => (
              <div key={segmentIndex} className="flex flex-col">
                {user?.instrument !== 'vocals' && segment.chords && (
                  <div className="text-2xl font-mono text-blue-400 mb-1">
                    {segment.chords}
                  </div>
                )}
                {segment.lyrics && (
                  <div className="text-3xl font-semibold text-white">
                    {segment.lyrics}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Auto-scroll toggle button */}
      {canScroll && (
        <button
          onClick={toggleAutoScroll}
          className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-20"
        >
          {isAutoScrolling ? (
            <span className="text-2xl">⏸</span>
          ) : (
            <span className="text-2xl">▶</span>
          )}
        </button>
      )}
    </div>
  );
};

export default Live;
