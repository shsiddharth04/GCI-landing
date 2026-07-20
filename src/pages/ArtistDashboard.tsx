import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Music, MapPin, IndianRupee, Edit2, ShieldCheck, ExternalLink, LogOut, Trash2, Image, Video, Plus, Eye, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { ArtistWithProfile, ArtistMedia, getDisplayName } from "../types/dashboard";

async function normalizeImage(file: File): Promise<File> {
  const name = file.name.toLowerCase();
  const isHeic = file.type === "image/heic" || file.type === "image/heif" ||
    name.endsWith(".heic") || name.endsWith(".heif");
  if (!isHeic) return file;
  try {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    const blob = Array.isArray(result) ? result[0] : result;
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function AvatarPlaceholder({ name }: { name: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || "A";
  const colors = ["from-purple-600 to-[#CBA6F7]", "from-blue-600 to-purple-500", "from-pink-600 to-purple-500", "from-indigo-600 to-blue-400"];
  const color = colors[initial.charCodeAt(0) % colors.length];
  return (
    <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}>
      <span className="text-3xl font-black text-white/90">{initial}</span>
    </div>
  );
}

export default function ArtistDashboard() {
  const navigate = useNavigate();
  const [artist, setArtist] = useState<ArtistWithProfile | null>(null);
  const [media, setMedia] = useState<ArtistMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data } = await supabase
        .from("artists")
        .select("*, profiles(full_name, avatar_url)")
        .eq("id", session.user.id)
        .single();

      if (!data) { navigate("/onboarding/artist"); return; }
      if (!(data as unknown as ArtistWithProfile).onboarding_complete) {
        navigate("/onboarding/artist"); return;
      }

      const a = data as unknown as ArtistWithProfile;
      setArtist(a);
      setLoading(false);
      loadMedia(session.user.id);
    };
    init();
  }, [navigate]);

  const loadMedia = async (artistId: string) => {
    const { data } = await supabase.from("artist_media").select("*").eq("artist_id", artistId).order("display_order");
    setMedia((data as ArtistMedia[]) || []);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "video") => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !artist) return;
    setUploading(true);
    setUploadError(null);
    const failed: string[] = [];
    let currentOrder = media.length;
    for (const raw of files) {
      try {
        const file = type === "photo" ? await normalizeImage(raw) : raw;
        const ext = file.name.split(".").pop() || (type === "photo" ? "jpg" : "mp4");
        const path = `${artist.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
        await supabase.from("artist_media").insert({ artist_id: artist.id, url, media_type: type, display_order: currentOrder++ });
      } catch {
        failed.push(raw.name);
      }
    }
    if (failed.length) setUploadError(`Failed to upload: ${failed.join(", ")}`);
    await loadMedia(artist.id);
    setUploading(false);
    e.target.value = "";
  };

  const handleDeleteMedia = async (item: ArtistMedia) => {
    await supabase.from("artist_media").delete().eq("id", item.id);
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070708] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CBA6F7]/30 border-t-[#CBA6F7] rounded-full animate-spin" />
      </div>
    );
  }

  if (!artist) return null;

  const name = getDisplayName(artist);
  const photo = artist.avatar_url || artist.profiles?.avatar_url;

  return (
    <div className="min-h-screen bg-[#070708] text-white antialiased">
      {/* Ambient */}
      <div className="fixed top-1/4 left-[-200px] w-[500px] h-[500px] bg-[#CBA6F7]/5 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-[-200px] w-[400px] h-[400px] bg-purple-700/6 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-900 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-[#CBA6F7]/10 p-2 rounded-xl border border-[#CBA6F7]/20">
              <Music className="h-4 w-4 text-[#CBA6F7]" />
            </div>
            <span className="font-black text-sm uppercase tracking-tight">
              Gig Culture <span className="text-[#CBA6F7]">India</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open(`/artist/${artist?.id}`, "_blank")}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#CBA6F7]/10 border border-[#CBA6F7]/30 hover:bg-[#CBA6F7]/20 text-[#CBA6F7] text-xs font-semibold rounded-full transition-colors cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview Profile
            </button>
            <button
              onClick={() => navigate("/onboarding/artist")}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold rounded-full transition-colors cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Profile
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-4 py-2 text-zinc-500 hover:text-white text-xs font-medium rounded-full transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-zinc-500 text-sm mb-1">Welcome back</p>
          <h1 className="text-4xl font-black text-white tracking-tight">{name}</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Profile card preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl overflow-hidden">
              {/* Photo */}
              <div className="relative w-full aspect-[4/3] bg-zinc-900">
                {photo ? (
                  <img src={photo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <AvatarPlaceholder name={name} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-md border border-[#CBA6F7]/30 rounded-full">
                    <ShieldCheck className="h-3 w-3 text-[#CBA6F7]" />
                    <span className="text-[10px] font-bold text-[#CBA6F7] uppercase tracking-wider">Live</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex flex-col gap-3">
                <h3 className="text-white font-extrabold text-lg">{name}</h3>
                {artist.location && (
                  <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    {artist.location}
                  </div>
                )}
                {(artist.genres || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {artist.genres.slice(0, 3).map((g) => (
                      <span key={g} className="px-2.5 py-1 bg-[#CBA6F7]/10 border border-[#CBA6F7]/20 text-[#CBA6F7] text-[11px] font-semibold rounded-full">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {artist.base_rate != null && (
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
                    <span className="text-zinc-500 text-xs">Base rate</span>
                    <div className="flex items-center gap-0.5 text-white font-black text-sm">
                      <IndianRupee className="h-3 w-3" />
                      {Number(artist.base_rate).toLocaleString("en-IN")}
                    </div>
                  </div>
                )}
                {artist.soundcloud_url && (
                  <a
                    href={artist.soundcloud_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-orange-400 text-xs font-semibold hover:text-orange-300 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View on SoundCloud
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            {/* Booking requests */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white font-extrabold text-xl">Booking Requests</h2>
                  <p className="text-zinc-500 text-sm mt-0.5">Hosts who want to book you will appear here.</p>
                </div>
                <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-semibold rounded-full">
                  Coming soon
                </span>
              </div>
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4">
                  <Music className="h-6 w-6 text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                  Your profile is live. When a host matches with you and requests a booking, it'll show up here.
                </p>
              </div>
            </div>

            {/* Media upload */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-white font-extrabold text-xl">Media</h2>
                  <p className="text-zinc-500 text-sm mt-0.5">Photos and videos from your sets, shown on your artist profile.</p>
                </div>
              </div>

              {/* Upload buttons */}
              <div className="flex gap-2 mt-5 mb-6">
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded-full transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Image className="h-3.5 w-3.5" />
                  {uploading ? "Uploading..." : "Add Photos"}
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded-full transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Video className="h-3.5 w-3.5" />
                  {uploading ? "Uploading..." : "Add Videos"}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(e) => handleMediaUpload(e, "photo")} />
                <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/avi" multiple className="hidden" onChange={(e) => handleMediaUpload(e, "video")} />
              </div>

              {uploadError && (
                <div className="flex items-start gap-2 mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{uploadError}</span>
                  <button onClick={() => setUploadError(null)} className="ml-auto shrink-0 hover:text-red-300 cursor-pointer">✕</button>
                </div>
              )}

              {media.length === 0 ? (
                <div
                  className="border-2 border-dashed border-zinc-800 rounded-2xl py-12 flex flex-col items-center gap-3 text-zinc-600 cursor-pointer hover:border-zinc-700 transition-colors"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Plus className="h-8 w-8" />
                  <p className="text-sm font-medium">Upload photos or videos from your sets</p>
                  <p className="text-xs">JPG, PNG, HEIC · MP4, MOV, WEBM · up to 500MB per file</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {media.map((item) => (
                    <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                      {item.media_type === "photo" ? (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.url} className="w-full h-full object-cover" preload="metadata" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteMedia(item)}
                          className="opacity-0 group-hover:opacity-100 p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-white" />
                        </button>
                      </div>
                      {item.media_type === "video" && (
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white font-medium">
                          VIDEO
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile tips */}
            {(!artist.soundcloud_url || !artist.bio || !artist.base_rate) && (
              <div className="bg-[#CBA6F7]/5 border border-[#CBA6F7]/20 rounded-3xl p-6">
                <p className="text-[#CBA6F7] font-bold text-sm mb-3">Complete your profile for more visibility</p>
                <div className="flex flex-col gap-2">
                  {!artist.soundcloud_url && (
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                      Add your SoundCloud — hosts need to hear you
                    </div>
                  )}
                  {!artist.bio && (
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                      Write a bio to tell hosts your story
                    </div>
                  )}
                  {!artist.base_rate && (
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                      Set a base rate so hosts know your range
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate("/onboarding/artist")}
                  className="mt-4 px-4 py-2 bg-[#CBA6F7] text-black font-bold text-xs rounded-full hover:bg-[#b58ce6] transition-colors cursor-pointer"
                >
                  Complete Profile
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
