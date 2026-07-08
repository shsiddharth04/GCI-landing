import React from "react";
import { ShieldCheck, FileText, Lock } from "lucide-react";

export default function TrustBanner() {
  const badges = [
    {
      icon: <ShieldCheck className="h-5 w-5 text-[#CBA6F7]" />,
      text: "Verified Hosts & Artists",
    },
    {
      icon: <FileText className="h-5 w-5 text-[#CBA6F7]" />,
      text: "Automated Legal Contracts",
    },
    {
      icon: <Lock className="h-5 w-5 text-[#CBA6F7]" />,
      text: "100% False-Booking Protection",
    },
  ];

  return (
    <div className="w-full bg-zinc-900/80 border-y border-zinc-800/80 py-4 px-6 relative overflow-hidden backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-around items-center gap-4 text-sm font-medium tracking-wide text-zinc-300">
        {badges.map((badge, idx) => (
          <div key={idx} className="flex items-center gap-3 group">
            <div className="p-1.5 bg-[#CBA6F7]/10 rounded-lg border border-[#CBA6F7]/20 group-hover:border-[#CBA6F7]/40 transition-colors">
              {badge.icon}
            </div>
            <span className="font-sans text-zinc-300 group-hover:text-white transition-colors">
              {badge.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
