import React from "react";
import { motion } from "motion/react";
import { Music, Radio, ShieldCheck, FileCheck, Landmark } from "lucide-react";

export default function ForArtists() {
  const steps = [
    {
      number: "01",
      title: "Get Discovered",
      description: "Connect your SoundCloud. Our AI analyzes your tracks and pitches you to hosts looking for your exact sound.",
      icon: <Music className="h-6 w-6 text-[#CBA6F7]" />,
      glow: "from-[#CBA6F7]/20 to-transparent",
    },
    {
      number: "02",
      title: "Secure Gigs",
      description: "Stop chasing leads. Get direct booking requests from verified event hosts in your city.",
      icon: <Radio className="h-6 w-6 text-[#CBA6F7]" />,
      glow: "from-purple-500/10 to-transparent",
    },
    {
      number: "03",
      title: "Ironclad Protection",
      description: "Every gig comes with an automated, legally binding contract to guarantee your payment and protect against false bookings.",
      icon: <ShieldCheck className="h-6 w-6 text-[#CBA6F7]" />,
      glow: "from-blue-500/10 to-transparent",
    },
  ];

  return (
    <section id="for-artists" className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-zinc-900 scroll-mt-6">
      <div className="text-center mb-16">
        <h2 className="font-sans font-bold text-3xl sm:text-4xl text-[#CBA6F7] tracking-tight uppercase">
          Built for Independent Artists
        </h2>
        <p className="text-zinc-400 mt-3 text-base max-w-xl mx-auto">
          Take control of your booking workflow with direct host matchmaking and bulletproof performance security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className="depth-card depth-card-hover p-8 rounded-3xl relative group overflow-hidden flex flex-col justify-between"
          >
            {/* Ambient hover glow inside the card */}
            <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${step.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

            <div>
              {/* Step indicator and icon */}
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className="font-sans font-extrabold text-4xl text-zinc-800 group-hover:text-[#CBA6F7]/30 transition-colors duration-300">
                  {step.number}
                </span>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl group-hover:border-[#CBA6F7]/40 transition-colors duration-300">
                  {step.icon}
                </div>
              </div>

              {/* Text */}
              <div className="relative z-10">
                <h3 className="font-sans font-bold text-xl text-white tracking-tight">
                  {step.title}
                </h3>
                <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Micro spacer or bottom decoration */}
            <div className="w-12 h-1 bg-zinc-800 group-hover:bg-[#CBA6F7] transition-all duration-300 mt-8 rounded-full" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
