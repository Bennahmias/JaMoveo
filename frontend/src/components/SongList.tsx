import React from "react";
import type { Song } from "../utils/songParser";
import SongCard from "./SongCard";

interface SongListProps {
  songs: Song[];
  onSongSelect: (song: Song) => void;
}

const SongList: React.FC<SongListProps> = ({ songs, onSongSelect }) => {
  if (songs.length === 0) {
    return <p>No songs found.</p>;
  }

  return (
    <div style={{ width: "100%" }}>
      {songs.map((song) => (
        <SongCard key={song.title} song={song} onSelect={onSongSelect} />
      ))}
    </div>
  );
};

export default SongList;
