
// 🔐 بيانات Supabase (من Project Settings → API)
export const SUPABASE_URL = "https://gspubqodpuxdlvwlmhvo.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcHVicW9kcHV4ZGx2d2xtaHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MzgxNDYsImV4cCI6MjA4NzQxNDE0Nn0.iuc_7G14hHurPAZOQ9eR2O8iBmTOqlOM1z23oBZqyI4";

// ===============================
// Dawriya Rest - Configuration
// ===============================// إنشاء العميل
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// للتأكد (اختياري)
console.log("Supabase ready:", supabaseClient);
