import { Artist } from "./types";

export const MUSICAL_VIBES = [
  { id: "dark_industrial", name: "Dark & Industrial", desc: "Heavy analog synths, dark techno, and high-energy drums.", tags: ["TECHNO", "INDUSTRIAL", "HARDWARE"] },
  { id: "organic_groove", name: "Organic & Groovy", desc: "Soulful R&B, smooth neo-soul, and warm instrumental grooves.", tags: ["R&B", "NEO-SOUL", "LIVE-BASS"] },
  { id: "cinematic_glitch", name: "Ambient Glitch & Beats", desc: "IDM, chilled glitch hop, ambient textures, and sound design.", tags: ["GLITCH", "FUTURE-BASS", "AMBIENT"] },
  { id: "indie_dream", name: "Dreamy Indietronica", desc: "Ethereal guitars, retro synthwave, and emotional lyricism.", tags: ["SYNTHWAVE", "INDIETRONICA", "DREAM-POP"] },
  { id: "heavy_breaks", name: "High-Octane Breaks", desc: "Fast-tempo drum & bass, jungle breaks, and raw garage grooves.", tags: ["D&B", "JUNGLE", "UK-GARAGE"] }
];

export const ARTISTS: Artist[] = [
  {
    id: "GCI_01",
    name: "Sandunes",
    genre: "FUTURE GLITCH",
    location: "MUMBAI",
    bpm: 118,
    tags: ["GLITCH", "FUTURE-BASS", "AMBIENT"],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400",
    trackName: "Shadows in the Dust",
    matchScore: 98.4,
    vibeType: "cinematic_glitch",
    soundcloudUrl: "https://soundcloud.com/sandunes/tracks",
    spotifyVibe: "Cinematic Glitch & Beats",
    bio: "Sandunes is an electronic music producer, composer, and keyboard player from Mumbai. Her music blends future garage, organic percussion, and shimmering glitch synths."
  },
  {
    id: "GCI_02",
    name: "Arjun Vagale",
    genre: "INDUSTRIAL TECHNO",
    location: "BANGALORE",
    bpm: 132,
    tags: ["TECHNO", "INDUSTRIAL", "HARDWARE"],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400",
    trackName: "Radiant Flux",
    matchScore: 97.1,
    vibeType: "dark_industrial",
    soundcloudUrl: "https://soundcloud.com/arjun-vagale/tracks",
    spotifyVibe: "Dark & Industrial",
    bio: "One of India's most acclaimed techno pioneers, Arjun Vagale delivers raw, uncompromising analog rhythms and hypnotic dark soundscapes forged in his hardware-heavy studio."
  },
  {
    id: "GCI_03",
    name: "Kayan",
    genre: "R&B / NEO-SOUL",
    location: "MUMBAI",
    bpm: 96,
    tags: ["R&B", "NEO-SOUL", "LIVE-BASS"],
    avatarUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400&h=400",
    trackName: "Be My Summer",
    matchScore: 95.8,
    vibeType: "organic_groove",
    soundcloudUrl: "https://soundcloud.com/kayan/tracks",
    spotifyVibe: "Organic & Groovy",
    bio: "Kayan is a versatile singer, songwriter, and DJ. Her music is a soulful cocktail of silky modern R&B, sweet neo-soul chords, and warm electronic groove production."
  },
  {
    id: "GCI_04",
    name: "Dualist Inquiry",
    genre: "INDIETRONICA",
    location: "GOA",
    bpm: 112,
    tags: ["SYNTHWAVE", "INDIETRONICA", "DREAM-POP"],
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400",
    trackName: "Elysium Fields",
    matchScore: 96.5,
    vibeType: "indie_dream",
    soundcloudUrl: "https://soundcloud.com/dualistinquiry/tracks",
    spotifyVibe: "Dreamy Indietronica",
    bio: "Merging organic guitar hooks with retro synthwave pads and driving electronic beats, Dualist Inquiry creates anthemic, beautiful indietronica vibes from his beachside studio."
  },
  {
    id: "GCI_05",
    name: "Lifafa",
    genre: "BREAKS / JUNGLE",
    location: "DELHI",
    bpm: 126,
    tags: ["D&B", "JUNGLE", "UK-GARAGE"],
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400",
    trackName: "Irfaan Breakbeat",
    matchScore: 94.2,
    vibeType: "heavy_breaks",
    soundcloudUrl: "https://soundcloud.com/lifafa/tracks",
    spotifyVibe: "High-Octane Breaks",
    bio: "Exploring the intersections of high-speed broken beats, Hindi vocal textures, and vintage synth chords, Lifafa brings a distinctively regional and high-octane flavor to the floor."
  }
];

export const MOCK_TERMINAL_LOGS: Record<string, string[]> = {
  dark_industrial: [
    "> [ AUTHENTICATING USER WITH SPOTIFY AUTH-API... SUCCESS ]",
    "> [ RETRIEVING USER TASTE PROFILE ENGINE v3.4... ]",
    "> [ ANALYZING PLAYLISTS: 'Late Night Techno', 'Darkwave Rhythms' ]",
    "> [ SPOTIFY VIBE CLASSIFIED: DARK & INDUSTRIAL ]",
    "> [ TARGETING SUB-GENRES: Industrial, Hard-Ware Acid, Berlin Techno ]",
    "> [ FETCHING INDEPENDENT SOUNDCLOUD PORTFOLIOS... ]",
    "> [ COMPILING SOUNDCLOUD WAVEFORM HARMONICS ON DECK... ]",
    "> [ DETECTED MATCH: GCI_02 (ARJUN VAGALE) ]",
    "> [ MATCHING STRENGTH DETERMINED: 97.1% ACCURACY ]",
    "> [ CONNECTING CLIENT AUDIO STAGE... READY TO PLAY ]"
  ],
  organic_groove: [
    "> [ AUTHENTICATING USER WITH SPOTIFY AUTH-API... SUCCESS ]",
    "> [ RETRIEVING USER TASTE PROFILE ENGINE v3.4... ]",
    "> [ ANALYZING PLAYLISTS: 'Sunday Soul Chillout', '90s Neo-Soul Grooves' ]",
    "> [ SPOTIFY VIBE CLASSIFIED: ORGANIC & GROOVY ]",
    "> [ TARGETING SUB-GENRES: Silky R&B, Live Funk-Bass, Laid-back Soul ]",
    "> [ FETCHING INDEPENDENT SOUNDCLOUD PORTFOLIOS... ]",
    "> [ COMPILING SOUNDCLOUD WAVEFORM HARMONICS ON DECK... ]",
    "> [ DETECTED MATCH: GCI_03 (KAYAN) ]",
    "> [ MATCHING STRENGTH DETERMINED: 95.8% ACCURACY ]",
    "> [ CONNECTING CLIENT AUDIO STAGE... READY TO PLAY ]"
  ],
  cinematic_glitch: [
    "> [ AUTHENTICATING USER WITH SPOTIFY AUTH-API... SUCCESS ]",
    "> [ RETRIEVING USER TASTE PROFILE ENGINE v3.4... ]",
    "> [ ANALYZING PLAYLISTS: 'Acoustic Glitch', 'Cinematic Soundscapes v4' ]",
    "> [ SPOTIFY VIBE CLASSIFIED: AMBIENT GLITCH & BEATS ]",
    "> [ TARGETING SUB-GENRES: Future Bass, IDM, Organic Textural Beats ]",
    "> [ FETCHING INDEPENDENT SOUNDCLOUD PORTFOLIOS... ]",
    "> [ COMPILING SOUNDCLOUD WAVEFORM HARMONICS ON DECK... ]",
    "> [ DETECTED MATCH: GCI_01 (SANDUNES) ]",
    "> [ MATCHING STRENGTH DETERMINED: 98.4% ACCURACY ]",
    "> [ CONNECTING CLIENT AUDIO STAGE... READY TO PLAY ]"
  ],
  indie_dream: [
    "> [ AUTHENTICATING USER WITH SPOTIFY AUTH-API... SUCCESS ]",
    "> [ RETRIEVING USER TASTE PROFILE ENGINE v3.4... ]",
    "> [ ANALYZING PLAYLISTS: 'Shoegaze Dreams', 'Retro Dreamwave Synths' ]",
    "> [ SPOTIFY VIBE CLASSIFIED: DREAMY INDIETRONICA ]",
    "> [ TARGETING SUB-GENRES: Indie-Guitar, Melodic Synthwave, Ethereal Pop ]",
    "> [ FETCHING INDEPENDENT SOUNDCLOUD PORTFOLIOS... ]",
    "> [ COMPILING SOUNDCLOUD WAVEFORM HARMONICS ON DECK... ]",
    "> [ DETECTED MATCH: GCI_04 (DUALIST INQUIRY) ]",
    "> [ MATCHING STRENGTH DETERMINED: 96.5% ACCURACY ]",
    "> [ CONNECTING CLIENT AUDIO STAGE... READY TO PLAY ]"
  ],
  heavy_breaks: [
    "> [ AUTHENTICATING USER WITH SPOTIFY AUTH-API... SUCCESS ]",
    "> [ RETRIEVING USER TASTE PROFILE ENGINE v3.4... ]",
    "> [ ANALYZING PLAYLISTS: 'Jungle Warfare', 'UK Bassline & Garage' ]",
    "> [ SPOTIFY VIBE CLASSIFIED: HIGH-OCTANE BREAKS ]",
    "> [ TARGETING SUB-GENRES: Drum & Bass, UK Garage, Hard Breakbeats ]",
    "> [ FETCHING INDEPENDENT SOUNDCLOUD PORTFOLIOS... ]",
    "> [ COMPILING SOUNDCLOUD WAVEFORM HARMONICS ON DECK... ]",
    "> [ DETECTED MATCH: GCI_05 (LIFAFA) ]",
    "> [ MATCHING STRENGTH DETERMINED: 94.2% ACCURACY ]",
    "> [ CONNECTING CLIENT AUDIO STAGE... READY TO PLAY ]"
  ]
};
