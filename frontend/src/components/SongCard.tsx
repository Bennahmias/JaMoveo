import React from "react";
import type { Song } from "../utils/songParser";
import defaultImage from "../assets/moveo_group_logo.jpg";

interface SongCardProps {
  song: Song;
  onSelect: (song: Song) => void;
}

const SongCard: React.FC<SongCardProps> = ({ song, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(song)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px",
        borderBottom: "1px solid #eee",
        cursor: "pointer",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
    >
      <img
        src={song.pictureUrl || defaultImage}
        alt={song.title}
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "8px",
          objectFit: "cover",
          marginRight: "12px",
        }}
      />
      <div style={{ textAlign: "left" }}>
        <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{song.title}</div>
        <div style={{ fontSize: "0.85rem", color: "#555" }}>{song.artist}</div>
      </div>
    </div>
  );
};

export default SongCard;
