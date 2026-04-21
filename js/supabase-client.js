/**
 * supabase-client.js
 * ==================
 * Initialises the Supabase JS client (CDN version loaded via importmap / script tag).
 * The Supabase JS v2 CDN is loaded in each HTML page's <head> via a <script> tag.
 *
 * Usage (from other JS files):
 *   const { data, error } = await supabase.from('members').select('*');
 */

// Supabase JS v2 is loaded via CDN in the HTML pages.
// We create a single shared client instance here.

// Guard: make sure the CDN script has run first
if (typeof window.supabase === 'undefined') {
  // If supabase-js hasn't loaded yet we'll set it up lazily
  console.warn('Supabase CDN not yet loaded – ensure the script tag is before this file.');
}

/**
 * Create the Supabase client using config values.
 * Assigned to window.supabaseClient so all scripts can share one instance.
 */
(function initSupabase() {
  if (!CONFIG || !CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    console.error('Supabase config missing. Check config.js');
    return;
  }

  // supabase.createClient is provided by the CDN bundle
  window.supabaseClient = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY
  );
})();
