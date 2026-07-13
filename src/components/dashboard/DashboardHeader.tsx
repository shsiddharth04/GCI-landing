import { Music, LogOut, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

interface DashboardHeaderProps {
  hostName: string | null;
  hasSpotify: boolean;
}

export default function DashboardHeader({ hostName, hasSpotify }: DashboardHeaderProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="w-full border-b border-zinc-900 bg-[#070708]/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#CBA6F7]/10 p-2 rounded-xl border border-[#CBA6F7]/20">
            <Music className="h-5 w-5 text-[#CBA6F7]" />
          </div>
          <div>
            <span className="font-black text-base text-white tracking-tight uppercase">
              GIG CULTURE <span className="text-[#CBA6F7]">INDIA</span>
            </span>
            <p className="text-[11px] text-zinc-500 font-medium -mt-0.5">Host Marketplace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!hasSpotify && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#CBA6F7]/8 border border-[#CBA6F7]/20 rounded-full">
              <Sparkles className="h-3 w-3 text-[#CBA6F7]" />
              <span className="text-[11px] text-[#CBA6F7] font-semibold">Connect Spotify to unlock match scores</span>
            </div>
          )}
          {hostName && (
            <span className="hidden sm:block text-sm text-zinc-400 font-medium">
              {hostName}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-full transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
