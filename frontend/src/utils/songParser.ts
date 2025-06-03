// Define interfaces to match the structure of the song data from the backend
interface SongSegment {
  lyrics: string;
  chords?: string; // Chords might be optional for lines with only lyrics
}

interface SongLine {
  segments: SongSegment[];
}

// Define the main Song interface - Use pictureUrl to match backend
export interface Song {
  // Export this interface as it's used in components
  title: string;
  artist: string;
  lines: SongLine[]; // Store processed lines here
  pictureUrl?: string; // Changed from image to pictureUrl
}

/**
 * Formats the song lines for display (structures the data for rendering).
 * @param song The Song object containing lines data.
 * @returns An array of objects, where each object represents a formatted line ready for rendering.
 */
export const formatSongLinesForDisplay = (
  song: Song,
): Array<{ segments: SongSegment[] }> => {
  // The rendering component (LiveLyrics) will handle instrument-specific display

  const formattedLines = song.lines.map((line) => {
    const processedSegments = line.segments.map((segment) => {
      // Return segments as is, the renderer decides based on instrument
      return {
        lyrics: segment.lyrics,
        chords: segment.chords, // chords might be undefined
      };
    });
    return { segments: processedSegments };
  });

  // Basic implementation: For now, just return the processed lines.
  // More complex formatting (like aligning chords above lyrics) will primarily
  // be handled by the rendering component (LiveLyrics.tsx) using CSS/structure.
  return formattedLines;
};

// You could add other utility functions here later if needed,
// e.g., to extract plain text lyrics or chords.
// export const getPlainTextLyrics = (song: Song): string => {
//   return song.lines.map(line =>
//     line.segments.map(segment => segment.lyrics).join('')
//   ).join('\n');
// };
