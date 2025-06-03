import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import SongList from '../components/SongList'; 
import type { Song } from '../utils/songParser'; 
import { useAuth } from '../context/AuthContext';

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
      navigate('/admin/main');
    }
  }, [location.state, navigate]);

  const handleSongSelect = async (selectedSong: Song) => {
    try {
      const sessionId = location.state?.sessionId;
      if (!sessionId) {
        console.error('No session ID available');
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/rehearsal/sessions/${sessionId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ songTitle: selectedSong.title })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to select song');
      }

      // Navigate to the shared live page
      navigate('/live', { 
        state: { 
          sessionId,
          song: selectedSong
        }
      });

    } catch (error) {
      console.error('Error selecting song:', error);
      // Handle error appropriately
    }
  };

  return (
    <div>
      <h2>Search Results</h2>
      <SongList songs={searchResults} onSongSelect={handleSongSelect} />
    </div>
  );
};

export default Results;