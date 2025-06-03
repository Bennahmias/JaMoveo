import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

const PlayerMain: React.FC = () => {
  const [sessions, setSessions] = useState<Array<{ id: string; participants: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { socket } = useSocket();

  // Effect to fetch available sessions on component mount and when token changes
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true); // Set loading true when fetching starts
      setError(null); // Clear previous errors

      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/rehearsal/sessions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch sessions');
        }

        setSessions(data.sessions);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
        setSessions([]); // Clear sessions on error
      } finally {
        setIsLoading(false); // Set loading false when fetching ends
      }
    };

    // Fetch sessions only if the user is logged in (token exists)
    if (token) {
        fetchSessions();
    } else {
        // Handle case where token is not available (e.g., not logged in)
        setError("Authentication token missing. Please log in.");
        setIsLoading(false);
        setSessions([]);
        // Optional: Redirect to login if not authenticated
        // navigate('/login');
    }

  }, [token]); // Dependency on token

  // Socket effect for song selection
  useEffect(() => {
    if (!socket || !selectedSessionId) return;

    console.log('Setting up socket listener for songSelected');
    
    const handleSongSelected = (data: unknown) => {
      console.log('Received songSelected event:', data);
      navigate('/live', { 
        state: { 
          sessionId: selectedSessionId,
          song: data
        }
      });
    };

    socket.on('songSelected', handleSongSelected);

    return () => {
      console.log('Cleaning up socket listener for songSelected');
      socket.off('songSelected', handleSongSelected);
    };
  }, [socket, selectedSessionId, navigate]);

  useEffect(() => {
    if (!socket || !selectedSessionId) return;
  
    const handleSessionEnded = () => {
      navigate('/player/main');
    };
  
    socket.on('sessionEnded', handleSessionEnded);
  
    return () => {
      socket.off('sessionEnded', handleSessionEnded);
    };
  }, [socket, selectedSessionId, navigate]);

  const handleJoinSession = async (sessionId: string) => {
    setError(null); // Clear previous errors when attempting to join
    setIsLoading(true); // Set loading true while attempting to join

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/rehearsal/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ instrument: user?.instrument })
      });

      // Check for specific status codes
      if (response.status === 404) {
           const errorData = await response.json();
           const errorMessage = errorData.message || 'Session not found.';
           console.error('Failed to join session: Session not found.', errorData);
           setError(errorMessage);
           setSelectedSessionId(null); // Ensure selectedSessionId is null if join fails
           // After a 404, let the component re-render and the fetchSessions effect
           // will run again automatically due to state change (error/selectedSessionId)
           // We don't need manual navigation or setTimeout here.
           // The error message will be displayed, and the session list fetch will
           // refresh the available sessions.
           setIsLoading(false); // Stop loading
           return; // Stop execution here
      }

      // Handle other non-OK responses
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to join session with status: ${response.status}`);
      }

      // Success case
      const data = await response.json();
      console.log(`Successfully joined session ${sessionId}`, data);
      setSelectedSessionId(sessionId); // Update selected session ID

      // Join the socket room for the selected session
      if (socket) {
        socket.emit('joinSession', sessionId);
        console.log(`Player emitted 'joinSession' for ${sessionId}`);
      } else {
         console.warn("Socket not connected when joining session. Cannot emit 'joinSession'.");
      }

      // If there's a current song, navigate to the live page immediately
      if (data.currentSong) {
        console.log("Current song found, navigating to live page.");
        navigate('/live', {
          state: { sessionId, song: data.currentSong }
        });
      } else {
        console.log("No current song. Waiting for admin to select a song.");
        // If no current song, component remains in "Waiting for next song" state
      }

    } catch (err) {
      console.error('Failed to join session:', err);
      setError(err instanceof Error ? err.message : 'Failed to join session');
      setSelectedSessionId(null); // Ensure selectedSessionId is null on any error
      setIsLoading(false); // Stop loading on error
      // The error message will be displayed in the UI
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
               {/* Optionally add a button to retry fetching sessions or go back */}
               <button
                   onClick={() => {
                       // Reset state and trigger fetch effect
                       setError(null);
                       setSessions([]);
                       setSelectedSessionId(null);
                       // Re-run the fetch effect by changing token dependency
                       // or by explicitly calling fetchSessions if token doesn't change often
                       // For now, relying on state change to potentially re-trigger effect or manual refresh
                       const fetchEffect = document.createEvent('Event');
                       fetchEffect.initEvent('fetchSessionsTrigger', true, true);
                       window.dispatchEvent(fetchEffect); // Custom event to potentially trigger effect (less React idiomatic)
                       // A more idiomatic React way is to have a dependency or a manual fetch call
                       // Let's re-call fetchSessions directly if token is available
                       if(token) {
                           const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                            const fetchSessionsAgain = async () => {
                                setIsLoading(true);
                                setError(null);
                                try {
                                    const response = await fetch(`${backendUrl}/api/rehearsal/sessions`, {
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    const data = await response.json();
                                    if (!response.ok) throw new Error(data.message || 'Failed to refetch sessions');
                                    setSessions(data.sessions);
                                } catch(err) {
                                     console.error('Failed to refetch sessions:', err);
                                     setError('Failed to load sessions after error.');
                                     setSessions([]);
                                } finally {
                                    setIsLoading(false);
                                }
                            };
                           fetchSessionsAgain();
                       }
                   }}
                   className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
               >
                  Back to Sessions
               </button>
          </div>
      </div>
    );
  }

  if (selectedSessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Waiting for next song...</h2>
          
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Available Sessions</h2>
        
        {isLoading && <p className="text-center text-gray-600">Loading available sessions...</p>}

        {!isLoading && sessions.length === 0 ? (
          <p className="text-center text-gray-600">No active sessions available</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleJoinSession(session.id)}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">Session {session.id} </span>
                  <span className="text-sm text-gray-500">
                    {session.participants} participants
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerMain;