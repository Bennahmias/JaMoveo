import React from 'react';
import type { Song } from '../utils/songParser'; 

// Define props for the SongList component
interface SongListProps {
  songs: Song[]; // Array of songs to display
  onSongSelect: (song: Song) => void; // Callback function when a song is clicked
}

const SongList: React.FC<SongListProps> = ({ songs, onSongSelect }) => {
  if (songs.length === 0) {
    return <p>No songs found.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {songs.map(song => (
        <li
          key={song.title}
          onClick={() => onSongSelect(song)}
          style={{
            cursor: 'pointer',
            marginBottom: '10px',
            padding: '10px',
            border: '1px solid #ccc',
            width: 'fit-content',
          }}
        >
          <h3>{song.title}</h3>
          <p>Artist: {song.artist}</p>
          {/* Add image if song.image exists */}
          {song.pictureUrl && <img src={song.pictureUrl} alt={`${song.title} cover`} style={{ maxWidth: '50px', maxHeight: '50px' }} />}
        </li>
      ))}
    </ul>
  );
};

export default SongList;