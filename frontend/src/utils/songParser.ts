interface SongSegment {
  lyrics: string;
  chords?: string; // Chords might be optional
}

interface SongLine {
  segments: SongSegment[];
}

export interface Song {
  title: string;
  artist: string;
  lines: SongLine[];
  pictureUrl?: string;
}

export const formatSongLinesForDisplay = (
  song: Song,
): Array<{ segments: SongSegment[] }> => {
  const formattedLines = song.lines.map((line) => {
    const processedSegments = line.segments.map((segment) => {
      // Return segments as is, the renderer decides based on instrument
      return {
        lyrics: segment.lyrics,
        chords: segment.chords,
      };
    });
    return { segments: processedSegments };
  });

  return formattedLines;
};
