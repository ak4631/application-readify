declare module '@env' {
  // Public/anon-safe values only. Never add SUPABASE_SECRET_KEY, DATABASE_URL,
  // or DIRECT_URL here — those must stay out of the app bundle.
  export const SUPABASE_URL: string;
  export const SUPABASE_PUBLISHABLE_KEY: string;
  export const LOCATIONIQ_PUBLIC_KEY: string;
}
