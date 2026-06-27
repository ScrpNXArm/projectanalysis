// Supabase Configuration
// Dapatkan URL dan Anon/Publishable Key dari: Supabase Dashboard > Project Settings > API

const SUPABASE_URL = 'https://jnwtvnngphtokidecji.supabase.co'; // contoh: https://xxxxxxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_5NlEaxyMVdQ8_z5P5rL8Tw_iM2ZS2Hc'; // anon/public key (selamat untuk browser)

// Initialize Supabase Client
// 'supabase' global object datang dari CDN script tag dalam HTML
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
