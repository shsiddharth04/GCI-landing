import React, { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import App from "./App.tsx";
import Auth from "./pages/Auth.tsx";
import HostDashboard from "./pages/HostDashboard.tsx";
import ArtistDashboard from "./pages/ArtistDashboard.tsx";
import ArtistOnboarding from "./pages/ArtistOnboarding.tsx";
import ArtistProfile from "./pages/ArtistProfile.tsx";
import GenreWheel from "./pages/GenreWheel/index.tsx";
import { supabase } from "./lib/supabase.ts";
import "./index.css";

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "artist") {
          const { data: artistData } = await supabase
            .from("artists")
            .select("onboarding_complete")
            .eq("id", session.user.id)
            .single();
          navigate(artistData?.onboarding_complete ? "/dashboard/artist" : "/onboarding/artist");
        } else {
          navigate("/dashboard/host");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthRedirect>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard/host" element={<HostDashboard />} />
          <Route path="/dashboard/artist" element={<ArtistDashboard />} />
          <Route path="/onboarding/artist" element={<ArtistOnboarding />} />
          <Route path="/artist/:id" element={<ArtistProfile />} />
          <Route path="/genre-wheel" element={<GenreWheel />} />
        </Routes>
      </AuthRedirect>
    </BrowserRouter>
  </StrictMode>
);
