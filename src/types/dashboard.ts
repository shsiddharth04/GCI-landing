export interface ArtistWithProfile {
  id: string;
  soundcloud_url: string | null;
  soundcloud_user_id: string | null;
  bio: string | null;
  genres: string[];
  location: string | null;
  base_rate: number | null;
  performance_cities: string[];
  social_links: Record<string, string> | null;
  avatar_url: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  match_score?: number | null;
}

export interface HostProfile {
  id: string;
  spotify_id: string | null;
  profiles: {
    full_name: string | null;
  } | null;
}
