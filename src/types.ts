export interface Artist {
  id: string;
  name: string;
  genre: string;
  location: string;
  bpm: number;
  tags: string[];
  avatarUrl: string;
  trackName: string;
  matchScore: number;
  vibeType: string;
  soundcloudUrl: string;
  spotifyVibe: string;
  bio: string;
}

export type ScanStatus = "idle" | "connecting_spotify" | "scanning_spotify" | "fetching_soundcloud" | "matching" | "completed";

export interface ScanState {
  status: ScanStatus;
  selectedVibe: string | null;
  matchScore: number;
  matchedArtist: Artist | null;
  logLines: string[];
}
