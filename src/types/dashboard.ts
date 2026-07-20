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

// Genre → duotone accent color. Same genre always maps to the same color so the
// marketplace grid has consistent visual taxonomy (electronic = lavender cluster, etc.)
const GENRE_PALETTE: [string, string][] = [
  ["electronic", "#CBA6F7"], ["house", "#CBA6F7"], ["techno", "#CBA6F7"],
  ["ambient", "#CBA6F7"], ["edm", "#CBA6F7"], ["dnb", "#CBA6F7"],
  ["drum", "#CBA6F7"], ["trance", "#CBA6F7"], ["synthwave", "#CBA6F7"],
  ["hip", "#FBBF24"], ["rap", "#FBBF24"], ["trap", "#FBBF24"],
  ["jazz", "#2DD4BF"], ["blues", "#2DD4BF"], ["soul", "#2DD4BF"],
  ["r&b", "#2DD4BF"], ["rnb", "#2DD4BF"], ["funk", "#2DD4BF"],
  ["rock", "#F87171"], ["indie", "#F87171"], ["metal", "#F87171"],
  ["punk", "#F87171"], ["alternative", "#F87171"], ["grunge", "#F87171"],
  ["pop", "#F472B6"], ["dance", "#F472B6"], ["club", "#F472B6"],
  ["classical", "#86EFAC"], ["acoustic", "#86EFAC"], ["folk", "#86EFAC"],
  ["world", "#86EFAC"], ["reggae", "#86EFAC"], ["afrobeat", "#86EFAC"],
];

export function getAccentColor(genres: string[]): string {
  if (!genres?.length) return "#CBA6F7";
  const primary = genres[0].toLowerCase();
  for (const [key, color] of GENRE_PALETTE) {
    if (primary.includes(key)) return color;
  }
  return "#CBA6F7";
}
