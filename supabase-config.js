// Supabase Configuration
// Dapatkan URL dan Anon/Publishable Key dari: Supabase Dashboard > Project Settings > API

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // contoh: https://xxxxxxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // anon/public key (selamat untuk browser)

// Initialize Supabase Client
// 'supabase' global object datang dari CDN script tag dalam HTML
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
