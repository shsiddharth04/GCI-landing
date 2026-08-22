import React, { useEffect } from 'react';
import Wheel from './Wheel';
import { copy } from './wheelConfig';

export default function GenreWheel() {
  useEffect(() => {
    // Prevent search indexing — this page is stall-only, reachable by direct URL
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    const prevTitle = document.title;
    document.title = 'Spin the Wheel — GCI';

    return () => {
      document.head.removeChild(meta);
      document.title = prevTitle;
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
      style={{ backgroundColor: '#0a0a0a', minHeight: '100dvh' }}
    >
      {/* GCI monogram */}
      <div
        className="mb-10 tracking-[0.4em] uppercase select-none"
        style={{
          color: 'rgba(232,222,250,0.25)',
          fontSize: '11px',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        GCI
      </div>

      {/* Heading */}
      <div className="text-center mb-10">
        <h1
          className="font-black tracking-tight mb-2"
          style={{
            color: '#E8DEFA',
            fontSize: 'clamp(2rem, 8vw, 3rem)',
            fontFamily: "'Space Grotesk', sans-serif",
            lineHeight: 1.1,
          }}
        >
          {copy.heading}
        </h1>
        <p
          className="text-sm"
          style={{
            color: '#b6a9d6',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {copy.subheading}
        </p>
      </div>

      {/* Wheel — self-contained, delete GenreWheel/ folder to remove entirely */}
      <div className="w-full" style={{ maxWidth: '400px' }}>
        <Wheel />
      </div>
    </div>
  );
}
