import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { testSupabaseConnection } from "@/lib/supabaseClient";

// Initialize Supabase on app start (non-blocking)
console.log('🎮 Initializing Grovara Arcade Blast...');

// Test connection only — do NOT create anonymous users here.
// Users are created lazily when the game actually starts (via initSession).
testSupabaseConnection().then(connected => {
  if (connected) {
    console.log('✅ Supabase connection established');
  } else {
    console.log('💾 Running in offline mode (localStorage fallback)');
  }
});

// Render app immediately (don't wait for Supabase)
createRoot(document.getElementById("root")!).render(<App />);

// Remove initial loader after React mounts
setTimeout(() => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.classList.add('loader-hidden');
    setTimeout(() => loader.remove(), 500);
  }
}, 100);
