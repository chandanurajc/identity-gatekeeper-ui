
import { supabase } from "@/integrations/supabase/client";

export const cleanupAuthState = () => {
  console.log("Cleaning up auth state...");
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log("Removing localStorage key:", key);
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if it exists
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        console.log("Removing sessionStorage key:", key);
        sessionStorage.removeItem(key);
      }
    });
  }
  
  console.log("Auth state cleanup completed");
};

export const forceLogout = async () => {
  console.log("Starting force logout process...");
  
  // Step 1: Clean up local storage first
  cleanupAuthState();
  
  // Step 2: Attempt Supabase signout (ignore errors)
  try {
    console.log("Attempting Supabase signout...");
    await supabase.auth.signOut({ scope: 'global' });
    console.log("Supabase signout successful");
  } catch (error) {
    console.log("Supabase signout failed (continuing anyway):", error);
    // Continue with logout even if Supabase signout fails
  }
  
  // Step 3: Force page reload to ensure clean state
  console.log("Forcing page reload for clean state");
  window.location.href = "/";
};
