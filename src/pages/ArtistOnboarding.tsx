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

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  displayName: string;
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

// ─── Chip component ───────────────────────────────────────────────────────────

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

// ─── Step slide variants ──────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "60px" : "-60px", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? "60px" : "-60px", opacity: 0 }),
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function ArtistOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<OnboardingData>({
    displayName: "",
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth?role=artist"); return; }
      setUserId(session.user.id);
      setData((prev) => ({
        ...prev,
        displayName: session.user.user_metadata?.full_name || "",
      }));
    });
  }, [navigate]);

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const toggleItem = <K extends keyof OnboardingData>(key: K, item: string) => {
    const arr = (data[key] as string[]);
    set(key, (arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]) as OnboardingData[K]);
  };

  const toggleDuration = (val: number) => {
    set("setDurations", data.setDurations.includes(val)
      ? data.setDurations.filter((d) => d !== val)
      : [...data.setDurations, val]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        // Upload avatar if selected
        let avatarUrl: string | null = null;
        if (data.avatarFile) {
          const ext = data.avatarFile.name.split(".").pop();
          const path = `artists/${userId}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, data.avatarFile, { upsert: true });
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
            avatarUrl = urlData.publicUrl;
          }
        }
        const updates: Record<string, unknown> = {};
        if (avatarUrl) updates.avatar_url = avatarUrl;
        if (Object.keys(updates).length > 0) {
          await supabase.from("artists").update(updates).eq("id", userId);
          await supabase.from("profiles").update({ full_name: data.displayName, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) }).eq("id", userId);
        } else {
          await supabase.from("profiles").update({ full_name: data.displayName }).eq("id", userId);
        }
      } else if (stepIndex === 1) {
        await supabase.from("artists").update({ bio: data.bio, genres: data.genres, vibe_tags: data.vibeTags }).eq("id", userId);
      } else if (stepIndex === 2) {
        await supabase.from("artists").update({ soundcloud_url: data.soundcloudUrl || null, soundcloud_playlist_url: data.soundcloudPlaylistUrl || null }).eq("id", userId);
      } else if (stepIndex === 3) {
        await supabase.from("artists").update({ location: data.location, performance_cities: data.performanceCities }).eq("id", userId);
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
      setError("Something went wrong saving your info. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const TOTAL_STEPS = 5;
  const isLastDataStep = step === TOTAL_STEPS - 1;
  const isDone = step === TOTAL_STEPS;

  return (
    <div className="min-h-screen bg-[#070708] text-white antialiased flex flex-col">
      {/* Ambient */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#CBA6F7]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-purple-700/6 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-[#CBA6F7]/10 p-2 rounded-xl border border-[#CBA6F7]/20">
            <Music className="h-4 w-4 text-[#CBA6F7]" />
          </div>
          <span className="font-black text-sm uppercase tracking-tight text-white">
            Gig Culture <span className="text-[#CBA6F7]">India</span>
          </span>
        </div>
        {!isDone && (
          <span className="text-zinc-500 text-sm font-medium">
            Step {step + 1} of {TOTAL_STEPS}
          </span>
        )}
      </header>

      {/* Progress bar */}
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

      {/* Step content */}
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
              {step === 0 && (
                <StepIdentity
                  data={data}
                  onNameChange={(v) => set("displayName", v)}
                  onFileSelect={handleFileSelect}
                  fileInputRef={fileInputRef}
                  onRemovePhoto={() => { set("avatarFile", null); set("avatarPreview", null); }}
                  error={error}
                  saving={saving}
                  onContinue={() => saveStep(0)}
                />
              )}
              {step === 1 && (
                <StepSound
                  data={data}
                  onBioChange={(v) => set("bio", v)}
                  onGenreToggle={(g) => toggleItem("genres", g)}
                  onVibeToggle={(v) => toggleItem("vibeTags", v)}
                  error={error}
                  saving={saving}
                  onBack={goBack}
                  onContinue={() => saveStep(1)}
                />
              )}
              {step === 2 && (
                <StepSoundCloud
                  data={data}
                  onUrlChange={(v) => set("soundcloudUrl", v)}
                  onPlaylistChange={(v) => set("soundcloudPlaylistUrl", v)}
                  error={error}
                  saving={saving}
                  onBack={goBack}
                  onContinue={() => saveStep(2)}
                />
              )}
              {step === 3 && (
                <StepLocation
                  data={data}
                  customCity={customCity}
                  onLocationChange={(v) => set("location", v)}
                  onCityToggle={(c) => toggleItem("performanceCities", c)}
                  onCustomCityChange={setCustomCity}
                  onAddCustomCity={() => {
                    const c = customCity.trim();
                    if (c && !data.performanceCities.includes(c)) {
                      set("performanceCities", [...data.performanceCities, c]);
                    }
                    setCustomCity("");
                  }}
                  onRemoveCity={(c) => set("performanceCities", data.performanceCities.filter((x) => x !== c))}
                  error={error}
                  saving={saving}
                  onBack={goBack}
                  onContinue={() => saveStep(3)}
                />
              )}
              {step === 4 && (
                <StepBooking
                  data={data}
                  onRateChange={(v) => set("baseRate", v)}
                  onDurationToggle={toggleDuration}
                  onEventTypeToggle={(et) => toggleItem("eventTypes", et)}
                  error={error}
                  saving={saving}
                  onBack={goBack}
                  onContinue={() => saveStep(4)}
                  isLast={isLastDataStep}
                />
              )}
              {isDone && (
                <StepDone name={data.displayName} onGoToDashboard={() => navigate("/dashboard/artist")} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Identity ─────────────────────────────────────────────────────────

function StepIdentity({ data, onNameChange, onFileSelect, fileInputRef, onRemovePhoto, error, saving, onContinue }: {
  data: OnboardingData;
  onNameChange: (v: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onRemovePhoto: () => void;
  error: string | null;
  saving: boolean;
  onContinue: () => void;
}) {
  return (
    <StepShell
      heading="Make your entrance."
      sub="You're one step away from being discovered by event hosts across India."
      error={error}
      saving={saving}
      onContinue={onContinue}
      continueLabel="Continue"
      canContinue={!!data.displayName.trim()}
    >
      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="relative">
          {data.avatarPreview ? (
            <div className="relative w-28 h-28 rounded-full overflow-hidden ring-2 ring-[#CBA6F7]/40">
              <img src={data.avatarPreview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={onRemovePhoto}
                className="absolute top-1 right-1 p-1 bg-black/70 rounded-full"
              >
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-[#CBA6F7]/50 flex flex-col items-center justify-center gap-1.5 text-zinc-500 hover:text-[#CBA6F7] transition-colors cursor-pointer"
            >
              <Camera className="h-6 w-6" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Photo</span>
            </button>
          )}
          {!data.avatarPreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#CBA6F7] rounded-full flex items-center justify-center shadow-lg cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-black" />
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">Profile photo · optional but recommended</p>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelect} className="hidden" />
      </div>

      {/* Name */}
      <div>
        <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">
          Stage / Artist Name
        </label>
        <input
          type="text"
          value={data.displayName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Your name or alias"
          className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 transition-colors text-base"
        />
      </div>
    </StepShell>
  );
}

// ─── Step 2: Sound & Vibe ─────────────────────────────────────────────────────

function StepSound({ data, onBioChange, onGenreToggle, onVibeToggle, error, saving, onBack, onContinue }: {
  data: OnboardingData;
  onBioChange: (v: string) => void;
  onGenreToggle: (g: string) => void;
  onVibeToggle: (v: string) => void;
  error: string | null;
  saving: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <StepShell
      heading="What's your sound?"
      sub="This is how hosts discover you. Pick what actually fits — not what sounds cool."
      error={error}
      saving={saving}
      onContinue={onContinue}
      onBack={onBack}
      continueLabel="Continue"
      canContinue={data.genres.length > 0}
    >
      <div className="flex flex-col gap-7">
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-3">
            Genres <span className="text-[#CBA6F7]">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRE_OPTIONS.map((g) => (
              <Chip key={g} label={g} selected={data.genres.includes(g)} onClick={() => onGenreToggle(g)} />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-3">
            Vibe tags <span className="text-zinc-600 font-normal normal-case tracking-normal">· optional</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {VIBE_OPTIONS.map((v) => (
              <Chip key={v} label={v} selected={data.vibeTags.includes(v)} onClick={() => onVibeToggle(v)} />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">
            Bio <span className="text-zinc-600 font-normal normal-case tracking-normal">· optional</span>
          </label>
          <textarea
            value={data.bio}
            onChange={(e) => onBioChange(e.target.value)}
            placeholder="Describe your sound in a few sentences..."
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 transition-colors resize-none text-sm leading-relaxed"
          />
        </div>
      </div>
    </StepShell>
  );
}

// ─── Step 3: SoundCloud ───────────────────────────────────────────────────────

function StepSoundCloud({ data, onUrlChange, onPlaylistChange, error, saving, onBack, onContinue }: {
  data: OnboardingData;
  onUrlChange: (v: string) => void;
  onPlaylistChange: (v: string) => void;
  error: string | null;
  saving: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const isValidSCUrl = (url: string) => url.includes("soundcloud.com/");
  const showEmbed = data.soundcloudUrl && isValidSCUrl(data.soundcloudUrl);

  return (
    <StepShell
      heading="Link your music."
      sub="Our AI analyzes your SoundCloud to match you with hosts whose events fit your sound."
      error={error}
      saving={saving}
      onContinue={onContinue}
      onBack={onBack}
      continueLabel="Continue"
      canContinue={true}
    >
      <div className="flex flex-col gap-6">
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">
            SoundCloud profile URL
          </label>
          <input
            type="url"
            value={data.soundcloudUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://soundcloud.com/yourname"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5">
            Best playlist or set <span className="text-zinc-600 font-normal normal-case tracking-normal">· optional but recommended</span>
          </label>
          <p className="text-xs text-zinc-600 mb-2">This plays directly on your profile — make it your best work.</p>
          <input
            type="url"
            value={data.soundcloudPlaylistUrl}
            onChange={(e) => onPlaylistChange(e.target.value)}
            placeholder="https://soundcloud.com/yourname/sets/your-set"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 transition-colors text-sm"
          />
        </div>

        {/* Live preview */}
        {showEmbed && (
          <div>
            <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wider mb-2">Preview</p>
            <div className="rounded-2xl overflow-hidden border border-zinc-800">
              <iframe
                width="100%"
                height="166"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(data.soundcloudUrl)}&color=%23CBA6F7&auto_play=false&hide_related=true&show_comments=false&show_user=true&visual=false`}
                title="SoundCloud preview"
              />
            </div>
          </div>
        )}
      </div>
    </StepShell>
  );
}

// ─── Step 4: Location ─────────────────────────────────────────────────────────

function StepLocation({ data, customCity, onLocationChange, onCityToggle, onCustomCityChange, onAddCustomCity, onRemoveCity, error, saving, onBack, onContinue }: {
  data: OnboardingData;
  customCity: string;
  onLocationChange: (v: string) => void;
  onCityToggle: (c: string) => void;
  onCustomCityChange: (v: string) => void;
  onAddCustomCity: () => void;
  onRemoveCity: (c: string) => void;
  error: string | null;
  saving: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <StepShell
      heading="Where's your stage?"
      sub="Hosts search by city. More cities means more opportunities — add every city you'd perform in."
      error={error}
      saving={saving}
      onContinue={onContinue}
      onBack={onBack}
      continueLabel="Continue"
      canContinue={!!data.location.trim()}
    >
      <div className="flex flex-col gap-6">
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">
            Home city <span className="text-[#CBA6F7]">*</span>
          </label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="e.g. Mumbai"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 transition-colors text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-3">
            Cities you perform in
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {CITY_OPTIONS.map((c) => (
              <Chip key={c} label={c} selected={data.performanceCities.includes(c)} onClick={() => onCityToggle(c)} />
            ))}
          </div>

          {/* Custom city input */}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={customCity}
              onChange={(e) => onCustomCityChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAddCustomCity(); } }}
              placeholder="Add another city..."
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3 text-white placeholder-zinc-600 transition-colors text-sm"
            />
            <button
              type="button"
              onClick={onAddCustomCity}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Selected cities that aren't in the preset list */}
          {data.performanceCities.filter((c) => !CITY_OPTIONS.includes(c)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {data.performanceCities.filter((c) => !CITY_OPTIONS.includes(c)).map((c) => (
                <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CBA6F7]/10 border border-[#CBA6F7]/25 text-[#CBA6F7] text-sm rounded-full font-medium">
                  {c}
                  <button type="button" onClick={() => onRemoveCity(c)} className="cursor-pointer">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </StepShell>
  );
}

// ─── Step 5: Booking terms ────────────────────────────────────────────────────

function StepBooking({ data, onRateChange, onDurationToggle, onEventTypeToggle, error, saving, onBack, onContinue }: {
  data: OnboardingData;
  onRateChange: (v: string) => void;
  onDurationToggle: (v: number) => void;
  onEventTypeToggle: (et: string) => void;
  error: string | null;
  saving: boolean;
  onBack: () => void;
  onContinue: () => void;
  isLast: boolean;
}) {
  return (
    <StepShell
      heading="Set your terms."
      sub="You're in control. These are starting points — everything is negotiated per booking."
      error={error}
      saving={saving}
      onContinue={onContinue}
      onBack={onBack}
      continueLabel="Go Live →"
      canContinue={true}
    >
      <div className="flex flex-col gap-7">
        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">
            Base rate per show <span className="text-zinc-600 font-normal normal-case tracking-normal">· optional</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">₹</span>
            <input
              type="number"
              value={data.baseRate}
              onChange={(e) => onRateChange(e.target.value)}
              placeholder="15000"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl pl-8 pr-4 py-3.5 text-white placeholder-zinc-600 transition-colors text-sm"
            />
          </div>
          <p className="text-xs text-zinc-600 mt-1.5">Hosts can see this as a starting point for their budget planning.</p>
        </div>

        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-3">
            Set durations you offer
          </label>
          <div className="flex flex-wrap gap-2">
            {SET_DURATION_OPTIONS.map(({ label, value }) => (
              <Chip key={value} label={label} selected={data.setDurations.includes(value)} onClick={() => onDurationToggle(value)} />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-3">
            Event types you're available for
          </label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPE_OPTIONS.map((et) => (
              <Chip key={et} label={et} selected={data.eventTypes.includes(et)} onClick={() => onEventTypeToggle(et)} />
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}

// ─── Done screen ──────────────────────────────────────────────────────────────

function StepDone({ name, onGoToDashboard }: { name: string; onGoToDashboard: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4 gap-8">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 bg-[#CBA6F7]/15 border border-[#CBA6F7]/30 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(203,166,247,0.3)]"
      >
        <CheckCircle2 className="h-10 w-10 text-[#CBA6F7]" />
      </motion.div>

      <div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-black text-white tracking-tight mb-3"
        >
          You're live{name ? `, ${name.split(" ")[0]}` : ""}.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-zinc-400 text-base leading-relaxed max-w-sm"
        >
          Your profile is on Gig Culture India. Event hosts are being matched with artists like you right now.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="flex flex-col gap-3 w-full max-w-sm"
      >
        <motion.button
          onClick={onGoToDashboard}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-[#CBA6F7] hover:bg-[#b58ce6] text-black font-black text-base rounded-2xl shadow-[0_4px_24px_rgba(203,166,247,0.4)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
        >
          Go to Dashboard
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── Shared step shell ────────────────────────────────────────────────────────

function StepShell({ heading, sub, children, error, saving, onContinue, onBack, continueLabel, canContinue }: {
  heading: string;
  sub: string;
  children: React.ReactNode;
  error: string | null;
  saving: boolean;
  onContinue: () => void;
  onBack?: () => void;
  continueLabel: string;
  canContinue: boolean;
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
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-semibold text-sm rounded-2xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <motion.button
          type="button"
          onClick={onContinue}
          disabled={saving || !canContinue}
          whileHover={saving || !canContinue ? {} : { scale: 1.02 }}
          whileTap={saving || !canContinue ? {} : { scale: 0.98 }}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#CBA6F7] hover:bg-[#b58ce6] text-black font-black text-sm rounded-2xl shadow-[0_4px_20px_rgba(203,166,247,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "Saving..." : continueLabel}
          {!saving && <ArrowRight className="h-4 w-4" />}
        </motion.button>
      </div>
    </div>
  );
}
