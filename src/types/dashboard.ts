export interface ArtistWithProfile {
  id: string;
  stage_name: string | null;
  soundcloud_url: string | null;
  soundcloud_user_id: string | null;
  soundcloud_playlist_url: string | null;
  bio: string | null;
  genres: string[];
  vibe_tags: string[];
  location: string | null;
  base_rate: number | null;
  set_durations: number[];
  event_types: string[];
  performance_cities: string[];
  social_links: Record<string, string> | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  match_score?: number | null;
}

export interface ArtistMedia {
  id: string;
  artist_id: string;
  url: string;
  media_type: "photo" | "video";
  caption: string | null;
  display_order: number;
  created_at: string;
}

export interface HostProfile {
  id: string;
  spotify_id: string | null;
  profiles: {
    full_name: string | null;
  } | null;
}

export function getDisplayName(artist: ArtistWithProfile): string {
  return artist.stage_name || artist.profiles?.full_name || "Unknown Artist";
}
