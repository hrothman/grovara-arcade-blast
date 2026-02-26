import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { testSupabaseConnection } from "@/lib/supabaseClient";
import { getOrCreateUser } from "@/services";

// Initialize Supabase and user on app start (non-blocking)
console.log('🎮 Initializing Grovara Arcade Blast...');

// Start initialization in background without blocking render
testSupabaseConnection().then(connected => {
  if (connected) {
    console.log('✅ Supabase connection established');
    // Initialize anonymous user
    getOrCreateUser().then(user => {
      if (user) {
        console.log('👤 User initialized:', user.id);
        console.log('   Anonymous:', user.is_anonymous);
        console.log('   Device ID:', user.device_id);
      }
    });
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
