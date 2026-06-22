import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);
export const supabase = isConfigured ? createClient(url, key) : null;

/* Mappe le "nom d'utilisateur" affiché vers un email Supabase.
   Le compte admin principal est créé dans Supabase avec cet email. */
const ACCOUNTS = {
  "Black Meridian V7": "admin@blackmeridian.app",
};
export const resolveEmail = (username) => {
  const u = (username || "").trim();
  return ACCOUNTS[u] || u; // si ce n'est pas un compte connu, on traite la saisie comme un email
};
