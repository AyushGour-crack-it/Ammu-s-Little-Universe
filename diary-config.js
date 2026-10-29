// Supabase's project URL and publishable key are safe to use in the browser
// when the row-level security policies in backend/diary-schema.sql are applied.
// Never put a Supabase secret/service-role key in this file.
window.DIARY_CONFIG = {
  supabaseUrl: '',
  publishableKey: '',
  // Set this to the deployed uploader site's URL, for example https://our-uploader.vercel.app/
  uploaderUrl: '',
};
