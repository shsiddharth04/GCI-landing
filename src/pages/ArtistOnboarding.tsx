import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, ArrowLeft, Upload, Music, CheckCircle2,
  AlertCircle, Camera, X, Plus,
} from "lucide-react";
import { supabase } from "../lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const GENRE_OPTIONS = [
  "Indie", "Electronic", "Jazz", "Hip-Hop", "Ambient", "Classical",
  "Classical Fusion", "Folk", "Pop", "R&B", "Experimental", "Reggae",
  "Techno", "House", "Metal", "Soul", "Blues", "Fusion", "World Music",
];

const VIBE_OPTIONS = [
  "Late Night", "Festival Energy", "Introspective", "Dance Floor",
  "Chill", "Raw & Live", "Acoustic", "High Energy", "Cinematic",
  "Psychedelic", "Minimal", "Spiritual",
];

const CITY_OPTIONS = [
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune",
  "Kolkata", "Goa", "Ahmedabad", "Jaipur", "Chandigarh", "Kochi",
  "Indore", "Surat", "Bhopal", "Vadodara",
];

const EVENT_TYPE_OPTIONS = [
  "Private Party", "Corporate Event", "College Fest", "Club Night",
  "Festival", "Open Mic", "Wedding", "House Concert", "Rooftop",
  "Art Exhibition", "Brand Activation", "Theatre",
];

const SET_DURATION_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
  { label: "2 hrs", value: 120 },
];

// ─── HEIC → JPEG conversion ───────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  displayName: string;
  stageName: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  bio: string;
  genres: string[];
  vibeTags: string[];
  soundcloudUrl: string;
  soundcloudPlaylistUrl: string;
  location: string;
  performanceCities: string[];
  baseRate: string;
  setDurations: number[];
  eventTypes: string[];
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ label, selected, onClick }: { key?: string | number; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-sm font-semibold border transition-all duration-150 cursor-pointer ${
        selected
          ? "bg-[#CBA6F7]/20 border-[#CBA6F7] text-[#CBA6F7] shadow-[0_0_10px_rgba(203,166,247,0.2)]"
          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "60px" : "-60px", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? "60px" : "-60px", opacity: 0 }),
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ArtistOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<OnboardingData>({
    displayName: "",
    stageName: "",
    avatarFile: null,
    avatarPreview: null,
    bio: "",
    genres: [],
    vibeTags: [],
    soundcloudUrl: "",
    soundcloudPlaylistUrl: "",
    location: "",
    performanceCities: [],
    baseRate: "",
    setDurations: [],
    eventTypes: [],
  });

  const [customCity, setCustomCity] = useState("");

  // Pre-populate from existing DB data
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?role=artist"); return; }
      setUserId(session.user.id);

      const { data: existing } = await supabase
        .from("artists")
        .select("*, profiles(full_name, avatar_url)")
        .eq("id", session.user.id)
        .single();

      if (existing) {
        const a = existing as Record<string, unknown> & { profiles?: { full_name?: string; avatar_url?: string } };
        setIsEditing(!!(a.onboarding_complete));
        setData({
          displayName: (a.profiles?.full_name as string) || (session.user.user_metadata?.full_name as string) || "",
          stageName: (a.stage_name as string) || "",
          avatarFile: null,
          avatarPreview: (a.avatar_url as string) || (a.profiles?.avatar_url as string) || null,
          bio: (a.bio as string) || "",
          genres: (a.genres as string[]) || [],
          vibeTags: (a.vibe_tags as string[]) || [],
          soundcloudUrl: (a.soundcloud_url as string) || "",
          soundcloudPlaylistUrl: (a.soundcloud_playlist_url as string) || "",
          location: (a.location as string) || "",
          performanceCities: (a.performance_cities as string[]) || [],
          baseRate: a.base_rate != null ? String(a.base_rate) : "",
          setDurations: (a.set_durations as number[]) || [],
          eventTypes: (a.event_types as string[]) || [],
        });
      } else {
        setData((prev) => ({
          ...prev,
          displayName: (session.user.user_metadata?.full_name as string) || "",
        }));
      }
    };
    init();
  }, [navigate]);

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const toggleItem = <K extends keyof OnboardingData>(key: K, item: string) => {
    const arr = data[key] as string[];
    set(key, (arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]) as OnboardingData[K]);
  };

  const toggleDuration = (val: number) => {
    set("setDurations", data.setDurations.includes(val)
      ? data.setDurations.filter((d) => d !== val)
      : [...data.setDurations, val]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    const file = await normalizeImage(raw);
    set("avatarFile", file);
    set("avatarPreview", URL.createObjectURL(file));
  };

  const goNext = () => { setDirection(1); setStep((s) => s + 1); setError(null); };
  const goBack = () => { setDirection(-1); setStep((s) => s - 1); setError(null); };

  const saveStep = async (stepIndex: number) => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      if (stepIndex === 0) {
        let avatarUrl: string | null = null;
        if (data.avatarFile) {
          const ext = data.avatarFile.name.split(".").pop() || "jpg";
          const path = `artists/${userId}.${ext}`;
          const { error: upErr } = await supabase.storage.from("avatars").upload(path, data.avatarFile, { upsert: true });
          if (!upErr) {
            avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
          }
        }
        await supabase.from("profiles").update({
          full_name: data.displayName,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        }).eq("id", userId);
        await supabase.from("artists").update({
          stage_name: data.stageName || null,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        }).eq("id", userId);
      } else if (stepIndex === 1) {
        await supabase.from("artists").update({
          bio: data.bio || null,
          genres: data.genres,
          vibe_tags: data.vibeTags,
        }).eq("id", userId);
      } else if (stepIndex === 2) {
        await supabase.from("artists").update({
          soundcloud_url: data.soundcloudUrl || null,
          soundcloud_playlist_url: data.soundcloudPlaylistUrl || null,
        }).eq("id", userId);
      } else if (stepIndex === 3) {
        await supabase.from("artists").update({
          location: data.location || null,
          performance_cities: data.performanceCities,
        }).eq("id", userId);
      } else if (stepIndex === 4) {
        await supabase.from("artists").update({
          base_rate: data.baseRate ? Number(data.baseRate) : null,
          set_durations: data.setDurations,
          event_types: data.eventTypes,
          onboarding_complete: true,
        }).eq("id", userId);
      }
      goNext();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const TOTAL_STEPS = 5;
  const isDone = step === TOTAL_STEPS;

  return (
    <div className="min-h-screen bg-[#070708] text-white antialiased flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#CBA6F7]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-purple-700/6 rounded-full blur-[100px]" />
      </div>

      <header className="relative z-10 px-6 py-6 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-[#CBA6F7]/10 p-2 rounded-xl border border-[#CBA6F7]/20">
            <Music className="h-4 w-4 text-[#CBA6F7]" />
          </div>
          <span className="font-black text-sm uppercase tracking-tight">
            Gig Culture <span className="text-[#CBA6F7]">India</span>
          </span>
        </div>
        {!isDone && (
          <span className="text-zinc-500 text-sm font-medium">Step {step + 1} of {TOTAL_STEPS}</span>
        )}
      </header>

      {!isDone && (
        <div className="relative z-10 w-full max-w-2xl mx-auto px-6 mb-8">
          <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#CBA6F7] to-purple-400 rounded-full"
              animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex items-start justify-center px-4 pb-16 relative z-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {step === 0 && <StepIdentity data={data} isEditing={isEditing} onNameChange={(v) => set("displayName", v)} onStageNameChange={(v) => set("stageName", v)} onFileSelect={handleFileSelect} fileInputRef={fileInputRef} onRemovePhoto={() => { set("avatarFile", null); set("avatarPreview", null); }} error={error} saving={saving} onContinue={() => saveStep(0)} />}
              {step === 1 && <StepSound data={data} onBioChange={(v) => set("bio", v)} onGenreToggle={(g) => toggleItem("genres", g)} onVibeToggle={(v) => toggleItem("vibeTags", v)} error={error} saving={saving} onBack={goBack} onContinue={() => saveStep(1)} />}
              {step === 2 && <StepSoundCloud data={data} onUrlChange={(v) => set("soundcloudUrl", v)} onPlaylistChange={(v) => set("soundcloudPlaylistUrl", v)} error={error} saving={saving} onBack={goBack} onContinue={() => saveStep(2)} />}
              {step === 3 && <StepLocation data={data} customCity={customCity} onLocationChange={(v) => set("location", v)} onCityToggle={(c) => toggleItem("performanceCities", c)} onCustomCityChange={setCustomCity} onAddCustomCity={() => { const c = customCity.trim(); if (c && !data.performanceCities.includes(c)) set("performanceCities", [...data.performanceCities, c]); setCustomCity(""); }} onRemoveCity={(c) => set("performanceCities", data.performanceCities.filter((x) => x !== c))} error={error} saving={saving} onBack={goBack} onContinue={() => saveStep(3)} />}
              {step === 4 && <StepBooking data={data} onRateChange={(v) => set("baseRate", v)} onDurationToggle={toggleDuration} onEventTypeToggle={(et) => toggleItem("eventTypes", et)} error={error} saving={saving} onBack={goBack} onContinue={() => saveStep(4)} isEditing={isEditing} />}
              {isDone && <StepDone name={data.stageName || data.displayName} isEditing={isEditing} onGoToDashboard={() => navigate("/dashboard/artist")} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Identity ─────────────────────────────────────────────────────────

function StepIdentity({ data, isEditing, onNameChange, onStageNameChange, onFileSelect, fileInputRef, onRemovePhoto, error, saving, onContinue }: {
  data: OnboardingData; isEditing: boolean;
  onNameChange: (v: string) => void; onStageNameChange: (v: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onRemovePhoto: () => void; error: string | null; saving: boolean; onContinue: () => void;
}) {
  return (
    <StepShell heading={isEditing ? "Update your profile." : "Make your entrance."} sub={isEditing ? "Your saved info is pre-filled — change only what you need." : "You're one step away from being discovered by event hosts across India."} error={error} saving={saving} onContinue={onContinue} continueLabel="Continue" canContinue={!!data.displayName.trim()}>
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="relative">
          {data.avatarPreview ? (
            <div className="relative w-28 h-28 rounded-full overflow-hidden ring-2 ring-[#CBA6F7]/40">
              <img src={data.avatarPreview} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={onRemovePhoto} className="absolute top-1 right-1 p-1 bg-black/70 rounded-full cursor-pointer">
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-[#CBA6F7]/50 flex flex-col items-center justify-center gap-1.5 text-zinc-500 hover:text-[#CBA6F7] transition-colors cursor-pointer">
              <Camera className="h-6 w-6" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Photo</span>
            </button>
          )}
          {!data.avatarPreview && (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#CBA6F7] rounded-full flex items-center justify-center shadow-lg cursor-pointer">
              <Upload className="h-3.5 w-3.5 text-black" />
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">Profile photo · shown on your artist card</p>
        <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" onChange={onFileSelect} className="hidden" />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">Full Name</label>
          <input type="text" value={data.displayName} onChange={(e) => onNameChange(e.target.value)} placeholder="Your legal name" className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 transition-colors text-base" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5">Stage Name <span className="text-zinc-600 font-normal normal-case tracking-normal">· shown publicly on your profile</span></label>
          <input type="text" value={data.stageName} onChange={(e) => onStageNameChange(e.target.value)} placeholder="e.g. Sandunes, BLOT!, Nicholson" className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 transition-colors text-base" />
          <p className="text-xs text-zinc-600 mt-1.5">Leave blank to use your full name.</p>
        </div>
      </div>
    </StepShell>
  );
}

// ─── Step 2: Sound & Vibe ─────────────────────────────────────────────────────

function StepSound({ data, onBioChange, onGenreToggle, onVibeToggle, error, saving, onBack, onContinue }: {
  data: OnboardingData; onBioChange: (v: string) => void;
  onGenreToggle: (g: string) => void; onVibeToggle: (v: string) => void;
  error: string | null; saving: boolean; onBack: () => void; onContinue: () => void;
}) {
  return (
    <StepShell heading="What's your sound?" sub="This is how hosts discover you. Pick what actually fits." error={error} saving={saving} onContinue={onContinue} onBack={onBack} continueLabel="Continue" canContinue={data.genres.length > 0}>
      <div className="flex flex-col gap-7">
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-3">Genres <span className="text-[#CBA6F7]">*</span></label>
          <div className="flex flex-wrap gap-2">{GENRE_OPTIONS.map((g) => <Chip key={g} label={g} selected={data.genres.includes(g)} onClick={() => onGenreToggle(g)} />)}</div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-3">Vibe tags <span className="text-zinc-600 font-normal normal-case tracking-normal">· optional</span></label>
          <div className="flex flex-wrap gap-2">{VIBE_OPTIONS.map((v) => <Chip key={v} label={v} selected={data.vibeTags.includes(v)} onClick={() => onVibeToggle(v)} />)}</div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">Bio <span className="text-zinc-600 font-normal normal-case tracking-normal">· optional</span></label>
          <textarea value={data.bio} onChange={(e) => onBioChange(e.target.value)} placeholder="Describe your sound in a few sentences..." rows={3} className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 transition-colors resize-none text-sm leading-relaxed" />
        </div>
      </div>
    </StepShell>
  );
}

// ─── Step 3: SoundCloud ───────────────────────────────────────────────────────

function StepSoundCloud({ data, onUrlChange, onPlaylistChange, error, saving, onBack, onContinue }: {
  data: OnboardingData; onUrlChange: (v: string) => void; onPlaylistChange: (v: string) => void;
  error: string | null; saving: boolean; onBack: () => void; onContinue: () => void;
}) {
  return (
    <StepShell heading="Link your music." sub="Our AI analyzes your SoundCloud to match you with hosts whose events fit your sound." error={error} saving={saving} onContinue={onContinue} onBack={onBack} continueLabel="Continue" canContinue={true}>
      <div className="flex flex-col gap-6">
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">SoundCloud profile URL</label>
          <input type="url" value={data.soundcloudUrl} onChange={(e) => onUrlChange(e.target.value)} placeholder="https://soundcloud.com/yourname" className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 transition-colors text-sm" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5">Best playlist or set <span className="text-zinc-600 font-normal normal-case tracking-normal">· optional but recommended</span></label>
          <p className="text-xs text-zinc-600 mb-2">Paste a SoundCloud playlist or set link — it plays directly on your profile for hosts to hear.</p>
          <input type="url" value={data.soundcloudPlaylistUrl} onChange={(e) => onPlaylistChange(e.target.value)} placeholder="https://soundcloud.com/yourname/sets/your-set" className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 transition-colors text-sm" />
        </div>
        {data.soundcloudUrl && (
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl">
            <CheckCircle2 className="h-4 w-4 text-[#CBA6F7] shrink-0" />
            <p className="text-sm text-zinc-400">URL saved — your SoundCloud will be embedded on your artist profile.</p>
          </div>
        )}
      </div>
    </StepShell>
  );
}

// ─── Step 4: Location ─────────────────────────────────────────────────────────

function StepLocation({ data, customCity, onLocationChange, onCityToggle, onCustomCityChange, onAddCustomCity, onRemoveCity, error, saving, onBack, onContinue }: {
  data: OnboardingData; customCity: string;
  onLocationChange: (v: string) => void; onCityToggle: (c: string) => void;
  onCustomCityChange: (v: string) => void; onAddCustomCity: () => void;
  onRemoveCity: (c: string) => void; error: string | null; saving: boolean;
  onBack: () => void; onContinue: () => void;
}) {
  return (
    <StepShell heading="Where's your stage?" sub="Hosts search by city. More cities = more opportunities." error={error} saving={saving} onContinue={onContinue} onBack={onBack} continueLabel="Continue" canContinue={!!data.location.trim()}>
      <div className="flex flex-col gap-6">
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">Home city <span className="text-[#CBA6F7]">*</span></label>
          <input type="text" value={data.location} onChange={(e) => onLocationChange(e.target.value)} placeholder="e.g. Mumbai" className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 transition-colors text-sm" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-3">Cities you perform in</label>
          <div className="flex flex-wrap gap-2 mb-3">{CITY_OPTIONS.map((c) => <Chip key={c} label={c} selected={data.performanceCities.includes(c)} onClick={() => onCityToggle(c)} />)}</div>
          <div className="flex gap-2 mt-2">
            <input type="text" value={customCity} onChange={(e) => onCustomCityChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAddCustomCity(); } }} placeholder="Add another city..." className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3 text-white placeholder-zinc-600 transition-colors text-sm" />
            <button type="button" onClick={onAddCustomCity} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 transition-colors cursor-pointer"><Plus className="h-4 w-4" /></button>
          </div>
          {data.performanceCities.filter((c) => !CITY_OPTIONS.includes(c)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {data.performanceCities.filter((c) => !CITY_OPTIONS.includes(c)).map((c) => (
                <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CBA6F7]/10 border border-[#CBA6F7]/25 text-[#CBA6F7] text-sm rounded-full font-medium">
                  {c}<button type="button" onClick={() => onRemoveCity(c)} className="cursor-pointer"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </StepShell>
  );
}

// ─── Step 5: Booking ──────────────────────────────────────────────────────────

function StepBooking({ data, onRateChange, onDurationToggle, onEventTypeToggle, error, saving, onBack, onContinue, isEditing }: {
  data: OnboardingData; onRateChange: (v: string) => void;
  onDurationToggle: (v: number) => void; onEventTypeToggle: (et: string) => void;
  error: string | null; saving: boolean; onBack: () => void; onContinue: () => void; isEditing: boolean;
}) {
  return (
    <StepShell heading="Set your terms." sub="You're in control. These are starting points — everything is negotiated per booking." error={error} saving={saving} onContinue={onContinue} onBack={onBack} continueLabel={isEditing ? "Save Changes →" : "Go Live →"} canContinue={true}>
      <div className="flex flex-col gap-7">
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">Base rate per show <span className="text-zinc-600 font-normal normal-case tracking-normal">· optional</span></label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">₹</span>
            <input type="number" value={data.baseRate} onChange={(e) => onRateChange(e.target.value)} placeholder="15000" className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl pl-8 pr-4 py-3.5 text-white placeholder-zinc-600 transition-colors text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-3">Set durations you offer</label>
          <div className="flex flex-wrap gap-2">{SET_DURATION_OPTIONS.map(({ label, value }) => <Chip key={value} label={label} selected={data.setDurations.includes(value)} onClick={() => onDurationToggle(value)} />)}</div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-3">Event types you're available for</label>
          <div className="flex flex-wrap gap-2">{EVENT_TYPE_OPTIONS.map((et) => <Chip key={et} label={et} selected={data.eventTypes.includes(et)} onClick={() => onEventTypeToggle(et)} />)}</div>
        </div>
      </div>
    </StepShell>
  );
}

// ─── Done ─────────────────────────────────────────────────────────────────────

function StepDone({ name, isEditing, onGoToDashboard }: { name: string; isEditing: boolean; onGoToDashboard: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4 gap-8">
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="w-20 h-20 bg-[#CBA6F7]/15 border border-[#CBA6F7]/30 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(203,166,247,0.3)]">
        <CheckCircle2 className="h-10 w-10 text-[#CBA6F7]" />
      </motion.div>
      <div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl font-black text-white tracking-tight mb-3">
          {isEditing ? "Profile updated." : `You're live${name ? `, ${name.split(" ")[0]}` : ""}.`}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-zinc-400 text-base leading-relaxed max-w-sm">
          {isEditing ? "Your changes are saved and live on your public profile." : "Your profile is on Gig Culture India. Event hosts are being matched with artists like you right now."}
        </motion.p>
      </div>
      <motion.button onClick={onGoToDashboard} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-8 py-4 bg-[#CBA6F7] hover:bg-[#b58ce6] text-black font-black text-base rounded-2xl shadow-[0_4px_24px_rgba(203,166,247,0.4)] transition-all duration-300 flex items-center gap-2 cursor-pointer">
        Go to Dashboard <ArrowRight className="h-5 w-5" />
      </motion.button>
    </div>
  );
}

// ─── Shared shell ─────────────────────────────────────────────────────────────

function StepShell({ heading, sub, children, error, saving, onContinue, onBack, continueLabel, canContinue }: {
  heading: string; sub: string; children: React.ReactNode;
  error: string | null; saving: boolean; onContinue: () => void;
  onBack?: () => void; continueLabel: string; canContinue: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight leading-tight mb-2">{heading}</h2>
        <p className="text-zinc-400 text-base leading-relaxed">{sub}</p>
      </div>
      <div>{children}</div>
      {error && (
        <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}
      <div className="flex items-center gap-3 pt-2">
        {onBack && (
          <button type="button" onClick={onBack} className="flex items-center gap-2 px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-semibold text-sm rounded-2xl transition-colors cursor-pointer">
            <ArrowLeft className="h-4 w-4" />Back
          </button>
        )}
        <motion.button type="button" onClick={onContinue} disabled={saving || !canContinue} whileHover={saving || !canContinue ? {} : { scale: 1.02 }} whileTap={saving || !canContinue ? {} : { scale: 0.98 }} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#CBA6F7] hover:bg-[#b58ce6] text-black font-black text-sm rounded-2xl shadow-[0_4px_20px_rgba(203,166,247,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
          {saving ? "Saving..." : continueLabel}
          {!saving && <ArrowRight className="h-4 w-4" />}
        </motion.button>
      </div>
    </div>
  );
}
