import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Music, ArrowRight, Eye, EyeOff, AudioLines, Mic2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import SoftAurora from "../components/SoftAurora";

type AuthMode = "signup" | "signin";
type Role = "host" | "artist";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialRole = (searchParams.get("role") as Role) || "host";
  const [mode, setMode] = useState<AuthMode>("signup");
  const [role, setRole] = useState<Role>(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const paramRole = searchParams.get("role") as Role;
    if (paramRole === "host" || paramRole === "artist") setRole(paramRole);
  }, [searchParams]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        navigate(profile?.role === "artist" ? "/dashboard/artist" : "/dashboard/host");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          setSuccess("Account created! Check your email for a confirmation link, then sign in.");
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

          navigate(profile?.role === "artist" ? "/dashboard/artist" : "/dashboard/host");
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isHost = role === "host";

  return (
    <div className="min-h-screen bg-[#070708] text-white flex flex-col relative overflow-hidden antialiased">
      {/* Aurora background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30 mix-blend-screen z-0">
        <SoftAurora
          speed={0.3}
          scale={1.2}
          brightness={0.7}
          color1="#CBA6F7"
          color2="#89b4fa"
          noiseFrequency={2.0}
          noiseAmplitude={0.8}
          bandHeight={0.25}
          bandSpread={1.0}
          octaveDecay={0.15}
          layerOffset={0.2}
          colorSpeed={0.6}
          enableMouseInteraction={false}
          mouseInfluence={0}
        />
      </div>

      <div className="h-1 bg-gradient-to-r from-[#CBA6F7] via-zinc-900 to-[#CBA6F7]/40 w-full relative z-10" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-[#CBA6F7]/10 p-2 rounded-xl border border-[#CBA6F7]/20">
            <Music className="h-5 w-5 text-[#CBA6F7]" />
          </div>
          <span className="font-black text-lg text-white tracking-tight uppercase">
            GIG CULTURE <span className="text-[#CBA6F7]">INDIA</span>
          </span>
        </Link>

        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Sign up"}
        </button>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mode toggle */}
          <div className="flex bg-zinc-900/80 border border-zinc-800 rounded-full p-1 mb-8">
            {(["signup", "signin"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                  mode === m
                    ? "bg-[#CBA6F7] text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {m === "signup" ? "Create Account" : "Sign In"}
              </button>
            ))}
          </div>

          <div className="bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/80 rounded-3xl p-8">
            {/* Role selector (signup only) */}
            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-3">I am joining as</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Host option */}
                    <button
                      type="button"
                      onClick={() => setRole("host")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                        isHost
                          ? "border-[#CBA6F7] bg-[#CBA6F7]/10"
                          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                      }`}
                    >
                      <AudioLines className={`h-6 w-6 ${isHost ? "text-[#CBA6F7]" : "text-zinc-500"}`} />
                      <span className={`text-sm font-bold ${isHost ? "text-[#CBA6F7]" : "text-zinc-400"}`}>
                        Event Host
                      </span>
                      <span className="text-[11px] text-zinc-600 text-center leading-tight">
                        I book artists for events
                      </span>
                    </button>

                    {/* Artist option */}
                    <button
                      type="button"
                      onClick={() => setRole("artist")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                        !isHost
                          ? "border-[#CBA6F7] bg-[#CBA6F7]/10"
                          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                      }`}
                    >
                      <Mic2 className={`h-6 w-6 ${!isHost ? "text-[#CBA6F7]" : "text-zinc-500"}`} />
                      <span className={`text-sm font-bold ${!isHost ? "text-[#CBA6F7]" : "text-zinc-400"}`}>
                        Artist
                      </span>
                      <span className="text-[11px] text-zinc-600 text-center leading-tight">
                        I perform at events
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Heading */}
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">
              {mode === "signup"
                ? `Join as ${isHost ? "an Event Host" : "an Artist"}`
                : "Welcome back"}
            </h1>
            <p className="text-sm text-zinc-500 mb-6">
              {mode === "signup"
                ? isHost
                  ? "Connect Spotify and start booking curated artists."
                  : "Link SoundCloud and get discovered by event hosts."
                : "Sign in to your Gig Culture India account."}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "signup" && (
                <div>
                  <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#CBA6F7] focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 transition-colors pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error / Success messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="mt-2 w-full px-6 py-3.5 bg-[#CBA6F7] hover:bg-[#b58ce6] text-black font-bold text-sm rounded-full shadow-[0_4px_20px_rgba(203,166,247,0.3)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span>Please wait...</span>
                ) : (
                  <>
                    <span>{mode === "signup" ? "Create Account" : "Sign In"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          <p className="text-center text-xs text-zinc-600 mt-6">
            By continuing, you agree to our{" "}
            <a href="#" className="text-zinc-400 hover:text-white transition-colors">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</a>.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
