// ============================================================
// Supabase Client — Portal Inginerie Creativă
// All functions are exposed on window for global access
// ============================================================

var _supabaseClient = null;

window.initSupabase = function() {
  if (APP_CONFIG.demoMode) {
    console.info('[Portal IC] Mod demo activ — Supabase nu este configurat');
    return null;
  }
  try {
    _supabaseClient = window.supabase.createClient(
      APP_CONFIG.supabase.url,
      APP_CONFIG.supabase.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        realtime: { params: { eventsPerSecond: 10 } },
      }
    );
    console.info('[Portal IC] Supabase conectat');
    return _supabaseClient;
  } catch (err) {
    console.error('[Portal IC] Eroare Supabase:', err);
    return null;
  }
};

window.getSupabase = function() {
  return _supabaseClient;
};

// Helper: execută query Supabase sau returnează date demo
window.dbQuery = async function(tableName, queryFn, demoFallback) {
  if (APP_CONFIG.demoMode || !_supabaseClient) {
    return { data: demoFallback, error: null };
  }
  try {
    const result = await queryFn(_supabaseClient.from(tableName));
    return result;
  } catch (err) {
    console.error('[DB] Eroare la ' + tableName + ':', err);
    return { data: demoFallback, error: err };
  }
};
